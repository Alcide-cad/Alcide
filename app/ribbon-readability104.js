// Lisibilité des réglages d’affichage et repères colorés du ruban.
(()=>{
 const tabs=document.querySelector('.ribbon-tabs');for(const key of ['accueil','dessin','mesures','selection','armatures','outils','affichage']){const b=tabs.querySelector('[data-tab='+key+']');if(b)tabs.append(b);}
 const titles={'snap':'Accrochages','ortho':'Ortho','grid-visible-toggle':'Grille','display-lineweights':'Épaisseurs','display-import-transparency':'Transparences','graphics-detail-auto':'Détails au zoom'};
 for(const [id,title]of Object.entries(titles)){
  const input=document.getElementById(id),label=input?.closest('label');if(!label||!document.getElementById('ribbon-affichage').contains(label))continue;
  const span=document.createElement('span');span.className='ribbon104-setting-label';span.textContent=title;
  for(const n of [...label.childNodes])if(n!==input) n.remove();label.append(span);label.classList.add('ribbon104-setting');input.setAttribute('aria-label',title);
 }
 const colours={
  'Dessiner un acier':['#bddb8b','#48702b'],'Éléments BA':['#89c5ff','#2f659b'],'Filants':['#80d7c3','#276f60'],
  'Treillis et conversion':['#72d5e6','#226c7a'],'Modifier':['#ffd08a','#875716'],'Façonnage':['#f3aa80','#98572d'],
  'Repérage':['#d3b1ff','#72529a'],'Quantifier':['#98c7f4','#345f88'],'Vérifier':['#95dbc1','#286b54']
 };
 function palette(){for(const group of document.querySelectorAll('#ribbon-armatures>.ribbon-group')){const title=group.querySelector(':scope>small')?.textContent.trim(),coloursForGroup=colours[title];if(!coloursForGroup)continue;group.style.setProperty('--ribbon104-dark',coloursForGroup[0]);group.style.setProperty('--ribbon104-light',coloursForGroup[1]);group.classList.add('ribbon104-colour');}}
 palette();window.addEventListener('load',palette,{once:true});
 const css=document.createElement('style');css.id='ribbon104-style';css.textContent=`
 #ribbon #ribboncontent.ribbon103 #ribbon-affichage .ribbon-group:not(.rf-collapsed)>.ribbon-tools:has(>label){grid-auto-columns:max-content!important;grid-template-columns:none!important;column-gap:12px!important}
 #ribbon #ribboncontent.ribbon103 #ribbon-affichage label.ribbon104-setting{display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:8px!important;box-sizing:border-box!important;width:max-content!important;min-width:0!important;max-width:none!important;margin:0!important;padding:0 4px!important;height:32px!important;white-space:nowrap!important;line-height:1.2!important;font-size:11px!important}
 #ribbon #ribboncontent.ribbon103 #ribbon-affichage .ribbon104-setting-label{position:static!important;display:block!important;width:auto!important;height:auto!important;white-space:nowrap!important;color:var(--text)!important}
 #ribbon #ribboncontent.ribbon103 #ribbon-affichage .ribbon104-setting>input.toggle-switch{width:30px!important;min-width:30px!important;max-width:30px!important;height:18px!important;min-height:18px!important;margin:0!important;flex:0 0 30px!important;border-radius:10px!important}
 #ribbon #ribboncontent.ribbon103 #ribbon-affichage .ribbon104-setting>input.toggle-switch::before{width:12px!important;height:12px!important;left:2px!important;top:2px!important}
 #ribbon #ribboncontent.ribbon103 #ribbon-affichage .ribbon104-setting>input.toggle-switch:checked::before{transform:translateX(12px)!important}
 #ribbon #ribboncontent.ribbon103 #ribbon-affichage .ribbon104-setting>input:not(.toggle-switch){width:15px!important;min-width:15px!important;height:15px!important;margin:0!important;flex:0 0 15px!important}
 #ribbon #ribboncontent.ribbon103 #ribbon-armatures .ribbon104-colour{--ribbon104-family:var(--ribbon104-dark)}
 body[data-theme=light] #ribbon #ribboncontent.ribbon103 #ribbon-armatures .ribbon104-colour{--ribbon104-family:var(--ribbon104-light)}
 #ribbon #ribboncontent.ribbon103 #ribbon-armatures .ribbon104-colour :is(.ribbon-tools,.rebar-command-tools)>button:not(:disabled) :is(svg,.ribbon-icon){color:var(--ribbon104-family)!important;stroke:var(--ribbon104-family)!important;stroke-width:1.7!important}
 #ribbon #ribboncontent.ribbon103 #ribbon-armatures .ribbon104-colour>small{color:var(--ribbon104-family)!important;opacity:1!important}
 #ribbon #ribboncontent.ribbon103 #ribbon-armatures .ribbon104-colour :is(.ribbon-tools,.rebar-command-tools)>button:not(:disabled){border-color:color-mix(in srgb,var(--ribbon104-family) 13%,transparent)!important;background:color-mix(in srgb,var(--ribbon104-family) 4%,transparent)!important}
 #ribbon #ribboncontent.ribbon103 #ribbon-armatures .ribbon104-colour :is(.ribbon-tools,.rebar-command-tools)>button:hover:not(:disabled){border-color:var(--ribbon104-family)!important;background:color-mix(in srgb,var(--ribbon104-family) 16%,var(--panel))!important}
 #ribbon #ribboncontent.ribbon103 #ribbon-armatures .ribbon104-colour :is(.ribbon-tools,.rebar-command-tools)>button:is(.active,.ui-pressed,[aria-pressed=true]){outline:1px solid var(--ribbon104-family);outline-offset:-1px;background:color-mix(in srgb,var(--ribbon104-family) 20%,var(--panel))!important}
 @media(max-width:1050px){#ribbon #ribboncontent.ribbon103 #ribbon-affichage label.ribbon104-setting{height:24px!important;font-size:10px!important;gap:6px!important}}
 `;document.head.append(css);window.RibbonFit?.fit();
})();
