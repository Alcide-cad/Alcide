(()=>{
 const dialog=document.getElementById('snap-settings-dialog');if(!dialog)return;
 const body=document.createElement('div');body.className='snap-settings-body';
 function card(title,path){const s=document.createElement('section');s.className='snap-settings-card';s.innerHTML='<h3><svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+path+'"/></svg><span>'+title+'</span></h3>';body.append(s);return s;}
 const grid=card('Grille','M4 4h16v16H4zM4 9h16M4 15h16M9 4v16M15 4v16'),snaps=card('Accrochages géométriques','M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4M9 9h6v6H9z'),tracking=card('Repères et alignements','M3 12h18M12 3v18M4 4l16 16');tracking.classList.add('snap-settings-wide');
 function move(id,host){const n=document.getElementById(id);if(n)host.append(n.closest('label')||n);}
 for(const id of ['grid-visible-setting','grid-snap-setting','grid-spacing-setting'])move(id,grid);
 snaps.append(document.getElementById('snap-kinds-settings'));move('snap-radius-setting',snaps);
 for(const id of ['alignment-tracking-enabled','alignment-tracking-delay','element-alignment-enabled','magnetic45-enabled'])move(id,tracking);
 for(const label of body.querySelectorAll('label.row')){const input=label.querySelector('input');if(input?.type==='checkbox'){input.classList.add('toggle-switch');input.setAttribute('role','switch');}for(const node of [...label.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim())){const span=document.createElement('span');span.className='snap-setting-label';span.textContent=node.textContent.trim();node.replaceWith(span);}}
 const hint=dialog.querySelector('p.muted'),error=document.getElementById('snap-setting-error'),footer=document.createElement('div');footer.className='snap-settings-footer';footer.append(document.getElementById('cancel-snap-settings'),document.getElementById('save-snap-settings'));dialog.append(body,hint,error,footer);
 const style=document.createElement('style');style.textContent=`
 #snap-settings-dialog{width:min(680px,calc(100vw - 32px));max-width:680px;max-height:90vh;padding:20px!important;box-sizing:border-box;overflow:auto;border:1px solid #506a7b;border-radius:12px;background:#1c2b35;box-shadow:0 18px 60px #0008}
 #snap-settings-dialog>h2{margin:0 0 8px;font-size:18px!important}#snap-settings-dialog>p{font-size:12px;line-height:1.5;margin:0 0 14px;color:#adbfcb}
 #snap-settings-dialog .snap-settings-body{display:grid;grid-template-columns:1fr 1fr;gap:12px}
 #snap-settings-dialog .snap-settings-card{border:1px solid #3d5362;background:#223440;border-radius:8px;padding:12px;min-width:0}
 #snap-settings-dialog .snap-settings-card h3{display:flex;align-items:center;gap:8px;color:#c1dfab;font-size:12px;margin:0 0 9px;padding:0 0 9px;border-bottom:1px solid #3a5260}
 #snap-settings-dialog .snap-settings-card h3 svg{width:18px;height:18px;fill:none;stroke:#add687;stroke-width:1.6;flex:0 0 18px}
 #snap-settings-dialog .snap-settings-wide{grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr;column-gap:24px}
 #snap-settings-dialog .snap-settings-wide h3{grid-column:1/-1}
 #snap-settings-dialog label.row{display:flex!important;justify-content:space-between!important;align-items:center!important;gap:10px!important;min-height:32px;margin:2px 0!important;font-size:12px;line-height:1.35}
 #snap-settings-dialog .snap-setting-label{flex:1;min-width:0}#snap-settings-dialog .numeric-stepper{flex:0 0 100px!important;width:100px!important;height:28px!important;min-height:28px!important}
 #snap-settings-dialog .numeric-stepper>input{width:100%!important;min-width:0!important;height:28px!important;box-sizing:border-box}
 #snap-settings-dialog .numeric-stepper-buttons{width:20px!important;flex:0 0 20px;height:28px!important}#snap-settings-dialog .numeric-stepper-buttons>button{height:14px!important;min-height:0!important;line-height:1!important;padding:0 2px!important;margin:0!important}
 #snap-settings-dialog input.toggle-switch{appearance:none!important;flex:0 0 34px!important;width:34px!important;height:20px!important;min-height:20px!important;border:1px solid #607884!important;border-radius:12px!important;background:#3d5361!important;position:relative;margin:0;cursor:pointer}
 #snap-settings-dialog input.toggle-switch::before{content:'';position:absolute;width:14px;height:14px;top:2px;left:2px;border-radius:50%;background:#d6e3e9;transform:none;transition:transform .12s}
 #snap-settings-dialog input.toggle-switch:checked{background:#a4d37c!important;border-color:#a4d37c!important}#snap-settings-dialog input.toggle-switch:checked::before{transform:translateX(14px);background:#18303a}
 #snap-settings-dialog>p.muted{margin:12px 0 8px;font-size:11px}#snap-settings-dialog #snap-setting-error:empty{display:none}
 #snap-settings-dialog .snap-settings-footer{display:flex;justify-content:flex-end;gap:8px;margin-top:14px;padding-top:12px;border-top:1px solid #3c5361}
 #snap-settings-dialog .snap-settings-footer button{min-width:90px;height:30px;padding:4px 12px;font-size:12px}
 @media(max-width:600px){#snap-settings-dialog .snap-settings-body,#snap-settings-dialog .snap-settings-wide{grid-template-columns:1fr}#snap-settings-dialog .snap-settings-wide{grid-column:auto}}
 `;document.head.append(style);
})();
