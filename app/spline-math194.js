/* 1.0.94 · Calcul des splines (B-splines cubiques) : interpolation par points de lissage comme AutoCAD
   (paramétrage par cordes, nœuds « naturels », dérivées secondes nulles aux extrémités), splines par
   sommets de contrôle (ouvertes serrées ou fermées périodiques), échantillonnage, simplification
   Ramer-Douglas-Peucker et lissage du crayon. Aucune dépendance au DOM : testable sous Node. */
(function(root){
 const dist=(a,b)=>Math.hypot(b[0]-a[0],b[1]-a[1]);
 function findSpan(k,p,u,nCtrl){const n=nCtrl-1;if(u>=k[n+1])return n;if(u<=k[p])return p;let lo=p,hi=n+1,mid=(lo+hi)>>1;while(u<k[mid]||u>=k[mid+1]){if(u<k[mid])hi=mid;else lo=mid;mid=(lo+hi)>>1;}return mid;}
 // Fonctions de base et dérivées (Piegl & Tiller A2.3).
 function dersBasis(i,u,p,k,nd){const ndu=Array.from({length:p+1},()=>new Array(p+1).fill(0)),left=new Array(p+1),right=new Array(p+1);ndu[0][0]=1;
  for(let j=1;j<=p;j++){left[j]=u-k[i+1-j];right[j]=k[i+j]-u;let saved=0;for(let r=0;r<j;r++){ndu[j][r]=right[r+1]+left[j-r];const t=ndu[r][j-1]/ndu[j][r];ndu[r][j]=saved+right[r+1]*t;saved=left[j-r]*t;}ndu[j][j]=saved;}
  const ders=Array.from({length:nd+1},()=>new Array(p+1).fill(0));for(let j=0;j<=p;j++)ders[0][j]=ndu[j][p];
  const a=[new Array(p+1).fill(0),new Array(p+1).fill(0)];
  for(let r=0;r<=p;r++){let s1=0,s2=1;a[0][0]=1;for(let kk=1;kk<=nd;kk++){let d=0;const rk=r-kk,pk=p-kk;if(r>=kk){a[s2][0]=a[s1][0]/ndu[pk+1][rk];d=a[s2][0]*ndu[rk][pk];}const j1=rk>=-1?1:-rk,j2=r-1<=pk?kk-1:p-r;for(let j=j1;j<=j2;j++){a[s2][j]=(a[s1][j]-a[s1][j-1])/ndu[pk+1][rk+j];d+=a[s2][j]*ndu[rk+j][pk];}if(r<=pk){a[s2][kk]=-a[s1][kk-1]/ndu[pk+1][r];d+=a[s2][kk]*ndu[r][pk];}ders[kk][r]=d;const t=s1;s1=s2;s2=t;}}
  let r=p;for(let kk=1;kk<=nd;kk++){for(let j=0;j<=p;j++)ders[kk][j]*=r;r*=p-kk;}return ders;}
 function row(k,p,u,nCtrl,der=0){const span=findSpan(k,p,u,nCtrl),d=dersBasis(span,u,p,k,der),out=new Array(nCtrl).fill(0);for(let j=0;j<=p;j++)out[span-p+j]=d[der][j];return out;}
 function solve(A,B){const n=A.length,M=A.map((r,i)=>[...r,...B[i]]),w=B[0].length;
  for(let c=0;c<n;c++){let piv=c;for(let r=c+1;r<n;r++)if(Math.abs(M[r][c])>Math.abs(M[piv][c]))piv=r;if(Math.abs(M[piv][c])<1e-14)throw Error('Système de spline singulier.');[M[c],M[piv]]=[M[piv],M[c]];
   for(let r=0;r<n;r++){if(r===c)continue;const f=M[r][c]/M[c][c];if(f)for(let j=c;j<n+w;j++)M[r][j]-=f*M[c][j];}}
  return M.map((r,i)=>r.slice(n).map(v=>v/r[i]));}
 function chordParams(ps){const d=[0];for(let i=1;i<ps.length;i++)d.push(d[i-1]+dist(ps[i-1],ps[i]));const L=d.at(-1)||1;return d.map(v=>v/L);}
 function dedupe(ps){const out=[];for(const p of ps)if(!out.length||dist(out.at(-1),p)>1e-9)out.push([p[0],p[1]]);return out;}
 // Points de lissage → B-spline cubique identique à AutoCAD / ezdxf fit_points_to_cad_cv.
 function fitInterpolate(points,closed=false){
  let ps=dedupe(points);if(closed&&ps.length>2&&dist(ps[0],ps.at(-1))<1e-9)ps.pop();
  if(ps.length<2)throw Error('Une spline demande au moins deux points.');
  if(closed&&ps.length<3)closed=false;
  const pts=closed?[...ps,ps[0]]:ps,n=pts.length-1,p=3,t=chordParams(pts);
  const knots=[0,0,0,0,...t.slice(1,-1),1,1,1,1],count=n+3;
  const A=[],B=[];
  A.push(row(knots,p,0,count));B.push(pts[0]);
  if(closed){
   // Tangente de raccord commune (fermeture sans cassure), amplitude = longueur des cordes (méthode « chord »).
   const L=pts.slice(1).reduce((s,q,i)=>s+dist(pts[i],q),0),dir=[ps[1][0]-ps.at(-1)[0],ps[1][1]-ps.at(-1)[1]],m=Math.hypot(...dir)||1,T=[dir[0]/m*L,dir[1]/m*L];
   A.push(row(knots,p,0,count,1));B.push(T);
   for(let i=1;i<n;i++){A.push(row(knots,p,t[i],count));B.push(pts[i]);}
   A.push(row(knots,p,1,count,1));B.push(T);
   A.push(row(knots,p,1,count));B.push(pts[n]);
   return {degree:3,controlPoints:solve(A,B),knots,fitPoints:ps,closed:true,periodic:false,startTangent:[T[0]/L,T[1]/L],endTangent:[T[0]/L,T[1]/L]};
  }
  A.push(row(knots,p,0,count,2));B.push([0,0]);
  for(let i=1;i<n;i++){A.push(row(knots,p,t[i],count));B.push(pts[i]);}
  A.push(row(knots,p,1,count,2));B.push([0,0]);
  A.push(row(knots,p,1,count));B.push(pts[n]);
  return {degree:3,controlPoints:solve(A,B),knots,fitPoints:ps,closed:false,periodic:false};
 }
 // Sommets de contrôle → B-spline (ouverte serrée, ou fermée périodique uniforme).
 function controlSpline(points,closed=false){
  const ps=dedupe(points);if(ps.length<2)throw Error('Une spline demande au moins deux sommets.');
  if(closed&&ps.length>=3){const p=Math.min(3,ps.length-1),cps=[...ps,...ps.slice(0,p)],m=cps.length+p+1,knots=Array.from({length:m},(_,i)=>i-p);return {degree:p,controlPoints:cps,knots,closed:true,periodic:true,vertices:ps};}
  const p=Math.min(3,ps.length-1),inner=ps.length-p-1,knots=[...new Array(p+1).fill(0),...Array.from({length:inner},(_,i)=>(i+1)/(inner+1)),...new Array(p+1).fill(1)];
  return {degree:p,controlPoints:ps,knots,closed:false,periodic:false,vertices:ps};
 }
 function point(s,u){const p=s.degree,k=s.knots,c=s.controlPoints,span=findSpan(k,p,u,c.length),N=dersBasis(span,u,p,k,0)[0];let x=0,y=0;for(let j=0;j<=p;j++){const q=c[span-p+j];x+=N[j]*q[0];y+=N[j]*q[1];}return [x,y];}
 function domain(s){const p=s.degree,k=s.knots;return [k[p],k[k.length-p-1]];}
 // Échantillonnage : nombre de pas par travée adapté à la courbure (polyligne d'affichage et de sélection).
 function sample(s,perSpan=16){const [a,b]=domain(s),k=s.knots,out=[];const spans=[];for(let i=s.degree;i<k.length-s.degree-1;i++)if(k[i+1]>k[i]&&k[i]>=a&&k[i+1]<=b)spans.push([k[i],k[i+1]]);
  for(const [u0,u1] of spans){for(let j=0;j<perSpan;j++)out.push(point(s,u0+(u1-u0)*j/perSpan));}out.push(point(s,b));return out;}
 function fromDrawing(d,points){const pts=points||d.points;return d.splineMode==='cv'?controlSpline(pts,!!d.closed):fitInterpolate(pts,!!d.closed);}
 function rdp(ps,eps){if(ps.length<3)return ps.slice();const keep=new Uint8Array(ps.length);keep[0]=keep[ps.length-1]=1;const stack=[[0,ps.length-1]];
  while(stack.length){const [a,b]=stack.pop();let best=-1,idx=-1;const A=ps[a],B=ps[b],L=dist(A,B);for(let i=a+1;i<b;i++){const P=ps[i],d=L<1e-12?dist(A,P):Math.abs((B[0]-A[0])*(A[1]-P[1])-(A[0]-P[0])*(B[1]-A[1]))/L;if(d>best){best=d;idx=i;}}if(best>eps){keep[idx]=1;stack.push([a,idx],[idx,b]);}}
  return ps.filter((_,i)=>keep[i]);}
 // Crayon : lissage du tracé brut (moyenne glissante), simplification RDP, puis points de lissage d'une spline.
 // smoothing 0..100 : tolérance RDP = 0,05 % à 6 % de la diagonale du tracé.
 function pencil(raw,smoothing=50,closedTol=0){let ps=dedupe(raw);if(ps.length<2)return null;
  const xs=ps.map(p=>p[0]),ys=ps.map(p=>p[1]),diag=Math.hypot(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys))||1,s=Math.max(0,Math.min(100,smoothing))/100;
  // 1.0.95 : plage élargie · 0 = tracé brut (aucune moyenne, tolérance 0,05 %) · 100 = très lissé (fenêtre 9, tolérance 6 %).
  const win=Math.round(s*8),passes=s>0?2:0;let sm=ps;for(let pass=0;pass<passes;pass++){sm=sm.map((p,i)=>{if(i===0||i===sm.length-1)return p;let x=0,y=0,n=0;for(let j=Math.max(0,i-win);j<=Math.min(sm.length-1,i+win);j++){x+=sm[j][0];y+=sm[j][1];n++;}return [x/n,y/n];});}
  const eps=diag*(0.0005+0.06*s*s);let simple=rdp(sm,eps);if(simple.length<2)simple=[sm[0],sm.at(-1)];
  const closed=closedTol>0&&simple.length>3&&dist(simple[0],simple.at(-1))<=closedTol;if(closed)simple.pop();
  return {fitPoints:simple,closed,raw:ps.length,kept:simple.length};}
 const api={fitInterpolate,controlSpline,point,sample,domain,fromDrawing,rdp,pencil,chordParams};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SplineMath194=api;
})(typeof window!=='undefined'?window:globalThis);
