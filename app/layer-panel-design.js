// Compact layer manager; existing controls and their handlers are preserved.
(()=>{
 const pane=$('#layerpanel'),header=pane.querySelector('.aside-title'),add=$('#new-layer-from-list');
 header.textContent='Calques';if(add){add.textContent='+ Nouveau';add.title='Créer un calque';add.setAttribute('aria-label','Créer un calque');header.append(add);}
 $('#layerfilter').setAttribute('aria-label','Rechercher un calque');
 const guide=$('.layer-column-guide');guide.textContent='Sélection · visibilité · couleur · calque · verrouillage';
 $('#newlayergroup').textContent='+ Groupe';$('#selectfilteredlayers').textContent='Tout cocher';$('#clearlayerselection').textContent='Effacer';$('#movetolayergroup').textContent='Ajouter';
 function polish(){
  for(const row of pane.querySelectorAll('.layer-card')){const lock=row.querySelector('.layer-lock');if(lock){const locked=layerSettings(row.dataset.layerName)?.locked;lock.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="3"/><path d="'+(locked?'M8 10V6a4 4 0 0 1 8 0v4':'M8 10V6a4 4 0 0 1 8 0')+'"/><path d="M12 14v3"/></svg>';lock.setAttribute('aria-pressed',String(!!locked));}const name=row.querySelector('.layer-name');if(name)name.title=row.dataset.layerName;}
  for(const input of pane.querySelectorAll('#layerweights,#layereditor input[type=checkbox]')){input.classList.add('layer-switch');input.setAttribute('role','switch');if(!input.getAttribute('aria-label'))input.setAttribute('aria-label',input.closest('label')?.textContent.trim()||'Épaisseurs de trait');}
  const chosen=groupedLayerSelection.size>0;for(const id of ['movetolayergroup','ungrouplayers','clearlayerselection']){const b=$('#'+id);b.disabled=b.disabled||!chosen;}$('#groupselectioncount').textContent=chosen?groupedLayerSelection.size+' calque(s) sélectionné(s)':'Cochez des calques pour les regrouper';
 }
 const render=layersUI;layersUI=function(){render();polish();};pane.addEventListener('change',ev=>{if(ev.target.matches('.layer-group-select')){for(const id of ['movetolayergroup','ungrouplayers','clearlayerselection'])$('#'+id).disabled=busy||!scene||!groupedLayerSelection.size;}});
 const css=document.createElement('style');css.textContent=`
 #layerpanel{background:#192630;scrollbar-width:thin;scrollbar-color:#506573 transparent}
 #layerpanel .aside-title{display:flex;align-items:center;justify-content:space-between;gap:10px;text-transform:none;font-size:15px;font-weight:650;letter-spacing:.2px;padding:12px 14px;min-height:48px;box-sizing:border-box;background:#233541}
 #layerpanel .aside-title button{width:auto;margin:0;padding:5px 10px;min-height:29px;font-size:12px;border-radius:7px;background:#314a58;border:1px solid #516b78}
 #layerpanel>section{padding:12px!important}#layerpanel button,#layerpanel select,#layerpanel input{box-sizing:border-box}
 #layerpanel #layerfilter{width:100%;height:34px;min-height:34px;font-size:12px;padding:7px 10px;margin:0 0 8px;border:1px solid #405563;border-radius:7px}
 #layerpanel .layer-tools{margin:0;padding:0;border:0}#layerpanel details>summary{font-size:12px;line-height:1.5;padding:7px 4px;font-weight:600;outline-offset:1px}
 #layerpanel .layer-visibility-actions{display:flex;flex-wrap:wrap;gap:5px;margin:4px 0}#layerpanel .layer-visibility-actions button{font-size:11px;min-height:28px;padding:4px 7px}
 #layervisibilityinfo{display:block;font-size:11px;line-height:1.5;margin:5px 0 9px;color:#9fb5c4}
 #layerpanel .layer-grouping-fold{border:0;margin:0 0 8px;padding:0;background:transparent}#layerpanel .layer-grouping{padding:6px 0;margin:0;border:0}
 #layerpanel .group-toolbar{display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;margin:0 0 6px}#layerpanel .group-toolbar button,#layerpanel .group-destination button{font-size:11px;padding:5px 6px;min-height:28px;white-space:nowrap}
 #layerpanel .group-destination{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:5px;align-items:center;margin:0 0 6px}#layerpanel .group-destination select{width:100%;min-width:0;height:30px;font-size:11px;padding:4px}
 #groupselectioncount{display:block;font-size:10px;line-height:1.5;margin:4px 0;color:#9fb5c4}#layerpanel .layer-column-guide{display:none}
 #layerpanel .layer-weight-toggle{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-direction:row-reverse;font-size:11px;margin:8px 0 12px;padding:8px 0;border:0;color:#b9cad6}
 #layerpanel .layer-switch{appearance:none!important;flex:0 0 32px;width:32px!important;height:18px!important;min-height:18px!important;padding:0!important;border:1px solid #627887!important;background:#384c59;border-radius:20px!important;position:relative;margin:0;cursor:pointer}
 #layerpanel .layer-switch:before{content:'';display:block;position:absolute;left:2px;top:2px;width:12px;height:12px;border-radius:50%;background:#dce7ee;transition:transform .15s}
 #layerpanel .layer-switch:checked{background:#a9d47c;border-color:#a9d47c!important}#layerpanel .layer-switch:checked:before{transform:translateX(14px);background:#203129}
 #layerpanel #layers{max-height:none;overflow:visible}#layerpanel .layer-group{padding:4px;margin:0 0 8px;border:1px solid #344a58;border-radius:8px;background:#1b2b35}
 #layerpanel .layer-card{display:grid;grid-template-columns:16px 26px 24px minmax(0,1fr) 26px 25px;gap:5px;padding:5px 4px;min-height:38px;border:1px solid transparent;border-radius:6px;box-shadow:none}
 #layerpanel .layer-card.active{background:#2a424f;border-color:#7da94e}#layerpanel .layer-card.selection-layer{box-shadow:inset 3px 0 #80caff;border-color:#80caff;outline:0}
 #layerpanel .layer-card .layer-name{background:transparent;border:0;padding:3px 1px;box-shadow:none;font-size:12px;min-height:26px;border-radius:0;color:#dce7ee}
 #layerpanel .layer-card input[type=checkbox]{width:14px;height:14px;accent-color:#afd980}#layerpanel .layer-card .layer-meta{grid-column:auto;font-size:10px;text-align:right;margin:0;overflow:hidden}
 #layerpanel .layer-visibility,#layerpanel .layer-lock{width:26px;height:26px;min-height:26px;border:0;border-radius:5px;padding:4px;background:transparent;box-shadow:none;color:#a8c68d}
 #layerpanel .layer-lock{color:#9db0bd}#layerpanel .layer-lock[aria-pressed=true]{color:#ffc978}#layerpanel .layer-lock svg,#layerpanel .layer-visibility svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.7}
 #layerpanel .layer-card input[type=color]{width:24px;height:24px;padding:3px;border-radius:5px}
 #layerpanel .layer-properties{padding:10px;margin-top:12px;border:1px solid #405563;border-radius:9px;background:#21323e}#layerpanel .layer-properties summary{font-size:12px;margin-bottom:7px;padding:2px 0;overflow-wrap:anywhere}
 #layerpanel .layer-properties .row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:9px 0;font-size:12px;min-height:28px}
 #layerpanel .layer-properties .row>span:first-child{flex:0 0 85px}#layerpanel .layer-properties .row select,#layerpanel .layer-properties .row input[type=number]{width:140px;min-width:0;height:30px;min-height:30px;font-size:12px;padding:4px 6px}
 #layerpanel .layer-properties input[type=text]{height:31px;font-size:12px;padding:5px 7px}#layerpanel .layer-properties .muted{font-size:10px;line-height:1.5;margin-bottom:0}#layerpanel .layer-properties button{font-size:11px;min-height:27px;padding:4px 6px}
 #layerpanel button:focus-visible,#layerpanel input:focus-visible,#layerpanel select:focus-visible,#layerpanel summary:focus-visible{outline:2px solid #80caff;outline-offset:2px}#layerpanel button:disabled{opacity:.45}
 `;document.head.append(css);polish();
})();
