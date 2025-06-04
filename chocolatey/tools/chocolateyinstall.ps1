$ErrorActionPreference = 'Stop'

$packageName = 'game-launcher'
$toolsDir = "$(Split-Path -parent $MyInvocation.MyCommand.Definition)"
$url = 'https://github.com/FreeezerNet/GameLauncher/releases/download/v1.0.0/Game.Launcher.Setup.1.0.0.exe'

$packageArgs = @{
  packageName    = $env:ChocolateyPackageName
  unzipLocation  = $toolsDir
  fileType       = 'EXE'
  url            = $url
  softwareName   = 'Game Launcher*'
  checksum       = '7ac27c5bab7fb8fdab4789e78273f7d3ea59342a430f9df3f6e9c47092370cbf'
  checksumType   = 'sha256'
  silentArgs     = '/S' # Silent installation
  validExitCodes = @(0)
}

Install-ChocolateyPackage @packageArgs 