// Keep the frequently used editing commands visible, and remove the legacy duplicate.
(()=>{
 const scale=document.getElementById('object-scale-tool'),modify=document.querySelector('#ribbon-dessin [data-pro-panel="Modifier"]');
 if(scale&&modify){const old=scale.closest('.ribbon-group');modify.querySelector('.ribbon-tools').prepend(scale);scale.classList.add('ribbon-featured');modify.dataset.ribbonPinned='true';if(old&&!old.querySelector('button:not(.rf-toggle)'))old.remove();}
 const duplicate=document.getElementById('rebar-linear-tool');
 if(duplicate){const group=duplicate.closest('.ribbon-group'),storage=document.createElement('div');storage.hidden=true;storage.append(duplicate);document.body.append(storage);if(group&&!group.querySelector('button:not(.rf-toggle)'))group.remove();}
 const toggle=document.getElementById('rebar-panel-toggle');
 if(toggle){const label=toggle.querySelector('.tool-label,span');if(label)label.textContent='Réglages de pose';else toggle.textContent='Réglages de pose';toggle.dataset.fullTooltip='Afficher ou masquer les réglages de l’armature en cours, sans annuler sa pose.';toggle.setAttribute('aria-label','Réglages de pose');}
 const group=document.getElementById('rebar-properties')?.closest('.ribbon-group');if(group){group.dataset.ribbonPinned='true';group.id='rebar-modifier-visible';}
 const css=document.createElement('style');css.textContent='#ribbon-armatures #rebar-modifier-visible>.rebar-command-tools{grid-template-columns:repeat(2,154px)!important;grid-template-rows:repeat(3,21px)!important;grid-auto-flow:column!important}#ribboncontent #ribbon-armatures #rebar-modifier-visible button{width:154px!important;min-width:0!important}#ribbon-armatures #rebar-modifier-visible .tool-label{white-space:nowrap;-webkit-line-clamp:1}';document.head.append(css);
 window.RibbonFit?.fit();
})();


