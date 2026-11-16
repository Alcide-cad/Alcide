// Adapt to available window width, including portrait screens and Windows scaling.
(()=>{
 const top=document.querySelector('.ribbon-topbar'),fold=top?.querySelector('.ribbon-fold');if(!fold)return;
 const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href='workspace-responsive.css';document.head.append(sheet);
 const more=document.createElement('button');more.id='workspace-more';more.type='button';more.textContent='•••';more.title='Plus · thème, bibliothèque et paramètres';more.setAttribute('aria-label',more.title);more.setAttribute('aria-expanded','false');
 const menu=document.createElement('div');menu.id='workspace-more-menu';menu.setAttribute('popover','auto');document.body.append(menu);more.setAttribute('popovertarget',menu.id);fold.prepend(more);
 const stored=new Map();let narrow=null;
 function close(){if(menu.matches(':popover-open'))menu.hidePopover();}
 menu.addEventListener('toggle',()=>{more.setAttribute('aria-expanded',String(menu.matches(':popover-open')));});
 menu.addEventListener('click',e=>{if(e.target.closest('button'))close();});
 more.onclick=()=>requestAnimationFrame(()=>{if(!menu.matches(':popover-open'))return;const box=more.getBoundingClientRect();menu.style.left=Math.max(8,Math.min(box.right-menu.offsetWidth,innerWidth-menu.offsetWidth-8))+'px';menu.style.top=box.bottom+6+'px';});
 function sync(){const next=innerWidth<=1100;if(next===narrow)return;narrow=next;close();document.documentElement.classList.toggle('workspace-narrow',next);
  if(next){for(const e of [...fold.children]){if(e===more||e.id==='toggleribbon')continue;const marker=document.createComment('responsive action');e.before(marker);stored.set(e,marker);menu.append(e);}}
  else{for(const [e,marker]of stored){marker.replaceWith(e);}stored.clear();}
  requestAnimationFrame(()=>window.RibbonFit?.fit());
 }
 let frame=0;window.addEventListener('resize',()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(sync);});
 // A drawer keeps the canvas dimensions stable while inspecting an object.
 for(const id of ['propertiespanel','layerpanel']){const panel=document.getElementById(id);if(!panel)continue;const title=panel.querySelector('.aside-title');if(!title)continue;const b=document.createElement('button');b.type='button';b.className='responsive-panel-close';b.textContent='×';b.title='Fermer la palette';b.setAttribute('aria-label','Fermer la palette');b.onclick=()=>id==='propertiespanel'?setPanelVisible(false):setLayerPanelVisible(false);title.append(b);}
 const right=document.getElementById('propertiespanel'),left=document.getElementById('layerpanel');
 const drawers=new MutationObserver(records=>{if(innerWidth>900||right.hidden||left.hidden)return;const opened=[...records].reverse().find(r=>!r.target.hidden)?.target;if(opened===left)setPanelVisible(false);else setLayerPanelVisible(false);});
 for(const panel of [right,left])drawers.observe(panel,{attributes:true,attributeFilter:['hidden']});
 window.WorkspaceResponsive={sync};sync();
})();
