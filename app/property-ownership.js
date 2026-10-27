// Un seul emplacement par réglage ; les contrôles conservent leurs gestionnaires.
(()=>{
 const panel=$('#propertiespanel');
 const css=document.createElement('style');css.textContent=`
 /* Les réglages de création emploient les mêmes rubriques que les objets existants. */
 #propertiespanel #drawing-style label:has(#drawing-filled),
 #propertiespanel #drawing-style label:has(#drawing-fill-color),
 #propertiespanel #drawing-style label:has(#drawing-fill-alpha){display:none!important}
 /* La grille compacte ne doit pas ressusciter les anciens contrôles sous les cartes. */
 #propertiespanel #hatch-properties .hatch-legacy-hidden,
 #propertiespanel #hatch-properties label.row.hatch-legacy-hidden{display:none!important}
 #propertiespanel[data-side-tab=line] #drawing-style[data-properties-duplicate=true]{display:none!important}
 #propertiespanel[data-side-tab=line] #properties .selection-editor h2{font-size:13px}
 #propertiespanel .property-audit-note{font-size:12px;color:var(--muted);line-height:1.5;margin:8px 0}
 #propertiespanel .property-audit-note[hidden]{display:none!important}
 `;document.head.append(css);
 const hint=document.createElement('p');hint.className='property-audit-note';hint.hidden=true;panel.append(hint);
 let lastSync=null;function sync(){const state=JSON.stringify([activeId,saveToken,[...selected],panel.dataset.sideTab,busy]);if(state===lastSync)return;lastSync=state;
  const es=[...selected].map(id=>entities.get(id)).filter(Boolean),nativeHatch=es.length&&es.every(e=>e.type==='HATCH'),steel=es.length&&es.every(e=>e.rebar);
  const h=panel.querySelector('#properties .selection-editor h2');if(h){const title=nativeHatch?'Propriétés graphiques':'Propriétés de l’objet';if(h.textContent!==title)h.textContent=title;}
  const incompatible=panel.dataset.sideTab==='hatch'&&es.length&&!hatchTargets().length;
  hint.hidden=!incompatible;
  if(incompatible){hint.classList.remove('dock-excluded');hint.textContent=steel?'Les armatures se règlent dans leur panneau métier : diamètre, forme, quantité, espacement et repère.':'Sélectionnez un contour fermé ou une hachure pour modifier son remplissage.';}
  $('#hatch-properties')?.classList.toggle('property-incompatible',!!incompatible);
 }
 css.textContent+='#propertiespanel #hatch-properties.property-incompatible{display:none!important}';
 const draw=drawOverlay;drawOverlay=function(...args){const r=draw.apply(this,args);sync();return r;};
 const refreshBase=refresh;refresh=function(...args){lastSync=null;const r=refreshBase.apply(this,args);sync();return r;};
 new MutationObserver(sync).observe(panel,{attributes:true,attributeFilter:['data-side-tab']});
 // Le panneau métier occupe la même colonne : il ne recouvre jamais les onglets.
 const rebar=$('#rebar-dialog');let frame=0;
 function dockRebar(){frame=0;if(!rebar.open){if(panel.dataset.sideTab==='rebar'&&!panel.hidden)window.openSidePropertyTab('properties');return;}if(panel.dataset.sideTab!=='rebar')window.openSidePropertyTab('rebar');if(panel.hidden)setPanelVisible(true);const r=panel.getBoundingClientRect();
  for(const [key,value] of Object.entries({left:r.left+'px',right:'auto',top:r.top+'px',bottom:'auto',width:r.width+'px',height:r.height+'px',maxHeight:r.height+'px',borderRadius:'0px'}))if(rebar.style.getPropertyValue(key)!==value||rebar.style.getPropertyPriority(key)!=='important')rebar.style.setProperty(key,value,'important');
 }
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(dockRebar);};
 new MutationObserver(schedule).observe(rebar,{attributes:true,attributeFilter:['hidden','style']});new ResizeObserver(schedule).observe(panel);
 document.querySelector('.side-tabs.right').addEventListener('click',ev=>{if(ev.target.closest('button')&&rebar.open&&!Reinforcement.placement())rebar.close();},true);
 window.propertyOwnershipReady=true;sync();
})();
