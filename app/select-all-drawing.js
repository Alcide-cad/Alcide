// Ctrl+A concerne le dessin ; les champs conservent leur sélection de texte native.
(()=>{
 window.addEventListener('keydown',ev=>{
  if(!(ev.ctrlKey||ev.metaKey)||ev.altKey||ev.key.toLowerCase()!=='a')return;
  const target=ev.target;
  if(target instanceof HTMLElement&&(target.isContentEditable||target.closest('input,textarea,[role="textbox"]')))return;
  ev.preventDefault();ev.stopImmediatePropagation();window.getSelection()?.removeAllRanges();
  if(busy||document.querySelector('dialog[open]')||!scene)return;
  if(!window.ToolSelectionFlow?.state())setTool('select');const available=[...entities.values()].filter(e=>e.layout===scene.layout&&visible(e)),ids=new Set(available.filter(e=>!isLocked(e)).map(e=>e.id));selected=window.selectionExpandGroups?selectionExpandGroups(ids,available,true).ids:ids;
  refresh(false);overlay.focus({preventScroll:true});status(selected.size+' objet(s) sélectionné(s) · espace actif · objets visibles et déverrouillés.');if(window.ToolSelectionFlow?.state())ToolSelectionFlow.finish();
 },true);
})();
