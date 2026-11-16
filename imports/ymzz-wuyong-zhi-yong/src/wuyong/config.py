"""設定載入：config/wuyong.toml + 內建預設值；專案根定位。"""

from __future__ import annotations

import os
import tomllib
from dataclasses import dataclass, field
from pathlib import Path

PACKAGE_DIR = Path(__file__).resolve().parent  # .../src/wuyong

# 自動探測的常見本地 skill 根目錄（相對於家目錄或上層目錄）。
# 只收錄確實存在者（Path.exists 驗證），絕不假設。
AUTO_DETECT_RELATIVE = [
    ".agents/skills",
    ".claude/skills",
    ".codex/skills",
    ".cursor/skills",
    ".config/agents/skills",
]


@dataclass
class SignalsCfg:
    user_weight: float = 1.0
    thinking_weight: float = 1.2
    intent_threshold: float = 0.30


@dataclass
class RouterCfg:
    local_min_score: float = 0.34
    online_query_max_words: int = 8


@dataclass
class MonitorCfg:
    min_installs: int = 1_000_000
    interval_seconds: int = 21_600  # 6h
    jitter_ratio: float = 0.10
    hysteresis_rounds: int = 2
    install_mode: str = "lazy"  # lazy | eager


@dataclass
class SourcesCfg:
    api_base: str = "https://skills.sh"
    leaderboard_url: str = "https://www.skills.sh/"
    per_page: int = 500
    max_pages: int = 20
    timeout_seconds: int = 30


@dataclass
class InstallerCfg:
    node_cmd: str = "npx"
    timeout_seconds: int = 300


@dataclass
class LocalRootsCfg:
    extra: list[str] = field(default_factory=list)
    auto_detect: bool = True


@dataclass
class Config:
    root: Path
    mode: str = "act"  # observe | advise | act
    log_redact: bool = True
    signals: SignalsCfg = field(default_factory=SignalsCfg)
    router: RouterCfg = field(default_factory=RouterCfg)
    monitor: MonitorCfg = field(default_factory=MonitorCfg)
    sources: SourcesCfg = field(default_factory=SourcesCfg)
    installer: InstallerCfg = field(default_factory=InstallerCfg)
    local_roots: LocalRootsCfg = field(default_factory=LocalRootsCfg)

    # ---- 路徑 ----
    @property
    def state_dir(self) -> Path:
        return self.root / "state"

    @property
    def config_dir(self) -> Path:
        return self.root / "config"

    @property
    def skills_core_dir(self) -> Path:
        return self.root / "skills" / "core"

    @property
    def skills_pool_dir(self) -> Path:
        return self.root / "skills" / "pool"

    @property
    def skills_local_made_dir(self) -> Path:
        return self.root / "skills" / "local-made"

    @property
    def prompts_dir(self) -> Path:
        return self.root / "prompts"

    @property
    def core_lock_path(self) -> Path:
        return self.config_dir / "core-skills.lock.json"

    # ---- 本地 skill 根目錄 ----
    def local_skill_roots(self) -> list[Path]:
        """回傳確實存在的本地 skill 根目錄（不假設、只用 Path.exists 驗證過的）。"""
        roots: list[Path] = []
        seen: set[str] = set()

        def add(p: Path) -> None:
            rp = p.resolve()
            if str(rp) in seen:
                return
            seen.add(str(rp))
            roots.append(rp)

        # 專案內的 local-made 與 pool 一律優先
        for fixed in (self.skills_local_made_dir, self.skills_pool_dir, self.skills_core_dir):
            if fixed.is_dir():
                add(fixed)

        for raw in self.local_roots.extra:
            p = Path(raw)
            if not p.is_absolute():
                p = self.root / p
            if p.is_dir():
                add(p)
            # 不存在的路徑：靜默略過不夠老實——交給 doctor 去回報，這裡只收存在的。

        if self.local_roots.auto_detect:
            bases = [Path.home(), self.root.parent, Path.cwd()]
            for base in bases:
                for rel in AUTO_DETECT_RELATIVE:
                    p = base / rel
                    try:
                        if p.is_dir():
                            add(p)
                    except OSError:
                        continue
        return roots

    @property
    def index_path(self) -> Path:
        return self.state_dir / "local-index.json"

    @property
    def pool_path(self) -> Path:
        return self.state_dir / "pool.json"

    @property
    def events_path(self) -> Path:
        return self.state_dir / "events.jsonl"

    @property
    def snapshot_path(self) -> Path:
        return self.state_dir / "leaderboard-snapshot.json"

    @property
    def bootstrap_state_path(self) -> Path:
        return self.state_dir / "bootstrap.json"


