from pathlib import Path
from tempfile import TemporaryDirectory
from collections import Counter
import re
import ezdxf
from ezdxf import bbox
from ezdxf.math import Vec2,is_point_in_polygon_2d
from shapely.geometry import Point
import dwg_export as io
from ezdxf.disassemble import recursive_decompose
from ezdxf.path import from_hatch
from shapely.geometry import Polygon
from shapely import union_all
from collections import Counter
styles={'MURS':(4,35),'POTEAUX':(1,35),'OUVERTURES':(2,18),'ISOLANT':(3,5),'PLACO':(3,5),'OUVERTURES_DALLES':(6,35)}
def segment(e):
 if e.dxftype()=='LINE':return Vec2(e.dxf.start),Vec2(e.dxf.end)
 if e.dxftype()=='LWPOLYLINE' and len(e)==2 and not e.closed and not e.has_arc:return tuple(Vec2(p) for p in e.vertices())
def key(s):return tuple(sorted((round(p.x,3),round(p.y,3)) for p in s))

def is_column_base_plate(name):
 normalized=re.sub(r'[\W_]+',' ',name.casefold()).strip()
 if normalized.startswith(('poutre ','beam ')):
  return False
 return bool(re.search(r'^(?:platines?\b|base plates?\b)|\b(?:platines? (?:de )?(?:pied|poteau|ancrage)|column base plates?)\b',normalized))


def clean_plan(source):
 source=Path(source)
 original=io.source_document(source)
 entities=list(original.modelspace())
 archicad=any(e.dxftype()=='INSERT' and e.dxf.name.startswith('Mur_') for e in entities)
 revit=any(e.dxf.layer.upper()=='A-WALL' for e in entities)
 if not (archicad or revit):raise ValueError('Aucun mur reconnu (blocs Archicad ou calque A-WALL).')
 if original.units not in (4,6) or (archicad and original.units!=4):
  raise ValueError('Unités incompatibles avec le type de plan reconnu.')
 d=ezdxf.new('R2018');d.units=original.units;d.header['$LWDISPLAY']=1
 for name,(color,width) in styles.items():d.layers.new(name,dxfattribs={'color':color,'lineweight':width})
 m=d.modelspace();count=Counter();skipped=[]
 def draw(e,layer):
  if e.dxftype()=='INSERT':
   if is_column_base_plate(e.dxf.name):layer='PLATINES'
   if any(k in e.dxf.name.lower() for k in ('porte','fenêtre')):layer='OUVERTURES';count['baies']+=1
   for v in e.virtual_entities(skipped_entity_callback=lambda e,r:skipped.append((e.dxftype(),r))):draw(v,layer)
  elif e.dxftype() in ('LINE','ARC','CIRCLE','ELLIPSE','LWPOLYLINE','POLYLINE','SPLINE'):
   if layer=='PLATINES' and layer not in d.layers:
    d.layers.new(layer,dxfattribs={'color':8,'lineweight':5})
   if layer=='MURS' and e.dxf.get('color',256)==8:layer='ISOLANT'
   m.add_foreign_entity(e,copy=True);n=m[-1];n.dxf.layer=layer;n.dxf.color=256;n.dxf.lineweight=-1;n.dxf.linetype='BYLAYER';n.dxf.discard('true_color')
 if revit and not archicad:
  for e in entities:
   layer=e.dxf.layer.upper()
   if is_column_base_plate(layer) or (e.dxftype()=='INSERT' and is_column_base_plate(e.dxf.name)):draw(e,'PLATINES')
   elif layer in ('A-WALL','I-WALL'):draw(e,'MURS')
   elif layer=='S-COLS':draw(e,'POTEAUX')
   elif layer in ('A-DOOR','A-DOOR-OPNG','A-DOOR-GLAZ','A-GLAZ','A-GLAZ-CURT','A-GLAZ-CWMG'):draw(e,'OUVERTURES')
  return original,d
 for e in entities:
  if is_column_base_plate(e.dxf.layer) or (e.dxftype()=='INSERT' and is_column_base_plate(e.dxf.name)):draw(e,'PLATINES')
  elif e.dxftype()!='INSERT':continue
  elif e.dxf.name.startswith('Mur_'):draw(e,'MURS')
  elif e.dxf.layer=='01-Poteaux':draw(e,'POTEAUX')
 wall=original;marks=set()
 for ins in wall.modelspace().query('INSERT'):
  if not ins.dxf.name.startswith('Mur_'):continue
  ents=list(ins.virtual_entities())
  if not any(e.dxftype()=='INSERT' and e.dxf.name.startswith('*') for e in ents):continue
  segs=[(e.dxftype(),s) for e in ents if (s:=segment(e)) and s[0].distance(s[1])>0.01]
  ends=set()
  for t,(a,b) in segs:
   if t!='LINE':continue
   u=(b-a).normalize()
   for typ,(p,q) in segs:
    if typ!='LWPOLYLINE':continue
    if max(abs(abs(u.det(v-a))-20) for v in (p,q))>.1 or abs(u.det((q-p).normalize()))>.00001:continue
    lo,hi=sorted(u.dot(v-a) for v in (p,q))
    if min(hi,a.distance(b))-max(lo,0)<10:continue
    marks.update([key((a,b)),key((p,q))]);ends.update(key((a,b))+key((p,q)))
  for _,s in segs:
   if abs(s[0].distance(s[1])-20)<.1 and set(key(s))<=ends:marks.add(key(s))
 m=d.modelspace()
 for e in m.query('*[layer=="MURS"]'):
  if (s:=segment(e)) and key(s) in marks:e.dxf.layer='PLACO'
 for ins in original.modelspace().query('INSERT[layer=="01-Dalles"]'):
  loops=[e for e in ins.virtual_entities() if e.dxftype()=='LWPOLYLINE' and e.closed]
  for ring in loops:
   pts=list(ring.vertices())
   if any(other is not ring and all(is_point_in_polygon_2d(Vec2(p),list(map(Vec2,other.vertices())))==1 for p in pts) for other in loops):
    m.add_foreign_entity(ring,copy=True);n=m[-1];n.dxf.layer='OUVERTURES_DALLES';n.dxf.color=256;n.dxf.lineweight=-1;n.dxf.discard('true_color')

 add_voids(original,d)
 return original,d

