/* 1.0.94 · ODA File Converter : l'écriture DWG en a besoin (jamais embarqué dans ALCIDE).
   Fenêtre claire au lieu d'une erreur brute, installation automatique en un clic, repli DXF,
   indicateur permanent (barre d'état + Paramètres) et avis unique à l'ouverture d'un DWG sans ODA. */
(()=>{
 const api=window.alcide||{};let last=null,installing=false,pending=null;
 const mo=n=>(n/1048576).toLocaleString('fr-FR',{minimumFractionDigits:1,maximumFractionDigits:1});
 const css=document.createElement('style');css.textContent=`
#oda-dialog194{width:min(540px,calc(100vw - 40px));padding:0;border:1px solid #4d6878;border-radius:10px;background:#1b2a34;color:#e6edf3;box-shadow:0 18px 60px #000a}
#oda-dialog194::backdrop{background:#0008}
#oda-dialog194 .oda-body{padding:18px 20px 16px;display:grid;gap:10px}
#oda-dialog194 h2{margin:0;font-size:16px;line-height:1.3}
#oda-dialog194 p{margin:0;font-size:13px;line-height:1.45;color:#c9d6df}
#oda-dialog194 .oda-state{font-size:12.5px;padding:6px 10px;border-radius:6px;background:#26404f}
#oda-dialog194 .oda-state[data-found=true]{background:#24452f;color:#c9f0cf}
#oda-dialog194 .oda-state[data-found=false]{background:#4a3520;color:#ffdcae}
#oda-dialog194 .oda-actions{display:grid;gap:7px;margin-top:4px}
#oda-dialog194 .oda-actions button{padding:9px 12px;border-radius:7px;border:1px solid #4d6878;background:#253844;color:#e6edf3;font-size:13px;text-align:left;cursor:pointer}
#oda-dialog194 .oda-actions button.primary{background:#2f6d48;border-color:#59a876;font-weight:600}
#oda-dialog194 .oda-actions button:hover:not(:disabled){filter:brightness(1.15)}
#oda-dialog194 .oda-actions button:disabled{opacity:.5;cursor:default}
#oda-dialog194 .oda-row{display:flex;gap:7px}#oda-dialog194 .oda-row button{flex:1;text-align:center}
#oda-dialog194 .oda-progress{display:grid;gap:5px}#oda-dialog194 progress{width:100%;height:10px}
#oda-dialog194 .oda-error{color:#ffb4a8;font-size:12.5px}
#oda-dialog194 .oda-note{font-size:12px;color:#9fb3c0}
#oda-chip194{margin-left:8px;padding:1px 8px;border-radius:10px;border:1px solid #4d6878;background:transparent;color:inherit;font-size:11.5px;cursor:pointer;white-space:nowrap}
#oda-chip194[data-found=true]{border-color:#4f8f61;color:#bfe8c8}#oda-chip194[data-found=false]{border-color:#c08a3e;color:#ffd39a}
#oda-pref194{margin:8px 16px;padding:10px 12px;border:1px solid #4d6878;border-radius:8px;display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-size:12.5px}
#oda-pref194 strong{margin-right:auto}#oda-pref194 button{padding:5px 10px}
#oda-notice194{position:fixed;z-index:232;right:18px;bottom:34px;max-width:390px;padding:10px 12px;border-radius:8px;background:#1d2b35;border:1px solid #c08a3e;color:#e6edf3;font-size:12.5px;box-shadow:0 8px 24px #0007;display:grid;gap:8px}
#oda-notice194 .oda-row{display:flex;gap:6px;justify-content:flex-end}#oda-notice194 button{padding:4px 10px}`;
 document.head.append(css);
 const dlg=document.createElement('dialog');dlg.id='oda-dialog194';dlg.innerHTML=`<form method="dialog" class="oda-body">
<h2 data-title></h2><p data-lead></p><div class="oda-state" data-state></div>
<div class="oda-progress" data-progress hidden><progress max="1" value="0"></progress><small data-ptext></small></div>
<div class="oda-error" data-error hidden></div>
<div class="oda-actions">
<button type="button" class="primary" data-act="install">⬇ Installer ODA File Converter automatiquement</button>
<button type="button" data-act="page">🌐 Télécharger ODA File Converter (gratuit)</button>
<button type="button" data-act="dxf">Enregistrer en DXF à la place</button>
<div class="oda-row"><button type="button" data-act="retry">↻ Réessayer</button><button type="button" data-act="cancel">Annuler</button></div>
</div>
<p class="oda-note">Après une installation, ALCIDE détecte ODA automatiquement, sans redémarrer. ODA File Converter est un logiciel gratuit de l’Open Design Alliance, téléchargé depuis opendesign.com.</p>
</form>`;
 document.body.append(dlg);
 const $q=s=>dlg.querySelector(s),btn=a=>$q(`[data-act=${a}]`);
 function paintState(s){const st=$q('[data-state]');st.dataset.found=String(!!s?.found);st.textContent=s?.found?'ODA File Converter : détecté · '+s.path:'ODA File Converter : non installé sur cet ordinateur';}
 async function status(){try{last=await api.odaStatus();}catch(e){last={found:false,error:e.message};}paintChip();paintPref();return last;}
 function setBusy(on){installing=on;for(const b of dlg.querySelectorAll('button'))b.disabled=on&&b.dataset.act!=='cancel';btn('cancel').disabled=on;}
 function progress(p){const box=$q('[data-progress]'),bar=box.querySelector('progress'),t=$q('[data-ptext]');box.hidden=false;
  if(p.phase==='download'){if(p.total){bar.max=p.total;bar.value=p.received;t.textContent='Téléchargement depuis opendesign.com… '+mo(p.received)+' / '+mo(p.total)+' Mo';}else{bar.removeAttribute('value');t.textContent='Téléchargement depuis opendesign.com…'+(p.received?' '+mo(p.received)+' Mo':'');}}
  else if(p.phase==='install'){bar.removeAttribute('value');t.textContent=p.method==='msi'?'Installation (confirmez la demande de Windows si elle apparaît)…':'Installation pour cet utilisateur…';}
  else if(p.phase==='check'){bar.removeAttribute('value');t.textContent='Vérification : conversion d’essai en DWG…';}}
 api.onOdaInstallProgress?.(p=>{if(installing)progress(p);});
 function showError(text){const e=$q('[data-error]');e.hidden=!text;e.textContent=text||'';}
 function finish(choice){const r=pending;pending=null;if(dlg.open)dlg.close();r?.(choice);}
 async function installNow(){
  if(installing)return;showError('');setBusy(true);progress({phase:'download',received:0,total:0});
  try{const r=await api.odaInstall();await status();paintState(last);if(!last?.found)throw Error('ODA File Converter reste introuvable.');
   $q('[data-ptext]').textContent='ODA File Converter '+(r?.version||'')+' installé et vérifié.';$q('[data-progress] progress').max=1;$q('[data-progress] progress').value=1;
   window.toast187?.('ODA File Converter installé · enregistrement DWG disponible.',4000);
   setBusy(false);if(dlg.dataset.mode==='save')finish('ok');else syncButtons();
  }catch(e){setBusy(false);$q('[data-progress]').hidden=true;const m=String(e.message||e).replace(/^Error invoking remote method '[^']+': (Error: )?/,'');
   showError('Installation automatique impossible : '+m+' · Utilisez « Télécharger ODA File Converter (gratuit) », installez-le, puis « Réessayer ». La page officielle vient de s’ouvrir.');
   api.odaOpenPage?.().catch(()=>{});}
 }
 function syncButtons(){const save=dlg.dataset.mode==='save',found=!!last?.found;btn('install').hidden=found;btn('page').hidden=found&&!save;btn('dxf').hidden=!save;btn('retry').hidden=!save;btn('cancel').textContent=save?'Annuler':'Fermer';}
 btn('install').onclick=installNow;
 btn('page').onclick=()=>{api.odaOpenPage?.().catch(e=>showError(e.message));};
 btn('dxf').onclick=()=>finish('dxf');
 btn('cancel').onclick=()=>{if(!installing)finish('cancel');};
 btn('retry').onclick=async()=>{showError('');const s=await status();paintState(s);if(s?.found)finish('ok');else showError('ODA File Converter n’est toujours pas détecté. Terminez son installation, puis réessayez.');};
 dlg.addEventListener('cancel',e=>{e.preventDefault();if(!installing)finish('cancel');});
 function open(mode){dlg.dataset.mode=mode;showError('');$q('[data-progress]').hidden=true;
  $q('[data-title]').textContent=mode==='save'?'Enregistrer en DWG : ODA File Converter nécessaire':'ODA File Converter (enregistrement DWG)';
  $q('[data-lead]').textContent=mode==='save'?'ALCIDE ouvre les DWG seul, mais l’écriture d’un DWG passe par ODA File Converter, un convertisseur gratuit. Il n’est pas encore installé : ALCIDE peut l’installer pour vous en un clic.':'ALCIDE utilise ODA File Converter (gratuit) pour écrire les fichiers DWG. Sans lui, l’ouverture des DWG fonctionne et l’enregistrement se fait en DXF.';
  paintState(last);syncButtons();if(!dlg.open)dlg.showModal();btn(last?.found?'cancel':'install').focus();}
 // Appelé avant chaque enregistrement DWG : 'ok' (ODA présent), 'dxf' (repli) ou 'cancel'.
 async function ensure(){const s=await status();if(s?.found)return 'ok';if(pending)return 'cancel';return new Promise(r=>{pending=r;open('save');});}
 // Barre d'état.
 const chip=document.createElement('button');chip.id='oda-chip194';chip.type='button';chip.onclick=async()=>{await status();open('info');};
 function paintChip(){chip.dataset.found=String(!!last?.found);chip.textContent=last?.found?'DWG : ODA détecté':'DWG : ODA non installé';chip.title=last?.found?'ODA File Converter : détecté · '+last.path:'ODA File Converter : non installé · cliquer pour l’installer (gratuit)';}
 function placeChip(){const f=document.querySelector('footer');if(f&&!chip.isConnected){const perf=f.querySelector('#perf');perf?f.insertBefore(chip,perf):f.append(chip);}}
 // Paramètres.
 const pref=document.createElement('section');pref.id='oda-pref194';
 function paintPref(){pref.innerHTML='';const s=document.createElement('strong');s.textContent='ODA File Converter : '+(last?.found?'détecté':'non installé');s.title=last?.path||'';pref.append(s);
  if(!last?.found){const i=document.createElement('button');i.type='button';i.textContent='Installer automatiquement';i.onclick=()=>{open('info');installNow();};pref.append(i);}
  const p=document.createElement('button');p.type='button';p.textContent='Page officielle';p.onclick=()=>api.odaOpenPage?.();pref.append(p);
  const r=document.createElement('button');r.type='button';r.textContent='Vérifier';r.onclick=()=>status();pref.append(r);}
 function placePref(){const d=document.getElementById('preferences-dialog');if(d&&!pref.isConnected){const nav=d.querySelector('nav');nav?nav.after(pref):d.append(pref);}}
 // Avis unique quand un DWG est ouvert sans ODA.
 function notice(){if(localStorage.getItem('odaNotice194'))return;localStorage.setItem('odaNotice194','1');const n=document.createElement('div');n.id='oda-notice194';n.setAttribute('role','status');
  n.innerHTML='<span>DWG ouvert sans ODA File Converter. L’ouverture fonctionne ; pour enregistrer en DWG, ALCIDE peut installer ODA (gratuit) en un clic.</span><div class="oda-row"><button type="button" data-i>Installer</button><button type="button" data-x>Plus tard</button></div>';
  n.querySelector('[data-i]').onclick=()=>{n.remove();open('info');installNow();};n.querySelector('[data-x]').onclick=()=>n.remove();document.body.append(n);setTimeout(()=>n.remove(),15000);}
 if(typeof openFile==='function'){const base=openFile;openFile=async function(p,...rest){const r=await base.call(this,p,...rest);if(/\.dwg$/i.test(String(p||''))){status().then(s=>{if(!s?.found)notice();});}return r;};}
 placeChip();placePref();new MutationObserver(()=>{placeChip();placePref();}).observe(document.body,{childList:true});
 status();
 window.OdaSetup194={ensure,status,open,installNow,get last(){return last;},get installing(){return installing;}};
})();
