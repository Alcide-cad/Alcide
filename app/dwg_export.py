"""ODA external converter, isolated jobs, validated publication of DWG 2018."""
import os, shutil, subprocess, tempfile, math, hashlib, time, uuid
from pathlib import Path
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
import ezdxf
import pickle
import document_scale

def converter():
    paths=[]
    if os.environ.get('ALCIDE_ODA_EXE'):paths.append(Path(os.environ['ALCIDE_ODA_EXE']))
    roots=[Path(os.environ.get('LOCALAPPDATA',''))]
    if os.environ.get('USERPROFILE'):roots.append(Path(os.environ['USERPROFILE'])/'AppData'/'Local')
    roots.append(Path.home()/'AppData'/'Local')
    for root in roots:
        local=root/'DWG-Alcide'/'Tools'
        paths.extend(sorted(local.glob('ODAFileConverter-*/ODAFileConverter.exe'),reverse=True))
        paths.extend(sorted((root/'Packages'/'OpenAI.Codex_2p2nqsd0c76g0'/'LocalCache'/'Local'/'DWG-Alcide'/'Tools').glob('ODAFileConverter-*/ODAFileConverter.exe'),reverse=True))
    for key in ('PROGRAMFILES','PROGRAMFILES(X86)'):
        if os.environ.get(key):paths.extend(Path(os.environ[key]).glob('ODA/ODAFileConverter*/ODAFileConverter.exe'))
    found=shutil.which('ODAFileConverter.exe')
    if found:paths.append(Path(found))
    for p in paths:
        if p.is_file():return p.resolve()
    raise ValueError('Export DWG : installez ODA File Converter depuis opendesign.com/guestfiles/oda_file_converter. L’export DXF reste disponible.')

def convert(source, target, kind, assets=()):
    exe=converter()
    with tempfile.TemporaryDirectory(prefix='alcide-oda-') as folder:
        root=Path(folder);src=root/'in';dst=root/'out';src.mkdir();dst.mkdir()
        name='drawing'+Path(source).suffix.lower();shutil.copy2(source,src/name)
        for folder_asset in assets:
            folder_asset=Path(folder_asset)
            if folder_asset.is_dir():shutil.copytree(folder_asset,src/folder_asset.name,dirs_exist_ok=True)
        kw={}
        if os.name=='nt':
            startup=subprocess.STARTUPINFO();startup.dwFlags|=subprocess.STARTF_USESHOWWINDOW;startup.wShowWindow=0
            kw={'startupinfo':startup,'creationflags':subprocess.CREATE_NO_WINDOW}
        result=subprocess.run([str(exe),str(src),str(dst),'ACAD2018',kind,'0','1',name],capture_output=True,timeout=180,**kw)
        output=dst/('drawing.'+kind.lower())
        if result.returncode or not output.is_file():raise ValueError('La conversion ODA a échoué ; aucun fichier final n’a été remplacé.')
        shutil.copy2(output,target)

# Reuse the immutable source conversion within one engine session. Every save
# still reads a fresh document, so edits can never accumulate on this baseline.
_SOURCE_CACHE=None
_SOURCE_CACHE_FILES={}
_SOURCE_MEMORY_KEY=None
_SOURCE_MEMORY_BYTES=None
_WARM_EXECUTOR=ThreadPoolExecutor(max_workers=1,thread_name_prefix='alcide-save-cache')
_WARM_JOB=None

def _conversion_identity(path):
    path=Path(path).resolve()
    stat=path.stat()
    return (path,stat.st_size,stat.st_mtime_ns)

def _prepare_conversion(identity):
    doc=ezdxf.readfile(identity[0])
    if doc.audit().has_errors or _conversion_identity(identity[0])!=identity:return None
    blob=pickle.dumps(doc,protocol=5)
    return blob if len(blob)<=64*1024*1024 else None

def warm_source_conversion(converted):
    global _WARM_JOB
    identity=_conversion_identity(converted)
    if _WARM_JOB and (_WARM_JOB[0]==identity or not _WARM_JOB[1].done()):return False
    _WARM_JOB=(identity,_WARM_EXECUTOR.submit(_prepare_conversion,identity))
    return True

def release_source_cache():
    global _SOURCE_CACHE,_SOURCE_MEMORY_KEY,_SOURCE_MEMORY_BYTES,_WARM_JOB
    if _WARM_JOB is not None:_WARM_JOB[1].cancel()
    _SOURCE_MEMORY_KEY=_SOURCE_MEMORY_BYTES=_WARM_JOB=None
    _SOURCE_CACHE_FILES.clear()
    if _SOURCE_CACHE is not None:
        _SOURCE_CACHE.cleanup()
        _SOURCE_CACHE=None

