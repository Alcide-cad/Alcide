/* 1.0.88 · Fonctions visibles dans le ruban :
   - Dessin → Remplir → « Dégradé » (applique au contour sélectionné, sinon remplir au clic dans un contour fermé) ;
   - Dessin → Ajuster → « Joindre » (joindre en polyligne, aussi dans le clic droit) ;
   - Annotations → Mesurer → « Mesure rapide » avec pictogramme et libellé complet. */
(()=>{
 const svg=(inner,extra='')=>'<svg class="tool-pictogram" viewBox="0 0 24 24" aria-hidden="true"'+extra+'>'+inner+'</svg>';
 function make(id,label,icon,tip){const b=document.createElement('button');b.id=id;b.type='button';b.className='ribbon-button uniform-tool ui-button ribbon-featured ribbon104-captioned';b.innerHTML=icon+'<span class="tool-label"></span>';b.lastChild.textContent=label;b.setAttribute('aria-label',label);b.title=tip;b.dataset.fullTooltip=tip;return b;}
 const cleaner = make('allplan-folder-cleaner','Nettoyeur de fond de plans',
  svg('<path d="M3 7h6l2 2h10v10H3z M6 14h4v3 M13 12v5h5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>'),
  'Choisir un dossier de DWG architecte et générer les fonds Allplan avec les impacts');
 cleaner.onclick = () => window.alcide.generateAllplanFolder(activeId).catch(error => status(error.message));
 const group = document.createElement('div');
 group.className = 'ribbon-group';
 group.innerHTML = '<div class="ribbon-tools"></div><small>Allplan</small>';
 cleaner.querySelector('.tool-label').replaceChildren('Nettoyeur de', document.createElement('br'), 'fond de plans');
 group.id = 'home-plan-actions';
 group.lastElementChild.textContent = 'Fond de plan';
 const planTools = ['home-move', 'home-rotate-objects', 'home-dimension'].map(id => document.getElementById(id));
 group.firstElementChild.append(cleaner, ...planTools);
 document.getElementById('ribbon-accueil').prepend(group);
 // Dégradé
 const fill=$('#fill-by-contour')||$('#bucket-fill-zone');
 if(fill&&window.Gradient187?.ui&&!$('#gradient-fill188')){
  const icon=svg('<defs><linearGradient id="gradient188-icon" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#7fb3e6"/><stop offset=".55" stop-color="#b2d893"/><stop offset="1" stop-color="#b2d893" stop-opacity=".08"/></linearGradient></defs><rect x="3" y="5" width="18" height="14" rx="1.5" style="fill:url(#gradient188-icon);stroke:currentColor"/>');
  const b=make('gradient-fill188','Dégradé',icon,'Dégradé · sélectionnez un contour fermé (rectangle, polyligne…) ou cliquez à l’intérieur d’un contour · 5 types, 2 couleurs (⇄), transparence, angle dans le panneau');
  b.onclick=()=>{if(!scene||busy)return;const ui=window.Gradient187.ui;if(hatchTargets().length){const s=$('#hatchsettings');const panel=$('#hatch-properties');if(!(panel&&panel.offsetParent&&panel.open))s?.click();ui.activate();window.requestLiveHatch?.('hatch-pattern');status('Dégradé appliqué à la sélection · réglez type, couleurs, transparence et angle dans la carte Dégradé · Ctrl+Z annule.');}
   else{$('#bucket-fill-zone')?.click();ui.activate();try{drawingSaveStyle();}catch{}status('Dégradé : cliquez à l’intérieur d’un contour fermé · ou sélectionnez un rectangle / une polyligne fermée · Échap termine.');}
   ui.layout();const card=$('#hatch-card-gradient');if(card){card.open=true;requestAnimationFrame(()=>{window.ScrollGuard189?.release();card.scrollIntoView({block:'nearest'});});}drawOverlay();};
  fill.after(b);
  const draw=drawOverlay;drawOverlay=function(...a){const r=draw.apply(this,a);b.disabled=!scene||busy;b.classList.toggle('active',!!window.bucketFillActive&&$('#hatch-pattern').value==='GRADIENT');return r;};
 }
 // Joindre en polyligne
 const join=$('#joinlines');
 if(join&&window.JoinPolyline187&&!$('#join-polyline188')){
  const b=make('join-polyline188','Joindre',svg('<path d="M4 18V6h8M12 6l8 6-8 6H4" fill="none"/><circle cx="12" cy="6" r="1.6"/><circle cx="12" cy="18" r="1.6"/>'),'Joindre en polyligne · sélectionnez au moins 2 lignes, arcs ou polylignes qui se touchent bout à bout · un contour fermé donne une polyligne fermée · aussi dans le clic droit');
  b.onclick=()=>{if(!scene||busy)return;window.JoinPolyline187.joinSelection();};join.after(b);
  const draw=drawOverlay;drawOverlay=function(...a){const r=draw.apply(this,a);let n=0;try{for(const id of selected){const e=entities.get(id);if(e&&window.JoinPolyline187.eligible(e))n++;if(n>1)break;}}catch{}b.disabled=!scene||busy||n<2;return r;};
 }
 // Mesure rapide : pictogramme + libellé
 const q=$('#quick-measure187');
 if(q&&!q.querySelector('svg')){q.innerHTML=svg('<path d="M3 12h18M3 9v6M21 9v6M12 3v18M9 3h6M9 21h6" fill="none"/>')+'<span class="tool-label">Mesure rapide</span>';q.setAttribute('aria-label','Mesure rapide');q.dataset.fullTooltip='Mesure rapide (comme MESUREGEOM Rapide d’AutoCAD) · survolez le dessin : distances horizontale et verticale aux bords voisins · Échap ou clic droit pour quitter';}
 const css=document.createElement('style');css.textContent='#quick-measure187 .tool-label,#gradient-fill188 .tool-label,#join-polyline188 .tool-label{white-space:normal;overflow:visible;text-overflow:clip;line-height:1.05}';document.head.append(css);
})();
