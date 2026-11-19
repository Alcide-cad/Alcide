// ALCIDE 1.0.96 · Cotes et blocs CAO déplaçables à la poignée centrale (comme les autres objets) :
// cotes rayon / diamètre / angulaire / longueur d'arc, blocs insérés et éléments de réseau.
(()=>{
 // Les cotes de longueur d'arc (ARC_DIMENSION) se déplacent/copient/pivotent comme les autres cotes natives.
 movableTypes.add('ARC_DIMENSION');{const rs=rotationSupported;rotationSupported=function(e){return rs(e)||!!(e&&e.type==='ARC_DIMENSION'&&!isLocked(e));};}
 const base=centerMoveHandle;
 const native196=e=>!!e&&!e.dimension&&(e.type==='DIMENSION'||e.type==='ARC_DIMENSION')&&!!edits[e.id]?.foreignEntity131;
 centerMoveHandle=function(){const h=base();if(h)return h;
  if(tool!=='select'||busy||annotationMode||coreTool||rotationTool||!selected.size)return null;const es=[...selected].map(id=>entities.get(id));
  if(!es.some(native196))return null;
  if(es.some(e=>!e||!visible(e)||isLocked(e)||e.dimension||!(native196(e)||movableTypes.has(e.type)&&e.type!=='DIMENSION')))return null;
  const b=[Math.min(...es.map(e=>e.bounds[0])),Math.min(...es.map(e=>e.bounds[1])),Math.max(...es.map(e=>e.bounds[2])),Math.max(...es.map(e=>e.bounds[3]))];
  // Cote seule : poignée sur son point de texte (plus intuitif que le centre de l'emprise des lignes d'attache).
  return [(b[0]+b[2])/2,(b[1]+b[3])/2];};
 function C196off(id){const e=edits[id]||{};return [e.dx||0,e.dy||0];}

 // Poignée de position (texte / arc de cote) des cotes CAO 1.0.96 : glisser = la cote est recalculée à la nouvelle position.
 const C=window.Cad196;let g196=null;
 function locInfo(){if(tool!=='select'||busy||annotationMode||coreTool||rotationTool||selected.size!==1)return null;const id=[...selected][0],e=entities.get(id);if(!e||!visible(e)||isLocked(e))return null;
  const it=edits[id]?.cad196Item,meta=it&&edits[it.dataId]?.cad196;if(!meta||meta.kind!=='dimension'||meta.specs?.length!==1)return null;const spec=meta.specs[0],t=spec.location;if(!Array.isArray(t)||!Number.isFinite(t[0]))return null;
  const d=C196off(id);const q=(!d[0]&&!d[1]&&window.angularArcGrip197?.(spec))||t;return {id,dataId:it.dataId,spec,meta,off:d,p:[q[0]+d[0],q[1]+d[1]]};}
 window.dimLocationGrip196=()=>locInfo()?.p||null;
 const draw0=drawOverlay;drawOverlay=function(...a){const r=draw0.apply(this,a);const L=locInfo();if(L){const p=screen(g196?g196.to:L.p);oc.save();if(g196){const q=screen(L.p);oc.strokeStyle='#5fd3ff';oc.setLineDash([4,3]);oc.beginPath();oc.moveTo(...q);oc.lineTo(...p);oc.stroke();oc.setLineDash([]);}
  oc.fillStyle='#5fd3ff';oc.strokeStyle='#0b2533';oc.lineWidth=1.5;oc.beginPath();oc.moveTo(p[0],p[1]-6);oc.lineTo(p[0]+6,p[1]);oc.lineTo(p[0],p[1]+6);oc.lineTo(p[0]-6,p[1]);oc.closePath();oc.fill();oc.stroke();oc.restore();}return r;};
 function near(ev){const L=locInfo();if(!L)return null;const q=screen(L.p),e=eventPoint(ev);const distance=Math.hypot(q[0]-e[0],q[1]-e[1]);if(distance>9)return null;const text=window.angularTextGrip197?.();if(text){const t=screen(text);if(Math.hypot(t[0]-e[0],t[1]-e[1])<=distance)return null;}return L;}
 window.addEventListener('pointerdown',ev=>{if(ev.target!==overlay||ev.button!==0||ev.altKey||busy)return;const L=near(ev);if(!L)return;ev.preventDefault();ev.stopImmediatePropagation();g196={...L,to:L.p,pointer:ev.pointerId,px:eventPoint(ev),moved:false,doc:activeId};try{overlay.setPointerCapture(ev.pointerId);}catch{}overlay.style.cursor='move';status('Position de la cote : relâchez au nouvel emplacement · Échap annule.');},true);
 window.addEventListener('pointermove',ev=>{if(!g196||ev.pointerId!==g196.pointer)return;ev.preventDefault();ev.stopImmediatePropagation();g196.to=snap(eventPoint(ev));g196.moved ||=Math.hypot(eventPoint(ev)[0]-g196.px[0],eventPoint(ev)[1]-g196.px[1])>3;drawOverlay();},true);
 const end=()=>{const g=g196;g196=null;try{if(g&&overlay.hasPointerCapture(g.pointer))overlay.releasePointerCapture(g.pointer);}catch{}overlay.style.cursor='';requestRender();return g;};
 window.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&g196){ev.preventDefault();ev.stopImmediatePropagation();end();status('Geste annulé.');}},true);
 window.addEventListener('pointerup',async ev=>{if(!g196||ev.pointerId!==g196.pointer)return;ev.preventDefault();ev.stopImmediatePropagation();g196.to=snap(eventPoint(ev));const g=end();if(!g.moved||g.doc!==activeId)return;
  try{const loc=[g.to[0]-g.off[0],g.to[1]-g.off[1]];const spec={...g.spec,location:loc,...(g.spec.base?{base:loc}:{})};const before=snapshot();const data=await C.engine({op:'make',specs:[spec]},'Mise à jour de la cote…');
   const ids=C.addForeign(data,{meta:{...g.meta,specs:[spec]}});
   const props=edits[g.id]?.props;for(const id of ids)edits[id]={...edits[id],dx:g.off[0],dy:g.off[1],...(props?{props:structuredClone(props)}:{})};
   for(const [k,e] of Object.entries(edits))if(e?.cad196Item?.dataId===g.dataId&&!e.deleted)C.remove(k);
   selected=new Set(ids);commit(before);status('Cote repositionnée · Ctrl+Z annule.');}catch(e){status('Position de cote : '+(e.message||e));}},true);
})();