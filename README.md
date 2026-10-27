# ALCIDE

**FR** — ALCIDE est un logiciel de dessin 2D pour Windows, compatible avec les fichiers `.dwg` / `.dxf`, avec des outils dédiés au ferraillage (armatures, treillis soudés, calepinage).
**EN** — ALCIDE is a 2D CAD application for Windows, compatible with `.dwg` / `.dxf` files, with dedicated rebar tools (bars, welded mesh, layout).

## Téléchargement / Download
Voir / see [Releases](https://github.com/Alcide-cad/alcide/releases).

## Structure
- `app/` — interface Electron (`main.cjs`, `index.html`, JS/CSS) et sources Python du moteur (`engine.py`, `dwg_export.py`, …)
- `engine/` — `requirements.txt` et spec PyInstaller du moteur `alcide-engine`
- `installer/` — script Inno Setup et images
- `third_party/` — récupération de LibreDWG et liste des licences tierces
- `.github/workflows/build.yml` — compilation automatique de l'installeur

## Compiler / Build (Windows)
```powershell
python -m pip install -r engine/requirements.txt
python -m PyInstaller --noconfirm --distpath build/engine-dist engine/alcide-engine.spec
# Electron 44.5.1 -> build/runtime (electron.exe renommé ALCIDE.exe), app/ -> build/runtime/resources/app
# build/engine-dist/alcide-engine -> build/runtime/resources/app/engine
./third_party/fetch-libredwg.ps1
ISCC installer/Alcide.iss
```
Le workflow GitHub Actions fait tout cela automatiquement. / The GitHub Actions workflow does all of this automatically.

## DWG
ALCIDE lit et écrit le DWG via [LibreDWG](https://github.com/LibreDWG/libredwg) (GPL-3.0). L'[ODA File Converter](https://www.opendesign.com/guestfiles/oda_file_converter) n'est pas redistribué ; il peut être installé séparément par l'utilisateur.
ALCIDE reads/writes DWG through LibreDWG. ODA File Converter is not redistributed.

## Licence / License
GPL-3.0-or-later — voir / see [LICENSE](LICENSE). Composants tiers : [third_party/README.md](third_party/README.md).

© Nicolas Scherer
