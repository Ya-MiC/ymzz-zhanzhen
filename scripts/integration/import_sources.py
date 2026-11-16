#!/usr/bin/env python3
"""Import pinned tracked files, including dotfiles. Never imports Git databases.
Run with explicit checkout root; no network, execution, or credential discovery.
"""
import hashlib, json, os, subprocess, sys
from pathlib import Path, PurePosixPath
ROOT = Path(__file__).resolve().parents[2]
SOURCES = Path(sys.argv[1]).resolve()
def git(repo, *args):
    return subprocess.check_output(["git", "-C", str(repo), *args])
def snapshot(slug, ref, dest, prefixes=None):
    repo = SOURCES / slug.replace("/", "--")
    sha = git(repo, "rev-parse", ref).decode().strip()
    entries = []
    for line in git(repo, "ls-tree", "-rz", sha).split(b"\0"):
        if not line: continue
        meta, raw = line.split(b"\t", 1); mode, kind, oid = meta.decode().split()
        name = raw.decode(); parts = PurePosixPath(name).parts
        if prefixes is not None and not any(name == x or name.startswith(x + "/") for x in prefixes): continue
        item = {"path": name, "git_blob": oid, "mode": mode}
        # Narrow, explicit privacy exclusions. Public docs/research.md is NOT private study.
        sensitive = any(x in parts for x in (".git", "secrets", "private-exports", "Ludi-語料")) or name.endswith((".pem", ".key", ".p12", ".pfx")) or (PurePosixPath(name).name.startswith(".env") and not name.endswith((".example", ".sample")))
        if sensitive:
            item["excluded"] = "private material or credential-shaped filename; never copied"
        elif kind != "blob":
            item["excluded"] = "gitlink, not expanded without a separate source audit"
        else:
            data = git(repo, "cat-file", "blob", oid)
            if mode == "120000":
                # Record symlinks rather than following them into an uncontrolled tree.
                item["excluded"] = "symlink; resolved explicitly for product skills if needed"
            else:
                target = ROOT / dest / name; target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(data)
                if mode == "100755": target.chmod(0o755)
                item["sha256"] = hashlib.sha256(data).hexdigest()
        entries.append(item)
    return {"repository": "https://github.com/"+slug, "ref": ref, "commit": sha, "destination": dest, "files": entries,
            "copied": sum("sha256" in x for x in entries), "excluded": sum("excluded" in x for x in entries)}
records=[]
for ref, suffix in [("origin/product", "product"), ("origin/main", "main")]:
    records.append(snapshot("Ya-MiC/ymzz-loop", ref, "imports/ymzz-loop/"+suffix))
for slug in ["Ya-MiC/ymzz-wuyong-zhi-yong", "Ya-MiC/ymzz-wuwong-ji-wung", "Ya-MiC/yanming-official-website", "Ya-MiC/ymzz-wenrun-design-skill"]:
    records.append(snapshot(slug,"HEAD","imports/"+slug.split("/")[1]))
# The actual MIT DSH plugin kernel and its dependency, NOT its telemetry/browsers/paid providers.
records.append(snapshot("deepseek-ai/deepseek-harness", "HEAD", "imports/deepseek-harness", ["LICENSE", "README.md", "THIRD_PARTY_NOTICES.md", "vendor/cordis", "vendor/cosmokit"]))
(ROOT/"docs/integration/sources.lock.json").write_text(json.dumps(records, ensure_ascii=False, indent=2)+"\n")
# Actual locally installed skill contents, not CLI instructions or empty stubs.
skills=[
("find-skills","vercel-labs/skills","skills/find-skills","MIT"),
("agent-browser","vercel-labs/agent-browser","skills/agent-browser","Apache-2.0"),
("grill-me","mattpocock/skills","skills/productivity/grill-me","MIT"),
("hyperframes-cli","heygen-com/hyperframes","skills/hyperframes-cli","Apache-2.0"),
("hyperframes","heygen-com/hyperframes","skills/hyperframes","Apache-2.0"),
("modern-web-guidance","GoogleChrome/modern-web-guidance","skills/modern-web-guidance","Apache-2.0"),
("impeccable","pbakaus/impeccable",".agents/skills/impeccable","Apache-2.0"),
("hallmark","Nutlope/hallmark","skills/hallmark","MIT"),
("taste-skill","Leonxlnx/taste-skill","skills/taste-skill","MIT"),
]
locked=[]
for name,slug,path,license in skills:
    # Design assets may have independent photo/font licenses. First slice installs markdown references only;
    # arbitrary scripts/binaries remain unavailable, with exact omissions in this lock.
    rec=snapshot(slug,"HEAD","runtime/pool/"+name,[path,"LICENSE","NOTICE.md"])
    rec.update({"id":name,"license":license,"skill_directory":path,"enabled":True,"execution":"read-only instructions; no scripts, installs, browser or network granted"})
    if name == "agent-browser":
        repo=SOURCES/slug.replace("/","--")
        # Upstream SKILL.md is a tracked symlink; copy its tracked target explicitly.
        link=repo/path/"SKILL.md"
        resolved=link.resolve().relative_to(repo)
        extra=snapshot(slug,"HEAD","runtime/pool/"+name,[str(resolved)])
        rec["files"]+=extra["files"]
        rec["entrypoint"]="runtime/pool/"+name+"/"+str(resolved)
    else: rec["entrypoint"]="runtime/pool/"+name+"/"+path+"/SKILL.md"
    # Quarantine non-instruction files before inclusion; explicit manifest, no silent omission.
    for entry in rec["files"]:
        if "sha256" not in entry: continue
        f=ROOT/rec["destination"]/entry["path"]
        if not (f.suffix.lower() in (".md", ".yaml", ".yml", ".json", ".txt") or f.name.startswith(("LICENSE","NOTICE"))):
            f.unlink();entry.pop("sha256");entry["excluded"]="non-instruction asset/script not installed in instruction-only pool; independent licensing/execution review required"
    rec["copied"]=sum("sha256" in x for x in rec["files"])
    rec["excluded"]=sum("excluded" in x for x in rec["files"])
    locked.append(rec)
(ROOT/"core-skills.lock.json").write_text(json.dumps({"schema":1,"scope":"product-only","designAuthority":"ymzz-wenrun-design-skill; other skills cannot override tokens","skills":locked},ensure_ascii=False,indent=2)+"\n")
print(json.dumps([{k:r[k] for k in ["repository","commit","copied","excluded"]} for r in records+locked],indent=2))
