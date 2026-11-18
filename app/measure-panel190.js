/* 1.0.90 · Panneau « Mesurer une distance » : en-tête compact (titre, détacher, remettre en place, × sur une ligne ; balise <header> conservée pour le mécanisme des palettes, règles globales neutralisées),
   lignes serrées, même style que les autres panneaux. L'ancienne feuille de style (titre 23 px, règles globales de
   <header>) ne s'applique plus. Panneau déplaçable par son en-tête (position mémorisée), double-clic ou ⤓ pour le remettre
   dans le coin, ↗ pour le détacher dans une fenêtre Windows (même mécanisme que les palettes : position mémorisée,
   « Rattacher » ou fermeture de la fenêtre pour le remettre dans ALCIDE ; il se rouvre détaché à la mesure suivante). */
(()=>{
 const card=document.getElementById('measurecard');if(!card)return;const KEY='measure190-pos';
 const old=card.querySelector(':scope>header');const head=document.createElement('header');head.className='mc-head';head.title='Glisser pour déplacer · double-clic : remettre en place';
 head.innerHTML='<span class="mc-grip" aria-hidden="true">⠿</span><h2>Mesurer une distance</h2><button type="button" class="palette152-detach mc-detach" title="Détacher dans une fenêtre Windows · déplacer sur un autre écran" aria-label="Détacher le panneau de mesure">↗</button><button type="button" class="mc-dock" title="Remettre en place (coin du dessin)" aria-label="Remettre le panneau en place">⤓</button>';
 const close=old?.querySelector('[data-close]');if(close){close.classList.add('mc-close');close.setAttribute('aria-label','Quitter la mesure');head.append(close);}old?.replaceWith(head);if(!old)card.prepend(head);
 const saved=()=>{try{const p=JSON.parse(localStorage.getItem(KEY)||'null');return p&&Number.isFinite(p.left)&&Number.isFinite(p.top)?p:null;}catch{return null;}};
 function place(){const p=saved();card.classList.toggle('mc-moved',!!p);if(!p)return;const w=card.offsetWidth||300,h=card.offsetHeight||200;card.style.right='auto';card.style.bottom='auto';card.style.left=Math.max(4,Math.min(innerWidth-w-4,p.left))+'px';card.style.top=Math.max(4,Math.min(innerHeight-Math.min(h,60),p.top))+'px';}
 function dock(){localStorage.removeItem(KEY);card.style.left=card.style.top='auto';card.classList.remove('mc-moved');requestRender?.();}
 let drag=null;
 head.addEventListener('pointerdown',ev=>{if(ev.button!==0||ev.target.closest('button'))return;const r=card.getBoundingClientRect();drag={dx:ev.clientX-r.left,dy:ev.clientY-r.top,id:ev.pointerId};head.setPointerCapture(ev.pointerId);ev.preventDefault();});
 head.addEventListener('pointermove',ev=>{if(!drag)return;localStorage.setItem(KEY,JSON.stringify({left:Math.round(ev.clientX-drag.dx),top:Math.round(ev.clientY-drag.dy)}));place();});
 const end=()=>{drag=null;};head.addEventListener('pointerup',end);head.addEventListener('pointercancel',end);
 head.addEventListener('dblclick',ev=>{if(!ev.target.closest('button'))dock();});
 head.querySelector('.mc-dock').onclick=()=>dock();
 head.querySelector('.mc-detach').onclick=async ev=>{const b=ev.currentTarget;b.disabled=true;try{await window.PaletteWindows152?.detach(card);}catch(e){status(e.message);}finally{b.disabled=false;}};
 // fenêtre détachée : se rouvre détachée à la prochaine mesure ; fermer la fenêtre la remet dans ALCIDE
 window.PaletteWindows152?.remember(card,{dockOnClose:true});
 card.addEventListener('cancel',ev=>{ev.preventDefault();if(tool==='measure')setTool('select');});
 window.addEventListener('resize',place);
 const draw=drawOverlay;drawOverlay=function(...a){const r=draw.apply(this,a);if(!card.hidden)place();return r;};
 const css=document.createElement('style');css.textContent=[
  '#measurecard{padding:0!important;line-height:1.4!important;font-size:12px!important;width:min(280px,calc(100vw - 24px))!important;overflow:hidden auto}',
  '#measurecard>header.mc-head{display:flex!important;flex-wrap:nowrap!important;align-items:center;gap:6px;height:auto!important;min-height:0!important;margin:0!important;padding:4px 5px 4px 8px!important;position:static!important;background:transparent!important;border:0!important;border-bottom:1px solid var(--border)!important;box-shadow:none!important;cursor:move;user-select:none;-webkit-user-select:none;touch-action:none}',
  '#measurecard>.mc-head h2{flex:1;min-width:0;margin:0!important;padding:0!important;border:0!important;background:transparent!important;position:static!important;font-size:13px!important;font-weight:600;line-height:1.3!important;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-height:0!important;letter-spacing:0;text-transform:none}',
  '#measurecard .mc-grip{color:var(--muted);font-size:12px;line-height:1}',
  '#measurecard>.mc-head button{flex:0 0 auto;min-width:24px;min-height:22px!important;height:22px;padding:0 6px!important;margin:0!important;float:none!important;line-height:1;font-size:13px}',
  '#measurecard .mc-dock{display:none}#measurecard.mc-moved .mc-dock{display:inline-block}',
  '#measurecard>:not(.mc-head){margin-left:10px;margin-right:10px}',
  '#measurecard [data-result]{margin-top:6px}#measurecard [data-result]>div{display:flex;justify-content:space-between;align-items:baseline;gap:10px;padding:1px 0!important;min-height:0}',
  '#measurecard strong{display:inline!important;font-size:13px!important;font-weight:600;color:var(--accent)}#measurecard [data-result]>div:first-child strong{font-size:16px!important}',
  '#measurecard label{display:flex;align-items:center;gap:6px;margin:6px 10px!important}#measurecard select{flex:1;min-width:75px;height:auto;min-height:26px;padding-top:2px;padding-bottom:2px;line-height:1.3}',
  '#measurecard p{margin:6px 10px 4px!important;padding-top:6px!important;line-height:1.4!important;font-size:11.5px}',
  '#measurecard small{display:block;margin:0 10px 8px!important;font-size:11px;line-height:1.35}',
  '#palette-content>#measurecard{display:block!important;visibility:visible!important;pointer-events:auto!important;position:absolute!important;inset:0!important;width:100%!important;max-height:100%!important;border:0!important;border-radius:0!important;box-shadow:none!important;overflow:auto}',
  '#palette-content>#measurecard>.mc-head{cursor:default}#palette-content #measurecard>.mc-head>button{float:none!important;font-size:12px!important}#palette-content #measurecard .mc-dock,#palette-content #measurecard .mc-grip{display:none!important}'
 ].join('');document.head.append(css);
 window.MeasurePanel190={dock,place,saved,card};
})();
