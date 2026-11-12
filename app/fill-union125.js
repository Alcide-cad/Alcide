// Union géométrique des remplissages polygonaux ; chargement du moteur à la demande.
(()=>{
 let loading;
 function engine(){if(window.polygonClipping)return Promise.resolve(window.polygonClipping);return loading||(loading=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='polygon-clipping125.js';s.onload=()=>resolve(window.polygonClipping);s.onerror=()=>{loading=null;reject(Error('Le moteur de fusion est indisponible.'));};document.head.append(s);}));}
 function info(e){
  if(!e||!visible(e)||isLocked(e)||e.rebar||e.annotation||e.dimension||e.layout!==scene.layout)return null;
  const p=cadProps(e),edit=edits[e.id]||{};
  if(e.type==='LWPOLYLINE'&&cadClosed(e)&&p.filled&&!e.bulges?.some(Boolean)&&!edit.drawing?.bulges?.some(Boolean)){
   if(p.fillHoles?.length)return null;
   return {e,ring:cadVertices(e),props:p};
  }
  if(e.type==='HATCH'&&e.nativeHatch?.editable&&e.nativeHatch.loops?.length===1&&(edit.hatchStyle?.pattern||e.pattern)==='SOLID'){
   const rings=e.hatchDisplayedLoops||e.nativeHatch.loops.map(r=>r.map(q=>[q[0]+(edit.dx||0),q[1]+(edit.dy||0)]));
   return {e,ring:rings[0],props:{...p,filled:true,fillOnly:true,fillPattern:'SOLID',fillColor:objectColor(e,e.primitives[0],e.primitives[0]?.color||'#829f6a'),fillTransparency:opacity(e.id)}};
  }
  return null;
 }
 function targets(){return [...selected].map(id=>info(entities.get(id)));}
 function compatible(xs){if(xs.length<2||xs.some(x=>!x))return false;const keys=['layer','color','linetype','lineweight','fillPattern','fillColor','fillTransparency','fillOnly','fillAngle','fillSpacing','fillBackgroundColor','linetypeScale'];return xs.every(x=>keys.every(k=>(x.props[k]??(k==='fillPattern'?'SOLID':k==='fillTransparency'?0:k==='fillOnly'?false:null))===(xs[0].props[k]??(k==='fillPattern'?'SOLID':k==='fillTransparency'?0:k==='fillOnly'?false:null))));}
 async function merge(){if(busy||!scene)return;const xs=targets();if(!compatible(xs)){status('Fusion : choisissez au moins deux remplissages polygonaux déverrouillés de même aspect (couleur, opacité et calque).');return;}const doc=activeId,token=saveToken,ids=[...selected];try{
  const pc=await engine();if(doc!==activeId||token!==saveToken||ids.join('|')!==[...selected].join('|'))throw Error('La sélection a changé : relancez la fusion.');
  const result=pc.union(...xs.map(x=>[x.ring]));if(result.length!==1)throw Error('Les surfaces doivent se toucher par un côté ou se chevaucher pour former un seul remplissage.');if(result[0].length!==1)throw Error('Cette fusion créerait une réservation intérieure. Les objets sont conservés.');
  const ring=result[0][0].slice(0,-1),before=snapshot();try{
   const props={...xs[0].props};delete props.fillReference;delete props.fillHoles;
   const id=cadNewDrawing('LWPOLYLINE',ring,props,true);
   for(const x of xs){edits[x.e.id]={...edits[x.e.id],deleted:true};const fillId=edits[x.e.id].fillId;if(fillId)edits[fillId]={...edits[fillId],deleted:true};for(const h of window.HatchPropsLink?.related([x.e.id])||[])edits[h.id]={...edits[h.id],deleted:true};}
   selected=new Set([id]);commit(before);status('Remplissages fusionnés : contour extérieur unique, opacité uniforme · Ctrl+Z annule.');return id;
  }catch(ex){restore(before);throw ex;}
 }catch(ex){status(ex.message);return null;}}
 window.FillUnion125={merge,info,compatible};
 const b=document.createElement('button');b.id='merge-fill125';b.className='ribbon-button';b.innerHTML='<svg class="tool-pictogram" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3h8v5h5v8h-5v5H8v-5H3V8h5Z" fill="none" stroke="currentColor" stroke-width="1.8"/></svg><span class="tool-label">Fusionner les remplissages</span>';b.title='Fusionner les surfaces · supprime les contours et la double opacité à leur intersection · même aspect requis';b.onclick=merge;document.getElementById('fill-by-contour')?.after(b);
 function zoneContour(e){
  if(!e||!visible(e)||e.layout!==scene.layout||e.rebar||e.annotation||e.dimension)return null;
  if(!cadClosed(e)||e.bulges?.some(Boolean)||edits[e.id]?.drawing?.bulges?.some(Boolean))return null;
  const edit=edits[e.id]||{};
  const points=edit.geometry?.points||edit.drawing?.points;
  const ring=points?points.map(([x,y])=>[x+(edit.dx||0),y+(edit.dy||0)]):cadVertices(e);
  return ring.length>=3?ring:null;
 }
 function zoneSurface(e){
  if(!e||isLocked(e)||!visible(e)||e.layout!==scene.layout)return null;
  const edit=edits[e.id]||{};
  const props={...cadProps(e),...edit.props};
  const ring=zoneContour(e);
  if(ring&&props.filled&&!edit.fillId)return {e,rings:[ring,...(window.fillWorldHoles?.(e)||[])],props};
  const native=info(e);
  return native?{e,rings:[native.ring],props:native.props}:null;
 }
 async function editZones(operation){
  if(busy||!scene)return;
  const ids=[...selected],surface=zoneSurface(entities.get(ids[0]));
  const contours=ids.slice(1).map(id=>zoneContour(entities.get(id)));
  if(!surface||!contours.length||contours.some(r=>!r)){
   status('Sélectionnez d’abord le remplissage, puis les contours fermés avec Ctrl. Les contours doivent être composés de segments droits.');
   return;
  }
  if(edits[surface.e.id]?.fillZoneLinks?.length){status('Modifiez le contour de la réservation liée.');return;}
  const doc=activeId,token=saveToken;
  try{
   const pc=await engine();
   if(busy||doc!==activeId||token!==saveToken||ids.join('|')!==[...selected].join('|'))throw Error('La sélection a changé. Relancez la commande.');
   const polygons=contours.map(r=>[r]);
   const result=pc[operation](surface.rings,...polygons);
   if(JSON.stringify(result)===JSON.stringify(pc.union(surface.rings))){
    status('Les zones sélectionnées ne modifient pas le remplissage.');
    return;
   }
   const before=snapshot();
   try{
    const props={fillPattern:"SOLID",...surface.props,filled:true,fillOnly:true};
    delete props.fillReference;
    if(props.fillOrigin){
     const edit=edits[surface.e.id]||{};
     props.fillOrigin=props.fillOrigin.map((n,i)=>n+(i?edit.dy||0:edit.dx||0));
    }
    const created=result.map(([outer,...holes])=>cadNewDrawing('LWPOLYLINE',outer.slice(0,-1),{
     ...props,fillHoles:holes.map(r=>r.slice(0,-1))
    },true));
    edits[surface.e.id]={...edits[surface.e.id],deleted:true};
    selected=new Set(created);
    commit(before);
    status('Remplissage mis à jour · Ctrl+Z pour annuler.');
   }catch(ex){restore(before);throw ex;}
  }catch(ex){status(ex.message);}
 }
 let previous=b;
 for(const [operation,label,sign] of [['union','Ajouter une zone','M10 8h8m-4-4v8'],['difference','Soustraire une zone','M10 8h8']]){
  const button=document.createElement('button');
  button.id='fill-zone-'+operation;
  button.className='ribbon-button';
  button.innerHTML='<svg class="tool-pictogram" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5H3v16h16v-7 M20 2H8v12h12Z '+sign+'" fill="none" stroke="currentColor" stroke-width="1.6"/></svg><span class="tool-label">'+label+'</span>';
  button.title=label+' · Sélectionnez le remplissage puis les contours fermés avec Ctrl';
  button.onclick=()=>editZones(operation);
  previous.after(button);
  previous=button;
 }
 let gesture=null;
 const set=setTool;
 setTool=function(...args){gesture=null;return set.apply(this,args);};
 function startZone(mode){
  if(!scene||busy)return;
  const surface=zoneSurface(entities.get([...selected][0]));
  if(!surface){status('Sélectionnez un remplissage modifiable.');return;}
  if(mode==='origin'&&(!edits[surface.e.id]?.drawing||!surface.props.fillPattern||surface.props.fillPattern==='SOLID')){
   status('Sélectionnez une zone à motif créée dans ALCIDE.');return;
  }
  setTool('select');
  gesture={mode,id:surface.e.id,doc:activeId};
  overlay.focus({preventScroll:true});
  status({origin:'Cliquez le point de départ du motif.',rectangle:'Cliquez les deux coins opposés de l’ouverture.',linked:'Cliquez le contour fermé de la réservation.'}[mode]+' · Échap annule');
 }
 function rectangle(a,b){return [a,[b[0],a[1]],b,[a[0],b[1]]];}
 function closestContour(point,excluded){
  const r=10/view.s;
  let best=r,found=null;
  for(const e of query([point[0]-r,point[1]-r,point[0]+r,point[1]+r])){
   if(e.id===excluded)continue;
   const ring=zoneContour(e);
   if(!ring||edits[e.id]?.props?.filled)continue;
   for(let i=0;i<ring.length;i++){
    const d=segmentDistance(point,ring[i],ring[(i+1)%ring.length]);
    if(d<best){best=d;found={id:e.id,ring};}
   }
  }
  return found;
 }
 async function cutGesture(g,cutter,linkedId){
  const token=saveToken,pc=await engine();
  if(g.doc!==activeId||token!==saveToken||busy)throw Error('Le dessin a changé. Relancez la commande.');
  const surface=zoneSurface(entities.get(g.id));
  if(!surface)throw Error('Le remplissage a changé.');
  const result=pc.difference(surface.rings,[cutter]);
  const original=pc.union(surface.rings);
  if(JSON.stringify(result)===JSON.stringify(original))throw Error('La zone ne recoupe pas le remplissage.');
  if(linkedId&&(result.length!==1||result[0].length!==original[0].length+1||JSON.stringify(result[0][0])!==JSON.stringify(original[0][0])))throw Error('Le contour lié doit former une ouverture entièrement intérieure.');
  const before=snapshot();
  try{
   const props={fillPattern:'SOLID',...surface.props,filled:true,fillOnly:true};
   const linkedEdit=edits[g.id];
   if(linkedEdit?.fillZoneLinks?.length)throw Error('Ce remplissage possède déjà une réservation liée.');
   delete props.fillReference;
   const [dx,dy]=[linkedEdit?.dx||0,linkedEdit?.dy||0];
   if(props.fillOrigin)props.fillOrigin=props.fillOrigin.map((n,i)=>n+(i?dy:dx));
   const ids=result.map(([outer,...holes])=>cadNewDrawing('LWPOLYLINE',outer.slice(0,-1),{...props,fillHoles:holes.map(r=>r.slice(0,-1))},true));
   if(linkedId)edits[ids[0]].fillZoneLinks=[{id:linkedId,baseHoles:surface.rings.slice(1)}];
   edits[g.id]={...edits[g.id],deleted:true};
   selected=new Set(ids);
   commit(before);
   status('Ouverture découpée · Ctrl+Z annule.');
  }catch(ex){restore(before);throw ex;}
 }
 const baseCommit=commit;
 commit=function(before,...args){
  const pc=window.polygonClipping;
  for(const [id,edit] of Object.entries(edits)){
   const link=edit.fillZoneLinks?.[0];
   if(!link||edit.deleted||!before.edits[id]||JSON.stringify(before.edits[link.id])===JSON.stringify(edits[link.id]))continue;
   const e=entities.get(link.id),points=edits[link.id]?.geometry?.points||edits[link.id]?.drawing?.points;
   const move=edits[link.id]||{},dx=edit.dx||0,dy=edit.dy||0;
   const ring=move.deleted?null:points?points.map(([x,y])=>[x+(move.dx||0)-dx,y+(move.dy||0)-dy]):e?cadVertices(e).map(([x,y])=>[x-dx,y-dy]):null;
   const outer=edit.geometry?.points||edit.drawing.points;
   const base=[outer,...link.baseHoles];
   try{
    if(!pc)throw Error('Le moteur des réservations est en cours de chargement. Réessayez.');
    const result=ring?pc.difference(base,[ring]):pc.union(base);
    if(result.length!==1||JSON.stringify(result[0][0])!==JSON.stringify(pc.union(base)[0][0]))throw Error('La réservation liée doit rester à l’intérieur du remplissage.');
    edit.props={...edit.props,fillReference:outer,fillHoles:result[0].slice(1).map(r=>r.slice(0,-1))};
   }catch(ex){restore(before);status(ex.message);return;}
  }
  return baseCommit(before,...args);
 };
 const workspace=document.getElementById('workspace');
 workspace.addEventListener('pointerdown',ev=>{
  const g=gesture;
  if(!g||ev.target!==overlay||ev.button!==0||busy)return;
  ev.preventDefault();ev.stopImmediatePropagation();
  if(g.doc!==activeId){gesture=null;return;}
  const point=snap(eventPoint(ev));
  if(g.mode==='rectangle'&&!g.first){g.first=point;status('Cliquez le coin opposé · Échap annule.');return;}
  if(g.mode==='origin'){
   const edit=edits[g.id];
   if(!zoneSurface(entities.get(g.id))||!edit){gesture=null;return;}
   gesture=null;
   const before=snapshot();
   edit.props={...edit.props,fillOrigin:[point[0]-(edit.dx||0),point[1]-(edit.dy||0)]};
   commit(before);status('Départ du motif ajusté · Ctrl+Z annule.');
   return;
  }
  const target=g.mode==='linked'?closestContour(world(eventPoint(ev)),g.id):{ring:rectangle(g.first,point)};
  if(!target){status('Cliquez le bord d’un contour fermé.');return;}
  if(g.mode==='rectangle'&&(g.first[0]===point[0]||g.first[1]===point[1])){status('Choisissez un coin opposé distinct sur les deux axes.');return;}
  gesture=null;
  cutGesture(g,target.ring,target.id).catch(ex=>status(ex.message));
 },true);
 workspace.addEventListener('pointermove',ev=>{
  if(ev.target===overlay&&gesture?.first){gesture.cursor=snap(eventPoint(ev));drawOverlay();}
 });
 window.addEventListener('keydown',ev=>{
  if(ev.key==='Escape'&&gesture){gesture=null;drawOverlay();status('Commande annulée.');ev.preventDefault();ev.stopImmediatePropagation();}
 },true);
 for(const [mode,label,icon] of [
  ['origin','Origine du motif','M3 12h18M12 3v18M5 5h4v4H5Z'],
  ['rectangle','Évider par rectangle','M3 3h18v18H3ZM8 8h8v8H8Z'],
  ['linked','Évider par contour lié','m3 18 2-12 12-3 4 10-9 8ZM9 10h6v6H9Z']
 ]){
  const button=document.createElement('button');
  button.id='fill-gesture-'+mode;
  button.className='ribbon-button';
  button.innerHTML='<svg class="tool-pictogram" viewBox="0 0 24 24" aria-hidden="true"><path d="'+icon+'" fill="none" stroke="currentColor" stroke-width="1.6"/></svg><span class="tool-label">'+label+'</span>';
  button.title=label;
  button.onclick=()=>startZone(mode);
  previous.after(button);previous=button;
 }
 let preparedEdits=null;
 const render=drawOverlay;
 drawOverlay=function(...args){
  const result=render.apply(this,args);
  if(preparedEdits!==edits){
   preparedEdits=edits;
   if(!window.polygonClipping&&Object.values(edits||{}).some(e=>e.fillZoneLinks?.length))engine().catch(ex=>status(ex.message));
  }
  if(gesture?.first&&gesture.cursor){
   const corners=rectangle(gesture.first,gesture.cursor).map(screen);
   oc.save();oc.beginPath();oc.moveTo(...corners[0]);for(const p of corners.slice(1))oc.lineTo(...p);
   oc.closePath();oc.strokeStyle='#ffcc78';oc.setLineDash([6,4]);oc.stroke();oc.restore();
  }
  return result;
 };
 const enhance=window.enhanceSelectionContext093;window.enhanceSelectionContext093=function(root){enhance?.(root);if(!compatible(targets()))return;const c=b.cloneNode(true);c.removeAttribute('id');c.onclick=ev=>{ev.preventDefault();ev.stopPropagation();hideMenu();merge();};const heading=root.querySelector('.context-heading,strong');heading?heading.after(c):root.prepend(c);};
 const draw=drawOverlay;drawOverlay=function(...a){const r=draw.apply(this,a);b.disabled=busy||!compatible(targets());return r;};
})();
