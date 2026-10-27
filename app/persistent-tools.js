// All drawing operations keep their tool. Escape resets once, exits twice.
(()=>{
 let inCanvas=false,inValidation=false,restarting=false,escapeArmed=false,generation=0;
 function descriptor(){if(drawingMode)return {kind:'draw',value:drawingMode.kind,fillOnly:!!drawingMode.fillOnly};if(pendingTransformSelection)return {kind:'tool',value:pendingTransformSelection};if(reperePlacement)return {kind:'repere',value:structuredClone(reperePlacement)};if(autoDimensionMode)return {kind:'auto',ids:[...autoDimensionMode.ids]};if(cadMode)return {kind:'cad',value:cadMode.mode,distance:cadMode.value,scope:cadMode.scope};if(axesMode)return {kind:'axes',value:structuredClone(axesMode)};if(levelMode)return {kind:'level',value:levelMode};if(annotationMode)return {kind:'annotation',value:annotationMode==='chain-position'?'chain':annotationMode,draft:typeof textDraft==='object'?structuredClone(textDraft):null};if(['dimension','measure','move','copy'].includes(tool))return {kind:'tool',value:tool};return null;}
 const base=setTool;
 function clearReference(){if($('#relative-offset-enabled'))$('#relative-offset-enabled').checked=false;relativeOffsetReference=null;placementPickReference=false;placementReference=null;placementStepPreview=null;$('#placement-reference')?.classList.remove('active');}
 window.finishPersistentCopy=function(){generation++;inCanvas=false;inValidation=false;escapeArmed=false;clearReference();base('select');hideMenu();refresh();status('Copie terminée · sélection.');};
 const finishDrawing=drawingFinish;drawingFinish=function(...args){const prior=inValidation;inValidation=true;try{return finishDrawing(...args);}finally{inValidation=prior;}};
 function resume(d){if(!d||!scene||busy)return;restarting=true;try{if(d.kind==='draw'){startDrawingTool(d.value);drawingMode.fillOnly=!!d.fillOnly;}else if(d.kind==='repere'){base('select');reperePlacement={...d.value,anchor:null};drawOverlay();}else if(d.kind==='auto'){base('auto-dimension');autoDimensionMode={mode:'zone',points:[],ids:d.ids,docId:activeId,token:saveToken};drawOverlay();}else if(d.kind==='cad'){cadStart(d.value,d.distance);if(d.scope&&cadMode){cadMode.scope=[...d.scope];cadMode.ids=[...d.scope];}}else if(d.kind==='axes'){base('cad');axesMode={...d.value,start:null,end:null};drawOverlay();}else if(d.kind==='level'){base('select');levelMode=d.value;drawOverlay();}else if(d.kind==='annotation'){base('select');annotationMode=d.value;annotationPoints=[];$('#chainfinish').disabled=d.value!=='chain';if(d.draft)textDraft=d.draft;drawOverlay();}else base(d.value);}finally{restarting=false;}}
 setTool=function(t,...args){const d=descriptor(),doc=activeId,persist=!restarting&&t==='select'&&(inCanvas||inValidation)&&d&&scene&&!busy;generation++;if(!restarting)escapeArmed=false;const result=base(t,...args),serial=generation;if(persist)queueMicrotask(()=>{if(serial===generation&&doc===activeId&&scene&&!busy&&!descriptor())resume(d);});return result;};
 document.addEventListener('pointerdown',ev=>{escapeArmed=false;if(ev.target===overlay&&ev.button===0){const d=descriptor(),doc=activeId,n=history.length,serial=generation;inCanvas=true;setTimeout(()=>{inCanvas=false;if(serial===generation&&d&&doc===activeId&&history.length>n&&!descriptor())resume(d.kind==='annotation'&&d.value==='chain-position'?{...d,value:'chain'}:d);},0);}},true);
 document.addEventListener('keydown',ev=>{
  if(ev.key!=='Escape'||busy||document.querySelector('dialog[open]:not(#helpdialog):not(#detail-library)'))return;const d=descriptor();if(!d)return;
  if(d.kind==='level'){ev.preventDefault();ev.stopImmediatePropagation();generation++;clearReference();base('select');escapeArmed=false;refresh();status('Pose de niveaux terminée.');return;}
  if(d.kind==='tool'&&d.value==='copy'){ev.preventDefault();ev.stopImmediatePropagation();window.cancelCopyPrecision?.();window.finishPersistentCopy();return;}
  if(drawingMode?.kind==='point'){ev.preventDefault();ev.stopImmediatePropagation();generation++;clearReference();base('select');escapeArmed=false;refresh();status('Pose de points terminée.');return;}
  if(ev.repeat){ev.preventDefault();ev.stopImmediatePropagation();return;}
  ev.preventDefault();ev.stopImmediatePropagation();generation++;
  if(drawingMode&&['polygon','polyline'].includes(drawingMode.kind)&&drawingMode.points.length>=(drawingMode.kind==='polygon'?3:2)){
   const before=history.length;drawingFinish();
   if(history.length>before){if(!d.fillOnly||!drawingMode)resume(d);escapeArmed=true;clearReference();status(d.fillOnly?'Remplissage créé · outil actif · nouveau contour ou Échap pour quitter.':(d.value==='polygon'?'Polygone':'Polyligne')+' validé · outil actif · nouveau tracé ou Échap pour quitter.');}
   else escapeArmed=false;
   drawOverlay();return;
  }
  if(annotationMode==='chain'&&annotationPoints.length>=2){finishChainPoints();escapeArmed=false;drawOverlay();return;}
  clearReference();if(escapeArmed){base('select');escapeArmed=false;status('Outil terminé · sélection.');}
  else{const saved=new Set(selected);base('select');selected=saved;resume(d);escapeArmed=true;hideMenu();status('Opération annulée · outil actif · nouvelle opération ou Échap pour quitter.');}
  refresh();drawOverlay();
 },true);
 // Enter finishes polylines/chains through their existing handlers.
 document.addEventListener('keydown',ev=>{if(ev.key==='Enter'&&!['INPUT','TEXTAREA','SELECT'].includes(ev.target.tagName)){inValidation=true;escapeArmed=false;queueMicrotask(()=>inValidation=false);}},true);
})();
