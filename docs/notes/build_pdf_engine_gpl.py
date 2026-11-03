"""Portable engine rebuild from the exported Sources directory."""
from pathlib import Path
import sys
import ezdxf
if sys.version_info<(3,11):raise SystemExit("Build the engine with Python 3.11 or newer (3.12 validated).")
if not ezdxf.options.use_c_ext:raise SystemExit("Install the native ezdxf wheel before building: C extensions required for the validated engine.")
import PyInstaller.__main__
root=Path(__file__).resolve().parent
PyInstaller.__main__.run([str(root/'engine.py'),'--noconfirm','--onedir','--name','alcide-engine','--distpath',str(root/'build-gpl/dist'),'--workpath',str(root/'build-gpl/work'),'--specpath',str(root/'build-gpl'),'--collect-all','ezdxf','--collect-all','shapely','--collect-all','pdfminer','--exclude-module','pymupdf','--exclude-module','fitz','--exclude-module','pymupdf4llm','--exclude-module','ezdxf.addons.drawing.pymupdf'])