def main_wall_reference(source):
    import math
    from collections import defaultdict
    _, plan = clean_plan(source)
    directions = defaultdict(list)
    for wall in plan.modelspace().query('*[layer=="MURS"]'):
        if wall.dxftype() == 'LINE':
            edges = [(wall.dxf.start, wall.dxf.end)]
        elif wall.dxftype() == 'LWPOLYLINE':
            vertices = list(wall.get_points('xyb'))
            ends = vertices[1:] + (vertices[:1] if wall.closed else [])
            edges = [(a[:2], b[:2]) for a, b in zip(vertices, ends) if not a[2]]
        else:
            continue
        for a, b in edges:
            dx, dy = b[0]-a[0], b[1]-a[1]
            length = math.hypot(dx, dy)
            if length < (0.25 if plan.units==6 else 250):
                continue
            angle = math.degrees(math.atan2(dy, dx)) % 180
            directions[round(angle * 10) % 1800].append((length, angle, [a[0],a[1]]))
    if not directions:
        raise ValueError("Aucun mur droit utilisable comme référence.")
    family = max(directions.values(), key=lambda group: sum(edge[0] for edge in group))
    # The length-weighted median selects an actual wall face in the dominant family.
    half = sum(edge[0] for edge in family) / 2
    for length, angle, point in sorted(family,key=lambda edge:(edge[1]+90)%180):
        half -= length
        if half <= 0:
            return dict(angle=angle,pivot=point)

