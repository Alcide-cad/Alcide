// Direction de cote accessible depuis les propriétés, modèle de cotation existant conservé.
(()=>{
 const source=$('#dimensionaxis'),card=document.createElement('section');card.id='dimension-direction-properties';card.className='panel';
 card.innerHTML='<h2>Direction des cotes</h2><label class="row">Direction<select id="property-dimension-axis" aria-label="Direction des cotes"></select></label><small class="muted" id="property-dimension-axis-context"></small>';
 const control=card.querySelector('select');control.append(new Option('Directions différentes',''),...[...source.options].map(o=>new Option(o.textContent,o.value)));
 control.title='Automatique : horizontale ou verticale selon les deux points. Alignée : longueur réelle en biais.';
 $('#properties').after(card);
 const targets=()=>[...selected].map(id=>entities.get(id)).filter(e=>dimensionParameters(e));
 function sync(){const es=targets(),parameters=es.map(dimensionParameters),first=parameters[0]?.axis||'auto',value=es.length?(parameters.every(p=>(p.axis||'auto')===first)?first:''):source.value;
  if(document.activeElement!==control&&control.value!==value)control.value=value;
  const disabled=busy||!!es.length&&es.every(isLocked);if(control.disabled!==disabled)control.disabled=disabled;
  const text=es.length?'Modifie les cotes sélectionnées · Ctrl+Z annule.':'Réglage des prochaines cotes. Automatique choisit entre horizontale et verticale ; Alignée conserve le biais.';
  const hint=card.querySelector('small');if(hint.textContent!==text)hint.textContent=text;
 }
 control.addEventListener('change',async()=>{if(!control.value)return;const es=targets();if(es.length){await applyDimensionParameter('axis',control.value,es.map(e=>e.id));}else{source.value=control.value;source.dispatchEvent(new Event('input',{bubbles:true}));source.dispatchEvent(new Event('change',{bubbles:true}));requestRender();}sync();});
 const draw=drawOverlay;drawOverlay=function(...args){const r=draw.apply(this,args);sync();return r;};
 const props=propertiesUI;propertiesUI=function(...args){const r=props.apply(this,args);sync();return r;};
 source.addEventListener('change',sync);window.dimensionDirectionPropertiesReady=true;sync();
})();
