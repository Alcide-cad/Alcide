import sys, json, os, time, subprocess, hashlib, tempfile, traceback, math, gzip, re
from pathlib import Path
import ezdxf, orjson, gc, copy
import dwg_export
import import_reconstruction
import block_editor
import document_scale
import line_patterns
import logging
logging.getLogger("fontTools").setLevel(logging.ERROR)
from ezdxf.addons.drawing import Frontend, RenderContext
from ezdxf.addons.drawing.backend import Backend
from ezdxf.addons.drawing.config import Configuration
from ezdxf.addons.drawing.properties import Filling
from ezdxf.colors import int2rgb, aci2rgb
from ezdxf.lldxf.encoding import decode_dxf_unicode
from ezdxf.enums import TextEntityAlignment

ROOT = Path(sys.executable).parent if getattr(sys, 'frozen', False) else Path(__file__).parent
DOC = None
SOURCE = None
WARNINGS = []
DOCUMENTS = {}
ACTIVE = None
CACHE_VERSION = 'alcide-0.6.5-labels-vertical-leaders'

SCANNED_FONT_DIRS=set()

def install_exact_font_matching():
    from ezdxf.fonts.font_manager import FontCache
    if getattr(FontCache,'_alcide_exact_family',False):return
    original=FontCache.find_best_match_ex
    def match(self,family='sans-serif',style='Regular',weight=400,width=5,italic=False):
        # Inline MTEXT bold flags often retain style='Regular'. Matching style
        # first incorrectly preferred Arial Black over Arial Bold.
        key=(len(self._cache),family.casefold(),style,weight,width,italic)
        cache=getattr(self,'_alcide_matches',None)
        if cache is None:cache={};self._alcide_matches=cache
        if key in cache:return cache[key]
        entries=[e.font_face for e in self._cache.values() if e.font_face.family.casefold()==family.casefold()]
        result=min(entries,key=lambda f:(abs(f.weight-weight),f.is_italic is not italic if italic is not None else False,abs(f.width-width),f.style.casefold()!=style.casefold())) if entries else original(self,family,style,weight,width,italic)
        if len(cache)>4096:cache.clear()
        cache[key]=result
        return result
    FontCache.find_best_match_ex=match;FontCache._alcide_exact_family=True

def prepare_native_fonts(doc):
    install_exact_font_matching()
    from ezdxf.fonts import fonts
    ezdxf.options.set('drawing-addon','shx_resolve_order','stl')
    folders=[]
    for root in (Path(os.environ.get('PROGRAMFILES','C:/Program Files'))/'Autodesk',):
        if root.exists():folders.extend(root.glob('AutoCAD*/Fonts'))
    if SOURCE:
        parent=Path(SOURCE).parent
        folders.extend([parent/'Fonts',parent/'fonts'])
        # Only the drawing folder itself; do not recursively scan a whole project.
        if parent.exists():
            from ezdxf.fonts.font_manager import get_shape_file_font_face,get_ttf_font_face
            for file in parent.iterdir():
                if file.suffix.lower() in ('.shx','.shp','.ttf','.otf'):
                    try:
                        face=get_shape_file_font_face(file) if file.suffix.lower() in ('.shx','.shp') else get_ttf_font_face(file)
                        fonts.font_manager._font_cache.add_entry(file,face)
                    except Exception:pass
    for folder in folders:
        key=str(folder.resolve()).casefold()
        if folder.is_dir() and key not in SCANNED_FONT_DIRS:
            fonts.font_manager.scan_folder(folder);SCANNED_FONT_DIRS.add(key)

FONT_CHOICES=None
def font_choices():
    global FONT_CHOICES
    if FONT_CHOICES is None:
        directory=Path(os.environ.get('WINDIR','C:/Windows'))/'Fonts'
        fingerprint=hashlib.sha256(str([(p.name,p.stat().st_size,p.stat().st_mtime_ns) for p in sorted(directory.glob('*.ttf'))]).encode()).hexdigest()
        catalog=cache_dir()/'font-choices-v1.json'
        try:
            saved=json.loads(catalog.read_text(encoding='utf8'))
            if saved['fingerprint']==fingerprint:FONT_CHOICES=saved['fonts'];return FONT_CHOICES
        except (OSError,ValueError,KeyError):pass
        from fontTools.ttLib import TTFont
        found={}
        for path in (Path(os.environ.get('WINDIR','C:/Windows'))/'Fonts').glob('*.ttf'):
            try:
                with TTFont(path,lazy=True) as font:
                    family=font['name'].getDebugName(16) or font['name'].getDebugName(1)
                    if family and family not in found:
                        units=font['head'].unitsPerEm;cap=getattr(font['OS/2'],'sCapHeight',0)
                        if not cap and 'glyf' in font and 'H' in font.getBestCmap().values():cap=font['glyf']['H'].yMax
                        found[family]={'family':family,'file':path.name,'capRatio':cap/units if cap else .72}
            except Exception:pass
        FONT_CHOICES=sorted(found.values(),key=lambda f:f['family'].casefold())
        try:
            temporary=catalog.with_suffix('.'+str(os.getpid())+'.tmp');temporary.write_text(json.dumps({'fingerprint':fingerprint,'fonts':FONT_CHOICES}),encoding='utf8');os.replace(temporary,catalog)
        except OSError:pass
    return FONT_CHOICES

def text_font(doc,name,width=1):
    choice=next((f for f in font_choices() if f['family']==name),None)
    if choice is None:
        if name in doc.styles:return name
        existing=next((style.dxf.name for style in doc.styles if font_family(doc,style.dxf.name)==name),None)
        if existing:return existing
        # 0.7.7 : police absente de cet ordinateur -> style de repli (le fichier de police est substitué à l'ouverture), l'export n'échoue plus.
        known={'segoe ui':'segoeui.ttf','arial':'arial.ttf','calibri':'calibri.ttf','times new roman':'times.ttf','consolas':'consola.ttf','tahoma':'tahoma.ttf','verdana':'verdana.ttf'}
        choice={'family':name,'file':known.get(str(name).casefold(),re.sub(r'[^A-Za-z0-9]+','',str(name)).lower()+'.ttf' if name else 'arial.ttf'),'capRatio':.72}
    key='ALCIDE_'+hashlib.sha256((name+str(width)).encode()).hexdigest()[:16]
    if key not in doc.styles:doc.styles.new(key,dxfattribs={'font':choice['file'],'width':width})
    return key

def font_family(doc,style):
    cache=getattr(doc,'_alcide_font_families',None)
    if cache is None:cache={};doc._alcide_font_families=cache
    if style in cache:return cache[style]
    try:
        from ezdxf.fonts import fonts
        entry=doc.styles.get(style);family=fonts.resolve_font_face(entry.dxf.font,order='stl').family or style
    except Exception:family=style or 'Segoe UI'
    cache[style]=family;return family

def apply_text_style(e,values):
    if e.dxftype() not in ('TEXT','MTEXT'):raise ValueError('Choisissez un texte.')
    if e.dxftype()=='TEXT' and values.get('mtext'):
        from ezdxf.entities import factory
        from ezdxf.entities.dxfgfx import replace_entity
        _,anchor,_=e.get_placement()
        horizontal={'0':'left','1':'center','2':'right'}.get(str(e.dxf.get('halign',0)),'left')
        vertical={0:'bottom',1:'bottom',2:'middle',3:'top'}.get(e.dxf.get('valign',0),'bottom')
        alignment=values.get('alignment',horizontal+'-'+vertical);h,v=alignment.split('-')
        attrs={k:e.dxf.get(k) for k in ('layer','color','true_color','transparency','lineweight','linetype','style','extrusion') if e.dxf.hasattr(k)}
        attrs.update(insert=anchor,char_height=e.dxf.height,rotation=e.dxf.get('rotation',0),attachment_point={'top':0,'middle':3,'bottom':6}[v]+{'left':1,'center':2,'right':3}[h],width=0)
        values=dict(values)
        if 'widthFactor' not in values:values['widthFactor']=e.dxf.get('width',1)
        target=factory.new('MTEXT',dxfattribs=attrs,doc=e.doc);target.text=values['mtext']
        if e.xdata is not None:target.xdata=copy.deepcopy(e.xdata)
        if e.doc.entitydb.get(e.dxf.handle) is e:
            groups=[(g,list(g)) for _,g in e.doc.groups if e in list(g)]
            replace_entity(e,target,e.get_layout())
            for g,members in groups:g.set_data([target if member is e else member for member in members])
        else:target.dxf.handle=e.dxf.handle
        e=target
    if 'fontFace' in values:
        e.dxf.style=text_font(e.doc,values['fontFace'])
        if e.dxftype()=='MTEXT' and not values.get('keepInline'):e.text=re.sub(r'\\[fF][^;]*;','',e.text)
    if 'height' in values:
        height=float(values['height'])
        if not math.isfinite(height) or height<=0:raise ValueError('Hauteur positive requise.')
        e.dxf.set('height' if e.dxftype()=='TEXT' else 'char_height',height)
        if e.dxftype()=='MTEXT' and not values.get('keepInline'):e.text=re.sub(r'\\H[^;]*;','',e.text)
    if 'angle' in values:
        angle=float(values['angle'])
        if not math.isfinite(angle):raise ValueError('Angle incorrect.')
        if e.dxftype()=='MTEXT':e.set_rotation(angle)
        else:e.dxf.rotation=angle
    if 'text' in values:
        if e.dxftype()=='TEXT':
            if '\n' in values['text']:raise ValueError('Ce texte simple ne peut pas contenir plusieurs lignes.')
            e.dxf.text=values['text']
        elif values.get('mtext'):e.text=str(values['mtext'])
        else:e.text=values['text'].replace('\\','\\\\').replace('{','\\{').replace('}','\\}').replace('\n','\\P')
    if 'widthFactor' in values:
        width=float(values['widthFactor'])
        if not math.isfinite(width) or width<=0 or width>20:raise ValueError('Facteur de largeur : choisir entre 0 et 20.')
        if e.dxftype()=='TEXT':e.dxf.width=width
        else:e.text='\\W'+str(width)+';'+re.sub(r'\\W[0-9.+-]+;','',e.text)
    if 'alignment' in values:
        value=str(values['alignment']);horizontal,vertical=value.split('-')
        if e.dxftype()=='MTEXT':e.dxf.attachment_point={'top':0,'middle':3,'bottom':6}[vertical]+{'left':1,'center':2,'right':3}[horizontal]
        else:
            anchor=e.get_placement()[1]
            mode=getattr(TextEntityAlignment,vertical.upper()+'_'+horizontal.upper())
            e.set_placement(anchor,align=mode)
    return e

def preview_texts(requests):
    require_doc(full=True);results=[]
    for request in requests:
        source=DOC.entitydb.get(request['source'])
        if source is None or source.dxftype() not in ('TEXT','MTEXT'):raise ValueError('Texte introuvable.')
        e=source.copy();e.doc=DOC;e.dxf.handle=request['id'];e=apply_text_style(e,request['style'])
        meta=metadata(e,source.get_layout().name,DOC);meta['id']=request['id']
        backend=SceneBackend({request['id']:meta});prepare_native_fonts(DOC);ctx=RenderContext(DOC)
        ctx.set_layer_properties_override(lambda layers:[setattr(layer,'is_visible',True) for layer in layers])
        frontend=RepeatedTextFrontend(ctx,backend,config=Configuration());frontend._alcide_backend=backend;frontend.draw_entities([e])
        item=backend.items.get(request['id'])
        if not item or not item['primitives']:raise ValueError('Le texte ne produit pas de représentation visible.')
        results.append(item)
    return results

def cache_dir():
    p=Path(os.environ.get('ALCIDE_CACHE_DIR',str(Path(os.environ.get('LOCALAPPDATA',tempfile.gettempdir()))/'DWG-Alcide'/'cache')))
    if p.is_symlink():raise ValueError('Le dossier cache ne doit pas être un lien symbolique.')
    p.mkdir(parents=True,exist_ok=True)
    return p.resolve()

def cache_key(filename,version=None):
    p=Path(filename).resolve();s=p.stat()
    return hashlib.sha256(((version or CACHE_VERSION)+str(p)+str(s.st_mtime_ns)+str(s.st_size)).encode()).hexdigest()[:32]

def scene_path(key,layout):
    return cache_dir()/(key+'-'+hashlib.sha256(layout.encode()).hexdigest()[:12]+'.scene.gz')

def write_scene(r,key):
    target=scene_path(key,r['layout']);tmp=target.with_suffix('.tmp')
    # Share repeated SVG strings in the transfer instead of serializing each instance.
    table=[];lookup={};compact=[]
    for item in r['items']:
        primitives=[]
        for p in item['primitives']:
            d=p.get('d','')
            if len(d)<128:primitives.append(p);continue
            index=lookup.get(d)
            if index is None:index=len(table);lookup[d]=index;table.append(d)
            primitives.append(dict(**{k:v for k,v in p.items() if k!='d'},pathRef=index))
        compact.append(dict(item,primitives=primitives))
    data=dict(r,items=compact,graphicPaths=table)
    with gzip.open(tmp,'wb',compresslevel=1) as f:f.write(orjson.dumps(data,option=orjson.OPT_SERIALIZE_NUMPY))
    os.replace(tmp,target)
    write_manifest(target,r)
    return str(target)

def write_manifest(target,r):
    stat=target.stat()
    target.with_name(target.name.removesuffix('.scene.gz')+'.warnings.json').write_text(json.dumps(dict(source=r['source'],warnings=r['warnings'],size=stat.st_size,mtime=stat.st_mtime_ns)),encoding='utf8')

def normalize_mtext(text):
    text=text.replace(r'\\~',' ').replace(r'\~',' ')
    # ezdxf's caret decoder interprets ^; as a control escape. DWG producers
    # legitimately emit a stack separator immediately before its semicolon.
    # A space after the unescaped separator makes the stack parse correctly.
    return re.sub(r'(\\S[^;]*?)(?<!\\)\^(?! )',r'\1^ ',text)

def progress(text,preview=None):
    if ACTIVE:print(json.dumps({'event':'progress','docId':ACTIVE,'text':text,**({'preview':preview} if preview else {})},ensure_ascii=False),flush=True)

def layer_info():
    if DOC is not None:
        layers=[]
        for layer in DOC.layers:
            aci=abs(layer.dxf.color)
            color='#e6edf3' if aci in (0,7) else '#%02x%02x%02x'%tuple(aci2rgb(max(1,min(255,aci))))
            if layer.dxf.hasattr('true_color'):color='#%06x'%layer.dxf.true_color
            layers.append(dict(name=layer.dxf.name,color=color,aci=aci,locked=layer.is_locked(),visible=not layer.is_off() and not layer.is_frozen(),frozen=layer.is_frozen(),lineweight=layer.dxf.get('lineweight',-3),linetype=layer.dxf.get('linetype','Continuous'),transparency=round(layer.transparency*100),description=layer.description,plot=bool(layer.dxf.get('plot',1))))
        return layers
    # Cached scenes need only the tiny TABLES section, never a full DXF read.
    filename=DOCUMENTS[ACTIVE]['converted'];chunks=[];section=None;found=False
    from ezdxf.filemanagement import dxf_file_info
    with open(filename,encoding=dxf_file_info(filename).encoding,errors='replace') as f:
        while True:
            code=f.readline();value=f.readline()
            if not code or not value:break
            tag=code.strip();val=value.rstrip('\r\n')
            if tag=='0' and val=='SECTION':section=None
            if tag=='2' and section is None:section=val;found=found or val=='TABLES'
            if section=='TABLES':chunks.extend([code,value])
            if tag=='0' and val=='ENDSEC' and found:break
    layers=[]
    for block in re.split(r'(?m)^  0\n',''.join(chunks)):
        if not block.startswith('LAYER\n'):continue
        tags={int(c):v for c,v in re.findall(r'(?m)^\s*(\d+)\n([^\n]*)',block)}
        if 2 not in tags:continue
        for code in (2,6,4):
            if code in tags:tags[code]=decode_dxf_unicode(tags[code])
        aci=int(tags.get(62,7));flags=int(tags.get(70,0));rgb='#e6edf3' if abs(aci) in (0,7) else '#%02x%02x%02x'%tuple(aci2rgb(max(1,min(255,abs(aci)))))
        if 420 in tags:rgb='#%06x'%int(tags[420])
        trans=re.search(r'(?m)^1001\nAcCmTransparency\n1071\n([^\n]+)',block);desc=re.search(r'(?m)^1001\nAcAecLayerStandard\n1000\n[^\n]*\n1000\n([^\n]*)',block)
        layers.append(dict(name=tags[2],color=rgb,aci=abs(aci),locked=bool(flags&4),visible=aci>0 and not flags&1,frozen=bool(flags&1),lineweight=int(tags.get(370,-3)),linetype=tags.get(6,'Continuous'),transparency=round(ezdxf.colors.transparency2float(int(trans.group(1)) if trans else int(tags.get(440,0x020000ff)))*100),description=decode_dxf_unicode(desc.group(1)) if desc else tags.get(4,''),plot=tags.get(290,'1')!='0'))
    return layers

