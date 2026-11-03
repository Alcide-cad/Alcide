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
 function compatible(xs){if(xs.length<2||xs.some(x=>!x))return false;const keys=['layer','color','linetype','lineweight','fillPattern','fillColor','fillTransparency','fillOnly'];return xs.every(x=>keys.every(k=>(x.props[k]??(k==='fillPattern'?'SOLID':k==='fillTransparency'?0:k==='fillOnly'?false:null))===(xs[0].props[k]??(k==='fillPattern'?'SOLID':k==='fillTransparency'?0:k==='fillOnly'?false:null))));}
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
 const enhance=window.enhanceSelectionContext093;window.enhanceSelectionContext093=function(root){enhance?.(root);if(!compatible(targets()))return;const c=b.cloneNode(true);c.removeAttribute('id');c.onclick=ev=>{ev.preventDefault();ev.stopPropagation();hideMenu();merge();};const heading=root.querySelector('.context-heading,strong');heading?heading.after(c):root.prepend(c);};
 const draw=drawOverlay;drawOverlay=function(...a){const r=draw.apply(this,a);b.disabled=busy||!compatible(targets());return r;};
})();
