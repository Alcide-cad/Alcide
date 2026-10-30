# ALCIDE

**FR** — ALCIDE est un logiciel de dessin 2D pour Windows, compatible avec les fichiers `.dwg` / `.dxf`, avec des outils dédiés au ferraillage (armatures, treillis soudés, calepinage).
**EN** — ALCIDE is a 2D CAD application for Windows, compatible with `.dwg` / `.dxf` files, with dedicated rebar tools (bars, welded mesh, layout).

## Téléchargement / Download
Voir / see [Releases](https://github.com/Alcide-cad/Alcide/releases).

### Windows SmartScreen
Tant que la signature de code n'est pas active, Windows peut afficher « Windows a protégé votre ordinateur ». Cliquez sur **Informations complémentaires**, puis **Exécuter quand même**.

Until code signing is active, Windows may show “Windows a protégé votre ordinateur”. Click **More info**, then **Run anyway**.

![Diagramme SmartScreen : Informations complémentaires, puis Exécuter quand même](docs/windows-smartscreen.svg)

## Structure
- `app/` — interface Electron (`main.cjs`, `index.html`, JS/CSS) et sources Python du moteur (`engine.py`, `dwg_export.py`, …)
- `engine/` — `requirements.txt` et spec PyInstaller du moteur `alcide-engine`
- `installer/` — script Inno Setup et images
- `third_party/` — récupération de LibreDWG et Poppler (import PDF) et liste des licences tierces
- `.github/workflows/build.yml` — compilation automatique de l'installeur
- `.signpath/` — configuration d'artefact SignPath (installeur)
- [PRIVACY.md](PRIVACY.md) — déclaration de confidentialité / privacy policy

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

## Code signing policy

**FR — Politique de signature du code**

Free code signing provided by [SignPath.io](https://about.signpath.io), certificate by [SignPath Foundation](https://signpath.org).

Signature de code gratuite fournie par [SignPath.io](https://about.signpath.io), certificat délivré par [SignPath Foundation](https://signpath.org).

- Committers and reviewers / Auteurs et relecteurs : [Alcide-cad](https://github.com/Alcide-cad) (Nicolas Scherer)
- Approvers / Approbateurs : [Alcide-cad](https://github.com/Alcide-cad) (Nicolas Scherer)

Every signed release is built by GitHub Actions from this repository and manually approved before signing.
Chaque version signée est compilée par GitHub Actions à partir de ce dépôt, puis approuvée manuellement avant la signature.

### Privacy policy

This program will not transfer any information to other networked systems unless specifically requested by the user or the person installing or operating it.

ALCIDE works fully offline. Drawings stay on your computer. It contains no telemetry, analytics or automatic update check. The only external link ("Buy me a coffee") opens your web browser when you click it.

ALCIDE fonctionne hors ligne : aucun fichier ni aucune donnée n'est envoyé sur Internet. Le seul lien externe (« Buy me a coffee ») ouvre votre navigateur uniquement si vous cliquez dessus.

Voir aussi / see also [PRIVACY.md](PRIVACY.md).

## Licence / License
GPL-3.0-or-later — voir / see [LICENSE](LICENSE). Composants tiers : [third_party/README.md](third_party/README.md).

© Nicolas Scherer
