<#PSScriptInfo
.SYNOPSIS
  晏銘湛箴_無用之用 (wuyong) — Windows PowerShell 安裝腳本
.DESCRIPTION
  1. 建立 state/ 與 skills/ 子目錄
  2. 安裝核心源 find-skills (npx skills add ... --skill find-skills)
  3. 首次監控同步 (wuyong monitor --once)
  冪等：可重複執行；已安裝則跳過，失敗不偽裝成功。
.NOTES
  需要 Python ≥3.11、Node.js (npx)。零第三方 Python 依賴。
#>

$ErrorActionPreference = 'Stop'
set -StrictMode -Version 3.0

# 專案根：此腳本所在 scripts/ 的上層
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$root = Resolve-Path (Join-Path $scriptDir '..')

# 優先使用 WUYONG_PYTHON，否則尋找 python (3.11+)
$python = $env:WUYONG_PYTHON
if (-not $python) {
    $candidates = @('python','python3','py')
    foreach ($c in $candidates) {
        $found = Get-Command $c -ErrorAction SilentlyContinue
        if ($found) {
            $ver = & $c --version 2>&1 | Select-Object -First 1
            if ($ver -match 'Python\s+(\d+)\.(\d+)') {
                if ([int]$matches[1] -ge 11 -or ([int]$matches[1] -eq 3 -and [int]$matches[2] -ge 11)) {
                    $python = $c; break
                }
            }
        }
    }
}
if (-not $python) { Write-Error '找不到 Python 3.11+ (請設定 WUYONG_PYTHON 或把 python 放 PATH)'; exit 1 }

# Node/npx 檢查
$node = Get-Command 'node' -ErrorAction SilentlyContinue
$npx  = Get-Command 'npx'  -ErrorAction SilentlyContinue
if (-not $node -or -not $npx) {
    Write-Warning '未找到 Node.js / npx：find-skills 將標記 degraded，之後自動重試。'
}

Write-Host "wuyong bootstrap 開始：根目錄=$root  python=$python"

& $python -m pip install --upgrade pip >$null 2>&1 | Out-Null
& $python -m pip install -e . >$null 2>&1 | Out-Null

# 1) 初始化 state、安裝核心源、首次監控
Write-Host "執行：python -m wuyong bootstrap"
& $python -m wuyong bootstrap
$exit = $LASTEXITCODE

# 2) 輸出 doctor 摘要供人工確認
Write-Host "執行：python -m wuyong doctor"
& $python -m wuyong doctor

exit $exit
