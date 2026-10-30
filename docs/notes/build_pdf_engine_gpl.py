"""Portable engine rebuild from the exported Sources directory."""
from pathlib import Path
import PyInstaller.__main__
root=Path(__file__).resolve().parent
PyInstaller.__main__.run([str(root/'engine.py'),'--noconfirm','--onedir','--name','alcide-engine','--distpath',str(root/'build-gpl/dist'),'--workpath',str(root/'build-gpl/work'),'--specpath',str(root/'build-gpl'),'--collect-all','ezdxf','--collect-all','shapely','--collect-all','pdfminer','--exclude-module','pymupdf','--exclude-module','fitz','--exclude-module','pymupdf4llm','--exclude-module','ezdxf.addons.drawing.pymupdf'])
