// Les textes libres participent au même ordre de dessin que les contours.
(()=>{
 const eligible=e=>!!(e?.annotation&&!e.annotation.axis&&!e.annotation.level&&!e.annotation.leader);
 // Default free text forms a top graphic layer. Only a text explicitly
 // interleaved below a graphic needs the exact ordered main-thread renderer.
 // Merely adding a topmost text must not disable the graphics worker.
 let cachedKey=null,cachedEntities=null,cachedActive=false,cachedTexts=[];let topPaintCounter=0;
 const active=()=>{
  const key=[activeId,scene?.layout,saveToken,entities.size,window.screenDisplayRevision||0,window.isolationRevision||0,drawingFillsBehind(),window.fluidity111Enabled!==false].join('|');
  if(key!==cachedKey||cachedEntities!==entities){cachedKey=key;cachedEntities=entities;cachedActive=false;cachedTexts=[];
   if(scene){const texts=(window.overlayFeatureEntities?overlayFeatureEntities('annotations'):[...entities.values()]).filter(e=>eligible(e)&&e.layout===scene.layout&&visible(e));
    if(texts.length){const ordered=drawingOrderedEntities();cachedTexts=ordered.filter(e=>eligible(e)&&visible(e));if(window.fluidity111Enabled===false)cachedActive=true;let seenText=false;for(const e of ordered){if(!visible(e))continue;if(eligible(e))seenText=true;else if(seenText&&!e.annotation&&!e.dimension&&e.primitives?.length){cachedActive=true;break;}}}
   }
  }return cachedActive;
 };
 const invalidateOrder=()=>{cachedKey=null;};
 const refreshOrder=refresh;refresh=function(...args){invalidateOrder();return refreshOrder.apply(this,args);};
 const rebuildOrder=rebuildTree;rebuildTree=function(...args){invalidateOrder();return rebuildOrder.apply(this,args);};
 function paintTop(target=ctx){if(active()||!scene||busy||pendingPreview)return;topPaintCounter++;target.setTransform(dpr,0,0,dpr,0,0);const bounds=viewport(),auto=localStorage.getItem('graphicsDetailMode')!=='full';let skipped=0;for(const e of cachedTexts){if(!intersects(e.bounds,bounds))continue;if(auto&&!selected.has(e.id)&&e.annotation.height*view.s*dpr<2.5){skipped++;continue;}drawAnnotation(e,target);}if(window.graphicsWorkerStats)graphicsWorkerStats.freeTextSkipped=skipped;}
 window.OrderedTextDrawing={eligible,active,paintTop,retainedTop:()=>{topPaintCounter++;}};
 // Source text is painted on the drawing canvas; transient previews may still use the overlay.
 function graphic(e){ctx.save();applyViewTransform(ctx);const edit=edits[e.id]||{};ctx.translate(edit.dx||0,edit.dy||0);for(const p of e.primitives){if(!primitiveVisible(e,p))continue;const paint=layerSettings(objectLayer(e,p,'paint')),inherits=p.byLayerColor??(e.color===256&&e.trueColor==null);ctx.fillStyle=ctx.strokeStyle=objectColor(e,p,(inherits?(layerColorPreview.get(objectLayer(e,p,'paint'))||paint?.color):null)||p.color);ctx.globalAlpha=primitiveAlpha(e,p);const raw=p.lineweight??((baseLayer(p.weightLayer||p.paintLayer||e.layer)?.lineweight??-3)/100),patch=layerSettings(p.weightLayer||p.paintLayer||e.layer),weight=p.byLayerWeight!==false&&patch?.lineweight>=0?patch.lineweight/100:raw,width=objectWeight(e,weight,p);ctx.lineWidth=document.getElementById('layerweights').checked&&width>=0?Math.max(1/dpr,width*96/25.4)/view.s:1/(dpr*view.s);ctx.setLineDash(objectLineDash(e,p));paintGraphicPrimitive(ctx,p);}if(selected.has(e.id)){ctx.globalAlpha=.8;ctx.strokeStyle=selectionColor();ctx.lineWidth=2/view.s;ctx.setLineDash([]);for(const p of e.primitives)if(primitiveVisible(e,p))paintGraphicPrimitive(ctx,p,false);}ctx.restore();}
 const render=draw;draw=function(...args){if(!active()||pendingPreview||busy){const painted=topPaintCounter,r=render(...args);if(painted===topPaintCounter)paintTop(ctx);return r;}const t=performance.now();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.globalAlpha=1;ctx.fillStyle=window.Theme09?.background()||'#111820';ctx.fillRect(0,0,w,h);window.paintDrawingGrid?.(ctx);const ordered=perfSortByRank(query(viewport()),items.length);for(const e of ordered){if(!visible(e)||e.dimension)continue;if(eligible(e)){ctx.setTransform(dpr,0,0,dpr,0,0);drawAnnotation(e,ctx);}else if(!e.annotation)graphic(e);}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.globalAlpha=1;drawOverlay();renderMs=performance.now()-t;document.getElementById('perf').textContent=renderMs.toFixed(1)+' ms';};
 function textsAt(pixel){const point=world(pixel),r=2/view.s;return query([point[0]-r,point[1]-r,point[0]+r,point[1]+r]).filter(e=>{if(!(eligible(e)||e.nativeText)||!visible(e)||edits[e.id]?.deleted)return false;const b=e.calloutTextBounds||e.bounds;return point[0]>=b[0]&&point[0]<=b[2]&&point[1]>=b[1]&&point[1]<=b[3];}).sort((a,b)=>drawingOrderRank(b)-drawingOrderRank(a));}
 const pickBase=pick;pick=function(pixel,...args){if(tool==='select'){const texts=textsAt(pixel);if(texts.length)return texts[0];}return pickBase(pixel,...args);};
 window.addEventListener('dblclick',ev=>{if(ev.target!==overlay||ev.button!==0||busy||tool!=='select'||annotationMode||window.RebarSegmentEdit?.state())return;const e=textsAt(eventPoint(ev))[0];if(!e)return;ev.preventDefault();ev.stopImmediatePropagation();if(isLocked(e)){status('Ce texte est verrouillé.');return;}const labelId=edits[e.id]?.positionLabelNumberOwner100||(edits[e.id]?.positionLabel100?e.id:null);if(labelId&&window.PositionLabels100?.edit){selected=new Set([labelId]);refresh(false);window.PositionLabels100.edit(labelId);return;}selected=new Set([e.id]);refresh(false);openTextEditor();},true);
 drawingOrderCache=null;requestRender();
})();
