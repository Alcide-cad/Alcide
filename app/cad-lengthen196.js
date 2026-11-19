// ALCIDE 1.0.96 · ALLONGER (LENGTHEN) : delta, total, pourcentage, dynamique. Lignes, polylignes (segment d'extrémité),
// arcs (le rayon reste fixe) et armatures linéaires. Contrairement à Étirer (qui déplace les sommets pris dans une
// fenêtre), Allonger change la longueur d'un objet par l'extrémité cliquée, sans rien déplacer d'autre.
(()=>{
 const C=window.Cad196;let opts={mode:'delta',value:100};try{Object.assign(opts,JSON.parse(localStorage.getItem('lengthen196')||'{}'));}catch{}
 const save=()=>{try{localStorage.setItem('lengthen196',JSON.stringify(opts));}catch{}};
 const labels={delta:'Delta',total:'Total',percent:'Pourcentage',dynamic:'Dynamique'};
 function info(e,p){if(!e||isLocked(e))return null;const cv=C.curve(e);
  if(cv&&!cv.full&&e.type==='ARC'){const ds=C.dist(p,cv.points[1]),de=C.dist(p,cv.points[2]);let span=((cv.end-cv.start)%(2*Math.PI)+2*Math.PI)%(2*Math.PI);return {kind:'arc',e,cv,end:de<ds?'end':'start',length:cv.radius*span,span};}
  if(['LINE','LWPOLYLINE'].includes(e.type)&&!cadClosed(e)){let ps;try{ps=cadVertices(e);}catch{return null;}if(ps.length<2||e.shape?.[1]?.some?.(q=>q[2]))return null;const atEnd=C.dist(p,ps.at(-1))<C.dist(p,ps[0]);const a=atEnd?ps.at(-2):ps[1],b=atEnd?ps.at(-1):ps[0];return {kind:'line',e,ps,atEnd,a,b,length:C.dist(a,b),total:ps.slice(1).reduce((n,q,i)=>n+C.dist(q,ps[i]),0)};}
  // Armature linéaire paramétrique : on s'appuie sur ses sommets éditables si disponibles.
  if(e.rebar){if(!window.RebarGrips?.eligible(e))return null;let ps;try{ps=RebarGrips.vertices(e);}catch{return null;}if(e.rebar.model.shape==='cadre'||e.rebar.model.closed)return null;if(!ps||ps.length<2)return null;const atEnd=C.dist(p,ps.at(-1))<C.dist(p,ps[0]);const a=atEnd?ps.at(-2):ps[1],b=atEnd?ps.at(-1):ps[0];return {kind:'rebar',e,ps,atEnd,a,b,length:C.dist(a,b),total:ps.slice(1).reduce((n,q,i)=>n+C.dist(q,ps[i]),0)};}
  return null;}
 // Objet à allonger sous le curseur : le plus proche des objets éligibles (une cote ou un texte superposé ne gêne pas).
 function pickTarget(px,p){const first=pick(px),t0=info(first,p);if(t0)return t0;const tol=8/view.s;let best=null,bd=1e99;
  for(const e of query([p[0]-tol,p[1]-tol,p[0]+tol,p[1]+tol])){if(!visible(e))continue;const t=info(e,p);if(!t)continue;let d=1e99;
   if(t.kind==='arc')d=Math.abs(C.dist(p,t.cv.center)-t.cv.radius);else{const ps=t.ps;for(let i=1;i<ps.length;i++)d=Math.min(d,segmentDistance(p,ps[i-1],ps[i]));}
   if(d<bd){bd=d;best=t;}}
  return bd<=tol?best:null;}
 // Nouvelle longueur du segment / de l'arc selon le mode.
 function target(t,cursor){const L=t.kind==='arc'?t.length:t.length,whole=t.kind==='arc'?t.length:t.total;
  if(opts.mode==='delta')return L+opts.value;if(opts.mode==='percent')return L*opts.value/100;if(opts.mode==='total')return L+(opts.value-whole);
  if(t.kind==='arc'){const a=C.ang(t.cv.center,cursor);const fixed=t.end==='end'?t.cv.start:t.cv.end;let s=t.end==='end'?a-fixed:fixed-a;s=((s%(2*Math.PI))+2*Math.PI)%(2*Math.PI);return s*t.cv.radius;}
  const u=C.sub(t.b,t.a),l=Math.hypot(...u);return ((cursor[0]-t.a[0])*u[0]+(cursor[1]-t.a[1])*u[1])/l;}
 function result(t,len){if(!(len>1e-9))throw Error('La longueur obtenue doit rester positive.');
  if(t.kind==='arc'){const span=len/t.cv.radius;if(span>=2*Math.PI-1e-9)throw Error('L’arc dépasserait un cercle complet.');const c=t.cv.center,r=t.cv.radius;let s=t.cv.start,e=t.cv.end;if(t.end==='end')e=s+span;else s=e-span;return [c,[c[0]+r*Math.cos(s),c[1]+r*Math.sin(s)],[c[0]+r*Math.cos(e),c[1]+r*Math.sin(e)]];}
  const u=C.sub(t.b,t.a),l=Math.hypot(...u),q=[t.a[0]+u[0]/l*len,t.a[1]+u[1]/l*len];const ps=t.ps.map(p=>[...p]);if(t.atEnd)ps[ps.length-1]=q;else ps[0]=q;return ps;}
 function write(t,ps){const id=t.e.id;if(t.kind==='arc'){const d=C.off(id);edits[id]={...edits[id],geometry:{points:ps.map(p=>[p[0]-d[0],p[1]-d[1]])}};return;}
  if(t.kind==='rebar'){const i=t.atEnd?ps.length-1:0;RebarGrips.apply([RebarGrips.gripPlan(t.e,i,ps[i])]);return 'committed';}
  cadWriteGeometry(t.e,ps);}
 function start(){let dyn=null;
  C.start({name:'ALLONGER',title:'Allonger ('+labels[opts.mode]+(opts.mode==='dynamic'?'':' '+String(opts.value).replace('.',',')+(opts.mode==='percent'?' %':''))+')',raw:true,
   prompt:()=>dyn?'déplacez puis cliquez pour fixer la nouvelle extrémité':'cliquez près de l’extrémité à allonger (ou raccourcir) · D delta · T total · P pourcentage · Y dynamique · Échap termine',
   onClick:(p,ev,px)=>{
    if(dyn){const t=dyn;dyn=null;const before=snapshot();try{if(write(t,result(t,target(t,snap(px))))!=='committed')commit(before);}catch(e){restore(before);status(e.message);return;}status('Objet allongé · Ctrl+Z annule.');return;}
    const t=pickTarget(px,p);if(!t){status('Allonger : cliquez une ligne, une polyligne ouverte, un arc ou une armature près de son extrémité.');return;}
    if(opts.mode==='dynamic'){dyn=t;return;}
    const before=snapshot();let done;try{done=write(t,result(t,target(t,p)));}catch(e){restore(before);status(e.message);return;}if(done!=='committed')commit(before);status('Allongé de '+String(Math.round((target(t,p)-t.length)*100)/100).replace('.',',')+' · cliquez un autre objet ou Échap.');},
   onKey:ev=>{const k=ev.key.toLowerCase();const m={d:'delta',t:'total',p:'percent',y:'dynamic'}[k];if(m){C.stop();ask(m);return true;}},
   draw:c=>{if(!c)return;let t=dyn;if(!t){t=C.mode?.pixel?pickTarget(C.mode.pixel,c):null;}if(!t)return;try{const len=target(t,dyn?snap(C.mode.pixel):c),ps=result(t,len);if(t.kind==='arc'){const q=screen(ps[0]);const r=t.cv.radius*view.s;oc.save();oc.strokeStyle='#ffd166';oc.lineWidth=2;oc.setLineDash([6,4]);const a1=Math.atan2(screen(ps[1])[1]-q[1],screen(ps[1])[0]-q[0]),a2=Math.atan2(screen(ps[2])[1]-q[1],screen(ps[2])[0]-q[0]);oc.beginPath();oc.arc(q[0],q[1],r,a1,a2,screen([0,1])[1]<screen([0,0])[1]);oc.stroke();oc.restore();}else{const a=t.atEnd?ps.at(-2):ps[1],b=t.atEnd?ps.at(-1):ps[0];C.line(a,b,'#ffd166');}C.label('L = '+String(Math.round(len*100)/100).replace('.',',')+(t.kind==='arc'?'':' ('+String(Math.round(t.length*100)/100).replace('.',',')+')'),c);}catch{}}});}
 function ask(mode){mode=mode||opts.mode;if(mode==='dynamic'){opts.mode='dynamic';save();start();return;}
  const d=C.dialog('lengthen-dialog196','Allonger (ALLONGER)','<div class="cad196-tabs">'+Object.entries(labels).map(([k,l])=>'<button type="button" data-m="'+k+'" aria-pressed="'+(k===mode)+'">'+l+'</button>').join('')+'</div><label id="len196-l">'+(mode==='delta'?'Allongement (négatif pour raccourcir)':mode==='total'?'Longueur totale voulue':'Pourcentage de la longueur actuelle')+'<input id="len196-v" value="'+String(mode===opts.mode?opts.value:(mode==='percent'?110:100)).replace('.',',')+'"></label><p class="muted" style="font-size:11px;margin:0">Allonger change la longueur par l’extrémité cliquée, l’autre extrémité reste fixe. Étirer, lui, déplace tous les sommets pris dans une fenêtre.</p>',d=>{const v=cadNumeric(d.querySelector('#len196-v').value);if(!Number.isFinite(v)||(mode!=='delta'&&v<=0))throw Error('Valeur positive requise.');opts={mode,value:v};save();start();},'Choisir les objets');
  for(const b of d.querySelectorAll('[data-m]'))b.onclick=()=>{d.close();ask(b.dataset.m);};setTimeout(()=>d.querySelector('#len196-v')?.select(),0);}
 const b=C.button('lengthen196','Allonger','<path d="M3 12h12" stroke="currentColor" stroke-width="1.8"/><path d="M15 12h6" stroke="currentColor" stroke-width="1.8" stroke-dasharray="2 1.6"/><path d="M18 8l3 4-3 4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3 8v8" stroke="currentColor" stroke-width="1.6"/>','Allonger (ALLONGER · alias LEN) · delta, total, pourcentage ou dynamique · lignes, polylignes, arcs, armatures · différent d’Étirer : seule l’extrémité cliquée bouge',()=>ask());
 C.register(b);C.group('ribbon-cao','ribbon-group-modify196','Modifier',[b]);C.sync();
 window.CadLengthen196={ask,start,info,target,result};
})();
