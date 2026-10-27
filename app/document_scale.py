"""Document measurement calibration, stored independently from model geometry."""
import json,math
KEY='ALCIDE_MEASUREMENT_SCALE'
def validate(value):
    if not isinstance(value,dict):return None
    try:document=float(value.get('document',1));detail=float(value.get('detail',1))
    except (ValueError,TypeError):return None
    if not all(math.isfinite(v) and 0<v<=1e6 for v in (document,detail)):return None
    label=str(value.get('label','Détail'))[:60]
    return dict(document=document,detail=detail,local=value.get('local') is True,label=label)
def read(doc):
    try:
        record=doc.rootdict.get(KEY)
        if record is None or record.dxftype()!='XRECORD':return None
        raw=json.loads(''.join(t.value for t in record.tags if t.code==1))
        if raw.get('version')!=1:return None
        return validate(raw.get('scale'))
    except (ValueError,TypeError,AttributeError):return None
def write(doc,value):
    scale=validate(value)
    if scale is None:raise ValueError('Réglage d’échelle du document invalide.')
    record=doc.rootdict.get(KEY)
    if record is None:record=doc.rootdict.add_xrecord(KEY)
    if record.dxftype()!='XRECORD':raise ValueError('Métadonnée d’échelle du document incompatible.')
    text=json.dumps(dict(version=1,scale=scale),ensure_ascii=True,allow_nan=False)
    record.reset([(1,text[i:i+230]) for i in range(0,len(text),230)])