def orient_plan(doc, axis, reference):
    import math
    from ezdxf.math import Matrix44, Vec3
    x,y = reference['pivot']
    degrees = ((0 if axis=='X' else 90) - reference['angle'] + 90) % 180 - 90
    matrix = Matrix44.chain(Matrix44.translate(-x,-y,0), Matrix44.z_rotate(math.radians(degrees)), Matrix44.translate(x,y,0))
    model = doc.modelspace()
    impact = next(iter(model.query('INSERT[layer=="IMPACT"]')), None)
    if impact is not None:
        impact.dxf.insert = doc.blocks[impact.dxf.name].block.dxf.base_point
    plan = [entity for entity in model if entity is not impact]
    for entity in model:
        entity.transform(matrix)
    if impact is not None:
        box = bbox.extents(plan)
        other = bbox.extents([impact])
        spacing = box.extmax.x - other.extmin.x + max(1.5 if doc.units==6 else 1500, box.size.x * .08)
        impact.translate(spacing,0,0)

def generate(source, target, upper_source=None, axis=None, reference=None):
 target=Path(target)
 _,d=clean_plan(source)
 m=d.modelspace()
 if upper_source:
  architecture,upper=clean_plan(upper_source)
  add_impact(d,upper,architecture,Path(upper_source).stem)
 if axis in ('X','Y'):
  orient_plan(d,axis,reference or main_wall_reference(source))
 with TemporaryDirectory(dir=target.parent) as tmp:
  f=Path(tmp)/'plan.dxf';out=f.with_suffix('.dwg')
  d.saveas(f);io.convert(f,out,'DWG')
  back=io.source_document(out)
  if Counter(e.dxf.layer for e in back.modelspace())!=Counter(e.dxf.layer for e in m):raise ValueError('Contrôle DWG échoué.')
  out.rename(target)
 return str(target)

def add_voids(d,dst):
 sets={k:[] for k in ['mur','dalle','plan']}
 for e in d.modelspace():
  typ=e.dxftype()
  if typ=='INSERT' and e.dxf.name.lower().startswith(('mur_','dalle_','poteau_')):
   k='dalle' if e.dxf.name.startswith('Dalle_') else 'mur'
   hs=(v for v in recursive_decompose([e]) if v.dxftype()=='HATCH')
  elif typ=='HATCH' and e.dxf.layer in ('0','Nouveau_0'):k='plan';hs=[e]
  else:continue
  for h in hs:
   rings=[]
   for path in from_hatch(h):
    coords=[(v.x,v.y) for v in path.flattening(.5)]
    if len(coords)<3:continue
    p=Polygon(coords)
    if p.area>1:rings.append(p.buffer(0))
   if rings:
    p=max(rings,key=lambda x:x.area)
    for r in sorted(rings,key=lambda x:-x.area)[1:]:p=p.symmetric_difference(r)
    sets[k].append(p)
 seen={}; shapes={}
 for k,parts in sets.items():
  u=union_all(parts,grid_size=.1)
  for poly in getattr(u,'geoms',[u]):
   for ring in getattr(poly,'interiors',[]):
    p=Polygon(ring);r=p.minimum_rotated_rectangle
    if not 4000<p.area<3e6 or p.area/r.area<.96:continue
    pts=list(r.exterior.coords)
    import math
    a,b=sorted(math.dist(pts[i],pts[i+1]) for i in (0,1))
    if a<75 or b/a>15:continue
    xy=tuple(round(v) for v in p.centroid.coords[0]);seen[xy]=(k,round(a),round(b));shapes[xy]=p
 from shapely.geometry import LineString
 from ezdxf.path import make_path
 m=dst.modelspace()
 known=[Polygon(e.vertices()) for e in m.query('LWPOLYLINE') if e.closed and e.dxf.layer in ('GAINES_TECHNIQUES_REPEREES','RESERVATIONS_A_CONFIRMER','OUVERTURES_DALLES')]
 bays=[]
 for e in m.query('*[layer=="OUVERTURES"]'):
  try:
   vs=list(make_path(e).flattening(1));bays.append(LineString([(v.x,v.y) for v in vs]))
  except (TypeError,ValueError):pass
 openings=union_all(bays)
 labels=[]
 for text in d.modelspace().query('MTEXT TEXT'):
  if text.plain_text().strip().upper()=='GT':
   center=bbox.extents([text]).center;labels.append(Point(center.x,center.y))
 classified=Counter()
 for xy,p in shapes.items():
  if any(t.contains(p.representative_point()) for t in known):classified['existant']+=1;continue
  if openings.intersects(p.buffer(-2)):classified['menuiserie']+=1;continue
  name='RESERVATIONS_A_CONFIRMER'
  if any(p.covers(point) for point in labels):name='GAINES_TECHNIQUES_REPEREES'
  if name not in dst.layers:dst.layers.new(name,dxfattribs={'color':6,'lineweight':35})
  m.add_lwpolyline(list(p.simplify(.2).exterior.coords)[:-1],close=True,dxfattribs={'layer':name});classified['ajout']+=1
