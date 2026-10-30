"""PDF page to editable DXF: native paths/text and real Optional Content Groups.

Only thumbnails are rasterized. Source PDFs are never modified. Unsupported
paint operations are counted in the returned report, never called vector data.
"""
from pathlib import Path
from collections import Counter
import base64, math, re, json, os, hashlib
import ezdxf
import pdf_gpl_backend as backend
from shapely.geometry import Polygon, LineString, GeometryCollection, box
from shapely.ops import unary_union, polygonize
from ezdxf.enums import TextEntityAlignment

PT_MM = 25.4 / 72
UNITS = {'mm': (1, 4), 'cm': (10, 5), 'm': (1000, 6)}

_FONT_FILES = None

def _font_file(name):
    global _FONT_FILES
    normalize=lambda text:re.sub('[^a-z0-9]','',text.lower())
    if _FONT_FILES is None:
        from fontTools.ttLib import TTFont
        _FONT_FILES={}
        roots=(Path(os.environ.get('WINDIR','C:/Windows'))/'Fonts',Path(os.environ.get('LOCALAPPDATA',''))/'Microsoft/Windows/Fonts')
        files=[file for directory in roots for file in directory.glob('*') if file.suffix.lower() in ('.ttf','.otf')]
        fingerprint=hashlib.sha256(str([(str(file),file.stat().st_size,file.stat().st_mtime_ns) for file in files]).encode()).hexdigest()
        cache=Path(os.environ.get('LOCALAPPDATA',str(Path.home())))/'DWG-Alcide/cache/pdf-font-files-v1.json'
        try:
            data=json.loads(cache.read_text(encoding='utf8'))
            if data['fingerprint']==fingerprint:
                _FONT_FILES=data['fonts'];return _FONT_FILES.get(normalize(name))
        except (OSError,ValueError,KeyError):pass
        for directory in (Path(os.environ.get('WINDIR','C:/Windows'))/'Fonts',Path(os.environ.get('LOCALAPPDATA',''))/'Microsoft/Windows/Fonts'):
            for file in directory.glob('*'):
                if file.suffix.lower() not in ('.ttf','.otf'):continue
                try:
                    with TTFont(file,lazy=True) as font:
                        for key in (6,4):
                            value=font['name'].getDebugName(key)
                            if value:_FONT_FILES.setdefault(normalize(value),file.name if directory.name=='Fonts' and directory.parent.name.casefold()=='windows' else str(file.resolve()))
                except Exception:pass
        try:
            cache.parent.mkdir(parents=True,exist_ok=True);temp=cache.with_suffix('.'+str(os.getpid())+'.tmp');temp.write_text(json.dumps(dict(fingerprint=fingerprint,fonts=_FONT_FILES)),encoding='utf8');os.replace(temp,cache)
        except OSError:pass
    return _FONT_FILES.get(normalize(name))

def info(path):return backend.info(path)
def preview(path,page=0):return backend.preview(path,page)

def _point(p): return (float(p[0]), float(p[1]))
def _near(a,b): return math.dist(a,b) < 1e-5

def _paths(items, close=False):
    paths=[]; current=[]
    def add(segment):
        nonlocal current
        if current and not _near(current[-1][-1], segment[1]): paths.append(current);current=[]
        current.append(segment)
    for item in items:
        kind=item[0]
        if kind=='l': add(('l',_point(item[1]),_point(item[2])))
        elif kind=='c': add(('c',*map(_point,item[1:5])))
        elif kind in ('re','qu'):
            if current: paths.append(current);current=[]
            if kind=='re':
                r=item[1]; pts=[(r.x0,r.y0),(r.x1,r.y0),(r.x1,r.y1),(r.x0,r.y1)]
                if len(item)>2 and item[2]<0: pts.reverse()
            else:
                q=item[1];pts=list(map(_point,[q.ul,q.ur,q.lr,q.ll]))
            paths.append([('l',pts[i],pts[(i+1)%4]) for i in range(4)])
        else: raise ValueError('Instruction graphique PDF inconnue : '+str(kind))
    if current: paths.append(current)
    if close:
        for ps in paths:
            if ps and not _near(ps[-1][-1],ps[0][1]):ps.append(('l',ps[-1][-1],ps[0][1]))
    return paths

def _curve(a,b,c,d,tolerance=.025,depth=0):
    chord=math.dist(a,d)
    flat=max(abs((d[0]-a[0])*(p[1]-a[1])-(d[1]-a[1])*(p[0]-a[0]))/max(chord,1e-10) for p in (b,c))
    if depth>=12 or (chord>1e-10 and flat<=tolerance) or max(math.dist(a,p) for p in (b,c,d))<=tolerance:return [a,d]
    mid=lambda p,q:((p[0]+q[0])/2,(p[1]+q[1])/2)
    ab,bc,cd=mid(a,b),mid(b,c),mid(c,d);abc,bcd=mid(ab,bc),mid(bc,cd);m=mid(abc,bcd)
    return _curve(a,ab,abc,m,tolerance,depth+1)[:-1]+_curve(m,bcd,cd,d,tolerance,depth+1)

