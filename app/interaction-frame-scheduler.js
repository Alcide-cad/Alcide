// Regroupe toute la chaîne de rendu, y compris les panneaux ajoutés en fin de chargement.
(()=>{
 const base=drawOverlay;let pointerMove=false,frame=0,rendering=false,args=[];
 function immediate(values){if(rendering)return;rendering=true;const previous=window.overlayFrameCoalescing;window.overlayFrameCoalescing=false;try{return base.apply(window,values);}finally{window.overlayFrameCoalescing=previous;rendering=false;}}
 function flush(){frame=0;immediate(args);}
 window.addEventListener('pointermove',()=>{pointerMove=true;queueMicrotask(()=>{pointerMove=false;});},true);
 drawOverlay=function(...values){if(window.interactionFrameSchedulerEnabled===false)return base.apply(this,values);args=values;if(pointerMove){if(!frame)frame=requestAnimationFrame(flush);return;}if(frame){cancelAnimationFrame(frame);frame=0;}return immediate(values);};
 window.drawOverlayNow=function(...values){if(frame){cancelAnimationFrame(frame);frame=0;}return immediate(values);};
 // Tous les outils partagent le même rectangle de canevas pendant une image.
 // Les clics et les changements de taille recalculent toujours la géométrie.
 const pointBase=eventPoint;let rect=null,rectFrame=0;
 const invalidate=()=>{rect=null;};
 eventPoint=function(ev){if(ev.type==='pointermove'&&!pointerMove){pointerMove=true;queueMicrotask(()=>{pointerMove=false;});}if(window.interactionFrameSchedulerEnabled===false||ev.type!=='pointermove'){invalidate();return pointBase(ev);}if(!rect){rect=overlay.getBoundingClientRect();if(!rectFrame)rectFrame=requestAnimationFrame(()=>{rectFrame=0;invalidate();});}return [ev.clientX-rect.left,ev.clientY-rect.top];};
 new ResizeObserver(invalidate).observe(overlay);window.addEventListener('resize',invalidate);window.addEventListener('scroll',invalidate,true);
 window.interactionFrameSchedulerReady=true;
})();
