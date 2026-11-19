// ALCIDE 1.0.96 · Accrochages AutoCAD complémentaires : perpendiculaire, tangente, quadrant, insertion, nœud, extension,
// parallèle. Marqueurs dessinés à la manière d'AutoCAD ; réglables dans « Grille et accrochages ».
(()=>{
 const KINDS=[['perpendicular','perpendiculaire','Perpendiculaire'],['tangent','tangente','Tangente'],['quadrant','quadrant','Quadrant'],['insertion','insertion','Insertion'],['node','nœud','Nœud'],['extension','extension','Extension'],['parallel','parallèle','Parallèle']];
 const defaults={perpendicular:true,tangent:true,quadrant:true,insertion:true,node:true,extension:true,parallel:true};
 let opts={...defaults};try{const p=JSON.parse(localStorage.getItem('osnap196')||'{}');for(const k in defaults)if(typeof p[k]==='boolean')opts[k]=p[k];}catch{}
 const OWN=new Set(KINDS.map(k=>k[1])),PRIORITY=new Set(['extrémité','milieu','centre','intersection']);
 let from=null,acquired=[],parallelLine=null,hoverLine=null,hoverSince=0,guide=null;
 const off=id=>[edits[id]?.dx||0,edits[id]?.dy||0];
 const drawingTool=()=>tool!=='select'||!!window.Cad196?.mode||(typeof cadMode!=='undefined'&&!!cadMode)||!!window.SplineTools194?.mode;
 window.__capture196.push({type:'pointerdown',fn:ev=>{if(ev.target!==overlay||ev.button!==0)return;setTimeout(()=>{if(drawingTool()){from=snapPoint?[...snapPoint]:world(eventPoint(ev));}else{from=null;}acquired=[];parallelLine=null;},0);}});
 window.__capture196.push({type:'keydown',fn:ev=>{if(ev.key==='Escape'){from=null;acquired=[];parallelLine=null;}}});
 const set=setTool;setTool=function(...a){from=null;acquired=[];parallelLine=null;return set.apply(this,a);};
 function curveOf(e){const d=off(e.id);if(e.type==='CIRCLE'){const ps=edits[e.id]?.geometry?.points||edits[e.id]?.drawing?.points;const c=ps?ps[0]:(e.originalSnap||e.snap||[])[0];if(!c)return null;const r=ps?Math.hypot(ps[1][0]-ps[0][0],ps[1][1]-ps[0][1]):e.radius;return {c:[c[0]+d[0],c[1]+d[1]],r,full:true};}
  if(e.type==='ARC'){const ps=edits[e.id]?.geometry?.points||edits[e.id]?.drawing?.points||(e.nativeArc?.center?[e.nativeArc.center,(e.originalSnap||e.snap)[1],(e.originalSnap||e.snap)[2]]:(e.originalSnap||e.snap));if(!ps||ps.length<3)return null;const c=[ps[0][0]+d[0],ps[0][1]+d[1]],s=[ps[1][0]+d[0],ps[1][1]+d[1]],t=[ps[2][0]+d[0],ps[2][1]+d[1]];return {c,r:Math.hypot(s[0]-c[0],s[1]-c[1]),full:false,a0:Math.atan2(s[1]-c[1],s[0]-c[0]),a1:Math.atan2(t[1]-c[1],t[0]-c[0])};}return null;}
 const norm=a=>((a%(2*Math.PI))+2*Math.PI)%(2*Math.PI),onArc=(cv,a)=>cv.full||norm(a-cv.a0)<=norm(cv.a1-cv.a0)+1e-9;
 function segs(e){if(!['LINE','LWPOLYLINE'].includes(e.type))return [];let ps;try{ps=cadVertices(e);}catch{return [];}if(!ps||ps.length<2)return [];if(e.type==='LWPOLYLINE'&&e.shape?.[1]?.some?.(p=>p[2]))return [];const all=e.type==='LWPOLYLINE'&&cadClosed(e)?[...ps,ps[0]]:ps;return all.slice(1).map((p,i)=>[all[i],p]);}
 function insertionPoint(e){const d=off(e.id);if(e.type==='INSERT'){const t=e.tags||{};const p=Number.isFinite(+t[10])&&Number.isFinite(+t[20])?[+t[10],+t[20]]:e.insertPoint||e.insert||null;return p?[p[0]+d[0],p[1]+d[1]]:null;}if(['TEXT','MTEXT'].includes(e.type)||e.annotation){const p=e.annotation?.position||(e.snap||[])[0];return p?[p[0]+d[0],p[1]+d[1]]:null;}return null;}
 function candidates(p,wp,tol){const radius=tol/view.s,es=query([wp[0]-radius,wp[1]-radius,wp[0]+radius,wp[1]+radius]).filter(visible);const out=[];const near=(pt,kind,extra)=>{if(!pt||!pt.every(Number.isFinite))return;const q=screen(pt),dd=Math.hypot(q[0]-p[0],q[1]-p[1]);if(dd<=tol)out.push({point:pt,kind,distance:dd,...extra});};
  for(const e of es.slice(0,200)){
   const cv=(opts.quadrant||opts.tangent||opts.perpendicular)&&curveOf(e);
   if(cv){if(opts.quadrant)for(let i=0;i<4;i++){const a=i*Math.PI/2;if(onArc(cv,a))near([cv.c[0]+cv.r*Math.cos(a),cv.c[1]+cv.r*Math.sin(a)],'quadrant');}
    if(from&&opts.tangent){const dx=from[0]-cv.c[0],dy=from[1]-cv.c[1],L=Math.hypot(dx,dy);if(L>cv.r*(1+1e-9)){const base=Math.atan2(dy,dx),da=Math.acos(cv.r/L);for(const a of [base+da,base-da])if(onArc(cv,a))near([cv.c[0]+cv.r*Math.cos(a),cv.c[1]+cv.r*Math.sin(a)],'tangente');}}
    if(from&&opts.perpendicular){const a=Math.atan2(from[1]-cv.c[1],from[0]-cv.c[0]);for(const b of [a,a+Math.PI])if(onArc(cv,b))near([cv.c[0]+cv.r*Math.cos(b),cv.c[1]+cv.r*Math.sin(b)],'perpendiculaire');}}
   if(from&&opts.perpendicular)for(const [a,b]of segs(e)){const vx=b[0]-a[0],vy=b[1]-a[1],l=vx*vx+vy*vy;if(l<1e-16)continue;const t=((from[0]-a[0])*vx+(from[1]-a[1])*vy)/l;if(t<-1e-9||t>1+1e-9)continue;near([a[0]+vx*t,a[1]+vy*t],'perpendiculaire');}
   if(opts.insertion)near(insertionPoint(e),'insertion');
   if(opts.node&&(e.type==='POINT'||edits[e.id]?.drawing?.type==='POINT'))near((e.snap||[])[0]&&[(e.snap[0][0]+off(e.id)[0]),(e.snap[0][1]+off(e.id)[1])],'nœud');}
  // Extension : prolongement d'une extrémité « acquise » au survol.
  if(opts.extension)for(const a of acquired){const vx=a.dir[0],vy=a.dir[1],t=(wp[0]-a.p[0])*vx+(wp[1]-a.p[1])*vy;if(t<=0)continue;const q=[a.p[0]+vx*t,a.p[1]+vy*t];near(q,'extension',{guide:[a.p,q]});}
  // Parallèle : depuis le dernier point, parallèle à une ligne acquise au survol.
  if(opts.parallel&&from&&parallelLine){const [a,b]=parallelLine,l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(l>1e-12){const u=[(b[0]-a[0])/l,(b[1]-a[1])/l],t=(wp[0]-from[0])*u[0]+(wp[1]-from[1])*u[1];const q=[from[0]+u[0]*t,from[1]+u[1]*t];if(Math.abs(t)>1e-9)near(q,'parallèle',{guide:[from,q],ref:parallelLine});}}
  return out.sort((x,y)=>x.distance-y.distance);}
 // Acquisition au survol (comme le repérage AutoCAD) : extrémités pour l'extension, lignes pour le parallèle.
 function acquire(p,wp){if(!scene)return;const tol=(typeof snapSettings==='undefined'?10:snapSettings.radius),radius=tol/view.s;const es=query([wp[0]-radius,wp[1]-radius,wp[0]+radius,wp[1]+radius]).filter(visible).slice(0,80);let line=null,best=tol;
  for(const e of es)for(const [a,b]of segs(e)){const d=segmentDistance(wp,a,b)*view.s;if(d<best){best=d;line=[a,b];}for(const [end,other]of [[a,b],[b,a]]){const q=screen(end);if(Math.hypot(q[0]-p[0],q[1]-p[1])<tol){const l=Math.hypot(end[0]-other[0],end[1]-other[1]);if(l>1e-12&&!acquired.some(x=>Math.hypot(x.p[0]-end[0],x.p[1]-end[1])<1e-9)){acquired.push({p:end,dir:[(end[0]-other[0])/l,(end[1]-other[1])/l]});if(acquired.length>3)acquired.shift();}}}}
  const key=line&&line.flat().join(',');if(key&&key!==hoverLine){hoverLine=key;hoverSince=performance.now();}else if(!key)hoverLine=null;else if(performance.now()-hoverSince>350&&from)parallelLine=line;}
 window.__capture196.push({type:'pointermove',fn:ev=>{if(ev.target!==overlay||!drawingTool())return;try{acquire(eventPoint(ev),world(eventPoint(ev)));}catch{}}});
 const base=snap;snap=function(p){const r=base.apply(this,arguments);guide=null;if(!scene||!$('#snap').checked||!drawingTool()&&!opts.quadrant&&!opts.insertion&&!opts.node)return r;const tol=(typeof snapSettings==='undefined'?10:snapSettings.radius);let cs;try{cs=candidates(p,world(p),tol);}catch{return r;}if(!cs.length)return r;const c=cs[0];
  if(snapPoint&&snapKind&&PRIORITY.has(snapKind)){const q=screen(snapPoint);const dd=Math.hypot(q[0]-p[0],q[1]-p[1]);if(dd<=c.distance+2)return r;}
  snapPoint=[...c.point];snapKind=c.kind;guide=c.guide||null;return [...c.point];};
 // Marqueurs AutoCAD.
 const draw=drawOverlay;drawOverlay=function(...a){const own=snapKind&&OWN.has(snapKind)&&snapPoint;const saved=snapKind;if(own)snapKind=null;let r;try{r=draw.apply(this,a);}finally{if(own)snapKind=saved;}
  if(!own||!$('#snap').checked||!scene)return r;const [x,y]=screen(snapPoint),k=snapKind,color='#3ee07d';oc.save();oc.strokeStyle=color;oc.fillStyle=color;oc.lineWidth=2;oc.setLineDash([]);
  if(guide){const g0=screen(guide[0]),g1=screen(guide[1]);oc.save();oc.setLineDash([3,4]);oc.lineWidth=1;oc.strokeStyle='#3ee07d';oc.beginPath();oc.moveTo(...g0);oc.lineTo(...g1);oc.stroke();oc.restore();}
  oc.beginPath();
  if(k==='perpendiculaire'){oc.moveTo(x-7,y-7);oc.lineTo(x-7,y+7);oc.lineTo(x+7,y+7);oc.moveTo(x-7,y);oc.lineTo(x,y);oc.lineTo(x,y+7);}
  else if(k==='tangente'){oc.arc(x,y,6,0,Math.PI*2);oc.moveTo(x-8,y-6);oc.lineTo(x+8,y-6);}
  else if(k==='quadrant'){oc.moveTo(x,y-7);oc.lineTo(x+7,y);oc.lineTo(x,y+7);oc.lineTo(x-7,y);oc.closePath();}
  else if(k==='insertion'){oc.rect(x-7,y-7,8,8);oc.rect(x-1,y-1,8,8);}
  else if(k==='nœud'){oc.arc(x,y,6,0,Math.PI*2);oc.moveTo(x-4,y-4);oc.lineTo(x+4,y+4);oc.moveTo(x+4,y-4);oc.lineTo(x-4,y+4);}
  else if(k==='extension'){oc.moveTo(x-5,y);oc.lineTo(x+5,y);oc.moveTo(x,y-5);oc.lineTo(x,y+5);}
  else if(k==='parallèle'){oc.moveTo(x-7,y+5);oc.lineTo(x-1,y-6);oc.moveTo(x+1,y+5);oc.lineTo(x+7,y-6);}
  oc.stroke();oc.font='12px Segoe UI';const label=k[0].toUpperCase()+k.slice(1),wd=oc.measureText(label).width+14,lx=Math.max(3,Math.min(w-wd-3,x+13)),ly=Math.max(3,Math.min(h-24,y-27));oc.fillStyle='#17232e';oc.fillRect(lx,ly,wd,23);oc.strokeStyle=color;oc.lineWidth=1;oc.strokeRect(lx,ly,wd,23);oc.fillStyle=color;oc.fillText(label,lx+7,ly+16);oc.restore();return r;};
 // Réglages : cases dans « Grille et accrochages ».
 function settings(){const box=document.getElementById('snap-kinds-settings');if(!box||document.getElementById('osnap196-perpendicular'))return;const head=document.createElement('p');head.className='muted';head.textContent='Accrochages AutoCAD (marqueurs verts) :';head.style.margin='8px 0 2px';box.append(head);
  for(const [key,,name]of KINDS){const label=document.createElement('label');label.className='row';const input=document.createElement('input');input.type='checkbox';input.id='osnap196-'+key;input.className='toggle-switch';input.setAttribute('role','switch');input.checked=opts[key];input.onchange=()=>{opts[key]=input.checked;try{localStorage.setItem('osnap196',JSON.stringify(opts));}catch{}};label.append(document.createTextNode(name),input);box.append(label);}}
 settings();const show=window.showSnapSettings;if(show)window.showSnapSettings=function(...a){settings();for(const [key]of KINDS){const i=document.getElementById('osnap196-'+key);if(i)i.checked=opts[key];}return show.apply(this,a);};
 window.Osnap196={get opts(){return opts;},set(k,v){opts[k]=!!v;try{localStorage.setItem('osnap196',JSON.stringify(opts));}catch{}},get from(){return from;},candidates};
})();
