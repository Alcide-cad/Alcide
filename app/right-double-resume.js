(()=>{
 let last=null,suppressUntil=0,suppressPixel=null;
 window.addEventListener('pointerdown',ev=>{
  if(ev.button!==2||busy||!scene||document.querySelector('dialog[open]:not(#helpdialog):not(#detail-library)')){last=null;return;}
  if(!ev.target.closest?.('#overlay,#contextmenu,#rebar-context-menu,#rebar-label-menu')){last=null;return;}
  if(window.dimensionPointContextTarget?.(ev)){last=null;return;}
  const rect=overlay.getBoundingClientRect();if(ev.clientX<rect.left||ev.clientX>rect.right||ev.clientY<rect.top||ev.clientY>rect.bottom){last=null;return;}
  const pixel=eventPoint(ev),hit=pick(pixel),now=performance.now();
  if(last&&last.doc===activeId&&now-last.time<=500&&Math.hypot(pixel[0]-last.pixel[0],pixel[1]-last.pixel[1])<=6&&hit?.id===last.id){
   last=null;const resume=hit?.rebar?{name:'l’armature',run:()=>Reinforcement.resume(hit.id)}:resumeObjectTool(hit),repeat=document.getElementById('repeat-last-tool');
   if(!resume&&(!repeat||repeat.disabled))return;
   ev.preventDefault();ev.stopImmediatePropagation();suppressUntil=now+500;suppressPixel=[ev.clientX,ev.clientY];hideMenu();window.closeRebarContextMenu?.();
   if(resume){resume.run();status('Reprendre '+resume.name+' · paramètres de l’objet');}else repeat.click();
   if(!document.querySelector('dialog[open]:not(#helpdialog):not(#detail-library)'))overlay.focus({preventScroll:true});
  }else last={time:now,pixel,id:hit?.id,doc:activeId};
 },true);
 window.addEventListener('contextmenu',ev=>{if(performance.now()<suppressUntil&&suppressPixel&&Math.hypot(ev.clientX-suppressPixel[0],ev.clientY-suppressPixel[1])<=6){suppressUntil=0;ev.preventDefault();ev.stopImmediatePropagation();hideMenu();window.closeRebarContextMenu?.();}},true);
})();
