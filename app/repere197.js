// 1.0.97 · Numéroter : option « Sans flèche » visible dans la boîte Numérotation (mémorisée) et flèche
// ajoutée / retirée sur un repère existant depuis Propriétés.
(()=>{
 const KEY='numberNoLeader197',get=()=>localStorage.getItem(KEY)==='true';
 const box=document.getElementById('numbernoleader'),seq=document.getElementById('numbercallouts');
 const toggle=document.createElement('button');toggle.type='button';toggle.id='numbernoleader-toggle';toggle.className='ui-button';toggle.textContent='Sans flèche';toggle.title='Numérotation : poser le repère seul, sans flèche de repérage (mémorisé)';
 function sync(){const v=get();if(box)box.checked=v;toggle.setAttribute('aria-pressed',String(v));toggle.classList.toggle('active',v);if(typeof reperePlacement!=='undefined'&&reperePlacement?.numbering){reperePlacement.noLeader=v;}}
 window.syncNoLeader197=sync;
 toggle.onclick=()=>{localStorage.setItem(KEY,String(!get()));sync();if(typeof reperePlacement!=='undefined'&&reperePlacement?.numbering){reperePlacement.anchor=null;status(get()?'Sans flèche : cliquez la position de chaque repère · Échap termine.':'Cliquez la cible du repère, puis la position de son texte · Échap termine.');}};
 void seq;box?.addEventListener('change',()=>{localStorage.setItem(KEY,String(box.checked));sync();});
 const dlg=document.getElementById('numberdialog');if(dlg){const show=dlg.showModal.bind(dlg);dlg.showModal=()=>{sync();show();};}
 sync();
 // Propriétés : flèche de repérage d'un repère (texte annoté) existant.
 const target=document.getElementById('drawing-style-target');
 const row=document.createElement('div');row.id='repere197-props';row.hidden=true;row.innerHTML='<label class="row">Flèche de repérage<input id="repere197-leader" type="checkbox"></label>';
 target?.after(row);const cb=row.querySelector('input');
 const marks=()=>[...selected].filter(id=>{const a=edits[id]?.annotation;return a&&!edits[id].deleted&&!a.level&&!a.axis&&!a.positionMark100&&!a.distributionNumber100&&!edits[id].positionLabel100;});
 function update(){const ids=marks();row.hidden=!ids.length;if(!ids.length)return;const has=ids.map(id=>!!edits[id].annotation.leader);cb.checked=has.every(Boolean);cb.indeterminate=!has.every(v=>v===has[0]);cb.title=cb.indeterminate?'varié':'';}
 cb.addEventListener('change',()=>{const ids=marks();if(!ids.length)return;if(!cb.checked){const before=snapshot();for(const id of ids)edits[id]={...edits[id],annotation:{...edits[id].annotation,leader:null}};commit(before);status(ids.length+' repère(s) sans flèche · Ctrl+Z annule.');return;}
  const missing=ids.filter(id=>!edits[id].annotation.leader);if(missing.length!==1){cb.checked=false;update();status('Sélectionnez un seul repère sans flèche pour lui en ajouter une.');return;}
  reperePlacement={editing:missing[0],frame:!!edits[missing[0]].annotation.frame};status('Cliquez la cible de la flèche du repère.');});
 const r=refresh;refresh=function(...a){const out=r.apply(this,a);try{update();}catch{}return out;};
 window.Repere197={update,sync};
})();
