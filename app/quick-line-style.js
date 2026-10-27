(()=>{
 const bar=$('#toolquickbar');
 function sync(){
  const es=[...selected].map(id=>entities.get(id)).filter(e=>e&&!isLocked(e)&&!edits[e.id]?.deleted);
  const active=scene&&!busy&&tool==='select'&&es.length&&!drawingMode;
  let box=$('#quick-line-style');if(!active){box?.remove();return;}
  if(!box){box=document.createElement('span');box.id='quick-line-style';box.style.cssText='display:flex;align-items:center;gap:6px';bar.querySelector('strong').after(box);
   for(const [key,title,source]of [['lineweight','Épaisseur','objectweight'],['linetype','Trait','drawing-linetype']]){
    const label=document.createElement('label');label.textContent=title+' ';const control=document.createElement('select');control.id='quick-object-'+key;control.setAttribute('aria-label',title+' de la sélection');label.append(control);box.append(label);
    const original=$('#'+source);if(original)control.append(...Array.from(original.options,o=>new Option(o.textContent,o.value)));if(!control.querySelector('option[value=""]'))control.prepend(new Option('Variés',''));
    control.onchange=()=>{if(control.value==='')return;applySelectionProperties({[key]:key==='lineweight'?cadNumeric(control.value):control.value});};
   }
  }
  for(const key of ['lineweight','linetype']){const control=$('#quick-object-'+key);const values=es.map(e=>edits[e.id]?.props?.[key]??e[key]??(key==='lineweight'?-1:'BYLAYER'));const value=values.every(v=>v===values[0])?String(values[0]):'';if(!Array.from(control.options).some(o=>o.value===value))control.append(new Option(value,value));if(document.activeElement!==control)control.value=value;}
 }
 const refreshBase=refresh;refresh=function(...args){const result=refreshBase(...args);sync();return result;};
 const overlayBase=drawOverlay;drawOverlay=function(...args){const result=overlayBase(...args);sync();return result;};sync();
})();
