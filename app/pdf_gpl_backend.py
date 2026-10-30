"""PDF extraction using pdfminer.six (MIT), metadata and preview via Poppler (GPL).
No MuPDF dependency. Coordinates are unrotated, crop-relative, top-left points.
"""
from pathlib import Path
from types import SimpleNamespace
from collections import Counter
import math, os, sys, shutil, subprocess, tempfile, base64
from pdfminer.pdfparser import PDFParser
from pdfminer.pdfdocument import PDFDocument
from pdfminer.pdfpage import PDFPage
from pdfminer.pdfinterp import PDFPageInterpreter, PDFResourceManager
from pdfminer.pdfdevice import PDFTextDevice
from pdfminer.pdftypes import resolve1, dict_value, list_value, stream_value, PDFObjRef
from pdfminer.psparser import literal_name, PSLiteral
from pdfminer.utils import apply_matrix_pt, mult_matrix, decode_text, translate_matrix


def _name(value):
    value=resolve1(value)
    if isinstance(value,bytes):return decode_text(value)
    if isinstance(value,PSLiteral):return literal_name(value)
    return str(value or '')

def _rgb(value,cs):
    vals=list(value) if isinstance(value,(list,tuple)) else [value]
    vals=[float(v) for v in vals]
    if len(vals)==1:return (vals[0],)*3
    if len(vals)==4:
        c,m,y,k=vals;return (1-min(1,c+k),1-min(1,m+k),1-min(1,y+k))
    return tuple(vals[:3])

class Document:
    def __init__(self,path):
        self.path=str(Path(path).resolve());self.stream=open(path,'rb')
        try:
            self.doc=PDFDocument(PDFParser(self.stream));self.pages=list(PDFPage.create_pages(self.doc))
        except Exception:
            self.stream.close();raise ValueError('PDF illisible ou protégé : utilisez une copie déverrouillée.')
        if self.doc.encryption or not self.pages:
            self.stream.close();raise ValueError('PDF protégé ou sans page importable.')
        self.ocgs={};self.names={};oc=dict_value(self.doc.catalog.get('OCProperties',{}));default=dict_value(oc.get('D',{}));base=_name(default.get('BaseState','ON'))!='OFF';on={v.objid for v in list_value(default.get('ON',[])) if isinstance(v,PDFObjRef)};off={v.objid for v in list_value(default.get('OFF',[])) if isinstance(v,PDFObjRef)}
        reserved={_name(dict_value(v).get('Name')) or 'Sans nom' for v in list_value(oc.get('OCGs',[]))};used=set()
        for i,ref in enumerate(list_value(oc.get('OCGs',[]))):
            key=ref.objid if isinstance(ref,PDFObjRef) else -(i+1);data=dict_value(ref);name=_name(data.get('Name')) or 'Sans nom';unique=name;n=2
            while unique in used or (unique!=name and unique in reserved):unique=name+' ['+str(n)+']';n+=1
            used.add(unique);self.ocgs[key]={'name':unique,'original':name,'on':key in on or (base and key not in off)};self.names[id(data)]=key
    def close(self):self.stream.close()
    def __enter__(self):return self
    def __exit__(self,*args):self.close()
    def group(self,ref):
        data=dict_value(ref);key=ref.objid if isinstance(ref,PDFObjRef) else self.names.get(id(data));return self.ocgs.get(key)
    def visibility(self,ref):
        group=self.group(ref)
        if group:return group['on']
        data=dict_value(ref);members=data.get('OCGs',[]);members=list_value(members) if isinstance(resolve1(members),list) else [members];values=[self.visibility(m) for m in members];policy=_name(data.get('P','AnyOn'))
        return {'AnyOn':any(values),'AllOn':all(values),'AnyOff':any(not v for v in values),'AllOff':all(not v for v in values)}.get(policy,True)
    def page(self,index,include_hidden=True):
        if not isinstance(index,int) or not 0<=index<len(self.pages):raise ValueError('Page PDF inconnue.')
        page=self.pages[index];x0,y0,x1,y1=page.cropbox;w,h=x1-x0,y1-y0;rotation=page.rotate%360
        result=SimpleNamespace(rect=SimpleNamespace(width=h if rotation in (90,270) else w,height=w if rotation in (90,270) else h),cropbox=SimpleNamespace(width=w,height=h),rotation=rotation,drawings=[],texts=[],clips=[],counts=Counter())
        result.map_rotation=lambda p: (h-p[1],p[0]) if rotation==90 else (w-p[0],h-p[1]) if rotation==180 else (p[1],w-p[0]) if rotation==270 else p
        device=Device(PDFResourceManager(),self,result,include_hidden);interp=Interpreter(device.rsrcmgr,device);device.height=h
        # Keep extraction in unrotated crop coordinates; rotate once during DXF mapping.
        interp.render_contents(page.resources,page.contents,ctm=(1,0,0,1,-x0,-y0))
        return result

