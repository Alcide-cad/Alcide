// 0.7.8 : flèches aux extrémités des lignes et polylignes ouvertes.
// Spécification : props.arrows={mode:'start'|'end'|'both',size:<unités dessin>,style:'filled'|'open'|'oblique'}.
// Rendu calculé depuis la géométrie courante (suit déplacement, copie, étirement, miroir) ; export natif SOLID/lignes
// marqués ALCIDE_ARROW + spécification ALCIDE_ARROWS sur l'objet (relue à l'import).
(()=>{
 const KEY='alcideArrowDefault',unit=()=>mm[$('#units')?.value]||1,cm=()=>10/unit();
 let def;try{def=JSON.parse(localStorage.getItem(KEY)||'null');}catch{}def=def||{mode:'none',size:25,style:'filled'};// size en cm
 const arrowsOf=e=>{const a=edits[e.id]&&Object.hasOwn(edits[e.id].props||{},'arrows')?edits[e.id].props.arrows:e.arrows;return a&&a.mode&&a.mode!=='none'?a:null;};
 const eligible=e=>e&&!edits[e.id]?.deleted&&!isLocked(e)&&(e.type==='LINE'||e.type==='LWPOLYLINE'&&!cadClosed(e));
 window.arrowsOf=arrowsOf;window.arrowEligible=eligible;
 const box=document.createElement('div');box.id='arrow-controls';box.className='arrow-panel';
 box.innerHTML=`<strong>Abouts de la ligne</strong><small id="arrow-context"></small>
 <div class="arrow-ends"><label><input id="arrow-start" type="checkbox" role="switch"><span class="arrow-switch-track" aria-hidden="true"></span> Au début</label><label><input id="arrow-end" type="checkbox" role="switch"><span class="arrow-switch-track" aria-hidden="true"></span> À la fin</label></div>
 <label class="arrow-field" for="arrow-size"><span>Taille</span><input id="arrow-size" type="text" inputmode="decimal" aria-label="Taille de flèche en centimètres"><span>cm</span></label>
 <label class="arrow-field" for="arrow-style"><span>Style</span><select id="arrow-style"><option value="">Styles différents</option><option value="filled">Plein</option><option value="open">Ouvert</option><option value="oblique">Trait oblique</option></select></label><small id="arrow-feedback" role="status"></small>`;
 const A=box.querySelector('#arrow-start'),B=box.querySelector('#arrow-end'),S=box.querySelector('#arrow-size'),T=box.querySelector('#arrow-style');
 const targets=()=>[...selected].map(id=>entities.get(id)).filter(eligible);
 const currentTargets=()=>targets();
 const spec=e=>{const raw=edits[e.id]&&Object.hasOwn(edits[e.id].props||{},'arrows')?edits[e.id].props.arrows:e.arrows;return {mode:'none',size:def.size*cm(),style:def.style,...raw};};
 const has=(mode,end)=>mode==='both'||mode===end;
 const mode=(start,end)=>start?(end?'both':'start'):(end?'end':'none');
 function show(){const ts=currentTargets();box.hidden=!!(selected.size&&!ts.length||drawingMode&&!['line','polyline'].includes(drawingMode.kind));const card=document.querySelector('#properties .selection-editor');
  const host=ts.length&&card&&card.offsetParent?card:$('#drawing-style');if(host&&box.parentElement!==host)host.append(box);
  const label=ts.length?ts.length+' ligne(s) / polyligne(s) sélectionnée(s)':'Prochaines lignes et polylignes ouvertes';if(box.querySelector('#arrow-context').textContent!==label)box.querySelector('#arrow-context').textContent=label;
  if(box.contains(document.activeElement))return;
  const values=ts.length?ts.map(spec):[{...def,size:def.size*cm()}];
  for(const [el,end] of [[A,'start'],[B,'end']]){const flags=values.map(v=>has(v.mode,end));el.checked=flags.every(Boolean);el.indeterminate=flags.some(Boolean)&&!flags.every(Boolean);}
  const same=k=>values.every(v=>v[k]===values[0][k]);
  S.value=same('size')?String(Math.round(values[0].size/cm()*10000)/10000):'';S.placeholder='Tailles différentes';
  T.value=same('style')?values[0].style:'';
 }
 function change(field){let size;
  if(field==='size'||field==='all'){size=Number(S.value.trim().replace(',','.'));if(!Number.isFinite(size)||size<=0){S.setCustomValidity('Saisissez une taille positive en cm.');S.reportValidity();return;}S.setCustomValidity('');}
  if(field==='style'&&!T.value)return;
  const patch=a=>{const v={...a};if(field==='start')v.mode=mode(A.checked,has(a.mode,'end'));if(field==='end')v.mode=mode(has(a.mode,'start'),B.checked);if(field==='size')v.size=size*cm();if(field==='style')v.style=T.value;if(field==='all'){v.mode=mode(A.indeterminate?has(a.mode,'start'):A.checked,B.indeterminate?has(a.mode,'end'):B.checked);v.size=size*cm();if(T.value)v.style=T.value;}return v;};
  const ts=currentTargets();
  if(selected.size&&!ts.length){const message='Sélectionnez une ligne ou une polyligne ouverte sur un calque déverrouillé.';box.querySelector('#arrow-feedback').textContent=message;status(message);return;}
  if(field==='all'&&!ts.length){box.querySelector('#arrow-feedback').textContent='Sélectionnez une ligne à modifier.';return;}
  if(ts.length){const changes=ts.map(e=>[e,patch(spec(e))]).filter(([e,v])=>JSON.stringify(v)!==JSON.stringify(spec(e)));
   if(changes.length){const before=snapshot();for(const [e,v] of changes)edits[e.id]={...edits[e.id],props:{...edits[e.id]?.props,arrows:v}};commit(before);status('Flèches modifiées sur '+changes.length+' objet(s) · Ctrl+Z annule.');}
  }else{const v=patch({...def,size:def.size*cm()});def={...v,size:v.size/cm()};localStorage.setItem(KEY,JSON.stringify(def));status('Flèches des prochaines lignes mémorisées.');}
  box.querySelector('#arrow-feedback').textContent=ts.length?'Appliqué à '+ts.length+' objet(s).':'Réglages des prochaines lignes mémorisés.';
  drawOverlay();
 }
 for(const [el,field] of [[A,'start'],[B,'end'],[S,'size'],[T,'style']])el.addEventListener('change',()=>change(field));
 
 S.addEventListener('input',()=>S.setCustomValidity(''));
 S.addEventListener('keydown',ev=>{if(ev.key==='Enter'){ev.preventDefault();ev.stopPropagation();S.blur();}});
 window.syncArrowControls=show;
 const nd=cadNewDrawing;cadNewDrawing=function(type,points,props={},closed=false){if(def.mode!=='none'&&(type==='LINE'||type==='LWPOLYLINE'&&!closed)&&!props.arrows&&!window.arrowSuppressDefault)props={...props,arrows:{mode:def.mode,size:def.size*cm(),style:def.style}};return nd.call(this,type,points,props,closed);};
 // géométrie des extrémités
 function bulgesOf(e){const b=edits[e.id]?.drawing?.bulges;if(b)return b;const s=e.type==='LWPOLYLINE'&&Array.isArray(e.shape?.[1])?e.shape[1]:[];return s.map(p=>Array.isArray(p)?p[2]||0:0);}
 function ends(e){const P=cadVertices(e);if(P.length<2)return [];const B=bulgesOf(e),n=P.length,ang=(p,q)=>Math.atan2(q[1]-p[1],q[0]-p[0]);
  const a0=ang(P[0],P[1])-2*Math.atan(B[0]||0),a1=ang(P[n-2],P[n-1])+2*Math.atan(B[n-2]||0);
  return [[P[0],[-Math.cos(a0),-Math.sin(a0)]],[P[n-1],[Math.cos(a1),Math.sin(a1)]]];}
 window.arrowHeads=function(e,a=arrowsOf(e)){if(!a)return [];const E=ends(e),pick=a.mode==='start'?[E[0]]:a.mode==='end'?[E[1]]:E,s=a.size,w=s/3;
  return pick.filter(Boolean).map(([t,[ux,uy]])=>{const b=[t[0]-ux*s,t[1]-uy*s],n=[-uy*w/2,ux*w/2];
   if(['circle','square','diamond','bar'].includes(a.style)){const r=s/4,n=[-uy*r,ux*r],v=[ux*r,uy*r];let pts;if(a.style==='bar')pts=[[t[0]-n[0],t[1]-n[1]],[t[0]+n[0],t[1]+n[1]]];else if(a.style==='circle')pts=Array.from({length:33},(_,i)=>[t[0]+r*Math.cos(i*Math.PI/16),t[1]+r*Math.sin(i*Math.PI/16)]);else if(a.style==='diamond')pts=[t.map((x,i)=>x+2*v[i]),t.map((x,i)=>x+2*n[i]),t.map((x,i)=>x-2*v[i]),t.map((x,i)=>x-2*n[i])];else pts=[t.map((x,i)=>x+v[i]+n[i]),t.map((x,i)=>x-v[i]+n[i]),t.map((x,i)=>x-v[i]-n[i]),t.map((x,i)=>x+v[i]-n[i])];return {style:a.style,pts,closed:a.style!=='bar'};}
   if(a.style==='oblique'){const q=s/2,c=Math.SQRT1_2,d=[(ux*c-uy*c)*q,(ux*c+uy*c)*q];return {style:'oblique',pts:[[t[0]-d[0],t[1]-d[1]],[t[0]+d[0],t[1]+d[1]]]};}
   return {style:a.style,closed:a.style==='triangle',pts:[[b[0]+n[0],b[1]+n[1]],t,[b[0]-n[0],b[1]-n[1]]]};});};
 function colorOf(e){const p=cadProps(e);return p.color&&p.color!=='bylayer'?p.color:(layerSettings?.(p.layer)?.color||'#e6e6e6');}
 const draw=drawOverlay;drawOverlay=function(...args){const r=draw.apply(this,args);if(!scene)return r;
  try{oc.save();oc.lineWidth=1.4;for(const e of (window.overlayFeatureEntities?overlayFeatureEntities('arrows'):entities.values())){if(e.arrowHead)continue;const a=arrowsOf(e);if(!a||edits[e.id]?.deleted||typeof visible==='function'&&!visible(e))continue;const c=selected.has(e.id)?selectionColor():colorOf(e);oc.strokeStyle=oc.fillStyle=c;
   for(const h of arrowHeads(e,a)){const q=h.pts.map(p=>screen(p));oc.beginPath();oc.moveTo(...q[0]);for(const p of q.slice(1))oc.lineTo(...p);if(h.closed||h.style==='filled')oc.closePath();if(h.style==='filled')oc.fill();oc.stroke();}}oc.restore();}catch(ex){console.warn(ex);}return r;};
 const pk=pick;pick=function(...args){const e=pk.apply(this,args);return e?.arrowHead?null:e;};
 const css=document.createElement('style');css.textContent=`
 #arrow-controls[hidden]{display:none!important}
 #arrow-controls{display:flex;flex-direction:column;gap:8px;margin-top:10px;padding:10px;border:1px solid #526477;border-radius:8px;min-width:0;box-sizing:border-box;max-width:100%}
 #arrow-controls strong{font-size:12px}#arrow-controls small{font-size:11px;opacity:.8;line-height:1.3}
 #arrow-controls .arrow-ends{display:flex;flex-wrap:wrap;gap:8px 16px}
 #arrow-controls .arrow-ends label{display:inline-flex;align-items:center;gap:6px;font-size:12px;white-space:nowrap}
 #arrow-controls .arrow-ends label{position:relative}
 #arrow-controls .arrow-ends input{position:absolute;opacity:0;width:36px;height:20px;margin:0}
 #arrow-controls .arrow-switch-track{pointer-events:none;width:36px;height:20px;border-radius:12px;background:#56626b;border:1px solid #82909a;position:relative;flex:none;transition:background .12s}
 #arrow-controls .arrow-switch-track:before{content:'';position:absolute;width:14px;height:14px;left:2px;top:2px;border-radius:50%;background:#edf2f5;transition:transform .12s}
 #arrow-controls input:checked+.arrow-switch-track{background:#4d8638;border-color:var(--accent)}
 #arrow-controls input:checked+.arrow-switch-track:before{transform:translateX(16px)}
 #arrow-controls input:indeterminate+.arrow-switch-track:before{transform:translateX(8px)}
 #arrow-controls input:focus-visible+.arrow-switch-track{outline:2px solid var(--accent);outline-offset:3px}
 #arrow-controls .arrow-field{display:flex!important;align-items:center;gap:8px;min-width:0;font-size:12px}
 #arrow-controls .arrow-field>span:first-child{flex:0 0 45px}
 #arrow-controls .arrow-field>input,#arrow-controls .arrow-field>select{flex:1;width:0!important;min-width:0!important;max-width:100%;box-sizing:border-box;height:30px}
 `;document.head.append(css);
 setInterval(()=>{if(scene)show();},400);show();
})();
