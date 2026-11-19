/* 1.0.95 · Lissage du crayon réglable, pendant et après le tracé.
   - Carte « Lissage du crayon » bien visible tant que le Crayon est actif : curseur 0 (brut) → 100 (très lissé),
     valeur affichée, boutons − / +, touches [ et ].
   - Trait à main levée sélectionné : même réglage dans Propriétés ; le trait est relissé en direct depuis les
     points bruts conservés avec l'objet (exportés en XDATA ALCIDE_PENCIL dans le DXF / DWG). Ctrl+Z annule. */
(()=>{
 const M=window.SplineMath194,T=window.SplineTools194;if(!M||!T)return;
 const STEP=10,MAXRAW=400;
 const clamp=v=>Math.max(0,Math.min(100,Math.round(v)));let shown=50;const cur=()=>shown;
 // --- Outils géométriques
 function storeRaw(raw){let ps=raw.map(p=>[+p[0].toFixed(4),+p[1].toFixed(4)]);if(ps.length>MAXRAW){const out=[];for(let i=0;i<MAXRAW;i++)out.push(ps[Math.round(i*(ps.length-1)/(MAXRAW-1))]);ps=out;}return ps;}
 function fitAffine(P,Q){if(!P||!Q||P.length!==Q.length||!P.length)return null;const n=P.length;
  if(n<3){if(n===1)return [1,0,Q[0][0]-P[0][0],0,1,Q[0][1]-P[0][1]];const a=P[0],b=P[1],c=Q[0],d=Q[1],ux=b[0]-a[0],uy=b[1]-a[1],vx=d[0]-c[0],vy=d[1]-c[1],L=ux*ux+uy*uy;if(L<1e-18)return null;const co=(ux*vx+uy*vy)/L,si=(ux*vy-uy*vx)/L;return [co,-si,c[0]-(co*a[0]-si*a[1]),si,co,c[1]-(si*a[0]+co*a[1])];}
  // moindres carrés : [x y 1]·[a b c] = x' et y'
  let S=[[0,0,0],[0,0,0],[0,0,0]],bx=[0,0,0],by=[0,0,0];for(let i=0;i<n;i++){const r=[P[i][0],P[i][1],1];for(let j=0;j<3;j++){for(let k=0;k<3;k++)S[j][k]+=r[j]*r[k];bx[j]+=r[j]*Q[i][0];by[j]+=r[j]*Q[i][1];}}
  const det=m=>m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1])-m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0])+m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0]);const D=det(S);if(Math.abs(D)<1e-18)return fitAffine(P.slice(0,2),Q.slice(0,2));
  const solve=b=>[0,1,2].map(c=>det(S.map((row,i)=>row.map((v,j)=>j===c?b[i]:v)))/D);const X=solve(bx),Y=solve(by);return [X[0],X[1],X[2],Y[0],Y[1],Y[2]];}
 const apply=(A,p)=>[A[0]*p[0]+A[1]*p[1]+A[2],A[3]*p[0]+A[4]*p[1]+A[5]];
 // --- Traits concernés
 function strokeOf(id){const e=entities.get(id),ed=edits[id];if(!e||isLocked(e))return null;if(ed?.drawing?.type==='SPLINE'&&ed.drawing.kind==='pencil'&&Array.isArray(ed.drawing.raw)&&ed.drawing.raw.length>1)return {id,kind:'drawing',smoothing:ed.drawing.smoothing??50};
  if(e.pencil195&&Array.isArray(e.pencil195.raw)&&!ed?.drawing&&!ed?.deleted)return {id,kind:'imported',smoothing:e.pencil195.s??50};return null;}
 const strokes=()=>[...selected].map(strokeOf).filter(Boolean);
 // Relisse un trait ; renvoie l'identifiant (nouveau si le trait venait d'un fichier).
 function resmooth(st,s){
  const tol=10/(view.s||1);
  if(st.kind==='drawing'){const ed=edits[st.id],d=ed.drawing;let raw=d.raw;
   if(ed.geometry?.points){const A=fitAffine(d.points,ed.geometry.points);if(A)raw=raw.map(p=>apply(A,p));}
   const r=M.pencil(raw,s,tol);if(!r)return st.id;const nd={...d,points:r.fitPoints,closed:r.closed,raw,smoothing:s};const next={...ed,drawing:nd};delete next.geometry;edits[st.id]=next;return st.id;}
  const e=entities.get(st.id),ed=edits[st.id]||{},dx=ed.dx||0,dy=ed.dy||0,raw=e.pencil195.raw.map(p=>[p[0]+dx,p[1]+dy]);const r=M.pencil(raw,s,tol);if(!r)return st.id;
  const id=cadNewDrawing('SPLINE',r.fitPoints,{...cadProps(e),filled:false},r.closed);Object.assign(edits[id].drawing,{splineMode:'fit',kind:'pencil',degree:3,raw:storeRaw(raw),smoothing:s});edits[st.id]={...ed,deleted:true};selected.delete(st.id);selected.add(id);return id;}
 let liveBefore=null,frame=0;
 function setValue(v,how){v=clamp(v);T.setSmoothing(v);sync(v);const list=strokes();if(!list.length){status('Lissage du crayon : '+v+(v===0?' (tracé brut)':'')+' · s’applique aux prochains traits.');return;}
  if(how==='live'){if(!liveBefore)liveBefore=snapshot();for(const st of list)resmooth(st,v);cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{refresh();drawOverlay();});return;}
  const before=liveBefore||snapshot();liveBefore=null;for(const st of list)resmooth(st,v);commit(before);refresh();drawOverlay();status(list.length+' trait(s) relissé(s) · lissage '+v+' · Ctrl+Z annule.');}
 // --- Interface : carte flottante (outil actif) et carte Propriétés (trait sélectionné)
 function control(id,title){const c=document.createElement('div');c.id=id;c.className='pencil-smooth195';c.innerHTML='<strong>'+title+'</strong><div class="ps195-row"><button type="button" data-ps="minus" title="Moins lisse · touche [">−</button><input type="range" min="0" max="100" step="5" data-ps="range" aria-label="'+title+'"><button type="button" data-ps="plus" title="Plus lisse · touche ]">+</button><output data-ps="value"></output></div><small>0 = tracé brut · 100 = très lissé · touches [ et ]</small>';
  const r=c.querySelector('[data-ps=range]');r.oninput=()=>setValue(+r.value,'live');r.onchange=()=>setValue(+r.value,'commit');c.querySelector('[data-ps=minus]').onclick=()=>setValue(cur()-STEP,'commit');c.querySelector('[data-ps=plus]').onclick=()=>setValue(cur()+STEP,'commit');return c;}
 const style=document.createElement('style');style.textContent='.pencil-smooth195{background:#14202b;border:1px solid #3a6f96;border-radius:8px;padding:8px 10px;color:#e6edf3;font-size:12px;display:grid;gap:4px;box-shadow:0 4px 16px #0008}.pencil-smooth195 strong{font-size:13px}.ps195-row{display:flex;align-items:center;gap:6px}.ps195-row input{width:150px}.ps195-row button{width:26px;height:26px;font-size:16px;line-height:1;padding:0}.ps195-row output{min-width:38px;text-align:right;font-weight:600;font-variant-numeric:tabular-nums}.pencil-smooth195 small{opacity:.75}#pencil-float195{position:fixed;z-index:40}#pencil-props195{margin:8px;box-shadow:none}.pencil-smooth195[hidden]{display:none!important}';document.head.append(style);
 const float=control('pencil-float195','Lissage du crayon');float.hidden=true;document.body.append(float);
 const props=control('pencil-props195','Lissage du trait');props.hidden=true;
 function sync(v=T.smoothing){shown=v;for(const c of [float,props]){c.querySelector('[data-ps=range]').value=v;c.querySelector('[data-ps=value]').textContent=v===0?'brut':String(v);}}
 function place(){const pencil=T.mode?.tool==='pencil'&&T.mode.doc===activeId;if(pencil){const r=overlay.getBoundingClientRect();float.style.left=Math.round(r.left+12)+'px';float.style.top=Math.round(r.top+12)+'px';}
  if(float.hidden===pencil){float.hidden=!pencil;if(pencil)sync();}
  const list=!pencil&&selected.size?strokes():[];const show=list.length>0;const host=$('#properties');if(show&&host&&host.firstChild!==props)host.prepend(props);if(props.hidden===show){props.hidden=!show;}if(show&&!liveBefore)sync(clamp(list[0].smoothing));}
 const pu=propertiesUI;propertiesUI=function(...a){if(liveBefore&&props.isConnected&&!props.hidden)return;const r=pu.apply(this,a);try{place();}catch{}return r;};
 const dov=drawOverlay;drawOverlay=function(...a){const r=dov.apply(this,a);try{place();}catch{}return r;};
 // Touches [ et ] (aussi les touches physiques correspondantes sur clavier AZERTY : ^ et $)
 window.addEventListener('keydown',ev=>{if(['INPUT','SELECT','TEXTAREA'].includes(ev.target.tagName)&&ev.target.type!=='range'||ev.ctrlKey||ev.metaKey)return;const up=ev.key===']'||ev.code==='BracketRight',down=ev.key==='['||ev.code==='BracketLeft';if(!up&&!down)return;
  const active=T.mode?.tool==='pencil'||strokes().length;if(!active)return;ev.preventDefault();ev.stopImmediatePropagation();setValue(cur()+(up?STEP:-STEP),'commit');},true);
 window.PencilSmooth195={storeRaw,fitAffine,apply,setValue,strokes,resmooth};
})();
// 1.0.95 (correctif) · Poignées du trait au crayon : la courbe se remodèle en douceur autour de la poignée
// (l'arc grandit ou se resserre au lieu de faire un pli). Maj : ne déplacer que ce point.
(()=>{
 const T=window.SplineTools194;if(!T)return;let shift=false;
 window.addEventListener('keydown',ev=>{if(ev.key==='Shift')shift=true;},true);window.addEventListener('keyup',ev=>{if(ev.key==='Shift')shift=false;},true);window.addEventListener('blur',()=>{shift=false;});
 const pencilOf=e=>{const ed=edits[e?.id];return ed?.drawing?.type==='SPLINE'&&ed.drawing.kind==='pencil'?ed:null;};
 function weights(vs,k,closed){const n=vs.length,s=[0];for(let i=1;i<n;i++)s.push(s[i-1]+Math.hypot(vs[i][0]-vs[i-1][0],vs[i][1]-vs[i-1][1]));const total=s[n-1]+(closed?Math.hypot(vs[0][0]-vs[n-1][0],vs[0][1]-vs[n-1][1]):0);
  const gap=i=>Math.abs(s[(i+n)%n]-s[k]);let h=[];if(k>0||closed)h.push(k>0?s[k]-s[k-1]:total-s[n-1]);if(k<n-1||closed)h.push(k<n-1?s[k+1]-s[k]:total-s[n-1]);const step=Math.max(1e-9,h.reduce((a,b)=>a+b,0)/h.length),sigma=step*.8;
  return {s,total,w:s.map((v,i)=>{if(i===k)return 1;let d=Math.abs(v-s[k]);if(closed)d=Math.min(d,total-d);if(!closed&&(i===0||i===n-1))return 0;return Math.exp(-(d*d)/(2*sigma*sigma));}),sigma};}
 function soft(vs,k,target,closed){const D=[target[0]-vs[k][0],target[1]-vs[k][1]],{w}=weights(vs,k,closed);return {pts:vs.map((p,i)=>[p[0]+D[0]*w[i],p[1]+D[1]*w[i]]),D,w};}
 // Poids d'un point brut : interpolé le long du polygone des points de lissage.
 function rawWeights(raw,vs,w){return raw.map(p=>{let best=Infinity,val=0;for(let i=0;i<vs.length-1;i++){const a=vs[i],b=vs[i+1],dx=b[0]-a[0],dy=b[1]-a[1],L=dx*dx+dy*dy,t=L?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/L)):0,q=[a[0]+dx*t,a[1]+dy*t],d=Math.hypot(p[0]-q[0],p[1]-q[1]);if(d<best){best=d;val=w[i]*(1-t)+w[i+1]*t;}}return val;});}
 function preview(e,vsWorld,g){const ed=pencilOf(e);const out=vsWorld.slice();if(!ed||shift){out[g.index]=g.point;return out;}return soft(vsWorld,g.index,g.point,!!(ed.geometry?.closed??ed.drawing.closed)).pts;}
 function reshape(e,g,next){const ed=pencilOf(e);if(!ed||shift)return false;const d=ed.drawing,closed=!!(ed.geometry?.closed??d.closed),vs=g.vertices.map(p=>[...p]);if(g.index<0||g.index>=vs.length)return false;
  const r=soft(vs,g.index,next,closed);let raw=d.raw;
  if(Array.isArray(raw)&&raw.length>1){if(ed.geometry?.points&&window.PencilSmooth195){const A=PencilSmooth195.fitAffine(d.points,ed.geometry.points);if(A)raw=raw.map(p=>PencilSmooth195.apply(A,p));}const rw=rawWeights(raw,vs,r.w);raw=raw.map((p,i)=>[+(p[0]+r.D[0]*rw[i]).toFixed(4),+(p[1]+r.D[1]*rw[i]).toFixed(4)]);}
  const nd={...d,points:r.pts,closed};if(raw)nd.raw=raw;const nextEdit={...ed,drawing:nd};delete nextEdit.geometry;edits[e.id]=nextEdit;return true;}
 reshape.preview=preview;window.gripReshape195=reshape;
 overlay.addEventListener('pointerdown',()=>setTimeout(()=>{if(typeof activeGrip!=='undefined'&&activeGrip&&pencilOf(entities.get(activeGrip.id)))status('Poignée du trait : la courbe suit en douceur (l’arc s’agrandit ou se resserre) · Maj : déplacer ce point seul · Échap annule.');},0));
})();
