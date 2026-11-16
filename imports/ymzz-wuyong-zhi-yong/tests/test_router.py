"""路由順序測試：local → pool → online → none（零聯網）。"""

import sys, tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from wuyong.config import Config
from wuyong.registry.local_index import LocalIndex
from wuyong.pool import Pool
from wuyong.router import route_event


def _setup(tmp: Path):
    cfg = Config(root=tmp)
    cfg.signals.intent_threshold = 0.30
    index = LocalIndex(cfg.index_path, roots_provider=lambda: [cfg.skills_local_made_dir])
    pool = Pool(cfg)
    return cfg, index, pool


def test_route_none_when_no_intent(tmp_path):
    cfg, index, pool = _setup(tmp_path)
    dec = route_event({"user_text": "你好", "thinking": None}, cfg, pool=pool, index=index,
                      npx_available=False, dry_run=True)
    assert dec["route"] == "none"
    assert dec["intent_detected"] is False
    print("route none OK:", dec["brief"][:60])


def test_route_local_hit(tmp_path):
    cfg, index, pool = _setup(tmp_path)
    skill_dir = cfg.skills_local_made_dir / "my-ci-skill"
    skill_dir.mkdir(parents=True, exist_ok=True)
    (skill_dir / "SKILL.md").write_text(
        "---\nname: my-ci-skill\ndescription: 建立 CI 流程\ntags: [ci]\n---\n\n# my-ci-skill\n",
        encoding="utf-8")
    index.register(skill_dir, conversation_id="conv-A", origin="local-made")
    index.save()

    dec = route_event({"user_text": "幫我建立 CI 流程技能", "thinking": None, "conversation_id": "conv-B"},
                      cfg, pool=pool, index=index, npx_available=False, dry_run=True)
    assert dec["route"] == "local", f"route={dec['route']} brief={dec['brief'][:80]}"
    assert len(dec["candidates"]) >= 1
    assert dec["candidates"][0]["id"] == "local/my-ci-skill"
    assert dec["candidates"][0]["provenance"]["origin_conversation_id"] == "conv-A"
    print("route local OK:", dec["brief"].splitlines()[0])


def test_route_pool_pending_install(tmp_path):
    cfg, index, pool = _setup(tmp_path)
    # 直接把一筆寫進池（跳過安全閘，只測路由邏輯）
    pool.entries["o/r/some-skill"] = {
        "id": "o/r/some-skill", "source": "o/r", "name": "some-skill",
        "installs": 2_000_000, "status": "active", "installed": False,
        "install_mode": "lazy", "audit": {"status": "pass"},
    }
    pool.save()

    dec = route_event({"user_text": "some skill", "thinking": None},
                      cfg, pool=pool, index=index, npx_available=True, dry_run=True)
    assert dec["route"] == "pool"
    assert dec["candidates"][0]["installed"] is False
    assert any("plan_install" in a or "pending_install" in a for a in dec["actions_taken"])
    print("route pool pending OK:", dec["actions_taken"])


def test_route_online_when_nothing_local_pool(tmp_path):
    cfg, index, pool = _setup(tmp_path)
    dec = route_event({"user_text": "how do I deploy react", "thinking": None},
                      cfg, pool=pool, index=index, npx_available=True, dry_run=True)
    assert dec["route"] == "online"
    assert dec["candidates"][0]["route"] == "online"
    assert "query" in dec["candidates"][0]
    print("route online OK, query:", dec["candidates"][0]["query"])


def test_route_order_local_before_pool(tmp_path):
    cfg, index, pool = _setup(tmp_path)
    # 同時在 local 與 pool 有命中 → 必須選 local
    skill_dir = cfg.skills_local_made_dir / "dup-skill"
    skill_dir.mkdir(parents=True, exist_ok=True)
    (skill_dir / "SKILL.md").write_text(
        "---\nname: dup-skill\ndescription: 部署 react\ntags: [react]\n---\n\n# dup-skill\n",
        encoding="utf-8")
    index.register(skill_dir, conversation_id="c", origin="local-made")
    index.save()
    pool.entries["o/r/dup-skill"] = {
        "id": "o/r/dup-skill", "source": "o/r", "name": "dup-skill",
        "installs": 5_000_000, "status": "active", "installed": True,
        "install_mode": "lazy", "audit": {"status": "pass"},
    }
    pool.save()

    dec = route_event({"user_text": "dup skill", "thinking": None},
                      cfg, pool=pool, index=index, npx_available=True, dry_run=True)
    assert dec["route"] == "local", f"應優先 local，得到 {dec['route']} brief={dec['brief'][:80]}"
    print("route order OK:", dec["route"])


if __name__ == "__main__":
    import pytest  # type: ignore
    pytest.main([__file__, "-v", "-s"])