def _flat(path):
    out=[]
    for item in path:
        ps=list(item[1:]) if item[0]=='l' else _curve(*item[1:])
        out.extend(ps if not out else ps[1:])
    return out

def _winding(point, ring):
    x,y=point; winding=0
    for a,b in zip(ring,ring[1:]+ring[:1]):
        cross=(b[0]-a[0])*(y-a[1])-(x-a[0])*(b[1]-a[1])
        if a[1]<=y<b[1] and cross>0:winding+=1
        elif b[1]<=y<a[1] and cross<0:winding-=1
    return winding

def _fill_geometry(paths, even_odd=False):
    rings=[_flat(p) for p in paths if p];rings=[p for p in rings if len(p)>=3]
    if not rings:return GeometryCollection()
    lines=[LineString(p if _near(p[0],p[-1]) else [*p,p[0]]) for p in rings]
    faces=list(polygonize(unary_union(lines)));chosen=[]
    for face in faces:
        p=face.representative_point();w=sum(_winding((p.x,p.y),r) for r in rings)
        if bool(w%2) if even_odd else bool(w):chosen.append(face)
    return unary_union(chosen) if chosen else GeometryCollection()

def _pieces(geometry, kind):
    if geometry.is_empty:return []
    if geometry.geom_type==kind:return [geometry]
    if hasattr(geometry,'geoms'):return [p for g in geometry.geoms for p in _pieces(g,kind)]
    return []

