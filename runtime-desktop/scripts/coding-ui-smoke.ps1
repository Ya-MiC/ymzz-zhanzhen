# MIT. Real native Windows UIAutomation against packaged app. No browser automation dependency.
param($Element,[string]$Origin,[string]$Token,[string]$Data)
$ErrorActionPreference='Stop'
$headers=@{Authorization="Bearer $Token"}
function State { Invoke-RestMethod "$Origin/api/state" -Headers $headers }
function Find-Control([string]$name) {
 $condition=New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty,$name)
 $deadline=(Get-Date).AddSeconds(20)
 do {$found=$Element.FindFirst([System.Windows.Automation.TreeScope]::Descendants,$condition);if(!$found){Start-Sleep -Milliseconds 200}}until($found -or (Get-Date) -gt $deadline)
 if(!$found){throw "Missing actual GUI control: $name"};return $found
}
function Click([string]$name){$control=Find-Control $name;($control.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern)).Invoke();Start-Sleep -Milliseconds 250}
function Check([string]$name){$control=Find-Control $name;$toggle=$control.GetCurrentPattern([System.Windows.Automation.TogglePattern]::Pattern);if($toggle.Current.ToggleState -eq [System.Windows.Automation.ToggleState]::Off){$toggle.Toggle()}}
function Wait-Round([string]$id,[int]$round,[string]$status=''){
 $deadline=(Get-Date).AddSeconds(30)
 do{$s=State;$task=$s.coding.tasks|Where-Object {$_.id -eq $id};$ready=$task.round -ge $round -and (!$status -or $task.state -eq $status);if(!$ready){Start-Sleep -Milliseconds 250}}until($ready -or (Get-Date) -gt $deadline)
 if(!$ready){throw "Coding GUI pipeline did not reach round $round state $status; actual $($task.state), error $($task.error)"};Start-Sleep -Milliseconds 500;return $task
}
function Screenshot([string]$name){$bounds=[System.Windows.Forms.Screen]::PrimaryScreen.Bounds;$image=New-Object System.Drawing.Bitmap $bounds.Width,$bounds.Height;$g=[System.Drawing.Graphics]::FromImage($image);$g.CopyFromScreen($bounds.Location,[System.Drawing.Point]::Empty,$bounds.Size);$image.Save((Join-Path (Get-Location) "dist/smoke/$name.png"));$g.Dispose();$image.Dispose()}
# Configure a local endpoint through the GUI, but NEVER call inference here.
Click '模型設定'
Click '啟用本機模型連線權限'
$model=Find-Control '模型名稱'
($model.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)).SetValue('offline-not-connected')
Click '允許連接這台裝置上的模型'
if((State).provider.model -ne 'offline-not-connected'){throw 'Actual GUI local-provider configuration failed'}
Click '編碼工作區'
Click '啟用編碼工作區（每批仍需授權）'
# Open the actual native folder picker, then cancel without inspecting any private filesystem.
Click '選擇我的專案資料夾'
$condition=New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty,'選擇湛箴工作區')
$deadline=(Get-Date).AddSeconds(15)
do{$picker=[System.Windows.Automation.AutomationElement]::RootElement.FindFirst([System.Windows.Automation.TreeScope]::Children,$condition);if(!$picker){Start-Sleep -Milliseconds 200}}until($picker -or (Get-Date) -gt $deadline)
if(!$picker){throw 'Native folder picker window did not open'}
($picker.GetCurrentPattern([System.Windows.Automation.WindowPattern]::Pattern)).Close();Start-Sleep -Milliseconds 500
function Complete-Demo([bool]$accept){
 $before=@((State).coding.tasks).Count
 Click '建立離線程式修復示例'
 $deadline=(Get-Date).AddSeconds(20)
 do{$tasks=@((State).coding.tasks);if($tasks.Count -le $before){Start-Sleep -Milliseconds 200}}until($tasks.Count -gt $before -or (Get-Date) -gt $deadline)
 if($tasks.Count -le $before){throw 'GUI did not create actual coding task'}
 $task=$tasks[-1];$id=$task.id;$task=Wait-Round $id 1 'coding-proposed'
 for($round=1;$round -le 3;$round++){
  Check '我已檢查上述工具及檔案修改，僅核准此批提案。'
  if($round -gt 1){Check '我信任此專案測試程式碼並同意執行。Node 權限不是安全沙盒，測試可能使用網路。'}
  Click '核准並執行這批工具'
  $expected=if($round -eq 3){'coding-review'}else{'coding-proposed'}
  $task=Wait-Round $id ($round+1) $expected
 }
 $evidence=Invoke-RestMethod "$Origin/api/evidence?id=$id" -Headers $headers
 if(!$evidence.valid){throw 'Coding evidence chain invalid'}
 $gates=@($evidence.events|Where-Object {$_.kind -eq 'coding-gate'})
 if($gates.Count -ne 2 -or $gates[0].payload.passed -or !$gates[1].payload.passed){throw 'No actual failure -> repair -> pass sequence'}
 if($accept){
  Check '我已檢查差異及測試結果，同意保留這次修改。'
  Screenshot 'windows-coding-diff'
  Click '驗收並保留修改';$task=Wait-Round $id 4 'done'
  Click '確認記住這次編碼結果'
  $deadline=(Get-Date).AddSeconds(15);do{$mem=@((State).memory|Where-Object {$_.task -eq $id});if(!$mem.Count){Start-Sleep -Milliseconds 200}}until($mem.Count -or (Get-Date) -gt $deadline)
  if(!$mem.Count){throw 'GUI explicit coding memory confirmation failed'}
  Screenshot 'windows-coding-workspace'
 }else{
  Check '我同意還原此任務的修改；若檔案被其他程式變更，請拒絕覆蓋。'
  Click '還原本任務修改';$task=Wait-Round $id 4 'coding-rolled-back'
  $file=Join-Path (Join-Path (Join-Path $Data 'coding-examples') $task.workspace) 'calculator.mjs'
  if((Get-Content -Raw -Encoding utf8 $file) -ne "export function add(a, b) { return a - b; }`n"){throw 'Rollback did not restore original project bytes'}
 }
 @{task=$task;evidence=$evidence;nativeGui=$true;actualNodeTests=$true;deterministicFakeTransport=$true;liveInference=$false;nativePickerOpenedAndCancelled=$true;providerConfiguredViaGuiWithoutInference=$true}|ConvertTo-Json -Depth 40|Set-Content -Encoding utf8 "dist/smoke/windows-coding-$accept.json"
}
Complete-Demo $true
Complete-Demo $false
