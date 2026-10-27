// Keep original controls, validation and undo handlers; organize their presentation only.
(()=>{
 const q=s=>document.querySelector(s),panel=q('#propertiespanel'),header=panel.querySelector('.aside-title'),states=new Map();let signature='';
 const caption=document.createElement('div');caption.className='palette093-caption';caption.innerHTML='<strong></strong><span></span>';
 const actions=document.createElement('div');actions.className='palette093-header-actions';
 function iconButton(title,path,run){const b=document.createElement('button');b.type='button';b.title=title;b.setAttribute('aria-label',title);b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+path+'"/></svg>';b.onclick=run;actions.append(b);return b;}
 const fold=iconButton('Replier les rubriques visibles','M5 9l7 7 7-7M5 4l7 7 7-7',()=>{for(const d of panel.querySelectorAll('details'))if(d.getClientRects().length)d.open=false;});
 const clear=iconButton('Désélectionner les objets','M6 6l12 12M18 6L6 18',()=>{selected.clear();refresh(false);overlay.focus({preventScroll:true});});
 header.append(caption,actions);header.classList.add('palette093-header');
 const note=document.createElement('div');note.className='palette093-note';note.setAttribute('role','status');header.after(note);note.classList.add('aside-title');
 function disclosure(id,title,children){const d=document.createElement('details');d.id=id;d.className='palette093-disclosure';d.open=states.get(id)??false;const s=document.createElement('summary');s.textContent=title;d.append(s,...children);d.addEventListener('toggle',()=>{if(d.isConnected)states.set(id,d.open);});return d;}
 function arrange(){
  const root=q('#properties'),card=root.querySelector('.selection-editor');
  const colorRow=q('#objectcolor')?.closest('label');if(colorRow)colorRow.classList.toggle('palette093-inherited-color',q('#objectcolormode')?.value==='bylayer');
  if(card&&!card.dataset.palette093){card.dataset.palette093='1';card.querySelector('h2').textContent='Apparence et calque';
   const extra=[...card.children].filter(n=>n.matches('.selection-actions')||n.tagName==='BUTTON');
   if(extra.length)card.append(disclosure('palette093-advanced','Déplacement précis et options',extra));
   for(const id of ['objectlayer','objectcolormode','objectcolor','objectlinetype','objectweight']){const input=q('#'+id);if(input)input.title=({objectlayer:'Calque des objets sélectionnés',objectcolormode:'Couleur héritée du calque ou couleur propre',objectcolor:'Choisir la couleur des objets',objectlinetype:'Type de trait des objets sélectionnés',objectweight:'Épaisseur du trait'})[id];}
  }
  const identity=[...root.querySelectorAll(':scope>.property')].filter(n=>!n.hasAttribute('data-properties-duplicate')||n.dataset.propertiesDuplicate!=='true');
  if(identity.length){const details=disclosure('palette093-identity','Informations sur la sélection',identity);root.append(details);}
  // Put the editable common properties before read-only identity, without hiding geometry.
  const info=q('#palette093-identity');if(card&&info)info.before(card);
  sync();
 }
 function sync(){const es=[...selected].map(id=>entities.get(id)).filter(Boolean),locked=es.filter(isLocked).length,types=[...new Set(es.map(e=>objectLabel(e.type)))],mode=drawingMode?.kind||annotationMode||coreTool?.mode||tool,key=JSON.stringify([activeId,saveToken,mode,es.map(e=>e.id),locked,panel.dataset.sideTab,busy]);if(key===signature)return;signature=key;
  panel.dataset.paletteSelection=String(es.length);panel.dataset.paletteTool=mode==='select'?'selection':'active';const color=q('#objectcolor')?.closest('label');if(color)color.classList.toggle('palette093-inherited-color',q('#objectcolormode')?.value==='bylayer');
  caption.querySelector('strong').textContent=es.length===1?(es[0].rebar?'Armature':types[0]):es.length?es.length+' objets sélectionnés':'Propriétés';
  caption.querySelector('span').textContent=es.length>1?(types.length===1?types[0]:types.length+' types d’objets'):es.length?'Sélection active':mode==='select'?'Sélectionnez un objet':'Réglages de l’outil actif';
  note.textContent=locked===es.length&&locked?'Sélection verrouillée · consultation uniquement':locked?locked+' objet(s) verrouillé(s) conservé(s)':es.length?'Modifications directes · Ctrl+Z pour annuler':'';
  note.hidden=!note.textContent;note.classList.toggle('palette093-locked',!!locked);clear.hidden=!es.length;clear.disabled=busy;fold.disabled=busy;
 }
 panel.addEventListener('toggle',ev=>{const d=ev.target;if(d.isConnected&&d.matches?.('details[id]'))states.set(d.id,d.open);},true);
 const props=propertiesUI;propertiesUI=function(...args){const scroll=panel.scrollTop;for(const d of panel.querySelectorAll('details[id]'))states.set(d.id,d.open);const r=props.apply(this,args);arrange();panel.scrollTop=scroll;return r;};
 const draw=drawOverlay;drawOverlay=function(...args){const r=draw(...args);sync();return r;};
 const css=document.createElement('style');css.textContent=`
 #propertiespanel[data-palette-selection="0"] #selection-filter,#propertiespanel[data-palette-selection="0"][data-palette-tool=active] #properties,#propertiespanel .palette093-inherited-color{display:none!important}
 #propertiespanel{scrollbar-gutter:stable;scroll-padding-top:88px}
 #propertiespanel>.palette093-header{position:sticky;top:0;z-index:6;display:flex;align-items:center;gap:8px;padding:11px 12px!important;min-height:52px;background:var(--panel);border-bottom:1px solid var(--border);font-size:0!important;letter-spacing:normal!important}
 .palette093-header>#count{display:none}.palette093-caption{display:flex;flex-direction:column;gap:4px;flex:1;min-width:0}.palette093-caption strong{font-size:13px;line-height:1.3;overflow-wrap:anywhere}.palette093-caption span{font-size:10px;font-weight:400;color:var(--muted);line-height:1.3}
 .palette093-header-actions{display:flex;gap:4px}.palette093-header-actions button{width:28px;height:28px;min-height:28px;padding:5px;border-radius:5px}.palette093-header-actions svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
 #propertiespanel>.palette093-note{padding:6px 12px!important;font-size:10px!important;font-weight:400;letter-spacing:normal;line-height:1.4;background:var(--bg);color:var(--muted);border-bottom:1px solid var(--border);margin:0}.palette093-note.palette093-locked{color:#efbc7c!important}.palette093-note[hidden]{display:none!important}
 #propertiespanel .panel{padding:10px 12px}#propertiespanel details.inspector-card{margin:8px 0;padding:9px 10px;border-radius:8px}#propertiespanel details>summary{font-size:12px;line-height:1.4;padding:6px 0;cursor:pointer}#propertiespanel details>summary:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
 #propertiespanel .row{display:grid;grid-template-columns:minmax(90px,42%) minmax(0,1fr);align-items:center;gap:8px;margin:8px 0;font-size:11px;line-height:1.4}#propertiespanel .row>span:first-child{min-width:0;overflow-wrap:anywhere}#propertiespanel .row>input:not([type=checkbox]):not([type=range]):not([type=color]),#propertiespanel .row>select{width:100%;min-width:0;box-sizing:border-box;min-height:30px}#propertiespanel select,#propertiespanel input[type=text],#propertiespanel input[type=number]{font-size:12px}#propertiespanel .new-layer-choice{display:flex;min-width:0;gap:4px}#propertiespanel .new-layer-choice select{min-width:0;flex:1;width:100%}#propertiespanel .new-layer-choice button{flex:0 0 28px;min-height:30px;padding:3px}
 #propertiespanel .numeric-stepper{height:30px!important;min-height:30px!important;min-width:0!important;width:100%}#propertiespanel .numeric-stepper>input{height:30px!important;min-height:0!important;box-sizing:border-box;width:100%}#propertiespanel .numeric-stepper-buttons{height:30px!important;display:grid!important;grid-template-rows:1fr 1fr!important;gap:0!important}#propertiespanel .numeric-stepper-buttons>button{height:15px!important;min-height:0!important;padding:0 4px!important;margin:0!important;line-height:1!important;font-size:8px}
 #propertiespanel .selection-editor{padding:10px!important;border:1px solid var(--border);border-radius:8px;background:var(--panel);margin:8px 0!important}#propertiespanel .selection-editor h2{font-size:12px!important;margin:0 0 10px!important;color:var(--accent)}#propertiespanel .property{font-size:11px;line-height:1.4;padding:6px 0;border-bottom:1px solid var(--border)}#propertiespanel .property b{font-weight:500;overflow-wrap:anywhere;text-align:right;min-width:0}
 #propertiespanel .palette093-disclosure{border:0;border-top:1px solid var(--border);padding:6px 0 0;margin:10px 0 0;background:transparent}#propertiespanel .palette093-disclosure summary{font-size:11px;color:var(--muted)}#propertiespanel .palette093-disclosure .selection-actions{display:grid;grid-template-columns:1fr;gap:5px;margin:7px 0}#propertiespanel .palette093-disclosure button{font-size:11px;min-height:30px;white-space:normal}
 #propertiespanel #selection-measurements{padding:10px;border-radius:8px;margin:0 0 8px}#propertiespanel #selection-measurements h3{font-size:12px;margin-bottom:8px}#propertiespanel #geometry09-editor{padding:0}#propertiespanel #geometry09-editor>strong{font-size:10px;color:var(--muted);font-weight:400}#propertiespanel .muted{font-size:11px;line-height:1.5}
 #propertiespanel .color-favorite-control{display:flex;flex-wrap:wrap;gap:4px;min-width:0;max-width:100%}#propertiespanel .color-favorite-control button{min-width:24px;min-height:26px;padding:3px}#propertiespanel .color-favorite-control input[type=color]{width:48px;min-width:36px;height:28px;padding:3px}#propertiespanel .selection-editor .row:has(#objectcolor){align-items:start}
 body[data-theme=light] #propertiespanel .palette093-locked{color:#8c5317!important}
 `;document.head.append(css);arrange();window.PropertyPalette093={arrange,sync};
})();
