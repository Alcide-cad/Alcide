// 1.0.97 — Zone du bas épurée : à gauche, l'outil courant et sa consigne (lisible, sans doublon) ; à droite, les commandes
// alignées (ligne de commande, bouton « Barre rapide » F6). La barre d'accès rapide n'est plus ancrée ici : fenêtre flottante
// redimensionnable ou fenêtre séparée sur un autre écran (quickbar-window108.js). Barre d'état : commandes alignées à droite.
(()=>{
 const bar=document.getElementById('quickbar-bottom120');if(!bar)return;
 // Feuille de style dans <head> : elle est aussi copiée dans la fenêtre séparée de la barre rapide (autre écran).
 const sheet=document.querySelector('link[href="bar197.css"]');if(sheet&&sheet.parentElement!==document.head)document.head.append(sheet);
 const name=document.getElementById('command09-name'),hint=document.getElementById('command09-hint'),status=document.getElementById('status'),footer=status?.closest('footer');
 const desc=name?.parentElement;const instr=document.createElement('span');instr.id='qz197-instr';instr.setAttribute('aria-live','polite');desc?.appendChild(instr);desc?.classList.add('qz197-desc');
 bar.classList.add('qz197');footer?.classList.add('qz197-footer');
 // Groupe de droite : actions de l'outil (Valider / Terminer), ligne de commande, bouton Barre rapide.
 const right=document.createElement('div');right.id='qz197-right';const cmd=document.getElementById('cmd196-wrap'),actions=document.getElementById('command09-actions');
 const qb=document.createElement('button');qb.type='button';qb.id='quickbar-toggle197';qb.className='ui-button';qb.title='Afficher / masquer la barre d’accès rapide (fenêtre flottante, déplaçable sur un autre écran) · F6';qb.setAttribute('aria-label',qb.title);
 qb.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h2m3 0h2m3 0h1M7 14h10"/></svg><span>Barre rapide</span><kbd>F6</kbd>';
 if(cmd)right.append(cmd);right.append(qb);const fold=footer?.querySelector('.bottom-fold'),help=document.getElementById('help-permanent');if(fold)right.append(fold);if(help)right.append(help);bar.append(right);void actions;
 const qbState=()=>{const s=window.QuickToolbar108?.state?.();qb.setAttribute('aria-pressed',String(!!s&&!s.hidden));};
 qb.onclick=()=>{window.QuickToolbar108?.toggle?.();qbState();};
 window.addEventListener('keydown',ev=>{if(ev.key!=='F6'||ev.ctrlKey||ev.altKey||ev.metaKey)return;ev.preventDefault();window.QuickToolbar108?.toggle?.();qbState();},true);
 // Ortho dans la barre d'état, à côté des accrochages (même interrupteur que #ortho).
 const src=document.getElementById('ortho');if(src&&footer){const lab=document.createElement('label');lab.id='bottom-ortho197';lab.title='Ortho · tracés horizontaux et verticaux';lab.innerHTML='<span>Ortho</span><input id="bottom-ortho197-toggle" type="checkbox" role="switch" aria-label="Ortho">';const snapCtl=document.getElementById('bottom-snap-control');snapCtl?snapCtl.after(lab):footer.insertBefore(lab,document.getElementById('coords'));
  const inp=lab.querySelector('input'),sync=()=>{inp.checked=src.checked;lab.classList.toggle('enabled',src.checked);};inp.onchange=()=>{src.checked=inp.checked;src.dispatchEvent(new Event('change',{bubbles:true}));sync();window.drawOverlay?.();};src.addEventListener('change',sync);
  const draw=drawOverlay;drawOverlay=function(...a){const r=draw.apply(this,a);sync();return r;};sync();}
 const clean=t=>String(t||'').replace(/\s+/g,' ').trim();
 function message(){const n=clean(name?.textContent),st=clean(status?.textContent),h=clean(hint?.textContent);
  let m=st||h;if(n&&m.toLowerCase().startsWith(n.toLowerCase()+' :'))m=m.slice(n.length+2).trim();if(m)m=m[0].toUpperCase()+m.slice(1);return m||h;}
 function sync(){const m=message();if(instr.textContent!==m){instr.textContent=m;if(desc)desc.title=clean(name?.textContent)+' — '+m;}
  footer?.classList.toggle('qz197-status-dup',!!m);qbState();}
 let raf=0;const schedule=()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;sync();mo.takeRecords();});};
 const mo=new MutationObserver(schedule);if(desc)mo.observe(desc,{childList:true,subtree:true,characterData:true});if(status)mo.observe(status,{childList:true,characterData:true,subtree:true});
 window.addEventListener('quickbar-toggle197',qbState);sync();
 window.Bar197={sync};
})();
