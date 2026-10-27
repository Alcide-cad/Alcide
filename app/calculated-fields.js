// Même calculateur pour les champs créés au démarrage et les palettes dynamiques.
function calculatedNumericField(e){return e?.tagName==='INPUT'&&(e.type==='number'||e.dataset.calculatedNumeric==='true');}
function calculatedFieldResult(e){
 const value=cadNumeric(e.value);if(!Number.isFinite(value))return {value,message:'Saisissez un nombre ou un calcul valide, par exemple 2,5*50.'};
 if(/endSize$/.test(e.id)&&value<=0)return {value,message:'La taille du symbole doit être positive.'};
 const min=e.min!==''?Number(e.min):-Infinity,max=e.max!==''?Number(e.max):Infinity;
 if(value<min)return {value,message:'Le résultat doit être supérieur ou égal à '+min+'.'};
 if(value>max)return {value,message:'Le résultat doit être inférieur ou égal à '+max+'.'};
 if((e.step==='1'||/precision$|axescount$|numberstart$|numberstep$/.test(e.id))&&!Number.isInteger(value))return {value,message:'Le résultat doit être un nombre entier.'};
 return {value,message:''};
}
(()=>{
 const pendingEdits=new WeakMap();
 function restoreTyping(e,edit){if(pendingEdits.get(e)!==edit||!e.isConnected||document.activeElement!==e)return;e.value=edit.raw;if(edit.start!==null)e.setSelectionRange(edit.start,edit.end);}
 function finishField(e){setTimeout(()=>{if(!e.isConnected||e.getAttribute('aria-invalid')==='true'||!e.checkValidity())return;if(document.activeElement===e)e.blur();if(!matchMedia('(prefers-reduced-motion:reduce)').matches)e.animate([{boxShadow:'0 0 0 2px #b0e28d',borderColor:'#b0e28d'},{boxShadow:'0 0 0 0 transparent'}],{duration:500});},0);}
 window.addEventListener('keydown',ev=>{const e=ev.target;if(ev.key!=='Enter'||e?.tagName!=='INPUT'||e.readOnly||e.disabled||calculatedNumericField(e)||!['text','number'].includes(e.type)||!e.closest('#propertiespanel,#preferences-dialog')||e.closest('.shortcut-list')||/search|filter/i.test(e.id))return;finishField(e);},true);
 function enhance(e){if(!calculatedNumericField(e))return;e.dataset.calculatedNumeric='true';if(e.type==='number'){e.type='text';e.inputMode='decimal';}if(!e.dataset.calculationHint){e.dataset.calculationHint='true';e.title=(e.title?e.title+' · ':'')+'Calculs : 2,5*50, (100-20)/2, + − × ÷ · Entrée pour calculer';}Object.defineProperty(e,'valueAsNumber',{configurable:true,get(){return cadNumeric(this.value);},set(value){this.value=String(value);}});}
 function normalize(e,report=true){if(!calculatedNumericField(e))return true;pendingEdits.delete(e);enhance(e);const result=calculatedFieldResult(e);e.setCustomValidity(result.message);e.setAttribute('aria-invalid',String(!!result.message));if(result.message){if(report)e.reportValidity();return false;}e.value=String(result.value);return true;}
 window.addEventListener('focusin',ev=>{if(calculatedNumericField(ev.target))enhance(ev.target);},true);
 window.addEventListener('input',ev=>{const e=ev.target;if(!calculatedNumericField(e))return;const edit={raw:e.value,start:e.selectionStart,end:e.selectionEnd};pendingEdits.set(e,edit);setTimeout(()=>restoreTyping(e,edit),0);const result=calculatedFieldResult(e);e.setCustomValidity(result.message);e.setAttribute('aria-invalid',String(!!result.message));window.dispatchEvent(new CustomEvent('numeric-field-validity',{detail:{input:e,...result}}));if(result.message)ev.stopImmediatePropagation();},true);
 window.addEventListener('input',ev=>{const e=ev.target,edit=pendingEdits.get(e);if(edit)restoreTyping(e,edit);});
 window.addEventListener('change',ev=>{if(calculatedNumericField(ev.target)&&!normalize(ev.target))ev.stopImmediatePropagation();},true);
 window.addEventListener('keydown',ev=>{if(ev.key!=='Enter'||!calculatedNumericField(ev.target))return;if(!normalize(ev.target)){ev.preventDefault();ev.stopImmediatePropagation();return;}ev.target.dispatchEvent(new Event('input',{bubbles:true}));ev.target.dispatchEvent(new Event('change',{bubbles:true}));finishField(ev.target);},true);
 window.addEventListener('focusout',ev=>{if(calculatedNumericField(ev.target))normalize(ev.target,false);},true);
})();