def preview_lines(doc):
    # Show basic plan geometry before the expensive text/hatch preparation.
    lines=[];bounds=[math.inf,math.inf,-math.inf,-math.inf]
    for e in doc.modelspace():
        layer=doc.layers.get(e.dxf.layer)
        if layer.is_off() or layer.is_frozen():continue
        points=[]
        if e.dxftype()=='LINE':points=[point(e.dxf.start),point(e.dxf.end)]
        elif e.dxftype()=='LWPOLYLINE':
            points=[point(p) for p in e.vertices_in_wcs()]
            if e.closed and points:points.append(points[0])
        elif e.dxftype()=='CIRCLE':
            c=e.dxf.center;r=e.dxf.radius;points=[[c.x+r*math.cos(a*math.pi/16),c.y+r*math.sin(a*math.pi/16)] for a in range(33)]
        if len(points)<2:continue
        aci=e.dxf.get('color',256)
        if aci==256:aci=abs(layer.dxf.color)
        color='#e6edf3' if aci in (0,7) else '#%02x%02x%02x'%tuple(aci2rgb(max(1,min(255,aci))))
        if e.dxf.hasattr('true_color'):color='#%06x'%e.dxf.true_color
        lines.append({'points':points,'color':color})
        for x,y in points:bounds=[min(bounds[0],x),min(bounds[1],y),max(bounds[2],x),max(bounds[3],y)]
    return {'lines':lines,'bounds':bounds} if lines else None

def preview_blocks(doc):
    # Lightweight outlines become navigable while fonts, hatches and final paths prepare.
    cache={};rows=[];bounds=[math.inf,math.inf,-math.inf,-math.inf]
    def outlines(name,ancestors=()):
        if name in ancestors or len(ancestors)>4:return []
        if name in cache:return cache[name]
        result=[]
        try:block=doc.blocks.get(name)
        except KeyError:return []
        for e in block:
            typ=e.dxftype();layer=doc.layers.get(e.dxf.layer)
            if layer.is_off() or layer.is_frozen():continue
            if typ=='INSERT':
                transform=e.matrix44()
                for ps,color in outlines(e.dxf.name,ancestors+(name,)):
                    result.append((list(transform.transform_vertices(ps)),color or e.dxf.get('color',256)))
            else:
                ps=[]
                if typ=='LINE':ps=[e.dxf.start,e.dxf.end]
                elif typ=='LWPOLYLINE':
                    ps=list(e.vertices_in_wcs())
                    if e.closed and ps:ps.append(ps[0])
                if len(ps)>1:
                    aci=e.dxf.get('color',256)
                    if aci==256:aci=abs(layer.dxf.color)
                    result.append((ps,aci))
            if len(result)>=2000:break
        cache[name]=result;return result
    for e in doc.modelspace().query('INSERT'):
        layer=doc.layers.get(e.dxf.layer)
        if layer.is_off() or layer.is_frozen():continue
        template=outlines(e.dxf.name);stride=max(1,math.ceil(len(template)/100));transform=e.matrix44()
        for ps,aci in template[::stride]:
            if aci in (0,256):aci=e.dxf.get('color',256)
            if aci in (0,256):aci=abs(layer.dxf.color)
            color='#e6edf3' if aci==7 else '#%02x%02x%02x'%tuple(aci2rgb(max(1,min(255,aci))))
            points=list(transform.transform_vertices(ps))
            for a,b in zip(points,points[1:]):
                rows.append([a.x,a.y,b.x,b.y,color]);bounds=[min(bounds[0],a.x,b.x),min(bounds[1],a.y,b.y),max(bounds[2],a.x,b.x),max(bounds[3],a.y,b.y)]
            if len(rows)>20000:break
        if len(rows)>20000:break
    return {'rows':rows,'bounds':bounds} if rows else None

def activate(doc_id):
    global DOC,SOURCE,WARNINGS,ACTIVE
    entry=DOCUMENTS.get(doc_id)
    if entry is None:raise ValueError('Dessin fermé ou inconnu.')
    DOC,SOURCE,WARNINGS,ACTIVE=entry['doc'],entry['source'],entry['warnings'],doc_id
    return entry

def require_doc(full=False):
    global DOC
    entry=DOCUMENTS[ACTIVE]
    if DOC is None or (full and getattr(DOC,'_alcide_lines',None) is not None):
        progress('Lecture des données pour l’édition…')
        DOC=read_doc(entry['converted']);entry['doc']=DOC
    return DOC

def read_converted(filename, progressive=False):
    # Only our own ASCII converter output uses this fast path. Other DXF
    # documents retain ezdxf's normal validation and recovery reader.
    from io import StringIO
    from ezdxf.filemanagement import dxf_file_info
    info=dxf_file_info(filename)
    text=Path(filename).read_text(encoding=info.encoding,errors='surrogateescape')
    marker='  2\nENTITIES\n';start=text.find(marker)
    if start<0:return read_doc(filename)
    start+=len(marker);end=text.find('  0\nENDSEC\n',start)
    if end<0:return read_doc(filename)
    parts=re.split(r'(?m)^  0\n',text[start:end]);kept=[parts[0]];lines=[];order=[]
    fields={'5':'handle','330':'owner','8':'layer','6':'linetype','48':'ltscale','62':'color','420':'true_color','440':'transparency','370':'lineweight'}
    line_fields=re.compile(r'(?m)^(  5|330|  8|  6| 48| 62|420|440|370| 10| 20| 30| 11| 21| 31)\n([^\n]+)')
    unusual=re.compile(r'(?m)^( 39|210|220|230|102|1001)\n')
    named=[(code.rjust(3),name,code in ('62','420','440','370')) for code,name in fields.items()]
    # Lightweight provisional geometry is sent before the complete DXF reader.
    # Only Model-space lines are included; the final scene remains authoritative.
    preview=[];preview_bounds=[math.inf,math.inf,-math.inf,-math.inf];layers={};model=None
    if progressive:
        for block in re.split(r'(?m)^  0\n',text[:start]):
            if block.startswith('BLOCK_RECORD\n') and re.search(r'(?m)^  2\n\*Model_Space\n',block,re.I):
                match=re.search(r'(?m)^  5\n([^\n]+)',block)
                if match:model=match.group(1)
            if block.startswith('LAYER\n'):
                tags=dict(re.findall(r'(?m)^([ 0-9]{3})\n([^\n]+)',block));name=tags.get('  2')
                if name:
                    aci=int(tags.get(' 62','7'));flags=int(tags.get(' 70','0'))
                    rgb='#e6edf3' if abs(aci) in (0,7) else '#%02x%02x%02x'%tuple(aci2rgb(max(1,min(255,abs(aci)))))
                    if '420' in tags:rgb='#%06x'%int(tags['420'])
                    layers[name]=(rgb,aci>0 and not flags&1)
    def send_preview():
        if preview and all(math.isfinite(v) for v in preview_bounds):
            progress('Aperçu navigable · hachures et textes en préparation…',{'rows':preview[:],'bounds':preview_bounds[:]})
            preview.clear()
    for part in parts[1:]:
        handle=re.search(r'\n  5\n([^\n]+)',part)
        if handle:order.append(handle.group(1))
        if not part.startswith('LINE\n'):kept.append('  0\n'+part);continue
        values=dict(line_fields.findall(part))
        try:
            a=[float(values[' 10']),float(values[' 20']),float(values.get(' 30',0))];b=[float(values[' 11']),float(values[' 21']),float(values.get(' 31',0))]
            attrs={name:(int(values[code]) if numeric else values[code]) for code,name,numeric in named if code in values}
            if 'ltscale' in attrs:attrs['ltscale']=float(attrs['ltscale'])
            if not attrs.get('owner') or not attrs.get('handle'):kept.append('  0\n'+part);continue
            # Keep unusual line geometry in the complete general reader.
            if unusual.search(part):kept.append('  0\n'+part);continue
            attrs.update(start=a,end=b)
            for name in ('layer','linetype'):
                if name in attrs:attrs[name]=decode_dxf_unicode(attrs[name])
            lines.append(attrs)
            if progressive and model and attrs['owner']==model and (len(lines)<=2000 or len(lines)%12==0):
                color,visible=layers.get(attrs.get('layer','0'),('#e6edf3',True))
                if visible:
                    aci=attrs.get('color',256)
                    if aci not in (0,256):color='#e6edf3' if abs(aci)==7 else '#%02x%02x%02x'%tuple(aci2rgb(max(1,min(255,abs(aci)))))
                    if 'true_color' in attrs:color='#%06x'%attrs['true_color']
                    preview.append([a[0],a[1],b[0],b[1],color])
                    for x,y in (a[:2],b[:2]):preview_bounds[:]=[min(preview_bounds[0],x),min(preview_bounds[1],y),max(preview_bounds[2],x),max(preview_bounds[3],y)]
                if len(lines)==2000 or len(preview)>=4000:send_preview()
        except (KeyError,ValueError,TypeError):kept.append('  0\n'+part)
    if progressive:send_preview()
    doc=ezdxf.read(StringIO(text[:start]+''.join(kept)+text[end:]))
    doc._alcide_lines=lines;doc._alcide_order=order;doc.filename=str(filename)
    return doc

def read_doc(filename):
    try:return ezdxf.readfile(filename)
    except ezdxf.DXFError:
        from ezdxf import recover
        doc,auditor=recover.readfile(filename)
        WARNINGS.append(f'DXF récupéré : {len(auditor.fixes)} corrections, {len(auditor.errors)} erreurs résiduelles.')
        return doc

def cache_info():
    files=[p for p in cache_dir().iterdir() if p.is_file() and not p.is_symlink() and re.fullmatch(r'[0-9a-f]{24,32}(?:-[0-9a-f]{12})?\.(?:dxf|scene\.gz|tmp|warnings\.json)',p.name)]
    return {'files':len(files),'bytes':sum(p.stat().st_size for p in files)}

def clear_cache():
    global DOC
    for doc_id,entry in DOCUMENTS.items():
        if entry['doc'] is None or getattr(entry['doc'],'_alcide_lines',None) is not None:entry['doc']=read_doc(entry['converted'])
        if doc_id==ACTIVE:DOC=entry['doc']
    root=cache_dir();count=0;size=0
    for p in root.iterdir():
        if p.is_file() and not p.is_symlink() and re.fullmatch(r'[0-9a-f]{24,32}(?:-[0-9a-f]{12})?\.(?:dxf|scene\.gz|tmp|warnings\.json)',p.name):
            size+=p.stat().st_size;p.unlink();count+=1
    # Open documents survive deletion of conversion files; hydrate lazy ones first.
    return {'files':count,'bytes':size}

def point(v):
    return [float(v[0]), float(v[1])]

def dimension_has_background(e,style):
    block=e.doc.blocks.get(e.dxf.get('geometry','')) if e.doc else None
    texts=[x for x in block if x.dxftype()=='MTEXT'] if block else []
    return any(x.dxf.get('bg_fill',0)&1 for x in texts) if texts else bool(style.get('dimtfill',0))

def metadata(e, layout, doc):
    d = e.dxf
    layer = doc.layers.get(d.layer)
    tags = {"0": e.dxftype(), "5": d.handle, "8": d.layer, "410": layout,
            "62": d.get('color', 256), "6": d.get('linetype', 'BYLAYER')}
    m = dict(byLayerTransparency=e.is_transparency_by_layer,trueColor=d.get('true_color',None),lineweight=d.get('lineweight',-1),id=d.handle, type=e.dxftype(), layer=d.layer, layout=layout,
             locked=layer.is_locked(), color=d.get('color',256), linetype=d.get('linetype','BYLAYER'),linetypeScale=d.get('ltscale',1.0),
             transparency=0 if e.is_transparency_by_block else round(e.transparency*100), tags=tags, snap=[], shape=None)
    if e.has_xdata('ALCIDE_REBAR'):
        try:
            data=json.loads(''.join(tag.value for tag in e.get_xdata('ALCIDE_REBAR') if tag.code==1000))
            if data.get('assembly',{}).get('kind') in ('bar','mesh') or isinstance(data.get('table'),dict):
                data['origin']=point(e.dxf.insert);m['reinforcement']=data
        except (ValueError,AttributeError,TypeError):pass
    if e.has_xdata('ALCIDE_ARROWS'):
        try:m['arrows']=json.loads(''.join(t.value for t in e.get_xdata('ALCIDE_ARROWS') if t.code==1000))
        except (ValueError,TypeError):pass
    if e.has_xdata('ALCIDE_ARROW'):m['arrowHead']=True
    if e.dxftype()=='IMAGE':
        try:
            ins=e.dxf.insert;u=e.dxf.u_pixel;v=e.dxf.v_pixel;w,h=e.dxf.image_size.x,e.dxf.image_size.y
            c=[ins,ins+u*w,ins+u*w+v*h,ins+v*h];corners=[[p.x,p.y] for p in c]
            name='';found=None
            idef=e.image_def
            if idef is not None:
                name=idef.dxf.get('filename','')
                cand=Path(name.replace('\\','/'))
                options=[cand] if cand.is_absolute() else []
                if SOURCE:options+=[Path(SOURCE).parent/cand,Path(SOURCE).parent/cand.name]
                found=next((str(o.resolve().as_uri()) for o in options if o.is_file()),None)
            m['image']={'corners':corners,'path':found,'name':Path(name.replace('\\','/')).name}
            m['snap']=corners
        except Exception:pass
    if e.dxftype()=='OLE2FRAME':
        try:
            box=e.bbox()
            if not box.has_data:raise ValueError('OLE sans cadre')
            lo,hi=box.extmin,box.extmax
            m['ole']={'corners':[[lo.x,lo.y],[hi.x,lo.y],[hi.x,hi.y],[lo.x,hi.y]],'name':''}
            blob=e.binary_data();preview=None
            for start,end in ((b'\x89PNG\r\n\x1a\n',b'IEND\xaeB`\x82'),(b'\xff\xd8\xff',b'\xff\xd9')):
                i=blob.find(start)
                if i>=0:
                    j=blob.find(end,i)
                    if j>i:
                        import base64
                        preview=('data:image/png;base64,' if start[1:4]==b'PNG' else 'data:image/jpeg;base64,')+base64.b64encode(blob[i:j+len(end)]).decode();break
            if preview:m['ole']['preview']=preview
            m['snap']=m['ole']['corners']
        except Exception:pass
    typ = e.dxftype()
    if typ == 'HATCH':
        m.update(pattern=d.pattern_name, patternScale=d.pattern_scale, patternAngle=d.pattern_angle)
        if e.bgcolor is not None:m['backgroundColor']='#%02x%02x%02x'%tuple(e.bgcolor)
        loops=[];editable=True;handles=[];ocs=e.ocs();elevation=e.dxf.elevation.z
        hatch_point=lambda p:point(ocs.to_wcs((p[0],p[1],elevation)))
        for path in e.paths:
            handles.extend(path.source_boundary_objects)
            if hasattr(path,'vertices'):
                if any(abs(p[2])>1e-10 for p in path.vertices):editable=False
                loops.append([hatch_point(p) for p in path.vertices])
            else:
                points=[]
                for edge in path.edges:
                    if edge.EDGE_TYPE!=1:editable=False;continue
                    points.append(hatch_point(edge.start))
                loops.append(points)
        m['nativeHatch']={'loops':loops,'boundaryHandles':handles,'editable':editable}
        tags['2'] = d.pattern_name
    if typ == 'INSERT':
        m.update(name=d.name, rotation=d.rotation, scale=[d.xscale,d.yscale,d.zscale])
        tags['2'] = d.name
        m['snap'] = [point(d.insert)]
    if typ == 'POINT':
        m['snap'] = [point(d.location)]
    if typ == 'LINE':
        a,b = point(d.start),point(d.end)
        m['snap']=[a,b,[(a[0]+b[0])/2,(a[1]+b[1])/2]]
        m['length']=math.dist(a,b)
        m['shape']=[round(abs(b[0]-a[0]),5),round(abs(b[1]-a[1]),5)]
    if typ in ('CIRCLE','ARC'):
        m['radius']=d.radius
        m['snap']=[point(d.center)]
        m['shape']=[round(d.radius,5)]
        if typ=='ARC':m['shape'].append(round((d.end_angle-d.start_angle)%360,5))
        if typ=='ARC':
            angles=[math.radians(d.start_angle),math.radians(d.end_angle)]
            m['nativeArc']={'center':point(d.center),'radius':d.radius,'startAngle':d.start_angle,'endAngle':d.end_angle}
            m['snap']=[point(d.center)]+[[d.center.x+d.radius*math.cos(a),d.center.y+d.radius*math.sin(a)] for a in angles]
    if typ=='LWPOLYLINE':
        pts=list(e.get_points('xyb'))
        m['snap']=[point(p) for p in pts]
        m['closed']=e.closed
        if pts:
            x,y=pts[0][:2]
            m['shape']=[e.closed,[[round(p[0]-x,5),round(p[1]-y,5),round(p[2],5)] for p in pts]]
    if typ in ('TEXT','MTEXT'):
        m['snap']=[point(d.insert)]
        if typ=='TEXT':m['snap']=[point(e.get_placement()[1])]
        if typ=='MTEXT':
            original=e.text
            try:e.text=normalize_mtext(original);m['text']=e.plain_text()
            finally:e.text=original
        else:m['text']=e.plain_text().replace(r'\\~',' ').replace(r'\~',' ')
        m['style']=d.style
        m['height']=d.get('height',1) if typ=='TEXT' else d.get('char_height',1)
        if typ=='TEXT':alignment={0:'left',1:'center',2:'right'}.get(d.get('halign',0),'left')+'-'+{0:'bottom',1:'bottom',2:'middle',3:'top'}.get(d.get('valign',0),'bottom')
        else:alignment=['left-top','center-top','right-top','left-middle','center-middle','right-middle','left-bottom','center-bottom','right-bottom'][max(0,min(8,d.get('attachment_point',1)-1))]
        width_match=re.search(r'\\W([0-9.]+);',e.text) if typ=='MTEXT' else None
        m['nativeText']={'fontFace':font_family(doc,d.style),'height':m['height'],'angle':e.get_rotation() if typ=='MTEXT' else float(d.get('rotation',0)),'widthFactor':float(width_match.group(1)) if width_match else float(d.get('width',1)) if typ=='TEXT' else 1,'alignment':alignment,'text':m['text'],'background':bool(d.get('bg_fill',0)&1) if typ=='MTEXT' else False}
        if typ=='MTEXT' and re.search(r'\\[fFLOKHcC]',e.text):m['nativeText']['mtext']=e.text
        tags['1']=m['text']
    if typ=='DIMENSION':
        m['dimstyle']=d.dimstyle
        style=e.override();scale=float(style.get('dimscale',1) or 1)
        post=style.get('dimpost','<>') or '<>'
        m['nativeDimension']={'height':float(style.get('dimtxt',2.5))*scale,'precision':int(style.get('dimadec',-1) if (d.dimtype&15) in (2,5) and style.get('dimadec',-1)>=0 else style.get('dimdec',2)),'rounding':float(style.get('dimrnd',0)),'factor':float(style.get('dimlfac',1)),'decimalComma':style.get('dimdsep',46)==44,'trimZeros':bool(int(style.get('dimzin',0))&8),'unit':post.split('<>')[-1].strip() if '<>' in post else 'u','showUnit':post!='<>','textHorizontal':bool(style.get('dimtih',0)),'textBackground':dimension_has_background(e,style),'kind':int(d.dimtype)&15,'editable':(int(d.dimtype)&15) in range(7) and abs(d.get('extrusion',(0,0,1))[0])<1e-8 and abs(d.get('extrusion',(0,0,1))[1])<1e-8}
        if (int(d.dimtype)&15) in (0,1):
            a,b=point(d.defpoint2),point(d.defpoint3)
            m['nativeDimension']['line']={'a':a,'b':b,'basePoint':point(d.defpoint),'angle':float(d.get('angle',0)) if (int(d.dimtype)&15)==0 else math.degrees(math.atan2(b[1]-a[1],b[0]-a[0]))}
        for key,dxf in [('dimensionLineweight','dimlwd'),('extensionLineweight','dimlwe')]:m['nativeDimension'][key]=int(style.get(dxf,-1))
        for key,dxf in [('dimensionLineType','dimltype'),('extensionLineType1','dimltex1'),('extensionLineType2','dimltex2')]:m['nativeDimension'][key]=style.get(dxf,'BYLAYER')
        for key,dxf in [('extensionGap','dimexo'),('extensionBeyond','dimexe'),('endSize','dimasz'),('extensionLength','dimfxl')]:m['nativeDimension'][key]=float(style.get(dxf,0))*scale
        for key,dxf in [('hideExtension1','dimse1'),('hideExtension2','dimse2'),('extensionFixed','dimfxlon')]:m['nativeDimension'][key]=bool(style.get(dxf,0))
        name=style.get('dimblk','') or ''
        m['nativeDimension']['endStyle']={'OBLIQUE':'oblique','DOT':'dot','DOTBLANK':'circle','OPEN30':'arrow30','':'arrow','NONE':'none','ALCIDE_DIM_DOUBLE':'double','ALCIDE_DIM_DIAMOND':'diamond','ALCIDE_DIM_SQUARE45':'square45','ALCIDE_DIM_SQUARE45OPEN':'square45open'}.get(name,'oblique')
        m['nativeDimension']['textGap']=float(style.get('dimgap',.625))*scale
        m['nativeDimension']['fontFace']=font_family(doc,style.get('dimtxsty','Standard'))
    return m

