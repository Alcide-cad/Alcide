from statistics import median
import math
from collections import Counter
from pathlib import Path
from tempfile import TemporaryDirectory
import re
from ezdxf import bbox, units
from ezdxf.math import Matrix44
from shapely.geometry import Polygon, LineString, Point
from shapely.ops import polygonize, unary_union
from allplan_fonds import clean_plan, is_column_base_plate
import dwg_export as io


def grid_angle(doc):
    groups={}
    for entity in doc.modelspace():
        if entity.dxftype()=='INSERT' and entity.dxf.name.startswith('GridLine-'):
            groups.setdefault(entity.dxf.name.rsplit(' - ',1)[-1],[]).extend(entity.virtual_entities())
        elif entity.dxf.layer.upper() in ('AXES','ARCHI_AXES','CHARPENTE_AXES'):
            groups.setdefault('',[]).append(entity)
    if not groups:return 0
    entities=max(groups.values(),key=lambda es:sum(e.dxftype() in ('TEXT','MTEXT') for e in es))
    families={}
    for line in entities:
        if line.dxftype()!='LINE':continue
        delta=line.dxf.end-line.dxf.start
        if delta.magnitude==0:continue
        angle=(math.degrees(math.atan2(delta.y,delta.x))+45)%90-45
        families.setdefault(round(angle,2),[]).append((delta.magnitude,angle))
    if not families:return 0
    dominant=max(families.values(),key=lambda rows:sum(length for length,_ in rows))
    return math.radians(median(angle for _,angle in dominant))


def axis_groups(doc):
    factor=units.conversion_factor(doc.units,4)
    groups={}
    local_axes={}
    for e in doc.modelspace():
        if e.dxftype()=='INSERT' and e.dxf.name.startswith('GridLine-'):
            group=e.dxf.name.rsplit(' - ',1)[-1]
            parts=list(e.virtual_entities())
            groups.setdefault(group,[]).extend(parts)
            for label in parts:
                if label.dxftype() not in ('TEXT','MTEXT'):continue
                name=label.plain_text().strip()
                j=0 if name and name[0].isdigit() else 1
                candidates=[line for line in parts if line.dxftype()=='LINE' and abs(line.dxf.start[j]-line.dxf.end[j])*factor<.1]
                if candidates:
                    longest=max(candidates,key=lambda line:line.dxf.start.distance(line.dxf.end))
                    local_axes[id(label)]=longest.dxf.start[j]*factor
        elif e.dxf.layer.upper() in ('AXES','ARCHI_AXES','CHARPENTE_AXES'):
            groups.setdefault('',[]).append(e)
    if not groups:
        raise ValueError("Aucun axe identifié dans le DWG.")
    entities=max(groups.values(),key=lambda es:sum(e.dxftype()=='TEXT' or e.dxftype()=='MTEXT' for e in es))
    axes={}
    for e in entities:
        if e.dxftype()!='LINE':continue
        a,b=e.dxf.start,e.dxf.end
        if a.distance(b)*factor<1000:continue
        j=0 if abs(a.x-b.x)*factor<.1 else 1 if abs(a.y-b.y)*factor<.1 else None
        if j is not None:axes.setdefault(j,set()).add(a[j]*factor)
    labels={}
    for e in entities:
        if e.dxftype() not in ('TEXT','MTEXT'):continue
        name=e.plain_text().strip().upper().replace('’',"'")
        if not re.fullmatch(r"[A-Z]{1,2}'?|\d{1,3}'?",name):continue
        j=0 if name[0].isdigit() else 1
        point=e.dxf.insert[j]*factor
        if not axes.get(j):continue
        coordinate=local_axes.get(id(e),min(axes[j],key=lambda x:abs(x-point)))
        labels.setdefault((j,name),[]).append(coordinate)
    labels={k:median(v) for k,v in labels.items()}
    if entities is groups.get(''):
        for (j,name),point in list(labels.items()):
            if not name.endswith("'") or labels.get((j,name[:-1]))!=point:continue
            nearby=[x for x in axes[j] if 5<abs(x-point)<300]
            if nearby:labels[j,name]=min(nearby,key=lambda x:abs(x-point))
    return factor,entities,labels


