// Reproject the last precise frame during navigation, then restore vector quality at rest.
(()=>{
 const vectorDraw=draw,buffer=document.createElement('canvas');let snapshot=null,lastVector=null,timer=null,moving=false;
 const stats=window.navigationPerformanceStats={previewFrames:0,vectorFrames:0,lastPreviewMs:0,lastVectorMs:0};
 const key=()=>[activeId,scene?.layout,saveToken,canvas.width,canvas.height,dpr,[...selected].join(',')].join('|');
 const matrix=v=>{const a=(v.angle||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return new DOMMatrix([v.s*c,v.s*s,v.s*s,-v.s*c,v.tx,v.ty]);};
 function capture(){if(!lastVector||lastVector.key!==key())return false;buffer.width=canvas.width;buffer.height=canvas.height;buffer.getContext('2d').drawImage(canvas,0,0);snapshot={...lastVector,view:{...lastVector.view}};return true;}
 function finish(){moving=false;snapshot=null;clearTimeout(timer);requestRender();}
 function begin(){if(!scene||busy||pendingPreview||(entities.size<1500&&(stats.lastVectorMs||0)<12))return;if(!moving&&!capture())return;moving=true;clearTimeout(timer);timer=setTimeout(finish,140);}
 overlay.addEventListener('wheel',begin,{capture:true,passive:true});
 overlay.addEventListener('pointermove',()=>{if(drag?.mode==='pan')begin();},true);
 overlay.addEventListener('pointerup',()=>{if(moving){clearTimeout(timer);timer=setTimeout(finish,80);}},true);
 window.addEventListener('blur',()=>{if(moving)finish();});
 draw=function(){const started=performance.now(),current=key();
  if(moving&&snapshot&&snapshot.key===current){const ratio=view.s/snapshot.view.s,shift=Math.hypot(view.tx-ratio*snapshot.view.tx,view.ty-ratio*snapshot.view.ty);
   if(ratio>=.4&&ratio<=2.5&&shift<Math.max(w,h)*.65){const m=matrix(view).multiply(matrix(snapshot.view).inverse());ctx.setTransform(dpr,0,0,dpr,0,0);ctx.globalAlpha=1;ctx.fillStyle=window.Theme09?.background()||'#111820';ctx.fillRect(0,0,w,h);ctx.setTransform(dpr*m.a,dpr*m.b,dpr*m.c,dpr*m.d,dpr*m.e,dpr*m.f);ctx.imageSmoothingEnabled=true;ctx.drawImage(buffer,0,0,buffer.width/dpr,buffer.height/dpr);ctx.setTransform(dpr,0,0,dpr,0,0);window.OrderedTextDrawing?.retainedTop?.();drawOverlay();stats.previewFrames++;stats.lastPreviewMs=performance.now()-started;return;}
  }
  vectorDraw();window.OrderedTextDrawing?.paintTop?.(ctx);lastVector={key:current,view:{...view}};stats.vectorFrames++;stats.lastVectorMs=performance.now()-started;if(moving)capture();
 };
 const refreshModel=refresh;refresh=function(...args){moving=false;snapshot=null;lastVector=null;clearTimeout(timer);return refreshModel.apply(this,args);};window.finishInteractiveNavigation=finish;window.interactiveNavigationReady=true;
})();
