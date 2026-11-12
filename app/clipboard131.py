"""Self-contained CAD clipboard: native DXF resources and isolated import."""
from io import StringIO
from pathlib import Path
import tempfile
import ezdxf
from ezdxf import xref

def capture(engine,r):
    ids=r.get('ids',[])
    if not isinstance(ids,list) or not ids or len(ids)>100000:raise ValueError('Sélection de copie incorrecte.')
    with tempfile.TemporaryDirectory(prefix='alcide-clipboard-') as folder:
        target=Path(folder)/'clipboard.dxf'
        engine.export(str(target),r.get('changes',{}),r.get('dimensions',[]),r.get('edits',{}),r.get('layerChanges',{}),selection=ids)
        doc=ezdxf.readfile(target)
        # Clipboard is modelspace content, regardless of its source layout.
        for layout in list(doc.layouts):
            if layout.name=='Model':continue
            for e in list(layout):
                if e.dxftype()!='VIEWPORT':layout.move_to_layout(e,doc.modelspace())
        text=StringIO();doc.write(text);blob=text.getvalue()
        if len(blob)>40000000:raise ValueError('Sélection trop volumineuse pour le presse-papiers.')
        previous=(engine.DOC,engine.SOURCE,engine.WARNINGS)
        try:
            engine.DOC=doc;engine.SOURCE=str(target);engine.WARNINGS=[]
            scene=engine.scene('Model')
        finally:engine.DOC,engine.SOURCE,engine.WARNINGS=previous
        return {'dxf':blob,'scene':scene}

def import_edits(out,edits,copies):
    groups={}
    for key,edit in edits.items():
        ref=edit.get('clipboard131')
        if ref and not edit.get('deleted') and not edit.get('omitFromExport'):groups.setdefault(ref['dataId'],[]).append((key,edit))
    for data_id,rows in groups.items():
        text=edits.get(data_id,{}).get('clipboardData131')
        if not isinstance(text,str) or len(text)>40000000:raise ValueError('Contenu du presse-papiers manquant.')
        src=ezdxf.read(StringIO(text));original=list(src.modelspace());layout=out.modelspace();before=set(e.dxf.handle for e in layout)
        loader=xref.Loader(src,out,conflict_policy=xref.ConflictPolicy.NUM_PREFIX);loader.load_modelspace();loader.execute()
        imported=[e for e in layout if e.dxf.handle not in before]
        if len(imported)!=len(original):raise ValueError('Import incomplet : le dessin ne sera pas enregistré.')
        mapping={e.dxf.handle:n for e,n in zip(original,imported)};used=set()
        for key,edit in rows:
            source=mapping.get(edit['clipboard131']['handle'])
            if source is None:raise ValueError('Objet du presse-papiers introuvable.')
            if source.dxf.handle in used:e=source.copy();layout.add_entity(e)
            else:e=source;used.add(source.dxf.handle)
            dest=out.layouts.get(edit.get('layout','Model'))
            if dest!=layout:layout.move_to_layout(e,dest)
            copies[key]=e
        for e in imported:
            if e.dxf.handle not in used:layout.delete_entity(e)


def rescale(engine,r):
    import math
    from ezdxf.math import Matrix44
    text=r.get('dxf');factor=float(r.get('factor',0))
    if not isinstance(text,str) or len(text)>40000000 or not math.isfinite(factor) or not 1e-6<=factor<=1e6:raise ValueError('Conversion d’unités incorrecte.')
    doc=ezdxf.read(StringIO(text))
    for e in doc.modelspace():e.transform(Matrix44.scale(factor))
    doc.header['$INSUNITS']=int(r.get('unitCode',0))
    stream=StringIO();doc.write(stream);previous=(engine.DOC,engine.SOURCE,engine.WARNINGS)
    backend=engine.SceneBackend;draw_path,draw_filled=backend.draw_path,backend.draw_filled_paths
    try:
        # Keep the same graphical precision relative to the source units.
        tolerance=.03*factor
        backend.draw_path=lambda self,path,properties:self.add([list(p.flattening(tolerance)) for p in path.sub_paths()],properties)
        backend.draw_filled_paths=lambda self,paths,properties:self.add([list(p.flattening(tolerance)) for path in paths for p in path.sub_paths()],properties,True)
        engine.DOC=doc;engine.SOURCE='clipboard.dxf';engine.WARNINGS=[];scene=engine.scene('Model')
    finally:
        backend.draw_path,backend.draw_filled_paths=draw_path,draw_filled
        engine.DOC,engine.SOURCE,engine.WARNINGS=previous
    return {'dxf':stream.getvalue(),'scene':scene}
