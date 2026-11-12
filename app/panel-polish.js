// Shared panel disclosure state and full dropdown tooltips.
(()=>{
 const KEY='panelOpenState',state=(()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}');}catch{return {};}})();let saveTimer=0;
 const save=()=>{clearTimeout(saveTimer);saveTimer=setTimeout(()=>localStorage.setItem(KEY,JSON.stringify(state)),200);};
 function bind(d){if(!d.id||d.dataset.panelPolish)return;d.dataset.panelPolish='1';if(Object.hasOwn(state,d.id))d.open=state[d.id];d.addEventListener('toggle',()=>{state[d.id]=d.open;save();});}
 function scan(){for(const d of document.querySelectorAll('details.inspector-card[id],details.rebar-property-section[id]'))bind(d);}
 // Texte complet en infobulle pour les listes déroulantes étroites (« Schématique · contour, dia… »).
 document.addEventListener('change',ev=>{const t=ev.target;if(t?.tagName==='SELECT')t.title=t.selectedOptions[0]?.textContent||'';},true);
 const titles=()=>{for(const s of document.querySelectorAll('.inspector-card select,.rebar-property-section select,#rebar-dialog select,#toolquickbar select'))s.title=s.selectedOptions[0]?.textContent||'';};
 scan();titles();addEventListener('load',()=>{scan();titles();});setTimeout(scan,500);
 // Les panneaux créés plus tard (palettes, armatures) sont rattachés une fois, par image.
 let queued=false;new MutationObserver(list=>{if(queued||!list.some(m=>[...m.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('details')||n.querySelector?.('details')))))return;queued=true;requestAnimationFrame(()=>{queued=false;scan();});}).observe(document.body,{childList:true,subtree:true});
 // Shared typography and field geometry are defined once in settings-design142.css.
})();