def _remember_source(key,doc):
    global _SOURCE_MEMORY_KEY,_SOURCE_MEMORY_BYTES
    # Private in-process bytes only: never unpickle a file or external data.
    _SOURCE_MEMORY_KEY=None;_SOURCE_MEMORY_BYTES=None
    try:
        blob=pickle.dumps(doc,protocol=5)
        if len(blob)<=64*1024*1024:_SOURCE_MEMORY_KEY=key;_SOURCE_MEMORY_BYTES=blob
    except Exception:pass
def source_key(source):
    source=Path(source).resolve();stat=source.stat();exe=converter();tool=exe.stat()
    return (str(source),stat.st_size,stat.st_mtime_ns,str(exe),tool.st_size,tool.st_mtime_ns)

def register_source_conversion(source, converted):
    # Reuse only the application's ODA conversion, never the edited render document.
    # Copy to a private transaction directory; the regular audit still runs on first use.
    global _SOURCE_CACHE,_SOURCE_MEMORY_KEY,_SOURCE_MEMORY_BYTES,_WARM_JOB
    converted=Path(converted)
    if not converted.is_file():return False
    key=source_key(source)
    if _WARM_JOB and _WARM_JOB[1].done() and _WARM_JOB[0]==_conversion_identity(converted):
        _,future=_WARM_JOB
        _WARM_JOB=None
        try:
            blob=future.result()
            if blob is not None:_SOURCE_MEMORY_KEY,_SOURCE_MEMORY_BYTES=key,blob
        except Exception:pass  # The regular conversion remains available.
    if key in _SOURCE_CACHE_FILES:return True
    if _SOURCE_CACHE is None:_SOURCE_CACHE=tempfile.TemporaryDirectory(prefix='alcide-save-source-')
    target=Path(_SOURCE_CACHE.name)/(uuid.uuid4().hex+'.dxf')
    shutil.copyfile(converted,target);_SOURCE_CACHE_FILES[key]=target
    while len(_SOURCE_CACHE_FILES)>3:
        oldest=next(iter(_SOURCE_CACHE_FILES));_SOURCE_CACHE_FILES.pop(oldest).unlink(missing_ok=True)
    return True

def source_document(source):
    global _SOURCE_CACHE,_SOURCE_MEMORY_KEY,_SOURCE_MEMORY_BYTES
    source=Path(source).resolve();key=source_key(source)
    if key==_SOURCE_MEMORY_KEY and _SOURCE_MEMORY_BYTES is not None:
        try:return pickle.loads(_SOURCE_MEMORY_BYTES)
        except Exception:_SOURCE_MEMORY_KEY=None;_SOURCE_MEMORY_BYTES=None
    if _SOURCE_CACHE is None:_SOURCE_CACHE=tempfile.TemporaryDirectory(prefix='alcide-save-source-')
    cached=_SOURCE_CACHE_FILES.get(key)
    if cached is None or not cached.is_file():
        cached=Path(_SOURCE_CACHE.name)/(uuid.uuid4().hex+'.dxf')
        convert(source,cached,'DXF')
        # Cache only validated conversions; conversion failure never poisons it.
        doc=ezdxf.readfile(cached);audit=doc.audit()
        if audit.has_errors:
            cached.unlink(missing_ok=True)
            raise ValueError('Le DWG source présente des erreurs de structure après conversion.')
        _SOURCE_CACHE_FILES[key]=cached
        while len(_SOURCE_CACHE_FILES)>3:
            oldest=next(iter(_SOURCE_CACHE_FILES));_SOURCE_CACHE_FILES.pop(oldest).unlink(missing_ok=True)
        _remember_source(key,doc)
        return doc
    try:
        doc=ezdxf.readfile(cached);audit=doc.audit()
        if audit.has_errors:raise ValueError('Cache de sauvegarde invalide.')
        _remember_source(key,doc)
        return doc
    except Exception:
        _SOURCE_CACHE_FILES.pop(key,None);cached.unlink(missing_ok=True)
        return source_document(source)

