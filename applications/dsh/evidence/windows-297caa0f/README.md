# 2026-11-16 19:18 KST · Full DSH Windows proof (historical candidate)

Run [43845429747](https://github.com/Ya-MiC/ymzz-zhanzhen/actions/runs/43845429747), exact source `297caa0f4acaa018da9c4177016bcb3ab676e73c`.

Actual official full Windows build/package/runtime/Office smoke passed, followed by real native GUI nickname, twelve individual approvals, failing→repair→passing tests, acceptance+memory and independent rollback. The screenshots are genuine, not redesigned mockups. The harness subsequently failed when attempting to focus the non-focusable top-level Chromium UIAutomation pane before opening model settings. Therefore the overall GUI check was NOT passed. Later code uses the actual accessible Account menu → Settings instead; no assertions are skipped.

This candidate predates the exact new product name and genuine native brand/footer slot plugin; do not treat its screenshot/EXE as the final branded product.

Actual package audit identifies LGPL-2.1-or-later `ffmpeg.dll` and MPL-2.0 LibreOffice wrappers/engine. No binary artifact or release is distributed. The actual original Chromium notice and complete raw accessibility diagnostics remain in the run's qualification-evidence artifact; this directory retains selected reports/screenshots, not every CI artifact.
