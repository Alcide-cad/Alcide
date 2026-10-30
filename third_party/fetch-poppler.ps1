# Downloads the pinned Poppler Windows build used by ALCIDE's PDF import (pdftoppm preview).
# Poppler: GPL-2.0-only OR GPL-3.0 (see app/LICENSE-Poppler-*.txt); upstream source below.
# Windows package: https://github.com/oschwartz10612/poppler-windows (conda-forge based build).
# Layout expected by app/pdf_gpl_backend.py (frozen engine): <engine>\poppler\bin\pdftoppm.exe
# Poppler finds its data (CMaps etc.) in <engine>\poppler\share\poppler (relative to bin).
param(
  [string]$Dest = "build\runtime\resources\app\engine\poppler",
  [string]$Url = "https://github.com/oschwartz10612/poppler-windows/releases/download/v26.09.0-0/Release-26.09.0-0.zip",
  [string]$Sha256 = "7a6f256a0ddf7536182246a5733331bf4677cbcc34f4663774947ad34556c8d0"
)
$ErrorActionPreference = "Stop"
$zip = Join-Path $env:TEMP "poppler-windows.zip"
Invoke-WebRequest $Url -OutFile $zip
$actual = (Get-FileHash $zip -Algorithm SHA256).Hash.ToLowerInvariant()
if ($actual -ne $Sha256.ToLowerInvariant()) { throw "Poppler archive SHA256 mismatch: expected $Sha256, got $actual" }
$tmp = Join-Path $env:TEMP "poppler-windows"
Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
Expand-Archive $zip $tmp
$exe = Get-ChildItem $tmp -Recurse -Filter pdftoppm.exe | Select-Object -First 1
if (-not $exe) { throw "pdftoppm.exe not found in Poppler archive" }
$bin = $exe.DirectoryName                                   # ...\poppler-26.09.0\Library\bin
$top = Split-Path (Split-Path $bin -Parent) -Parent         # ...\poppler-26.09.0
New-Item -ItemType Directory -Force "$Dest\bin", "$Dest\share" | Out-Null
Copy-Item "$bin\*" "$Dest\bin" -Recurse -Force
if (Test-Path "$top\share\poppler") { Copy-Item "$top\share\poppler" "$Dest\share" -Recurse -Force }
# Licence notices next to the binaries.
$app = Split-Path $Dest -Parent | Split-Path -Parent        # ...\resources\app
foreach ($f in "LICENSE-Poppler-GPL-2.0.txt", "LICENSE-Poppler-GPL-3.0.txt", "poppler-provenance.json") {
  if (Test-Path "$app\$f") { Copy-Item "$app\$f" $Dest -Force }
}
@"
Poppler 26.09.0 - GPL-2.0-only OR GPL-3.0 (poppler-data: see share\poppler\COPYING*)
Windows binaries: $Url
SHA256: $Sha256
Corresponding source (Poppler): https://poppler.freedesktop.org/poppler-26.09.0.tar.xz
Build recipe and sources of bundled DLLs: https://github.com/oschwartz10612/poppler-windows and https://github.com/conda-forge (feedstocks)
"@ | Set-Content "$Dest\SOURCE.txt"
