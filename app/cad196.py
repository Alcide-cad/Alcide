"""ALCIDE 1.0.96 · Objets CAO natifs : cotes rayon / diamètre / angulaire / longueur d'arc,
blocs nommés (BLOC, INSERER, attributs, ATTEDIT), WBLOC.

Chaque objet est produit comme un petit DXF autonome (même mécanisme que le presse-papiers 1.0.131) :
le dessin l'affiche avec le rendu du moteur et l'enregistrement l'importe en entité DXF/DWG native."""
from io import StringIO
from pathlib import Path
import math, re, tempfile
import ezdxf
from ezdxf.addons import Importer
from ezdxf.math import Vec2
import dwg_export

NAME_RE=re.compile(r'^[^<>/\\":;?*|=,`\x00-\x1f]{1,255}$')

def _num(v,name='valeur'):
    v=float(v)
    if not math.isfinite(v):raise ValueError(name+' incorrecte.')
    return v

def _pt(p):
    if not isinstance(p,(list,tuple)) or len(p)<2:raise ValueError('Point incorrect.')
    return (_num(p[0],'Coordonnée'),_num(p[1],'Coordonnée'))

def _snippet(engine):
    doc=ezdxf.new('R2018',setup=False)
    src=engine.DOC
    if src is not None:
        for key in ('$INSUNITS','$MEASUREMENT','$LUNITS','$DIMSCALE'):
            try:doc.header[key]=src.header.get(key,doc.header.get(key))
            except Exception:pass
    return doc

def _ensure_layer(doc,name,source=None):
    if not name or name in doc.layers:return
    attrs={'color':3}
    if source is not None and name in source.layers:
        layer=source.layers.get(name);attrs={'color':layer.dxf.get('color',7)}
        if layer.dxf.hasattr('true_color'):attrs['true_color']=layer.dxf.true_color
    doc.layers.new(name,dxfattribs=attrs)

def dimension_override(engine,doc,d):
    h=_num(d.get('height',2.5),'Hauteur de texte')
    if h<=0:raise ValueError('Hauteur de texte positive requise.')
    o={'dimtxt':h,'dimasz':h*.6,'dimclrd':0,'dimclre':0,'dimclrt':0,'dimdec':int(d.get('precision',2)),'dimlfac':float(d.get('factor',1)),'dimrnd':float(d.get('rounding',0)),'dimzin':8 if d.get('trimZeros') else 0,'dimdsep':44 if d.get('decimalComma') else 46,'dimadec':int(d.get('anglePrecision',3 if d.get('angleUnit')=='rad' else 1)),'dimaunit':{'grad':2,'rad':3}.get(d.get('angleUnit'),0)}
    o['dimtih']=o['dimtoh']=int(bool(d.get('textHorizontal',False)))
    o['dimtfill']=1 if d.get('textBackground',True) else 0
    try:o.update(engine.dimension_part_style(doc,d))
    except Exception:pass
    o['dimgap']=float(d.get('textGap',h*.22))
    for key,dxf in [('extensionGap','dimexo'),('extensionBeyond','dimexe'),('endSize','dimasz')]:
        if key in d:o[dxf]=float(d[key])
    if d.get('endStyle'):
        try:o.update(dimblk=engine.dimension_end_block(doc,d['endStyle']),dimtsz=0)
        except Exception:pass
    if d.get('fontFace'):
        try:o['dimtxsty']=engine.text_font(doc,d['fontFace'])
        except Exception:pass
    return o

