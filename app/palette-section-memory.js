// État des rubriques enregistré uniquement après un geste utilisateur.
(()=>{
 const KEY='paletteSectionOpen:v1';let states={};try{const value=JSON.parse(localStorage.getItem(KEY)||'{}');if(value&&typeof value==='object'&&!Array.isArray(value))states=value;}catch{}
 const pending=new WeakSet(),bound=new WeakSet();let saveTimer=0,scanFrame=0;
 const roots='aside,#rebar-dialog,#linear-rebar-panel,#detail-library';
 const eligible=d=>d?.tagName==='DETAILS'&&!!d.closest(roots);
 function key(d){if(d.id)return 'id:'+d.id;const owner=d.closest(roots),field=d.querySelector('input[id],select[id],textarea[id]');if(field)return (owner.id||'palette')+':field:'+field.id;const label=d.querySelector(':scope>summary')?.textContent.trim().replace(/\s+/g,' ');return label?(owner.id||'palette')+':title:'+label:null;}
 function flush(){clearTimeout(saveTimer);saveTimer=0;try{localStorage.setItem(KEY,JSON.stringify(states));}catch{}}
 function restore(d){const id=key(d);if(id&&typeof states[id]==='boolean'){if(d.open!==states[id])d.open=states[id];return true;}return false;}
 window.restorePaletteSectionState=d=>eligible(d)&&restore(d);
 function bind(d){if(!eligible(d)||bound.has(d))return;bound.add(d);restore(d);}
 function scan(){scanFrame=0;for(const d of document.querySelectorAll('details'))bind(d);}
 document.addEventListener('click',ev=>{const summary=ev.target.closest?.('summary'),d=summary?.parentElement;if(!eligible(d)||ev.target.closest('input,select,button,a,textarea'))return;pending.add(d);setTimeout(()=>{if(!ev.defaultPrevented){const id=key(d);if(id&&states[id]!==d.open){states[id]=d.open;clearTimeout(saveTimer);saveTimer=setTimeout(flush,150);}}pending.delete(d);},0);},true);
 new MutationObserver(records=>{for(const r of records){if(r.type==='attributes'){if(eligible(r.target)&&!pending.has(r.target))restore(r.target);}else if(!scanFrame&&[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches('details')||n.querySelector('details'))))scanFrame=requestAnimationFrame(scan);}}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open']});
 window.addEventListener('pagehide',flush);window.addEventListener('beforeunload',flush);scan();window.paletteSectionMemoryReady=true;
})();
