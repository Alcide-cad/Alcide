// One owner for common object properties. Existing controls keep their handlers.
(()=>{
 const css=document.createElement('style');css.textContent='[data-properties-duplicate="true"]{display:none!important}#properties .selection-editor{border-top:0;margin-top:0;padding-top:8px}.selection-editor h2{font-size:15px;margin-top:4px}.selection-editor .row{gap:12px}.selection-editor .numeric-stepper{min-width:110px}.selection-editor input[type=number]{min-width:65px;width:100%}.selection-editor select{min-width:0;max-width:100%}';document.head.append(css);
 function hide(node,value){if(node&&node.dataset.propertiesDuplicate!==String(value))node.dataset.propertiesDuplicate=String(value);}
 const editable=renderSelectionEditor;renderSelectionEditor=function(){editable();const card=$('#properties .selection-editor');if(!card||$('#objectlinetype'))return;card.querySelector('h2').textContent='Propriétés communes';const es=[...selected].map(id=>entities.get(id)).filter(Boolean),field=document.createElement('select');field.id='objectlinetype';field.setAttribute('aria-label','Type de trait');const names=new Set(['BYLAYER','BYBLOCK','CONTINUOUS',...Object.keys(scene?.linetypes||{}),...es.map(e=>edits[e.id]?.props?.linetype||e.linetype||'BYLAYER')]);field.append(new Option('Variés',''));for(const n of names)field.append(new Option(n==='BYLAYER'?'DuCalque':n==='BYBLOCK'?'DuBloc':n,n));const values=es.map(e=>edits[e.id]?.props?.linetype||e.linetype||'BYLAYER');field.value=values.every(v=>v===values[0])?values[0]:'';field.disabled=busy||es.every(isLocked);field.onchange=()=>{if(field.value)applySelectionProperties({linetype:field.value});};const row=document.createElement('label');row.className='row';row.append(Object.assign(document.createElement('span'),{textContent:'Type de trait'}),field);$('#objectweight').closest('label').before(row);};
 function sync(){const es=[...selected].map(id=>entities.get(id)).filter(Boolean),selecting=tool==='select'&&!drawingMode&&!levelMode&&!axesMode&&!annotationMode&&!coreTool&&!window.rotationTool;
  // The read-only summary retains geometry and identity, but not editable duplicates.
  for(const node of document.querySelectorAll('#properties>.property'))hide(node,['Calque','Transparence','Texte','Motif'].includes(node.firstElementChild?.textContent)&&!!es.length);
  const common=selecting&&es.length>0;
  hide($('#drawing-style'),common);hide($('#inspector-visibility'),common);
  if(common&&hatchTargets().length){const h=$('#hatch-properties');h.hidden=false;const section=h.parentElement;if(section.tagName==='SECTION')section.hidden=false;}
  // A native hatch uses the common color and transparency. Closed shapes keep a separate fill.
  const nativeOnly=common&&es.every(e=>e.type==='HATCH');
  hide($('#objecttransparency')?.closest('label'),common&&!nativeOnly);for(const b of document.querySelectorAll('.selection-editor>button'))if(b.textContent.includes('transparence DuCalque'))hide(b,common&&!nativeOnly);
  for(const id of ['hatch-color','hatch-alpha'])hide($('#'+id)?.closest('label'),nativeOnly);
  if(common){hide($('#opacity')?.closest('.row'),true);hide($('#applyopacity'),true);const c=$('#inspector-visibility');if(c){c.querySelector('summary').textContent='Visibilité';for(const n of c.querySelectorAll(':scope>small'))hide(n,true);}}
  else{hide($('#opacity')?.closest('.row'),false);hide($('#applyopacity'),false);const c=$('#inspector-visibility');if(c)c.querySelector('summary').textContent='Visibilité et transparence';}
  // Generic text settings are already offered by the dedicated text/axis/level cards.
  hide($('#inspector-annotations'),common&&es.every(e=>e.annotation?.level||e.annotation?.axis||textProperties(e)));
 }
 const props=propertiesUI;propertiesUI=function(...args){const r=props.apply(this,args);sync();return r;};
 const draw=drawOverlay;drawOverlay=function(...args){const r=draw.apply(this,args);sync();return r;};
 const refreshBase=refresh;refresh=function(...args){const r=refreshBase.apply(this,args);sync();return r;};
 registerHelpTopic('Propriétés regroupées',[Object.assign(document.createElement('p'),{textContent:'Sélectionnez des objets : Propriétés communes réunit calque, couleur, type de trait, épaisseur et transparence. Les modifications sont immédiates et Ctrl+Z les annule. Les blocs suivants contiennent uniquement les réglages propres aux textes, cotes, niveaux, axes et remplissages. Une sélection mixte conserve les réglages compatibles ; les objets verrouillés restent protégés. Le remplissage d’un contour garde sa couleur et sa transparence indépendantes du trait.'})]);
 window.unifiedPropertiesReady=true;sync();
})();
