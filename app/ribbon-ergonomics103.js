// Ruban compact par métier : les nœuds d’origine et leurs gestionnaires sont conservés.
(()=>{
 const content=document.getElementById('ribboncontent');content.classList.add('ribbon103');
 const before=[...content.querySelectorAll('button:not(.rf-toggle)')].map(b=>b.id).filter(Boolean);
 function group(pageId,title,ids,pinned=false){
  const page=document.getElementById('ribbon-'+pageId);if(!page)return;
  let g=[...page.children].find(g=>g.classList.contains('ribbon-group')&&g.querySelector(':scope>small')?.textContent.trim()===title);
  if(!g){g=document.createElement('div');g.className='ribbon-group';g.innerHTML='<div class="ribbon-tools"></div><small></small>';g.lastElementChild.textContent=title;}
  const host=g.querySelector(':scope>.ribbon-tools,:scope>.rebar-command-tools');if(!host)return;
  g.dataset.ribbonPinned=String(pinned);g.style.order='';g.setAttribute('role','group');g.setAttribute('aria-label',title);
  for(const id of ids){const b=document.getElementById(id);if(b)host.append(b);}page.append(g);return g;
 }
 group('dessin','Tracer',['draw-line','draw-polyline','draw-point','construction-aid-drawing'],true);
 group('dessin','Formes',['draw-rectangle','draw-polygon','draw-circle','core-arc'],true);
 group('dessin','Transformer',['move','copy','rotate-objects','core-mirror','object-scale-tool','drawing-delete'],true);
 group('dessin','Éditer',['stretchobjects','add-vertex-tool','offsetobjects']);
 group('dessin','Ajuster',['auto-trim-tool','cutbetweenobjects','trimobjects','extendobjects','joinlines','core-fillet','core-chamfer']);
 group('dessin','Remplir',['bucket-fill-zone','fill-by-contour','create-filled-zone','create-hatched-zone','hatchsettings']);
 group('dessin','Positionner',['arrange-tool','ribbon-precise-move','ribbon-precise-copy']);
 group('dessin','Style',['drawing-style-button','style-eyedropper-tool','matchproperties','fillsettings','draw-shadow']);
 group('dessin','Ordre',['drawing-order-front','drawing-order-back','drawing-order-forward','drawing-order-backward']);
 group('armatures','Dessiner un acier',['rebar-new-bar','rebar-new-hooked','rebar-new-u','rebar-new-cadre','rebar-new-octagon','rebar-new-epingle','rebar-new-l','rebar-new-point','rebar-cerce'],true);
 group('armatures','Éléments BA',['beam100-tool','lintel100-tool','column100-tool'],true);
 group('armatures','Filants',['rebar-linear-tool-main','filant-new-detail-ribbon'],true);
 group('armatures','Treillis et conversion',['rebar-new-mesh','rebar-convert-line-ribbon']);
 group('armatures','Modifier',['rebar-properties','rebar-panel-toggle','rebar-stretch','rebar-cover-ribbon','rebar-colours-ribbon']);
 group('armatures','Façonnage',['rebar-edit-hooks','rebar-remove-hooks','rebar-add-segment','rebar-remove-segment']);
 group('armatures','Repérage',['rebar-label-place-ribbon','rebar-distribution100-tool','rebar-label-group-ribbon','rebar-label-arrow-ribbon','rebar-label-style-ribbon','rebar-label-none-ribbon','rebar-compact-ribbon'],true);
 group('armatures','Quantifier',['rebar-table-ribbon','rebar-schedule','rebar-rounding-tool','mesh-stock-tool','mesh09-tool']);
 group('armatures','Vérifier',['rebar-ec2-tool','rebar-overlap-review']);
 group('selection','Choisir',['select','similar-settings-tool','smart-similar-tool','overlap-selection-tool','similar-add-tool'],true);
 group('selection','Filtres',['selection-search-tool','selection-search-layer-tool','selection-search-color-tool','selection-search-linetype-tool','selection-filter-ha','selection-filter-ts'],true);
 group('selection','Visibilité',['hide','ribbon-show-all','ribbon-selection-isolate','ribbon-selection-unisolate','ribbon-selection-isolation-settings']);
 group('selection','Supprimer',['delete']);
 // Les groupes anciens devenus vides ne doivent pas occuper une colonne.
 for(const page of content.querySelectorAll('.ribbon-page'))for(const g of [...page.querySelectorAll(':scope>.ribbon-group')])if(!g.querySelector('button:not(.rf-toggle),input,select'))g.remove();
 const paper=document.getElementById('theme09-paper');function paperIcon(){if(!paper||paper.querySelector('svg'))return;const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('aria-hidden','true');icon.innerHTML='<path d="M5 3h10l4 4v14H5zM14 3v5h5M8 12h8M8 16h8"/>';icon.style.fill='none';icon.style.stroke='currentColor';icon.style.strokeWidth='1.5';paper.prepend(icon);}paperIcon();if(paper)new MutationObserver(paperIcon).observe(paper,{childList:true});
 const descriptions={
  'move':'Choisissez les objets avant ou après l’outil, puis le point de départ et le point d’arrivée.',
  'copy':'Copiez les objets choisis à partir d’un point de référence. Les originaux sont conservés.',
  'object-scale-tool':'Agrandissez ou réduisez par un facteur, ou faites correspondre une distance de référence à une distance souhaitée.',
  'core-mirror':'Choisissez les objets puis les deux points de l’axe de symétrie. La sélection peut précéder l’outil.',
  'add-vertex-tool':'Cliquez un contour pour ajouter un sommet, puis placez-le avec l’aperçu. Le remplissage lié suit le contour.',
  'auto-trim-tool':'Retirez au clic la portion située entre les intersections voisines.',
  'cutbetweenobjects':'Retirez la portion entre deux points choisis, ou entre les intersections qui entourent le clic.',
  'extendobjects':'Choisissez l’extrémité à prolonger, puis sa limite.',
  'core-fillet':'Saisissez le rayon, puis choisissez les deux éléments à raccorder par un arrondi.',
  'bucket-fill-zone':'Cliquez dans une zone fermée pour la remplir avec le style courant.',
  'style-eyedropper-tool':'Reprenez les propriétés de l’objet choisi pour les prochains objets.',
  'autodimensiontool':'Encadrez la zone à coter, positionnez l’aperçu et réglez les paramètres avant de poser les cotes.',
  'scale-tool':'Réglez l’échelle des mesures et des textes de cote du document.',
  'rebar-label-place-ribbon':'Choisissez une position d’acier, le point de rappel et l’emplacement du repère. La pose peut s’enchaîner.',
  'rebar-distribution100-tool':'Posez une ligne de repérage avec flèches aux deux extrémités, rappels et pastille de position.',
  'rebar-compact-ribbon':'Regroupez les aciers identiques et renumérotez les positions sans trou. Ctrl+Z annule.',
  'rebar-label-group-ribbon':'Repérez ensemble les barres sélectionnées, notamment les points d’une même position.',
  'beam100-tool':'Définissez la section, les filants, les cadres et les zones d’appui ; vérifiez l’aperçu puis posez la poutre.',
  'lintel100-tool':'Définissez les lits, les U ou cadres, les aciers de peau et les raccords. Coupe et élévation restent liées.',
  'column100-tool':'Poteau rectangulaire ou circulaire : filants, cadres ou cerces, zones resserrées et aciers en tête.',
  'rebar-new-point':'Posez au clic une barre représentée par un point. Sa longueur et ses crosses restent comptées dans la liste de fers.',
  'rebar-cover-ribbon':'Posez les aciers en tenant compte de l’enrobage saisi par rapport au contour de coffrage.',
  'rebar-rounding-tool':'Choisissez les règles d’arrondi utilisées pour les longueurs de la nomenclature.',
  'mesh-stock-tool':'Consultez les panneaux de treillis disponibles, leurs fractions et les chutes réutilisables.',
  'mesh09-tool':'Consultez la répartition des panneaux, les fractions et les recouvrements du calepinage.',
  'rebar-new-mesh':'Calepinez des treillis soudés avec fractions et recouvrements X/Y définis dans les réglages.',
  'rebar-add-segment':'Ajoutez des segments successifs à un acier, avec aperçu du façonnage.',
  'rebar-edit-hooks':'Ajoutez ou modifiez les crosses aux extrémités de l’acier choisi.',
  'rebar-remove-hooks':'Supprimez les crosses choisies sur un ou plusieurs aciers.',
  'rebar-table-ribbon':'Posez une nomenclature des aciers et treillis du dessin.',
  'display-show-all':'Réaffichez les objets masqués dans le dessin.',
  'screen-display-open':'Affichez ou masquez les familles d’objets sans modifier leur contenu.',
  'construction-aid-in':'Passez les objets sélectionnés en construction d’aide ; ils ne sont pas exportés en DWG.',
  'construction-aid-out':'Remettez les objets d’aide sélectionnés dans le dessin normal.',
  'drawing-remove-duplicates':'Analysez les éléments superposés de même type et de mêmes attributs avant de supprimer les doublons.',
  'rebar-overlap-review':'Contrôlez séparément les armatures superposées avant toute correction.',
  'selection-filter-ha':'Limitez la sélection aux armatures HA.',
  'selection-filter-ts':'Limitez la sélection aux treillis soudés.'
 };
 function label(b){return (b.querySelector('.tool-label')?.textContent||b.getAttribute('aria-label')||b.textContent).trim();}
 for(const b of content.querySelectorAll('button:not(.rf-toggle)')){
  for(const icon of b.querySelectorAll('svg'))if(getComputedStyle(icon).stroke==='none'){icon.style.fill='none';icon.style.stroke='var(--accent)';icon.style.strokeWidth='1.6';icon.style.strokeLinecap='round';icon.style.strokeLinejoin='round';}
  const title=label(b),target=b.dataset.commandTarget||b.id.replace(/^home-/,''),desc=descriptions[b.id]||descriptions[target];
  b.dataset.ribbonTitle103=title;b.setAttribute('aria-label',title);if(desc)b.dataset.fullTooltip=title+' · '+desc;
  if(!b.dataset.fullTooltip)b.dataset.fullTooltip=b.title||title;b.removeAttribute('title');
  const icon=b.querySelector('svg,.ribbon-icon');if(icon)icon.setAttribute('aria-hidden','true');
 }
 for(const g of content.querySelectorAll('.ribbon-group')){g.style.setProperty('min-width','0','important');const host=g.querySelector(':scope>.ribbon-tools,:scope>.rebar-command-tools');if(host)host.style.setProperty('min-width','0','important');}
 const css=document.createElement('style');css.id='ribbon103-style';css.textContent=`
 #ribbon #ribboncontent.ribbon103 .ribbon-page{gap:10px!important;padding:5px 10px!important;align-items:stretch!important}
 #ribbon #ribboncontent.ribbon103 :is(#ribbon-armatures,#ribbon-accueil,#ribbon-dessin,#ribbon-mesures,#ribbon-selection,#ribbon-affichage,#ribbon-outils,#ribbon-fichier) .ribbon-group:not(.rf-collapsed){min-width:0!important;width:auto!important;flex:0 0 auto!important;padding:0 10px 0 0!important;gap:3px!important;justify-content:space-between!important}
 #ribbon #ribboncontent.ribbon103 :is(#ribbon-armatures,#ribbon-accueil,#ribbon-dessin,#ribbon-mesures,#ribbon-selection,#ribbon-affichage,#ribbon-outils,#ribbon-fichier) .ribbon-group:not(.rf-collapsed)>:is(.ribbon-tools,.rebar-command-tools){display:grid!important;grid-template-rows:repeat(2,32px)!important;grid-template-columns:none!important;grid-auto-flow:column!important;grid-auto-columns:36px!important;gap:4px!important;min-width:0!important;width:max-content!important;height:68px!important;min-height:68px!important;max-height:68px!important;padding:0!important;flex-wrap:nowrap!important}
 #ribbon #ribboncontent.ribbon103 :is(#ribbon-armatures,#ribbon-accueil,#ribbon-dessin,#ribbon-mesures,#ribbon-selection,#ribbon-affichage,#ribbon-outils,#ribbon-fichier) .ribbon-group:not(.rf-collapsed)>:is(.ribbon-tools,.rebar-command-tools)>button{display:flex!important;align-items:center!important;justify-content:center!important;flex-direction:row!important;width:36px!important;min-width:36px!important;max-width:36px!important;height:32px!important;min-height:32px!important;max-height:32px!important;grid-row:auto!important;grid-column:auto!important;padding:5px!important;margin:0!important;gap:0!important;border:1px solid transparent!important;border-radius:6px!important;box-shadow:none!important;background:transparent!important;position:relative!important}
 #ribbon #ribboncontent.ribbon103 :is(#ribbon-armatures,#ribbon-accueil,#ribbon-dessin,#ribbon-mesures,#ribbon-selection,#ribbon-affichage,#ribbon-outils,#ribbon-fichier) .ribbon-group:not(.rf-collapsed)>:is(.ribbon-tools,.rebar-command-tools)>button :is(.tool-label,span:not(.ribbon-icon)){position:absolute!important;width:1px!important;height:1px!important;min-width:0!important;margin:-1px!important;padding:0!important;overflow:hidden!important;clip-path:inset(50%)!important;white-space:nowrap!important}
 #ribbon #ribboncontent.ribbon103 :is(#ribbon-armatures,#ribbon-accueil,#ribbon-dessin,#ribbon-mesures,#ribbon-selection,#ribbon-affichage,#ribbon-outils,#ribbon-fichier) .ribbon-group:not(.rf-collapsed)>:is(.ribbon-tools,.rebar-command-tools)>button :is(svg,.ribbon-icon){position:static!important;display:block!important;width:23px!important;min-width:23px!important;height:23px!important;flex:0 0 23px!important;margin:0!important;font-size:22px!important;clip-path:none!important}
 #ribbon #ribboncontent.ribbon103 :is(#ribbon-armatures,#ribbon-accueil,#ribbon-dessin,#ribbon-mesures,#ribbon-selection,#ribbon-affichage,#ribbon-outils,#ribbon-fichier) .ribbon-group:not(.rf-collapsed)>:is(.ribbon-tools,.rebar-command-tools)>button:hover:not(:disabled){background:var(--panel)!important;border-color:var(--border)!important}
 #ribbon #ribboncontent.ribbon103 :is(#ribbon-armatures,#ribbon-accueil,#ribbon-dessin,#ribbon-mesures,#ribbon-selection,#ribbon-affichage,#ribbon-outils,#ribbon-fichier) .ribbon-group:not(.rf-collapsed)>:is(.ribbon-tools,.rebar-command-tools)>button:is(.active,.ui-pressed,[aria-pressed=true]){background:var(--panel)!important;border-color:var(--accent)!important}
 #ribbon #ribboncontent.ribbon103 :is(#ribbon-armatures,#ribbon-accueil,#ribbon-dessin,#ribbon-mesures,#ribbon-selection,#ribbon-affichage,#ribbon-outils,#ribbon-fichier) .ribbon-group>small{font-size:10px!important;line-height:14px!important;color:var(--text)!important;opacity:.72;letter-spacing:0!important;margin:0!important;max-width:115px!important;overflow:hidden!important;white-space:nowrap!important;text-overflow:ellipsis!important}
 #ribbon #ribboncontent.ribbon103 :is(#ribbon-armatures,#ribbon-accueil,#ribbon-dessin,#ribbon-mesures,#ribbon-selection,#ribbon-affichage,#ribbon-outils,#ribbon-fichier) .ribbon-group.rf-collapsed.rf-open .tool-label{position:static!important;clip-path:none!important;width:auto!important;height:auto!important;display:inline!important;overflow:visible!important}
 #ribbon #ribboncontent.ribbon103 :is(#ribbon-armatures,#ribbon-accueil,#ribbon-dessin,#ribbon-mesures,#ribbon-selection,#ribbon-affichage,#ribbon-outils,#ribbon-fichier) .ribbon-group.rf-collapsed{padding-right:8px!important;max-width:70px!important;gap:3px!important}
 #ribbon #ribboncontent.ribbon103 :is(#ribbon-armatures,#ribbon-accueil,#ribbon-dessin,#ribbon-mesures,#ribbon-selection,#ribbon-affichage,#ribbon-outils,#ribbon-fichier) .ribbon-group.rf-collapsed>.rf-toggle{width:40px!important;min-width:40px!important;max-width:40px!important;height:68px!important;padding:4px!important;flex-direction:column;gap:4px}
 #ribbon #ribboncontent.ribbon103 .rf-toggle>span{display:none!important}#ribbon #ribboncontent.ribbon103 .rf-toggle svg{width:23px!important;height:23px!important;fill:none;stroke:var(--accent);stroke-width:1.5}
 #ribbon #ribboncontent.ribbon103 :is(#ribbon-armatures,#ribbon-accueil,#ribbon-dessin,#ribbon-mesures,#ribbon-selection,#ribbon-affichage,#ribbon-outils,#ribbon-fichier) .ribbon-group.rf-collapsed>small{max-width:64px!important}
 @media(max-width:1050px){
 #ribbon #ribboncontent.ribbon103 :is(#ribbon-armatures,#ribbon-accueil,#ribbon-dessin,#ribbon-mesures,#ribbon-selection,#ribbon-affichage,#ribbon-outils,#ribbon-fichier) .ribbon-group:not(.rf-collapsed)>:is(.ribbon-tools,.rebar-command-tools){grid-template-rows:repeat(3,24px)!important;grid-auto-columns:32px!important;gap:2px!important;height:76px!important;min-height:76px!important;max-height:76px!important}
 #ribbon #ribboncontent.ribbon103 :is(#ribbon-armatures,#ribbon-accueil,#ribbon-dessin,#ribbon-mesures,#ribbon-selection,#ribbon-affichage,#ribbon-outils,#ribbon-fichier) .ribbon-group:not(.rf-collapsed)>:is(.ribbon-tools,.rebar-command-tools)>button{width:32px!important;min-width:32px!important;max-width:32px!important;height:24px!important;min-height:24px!important;max-height:24px!important;padding:2px!important}
 #ribbon #ribboncontent.ribbon103 :is(#ribbon-armatures,#ribbon-accueil,#ribbon-dessin,#ribbon-mesures,#ribbon-selection,#ribbon-affichage,#ribbon-outils,#ribbon-fichier) .ribbon-group:not(.rf-collapsed)>:is(.ribbon-tools,.rebar-command-tools)>button :is(svg,.ribbon-icon){width:20px!important;min-width:20px!important;height:20px!important;flex-basis:20px!important}
 #ribbon #ribboncontent.ribbon103 .ribbon-page{gap:6px!important;padding:3px 8px!important}
 }
 #ribbon-tooltip strong{display:block;font-size:13px;margin-bottom:4px}#ribbon-tooltip .ribbon103-description{display:block;font-size:12px;line-height:1.5;color:var(--muted)}
 #ribbon-tooltip{max-width:min(340px,calc(100vw - 16px))!important;pointer-events:none}
 `;document.head.append(css);
 window.RibbonAudit103={before,lost:()=>before.filter(id=>!document.getElementById(id)),commands:()=>[...content.querySelectorAll('button:not(.rf-toggle)')].map(b=>({id:b.id,name:label(b),icon:!!b.querySelector('svg,.ribbon-icon'),tip:b.dataset.fullTooltip}))};
 const armOrder=['Dessiner un acier','Éléments BA','Filants','Treillis et conversion','Modifier','Façonnage','Repérage','Quantifier','Vérifier'];function order(){for(const g of document.querySelectorAll('#ribbon-armatures>.ribbon-group')){const title=g.querySelector(':scope>small')?.textContent.trim(),n=armOrder.indexOf(title);g.dataset.ribbonPinned=String(['Dessiner un acier','Éléments BA','Filants','Repérage'].includes(title));g.style.setProperty('order',String(n<0?99:n),'important');}window.RibbonFit?.fit();}order();window.addEventListener('load',()=>setTimeout(order,0),{once:true});
})();
