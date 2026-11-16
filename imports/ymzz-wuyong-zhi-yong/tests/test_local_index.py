"""本地索引跨對話命中測試（零聯網）。"""

import sys, json, tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from wuyong.registry.local_index import LocalIndex, sha256_file
from wuyong.registry.harvest import parse_frontmatter


def _write_skill(base: Path, name: str, desc: str, tags, conv: str):
    d = base / name
    d.mkdir(parents=True, exist_ok=True)
    (d / "SKILL.md").write_text(
        f"---\nname: {name}\ndescription: {desc}\ntags: {tags}\n---\n\n# {name}\n\n內容。",
        encoding="utf-8")
    return d


def test_cross_conversation_provenance():
    with tempfile.TemporaryDirectory() as tmp:
        idx_path = Path(tmp) / "index.json"
        root = Path(tmp) / "skills"
        idx = LocalIndex(idx_path, roots_provider=lambda: [root])

        # 對話 A 製作 skill
        d_a = _write_skill(root, "my-skill", "建立 CI 流程", ["ci", "deploy"], "conv-A")
        e = idx.register(d_a, conversation_id="conv-A", origin="local-made")
        idx.save()
        assert e is not None
        assert e["origin_conversation_id"] == "conv-A"
        assert e["path"] == str(d_a)
        assert "created_at" in e

        # 對話 B 命中同一個 skill（跨對話）
        hits = idx.search("建立 CI 流程", min_score=0.3, top_k=3)
        assert len(hits) >= 1
        assert hits[0][0]["id"] == "local/my-skill"
        assert hits[0][0]["origin_conversation_id"] == "conv-A"
        print("cross-conversation hit:", hits[0][0]["id"], hits[0][0]["origin_conversation_id"])


def test_chinese_matching():
    with tempfile.TemporaryDirectory() as tmp:
        idx_path = Path(tmp) / "index.json"
        root = Path(tmp) / "skills"
        idx = LocalIndex(idx_path, roots_provider=lambda: [root])
        d = _write_skill(root, "中文技能", "幫助用戶寫作與摘要", ["寫作"], "conv-x")
        idx.register(d, conversation_id="conv-x", origin="local-made")
        idx.save()
        hits = idx.search("幫助寫作", min_score=0.3, top_k=3)
        assert len(hits) >= 1, f"應該能中文匹配，得到：{hits}"
        print("chinese hits:", [(e["id"], round(s, 3)) for e, s in hits])


def test_sha256_deterministic():
    with tempfile.NamedTemporaryFile(delete=False) as f:
        f.write(b"hello")
        p = Path(f.name)
    h1 = sha256_file(p)
    h2 = sha256_file(p)
    assert h1 == h2
    assert len(h1) == 64
    p.unlink()


if __name__ == "__main__":
    test_cross_conversation_provenance()
    test_chinese_matching()
    test_sha256_deterministic()
    print("ALL local_index tests passed")
