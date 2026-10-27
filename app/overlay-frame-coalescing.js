// Performance : pendant un pointermove, les appels drawOverlay() (et toute la chaîne de wrappers UI)
// sont regroupés en un seul rendu par image (requestAnimationFrame). Hors pointermove : rendu immédiat inchangé.
(()=>{
 if(typeof drawOverlay!=='function')return;
 const immediate=drawOverlay;let inMove=false,pending=false;
 window.addEventListener('pointermove',()=>{if(inMove)return;inMove=true;requestAnimationFrame(()=>{inMove=false;});},true);
 drawOverlay=function(...args){
  if(inMove&&window.overlayFrameCoalescing!==false){if(!pending){pending=true;requestAnimationFrame(()=>{if(!pending)return;pending=false;inMove=false;drawOverlay.apply(this,args);});}return;}
  pending=false;return immediate.apply(this,args);
 };
 window.drawOverlayNow=function(...args){pending=false;return immediate.apply(this,args);};
})();
