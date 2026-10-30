$ErrorActionPreference = 'Stop'
$audioProject = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$audioOutput = Join-Path $audioProject '视频复刻版\assets\audio'
$audioWork = Join-Path $PSScriptRoot 'audio-work'
$audioEncoder = Join-Path (Split-Path $PSScriptRoot -Parent) 'tools\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe'
New-Item -ItemType Directory -Force -Path $audioOutput, $audioWork | Out-Null
$audioJobs = (Get-Content -LiteralPath (Join-Path $PSScriptRoot 'audio-texts.json') -Raw -Encoding utf8 | ConvertFrom-Json).jobs
$audioVoice = New-Object -ComObject SAPI.SpVoice
$audioToken = New-Object -ComObject SAPI.SpObjectToken
$audioToken.SetId('HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Speech_OneCore\Voices\Tokens\MSTTS_V110_zhCN_HuihuiM')
$audioVoice.Voice = $audioToken
$audioVoice.Rate = -2
$audioVoice.Volume = 95
foreach ($audioJob in $audioJobs) {
  $audioWave = Join-Path $audioWork ($audioJob.name + '.wav')
  $audioMp3 = Join-Path $audioOutput ($audioJob.name + '.mp3')
  $audioStream = New-Object -ComObject SAPI.SpFileStream
  try {
    $audioStream.Format.Type = 22
    $audioStream.Open($audioWave, 3)
    $audioVoice.AudioOutputStream = $audioStream
    $audioVoice.Speak([string]$audioJob.text) | Out-Null
  } finally { $audioStream.Close() }
  & $audioEncoder -hide_banner -loglevel error -y -i $audioWave -af 'highpass=f=65,loudnorm=I=-18:TP=-1.5:LRA=7' -ar 44100 -ac 1 -codec:a libmp3lame -b:a 96k $audioMp3
  if ($LASTEXITCODE -ne 0) { throw "Encoding failed: $($audioJob.name)" }
  Write-Output ('Saved ' + $audioJob.name + '.mp3')
}