def _angular_legs(l1,l2,w):
    """Oriente les deux côtés pour que l'angle mesuré (sens trigonométrique de line1 vers line2) contienne le point cliqué."""
    import math
    (x1,y1),(x2,y2)=l1[0][:2],l1[1][:2];(x3,y3),(x4,y4)=l2[0][:2],l2[1][:2]
    u=(x2-x1,y2-y1);v=(x4-x3,y4-y3);den=u[0]*v[1]-u[1]*v[0]
    if abs(den)<1e-12:raise ValueError('Les deux lignes sont parallèles.')
    t=((x3-x1)*v[1]-(y3-y1)*v[0])/den;V=(x1+u[0]*t,y1+u[1]*t)
    wa=math.atan2(w[1]-V[1],w[0]-V[0]);best=None
    pairs=[(a,b) for a in (u,(-u[0],-u[1])) for b in (v,(-v[0],-v[1]))];pairs+=[(b,a) for a,b in pairs]
    for a,b in pairs:
        if True:
            aa=math.atan2(a[1],a[0]);span=(math.atan2(b[1],b[0])-aa)%(2*math.pi)
            if span>=math.pi:continue
            inside=(wa-aa)%(2*math.pi)<=span
            if inside:best=(a,b);break
        if best:break
    if not best:return l1,l2
    a,b=best;R=max(math.hypot(w[0]-V[0],w[1]-V[1]),1e-6)
    # 1.0.97 : point de définition = point de la ligne réelle le plus proche du rayon de la cote (borné à ses extrémités) :
    # la flèche reste sur la ligne, et une ligne d'attache n'apparaît que si l'arc dépasse le bout de la ligne.
    def reach(d,seg):
        n=math.hypot(*d);ux,uy=d[0]/n,d[1]/n;ts=[(p[0]-V[0])*ux+(p[1]-V[1])*uy for p in seg]
        lo=max(0.0,min(ts));hi=max(ts)
        if hi<=1e-9:return (ux*R,uy*R)
        t=min(max(R,lo),hi);return (ux*max(t,1e-6),uy*max(t,1e-6))
    segs=[[q[:2] for q in l1],[q[:2] for q in l2]]
    def owner(d):
        c1=abs(d[0]*u[1]-d[1]*u[0])<=1e-9*math.hypot(*d)*math.hypot(*u)
        return segs[0] if c1 else segs[1]
    a=reach(a,owner(a));b=reach(b,owner(b));la=math.hypot(*a);lb=math.hypot(*b)
    return [(V[0],V[1],0.0),(V[0]+a[0]/la*max(la,1e-6),V[1]+a[1]/la*max(la,1e-6),0.0)],[(V[0],V[1],0.0),(V[0]+b[0]/lb*max(lb,1e-6),V[1]+b[1]/lb*max(lb,1e-6),0.0)]

def _add_dimension(engine,doc,spec):
    msp=doc.modelspace();kind=spec.get('kind');style=spec.get('style') or {}
    layer=spec.get('layer') or 'ALCIDE_COTES';_ensure_layer(doc,layer,engine.DOC)
    o=dimension_override(engine,doc,style);attrs={'layer':layer}
    loc=_pt(spec['location']) if spec.get('location') is not None else None
    if kind in ('radius','diameter'):
        c=_pt(spec['center']);r=_num(spec['radius'],'Rayon')
        if r<=0:raise ValueError('Rayon positif requis.')
        if loc is None:raise ValueError('Position du texte requise.')
        if kind=='radius':dim=msp.add_radius_dim(c,radius=r,location=loc,dimstyle='Standard',override=o,dxfattribs=attrs)
        else:dim=msp.add_diameter_dim(c,radius=r,location=loc,dimstyle='Standard',override=o,dxfattribs=attrs)
    elif kind=='angular':
        if spec.get('textHorizontal', style.get('textHorizontal', False)):
            attrs['text_rotation'] = 0.0
        if spec.get('center') is not None:
            c=_pt(spec['center']);base=_pt(spec.get('base') or spec['location'])
            l1,l2=_angular_legs([c,_pt(spec['p1'])],[c,_pt(spec['p2'])],base)
            dim=msp.add_angular_dim_3p(base,l1[0],l1[1],l2[1],location=loc,dimstyle='Standard',override=o,dxfattribs=attrs)
        else:
            l1=[_pt(p) for p in spec['line1']];l2=[_pt(p) for p in spec['line2']]
            base=_pt(spec.get('base') or spec['location']);l1,l2=_angular_legs(l1,l2,base)
            # Sommet + deux points : rendu ezdxf cohérent avec la mesure (la variante « 2 lignes » dessine parfois l'angle rentrant).
            dim=msp.add_angular_dim_3p(base,l1[0],l1[1],l2[1],location=loc,dimstyle='Standard',override=o,dxfattribs=attrs)
    elif kind=='arc':
        c=_pt(spec['center']);r=_num(spec['radius'],'Rayon')
        a0=_num(spec['start'],'Angle');a1=_num(spec['end'],'Angle')
        dist=_num(spec.get('distance',r*.25),'Distance')
        dim=msp.add_arc_dim_cra(c,r,a0,a1,dist,location=loc,dimstyle='Standard',override=o,dxfattribs=attrs)
    else:raise ValueError('Type de cote inconnu.')
    if spec.get('textOverride') not in (None,''):dim.dimension.dxf.text=str(spec['textOverride'])[:250]
    if kind=='angular':
        place_angular_text_outside(dim, loc)
    dim.render()
    return dim.dimension

