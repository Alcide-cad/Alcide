// Demander le rayon avant de choisir les deux côtés de l’arrondi.
(()=>{
 const dialog=document.createElement('dialog');dialog.id='fillet-radius-dialog';
 dialog.innerHTML='<form><h2>Créer un arrondi</h2><p>Choisissez le rayon, puis cliquez les deux segments du côté à conserver.</p><label>Rayon (cm)<input id="fillet-radius-value" type="text" inputmode="decimal" autocomplete="off" required></label><p id="fillet-radius-error" role="alert"></p><footer><button type="button" id="fillet-radius-cancel">Annuler</button><button type="submit" class="primary">Continuer</button></footer></form>';
 document.body.append(dialog);const input=dialog.querySelector('input'),error=dialog.querySelector('[role=alert]'),start=window.startCoreTool;
 window.startCoreTool=function(mode){if(mode!=='fillet')return start.apply(this,arguments);if(!scene||busy)return;input.value=document.getElementById('core-distance').value;error.textContent='';dialog.showModal();input.focus();input.select();};
 dialog.querySelector('form').onsubmit=ev=>{ev.preventDefault();let radius;try{radius=cadNumeric(input.value);}catch{}if(!Number.isFinite(radius)||radius<=0){error.textContent='Saisissez un rayon strictement positif.';input.focus();return;}document.getElementById('core-distance').value=String(radius);dialog.close();start('fillet');};
 document.getElementById('fillet-radius-cancel').onclick=()=>dialog.close();
 const css=document.createElement('style');css.textContent='#fillet-radius-dialog{width:min(420px,calc(100vw - 40px));padding:24px;border-radius:12px}#fillet-radius-dialog h2{margin-top:0}#fillet-radius-dialog p{font-size:13px;line-height:1.5}#fillet-radius-dialog label{display:flex;flex-direction:column;gap:8px}#fillet-radius-dialog input{width:100%;box-sizing:border-box;min-height:38px}#fillet-radius-dialog footer{display:flex;justify-content:flex-end;gap:10px;margin-top:18px}#fillet-radius-error{color:#ffb4a5}';document.head.append(css);
})();
