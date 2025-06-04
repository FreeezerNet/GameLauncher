$ErrorActionPreference = 'Stop'

$packageName = 'game-launcher'
$toolsDir = "$(Split-Path -parent $MyInvocation.MyCommand.Definition)"
$url64 = 'https://github.com/yourusername/game-launcher/releases/download/v1.0.0/GameLauncher-Setup-1.0.0.exe'

$packageArgs = @{
  packageName    = $packageName
  unzipLocation = $toolsDir
  fileType      = 'EXE'
  url64bit      = $url64
  softwareName  = 'Game Launcher*'

  checksum64    = ''
  checksumType64= 'sha256'

  silentArgs   = '/S'
  validExitCodes= @(0)
}

Install-ChocolateyPackage @packageArgs 