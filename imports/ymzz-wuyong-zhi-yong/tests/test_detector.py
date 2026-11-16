"""雙通道即時判別測試（零聯網）。"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from wuyong.signals.detector import detect, scan_channel, normalize_event


def _case(user, thinking, label):
    res = detect(user, thinking)
    print(f"[{label}] score={res.intent_score} detected={res.intent_detected} "
          f"thinking_avail={res.thinking_available} triggers={[t.as_dict() for t in res.triggers]}")
    return res


def test_zh_user_only():
    res = _case("幫我寫一個 react 技能，怎麼做？", None, "zh user only")
    assert res.intent_detected is True
    assert res.thinking_available is False
    assert any(t.channel == "user_text" for t in res.triggers)


def test_en_user_only():
    res = _case("How do I set up a CI skill?", None, "en user only")
    assert res.intent_detected is True
    assert res.thinking_available is False


def test_thinking_only():
    res = _case(None, "maybe there's an existing skill for this", "thinking only")
    assert res.intent_detected is True
    assert res.thinking_available is True


def test_both_channels():
    res = _case("有沒有現成的 skill", "let me look for a tool", "both channels")
    assert res.intent_detected is True
    assert res.thinking_available is True
    # 雙通道一致性應提升分數：加權平均 + 一致性加成
    assert res.intent_score > 0.5


def test_neither_channel():
    res = _case("你好，今天天氣如何", None, "neither channel")
    assert res.intent_detected is False
    assert res.intent_score == 0.0


def test_thinking_missing_flag():
    res = _case("幫我做 X", None, "thinking missing")
    assert res.thinking_available is False


def test_threshold_boundary():
    # 低分不觸發
    res = detect("ok", None, threshold=0.99)
    assert res.intent_detected is False


def test_normalize_event():
    evt = normalize_event({"conversation_id": "c1", "turn_id": "3"})
    assert evt["conversation_id"] == "c1"
    assert evt["turn_id"] == "3"
    assert evt["user_text"] == ""
    assert evt["thinking"] is None


if __name__ == "__main__":
    test_zh_user_only()
    test_en_user_only()
    test_thinking_only()
    test_both_channels()
    test_neither_channel()
    test_thinking_missing_flag()
    test_threshold_boundary()
    test_normalize_event()
    print("ALL detector tests passed")
