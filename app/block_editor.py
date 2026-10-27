"""Edit a block definition in a detached drawing, preserving its references."""
import os,tempfile,uuid,re
from pathlib import Path
import ezdxf
from ezdxf.addons import Importer
from collections import Counter

def root():
    path=Path(os.environ.get('LOCALAPPDATA',tempfile.gettempdir()))/'DWG-Alcide'/'block-edits';path.mkdir(parents=True,exist_ok=True);return path.resolve()
def path(label):return root()/(re.sub(r'[<>:"/\\|?*]','_',label)[:90]+'-'+uuid.uuid4().hex[:8]+'.dxf')
def begin(base,block_name):
    doc=ezdxf.readfile(base);doc.audit();block=doc.blocks.get(block_name)
    if block is None or not len(block):raise ValueError('Bloc vide ou introuvable.')
    copies=[e.copy() for e in block]
    for layout in doc.layouts:
        for entity in list(layout):layout.delete_entity(entity)
    for name,group in list(doc.groups):doc.groups.delete(name)
    model=doc.modelspace()
    for entity in copies:model.add_entity(entity)
    target=path('Bloc - '+block_name);doc.saveas(target)
    return dict(path=str(target),basePath=str(base),blockName=block_name)
def finish(base,block_name,edited):
    base=Path(base).resolve()
    if not base.is_relative_to(root()):raise ValueError('Session de bloc invalide.')
    doc=ezdxf.readfile(base);source=ezdxf.readfile(edited);doc.audit();source.audit();block=doc.blocks.get(block_name)
    if block is None:raise ValueError('La définition du bloc source a disparu.')
    entities=list(source.modelspace())
    if not entities:raise ValueError('Le bloc ne peut pas être vide.')
    for e in list(block):block.delete_entity(e)
    importer=Importer(source,doc);importer.import_entities(entities,target_layout=block);importer.finalize()
    if Counter(e.dxftype() for e in block)!=Counter(e.dxftype() for e in entities):raise ValueError('Certains objets ne peuvent pas être réintégrés dans un bloc ; copie rejetée.')
    auditor=doc.audit()
    if auditor.has_errors:raise ValueError('La définition modifiée ne passe pas le contrôle DXF.')
    target=path('Dessin - bloc mis à jour');doc.saveas(target)
    return dict(path=str(target),blockName=block_name,references=sum(e.dxf.name.lower()==block_name.lower() for e in doc.entitydb.values() if e.is_alive and e.dxftype()=='INSERT'))
