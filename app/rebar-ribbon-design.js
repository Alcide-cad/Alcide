// Reinforcement ribbon: compact shape tiles, consistent icons, aligned command groups.
(()=>{
 const page=$('#ribbon-armatures');
 const groups=[...page.querySelectorAll('.rebar-command-group')];groups[0]?.classList.add('rebar-shapes-group');
 const paths={
 'rebar-cover-ribbon':'M3 5h26v23H3zM8 11v12h15V11M8 8v6M5 11h6M23 8v6M20 11h6',
 'rebar-new-mesh':'M4 5h24v22H4zM4 27L28 5M10 5v22M17 5v22M24 5v22M4 12h24M4 19h24',
 'rebar-convert-line-ribbon':'M3 7h14M12 4l5 3-5 3M7 23h17q4 0 4-4v-4M23 16l5-5 4 5',
 'rebar-properties':'M5 8h22M5 16h22M5 24h22M11 4v8M22 12v8M14 20v8',
 'rebar-panel-toggle':'M4 5h24v23H4zM18 5v23M21 11h4M21 17h4M21 23h4',
 'rebar-stretch':'M4 6v20M28 6v20M5 16h22M10 11l-5 5 5 5M22 11l5 5-5 5',
 'rebar-label-place-ribbon':'M8 24l10-10M3 28l5-4-1 4M21 4a7 7 0 1 0 0 14 7 7 0 1 0 0-14M21 8v6',
 'rebar-label-none-ribbon':'M21 4a7 7 0 1 0 0 14 7 7 0 1 0 0-14M5 27L27 5',
 'rebar-label-style-ribbon':'M4 7h24M16 7v21M10 28h12M4 7v5M28 7v5',
 'rebar-table-ribbon':'M4 4h24v24H4zM4 11h24M4 19h24M13 4v24M21 4v24',
 'rebar-schedule':'M8 3h17l4 5v21H8zM13 12h11M13 18h11M13 24h8M3 9v19'
 };
 for(const [id,d]of Object.entries(paths)){const b=$('#'+id);if(!b||!page.contains(b))continue;const title=b.textContent.trim();b.setAttribute('aria-label',title);b.innerHTML='<svg viewBox="0 0 32 32" aria-hidden="true"><path d="'+d+'"/></svg><span>'+title+'</span>';b.classList.add('rebar-ribbon-command');}
 const settings=document.createElement('button');settings.id='rebar-colours-ribbon';settings.className='rebar-ribbon-command';settings.innerHTML='<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 5h10v10H5zM19 5h8v10h-8zM5 19h10v8H5zM19 19h8v8h-8z"/></svg><span>Couleurs HA / TS</span>';settings.title='Couleurs par diamètre HA et référence TS';settings.onclick=()=>showPreferences('reinforcement');groups.find(g=>g.textContent.includes('Modifier'))?.querySelector('.rebar-command-tools').append(settings);
 const css=document.createElement('style');css.textContent=`
 #ribbon-armatures{gap:0!important;align-items:stretch!important;padding:7px 6px 4px;background:#1b2a35}
 #ribbon-armatures .rebar-command-group{display:flex!important;flex-direction:column;justify-content:space-between;flex:0 0 auto!important;padding:0 12px!important;border:0;border-right:1px solid #384c59;min-height:108px;background:transparent}
 #ribbon-armatures .rebar-command-group:last-child{border:0}#ribbon-armatures .rebar-command-group>small{display:block;text-align:center;font-size:10px;font-weight:500;letter-spacing:.2px;color:#9eb4c3;margin:7px 0 0;padding:0;border:0;line-height:14px}
 #ribbon-armatures .rebar-command-tools{display:grid!important;grid-auto-flow:column;grid-template-rows:repeat(3,28px)!important;gap:3px 5px!important;align-content:start}
 #ribbon-armatures .rebar-command-tools button{width:146px!important;height:28px!important;min-height:28px!important;display:flex;align-items:center;gap:7px;white-space:nowrap!important;font-size:11px!important;padding:4px 7px!important;border:1px solid transparent;border-radius:6px;background:transparent;box-shadow:none;text-align:left;line-height:16px}
 #ribbon-armatures .rebar-command-tools button:hover:not(:disabled){background:#304a59;border-color:#536f7e}#ribbon-armatures .rebar-command-tools button:focus-visible{outline:2px solid #80caff;outline-offset:1px}#ribbon-armatures .rebar-command-tools button:disabled{opacity:.4}
 #ribbon-armatures .rebar-command-tools button svg{width:20px;height:20px;flex:0 0 20px;color:#a9ce8b;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
 #ribbon-armatures .rebar-shapes-group .rebar-command-tools{grid-template-rows:repeat(2,42px)!important;grid-template-columns:repeat(3,87px);grid-auto-flow:row;gap:4px!important}
 #ribbon-armatures .rebar-shapes-group .rebar-command-tools button{width:87px!important;height:42px!important;min-height:42px!important;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:2px;padding:2px 4px!important;background:#253b48;border:1px solid #3b5665;font-size:10px!important}
 #ribbon-armatures .rebar-shapes-group .rebar-command-tools button svg{height:22px;width:26px;flex:0 0 22px;color:#b8df96}
 #ribbon-armatures .rebar-command-tools button span{overflow:hidden;text-overflow:ellipsis;max-width:100%}
 `;document.head.append(css);
})();