def graphic_path_data(paths,fill=False):
    return ''.join('M'+orjson.dumps(path).decode('ascii')[2:-2].replace('],[','L').replace(',',' ')+('Z' if fill else '') for path in paths if path)

def encode_graphic_primitive(p):
    if 'd' in p:return
    paths=p.pop('paths',[])
    if not paths:p['d']='';return
    origin=next((path[0] for path in paths if path),[0,0])
    local=[[[v[0]-origin[0],v[1]-origin[1]] for v in path] for path in paths]
    offset=p.get('offset',[0,0]);p['offset']=[offset[0]+origin[0],offset[1]+origin[1]]
    p['d']=graphic_path_data(local,p['fill'])


def graphic_point_count(primitive):
    return primitive.get('_pointCount',0) or sum(len(path) for path in primitive.get('paths',[]))

def append_graphic_instance(target,template,dx,dy):
    for p in template['primitives']:
        if 'd' not in p:
            p['_pointCount']=graphic_point_count(p)
            encode_graphic_primitive(p)
        offset=p.get('offset',[0,0])
        target['primitives'].append(dict(**{k:v for k,v in p.items() if k not in ('paths','offset')},offset=[offset[0]+dx,offset[1]+dy]))
    b=template['bounds'];target['bounds']=[min(target['bounds'][0],b[0]+dx),min(target['bounds'][1],b[1]+dy),max(target['bounds'][2],b[2]+dx),max(target['bounds'][3],b[3]+dy)]

class SceneBackend(Backend):
    def __init__(self, metas):
        super().__init__()
        self.metas=metas
        self.items={}
        self.images=0
    def set_background(self,color):pass
    def item(self,props):
        if getattr(self,'capture_item',None) is not None:return self.capture_item
        if not self.entity_stack:return None
        e=self.entity_stack[0][0]
        handle=e.dxf.handle
        if handle not in self.items:
            self.items[handle]=dict(self.metas.get(handle,dict(id=handle,type=e.dxftype(),layer=e.dxf.layer,snap=[],locked=False,transparency=0,tags={})), primitives=[], bounds=[math.inf,math.inf,-math.inf,-math.inf])
        return self.items[handle]
    def add(self,paths,props,fill=False):
        item=self.item(props)
        if item is None:return
        paths=[[point(p) for p in ps] for ps in paths]
        paths=[p for p in paths if p]
        if not paths:return
        color=props.color[:7]
        current=self.entity_stack[-1][0]
        inherits=current.dxf.get('color',256)==256 and not current.dxf.hasattr('true_color')
        visibility_layer=props.layer
        weight_layer=props.layer
        leaf_transparency=0 if current.is_transparency_by_block else round(current.transparency*100)
        paint_layer=props.layer
        inherits_weight=current.dxf.get('lineweight',-1)==-1
        if current.dxf.get('color',256)==0 and not current.dxf.hasattr('true_color'):
            root=self.entity_stack[0][0]
            inherits=root.dxf.get('color',256)==256 and not root.dxf.hasattr('true_color')
            if inherits:paint_layer=root.dxf.layer
        detail_kind='text' if current.dxftype() in ('TEXT','MTEXT','ATTRIB','ATTDEF') else 'hatch' if current.dxftype()=='HATCH' else ''
        detail_height=float(current.dxf.get('char_height',1) if current.dxftype()=='MTEXT' else current.dxf.get('height',1)) if detail_kind=='text' else 0
        detail_spacing=min((math.hypot(*line.offset) for line in current.pattern.lines if math.hypot(*line.offset)>1e-10),default=0) if detail_kind=='hatch' and current.pattern else 0
        b=item['bounds']
        for ps in paths:
            for x,y in ps:
                if x<b[0]:b[0]=x
                if y<b[1]:b[1]=y
                if x>b[2]:b[2]=x
                if y>b[3]:b[3]=y
        primitives=item['primitives']
        if primitives and 'paths' in primitives[-1] and primitives[-1].get('detailKind','')==detail_kind and primitives[-1].get('detailHeight',0)==detail_height and primitives[-1].get('detailSpacing',0)==detail_spacing and not fill and not primitives[-1]['fill'] and primitives[-1]['color']==color and primitives[-1].get('byLayerColor')==inherits and primitives[-1].get('paintLayer')==paint_layer and primitives[-1].get('lineweight')==props.lineweight and primitives[-1].get('byLayerWeight')==inherits_weight and primitives[-1].get('visibilityLayer')==visibility_layer and primitives[-1].get('leafTransparency')==leaf_transparency and primitives[-1].get('leafByLayerTransparency')==current.is_transparency_by_layer and primitives[-1].get('leafByBlockTransparency')==current.is_transparency_by_block and primitives[-1].get('byBlockColor')==(current.dxf.get('color',256)==0 and not current.dxf.hasattr('true_color')) and primitives[-1].get('byBlockWeight')==(current.dxf.get('lineweight',-1)==-2):
            primitives[-1]['paths'].extend(paths)
        else:primitives.append(dict(detailKind=detail_kind,detailHeight=detail_height,detailSpacing=detail_spacing,paths=paths,color=color,fill=fill,byBlockColor=current.dxf.get('color',256)==0 and not current.dxf.hasattr('true_color'),visibilityLayer=visibility_layer,weightLayer=weight_layer,leafTransparency=leaf_transparency,leafByBlockTransparency=current.is_transparency_by_block,byBlockWeight=current.dxf.get('lineweight',-1)==-2,leafByLayerTransparency=current.is_transparency_by_layer,byLayerWeight=inherits_weight,byLayerColor=inherits,paintLayer=paint_layer,lineweight=props.lineweight))
    def draw_point(self,pos,properties):self.add([[pos,pos]],properties)
    def draw_line(self,start,end,properties):self.add([[start,end]],properties)
    def draw_solid_lines(self,lines,properties):self.add(list(lines),properties)
    def draw_path(self,path,properties):self.add([list(p.flattening(.03)) for p in path.sub_paths()],properties)
    def draw_filled_paths(self,paths,properties):self.add([list(p.flattening(.03)) for path in paths for p in path.sub_paths()],properties,True)
    def draw_filled_polygon(self,points,properties):self.add([list(points.vertices())],properties,True)
    def draw_image(self,image_data,properties):self.images+=1
    def clear(self):self.items={}

class NativeAnnotationContext:
    """Respect the drawing's active annotation scale, including virtual block children."""
    def __init__(self,doc):
        self.doc=doc;self.cache={};self.hidden=set();self.scale=None;self.all_visible=True
        if doc is None:return
        variables=doc.rootdict.get('ACDBVARIABLEDICTIONARY')
        if variables is None:return
        current=variables.get('CANNOSCALE');all_visible=variables.get('ANNOALLVISIBLE')
        self.all_visible=all_visible is None or str(all_visible.dxf.value)!='0'
        if current is None:return
        from ezdxf.lldxf.tagwriter import TagCollector
        self.scales={}
        for _,scale in doc.rootdict.get('ACAD_SCALELIST',{}).items():
            tags=dict(TagCollector.dxftags(scale));paper=float(tags.get(140,1));model=float(tags.get(141,1))
            if paper>0:self.scales[scale.dxf.handle]=(tags.get(300,''),model/paper)
        self.scale=next((ratio for name,ratio in self.scales.values() if name==current.dxf.value),None)
    def visible(self,entity):
        if self.all_visible or self.scale is None:return True
        source=entity.origin_of_copy or entity;handle=source.dxf.get('handle')
        if handle in self.cache:return self.cache[handle]
        result=True
        if source.has_extension_dict:
            manager=source.get_extension_dict().dictionary.get('AcDbContextDataManager')
            contexts=manager.get('ACDB_ANNOTATIONSCALES') if manager is not None else None
            if contexts:
                from ezdxf.lldxf.tagwriter import TagCollector
                ratios=[]
                for _,context in contexts.items():
                    scale=self.scales.get(dict(TagCollector.dxftags(context)).get(340))
                    if scale:ratios.append(scale[1])
                if ratios:result=any(math.isclose(ratio,self.scale,rel_tol=1e-8) for ratio in ratios)
        if handle:
            self.cache[handle]=result
            if not result:self.hidden.add(handle)
        return result

class HatchDisplayLimit(Exception):pass

from ezdxf.entities.copy import CopyStrategy, CopySettings, default_copy

class DisplayCopyStrategy(CopyStrategy):
    def copy(self,entity):
        if entity.dxftype()=='INSERT':return default_copy.copy(entity)
        return super().copy(entity)

DISPLAY_COPY=DisplayCopyStrategy(CopySettings(copy_extension_dict=False))