def info(path):
    with Document(path) as d:
        pages=[]
        for i,p in enumerate(d.pages):
            x0,y0,x1,y1=p.cropbox;w,h=x1-x0,y1-y0
            if p.rotate%180:w,h=h,w
            pages.append(dict(index=i,label=str(i+1),widthMm=w*25.4/72,heightMm=h*25.4/72,rotation=p.rotate))
        return dict(pages=pages,layers=[dict(name=g['original'],visible=g['on']) for g in d.ocgs.values()])

def poppler_exe(name):
    root=Path(sys.executable).parent if getattr(sys,'frozen',False) else Path(__file__).parent/'engine'
    paths=[root/'poppler/bin'/(name+'.exe'),Path(os.environ.get('ALCIDE_POPPLER_BIN',''))/(name+'.exe')]
    for p in paths:
        if p.is_file():return p.resolve()
    found=shutil.which(name)
    if found:return Path(found)
    raise ValueError('Le composant PDF Poppler est introuvable dans cette installation.')

def preview(path,page=0):
    metadata=info(path)
    if not isinstance(page,int) or not 0<=page<len(metadata['pages']):raise ValueError('Page PDF inconnue.')
    with tempfile.TemporaryDirectory(prefix='alcide-pdf-preview-') as temp:
        prefix=Path(temp)/'page';kw={'creationflags':subprocess.CREATE_NO_WINDOW} if os.name=='nt' else {}
        result=subprocess.run([str(poppler_exe('pdftoppm')),'-f',str(page+1),'-l',str(page+1),'-singlefile','-cropbox','-scale-to','720','-png',str(Path(path).resolve()),str(prefix)],capture_output=True,timeout=120,**kw)
        image=prefix.with_suffix('.png')
        if result.returncode or not image.exists():raise ValueError('Poppler ne peut pas créer l’aperçu de cette page.')
        return 'data:image/png;base64,'+base64.b64encode(image.read_bytes()).decode('ascii')

