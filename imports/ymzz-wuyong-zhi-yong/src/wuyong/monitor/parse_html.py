"""skills.sh 排行榜 HTML 解析（stdlib html.parser，零第三方依賴）。

實際頁面結構（2026-11-14 實測 https://www.skills.sh/，伺服器端渲染，資料直接在 HTML 中）：
  <div class="h-[72px] lg:h-[56px]"><a href="/{owner}/{repo}/{slug}" ...>
      ... <h3>skill 名</h3> ... <p ...>owner/repo</p> ...
      ... <span class="font-mono text-sm text-foreground">4.4M</span>   ← 安裝量縮寫
  </a></div>

安裝量顯示格式：`4.4M`、`24K`、`1,234`、`8420`。
頁面改版（解析不到任何列）時必須明確報錯，不得悄悄回傳空池。
"""

from __future__ import annotations

import re
from html.parser import HTMLParser

_HREF_RE = re.compile(r"^/([^/]+)/([^/]+)/([^/?#]+)/?$")
_NUM_RE = re.compile(r"^([\d,]+(?:\.\d+)?)\s*([KMkm])?$")


class ParseError(RuntimeError):
    """頁面結構無法解析（改版或非預期內容）。"""


def parse_installs(text: str) -> int:
    """`4.4M` → 4_400_000；`24K` → 24_000；`1,234` → 1_234；`8420` → 8_420。"""
    s = (text or "").strip().replace("\u00a0", " ")
    m = _NUM_RE.match(s)
    if not m:
        raise ValueError(f"無法解析安裝量字串：{s!r}")
    number = float(m.group(1).replace(",", ""))
    suffix = (m.group(2) or "").upper()
    if suffix == "K":
        number *= 1_000
    elif suffix == "M":
        number *= 1_000_000
    return int(round(number))


class _Row:
    __slots__ = ("href", "owner", "repo", "slug", "name", "source_display", "spans")

    def __init__(self, href: str, owner: str, repo: str, slug: str):
        self.href, self.owner, self.repo, self.slug = href, owner, repo, slug
        self.name = ""
        self.source_display = ""
        self.spans: list[str] = []


class _LeaderboardParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.rows: list[_Row] = []
        self._current: _Row | None = None
        self._capture: str | None = None  # "h3" | "p" | "span"
        self._buf: list[str] = []
        self._p_seen = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "a" and self._current is None:
            href = a.get("href") or ""
            m = _HREF_RE.match(href)
            if m:
                self._current = _Row(href, m.group(1), m.group(2), m.group(3))
                self._p_seen = 0
            return
        if self._current is None:
            return
        if tag == "h3":
            self._capture, self._buf = "h3", []
        elif tag == "p":
            self._p_seen += 1
            if self._p_seen == 1:
                self._capture, self._buf = "p", []
        elif tag == "span":
            cls = a.get("class") or ""
            if "font-mono" in cls:
                self._capture, self._buf = "span", []

    def handle_data(self, data):
        if self._current is not None and self._capture:
            self._buf.append(data)

    def handle_endtag(self, tag):
        if self._current is None:
            return
        text = "".join(self._buf).strip()
        if tag == "h3" and self._capture == "h3":
            if not self._current.name:
                self._current.name = text
            self._capture = None
        elif tag == "p" and self._capture == "p":
            if not self._current.source_display:
                self._current.source_display = text
            self._capture = None
        elif tag == "span" and self._capture == "span":
            if text:
                self._current.spans.append(text)
            self._capture = None
        elif tag == "a":
            row = self._current
            self._current = None
            self._capture = None
            if row.name:
                self.rows.append(row)


def parse_leaderboard(html: str) -> list[dict]:
    """解析排行榜頁。解析不到任何列 → ParseError（明確失敗，不回空池）。"""
    parser = _LeaderboardParser()
    try:
        parser.feed(html)
        parser.close()
    except Exception as exc:  # 防禦：malformed html
        raise ParseError(f"HTML 解析器例外：{exc}") from exc

    if not parser.rows:
        raise ParseError(
            "skills.sh 排行榜頁解析不到任何 skill 列——頁面結構可能已改版。"
            "請更新 src/wuyong/monitor/parse_html.py 與 tests/fixtures/leaderboard.html。"
        )

    entries: list[dict] = []
    for row in parser.rows:
        installs = None
        for span_text in reversed(row.spans):
            try:
                installs = parse_installs(span_text)
                break
            except ValueError:
                continue
        if installs is None:
            continue  # 該列沒有可解析的安裝量（如廣告位），跳過
        source = f"{row.owner}/{row.repo}"
        entries.append({
            "id": f"{source}/{row.slug}",
            "slug": row.slug,
            "name": row.name,
            "source": source,
            "installs": installs,
            "sourceType": "github",
            "url": f"https://www.skills.sh{row.href}",
        })
    if not entries:
        raise ParseError("排行榜列存在，但沒有任何一列能解析出安裝量——頁面結構可能已改版。")
    return entries