def plate_shapes(ifc):
    import ifcopenshell
    import ifcopenshell.geom
    import numpy as np
    doc=ifcopenshell.open(str(ifc))
    settings=ifcopenshell.geom.settings();settings.set('use-world-coords',True)
    from ifcopenshell.util.placement import get_local_placement
    from ifcopenshell.util.unit import calculate_unit_scale
    unit=calculate_unit_scale(doc)*1000
    fasteners=[]
    for fastener in doc.by_type("IfcMechanicalFastener"):
        if not fastener.ObjectPlacement or not fastener.NominalDiameter:continue
        placement=get_local_placement(fastener.ObjectPlacement)
        x,y,z=placement[:3,3]*unit
        fasteners.append((float(x),float(y),float(z),float(fastener.NominalDiameter)*unit,fastener))
    candidates=[]
    for e in doc.by_type('IfcElement'):
        if not e.Representation or not is_column_base_plate(e.Name or ''):continue
        shape=ifcopenshell.geom.create_shape(settings,e)
        v=np.array(shape.geometry.verts).reshape(-1,3)*1000
        span=v.max(0)-v.min(0)
        if min(span[:2])<150 or max(span[:2])>2000 or not 5<=span[2]<=80:continue
        faces=np.array(shape.geometry.faces).reshape(-1,3)
        triangles=[Polygon(v[a,:2]) for a in faces]
        geom=unary_union([q for q in triangles if q.area>1e-5])
        if geom.geom_type=='Polygon':
            zlo,zhi=v[:,2].min(),v[:,2].max()
            outer=Polygon(geom.exterior)
            bolts={}
            for x,y,z,diam,fastener in fasteners:
                if abs(z-zhi)>.2 or not outer.covers(Point(x,y)) or not fastener.Representation:continue
                solid=ifcopenshell.geom.create_shape(settings,fastener)
                vertices=np.array(solid.geometry.verts).reshape(-1,3)*1000
                lo,hi=vertices.min(0),vertices.max(0)
                if max((hi-lo)[:2])>1.6*diam or max(abs((hi+lo)[:2]/2-[x,y]))>1:continue
                bolts[round(x,2),round(y,2)]=diam
            candidates.append((round(float(zlo),2),geom,bolts))
    if not candidates:raise ValueError("Aucune platine horizontale identifiée dans l’IFC.")
    return candidates


def match_plates(steel, factor, ifc, axis_entities):
    # Compare les contours IFC aux contours fermés du dessin d’implantation.
    axis_box=bbox.extents(axis_entities)
    candidates=plate_shapes(ifc)
    drawing=[]
    for e in steel.modelspace():
        if e.dxftype()!='INSERT' or not (is_column_base_plate(e.dxf.name) or e.dxf.name.startswith('Part-')):continue
        parts=[LineString([(p.x*factor,p.y*factor) for p in (v.dxf.start,v.dxf.end)])
               for v in e.virtual_entities() if v.dxftype()=='LINE']
        if not parts:continue
        box=unary_union(parts).bounds
        if not (axis_box.extmin.x*factor<=box[0]<=axis_box.extmax.x*factor and axis_box.extmin.y*factor<=box[1]<=axis_box.extmax.y*factor):continue
        if not (150<=box[2]-box[0]<=2000 and 150<=box[3]-box[1]<=2000):continue
        for g in polygonize(unary_union(parts)):
            if g.area>=20000:drawing.append(g)
    votes={}
    for i,(_,g,_) in enumerate(candidates):
        w,h=g.bounds[2]-g.bounds[0],g.bounds[3]-g.bounds[1]
        for k in drawing:
            x,y,X,Y=k.bounds
            if abs(X-x-w)>.5 or abs(Y-y-h)>.5 or abs(k.area/g.area-1)>.02:continue
            dx,dy=x-g.bounds[0],y-g.bounds[1]
            bucket=(round(dx/2),round(dy/2))
            votes.setdefault(bucket,{})[i]=(dx,dy)
    ranked=sorted(votes.values(),key=len,reverse=True)
    if not ranked or len(ranked[0])<4 or (len(ranked)>1 and len(ranked[0])==len(ranked[1])):
        raise ValueError("Le recalage IFC sur l’implantation est ambigu.")
    best=ranked[0]
    dx,dy=(median(v[j] for v in best.values()) for j in (0,1))
    levels={candidates[i][0] for i in best}
    limits=(axis_box.extmin.x*factor,axis_box.extmin.y*factor,axis_box.extmax.x*factor,axis_box.extmax.y*factor)
    def in_view(g):
        x,y,X,Y=g.bounds
        return limits[0]<=x+dx and limits[1]<=y+dy and X+dx<=limits[2] and Y+dy<=limits[3]
    plates=[(z,[(x+dx,y+dy) for x,y in g.exterior.coords[:-1]],[(x+dx,y+dy,diam) for (x,y),diam in bolts.items()]) for z,g,bolts in candidates if z in levels and in_view(g)]
    return plates,len(best)


