<#PSScriptInfo
.SYNOPSIS
  wuyong 技能池監控腳本 (Windows PowerShell)
.DESCRIPTION
  --once  單次同步 (可搭配 --fixture 使用本地 HTML，不聯網)
  預設    常駐輪詢 (6 小時 + 抖動)，Ctrl+C 停止
#>

$ErrorActionPreference = 'Stop'
set -StrictMode -Version 3.0
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$root = Resolve-Path (Join-Path $scriptDir '..')
$python = $env:WUYONG_PYTHON -as [string]
if (-not $python) { $python = 'python' }

$once = $false
$daemon = $false
$interval = $null
$fixture = $null
foreach ($a in $args) {
    switch -regex ($a) {
        '^--once$' { $once = $true }
        '^--daemon$' { $daemon = $true }
        '^--interval=?' { $interval = ($a -replace '^--interval=?','') }
        '^--fixture=?' { $fixture = ($a -replace '^--fixture=?','') }
        default { Write-Warning "未知參數：$a" }
    }
}

$cmd = @($python, '-m', 'wuyong', 'monitor')
if ($once) { $cmd += '--once' }
if ($fixture) { $cmd += "--fixture=$fixture" }
if ($daemon) { $cmd += '--daemon' }
if ($interval) { $cmd += "--interval=$interval" }

& $cmd
exit $LASTEXITCODE
