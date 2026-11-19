/* 1.0.94 · Outils SPLINE et CRAYON (ruban Dessin).
   Spline : points de lissage par défaut (la courbe passe par les clics), option sommets de contrôle,
   aperçu en direct, accrochages, Retour arrière / Ctrl+Z retire le dernier point, Entrée ou clic droit
   termine, option Fermée (touche C ou clic sur le premier point). Poignées après coup.
   Crayon : tracé libre à la souris, lissé (moyenne glissante + Ramer-Douglas-Peucker) puis converti en
   spline par points de lissage ; curseur « Lissage ». Les deux sont exportés en vraie SPLINE DXF/DWG. */
(()=>{
 const M=window.SplineMath194;if(!M)return;
 let mode=null;// {tool:'spline'|'pencil', points, cursor, doc, cv, closed, stroke}
 const prefs=(()=>{try{return JSON.parse(localStorage.getItem('splineTools194')||'{}')}catch{return {}}})();
 const pref=(k,d)=>prefs[k]??d,savePref=(k,v)=>{prefs[k]=v;localStorage.setItem('splineTools194',JSON.stringify(prefs));};
 const isSpline=e=>!!edits[e?.id]?.drawing&&edits[e.id].drawing.type==='SPLINE';
 function curveOf(d,points){try{return M.fromDrawing(d,points);}catch{return null;}}
 // --- Entité affichée pour une spline créée dans ALCIDE
 const build=cadDrawingEntity;cadDrawingEntity=function(id,edit){
  if(edit?.drawing?.type!=='SPLINE')return build(id,edit);
  const d=edit.drawing,vs=edit.geometry?.points||d.points,s=curveOf(d,vs);
  const ps=s?M.sample(s,Math.max(8,Math.min(32,Math.round(400/Math.max(1,s.controlPoints.length))))):vs;
  const path=new Path2D();path.moveTo(...ps[0]);for(const p of ps.slice(1))path.lineTo(...p);
  const xs=ps.map(p=>p[0]),ys=ps.map(p=>p[1]),dx=edit.dx||0,dy=edit.dy||0,layer=edit.props?.layer||'0',b=[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];
  const snapPts=d.splineMode==='cv'?[ps[0],ps.at(-1)]:(d.closed?vs:vs);
  const e={id,type:'SPLINE',layout:d.layout,layer,color:256,closed:!!d.closed,byLayerTransparency:true,lineweight:edit.props?.lineweight??-1,
   primitives:[{path,paths:[ps],selectionPaths:[ps],fill:false,color:layerSettings(layer)?.color||'#e6edf3',byLayerColor:true,byLayerWeight:true}],
   snap:snapPts,shape:[!!d.closed,vs.map(p=>[p[0]-vs[0][0],p[1]-vs[0][1],0])],length:ps.slice(1).reduce((n,p,i)=>n+cadDistance(p,ps[i]),0),
   bounds:[b[0]+dx,b[1]+dy,b[2]+dx,b[3]+dy],originalBounds:b,tags:{0:'SPLINE',5:id,8:layer},spline194:{mode:d.splineMode||'fit',vertices:vs}};
  e.linetype=edit.props?.linetype||'BYLAYER';return e;};
 const verts=editableVertices;editableVertices=function(e){if(isSpline(e))return edits[e.id].geometry?.points||edits[e.id].drawing.points;return verts(e);};
 // Copier / miroir / réseau recréent l'objet : on garde le mode (lissage / sommets), la fermeture et l'origine (crayon).
 const cc=cadClosed;cadClosed=function(e){if(isSpline(e))return !!edits[e.id].drawing.closed;return cc(e);};
 function carry(fn){return function(...args){const ids=[...(Array.isArray(args.find(Array.isArray))?args.find(Array.isArray):selected)];const src=ids.filter(id=>isSpline(entities.get(id))).map(id=>edits[id].drawing);if(!src.length)return fn.apply(this,args);const old=new Set(Object.keys(edits));const r=fn.apply(this,args);const made=Object.keys(edits).filter(k=>!old.has(k)&&edits[k].drawing?.type==='SPLINE');made.forEach((k,i)=>{const o=src[i%src.length];Object.assign(edits[k].drawing,{splineMode:o.splineMode||'fit',kind:o.kind||'spline',degree:3,closed:!!o.closed});if(o.raw&&window.PencilSmooth195){const A=PencilSmooth195.fitAffine(o.points,edits[k].drawing.points);if(A){edits[k].drawing.raw=o.raw.map(p=>PencilSmooth195.apply(A,p));edits[k].drawing.smoothing=o.smoothing;}}});if(made.length)refresh();return r;};}
 copySelection=carry(copySelection);coreMirror=carry(coreMirror);
 // --- Démarrage / arrêt
 const quick=document.createElement('span');quick.id='spline-quick194';quick.style.cssText='display:flex;gap:8px;align-items:center;font-size:12px';
 function paintQuick(){quick.innerHTML='';if(!mode)return;
  if(mode.tool==='spline'){
   const seg=document.createElement('span');seg.className='spline194-seg';for(const [v,l,t]of [['fit','Points de lissage','La courbe passe par les points cliqués'],['cv','Sommets de contrôle','Les points tirent la courbe sans qu’elle y passe']]){const b=document.createElement('button');b.type='button';b.dataset.splineMode=v;b.textContent=l;b.title=t;b.className=(mode.cv?'cv':'fit')===v?'active':'';b.onclick=()=>{mode.cv=v==='cv';savePref('cv',mode.cv);paintQuick();prompt();drawOverlay();};seg.append(b);}
   const c=document.createElement('label');c.innerHTML='<input type="checkbox" data-spline-closed> Fermée';c.title='Spline fermée (touche C)';const box=c.firstChild;box.checked=mode.closed;box.onchange=()=>{mode.closed=box.checked;drawOverlay();};
   const done=document.createElement('button');done.type='button';done.dataset.splineFinish='';done.textContent='Terminer';done.title='Entrée ou clic droit';done.onclick=()=>finish();
   quick.append(seg,c,done);
  }else{
   const l=document.createElement('span');l.textContent='Lissage : carte « Lissage du crayon » · touches [ et ]';l.style.opacity='.8';quick.append(l);
  }
 }
 function placeQuick(){const bar=$('#toolquickbar');if(!bar)return;if(mode){const s=bar.querySelector('strong');if(s)s.textContent=mode.tool==='spline'?'Spline':'Crayon';if(!quick.isConnected)bar.append(quick);}else if(quick.isConnected)quick.remove();}
 function start(tool){if(!scene||busy)return;setTool('draw');selected.clear();try{restoreDrawingDefaults();}catch{}mode={tool,points:[],cursor:null,doc:activeId,cv:!!pref('cv',false),closed:false,smoothing:pref('smoothing',50),stroke:null};
  document.getElementById('draw-spline194')?.classList.add('active');document.getElementById('draw-pencil194')?.classList.toggle('active',tool==='pencil');if(tool==='pencil')document.getElementById('draw-spline194')?.classList.remove('active');
  overlay.style.cursor='crosshair';refresh();try{setPanelVisible(true);$('#drawing-style').open=true;syncDrawingPalette();}catch{}paintQuick();prompt();drawOverlay();}
 function stop(){if(!mode)return;mode=null;document.getElementById('draw-spline194')?.classList.remove('active');document.getElementById('draw-pencil194')?.classList.remove('active');overlay.style.cursor='';paintQuick();placeQuick();}
 const set=setTool;setTool=function(t){stop();return set.apply(this,arguments);};
 function prompt(){if(!mode)return;if(mode.tool==='pencil'){status('Crayon : maintenez le bouton et dessinez · le trait est lissé en courbes harmonieuses · réglage « Lissage » · Échap pour terminer.');return;}
  const n=mode.points.length;status('Spline ('+(mode.cv?'sommets de contrôle':'points de lissage')+') : '+(n?'cliquez le point suivant · Entrée ou clic droit pour terminer · Retour arrière / Ctrl+Z retire le dernier point · C : fermée · clic sur le 1er point : fermer et terminer.':'cliquez le premier point · accrochages disponibles.'));}
 // --- Création
 function create(points,closed,cv,kind,extra){const before=snapshot(),props={...drawingStyle(),filled:false};const id=cadNewDrawing('SPLINE',points,props,closed);edits[id].drawing.splineMode=cv?'cv':'fit';edits[id].drawing.kind=kind;edits[id].drawing.degree=3;if(extra)Object.assign(edits[id].drawing,extra);try{$('#layerweights').checked=true;}catch{}commit(before);try{layersUI();}catch{}return id;}
 function finish(){const m=mode;if(!m||m.tool!=='spline')return;if(m.doc!==activeId){stop();return;}const ps=m.points;const need=m.closed?3:2;
  if(ps.length<need){if(!ps.length){setTool('select');return;}status('Ajoutez au moins '+need+' points distincts avant de terminer.');return;}
  try{const id=create(ps,m.closed,m.cv,'spline');m.points=[];m.cursor=null;m.closed=false;paintQuick();selected=new Set([id]);refresh(false);status('Spline créée ('+ps.length+' '+(m.cv?'sommets':'points')+') · continuez une nouvelle spline ou Échap pour terminer · Ctrl+Z annule.');drawOverlay();}catch(e){status(e.message);}}
 function pointer(ev){return snap(eventPoint(ev));}
 // Capture : prioritaire sur les autres outils tant que Spline / Crayon est actif.
 overlay.addEventListener('pointerdown',ev=>{if(!mode||busy)return;if(ev.button===2){ev.stopImmediatePropagation();ev.preventDefault();if(mode.tool==='spline')finish();return;}if(ev.button!==0||ev.altKey)return;ev.stopImmediatePropagation();ev.preventDefault();
  if(mode.doc!==activeId){stop();return;}
  if(mode.tool==='pencil'){const p=world(eventPoint(ev));mode.stroke=[p];mode.lastPx=eventPoint(ev);overlay.setPointerCapture(ev.pointerId);drawOverlay();return;}
  const p=pointer(ev),ps=mode.points;if(ps.length>=3&&cadDistance(screen(p),screen(ps[0]))<9){mode.closed=true;finish();return;}
  if(ps.length&&cadDistance(p,ps.at(-1))<1e-8)return;if(ev.detail>1&&ps.length>=2){finish();return;}ps.push(p);prompt();drawOverlay();},true);
 overlay.addEventListener('pointermove',ev=>{if(!mode||busy)return;if(mode.tool==='pencil'){if(mode.stroke){ev.stopImmediatePropagation();const px=eventPoint(ev);if(Math.hypot(px[0]-mode.lastPx[0],px[1]-mode.lastPx[1])>=2){mode.stroke.push(world(px));mode.lastPx=px;drawOverlay();}}return;}mode.cursor=pointer(ev);drawOverlay();},true);
 overlay.addEventListener('pointerup',ev=>{if(!mode||mode.tool!=='pencil'||!mode.stroke)return;ev.stopImmediatePropagation();const raw=mode.stroke;mode.stroke=null;try{overlay.releasePointerCapture(ev.pointerId);}catch{}
  const tol=10/(view.s||1),r=M.pencil(raw,mode.smoothing,tol);
  if(!r||r.fitPoints.length<2||raw.length<3||Math.hypot(...[0,1].map(i=>Math.max(...raw.map(p=>p[i]))-Math.min(...raw.map(p=>p[i]))))*(view.s||1)<6){status('Trait trop court : maintenez le bouton et dessinez.');drawOverlay();return;}
  try{const id=create(r.fitPoints,r.closed,false,'pencil',{raw:window.PencilSmooth195?PencilSmooth195.storeRaw(raw):undefined,smoothing:mode.smoothing});selected=new Set([id]);refresh(false);status('Trait lissé : '+r.raw+' points relevés → spline de '+r.kept+' points'+(r.closed?' (fermée)':'')+' · Ctrl+Z annule · Échap pour terminer.');}catch(e){status(e.message);}drawOverlay();},true);
 window.addEventListener('contextmenu',ev=>{if(mode&&ev.target===overlay){ev.preventDefault();ev.stopImmediatePropagation();}},true);
 window.addEventListener('keydown',ev=>{if(!mode||['INPUT','SELECT','TEXTAREA'].includes(ev.target.tagName))return;const k=ev.key;
  if(mode.tool==='spline'&&k==='Enter'){ev.preventDefault();ev.stopImmediatePropagation();finish();}
  else if(mode.tool==='spline'&&(k==='Backspace'||(ev.ctrlKey&&k.toLowerCase()==='z'&&mode.points.length))){ev.preventDefault();ev.stopImmediatePropagation();mode.points.pop();prompt();drawOverlay();}
  else if(mode.tool==='spline'&&k.toLowerCase()==='c'&&!ev.ctrlKey&&!ev.altKey){ev.preventDefault();ev.stopImmediatePropagation();mode.closed=!mode.closed;paintQuick();drawOverlay();}
  else if(k==='Escape'){ev.preventDefault();ev.stopImmediatePropagation();if(mode.tool==='spline'&&mode.points.length>=2){finish();}else{mode.points=[];setTool('select');status('Prêt.');drawOverlay();}}},true);
 // --- Aperçus
 function strokeCurve(ps,color,width,dash=[]){if(ps.length<2)return;oc.save();oc.strokeStyle=color;oc.lineWidth=width;oc.setLineDash(dash);oc.beginPath();const a=screen(ps[0]);oc.moveTo(a[0],a[1]);for(const p of ps.slice(1)){const q=screen(p);oc.lineTo(q[0],q[1]);}oc.stroke();oc.restore();}
 function marks(ps,color,shape='square'){oc.save();oc.fillStyle='#0d1a22';oc.strokeStyle=color;oc.lineWidth=1.5;for(const p of ps){const q=screen(p);if(shape==='circle'){oc.beginPath();oc.arc(q[0],q[1],4,0,7);oc.fill();oc.stroke();}else{oc.fillRect(q[0]-3.5,q[1]-3.5,7,7);oc.strokeRect(q[0]-3.5,q[1]-3.5,7,7);}}oc.restore();}
 const draw=drawOverlay;drawOverlay=function(...a){const r=draw.apply(this,a);placeQuick();
  if(mode&&mode.doc===activeId){
   if(mode.tool==='spline'){const ps=[...mode.points];if(mode.cursor&&(!ps.length||cadDistance(mode.cursor,ps.at(-1))>1e-8))ps.push(mode.cursor);
    if(ps.length>=2){const s=curveOf({splineMode:mode.cv?'cv':'fit',closed:mode.closed&&ps.length>=3},ps);if(s)strokeCurve(M.sample(s,24),'#7fd4ff',2);if(mode.cv)strokeCurve(mode.closed?[...ps,ps[0]]:ps,'#7fd4ff88',1,[4,4]);}
    marks(mode.points,'#ffc978',mode.cv?'square':'circle');if(mode.points.length>=3){const f=screen(mode.points[0]);oc.save();oc.strokeStyle='#ffc97888';oc.beginPath();oc.arc(f[0],f[1],9,0,7);oc.stroke();oc.restore();}}
   else if(mode.stroke&&mode.stroke.length>1){strokeCurve(mode.stroke,'#ffd27a',1.5);}
  }
  // Spline sélectionnée : polygone de contrôle (mode sommets) et aperçu pendant le déplacement d'une poignée.
  if(!mode&&tool==='select'&&selected.size===1){const e=entities.get([...selected][0]);if(isSpline(e)){const edit=edits[e.id],d=edit.drawing,dx=edit.dx||0,dy=edit.dy||0;let vs=(edit.geometry?.points||d.points).map(p=>[p[0]+dx,p[1]+dy]);
   if(typeof activeGrip!=='undefined'&&activeGrip&&activeGrip.id===e.id&&activeGrip.point){vs=window.gripReshape195?gripReshape195.preview(e,vs,activeGrip):(vs=vs.slice(),vs[activeGrip.index]=activeGrip.point,vs);const s=curveOf(d,vs);if(s)strokeCurve(M.sample(s,24),'#ffc978',2);}
   if(d.splineMode==='cv')strokeCurve(d.closed?[...vs,vs[0]]:vs,'#77bdff99',1,[4,4]);}}
  return r;};
 // --- Ruban : Dessin → après « Polyligne »
 const svg=inner=>'<svg class="tool-pictogram" viewBox="0 0 24 24" aria-hidden="true">'+inner+'</svg>';
 function make(id,label,icon,tip){const b=document.createElement('button');b.id=id;b.type='button';b.className='ribbon-button uniform-tool ui-button ribbon-featured ribbon104-captioned';b.innerHTML=icon+'<span class="tool-label"></span>';b.lastChild.textContent=label;b.setAttribute('aria-label',label);b.title=tip;b.dataset.fullTooltip=tip;return b;}
 const bs=make('draw-spline194','Spline',svg('<path d="M3 18C6 6 10 6 12 12s6 6 9-6" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="2" y="16.5" width="3" height="3" fill="currentColor"/><rect x="10.5" y="10.5" width="3" height="3" fill="currentColor"/><rect x="19.5" y="4.5" width="3" height="3" fill="currentColor"/>'),'Spline (comme SPLINE d’AutoCAD) · cliquez des points : la courbe passe par eux (ou sommets de contrôle) · Entrée ou clic droit pour terminer · C : fermée · exportée en vraie SPLINE DXF/DWG');
 const bp=make('draw-pencil194','Crayon',svg('<path d="M4 20l3.5-1 11-11-2.5-2.5-11 11z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M14.5 6.5l2.5 2.5" stroke="currentColor" stroke-width="1.6"/><path d="M3 22c3-2 5 1 8-1" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".7"/>'),'Crayon · dessin à main levée, lissé automatiquement en courbes harmonieuses (spline exportable) · réglage « Lissage »');
 bs.onclick=()=>mode?.tool==='spline'?setTool('select'):start('spline');bp.onclick=()=>mode?.tool==='pencil'?setTool('select'):start('pencil');
 function placeButtons(){const anchor=document.getElementById('draw-polyline');if(anchor&&!bs.isConnected){anchor.after(bs,bp);}const off=!scene||busy;bs.disabled=off;bp.disabled=off;}
 placeButtons();const rl=refresh;refresh=function(...a){const r=rl.apply(this,a);placeButtons();return r;};
 window.SplineTools194={start,stop,finish,get mode(){return mode;},math:M,setSmoothing(v){if(mode)mode.smoothing=v;savePref('smoothing',v);},get smoothing(){return mode?.smoothing??pref('smoothing',50);}};
})();
