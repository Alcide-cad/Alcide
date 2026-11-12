(()=>{
 const dialog=document.createElement('dialog');dialog.id='rebar-family-filter';dialog.innerHTML='<h2></h2><label>Affiner <select aria-label="Diamètre ou référence"></select></label><label><input type="checkbox"> Ajouter à la sélection actuelle</label><p>Les détails filants contenant un acier correspondant sont sélectionnés entiers. Les objets masqués ou verrouillés restent exclus.</p><p role="status"></p><button class="primary">Sélectionner</button> <button>Annuler</button>';dialog.style.cssText='width:min(500px,90vw);padding:22px;background:#20313d;color:#e0edf3;border:1px solid #7292a5;border-radius:10px';document.body.append(dialog);
 let context=null,preview=new Set(),picking=false,referenceValues=new Set();const select=dialog.querySelector('select'),add=dialog.querySelector('input'),apply=dialog.querySelector('button'),cancel=dialog.querySelectorAll('button')[1];
 const parts=e=>e.rebar?.model.linearSet?RebarLinearCore.parts(e.rebar.model):e.rebar?[e.rebar.model]:[];
 function found(){if(!context||context.doc!==activeId||context.token!==saveToken)return [];return [...entities.values()].filter(e=>visible(e)&&!isLocked(e)&&!edits[e.id]?.deleted&&parts(e).some(m=>m.kind===context.kind&&(!select.value||(select.value==='@references'?referenceValues.has(String(context.kind==='bar'?m.diameter:m.ref)):String(context.kind==='bar'?m.diameter:m.ref)===select.value)))).map(e=>e.id);}
 function update(){const ids=found();preview=new Set(ids);dialog.querySelector('[role=status]').textContent=ids.length+' représentation(s) correspondante(s).';apply.disabled=!ids.length;requestRender();}
 function open(kind){if(!scene||busy)return;window.FilterReferencePicker?.cancel();referenceValues.clear();context={kind,doc:activeId,token:saveToken,base:[...selected]};dialog.querySelector('h2').textContent=kind==='bar'?'Filtre armatures HA':'Filtre treillis soudés';select.replaceChildren(new Option(kind==='bar'?'Tous les diamètres HA':'Toutes les références TS',''));const values=[...new Set([...entities.values()].filter(e=>visible(e)&&!isLocked(e)).flatMap(parts).filter(m=>m.kind===kind).map(m=>kind==='bar'?m.diameter:m.ref))].sort((a,b)=>kind==='bar'?a-b:String(a).localeCompare(b));for(const v of values)select.append(new Option(kind==='bar'?'HA '+v:v,String(v)));add.checked=false;update();dialog.showModal();}
 select.onchange=update;apply.onclick=()=>{const ids=found();if(!ids.length)return;selected=new Set([...(add.checked?context.base:[]),...ids]);dialog.close();refresh(false);status(selected.size+' représentation(s) sélectionnée(s).');};cancel.onclick=()=>dialog.close();dialog.addEventListener('close',()=>{if(picking||dialog.open)return;preview.clear();context=null;requestRender();});
 const reference=document.createElement('button'),chips=document.createElement('div');
 reference.type='button';reference.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="m15 3 6 6-3 3-2-2-9 9H3v-4l9-9-2-2ZM5 16l3 3" fill="none" stroke="currentColor" stroke-width="1.7"/></svg> Prélever sur le plan';
 reference.title='Choisissez plusieurs références HA ou TS dans le dessin.';
 chips.className='rebar-filter-references';dialog.querySelector('h2').after(reference,chips);
 function renderReferences(){
  chips.replaceChildren();
  for(const value of referenceValues){
   const button=document.createElement('button');button.type='button';button.textContent=(context.kind==='bar'?'HA ':'')+value+' ×';
   button.onclick=()=>{referenceValues.delete(value);if(!referenceValues.size)select.value='';renderReferences();update();};
   chips.append(button);
  }
 }
 const change=select.onchange;select.onchange=()=>{if(select.value!=='@references')referenceValues.clear();renderReferences();change();};
 const originalOpen=open;open=function(...args){originalOpen(...args);renderReferences();};
 reference.onclick=()=>{
  if(!context||busy)return;
  picking=true;
  const prior=new Set(referenceValues),previous=select.value;
  if(select.value&&select.value!=='@references')referenceValues.add(select.value);
  window.FilterReferencePicker.start({
   dialog,label:context.kind==='bar'?'Références HA':'Références TS',
   valid:()=>context&&context.doc===activeId&&context.token===saveToken&&!busy,
   onPick(e){
    const values=parts(e).filter(m=>m.kind===context.kind).map(m=>String(context.kind==='bar'?m.diameter:m.ref));
    if(!values.length){status('Choisissez une armature de cette famille.');return false;}
    for(const value of values)referenceValues.add(value);
    if(![...select.options].some(o=>o.value==='@references'))select.append(new Option('Références prélevées','@references'));
    select.value='@references';renderReferences();update();return values.join(', ');
   },
   onCancel(){referenceValues=prior;select.value=previous;},
   onDone(){picking=false;if(context?.doc===activeId&&context.token===saveToken){dialog.showModal();renderReferences();update();}else{context=null;preview.clear();}}
  });
 };
 const style=document.createElement('style');style.textContent='.rebar-filter-references{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}.rebar-filter-references button{padding:5px 9px;border-radius:15px}#rebar-family-filter>button[type=button]{margin-bottom:10px}';document.head.append(style);
 const host=document.getElementById('selection-search-linetype-tool').parentElement;
 for(const [id,kind,label,path]of [['selection-filter-ha','bar','Filtre armatures HA','M3 12h18M5 8v8M19 8v8'],['selection-filter-ts','mesh','Filtre treillis soudés','M3 3h18v18H3zM9 3v18M15 3v18M3 9h18M3 15h18']]){const b=document.createElement('button');b.id=id;b.className='ribbon-button';b.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="'+path+'" fill="none" stroke="currentColor" stroke-width="1.6"/></svg><span>'+label+'</span>';b.title=label+' · sélection par famille, avec diamètre ou référence au choix';b.onclick=()=>open(kind);host.append(b);}
 window.RebarFamilyFilters={open,found};
})();