def place_angular_text_outside(style, location):
    """Keep the dimension arc fixed and put the full text box outside it."""
    style['dimtmove'] = 2
    if location is not None:
        style.user_location_override(location)
    renderer = style.get_renderer()
    center = renderer.center_of_arc
    text = renderer.text_box
    normal = Vec2.from_angle((text.center - center).angle)
    extent = max((text.center - corner).dot(normal) for corner in text.corners)
    gap = max(renderer.measurement.text_gap, renderer.measurement.text_height * .18)
    style.user_location_override(center + normal * (renderer.dim_line_radius + extent + gap))


def _import_block(source,doc,name):
    if name in doc.blocks:return
    if source is None or name not in source.blocks:raise ValueError('Bloc introuvable : '+name)
    imp=Importer(source,doc);imp.import_block(name,rename=False);imp.finalize()

def _block_source(engine,spec):
    if spec.get('source')=='data':
        text=spec.get('data')
        if not isinstance(text,str) or len(text)>40000000:raise ValueError('Définition du bloc manquante.')
        src=ezdxf.read(StringIO(text));dwg_export.declare_missing_layers(src);return src
    engine.require_doc(full=True);return engine.DOC

def attdefs(block):
    out=[]
    for e in block:
        if e.dxftype()=='ATTDEF':
            out.append({'tag':e.dxf.tag,'prompt':e.dxf.get('prompt','') or e.dxf.tag,'default':e.dxf.get('text',''),'constant':bool(e.dxf.get('flags',0)&2)})
    return out

def _add_insert(engine,doc,spec):
    name=str(spec.get('block',''))
    if not name:raise ValueError('Nom de bloc requis.')
    src=_block_source(engine,spec);_import_block(src,doc,name)
    layer=spec.get('layer') or '0';_ensure_layer(doc,layer,engine.DOC)
    sx=_num(spec.get('scale',1),'Échelle');sy=_num(spec.get('scaleY',sx),'Échelle')
    if sx==0 or sy==0:raise ValueError('Échelle non nulle requise.')
    ins=doc.modelspace().add_blockref(name,_pt(spec['at']),dxfattribs={'layer':layer,'xscale':sx,'yscale':sy,'rotation':_num(spec.get('rotation',0),'Rotation')})
    values={str(k):str(v) for k,v in (spec.get('attribs') or {}).items()}
    block=doc.blocks.get(name)
    if any(e.dxftype()=='ATTDEF' for e in block):ins.add_auto_attribs(values)
    return ins

def _result(engine,doc,extra=None):
    text=StringIO();doc.write(text);blob=text.getvalue()
    if len(blob)>40000000:raise ValueError('Objet trop volumineux.')
    previous=(engine.DOC,engine.SOURCE,engine.WARNINGS)
    try:
        engine.DOC=doc;engine.SOURCE='cad196.dxf';engine.WARNINGS=[]
        scene=engine.scene('Model')
    finally:engine.DOC,engine.SOURCE,engine.WARNINGS=previous
    out={'dxf':blob,'scene':scene}
    if extra:out.update(extra)
    return out

def make(engine,r):
    specs=r.get('specs') or []
    if not specs or len(specs)>500:raise ValueError('Objets à créer incorrects.')
    doc=_snippet(engine);made=[]
    for spec in specs:
        if spec.get('kind') in ('radius','diameter','angular','arc'):made.append(_add_dimension(engine,doc,spec))
        elif spec.get('kind')=='insert':made.append(_add_insert(engine,doc,spec))
        else:raise ValueError('Objet inconnu.')
    return _result(engine,doc,{'handles':[e.dxf.handle for e in made]})

