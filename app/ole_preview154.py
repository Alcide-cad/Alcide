"""Read cached OLE pictures only; never activate embedded applications."""
import base64, hashlib, io, struct
from collections import OrderedDict
import olefile
from PIL import Image
_CACHE=OrderedDict()
MAX_BYTES=64*1024*1024
MAX_PIXELS=20_000_000

def _picture(data):
    # Native Paint objects carry a length-prefixed BMP; Office may cache DIBs.
    candidates=[]
    for magic in (b'BM',b'\x89PNG\r\n\x1a\n',b'\xff\xd8\xff'):
        start=0
        for _ in range(8):
            at=data.find(magic,start)
            if at<0:break
            candidates.append(data[at:]);start=at+len(magic)
    for header in (40,108,124):
        magic=struct.pack('<I',header);start=0
        for _ in range(8):
            at=data.find(magic,start)
            if at<0:break
            start=at+4
            if at+40>len(data):continue
            w,h,planes,bits=struct.unpack_from('<iiHH',data,at+4)
            if not (0<w<=20000 and 0<abs(h)<=20000 and w*abs(h)<=MAX_PIXELS and planes==1 and bits in (1,4,8,16,24,32)):continue
            dib=data[at:];colors=struct.unpack_from('<I',dib,32)[0] or ((1<<bits) if bits<=8 else 0)
            compression=struct.unpack_from('<I',dib,16)[0]
            offset=14+header+4*colors+(12 if header==40 and compression==3 else 0)
            candidates.append(b'BM'+struct.pack('<IHHI',len(dib)+14,0,0,offset)+dib)
    for raw in candidates:
        try:
            with Image.open(io.BytesIO(raw)) as im:
                if im.width*im.height>MAX_PIXELS:continue
                im.load();out=io.BytesIO();im.convert('RGBA' if 'A' in im.getbands() else 'RGB').save(out,format='PNG')
                return 'data:image/png;base64,'+base64.b64encode(out.getvalue()).decode('ascii')
        except (OSError,ValueError,Image.DecompressionBombError):pass
    return None

def preview(blob):
    if not blob or len(blob)>MAX_BYTES:return None
    key=hashlib.sha256(blob).digest()
    if key in _CACHE:return _CACHE[key]
    result=None
    try:
        at=blob.find(bytes.fromhex('d0cf11e0a1b11ae1'))
        if at>=0:
            with olefile.OleFileIO(io.BytesIO(blob[at:])) as storage:
                paths=storage.listdir(streams=True,storages=False)
                paths.sort(key=lambda p:0 if p[-1].startswith('\x02OlePres') or p[-1]=='\x01Ole10Native' else 1)
                for path in paths:
                    if not (path[-1].startswith('\x02OlePres') or path[-1] in ('\x01Ole10Native','CONTENTS')):continue
                    if storage.get_size(path)>MAX_BYTES:continue
                    result=_picture(storage.openstream(path).read())
                    if result:break
        else:result=_picture(blob)
    except (OSError,ValueError,struct.error):pass
    _CACHE[key]=result
    while len(_CACHE)>16:_CACHE.popitem(last=False)
    return result