def add_impact(current, upper, architecture, level):
    from ezdxf.enums import TextEntityAlignment
    from ezdxf.math import Vec3
    allowed = {'MURS', 'POTEAUX', 'OUVERTURES_DALLES', 'GAINES_TECHNIQUES_REPEREES', 'RESERVATIONS_A_CONFIRMER'}
    if current.units != upper.units:
        raise ValueError("Les unités des deux niveaux diffèrent.")
    items = [entity for entity in upper.modelspace() if entity.dxf.layer in allowed]
    source_box = bbox.extents(items)
    plan_box = bbox.extents(current.modelspace())
    if not source_box.has_data or not plan_box.has_data:
        raise ValueError("Emprise de la vue d’impact introuvable.")
    current.linetypes.new('IMPACT_POINTILLE', dxfattribs={'description':'Impact', 'pattern':([.12,.06,-.06] if current.units==6 else [120,60,-60])})
    current.layers.new('IMPACT', dxfattribs={'color':5})
    block = current.blocks.new('IMPACT_' + level, base_point=source_box.center)
    for entity in items:
        layer = entity.dxf.layer
        name = 'IMPACT_' + layer
        if name not in current.layers:
            attrs = {'color':upper.layers.get(layer).color,'lineweight':upper.layers.get(layer).dxf.lineweight}
            if layer == 'MURS':
                attrs.update(color=5,lineweight=5,linetype='IMPACT_POINTILLE')
            elif layer in {'OUVERTURES_DALLES', 'GAINES_TECHNIQUES_REPEREES', 'RESERVATIONS_A_CONFIRMER'}:
                attrs.update(color=200, linetype='IMPACT_POINTILLE')
            current.layers.new(name,dxfattribs=attrs)
        block.add_foreign_entity(entity,copy=True)
        block[-1].dxf.layer = name
        block[-1].dxf.linetype = 'BYLAYER'
    current.layers.new('IMPACT_ALLEGES',dxfattribs={'color':5,'lineweight':5})
    def windows(insert):
        for child in insert.virtual_entities():
            if child.dxftype() != 'INSERT':
                continue
            label = child.dxf.name.casefold()
            if 'porte' in label:
                continue
            if 'fenêtre' in label or 'fenetre' in label:
                bounds = bbox.extents([child])
                if bounds.has_data:
                    block.add_text('AL',dxfattribs={'height':140,'layer':'IMPACT_ALLEGES'}).set_placement(bounds.center,align=TextEntityAlignment.MIDDLE_CENTER)
            else:
                windows(child)
    for wall in architecture.modelspace().query('INSERT'):
        if wall.dxf.name.startswith('Mur_'):
            windows(wall)
    gap = max(1.5 if current.units==6 else 1500, plan_box.size.x * .08)
    offset = Vec3(plan_box.extmax.x + gap - source_box.extmin.x, plan_box.extmin.y - source_box.extmin.y, 0)
    current.modelspace().add_blockref(block.name, source_box.center + offset, dxfattribs={'layer':'IMPACT'})
