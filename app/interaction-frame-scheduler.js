// Regroupe toute la chaîne de rendu, y compris les panneaux ajoutés en fin de chargement.
(()=>{
 const base=drawOverlay;let pointerMove=false,frame=0,rendering=false,args=[];
 function immediate(values){if(rendering)return;rendering=true;const previous=window.overlayFrameCoalescing;window.overlayFrameCoalescing=false;try{return base.apply(window,values);}finally{window.overlayFrameCoalescing=previous;rendering=false;}}
 // 1.0.93 : l'image différée repasse par TOUTE la chaîne drawOverlay (y compris les modules chargés après celui-ci :
 // mesure rapide, mesure, aperçus…). Avant, flush() n'appelait que la chaîne d'en dessous : l'effacement du canevas
 // supprimait ce que ces modules venaient de dessiner, et rien ne réapparaissait avant un zoom.
 let forced=false;
 function full(values){forced=true;try{return drawOverlay.apply(window,values);}finally{forced=false;}}
 function flush(){frame=0;full(args);}
 window.addEventListener('pointermove',()=>{pointerMove=true;queueMicrotask(()=>{pointerMove=false;});},true);
 drawOverlay=function(...values){if(window.interactionFrameSchedulerEnabled===false||forced)return forced?immediate(values):base.apply(this,values);args=values;if(pointerMove){if(!frame)frame=requestAnimationFrame(flush);return;}if(frame){cancelAnimationFrame(frame);frame=0;}return immediate(values);};
 window.drawOverlayNow=function(...values){if(frame){cancelAnimationFrame(frame);frame=0;}return full(values);};
 // Tous les outils partagent le même rectangle de canevas pendant une image.
 // Les clics et les changements de taille recalculent toujours la géométrie.
 const pointBase=eventPoint;let rect=null,rectFrame=0;
 const invalidate=()=>{rect=null;};
 eventPoint=function(ev){if(ev.type==='pointermove'&&!pointerMove){pointerMove=true;queueMicrotask(()=>{pointerMove=false;});}if(window.interactionFrameSchedulerEnabled===false||ev.type!=='pointermove'){invalidate();return pointBase(ev);}if(!rect){rect=overlay.getBoundingClientRect();if(!rectFrame)rectFrame=requestAnimationFrame(()=>{rectFrame=0;invalidate();});}return [ev.clientX-rect.left,ev.clientY-rect.top];};
 new ResizeObserver(invalidate).observe(overlay);window.addEventListener('resize',invalidate);window.addEventListener('scroll',invalidate,true);
 window.interactionFrameSchedulerReady=true;
})();
