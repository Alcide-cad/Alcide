function setAllFillsBehind(value){globalFillsBehind=!!value;localStorage.setItem('fillsAlwaysBehind',String(globalFillsBehind));drawingOrderCache=null;refresh(false);status(globalFillsBehind?'Remplissages toujours à l’arrière-plan · paramètre du logiciel enregistré.':'Priorité manuelle des remplissages · paramètre du logiciel enregistré.');}
window.addEventListener('storage',ev=>{if(ev.key==='fillsAlwaysBehind'){globalFillsBehind=ev.newValue!=='false';drawingOrderCache=null;refresh(false);}});
// Ordre relatif de la sélection et priorité globale des remplissages dans les paramètres du logiciel.
function exportDrawingOrderEdits(){if(!scene)return edits;return {...edits,'@display-order':{...edits['@display-order'],layouts:{...edits['@display-order']?.layouts,[scene.layout]:drawingOrderedEntities().map(e=>e.id)}}};}
function setDrawingOrderLevel(value){
 if(!scene||busy)return;value=Math.max(0,Math.min(100,Math.round(Number(value)/5)*5));if(!Number.isFinite(value))return;
 const current=drawingOrderedEntities(),valid=new Set(current.filter(e=>!isLocked(e)).map(e=>e.id)),expanded=selectionExpandGroups([...selected],current,true),moving=new Set([...expanded.ids].filter(id=>valid.has(id)));if(!moving.size)return;
 const chosen=current.filter(e=>moving.has(e.id)).map(e=>e.id),rest=current.filter(e=>!moving.has(e.id)).map(e=>e.id),at=Math.round(rest.length*value/100),next=[...rest.slice(0,at),...chosen,...rest.slice(at)];
 if(next.every((id,i)=>id===current[i].id))return;const before=snapshot();edits['@display-order']={...edits['@display-order'],layouts:{...edits['@display-order']?.layouts,[scene.layout]:next}};drawingOrderCache=null;commit(before,false);status('Ordre de la sélection modifié · Ctrl+Z annule.');
}
(()=>{
 function mount(){const root=$('#properties');if(!root)return;root.querySelector('#object-order-controls')?.remove();const box=document.createElement('div');box.id='object-order-controls';box.className='selection-editor';
 const heading=document.createElement('h2');heading.textContent='Ordre de priorité d’affichage';box.append(heading);
 const row=document.createElement('label');row.className='row';row.append(Object.assign(document.createElement('span'),{textContent:'Position'}));
 const wrap=document.createElement('span');wrap.className='transparency-slider';const slider=document.createElement('input');slider.id='object-order-slider';slider.type='range';slider.min='0';slider.max='100';slider.step='5';slider.setAttribute('aria-label','Ordre de la sélection, de derrière à devant');const output=document.createElement('output');output.htmlFor=slider.id;
 const es=[...selected].map(id=>entities.get(id)).filter(e=>drawingOrderEligible(e)&&!isLocked(e));slider.disabled=busy||!es.length;
 if(es.length){const ordered=drawingOrderedEntities(),ids=new Set(es.map(e=>e.id)),first=ordered.findIndex(e=>ids.has(e.id)),n=ordered.filter(e=>!ids.has(e.id)).length;slider.value=String(n?Math.round(first/n*100):50);}else slider.value='50';
 const show=()=>{const v=Number(slider.value);output.textContent=v===0?'Derrière':v===100?'Devant':v+' / 100';slider.setAttribute('aria-valuetext',output.textContent);};show();slider.oninput=show;slider.onchange=()=>{setDrawingOrderLevel(slider.value);$('#object-order-slider')?.focus({preventScroll:true});};wrap.append(slider,output);row.append(wrap);box.append(row);
 root.append(box);
 }
 const css=document.createElement('style');css.textContent='#object-order-controls .order-fill-setting{grid-template-columns:minmax(0,1fr) auto;gap:12px}#object-order-controls .order-fill-setting span{min-width:0}';document.head.append(css);
 const properties=propertiesUI;propertiesUI=function(...args){const r=properties.apply(this,args);mount();return r;};mount();window.drawingOrderSliderReady=true;
})();
