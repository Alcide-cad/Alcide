# Third-party components

| Component | License | Source | Shipped? |
|---|---|---|---|
| Electron 44.5.1 | MIT (+ Chromium licenses) | https://github.com/electron/electron | yes (downloaded at build) |
| LibreDWG 0.14 | GPL-3.0-or-later | https://github.com/LibreDWG/libredwg/releases/tag/0.14 | yes (`fetch-libredwg.ps1`) |
| ezdxf | MIT | https://github.com/mozman/ezdxf | yes (in engine) |
| numpy | BSD-3-Clause | https://numpy.org | yes |
| shapely / GEOS | BSD-3-Clause / LGPL-2.1 | https://github.com/shapely/shapely | yes |
| orjson | Apache-2.0 / MIT | https://github.com/ijl/orjson | yes |
| fontTools | MIT | https://github.com/fonttools/fonttools | yes |
| Pillow | HPND | https://github.com/python-pillow/Pillow | yes (in engine) |
| pdfminer.six 20260107 | MIT | https://github.com/pdfminer/pdfminer.six | yes (in engine, PDF import) |
| cryptography 50.0.2 | Apache-2.0 OR BSD-3-Clause | https://github.com/pyca/cryptography | yes (in engine, pdfminer.six dependency) |
| charset-normalizer 3.5.2 | MIT | https://github.com/jawah/charset_normalizer | yes (in engine, pdfminer.six dependency) |
| Poppler 26.09.0 (`pdftoppm`) | GPL-2.0-only OR GPL-3.0-only | https://poppler.freedesktop.org/poppler-26.09.0.tar.xz | yes (`fetch-poppler.ps1`, separate executable in `engine/poppler`) |
| Poppler Windows build v26.09.0-0 + its DLLs (cairo, freetype, lcms2, libpng, libjpeg-turbo, openjpeg, libtiff, zlib, curl, OpenSSL 3, ICU, MSVC runtime…) | each its own licence (MIT/BSD/zlib/Apache-2.0/ICU/LGPL/Microsoft redistributable) | https://github.com/oschwartz10612/poppler-windows/releases/tag/v26.09.0-0 (conda-forge builds) | yes, with Poppler |
| poppler-data (CMaps) | BSD-style Adobe licence (CMaps) / GPL-2.0 or GPL-3.0 (other tables), see `share/poppler/COPYING*` | https://poppler.freedesktop.org | yes, with Poppler |
| ODA File Converter | proprietary (free) | https://www.opendesign.com/guestfiles/oda_file_converter | **never bundled** – optional, installed by the user |
| PyMuPDF / MuPDF | AGPL-3.0 | – | **never bundled** – excluded from the engine build |

Poppler archive pinned in `fetch-poppler.ps1`: `Release-26.09.0-0.zip`, SHA256 `7a6f256a0ddf7536182246a5733331bf4677cbcc34f4663774947ad34556c8d0`. The installer ships `engine/poppler/SOURCE.txt` with the source locations.
