// Bibliothèque ancrée à gauche de la zone de dessin, redimensionnable (largeur mémorisée) ; libellés d'en-tête complets.
(()=>{
 const dialog=$('#detail-library'),ws=$('#workspace');if(!dialog||!ws)return;
 const MIN=280,MAX=()=>Math.max(MIN,Math.min(720,innerWidth*.6));let width=Math.max(MIN,Math.min(MAX(),Number(localStorage.getItem('libraryDockWidth'))||380)),frame=0;
 // 0.7.5 : hauteur réglable par le bas (mémorisée ; vide = hauteur de la zone de dessin).
 const HMIN=220;let height=Number(localStorage.getItem('libraryDockHeight'))||0;const hmax=top=>Math.max(HMIN,innerHeight-top-6);
 const handle=document.createElement('div');handle.className='library-dock-handle';handle.title='Glisser pour redimensionner la bibliothèque';handle.setAttribute('role','separator');handle.setAttribute('aria-orientation','vertical');dialog.append(handle);
 function place(){frame=0;if(!dialog.open){ws.style.marginLeft='';return;}ws.style.marginLeft=width+'px';const r=ws.getBoundingClientRect();const h=height?Math.max(HMIN,Math.min(hmax(r.top),height)):r.height;Object.assign(dialog.style,{left:(r.left-width)+'px',top:r.top+'px',height:h+'px',width:width+'px'});}
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(place);};
 new MutationObserver(()=>{place();requestRender?.();}).observe(dialog,{attributes:true,attributeFilter:['open']});
 addEventListener('resize',()=>{width=Math.min(width,MAX());schedule();});
 let drag=null;handle.addEventListener('pointerdown',ev=>{if(ev.button!==0)return;ev.preventDefault();drag={x:ev.clientX,w:width};handle.setPointerCapture(ev.pointerId);document.body.classList.add('library-dock-resizing');});
 handle.addEventListener('pointermove',ev=>{if(!drag)return;width=Math.round(Math.max(MIN,Math.min(MAX(),drag.w+ev.clientX-drag.x)));schedule();});
 const end=()=>{if(!drag)return;drag=null;document.body.classList.remove('library-dock-resizing');localStorage.setItem('libraryDockWidth',String(width));};handle.addEventListener('pointerup',end);handle.addEventListener('pointercancel',end);
 const vhandle=document.createElement('div');vhandle.className='library-dock-vhandle';vhandle.title='Glisser vers le bas pour agrandir la bibliothèque · double-clic : hauteur de la zone de dessin';vhandle.setAttribute('role','separator');vhandle.setAttribute('aria-orientation','horizontal');dialog.append(vhandle);
 let vdrag=null;vhandle.addEventListener('pointerdown',ev=>{if(ev.button!==0)return;ev.preventDefault();vdrag={y:ev.clientY,h:dialog.getBoundingClientRect().height};vhandle.setPointerCapture(ev.pointerId);document.body.classList.add('library-dock-vresizing');});
 vhandle.addEventListener('pointermove',ev=>{if(!vdrag)return;height=Math.round(Math.max(HMIN,Math.min(hmax(dialog.getBoundingClientRect().top),vdrag.h+ev.clientY-vdrag.y)));schedule();});
 const vend=()=>{if(!vdrag)return;vdrag=null;document.body.classList.remove('library-dock-vresizing');localStorage.setItem('libraryDockHeight',String(height));};vhandle.addEventListener('pointerup',vend);vhandle.addEventListener('pointercancel',vend);
 vhandle.addEventListener('dblclick',()=>{height=0;localStorage.removeItem('libraryDockHeight');schedule();});
 handle.addEventListener('dblclick',()=>{width=380;localStorage.setItem('libraryDockWidth','380');schedule();});
 // Boutons texte de la barre supérieure : jamais tronqués (la règle .ribbon-fold button{width:30px} vise les icônes).
 function labels(){for(const b of document.querySelectorAll('.ribbon-topbar .ribbon-fold button, .ribbon-fold button')){const t=b.textContent.trim();if(t.length>2&&!b.querySelector('svg:only-child'))b.classList.add('ribbon-fold-label');}}
 labels();addEventListener('load',labels);
 const css=document.createElement('style');css.textContent=`
#detail-library[open]{inset:auto!important;right:auto!important;bottom:auto!important;margin:0!important;max-height:none!important;border-radius:0 8px 8px 0;border-left:0;box-shadow:4px 0 18px #0005;overflow:hidden}
#detail-library #detail-library-list{flex:1 1 auto;min-height:0;overflow-y:auto;grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}
#detail-library #detail-library-list>p{grid-column:1/-1;margin:8px 2px;max-width:none}
#detail-library .detail-heading,#detail-library .detail-heading h2,.inspector-card>summary,.ribbon-topbar,dialog h2{user-select:none;-webkit-user-select:none}
.library-dock-handle{position:absolute;top:0;right:0;width:7px;height:100%;cursor:ew-resize;z-index:2;touch-action:none}
.library-dock-handle:hover,.library-dock-resizing .library-dock-handle{background:linear-gradient(90deg,transparent 2px,#7f97a6 2px,#7f97a6 4px,transparent 4px)}
.library-dock-resizing{cursor:ew-resize!important;user-select:none}
.library-dock-vhandle{position:absolute;left:0;right:7px;bottom:0;height:8px;cursor:ns-resize;z-index:2;touch-action:none}
.library-dock-vhandle:hover,.library-dock-vresizing .library-dock-vhandle{background:linear-gradient(180deg,transparent 3px,#7f97a6 3px,#7f97a6 5px,transparent 5px)}
.library-dock-vresizing{cursor:ns-resize!important;user-select:none}
.ribbon-fold button.ribbon-fold-label,.ribbon-topbar #library-palette-toggle{width:auto!important;min-width:105px;height:28px;min-height:28px;padding:3px 10px;font-size:12px;line-height:18px;white-space:nowrap;overflow:visible;text-overflow:clip;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;border-radius:5px}`;document.head.append(css);
 if(dialog.open)place();
})();
