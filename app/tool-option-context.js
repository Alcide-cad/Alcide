// Contextual visibility only: never changes stored styles or drawing geometry.
(()=>{
 const css=document.createElement('style');
 css.textContent='[data-option-irrelevant="true"]{display:none!important}';
 document.head.append(css);
 function show(node,visible){if(!node)return;const value=String(!visible);if(node.dataset.optionIrrelevant!==value)node.dataset.optionIrrelevant=value;}
 function row(id,visible){show(document.getElementById(id)?.closest('label'),visible);}
 function sync(){
  const kind=drawingMode?.kind,es=[...selected].map(id=>entities.get(id)).filter(Boolean);
  const point=kind==='point'||!kind&&es.length>0&&es.every(e=>e.type==='POINT');
  const fill=kind?['rectangle','polygon','circle'].includes(kind):es.some(e=>drawingStyleEligible(e)&&edits[e.id]?.drawing&&!edits[e.id].drawing.cloud&&(cadClosed(e)||e.type==='CIRCLE'));
  row('cloud-arc',kind==='cloud');
  row('drawing-round-geometry',!!kind&&kind!=='point');
  for(const id of ['drawing-filled','drawing-fill-color','drawing-fill-alpha'])row(id,fill);
  for(const id of ['drawing-linetype','drawing-weight'])row(id,!point);
  const card=$('#drawing-style');
  if(card){
   const heading=card.querySelector('summary');
   const title=point?'Point · calque et couleur':fill?'Dessin · traits et remplissage':'Dessin · traits';
   if(heading&&heading.textContent!==title)heading.textContent=title;
   const help=card.querySelector('p.muted');
   const message=kind?'Ces réglages concernent les prochains objets.':es.length?'Les propriétés compatibles sont appliquées aux objets sélectionnés non verrouillés. Ctrl+Z annule.':'Ces réglages concernent les prochains objets.';
   if(help&&help.textContent!==message)help.textContent=message;
  }
  show($('#drawing-apply'),!kind&&es.some(drawingStyleEligible));
  row('quick-cloud-arc',kind==='cloud');
  // Alignment guides are implemented for both move and copy.
  const transform=pendingTransformSelection||tool;
  const guides=$('#transform-palette-copyguides')?.closest('label');
  if(guides)guides.hidden=!['move','copy'].includes(transform);
  for(const field of document.querySelectorAll('[data-drawing-source]')){
   show(field.closest('label'),!point||!['drawing-linetype','drawing-weight'].includes(field.dataset.drawingSource));
  }
  for(const button of document.querySelectorAll('#drawing-quick-controls button')){
   if(['Remplissage / calque…','Calque et couleur…','Propriétés du dessin…'].includes(button.textContent))button.textContent=point?'Calque et couleur…':fill?'Remplissage / calque…':'Propriétés du dessin…';
  }
  if(coreTool?.smart){
   const method=$('#arc-method')?.value;
   row('arc-radius',method!=='three');row('arc-clockwise',method!=='three');row('arc-sweep',method==='sweep');
  }
 }
 const draw=drawOverlay;drawOverlay=function(...args){const result=draw.apply(this,args);sync();return result;};
 const update=refresh;refresh=function(...args){const result=update.apply(this,args);sync();return result;};
 window.syncToolOptionContext=sync;
 window.toolOptionContextReady=true;
 sync();
})();
