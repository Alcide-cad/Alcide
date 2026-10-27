"""Conservative recovery of grouped, exploded linear dimensions.
No drawing mutation: every group must pass topology and printed-value checks.
"""
import math,re,statistics
from collections import Counter

def analyze(doc,layout='Model',convention='allplan',scale_override=0,ignored=(),suggestions_only=False,include_ungrouped=True):
    ignored=set(ignored);proposals=[];imported_candidates=[];rejected=Counter();used=set()
    unit_mm={1:25.4,2:304.8,4:1,5:10,6:1000}.get(doc.header.get('$INSUNITS',5),10)
    def xy(p):return [float(p[0]),float(p[1])]
    def segments(entity):
        if entity.dxftype()=='LINE':return [(xy(entity.dxf.start),xy(entity.dxf.end))]
        if entity.dxftype()=='LWPOLYLINE':
            ps=list(entity.get_points('xyb'))
            if any(abs(p[2])>1e-9 for p in ps):return []
            return [(xy(a),xy(b)) for a,b in zip(ps,ps[1:]) if math.dist(xy(a),xy(b))>1e-8]
        return []
    for name,group in doc.groups:
        es=list(group)
        if any(e.dxftype() not in ('LINE','LWPOLYLINE','CIRCLE','HATCH','TEXT','MTEXT') for e in es):continue
        if not es or any(e.get_layout() is None or e.get_layout().name!=layout for e in es):continue
        ids=[e.dxf.handle for e in es]
        if ignored.intersection(ids):rejected['Objets déjà modifiés']+=1;continue
        texts=[e for e in es if e.dxftype() in ('TEXT','MTEXT')]
        if not texts:continue
        parsed=[];valid=True
        for text in texts:
            label=text.plain_text().strip().replace(',','.').replace('\u00a0','')
            if not re.fullmatch(r'\d+(?:\.\d+)?',label):valid=False;break
            value=float(label)
            if not 0<value<1e7:valid=False;break
            angle=text.get_rotation() if text.dxftype()=='MTEXT' else text.dxf.get('rotation',0)
            height=text.dxf.get('char_height',1) if text.dxftype()=='MTEXT' else text.dxf.height
            parsed.append(dict(id=text.dxf.handle,label=label,value=value,decimal='.' in label,angle=angle,height=height,p=xy(text.dxf.insert)))
        if not valid or not parsed:continue
        main_height=max(t['height'] for t in parsed);main=[t for t in parsed if t['height']>=main_height*.8];small=[t for t in parsed if t not in main]
        if not main:continue
        angle=math.radians(main[0]['angle']);nearest_angle=round(angle/(math.pi/2))*(math.pi/2)
        if abs(angle-nearest_angle)<1e-5:angle=nearest_angle
        u=(math.cos(angle),math.sin(angle));n=(-u[1],u[0]);project=lambda p:(p[0]*u[0]+p[1]*u[1],p[0]*n[0]+p[1]*n[1]);point=lambda a,b:[u[0]*a+n[0]*b,u[1]*a+n[1]*b]
        if any(abs(math.sin(math.radians(t['angle'])-angle))>1e-3 for t in parsed):rejected['Orientations mélangées']+=1;continue
        for t in parsed:t['along'],t['normal']=project(t['p']);t['center']=t['along']+len(t['label'])*t['height']*.27
        tol=max(.001,main_height*.001);edges=[(project(a),project(b)) for e in es for a,b in segments(e)];perpendicular=[(a,b) for a,b in edges if abs(a[0]-b[0])<tol and abs(a[1]-b[1])>tol]
        if len(perpendicular)<2:continue
        candidates=[]
        for a,b in perpendicular:
            for value in (a[1],b[1]):
                nearest=next((c for c in candidates if abs(c[0]-value)<tol),None)
                if nearest:nearest[1]+=1
                else:candidates.append([value,1])
        expected=statistics.median(t['normal'] for t in main)-main_height*.2
        candidates=[c for c in candidates if abs(c[0]-expected)<main_height*1.2 and c[1]>=2]
        if not candidates:rejected['Ligne de cote incertaine']+=1;continue
        baseline=min(candidates,key=lambda c:(abs(c[0]-expected)/main_height-c[1]*.015))[0]
        imported_candidates.append(dict(name=name,ids=ids,labels=[t['label'] for t in main],layers=sorted(set(e.dxf.layer for e in es))))
        votes=[]
        def vote(value,weight=1):
            item=next((v for v in votes if abs(v[0]-value)<tol*3),None)
            if item:item[1]+=weight
            else:votes.append([value,weight])
        for a,b in edges:
            dx=b[0]-a[0];dy=b[1]-a[1]
            if math.hypot(dx,dy)<tol and abs(a[1]-baseline)<tol:vote(a[0],3);continue
            if abs(dx)<tol and abs(dy)>tol and min(a[1],b[1])-tol<=baseline<=max(a[1],b[1])+tol:vote((a[0]+b[0])/2)
        for e in es:
            if e.dxftype()=='CIRCLE' and e.dxf.radius<main_height:
                a,b=project(e.dxf.center)
                if abs(b-baseline)<tol:vote(a,2)
        anchors=sorted(v[0] for v in votes if v[1]>=2)
        if len(anchors)<2 or len(anchors)>65:rejected['Extrémités insuffisantes']+=1;continue
        half_used=set()
        for t in main:
            additions=[s for s in small if s['id'] not in half_used and s['label']=='5' and .3<t['height'] and abs(s['along']-t['center'])<t['height']*2 and 0<s['normal']-t['normal']<t['height']]
            half=min(additions,key=lambda s:abs(s['along']-t['center'])) if additions else None
            if half:half_used.add(half['id'])
            t['centimeters']=(t['value']*100 if t['decimal'] else t['value'])+(.5 if half else 0)
            t['physical']=t['centimeters']*10/unit_mm if convention=='allplan' else t['value']
        if any(s['id'] not in half_used for s in small):rejected['Exposants ambigus']+=1;continue
        intervals=[];assigned=set();ok=True
        for left,right in zip(anchors,anchors[1:]):
            labels=[t for t in main if left-tol<=t['center']<=right+tol]
            if len(labels)!=1:ok=False;break
            label=labels[0]
            if label['id'] in assigned:ok=False;break
            assigned.add(label['id']);intervals.append((left,right,label))
        if not ok or len(assigned)!=len(main):rejected['Segments ou libellés ambigus']+=1;continue
        ratios=[t['physical']/(b-a) for a,b,t in intervals]
        ratio=statistics.median(ratios)
        standard=[.001,.002,.005,.01,.02,.05,.1,.2,.25,.5,1,2,4,5,10,20,25,50,100,200,500,1000]
        nearest=min(standard,key=lambda v:abs(math.log(v/ratio)))
        if not suggestions_only and scale_override<=0 and abs(nearest-ratio)>=ratio*.02:rejected['Échelle non reconnue automatiquement']+=1;continue
        scale=float(scale_override) if scale_override>0 else ratio if suggestions_only else nearest
        errors=[abs((b-a)*scale-t['physical'])*unit_mm/10 for a,b,t in intervals]
        if max(errors)>.51 or max(abs(v-scale)/scale for v in ratios)>.04:rejected['Valeurs incompatibles avec la géométrie']+=1;continue
        if used.intersection(ids):rejected['Groupes superposés']+=1;continue
        basepoints=[]
        for a in anchors:
            ends=[end[1] for p,q in perpendicular if abs(p[0]-a)<tol*3 for end in (p,q)]
            far=max(ends,key=lambda s:abs(s-baseline)) if ends else baseline
            basepoints.append(point(a,far))
        used.update(ids)
        proposals.append(dict(name=name,ids=ids,anchors=basepoints,basePoint=point(anchors[0],baseline),angle=math.degrees(angle),scale=scale,factor=scale*unit_mm/10,height=main_height,layer=main[0] and texts[0].dxf.layer,labels=[t['label'] for a,b,t in intervals],valuesCm=[t['physical']*unit_mm/10 for a,b,t in intervals],errorCm=max(errors),segments=len(intervals),textId=main[0]['id'],bounds=[min(p[0] for p in basepoints),min(p[1] for p in basepoints),max(p[0] for p in basepoints),max(p[1] for p in basepoints)]))
    return dict(importedCandidates=imported_candidates+(ungrouped_candidates(doc,layout,ignored) if include_ungrouped else []),proposals=proposals,rejected=dict(rejected),unitMM=unit_mm,convention=convention)