class Device(PDFTextDevice):
    def __init__(self,rsrcmgr,document,page,include_hidden):
        super().__init__(rsrcmgr);self.document=document;self.page=page;self.include_hidden=include_hidden;self.tags=[];self.clip_ids=();self.alpha=(1.,1.);self.seq=0;self.height=0;self.characters=[];self.textmode=0
    def state(self):return (self.clip_ids,self.alpha)
    def restore(self,state):self.clip_ids,self.alpha=state
    def active(self):return self.include_hidden or all(v[1] for v in self.tags)
    def layer(self):return next((v[0] for v in reversed(self.tags) if v[0]),'')
    def begin_tag(self,tag,props=None):
        group=self.document.group(props) if props is not None else None
        self.tags.append((group['name'] if group else '',self.document.visibility(props) if props is not None else True))
    def end_tag(self):
        if self.tags:self.tags.pop()
    def point(self,x,y):
        x,y=apply_matrix_pt(self.ctm,(x,y));return (x,self.height-y)
    def paths(self,path):
        items=[];start=None;last=None
        for segment in path:
            kind=segment[0]
            if kind=='m':last=start=self.point(*segment[1:])
            elif kind=='l':
                end=self.point(*segment[1:]);items.append(('l',last,end));last=end
            elif kind=='c':
                a,b,end=[self.point(*segment[i:i+2]) for i in (1,3,5)];items.append(('c',last,a,b,end));last=end
            elif kind=='v':
                b,end=[self.point(*segment[i:i+2]) for i in (1,3)];items.append(('c',last,last,b,end));last=end
            elif kind=='y':
                a,end=[self.point(*segment[i:i+2]) for i in (1,3)];items.append(('c',last,a,end,end));last=end
            elif kind=='h' and last and start:
                if math.dist(last,start)>1e-9:items.append(('l',last,start))
                last=start
        return items
    def clip(self,path,evenodd):
        items=self.paths(path)
        if items:
            index=len(self.page.clips);self.page.clips.append((items,evenodd));self.clip_ids=(*self.clip_ids,index)
    def paint_path(self,state,stroke,fill,evenodd,path):
        self.seq+=1
        if not self.active():return
        items=self.paths(path)
        if not items:return
        dash=state.dash or ([],0);a,b,c,d,_,_=self.ctm;scale=math.sqrt(abs(a*d-b*c))
        self.page.drawings.append(dict(type='fs' if stroke and fill else 's' if stroke else 'f',items=items,closePath=False,even_odd=evenodd,layer=self.layer(),seqno=self.seq,width=state.linewidth*scale,dashes='['+' '.join(str(float(v)*scale) for v in list_value(dash[0]))+'] '+str(dash[1]),color=_rgb(state.scolor,state.scs) if stroke else None,fill=_rgb(state.ncolor,state.ncs) if fill else None,stroke_opacity=self.alpha[1],fill_opacity=self.alpha[0],clips=self.clip_ids))
    def render_string(self,textstate,seq,ncs,state):
        self.characters=[];self.textmode=textstate.render
        super().render_string(textstate,seq,ncs,state);chars=self.characters;self.seq+=1
        if not self.active() or not chars or self.textmode in (3,7):return
        if self.textmode>=4:self.page.counts['textClipModes']+=1
        font=textstate.font;name=font.fontname.decode('latin1') if isinstance(font.fontname,bytes) else str(font.fontname);a,b,c,d,_,_=mult_matrix(textstate.matrix,self.ctm);size=abs(textstate.fontsize)*math.hypot(c,d);direction=(a,-b);length=math.hypot(*direction);direction=tuple(v/length for v in direction) if length else (1,0)
        boxes=[ch[3] for ch in chars];box=(min(q[0] for q in boxes),min(q[1] for q in boxes),max(q[2] for q in boxes),max(q[3] for q in boxes));cap=float(font.descriptor.get('CapHeight',730) or 730)/1000
        self.page.texts.append(dict(type=1 if self.textmode==1 else 0,opacity=self.alpha[1] if self.textmode==1 else self.alpha[0],chars=chars,bbox=box,layer=self.layer(),font=name,cap=cap,size=size,dir=direction,color=_rgb(state.scolor if self.textmode==1 else state.ncolor,state.scs if self.textmode==1 else state.ncs),seqno=self.seq,end=self.char_end,wmode=font.is_vertical(),clips=self.clip_ids))
    def render_char(self,matrix,font,fontsize,scaling,rise,cid,ncs,state):
        advance=font.char_width(cid)*fontsize*scaling
        try:text=font.to_unichr(cid)
        except Exception:text='\ufffd'
        ox,oy=apply_matrix_pt(matrix,(0,rise));ex,ey=apply_matrix_pt(matrix,(advance,rise));self.char_end=(ex,self.height-ey)
        desc=font.get_descent()*fontsize;asc=font.get_ascent()*fontsize;pts=[apply_matrix_pt(matrix,q) for q in [(0,rise+desc),(advance,rise+desc),(advance,rise+asc),(0,rise+asc)]];bbox=(min(q[0] for q in pts),self.height-max(q[1] for q in pts),max(q[0] for q in pts),self.height-min(q[1] for q in pts))
        for ch in text:self.characters.append((ord(ch),cid,(ox,self.height-oy),bbox))
        return advance
    def render_image(self,*args):
        if self.active():self.page.counts['rasterImages']+=1