def block(engine,r):
    name=str(r.get('name','')).strip()
    if not NAME_RE.match(name) or name.startswith('*'):raise ValueError('Nom de bloc incorrect (caractères < > / \\ " : ; ? * | = , interdits).')
    engine.require_doc(full=True)
    if any(b.name.lower()==name.lower() for b in engine.DOC.blocks):raise ValueError('Un bloc « '+name+' » existe déjà dans ce dessin.')
    for other in r.get('takenNames',[]):
        if str(other).lower()==name.lower():raise ValueError('Un bloc « '+name+' » existe déjà dans ce dessin.')
    ids=r.get('ids',[])
    if not isinstance(ids,list) or not ids:raise ValueError('Sélectionnez les objets du bloc.')
    base=_pt(r.get('base',[0,0]))
    doc=_fast_selection(engine,r,ids)
    if doc is None:
        full=engine.export_selection_doc(r.get('changes',{}),r.get('dimensions',[]),r.get('edits',{}),r.get('layerChanges',{}),ids)
        # Ne garder que la sélection et ses ressources (pas les ~milliers de blocs du plan).
        from ezdxf import xref
        doc=_snippet(engine);loader=xref.Loader(full,doc,conflict_policy=xref.ConflictPolicy.KEEP);loader.load_modelspace();loader.execute()
    msp=doc.modelspace();blk=doc.blocks.new(name,base_point=(0,0,0))
    content=[e for e in msp]
    if not content:raise ValueError('Aucun objet exportable dans la sélection.')
    for e in content:
        msp.move_to_layout(e,blk);e.translate(-base[0],-base[1],0)
    for a in r.get('attdefs') or []:
        tag=re.sub(r'\s+','_',str(a.get('tag','')).strip().upper())
        if not tag or not re.match(r'^[A-Z0-9_\-]{1,64}$',tag):raise ValueError('Étiquette d’attribut incorrecte : '+str(a.get('tag','')))
        h=_num(a.get('height',2.5),'Hauteur');at=_pt(a.get('at',base))
        d=blk.add_attdef(tag,(at[0]-base[0],at[1]-base[1]),dxfattribs={'height':h,'prompt':str(a.get('prompt') or tag)[:255],'layer':'0'})
        d.dxf.text=str(a.get('default',''))[:255]
    if r.get('description'):blk.block.dxf.description=str(r['description'])[:255]
    layer=r.get('layer') or '0';_ensure_layer(doc,layer,engine.DOC)
    ins=msp.add_blockref(name,base,dxfattribs={'layer':layer})
    if any(e.dxftype()=='ATTDEF' for e in blk):ins.add_auto_attribs({str(k):str(v) for k,v in (r.get('values') or {}).items()})
    return _result(engine,doc,{'handles':[ins.dxf.handle],'block':name,'attdefs':attdefs(blk)})

# Clés d'édition sans effet sur la géométrie/l'aspect exportés d'un objet natif (ou de sa copie).
_NEUTRAL={'dx','dy','groupId','selected','layout','source'}
def _same_geometry(e,geo):
    # Copie ALCIDE d'une ligne/polyligne : « geometry » = sommets de la source quand ils n'ont pas été modifiés.
    pts=(geo or {}).get('points') if isinstance(geo,dict) else None
    if not pts or set(geo)-{'points'}:return False
    try:
        if e.dxftype()=='LINE':ref=[tuple(e.dxf.start)[:2],tuple(e.dxf.end)[:2]]
        elif e.dxftype()=='LWPOLYLINE':
            if any(abs(b)>1e-12 for *_,b in e.get_points('xyb')):return False
            ref=[tuple(p) for p in e.get_points('xy')]
        else:return False
        return len(ref)==len(pts) and all(abs(a[0]-b[0])<=1e-9*max(1,abs(a[0]))+1e-9 and abs(a[1]-b[1])<=1e-9*max(1,abs(a[1]))+1e-9 for a,b in zip(ref,pts))
    except Exception:return False
