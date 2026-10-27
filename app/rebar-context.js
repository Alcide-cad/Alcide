// Keep reinforcement actions tied to the active gesture or selected object.
(()=>{
 const menu=document.createElement('div');menu.id='rebar-context-menu';menu.hidden=true;document.body.append(menu);
 window.closeRebarContextMenu=()=>{const label=$('#rebar-label-menu');if(menu.hidden&&label.hidden)return false;menu.hidden=label.hidden=true;return true;};
 const css=document.createElement('style');css.textContent='#rebar-context-menu{position:fixed;z-index:15001;min-width:250px;max-width:350px;max-height:calc(100vh - 16px);overflow:auto;padding:7px;background:#20313d;border:1px solid #617e90;border-radius:8px;box-shadow:0 8px 24px #0008}#rebar-context-menu[hidden]{display:none}#rebar-context-menu button{display:block;width:100%;text-align:left;min-height:30px;margin:3px 0;font-size:12px}#rebar-context-menu strong{display:block;color:#b3e58c;padding:6px}#rebar-context-menu hr{margin:6px}';document.head.append(css);
 const command=(text,run)=>{const b=document.createElement('button');b.textContent=text;b.onclick=()=>{menu.hidden=true;run();};menu.append(b);return b;},source=(text,id)=>command(text,()=>$('#'+id).click()),divider=()=>menu.append(document.createElement('hr'));
 const settings=()=>{const panel=$('#rebar-dialog');panel.hidden=false;panel.classList.add('rebar-settings');},enter=()=>{overlay.focus();overlay.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));};
 window.addEventListener('contextmenu',ev=>{
  if(ev.target!==overlay||busy||!scene)return;
  const state=Reinforcement.context(),s=state.placing,label=RebarLabels.interaction(),table=RebarScheduleTable.placement?.(),hit=tool==='select'?pick(eventPoint(ev)):null;
  if(!s&&!label&&!state.converting&&!state.pickingLine&&!table){if(tool!=='select')return;if(hit&&!selected.has(hit.id)&&!hit.rebar&&!hit.reinforcementTable)return;if(!hit?.rebar&&!hit?.reinforcementTable&&![...selected].some(id=>entities.get(id)?.rebar||entities.get(id)?.reinforcementTable))return;if(hit&&!selected.has(hit.id))selected=new Set([hit.id]);if([...selected].some(id=>!entities.get(id)?.rebar&&!entities.get(id)?.reinforcementTable))return;}
  ev.preventDefault();ev.stopImmediatePropagation();hideMenu();$('#rebar-label-menu').hidden=true;menu.replaceChildren();const heading=document.createElement('strong');menu.append(heading);
  if(label){heading.textContent=label.mode==='leader'?'Dessiner un rappel avec coudes':label.mode==='anchor'?'Ajouter des rappels':'Placer le repère';if(label.mode==='leader'){if(label.points.length)command('Valider au dernier point cliqué · Entrée',()=>RebarLabels.finishLeader());if(label.points.length)command('Retirer le dernier point',()=>{label.points.pop();drawOverlay();});}command('Terminer le placement du repère',()=>{RebarLabels.cancel();overlay.focus();});command('Style du repère…',()=>{RebarLabels.cancel();RebarLabels.style();});}
  else if(table){heading.textContent='Placer le tableau des armatures';command('Quitter la pose du tableau',()=>{setTool('select');overlay.focus();});}
  else if(state.converting||state.pickingLine){heading.textContent='Transformer le tracé en armature';if(state.converting)source('Valider la conversion · Entrée','rebar-place');command('Paramètres de l’armature…',settings);source('Annuler la conversion','rebar-close');}
  else if(s){heading.textContent=s.model.kind==='mesh'?'Pose des treillis soudés':s.linked?'Autre représentation liée':s.presetLabel||'Tracer une armature';
   if(s.points.length&&['points','rectangle'].includes(s.mode)||s.mode==='polygon'&&s.points.length>=3)command(s.mode==='polygon'?'Terminer le contour · Entrée':'Poser à la position prévisualisée · Entrée',s.mode==='polygon'?()=>Reinforcement.finishContour():enter);
   if(s.points.length&&['points','rectangle','polygon'].includes(s.mode))command(s.mode==='rectangle'?'Saisir ΔX et ΔY…':'Saisir longueur et direction…',()=>{$('#rebar-point-entry').hidden=false;$('#rebar-entry-length').focus();$('#rebar-entry-length').select();});
   command('Paramètres de la pose…',settings);
   if(s.points.length)command(s.mode==='polygon'?'Retirer le dernier sommet':'Recommencer le point de départ',()=>{s.points.pop();for(const id of ['rebar-entry-length','rebar-entry-angle'])$('#'+id).value='';$('#rebar-point-entry').hidden=!s.points.length;drawOverlay();overlay.focus();});
   source('Terminer la pose · Échap','rebar-close');
  }else{
   const ids=[...selected],es=ids.map(id=>entities.get(id)),bars=es.filter(e=>e.rebar),unlocked=es.every(e=>!isLocked(e));
   if(es.length===1&&es[0].reinforcementTable){heading.textContent='Tableau récapitulatif des armatures';if(unlocked)command('Titre, pagination et taille…',()=>RebarScheduleTable.show(es[0].id));}
   else{const assemblies=new Set(bars.map(e=>e.rebar.view.assemblyId));heading.textContent=!bars.length?'Tableaux des armatures':assemblies.size===1?'Armature · position '+bars[0].rebar.model.position:'Armatures · '+assemblies.size+' positions';
    if(unlocked&&bars.length>=2&&window.RebarLabels?.groupSelected)command('Repérer ensemble · '+bars.length+' barres · Ctrl+Maj+G',()=>RebarLabels.groupSelected());
    if(bars.length===1)command('Reprendre cette armature',()=>Reinforcement.resume(bars[0].id));if(unlocked&&bars.length)command(assemblies.size===1?'Propriétés de cette position…':'Propriétés des positions sélectionnées…',()=>Reinforcement.show());if(unlocked&&assemblies.size===1){command('Ajouter une représentation liée',()=>{Reinforcement.show();$('#rebar-linked').click();});}
    if(unlocked&&bars.length){command('Placer le repère librement',()=>RebarLabels.start());command('Style des repères sélectionnés…',()=>RebarLabels.style());command('Sans rappel',()=>RebarLabels.noLeader());command('Dessiner un rappel avec coudes',()=>RebarLabels.start('leader'));command('Masquer les repères sélectionnés',()=>RebarLabels.hideSelected());}
    if(bars.length){const m=bars[0].rebar.model;command('Sélectionner les '+(m.kind==='bar'?'HA'+m.diameter:m.ref)+' similaires',()=>{selected=new Set([...entities.values()].filter(e=>e.rebar&&visible(e)&&e.rebar.model.kind===m.kind&&(m.kind==='bar'?e.rebar.model.diameter===m.diameter:e.rebar.model.ref===m.ref)).map(e=>e.id));refresh();});}
   }
   divider();if(unlocked){source('Déplacer · D','move');source('Copier · P','copy');if(bars.length)command('Étirer les armatures',()=>cadStart('stretch'));if(bars.length===es.length)source('Miroir · Y','core-mirror');command('Supprimer',deleteSelection);}
   command('Isoler le calque',()=>changeAllLayerVisibility(false,new Set(es.map(e=>e.layer))));if(layerVisibilityRestore.has(activeId))source('Rétablir les calques','layerrestorevisibility');
   divider();if(history.length)source('Annuler · Ctrl+Z','undo');if(!$('#redo').disabled)source('Rétablir · Ctrl+Y','redo');
  }
  if(!label&&!table&&!state.converting&&!state.pickingLine&&!s)window.enhanceSelectionContext093?.(menu);
  menu.hidden=false;menu.style.left=Math.max(8,Math.min(ev.clientX,innerWidth-menu.offsetWidth-8))+'px';menu.style.top=Math.max(8,Math.min(ev.clientY,innerHeight-menu.offsetHeight-8))+'px';
 },true);
 document.addEventListener('pointerdown',ev=>{if(!menu.contains(ev.target))menu.hidden=true;},true);window.addEventListener('keydown',ev=>{if(ev.key==='Escape')menu.hidden=true;});
})();
