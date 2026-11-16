"""安全閘：審計摘要、入池閘門、第三方 SKILL.md 靜態掃描、抽象關鍵詞提取、雜湊。"""

from __future__ import annotations

import hashlib
import re
import unicodedata
from pathlib import Path

# 審計狀態：pass | warn | fail | unaudited
def summarize_audits(audits: list[dict] | None) -> str:
    """把多方審計列表壓成單一狀態：任一 fail → fail；任一 warn → warn；
    全 pass → pass；空／None → unaudited。"""
    if not audits:
        return "unaudited"
    statuses = [str(a.get("status", "")).lower() for a in audits]
    if "fail" in statuses:
        return "fail"
    if "warn" in statuses:
        return "warn"
    if all(s == "pass" for s in statuses) and statuses:
        return "pass"
    return "unaudited"


def gate(audit_status: str) -> tuple[bool, str]:
    """入池閘門。回（是否允許入池, 池內狀態標籤）。
    fail → 拒絕；warn → 入池但 status=review；pass/unaudited → active。"""
    if audit_status == "fail":
        return False, "rejected"
    if audit_status == "warn":
        return True, "review"
    return True, "active"


# 第三方 SKILL.md 內容一律視為不可信資料。靜態掃描常見注入／危險模式，僅供警示：
_INJECTION_PATTERNS = [
    r"ignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions",
    r"disregard\s+(?:all\s+)?(?:previous|prior|system)\s+(?:instructions|prompts?)",
    r"(?:系統提示|system prompt)(?: override| 覆蓋| 覆寫)|覆蓋.{0,8}(?:系統提示|system prompt)",
    r"exfiltrat|外洩|外傳.{0,8}(?:token|金鑰|密鑰|api)",
    r"curl[^|]{0,80}\|\s*(?:ba)?sh|wget[^|]{0,80}\|\s*(?:ba)?sh",
    r"iwr .*\|\s*iex|invoke-expression",
    r"(?:read|cat|type)\s+(?:~|\/home|C:\\Users)[^\s]*(?:\.ssh|\.aws|credentials)",
    r"base64\s+-d|--decode",
]


def scan_skill_text(text: str) -> list[str]:
    """回傳命中的危險模式 id 列表（空＝未掃到）。只警示，不自動執行任何東西。"""
    findings: list[str] = []
    t = unicodedata.normalize("NFKC", text or "")
    for i, pat in enumerate(_INJECTION_PATTERNS):
        try:
            if re.search(pat, t, re.IGNORECASE):
                findings.append(f"pattern_{i}")
        except re.error:
            continue
    return findings


_STOPWORDS_EN = {
    "the", "a", "an", "to", "for", "of", "on", "in", "with", "and", "or", "is",
    "are", "do", "does", "did", "how", "what", "which", "i", "me", "my", "we",
    "you", "your", "it", "this", "that", "there", "can", "could", "should",
    "would", "please", "help", "need", "want", "use", "using", "get", "make",
    "have", "has", "any", "some", "about", "into", "from", "at", "by", "be",
    "will", "just", "like", "so", "if", "when", "then", "than", "as",
}
_STOPWORDS_ZH = {"怎麼", "怎么做", "如何", "什麼", "什么", "有沒有", "有没有",
                 "幫我", "帮我", "可以", "能不能", "請", "请", "一下", "一個",
                 "一个", "我要", "我想", "需要", "的", "嗎", "吗", "呢", "了"}


def abstract_query(text: str, max_words: int = 8) -> str:
    """從原文提取抽象關鍵詞（≤ max_words 個詞），線上搜索只送這個，絕不送原文。"""
    t = unicodedata.normalize("NFKC", text or "").lower()
    words = re.findall(r"[a-z0-9#+.\-]{2,}|[\u4e00-\u9fff]{2,4}", t)
    out: list[str] = []
    for w in words:
        if w in _STOPWORDS_EN or w in _STOPWORDS_ZH:
            continue
        if w not in out:
            out.append(w)
        if len(out) >= max_words:
            break
    return " ".join(out)


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def hash_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()
