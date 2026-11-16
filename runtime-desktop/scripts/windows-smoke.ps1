# MIT. Executes the assembled/relocated portable app, not cargo or a dev server.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type -TypeDefinition @'
using System; using System.Runtime.InteropServices;
public class NativeWindow { [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h); }
'@
$source = (Resolve-Path 'dist/zhanzhen-portable').Path
$install = Join-Path $env:RUNNER_TEMP '湛箴 relocated app'
Copy-Item -Recurse $source $install
$data = Join-Path $env:RUNNER_TEMP 'zhanzhen-smoke-data'
$env:YMZZ_DATA_DIR = $data
$env:YMZZ_SMOKE_STARTUP = '1'
$process = Start-Process (Join-Path $install 'ymzz-zhanzhen.exe') -PassThru
try {
 $deadline = (Get-Date).AddSeconds(90)
 do { Start-Sleep -Milliseconds 500; $process.Refresh(); if ($process.HasExited) { throw 'Portable GUI exited during startup' } } until (((Test-Path "$data/startup.json") -and $process.MainWindowHandle -ne 0) -or (Get-Date) -gt $deadline)
 if (!(Test-Path "$data/startup.json") -or $process.MainWindowHandle -eq 0) { throw 'No GUI window or no bundled runtime' }
 New-Item -ItemType Directory -Force 'dist/smoke' | Out-Null
 [NativeWindow]::SetForegroundWindow($process.MainWindowHandle) | Out-Null
 Start-Sleep -Seconds 4
 $bounds=[System.Windows.Forms.Screen]::PrimaryScreen.Bounds
 $bitmap=New-Object System.Drawing.Bitmap $bounds.Width,$bounds.Height
 $graphics=[System.Drawing.Graphics]::FromImage($bitmap)
 $graphics.CopyFromScreen($bounds.Location,[System.Drawing.Point]::Empty,$bounds.Size)
 $bitmap.Save((Join-Path (Get-Location) 'dist/smoke/windows-onboarding.png'))
 $graphics.Dispose();$bitmap.Dispose()
 # Genuine GUI interaction via Windows accessibility APIs, no browser download/dependency.
 $element=[System.Windows.Automation.AutomationElement]::FromHandle($process.MainWindowHandle)
 $condition=New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty, '進入我的工作台')
 $deadline=(Get-Date).AddSeconds(30)
 do { $enter=$element.FindFirst([System.Windows.Automation.TreeScope]::Descendants,$condition); if (!$enter) { Start-Sleep -Milliseconds 500 } } until ($enter -or (Get-Date) -gt $deadline)
 if (!$enter) { throw 'Nickname onboarding submit button not exposed: GUI may be blank' }
 $invoke=$enter.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern)
 $invoke.Invoke()
 $condition=New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty, '插件與權限')
 $deadline=(Get-Date).AddSeconds(15)
 do { $nav=$element.FindFirst([System.Windows.Automation.TreeScope]::Descendants,$condition); if (!$nav) { Start-Sleep -Milliseconds 300 } } until ($nav -or (Get-Date) -gt $deadline)
 if (!$nav) { throw 'GUI nickname submission did not reach working navigation' }
 # API exercised from this installed GUI process's own bundled runtime; not a standalone mock.
 $startup=Get-Content -Raw "$data/startup.json" | ConvertFrom-Json
 $url=[Uri]$startup.url
 $token=$url.Fragment.Replace('#token=','')
 $env:YMZZ_SMOKE_ORIGIN=$url.GetLeftPart([System.UriPartial]::Authority)
 $env:YMZZ_SMOKE_TOKEN=$token
 node runtime/scripts/installed-smoke.mjs
 if ($LASTEXITCODE -ne 0) { throw 'Installed runtime offline task failed' }
 ./runtime-desktop/scripts/coding-ui-smoke.ps1 -Element $element -Origin $env:YMZZ_SMOKE_ORIGIN -Token $token -Data $data
 if (!(Test-Path "$data/zhanzhen.sqlite")) { throw 'No persistent database' }
 # Verify the window is still alive after the true Rust evaluation and evidence checks.
 $process.Refresh(); if ($process.HasExited -or $process.MainWindowHandle -eq 0) { throw 'GUI did not survive offline task' }
 @{'guiWindow'= $true; 'core'= 'ymzz-core/integrity'; 'portableRelocation'= $true; 'nodeFromBundle'= $true; 'registryInstaller'= $false; 'guiNicknameClick'= $true} | ConvertTo-Json | Set-Content -Encoding utf8 dist/smoke/windows-proof.json
} finally {
 if (!$process.HasExited) { $process.CloseMainWindow() | Out-Null; if (!$process.WaitForExit(15000)) { Stop-Process -Id $process.Id -Force } }
 Remove-Item Env:YMZZ_SMOKE_TOKEN -ErrorAction SilentlyContinue
 Remove-Item "$data/startup.json" -ErrorAction SilentlyContinue
}