class RepeatedTextFrontend(Frontend):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs);self.text_shapes={};self.hatch_segments=0;self.rendered_count=0;self.last_progress=time.perf_counter();self.annotation_context=NativeAnnotationContext(DOC);self.block_cache={};self.block_cache_points=0;self.block_cache_hits=0;self.block_cache_misses=0;self.text_cache_hits=0;self.text_cache_points=0;self.cache_clip_depth=0
    def draw_entity(self,entity,properties):
        if not self.annotation_context.visible(entity):return
        if entity.has_xdata('ALCIDE_ARROW'):return
        self.rendered_count+=1
        now=time.perf_counter()
        if now-self.last_progress>1:
            progress(f'Préparation du dessin · {self.rendered_count} objets traités…');self.last_progress=now
        return super().draw_entity(entity,properties)
    def draw_insert_display(self,entity,properties):
        # Match ezdxf's INSERT traversal but avoid copying non-graphical extension
        # dictionaries of virtual leaves. Originals remain intact for editing/export.
        from ezdxf.xclip import XClip
        from ezdxf.explode import virtual_block_reference_entities
        from ezdxf.tools import clipping_portal
        from ezdxf.path import from_vertices
        def draw_insert(insert):
            clip=XClip(insert);active=clip.has_clipping_path and clip.is_clipping_enabled
            if active:
                boundary=clip.get_wcs_clipping_path()
                shape=clipping_portal.make_inverted_clipping_shape(boundary.inner_polygon(),outer_bounds=boundary.outer_bounds()) if boundary.is_inverted_clip else clipping_portal.find_best_clipping_shape(boundary.vertices)
                self.pipeline.push_clipping_shape(shape,None)
            def children():
                for child in virtual_block_reference_entities(insert,skipped_entity_callback=self.skip_entity,copy_strategy=DISPLAY_COPY):
                    child.set_source_block_reference(insert)
                    yield child
            try:self.draw_entities(children())
            finally:
                if active:
                    if clip.get_xclip_frame_policy():self.pipeline.draw_path(path=from_vertices(boundary.inner_polygon(),close=True),properties=properties)
                    self.pipeline.pop_clipping_shape()
            self.draw_entities(insert.attribs)
        self.ctx.push_state(properties)
        try:
            if entity.mcount>1:
                for insert in entity.multi_insert():draw_insert(insert)
            else:draw_insert(entity)
        finally:self.ctx.pop_state()

    def append_rendering(self,target,template,dx,dy):
        if template['primitives']:append_graphic_instance(target,template,dx,dy)
    def draw_composite_entity(self,entity,properties):
        backend=self._alcide_backend
        if entity.dxftype()!='INSERT':return super().draw_composite_entity(entity,properties)
        clipped=False
        if entity.has_extension_dict:
            from ezdxf.xclip import XClip
            clip=XClip(entity);clipped=clip.has_clipping_path and clip.is_clipping_enabled
        if clipped or self.cache_clip_depth or entity.attribs or entity.mcount!=1:
            self.cache_clip_depth+=int(clipped)
            try:return self.draw_insert_display(entity,properties)
            finally:self.cache_clip_depth-=int(clipped)
        attrs=entity.dxf.all_existing_dxf_attribs().copy()
        for field in ('handle','owner','insert'):attrs.pop(field,None)
        root=backend.entity_stack[0][0]
        inherit=tuple(str(root.dxf.get(k,'')) for k in ('layer','color','true_color','lineweight','transparency'))
        paint=(properties.color,properties.layer,properties.lineweight,properties.linetype_name,properties.linetype_scale,tuple(properties.linetype_pattern),inherit)
        key=(json.dumps(attrs,sort_keys=True,default=str),paint)
        cached=self.block_cache.get(key);insert=entity.dxf.insert
        if cached:template,x,y=cached;self.block_cache_hits+=1
        else:
            self.block_cache_misses+=1;template={'primitives':[],'bounds':[math.inf,math.inf,-math.inf,-math.inf]};prior=getattr(backend,'capture_item',None);backend.capture_item=template
            try:self.draw_insert_display(entity,properties)
            finally:backend.capture_item=prior
            x,y=insert.x,insert.y;count=sum(graphic_point_count(p) for p in template['primitives'])
            if 0<count<=100000 and self.block_cache_points+count<=1500000:self.block_cache[key]=(template,x,y);self.block_cache_points+=count
        self.append_rendering(backend.item(properties),template,insert.x-x,insert.y-y)
    def draw_hatch_pattern(self,polygon,paths,properties):
        # Bound both baseline generation and tiny dash expansion (the upstream timeout
        # only guards baseline intersections, allowing millions of dashes to accumulate).
        from ezdxf.render import hatching
        if polygon.pattern is None or not polygon.pattern.lines:return
        if self.hatch_segments>=200000:raise HatchDisplayLimit()
        ocs=polygon.ocs();elevation=polygon.dxf.elevation.z;properties.linetype_pattern=tuple()
        lines=[];started=time.perf_counter()
        def timeout():
            if time.perf_counter()-started>0.5:raise HatchDisplayLimit()
            return False
        for baseline in hatching.pattern_baselines(polygon,min_hatch_line_distance=self.config.min_hatch_line_distance,jiggle_origin=True):
            timeout()
            for line in hatching.hatch_paths(baseline,paths,timeout):
                for a,b in baseline.pattern_renderer(line.distance).render(line.start,line.end):
                    if len(lines)>=10000 or self.hatch_segments+len(lines)>=200000:raise HatchDisplayLimit()
                    if len(lines)%256==0:timeout()
                    if ocs.transform:a,b=ocs.to_wcs((a.x,a.y,elevation)),ocs.to_wcs((b.x,b.y,elevation))
                    lines.append((a,b))
        self.hatch_segments+=len(lines);self.pipeline.draw_solid_lines(lines,properties)
    def draw_text_entity(self,e,properties):
        # Legacy Allplan exports can leave MTEXT nonbreaking-space escapes in TEXT.
        if e.dxftype() in ('TEXT','ATTRIB','ATTDEF') and '\\~' in e.dxf.text:
            e=e.copy();e.dxf.text=e.dxf.text.replace(r'\\~',' ').replace(r'\~',' ')
        return self.draw_cached_text(e,properties,super().draw_text_entity)
    def draw_hatch_entity(self,e,properties,**kwargs):
        if e.dxftype()=='HATCH' and e.bgcolor is not None and not e.dxf.solid_fill:
            background=e.copy();background.set_solid_fill()
            paint=copy.copy(properties);paint.color='#%02x%02x%02x'%tuple(e.bgcolor);paint.filling=Filling()
            backend=self._alcide_backend;handle=backend.entity_stack[0][0].dxf.handle
            start=len(backend.items.get(handle,{}).get('primitives',[]))
            super().draw_hatch_entity(background,paint,**kwargs)
            for p in backend.items.get(handle,{}).get('primitives',[])[start:]:
                p['hatchBackground']=True;p['backgroundColor']=paint.color;p['byLayerColor']=False
        try:return super().draw_hatch_entity(e,properties,**kwargs)
        except HatchDisplayLimit:
            message='Aperçu simplifié pour les hachures très denses ; leurs motifs natifs restent conservés dans le dessin et les exports.'
            if message not in WARNINGS:WARNINGS.append(message)
            display=e.copy();display.set_solid_fill();paint=copy.copy(properties);paint.filling=Filling()
            return super().draw_hatch_entity(display,paint,**kwargs)
    def draw_mtext_entity(self,e,properties):
        # DWG conversion can decode the mask margin as an invalid integer.
        # Repair the display copy only; never alter the imported source entity.
        scale=float(e.dxf.get('box_fill_scale',1.5))
        if e.dxf.get('bg_fill',0) and (not math.isfinite(scale) or not 1<=scale<=5):
            e=e.copy();e.dxf.box_fill_scale=1.5
        return self.draw_cached_text(e,properties,super().draw_mtext_entity)
    def draw_cached_text(self,e,properties,render):
        # CAD glyph strokes are continuous, regardless of the object's/layer's linetype.
        properties=copy.copy(properties);properties.linetype_pattern=tuple();properties.linetype_name='CONTINUOUS'
        backend=self._alcide_backend
        if not backend.entity_stack or self.cache_clip_depth:return render(e,properties)
        insert=e.dxf.insert;anchor=e.ocs().to_wcs(insert) if e.dxftype() in ('TEXT','ATTRIB','ATTDEF') else insert;attrs=e.dxf.all_existing_dxf_attribs().copy()
        for field in ('handle','owner','insert'):attrs.pop(field,None)
        if 'align_point' in attrs:attrs['align_point']=[v-r for v,r in zip(attrs['align_point'],insert)]
        root=backend.entity_stack[0][0]
        inherit=tuple(str(root.dxf.get(k,'')) for k in ('layer','color','true_color','lineweight','transparency'))
        key=(e.dxftype(),e.text if e.dxftype()=='MTEXT' else '',json.dumps(attrs,sort_keys=True,default=str),properties.color,properties.layer,properties.lineweight,str(properties.font),inherit,insert.z)
        cached=self.text_shapes.get(key)
        if cached:self.text_cache_hits+=1;template,x,y=cached
        else:
            template={'primitives':[],'bounds':[math.inf,math.inf,-math.inf,-math.inf]};prior=getattr(backend,'capture_item',None);backend.capture_item=template
            try:render(e,properties)
            finally:backend.capture_item=prior
            x,y=anchor.x,anchor.y
            count=sum(graphic_point_count(p) for p in template['primitives'])
            if self.text_cache_points+count<=500000:self.text_shapes[key]=(template,x,y);self.text_cache_points+=count
        target=backend.item(properties)
        if not template['primitives']:return
        dx,dy=anchor.x-x,anchor.y-y
        append_graphic_instance(target,template,dx,dy)



def scene(layout_name='Model'):
    global WARNINGS
    started=time.perf_counter();phase=started;timings={}
    def mark(name):
        nonlocal phase
        now=time.perf_counter();timings[name]=round(now-phase,4);phase=now
    require_doc()
    prepare_native_fonts(DOC)
    layout=DOC.layouts.get(layout_name)
    metas={e.dxf.handle:metadata(e,layout_name,DOC) for e in layout if hasattr(e,'transparency')}
    for name,group in DOC.groups:
        description=group.dxf.get('description','')
        if description.startswith('Alcide selection:'):
            for member in group:
                if member.dxf.handle in metas:metas[member.dxf.handle]['selectionGroup']=description.split(':',1)[1]
    # Imported exploded dimensions keep their verified original DXF group.
    for group in import_reconstruction.analyze(DOC,layout_name,suggestions_only=True,include_ungrouped=False)['proposals']:
        for handle in group['ids']:
            if handle in metas:metas[handle]['importedDimensionGroup']=group['name']
    mark('metadata');backend=SceneBackend(metas)
    prepare_native_fonts(DOC)
    ctx=RenderContext(DOC)
    ctx.set_layer_properties_override(lambda layers:[setattr(layer,'is_visible',True) for layer in layers])
    for layer in ctx.layers.values():layer.is_visible=True
    native=getattr(DOC,'_alcide_lines',[])
    owner=layout.block_record_handle
    styles={};special=[];native_lines=[];native_styles=[]
    native_bounds=[math.inf,math.inf,-math.inf,-math.inf];native_visible=0
    from ezdxf.entities import Line
    for attrs in native:
        if attrs.get('owner')!=owner:continue
        a,b=attrs['start'],attrs['end'];name=attrs.get('layer','0')
        color=attrs.get('color',256);linetype=attrs.get('linetype','BYLAYER');handle=attrs['handle']
        key=(name,color,linetype,attrs.get('true_color'),attrs.get('transparency'),attrs.get('lineweight'),attrs.get('ltscale',1))
        if key not in styles:
            props=ctx.resolve_all(Line.new(dxfattribs=attrs));layer=DOC.layers.get(name)
            trans=0 if attrs.get('transparency')==0x01000000 else round(ezdxf.colors.transparency2float(attrs.get('transparency',0x020000ff))*100)
            style=dict(byLayerTransparency='transparency' not in attrs,trueColor=attrs.get('true_color'),lineweight=attrs.get('lineweight',-1),layer=name,locked=layer.is_locked(),color=color,linetype=linetype,linetypeScale=attrs.get('ltscale',1),transparency=trans,stroke=props.color[:7],visible=props.is_visible)
            index=len(native_styles);native_styles.append(style);styles[key]=(index,props)
        index,props=styles[key]
        if props.linetype_pattern:
            line=Line.new(dxfattribs=attrs);metas[handle]=metadata(line,layout_name,DOC)
            if props.is_visible:special.append(line)
            continue
        native_lines.append([handle,index,a[0],a[1],b[0],b[1]])
        if props.is_visible:
            native_visible+=1
            native_bounds=[min(native_bounds[0],a[0],b[0]),min(native_bounds[1],a[1],b[1]),max(native_bounds[2],a[0],b[0]),max(native_bounds[3],a[1],b[1])]
    originals=[]
    for e in DOC.entitydb.values():
        if e.dxftype()=='MTEXT':
            text=e.text;fixed=normalize_mtext(text)
            if fixed!=text:originals.append((e,text));e.text=fixed
    direct=set()
    for e in layout:
        if e.dxftype()!='LINE':continue
        props=ctx.resolve_all(e)
        if not props.is_visible:continue
        # Dashed and special lines retain the general renderer.
        if props.linetype_pattern:continue
        a,b=point(e.dxf.start),point(e.dxf.end)
        item=dict(metas[e.dxf.handle],primitives=[dict(byLayerWeight=e.dxf.get('lineweight',-1)==-1,byLayerColor=not e.dxf.hasattr('true_color') and e.dxf.get('color',256)==256,paintLayer=e.dxf.layer,lineweight=props.lineweight,color=props.color[:7],fill=False,offset=a,d='M0 0L'+str(b[0]-a[0])+' '+str(b[1]-a[1]))],bounds=[min(a[0],b[0]),min(a[1],b[1]),max(a[0],b[0]),max(a[1],b[1])])
        backend.items[e.dxf.handle]=item;direct.add(e.dxf.handle)
    for e in layout:
        if e.dxftype() not in ('IMAGE','OLE2FRAME'):continue
        meta=metas.get(e.dxf.handle);spec=meta and (meta.get('image') or meta.get('ole'))
        if not spec:continue
        c=spec['corners'];a=c[0]
        item=dict(meta,primitives=[dict(byLayerWeight=True,byLayerColor=True,paintLayer=e.dxf.layer,lineweight=-1,color='#9fb3c8',fill=False,offset=a,d='M0 0'+''.join('L'+str(p[0]-a[0])+' '+str(p[1]-a[1]) for p in c[1:])+'Z')],bounds=[min(p[0] for p in c),min(p[1] for p in c),max(p[0] for p in c),max(p[1] for p in c)])
        backend.items[e.dxf.handle]=item;direct.add(e.dxf.handle)
    mark('nativeGeometry')
    try:
        frontend=RepeatedTextFrontend(ctx,backend,config=Configuration());frontend._alcide_backend=backend
        if layout_name!='Model':frontend.cache_clip_depth=1
        frontend.draw_layout(layout,finalize=True,filter_func=lambda e:e.dxf.handle not in direct)
        if special:frontend.draw_entities(special)
    finally:
        for e,text in originals:e.text=text
    mark('renderGeometry')
    items=list(backend.items.values())
    order={handle:index for index,handle in enumerate(DOC._alcide_order)} if native else {e.dxf.handle:index for index,e in enumerate(layout)}
    mapping=dict(layout.get_redraw_order())
    if mapping:items.sort(key=lambda item:(int(mapping.get(item['id'],item['id']),16) or 0xFFFFFFFFFFFFFFFF,order.get(item['id'],len(order))))
    else:items.sort(key=lambda item:order.get(item['id'],len(order)))
    for item in items:
        for p in item['primitives']:
            p.pop('_pointCount',None)
            encode_graphic_primitive(p)
    mark('encodePaths')
    missing=[m for k,m in metas.items() if k not in backend.items and k not in frontend.annotation_context.hidden and not DOC.layers.get(m['layer']).is_off() and not DOC.layers.get(m['layer']).is_frozen()]
    b=native_bounds[:]
    for i in items:
        for j in range(2):b[j]=min(b[j],i['bounds'][j]);b[j+2]=max(b[j+2],i['bounds'][j+2])
    if not items and not native_visible:b=[0,0,100,100]
    warnings=list(WARNINGS)
    if missing:warnings.append(f"{len(missing)} entités sans représentation visible : "+', '.join(sorted(set(m['type'] for m in missing))))
    if backend.images:warnings.append(f"{backend.images} images raster non affichées dans cette version.")
    if list(DOC.query('ACAD_PROXY_ENTITY')):warnings.append('Présence d’objets proxy : leur affichage peut être incomplet.')
    draw_order=sorted(order,key=lambda handle:(int(mapping.get(handle,handle),16) or 0xFFFFFFFFFFFFFFFF,order[handle])) if mapping else list(order)
    return dict(sceneTimings=timings,renderStats=dict(blockCacheHits=frontend.block_cache_hits,blockCacheMisses=frontend.block_cache_misses,blockCachePoints=frontend.block_cache_points,textCachePoints=frontend.text_cache_points,textCacheHits=frontend.text_cache_hits),fontResolution={name:font.filename for name,font in ctx.fonts.items()},linetypes={lt.dxf.name:[max(abs(v)*float(DOC.header.get('$LTSCALE',1)),1e-8) for v in lt.pattern_tags.compile() if v==0 or abs(v)>1e-10] for lt in DOC.linetypes},measurementScale=document_scale.read(DOC),layerInfo=layer_info(),nativeLines=native_lines,nativeStyles=native_styles,drawOrder=draw_order if native_lines else [],items=items,catalog=[m for handle,m in metas.items() if handle not in backend.items],bounds=b,requiresLocalRendering=any(abs(v)>100000 for v in b),layouts=DOC.layout_names(),layout=layout_name,source=SOURCE,
                units=int(DOC.header.get('$INSUNITS',0)),warnings=warnings,
                entities=len(metas)+len(native_lines),rendered=len(items)+native_visible,sceneSeconds=round(time.perf_counter()-started,3))

def open_file(filename,doc_id='default'):
    enabled=gc.isenabled();gc.disable()
    try:return _open_file(filename,doc_id)
    finally:
        if enabled:gc.enable()

