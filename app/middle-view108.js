// Double middle-click fits the drawing; a middle-button drag remains a pan.
(()=>{
 let press=null,previous=null;
 overlay.addEventListener('pointerdown',ev=>{if(ev.button!==1)return;press={x:ev.clientX,y:ev.clientY,time:performance.now(),moved:false};},true);
 overlay.addEventListener('pointermove',ev=>{if(press&&Math.hypot(ev.clientX-press.x,ev.clientY-press.y)>5){press.moved=true;previous=null;}},true);
 overlay.addEventListener('pointerup',ev=>{if(ev.button!==1||!press)return;const click=press;press=null;const now=performance.now();if(click.moved||now-click.time>500){previous=null;return;}if(previous&&now-previous.time<=500&&Math.hypot(click.x-previous.x,click.y-previous.y)<=5){previous=null;ev.preventDefault();queueMicrotask(()=>{if(scene||pendingPreview){fit();status('Vue recentrée sur le dessin.');}});}else previous={x:click.x,y:click.y,time:now};},true);
 overlay.addEventListener('pointercancel',()=>{press=null;previous=null;},true);
})();