def fingerprint(doc):
    # Handles allow geometry/properties validation, even on entities not rendered by Alcide.
    fields=('layer','color','true_color','lineweight','transparency','linetype','start','end','center','radius','insert','rotation','height','char_height','text','name','pattern_name','solid_fill','pattern_scale','pattern_angle','dimtype','dimstyle','defpoint','defpoint2','defpoint3','angle','text_rotation','width','view_height','view_center_point','view_target_point','view_direction_vector','view_twist_angle','status','flags','closed')
    def value(v):
        if isinstance(v,(str,int,float,bool,type(None))):return v
        try:return list(v)
        except TypeError:return str(v)
    anonymous={}
    def anonymous_signature(name,ancestors):
        if name in anonymous:return anonymous[name]
        if name in ancestors:raise ValueError('Bloc anonyme récursif : contrôle de géométrie impossible.')
        block=doc.blocks.get(name)
        if block is None:raise ValueError('Bloc anonyme introuvable : '+name)
        contents=[record(child,ancestors+(name,)) for child in block]
        # Internal anonymous names may be renumbered by ODA; compare the
        # referenced geometry and attributes instead of its temporary name.
        anonymous[name]=contents
        return contents
    supported_fields={}
    supported_defaults={}
    defaults=(('color',256),('linetype','BYLAYER'),('lineweight',-1),('flags',0),('closed',0),('angle',0),('rotation',0),('text_rotation',0),('width',0),('view_twist_angle',0),('extrusion',(0,0,1)))
    def record(e,ancestors=()):
        typ=e.dxftype()
        supported=supported_fields.get(typ)
        if supported is None:
            supported=tuple(k for k in fields if e.dxf.is_supported(k));supported_fields[typ]=supported
            supported_defaults[typ]=tuple((k,1 if k=='width' and typ=='TEXT' else default) for k,default in defaults if e.dxf.is_supported(k))
        data={}
        for k in supported:
            v=e.dxf.get(k)
            if v is not None:data[k]=value(v)
        # DXF writers omit default attributes. Compare their actual semantic
        # values rather than whether an explicit default happened to be stored.
        for key,default in supported_defaults[typ]:data[key]=value(e.dxf.get(key,default))
        for key in ('angle','rotation','text_rotation'):
            if key in data:data[key]=float(data[key])%360
        if e.dxftype()=='INSERT':
            for key in ('xscale','yscale','zscale'):data[key]=e.dxf.get(key,1)
        if 'linetype' in data:data['linetype']=data['linetype'].casefold()
        # True RGB takes precedence over ACI. ODA recomputes the fallback index
        # (e.g. RGB 537ea2: ACI 153 -> 145); RGB itself remains strictly checked.
        if 'true_color' in data:data.pop('color',None)
        # Viewport #1 is the layout's internal paper extent, not a plotted window.
        if e.dxftype()=='VIEWPORT' and e.dxf.id==1:data.pop('layer',None)
        if e.dxftype()=='LWPOLYLINE':data['vertices']=[list(p) for p in e.get_points()]
        if e.dxftype()=='MTEXT':
            data['content']=e.text;data['rotation']=e.get_rotation()%360
        if e.dxftype()=='HATCH':
            data['background_color']=value(e.bgcolor)
            boundaries=[]
            for p in e.paths:
                if hasattr(p,'vertices'):boundaries.append({'closed':p.is_closed,'vertices':[list(v) for v in p.vertices]})
                else:
                    edges=[]
                    for edge in p.edges:
                        edges.append({k:value(getattr(edge,k)) for k in ('start','end','center','radius','start_angle','end_angle','ccw','major_axis','ratio','degree','knot_values','control_points','weights') if hasattr(edge,k)})
                    boundaries.append({'edges':edges})
            data['boundaries']=boundaries
            if e.pattern:data['pattern_definition']=[{'angle':line.angle,'base':value(line.base_point),'offset':value(line.offset),'dashes':list(line.dash_length_items)} for line in e.pattern.lines]
        if e.dxftype()=='SPLINE':
            # ODA adds planar/internal flags without changing the actual curve.
            # Keep structural flags and verify the evaluated geometry explicitly.
            data['flags']=int(e.dxf.get('flags',0))&23
            data['curveSamples']=[list(p) for p in e.construction_tool().approximate(64)]
        if e.dxftype()=='INSERT':data['attributes']=[(a.dxf.tag,a.dxf.text) for a in e.attribs]
        if e.dxftype()=='INSERT' and e.dxf.name.startswith('*'):data['name']={'anonymousGeometry':anonymous_signature(e.dxf.name,ancestors)}
        return [e.dxftype(),data]
    layouts={layout.name:{e.dxf.handle:record(e) for e in layout} for layout in doc.layouts}
    layers={l.dxf.name:{k:value(v) for k,v in l.dxf.all_existing_dxf_attribs().items() if k in fields or k=='plot'} for l in doc.layers}
    for l in doc.layers:
        for key,default in [('flags',0),('linetype','Continuous'),('lineweight',-3),('plot',1),('color',7)]:
            layers[l.dxf.name][key]=value(l.dxf.get(key,default))
        if 'true_color' in layers[l.dxf.name]:
            layers[l.dxf.name]['off']=l.is_off()
            layers[l.dxf.name].pop('color',None)
    blocks={b.name:{e.dxf.handle:record(e) for e in b} for b in doc.blocks if not b.name.startswith('*')}
    groups=sorted(len(list(g)) for _,g in doc.groups)
    paper={l.name:{k:value(l.dxf.get(k)) for k in ('paper_width','paper_height','left_margin','right_margin','top_margin','bottom_margin','plot_rotation','plot_paper_units','scale_numerator','scale_denominator') if l.dxf.is_supported(k)} for l in doc.layouts if l.name!='Model'}
    style_fields=('dimscale','dimasz','dimexo','dimdli','dimexe','dimrnd','dimdle','dimtxt','dimlfac','dimtih','dimtoh','dimtad','dimzin','dimdec','dimdsep','dimgap','dimtsz','dimtfill','dimtfillclr','dimlunit','dimlwd','dimlwe','dimblk','dimblk1','dimblk2')
    styles={s.dxf.name:{k:value(s.dxf.get_default(k)) for k in style_fields} for s in doc.dimstyles}
    text_styles={s.dxf.name:{'font':s.dxf.font.casefold(),'bigfont':s.dxf.get('bigfont','').casefold(),'width':s.dxf.get('width',1),'oblique':s.dxf.get('oblique',0)} for s in doc.styles}
    return {'measurement_scale':document_scale.read(doc),'layouts':layouts,'layers':layers,'blocks':blocks,'groups':groups,'paper':paper,'styles':styles,'text_styles':text_styles,'units':doc.header.get('$INSUNITS',0)}

