<#PSScriptInfo
.SYNOPSIS
  wuyong 乾淨卸載 (Windows PowerShell)
.DESCRIPTION
  只移除 config/core-skills.lock.json 記錄過的核心 skill 檔案；
  state/ 與 skills/local-made/ 不動，請使用者自行決定保留與否。
#>

$ErrorActionPreference = 'Stop'
set -StrictMode -Version 3.0
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$root = Resolve-Path (Join-Path $scriptDir '..')
$python = $env:WUYONG_PYTHON -as [string]
if (-not $python) { $python = 'python' }

Write-Host "wuyong uninstall：只移除 lock 記錄過的核心 skill；state/ 與 local-made/ 保留。"
& $python -m wuyong uninstall
exit $LASTEXITCODE
