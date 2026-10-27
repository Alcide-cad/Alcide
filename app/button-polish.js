// Decorative feedback only: no command dispatch, pointer capture or model changes.
(()=>{
 const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href='button-polish.css';document.head.append(sheet);
 const scope='#ribbon button,#toolquickbar button,#propertiespanel button,#layerpanel button,dialog button,#contextmenu button,footer button,#welcome button,.console button';
 const excluded='.color-swatch,.layer-color';
 const icons={
  'selection-search-tool':['M4 5h16l-6 7v7l-4-2v-5z','#9cc8e8'],
  'selection-search-layer-tool':['M3 7l9-5 9 5-9 5zM3 12l9 5 9-5M3 17l9 5 9-5','#8fd4c8'],
  'selection-search-color-tool':['M12 3a9 9 0 1 0 0 18h2a2 2 0 0 0 0-4h-1a2 2 0 0 1 0-4h4a4 4 0 0 0 4-4c0-4-5-6-9-6M7 8h.01M11 6h.01M16 7h.01M6 13h.01','#d5bd88'],
  'selection-search-linetype-tool':['M3 6h18M3 12h4m4 0h3m4 0h3M3 18h2m4 0h2m4 0h2m4 0h1','#b5cce4'],
  'similar-add-tool':['M4 5h8v8H4zM14 11h6v9h-9v-5M17 2v6M14 5h6','#a6d5b2'],
  'arrange-tool':['M4 3v18M8 5h12v4H8zM8 15h8v4H8zM4 12h17','#d5bf8a'],
  'style-eyedropper-tool':['M15 3l6 6M14 4l-9 9v4l-2 3 1 1 3-2h4l9-9M11 7l6 6','#9fd5d1'],
  'draw-shadow':['M3 4h18v16H3zM3 20l5-12 13-4','#afc1d4'],
  'auto-trim-tool':['M4 5l16 14M4 19l6-6M14 9l6-4M12 3v18','#dfb29b'],
  'section-auto-tool':['M3 19h18M5 19V5h6v7h8v7M3 3v16M2 8h6M15 10v11M13 20h7','#aed7b0']
 };
 function prepare(root=document){const buttons=root.nodeType===1&&root.matches('button')?[root]:root.querySelectorAll('button');for(const b of buttons){
  if(!b.matches(scope)||b.matches(excluded))continue;
  if(!b.classList.contains('ui-button'))b.classList.add('ui-button');
  if(['delete','delete-dimension-large'].includes(b.id)||b.dataset.action==='delete')b.dataset.uiTone='danger';
  const icon=icons[b.id];if(icon&&!b.querySelector('svg,.ribbon-icon')){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),p=document.createElementNS(svg.namespaceURI,'path');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.classList.add('ui-icon');p.setAttribute('d',icon[0]);svg.append(p);b.style.setProperty('--ui-icon-color',icon[1]);b.prepend(svg);}
 }}
 prepare();let queued=false;const added=new Set();new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1)added.add(node);if(queued||!added.size)return;queued=true;requestAnimationFrame(()=>{queued=false;const roots=[...added];added.clear();for(const root of roots)if(root.isConnected)prepare(root);});}).observe(document.body,{childList:true,subtree:true});
 let pressed=null;const timers=new WeakMap(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function release(){pressed?.classList.remove('ui-pressed');pressed=null;}
 document.addEventListener('pointerdown',ev=>{if(ev.button!==0)return;const b=ev.target.closest('button.ui-button');if(!b||b.disabled)return;release();pressed=b;b.classList.add('ui-pressed');if(reduced.matches)return;const r=b.getBoundingClientRect();b.style.setProperty('--ui-click-x',(ev.clientX-r.left)+'px');b.style.setProperty('--ui-click-y',(ev.clientY-r.top)+'px');clearTimeout(timers.get(b));b.classList.remove('ui-click');void b.offsetWidth;b.classList.add('ui-click');timers.set(b,setTimeout(()=>b.classList.remove('ui-click'),350));},true);
 document.addEventListener('pointerup',release,true);document.addEventListener('pointercancel',release,true);window.addEventListener('blur',release);document.addEventListener('keydown',ev=>{if(ev.key==='Escape')release();});
})();