def equivalent(a, b):
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        # Coordinate magnitude must never permit a geometric displacement.
        # Allow eight floating-point steps for round-trip representation only.
        if a == b:return math.isfinite(a)
        tolerance = max(1e-7, 8 * max(math.ulp(float(a)), math.ulp(float(b))))
        return math.isfinite(a) and math.isfinite(b) and abs(a - b) <= tolerance
    if isinstance(a, dict) and isinstance(b, dict):
        return a.keys() == b.keys() and all(equivalent(v, b[k]) for k, v in a.items())
    if isinstance(a, (list, tuple)) and isinstance(b, (list, tuple)):
        return len(a) == len(b) and all(equivalent(x, y) for x, y in zip(a, b))
    return a == b


def file_hash(path):
    digest=hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda:stream.read(1024*1024),b''):digest.update(chunk)
    return digest.hexdigest()

def verify_target_version(path,expected):
    if expected is None:return
    try:current=file_hash(path)
    except OSError:current=None
    if current!=expected:raise ValueError('Le DWG sur disque a changé. Utilisez Enregistrer sous avec un autre nom ou rouvrez le fichier.')

def _write_verified_file(source,path,backup=False,expected_target_hash=None):
    """Use one open handle, a normal non-DWG name, then atomic replacement."""
    source,path=Path(source),Path(path)
    fd,staged=tempfile.mkstemp(prefix='ALCIDE-export-',suffix='.tmp',dir=path.parent)
    try:
        with os.fdopen(fd,'wb') as target,source.open('rb') as stream:
            shutil.copyfileobj(stream,target,1024*1024);target.flush();os.fsync(target.fileno())
        verify_target_version(path,expected_target_hash)
        if backup and path.exists():
            # The candidate is already verified. Keep the old bytes before replacement.
            backup_path=path.with_name(path.name+'.bak')
            _write_verified_file(path,backup_path)
        verify_target_version(path,expected_target_hash)
        os.replace(staged,path)
    finally:
        try:os.unlink(staged)
        except FileNotFoundError:pass

