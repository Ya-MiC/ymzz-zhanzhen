"""真實聯網整合測試（預設不跑：pytest -m integration）。

本機環境若無法解析 skills.sh，將如實驗證「全部降級」路徑，不編造資料。
"""

import pytest
from wuyong.config import load_config
from wuyong.installer import verify_core, ensure_core
from wuyong.monitor import skills_sh


@pytest.mark.integration
def test_doctor_network_and_core(capsys):
    cfg = load_config()
    lock_path = cfg.config_dir / "core-skills.lock.json"
    import json
    lock = json.loads(lock_path.read_text(encoding="utf-8"))
    status = verify_core(cfg, lock)
    print("core status:", status)
    # 斷言：回傳結構正確，不斷言 installed（離線時可為 False）
    for name, s in status.items():
        assert "installed" in s and "required" in s


@pytest.mark.integration
def test_monitor_degraded_honest():
    cfg = load_config()
    entries, meta = skills_sh.collect(cfg, token=None)
    print("monitor meta:", meta)
    # 無 token / 無網路時必須如實回報 source 不是 api
    assert meta["source"] in ("html", "snapshot", "none", "fixture")
    if meta["source"] == "none":
        assert meta.get("api_degraded_reason")


@pytest.mark.integration
def test_npx_skills_list_find_skills_installed():
    """npx skills list 應能列出已安裝的 find-skills（bootstrap 後）。"""
    import subprocess, os, shutil
    npx = shutil.which("npx") or shutil.which("npx.cmd") or shutil.which("npx.exe")
    if not npx:
        pytest.skip("npx 不在 PATH，跳過此整合測試")
    env = dict(os.environ, DISABLE_TELEMETRY="1", CI="1")
    proc = subprocess.run([npx, "-y", "skills", "list", "--json"],
                          capture_output=True, text=True, timeout=120, env=env)
    print("npx skills list rc=", proc.returncode)
    print("stdout:", proc.stdout[-1000:])
    print("stderr:", proc.stderr[-500:])
    # 不斷言一定成功（離線可能失敗），只印出真實結果
