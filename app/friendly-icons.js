// Identité douce et colorée : pictogrammes vectoriels, couleurs par famille de commandes.
(()=>{
 const colors={drawing:'#87c9f4',modify:'#f3bd80',annotation:'#72c5d4',hatch:'#e9c46a',rebar:'#91d3b0',file:'#f2d384',view:'#99bddf',danger:'#f29b9e'};
 const glyphs={
 'draw-rectangle':'M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z',
 copy:'M9 8h10a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2zM4 16H3a1 1 0 0 1-1-1V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1',
 open:'M3 8V5a2 2 0 0 1 2-2h4l3 4h7a2 2 0 0 1 2 2l-2 10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8zM3 9h18',
 'hatchsettings':'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM3 10l7-7M4 17L17 4M10 21l11-11M17 21l4-4',
 'rotate-objects':'M19 8a8 8 0 1 0 1 8M19 3v6h-6M9 10h5v5H9z'
 };
 function family(button){const id=button.dataset.commandTarget||button.id||'',page=button.closest('.ribbon-page')?.id||'';
 if(/delete|remove|purge/.test(id))return 'danger';
 if(/hatch|fill/.test(id))return 'hatch';
 if(/rebar|steel|reinforc/.test(id)||page.includes('armatures'))return 'rebar';
 if(/text|dimension|chain|level|axes|callout|measure|repere/.test(id)||page.includes('mesures'))return 'annotation';
 if(/move|copy|rotat|stretch|trim|extend|offset|mirror|join|cut/.test(id))return 'modify';
 if(/open|project|save|export|import/.test(id)||page.includes('fichier'))return 'file';
 if(/draw-|arc|polygon|circle|line/.test(id)||page.includes('dessin'))return 'drawing';return 'view';}
 const steelPaths=[[/cadre|étrier/i,'M7 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7l4-4M7 4l3 3'],[/treillis|nappe/i,'M4 3v18M12 3v18M20 3v18M3 4h18M3 12h18M3 20h18'],[/audit|vérif/i,'M5 4h14v16H5zM8 11l3 3 5-6'],[/liste|nomenclature|quant/i,'M4 5h3M10 5h10M4 12h3M10 12h10M4 19h3M10 19h10'],[/repère|texte|étiquette/i,'M3 5h14v10H3zM8 15v6M5 21h6M6 9h8']];
 for(const b of document.querySelectorAll('#ribbon-armatures .ribbon-tools>button')){if(b.querySelector('svg'))continue;const label=b.textContent.trim();if(!label)continue;const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('tool-pictogram');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',steelPaths.find(([re])=>re.test(label))?.[1]||'M4 18h12a4 4 0 0 0 0-8H8a4 4 0 0 1 0-8h12');svg.append(path);b.prepend(svg);b.classList.add('ribbon-button','uniform-tool');if(!b.getAttribute('aria-label'))b.setAttribute('aria-label',label);}
 const roots=['#ribboncontent','.ribbon-quick-access'];
 function decorate(){for(const selector of roots)for(const b of document.querySelectorAll(selector+' button')){const icon=b.querySelector('svg.tool-pictogram,svg.ribbon-icon');if(!icon)continue;const f=family(b);b.dataset.iconFamily=f;b.style.setProperty('--tool-tone',colors[f]);icon.setAttribute('stroke-linecap','round');icon.setAttribute('stroke-linejoin','round');const id=b.dataset.commandTarget||b.id;if(glyphs[id]&&icon.children.length===1&&icon.firstElementChild.tagName.toLowerCase()==='path')icon.firstElementChild.setAttribute('d',glyphs[id]);}}
 decorate();
 const css=document.createElement('style');css.id='friendly-icons-style';css.textContent=`
 #ribboncontent button[data-icon-family] .tool-pictogram,.ribbon-quick-access button[data-icon-family] svg{stroke:var(--tool-tone)!important;color:var(--tool-tone)!important;fill:none;stroke-width:1.75;stroke-linecap:round;stroke-linejoin:round}
 #ribboncontent button[data-icon-family]{border-color:color-mix(in srgb,var(--tool-tone) 22%,var(--border));border-radius:7px!important}
 #ribboncontent button[data-icon-family]:hover:not(:disabled){background:color-mix(in srgb,var(--tool-tone) 13%,var(--panel));border-color:var(--tool-tone)}
 #ribboncontent button[data-icon-family].active,#ribboncontent button[data-icon-family][aria-pressed=true]{background:color-mix(in srgb,var(--tool-tone) 20%,var(--panel))!important;border-color:var(--tool-tone)!important;box-shadow:inset 0 -2px 0 var(--tool-tone)}
 #ribboncontent button.ribbon-featured[data-icon-family]{background:color-mix(in srgb,var(--tool-tone) 7%,var(--panel))}
 #ribboncontent button:disabled svg{opacity:.4}
 #ribboncontent button:focus-visible,.side-tabs button:focus-visible{outline:2px solid var(--tool-tone,var(--accent));outline-offset:2px}
 .side-tabs button{border-radius:8px!important}
 .side-tabs button::before{content:'';display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--tool-tone);margin-bottom:7px;flex-shrink:0}
 .side-tabs button[data-side-tab=properties]{--tool-tone:#87c9f4}.side-tabs button[data-side-tab=hatch]{--tool-tone:#e9c46a}.side-tabs button[data-side-tab=text],.side-tabs button[data-side-tab=dimension]{--tool-tone:#72c5d4}.side-tabs button[data-side-tab=rebar]{--tool-tone:#91d3b0}.side-tabs button[data-side-tab=layers]{--tool-tone:#99bddf}.side-tabs button[data-side-tab=library],.side-tabs button[data-side-tab=drawings]{--tool-tone:#f2d384}
 .side-tabs button.active{border-color:var(--tool-tone)!important;box-shadow:inset -2px 0 var(--tool-tone)!important;background:color-mix(in srgb,var(--tool-tone) 14%,var(--panel))}
 .ribbon-topbar #permanent-settings,.ribbon-topbar #library-palette-toggle{display:inline-flex!important;flex-direction:row!important;align-items:center!important;justify-content:center!important;line-height:1!important;padding-top:0!important;padding-bottom:0!important;text-align:center}
 .ribbon-topbar #permanent-settings>svg{display:none!important}
 .ribbon-topbar #permanent-settings>.tool-label{display:block!important;flex:0 0 auto!important;margin:0!important;line-height:normal!important}
 .ribbon-tabs button[aria-selected=true]{border-radius:9px 9px 0 0!important}
 @media(forced-colors:active){#ribboncontent button[data-icon-family] .tool-pictogram{stroke:ButtonText!important}.side-tabs button::before{background:ButtonText}}
 `;document.head.append(css);window.friendlyIconsReady=true;
})();
