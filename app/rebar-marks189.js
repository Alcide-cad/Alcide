/* 1.0.89 · Repères d'aciers : sélection multiple, déplacement en groupe et « Aligner les repères ».
   Un repère (bulle + texte) appartient à sa barre : le sélectionner seul (« repère seul ») déplace la bulle et le texte,
   la pointe du rappel restant accrochée à la barre. Sélection : clic (Maj/Ctrl+clic pour ajouter), fenêtre (gauche → droite,
   repère entièrement dedans) et capture (droite → gauche, repère touché), puce « Repères » du filtre de sélection.
   Déplacer (outil, ruban, glisser) et Aligner agissent sur tout le groupe, en une seule étape d'annulation. */
(()=>{
 const M=window.RebarMarks189={only:new Set()};
 const hasMark=e=>!!(e?.rebar&&visible(e)&&e.rebar.view?.labelVisible!==false&&!isLocked(e));
 const textLike=e=>!!e&&!isLocked(e)&&(['TEXT','MTEXT'].includes(e.type)||e.annotation&&!e.annotation.level&&!e.annotation.axis&&(e.annotation.text!=null||e.type==='TEXT'));
 let measureCtx=null;
 // Boîte monde d'un repère : bulle (cercle) + texte, depuis les mêmes données que l'affichage.
 function markBox(e){const d=RebarLabels.labelData(e,null,false),c=[d.origin[0]+d.offset[0],d.origin[1]+d.offset[1]];let x0=c[0]-d.r,x1=c[0]+d.r,y0=c[1]-d.r,y1=c[1]+d.r;
  if(d.text){measureCtx ||=document.createElement('canvas').getContext('2d');measureCtx.font=d.h+'px Arial';const w=Math.max(d.h,measureCtx.measureText(d.text).width),a=(d.angle||0)*Math.PI/180,o=[d.origin[0]+d.textOrigin[0],d.origin[1]+d.textOrigin[1]];
   for(const [x,y]of [[0,-d.h*.65],[w,-d.h*.65],[w,d.h*.65],[0,d.h*.65]]){const px=o[0]+x*Math.cos(a)-y*Math.sin(a),py=o[1]+x*Math.sin(a)+y*Math.cos(a);x0=Math.min(x0,px);x1=Math.max(x1,px);y0=Math.min(y0,py);y1=Math.max(y1,py);}}
  return [x0,y0,x1,y1];}
 function moveMark(e,dx,dy){const d=RebarLabels.labelData(e,null,false),v=edits[e.id].rebarView;v.labelOffset=[d.offset[0]+dx,d.offset[1]+dy];v.labelVisible=true;}
 function sync(){for(const id of [...M.only]){const e=entities.get(id);if(!selected.has(id)||!e?.rebar)M.only.delete(id);}}
 M.markBox=markBox;M.hasMark=hasMark;M.sync=sync;M.moveMark=moveMark;
 // 1.0.93 : repères touchés (capture) ou contenus (fenêtre) par un rectangle écran, pour les outils qui ont leur propre étape de sélection (Déplacer…).
 M.inRect=(a,b)=>{const cross=b[0]<a[0],r=[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1])],out=[];for(const e of entities.values()){if(!hasMark(e)||e.layout!==scene.layout)continue;let bx;try{const k=markBox(e),cs=[[k[0],k[1]],[k[2],k[1]],[k[2],k[3]],[k[0],k[3]]].map(screen),xs=cs.map(p=>p[0]),ys=cs.map(p=>p[1]);bx=[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];}catch{continue;}const inside=bx[0]>=r[0]&&bx[2]<=r[2]&&bx[1]>=r[1]&&bx[3]<=r[3],touch=bx[0]<=r[2]&&bx[2]>=r[0]&&bx[1]<=r[3]&&bx[3]>=r[1];if(cross?touch:inside)out.push(e.id);}return out;};
 // Repère sous le curseur (bulle ou texte), sinon null.
 M.hitMark=px=>{try{const h=window.RebarLabels?.hit?.(px);if(h&&h.kind==='label'&&hasMark(entities.get(h.id)))return h.id;}catch{}const w=world(px);for(const e of entities.values()){if(!hasMark(e)||e.layout!==scene.layout)continue;try{const b=markBox(e);if(w[0]>=b[0]&&w[0]<=b[2]&&w[1]>=b[1]&&w[1]<=b[3])return e.id;}catch{}}return null;};
 // Les repères seuls sont-ils la cible courante ? (outil Déplacer, Aligner…)
 M.markIds=()=>{sync();return [...M.only].filter(id=>hasMark(entities.get(id)));};
 // --- Sélection par fenêtre / capture : les repères dont la barre n'est pas prise sont ajoutés comme « repère seul ».
 let down=null;
 overlay.addEventListener('pointerdown',ev=>{down=ev.button===0&&tool==='select'&&!ev.altKey?{p:eventPoint(ev),add:ev.shiftKey||ev.ctrlKey||ev.metaKey||!!window.selectionAddMode,before:new Set(selected)}:null;},true);
 overlay.addEventListener('pointerup',ev=>{const d=down;down=null;if(!d||tool!=='select'||!scene)return;const q=eventPoint(ev);if(Math.hypot(q[0]-d.p[0],q[1]-d.p[1])<=3){// clic simple : une barre cliquée redevient barre + repère
   for(const id of [...M.only])if(selected.has(id)&&!d.before.has(id))M.only.delete(id);sync();return;}
  if(!d.add)M.only=new Set([...M.only].filter(id=>selected.has(id)&&d.before.has(id)&&false));
  const cross=q[0]<d.p[0],r=[Math.min(q[0],d.p[0]),Math.min(q[1],d.p[1]),Math.max(q[0],d.p[0]),Math.max(q[1],d.p[1])];let added=0;
  for(const e of entities.values()){if(!hasMark(e)||e.layout!==scene.layout)continue;const b=markBox(e),cs=[[b[0],b[1]],[b[2],b[1]],[b[2],b[3]],[b[0],b[3]]].map(screen),xs=cs.map(p=>p[0]),ys=cs.map(p=>p[1]),bx=[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];
   const inside=bx[0]>=r[0]&&bx[2]<=r[2]&&bx[1]>=r[1]&&bx[3]<=r[3],touch=bx[0]<=r[2]&&bx[2]>=r[0]&&bx[1]<=r[3]&&bx[3]>=r[1];
   if(cross?touch:inside){if(!selected.has(e.id)){selected.add(e.id);M.only.add(e.id);added++;}}}
  if(added){window.selectedRebarLabel=null;refresh(false);status(selected.size+' objet(s) sélectionné(s) dont '+M.only.size+' repère(s) seul(s) · Déplacer ou Aligner les repères.');}},false);
 document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&!document.querySelector('dialog[open]'))M.only.clear();});
 // --- Déplacer : repères seuls + autres objets, une seule étape d'annulation.
 const move=moveSelection;moveSelection=function(dx,dy,ids=[...selected]){sync();const marks=ids.filter(id=>M.only.has(id)&&hasMark(entities.get(id)));if(!marks.length||busy||![dx,dy].every(Number.isFinite))return move.apply(this,arguments);
  const rest=ids.filter(id=>!marks.includes(id)),before=snapshot();for(const id of marks)moveMark(entities.get(id),dx,dy);
  if(rest.length){const real=commit;commit=function(){};try{move.call(this,dx,dy,rest);}finally{commit=real;}}
  commit(before);status(marks.length+' repère(s) déplacé(s)'+(rest.length?' et '+rest.length+' objet(s)':'')+' · rappels accrochés aux barres · Ctrl+Z annule.');};
 // Aperçu de l'outil Déplacer pour un groupe de repères.
 const preview=drawTransformPreview;drawTransformPreview=function(...args){const r=preview.apply(this,args);try{if(tool==='move'&&points.length&&cursor){const delta=cursor.map((n,i)=>n-points[0][i]);for(const id of M.markIds()){const e=entities.get(id),d=RebarLabels.labelData(e,null,false);RebarLabels.paintOffset(id,[d.offset[0]+delta[0],d.offset[1]+delta[1]]);}}}catch{}return r;};
 // Copier : une copie de repère seul n'a pas de sens (le repère appartient à sa barre) ; les repères seuls sont ignorés.
 if(typeof copySelection==='function'){const copy=copySelection;copySelection=function(dx,dy,ids=[...selected]){sync();const marks=ids.filter(id=>M.only.has(id));if(!marks.length)return copy.apply(this,arguments);const rest=ids.filter(id=>!M.only.has(id));if(rest.length)copy.call(this,dx,dy,rest);status((rest.length?rest.length+' objet(s) copié(s) · ':'')+marks.length+' repère(s) seul(s) non copié(s) : un repère appartient à sa barre (copiez la barre).');};}
 // --- Affichage : un repère seul est surligné sans sa barre.
 const objColor=objectColor;objectColor=function(e,p,fallback){return objColor.apply(this,arguments);};
 // --- Aligner les repères / textes
 function items(){sync();const out=[];for(const id of selected){const e=entities.get(id);if(hasMark(e))out.push({id,kind:'mark',box:markBox(e)});else if(textLike(e)&&e.bounds)out.push({id,kind:'text',box:[...e.bounds]});}return out;}
 M.items=items;
 function align(mode,refId=null){if(busy||!scene)return 0;const list=items();if(list.length<2){toast187('Aligner : sélectionnez au moins 2 repères ou textes.');return 0;}
  const ref=refId?list.find(x=>x.id===refId):null,cx=b=>(b[0]+b[2])/2,cy=b=>(b[1]+b[3])/2,pool=ref?[ref]:list,deltas=new Map();
  const pick={left:()=>Math.min(...pool.map(x=>x.box[0])),right:()=>Math.max(...pool.map(x=>x.box[2])),top:()=>Math.max(...pool.map(x=>x.box[3])),bottom:()=>Math.min(...pool.map(x=>x.box[1])),cx:()=>ref?cx(ref.box):(Math.min(...list.map(x=>x.box[0]))+Math.max(...list.map(x=>x.box[2])))/2,cy:()=>ref?cy(ref.box):(Math.min(...list.map(x=>x.box[1]))+Math.max(...list.map(x=>x.box[3])))/2};
  if(mode==='dx'||mode==='dy'){if(list.length<3){toast187('Répartir : sélectionnez au moins 3 repères ou textes.');return 0;}const k=mode==='dx'?cx:cy,s=[...list].sort((a,b)=>k(a.box)-k(b.box)),a=k(s[0].box),b=k(s.at(-1).box);s.forEach((x,i)=>{const t=a+(b-a)*i/(s.length-1);deltas.set(x.id,mode==='dx'?[t-k(x.box),0]:[0,t-k(x.box)]);});}
  else{const t=pick[mode]();for(const x of list){const b=x.box;deltas.set(x.id,mode==='left'?[t-b[0],0]:mode==='right'?[t-b[2],0]:mode==='top'?[0,t-b[3]]:mode==='bottom'?[0,t-b[1]]:mode==='cx'?[t-cx(b),0]:[0,t-cy(b)]);}}
  const before=snapshot();let n=0;for(const x of list){const [dx,dy]=deltas.get(x.id)||[0,0];if(Math.abs(dx)<1e-12&&Math.abs(dy)<1e-12)continue;n++;const e=entities.get(x.id);if(x.kind==='mark')moveMark(e,dx,dy);else{const p=edits[x.id]||{};edits[x.id]={...p,dx:(p.dx||0)+dx,dy:(p.dy||0)+dy};}}
  if(n)commit(before);const names={left:'à gauche',right:'à droite',top:'en haut',bottom:'en bas',cx:'centrés horizontalement',cy:'centrés verticalement',dx:'répartis horizontalement',dy:'répartis verticalement'};
  toast187(list.length+' repère(s)/texte(s) '+(names[mode]||'')+(ref?' sur la référence':'')+'.');status(list.length+' élément(s) alignés · rappels accrochés aux barres · Ctrl+Z annule.');return n;}
 M.align=align;
 const svg=inner=>'<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7">'+inner+'</svg>';
 const MODES=[['left','Aligner à gauche','<path d="M4 3v18"/><rect x="7" y="6" width="11" height="4"/><rect x="7" y="14" width="7" height="4"/>'],['cx','Centrer horizontalement','<path d="M12 3v18"/><rect x="5" y="6" width="14" height="4"/><rect x="8" y="14" width="8" height="4"/>'],['right','Aligner à droite','<path d="M20 3v18"/><rect x="6" y="6" width="11" height="4"/><rect x="10" y="14" width="7" height="4"/>'],
  ['top','Aligner en haut','<path d="M3 4h18"/><rect x="6" y="7" width="4" height="11"/><rect x="14" y="7" width="4" height="7"/>'],['cy','Centrer verticalement','<path d="M3 12h18"/><rect x="6" y="5" width="4" height="14"/><rect x="14" y="8" width="4" height="8"/>'],['bottom','Aligner en bas','<path d="M3 20h18"/><rect x="6" y="6" width="4" height="11"/><rect x="14" y="10" width="4" height="7"/>'],
  ['dx','Répartir horizontalement (3 ou plus)','<rect x="3" y="8" width="4" height="8"/><rect x="10" y="8" width="4" height="8"/><rect x="17" y="8" width="4" height="8"/>'],['dy','Répartir verticalement (3 ou plus)','<rect x="8" y="3" width="8" height="4"/><rect x="8" y="10" width="8" height="4"/><rect x="8" y="17" width="8" height="4"/>']];
 const pop=document.createElement('div');pop.id='align-marks189';pop.hidden=true;pop.setAttribute('role','toolbar');pop.setAttribute('aria-label','Aligner les repères');
 pop.innerHTML='<span class="am-title">Aligner</span>'+MODES.map(([k,t,i])=>'<button type="button" data-align="'+k+'" title="'+t+'" aria-label="'+t+'">'+svg(i)+'</button>').join('')+'<span class="am-sep"></span><button type="button" id="align-marks189-ref" aria-pressed="false" title="Sur une référence : choisissez l’alignement puis cliquez le repère ou le texte qui ne bouge pas">'+svg('<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2" fill="currentColor"/>')+'<span>Réf.</span></button><button type="button" class="am-close" title="Fermer" aria-label="Fermer">×</button>';
 document.body.append(pop);let refMode=false,pending=null;
 function openPop(anchor){pop.hidden=false;const r=(anchor||overlay).getBoundingClientRect();pop.style.left=Math.max(6,Math.min(innerWidth-pop.offsetWidth-6,r.left))+'px';pop.style.top=(anchor?r.bottom+4:r.top+10)+'px';update();}
 function update(){const n=items().length;for(const b of pop.querySelectorAll('[data-align]'))b.disabled=n<(b.dataset.align[0]==='d'?3:2);pop.querySelector('.am-title').textContent='Aligner · '+n;}
 M.open=openPop;M.count=()=>items().length;M.close=()=>{pop.hidden=true;pending=null;};
 pop.querySelector('.am-close').onclick=()=>M.close();
 pop.querySelector('#align-marks189-ref').onclick=ev=>{refMode=!refMode;ev.currentTarget.setAttribute('aria-pressed',String(refMode));ev.currentTarget.classList.toggle('active',refMode);};
 for(const b of pop.querySelectorAll('[data-align]'))b.onclick=()=>{if(refMode){pending=b.dataset.align;status('Aligner sur une référence : cliquez le repère ou le texte de référence · Échap annule.');overlay.style.cursor='crosshair';}else align(b.dataset.align);};
 M.picking=ev=>{if(!pending||ev.target!==overlay||ev.button!==0)return false;ev.preventDefault();ev.stopImmediatePropagation();const p=world(eventPoint(ev)),list=items(),hit=list.find(x=>p[0]>=x.box[0]&&p[0]<=x.box[2]&&p[1]>=x.box[1]&&p[1]<=x.box[3]);const mode=pending;pending=null;overlay.style.cursor='';if(!hit){status('Référence : cliquez un repère ou un texte de la sélection.');return true;}align(mode,hit.id);return true;};
 window.addEventListener('pointerdown',ev=>{M.picking(ev);},true);
 document.addEventListener('keydown',ev=>{if(pending&&ev.key==='Escape'){pending=null;overlay.style.cursor='';status('Alignement annulé.');}},true);
 // Ruban Armatures + clic droit
 const rb=document.createElement('button');rb.id='align-marks189-tool';rb.type='button';rb.className='ribbon-button uniform-tool ribbon-featured ribbon104-captioned';rb.innerHTML=svg('<path d="M4 3v18"/><circle cx="10" cy="8" r="3"/><path d="M13 8h7"/><circle cx="10" cy="16" r="3"/><path d="M13 16h5"/>')+'<span class="tool-label">Aligner les repères</span>';rb.title='Aligner les repères · sélectionnez 2 repères ou textes ou plus (Maj+clic, fenêtre ou capture) · gauche, droite, haut, bas, centres, répartir, ou sur une référence';rb.setAttribute('aria-label','Aligner les repères');
 rb.onclick=()=>{if(!scene)return;if(!pop.hidden){M.close();return;}openPop(rb);if(items().length<2)status('Aligner les repères : sélectionnez au moins 2 repères (Maj+clic sur les bulles, ou fenêtre) ou textes.');};
 const placeRibbon=()=>{if(rb.isConnected)return true;const anchor=document.getElementById('positions-manager157')||document.getElementById('rebar-label-place-ribbon');if(anchor){anchor.after(rb);return true;}const page=document.getElementById('ribbon-armatures');if(page){page.append(rb);return true;}return false;};
 if(!placeRibbon())window.addEventListener('load',placeRibbon,{once:true});setTimeout(placeRibbon,0);
 overlay.addEventListener('contextmenu',()=>queueMicrotask(()=>{const panel=$('#context-commands');if(!panel||!scene||busy||tool!=='select'||items().length<2||panel.querySelector('#context-align189'))return;const b=document.createElement('button');b.type='button';b.id='context-align189';b.innerHTML='<span>Aligner les repères…</span>';b.title='Aligner ou répartir les repères et textes sélectionnés';b.onclick=ev=>{ev.preventDefault();ev.stopPropagation();hideMenu();openPop(null);};const del=[...panel.children].find(n=>n.tagName==='BUTTON'&&n.textContent.trim().startsWith('Supprimer'));if(del)del.before(b);else panel.append(b);}));
 const draw=drawOverlay;drawOverlay=function(...a){const r=draw.apply(this,a);sync();if(!pop.hidden)update();
  // contour pointillé autour des repères sélectionnés seuls
  const ids=M.markIds();if(ids.length){oc.save();oc.strokeStyle='#66b3ff';oc.setLineDash([4,3]);oc.lineWidth=1;for(const id of ids){const b=markBox(entities.get(id)),p=[[b[0],b[1]],[b[2],b[3]]].map(screen);oc.strokeRect(Math.min(p[0][0],p[1][0])-3,Math.min(p[0][1],p[1][1])-3,Math.abs(p[1][0]-p[0][0])+6,Math.abs(p[1][1]-p[0][1])+6);}oc.restore();}return r;};
 if(typeof registerHelpTopic==='function')registerHelpTopic('Repères d’aciers : sélection, déplacement, alignement',[Object.assign(document.createElement('p'),{textContent:'Cliquez une bulle de repère, puis Maj+clic sur les suivantes (ou encadrez-les : de gauche à droite, repères entièrement dedans ; de droite à gauche, repères touchés). Glissez une bulle pour déplacer tout le groupe, ou utilisez Déplacer. Armatures → Aligner les repères : gauche, centre, droite, haut, centre, bas, répartir, ou « Réf. » puis cliquez le repère qui ne bouge pas. Les rappels restent accrochés aux barres. Ctrl+Z annule en une fois.'})]);
 const css=document.createElement('style');css.textContent='#align-marks189{position:fixed;z-index:2147482000;display:flex;align-items:center;gap:3px;padding:5px 7px;background:#1c2b36;border:1px solid #66b3ff;border-radius:8px;box-shadow:0 4px 18px #000a}#align-marks189[hidden]{display:none}#align-marks189 button{display:inline-flex;align-items:center;gap:3px;min-width:28px;height:28px;padding:0 5px;margin:0;font-size:11px}#align-marks189 button[disabled]{opacity:.4}#align-marks189 button.active,#align-marks189 button[aria-pressed=true]{border-color:#b2e58a;background:#2b3f32}#align-marks189 .am-title{font-size:12px;margin-right:4px;white-space:nowrap}#align-marks189 .am-sep{width:1px;height:20px;background:#3e5260;margin:0 3px}';document.head.append(css);
})();