def convert(path, target, page=0, scale=1, unit='cm', include_hidden=True):
    scale=float(scale)
    if not math.isfinite(scale) or not .0001<=scale<=100000:raise ValueError('Échelle PDF incorrecte.')
    if unit not in UNITS:raise ValueError('Unité de dessin inconnue.')
    target=Path(target)
    if target.exists():raise ValueError('La destination d’import existe déjà.')
    report=dict(page=page+1,scale=scale,unit=unit,paths=0,texts=0,entities=0,layers=[],warnings=[],counts={})
    counts=Counter(); native=ezdxf.new('R2018');native.header['$INSUNITS']=UNITS[unit][1];native.header['$MEASUREMENT']=1;native.header['$LWDISPLAY']=True
    space=native.modelspace();queue=[]; layer_map={};style_map={};dash_map={}
    with backend.Document(path) as original:
        states={group['name']:group['on'] for group in original.ocgs.values()}
        original_names={group['name']:group['original'] for group in original.ocgs.values()}
        counts['duplicateLayerNames']=sum(name!=original_names[name] for name in states)
        try:
            p=original.page(page,include_hidden);height=p.rect.height;factor=PT_MM*scale/UNITS[unit][0];page_clip=box(0,0,p.cropbox.width,p.cropbox.height)
            def mapped(q):
                q=p.map_rotation(q)
                return (q[0]*factor,(height-q[1])*factor)
            def layer(name):
                name=name or 'PDF_sans_calque'
                if name not in layer_map:
                    safe=re.sub(r'[<>/\\":;?*|=\x00-\x1f]','_',name)[:220] or 'PDF_sans_calque';base=safe;n=2
                    while safe in native.layers:safe=base+'_'+str(n);n+=1
                    ent=native.layers.new(safe,dxfattribs={'color':7});
                    if states.get(name) is False:ent.off()
                    layer_map[name]=safe
                return layer_map[name]
            for name in states:layer(name)
            def attrs(name,color,opacity=1):
                color=tuple(color or (0,0,0));color=(color[0],)*3 if len(color)==1 else color[:3]
                return dict(layer=layer(name),true_color=ezdxf.colors.rgb2int(tuple(round(max(0,min(1,c))*255) for c in color)),transparency=ezdxf.colors.float2transparency(max(0,min(1,1-float(opacity)))))
            def emit(e,seq,part=0):queue.append((seq,part,len(queue),e));return e
            def polygon_hatch(geometry,attributes,seq):
                for polygon in _pieces(geometry,'Polygon'):
                    if polygon.area<1e-10:continue
                    h=space.add_hatch(dxfattribs=attributes);h.set_solid_fill(color=7);h.dxf.true_color=attributes['true_color']
                    h.paths.add_polyline_path([mapped(q) for q in list(polygon.exterior.coords)[:-1]],is_closed=True,flags=1)
                    for hole in polygon.interiors:h.paths.add_polyline_path([mapped(q) for q in list(hole.coords)[:-1]],is_closed=True,flags=0)
                    emit(h,seq)
            def exact_hatch(paths,attributes,seq):
                h=space.add_hatch(dxfattribs=attributes);h.set_solid_fill(color=7);h.dxf.true_color=attributes['true_color']
                # Edge boundaries preserve original Bezier segments. Winding and
                # nested loops are resolved as polygons when there are multiple loops.
                for ps in paths:
                    edge=h.paths.add_edge_path(flags=1)
                    for seg in ps:
                        qs=[mapped(q) for q in seg[1:]]
                        if seg[0]=='l':edge.add_line(*qs)
                        else:edge.add_spline(control_points=qs,knot_values=[0]*4+[1]*4,degree=3)
                emit(h,seq)
            contexts=[];painted=p.drawings;clip_cache={():page_clip};clip_geometry={}
            if len(painted)>150000:raise ValueError('Page PDF trop dense pour cet import : plus de 150 000 chemins.')
            for drawing in painted:
                level=drawing.get('level',0)
                while contexts and contexts[-1][0]>=level:contexts.pop()
                typ=drawing['type']
                if typ=='clip':
                    geom=_fill_geometry(_paths(drawing['items'],True),drawing.get('even_odd',False));contexts.append((level,'clip',geom));continue
                if typ=='group':
                    contexts.append((level,'group',drawing.get('opacity',1)))
                    if drawing.get('blendmode','Normal')!='Normal' or drawing.get('knockout'):counts['blendGroups']+=1
                    continue
                paths=_paths(drawing['items'],drawing.get('closePath',False));seq=drawing.get('seqno',0);clip=page_clip;group_alpha=1
                clip_ids=drawing.get('clips',())
                if clip_ids not in clip_cache:
                    for index in clip_ids:
                        if index not in clip_geometry:
                            clip_items,evenodd=p.clips[index];clip_geometry[index]=_fill_geometry(_paths(clip_items,True),evenodd)
                        clip=clip.intersection(clip_geometry[index])
                    clip_cache[clip_ids]=clip
                clip=clip_cache[clip_ids]
                for _,kind,value in contexts:
                    if kind=='clip':clip=clip.intersection(value)
                    else:group_alpha*=value
                if clip.is_empty:continue
                report['paths']+=1
                if 'f' in typ and drawing.get('fill') is not None:
                    filled=_paths(drawing['items'],True);geom=_fill_geometry(filled,drawing.get('even_odd',False));at=attrs(drawing.get('layer'),drawing['fill'],(drawing.get('fill_opacity') or 0)*group_alpha)
                    if len(filled)==1 and clip.covers(geom):exact_hatch(filled,at,seq)
                    else:polygon_hatch(geom.intersection(clip),at,seq)
                if 's' in typ and drawing.get('color') is not None:
                    at=attrs(drawing.get('layer'),drawing['color'],(drawing.get('stroke_opacity') or 0)*group_alpha)
                    weight=max(0,drawing.get('width',1))*PT_MM*100;valid=ezdxf.lldxf.const.VALID_DXF_LINEWEIGHTS;at['lineweight']=min(valid,key=lambda x:abs(x-weight))
                    nums=[float(n) for n in re.findall(r'[-+]?(?:\d*\.\d+|\d+)',drawing.get('dashes','[] 0').split(']')[0])]
                    if nums and sum(nums)>0:
                        pattern=tuple(round(max(n,1e-6)*factor,8) for n in nums)
                        if len(pattern)%2:pattern=pattern*2
                        if pattern not in dash_map:
                            name='PDF_TRAIT_'+str(len(dash_map)+1);native.linetypes.new(name,dxfattribs={'pattern':[sum(pattern),*[n if i%2==0 else -n for i,n in enumerate(pattern)]]});dash_map[pattern]=name
                        at['linetype']=dash_map[pattern]
                    for ps in paths:
                        line=LineString(_flat(ps))
                        if clip.covers(line):
                            if all(s[0]=='l' for s in ps):
                                points=[mapped(ps[0][1]),*[mapped(s[-1]) for s in ps]]
                                if len(points)==2:emit(space.add_line(*points,dxfattribs=at),seq,1)
                                else:emit(space.add_lwpolyline(points,close=_near(points[0],points[-1]),dxfattribs=at),seq,1)
                            else:
                                for seg in ps:
                                    points=[mapped(q) for q in seg[1:]]
                                    emit(space.add_line(*points,dxfattribs=at) if seg[0]=='l' else space.add_open_spline(points,degree=3,knots=[0]*4+[1]*4,dxfattribs=at),seq,1)
                        else:
                            if any(s[0]=='c' for s in ps):counts['clippedCurves']+=1
                            for part in _pieces(line.intersection(clip),'LineString'):
                                points=[mapped(q) for q in part.coords]
                                if len(points)>=2:emit(space.add_lwpolyline(points,dxfattribs=at),seq,1)
            seen=set()
            for span in p.texts:
                if span.get('type',0)>1 or span.get('opacity',1)<=0:continue
                chars=span.get('chars',[])
                if not chars:continue
                text=''.join(chr(c[0]) if 0<=c[0]<=0x10ffff else '\ufffd' for c in chars)
                key=(text,span.get('bbox'),span.get('layer'),span.get('dir'))
                if key in seen:continue
                seen.add(key)
                if '\ufffd' in text:counts['unknownGlyphs']+=text.count('\ufffd')
                fontname=span.get('font','Helvetica').split('+')[-1];cap=span.get('cap',.73)
                if fontname not in style_map:
                    name='PDF_POLICE_'+str(len(style_map)+1);low=fontname.lower();family='cour' if 'cour' in low else 'times' if 'times' in low else 'arial';bold='bold' in low;italic=any(t in low for t in ('italic','oblique'));suffix=('bi' if family!='arial' else 'bi') if bold and italic else ('bd' if family=='arial' else 'bd') if bold else 'i' if italic else '';filename=_font_file(fontname) or family+suffix+'.ttf';native.styles.new(name,dxfattribs={'font':filename});style_map[fontname]=name
                    if not _font_file(fontname) and not any(n in low for n in ['arial','helvetica','times','courier']):counts['fontSubstitutions']+=1
                direction=span.get('dir',(1,0));start=mapped(chars[0][2]);end=mapped(span['end']);angle=math.degrees(math.atan2(end[1]-start[1],end[0]-start[0]));at=attrs(span.get('layer'),span.get('color'),span.get('opacity',1));at.update(style=style_map[fontname],height=span['size']*cap*factor,rotation=angle)
                if not page_clip.covers(box(*span['bbox'])):counts['croppedText']+=1
                if not page_clip.intersects(box(*span['bbox'])):continue
                entity=space.add_text(text,dxfattribs=at)
                if math.dist(start,end)>1e-8 and not span.get('wmode'):entity.set_placement(start,end,align=TextEntityAlignment.FIT)
                else:entity.set_placement(start)
                emit(entity,span.get('seqno',0),2);report['texts']+=1
            counts.update(p.counts)
            counts['clippingTextUnverified']=len({tuple(span.get('clips',())) for span in p.texts if span.get('clips')})
            if not queue:raise ValueError('Cette page ne contient aucun trait ou texte vectoriel importable. Une page scannée ne devient pas un dessin vectoriel.')
            queue.sort(key=lambda q:q[:3]);space.set_redraw_order([(e.dxf.handle,format(i+1,'X')) for i,(*_,e) in enumerate(queue)])
            report['entities']=len(queue);report['layers']=[dict(original=original_names.get(name,name),name=safe,visible=states.get(name,True)) for name,safe in layer_map.items()];report['counts']=dict(counts)
            messages={'duplicateLayerNames':'Des groupes PDF portent le même nom : un suffixe numérique les distingue pour conserver chaque calque séparément.', 'blendGroups':'Des groupes utilisent un mélange de couleurs non reproduit par le DWG.', 'clippedCurves':'Certaines courbes découpées par un masque sont approchées par des polylignes vectorielles (tolérance 0,025 point sur la page).', 'fontSubstitutions':'Des polices PDF ont été remplacées ; vérifier leur aspect.', 'unknownGlyphs':'Des caractères sans correspondance Unicode nécessitent une vérification.', 'croppedText':'Des textes coupés par le bord de page ont été importés sans découper leurs glyphes.', 'rasterImages':'Des images bitmap intégrées ne sont pas importées par cet outil vectoriel.', 'gradients':'Des dégradés PDF ne sont pas repris comme remplissages DWG.', 'unsupportedPatterns':'Des motifs PDF ne peuvent pas être repris et sont exclus du dessin.', 'softMasks':'Des masques de transparence PDF nécessitent une vérification.', 'textClipModes':'Des textes servant de masque nécessitent une vérification.', 'clippingTextUnverified':'La découpe des textes par les masques internes du PDF est à vérifier.'}
            report['warnings']=[dict(code=k,count=n,message=messages[k]) for k,n in counts.items() if n and k in messages]
            record=native.rootdict.add_xrecord('ALCIDE_PDF_IMPORT');metadata=json.dumps(dict(source=str(Path(path).resolve()),**report),ensure_ascii=False);record.extend([(1,metadata[i:i+240]) for i in range(0,len(metadata),240)])
            target.parent.mkdir(parents=True,exist_ok=True);tmp=target.with_suffix('.tmp.dxf')
            try:native.saveas(tmp);ezdxf.readfile(tmp);tmp.replace(target)
            finally:tmp.unlink(missing_ok=True)
            return dict(path=str(target),**report)
        finally:pass