def _open_file(filename,doc_id='default'):
    global DOC,SOURCE,WARNINGS,ACTIVE
    t=time.perf_counter();phase=t;timings={}; filename=str(Path(filename).resolve()); WARNINGS=[];ACTIVE=doc_id
    def mark(name):
        nonlocal phase
        now=time.perf_counter();timings[name]=round(now-phase,4);phase=now
    p=Path(filename)
    if p.suffix.lower() not in ('.dwg','.dxf'):raise ValueError('Ouvrir un fichier DWG ou DXF.')
    key=cache_key(filename);target=p;hit=scene_path(key,'Model')
    if p.suffix.lower()=='.dwg':target=cache_dir()/(key+'.dxf')
    fresh_hit,fresh_target=hit,target
    if hit.exists() and target.exists():
        progress('Chargement du dessin préparé…')
        # Validate the cache before trusting it. Corruption triggers a normal rebuild.
        try:
            manifest=hit.with_name(hit.name.removesuffix('.scene.gz')+'.warnings.json');stat=hit.stat()
            if manifest.exists():
                r=json.loads(manifest.read_text(encoding='utf8'))
                if r.get('size')!=stat.st_size or r.get('mtime')!=stat.st_mtime_ns:raise ValueError('Cache modifié')
            else:
                with gzip.open(hit,'rt',encoding='utf8') as f:r=json.load(f)
                if 'items' not in r:raise ValueError('Cache invalide')
                write_manifest(hit,r)
            if r.get('source')!=str(p):raise ValueError('Cache invalide')
            DOCUMENTS[doc_id]=dict(doc=None,source=str(p),warnings=r['warnings'],key=key,converted=str(target))
            DOC=None;SOURCE=str(p);WARNINGS=r['warnings']
            return dict(sceneFile=str(hit),cacheHit=True,openSeconds=round(time.perf_counter()-t,3),docId=doc_id)
        except (OSError,ValueError,KeyError,EOFError):
            if hit==fresh_hit:hit.unlink(missing_ok=True)
            hit,target=fresh_hit,fresh_target
    if p.suffix.lower()=='.dwg':
        if not target.exists():
            progress('Lecture du DWG et conversion…')
            try:
                dwg_export.converter()
            except ValueError:
                result=subprocess.run([str(ROOT/'dwg'/'dwg2dxf.exe'),'-v0','-y','-o',str(target),filename],capture_output=True,timeout=120,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
                if not target.exists() or target.stat().st_size<100:raise ValueError('Lecture DWG impossible. '+result.stderr.decode(errors='replace')[-500:])
                WARNINGS.append('Lecture LibreDWG de secours : les couleurs RVB et les remplissages doivent être vérifiés. Installez ODA pour une lecture fidèle.')
            else:
                dwg_export.convert(p,target,'DXF')
        filename=str(target)
    mark('conversion')
    progress('Préparation des hachures, textes et blocs…')
    DOC=read_converted(filename,progressive=True) if p.suffix.lower()=='.dwg' else read_doc(filename);SOURCE=str(p)
    mark('readDocument')
    # Large previews would duplicate hundreds of thousands of lines across IPC.
    if p.suffix.lower()!='.dwg' and len(DOC.modelspace())<20000:progress('Aperçu du plan · préparation des hachures et textes…',preview_lines(DOC))
    DOCUMENTS[doc_id]=dict(doc=DOC,source=SOURCE,warnings=WARNINGS,key=key,converted=filename)
    try:preview=preview_blocks(DOC)
    except Exception:preview=None
    if preview:progress('Aperçu des blocs disponible · préparation des détails…',preview)
    mark('preview');r=scene();mark('scene');progress('Mise en cache du dessin…');file=write_scene(r,key);mark('writeCache')
    return dict(sceneFile=file,cacheHit=False,openSeconds=round(time.perf_counter()-t,3),loadTimings=timings,docId=doc_id)

def dimension_part_style(doc, values):
    patch={}
    for key,dxf in [('dimensionLineweight','dimlwd'),('extensionLineweight','dimlwe')]:
        if key in values:
            weight=int(values[key])
            if weight not in (-1,-2,-3,0,5,9,13,15,18,20,25,30,35,40,50,53,60,70,80,90,100,106,120,140,158,200,211):raise ValueError('Épaisseur de cote incorrecte.')
            patch[dxf]=weight
    for key,dxf in [('dimensionLineType','dimltype'),('extensionLineType1','dimltex1'),('extensionLineType2','dimltex2')]:
        if key in values:
            name=str(values[key]).upper()
            standard=line_patterns.STANDARD
            if name in standard and name not in doc.linetypes:doc.linetypes.new(name,dxfattribs={'description':'DWG-Alcide','pattern':standard[name]})
            if name not in ('BYLAYER','BYBLOCK') and name not in doc.linetypes:raise ValueError('Type de trait de cote inconnu.')
            patch[dxf]=name
    return patch

def dimension_end_block(doc, kind):
    names={'oblique':'OBLIQUE','dot':'DOT','circle':'DOTBLANK','arrow30':'OPEN30','arrow':'','none':'NONE'}
    if kind in names:return names[kind]
    name='ALCIDE_DIM_'+str(kind).upper()
    if name not in doc.blocks:
        block=doc.blocks.new(name)
        attrs={'layer':'0','color':0}
        if kind=='double':
            for shift in (-.18,.18):block.add_line((shift-.4,-.4),(shift+.4,.4),dxfattribs=attrs)
        elif kind=='square45':block.add_solid([(-.35,0),(0,-.35),(0,.35),(.35,0)],dxfattribs=attrs)
        elif kind=='square45open':block.add_lwpolyline([(-.35,0),(0,-.35),(.35,0),(0,.35)],close=True,dxfattribs=attrs)
        elif kind=='diamond':block.add_solid([(-.45,0),(0,-.3),(0,.3),(.45,0)],dxfattribs=attrs)
        else:raise ValueError('Limite de cote inconnue.')
    return name

def apply_dimension_style(e,values):
    if e.has_xdata('ALCIDE_BALANCED') and any(k in values for k in ('anchors','precision','rounding','factor')):e.dxf.text='<>'
    if 'anchors' in values:
        anchors=values['anchors']
        if e.dimtype not in (0,1) or len(anchors)!=2 or any(len(p)!=2 or not all(math.isfinite(float(v)) for v in p) for p in anchors) or math.dist(*anchors)<1e-9:raise ValueError('Ancrages de cote invalides.')
        e.dxf.defpoint2=(*anchors[0],e.dxf.defpoint2.z);e.dxf.defpoint3=(*anchors[1],e.dxf.defpoint3.z)
    style=e.override();patch={}
    patch.update(dimension_part_style(e.doc,values))
    scale=float(style.get('dimscale',1) or 1)
    mappings={'height':'dimtxt','precision':'dimdec','rounding':'dimrnd','factor':'dimlfac','textGap':'dimgap','extensionGap':'dimexo','extensionBeyond':'dimexe','endSize':'dimasz','extensionLength':'dimfxl'}
    for key,dxf in mappings.items():
        if key not in values:continue
        val=float(values[key])
        if not math.isfinite(val) or val<0 or (key=='height' and val<=0):raise ValueError('Paramètre de cote incorrect.')
        if key=='precision':
            if int(val)!=val or val>6:raise ValueError('Décimales : choisir entre 0 et 6.')
            val=int(val)
        if key in ('height','textGap','extensionGap','extensionBeyond','endSize','extensionLength'):val/=scale
        if key=='precision' and e.dimtype in (2,5):dxf='dimadec'
        patch[dxf]=val
    for key,dxf in [('hideExtension1','dimse1'),('hideExtension2','dimse2'),('extensionFixed','dimfxlon')]:
        if key in values:patch[dxf]=int(bool(values[key]))
    if 'endStyle' in values:patch.update(dimblk=dimension_end_block(e.doc,values['endStyle']),dimtsz=0)
    if 'fontFace' in values:patch['dimtxsty']=text_font(e.doc,values['fontFace'])
    if 'decimalComma' in values:patch['dimdsep']=44 if values['decimalComma'] else 46
    if 'trimZeros' in values:patch['dimzin']=(int(style.get('dimzin',0))&~8)|(8 if values['trimZeros'] else 0)
    if 'unit' in values:
        unit=str(values['unit'])
        if e.dimtype in (2,5):raise ValueError('Les unités de longueur ne s’appliquent pas aux cotes angulaires.')
        if unit not in ('u','mm','cm','m','in','ft'):raise ValueError('Unité de cote inconnue.')
        patch['dimpost']='<>' if unit=='u' else '<> '+unit
    if 'textHorizontal' in values:patch['dimtih']=patch['dimtoh']=int(bool(values['textHorizontal']))
    if 'textBackground' in values:patch['dimtfill']=1 if values['textBackground'] else 0
    mode=values.get('textOrientation')
    if mode:
        angle=float(e.dxf.get('angle',0))
        if angle>90 or angle<-90:angle+=180
        e.dxf.text_rotation={'horizontal':0,'vertical':90,'reversed':angle+180,'aligned':angle}[mode]
        patch['dimtih']=patch['dimtoh']=0
    elif 'textBackground' in values and e.dxf.hasattr('text_rotation'):
        # A mask changes only the fill; keep the explicit source orientation.
        e.dxf.text_rotation=float(e.dxf.text_rotation)

    style.update(patch)
    if set(values)=={'textBackground'}:
        source=e.virtual_block_content or e.get_geometry_block()
        if source is not None and any(x.dxftype()=='MTEXT' for x in source):
            block=e.doc.blocks.new_anonymous_block(type_char='D')
            for x in source:
                entity=x.copy()
                if entity.dxftype()=='MTEXT':
                    entity.dxf.bg_fill=3 if values['textBackground'] else 0
                    entity.dxf.box_fill_scale=1.5
                block.add_entity(entity)
            e.dxf.geometry=block.name;style.commit();e.virtual_block_content=None
            return
    position=values.get('textPosition')
    if position is None and e.dxf.dimtype&128 and e.dxf.hasattr('text_midpoint'):position=point(e.dxf.text_midpoint)
    if position is not None:
        if len(position)!=2 or not all(math.isfinite(float(v)) for v in position):raise ValueError('Position du texte incorrecte.')
        style.set_location(position,leader=True,relative=False)
    style.render()
    # Copies retain the source block cache; display the newly generated block.
    e.virtual_block_content=None

# Motifs Alcide : (angle de base, facteur d'espacement, décalage relatif) ; même table que hatch-tools.js.
ALCIDE_HATCH_PATTERNS={'ANSI31':[(45,1,0)],'ANSI37':[(45,1,0),(135,1,0)],'HORIZ':[(0,1,0)],'VERT':[(90,1,0)],'DIAG_INV':[(135,1,0)],'CARREAUX':[(0,1,0),(90,1,0)],'LOSANGES':[(60,1,0),(120,1,0)],'SERREES':[(45,.5,0)],'BETON':[(45,1,0),(45,1,.25)]}
# 0.7.4 : motifs AutoCAD standard (acad.pat / acadiso.pat, pointillés compris), via la table ISO d'ezdxf.
ACAD_HATCH_PATTERNS=('ANSI32','ANSI33','ANSI34','ANSI35','ANSI36','ANSI38','AR-B816','AR-CONC','AR-SAND','EARTH','GRAVEL','INSUL','STEEL','HONEY','DOTS','CROSS','ZIGZAG','NET','SQUARE','BRICK','AR-RROOF')
def acad_hatch_fill(e,name,gap,angle,**attrs):
    from ezdxf.tools import pattern as _pattern
    e.set_pattern_fill(name,angle=angle,scale=gap/3.175,definition=_pattern.ISO_PATTERN[name],**attrs)
def alcide_hatch_definition(pattern,gap):
    out=[]
    for a,k,shift in ALCIDE_HATCH_PATTERNS[pattern]:
        g=gap*k;r=math.radians(a);n=(-math.sin(r),math.cos(r))
        out.append([a,[n[0]*g*shift,n[1]*g*shift],[n[0]*g,n[1]*g],[]])
    return out

def apply_hatch_style(e,style):
    if e.dxftype()!='HATCH':raise ValueError('Choisissez une hachure.')
    name=style.get('pattern',e.dxf.pattern_name)
    angle=float(style.get('angle',e.dxf.pattern_angle));scale=float(style.get('scale',e.dxf.pattern_scale))
    if not math.isfinite(angle) or not math.isfinite(scale) or scale<=0:raise ValueError('Angle et échelle de hachure incorrects.')
    if name=='SOLID':e.set_solid_fill(color=e.dxf.color)
    elif name!=e.dxf.pattern_name or e.dxf.solid_fill:
        if name not in ALCIDE_HATCH_PATTERNS and name not in ACAD_HATCH_PATTERNS:raise ValueError('Choisissez une hachure proposée ou conservez le motif existant.')
        if name in ACAD_HATCH_PATTERNS:acad_hatch_fill(e,name,3.175*scale,angle,color=e.dxf.color)
        elif name in ('ANSI31','ANSI37'):e.set_pattern_fill(name,color=e.dxf.color,angle=angle,scale=scale)
        else:e.set_pattern_fill(name,color=e.dxf.color,angle=angle,scale=1,definition=alcide_hatch_definition(name,3.175*scale))
    else:
        e.set_pattern_scale(scale);e.set_pattern_angle(angle)
    if 'backgroundColor' in style:
        color=style['backgroundColor']
        if color is None:del e.bgcolor
        elif re.fullmatch(r'#[0-9a-fA-F]{6}',color):e.bgcolor=ezdxf.colors.int2rgb(int(color[1:],16))
        else:raise ValueError('Couleur de fond incorrecte.')

def apply_hatch_geometry(e,operations):
    for op in operations:
        if 'replaceCircles' in op:
            from ezdxf.entities.boundary_paths import EdgePath
            for replacement in op['replaceCircles']:
                index=int(replacement['index']);center=replacement['center'];radius=float(replacement['radius'])
                if index<0 or index>=len(e.paths) or len(center)!=2 or not all(math.isfinite(float(v)) for v in [*center,radius]) or radius<=0:raise ValueError('Cercle de remplissage incorrect.')
                original=e.paths.paths[index];path=EdgePath();path.path_type_flags=original.path_type_flags;path.source_boundary_objects=list(original.source_boundary_objects);c=e.ocs().from_wcs((center[0],center[1],e.dxf.elevation.z));path.add_arc((c.x,c.y),radius,0,360,ccw=True);e.paths.paths[index]=path
            continue
        if 'replacePaths' in op:
            for replacement in op['replacePaths']:
                index=int(replacement['index']);points=replacement['points']
                if index<0 or index>=len(e.paths) or len(points)<3 or any(len(p)!=2 or not all(math.isfinite(float(v)) for v in p) for p in points):raise ValueError('Contour de remplissage incorrect.')
                original=e.paths.paths[index];flags=original.path_type_flags;handles=list(original.source_boundary_objects)
                from ezdxf.entities.boundary_paths import PolylinePath
                ocs=e.ocs();z=e.dxf.elevation.z;local=[ocs.from_wcs((p[0],p[1],z)) for p in points]
                path=PolylinePath.from_vertices([(p.x,p.y) for p in local],is_closed=True,flags=flags);path.source_boundary_objects=handles;e.paths.paths[index]=path
            continue
        rect=op['rect'];delta=op['delta']
        if len(rect)!=4 or len(delta)!=2 or not all(math.isfinite(float(x)) for x in rect+delta):raise ValueError('Étirement de hachure incorrect.')
        space=op.get('space')
        if space:
            pivot=space['pivot'];angle=float(space['angle']);dx=float(space.get('dx',0));dy=float(space.get('dy',0))
            if len(pivot)!=2 or not all(math.isfinite(float(v)) for v in [*pivot,angle,dx,dy]):raise ValueError('Repère de hachure incorrect.')
            c=math.cos(math.radians(angle));s=math.sin(math.radians(angle));world_delta=list(delta)
            for mirror in reversed(space.get('mirrors',[])):
                a=mirror['a'];b=mirror['b'];angle=math.atan2(b[1]-a[1],b[0]-a[0]);co=math.cos(2*angle);si=math.sin(2*angle)
                world_delta=[co*world_delta[0]+si*world_delta[1],si*world_delta[0]-co*world_delta[1]]
            local_delta=(c*world_delta[0]+s*world_delta[1],-s*world_delta[0]+c*world_delta[1])
        def moved(p):
            ocs=e.ocs();elevation=e.dxf.elevation.z;world=ocs.to_wcs((p[0],p[1],elevation));p=(world.x,world.y)
            if space:
                x=p[0]-pivot[0];y=p[1]-pivot[1];test=(pivot[0]+c*x-s*y+dx,pivot[1]+s*x+c*y+dy);move=local_delta
            else:test=p;move=delta
            if space:
                for mirror in space.get('mirrors',[]):
                    a=mirror['a'];b=mirror['b'];vx=b[0]-a[0];vy=b[1]-a[1];length=vx*vx+vy*vy
                    if length<1e-12:raise ValueError('Axe de miroir incorrect.')
                    t=((test[0]-a[0])*vx+(test[1]-a[1])*vy)/length
                    test=(2*(a[0]+t*vx)-test[0],2*(a[1]+t*vy)-test[1])
            result=(p[0]+move[0],p[1]+move[1]) if rect[0]<=test[0]<=rect[2] and rect[1]<=test[1]<=rect[3] else (p[0],p[1])
            native=ocs.from_wcs((result[0],result[1],world.z));return (native.x,native.y)

        for path in e.paths:
            if hasattr(path,'vertices'):
                if any(abs(p[2])>1e-10 for p in path.vertices):raise ValueError('Cette hachure courbe nécessite un autre outil de modification.')
                path.vertices=[(*moved(p),p[2]) for p in path.vertices]
            else:
                for edge in path.edges:
                    if edge.EDGE_TYPE!=1:raise ValueError('Cette hachure courbe nécessite un autre outil de modification.')
                    edge.start=ezdxf.math.Vec2(moved(edge.start));edge.end=ezdxf.math.Vec2(moved(edge.end))

def preview_hatches(requests):
    require_doc(full=True);results=[]
    for request in requests:
        source=DOC.entitydb.get(request['source'])
        if source is None or source.dxftype()!='HATCH':raise ValueError('Hachure introuvable.')
        e=source.copy();e.dxf.handle=request['id'];apply_hatch_geometry(e,request.get('geometry',[]));apply_hatch_style(e,request.get('style',{}))
        meta=metadata(e,source.get_layout().name,DOC);meta['id']=request['id']
        backend=SceneBackend({request['id']:meta});prepare_native_fonts(DOC);ctx=RenderContext(DOC)
        ctx.set_layer_properties_override(lambda layers:[setattr(layer,'is_visible',True) for layer in layers])
        for layer in ctx.layers.values():layer.is_visible=True
        frontend=RepeatedTextFrontend(ctx,backend,config=Configuration());frontend._alcide_backend=backend;frontend.draw_entities([e])
        item=backend.items.get(request['id'])
        if not item or not item['primitives']:raise ValueError('La hachure ne produit pas de représentation visible.')
        results.append(item)
    return results

def preview_dimension_styles(requests):
    require_doc(full=True);results=[]
    prepare_native_fonts(DOC)
    ctx=RenderContext(DOC)
    ctx.set_layer_properties_override(lambda layers:[setattr(layer,'is_visible',True) for layer in layers])
    for layer in ctx.layers.values():layer.is_visible=True
    for index,request in enumerate(requests):
        if index%10==0:progress(f'Mise à jour des cotes : {index} / {len(requests)}…')
        original=DOC.entitydb.get(request['source'])
        if original is None or original.dxftype()!='DIMENSION':raise ValueError('Cote DWG introuvable.')
        if original.dxf.dimtype&15 not in range(7):raise ValueError('Ce type de cote ne peut pas être régénéré.')
        e=original.copy();handle=request['id'];e.dxf.handle=handle
        blocks=set(DOC.blocks.block_names())
        try:
            apply_dimension_style(e,request['style'])
            meta=metadata(e,original.get_layout().name,DOC);meta['id']=handle
            backend=SceneBackend({handle:meta})
            frontend=RepeatedTextFrontend(ctx,backend,config=Configuration());frontend._alcide_backend=backend
            frontend.draw_entities([e])
            item=backend.items.get(handle)
            if not item or not item['primitives']:raise ValueError('La cote ne produit pas de géométrie visible.')
            results.append(item)
        finally:
            for name in set(DOC.blocks.block_names())-blocks:
                if name.upper().startswith('*D'):DOC.blocks.delete_block(name,safe=False)
    return results

def strip_toplevel_mtext_colors(text):
    """Couleur d'objet appliquée : retire les codes couleur hors accolades, garde ceux d'une mise en forme locale {…}."""
    out=[];depth=0;i=0
    while i<len(text):
        c=text[i]
        if c=='\\' and i+1<len(text):
            m=re.match(r'\\[Cc][0-9]+;',text[i:])
            if m and depth==0:i+=m.end();continue
            out.append(text[i:i+2]);i+=2;continue
        if c=='{':depth+=1
        elif c=='}':depth=max(0,depth-1)
        out.append(c);i+=1
    return ''.join(out)

def unify_dimension_color(e):
    """Give this dimension its own geometry, inheriting the root color everywhere."""
    style=e.override()
    style.update({'dimclrd':0,'dimclre':0,'dimclrt':0})
    style.commit()
    def strip_colors(text):
        return re.sub(r"\\[Cc][0-9]+;",'',text)
    if e.dxf.hasattr('text'):e.dxf.text=strip_colors(e.dxf.text)
    source=e.virtual_block_content if e.virtual_block_content is not None else e.get_geometry_block()
    if source is None:return
    def clone_block(content,ancestors=()):
        block=e.doc.blocks.new_anonymous_block(type_char='D')
        for original in content:
            child=original.copy()
            child.dxf.color=0
            child.dxf.layer='0'
            child.dxf.discard('true_color')
            if child.dxftype()=='MTEXT':child.text=strip_colors(child.text)
            if child.dxftype()=='INSERT':
                name=child.dxf.name
                nested=e.doc.blocks.get(name)
                if nested is not None and name not in ancestors:
                    child.dxf.name=clone_block(nested,ancestors+(name,)).name
            block.add_entity(child)
        return block
    e.dxf.geometry=clone_block(source).name
    e.virtual_block_content=None



ARROW_STYLES=('filled','open','oblique','triangle','circle','square','diamond','bar')
def arrow_spec(value):
    if not isinstance(value,dict):return None
    mode=value.get('mode','none')
    if mode not in ('start','end','both'):return None
    size=float(value.get('size',0));style=value.get('style','filled')
    if not math.isfinite(size) or size<=0:raise ValueError('Taille de flèche positive requise.')
    if style not in ARROW_STYLES:raise ValueError('Style de flèche incorrect.')
    return {'mode':mode,'size':size,'style':style}
def arrow_ends(e):
    """Return [(tip,(ux,uy))] for start and end, u pointing outward along the curve tangent."""
    if e.dxftype()=='LINE':
        a=(e.dxf.start.x,e.dxf.start.y);b=(e.dxf.end.x,e.dxf.end.y);L=math.dist(a,b) or 1
        u=((b[0]-a[0])/L,(b[1]-a[1])/L);return [(a,(-u[0],-u[1])),(b,u)]
    pts=list(e.get_points('xyb'))
    if len(pts)<2:return []
    def tangent(p,q,bulge,at_start):
        c=math.atan2(q[1]-p[1],q[0]-p[0]);d=2*math.atan(bulge)
        return c-d if at_start else c+d
    a0=tangent(pts[0],pts[1],pts[0][2],True);n=len(pts);a1=tangent(pts[n-2],pts[n-1],pts[n-2][2],False)
    return [((pts[0][0],pts[0][1]),(-math.cos(a0),-math.sin(a0))),((pts[-1][0],pts[-1][1]),(math.cos(a1),math.sin(a1)))]
def add_arrow_heads(e,spec):
    layout=e.get_layout();attrs={'layer':e.dxf.layer,'color':e.dxf.get('color',256)}
    if e.dxf.hasattr('true_color'):attrs['true_color']=e.dxf.true_color
    ends=arrow_ends(e);chosen=[ends[0]] if spec['mode']=='start' else [ends[1]] if spec['mode']=='end' else ends
    s=spec['size'];w=s/3;made=[]
    for tip,(ux,uy) in chosen:
        bx,by=tip[0]-ux*s,tip[1]-uy*s;nx,ny=-uy*w/2,ux*w/2
        if spec['style']=='filled':h=layout.add_solid([tip,(bx+nx,by+ny),(bx-nx,by-ny)],dxfattribs=attrs)
        elif spec['style'] in ('open','triangle'):h=layout.add_lwpolyline([(bx+nx,by+ny),tip,(bx-nx,by-ny)],close=spec['style']=='triangle',dxfattribs=attrs)
        elif spec['style']=='circle':h=layout.add_circle(tip,s/4,dxfattribs=attrs)
        elif spec['style'] in ('square','diamond','bar'):
            vx,vy=ux*s/4,uy*s/4;nx,ny=-uy*s/4,ux*s/4
            if spec['style']=='bar':h=layout.add_line((tip[0]-nx,tip[1]-ny),(tip[0]+nx,tip[1]+ny),dxfattribs=attrs)
            else:
                if spec['style']=='diamond':pts=[(tip[0]+2*vx,tip[1]+2*vy),(tip[0]+2*nx,tip[1]+2*ny),(tip[0]-2*vx,tip[1]-2*vy),(tip[0]-2*nx,tip[1]-2*ny)]
                else:pts=[(tip[0]+vx+nx,tip[1]+vy+ny),(tip[0]-vx+nx,tip[1]-vy+ny),(tip[0]-vx-nx,tip[1]-vy-ny),(tip[0]+vx-nx,tip[1]+vy-ny)]
                h=layout.add_lwpolyline(pts,close=True,dxfattribs=attrs)
        else:
            q=s/2;c,sn=math.cos(math.pi/4),math.sin(math.pi/4);dx,dy=(ux*c-uy*sn)*q,(ux*sn+uy*c)*q
            h=layout.add_line((tip[0]-dx,tip[1]-dy),(tip[0]+dx,tip[1]+dy),dxfattribs=attrs)
        h.set_xdata('ALCIDE_ARROW',[(1000,e.dxf.handle)]);made.append(h)
    return made
def regenerate_arrows(out,edits):
    for name in ('ALCIDE_ARROW','ALCIDE_ARROWS'):
        if name not in out.appids:out.appids.new(name)
    layouts=list(out.layouts)
    for layout in layouts:
        for h in [x for x in layout if x.has_xdata('ALCIDE_ARROW')]:layout.delete_entity(h)
    owners=[]
    for layout in layouts:
        for e in list(layout):
            if e.dxftype() not in ('LINE','LWPOLYLINE'):continue
            spec=None
            edit=(edits or {}).get(e.dxf.handle)
            if e.has_xdata('ALCIDE_ARROWS'):
                try:spec=json.loads(''.join(t.value for t in e.get_xdata('ALCIDE_ARROWS') if t.code==1000))
                except ValueError:spec=None
            owners.append((e,spec))
    return owners
def apply_arrows(e,value):
    spec=arrow_spec(value)
    if e.has_xdata('ALCIDE_ARROWS'):e.discard_xdata('ALCIDE_ARROWS')
    if spec is None:return []
    e.set_xdata('ALCIDE_ARROWS',[(1000,json.dumps(spec))]);return add_arrow_heads(e,spec)
def export(filename,changes,dimensions,edits=None,layer_changes=None,reinforcement=None,backup=False):
    # Work on a fresh copy; never mutate the source or the active document.
    from io import StringIO
    path=Path(filename)
    if path.suffix.lower() not in ('.dwg','.dxf'):raise ValueError('Choisissez DWG ou DXF.')
    if SOURCE and path.resolve()==Path(SOURCE).resolve():raise ValueError('Choisir un autre nom pour préserver le dessin source.')
    if path.suffix.lower()=='.dwg' and SOURCE and Path(SOURCE).suffix.lower()=='.dwg' and not any((changes,dimensions,edits,layer_changes,reinforcement)):
        return {**dwg_export.copy_original(SOURCE,path,backup=backup),'dimensions':0}
    if path.suffix.lower()=='.dwg' and SOURCE and Path(SOURCE).suffix.lower()=='.dwg':
        out=dwg_export.source_document(SOURCE)
    else:
        require_doc(full=True);auditor=DOC.audit()
        if auditor.has_errors:raise ValueError('Le DXF source présente des erreurs de structure non réparables.')
        s=StringIO();DOC.write(s);s.seek(0);out=ezdxf.read(s)
    if 'ALCIDE_COTES' not in out.layers:out.layers.new('ALCIDE_COTES',dxfattribs={'color':3})
    if 'ALCIDE_TEXTES' not in out.layers:out.layers.new('ALCIDE_TEXTES',dxfattribs={'color':3})
    final_locks=[]
    for name,props in (layer_changes or {}).items():
        if name not in out.layers and props.get('created'):
            if not name or len(name)>255 or re.search(r'[<>/\\":;?*|=\x00-\x1f]',name):raise ValueError('Nom de calque incorrect.')
            out.layers.new(name,dxfattribs={'color':3})
        if name not in out.layers:continue
        layer=out.layers.get(name)
        if 'color' in props:
            color=props['color']
            if not re.fullmatch(r'#[0-9a-fA-F]{6}',color):raise ValueError('Couleur de calque incorrecte.')
            layer.dxf.true_color=int(color[1:],16)
        if 'lineweight' in props:
            weight=int(props['lineweight'])
            if weight not in (-3,0,5,9,13,15,18,20,25,30,35,40,50,53,60,70,80,90,100,106,120,140,158,200,211):raise ValueError('Épaisseur de calque incorrecte.')
            layer.dxf.lineweight=weight
        if 'transparency' in props:layer.transparency=max(0,min(.9,float(props['transparency'])/100))
        if 'linetype' in props:layer.dxf.linetype=line_patterns.ensure(out,props['linetype'])
        if 'description' in props:layer.description=str(props['description'])[:255]
        if 'plot' in props:layer.dxf.plot=int(bool(props['plot']))
        if 'visible' in props:
            if props['visible']:layer.on();layer.thaw()
            else:layer.off()
        if 'locked' in props:
            layer.unlock()
            if props['locked']:final_locks.append(layer)
    copies={}
    draw_order_companions={}
    annotation_groups=[]
    if 'ALCIDE_TEXTES' not in out.layers:out.layers.new('ALCIDE_TEXTES',dxfattribs={'color':3})
    for handle,edit in (edits or {}).items():
        a=edit.get('annotation')
        if not a or edit.get('deleted'):continue
        layout=out.layouts.get(a.get('layout','Model'))
        text=str(a['text']);attrs={'layer':'ALCIDE_TEXTES','color':256,'insert':a['position'],'rotation':float(a.get('angle',0))}
        if '\n' in text or a.get('mtext'):
            escaped=str(a['mtext']) if a.get('mtext') else text.replace('\\','\\\\').replace('{','\\{').replace('}','\\}').replace('\n','\\P')
            height=float(a['height']);angle=math.radians(float(a.get('angle',0)))
            attrs['char_height']=height;attrs['attachment_point']=1
            attrs['insert']=a['position'] if a.get('alignment') else [a['position'][0]-math.sin(angle)*height,a['position'][1]+math.cos(angle)*height]
            e=layout.add_mtext(escaped,dxfattribs=attrs)
        else:
            attrs['height']=float(a['height']);e=layout.add_text(text,dxfattribs=attrs)
        apply_text_style(e,{**{k:a[k] for k in ('fontFace','widthFactor','alignment') if k in a},'keepInline':bool(a.get('mtext'))})
        copies[handle]=e
        members=[e]
        axis=a.get('axis')
        if axis and axis.get('bubbleCenters'):
            layer=edit.get('props',{}).get('layer','ALCIDE_TEXTES')
            dx,dy=edit.get('dx',0),edit.get('dy',0)
            if 'CENTER' not in out.linetypes:out.linetypes.new('CENTER',dxfattribs={'description':'DWG-Alcide axe long-court','pattern':[2.2,1.2,-.4,.2,-.4]})
            axis_points=[[p[0]+dx,p[1]+dy] for p in axis['points']]
            line=layout.add_line(axis_points[0],axis_points[1],dxfattribs={'layer':layer,'color':256,'linetype':'CENTER','ltscale':float(axis.get('dashScale',1))})
            members.append(line)
            for center in axis['bubbleCenters']:members.append(layout.add_circle([center[0]+dx,center[1]+dy],float(axis['bubbleRadius']),dxfattribs={'layer':layer,'color':256}))
            for position in axis.get('textPositions',[])[1:]:
                attrs2=dict(attrs);attrs2['insert']=[position[0]+dx,position[1]+dy]
                extra=layout.add_text(text,dxfattribs=attrs2)
                apply_text_style(extra,{k:a[k] for k in ('fontFace','widthFactor','alignment') if k in a})
                members.append(extra)
        else:
            for points in a.get('decorations',[]):
                pts=[[p[0]+edit.get('dx',0),p[1]+edit.get('dy',0)] for p in points]
                decor=layout.add_lwpolyline(pts,dxfattribs={'layer':edit.get('props',{}).get('layer','ALCIDE_TEXTES'),'color':256})
                members.append(decor)
        for polygon in a.get('symbolFills',[]):
            if len(polygon)!=3:continue
            pts=[[p[0]+edit.get('dx',0),p[1]+edit.get('dy',0)] for p in polygon]
            members.append(layout.add_solid(pts+[pts[-1]],dxfattribs={'layer':edit.get('props',{}).get('layer','ALCIDE_TEXTES'),'color':256}))
        if len(members)>1:annotation_groups.append((handle,members))
    for record in reinforcement or []:
        handle=record['id'];edit=(edits or {}).get(handle,{})
        if edit.get('deleted'):continue
        view=record['view'];assembly=record['assembly']
        if assembly.get('kind') not in ('bar','mesh','schedule'):raise ValueError('Type d’armature incorrect.')
        payload=json.dumps({'table':record['table'],'view':view} if assembly.get('kind')=='schedule' else {'assembly':assembly,'view':view},ensure_ascii=True,separators=(',',':'))
        if len(payload)>14000:raise ValueError('Armature trop complexe pour les métadonnées DWG.')
        if 'ALCIDE_REBAR' not in out.appids:out.appids.new('ALCIDE_REBAR')
        layer=edit.get('props',{}).get('layer','ALCIDE_ARMATURES')
        if layer not in out.layers:out.layers.new(layer,dxfattribs={'color':3})
        block=out.blocks.new_anonymous_block(type_char='U');points=[];vertex_count=0
        for path_points in record.get('paths',[]):
            vertex_count+=len(path_points)
            if vertex_count>200000:raise ValueError('Trop de traits dans la représentation d’armatures.')
            if len(path_points)<2 or not all(len(p)==2 and all(math.isfinite(float(v)) for v in p) for p in path_points):raise ValueError('Tracé d’armature incorrect.')
            block.add_lwpolyline(path_points,dxfattribs={'layer':'0','color':0});points.extend(path_points)
        for circle in record.get('circles',[]):
            center=circle['center'];radius=float(circle['radius'])
            if not math.isfinite(radius) or radius<=0:raise ValueError('Diamètre de coupe incorrect.')
            circle_attrs={'layer':'0','color':0}
            circle_color=circle.get('color')
            if circle_color:
                if not isinstance(circle_color,str) or not re.fullmatch(r'#[0-9a-fA-F]{6}',circle_color):raise ValueError('Couleur de cercle incorrecte.')
                circle_attrs['true_color']=int(circle_color[1:],16)
            block.add_circle(center,radius,dxfattribs=circle_attrs);points.append(center)
            if circle.get('filled'):
                fill=block.add_hatch(color=0,dxfattribs={k:v for k,v in circle_attrs.items() if k!='color'})
                fill.paths.add_edge_path().add_arc(center,radius,start_angle=0,end_angle=360,ccw=True)
        for vertices in record.get('fills',[]):
            if len(vertices)!=3 or not all(len(p)==2 and all(math.isfinite(float(v)) for v in p) for p in vertices):raise ValueError('Pointe de rappel incorrecte.')
            block.add_solid([vertices[0],vertices[1],vertices[2],vertices[2]],dxfattribs={'layer':'0','color':0})
        for text in record.get('texts',[]):
            height=float(text['height']);position=text['position']
            if not math.isfinite(height) or height<=0 or len(position)!=2 or not all(math.isfinite(float(v)) for v in position):raise ValueError('Texte de tableau incorrect.')
            rotation=float(text.get('rotation',0))
            if not math.isfinite(rotation):raise ValueError('Rotation de texte incorrecte.')
            block.add_text(str(text['text']),dxfattribs={'insert':position,'height':height,'rotation':rotation,'layer':'0','color':0})
        if points and assembly.get('kind')!='schedule' and not record.get('suppressLabel'):
            height=float(record.get('textHeight',2.5))
            if not math.isfinite(height) or height<=0:raise ValueError('Hauteur de repère incorrecte.')
            block.add_mtext(str(record.get('label','')),dxfattribs={'insert':(min(p[0] for p in points),max(p[1] for p in points)+height*2),'char_height':height,'layer':'0','color':0})
        entity=out.layouts.get(view.get('layout','Model')).add_blockref(block.name,view['origin'],dxfattribs={'layer':layer,'color':256})
        entity.set_xdata('ALCIDE_REBAR',[(1000,payload[i:i+200]) for i in range(0,len(payload),200)])
        copies[handle]=entity
    for handle,edit in (edits or {}).items():
        drawing=edit.get('drawing')
        if not drawing or edit.get('deleted'):continue
        layout=out.layouts.get(drawing.get('layout','Model'))
        pts=edit.get('geometry',{}).get('points',drawing['points'])
        attrs={'layer':edit.get('props',{}).get('layer','0'),'color':256}
        if drawing['type']=='LINE':e=layout.add_line(pts[0],pts[1],dxfattribs=attrs)
        elif drawing['type']=='POINT':e=layout.add_point(pts[0],dxfattribs=attrs)
        elif drawing['type']=='LWPOLYLINE':
            bulges=drawing.get('bulges')
            if bulges is not None:
                if len(bulges)!=len(pts) or not all(math.isfinite(float(b)) for b in bulges):raise ValueError('Arcs de polyligne incorrects.')
                e=layout.add_lwpolyline([(p[0],p[1],b) for p,b in zip(pts,bulges)],format='xyb',close=bool(edit.get('geometry',{}).get('closed',drawing.get('closed',True))),dxfattribs=attrs)
            else:e=layout.add_lwpolyline(pts,close=edit.get('geometry',{}).get('closed',drawing.get('closed',False)),dxfattribs=attrs)
        elif drawing['type']=='CIRCLE':e=layout.add_circle(pts[0],math.dist(pts[0],pts[1]),dxfattribs=attrs)
        elif drawing['type']=='ARC':
            if len(pts)!=3:raise ValueError('Arc : centre et deux extrémités requis.')
            center,start,end=pts
            e=layout.add_arc(center,math.dist(center,start),math.degrees(math.atan2(start[1]-center[1],start[0]-center[0])),math.degrees(math.atan2(end[1]-center[1],end[0]-center[0])),dxfattribs=attrs)
        else:raise ValueError('Objet créé non pris en charge.')
        copies[handle]=e
    for handle,edit in (edits or {}).items():
        if not edit.get('source') or edit.get('deleted'):continue
        source=out.entitydb.get(edit['source'])
        if source is None or source.get_layout() is None:continue
        e=source.copy();source.get_layout().add_entity(e);copies[handle]=e
    def apply_properties(e,props):
        if 'layer' in props:
            if props['layer'] not in out.layers:raise ValueError('Calque inconnu.')
            e.dxf.layer=props['layer']
        if 'color' in props:
            color=props['color']
            if color=='bylayer':
                e.dxf.color=256
                if e.dxf.hasattr('true_color'):e.dxf.discard('true_color')
            elif re.fullmatch(r'#[0-9a-fA-F]{6}',color):
                rgb=ezdxf.colors.int2rgb(int(color[1:],16))
                e.dxf.color=min(range(1,256),key=lambda i:sum((a-b)**2 for a,b in zip(rgb,ezdxf.colors.aci2rgb(i))))
                e.dxf.true_color=int(color[1:],16)
            else:raise ValueError('Couleur d’objet incorrecte.')
            if e.dxftype()=='DIMENSION':unify_dimension_color(e)
            elif e.dxftype()=='MTEXT':e.text=strip_toplevel_mtext_colors(e.text)
        if 'linetypeScale' in props:
            scale=float(props['linetypeScale'])
            if not math.isfinite(scale) or scale<=0:raise ValueError('Échelle de type de trait positive requise.')
            e.dxf.ltscale=scale
        if 'linetype' in props:
            name=str(props['linetype'])
            standard=line_patterns.STANDARD
            if name.upper() in standard and name not in out.linetypes:out.linetypes.new(name,dxfattribs={'description':'DWG-Alcide','pattern':standard[name.upper()]})
            if name.upper() not in ('BYLAYER','BYBLOCK') and name not in out.linetypes:raise ValueError('Type de trait inconnu.')
            e.dxf.linetype=name
        if 'lineweight' in props:
            weight=int(props['lineweight'])
            if weight not in (-1,-3,0,5,9,13,15,18,20,25,30,35,40,50,53,60,70,80,90,100,106,120,140,158,200,211):raise ValueError('Épaisseur d’objet incorrecte.')
            e.dxf.lineweight=weight
        if props.get('transparency')=='bylayer' and e.dxf.hasattr('transparency'):e.dxf.discard('transparency')
    palette_colors={r['id']:r['paletteColor'] for r in reinforcement or [] if r.get('paletteColor')}
    for handle,edit in (edits or {}).items():
        e=copies.get(handle) or out.entitydb.get(handle)
        if e is None or not hasattr(e,'dxf'):continue
        # Output-only aid policy does not edit the source or bypass editing locks in the UI.
        if edit.get('omitFromExport'):e.get_layout().delete_entity(e);continue
        aid_layer=edit.get('aidOutputLayer')
        if isinstance(aid_layer,str) and aid_layer.startswith('ALCIDE_AIDE__') and aid_layer in out.layers:e.dxf.layer=aid_layer
        if handle not in copies and out.layers.get(e.dxf.layer).is_locked():continue
        if edit.get('deleted'):e.get_layout().delete_entity(e);continue
        props=edit.get('props',{})
        if handle in palette_colors:props={**props,'color':palette_colors[handle]}
        apply_properties(e,props)
        if edit.get('drawing'):e.transparency=0
        if edit.get('dimensionStyle'):
            if e.dxftype()!='DIMENSION':raise ValueError('Réglages réservés aux cotes.')
            apply_dimension_style(e,edit['dimensionStyle'])
            if 'color' in edit.get('props',{}):unify_dimension_color(e)
        if edit.get('hatchStyle'):apply_hatch_style(e,edit['hatchStyle'])
        if edit.get('hatchGeometry'):apply_hatch_geometry(e,edit['hatchGeometry'])
        if edit.get('textStyle'):e=apply_text_style(e,edit['textStyle']);copies[handle]=e
        geometry=edit.get('geometry')
        if geometry:
            pts=geometry['points']
            if e.dxftype()=='LINE' and len(pts)==2:e.dxf.start=(*pts[0],e.dxf.start.z);e.dxf.end=(*pts[1],e.dxf.end.z)
            elif e.dxftype()=='LWPOLYLINE':
                original=list(e.get_points('xyseb'))
                if len(pts)!=len(original):
                    if any(abs(p[4])>1e-10 for p in original):raise ValueError('Modification du nombre de sommets sur une courbe non prise en charge.')
                    e.set_points([(p[0],p[1],original[0][2],original[0][3],0) for p in pts],'xyseb')
                else:e.set_points([(p[0],p[1],old[2],old[3],old[4]) for p,old in zip(pts,original)],'xyseb')
                if 'closed' in geometry:e.closed=bool(geometry['closed'])
            elif e.dxftype()=='CIRCLE' and len(pts)==2:
                e.dxf.center=(*pts[0],e.dxf.center.z);e.dxf.radius=math.dist(pts[0],pts[1])
            elif e.dxftype()=='ARC' and len(pts)==3:
                center,start,end=pts;e.dxf.center=(*center,e.dxf.center.z);e.dxf.radius=math.dist(center,start);e.dxf.start_angle=math.degrees(math.atan2(start[1]-center[1],start[0]-center[0]));e.dxf.end_angle=math.degrees(math.atan2(end[1]-center[1],end[0]-center[0]))
            else:raise ValueError('Modification géométrique non prise en charge.')
        rotation=edit.get('rotation')
        if rotation:
            from ezdxf.math import Matrix44
            pivot=rotation['pivot'];angle=float(rotation['angle'])
            if len(pivot)!=2 or not all(math.isfinite(float(v)) for v in pivot) or not math.isfinite(angle):raise ValueError('Rotation incorrecte.')
            e.transform(Matrix44.chain(Matrix44.translate(-float(pivot[0]),-float(pivot[1]),0),Matrix44.z_rotate(math.radians(angle)),Matrix44.translate(float(pivot[0]),float(pivot[1]),0)))
        dx,dy=edit.get('dx',0),edit.get('dy',0)
        if dx or dy:e.translate(float(dx),float(dy),0)
        for mirror in edit.get('nativeMirrorOps',[]):
            from ezdxf.math import Matrix44
            a=mirror['a'];b=mirror['b'];values=[*a,*b]
            if len(a)!=2 or len(b)!=2 or not all(math.isfinite(float(v)) for v in values):raise ValueError('Axe de miroir incorrect.')
            angle=math.atan2(b[1]-a[1],b[0]-a[0])
            if math.dist(a,b)<1e-8:raise ValueError('Les points de miroir doivent être distincts.')
            e.transform(Matrix44.chain(Matrix44.translate(-a[0],-a[1],0),Matrix44.z_rotate(-angle),Matrix44.scale(1,-1,1),Matrix44.z_rotate(angle),Matrix44.translate(a[0],a[1],0)))
        # Per-object visibility is a reversible viewing aid, persisted in the
        # Alcide project only. It does not erase the exported source geometry.
    for handle,value in changes.items():
        e=copies.get(handle) or out.entitydb.get(handle)
        if e is not None and hasattr(e,'transparency'):
            if not (edits or {}).get(handle,{}).get('drawing') and (handle in copies or not out.layers.get(e.dxf.layer).is_locked()):e.transparency=max(0,min(1,float(value)/100))
    # Images placed in ALCIDE: PNG next to the file (<name>_images/), IMAGE + IMAGEDEF with a relative path.
    for handle,edit in (edits or {}).items():
        drawing=edit.get('drawing') or {};spec=drawing.get('image')
        if not spec or edit.get('deleted'):continue
        frame=copies.get(handle)
        if frame is None or frame.dxftype()!='LWPOLYLINE':continue
        pts=[(p[0],p[1]) for p in frame.get_points('xy')]
        if len(pts)!=4:raise ValueError('Cadre d’image incorrect.')
        src=str(spec.get('src',''));m=re.match(r'data:image/(png|jpe?g);base64,(.*)$',src,re.S)
        if not m:raise ValueError('Image intégrée illisible.')
        import base64
        data=base64.b64decode(m.group(2));ext='png' if m.group(1)=='png' else 'jpg'
        folder=path.parent/(path.stem+'_images');folder.mkdir(exist_ok=True)
        stem=re.sub(r'[^\w.\- ]+','_',Path(str(spec.get('name') or 'image')).stem)[:60] or 'image'
        fname=f"{stem}-{hashlib.sha1(data).hexdigest()[:8]}.{ext}";(folder/fname).write_bytes(data)
        pw,ph=[int(v) for v in spec.get('px',[1,1])]
        if pw<=0 or ph<=0:raise ValueError('Taille d’image incorrecte.')
        rel=f"{path.stem}_images\\{fname}"
        idef=out.add_image_def(filename=rel,size_in_pixel=(pw,ph),name=Path(fname).stem)
        layout=frame.get_layout();p0,p1,p2,p3=pts
        img=layout.add_image(idef,insert=(p0[0],p0[1]),size_in_units=(math.dist(p0,p1),math.dist(p0,p3)),rotation=math.degrees(math.atan2(p1[1]-p0[1],p1[0]-p0[0])),dxfattribs={'layer':frame.dxf.layer})
        img.dxf.u_pixel=((p1[0]-p0[0])/pw,(p1[1]-p0[1])/pw,0);img.dxf.v_pixel=((p3[0]-p0[0])/ph,(p3[1]-p0[1])/ph,0)
        opacity=float(spec.get('opacity',1))
        if opacity<1:img.dxf.fade=max(0,min(100,round((1-opacity)*100)))
        layout.delete_entity(frame);copies.pop(handle,None)
    # Arrowheads: native SOLID/lines tagged ALCIDE_ARROW, spec kept on the owner (ALCIDE_ARROWS).
    arrow_override={}
    for handle,edit in (edits or {}).items():
        if edit.get('deleted') or 'arrows' not in edit.get('props',{}):continue
        e=copies.get(handle) or out.entitydb.get(handle)
        if e is not None and e.is_alive:arrow_override[e.dxf.handle]=edit['props']['arrows']
    for e,spec in regenerate_arrows(out,edits):
        value=arrow_override.get(e.dxf.handle,spec)
        if value is not None or e.has_xdata('ALCIDE_ARROWS'):apply_arrows(e,value)
    # Filled shapes remain native closed outlines plus a SOLID HATCH, grouped.
    for handle,edit in (edits or {}).items():
        props=edit.get('props',{});outline=copies.get(handle)
        if not edit.get('drawing') or edit.get('deleted') or not props.get('filled') or outline is None:continue
        if outline.dxftype()=='LWPOLYLINE' and not outline.closed:continue
        if outline.dxftype() not in ('LWPOLYLINE','CIRCLE'):continue
        layout=outline.get_layout();fill=layout.add_hatch(color=256,dxfattribs={'layer':outline.dxf.layer})
        draw_order_companions[handle]=[fill]
        pattern=props.get('fillPattern','SOLID')
        if pattern!='SOLID':
            if pattern not in ALCIDE_HATCH_PATTERNS and pattern not in ACAD_HATCH_PATTERNS:raise ValueError('Motif de hachure incorrect.')
            gap=float(props.get('fillSpacing',1));angle=float(props.get('fillAngle',0))
            if not math.isfinite(gap) or gap<=0 or not math.isfinite(angle):raise ValueError('Espacement de hachure incorrect.')
            if pattern in ACAD_HATCH_PATTERNS:acad_hatch_fill(fill,pattern,gap,angle)
            else:fill.set_pattern_fill(pattern,angle=angle,scale=1,definition=alcide_hatch_definition(pattern,gap))
            for line in fill.pattern.lines:
                line.base_point=line.base_point+ezdxf.math.Vec2(edit.get('dx',0),edit.get('dy',0))
            background=props.get('fillBackgroundColor')
            if background:
                if not re.fullmatch(r'#[0-9a-fA-F]{6}',background):raise ValueError('Couleur de fond incorrecte.')
                fill.bgcolor=ezdxf.colors.int2rgb(int(background[1:],16))
        color=props.get('fillColor','#829f6a')
        if not re.fullmatch(r'#[0-9a-fA-F]{6}',color):raise ValueError('Couleur de remplissage incorrecte.')
        rgb=ezdxf.colors.int2rgb(int(color[1:],16))
        fill.dxf.color=min(range(1,256),key=lambda i:sum((a-b)**2 for a,b in zip(rgb,ezdxf.colors.aci2rgb(i))))
        fill.dxf.true_color=int(color[1:],16)
        alpha=changes.get(handle,props.get('fillTransparency',0))
        if props.get('fillTransparencyByLayer'):alpha=out.layers.get(outline.dxf.layer).transparency*100
        fill.transparency=max(0,min(1,float(alpha)/100))
        if outline.dxftype()=='CIRCLE':
            fill.paths.add_edge_path().add_arc(outline.dxf.center.vec2,outline.dxf.radius,0,360,ccw=True)
        else:fill.paths.add_polyline_path([(p[0],p[1]) for p in outline.get_points('xy')],is_closed=True)
        if props.get('fillOnly'):
            ref=props.get('fillReference') or edit['drawing']['points']
            current=edit.get('geometry',{}).get('points',edit['drawing']['points'])
            a,b=ref[:2];c,d=current[:2];x=b[0]-a[0];y=b[1]-a[1];den=x*x+y*y
            if den<=1e-20:raise ValueError('Contour de remplissage incorrect.')
            co=((d[0]-c[0])*x+(d[1]-c[1])*y)/den;si=((d[1]-c[1])*x-(d[0]-c[0])*y)/den
            for ring in props.get('fillHoles',[]):
                vertices=[(c[0]+co*(p[0]-a[0])-si*(p[1]-a[1])+edit.get('dx',0),c[1]+si*(p[0]-a[0])+co*(p[1]-a[1])+edit.get('dy',0)) for p in ring]
                fill.paths.add_polyline_path(vertices,is_closed=True,flags=0)
            copies[handle]=fill
            layout.delete_entity(outline)
            continue
        layout.set_redraw_order([*layout.get_redraw_order(),(fill.dxf.handle,outline.dxf.handle),(outline.dxf.handle,fill.dxf.handle)])
        out.groups.new(description='Forme remplie DWG-Alcide',selectable=True).set_data([outline,fill])
    if 'ALCIDE_COTES' not in out.layers:out.layers.new('ALCIDE_COTES',dxfattribs={'color':3})
    chain_groups={}
    for d in dimensions:
        layout=out.layouts.get(d.get('layout','Model'))
        override={'dimtxt':d['height'],'dimasz':d['height']*.6,'dimclrd':0,'dimclre':0,'dimclrt':0,'dimdec':d.get('precision',2),'dimlfac':d.get('factor',1),'dimrnd':d.get('rounding',0),'dimzin':8 if d.get('trimZeros') else 0,'dimdsep':44 if d.get('decimalComma') else 46}
        override['dimtih']=override['dimtoh']=int(bool(d.get('textHorizontal',False)))
        override['dimtfill']=1 if d.get('textBackground',True) else 0
        if d.get('textOrientation'):override['dimtih']=override['dimtoh']=0
        override.update(dimension_part_style(out,d))
        override['dimgap']=d.get('textGap',d['height']*.22)
        for key,dxf in [('extensionGap','dimexo'),('extensionBeyond','dimexe'),('hideExtension1','dimse1'),('hideExtension2','dimse2'),('endSize','dimasz'),('extensionFixed','dimfxlon'),('extensionLength','dimfxl')]:
            if key in d:override[dxf]=d[key]
        if d.get('endStyle'):override.update(dimblk=dimension_end_block(out,d['endStyle']),dimtsz=0)
        if d.get('fontFace'):override['dimtxsty']=text_font(out,d['fontFace'])
        if d.get('showUnit') and d.get('unit') not in (None,'u'):override['dimpost']='<> '+d['unit']
        if d.get('basePoint') is not None:dim=layout.add_linear_dim(base=d['basePoint'],p1=d['a'],p2=d['b'],angle=d.get('angle',0),dxfattribs={'layer':d.get('layer','ALCIDE_COTES')},override=override)
        else:dim=layout.add_aligned_dim(p1=d['a'],p2=d['b'],distance=d['offset'],dxfattribs={'layer':d.get('layer','ALCIDE_COTES')},override=override)
        if d.get('textOrientation'):
            angle=float(d.get('angle',0))
            if angle>90 or angle<-90:angle+=180
            dim.dimension.dxf.text_rotation={'horizontal':0,'vertical':90,'reversed':angle+180,'aligned':angle}[d['textOrientation']]
        if d.get('textPosition') is not None:dim.set_location(d['textPosition'],leader=True,relative=False)
        if d.get('textOverride') is not None:dim.dimension.dxf.text=d['textOverride']
        if d.get('balancedValue') is not None and d.get('textOverride') is not None:
            if 'ALCIDE_BALANCED' not in out.appids:out.appids.new('ALCIDE_BALANCED')
            dim.dimension.set_xdata('ALCIDE_BALANCED',[(1000,str(d.get('chainId',''))),(1040,float(d['balancedValue']))])
        dim.render()
        owner=d.get('chainId') or d.get('id')
        props={**(edits or {}).get(owner,{}).get('props',{}),**(edits or {}).get(d.get('id'),{}).get('props',{})}
        apply_properties(dim.dimension,props)
        alpha=changes.get(d.get('id'),changes.get(owner))
        if alpha is not None:dim.dimension.transparency=max(0,min(1,float(alpha)/100))
        if d.get('chainId'):chain_groups.setdefault((d['chainId'],d.get('layout','Model')),[]).append(dim.dimension)
    for members in chain_groups.values():
        out.groups.new(description='Chaîne de cotes DWG-Alcide',selectable=True).set_data(members)
    for handle,members in annotation_groups:
        for entity in members[1:]:
            apply_properties(entity,(edits or {}).get(handle,{}).get('props',{}))
            if handle in changes:entity.transparency=max(0,min(1,float(changes[handle])/100))
        out.groups.new(description='Repère DWG-Alcide',selectable=True).set_data(members)
    calibration=(edits or {}).get('@measurement-scale',{}).get('measurementScale')
    if calibration is not None:document_scale.write(out,calibration)
    # Persist user selection groups, including newly created objects and chains.
    user_groups={}
    changed_groups={}
    for handle,edit in (edits or {}).items():
        if 'groupId' in edit:changed_groups[handle]=edit.get('groupId')
    for name,group in list(out.groups):
        description=group.dxf.get('description','')
        if description.startswith('Alcide selection:') and any(e.dxf.handle in changed_groups for e in group):out.groups.delete(name)
    for handle,edit in (edits or {}).items():
        gid=edit.get('groupId')
        if not gid or edit.get('deleted'):continue
        members=[copies.get(handle) or out.entitydb.get(handle)]
        for (owner,layout),chain_members in chain_groups.items():
            if owner==handle:members.extend(chain_members)
        for owner,decorations in annotation_groups:
            if owner==handle:members.extend(decorations)
        user_groups.setdefault(gid,[]).extend(e for e in members if e is not None and e.is_alive)
    for gid,members in user_groups.items():
        unique=list({e.dxf.handle:e for e in members}.values())
        if len(unique)>1:out.groups.new(description='Alcide selection:'+gid,selectable=True).set_data(unique)
    # Publish the same explicit geometry stacking order as the editor.
    for layout_name, ordered_ids in (edits or {}).get('@display-order',{}).get('layouts',{}).items():
        if layout_name not in out.layout_names():continue
        layout=out.layouts.get(layout_name);ordered=[];seen=set()
        for source_id in ordered_ids:
            entity=copies.get(source_id) or out.entitydb.get(source_id)
            if entity is None or not entity.is_alive or entity.get_layout()!=layout:continue
            for item in [*draw_order_companions.get(source_id,[]),entity]:
                if item.dxf.handle not in seen:ordered.append(item);seen.add(item.dxf.handle)
        if not ordered:continue
        old=dict(layout.get_redraw_order())
        remaining=sorted((e for e in layout if e.dxf.handle not in seen),key=lambda e:int(old.get(e.dxf.handle,e.dxf.handle),16) or 0xFFFFFFFFFFFFFFFF)
        overlay_handles={copies[h].dxf.handle for h,v in (edits or {}).items() if v.get('annotation') and h in copies}
        overlay_handles.update(e.dxf.handle for _,members in annotation_groups for e in members)
        annotations=[e for e in remaining if e.dxftype()=='DIMENSION' or e.dxf.handle in overlay_handles]
        annotation_handles={e.dxf.handle for e in annotations}
        all_entities=[*[e for e in remaining if e.dxf.handle not in annotation_handles],*ordered,*annotations]
        # Allplan may ignore SORTENTSTABLE: mirror it in physical entity order.
        layout.entity_space.entities[:]=all_entities
        layout.set_redraw_order([(e.dxf.handle,format(i+1,'X')) for i,e in enumerate(all_entities)])
    path=Path(filename)
    if path.suffix.lower()=='.dwg':
        for layer in final_locks:layer.lock()
        return {**dwg_export.publish(out,path,backup=backup),'dimensions':len(dimensions)}
    if SOURCE and path.resolve()==Path(SOURCE).resolve():raise ValueError('Choisir un autre nom pour préserver le dessin source.')
    for layer in final_locks:layer.lock()
    with tempfile.TemporaryDirectory(prefix='alcide-dxf-export-') as folder:
        temp=Path(folder)/'drawing.dxf';out.saveas(temp);check=ezdxf.readfile(temp)
        check.audit();result=dwg_export.publish_file(temp,path,backup=backup)
    return dict(**result,entities=len(check.modelspace()),dimensions=len(dimensions),verified=True)

def decompose_all(changes,dimensions,edits,layer_changes):
    import uuid
    root=Path(os.environ.get('LOCALAPPDATA',tempfile.gettempdir()))/'DWG-Alcide'/'decomposed'
    root.mkdir(parents=True,exist_ok=True)
    path=root/(Path(SOURCE).stem+' - objets libres - '+uuid.uuid4().hex[:8]+'.dxf')
    try:
        export(str(path),changes,dimensions,edits,layer_changes)
        doc=read_doc(str(path));count=0
        for layout in doc.layouts:
            queue=[(e,()) for e in layout.query('INSERT')]
            while queue:
                entity,ancestors=queue.pop()
                name=entity.dxf.name
                if name in ancestors:raise ValueError('Bloc circulaire : '+name+'. Décomposition interrompue.')
                parent=entity.dxf.all_existing_dxf_attribs()
                children=list(entity.explode(target_layout=layout))
                count+=1
                if count>100000 or len(doc.entitydb)>1000000:raise ValueError('Dessin trop complexe pour la décomposition en une opération.')
                if count%50==0:progress(f'Décomposition : {count} blocs…')
                for child in children:
                    if child.dxf.get('layer','0')=='0':child.dxf.layer=parent.get('layer','0')
                    if child.dxf.get('color',256)==0 and not child.dxf.hasattr('true_color'):
                        child.dxf.color=parent.get('color',256)
                        if 'true_color' in parent:child.dxf.true_color=parent['true_color']
                    if child.dxf.get('linetype','BYLAYER').upper()=='BYBLOCK':child.dxf.linetype=parent.get('linetype','BYLAYER')
                    if child.dxf.get('lineweight',-1)==-2:child.dxf.lineweight=parent.get('lineweight',-1)
                    if child.is_transparency_by_block:child.dxf.transparency=parent.get('transparency',0x020000ff)
                    if child.dxftype()=='HATCH':
                        child.dxf.associative=0
                        for boundary in child.paths:boundary.source_boundary_objects=[]
                    if child.dxftype()=='INSERT':queue.append((child,ancestors+(name,)))
        groups=list(doc.groups);group_count=len(groups)
        for name,group in groups:doc.groups.delete(name)
        audit=doc.audit()
        if audit.has_errors:raise ValueError('La décomposition produit des erreurs de structure ; copie rejetée.')
        doc.saveas(path)
        return dict(path=str(path),blocks=count,groups=group_count,entities=sum(len(layout) for layout in doc.layouts),unsupported=sum(e.dxftype()=='ACAD_PROXY_ENTITY' for layout in doc.layouts for e in layout))
    except Exception:
        path.unlink(missing_ok=True)
        raise


def dispatch(r):
    global DOC,SOURCE,WARNINGS,ACTIVE
    cmd=r['cmd']
    if cmd=='engine-info':return dict(python=sys.version,nativeGeometry=ezdxf.options.use_c_ext,engineVersion='0.6.0')
    if cmd=='new-drawing':
        target=Path(r['path']);target.parent.mkdir(parents=True,exist_ok=True)
        if target.exists():raise ValueError('Le dessin existe déjà.')
        doc=ezdxf.new('R2018');doc.header['$INSUNITS']=5;doc.header['$MEASUREMENT']=1;doc.header['$LUNITS']=2;doc.header['$LUPREC']=1
        doc.saveas(target);return str(target)
    if cmd=='open':
        previous=(DOC,SOURCE,WARNINGS,ACTIVE)
        doc_id=r.get('docId','default');old=DOCUMENTS.get(doc_id)
        try:return open_file(r['path'],doc_id)
        except Exception:
            DOC,SOURCE,WARNINGS,ACTIVE=previous
            if old is None:DOCUMENTS.pop(doc_id,None)
            else:DOCUMENTS[doc_id]=old
            raise
    if cmd=='cache-info':return cache_info()
    if cmd=='fonts':return font_choices()
    if cmd=='clear-cache':return clear_cache()
    if cmd=='close':
        DOCUMENTS.pop(r['docId'],None)
        return True
    entry=activate(r.get('docId','default'))
    if cmd=='freeze-source':
        require_doc(full=True)
        frozen=Path(r['path']).resolve()
        if not frozen.is_file() or frozen.suffix.lower() not in ('.dwg','.dxf'):raise ValueError('Base de sauvegarde invalide.')
        SOURCE=str(frozen);entry['source']=SOURCE
        return SOURCE
    if cmd=='layers':return layer_info()
    if cmd in ('begin-block-edit','finish-block-edit'):
        target=block_editor.path('base' if cmd=='begin-block-edit' else 'definition')
        export(str(target),r.get('changes',{}),r.get('dimensions',[]),r.get('edits',{}),r.get('layerChanges',{}))
        return block_editor.begin(target,r['blockName']) if cmd=='begin-block-edit' else block_editor.finish(r['basePath'],r['blockName'],target)
    if cmd=='recognize-dimensions':
        require_doc(full=True)
        return import_reconstruction.analyze(DOC,r.get('layout','Model'),r.get('convention','allplan'),float(r.get('scale',0)),r.get('ignored',[]),bool(r.get('suggestionsOnly',False)))
    if cmd=='decompose-all':return decompose_all(r.get('changes',{}),r.get('dimensions',[]),r.get('edits',{}),r.get('layerChanges',{}))
    if cmd=='dimension-preview':return preview_dimension_styles(r.get('requests',[]))
    if cmd=='hatch-preview':return preview_hatches(r.get('requests',[]))
    if cmd=='text-preview':return preview_texts(r.get('requests',[]))
    if cmd=='layout':
        cached=scene_path(entry['key'],r['layout'])
        if cached.exists():return dict(sceneFile=str(cached),cacheHit=True,docId=ACTIVE)
        value=scene(r['layout']);return dict(sceneFile=write_scene(value,entry['key']),cacheHit=False,docId=ACTIVE)
    if cmd=='export':return export(r['path'],r.get('changes',{}),r.get('dimensions',[]),r.get('edits',{}),r.get('layerChanges',{}),r.get('reinforcement',[]),backup=bool(r.get('backup',False)))
    raise ValueError('Commande inconnue : '+cmd)

if __name__=='__main__':
    for stream in (sys.stdin,sys.stdout,sys.stderr):
        if hasattr(stream,'reconfigure'):stream.reconfigure(encoding='utf8')
    for line in sys.stdin:
        try:
            request=json.loads(line);result=dispatch(request)
            print(json.dumps(dict(id=request['id'],result=result),ensure_ascii=False,allow_nan=False),flush=True)
        except Exception as e:
            traceback.print_exc(file=sys.stderr)
            print(json.dumps(dict(id=request.get('id'),error=str(e)),ensure_ascii=False),flush=True)





