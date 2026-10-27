// The original selection remains available while the active subset drives every tool.
(()=>{
 let state=null,expected=null,context=null;
 const panel=document.createElement('section');panel.id='selection-filter';panel.className='panel';panel.hidden=true;
 $('#properties').before(panel);
 const key=e=>['TEXT','MTEXT'].includes(e.type)?'TEXT':e.type;
 const names={TEXT:'Textes',DIMENSION:'Cotes',LINE:'Lignes',LWPOLYLINE:'Polylignes',POLYLINE:'Polylignes 3D',HATCH:'Hachures',INSERT:'Blocs',CIRCLE:'Cercles',ARC:'Arcs',LEVEL:'Niveaux',AXIS:'Axes'};
 const same=(a,b)=>a.size===b.size&&[...a].every(id=>b.has(id));
 const usable=id=>{const e=entities.get(id);return e&&e.layout===scene?.layout&&visible(e)&&!edits[id]?.deleted;};
 function origin(){return (state?.ids||[]).filter(usable).map(id=>entities.get(id));}
 function apply(){if(!state)return;selected=new Set(origin().filter(e=>(state.types===null||state.types.has(key(e)))&&(state.layers===null||state.layers.has(e.layer))).map(e=>e.id));expected=new Set(selected);}
 function sync(){const ctx=activeId+'|'+scene?.layout;if(context!==ctx){state=null;expected=null;context=ctx;}const validExpected=new Set([...(expected||[])].filter(usable));if(!expected||!same(selected,validExpected)){
   state=selected.size>1?{ids:[...selected],types:null,layers:null}:null;expected=new Set(selected);
   if(state)setPanelVisible(true);
  }else if(state)apply();}
 function toggle(field,value){if(!state||busy)return;const set=state[field]===null?new Set():new Set(state[field]);set.has(value)?set.delete(value):set.add(value);state[field]=set;apply();refresh(false);status(selected.size+' objet(s) retenu(s) sur '+origin().length+' · modifications limitées à la sélection filtrée.');}
 function render(){panel.hidden=!state;if(!state)return;panel.replaceChildren();const source=origin(),heading=document.createElement('h2');heading.textContent='Filtrer la sélection';const count=document.createElement('p');count.className='muted';count.textContent=selected.size+' / '+source.length+' objets retenus';const reset=document.createElement('button');reset.id='selection-filter-reset';reset.textContent='Tout reprendre';reset.disabled=busy||state.types===null&&state.layers===null;reset.onclick=()=>{state.types=null;state.layers=null;apply();refresh(false);status('Sélection initiale reprise : '+selected.size+' objet(s).');};panel.append(heading,count,reset);
  function choices(field,label,es,get){const title=document.createElement('h3');title.textContent=label;const group=document.createElement('div');group.className='selection-filter-choices';group.setAttribute('aria-label',label);const counts=new Map();for(const e of es){const v=get(e);counts.set(v,(counts.get(v)||0)+1);}for(const [v,n] of [...counts].sort((a,b)=>String(a[0]).localeCompare(String(b[0]),'fr',{numeric:true}))){const button=document.createElement('button');button.type='button';button.dataset.filter=field;button.dataset.value=v;button.textContent=(field==='types'?(names[v]||objectLabel(v)):v)+' · '+n;button.setAttribute('aria-pressed',String(state[field]===null||state[field].has(v)));button.disabled=busy;button.onclick=()=>toggle(field,v);group.append(button);}panel.append(title,group);}
  choices('types','Types d’objets',source,key);
  const details=document.createElement('details');details.open=state.layers!==null;const summary=document.createElement('summary');summary.textContent='Affiner par calque';details.append(summary);const holder=document.createElement('div');panel.append(holder);const before=panel.children.length;choices('layers','Calques',source.filter(e=>state.types===null||state.types.has(key(e))),e=>e.layer);for(const el of [...panel.children].slice(before))details.append(el);holder.replaceWith(details);
  const help=document.createElement('p');help.className='muted';help.textContent='Filtres cumulables · modifications ciblées';help.title='Cliquez un type pour le cibler, puis ajoutez d’autres types. Types et calques se combinent. Tout reprendre conserve les objets encore visibles et présents.';panel.append(help);
  if(!selected.size){const empty=document.createElement('p');empty.textContent='Aucun objet ne correspond aux filtres. Ajoutez un type ou reprenez tout.';panel.append(empty);}
 }
 const props=propertiesUI;propertiesUI=function(){sync();props();render();};
 overlay.addEventListener('pointerdown',ev=>{if(ev.button===0&&!ev.altKey&&tool==='select'&&!annotationMode&&!activeGrip&&!dimensionLineMove&&!pendingObjectAction&&!pendingTransformSelection){state=null;expected=null;panel.hidden=true;}});
 document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&!document.querySelector('dialog[open]:not(#helpdialog):not(#detail-library)')){state=null;expected=null;panel.hidden=true;}});
 const style=document.createElement('style');style.textContent='#selection-filter h3{font-size:13px;margin:12px 0 6px}#selection-filter p{margin:8px 0} .selection-filter-choices{display:flex;gap:6px;flex-wrap:wrap;max-height:220px;overflow:auto}.selection-filter-choices button{font-size:13px;padding:6px 9px}.selection-filter-choices button[aria-pressed="true"]{border-color:#a9df80;background:#31463c}#selection-filter summary{cursor:pointer;margin-top:12px}';document.head.append(style);
})();