def _fast_selection(engine,r,ids):
    # 1.0.96 : objets natifs du dessin (ou leurs copies ALCIDE) non modifiés sauf déplacement : import direct des
    # seules entités et de leurs ressources (calques, types de ligne, styles, blocs référencés) — pas de copie du dessin.
    edits=r.get('edits') or {};changes=r.get('changes') or {};src=engine.DOC
    if src is None or not ids:return None
    msp=src.modelspace();rows=[]
    for h in ids:
        if not isinstance(h,str) or h in changes:return None
        ed=edits.get(h) or {}
        s=ed.get('source') if h.startswith('@') else h
        if not isinstance(s,str) or s.startswith('@'):return None
        e=src.entitydb.get(s)
        if e is None or not e.is_alive or e.dxf.owner!=msp.block_record_handle:return None
        if e.dxftype() in ('HATCH','MPOLYGON','VIEWPORT','ACAD_TABLE'):return None
        for k,v in ed.items():
            if k in _NEUTRAL or v in (None,False,{},[],0):continue
            if k=='geometry' and _same_geometry(e,v):continue
            return None
        rows.append((s,float(ed.get('dx') or 0),float(ed.get('dy') or 0)))
    from ezdxf import xref
    wanted={s for s,_,_ in rows}
    doc=_snippet(engine)
    loader=xref.Loader(src,doc,conflict_policy=xref.ConflictPolicy.KEEP)
    loader.load_modelspace(filter_fn=lambda e:e.dxf.handle in wanted);loader.execute()
    out=list(doc.modelspace())
    if len(out)!=len(wanted):return None
    order=[h for h in (e.dxf.handle for e in msp) if h in wanted];by=dict(zip(order,out));used=set()
    for s,dx,dy in rows:
        e=by[s]
        if s in used:e=e.copy();doc.modelspace().add_entity(e)
        used.add(s)
        if dx or dy:e.translate(dx,dy,0)
    return doc
def _thumb(block,limit=600):
    from ezdxf import disassemble, path as zpath
    paths=[];n=0
    try:
        for prim in disassemble.recursive_decompose(block):
            pass
    except Exception:pass
    try:
        for prim in disassemble.to_primitives(disassemble.recursive_decompose(block)):
            p=prim.path
            if p is None:continue
            for sub in p.sub_paths():
                pts=[(round(v.x,4),round(v.y,4)) for v in sub.flattening(0.01*max(1e-9,1))]
                if len(pts)>1:paths.append(pts[:200]);n+=len(pts)
            if n>limit:break
    except Exception:return []
    return paths

def blocks(engine,r):
    engine.require_doc(full=True);out=[]
    for b in engine.DOC.blocks:
        name=b.name
        if name.startswith('*') or b.block_record.is_any_layout or b.block.dxf.get('flags',0)&(4|8|16):continue
        if name.upper().startswith(('ALCIDE','_')) and not r.get('all'):continue
        if len(out)>=300:break
        uses=0
        out.append({'name':name,'attdefs':attdefs(b),'count':len(b),'paths':_thumb(b) if r.get('thumbs',True) else []})
    counts={}
    for e in engine.DOC.modelspace().query('INSERT'):counts[e.dxf.name]=counts.get(e.dxf.name,0)+1
    for b in out:b['uses']=counts.get(b['name'],0)
    return {'blocks':sorted(out,key=lambda b:b['name'].lower())}

def attribs(engine,r):
    engine.require_doc(full=True);e=engine.DOC.entitydb.get(r.get('handle',''))
    if e is None or e.dxftype()!='INSERT':raise ValueError('Bloc introuvable.')
    blk=engine.DOC.blocks.get(e.dxf.name);defs={d['tag']:d for d in attdefs(blk)} if blk else {}
    return {'name':e.dxf.name,'insert':list(e.dxf.insert)[:2],'rotation':float(e.dxf.get('rotation',0)),'layer':e.dxf.layer,'attdefs':list(defs.values()),'attribs':[{'tag':a.dxf.tag,'value':a.dxf.text,'prompt':defs.get(a.dxf.tag,{}).get('prompt',a.dxf.tag)} for a in e.attribs]}

def attpreview(engine,r):
    """Rendu d'une référence de bloc du dessin avec de nouvelles valeurs d'attributs."""
    from ezdxf.addons.drawing import RenderContext
    from ezdxf.addons.drawing.config import Configuration
    engine.require_doc(full=True);DOC=engine.DOC
    original=DOC.entitydb.get(r.get('source',''))
    if original is None or original.dxftype()!='INSERT':raise ValueError('Bloc introuvable.')
    engine.prepare_native_fonts(DOC);ctx=RenderContext(DOC)
    ctx.set_layer_properties_override(lambda layers:[setattr(layer,'is_visible',True) for layer in layers])
    e=original.copy();handle=r['id'];e.dxf.handle=handle
    values={str(k):str(v) for k,v in (r.get('values') or {}).items()}
    for a in e.attribs:
        if a.dxf.tag in values:a.dxf.text=values[a.dxf.tag]
    meta=engine.metadata(e,original.get_layout().name,DOC);meta['id']=handle
    backend=engine.SceneBackend({handle:meta})
    frontend=engine.RepeatedTextFrontend(ctx,backend,config=Configuration());frontend._alcide_backend=backend
    frontend.draw_entities([e])
    item=backend.items.get(handle)
    if not item:raise ValueError('Le bloc ne produit pas de géométrie visible.')
    return item

