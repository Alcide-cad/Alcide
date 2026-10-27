// Organise existing commands by task. Reparent original nodes to preserve every handler.
(()=>{
 const content=document.getElementById('ribboncontent'),storage=document.createElement('div');storage.hidden=true;storage.id='ribbon-command-storage';document.body.append(storage);
 const before=[...content.querySelectorAll('button:not(.rf-toggle)')].map(b=>b.id).filter(Boolean);
 function group(pageId,name,ids,featured=[],pinned=false){
  const page=document.getElementById('ribbon-'+pageId);if(!page)return;
  let g=[...page.querySelectorAll(':scope>.ribbon-group')].find(g=>g.querySelector(':scope>small')?.textContent===name);
  if(!g){g=document.createElement('div');g.className='ribbon-group';g.innerHTML='<div class="ribbon-tools"></div><small></small>';g.lastElementChild.textContent=name;}
  g.classList.add('ribbon-family');g.dataset.ribbonPinned=String(pinned);g.setAttribute('role','group');g.setAttribute('aria-label',name);
  const host=g.querySelector(':scope>.ribbon-tools')||g.querySelector(':scope>.rebar-command-tools');
  for(const id of ids){const b=document.getElementById(id);if(!b)continue;const node=b.matches('input,select')?b.closest('label')||b:b;host.append(node);b.classList.toggle('ribbon-major',featured.includes(id));}
  page.append(g);return g;
 }
 function alias(id,target,text){if(window.createRibbonCommandAlias){const b=window.createRibbonCommandAlias(id,target,text);if(b)storage.append(b);return b;}const source=document.getElementById(target);if(!source)return;const b=source.cloneNode(true);b.id=id;for(const a of ['data-tooltip-ready','data-full-tooltip','aria-describedby'])b.removeAttribute(a);b.classList.remove('ribbon-featured','ribbon-major');b.onclick=()=>source.click();b.setAttribute('aria-label',text);b.title=source.dataset.fullTooltip||source.title||text;const label=b.querySelector('.tool-label,span');if(label)label.textContent=text;else b.textContent=text;storage.append(b);return b;}
 alias('home-object-scale','object-scale-tool','Mise à l’échelle');
 group('dessin','Tracer',['draw-line','draw-polyline','draw-point'],['draw-line']);
 group('dessin','Formes',['draw-rectangle','draw-polygon','draw-circle','core-arc'],['draw-rectangle']);
 group('dessin','Modifier',['object-scale-tool','move','copy','rotate-objects','core-mirror','stretchobjects','offsetobjects','drawing-delete'],['object-scale-tool','move'],true);
 group('dessin','Ajuster les contours',['auto-trim-tool','trimobjects','extendobjects','cutbetweenobjects','joinlines','core-fillet','core-chamfer']);
 group('dessin','Hachures et remplissages',['bucket-fill-zone','fill-by-contour','hatchsettings','create-hatched-zone','create-filled-zone'],['bucket-fill-zone']);
 group('dessin','Positionner',['arrange-tool','ribbon-precise-move','ribbon-precise-copy']);
 group('dessin','Propriétés',['drawing-style-button','style-eyedropper-tool','matchproperties','fillsettings','draw-shadow']);
 group('dessin','Ordre du dessin',['drawing-order-front','drawing-order-back','drawing-order-forward','drawing-order-backward']);
 // Undo/redo already have permanent, functional quick-access buttons above the ribbon.
 for(const id of ['undo','redo']){const b=document.getElementById(id);if(b)storage.append(b);}
 group('accueil','Dessin',['home-draw-line','home-draw-polyline','home-draw-rectangle','home-draw-circle'],['home-draw-line'],true);
 group('accueil','Modification',['home-move','home-copy','home-rotate-objects','home-core-mirror','home-object-scale','home-stretchobjects','home-auto-trim-tool','home-offsetobjects','home-delete'],['home-move'],true);
 group('accueil','Annotation',['home-dimension','home-ribbon-new-text','home-section-auto-tool','home-door-dimension-tool','home-ribbon-chain-create'],['home-dimension']);
 group('accueil','Calques et propriétés',['home-ribbon-layers','home-ribbon-properties','home-selection-search-layer-tool','home-selection-search-color-tool']);
 group('accueil','Sélection',['home-select','home-smart-similar-tool','home-selection-search-tool','home-similar-add-tool']);
 group('accueil','Isolation temporaire',['ribbon-accueil-isolate','ribbon-accueil-unisolate','ribbon-accueil-isolation-settings']);
 const repeat=document.getElementById('repeat-last-command');if(repeat)group('accueil','Sélection',['repeat-last-command']);
 group('mesures','Textes',['ribbon-new-text','revisioncloud'],['ribbon-new-text']);
 group('mesures','Créer des cotes',['dimension','section-auto-tool','door-dimension-tool','autodimensiontool'],['dimension'],true);
 group('mesures','Chaînes de cotes',['ribbon-chain-create','ribbon-chain-add','ribbon-chain-remove','ribbon-chain-position']);
 group('mesures','Axes et repères',['axestool','leveldimension','addcallout','numbercallouts']);
 group('mesures','Style et échelle',['ribbon-dimension-style','dimension-eyedropper-tool','scale-tool']);
 group('mesures','Mesurer',['measure']);
 group('mesures','Cotes importées',['reconstruction-tool','imported-dimensions-tool']);
 group('selection','Choisir',['select','smart-similar-tool','similar-settings-tool','overlap-selection-tool'],['select'],true);
 group('selection','Filtres',['selection-search-tool','selection-search-layer-tool','selection-search-color-tool','selection-search-linetype-tool']);
 group('selection','Compléter la sélection',['similar-add-tool']);
 group('selection','Visibilité',['hide','ribbon-show-all','ribbon-selection-isolate','ribbon-selection-unisolate','ribbon-selection-isolation-settings']);
 group('selection','Supprimer',['delete']);
 group('affichage','Vues',['fit','view-orient','view-original'],['fit'],true);
 group('affichage','Panneaux',['ribbon-layers','ribbon-properties']);
 group('affichage','Aides au dessin',['snap','ortho','grid-visible-toggle','snap-settings-button']);
 group('affichage','Aspect du dessin',['display-lineweights','display-import-transparency','graphics-detail-auto']);
 group('outils','Bibliothèque générale',['detail-library-tool','detail-library-save'],['detail-library-tool']);
 group('outils','Blocs',['decompose-all']);
 group('outils','Contrôle et maintenance',['auditdrawing','cache']);
 group('outils','Automatisation',['lisp']);
 group('outils','Application',['edition-settings','edition-shortcuts','help']);
 for(const page of content.querySelectorAll('.ribbon-page')){
  if(page.id!=='ribbon-armatures')page.classList.add('ribbon-refined');
  for(const g of [...page.querySelectorAll(':scope>.ribbon-group')])if(!g.querySelector('button:not(.rf-toggle),input,select'))g.remove();
 }
 const arm=document.getElementById('ribbon-armatures');for(const id of ['rebar-new-bar','rebar-new-mesh','rebar-linear-tool-main','rebar-properties','rebar-label-arrow-ribbon','rebar-table-ribbon']){const g=document.getElementById(id)?.closest('.ribbon-group');if(g)arm.append(g);}
 for(const id of ['rebar-properties','rebar-label-arrow-ribbon','rebar-table-ribbon']){const g=document.getElementById(id)?.closest('.ribbon-group');if(g)g.dataset.ribbonPinned='true';}
 const compact=document.getElementById('rebar-compact-ribbon');if(compact)compact.dataset.fullTooltip='Regrouper les aciers identiques puis renuméroter les positions sans trou, y compris les pièces des détails filants. Ctrl+Z annule.';
 const orderArmatures=()=>{const order={'Dessiner une barre':0,'Treillis et conversion':1,'Filants':2,'Modifier':3,'Repérage':4,'Quantifier':5};for(const g of arm.querySelectorAll(':scope>.ribbon-group')){const name=g.querySelector(':scope>small')?.textContent;if(name in order)g.style.order=order[name];if(['Modifier','Repérage','Quantifier'].includes(name))g.dataset.ribbonPinned='true';}window.RibbonFit?.fit();};orderArmatures();window.addEventListener('load',orderArmatures,{once:true});
 const lost=before.filter(id=>!document.getElementById(id));window.ribbonReviewAudit={before:before.length,lost};
 const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href='ribbon-layout-review.css';sheet.onload=()=>window.RibbonFit?.fit();document.head.append(sheet);
 window.RibbonFit?.fit();
})();
