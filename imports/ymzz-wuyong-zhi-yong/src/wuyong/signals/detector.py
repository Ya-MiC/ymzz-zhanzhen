"""雙通道即時判別：用戶文字 × 模型思考。

輸入事件：{conversation_id, turn_id, ts, user_text, thinking}（thinking 可為空）
輸出：intent_score、triggers、thinking_available、intent_detected。

合併公式（記錄於 docs/DECISIONS.md）：
  - 單通道：score × 該通道權重（上限 1.0）
  - 雙通道：加權平均 + 一致性加成 0.05 × min(u, t)（兩通道同時命中代表訊號更強），上限 1.0
規則層為預設；LLM 判官可透過 adapter 注入（預設關閉，見 router.py 的 judge hook），且不得成為必需。
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Callable, Optional

from . import rules_en, rules_zh

_COMPILED: dict[str, list[dict]] = {}


def _compile(rules: list[dict]) -> list[dict]:
    out = []
    for r in rules:
        out.append({
            "id": r["id"],
            "pattern": re.compile(r["pattern"], re.IGNORECASE),
            "score": float(r["score"]),
            "hint": r["hint"],
        })
    return out


def _rules_for(channel: str):
    key = f"{channel}_user" if channel == "user" else f"{channel}_thinking"
    if key not in _COMPILED:
        rules = []
        for mod in (rules_zh, rules_en):
            rules.extend(mod.USER_RULES if channel == "user" else mod.THINKING_RULES)
        _COMPILED[key] = _compile(rules)
    return _COMPILED[key]


@dataclass
class Trigger:
    channel: str          # user_text | thinking
    rule: str
    evidence: str         # 命中的關鍵詞片段（≤40 字元；不含完整原文）
    score: float
    hint: str = ""

    def as_dict(self) -> dict:
        return {"channel": self.channel, "rule": self.rule,
                "evidence": self.evidence, "score": self.score, "hint": self.hint}


@dataclass
class DetectResult:
    intent_score: float = 0.0
    triggers: list[Trigger] = field(default_factory=list)
    thinking_available: bool = False
    intent_detected: bool = False
    user_score: float = 0.0
    thinking_score: float = 0.0


def scan_channel(text: str, channel: str) -> tuple[float, list[Trigger]]:
    """掃單一通道。回傳（最高規則分數，觸發清單）。"""
    if not text or not text.strip():
        return 0.0, []
    triggers: list[Trigger] = []
    best = 0.0
    for r in _rules_for(channel):
        m = r["pattern"].search(text)
        if m:
            evidence = m.group(0)[:40]
            triggers.append(Trigger(channel=f"{channel}_text" if channel == "user" else channel,
                                    rule=r["id"], evidence=evidence,
                                    score=r["score"], hint=r["hint"]))
            best = max(best, r["score"])
    return best, triggers


def judge_hook() -> Optional[Callable[[str, Optional[str]], float]]:
    """LLM 判官 adapter 掛載點。預設關閉（回傳 None）＝規則層獨立運作，LLM 判官不是必需。
    宿主可注入 callable(user_text, thinking) -> 0~1 額外分數；注入與否都不影響基本可用性。
    """
    return None


def detect(user_text: Optional[str], thinking: Optional[str],
           user_weight: float = 1.0, thinking_weight: float = 1.2,
           threshold: float = 0.30) -> DetectResult:
    res = DetectResult(thinking_available=bool(thinking and thinking.strip()))
    u_score, u_trig = scan_channel(user_text or "", "user")
    t_score, t_trig = scan_channel(thinking or "", "thinking")
    res.user_score = u_score
    res.thinking_score = t_score
    res.triggers = u_trig + t_trig

    if u_score > 0 and t_score > 0:
        base = (u_score * user_weight + t_score * thinking_weight) / (user_weight + thinking_weight)
        res.intent_score = min(1.0, base + 0.05 * min(u_score, t_score))
    elif u_score > 0:
        res.intent_score = min(1.0, u_score * user_weight)
    elif t_score > 0:
        res.intent_score = min(1.0, t_score * thinking_weight)
    else:
        res.intent_score = 0.0

    # LLM 判官（可選）：若注入，取 max(規則分, 判官分)，絕不下降規則層結果。
    hook = judge_hook()
    if hook is not None:
        try:
            extra = float(hook(user_text or "", thinking))
            if 0.0 <= extra <= 1.0:
                res.intent_score = max(res.intent_score, extra)
        except Exception:
            pass  # 判官失效不得拖垮規則層

    res.intent_detected = res.intent_score >= threshold
    return res


def normalize_event(raw: dict) -> dict:
    """補齊事件欄位；不拋例——缺 user_text/thinking 就是空字串。"""
    return {
        "conversation_id": str(raw.get("conversation_id") or "unknown"),
        "turn_id": str(raw.get("turn_id") or "0"),
        "ts": str(raw.get("ts") or ""),
        "user_text": str(raw.get("user_text") or ""),
        "thinking": str(raw.get("thinking") or "") or None,
    }
