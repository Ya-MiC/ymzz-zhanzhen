# MIT. Evidence only: does not distribute binaries or claim any GUI result.
param([string]$BuildRoot)
$ErrorActionPreference='Stop'
$proof=Join-Path (Split-Path $PSScriptRoot -Parent) 'evidence/windows';New-Item -ItemType Directory -Force $proof|Out-Null
$built=Get-ChildItem $BuildRoot -Recurse -Directory -Filter 'win-unpacked'|Select-Object -First 1
$record=@{run=$env:GITHUB_RUN_ID;commit=$env:GITHUB_SHA;fullUpstream='39163dd30f703a79079e2d2446545cff3c453738';binaryAssembled=$false;nativeGUIVerified=$false;binaryDistributed=$false;scope='artifact metadata only; GUI proof is a separate file'}
if($built){
 $exe=Join-Path $built.FullName '晏銘湛箴.exe'
 if(Test-Path $exe){
  & node (Join-Path $PSScriptRoot 'packaged-licenses.mjs') $built.FullName
  if($LASTEXITCODE -ne 0){throw 'Actual packaged dependency/license evidence collection failed'}
  $record.binaryAssembled=$true;$record.exeSHA256=(Get-FileHash $exe -Algorithm SHA256).Hash;$record.exeBytes=(Get-Item $exe).Length
  $stream=[System.IO.File]::OpenRead($exe);try{$record.isWindowsPE=($stream.ReadByte() -eq 77 -and $stream.ReadByte() -eq 90)}finally{$stream.Dispose()}
  $icon=Join-Path $built.FullName 'resources/icon.png';$expected=Join-Path (Split-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) -Parent) 'runtime/ui/brand/icon-512.png'
  $record.originalUserDerivedResourceIconMatches=((Get-FileHash $icon -Algorithm SHA256).Hash -eq (Get-FileHash $expected -Algorithm SHA256).Hash)
  $record.primaryNodeBundled=(Test-Path (Join-Path $built.FullName 'resources/runtime/primary-runtime/dependencies/node/bin/node.exe'))
  $record.originalDshLicenseBundled=(Test-Path (Join-Path $built.FullName 'resources/licenses/deepseek-harness/LICENSE'))
  $record.originalDshNoticesBundled=(Test-Path (Join-Path $built.FullName 'resources/licenses/deepseek-harness/THIRD_PARTY_NOTICES.md'))
  try{Add-Type -AssemblyName System.Drawing;$i=[System.Drawing.Icon]::ExtractAssociatedIcon($exe);try{$b=$i.ToBitmap();try{$b.Save((Join-Path $proof 'full-dsh-exe-icon.png'),[System.Drawing.Imaging.ImageFormat]::Png)}finally{$b.Dispose()}}finally{$i.Dispose()};$record.actualPEIconExtracted=$true}catch{$record.actualPEIconExtracted=$false;$record.iconExtractionError=$_.Exception.GetType().Name}
 }
}
$record|ConvertTo-Json -Depth 8|Set-Content -Encoding utf8 (Join-Path $proof 'packaged-exe-metadata.json')
if($record.binaryAssembled -and (!$record.isWindowsPE -or !$record.originalUserDerivedResourceIconMatches -or !$record.primaryNodeBundled -or !$record.originalDshLicenseBundled -or !$record.originalDshNoticesBundled)){throw 'Assembled full DSH package resource/Node/license contract failed'}
