// Fold only explanatory prose; controls, live results and status remain visible.
(()=>{
 const ids=['core-tool-settings','selection-filter','drawing-style'];
 function scan(){for(const id of ids){const root=document.getElementById(id);if(!root)continue;for(const p of [...root.querySelectorAll(':scope > p')]){if(p.closest('.design175-help')||p.querySelector('input,button,select')||p.textContent.length<110)continue;const help=document.createElement('details');help.className='design175-help';const title=document.createElement('summary');title.textContent='Mode d’emploi';help.append(title);p.replaceWith(help);help.append(p);}}}
 let queued=false;new MutationObserver(records=>{if(queued||!records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1)))return;queued=true;requestAnimationFrame(()=>{queued=false;scan();});}).observe(document.getElementById('propertiespanel'),{childList:true,subtree:true});
 scan();
})();
