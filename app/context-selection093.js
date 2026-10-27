// Contextual shortcuts delegate to the same commands as the ribbon and inspector.
(()=>{
 const q=s=>document.querySelector(s);
 function focusPanel(id,field){const panel=q('#'+id);if(!panel)return;revealInspector(panel);requestAnimationFrame(()=>{const target=field?panel.querySelector(field):panel.querySelector('input:not([disabled]),select:not([disabled]),button:not([disabled])');target?.focus({preventScroll:true});panel.scrollIntoView({block:'nearest'});});}
 function enhance(root){
  if(!selected.size)return;
  const es=[...selected].map(id=>entities.get(id)).filter(Boolean),one=es.length===1?es[0]:null,editable=es.length&&es.every(e=>!isLocked(e));
  const old=[...root.children].filter(e=>e.tagName==='BUTTON'),heading=root.querySelector('.context-heading,strong');
  root.querySelectorAll('hr').forEach(e=>e.remove());old.forEach(e=>e.remove());
  const primary=[],added=[];
  function add(label,run,enabled=true){if(!enabled)return;const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=ev=>{ev.stopPropagation();ev.preventDefault();hideMenu();q('#rebar-context-menu').hidden=true;run();};added.push(b);primary.push(b);return b;}
  function source(id,label){const b=q('#'+id);if(b&&!b.disabled)add(label,()=>b.click());}
  function take(re){const b=old.find(b=>!primary.includes(b)&&re.test(b.querySelector(':scope>span')?.textContent||b.textContent));if(b)primary.push(b);return b;}
  // Similar selection stays directly accessible, ahead of optional commands.
  if(!take(/^Sélectionner .*similaires$/i))source('similar','Sélectionner les similaires');
  const text=one&&textProperties(one)&&!one.annotation?.level&&!one.annotation?.axis;
  if(text){heading.textContent='Texte';if(editable){add('Modifier le contenu…',()=>openTextEditor());add('Police et alignement…',()=>focusPanel('text-properties'));source('drawing-order-front','Passer au premier plan');}}
  else if(one&&['CIRCLE','ARC'].includes(one.type)){heading.textContent=one.type==='CIRCLE'?'Cercle':'Arc';add(editable?'Rayon et diamètre…':'Consulter la géométrie…',()=>focusPanel('selection-measurements'));}
  else if(one?.rebar){const m=one.rebar.model;heading.textContent=m.linear?'Détail filant':m.kind==='mesh'?'Treillis soudé':'Acier · HA '+m.diameter;if(editable){take(/^Propriétés/);if(m.linear?.composition==='custom')source('filant-append-bars','Ajouter des aciers au détail…');else if(m.kind==='bar'){source('rebar-edit-hooks','Ajouter ou modifier les crosses…');if(m.shape!=='cerce')source('rebar-add-segment','Ajouter des segments');}take(/^Style des repères/);}}
  else if(one&&dimensionParameters(one)){for(const b of old.slice(0,3))primary.push(b);}
  else if(es.length>1)heading.textContent=es.length+' objets sélectionnés';
  if(editable){for(const [re,label,mode] of [[/^Déplacer(?:\s|$)/,'Déplacer','move'],[/^Copier(?:\s|$)/,'Copier','copy']])if(!take(re))add(label,()=>setTool(mode));}
  if(es.length>1){take(/^Isoler/);if(editable)add('Changer de calque…',()=>{focusPanel('properties','#objectlayer');});}
  if(editable&&!es.some(e=>e.rebar||e.reinforcementTable)){const aid=es.every(e=>ScreenDisplay.isAid(e));source(aid?'construction-aid-out':'construction-aid-in',aid?'Revenir au dessin normal':'Passer en construction d’aide');}
  if(primary.length<6)take(/^Supprimer$/);
  // Preserve all existing specialized commands, including chain editing and undo.
  if(!primary.length)primary.push(...old.slice(0,6));
  const main=primary.slice(0,7),remaining=[...primary.slice(7),...old.filter(b=>!primary.includes(b))];
  root.append(...main);
  const more=document.createElement('details');more.className='context093-more';const summary=document.createElement('summary');summary.textContent='Plus de réglages';more.append(summary,...remaining);
  const properties=document.createElement('button');properties.type='button';properties.textContent='Toutes les propriétés…';properties.onclick=ev=>{ev.stopPropagation();hideMenu();q('#rebar-context-menu').hidden=true;refresh();if(one?.rebar)Reinforcement.show();else{const p=q('#propertiespanel');p.hidden=false;openSidePropertyTab(one&&textProperties(one)?'text':'properties');p.scrollTop=0;}};more.append(properties);root.append(more);
  root.classList.add('context093');root.setAttribute('aria-label',heading.textContent);
  ContextIcons.scan(root);
  const icons=[[/Modifier le contenu|Police/,'M5 5h14M12 5v14M8 19h8'],[/premier plan/,'M4 8h12v12H4zM8 4h12v12M12 11V6M9 9l3-3 3 3'],[/construction|dessin normal/,'M3 12h18M12 3v18M5 5l14 14'],[/Rayon|géométrie/,'M12 3a9 9 0 1 0 .01 0M12 12l6-6M14 6h4v4'],[/segments/,'M3 18h8V7h10M17 3v8M13 7h8'],[/crosses/,'M3 17h12a5 5 0 0 0 0-10h-3M12 7l3-3'],[/calque/,'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5']];
  for(const b of added){const path=icons.find(([re])=>re.test(b.querySelector(':scope>span')?.textContent||b.textContent))?.[1];if(path)b.querySelector('svg path')?.setAttribute('d',path);}

 }
 window.enhanceSelectionContext093=enhance;
 const css=document.createElement('style');css.textContent=`.context093{min-width:270px}.context093>button,.context093-more>button{width:100%;min-height:34px!important;padding:7px 10px!important;border:0;background:transparent;text-align:left;border-radius:5px}.context093 .ctx-label{white-space:normal!important;line-height:1.35}.context093-more{border:0!important;padding:0!important;margin:5px 0 0!important;border-top:1px solid var(--border)!important;border-radius:0!important}.context093-more>summary{padding:10px;font-size:12px;color:var(--muted);cursor:pointer}.context093 button:hover,.context093-more>summary:hover{background:var(--panel)!important}.context093 button:focus-visible,.context093-more>summary:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}.context093 .context-heading,.context093>strong{padding:9px 10px;font-size:12px;letter-spacing:.2px}.context093-more[open]{padding-bottom:4px!important}body[data-theme=light] #rebar-context-menu{background:#f7faff!important;color:#243b4d!important;border-color:#a6bacb}body[data-theme=light] #rebar-context-menu strong{color:#42632d}`;document.head.append(css);
 // Enter/Space are native; arrows traverse the open menu and Escape returns to the canvas.
 for(const menu of [q('#contextmenu'),q('#rebar-context-menu')])menu.addEventListener('keydown',ev=>{if(ev.key==='Escape'){ev.preventDefault();hideMenu();q('#rebar-context-menu').hidden=true;overlay.focus();return;}if(!['ArrowDown','ArrowUp','Home','End'].includes(ev.key))return;const items=[...menu.querySelectorAll('button,summary')].filter(b=>!b.disabled&&b.getClientRects().length),i=items.indexOf(document.activeElement);if(!items.length)return;ev.preventDefault();items[ev.key==='Home'?0:ev.key==='End'?items.length-1:(i+(ev.key==='ArrowUp'?-1:1)+items.length)%items.length].focus();});
})();
