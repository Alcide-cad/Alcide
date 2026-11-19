"""1.0.94 · Export des splines créées dans ALCIDE (outils Spline et Crayon) en vraie entité SPLINE.
Même calcul que spline-math194.js (B-spline cubique, points de lissage façon AutoCAD)."""
import math
import numpy as np

def _span(k,p,u,n):
    if u>=k[n]:return n-1
    if u<=k[p]:return p
    lo,hi=p,n
    mid=(lo+hi)//2
    while u<k[mid] or u>=k[mid+1]:
        if u<k[mid]:hi=mid
        else:lo=mid
        mid=(lo+hi)//2
    return mid

def _basis(i,u,p,k):
    N=[1.0]+[0.0]*p;left=[0.0]*(p+1);right=[0.0]*(p+1)
    for j in range(1,p+1):
        left[j]=u-k[i+1-j];right[j]=k[i+j]-u;saved=0.0
        for r in range(j):
            t=N[r]/(right[r+1]+left[j-r]);N[r]=saved+right[r+1]*t;saved=left[j-r]*t
        N[j]=saved
    return N

def _row(k,p,u,n,der=0):
    """Ligne de la matrice : fonctions de base (ou dérivées 1/2) au paramètre u, par différences des bases de degré inférieur."""
    out=np.zeros(n)
    span=_span(k,p,u,n)
    if der==0:
        N=_basis(span,u,p,k)
        for j in range(p+1):out[span-p+j]=N[j]
        return out
    # Dérivée d'ordre der : formule de Piegl & Tiller (2.9) via bases de degré p-der.
    for r in range(p+1):
        i=span-p+r
        # dérivée de N_{i,p} = p/(k[i+p]-k[i]) N_{i,p-1} - p/(k[i+p+1]-k[i+1]) N_{i+1,p-1}, appliquée récursivement
        out[i]=_dN(k,i,p,u,der)
    return out

def _N(k,i,p,u):
    if p==0:
        last=len(k)-1
        while last>0 and k[last-1]==k[last]:last-=1
        if k[i]<=u<k[i+1] or (u==k[-1] and k[i]<k[i+1] and i+1==last):return 1.0
        return 0.0
    a=0.0 if k[i+p]==k[i] else (u-k[i])/(k[i+p]-k[i])*_N(k,i,p-1,u)
    b=0.0 if k[i+p+1]==k[i+1] else (k[i+p+1]-u)/(k[i+p+1]-k[i+1])*_N(k,i+1,p-1,u)
    return a+b

def _dN(k,i,p,u,d):
    if d==0:return _N(k,i,p,u)
    a=0.0 if k[i+p]==k[i] else p/(k[i+p]-k[i])*_dN(k,i,p-1,u,d-1)
    b=0.0 if k[i+p+1]==k[i+1] else p/(k[i+p+1]-k[i+1])*_dN(k,i+1,p-1,u,d-1)
    return a-b

def _dedupe(ps):
    out=[]
    for p in ps:
        q=(float(p[0]),float(p[1]))
        if not all(math.isfinite(v) for v in q):raise ValueError('Spline : coordonnée invalide.')
        if not out or math.dist(out[-1],q)>1e-9:out.append(q)
    return out

def fit_interpolate(points,closed=False):
    ps=_dedupe(points)
    if closed and len(ps)>2 and math.dist(ps[0],ps[-1])<1e-9:ps.pop()
    if len(ps)<2:raise ValueError('Une spline demande au moins deux points.')
    if closed and len(ps)<3:closed=False
    pts=ps+[ps[0]] if closed else ps
    n=len(pts)-1;p=3
    d=[0.0]
    for i in range(1,len(pts)):d.append(d[-1]+math.dist(pts[i-1],pts[i]))
    L=d[-1] or 1.0;t=[v/L for v in d]
    knots=[0.0]*4+t[1:-1]+[1.0]*4;count=n+3
    A=[];B=[]
    A.append(_row(knots,p,0.0,count));B.append(pts[0])
    tangent=None
    if closed:
        dx,dy=ps[1][0]-ps[-1][0],ps[1][1]-ps[-1][1];m=math.hypot(dx,dy) or 1.0
        T=(dx/m*d[-1],dy/m*d[-1]);tangent=(dx/m,dy/m)
        A.append(_row(knots,p,0.0,count,1));B.append(T)
        for i in range(1,n):A.append(_row(knots,p,t[i],count));B.append(pts[i])
        A.append(_row(knots,p,1.0,count,1));B.append(T)
    else:
        A.append(_row(knots,p,0.0,count,2));B.append((0.0,0.0))
        for i in range(1,n):A.append(_row(knots,p,t[i],count));B.append(pts[i])
        A.append(_row(knots,p,1.0,count,2));B.append((0.0,0.0))
    A.append(_row(knots,p,1.0,count));B.append(pts[n])
    cps=np.linalg.solve(np.array(A),np.array(B,dtype=float))
    return {'degree':3,'control':[tuple(c) for c in cps],'knots':knots,'fit':ps,'closed':closed,'periodic':False,'tangent':tangent}

