# -*- mode: python ; coding: utf-8 -*-
import os
from PyInstaller.utils.hooks import collect_all, collect_submodules

datas = []
binaries = []
hiddenimports = ['orjson']
tmp_ret = collect_all('ezdxf')
datas += tmp_ret[0]; binaries += tmp_ret[1]; hiddenimports += tmp_ret[2]
tmp_ret = collect_all('shapely')
datas += tmp_ret[0]; binaries += tmp_ret[1]; hiddenimports += tmp_ret[2]
# ezdxf.addons.drawing imports PIL.Image at startup.
tmp_ret = collect_all('PIL')
datas += tmp_ret[0]; binaries += tmp_ret[1]; hiddenimports += tmp_ret[2]
# fontTools.ttLib loads table modules dynamically (fontTools.ttLib.tables.*).
hiddenimports += collect_submodules('fontTools')
# PDF import (1.0.17): pdfminer.six ships CMap data files; engine.py imports the PDF modules lazily.
tmp_ret = collect_all('pdfminer')
datas += tmp_ret[0]; binaries += tmp_ret[1]; hiddenimports += tmp_ret[2]
hiddenimports += ['pdf_vector_import', 'pdf_gpl_backend']
# MuPDF/PyMuPDF (AGPL) must never be bundled; ezdxf has an optional adapter for it.
excludes = ['fitz', 'pymupdf', 'pymupdf4llm', 'ezdxf.addons.drawing.pymupdf']


a = Analysis(
    [os.path.join(SPECPATH, '..', 'app', 'engine.py')],
    pathex=[os.path.join(SPECPATH, '..', 'app')],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=excludes,
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='alcide-engine',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='alcide-engine',
)
