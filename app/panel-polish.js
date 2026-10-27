// 0.7.3 : panneaux de paramètres homogènes — grille 2 colonnes, hauteurs uniformes, en-têtes collants, état replié mémorisé.
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
 const css=document.createElement('style');css.textContent=`
.inspector-card>summary,.rebar-property-section>summary{position:sticky;top:0;z-index:3;background:#16232c;user-select:none;-webkit-user-select:none;padding-top:4px;padding-bottom:4px}
.inspector-card label.row,.rebar-property-section>label{display:grid;grid-template-columns:minmax(96px,1fr) minmax(0,1.25fr) auto;align-items:center;column-gap:8px;row-gap:4px;min-height:30px}
.inspector-card label.row>input[type=checkbox],.rebar-property-section>label>input[type=checkbox]{justify-self:end}
.inspector-card input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]),.inspector-card select,.rebar-property-section input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]),.rebar-property-section select{height:28px;min-height:28px;box-sizing:border-box;min-width:0;max-width:100%}
.inspector-card select,.rebar-property-section select,#toolquickbar select{text-overflow:clip;field-sizing:content;min-width:7.5em}
#toolquickbar select{max-width:16em}
.inspector-card label,.rebar-property-section label{white-space:normal;overflow-wrap:anywhere}
.inspector-card button,.rebar-property-section button{min-height:28px}`;document.head.append(css);
})();
