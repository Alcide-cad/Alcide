// Etapes réelles transmises par le moteur ; pas de pourcentage estimé.
(()=>{
 const host=document.getElementById('busy'),box=document.createElement('section');box.id='save-progress124';box.hidden=true;
 box.innerHTML='<div class="save124-heading"><strong>Enregistrement sécurisé</strong><span data-elapsed></span></div><ol></ol><small>Zoom et déplacement disponibles. Les modifications reprennent après la vérification.</small>';
 host.append(box);
 const labels=['Préparer le dessin','Écrire le DWG','Relire et vérifier','Remplacer le fichier'],list=box.querySelector('ol');
 for(const text of labels){const li=document.createElement('li');li.textContent=text;list.append(li);}
 let timer=0,start=0,doc=null,step=0;
 const show=()=>{box.querySelector('[data-elapsed]').textContent=((performance.now()-start)/1000).toFixed(0)+' s';[...list.children].forEach((li,i)=>{li.dataset.state=i<step?'done':i===step?'current':'waiting';li.setAttribute('aria-current',i===step?'step':'false');});};
 window.SaveProgress124={start(id){doc=id;step=0;start=performance.now();box.hidden=false;host.classList.add('save124','soft');show();clearInterval(timer);timer=setInterval(show,250);},finish(){clearInterval(timer);timer=0;doc=null;box.hidden=true;host.classList.remove('save124');},state:()=>({doc,step,elapsed:doc?(performance.now()-start)/1000:0})};
 api.onProgress(p=>{if(!doc||p.docId&&p.docId!==doc)return;const text=p.text||'';step=Math.max(step,/remplacement|publication|copie de sécurité/i.test(text)?3:/vérification|relecture|relire/i.test(text)?2:/conversion|création du DWG|écriture|écrire/i.test(text)?1:0);show();});
 const css=document.createElement('style');css.textContent='#busy.save124{display:block;width:min(360px,calc(100% - 40px));padding:14px;box-sizing:border-box;box-shadow:0 6px 24px #0005}#busy.save124[hidden]{display:none}#busy.save124>.spinner,#busy.save124>#busytext{display:none}#save-progress124 .save124-heading{display:flex;justify-content:space-between;gap:12px;font-size:13px}#save-progress124 ol{display:grid;grid-template-columns:1fr 1fr;gap:8px;list-style:none;padding:0;margin:12px 0}#save-progress124 li{font-size:11px;color:var(--muted);border-left:2px solid #60717c;padding-left:7px}#save-progress124 li[data-state=current]{color:var(--text);border-color:#ffc978}#save-progress124 li[data-state=done]{color:var(--accent);border-color:var(--accent)}#save-progress124 small{font-size:10px;line-height:1.4;display:block;color:var(--muted)}';document.head.append(css);
})();
