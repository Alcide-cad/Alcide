// Correctifs issus de l'audit des parcours : champs lisibles, focus et découverte.
(()=>{
 const css=document.createElement('style');css.textContent=`
 #toolquickbar>label,#toolquickbar .selection-actions,#toolquickbar .numeric-stepper{flex-shrink:0}
 #toolquickbar .numeric-stepper{flex:0 0 88px;width:88px;min-width:88px;max-width:88px}
 #toolquickbar .numeric-stepper>input{min-width:54px;width:60px;flex:1 1 auto}
 #toolquickbar .numeric-stepper{height:28px!important;align-self:center}
 #toolquickbar .numeric-stepper>input{height:28px!important;min-height:28px!important;box-sizing:border-box;font-size:12px;padding:3px 6px}
 #toolquickbar .numeric-stepper-buttons{flex:0 0 20px!important;width:20px;height:28px;display:grid!important;grid-template-rows:14px 14px}
 #toolquickbar .numeric-stepper-buttons>button{width:20px!important;min-width:20px!important;max-width:20px!important;height:14px!important;min-height:14px!important;max-height:14px!important;display:flex;align-items:center;justify-content:center;padding:0!important;font-size:10px!important;line-height:10px!important}

 #toolquickbar .selection-actions{flex-wrap:nowrap;margin-top:0;align-items:center}
 #toolquickbar .selection-actions>button{flex:0 0 auto}
 #propertiespanel #properties{padding:10px 12px}
 #propertiespanel .property b{max-width:60%;overflow-wrap:anywhere}
 #propertiespanel>.inspector-card{margin:8px 10px}
 #propertiespanel .row{min-width:0}
 #propertiespanel .row>*{min-width:0}
 #propertiespanel{container-type:inline-size}
 @container (max-width:280px){
  #propertiespanel .row,#propertiespanel .inspector-card .row,#propertiespanel .selection-editor .row{display:flex;flex-direction:column;align-items:stretch;gap:5px}
  #propertiespanel .row>.numeric-stepper,#propertiespanel .row>select,#propertiespanel .row>input:not([type=checkbox]){width:100%}
  #propertiespanel .row input[type=checkbox]{align-self:flex-end}
 }
 #propertiespanel .color-favorite-control{max-width:100%;min-width:0}
 #propertiespanel .color-favorite-swatches{flex-wrap:wrap;max-width:100%}
 #propertiespanel .selection-actions{gap:6px}
 #propertiespanel .selection-actions>button{white-space:normal;line-height:1.35}
 #propertiespanel button{max-width:100%;white-space:normal;overflow-wrap:anywhere}
 #propertiespanel summary{line-height:1.4}
 input[aria-invalid=true]{border-color:#f5a17b!important;box-shadow:0 0 0 1px #f5a17b66}
 button:focus-visible,select:focus-visible,summary:focus-visible{outline:2px solid #9bc9ef;outline-offset:2px}
 #arrange-info{line-height:1.5;white-space:normal}
 `;document.head.append(css);
 const statusNode=$('#status');statusNode.setAttribute('role','status');statusNode.setAttribute('aria-live','polite');statusNode.setAttribute('aria-atomic','true');
 function statusTip(){statusNode.title=statusNode.textContent;}
 statusTip();new MutationObserver(statusTip).observe(statusNode,{childList:true,subtree:true,characterData:true});
 function shortcuts(){for(const b of document.querySelectorAll('#ribboncontent .ribbon-tools button[id],.ribbon-quick-access button[id]')){
  const base=b.dataset.uxTooltipBase||b.dataset.fullTooltip||b.title||b.getAttribute('aria-label')||b.textContent.trim();if(!b.dataset.uxTooltipBase)b.dataset.uxTooltipBase=base;
  const label=window.toolShortcutLabel?.(b.dataset.commandTarget||b.id)||'',key=window.toolShortcutKey?.(b.dataset.commandTarget||b.id)||'',text=base+(label?' · Raccourci : '+label:'')+' · Clic droit : personnaliser le raccourci';
  if(b.dataset.fullTooltip!==text)b.dataset.fullTooltip=text;
  if(key){const aria=key.replace('Ctrl','Control');if(b.getAttribute('aria-keyshortcuts')!==aria)b.setAttribute('aria-keyshortcuts',aria);}else if(b.hasAttribute('aria-keyshortcuts'))b.removeAttribute('aria-keyshortcuts');
  const pressed=String(b.classList.contains('active'));if(b.getAttribute('aria-pressed')!==pressed)b.setAttribute('aria-pressed',pressed);
 }}
 shortcuts();window.addEventListener('tool-shortcuts-changed',shortcuts);new MutationObserver(shortcuts).observe($('#ribboncontent'),{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
 registerHelpTopic('Repères et ergonomie du dessin',[Object.assign(document.createElement('p'),{textContent:'Affichage → Grille et accrochages : activez les accrochages et les repères au survol. Maintenez le curseur environ 300 ms sur une extrémité, un milieu, une intersection ou un segment droit ; une croix mémorise le repère. Les guides proposent l’alignement X/Y, le prolongement et les directions parallèles ou perpendiculaires. Le délai se règle dans ce même panneau. Échap efface les repères. Le survol des boutons du ruban affiche leur fonction et le raccourci actuellement affecté ; le clic droit permet de le personnaliser. Les messages tronqués en bas sont lisibles entièrement au survol.'})]);
})();