class Interpreter(PDFPageInterpreter):
    def init_state(self,ctm):super().init_state(ctm);self.clip_pending=None;self.device_stack=[];self.initial_ctm=ctm
    def do_q(self):super().do_q();self.device_stack.append(self.device.state())
    def do_Q(self):
        super().do_Q()
        if self.device_stack:self.device.restore(self.device_stack.pop())
    def do_BDC(self,tag,props):
        if isinstance(props,PSLiteral):props=dict_value(self.resources.get('Properties',{})).get(literal_name(props),{})
        super().do_BDC(tag,props)
    def do_gs(self,name):
        value=dict_value(dict_value(self.resources.get('ExtGState',{})).get(literal_name(name),{}));fill,stroke=self.device.alpha;self.device.alpha=(float(value.get('ca',fill)),float(value.get('CA',stroke)))
        if 'LW' in value:self.graphicstate.linewidth=float(value['LW'])
        if 'D' in value:self.graphicstate.dash=resolve1(value['D'])
        if 'Font' in value:
            font,size=list_value(value['Font']);self.textstate.font=self.rsrcmgr.get_font(font.objid if isinstance(font,PDFObjRef) else None,dict_value(font));self.textstate.fontsize=float(size)
        if _name(value.get('BM','Normal'))!='Normal':self.device.page.counts['blendGroups']+=1
        if value.get('SMask') and _name(value['SMask'])!='None':self.device.page.counts['softMasks']+=1
    def do_W(self):self.clip_pending=False
    def do_W_a(self):self.clip_pending=True
    def _finish(self,name):
        path=self.curpath[:]
        has_fill=name in ('do_f','do_f_a','do_B','do_B_a')
        pattern=self.graphicstate.ncolor
        patterned=has_fill and (isinstance(pattern,str) or isinstance(pattern,(list,tuple)) and any(isinstance(v,str) for v in pattern))
        if patterned:
            if name in ('do_B','do_B_a'):self.device.paint_path(self.graphicstate,True,False,False,path)
            self._pattern(path,[pattern] if isinstance(pattern,str) else pattern,name.endswith('_a'));self.curpath=[]
        else:getattr(super(),name)()
        if self.clip_pending is not None:self.device.clip(path,self.clip_pending);self.clip_pending=None
    def _pattern(self,path,values,evenodd):
        key=str(values[-1]);pattern=resolve1(dict_value(self.resources.get('Pattern',{})).get(key,{}))
        if int(pattern.get('PatternType',0))!=1:
            self.device.page.counts['gradients' if int(pattern.get('PatternType',0))==2 else 'unsupportedPatterns']+=1;return
        matrix=tuple(list_value(pattern.get('Matrix',[1,0,0,1,0,0])));transform=mult_matrix(matrix,self.initial_ctm);a,b,c,d,e,f=transform;det=a*d-b*c
        if abs(det)<1e-12:return
        inverse=(d/det,-b/det,-c/det,a/det,(c*f-d*e)/det,(b*e-a*f)/det)
        raw=self.device.paths(path);points=[point for item in raw for point in item[1:]]
        if not points:return
        # Undo the top-left convention, then map the paint region to pattern space.
        coords=[apply_matrix_pt(inverse,(x,self.device.height-y)) for x,y in points];bbox=list_value(pattern.get('BBox',[0,0,1,1]));x0,y0,x1,y1=map(float,bbox);xs=float(pattern.get('XStep',x1-x0));ys=float(pattern.get('YStep',y1-y0))
        if xs<=0 or ys<=0:self.device.page.counts['unsupportedPatterns']+=1;return
        lo_x=math.floor((min(q[0] for q in coords)-x1)/xs);hi_x=math.ceil((max(q[0] for q in coords)-x0)/xs);lo_y=math.floor((min(q[1] for q in coords)-y1)/ys);hi_y=math.ceil((max(q[1] for q in coords)-y0)/ys)
        if (hi_x-lo_x+1)*(hi_y-lo_y+1)>200000:raise ValueError('Motif PDF trop dense pour cet import vectoriel.')
        saved=self.device.state();oldctm=self.device.ctm;self.device.clip(path,evenodd);paint_clips=self.device.clip_ids
        try:
            for ix in range(lo_x,hi_x+1):
                for iy in range(lo_y,hi_y+1):
                    tile=mult_matrix((1,0,0,1,ix*xs,iy*ys),transform);self.device.clip_ids=paint_clips;self.device.set_ctm(tile);self.device.clip([('m',x0,y0),('l',x1,y0),('l',x1,y1),('l',x0,y1),('h',)],False)
                    interp=self.subinterp();interp.render_contents(dict_value(pattern.get('Resources',self.resources)),[pattern],ctm=tile)
        finally:self.device.restore(saved);self.device.set_ctm(oldctm)
    def do_n(self):self._finish('do_n')
    def do_S(self):self._finish('do_S')
    def do_f(self):self._finish('do_f')
    def do_F(self):self.do_f()
    def do_f_a(self):self._finish('do_f_a')
    def do_B(self):self._finish('do_B')
    def do_B_a(self):self._finish('do_B_a')
    def do_sh(self,name):
        if self.device.active():self.device.page.counts['gradients']+=1
    def do_Do(self,name):
        state=self.device.state();tags=len(self.device.tags);oldctm=self.device.ctm
        try:
            obj=stream_value(self.xobjmap.get(literal_name(name),{}));oc=obj.get('OC')
            if oc:self.device.begin_tag(PSLiteral('OC'),oc)
            # Form BBox is an implicit clipping path, transformed in its local CTM.
            if _name(obj.get('Subtype'))=='Form' and 'BBox' in obj:
                matrix=tuple(list_value(obj.get('Matrix',[1,0,0,1,0,0])));self.device.set_ctm(mult_matrix(matrix,self.ctm));x0,y0,x1,y1=list_value(obj['BBox']);self.device.clip([('m',x0,y0),('l',x1,y0),('l',x1,y1),('l',x0,y1),('h',)],False)
            super().do_Do(name)
        finally:
            self.device.restore(state);self.device.tags=self.device.tags[:tags];self.device.set_ctm(oldctm)
