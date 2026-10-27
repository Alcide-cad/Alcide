// Onglets intérieurs : réutilise les panneaux et leurs contrôles existants.
(()=>{
 const right=$('#propertiespanel'),left=$('#layerpanel'),ws=$('#workspace');
 const groups={properties:['temporary-isolation','hover-properties-settings','properties','selection-filter','transform-parameters','rotation-settings','inspector-visibility','drawing-style','core-tool-settings','smart-arc-settings','similarsettings','arrange-settings','edit-block-definition','cut-properties-context','construction-aid-properties','rebar-segment-options','inspector-context'],hatch:['hatch-properties'],text:['text-properties','inspector-annotations','inspector-level','inspector-axes'],dimension:['inspector-dimensions','measurement-scale-panel','dimension-direction-properties','section-auto-settings','door-dimension-settings'],rebar:[]};
 let active=localStorage.getItem('side-tab:right')||'properties',leftActive=localStorage.getItem('side-tab:left')||'layers';if(!groups[active])active='properties';
 const make=(side,entries)=>{const rail=document.createElement('div');rail.className='side-tabs '+side;rail.setAttribute('role','tablist');rail.setAttribute('aria-label',side==='right'?'Réglages des objets':'Organisation du dessin');rail.setAttribute('aria-orientation','vertical');for(const [id,label] of entries){const b=document.createElement('button');b.type='button';b.dataset.sideTab=id;b.textContent=label;b.dataset.fullLabel=label;b.title=label;b.setAttribute('aria-label',label);b.setAttribute('role','tab');b.setAttribute('aria-controls',side==='right'?'propertiespanel':id==='library'?'detail-library':'layerpanel');b.onclick=()=>side==='right'?openRight(id,true):openLeft(id,true);rail.append(b);}rail.addEventListener('keydown',ev=>{if(!['ArrowDown','ArrowUp','Home','End'].includes(ev.key))return;ev.preventDefault();const buttons=[...rail.children],i=buttons.indexOf(document.activeElement);buttons[ev.key==='Home'?0:ev.key==='End'?buttons.length-1:(i+(ev.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length].focus();});return rail;};
 const rr=make('right',[['properties','Propriétés'],['hatch','Remplissage / hachures'],['text','Texte / repères'],['dimension','Cotation'],['rebar','Armatures']]);right.before(rr);
 const lr=make('left',[['layers','Calques'],['library','Bibliothèque'],['drawings','Dessins ouverts']]);left.after(lr);
 const drawings=document.createElement('section');drawings.id='side-drawings';drawings.className='panel';left.append(drawings);let signature='';
 function drawingList(){const tabs=[...document.querySelectorAll('#tabs [role=tab]')],sig=tabs.map(t=>t.textContent+'|'+t.className).join(';');if(signature===sig)return;signature=sig;drawings.replaceChildren();const title=document.createElement('h2');title.textContent='Dessins ouverts';drawings.append(title);if(!tabs.length){const p=document.createElement('p');p.textContent='Aucun dessin ouvert.';drawings.append(p);}for(const t of tabs){const b=document.createElement('button');b.className='wide';b.textContent=t.querySelector('strong')?.textContent||t.textContent.replace('×','').trim();b.onclick=()=>t.click();drawings.append(b);}}
 let forcedPanel=null,forcedContext='';
 function contextKey(){return JSON.stringify([activeId,tool,window.currentCadTool?.(),annotationMode,!!levelMode,!!axesMode,coreTool?.mode,drawingMode?.kind,[...selected]]);}
 function relevant(id){const es=[...selected].map(id=>entities.get(id)).filter(Boolean);if(forcedPanel===id)return true;
  if(id==='inspector-level')return !!levelMode||es.some(e=>e.annotation?.level);
  if(id==='inspector-axes')return !!axesMode||es.some(e=>e.annotation?.axis);
  if(id==='text-properties')return !levelMode&&!axesMode&&(!es.length||es.some(e=>textProperties(e)&&!e.annotation?.level&&!e.annotation?.axis));
  if(id==='inspector-annotations')return !!reperePlacement||es.some(e=>e.annotation?.leader&&!e.annotation?.level&&!e.annotation?.axis);
  if(id==='construction-aid-properties')return es.length>0;
  if(id==='rotation-settings')return !!window.rotationTool;
  if(id==='transform-parameters')return !!pendingTransformSelection||['move','copy','move-select'].includes(tool);
  if(id==='core-tool-settings')return !!coreTool&&!coreTool.smart;
  if(id==='smart-arc-settings')return !!coreTool?.smart;
  if(['similarsettings','arrange-settings','section-auto-settings','door-dimension-settings','cut-properties-context','rebar-segment-options'].includes(id))return !$('#'+id)?.hidden;
  if(id==='edit-block-definition')return !$('#'+id)?.hidden;
  return true;
 }
 let presentationKey=null;function apply(){if(forcedContext!==contextKey()){forcedPanel=null;forcedContext=contextKey();}
const key=JSON.stringify([active,leftActive,right.hidden,left.hidden,$('#detail-library').open,[...selected],saveToken,drawingMode?.kind,tool,annotationMode,!!levelMode,!!axesMode,coreTool?.mode,window.currentCadTool?.(),forcedPanel]);if(key===presentationKey)return;presentationKey=key;const targets=(groups[active]||groups.properties).filter(relevant).map(id=>$('#'+id)).filter(Boolean);
  for(const node of [...right.children]){if(node.classList.contains('aside-title'))continue;const keep=targets.some(t=>node===t||node.contains(t));node.classList.toggle('dock-excluded',!keep);}
  for(const id of new Set(Object.values(groups).flat())){const node=$('#'+id);if(node)node.classList.toggle('dock-excluded',!groups[active].includes(id)||!relevant(id));}
  if(!right.hidden)for(const t of targets){if(active==='properties'&&t.id!=='drawing-style'&&t.id!==forcedPanel)continue;t.hidden=false;const section=t.closest('section');if(section&&section!==right)section.hidden=false;}
  if(right.dataset.sideTab!==active)right.dataset.sideTab=active;
  for(const b of rr.children){const on=b.dataset.sideTab===active&&!right.hidden;b.classList.toggle('active',on);b.setAttribute('aria-selected',String(on));}
  for(const b of lr.children){const on=b.dataset.sideTab===leftActive&&(leftActive==='library'?$('#detail-library').open:!left.hidden);b.classList.toggle('active',on);b.setAttribute('aria-selected',String(on));}
  drawings.hidden=leftActive!=='drawings';for(const n of left.children)if(n!==drawings&&!n.classList.contains('aside-title'))n.classList.toggle('dock-excluded',leftActive==='drawings');
 }
 function openRight(id,toggle=false){if(toggle&&active===id&&!right.hidden){if(id==='rebar'&&$('#rebar-dialog').open)$('#rebar-panel-toggle').click();setPanelVisible(false);apply();return;}active=id;localStorage.setItem('side-tab:right',id);setPanelVisible(true);if(id==='rebar'&&!$('#rebar-dialog').open&&!window.RebarLabels?.interaction())Reinforcement.show();apply();for(const key of groups[id].filter(relevant)){const n=$('#'+key);if(n){n.hidden=false;if(n.tagName==='DETAILS'&&!window.restorePaletteSectionState?.(n))n.open=true;const parent=n.closest('section');if(parent&&parent!==right)parent.hidden=false;}}window.syncArrowControls?.();apply();}
 function openLeft(id,toggle=false){const lib=$('#detail-library');if(id==='library'){if(toggle&&leftActive===id&&lib.open)lib.close();else{setLayerPanelVisible(false);if(!lib.open)$('#library-palette-toggle').click();}}else{if(lib.open)lib.close();setLayerPanelVisible(!(toggle&&leftActive===id&&!left.hidden));}leftActive=id;localStorage.setItem('side-tab:left',id);drawingList();apply();}
 const reveal=revealInspector;revealInspector=function(node){if(node&&right.contains(node)){const card=node.closest('[id]');let owner=Object.values(groups).flat().map(id=>$('#'+id)).find(n=>n&&(n===node||n.contains(node)));if(!owner){owner=node.closest('details,section')||node;if(!owner.id)owner.id='right-panel-'+Object.values(groups).flat().length;groups.properties.push(owner.id);}forcedPanel=owner.id;forcedContext=contextKey();presentationKey=null;active=Object.keys(groups).find(k=>k!=='properties'&&k!=='line'&&groups[k].some(id=>{const n=$('#'+id);return n&&(n===node||n.contains(node));}))||'properties';localStorage.setItem('side-tab:right',active);apply();}return reveal(node);};
 const drawBase=drawOverlay;drawOverlay=function(...args){const result=drawBase.apply(this,args);apply();return result;};
 const refreshBase=refresh;refresh=function(...args){presentationKey=null;const result=refreshBase.apply(this,args);apply();drawingList();return result;};
 new MutationObserver(apply).observe(right,{attributes:true,attributeFilter:['hidden']});new MutationObserver(()=>{drawingList();apply();}).observe($('#tabs'),{childList:true,subtree:true,characterData:true});new MutationObserver(apply).observe(left,{attributes:true,attributeFilter:['hidden']});new MutationObserver(apply).observe($('#detail-library'),{attributes:true,attributeFilter:['open']});
 const css=document.createElement('style');css.textContent=`
 .side-tabs{display:flex;flex-direction:column;gap:4px;flex:0 0 34px;width:34px;min-height:0;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;background:var(--panel);padding:5px 2px;border:1px solid var(--border)}
 .side-tabs::-webkit-scrollbar{display:none;width:0;height:0}
 .side-tabs button{writing-mode:vertical-rl;transform:rotate(180deg);flex:1 1 0;min-height:46px;max-height:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:8px 6px;border-radius:5px;font-size:12px;width:28px;letter-spacing:.1px}
 .side-tabs button.active{border-color:var(--accent);box-shadow:inset -2px 0 var(--accent)}
 #detail-library[open]{left:34px!important}
 .dock-excluded{display:none!important}#layerhandle,#panelhandle{display:none!important}

 #side-drawings button{white-space:normal;text-align:left;overflow-wrap:anywhere}
 `;document.head.append(css);
 const compactNames={properties:'Propriétés',line:'Traits',hatch:'Remplissage',text:'Textes',dimension:'Cotes',rebar:'Armatures',layers:'Calques',library:'Bibliothèque',drawings:'Dessins'};
 const tinyNames={properties:'Objet',line:'Traits',hatch:'Fond',text:'Texte',dimension:'Cotes',rebar:'Aciers',layers:'Calques',library:'Biblio.',drawings:'Dessins'};
 const fitRail=rail=>{const available=(rail.clientHeight-12-4*(rail.children.length-1))/rail.children.length;for(const b of rail.children){const label=available<82?tinyNames[b.dataset.sideTab]:available<125?compactNames[b.dataset.sideTab]:b.dataset.fullLabel;if(b.textContent!==label)b.textContent=label;}};
 const railSize=new ResizeObserver(entries=>{for(const entry of entries)fitRail(entry.target);});railSize.observe(lr);railSize.observe(rr);
 for(const rail of [lr,rr])rail.addEventListener('focusin',ev=>ev.target.closest('button')?.scrollIntoView({block:'nearest',inline:'nearest'}));
 window.RightPanels={groups:()=>structuredClone(groups),relevant};apply();drawingList();window.openSidePropertyTab=id=>{if(id==='line')id='properties';if(Object.hasOwn(groups,id))openRight(id,false);};window.sideTabsReady=true;
})();