def ungrouped_candidates(doc,layout,ignored=()):
    """Review-only candidates: numeric label, baseline and two witness lines.
    Existing groups are excluded; source geometry is never changed.
    """
    grouped={e.dxf.handle for _,group in doc.groups for e in group}
    entities=[e for e in doc.layouts.get(layout) if e.dxf.handle not in grouped and e.dxf.handle not in ignored]
    lines=[e for e in entities if e.dxftype()=='LINE']
    texts=[e for e in entities if e.dxftype() in ('TEXT','MTEXT') and re.fullmatch(r'\d+(?:[.,]\d+)?',e.plain_text().strip())]
    result=[];used=set()
    for text in texts:
        if text.dxf.handle in used:continue
        h=float(text.dxf.get('char_height',1) if text.dxftype()=='MTEXT' else text.dxf.height)
        if h<=0:continue
        angle=math.radians(text.get_rotation() if text.dxftype()=='MTEXT' else text.dxf.get('rotation',0));u=(math.cos(angle),math.sin(angle));n=(-u[1],u[0])
        project=lambda p:(p[0]*u[0]+p[1]*u[1],p[0]*n[0]+p[1]*n[1])
        label=text.plain_text().strip();tp=project(text.dxf.insert);center=tp[0]+len(label)*h*.27;tol=max(.001,h*.003)
        edges=[(e,project(e.dxf.start),project(e.dxf.end)) for e in lines]
        bases=[(e,a,b) for e,a,b in edges if abs(a[1]-b[1])<tol and abs(a[0]-b[0])>h*2 and min(a[0],b[0])+tol<center<max(a[0],b[0])-tol and -.2*h<tp[1]-a[1]<1.2*h]
        bases.sort(key=lambda item:abs(tp[1]-item[1][1]-.2*h))
        for base,a,b in bases:
            ends=sorted([a[0],b[0]]);baseline=(a[1]+b[1])/2
            witnesses=[]
            for x in ends:
                found=[e for e,p,q in edges if abs(p[0]-q[0])<tol and abs(p[0]-x)<tol*3 and abs(p[1]-q[1])>h and min(abs(p[1]-baseline),abs(q[1]-baseline))<h*.2]
                if not found:break
                witnesses.extend(found)
            if len(witnesses)<2:continue
            labels=[e for e in texts if ends[0]<project(e.dxf.insert)[0]+len(e.plain_text().strip())*h*.27<ends[1] and abs(project(e.dxf.insert)[1]-tp[1])<h*.35]
            ticks=[e for e,p,q in edges if math.dist(p,q)<h*2 and any(min(math.dist(p,(x,baseline)),math.dist(q,(x,baseline)))<h*.4 for x in ends)]
            members={e.dxf.handle:e for e in [base,*witnesses,*ticks,*labels]}
            if used.intersection(members):continue
            ids=list(members);used.update(ids)
            result.append(dict(name='Cotation sans groupe #'+text.dxf.handle,ids=ids,labels=[e.plain_text().strip() for e in labels],layers=sorted({e.dxf.layer for e in members.values()}),ungrouped=True))
            break
        if len(result)>=500:break
    return result