def prepare(arch_path, steel_path, ifc=None):
    arch,doc=clean_plan(arch_path)
    steel=io.source_document(steel_path)
    arch_angle,steel_angle=grid_angle(arch),grid_angle(steel)
    for source,angle in ((arch,arch_angle),(steel,steel_angle)):
        if abs(angle)<1e-8:continue
        matrix=Matrix44.z_rotate(-angle)
        for entity in source.modelspace():
            if entity.dxftype() in ('INSERT','LINE','TEXT','MTEXT','ARC','CIRCLE','LWPOLYLINE'):
                entity.transform(matrix)
    af,ae,aa=axis_groups(arch);sf,se,sa=axis_groups(steel)
    common=sorted(aa.keys()&sa.keys())
    groups=[[aa[k]-sa[k] for k in common if k[0]==j and not k[1].endswith("'")] for j in (0,1)]
    if min(map(len,groups))<2:raise ValueError("Il faut deux axes communs par direction.")
    dx,dy=map(median,groups)
    offsets=[dx,dy]
    gaps=[(name,round(sa[j,name]+offsets[j]-aa[j,name],2)) for j,name in common]
    if any(sum(abs(v-offsets[j])<5 for v in g)<=len(g)/2 for j,g in enumerate(groups)):
        raise ValueError("Les axes communs ne permettent pas un recalage fiable par translation.")
    plates,anchors=match_plates(steel,sf,ifc,se) if ifc else ([],0)
    m=doc.modelspace()
    for layer,color in [('ARCHI_AXES',4),('CHARPENTE_AXES',6),('PLATINES',8)]:
        if layer not in doc.layers:doc.layers.new(layer,dxfattribs={'color':color,'lineweight':5})
    for entities,layer,scale,x,y in [(ae,'ARCHI_AXES',1,0,0),(se,'CHARPENTE_AXES',sf/af,dx/af,dy/af)]:
        transform=Matrix44.chain(Matrix44.scale(scale),Matrix44.translate(x,y,0),Matrix44.z_rotate(arch_angle))
        for entity in entities:
            if entity.dxftype() not in ('LINE','TEXT','MTEXT','ARC','CIRCLE'):continue
            m.add_foreign_entity(entity,copy=True)
            target=m[-1];target.transform(transform);target.dxf.layer=layer;target.dxf.color=256
            target.dxf.discard('true_color');target.dxf.lineweight=-1;target.dxf.linetype='BYLAYER'
    if not ifc:
        transform=Matrix44.chain(Matrix44.scale(sf/af),Matrix44.translate(dx/af,dy/af,0),Matrix44.z_rotate(arch_angle))
        for e in steel.modelspace():
            if not is_column_base_plate(e.dxf.layer) or e.dxftype() not in ('LINE','ARC','CIRCLE','LWPOLYLINE'):continue
            m.add_foreign_entity(e,copy=True)
            v=m[-1];v.transform(transform);v.dxf.layer='PLATINES';v.dxf.color=256
            v.dxf.discard('true_color');v.dxf.lineweight=-1;v.dxf.linetype='BYLAYER'
    if any(bolts for _,_,bolts in plates):
        doc.layers.new('ANCRAGES',dxfattribs={'color':7,'lineweight':5})
    to_arch=Matrix44.chain(Matrix44.translate(dx,dy,0),Matrix44.scale(1/af),Matrix44.z_rotate(arch_angle))
    for _,xy,bolts in plates:
        m.add_lwpolyline([tuple(to_arch.transform((x,y,0)))[:2] for x,y in xy],close=True,dxfattribs={'layer':'PLATINES'})
        for x,y,diam in bolts:
            m.add_circle(to_arch.transform((x,y,0)),diam/(2*af),dxfattribs={'layer':'ANCRAGES'})
    return doc,dict(gaps=gaps,rotation=round(math.degrees(arch_angle-steel_angle),6),plates=len(plates),anchorCounts=dict(Counter(len(b) for _,_,b in plates)),levels=dict(Counter(z for z,_,_ in plates)),anchors=anchors,plateEntities=len(m.query('*[layer=="PLATINES"]')))


def export(arch,steel,ifc,target):
    doc,report=prepare(arch,steel,ifc)
    write_prepared(doc,(arch,steel),target)
    return report


def write_prepared(doc,sources,target,expected_target_hash=None):
    target=Path(target)
    if any(target.resolve()==Path(f).resolve() for f in sources):raise ValueError("Choisissez un nouveau fichier DWG.")
    with TemporaryDirectory(dir=target.parent) as tmp:
        dxf=Path(tmp)/'fond.dxf';dwg=dxf.with_suffix('.dwg')
        doc.saveas(dxf);io.convert(dxf,dwg,'DWG')
        back=io.source_document(dwg)
        counts=lambda d:Counter((e.dxftype(),e.dxf.layer) for e in d.modelspace())
        if counts(back)!=counts(doc) or back.layers.get('PLATINES').dxf.lineweight!=5:
            raise ValueError("Le contrôle du DWG combiné a échoué.")
        if expected_target_hash is None:
            dwg.rename(target)
            return {'path':str(target)}
        return io.publish_file(dwg,target,backup=True,expected_target_hash=expected_target_hash)

_pending = None


def preview(arch, steel, ifc=None):
    from uuid import uuid4
    global _pending
    _pending = None
    doc, report = prepare(arch,steel,ifc)
    token = uuid4().hex
    _pending = token, doc, (arch,steel)
    return {**report,'previewToken':token}


def export_preview(token, target, expected_target_hash=None):
    current = _pending
    if not current or not token or current[0]!=token:
        raise ValueError("L’aperçu a expiré. Relancez la comparaison.")
    _, doc, sources = current
    result=write_prepared(doc,sources,target,expected_target_hash)
    discard_preview(token)
    return result


def discard_preview(token):
    global _pending
    if _pending and _pending[0]==token:
        _pending=None
    return True
