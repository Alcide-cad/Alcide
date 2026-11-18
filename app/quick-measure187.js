/* 1.0.87 · Mesure rapide (MESUREGEOM « Rapide » d'AutoCAD) : au survol, distances horizontale et verticale
   entre les objets qui entourent le curseur, affichées arrondies (219 et non 218,9999). Échap ou clic droit pour quitter. */
(()=>{
 let active=false,last=null,result=null;
 function value(v){const p=Math.max(0,precision()),x=Math.round(v*factor()*1e6)/1e6;return x.toLocaleString('fr-FR',{minimumFractionDigits:0,maximumFractionDigits:p})+' '+unit();}
 // 1.0.89 : les plans réels (DWG/DXF importés) portent leur géométrie en chemin SVG (p.d + p.offset), sans tableau de points :
 // la 1.0.87/1.0.88 ne trouvait donc aucun bord. Conversion paresseuse, mise en cache comme pour la sélection par fenêtre.
 const parsed=new WeakMap();function geometry(p){if(p.selectionPaths)return p.selectionPaths;if(p.paths)return p.paths;if(!p.d)return null;if(parsed.has(p))return parsed.get(p);const paths=[],ox=p.offset?.[0]||0,oy=p.offset?.[1]||0;let path=null,start=null,cur=null;
  const tok=String(p.d).match(/[MLHVCQZAmlhvcqza]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g)||[];let i=0,cmd='';const num=()=>+tok[i++];
  while(i<tok.length){if(/[A-Za-z]/.test(tok[i]))cmd=tok[i++];const C=cmd.toUpperCase(),rel=cmd!==C&&cur;
   if(C==='Z'){if(path&&start)path.push([start[0],start[1]]);cur=start;continue;}
   if(C==='M'){let x=num(),y=num();if(rel){x+=cur[0]-ox;y+=cur[1]-oy;}cur=[x+ox,y+oy];start=cur;path=[cur];paths.push(path);cmd=rel?'l':'L';continue;}
   if(!path){path=[cur||[ox,oy]];paths.push(path);}
   if(C==='L'){let x=num(),y=num();if(rel){x+=cur[0]-ox;y+=cur[1]-oy;}cur=[x+ox,y+oy];}
   else if(C==='H'){let x=num();if(rel)x+=cur[0]-ox;cur=[x+ox,cur[1]];}
   else if(C==='V'){let y=num();if(rel)y+=cur[1]-oy;cur=[cur[0],y+oy];}
   else if(C==='C'||C==='Q'){const n=C==='C'?3:2,pts=[cur];for(let k=0;k<n;k++){let x=num(),y=num();if(rel){x+=cur[0]-ox;y+=cur[1]-oy;}pts.push([x+ox,y+oy]);}for(let t=1;t<=8;t++){const u=t/8;let q=pts.slice();while(q.length>1)q=q.slice(1).map((b,j)=>[q[j][0]+(b[0]-q[j][0])*u,q[j][1]+(b[1]-q[j][1])*u]);path.push(q[0]);}cur=pts[n];continue;}
   else if(C==='A'){i+=5;let x=num(),y=num();if(rel){x+=cur[0]-ox;y+=cur[1]-oy;}cur=[x+ox,y+oy];}
   else{i++;continue;}
   path.push(cur);}
  parsed.set(p,paths);return paths;}
 function crossings(e,axis,level,band){const out=[],edit=edits[e.id]||{},dx=edit.dx||0,dy=edit.dy||0,o=axis?1:0,k=axis?0:1;
  // Hachure à motif sans aplat : on mesure jusqu'à son contour (boucles natives), pas jusqu'aux traits du motif.
  const hatchLoops=e.type==='HATCH'&&!edit.hatchRender&&!edit.hatchGeometry&&!(e.primitives||[]).some(p=>p.fill)&&e.nativeHatch?.loops?.length?[{loops:e.nativeHatch.loops.filter(l=>l.length>1).map(l=>[...l,l[0]])}]:null;
  for(const p of hatchLoops||e.primitives||[]){if(p.loops){var paths=p.loops;}else{if(typeof primitiveVisible==='function'&&!primitiveVisible(e,p))continue;if(p.text)continue;if(e.type==='HATCH'?!p.fill:(p.fill||p.hatchBackground))continue;var paths=geometry(p);if(!paths)continue;}
   for(const path of paths)for(let i=1;i<path.length;i++){const a=[path[i-1][0]+dx,path[i-1][1]+dy],b=[path[i][0]+dx,path[i][1]+dy],va=a[k]-level,vb=b[k]-level;if(va===0&&vb===0){out.push(a[o],b[o]);continue;}if(va*vb>0)continue;const t=va/(va-vb);out.push(a[o]+(b[o]-a[o])*t);}}
  return out;}
 function measure(c){const b=viewport(),r={};for(const axis of [0,1]){const level=axis?c[0]:c[1],box=axis?[c[0]-1e-9,b[1],c[0]+1e-9,b[3]]:[b[0],c[1]-1e-9,b[2],c[1]+1e-9];let lo=-Infinity,hi=Infinity;const pos=axis?c[1]:c[0],eps=1/view.s;
   for(const e of query(box)){if(!visible(e)||e.layout&&e.layout!==scene.layout||e.dimension||e.annotation||['TEXT','MTEXT','IMAGE','POINT','ATTRIB','ATTDEF'].includes(e.type))continue;if(e.type==='INSERT'&&!e.primitives?.length)continue;for(const x of crossings(e,axis,level)){if(x<pos-eps&&x>lo)lo=x;if(x>pos+eps&&x<hi)hi=x;}}
   if(Number.isFinite(lo)&&Number.isFinite(hi))r[axis?'v':'h']={lo,hi,length:hi-lo};}return r;}
 function paint(){if(!active||!result||!cursorWorld)return;const c=cursorWorld;oc.save();oc.lineWidth=1.2;oc.font='12px Segoe UI, sans-serif';
  const tag=(text,x,y)=>{const w=oc.measureText(text).width+10;oc.fillStyle='#1d2b35ee';oc.fillRect(x-w/2,y-9,w,18);oc.strokeStyle='#ffb347';oc.strokeRect(x-w/2,y-9,w,18);oc.fillStyle='#ffe2b8';oc.textAlign='center';oc.textBaseline='middle';oc.fillText(text,x,y+.5);};
  for(const [key,axis] of [['h',0],['v',1]]){const m=result[key];if(!m)continue;const a=screen(axis?[c[0],m.lo]:[m.lo,c[1]]),b=screen(axis?[c[0],m.hi]:[m.hi,c[1]]);oc.strokeStyle='#ffb347';oc.setLineDash([6,4]);oc.beginPath();oc.moveTo(...a);oc.lineTo(...b);oc.stroke();oc.setLineDash([]);oc.fillStyle='#ffb347';for(const p of [a,b])oc.fillRect(p[0]-3,p[1]-3,6,6);
   const mid=[(a[0]+b[0])/2,(a[1]+b[1])/2],text=value(m.length);if(axis)tag(text,mid[0]+oc.measureText(text).width/2+12,mid[1]+14);else tag(text,mid[0],mid[1]-14);}
  oc.restore();}
 let cursorWorld=null;
 function start(){if(!scene){status('Ouvrez un dessin pour mesurer.');return;}setTool('select');active=true;result=null;$('#quick-measure187')?.classList.add('active');overlay.style.cursor='crosshair';status('Mesure rapide : survolez le dessin · Échap ou clic droit pour quitter.');}
 function stop(){if(!active)return;active=false;result=null;cursorWorld=null;$('#quick-measure187')?.classList.remove('active');overlay.style.cursor='';drawOverlay();status('Mesure rapide terminée.');}
 window.QuickMeasure187={start,stop,measure,value,geometry,get active(){return active;},get result(){return result;}};
 const measureButton=$('#measure');if(measureButton){const b=document.createElement('button');b.id='quick-measure187';b.className=measureButton.className.replace(/\bactive\b/,'');b.title='Mesure rapide au survol';b.textContent='⌖ Mesure rapide';b.onclick=()=>active?stop():start();measureButton.after(b);}
 const set=setTool;setTool=function(t){if(active)stop();return set.apply(this,arguments);};
 overlay.addEventListener('pointermove',ev=>{if(!active||!scene)return;cursorWorld=world(eventPoint(ev));result=measure(cursorWorld);drawOverlay();},true);
 overlay.addEventListener('pointerdown',ev=>{if(!active||ev.button!==0)return;ev.preventDefault();ev.stopImmediatePropagation();},true);
 overlay.addEventListener('contextmenu',ev=>{if(!active)return;ev.preventDefault();ev.stopImmediatePropagation();stop();},true);
 document.addEventListener('keydown',ev=>{if(active&&ev.key==='Escape'){stop();ev.stopPropagation();}},true);
 const draw=drawOverlay;drawOverlay=function(){draw.apply(this,arguments);paint();};
 if(typeof registerHelpTopic==='function')registerHelpTopic('Mesure rapide',[Object.assign(document.createElement('p'),{textContent:'Bouton « Mesure rapide » : au survol du dessin, ALCIDE affiche la distance horizontale et la distance verticale entre les objets qui entourent le curseur, comme la mesure rapide d’AutoCAD. Les valeurs sont arrondies selon la précision d’affichage. Échap ou clic droit pour quitter.'})]);
})();