def find_project_root() -> Path:
    """定位專案根：WUYONG_ROOT 環境變數 > 從 cwd 往上找 pyproject.toml > 套件位置的 src 佈局。"""
    env = os.environ.get("WUYONG_ROOT")
    if env:
        return Path(env).resolve()
    cwd = Path.cwd().resolve()
    for base in (cwd, *cwd.parents):
        try:
            if (base / "pyproject.toml").is_file() and (
                (base / "src" / "wuyong").is_dir() or (base / "config" / "wuyong.toml").is_file()
            ):
                return base
        except OSError:
            continue
    # src 佈局：src/wuyong/config.py → parents[2] = 專案根
    return PACKAGE_DIR.parents[1]


def load_config(root: Path | None = None) -> Config:
    root = (root or find_project_root()).resolve()
    cfg = Config(root=root)
    path = root / "config" / "wuyong.toml"
    if path.is_file():
        with open(path, "rb") as fh:
            raw = tomllib.load(fh)
        g = raw.get("general", {})
        cfg.mode = str(g.get("mode", cfg.mode))
        cfg.log_redact = bool(g.get("log_redact", cfg.log_redact))
        s = raw.get("signals", {})
        cfg.signals = SignalsCfg(
            user_weight=float(s.get("user_weight", cfg.signals.user_weight)),
            thinking_weight=float(s.get("thinking_weight", cfg.signals.thinking_weight)),
            intent_threshold=float(s.get("intent_threshold", cfg.signals.intent_threshold)),
        )
        r = raw.get("router", {})
        cfg.router = RouterCfg(
            local_min_score=float(r.get("local_min_score", cfg.router.local_min_score)),
            online_query_max_words=int(r.get("online_query_max_words", cfg.router.online_query_max_words)),
        )
        m = raw.get("monitor", {})
        cfg.monitor = MonitorCfg(
            min_installs=int(m.get("min_installs", cfg.monitor.min_installs)),
            interval_seconds=int(m.get("interval_seconds", cfg.monitor.interval_seconds)),
            jitter_ratio=float(m.get("jitter_ratio", cfg.monitor.jitter_ratio)),
            hysteresis_rounds=int(m.get("hysteresis_rounds", cfg.monitor.hysteresis_rounds)),
            install_mode=str(m.get("install_mode", cfg.monitor.install_mode)),
        )
        so = raw.get("sources", {})
        cfg.sources = SourcesCfg(
            api_base=str(so.get("api_base", cfg.sources.api_base)),
            leaderboard_url=str(so.get("leaderboard_url", cfg.sources.leaderboard_url)),
            per_page=int(so.get("per_page", cfg.sources.per_page)),
            max_pages=int(so.get("max_pages", cfg.sources.max_pages)),
            timeout_seconds=int(so.get("timeout_seconds", cfg.sources.timeout_seconds)),
        )
        i = raw.get("installer", {})
        cfg.installer = InstallerCfg(
            node_cmd=str(i.get("node_cmd", cfg.installer.node_cmd)),
            timeout_seconds=int(i.get("timeout_seconds", cfg.installer.timeout_seconds)),
        )
        lr = raw.get("local_roots", {})
        cfg.local_roots = LocalRootsCfg(
            extra=[str(x) for x in lr.get("extra", [])],
            auto_detect=bool(lr.get("auto_detect", cfg.local_roots.auto_detect)),
        )
    # mode 合法性
    if cfg.mode not in ("observe", "advise", "act"):
        raise ValueError(f"general.mode 必須是 observe|advise|act，得到：{cfg.mode!r}")
    return cfg


def ensure_state_dirs(cfg: Config) -> list[Path]:
    """建立 state/ 與 skills 子目錄（冪等）。"""
    made = []
    for d in (cfg.state_dir, cfg.skills_core_dir, cfg.skills_pool_dir, cfg.skills_local_made_dir):
        if not d.is_dir():
            d.mkdir(parents=True, exist_ok=True)
            made.append(d)
    return made
