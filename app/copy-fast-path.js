// A native copy changes no existing geometry. Keep the existing spatial index
// and append a small subtree; complex/associative objects use the full pipeline.
(()=>{
 let batch=false,needsLayers=false,appendCount=0,lastScene=null;
 const refreshBase=refresh,layersBase=layersUI,copyBase=copySelection;
 refresh=function(...args){if(batch)return;return refreshBase.apply(this,args);};
 layersUI=function(...args){if(batch){needsLayers=true;return;}return layersBase.apply(this,args);};
 function eligible(e){const edit=edits[e?.id]||{};return e&&!isLocked(e)&&!edit.deleted&&['LINE','LWPOLYLINE','TEXT','MTEXT'].includes(e.type)&&!e.annotation&&!e.dimension&&!e.nativeDimension&&!e.dimensionChain&&!e.rebar&&!e.image&&!e.ole&&(!edit.drawing||['LINE','LWPOLYLINE'].includes(e.type)&&!edit.drawing.image&&!edit.drawing.cloud&&!edit.drawing.bulges?.some(Boolean))&&!edit.rotation&&!edit.nativeMirrorOps&&!edit.hatchGeometry&&!edit.dimensionRender&&e.originalBounds?.every(Number.isFinite);}
 function updateCopyLayerCounts(additions){const increments=new Map();for(const e of additions){const name=baseLayer(e.layer)?.name||e.layer;increments.set(name,(increments.get(name)||0)+1);}const rows=new Map([...document.querySelectorAll('#layers .layer-card')].map(row=>[row.dataset.layerName||row.querySelector('.layer-name')?.textContent,row]));if([...increments.keys()].some(name=>!rows.get(name)?.querySelector('.layer-meta')))return false;for(const [name,n]of increments){const row=rows.get(name),meta=row.querySelector('.layer-meta'),label=row.querySelector('.layer-name'),count=parseInt(meta.textContent,10);if(!Number.isFinite(count))return false;meta.textContent=meta.textContent.replace(/^\d+/,String(count+n));meta.title=meta.title.replace(/^\d+/,String(count+n));meta.setAttribute('aria-label',(count+n)+' objets');if(label)label.title=label.title.replace(/· \d+ objet/, '· '+(count+n)+' objet');}return true;}
 copySelection=function(dx,dy,ids=[...selected]){
  if(batch||busy||!Number.isFinite(dx)||!Number.isFinite(dy)||!ids.length)return copyBase.apply(this,arguments);
  const sources=ids.map(id=>entities.get(id));if(!sources.every(eligible))return copyBase.apply(this,arguments);
  const ticket=window.graphicsCopySnapshot?.(),bySource=new Map(sources.map(e=>[sourceHandle(e),e])),oldTree=tree,orderBefore=typeof drawingOrderCache==='undefined'?null:drawingOrderCache;let result;
  batch=true;needsLayers=false;
  try{result=copyBase.call(this,dx,dy,ids);}finally{batch=false;}
  const additions=[];let complete=true;
  let sourceIndex=0;for(const id of selected){const edit=edits[id],source=sources[sourceIndex++];if(ids.includes(id)||!source||(!edits[source.id]?.drawing&&sourceHandle(source)!==edit?.source)||!!edits[source.id]?.drawing!==!!edit?.drawing){complete=false;break;}const b=source.originalBounds,x=edit.dx||0,y=edit.dy||0,copy=edit.drawing?cadDrawingEntity(id,edit):{...source,id,bounds:[b[0]+x,b[1]+y,b[2]+x,b[3]+y],originalBounds:[...b],drawOrderIndex:items.length+additions.length};copy.drawOrderIndex=items.length+additions.length;copy.tags={...copy.tags,5:id};entities.set(id,copy);additions.push(copy);}
  if(!complete){refreshBase(true);if(needsLayers)layersBase();return result;}
  items.push(...additions);if(lastScene!==scene){lastScene=scene;appendCount=0;}appendCount+=additions.length;
  if(appendCount>128){tree=buildTree([...entities.values()].filter(e=>e.layout===scene.layout&&!edits[e.id]?.deleted));appendCount=0;}
  else{const extra=buildTree(additions);tree=oldTree&&extra?{bounds:mergeBounds([oldTree,extra]),left:oldTree,right:extra}:oldTree||extra;}
  if(orderBefore&&orderBefore.entities===entities&&orderBefore.doc===activeId){for(const e of additions)orderBefore.ranks.set(e.id,e.drawOrderIndex);orderBefore.token=saveToken;orderBefore.size=entities.size;drawingOrderCache=orderBefore;}refreshBase(false);if(needsLayers&&!updateCopyLayerCounts(additions))layersBase();window.graphicsAppendCopies?.(additions,ticket);window.extendAlignmentScope?.(additions);window.addCopiedAlignmentTargets?.(additions);
  window.lastCopyFastPath={count:additions.length,scene:activeId};return result;
 };
})();
