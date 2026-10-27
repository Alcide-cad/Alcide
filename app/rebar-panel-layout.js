// Compact reinforcement properties: shared inputs, stable grids, persistent actions.
(()=>{
 const panel=$('#rebar-dialog'),geometry=$('#rebar-shape').closest('details');
 const grid=document.createElement('div');grid.className='rebar-geometry-grid';for(const id of ['rebar-shape','rebar-barmode','rebar-width','rebar-height','rebar-angle','rebar-overhang-enabled','rebar-overhangStart','rebar-overhangEnd'])grid.append($('#'+id).closest('label'));geometry.append(grid);geometry.querySelector('summary').textContent='Dimensions et pose';
 const caption=document.createElement('small');caption.className='rebar-units-note';caption.textContent='Dimensions à l’axe · cm';geometry.querySelector('summary').after(caption);
 // 0.7.5 : « Dimensions et pose » en tête du panneau (juste sous le titre) ; visibilité calée sur #rebar-bar (masquée pour les treillis).
 {const bar=$('#rebar-bar'),top=()=>{const head=panel.querySelector('.rebar-panel-heading');if(head&&head.nextElementSibling!==geometry)head.after(geometry);geometry.hidden=!!bar?.hidden;};if(bar)new MutationObserver(()=>{geometry.hidden=bar.hidden;}).observe(bar,{attributes:true,attributeFilter:['hidden']});top();document.addEventListener('DOMContentLoaded',top,{once:true});window.addEventListener('load',top,{once:true});}
 function label(id,text,title){const row=$('#'+id).closest('label'),node=[...row.childNodes].find(n=>n.nodeType===Node.TEXT_NODE);if(node)node.textContent=text;row.title=title||text;}
 label('rebar-height','Hauteur (cm)','Hauteur mesurée à l’axe de la barre');label('rebar-angle','Angle (°)','Orientation de la vue');label('rebar-barmode','Méthode de pose');label('rebar-overhangStart','Débord A (cm)');label('rebar-overhangEnd','Débord B (cm)');
 $('#rebar-barmode').options[0].textContent='Tracer entre deux points';$('#rebar-barmode').options[1].textContent='Placer la forme';
 for(const d of panel.querySelectorAll('details'))if(d!==geometry&&d.id!=='rebar-cover-settings')d.open=d.contains($('#rebar-ref'));$('#rebar-cover-settings').open=false;
 $('#rebar-fast-settings').hidden=true;$('#rebar-fast-settings').dataset.rebarRetired='1';
 const notice=panel.querySelector(':scope > .muted');if(notice){notice.title=notice.textContent;const advanced=$('#rebar-design-code').closest('details');advanced.append(notice);}
 const header=document.createElement('div');header.className='rebar-panel-heading';header.append($('#rebar-title'),$('#rebar-panel-dismiss'));panel.prepend(header);
 const icon=document.createElement('span');icon.className='rebar-shape-badge';icon.setAttribute('aria-hidden','true');header.prepend(icon);const icons={octagon:'M5 11L11 5H21L27 11V21L21 27H11L5 21V11L11 17M5 11H13',straight:'M3 16H29',L:'M6 5V26H28',U:'M5 5V27H27V5',cadre:'M19 13L25 7Q28 3 24 3H7Q4 3 4 6V26Q4 29 7 29H25Q28 29 28 26V7Q28 3 25 6L21 10',epingle:'M10 24H8A5 5 0 0 1 8 14H24A5 5 0 0 1 24 24H22'};const syncIcon=()=>{icon.innerHTML=`<svg viewBox="0 0 32 32"><path d="${$('#rebar-kind').value==='mesh'?'M4 4H28V28H4ZM4 28L28 4M12 4V28M20 4V28M4 12H28M4 20H28':icons[$('#rebar-shape').value]||icons.straight}"/></svg>`;};$('#rebar-shape').addEventListener('change',syncIcon);$('#rebar-kind').addEventListener('change',syncIcon);new MutationObserver(syncIcon).observe($('#rebar-title'),{childList:true});syncIcon();
 const coverQuick=document.createElement('div');coverQuick.id='rebar-cover-quick';const coverRow=$('#rebar-cover-cm').closest('label');$('#rebar-cover-place').textContent='Poser avec enrobage';$('#rebar-cover-place').title='Survoler un bord du coffrage, puis cliquer pour poser avec l’enrobage indiqué';coverQuick.append(coverRow,$('#rebar-cover-place'));const coverApply=$('#rebar-cover-apply');coverApply.textContent='Recaler la sélection';coverApply.title='Appliquer cet enrobage à une armature existante';coverQuick.append(coverApply);$('#rebar-cover-settings').hidden=true;header.after(coverQuick);const coverHint=document.createElement('small');coverHint.textContent='Bord → aperçu → clic · Tab : changer de côté · enrobage jusqu’à l’extérieur de l’acier';coverQuick.append(coverHint);
 const css=document.createElement('style');css.textContent=`
 #rebar-dialog #rebar-cover-quick[hidden]{display:none!important}#rebar-cover-quick{display:grid;grid-template-columns:110px 1fr;align-items:end;gap:5px 10px;background:#233a3c;border:1px solid #526e57;border-radius:8px;padding:8px 10px;margin:8px 0}#rebar-dialog #rebar-cover-quick label{display:flex;flex-direction:column;align-items:stretch;margin:0!important}#rebar-dialog #rebar-cover-quick input{width:100%;max-width:none;box-sizing:border-box}#rebar-dialog #rebar-cover-quick button{height:34px;font-size:12px;padding:5px 8px;background:#354f3d;color:#d6f3bf;border-color:#79945e}#rebar-dialog #rebar-cover-apply{grid-column:1/-1}#rebar-dialog #rebar-cover-apply[hidden]{display:none!important}#rebar-dialog #rebar-cover-settings{display:none!important}#rebar-cover-quick small{grid-column:1/-1;color:#b9cbd5;font-size:10px}
 #rebar-dialog,#rebar-dialog.rebar-placing,#rebar-dialog.rebar-placing.rebar-settings{width:min(410px,calc(100vw - 28px))!important;padding:12px 14px!important;top:calc(var(--ribbon-height,160px) + 125px)!important;bottom:14px!important;max-height:calc(100vh - var(--ribbon-height,160px) - 139px)!important;overflow:auto!important;scrollbar-width:thin;scrollbar-color:#577180 #1b2832;box-sizing:border-box;border-radius:10px}
 #rebar-dialog .rebar-panel-heading{display:flex;align-items:center;justify-content:space-between;gap:10px;position:sticky;top:-12px;background:#1b2832;z-index:3;padding:10px 0;border-bottom:1px solid #3c505e}
 #rebar-dialog h2{font-size:17px!important;line-height:1.3;margin:0!important;min-width:0}#rebar-panel-dismiss{float:none;flex:none;width:28px;height:28px;min-height:0;font-size:21px!important;border-radius:5px!important}
 #rebar-dialog .rebar-form,#rebar-dialog.rebar-placing .rebar-form{display:block!important;margin:8px 0!important}
 #rebar-dialog>hr{display:none!important}#rebar-dialog .rebar-fast{margin:8px 0!important;border:0!important;padding:0!important}#rebar-dialog #rebar-fast-settings{display:none!important}
 #rebar-dialog label{font-size:12px!important;line-height:1.3;margin:6px 0!important;gap:5px!important}
 #rebar-dialog .numeric-stepper{width:100%!important;max-width:100%!important;height:32px;min-height:32px;align-items:stretch}
 #rebar-dialog .numeric-stepper>input{height:32px!important;min-height:0!important;width:100%!important;max-width:none!important;padding:5px 8px!important;font-size:13px!important;box-sizing:border-box}
 #rebar-dialog .numeric-stepper-buttons{flex-basis:22px}#rebar-dialog .numeric-stepper-buttons button{height:16px!important;min-height:0!important;line-height:12px!important;padding:0!important;font-size:11px!important}
 #rebar-dialog select,#rebar-dialog input:not([type=checkbox]){height:32px;min-height:0;font-size:13px!important;padding:5px 8px;box-sizing:border-box}
 #rebar-dialog .rebar-diameter-row{display:grid!important;grid-template-columns:1fr 130px;align-items:center;margin:0!important}#rebar-dialog .rebar-diameter-row select{width:100%;max-width:none}
 #rebar-dialog #rebar-quick-quantity{gap:10px!important}#rebar-dialog #rebar-quick-quantity label{display:flex!important;flex-direction:column!important;align-items:stretch!important;margin:4px 0!important}
 #rebar-dialog .rebar-geometry-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px 12px}
 #rebar-dialog .rebar-geometry-grid>label{display:flex!important;flex-direction:column;align-items:stretch!important;justify-content:flex-start!important;min-width:0}
 #rebar-dialog .rebar-geometry-grid>label[hidden]{display:none!important}
 #rebar-dialog .rebar-geometry-grid select,#rebar-dialog .rebar-geometry-grid input{width:100%!important;max-width:100%!important}
 #rebar-dialog label:has(#rebar-overhang-enabled){grid-column:1/-1;flex-direction:row!important;align-items:center!important}
 #rebar-dialog .rebar-property-section{border-top:1px solid #3c505e;padding:7px 0!important;margin:0!important}
 #rebar-dialog summary{font-size:13px!important;padding:5px 0!important;line-height:1.3}#rebar-dialog .rebar-units-note{display:block;color:#aabecb;font-size:11px;line-height:1.4;margin:2px 0 5px}
 #rebar-dialog .rebar-property-section>label:not(:has(input[type=checkbox])){display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.2fr);align-items:center}
 #rebar-dialog .rebar-property-section>label>select,#rebar-dialog .rebar-property-section>label>input{width:100%!important;max-width:100%!important}
 #rebar-dialog .rebar-property-section button{font-size:12px;min-height:30px;padding:6px 8px;white-space:normal}#rebar-dialog small,#rebar-dialog .muted{font-size:11px!important;line-height:1.45}
 #rebar-dialog .rebar-gesture-help{font-size:11px;margin:7px 0;line-height:1.4;color:#b9cbd5}
 #rebar-dialog #rebar-summary{font-size:11px!important;line-height:1.4;margin:7px 0;white-space:pre-line}
 #rebar-dialog .rebar-actions,#rebar-dialog.rebar-placing .rebar-actions{display:flex!important;align-items:center;gap:7px;position:sticky;bottom:-12px;z-index:3;background:#1b2832;padding:10px 0!important;margin:0!important;border-top:1px solid #3c505e}
 #rebar-dialog .rebar-actions button{min-height:32px;font-size:12px;padding:7px 10px;white-space:normal;flex:1}
 #rebar-dialog .rebar-label-default{font-size:12px!important;margin:7px 0!important}#rebar-dialog input[type=checkbox]{width:15px!important;height:15px!important;flex:none}
 @media(max-height:720px){#rebar-dialog,#rebar-dialog.rebar-placing,#rebar-dialog.rebar-placing.rebar-settings{top:calc(var(--ribbon-height,160px) + 105px)!important;max-height:calc(100vh - var(--ribbon-height,160px) - 119px)!important}}

 #rebar-dialog,#rebar-label-style{background:linear-gradient(155deg,#1e2d38,#172630)!important;border-color:#405d70;box-shadow:0 12px 32px #0005}
 #rebar-dialog .rebar-panel-heading{border:0!important;background:#1e2d38;gap:10px;padding:7px 0 11px}#rebar-dialog .rebar-panel-heading h2{flex:1}
 #rebar-dialog .rebar-shape-badge{width:34px;height:34px;flex:none;display:grid;place-items:center;background:#2b403b;border:1px solid #78975e66;border-radius:9px;color:#b3e58c}#rebar-dialog .rebar-shape-badge svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:2;stroke-linejoin:round;stroke-linecap:round}
 #rebar-dialog .rebar-property-section{border:0!important;background:#223440;padding:8px 10px!important;margin:8px 0!important;border-radius:8px}
 #rebar-dialog .rebar-property-section:not([open]){background:#20313b}#rebar-dialog .rebar-property-section summary{color:#dce9ef;font-weight:600}
 #rebar-dialog .rebar-property-section[open] summary{color:#b3e58c}#rebar-dialog .rebar-units-note{margin-top:1px;font-size:10px;color:#a2b8c7}
 #rebar-dialog hr,#rebar-dialog .rebar-form,#rebar-dialog .rebar-fast,#rebar-dialog #rebar-bar,#rebar-dialog #rebar-mesh{border:0!important}#rebar-dialog hr{display:none!important}
 #rebar-dialog .rebar-actions{border:0!important;background:#172630;padding-top:9px!important}
 #rebar-dialog input:not([type=checkbox]),#rebar-dialog select{background:#14232d;border-color:#405564;border-radius:6px;color:#e5edf4}
 #rebar-dialog input:not([type=checkbox]):focus,#rebar-dialog select:focus{outline:2px solid #84b8d8;outline-offset:0}
 #rebar-dialog .numeric-stepper>input{border-radius:6px 0 0 6px}#rebar-dialog .numeric-stepper-buttons>button{background:#2b3e4b;border-color:#405564}
 #rebar-dialog label.rebar-diameter-row[hidden],#rebar-dialog #rebar-quick-quantity[hidden]{display:none!important}
 #rebar-dialog .rebar-diameter-row{background:#223440;border-radius:8px;padding:8px 10px;box-sizing:border-box}
 `;document.head.append(css);
})();

// 0.7.6 : Diamètre (mm) dans « Dimensions et pose », à la suite de l’angle (même id, mêmes fonctions).
(()=>{const move=()=>{const d=document.getElementById('rebar-diameter')?.closest('label'),a=document.getElementById('rebar-angle')?.closest('label');if(d&&a&&a.parentElement?.classList.contains('rebar-geometry-grid')&&a.nextElementSibling!==d){a.after(d);d.classList.add('rebar-diameter-row');}};move();document.addEventListener('DOMContentLoaded',move,{once:true});window.addEventListener('load',()=>{move();setTimeout(move,0);},{once:true});})();