def control_spline(points,closed=False):
    ps=_dedupe(points)
    if len(ps)<2:raise ValueError('Une spline demande au moins deux sommets.')
    p=min(3,len(ps)-1)
    if closed and len(ps)>=3:
        cps=ps+ps[:p];knots=[float(i-p) for i in range(len(cps)+p+1)]
        return {'degree':p,'control':cps,'knots':knots,'fit':[],'closed':True,'periodic':True,'tangent':None}
    inner=len(ps)-p-1
    knots=[0.0]*(p+1)+[(i+1)/(inner+1) for i in range(inner)]+[1.0]*(p+1)
    return {'degree':p,'control':ps,'knots':knots,'fit':[],'closed':False,'periodic':False,'tangent':None}

def add_spline(layout,drawing,pts,attrs):
    s=control_spline(pts,bool(drawing.get('closed'))) if drawing.get('splineMode')=='cv' else fit_interpolate(pts,bool(drawing.get('closed')))
    e=layout.new_entity('SPLINE',dxfattribs=dict(attrs))
    e.dxf.degree=s['degree']
    e.control_points=[(x,y,0.0) for x,y in s['control']]
    # Nœuds écrits comme AutoCAD / ODA : longueurs de cordes cumulées (points de lissage) ou entiers (sommets).
    # Même courbe (simple changement d'échelle du paramètre), relue à l'identique après passage en DWG.
    k=s['knots']
    if s['fit']:
        L=sum(math.dist(a,b) for a,b in zip(s['fit'],s['fit'][1:]+([s['fit'][0]] if s['closed'] else [])))
        k=[v*L for v in k]
    elif not s['periodic']:
        n=len(k)-2*(s['degree']+1)+1;k=[round(v*n) for v in k]
        k=[float(v) for v in k]
    e.knots=k
    if s['fit']:
        fit=s['fit']+[s['fit'][0]] if s['closed'] else s['fit']  # AutoCAD / ODA : spline fermée = premier point répété
        e.fit_points=[(x,y,0.0) for x,y in fit]
    # Tolérances explicites : ezdxf / ODA les utilisent pour évaluer la courbe (contrôle de réouverture du DWG).
    e.dxf.knot_tolerance=1e-10;e.dxf.control_point_tolerance=1e-10
    if s['fit']:e.dxf.fit_tolerance=1e-10
    flags=8
    if s['closed']:flags|=1
    if s['periodic'] or (s['closed'] and s['fit']):flags|=2  # spline fermée par points de lissage : AutoCAD / ODA la marquent périodique
    c=s['control'];a=c[0];far=max(c,key=lambda q:math.dist(a,q));L=math.dist(a,far)
    if L>0 and all(abs((far[0]-a[0])*(q[1]-a[1])-(far[1]-a[1])*(q[0]-a[0]))/L<=1e-9*max(1.0,L) for q in c):flags|=16  # spline rectiligne (ODA : « linéaire »)
    e.dxf.flags=flags
    if s['tangent']:
        e.dxf.start_tangent=(s['tangent'][0],s['tangent'][1],0.0);e.dxf.end_tangent=(s['tangent'][0],s['tangent'][1],0.0)
    raw=drawing.get('raw')
    if drawing.get('kind')=='pencil' and isinstance(raw,list) and len(raw)>1:
        # 1.0.95 : points bruts du crayon conservés pour relisser après réouverture.
        import json
        doc=layout.doc
        if doc is not None and 'ALCIDE_PENCIL' not in doc.appids:doc.appids.new('ALCIDE_PENCIL')
        payload=json.dumps({'s':int(drawing.get('smoothing',50)),'raw':[[round(float(p[0]),4),round(float(p[1]),4)] for p in raw[:400]]},separators=(',',':'))
        e.set_xdata('ALCIDE_PENCIL',[(1000,payload[i:i+200]) for i in range(0,len(payload),200)])
    return e
