/* Keep the existing tools and handlers; only their presentation changes. */
(()=>{
 const header=document.querySelector('header'),oldnav=document.querySelector('nav');
 const shell=document.createElement('section');shell.id='ribbon';shell.setAttribute('aria-label','Ruban des outils');
 const tabbar=document.createElement('div');tabbar.className='ribbon-tabs';tabbar.setAttribute('role','tablist');tabbar.setAttribute('aria-label','Catégories du ruban');
 const content=document.createElement('div');content.id='ribboncontent';shell.append(tabbar,content);oldnav.before(shell);
 const categories=[
  ['fichier','Fichier',[['Dessins',['open','project','saveas','project-alcide','export']],['Automatisation',['lisp']]]],
  ['accueil','Accueil',[['Sélection',['select']],['Modifier',['move','copy','hide','delete','undo','redo']],['Position',[]],['Similaires',[]],['Précision',['snap','ortho']]]],
  ['mesures','Annotations',[['Mesurer et annoter',['measure','dimension']],['Réglages',[]],['Textes',[]],['Chaînes de cotes',[]]]],
  ['outils','Outils',[]],
  ['affichage','Affichage',[['Navigation',['fit']],['Organisation',[]],['Application',['cache','help']]]]
 ];
 const extra=(parent,text,action)=>{const b=document.createElement('button');b.textContent=text;b.onclick=action;parent.append(b);return b;};
 let active='accueil';
 function activate(id,expand=true){active=id;for(const b of tabbar.children){const on=b.dataset.tab===id;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;}for(const p of content.children)p.hidden=p.id!=='ribbon-'+id;localStorage.setItem('ribbonTab',id);if(expand)setRibbonVisible(true);}
 for(const [id,name,groups] of categories){
  const tab=document.createElement('button');tab.id='ruban-'+id;tab.dataset.tab=id;tab.textContent=name;tab.setAttribute('role','tab');tab.setAttribute('aria-controls','ribbon-'+id);tab.onclick=()=>activate(id);tab.ondblclick=()=>setRibbonVisible(content.hidden);tabbar.append(tab);
  const panel=document.createElement('div');panel.id='ribbon-'+id;panel.className='ribbon-page';panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',tab.id);content.append(panel);
  for(const [title,ids] of groups){const group=document.createElement('div');group.className='ribbon-group';group.dataset.group=title;const tools=document.createElement('div');tools.className='ribbon-tools';const caption=document.createElement('small');caption.textContent=title;group.append(tools,caption);panel.append(group);
   for(const tool of ids){const el=document.getElementById(tool);tools.append(el.matches('input')?el.closest('label'):el);}
   if(title==='Position'){extra(tools,'Déplacer précisément',()=>preciseTransform(false));extra(tools,'Copier précisément',()=>preciseTransform(true));}
   if(title==='Similaires'){extra(tools,'◎ Sélection intelligente',()=>runSimilarPreset(['smart']));extra(tools,'Paramètres des similaires',()=>showSimilarSettings()).dataset.icon='⚙';}
   if(title==='Textes')extra(tools,'Ajouter / modifier un texte',()=>openTextEditor()).dataset.icon='A';
   if(title==='Chaînes de cotes'){extra(tools,'Créer une chaîne',()=>{setPanelVisible(true);$('#annotationpanel').scrollIntoView({block:'nearest'});startChain();});extra(tools,'Ajouter un point',()=>editChain('chain-add'));extra(tools,'Retirer un point',()=>editChain('chain-remove'));extra(tools,'Position de la chaîne',()=>editChain('chain-reposition'));}
   if(title==='Réglages')extra(tools,'Unités et style des cotes',()=>{setPanelVisible(true);$('#units').closest('section').scrollIntoView({block:'nearest'});});
   if(title==='Organisation'){extra(tools,'Calques',()=>{setLayerPanelVisible(true);$('#layerfilter').scrollIntoView({block:'nearest'});});extra(tools,'Réafficher les éléments',()=>showAll());}
  }
 }
 const icons={open:'▱',project:'▣','project-alcide':'▣',saveas:'▣',export:'↗',lisp:'λ',select:'↖',move:'✥',copy:'▣',hide:'◌',delete:'⌫',undo:'↶',redo:'↷',measure:'↔',dimension:'⊣',fit:'⌗',cache:'▤',help:'?'};
 for(const b of content.querySelectorAll('button')){const icon=document.createElement('span');icon.className='ribbon-icon';icon.setAttribute('aria-hidden','true');icon.textContent=b.dataset.icon||icons[b.id]||'◎';const label=document.createElement('span');label.textContent=b.id==='undo'?'Annuler':b.id==='help'?'Aide':b.textContent.replace(/^[↖↔⊣✥◌⌫⌗◎]\s*/, '');b.replaceChildren(icon,label);b.classList.add('ribbon-button');}
 window.activateRibbon=activate;const panelToggle=$('#togglepanel');header.append(panelToggle);oldnav.remove();
 const controls=document.createElement('div');controls.className='ribbon-fold';controls.setAttribute('aria-label','Afficher ou replier le ruban');
 const top=extra(controls,'',()=>setRibbonVisible(content.hidden));top.id='toggleribbon';top.setAttribute('aria-controls','ribboncontent');
 panelToggle.hidden=true;panelToggle.onclick=()=>setPanelVisible($('#propertiespanel').hidden);shell.append(controls);
 const bottomControls=document.createElement('div');bottomControls.className='bottom-fold';document.querySelector('footer').append(bottomControls);
 const bottom=extra(bottomControls,'',()=>setConsoleVisible(document.querySelector('.console').hidden));bottom.id='toggleconsole';bottom.setAttribute('aria-controls','commandzone');
 const consoleZone=document.querySelector('.console');consoleZone.id='commandzone';
 const rail=document.createElement('button');rail.id='panelhandle';rail.className='panel-handle';rail.onclick=()=>setPanelVisible($('#propertiespanel').hidden);rail.setAttribute('aria-controls','propertiespanel');document.querySelector('main').insertBefore(rail,$('#propertiespanel'));
 const basePanel=setPanelVisible;setPanelVisible=function(show){basePanel(show);$('#togglepanel').textContent=show?'Propriétés ›':'‹ Propriétés';$('#togglepanel').title=show?'Replier le panneau de droite':'Afficher le panneau de droite';rail.textContent=show?'›':'‹';rail.title=$('#togglepanel').title;rail.setAttribute('aria-label',rail.title);rail.setAttribute('aria-expanded',String(show));};
 function setRibbonVisible(show,persist=true){content.hidden=!show;top.textContent='';top.title=show?'Replier le ruban':'Afficher le ruban';top.setAttribute('aria-label',top.title);top.setAttribute('aria-expanded',String(show));if(persist)localStorage.setItem('ribbonVisible',String(show));}
 function setConsoleVisible(show,persist=true){consoleZone.hidden=!show;bottom.textContent='';bottom.title=show?'Replier la zone du bas':'Afficher la zone du bas';bottom.setAttribute('aria-label',bottom.title);bottom.setAttribute('aria-expanded',String(show));if(persist)localStorage.setItem('consoleVisible',String(show));}
 function initAutoHide(){
  const label=document.createElement('label');label.className='autohide';const input=document.createElement('input');input.type='checkbox';input.id='autoribbon';input.checked=false;label.append(input,document.createTextNode('Masquage automatique'));controls.prepend(label);label.title='Masquer automatiquement le ruban, les calques, les propriétés et les indications';
  const groups=[{zones:[$('#layerhandle'),$('#layerpanel')],show:setLayerPanelVisible},{zones:[shell],show:setRibbonVisible},{zones:[rail,$('#propertiespanel')],show:(show)=>{const saved=localStorage.getItem('panelVisible');setPanelVisible(show);if(saved===null)localStorage.removeItem('panelVisible');else localStorage.setItem('panelVisible',saved);}},{zones:[bottomControls,consoleZone],show:setConsoleVisible}];
  for(const g of groups){g.timer=null;g.cancel=()=>clearTimeout(g.timer);g.hide=()=>{g.cancel();if(input.checked)g.timer=setTimeout(()=>{if(input.checked&&!g.zones.some(z=>z.matches(':hover')||z.contains(document.activeElement)))g.show(false,false);},450);};for(const z of g.zones){z.addEventListener('pointerenter',()=>{g.cancel();if(input.checked)g.show(true,false);});z.addEventListener('pointerleave',g.hide);z.addEventListener('focusout',g.hide);}}
  input.onchange=()=>{localStorage.setItem('autoLayout',String(input.checked));for(const g of groups){g.cancel();g.show(!input.checked,false);}};
  if(input.checked)for(const g of groups)g.show(false,false);
 }

 tabbar.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const tabs=[...tabbar.querySelectorAll('[role=tab]')],index=tabs.findIndex(b=>b.dataset.tab===active),next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(index+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;activate(tabs[next].dataset.tab);tabs[next].focus();});
 activate(categories.some(c=>c[0]===localStorage.getItem('ribbonTab'))?localStorage.getItem('ribbonTab'):'accueil',false);
 // Start each session with an open ribbon and stowed panels.
 setRibbonVisible(true,false);setConsoleVisible(false,false);setPanelVisible(false);setLayerPanelVisible(false,false);
 initAutoHide();
 document.addEventListener('keydown',e=>{if(e.ctrlKey&&e.key==='F1'){e.preventDefault();setRibbonVisible(content.hidden);}if(e.ctrlKey&&e.key==='F2'){e.preventDefault();setPanelVisible($('#propertiespanel').hidden);}if(e.ctrlKey&&e.key==='F3'){e.preventDefault();setConsoleVisible(consoleZone.hidden);}});
})();
