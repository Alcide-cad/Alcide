# Downloads the official LibreDWG Windows binaries (GPL-3.0-or-later).
# Source code: https://github.com/LibreDWG/libredwg  (release 0.14)
# License: https://www.gnu.org/licenses/gpl-3.0.html
param([string]$Dest = "build\runtime\resources\app\engine\dwg", [string]$Version = "0.14")
$ErrorActionPreference = "Stop"
$api = "https://api.github.com/repos/LibreDWG/libredwg/releases/tags/$Version"
$rel = Invoke-RestMethod $api -Headers @{ "User-Agent" = "alcide-ci" }
$asset = $rel.assets | Where-Object { $_.name -match 'win64\.zip$' } | Select-Object -First 1
if (-not $asset) { throw "No win64 asset in LibreDWG $Version" }
$zip = Join-Path $env:TEMP $asset.name
Invoke-WebRequest $asset.browser_download_url -OutFile $zip
$tmp = Join-Path $env:TEMP "libredwg-$Version"
Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
Expand-Archive $zip $tmp
New-Item -ItemType Directory -Force $Dest | Out-Null
$root = Get-ChildItem $tmp -Recurse -Filter dwgread.exe | Select-Object -First 1 | ForEach-Object DirectoryName
Copy-Item "$root\*" $Dest -Recurse -Force
# drop test/fuzz tools not needed by ALCIDE
Remove-Item "$Dest\examples" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$Dest\dwgfuzz.exe" -Force -ErrorAction SilentlyContinue
"LibreDWG $Version - GPL-3.0-or-later - source: https://github.com/LibreDWG/libredwg/releases/tag/$Version" | Set-Content "$Dest\SOURCE.txt"
