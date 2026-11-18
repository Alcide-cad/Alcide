// 0.7.4 : ancienne grille de motifs et notes redondantes réellement masquées (spécificité CSS).
// 0.7.3 : trois cartes indépendantes Remplissage / Hachures / Motifs, posées sur les contrôles existants (IDs conservés, masqués).
// Modèle inchangé : un seul motif par objet (hachure OU motif), fond uni combinable. Remplissage seul = SOLID.
(()=>{
 const card=$('#hatch-properties');if(!card||!window.HATCH_PATTERNS)return;
 const HATCHES=['ANSI31','DIAG_INV','HORIZ','VERT','ANSI37','CARREAUX','SERREES','ANSI32','ANSI33','ANSI34','ANSI35','ANSI36','ANSI38'],MOTIFS=['BETON','LOSANGES','AR-CONC','AR-SAND','GRAVEL','EARTH','AR-B816','BRICK','AR-RROOF','INSUL','STEEL','HONEY','DOTS','CROSS','ZIGZAG','NET','SQUARE'].filter(k=>HATCH_PATTERNS[k]);
 const SHORT={ANSI31:'Diag.',DIAG_INV:'Diag. inv.',HORIZ:'Horiz.',VERT:'Vert.',ANSI37:'Croisées',CARREAUX:'Grille',SERREES:'Serrées',BETON:'Béton',LOSANGES:'Losanges'};for(const k of Object.keys(window.ACAD_HATCH_PATTERNS||{}))SHORT[k]=k;
 const en=$('#hatch-enabled'),pat=$('#hatch-pattern'),ink=$('#hatch-color'),bgOn=$('#hatch-background-enabled'),bg=$('#hatch-background-color');
 const gbg=Object.assign(document.createElement('input'),{type:'checkbox',id:'hatch-background-gradient',hidden:true});gbg.className='hatch-legacy-hidden';card.append(gbg);
 const st={fill:false,grad:false,kind:null,hatch:'ANSI31',motif:'BETON',fillColor:bg?.value||'#d2d2d2',inkColor:ink.value};
 const box=document.createElement('div');box.id='hatch-cards';
 const mk=(id,title,hint)=>{const d=document.createElement('details');d.className='hatch-card';d.id=id;d.open=localStorage.getItem('hatchCard:'+id)!=='0';d.innerHTML=`<summary><span class="hatch-card-title">${title}</span><small>${hint}</small><input type="checkbox" class="toggle-switch hatch-card-toggle" role="switch" aria-label="${title} actif"></summary><div class="hatch-card-body"></div>`;d.addEventListener('toggle',()=>localStorage.setItem('hatchCard:'+id,d.open?'1':'0'));const t=d.querySelector('input');t.addEventListener('click',ev=>ev.stopPropagation());box.append(d);return {d,t,body:d.querySelector('.hatch-card-body')};};
 const F=mk('hatch-card-fill','Remplissage','couleur unie'),G=mk('hatch-card-gradient','Dégradé','5 types · 2 couleurs · angle'),H=mk('hatch-card-hatch','Hachures','lignes'),M=mk('hatch-card-motif','Motifs','matériaux');
 const fillColor=document.createElement('label');fillColor.className='row';fillColor.innerHTML='Couleur <input id="hatch-fill-color" type="color">';F.body.append(fillColor);
 const alphaRow=$('#hatch-alpha').closest('label');F.body.append(alphaRow);
 const gal=(list,key)=>{const g=document.createElement('div');g.className='hatch-card-gallery';g.setAttribute('role','radiogroup');for(const p of list){const b=document.createElement('button');b.type='button';b.dataset.pattern=p;b.title=HATCH_PATTERNS[p]?.label||p;b.setAttribute('role','radio');b.innerHTML='<span class="hatch-swatch" aria-hidden="true"></span><span>'+SHORT[p]+'</span>';try{b.firstChild.style.background='url('+hatchPreviewURL(p)+') center/cover';}catch{}b.onclick=()=>{st[key]=p;st.kind=key;write('hatch-pattern');};g.append(b);}return g;};
 H.body.append(gal(HATCHES,'hatch'));M.body.append(gal(MOTIFS,'motif'));
 const shared=document.createElement('div');shared.id='hatch-pattern-settings';for(const id of ['hatch-angle','hatch-spacing','hatch-color'])shared.append($('#'+id).closest('label'));
 const excl=document.createElement('p');excl.className='muted hatch-card-note';excl.textContent='Un seul motif par remplissage : activer Hachures désactive Motifs, et inversement. Le fond, uni ou dégradé, se combine avec l’un ou l’autre.';
 const anchor=$('#hatch-target');anchor.after(box);box.after(excl);excl.classList.add('hatch-legacy-hidden');
 // 0.7.4 : « Remplir au clic » / « Contour par points » remontés au-dessus des cartes (ils étaient sous la grille masquée, hors écran).
 const placeModes=()=>{const m=[...card.querySelectorAll('div')].find(d=>!d.id&&[...d.children].some(b=>b.textContent==='Remplir au clic'));if(m&&m.nextElementSibling!==box){m.id='hatch-fill-modes';box.before(m);return true;}return !!m;};if(!placeModes())document.addEventListener('DOMContentLoaded',placeModes,{once:true});
 // Contrôles d'origine conservés mais masqués (compatibilité modules/tests).
 for(const el of [en.closest('label'),pat.closest('label'),$('#hatch-background-controls'),$('#hatch-pattern-gallery'),...[...card.querySelectorAll('p.muted')].filter(p=>/^Les réglages modifient/.test(p.textContent))])if(el)el.classList.add('hatch-legacy-hidden');
 function fire(el,types=['input','change']){for(const t of types)el.dispatchEvent(new Event(t,{bubbles:true}));}
 let writing=false;
 function write(control){writing=true;try{const p=st.kind==='hatch'?st.hatch:st.kind==='motif'?st.motif:null;
  // 1.0.89 : le dégradé est un fond, comme le remplissage uni : seul, ou sous une hachure / un motif.
  if(p){en.checked=true;pat.value=p;ink.value=st.inkColor;bgOn.checked=st.fill&&!st.grad;bg.value=st.fillColor;gbg.checked=st.grad;}
  else if(st.grad){en.checked=true;pat.value='GRADIENT';bgOn.checked=false;gbg.checked=false;}
  else if(st.fill){en.checked=true;pat.value='SOLID';ink.value=st.fillColor;bgOn.checked=false;gbg.checked=false;}
  else{en.checked=false;bgOn.checked=false;gbg.checked=false;}
  fire(control==='off'?en:pat);}finally{writing=false;}view();}
 function read(){if(writing)return;const on=en.checked,p=pat.value;if(!on){st.fill=false;st.grad=false;st.kind=null;}else if(p==='SOLID'){st.fill=true;st.grad=false;st.kind=null;st.fillColor=ink.value;}else if(p==='GRADIENT'){if(!st.grad)G.d.open=true;st.fill=false;st.grad=true;st.kind=null;}else{st.kind=MOTIFS.includes(p)?'motif':'hatch';st[st.kind]=p;st.inkColor=ink.value;st.grad=gbg.checked;st.fill=bgOn.checked&&!st.grad;if(bgOn.checked)st.fillColor=bg.value;}view();}
 function view(){G.t.checked=st.grad;G.d.classList.toggle('active',st.grad);G.d.classList.toggle('as-background',st.grad&&!!st.kind);F.t.checked=st.fill;H.t.checked=st.kind==='hatch';M.t.checked=st.kind==='motif';$('#hatch-fill-color').value=st.fillColor;for(const [c,key]of [[H,'hatch'],[M,'motif']]){c.d.classList.toggle('active',st.kind===key);for(const b of c.body.querySelectorAll('[data-pattern]')){const value=String(st.kind===key&&st[key]===b.dataset.pattern);if(b.getAttribute('aria-checked')!==value)b.setAttribute('aria-checked',value);};}F.d.classList.toggle('active',st.fill);const host=st.kind==='motif'?M.body:H.body;if(shared.parentElement!==host)host.append(shared);shared.hidden=st.kind!=='hatch'&&st.kind!=='motif';const lab=$('#hatch-spacing-label');if(lab&&st.kind==='motif'&&!/Échelle/.test(lab.textContent))lab.dataset.motif='1';}
 F.t.addEventListener('change',()=>{st.fill=F.t.checked;if(st.fill)st.grad=false;write(st.fill||st.grad||st.kind?'hatch-pattern':'off');});
 G.t.addEventListener('change',()=>{st.grad=G.t.checked;if(st.grad)st.fill=false;write(st.kind||st.fill||st.grad?'hatch-pattern':'off');if(G.t.checked)G.d.open=true;});
 H.t.addEventListener('change',()=>{st.kind=H.t.checked?'hatch':(st.kind==='hatch'?null:st.kind);write(st.kind||st.fill||st.grad?'hatch-pattern':'off');if(H.t.checked)H.d.open=true;});
 M.t.addEventListener('change',()=>{st.kind=M.t.checked?'motif':(st.kind==='motif'?null:st.kind);write(st.kind||st.fill||st.grad?'hatch-pattern':'off');if(M.t.checked)M.d.open=true;});
 $('#hatch-fill-color').addEventListener('input',ev=>{ev.stopPropagation();st.fillColor=ev.target.value;write('hatch-pattern');});
 ink.addEventListener('input',()=>{if(!writing&&st.kind)st.inkColor=ink.value;});
 // Relecture de l'état (sélection, reprise d'un réglage) : regroupée par image.
 let queued=false;const q=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;read();});};
 for(const el of [en,pat,bgOn,bg,ink,gbg])el.addEventListener('change',q);
 const base=drawOverlay;drawOverlay=function(...a){const r=base.apply(this,a);q();return r;};
 read();
 const css=document.createElement('style');css.textContent=`
#hatch-properties .hatch-legacy-hidden,#hatch-properties #hatch-pattern-gallery.hatch-legacy-hidden,#hatch-properties p.muted.hatch-legacy-hidden{display:none!important}
#hatch-cards{display:flex;flex-direction:column;gap:6px;margin:6px 0}
#hatch-cards .hatch-card{border:1px solid #3e5260;border-radius:7px;background:#17242d}
#hatch-cards .hatch-card.active{border-color:#7fb06a}
#hatch-cards .hatch-card>summary{display:grid;grid-template-columns:auto 1fr auto auto;align-items:center;gap:8px;padding:6px 10px;cursor:pointer;user-select:none;list-style:none}
#hatch-cards .hatch-card>summary::-webkit-details-marker{display:none}
#hatch-cards .hatch-card>summary::before{content:'▸';color:#7f97a6;width:10px}
#hatch-cards .hatch-card[open]>summary::before{content:'▾'}
#hatch-cards .hatch-card-title{font-weight:600}
#hatch-cards .hatch-card>summary small{color:#8ea3b0}
#hatch-cards .hatch-card-body{padding:4px 10px 10px;display:flex;flex-direction:column;gap:6px}
#hatch-cards .hatch-card-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(60px,1fr));gap:4px;max-height:212px;overflow-y:auto;padding-right:2px}
#hatch-cards .hatch-card-gallery button{display:flex;flex-direction:column;align-items:center;gap:2px;height:56px;padding:5px 3px;margin:0;font-size:11px;border:1px solid #3e5260;border-radius:6px;background:#1a2731;min-width:0}
#hatch-cards .hatch-card-gallery button>span:last-child{max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#hatch-cards .hatch-card-gallery .hatch-swatch{width:40px;height:28px;border:1px solid #5d707c;border-radius:3px}
#hatch-cards .hatch-card-gallery button:hover{border-color:#7f97a6}
#hatch-cards .hatch-card-gallery button:focus-visible{outline:2px solid #8fc3ff}
#hatch-cards .hatch-card-gallery button[aria-checked=true]{border-color:#b2e58a;background:#2b3f32}
#hatch-cards .hatch-card:not(.active) .hatch-card-gallery{opacity:.75}
#hatch-properties .hatch-card-note{font-size:11px;margin:2px 0 6px}
#hatch-cards #hatch-card-gradient.as-background>summary small::after{content:' · en fond';color:#b2e58a}`;document.head.append(css);
 window.HatchCards={read,state:()=>({...st}),gradient:G,setKind(kind){if(kind==='gradient'){st.grad=true;st.fill=false;}else st.kind=kind;write('hatch-pattern');}};
})();
