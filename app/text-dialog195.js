// 1.0.95 · Panneau « Créer un texte » : mise en page compacte en groupes (Texte | Style | Placement | Cadre),
// aperçu en direct agrandi lié à l'échelle, et choix du calque du texte (création et modification).
(()=>{
 const dialog=document.getElementById('textdialog');if(!dialog)return;
 const q=s=>dialog.querySelector(s),DEFAULT_LAYER='ALCIDE_TEXTES',KEY='textLayer195';
 let pending=null,stage=null;
 const css=document.createElement('style');css.textContent=`
dialog#textdialog.tx195{width:min(1010px,96vw)!important;min-height:0!important}
#textdialog.tx195 .text092-header{padding:10px 16px!important;align-items:center!important;gap:12px!important}
#textdialog.tx195 .text092-header>div{display:flex;align-items:baseline;gap:14px;min-width:0;width:auto!important;flex:1}
#textdialog.tx195 .text092-header small{display:none}
#textdialog.tx195 .text092-header h2{font-size:16px!important;margin:0!important;padding:0!important;border:0!important;background:none!important;display:flex;align-items:center;gap:6px;white-space:nowrap;height:auto!important;min-height:0!important;box-shadow:none!important}
#textdialog.tx195 .text092-header h2 .palette152-detach{width:24px!important;height:24px!important;min-height:0!important;padding:0!important;font-size:12px!important;opacity:.7}
#textdialog.tx195 .text092-header p{font-size:12px!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#textdialog.tx195 .text092-body{grid-template-columns:minmax(0,1.3fr) minmax(300px,1fr)!important;gap:14px!important;padding:14px 16px!important;align-items:start}
#textdialog.tx195 .tx195-card{border:1px solid var(--border);border-radius:8px;background:#ffffff06;padding:10px 12px;margin:0 0 10px!important}
#textdialog.tx195 .tx195-h,#textdialog.tx195 .text-dialog-options>summary,#textdialog.tx195 .text092-content>.text092-label{display:flex!important;align-items:center;gap:6px;font-size:11px!important;font-weight:700!important;letter-spacing:.6px;text-transform:uppercase;color:#b8d8a2!important;margin:0 0 8px!important;padding:0!important;min-height:0!important;height:auto!important;cursor:default}
#textdialog.tx195 .text-dialog-options>summary{cursor:pointer;list-style:none}
#textdialog.tx195 .text-dialog-options>summary::-webkit-details-marker{display:none}
#textdialog.tx195 .text-dialog-options>summary::before{content:'▾';font-size:10px;color:#8fb27a}
#textdialog.tx195 .text-dialog-options:not([open])>summary::before{content:'▸'}
#textdialog.tx195 .text-dialog-options:not([open])>summary{margin:0!important}
#textdialog.tx195 .text092-content{border:1px solid var(--border);border-radius:8px;padding:10px 12px;background:#ffffff06}
#textdialog.tx195 #rich-text-toolbar{border-radius:7px 7px 0 0!important;padding:6px 8px!important;gap:0!important}
#textdialog.tx195 .rt-formats{display:flex!important;align-items:center;gap:3px!important;flex-wrap:nowrap!important}
#textdialog.tx195 #rich-text-toolbar .rt-btn{width:32px!important;height:32px!important;min-width:32px!important;padding:0!important;font-size:15px!important;border-radius:6px!important;display:inline-flex;align-items:center;justify-content:center}
#textdialog.tx195 #rich-text-toolbar .rt-btn.rt-al{font-size:18px!important}
#textdialog.tx195 #rich-text-toolbar .rt-btn.active{background:#3d6a8a!important;border-color:#76a9cb!important}
#textdialog.tx195 .rt-sep195{width:1px;height:22px;background:var(--border);margin:0 6px;flex:none}
#textdialog.tx195 .rt-symbol-menu{align-self:center!important;height:32px!important;margin:0!important}
#textdialog.tx195 .rt-symbol-menu>summary{box-sizing:border-box;height:32px;display:flex;align-items:center;padding:0 10px!important;border-radius:6px!important}
#textdialog.tx195 #rich-text-editor{min-height:150px!important;height:150px;max-height:34vh!important;font-size:17px!important}
#textdialog.tx195 .tx195-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px 10px;align-items:end}
#textdialog.tx195 .tx195-grid>.wide{grid-column:1/-1}
#textdialog.tx195 .tx195-grid label,#textdialog.tx195 .text-dialog-grid>label{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:3px!important;margin:0!important;font-size:11px!important;color:var(--muted);white-space:nowrap;min-width:0}
#textdialog.tx195 .tx195-grid label>span:first-child{font-size:11px!important;color:var(--muted)}
#textdialog.tx195 .tx195-grid select,#textdialog.tx195 .tx195-grid .font-preview-trigger,#textdialog.tx195 .text-dialog-grid select{height:30px!important;width:100%!important;min-width:0!important;font-size:12px!important}
#textdialog.tx195 .tx195-grid .font-preview-control{width:100%!important}
#textdialog.tx195 .tx195-grid .numeric-stepper,#textdialog.tx195 .text-dialog-grid .numeric-stepper{width:100%!important;height:30px!important}
#textdialog.tx195 .tx195-grid .numeric-stepper>input{width:100%!important;height:30px!important}
#textdialog.tx195 .tx195-grid .color-favorite-control{height:30px!important;display:flex;align-items:center;gap:6px}
#textdialog.tx195 .tx195-scope{flex-direction:row!important;align-items:center!important;justify-content:space-between;gap:10px!important}
#textdialog.tx195 .tx195-scope select{width:auto!important;min-width:150px!important;height:26px!important}
#textdialog.tx195 .text-dialog-grid{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:8px 10px!important;padding:0!important}
#textdialog.tx195 .text-dialog-grid>label.row.text-dialog-field{display:grid!important;grid-template-columns:minmax(0,1fr)!important;grid-template-rows:auto auto;gap:3px!important;align-items:end!important;white-space:nowrap!important;font-size:11px!important;color:var(--muted)!important;min-height:0!important;height:auto!important;margin:0!important;padding:0!important}
#textdialog.tx195 .text-dialog-grid>label.row.text-dialog-field>*{width:100%!important;max-width:none!important;margin:0!important}
#textdialog.tx195 .text-dialog-grid>label:has(#dialog-text-alignment){grid-column:1/-1!important}
#textdialog.tx195 .text-dialog-options>summary{border:0!important}
#textdialog.tx195 .text-dialog-options .selection-actions{flex-direction:row!important;flex-wrap:wrap;gap:8px 18px!important;padding:0!important}
#textdialog.tx195 .text-dialog-options .selection-actions label{display:flex;align-items:center;gap:6px;font-size:12px;white-space:nowrap}
#textdialog.tx195 .tx195-layer{display:flex;align-items:center;gap:6px;min-width:0}
#textdialog.tx195 .tx195-swatch{width:18px;height:18px;border-radius:4px;border:1px solid #fff5;flex:none}
#textdialog.tx195 #text-layer195{flex:1;min-width:0}
#textdialog.tx195 #text-layer-new195{width:30px!important;height:30px!important;min-width:30px!important;padding:0!important;font-size:17px!important;font-weight:700;flex:none}
#textdialog.tx195 .tx195-left{min-width:0;display:flex;flex-direction:column}
#textdialog.tx195 .tx195-preview{margin:10px 0 0!important}
#textdialog.tx195 .tx195-preview .tx195-h{justify-content:space-between}
#textdialog.tx195 .tx195-preview .text-paper-scale159{display:flex!important;align-items:center;gap:8px;margin:0!important;font-size:11px!important;text-transform:none;letter-spacing:0;font-weight:400;color:var(--muted);width:auto!important}
#textdialog.tx195 .tx195-preview .text-paper-scale159 .numeric-stepper{width:96px!important;height:26px!important}
#textdialog.tx195 .tx195-preview .text-paper-scale159 input{height:26px!important}
#textdialog.tx195 #text092-placement-preview,#textdialog.tx195 .text092-placement>.text092-label{display:none!important}
#text-preview195{position:relative;height:150px;border:1px solid var(--border);border-radius:8px;overflow:hidden;background:#101820 linear-gradient(#ffffff08 1px,transparent 1px) 0 0/100% 20px,linear-gradient(90deg,#ffffff08 1px,transparent 1px) 0 0/20px 100%}
#text-preview195 .tx195-box{position:absolute;left:50%;top:50%;white-space:pre-wrap;line-height:1.25;transform-origin:0 0;padding:4px 7px;min-width:20px}
#text-preview195 .tx195-box.frame{outline:1.5px solid currentColor}
#text-preview195 .tx195-box.empty{opacity:.45;font-style:italic}
#text-preview195 .tx195-anchor{position:absolute;width:14px;height:14px;margin:-7px 0 0 -7px;pointer-events:none}
#text-preview195 .tx195-anchor::before,#text-preview195 .tx195-anchor::after{content:'';position:absolute;background:#9ccf79}
#text-preview195 .tx195-anchor::before{left:6px;top:0;width:2px;height:14px}#text-preview195 .tx195-anchor::after{top:6px;left:0;height:2px;width:14px}
#text-preview195 .tx195-info{position:absolute;right:8px;bottom:6px;font-size:10px;color:#9fb6c5;background:#101820cc;padding:2px 6px;border-radius:4px}
#text-preview195 svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
body[data-theme=light] #text-preview195{background-color:#f4f8fb}body[data-theme=light] #textdialog.tx195 .tx195-h,body[data-theme=light] #textdialog.tx195 .text-dialog-options>summary,body[data-theme=light] #textdialog.tx195 .text092-content>.text092-label{color:#477339!important}
@media(max-width:820px){#textdialog.tx195 .text092-body{grid-template-columns:minmax(0,1fr)!important}#textdialog.tx195 .text092-header p{display:none}}
`;document.head.append(css);
 const card=(cls,title)=>{const c=document.createElement('div');c.className='tx195-card '+cls;const h=document.createElement('div');h.className='tx195-h';h.textContent=title;c.append(h);return [c,h];};
 function ensure(){
  if(dialog.classList.contains('tx195'))return true;
  const body=q('.text092-body'),side=q('.text092-placement'),content=q('.text092-content'),formats=q('.rt-formats'),typo=q('.rt-typography');
  if(!body||!side||!content||!formats||!typo)return false;
  dialog.classList.add('tx195');
  // Barre de mise en forme : groupes séparés.
  const btns=[...formats.querySelectorAll(':scope>.rt-btn')];
  const sep=()=>Object.assign(document.createElement('span'),{className:'rt-sep195'});
  if(btns[4])btns[4].after(sep());if(btns[5])btns[5].after(sep());const sym=formats.querySelector('.rt-symbol-menu');if(sym){sym.before(sep());sym.style.marginLeft='0';}
  const alignTitles=['Aligner à gauche','Centrer','Aligner à droite'];btns.filter(b=>b.classList.contains('rt-al')).forEach((b,i)=>{if(!b.title)b.title=alignTitles[i]||'';});

  // Groupe Style : police, hauteur, couleur, calque, portée.
  const [style]=card('tx195-style','Style');const grid=document.createElement('div');grid.className='tx195-grid';style.append(grid);
  const fieldOf=id=>dialog.querySelector('#'+id)?.closest('label.rt-field');
  const font=fieldOf('rich-text-font'),height=fieldOf('paper-rich-text-height')||fieldOf('rich-text-height'),color=fieldOf('rich-text-color'),scope=fieldOf('rich-text-scope');
  if(font){font.classList.add('wide');grid.append(font);}if(height)grid.append(height);if(color)grid.append(color);
  const layerLabel=document.createElement('label');layerLabel.className='wide tx195-layer-field';const ls=document.createElement('span');ls.textContent='Calque';
  const wrap=document.createElement('span');wrap.className='tx195-layer';const sw=document.createElement('span');sw.className='tx195-swatch';sw.id='text-layer-swatch195';
  const sel=document.createElement('select');sel.id='text-layer195';sel.title='Calque du texte';sel.setAttribute('aria-label','Calque du texte');
  const plus=document.createElement('button');plus.type='button';plus.id='text-layer-new195';plus.textContent='+';plus.title='Créer un calque et y placer ce texte';plus.setAttribute('aria-label',plus.title);
  wrap.append(sw,sel,plus);layerLabel.append(ls,wrap);grid.append(layerLabel);
  if(scope){scope.classList.add('wide','tx195-scope');grid.append(scope);}
  if(!typo.children.length)typo.hidden=true;
  side.prepend(style);
  // Placement et cadre : cartes.
  for(const d of side.querySelectorAll(':scope>details.text-dialog-options'))d.classList.add('tx195-card');
  // Aperçu en direct sous les deux colonnes, avec l'échelle des textes.
  const [prev,ph]=card('tx195-preview','Aperçu en direct');const scale=side.querySelector('.text-paper-scale159');if(scale)ph.append(scale);
  stage=document.createElement('div');stage.id='text-preview195';stage.setAttribute('aria-label','Aperçu en direct du texte');prev.append(stage);const left=document.createElement('div');left.className='tx195-left';content.before(left);left.append(content,prev);
  sel.onchange=()=>{swatch();paint();};
  plus.onclick=ev=>{ev.preventDefault();if(!window.NewLayer)return;window.NewLayer.open(false,name=>{fill(name);paint();});};
  dialog.addEventListener('input',paint);dialog.addEventListener('change',paint);dialog.addEventListener('click',()=>requestAnimationFrame(paint));dialog.addEventListener('keyup',paint);
  const ed=document.getElementById('rich-text-editor');if(ed)new MutationObserver(paint).observe(ed,{childList:true,subtree:true,characterData:true,attributes:true});
  return true;
 }
 function layerColor(name){const l=(typeof layerData!=='undefined'?layerData:[]).find(l=>l.name===name);return l?.color||(name===DEFAULT_LAYER?'#a9df80':'#ffffff');}
 function swatch(){const s=document.getElementById('text-layer-swatch195'),v=document.getElementById('text-layer195')?.value;if(s)s.style.background=layerColor(v);}
 function fill(value){const sel=document.getElementById('text-layer195');if(!sel)return;const names=(typeof layerData!=='undefined'?layerData:[]).map(l=>l.name);if(!names.includes(DEFAULT_LAYER))names.unshift(DEFAULT_LAYER);if(value&&!names.includes(value))names.push(value);
  sel.replaceChildren(...names.map(n=>{const o=document.createElement('option');o.value=n;o.textContent=n+(n===DEFAULT_LAYER?' (par défaut)':'');const c=layerColor(n);o.style.color=c;return o;}));sel.value=value&&names.includes(value)?value:DEFAULT_LAYER;swatch();}
 function editTarget(){const t=q('.text092-header h2')?.textContent||'';if(!/Modifier/i.test(t))return null;if(typeof textDraft==='string'&&entities.get(textDraft))return entities.get(textDraft);if(selected?.size===1)return entities.get([...selected][0])||null;return null;}
 function onOpen(){if(!ensure())return;pending=null;setTimeout(()=>{const e=editTarget();let v;if(e)v=e.layer;else{try{v=localStorage.getItem(KEY)||DEFAULT_LAYER;}catch{v=DEFAULT_LAYER;}if(v!==DEFAULT_LAYER&&!layerData.some(l=>l.name===v))v=DEFAULT_LAYER;}fill(v);const sel=document.getElementById('text-layer195');sel.disabled=!!(e&&isLocked(e));paint();},0);}
 new MutationObserver(()=>{if(dialog.open)onOpen();}).observe(dialog,{attributes:true,attributeFilter:['open']});
 // Aperçu : police, hauteur, couleur, gras/italique (contenu riche), cadre, alignement, rotation, largeur, ancrage.
 function paint(){if(!stage||!dialog.open)return;const ed=document.getElementById('rich-text-editor'),val=id=>document.getElementById(id)?.value;
  const txt=(ed?.innerText||'').replace(/\n$/,''),empty=!txt.trim();const box=document.createElement('div');box.className='tx195-box'+(empty?' empty':'');
  if(empty)box.textContent='Votre texte';else box.innerHTML=ed.innerHTML;
  const mm=cadNumeric(val('paper-rich-text-height'))||2.5,fs=Math.max(9,Math.min(44,mm*8.5)),font=val('rich-text-font')||val('dialog-text-font')||'Segoe UI';
  const color=val('rich-text-color')||'#ffffff',wf=cadNumeric(val('dialog-text-width'))||1,ang=cadNumeric(val('annotationangle'))||0,al=(val('dialog-text-alignment')||'left-bottom').split('-');
  const frame=document.getElementById('textframe')?.checked,leader=document.getElementById('textleader')?.checked;
  Object.assign(box.style,{fontFamily:JSON.stringify(font.replace(/\s*·.*$/,''))+',"Segoe UI",Arial,sans-serif',fontSize:fs+'px',color,textAlign:al[0]==='center'?'center':al[0]==='right'?'right':'left'});if(frame)box.classList.add('frame');
  for(const n of box.querySelectorAll('[style*="font-size"]'))n.style.fontSize='';
  stage.replaceChildren(box);const w=box.offsetWidth,h=box.offsetHeight;
  const ax=al[0]==='center'?w/2:al[0]==='right'?w:0,ay=al[1]==='top'?0:al[1]==='middle'?h/2:h;
  // Centre la boîte transformée dans l'aperçu, rotation et largeur autour du point d'ancrage.
  const r=-ang*Math.PI/180,c=Math.cos(r),s=Math.sin(r),tf=(x,y)=>[(x-ax)*wf*c-(y-ay)*s,(x-ax)*wf*s+(y-ay)*c],pts=[tf(0,0),tf(w,0),tf(0,h),tf(w,h)];
  const W=stage.clientWidth,H=stage.clientHeight,minx=Math.min(...pts.map(p=>p[0])),maxx=Math.max(...pts.map(p=>p[0])),miny=Math.min(...pts.map(p=>p[1])),maxy=Math.max(...pts.map(p=>p[1]));
  const fit=Math.min(1,(W-40)/Math.max(1,maxx-minx),(H-34)/Math.max(1,maxy-miny)),px=W/2-(minx+maxx)/2*fit,py=(H-10)/2-(miny+maxy)/2*fit;
  box.style.left=box.style.top='0';box.style.transform=`translate(${px}px,${py}px) scale(${fit}) rotate(${-ang}deg) scale(${wf},1) translate(${-ax}px,${-ay}px)`;
  const a=document.createElement('div');a.className='tx195-anchor';a.title='Point d’ancrage';a.style.left=px+'px';a.style.top=py+'px';stage.append(a);
  if(leader){const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),p=document.createElementNS(ns,'path'),[sx,sy]=[px+pts[2][0]*fit,py+pts[2][1]*fit],ex=Math.max(10,sx-50),ey=Math.min(H-8,sy+28);p.setAttribute('d',`M${sx} ${sy}L${ex} ${ey}M${ex} ${ey}l9 -1.5M${ex} ${ey}l3 -8.5`);p.setAttribute('stroke',color);p.setAttribute('stroke-width','1.5');p.setAttribute('fill','none');svg.append(p);stage.append(svg);}
  const info=document.createElement('span');info.className='tx195-info';const sc=dialog.querySelector('.text-paper-scale159 input')?.value;info.textContent=`${font} · ${String(mm).replace('.',',')} mm${sc?' · 1:'+sc:''} · ${document.getElementById('text-layer195')?.value||DEFAULT_LAYER}`;stage.append(info);}
 // Calque appliqué au texte créé ou modifié (même étape d'annulation).
 dialog.addEventListener('click',ev=>{if(!ev.target.closest('#textconfirm'))return;const layer=document.getElementById('text-layer195')?.value;if(!layer)return;const e=editTarget();
  if(e){if(e.layer!==layer){pending={mode:'edit',id:e.id,layer};setTimeout(()=>{if(pending?.mode==='edit'&&pending.id===e.id){const before=snapshot();apply();commit(before);refresh();}},1500);}else pending=null;}
  else{pending={mode:'create',layer,known:new Set(Object.keys(edits))};try{localStorage.setItem(KEY,layer);}catch{}}},true);
 function apply(){const p=pending;pending=null;if(!p)return;if(p.mode==='edit'){const e=entities.get(p.id);if(e&&!isLocked(e))edits[p.id]={...edits[p.id],props:{...edits[p.id]?.props,layer:p.layer}};return;}
  for(const id of selected)if(!p.known.has(id)&&edits[id]?.annotation&&!edits[id].props?.layer&&p.layer!==DEFAULT_LAYER)edits[id]={...edits[id],props:{...edits[id].props,layer:p.layer}};}
 const baseCommit=commit;commit=function(before,...rest){try{if(pending&&!dialog.open){if(pending.mode==='edit')apply();else if(!annotationMode&&textDraft==null&&[...selected].some(id=>!pending.known.has(id)&&edits[id]?.annotation))apply();}}catch{}return baseCommit.call(this,before,...rest);};
 document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&pending?.mode==='create'&&!dialog.open)pending=null;},true);
 const baseTool=setTool;setTool=function(...a){if(pending?.mode==='create'&&a[0]!=='select')pending=null;return baseTool.apply(this,a);};
 ensure();window.TextDialog195={paint,fill};
})();
