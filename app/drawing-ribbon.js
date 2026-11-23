(() => {
 const page = document.getElementById('ribbon-dessin');
 const group = document.createElement('div');
 group.id = 'drawing-primary-actions';
 group.className = 'ribbon-group';
 group.dataset.ribbonPinned = 'true';
 group.innerHTML = '<div class="ribbon-tools"></div><small>Tracer et transformer</small>';
 const commands = ['draw-line', 'draw-polyline', 'draw-rectangle', 'draw-circle', 'core-arc', 'move', 'copy', 'rotate-objects'];
 const arc = document.getElementById('core-arc');
 if (!arc.querySelector('svg')) {
  arc.querySelector('.ribbon-icon')?.remove();
  arc.insertAdjacentHTML('afterbegin','<svg class="tool-pictogram" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18 Q10 -2 21 13" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>');
 }
 group.firstElementChild.append(...commands.map(id => document.getElementById(id)));
 page.prepend(group);
})();

(() => {
 const page = document.getElementById('ribbon-mesures');
 const group = document.createElement('div');
 group.id = 'annotation-primary-actions';
 group.className = 'ribbon-group';
 group.dataset.ribbonPinned = 'true';
 group.innerHTML = '<div class="ribbon-tools"></div><small>Cotes et textes</small>';
 const commands = ['dimension','ribbon-chain-create','door-dimension-tool','dim-angular196','ribbon-new-text','align-texts170'];
 group.firstElementChild.append(...commands.map(id => document.getElementById(id)));
 page.prepend(group);
})();

(() => {
 const page = document.getElementById('ribbon-selection');
 const group = document.createElement('div');
 group.id = 'selection-primary-actions';
 group.className = 'ribbon-group';
 group.innerHTML = '<div class="ribbon-tools"></div><small>Sélection et filtres</small>';
 const commands = ['select','smart-similar-tool','selection-search-layer-tool','selection-search-color-tool','ribbon-selection-isolate','ribbon-show-all'];
 group.firstElementChild.append(...commands.map(id => document.getElementById(id)));
 page.prepend(group);
})();

(() => {
 const page = document.getElementById('ribbon-affichage');
 const group = document.createElement('div');
 group.id = 'view-primary-actions';
 group.className = 'ribbon-group';
 group.innerHTML = '<div class="ribbon-tools"></div><small>Zoom et vues</small>';
 const commands = ['fit', 'view-orient', 'view-original', 'display-show-all'];
 const buttons = commands.map(id => document.getElementById(id));
 for (const [button, mirrored] of [[buttons[1],false],[buttons[2],true]]) {
  button.querySelector('.ribbon-icon').outerHTML = '<svg class="tool-pictogram" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 8a8 8 0 1 0 1 8M19 3v6h-6" '+(mirrored?'transform="translate(24 0) scale(-1 1)" ':'')+'fill="none" stroke="currentColor" stroke-width="1.7"/></svg>';
  button.querySelector('span').classList.add('tool-label');
 }
 group.firstElementChild.append(...buttons);
 page.prepend(group);
 for (const empty of page.querySelectorAll('.ribbon-group')) {
  if (!empty.querySelector('.ribbon-tools > *')) empty.remove();
 }
})();

(() => {
 const page = document.getElementById('ribbon-outils');
 const group = document.createElement('div');
 group.id = 'manage-primary-actions';
 group.className = 'ribbon-group';
 group.innerHTML = '<div class="ribbon-tools"></div><small>Commandes principales</small>';
 const commands = ['detail-library-tool', 'auditdrawing', 'cleanup116-tool', 'edition-settings', 'edition-shortcuts', 'help'];
 const buttons = commands.map(id => document.getElementById(id));
 group.firstElementChild.append(...buttons);
 page.prepend(group);
 for (const empty of page.querySelectorAll('.ribbon-group')) {
  if (!empty.querySelector('.ribbon-tools > *')) empty.remove();
 }
})();

(() => {
 const page = document.getElementById('ribbon-cao');
 const group = document.createElement('div');
 group.id = 'cad-primary-actions';
 group.className = 'ribbon-group';
 group.innerHTML = '<div class="ribbon-tools"></div><small>Blocs et modification</small>';
 const commands = ['block-create196', 'block-insert196', 'block-explode196', 'array-rect196', 'lengthen196'];
 const buttons = commands.map(id => document.getElementById(id));
 group.firstElementChild.append(...buttons);
 page.prepend(group);
 for (const empty of page.querySelectorAll('.ribbon-group')) {
  if (!empty.querySelector('.ribbon-tools > *')) empty.remove();
 }
})();

window.addEventListener('load', () => setTimeout(() => {
 const page = document.getElementById('ribbon-armatures');
 const group = document.createElement('div');
 group.id = 'rebar-primary-actions';
 group.style.setProperty('order','-1','important');
 group.className = 'ribbon-group';
 group.innerHTML = '<div class="ribbon-tools"></div><small>Ferraillage courant</small>';
 const commands = ['rebar-new-bar', 'rebar-new-cadre', 'rebar-new-u', 'rebar-new-mesh', 'rebar-properties', 'rebar-table-ribbon'];
 const buttons = commands.map(id => document.getElementById(id));
 for (const button of buttons) button.style.removeProperty('grid-row');
 group.firstElementChild.append(...buttons);
 page.prepend(group);
 for (const empty of page.querySelectorAll('.ribbon-group')) {
  if (!empty.querySelector('.ribbon-tools > *, .rebar-command-tools > *')) empty.remove();
 }
}, 350), {once:true});
