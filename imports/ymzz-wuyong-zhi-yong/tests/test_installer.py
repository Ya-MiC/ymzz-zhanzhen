"""安裝器測試：dry_run 不得真的聯網安裝（零聯網）。"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from wuyong.config import Config
from wuyong.installer import install_skill, build_add_cmd, find_skill_md


def test_dry_run_no_network(tmp_path):
    cfg = Config(root=tmp_path)
    plan = install_skill(cfg, "https://github.com/vercel-labs/skills", "find-skills", dry_run=True)
    assert plan["dry_run"] is True
    assert plan["ok"] is True
    assert plan["reason"] == "dry_run"
    # dry_run 不應呼叫 subprocess（這裡只檢查回傳計畫）
    print("dry run plan:", plan)


def test_build_add_cmd_shape(tmp_path):
    cfg = Config(root=tmp_path)
    cmd = build_add_cmd(cfg, "https://github.com/vercel-labs/skills", "find-skills")
    assert "skills" in cmd
    assert "add" in cmd
    assert "--skill" in cmd and "find-skills" in cmd
    assert "--yes" in cmd and "--copy" in cmd and "--json" in cmd
    print("add cmd:", cmd)


def test_find_skill_md_not_found(tmp_path):
    cfg = Config(root=tmp_path)
    assert find_skill_md(cfg.root, "nonexistent-skill") is None
    print("find missing md OK")


if __name__ == "__main__":
    test_dry_run_no_network()
    test_build_add_cmd_shape()
    test_find_skill_md_not_found()
    print("ALL installer tests passed")
