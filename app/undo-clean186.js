/* 1.0.86 · Undo/redo back to the last opened or saved state clears the "modified" flag.
   The clean reference is captured only when the flag really goes from modified to saved
   (or when a drawing is first shown), so an unsaved change can never be hidden. */
(()=>{
 const clean=new Map(),seenDirty=new Map();
 const signature=()=>JSON.stringify({changes,dimensions,edits,layerChanges,hiddenLayers:[...hiddenLayers].sort()});
 function capture(){
  if(!scene||!activeId)return;const id=activeId,before=seenDirty.get(id);
  if(!dirty&&(before===undefined||before===true)){try{clean.set(id,signature());}catch{clean.delete(id);}}
  seenDirty.set(id,!!dirty);
 }
 const baseRefresh=refresh;refresh=function(...args){const r=baseRefresh.apply(this,args);try{capture();}catch{}return r;};
 const baseRestore=restore;restore=function(...args){const r=baseRestore.apply(this,args);try{const ref=clean.get(activeId);if(dirty&&ref!==undefined&&signature()===ref){dirty=false;seenDirty.set(activeId,false);baseRefresh(false);}}catch{}return r;};
 window.UndoClean186={isClean:()=>!dirty,reference:()=>clean.get(activeId)};
})();
