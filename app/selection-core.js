// Shared effective attributes for filters and similarity. Cache belongs to one search.
(()=>{
 const normalized=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr');
 window.selectionSearchText=normalized;
 window.selectionRecord=function(e,cache){
  if(cache?.has(e.id))return cache.get(e.id);
  const props=edits[e.id]?.props||{},info=layerSettings(e.layer)||{},colors=new Set(),weights=new Set(),lines=new Set(),appearances=new Map();
  for(const p of e.primitives?.length?e.primitives:[{}]){
   const layer=objectLayer(e,p,'paint'),paint=layerSettings(layer)||info,inherit=p.byLayerColor??(e.color===256&&e.trueColor==null);
   const fallback=inherit?(paint.color||p.color):p.color||(e.trueColor!=null?'#'+e.trueColor.toString(16).padStart(6,'0'):paint.color);
   const color=String(objectColor(e,p,fallback||'#e6edf3')).toLowerCase();colors.add(color);
   const raw=props.linetype||p.linetype||e.linetype||'BYLAYER',line=String(raw).toUpperCase();
   const linetype=line==='BYLAYER'?String(paint.linetype||'CONTINUOUS').toUpperCase():line;lines.add(linetype);
   const inherited=p.byLayerWeight??(e.lineweight===-1||e.lineweight==null),weightLayer=layerSettings(p.weightLayer||layer)||paint;
   const weight=objectWeight(e,inherited?(weightLayer.lineweight??-3)/100:p.lineweight??(e.lineweight??-3)/100,p);
   const weightValue=String(Math.round(weight*100));weights.add(weightValue);appearances.set(JSON.stringify([color,linetype,weightValue]),{color,linetype,weight:weightValue});
  }
  const result={type:e.type,layer:e.layer,color:[...colors].sort(),linetype:[...lines].sort(),weight:[...weights].sort(),appearances:[...appearances.values()],text:normalized(e.annotation?.text??e.text??''),name:normalized(e.name||''),locked:isLocked(e)};
  cache?.set(e.id,result);return result;
 };
 window.selectionGroupId=id=>Object.hasOwn(edits[id]||{},'groupId')?edits[id].groupId:entities.get(id)?.selectionGroup;
 window.selectionExpandGroups=function(ids,available,protect=true){
  const result=new Set(ids),groups=new Set([...ids].map(selectionGroupId).filter(Boolean)),blocked=new Set();
  if(!groups.size)return {ids:result,extra:0,blocked:0};
  const members=available.filter(e=>groups.has(selectionGroupId(e.id)));
  if(protect)for(const e of entities.values())if(groups.has(selectionGroupId(e.id))&&!edits[e.id]?.deleted&&isLocked(e))blocked.add(selectionGroupId(e.id));
  for(const id of result)if(blocked.has(selectionGroupId(id)))result.delete(id);
  let extra=0;for(const e of members)if(!blocked.has(selectionGroupId(e.id))&&!result.has(e.id)){result.add(e.id);extra++;}
  return {ids:result,extra,blocked:blocked.size};
 };
 window.selectionIsolationTargets=function(scope,kept,available,protect=true){
  const scopeIds=new Set(scope.map(e=>e.id)),blocked=new Set();
  for(const e of available){const group=selectionGroupId(e.id);if(group&&(kept.has(e.id)||!scopeIds.has(e.id)||protect&&isLocked(e)))blocked.add(group);}
  return scope.filter(e=>!kept.has(e.id)&&(!protect||!isLocked(e))&&!blocked.has(selectionGroupId(e.id)));
 };
})();
