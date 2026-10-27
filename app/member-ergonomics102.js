// Ergonomie commune des éléments BA. Les contrôles et les calculs métier restent ceux des panneaux.
(()=>{
 const entries=[['beam',Beam100],['lintel',Lintel100],['column',Column100]];
 const icons=[ '<path d="M4 5h16v14H4zM8 3v4M16 3v4M2 9h4M2 15h4"/>', '<path d="M5 18V6h14v12H5zM8 6v12M16 6v12"/><circle cx="8" cy="9" r="1"/><circle cx="16" cy="15" r="1"/>', '<path d="M4 5h16M4 12h16M4 19h16M8 3v4M16 10v4M8 17v4"/>' ];
 const svg=i=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+icons[i]+'</svg>';
 for(const [name,api] of entries){
  const panel=document.getElementById(name+'100-panel'),old=[...panel.children],header=panel.querySelector('header'),footer=panel.querySelector('footer'),summary=panel.querySelector('#'+name+'100-summary'),error=panel.querySelector('[role=alert]');
  panel.classList.add('member102');
  const preview=document.createElement('div');preview.className='member102-preview';preview.setAttribute('aria-label','Aperçu du ferraillage');
  const heading=document.createElement('div');heading.className='member102-preview-heading';heading.innerHTML='<span>Aperçu en direct</span><span data-member-ready role="status"></span>';preview.append(heading);
  const nav=document.createElement('div');nav.className='member102-nav';nav.setAttribute('role','tablist');nav.setAttribute('aria-label','Réglages du ferraillage');
  const scroll=document.createElement('div');scroll.className='member102-scroll';
  const groups=['Dimensions','Aciers','Cadres et détails'].map((label,i)=>{
   const page=document.createElement('div');page.id=name+'102-page-'+i;page.className='member102-page';page.setAttribute('role','tabpanel');page.setAttribute('aria-labelledby',name+'102-tab-'+i);page.hidden=i!==0;scroll.append(page);
   const button=document.createElement('button');button.id=name+'102-tab-'+i;button.type='button';button.setAttribute('role','tab');button.setAttribute('aria-controls',page.id);button.setAttribute('aria-selected',String(i===0));button.tabIndex=i===0?0:-1;button.innerHTML=svg(i)+'<span>'+label+'</span>';nav.append(button);return {button,page};
  });
  function choose(index,focus=false){for(let i=0;i<groups.length;i++){groups[i].page.hidden=i!==index;groups[i].button.setAttribute('aria-selected',String(i===index));groups[i].button.tabIndex=i===index?0:-1;}scroll.scrollTop=0;if(focus)groups[index].button.focus();}
  groups.forEach(({button},i)=>{button.onclick=()=>choose(i);button.onkeydown=ev=>{let n;if(ev.key==='ArrowRight')n=(i+1)%3;if(ev.key==='ArrowLeft')n=(i+2)%3;if(ev.key==='Home')n=0;if(ev.key==='End')n=2;if(n!==undefined){ev.preventDefault();choose(n,true);}};});
  const recap=document.createElement('details');recap.className='member102-recap';recap.innerHTML='<summary>Récapitulatif des quantités</summary>';recap.append(summary);
  let detailsIndex=0;
  for(const el of old){
   if(el===header||el===footer||el===summary||el===error)continue;
   if(el.matches('svg,[class$="-tabs"]')&&(el.tagName.toLowerCase()==='svg'||el.querySelector('[data-preview]'))){preview.append(el);continue;}
   if(el.tagName==='DETAILS'){
    const title=el.querySelector('summary').textContent;
    const steel=/longitudinaux|longitudinales|Barres de peau/.test(title),page=steel?1:2;
    groups[page].page.append(el);
    // Les réglages secondaires restent accessibles, sans masquer les réglages principaux.
    el.open=/longitudinaux|longitudinales|Cadres et appuis|Cadres, cerces|U ou cadres/.test(title);
    el.dataset.memberSection=String(detailsIndex++);continue;
   }
   if(el.matches('small')){groups[2].page.append(el);continue;}
   groups[0].page.append(el);
  }
  const a4=groups[0].page.querySelector('.member-a4-switch');if(a4)groups[0].page.append(a4);
  groups[2].page.append(recap);
  const footnote=document.createElement('div');footnote.className='member102-footnote';footnote.innerHTML='<span data-member-mass></span><span>Dimensions en cm · diamètres HA en mm</span>';
  panel.replaceChildren(header,preview,nav,scroll,error,footnote,footer);
  function sync(){
   const invalid=!!error.textContent.trim(),ready=heading.querySelector('[data-member-ready]');
   preview.querySelectorAll('svg').forEach(e=>e.style.visibility=invalid?'hidden':'visible');const a4button=footer.querySelector('.member-a4-place');if(a4button)a4button.disabled=invalid;
   const msg=invalid?'À corriger':'Prêt à poser';if(ready.textContent!==msg)ready.textContent=msg;ready.dataset.invalid=String(invalid);panel.dataset.invalid=String(invalid);
   const rows=[...summary.children].map(e=>e.textContent),mass=rows.find(t=>/Masse/.test(t))||'';const badge=footnote.querySelector('[data-member-mass]'),value=invalid?'Configuration à corriger':mass;if(badge.textContent!==value)badge.textContent=value;
  }
  new MutationObserver(sync).observe(summary,{childList:true,subtree:true,characterData:true});new MutationObserver(sync).observe(error,{childList:true,subtree:true,characterData:true});
  // Après chaque ouverture, revenir aux dimensions, sans toucher aux valeurs remplies par le panneau.
  new MutationObserver(()=>{if(!panel.hidden){choose(0);sync();}}).observe(panel,{attributes:true,attributeFilter:['hidden']});
  const prior=api.show;api.show=function(...args){const r=prior.apply(this,args);choose(0);sync();return r;};
  panel.addEventListener('keydown',ev=>{if(ev.key==='PageDown'&&ev.ctrlKey){ev.preventDefault();choose((groups.findIndex(g=>!g.page.hidden)+1)%3,true);}});
  sync();
 }
 const style=document.createElement('style');style.textContent=`
 :is(#beam100-panel,#lintel100-panel,#column100-panel).member102{display:grid;grid-template-rows:auto auto auto minmax(80px,1fr) auto auto auto;top:132px;bottom:36px;width:min(560px,calc(100vw - 32px));padding:0;overflow:hidden;border:1px solid var(--border);border-radius:12px;box-shadow:0 14px 40px #0005;font:12px/1.4 system-ui,sans-serif}
 :is(#beam100-panel,#lintel100-panel,#column100-panel).member102>header{margin:0;padding:12px 16px;border-bottom:1px solid var(--border);background:var(--panel)}
 :is(#beam100-panel,#lintel100-panel,#column100-panel).member102 header strong{font-size:17px;letter-spacing:.1px}:is(#beam100-panel,#lintel100-panel,#column100-panel).member102 header small{margin:2px 0 0}
 :is(#beam100-panel,#lintel100-panel,#column100-panel).member102 header button{width:30px;height:30px;min-height:30px;padding:0}
 .member102-preview{padding:8px 14px;background:var(--bg);border-bottom:1px solid var(--border);min-height:0}
 .member102-preview-heading{display:flex;align-items:center;justify-content:space-between;color:var(--muted);font-size:11px;margin-bottom:4px}
 .member102-preview-heading [data-member-ready]{color:var(--accent);font-weight:600}.member102-preview-heading [data-invalid=true]{color:#e9986c}
 :is(#beam100-panel,#lintel100-panel,#column100-panel).member102 .member102-preview>svg{height:140px!important;margin:0!important;border-radius:0;background:transparent}
 :is(#beam100-panel,#lintel100-panel,#column100-panel).member102 .member102-preview>#beam100-route-preview{height:52px!important}
 :is(#beam100-panel,#lintel100-panel,#column100-panel).member102 .member102-preview [class$="-tabs"]{width:210px;margin:0 auto 4px;gap:0;border:1px solid var(--border);border-radius:6px;overflow:hidden}
 :is(#beam100-panel,#lintel100-panel,#column100-panel).member102 .member102-preview [class$="-tabs"] button{border:0;border-radius:0;min-height:26px;padding:3px 12px;box-shadow:none;background:transparent}
 :is(#beam100-panel,#lintel100-panel,#column100-panel).member102 .member102-preview [aria-pressed=true]{color:var(--accent);background:var(--panel)!important}
 .member102-nav{display:grid;grid-template-columns:1fr 1fr 1.4fr;padding:6px 10px;gap:4px;border-bottom:1px solid var(--border)}
 :is(#beam100-panel,#lintel100-panel,#column100-panel).member102 .member102-nav button{display:flex;align-items:center;justify-content:center;gap:6px;background:transparent;box-shadow:none;border:1px solid transparent;border-radius:6px;padding:7px 5px;font-size:12px;min-width:0;white-space:normal}
 .member102-nav svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.5;flex-shrink:0}
 :is(#beam100-panel,#lintel100-panel,#column100-panel).member102 .member102-nav [aria-selected=true]{background:var(--bg);border-color:var(--accent);color:var(--accent)}
 .member102-scroll{overflow-y:auto;overscroll-behavior:contain;padding:6px 16px 12px;scrollbar-gutter:stable;min-height:0}
 :is(#beam100-panel,#lintel100-panel,#column100-panel).member102 [role=tabpanel][hidden]{display:none!important}
 :is(#beam100-panel,#lintel100-panel,#column100-panel).member102 details{background:var(--bg);border-color:var(--border);padding:10px;margin:8px 0;border-radius:8px}
 :is(#beam100-panel,#lintel100-panel,#column100-panel).member102 details summary{padding:3px 0;font-size:12px;line-height:1.5}
 :is(#beam100-panel,#lintel100-panel,#column100-panel).member102 label{line-height:1.4;gap:7px}:is(#beam100-panel,#lintel100-panel,#column100-panel).member102 input:not([type=checkbox]),:is(#beam100-panel,#lintel100-panel,#column100-panel).member102 select{box-sizing:border-box}
 :is(#beam100-panel,#lintel100-panel,#column100-panel).member102>p[role=alert]{margin:0;padding:0 16px;color:#e9986c;font-size:12px;max-height:60px;overflow:auto}
 :is(#beam100-panel,#lintel100-panel,#column100-panel).member102>p[role=alert]:not(:empty){padding:8px 16px;border-top:1px solid #e9986c}
 .member102-footnote{padding:8px 16px;display:flex;justify-content:space-between;gap:8px;font-size:10px;color:var(--muted);border-top:1px solid var(--border)}.member102-footnote [data-member-mass]{font-weight:600;color:var(--text)}
 :is(#beam100-panel,#lintel100-panel,#column100-panel).member102>footer{position:static;height:auto!important;min-height:66px;box-sizing:border-box;padding:10px 16px;margin:0;border-top:1px solid var(--border);gap:8px;background:var(--panel)}
 :is(#beam100-panel,#lintel100-panel,#column100-panel).member102>footer button{min-height:34px;height:auto!important;margin:0!important;padding:6px 10px;font-size:12px;line-height:1.3;align-self:stretch}
 :is(#beam100-panel,#lintel100-panel,#column100-panel).member102 .member-a4-switch{margin-top:12px}:is(#beam100-panel,#lintel100-panel,#column100-panel).member102 .member102-recap{margin-top:12px}
 :is(#beam100-panel,#lintel100-panel,#column100-panel).member102 [class$="-grid"] .numeric-stepper{width:100%!important;box-sizing:border-box}
 :is(#beam100-panel,#lintel100-panel,#column100-panel).member102 .member102-page>label:has([data-beam=name],[data-lintel=name],[data-column=name]){display:grid;grid-template-columns:70px 1fr}
 :is(#beam100-panel,#lintel100-panel,#column100-panel).member102 [data-beam=name],:is(#beam100-panel,#lintel100-panel,#column100-panel).member102 [data-lintel=name],:is(#beam100-panel,#lintel100-panel,#column100-panel).member102 [data-column=name]{width:100%}
 body[data-theme=light] .member102-preview svg text{fill:var(--text)}
 body[data-theme=light] .member102-preview svg [stroke="#b4da8c"],body[data-theme=light] .member102-preview svg [stroke="#b7dc91"]{stroke:#39734c}
 body[data-theme=light] .member102-preview svg circle{fill:#b64c60}
 @media(max-height:800px){:is(#beam100-panel,#lintel100-panel,#column100-panel).member102{top:100px}:is(#beam100-panel,#lintel100-panel,#column100-panel).member102 .member102-preview>svg{height:95px!important}:is(#beam100-panel,#lintel100-panel,#column100-panel).member102 .member102-preview>#beam100-route-preview{height:38px!important}:is(#beam100-panel,#lintel100-panel,#column100-panel).member102 header small{display:none}}
 @media(max-width:650px){:is(#beam100-panel,#lintel100-panel,#column100-panel).member102{right:6px;top:90px;bottom:28px;width:calc(100vw - 12px)}.member102-footnote{flex-wrap:wrap}.member102-scroll{padding:6px 10px}}
 `;document.head.append(style);
})();
