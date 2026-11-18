/* 1.0.92 · 5 types + 2 couleurs (⇄ permute), types inversés hérités ramenés au type de base ; aperçu gardé dans la carte (plus de bandeau en haut de fenêtre). */
/* 1.0.87 · Remplissage en dégradé, options AutoCAD : 9 types, une ou deux couleurs (ombre/teinte), angle, centré,
   inversion des couleurs, transparence. Panneau « Remplissage et hachures », mêmes contours (sélection, remplir au clic).
   Affichage à l'écran ; export HATCH dégradé natif (moteur : apply_gradient) relu à la réouverture. */
(()=>{
 const TYPES=[['LINEAR','Linéaire'],['CYLINDER','Cylindre'],['INVCYLINDER','Cylindre inversé'],['SPHERICAL','Sphérique'],['INVSPHERICAL','Sphérique inversé'],['HEMISPHERICAL','Hémisphérique'],['INVHEMISPHERICAL','Hémisphérique inversé'],['CURVED','Courbe'],['INVCURVED','Courbe inversée']];
 const hex=c=>'#'+c.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join(''),rgb=h=>{const n=parseInt(String(h||'#808080').slice(1),16);return [n>>16&255,n>>8&255,n&255];},mix=(a,b,k)=>a.map((v,i)=>v+(b[i]-v)*k);
 function tinted(c,t){t=Math.max(0,Math.min(1,+t));return t>=.5?mix(c,[255,255,255],(t-.5)*2):mix(c,[0,0,0],(.5-t)*2);}
 function colours(g){let a=rgb(g.color1),b=g.oneColor?tinted(a,g.tint??.5):rgb(g.color2);if(g.swap)[a,b]=[b,a];return [a,b];}
 // Arrêts de couleur + géométrie (repère du dégradé tourné de « angle »), dans les coordonnées du dessin.
 function plan(g,box){const [a,b]=colours(g),type=TYPES.some(t=>t[0]===g.type)?g.type:'LINEAR',r=(+g.angle||0)*Math.PI/180,u=[Math.cos(r),Math.sin(r)],n=[-u[1],u[0]],W=box[2]-box[0],H=box[3]-box[1],C=[(box[0]+box[2])/2,(box[1]+box[3])/2],L=Math.max(1e-9,Math.abs(u[0])*W/2+Math.abs(u[1])*H/2),N=Math.max(1e-9,Math.abs(n[0])*W/2+Math.abs(n[1])*H/2),off=g.centered===false?[-u[0]*L/2+n[0]*N/2,-u[1]*L/2+n[1]*N/2]:[0,0],c=[C[0]+off[0],C[1]+off[1]],ramp=(f,steps=12)=>Array.from({length:steps+1},(_,i)=>[i/steps,hex(mix(a,b,f(i/steps)))]);
  if(type==='LINEAR')return {kind:'linear',p0:[c[0]-u[0]*L,c[1]-u[1]*L],p1:[c[0]+u[0]*L,c[1]+u[1]*L],stops:[[0,hex(a)],[1,hex(b)]]};
  if(type==='CYLINDER'||type==='INVCYLINDER'){const [x,y]=type==='CYLINDER'?[a,b]:[b,a];return {kind:'linear',p0:[c[0]-u[0]*L,c[1]-u[1]*L],p1:[c[0]+u[0]*L,c[1]+u[1]*L],stops:[[0,hex(x)],[.5,hex(y)],[1,hex(x)]]};}
  if(type==='CURVED'||type==='INVCURVED'){const f=type==='CURVED'?t=>Math.sin(t*Math.PI/2):t=>1-Math.cos(t*Math.PI/2);return {kind:'linear',p0:[c[0]-u[0]*L,c[1]-u[1]*L],p1:[c[0]+u[0]*L,c[1]+u[1]*L],stops:ramp(f)};}
  const R=Math.hypot(L,N);if(type==='SPHERICAL'||type==='INVSPHERICAL'){const [x,y]=type==='SPHERICAL'?[b,a]:[a,b];return {kind:'radial',c,r:R,stops:[[0,hex(x)],[1,hex(y)]]};}
  const base=[c[0]-n[0]*N,c[1]-n[1]*N],[x,y]=type==='HEMISPHERICAL'?[b,a]:[a,b];return {kind:'radial',c:base,r:2*N,stops:[[0,hex(x)],[1,hex(y)]]};}
 function canvasGradient(context,g,box){const p=plan(g,box),G=p.kind==='linear'?context.createLinearGradient(...p.p0,...p.p1):context.createRadialGradient(...p.c,0,...p.c,p.r);for(const [t,c]of p.stops)G.addColorStop(t,c);const [a,b]=colours(g);G.alcideColor=hex(mix(a,b,.5));return G;}
 function bgSpec(e){if(!e)return null;const edit=edits[e.id]||{};if(edit.props&&Object.hasOwn(edit.props,'fillBackgroundGradient'))return edit.props.fillBackgroundGradient||null;if(e.type==='HATCH'&&edit.hatchStyle&&Object.hasOwn(edit.hatchStyle,'backgroundGradient'))return edit.hatchStyle.backgroundGradient||null;return e.backgroundGradient||null;}
 function spec(e){if(!e)return null;const edit=edits[e.id]||{};if(edit.props?.fillGradient)return edit.props.fillGradient;if(e.type==='HATCH'){if(edit.hatchStyle)return edit.hatchStyle.gradient||null;return e.gradient||null;}return null;}
 const cache=new WeakMap();
 const bgCache=new WeakMap();const colour=objectColor;objectColor=function(e,p,fallback){if(p&&p.hatchBackground){const b=bgSpec(e);if(b){const box=e.originalBounds||e.bounds,key=JSON.stringify([b,box]);let hit=bgCache.get(e);if(!hit||hit.key!==key){hit={key,value:canvasGradient(ctx,b,box)};bgCache.set(e,hit);}return hit.value;}}const g=p&&p.fill&&!p.hatchBackground&&(p.drawingFill||e?.type==='HATCH')?spec(e):null;if(!g)return colour.apply(this,arguments);const box=e.originalBounds||e.bounds,key=JSON.stringify([g,box]);let hit=cache.get(e);if(!hit||hit.key!==key){hit={key,value:canvasGradient(ctx,g,box)};cache.set(e,hit);}return hit.value;};
 // 1.0.92 : types inversés, « une couleur » et « inverser » = même chose que 2 couleurs permutées → ramenés à 5 types + 2 couleurs.
 const BASE=['LINEAR','CYLINDER','SPHERICAL','HEMISPHERICAL','CURVED'];
 function normalize(g){if(!g)return g;let t=String(g.type||'LINEAR').toUpperCase(),c1=g.color1,c2=g.color2,angle=+g.angle||0;
  if(g.oneColor)c2=hex(tinted(rgb(c1),g.tint??.5));
  let swap=!!g.swap;if(t.startsWith('INV')){t=t.slice(3);swap=!swap;if(t==='CURVED')angle=(angle+180)%360;}
  if(!BASE.includes(t))t='LINEAR';if(swap)[c1,c2]=[c2,c1];
  return {...g,type:t,color1:c1,color2:c2,oneColor:false,swap:false,angle};}
 window.Gradient187={TYPES,BASE,plan,colours,spec,bgSpec,canvasGradient,tinted,normalize};
 // Panneau (1.0.88) : carte « Dégradé » visible dans Remplissage / hachures, 9 vignettes de types, réglages compacts sur une ligne,
 // aperçu en direct, derniers réglages mémorisés. L'option GRADIENT de « Type / motif » reste la valeur de référence.
 const select=$('#hatch-pattern');if(!select)return;select.insertBefore(new Option('Dégradé','GRADIENT'),select.options[1]||null);
 const SHORT={LINEAR:'Linéaire',CYLINDER:'Cylindre',INVCYLINDER:'Cyl. inv.',SPHERICAL:'Sphère',INVSPHERICAL:'Sph. inv.',HEMISPHERICAL:'Hémi',INVHEMISPHERICAL:'Hém. inv.',CURVED:'Courbe',INVCURVED:'Crb. inv.'};
 const box=document.createElement('div');box.id='gradient187';
 box.innerHTML='<canvas id="gradient-preview" width="240" height="30" title="Aperçu du dégradé"></canvas>'
  +'<div id="gradient-tiles" role="radiogroup" aria-label="Type de dégradé">'+TYPES.filter(([k])=>BASE.includes(k)).map(([k,v])=>'<button type="button" role="radio" aria-checked="false" data-gradient-type="'+k+'" title="'+v+'"><canvas width="44" height="24" aria-hidden="true"></canvas><span>'+SHORT[k]+'</span></button>').join('')+'</div>'
  +'<select id="gradient-type" hidden>'+TYPES.map(([k,v])=>'<option value="'+k+'">'+v+'</option>').join('')+'</select><select id="gradient-colours" hidden><option value="2">Deux couleurs</option><option value="1">Une couleur</option></select>'
  
  +'<div class="g-row"><span class="g-label">Couleur 1</span><input id="gradient-color1" type="color" value="#4f8fd6" title="Couleur 1"></div>'
  +'<div class="g-row" id="gradient-color2-row"><span class="g-label">Couleur 2</span><input id="gradient-color2" type="color" value="#ffffff" title="Couleur 2"><button type="button" id="gradient-swap-colours" class="g-swap" title="Permuter couleur 1 et couleur 2" aria-label="Permuter couleur 1 et couleur 2">⇄</button></div>'
  +'<div class="g-row" id="gradient-tint-row" hidden title="Ombre ↔ teinte"><span class="g-label">Teinte</span><small>ombre</small><input id="gradient-tint" type="range" min="0" max="100" step="5" value="75"><small>clair</small></div>'
  +'<div class="g-row"><span class="g-label">Transparence</span><input id="gradient-alpha" type="range" min="0" max="100" step="5" value="0"><output id="gradient-alpha-value">0 %</output></div>'
  +'<div class="g-row"><span class="g-label">Angle (°)</span><span class="g-angle"><input id="gradient-angle" type="number" step="15" value="0"></span></div>'
  +'<div class="g-row"><label class="g-check"><span class="g-label">Centré</span><input id="gradient-centered" type="checkbox" class="toggle-switch" checked></label><input id="gradient-swap" type="checkbox" hidden></div>';
 const cards=window.HatchCards?.gradient;if(cards)cards.body.append(box);else select.closest('label').after(box);
 const css=document.createElement('style');css.textContent=`#gradient187{display:flex;flex-direction:column;gap:5px}
#gradient187[hidden]{display:none}#gradient187 canvas{position:static;inset:auto}#gradient187 .g-swap{min-width:26px;height:24px;padding:0 4px;margin-left:4px;font-size:14px;line-height:1;cursor:pointer}#gradient-preview{position:static;inset:auto;display:block;width:100%;height:30px;border-radius:4px;border:1px solid #4d6878;background:#101820}
#gradient-tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(52px,1fr));gap:4px}
#gradient-tiles button{display:flex!important;flex-direction:column;align-items:center;justify-content:flex-start;gap:2px;margin:0;padding:3px 2px;min-width:0;height:auto!important;min-height:46px;font-size:10px;line-height:12px;border:1px solid #3e5260;border-radius:5px;background:#1a2731}
#gradient-tiles button canvas{width:44px;height:24px;border-radius:3px;border:1px solid #5d707c}
#gradient-tiles button span{display:block!important;flex:0 0 auto;min-height:12px;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#hatch-properties #gradient-tiles button,#gradient187 #gradient-tiles button.ui-button{display:flex!important;flex-direction:column!important;align-items:center!important;height:auto!important;min-height:46px!important;max-height:none!important;padding:3px 2px!important;gap:2px!important}
#gradient187 #gradient-tiles button>canvas,#gradient187 #gradient-tiles button>span{font-size:10px!important;letter-spacing:-.1px;position:static!important;flex:0 0 auto!important;transform:none!important;inset:auto!important}
#gradient-tiles button:hover{border-color:#7f97a6}#gradient-tiles button[aria-checked=true]{border-color:#b2e58a;background:#2b3f32;box-shadow:inset 0 0 0 1px #b2e58a}
#gradient187 .g-row{display:flex;align-items:center;gap:6px;min-height:26px;flex-wrap:nowrap}
#gradient187 .g-label{flex:0 0 78px;font-size:12px;color:#c6d3db}

#gradient187 .g-row input[type=range]{flex:1;min-width:50px;margin:0}
#gradient187 output{flex:0 0 38px;text-align:right;font-size:12px}
#gradient187 small{font-size:10px;color:#8ea3b0}
#gradient187 .g-row[hidden]{display:none}
#gradient187 .g-seg{display:inline-flex;flex:0 0 auto}#gradient187 .g-seg button{margin:0;min-width:24px;height:24px;padding:0 6px;border-radius:0;font-size:12px}
#gradient187 .g-seg button:first-child{border-radius:5px 0 0 5px}#gradient187 .g-seg button:last-child{border-radius:0 5px 5px 0}#gradient187 .g-seg button[aria-pressed=true]{background:#2b3f32;border-color:#b2e58a;color:#d8f5c0}
#gradient187 .g-angle{flex:0 0 90px}#gradient187 .g-check{display:inline-flex;align-items:center;gap:6px;margin:0 10px 0 0;font-size:12px;white-space:nowrap}#gradient187 .g-check .g-label{flex:0 0 78px}#gradient187 .g-check+.g-check{margin-left:18px}#gradient187 .g-row .color-favorite-control{flex:1;min-width:0}
#hatch-cards #hatch-card-gradient:not(.active) #gradient-tiles{opacity:.8}
#hatch-pattern-gallery .hatch-swatch.gradient{background:linear-gradient(90deg,#4f8fd6,#ffffff)}`;document.head.append(css);
 const asBackground=()=>!!$('#hatch-background-gradient')?.checked&&$('#hatch-enabled').checked&&!['GRADIENT','SOLID'].includes(select.value);
 const isOn=()=>$('#hatch-enabled').checked&&(select.value==='GRADIENT'||asBackground());
 const KEY='alcideGradient188';
 function read(){return normalize({type:$('#gradient-type').value,color1:$('#gradient-color1').value,color2:$('#gradient-color2').value,oneColor:$('#gradient-colours').value==='1',tint:+$('#gradient-tint').value/100,angle:cadNumeric($('#gradient-angle').value)||0,centered:$('#gradient-centered').checked,swap:$('#gradient-swap').checked});}
 function write(g){if(!g)return;g=normalize(g);$('#gradient-type').value=TYPES.some(t=>t[0]===g.type)?g.type:'LINEAR';if(/^#[0-9a-f]{6}$/i.test(g.color1||''))$('#gradient-color1').value=g.color1;if(/^#[0-9a-f]{6}$/i.test(g.color2||''))$('#gradient-color2').value=g.color2;$('#gradient-colours').value=g.oneColor?'1':'2';$('#gradient-tint').value=Math.round((g.tint??.75)*100);$('#gradient-angle').value=String(+(+g.angle||0).toFixed(4));$('#gradient-centered').checked=g.centered!==false;$('#gradient-swap').checked=!!g.swap;}
 function paint(c,g,alpha){const x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);x.save();x.setTransform(1,0,0,-1,0,c.height);x.fillStyle=canvasGradient(x,g,[0,0,c.width,c.height]);x.globalAlpha=alpha;x.fillRect(0,0,c.width,c.height);x.restore();}
 function preview(){const g=read(),alpha=1-(+$('#hatch-alpha').value||0)/100;paint($('#gradient-preview'),g,alpha);for(const b of box.querySelectorAll('[data-gradient-type]'))paint(b.firstChild,{...g,type:b.dataset.gradientType},1);}
 function layout(){const on=isOn(),g=read();if(!cards)box.hidden=!on;
  const one=g.oneColor;$('#gradient-color2-row').hidden=one;$('#gradient-tint-row').hidden=!one;for(const b of box.querySelectorAll('[data-colours]'))b.setAttribute('aria-pressed',String(b.dataset.colours===(one?'1':'2')));
  for(const b of box.querySelectorAll('[data-gradient-type]')){const v=String(on&&b.dataset.gradientType===g.type);if(b.getAttribute('aria-checked')!==v)b.setAttribute('aria-checked',v);}
  const a=$('#hatch-alpha').value;if($('#gradient-alpha').value!==a)$('#gradient-alpha').value=a;$('#gradient-alpha-value').value=a+' %';preview();}
 const decouple=hatchDecouple;hatchDecouple=function(v){
  // 1.0.91 : interrupteur Dégradé coupé → plus de remplissage dégradé (avant : filled forcé à true, le dégradé revenait).
  if(v.fillPattern==='GRADIENT'&&!v.filled){v.fillPattern='SOLID';v=decouple(v);v.fillGradient=null;v.fillBackgroundGradient=null;return v;}
  if(v.fillPattern==='GRADIENT'){const g=read();v.fillPattern='SOLID';v.filled=true;v.fillGradient=g;v.fillBackgroundColor=null;v.fillBackgroundGradient=null;v.fillColor=g.color1;return v;}v=decouple(v);v.fillGradient=null;v.fillBackgroundGradient=asBackground()?read():null;if(v.fillBackgroundGradient)v.fillBackgroundColor=null;return v;};
 let applying=false;const requests=window.clipboardPreviewRequests131;if(typeof requests==='function')clipboardPreviewRequests131=function(list){if(applying){const g=isOn()?read():null;const bgMode=asBackground();for(const r of list){if(!r?.style)continue;r.style.gradient=bgMode?null:g;r.style.backgroundGradient=bgMode?g:null;if(bgMode)r.style.backgroundColor=null;}}return requests.apply(this,arguments);};
 const apply=$('#hatch-apply'),run=apply.onclick;apply.onclick=async function(){applying=true;try{return await run.apply(this,arguments);}finally{applying=false;}};
 function remember(){try{localStorage.setItem(KEY,JSON.stringify(read()));}catch{}}
 function activate(){if(isOn())return;if(window.HatchCards?.setKind)window.HatchCards.setKind('gradient');else{$('#hatch-enabled').checked=true;select.value='GRADIENT';select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));}}
 function changed(){remember();layout();if(drawingMode)drawingSaveStyle?.();if(isOn())window.requestLiveHatch?.('hatch-pattern');drawOverlay();}
 for(const b of box.querySelectorAll('[data-gradient-type]'))b.onclick=()=>{$('#gradient-type').value=b.dataset.gradientType;activate();changed();};
 $('#gradient-swap-colours').onclick=()=>{const a=$('#gradient-color1'),b=$('#gradient-color2'),t=a.value;a.value=b.value;b.value=t;$('#gradient-colours').value='2';changed();};
 for(const b of box.querySelectorAll('[data-colours]'))b.onclick=()=>{$('#gradient-colours').value=b.dataset.colours;changed();};
 $('#gradient-alpha').addEventListener('input',ev=>{ev.stopPropagation();const a=$('#hatch-alpha');a.value=ev.target.value;a.dispatchEvent(new Event('input',{bubbles:true}));a.dispatchEvent(new Event('change',{bubbles:true}));layout();});
 for(const input of box.querySelectorAll('input:not(#gradient-alpha),select'))input.addEventListener('input',changed);
 for(const input of box.querySelectorAll('input[type=checkbox],input[type=color]'))input.addEventListener('change',changed);
 for(const id of ['hatch-pattern','hatch-enabled','hatch-alpha'])$('#'+id).addEventListener('input',layout);$('#hatch-background-gradient')?.addEventListener('change',layout);select.addEventListener('change',layout);
 try{write(JSON.parse(localStorage.getItem(KEY)||'null'));}catch{}
 let key='';function sync(){const targets=hatchTargets(),e=targets[0],g=spec(e),next=JSON.stringify([drawingMode?.kind,targets.map(t=>t.id),edits[e?.id]?.props||null,edits[e?.id]?.hatchStyle||null]);if(next===key||drawingMode)return;key=next;const gb=$('#hatch-background-gradient');if(g){select.value='GRADIENT';$('#hatch-enabled').checked=true;if(gb)gb.checked=false;write(g);select.dispatchEvent(new Event('change',{bubbles:true}));}else if(e&&gb){const b=bgSpec(e);if(gb.checked!==!!b){gb.checked=!!b;if(b){write(b);$('#hatch-background-enabled').checked=false;}gb.dispatchEvent(new Event('change',{bubbles:true}));}else if(b)write(b);}}
 const restoreDefaults=restoreDrawingDefaults;restoreDrawingDefaults=function(){restoreDefaults.apply(this,arguments);try{const s=JSON.parse(localStorage.getItem('drawingStyle')||'null');if(s?.fillGradient){select.value='GRADIENT';write(s.fillGradient);}}catch{}layout();};
 const draw=drawOverlay;drawOverlay=function(){draw.apply(this,arguments);if(!$('#hatch-properties')?.open&&!isOn())return;sync();layout();};
 layout();
 window.Gradient187.ui={read,write,activate,layout};
 // Galerie historique (#hatch-pattern-gallery) : vignette « Dégradé » avec un vrai aperçu.
 const gal=$('#hatch-pattern-gallery');if(gal&&!gal.querySelector('[data-pattern=GRADIENT]')){const b=document.createElement('button');b.type='button';b.dataset.pattern='GRADIENT';b.title='Dégradé';b.innerHTML='<span class="hatch-swatch gradient" aria-hidden="true"></span><span>Dégradé</span>';b.onclick=()=>{activate();changed();};gal.insertBefore(b,gal.children[1]||null);try{const c=document.createElement('canvas');c.width=42;c.height=28;paint(c,read(),1);b.firstChild.style.background='url('+c.toDataURL()+') center/cover';}catch{}}
 if(typeof registerHelpTopic==='function')registerHelpTopic('Dégradés',[Object.assign(document.createElement('p'),{textContent:'Dessin → Remplir → Dégradé, ou panneau Remplissage / hachures → carte Dégradé : cliquez une des 5 vignettes ; types AutoCAD (linéaire, cylindre, sphère, hémisphère, courbe), deux couleurs avec ⇄ pour les permuter (remplace les types inversés), orientation, centré et transparence. Fonctionne sur les contours sélectionnés, les nouveaux contours et le remplissage au clic. Export DWG/DXF en hachure dégradée native.'})]);
})();