def wblock(engine,r):
    path=Path(str(r.get('path','')))
    if path.suffix.lower() not in ('.dxf','.dwg'):raise ValueError('Choisissez un fichier DWG ou DXF.')
    ids=r.get('ids',[])
    if not ids:raise ValueError('Sélectionnez les objets à écrire.')
    base=r.get('base')
    if base is None:
        return engine.export(str(path),r.get('changes',{}),r.get('dimensions',[]),r.get('edits',{}),r.get('layerChanges',{}),r.get('reinforcement',[]),selection=ids)
    # Point de base : les objets sont décalés pour que le point choisi devienne l'origine du fichier.
    base=_pt(base)
    with tempfile.TemporaryDirectory(prefix='alcide-wblock196-') as folder:
        t=Path(folder)/'w.dxf'
        engine.export(str(t),r.get('changes',{}),r.get('dimensions',[]),r.get('edits',{}),r.get('layerChanges',{}),r.get('reinforcement',[]),selection=ids)
        doc=ezdxf.readfile(t)
        for e in doc.modelspace():e.translate(-base[0],-base[1],0)
        doc.header['$INSBASE']=(0,0,0)
        t2=Path(folder)/'w2.dxf';doc.saveas(t2)
        if path.suffix.lower()=='.dxf':
            import shutil;shutil.copyfile(t2,path);return {'path':str(path),'entities':len(doc.modelspace())}
        return dwg_export.publish(doc,path,backup=False)

def explode(engine,r):
    """Décompose seulement les références de bloc choisies (un niveau, comme AutoCAD). Les attributs deviennent des textes."""
    ids=r.get('ids',[])
    if not isinstance(ids,list) or not ids:raise ValueError('Sélectionnez les blocs à décomposer.')
    with tempfile.TemporaryDirectory(prefix='alcide-explode196-') as folder:
        target=Path(folder)/'x.dxf'
        engine.export(str(target),r.get('changes',{}),r.get('dimensions',[]),r.get('edits',{}),r.get('layerChanges',{}),selection=ids)
        doc=ezdxf.readfile(target)
    msp=doc.modelspace();n=0
    for layout in list(doc.layouts):
        if layout.name=='Model':continue
        for e in list(layout):
            if e.dxftype()!='VIEWPORT':layout.move_to_layout(e,msp)
    for e in list(msp.query('INSERT')):
        try:e.explode();n+=1
        except Exception:pass
    if not n:raise ValueError('Aucune référence de bloc décomposable dans la sélection.')
    return _result(engine,doc,{'exploded':n})

def attedit(engine,r):
    """Recrée une référence de bloc du dessin avec de nouvelles valeurs d’attributs (position / rotation finales fournies)."""
    engine.require_doc(full=True);e=engine.DOC.entitydb.get(r.get('handle',''))
    if e is None or e.dxftype()!='INSERT':raise ValueError('Bloc introuvable.')
    values={a.dxf.tag:a.dxf.text for a in e.attribs};values.update({str(k):str(v) for k,v in (r.get('values') or {}).items()})
    spec={'kind':'insert','block':e.dxf.name,'source':'doc','at':r.get('at') or list(e.dxf.insert)[:2],'scale':e.dxf.get('xscale',1),'scaleY':e.dxf.get('yscale',1),'rotation':float(e.dxf.get('rotation',0))+float(r.get('rotation',0) or 0),'layer':r.get('layer') or e.dxf.layer,'attribs':values}
    doc=_snippet(engine);ins=_add_insert(engine,doc,spec)
    return _result(engine,doc,{'handles':[ins.dxf.handle],'spec':spec})

def run(engine,r):
    op=r.get('op')
    if op=='make':return make(engine,r)
    if op=='block':return block(engine,r)
    if op=='blocks':return blocks(engine,r)
    if op=='attribs':return attribs(engine,r)
    if op=='attpreview':return attpreview(engine,r)
    if op=='wblock':return wblock(engine,r)
    if op=='explode':return explode(engine,r)
    if op=='attedit':return attedit(engine,r)
    raise ValueError('Opération CAO inconnue.')
