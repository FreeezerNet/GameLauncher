$ErrorActionPreference = 'Stop'

$packageName = 'game-launcher'
$toolsDir = "$(Split-Path -parent $MyInvocation.MyCommand.Definition)"
$url = 'https://github.com/yourusername/game-launcher/releases/download/v1.0.0/Game.Launcher.Setup.1.0.0.exe'

$packageArgs = @{
  packageName    = $env:ChocolateyPackageName
  unzipLocation  = $toolsDir
  fileType       = 'EXE'
  url            = $url
  softwareName   = 'Game Launcher*'
  checksum       = '' # You'll need to add the checksum after uploading the installer
  checksumType   = 'sha256'
  silentArgs     = '/S' # Silent installation
  validExitCodes = @(0)
}

Install-ChocolateyPackage @packageArgs 