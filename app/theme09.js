(()=>{
 let mode=localStorage.getItem('theme09')==='light'?'light':'dark',paper=false,paperColors=false;
 const current=()=>paper?(paperColors?'paper-color':'paper'):mode;
 // Display contexts only: saved colours, fills and export records remain untouched.
 const nativeStyles=new Map(['fillStyle','strokeStyle'].map(property=>[property,Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype,property)]));let mapped=false;
 function mapContexts(enabled){if(mapped===enabled)return;for(const [property,d]of nativeStyles){if(!d?.set)continue;Object.defineProperty(CanvasRenderingContext2D.prototype,property,enabled?{...d,set(value){d.set.call(this,Theme09Core.color(value,current()));}}:d);}mapped=enabled;}
 const surfaceSheet=document.createElement('style');surfaceSheet.id='theme09-surfaces';document.head.append(surfaceSheet);
 function surfaces(){const rules=[];
  function visit(list){for(const rule of list){if(rule.cssRules?.length&&!rule.style){visit(rule.cssRules);continue;}const selector=rule.selectorText,style=rule.style;if(!selector||!style||selector.includes('data-theme')||/swatch|colour|color-chip|toggle-switch|input|:root/.test(selector))continue;
    const bg=style.getPropertyValue('background')||style.getPropertyValue('background-color'),hex=bg.match(/#[0-9a-f]{6}|#[0-9a-f]{3}\b/ig)||[],rgb=[...bg.matchAll(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/g)].map(m=>m.slice(1,4).map(Number)),colors=[...rgb,...hex.map(s=>s.length===4?[...s.slice(1)].map(x=>parseInt(x+x,16)):[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)))];if(!colors.some(c=>Math.max(...c)<155))continue;
    const scoped=selector.split(/,(?![^()]*\))/).map(s=>s.trim().startsWith('body')?s.trim().replace(/^body/,'body[data-theme="light"]'):'body[data-theme="light"] '+s).join(',');
    rules.push(scoped+'{background:#f0f5fa!important;color:#24384b!important;border-color:#c6d2de!important}');
  }}
  for(const sheet of document.styleSheets){if(sheet.ownerNode===surfaceSheet||sheet.href?.endsWith('release09.css'))continue;try{visit(sheet.cssRules);}catch{}}
  const text=rules.join('\n')+'\nbody[data-theme="light"] .ribbon-tabs button[aria-selected="true"]{background:#dcebdc!important;color:#234d2a!important;border-color:#70a276!important;box-shadow:inset 0 -2px #4a8552!important}';if(surfaceSheet.textContent!==text)surfaceSheet.textContent=text;
 }
 function apply(){mapContexts(current()!=='dark');surfaces();document.body.dataset.theme=mode;document.body.dataset.paper=String(paper);document.documentElement.style.colorScheme=mode;localStorage.setItem('theme09',mode);window.theme09Revision=(window.theme09Revision||0)+1;window.finishInteractiveNavigation?.();window.resetWorkerGraphicsCache?.();requestRender();$('#theme09-toggle').textContent=mode==='dark'?'☀ Thème clair':'☾ Thème sombre';$('#theme09-paper').textContent=paper?'Quitter le fond papier':'Aperçu papier';}
 function set(next){if(!['light','dark'].includes(next))throw Error('Thème inconnu.');mode=next;apply();}
 const button=document.createElement('button');button.id='theme09-toggle';button.onclick=()=>set(mode==='dark'?'light':'dark');$('.ribbon-fold').prepend(button);
 const print=document.createElement('button');print.id='theme09-paper';print.title='Vue courante sur fond blanc, sans grille, traits monochromes. Les fichiers exportés conservent leurs attributs.';print.onclick=()=>{paper=!paper;paperColors=false;apply();};$('#ribbon-affichage .ribbon-tools').append(print);
 const grid=paintDrawingGrid;paintDrawingGrid=function(...a){if(!paper)return grid(...a);};
 window.Theme09={set,current,mode:()=>mode,background:()=>paper?'rgb(255,255,255)':mode==='light'?'rgb(248,250,252)':'rgb(17,24,32)',paper:(enabled,colors=false)=>{paper=!!enabled;paperColors=!!colors;apply();},color:value=>Theme09Core.color(value,current())};apply();
 let surfaceTimer;new MutationObserver(records=>{if(records.some(r=>r.target!==surfaceSheet&&[...r.addedNodes].some(n=>n.nodeType===1&&['LINK','STYLE'].includes(n.tagName)&&n!==surfaceSheet))){clearTimeout(surfaceTimer);surfaceTimer=setTimeout(surfaces,30);}}).observe(document.head,{childList:true});window.addEventListener('load',surfaces,{once:true});
 new MutationObserver(()=>{const root=$('#preferences-content');if(root?.dataset.section==='files'&&!root.querySelector('#recovery09-settings'))Recovery09.preferences(root);}).observe($('#preferences-content'),{childList:true});
 const prefs=showPreferences;showPreferences=function(...args){const r=prefs(...args);const root=$('#preferences-content');if(root?.dataset.section==='drawing'){const row=document.createElement('section');row.className='v09-card';row.innerHTML='<h3>Apparence</h3><p>Un thème clair adapté au dessin, sans modifier les couleurs enregistrées.</p>';for(const [text,fn]of [['Thème clair',()=>set('light')],['Thème sombre',()=>set('dark')]]){const b=document.createElement('button');b.textContent=text;b.onclick=fn;row.append(b);}root.prepend(row);}if(root?.dataset.section==='files'&&!root.querySelector('#recovery09-settings'))Recovery09.preferences(root);return r;};
})();
