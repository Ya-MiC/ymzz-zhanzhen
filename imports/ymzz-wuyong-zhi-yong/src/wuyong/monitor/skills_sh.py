"""skills.sh 資料取得：官方 API → 排行榜頁 → 快照，三級降級。

已驗證的事實（2026-11-14，官方文檔 https://www.skills.sh/docs/api）：
  - GET /api/v1/skills?view=all-time&per_page=500&page=N
    回 {data:[{id,slug,name,source,installs,sourceType,installUrl,url,isDuplicate?}], pagination:{page,perPage,total,hasMore}}
  - 需要 Vercel OIDC token：環境變數 VERCEL_OIDC_TOKEN（或 x-vercel-oidc-token header）
  - 無 token／401 → 直接降級到 HTML，不報錯退出
  - 快取 30-60 秒；輪詢要尊重
"""

from __future__ import annotations

import json
import time
import urllib.error
import urllib.request
from pathlib import Path

from .parse_html import ParseError, parse_leaderboard

USER_AGENT = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
              "(KHTML, like Gecko) Chrome/126.0 Safari/537.36 wuyong/0.1")


class ApiError(RuntimeError):
    def __init__(self, status: int, message: str):
        super().__init__(f"skills.sh API HTTP {status}: {message}")
        self.status = status


def _http_get(url: str, token: str | None, timeout: int) -> bytes:
    headers = {"User-Agent": USER_AGENT, "Accept": "application/json, text/html"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
        headers["x-vercel-oidc-token"] = token
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def fetch_api_page(cfg, token: str, page: int) -> dict:
    url = (f"{cfg.sources.api_base}/api/v1/skills?view=all-time"
           f"&per_page={cfg.sources.per_page}&page={page}")
    raw = _http_get(url, token, cfg.sources.timeout_seconds)
    return json.loads(raw.decode("utf-8"))


def fetch_leaderboard_api(cfg, token: str | None) -> tuple[list[dict], dict]:
    """分頁抓全榜。無 token → TokenMissing；401 → ApiError；呼叫端負責降級。"""
    token = token or _env_token()
    if not token:
        raise RuntimeError("TokenMissing: VERCEL_OIDC_TOKEN 未設定")
    entries: list[dict] = []
    duplicates_dropped = 0
    page = 0
    while page < cfg.sources.max_pages:
        payload = fetch_api_page(cfg, token, page)
        data = payload.get("data") or []
        pagination = payload.get("pagination") or {}
        for item in data:
            if item.get("isDuplicate") is True:
                duplicates_dropped += 1
                continue
            entries.append({
                "id": item.get("id"),
                "slug": item.get("slug"),
                "name": item.get("name") or item.get("slug"),
                "source": item.get("source"),
                "installs": int(item.get("installs") or 0),
                "sourceType": item.get("sourceType", "github"),
                "installUrl": item.get("installUrl"),
                "url": item.get("url"),
            })
        # 全頁都低於門檻 → 後續頁必然更低（all-time 為降序排行榜），提前停止
        if data and all(int(it.get("installs") or 0) <= cfg.monitor.min_installs for it in data):
            break
        if not pagination.get("hasMore"):
            break
        page += 1
        time.sleep(0.2)  # 尊重 30-60s 快取與限流
    meta = {"source": "api", "stale": False, "pages": page + 1,
            "duplicates_dropped": duplicates_dropped}
    return entries, meta


def fetch_leaderboard_html(cfg) -> tuple[list[dict], dict]:
    url = cfg.sources.leaderboard_url
    raw = _http_get(url, None, cfg.sources.timeout_seconds)
    html = raw.decode("utf-8", errors="replace")
    entries = parse_leaderboard(html)  # ParseError 會往上拋（明確失敗）
    meta = {"source": "html", "stale": False, "duplicates_dropped": None}
    return entries, meta


def fetch_audit(skill_id: str, cfg, token: str | None) -> tuple[list[dict] | None, str | None]:
    """GET /api/v1/skills/audit/{id}。回（audits, error）。
    404＝尚無審計（回 None, None → 由 security 標 unaudited）；其他錯誤回（None, reason）。"""
    token = token or _env_token()
    if not token:
        return None, "no_token"
    url = f"{cfg.sources.api_base}/api/v1/skills/audit/{skill_id}"
    try:
        raw = _http_get(url, token, cfg.sources.timeout_seconds)
        payload = json.loads(raw.decode("utf-8"))
        return payload.get("audits") or [], None
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            return None, None
        return None, f"http_{exc.code}"
    except (urllib.error.URLError, TimeoutError, OSError, json.JSONDecodeError) as exc:
        return None, str(exc)[:120]


def fetch_detail_hash(skill_id: str, cfg, token: str | None) -> str | None:
    """GET /api/v1/skills/{id} → hash（偵測 hash_changed 用）。無 token 回 None。"""
    token = token or _env_token()
    if not token:
        return None
    url = f"{cfg.sources.api_base}/api/v1/skills/{skill_id}"
    try:
        raw = _http_get(url, token, cfg.sources.timeout_seconds)
        payload = json.loads(raw.decode("utf-8"))
        return payload.get("hash")
    except Exception:
        return None


def _env_token() -> str | None:
    import os
    tok = os.environ.get("VERCEL_OIDC_TOKEN", "").strip()
    return tok or None


def load_snapshot(cfg) -> dict | None:
    p = Path(cfg.snapshot_path)
    if not p.is_file():
        return None
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None


def save_snapshot(cfg, entries: list[dict], meta: dict) -> None:
    cfg.snapshot_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {"fetched_at": time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime()) + "Z",
               "meta": meta, "entries": entries}
    cfg.snapshot_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2),
                                 encoding="utf-8")


def collect(cfg, token: str | None = None, fixture_html: str | None = None) -> tuple[list[dict], dict]:
    """三級降級收集。永不拋出——meta 裡如實記錄走了哪條路與錯誤原因。"""
    if fixture_html is not None:
        entries = parse_leaderboard(fixture_html)
        return entries, {"source": "fixture", "stale": False, "error": None}

    # 1) 官方 API
    try:
        entries, meta = fetch_leaderboard_api(cfg, token)
        if entries:
            return entries, meta
    except Exception as exc:
        api_error = str(exc)[:160]
    else:
        api_error = "api 回傳空列表"

    # 2) 排行榜頁面
    try:
        entries, meta = fetch_leaderboard_html(cfg)
        meta["api_degraded_reason"] = api_error
        return entries, meta
    except ParseError as exc:
        html_error = f"ParseError: {exc}"
    except Exception as exc:
        html_error = str(exc)[:160]

    # 3) 最近快照（標記 stale）
    snap = load_snapshot(cfg)
    if snap and snap.get("entries"):
        meta = {"source": "snapshot", "stale": True,
                "api_degraded_reason": api_error,
                "html_degraded_reason": html_error,
                "snapshot_fetched_at": snap.get("fetched_at")}
        return snap["entries"], meta

    # 4) 全部失敗：如實回報空池
    meta = {"source": "none", "stale": True,
            "api_degraded_reason": api_error, "html_degraded_reason": html_error}
    return [], meta
