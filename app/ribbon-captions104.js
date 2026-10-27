// Noms courts sous chaque icône ; le nom complet et la description restent dans l’infobulle.
(()=>{
 const short={
 'rebar-label-place-ribbon':'Placer repère','rebar-label-arrow-ribbon':'Flèche repère','rebar-label-group-ribbon':'Repérer ensemble','rebar-distribution100-tool':'Cote repérage','rebar-label-none-ribbon':'Sans repère','rebar-label-style-ribbon':'Style repère','rebar-compact-ribbon':'Compacter',
 'rebar-new-hooked':'Avec crosses','rebar-new-epingle':'Épingle 180°','rebar-new-octagon':'Octogone','rebar-cerce':'Cerce','rebar-new-point':'Barre en point','rebar-new-mesh':'Treillis soudés',
 'rebar-linear-tool-main':'Filants','filant-new-detail-ribbon':'Nouveau détail','rebar-convert-line-ribbon':'Tracé → acier','rebar-panel-toggle':'Réglages pose','rebar-stretch':'Étirer aciers','rebar-cover-ribbon':'Enrobage','rebar-colours-ribbon':'Couleurs',
 'rebar-edit-hooks':'Crosses','rebar-remove-hooks':'Ôter crosses','rebar-add-segment':'Ajouter segment','rebar-remove-segment':'Ôter segment','rebar-table-ribbon':'Poser tableau','rebar-rounding-tool':'Arrondis','mesh-stock-tool':'Stocks / chutes','mesh09-tool':'Calepinage','rebar-ec2-tool':'Contrôles EC2','rebar-overlap-review':'Superposés',
 'object-scale-tool':'Échelle','add-vertex-tool':'Sommet','offsetobjects':'Décaler','cutbetweenobjects':'Couper entre 2','style-eyedropper-tool':'Pipette','drawing-style-button':'Style dessin','matchproperties':'Reprendre style',
 'screen-display-open':'Représentation','construction-aid-mode':'Dessiner aide','construction-aid-in':'Passer en aide','construction-aid-out':'Dessin normal','construction-aid-visible':'Voir les aides','display-show-all':'Réafficher tout','display-refresh-view':'Actualiser',
 'ribbon-chain-create':'Créer chaîne','ribbon-chain-position':'Placer chaîne','ribbon-chain-add':'Ajouter point','ribbon-chain-remove':'Retirer point','ribbon-dimension-style':'Style cotes','dimension-eyedropper-tool':'Pipette','scale-tool':'Échelle cotes',
 'selection-search-tool':'Filtres avancés','selection-search-layer-tool':'Filtre calque','selection-search-color-tool':'Filtre couleur','selection-search-linetype-tool':'Filtre trait','selection-filter-ha':'Filtre HA','selection-filter-ts':'Filtre TS','similar-settings-tool':'Similaires',
 'drawing-remove-duplicates':'Doublons','compatibility-diagnostic-button':'Diagnostic','recovery09-tool':'Récupération','ribbon-accueil-isolation-settings':'Isolation','ribbon-accueil-unisolate':'Tout réafficher','ribbon-accueil-isolate':'Isoler'
 };
 for(const b of document.querySelectorAll('#ribboncontent button:not(.rf-toggle)')){const label=b.querySelector(':scope>.tool-label');if(!label)continue;const key=b.dataset.commandTarget||b.id.replace(/^home-/,'');label.textContent=short[b.id]||short[key]||b.dataset.ribbonTitle103||label.textContent;b.classList.add('ribbon104-captioned');}
 const scope='#ribbon #ribboncontent.ribbon103 :is(#ribbon-armatures,#ribbon-accueil,#ribbon-dessin,#ribbon-mesures,#ribbon-selection,#ribbon-affichage,#ribbon-outils,#ribbon-fichier)';
 for(const g of document.querySelectorAll('#ribbon-armatures .rebar-shapes-group')){g.style.removeProperty('width');g.style.removeProperty('max-width');}for(const id of ['rebar-linear-tool-main','filant-new-detail-ribbon'])document.getElementById(id)?.style.setProperty('flex-direction','column','important');
 const style=document.createElement('style');style.textContent=`
 #ribbon #ribboncontent.ribbon103{height:96px!important;min-height:96px!important;max-height:96px!important}
 #ribbon #ribboncontent.ribbon103 .ribbon-page{height:96px!important;min-height:96px!important;max-height:96px!important;box-sizing:border-box!important;padding-top:3px!important;padding-bottom:3px!important}
 ${scope} .ribbon-group:not(.rf-collapsed)>:is(.ribbon-tools,.rebar-command-tools){grid-template-rows:repeat(2,32px)!important;grid-auto-columns:80px!important;gap:2px!important;height:66px!important;min-height:66px!important;max-height:66px!important}
 ${scope} .ribbon-group:not(.rf-collapsed)>:is(.ribbon-tools,.rebar-command-tools)>button.ribbon104-captioned{width:80px!important;min-width:80px!important;max-width:80px!important;height:32px!important;min-height:32px!important;max-height:32px!important;flex-direction:column!important;gap:1px!important;padding:1px 2px!important}
 ${scope} .ribbon-group:not(.rf-collapsed)>:is(.ribbon-tools,.rebar-command-tools)>button.ribbon104-captioned>.tool-label{position:static!important;display:block!important;clip-path:none!important;clip:auto!important;width:100%!important;max-width:100%!important;height:12px!important;min-height:12px!important;margin:0!important;padding:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;font-size:10px!important;font-weight:400!important;line-height:12px!important;text-align:center!important;color:var(--text)!important}
 ${scope} .ribbon-group:not(.rf-collapsed)>:is(.ribbon-tools,.rebar-command-tools)>button.ribbon104-captioned :is(svg,.ribbon-icon){width:17px!important;min-width:17px!important;height:17px!important;flex:0 0 17px!important;font-size:17px!important}
 ${scope} .ribbon-group.rf-collapsed>.rf-toggle{height:66px!important;display:flex!important}
 ${scope} .rebar-shapes-group:not(.rf-collapsed){width:max-content!important;max-width:none!important}
 ${scope} .rebar-shapes-group.rf-collapsed{width:auto!important;max-width:50px!important}
 ${scope} .ribbon-group>small{line-height:12px!important}
 #ribbon #ribboncontent.ribbon103 #ribbon-affichage label.ribbon104-setting{height:32px!important}
 @media(max-width:800px){
 ${scope} .ribbon-group.rf-collapsed{max-width:50px!important;padding-right:4px!important}
 ${scope} .ribbon-group.rf-collapsed>small{max-width:44px!important}
 }
 @media(max-width:1000px){
 ${scope} .ribbon-group:not(.rf-collapsed)>:is(.ribbon-tools,.rebar-command-tools){grid-auto-columns:68px!important}
 ${scope} .ribbon-group:not(.rf-collapsed)>:is(.ribbon-tools,.rebar-command-tools)>button.ribbon104-captioned{width:68px!important;min-width:68px!important;max-width:68px!important}
 ${scope} .ribbon-group:not(.rf-collapsed)>:is(.ribbon-tools,.rebar-command-tools)>button.ribbon104-captioned>.tool-label{font-size:9px!important}
 }
 `;document.head.append(style);
 function fit(){if(innerWidth<=850)for(const page of document.querySelectorAll('#ribboncontent .ribbon-page')){const groups=[...page.querySelectorAll(':scope>.ribbon-group')];groups.forEach((g,i)=>g.dataset.ribbonPinned=String(i===0));}for(const g of document.querySelectorAll('#ribbon-armatures>.ribbon-group'))g.dataset.ribbonPinned=String(innerWidth>1100&&['Dessiner un acier','Éléments BA'].includes(g.querySelector(':scope>small')?.textContent));if(innerWidth<=700)for(const g of document.querySelectorAll('#ribboncontent .ribbon-group'))g.dataset.ribbonPinned='false';window.RibbonFit?.fit();}
 window.addEventListener('load',()=>setTimeout(fit,10),{once:true});window.addEventListener('resize',()=>requestAnimationFrame(fit));fit();
})();