def publish_file(source,path,backup=False,expected_target_hash=None):
    """Never lose a locally verified drawing when a share rejects publication."""
    source,path=Path(source),Path(path)
    try:
        guard={} if expected_target_hash is None else {'expected_target_hash':expected_target_hash}
        published_hash=file_hash(source) if path.suffix.lower()=='.dwg' else None
        _write_verified_file(source,path,backup=backup,**guard)
        return {'path':str(path),'publishedHash':published_hash}
    except OSError as error:
        root=Path(os.environ.get('LOCALAPPDATA',tempfile.gettempdir()))/'DWG-Alcide'/'exports-secours'
        root.mkdir(parents=True,exist_ok=True)
        recovery=root/(path.stem+'-'+time.strftime('%Y%m%d-%H%M%S')+'-'+uuid.uuid4().hex[:8]+path.suffix)
        _write_verified_file(source,recovery)
        return {'path':str(recovery),'requestedPath':str(path),'recovery':True,'publicationError':str(error)}

def copy_original(source,path,backup=False,expected_target_hash=None):
    """An unmodified Save Copy preserves every original DWG byte."""
    source,path=Path(source),Path(path)
    if source.resolve()==path.resolve():raise ValueError('Choisir un autre nom pour préserver le dessin source.')
    def digest(p):
        h=hashlib.sha256()
        with p.open('rb') as stream:
            for chunk in iter(lambda:stream.read(1024*1024),b''):h.update(chunk)
        return h.digest()
    with source.open('rb') as stream:header=stream.read(6)
    if not header.startswith(b'AC10'):raise ValueError('En-tête DWG source incorrect.')
    with tempfile.TemporaryDirectory(prefix='alcide-source-copy-') as folder:
        local=Path(folder)/'drawing.dwg';shutil.copyfile(source,local)
        if digest(source)!=digest(local):raise ValueError('La copie du DWG a échoué à la vérification.')
        result=publish_file(local,path,backup=backup,expected_target_hash=expected_target_hash)
    return dict(**result,format='DWG',version=header.decode('ascii'),verified=True,sourceCopy=True)



def publish(doc,path,backup=False,progress=None,after_publish=None,expected_target_hash=None):
    path=Path(path);converter();started=time.perf_counter();phase=started;timings={}
    def mark(name):
        nonlocal phase
        now=time.perf_counter();timings[name]=round(now-phase,4);phase=now
    report=progress or (lambda message:None)
    report('Contrôle du dessin avant sauvegarde…')
    with tempfile.TemporaryDirectory(prefix='alcide-export-') as folder:
        root=Path(folder);dxf=root/'drawing.dxf';dwg=root/'drawing.dwg';checkfile=root/'check.dxf'
        audit=doc.audit()
        if audit.has_errors:raise ValueError('Le dessin exporté présente des erreurs DXF ; export annulé.')
        for layout in doc.layouts:
            for e in layout:
                if e.dxf.layer not in doc.layers:doc.layers.new(e.dxf.layer)
        assets=[path.parent/(path.stem+'_images')]
        mark('auditSource')
        doc.saveas(dxf);mark('writeIntermediateDXF')
        report('Création du DWG…')
        # ODA reads the completed DXF while Python checks the in-memory drawing.
        # Join before re-reading the DWG or cleaning the temporary directory.
        with ThreadPoolExecutor(max_workers=1) as executor:
            conversion=executor.submit(convert,dxf,dwg,'DWG',assets)
            expected=fingerprint(doc)
            conversion.result()
        mark('writeDWGAndFingerprint')
        with dwg.open('rb') as f:
            if f.read(6)!=b'AC1032':raise ValueError('La version du DWG généré est invalide.')
        report('Vérification du DWG enregistré…');convert(dwg,checkfile,'DXF',assets);mark('reopenDWG');check=ezdxf.readfile(checkfile);mark('parseReopenedDXF')
        if check.audit().has_errors:raise ValueError('Le DWG généré échoue au contrôle de réouverture.')
        mark('auditReopenedDXF')
        actual=fingerprint(check);mark('fingerprintReopenedDXF')
        for key in expected:
            if not equivalent(expected[key],actual[key]):raise ValueError('Export DWG annulé : différence détectée lors du contrôle de '+key+'. Le fichier précédent est conservé.')
        mark('verify');report('Écriture du fichier et de la copie de sécurité…');result=publish_file(dwg,path,backup=backup,expected_target_hash=expected_target_hash);mark('publish');timings['total']=round(time.perf_counter()-started,4)
        if after_publish is not None:
            try:result['convertedCacheSeeded']=bool(after_publish(Path(result['path']),checkfile))
            except Exception:result['convertedCacheSeeded']=False
        return dict(**result,timings=timings,format='DWG',version='2018',entities=sum(len(l) for l in check.layouts),layouts=list(actual['layouts']),verified=True)
