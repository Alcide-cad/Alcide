function stretchVertices(e){if(e?.type==='HATCH'&&e.nativeHatch)return (e.hatchDisplayedLoops||e.nativeHatch.loops).flat();return cadEligible(e)?cadVertices(e):[];}
function stretchEligible(e){return cadEligible(e)||!!(e?.type==='HATCH'&&e.nativeHatch?.editable&&!isLocked(e));}
function stretchPoint(pixel){const mode=cadMode,p=snap(pixel),a=mode?.points[2];if(!a)return p;const scale=mm[$('#units').value];if(!scale)return p;if(snapPoint&&snapKind&&!['grille','pas','arrondi 0,5 cm'].includes(snapKind))return p;const step=window.GlobalStep?GlobalStep.step():5/scale;if(!step)return p;let delta=p.map((n,i)=>Math.round((n-a[i])/step)*step);if(shiftConstraintHeld||$('#ortho').checked){const raw=world(pixel);if(Math.abs(raw[0]-a[0])>=Math.abs(raw[1]-a[1]))delta[1]=0;else delta[0]=0;}return a.map((n,i)=>n+delta[i]);}
function stretchContains(rect,p){return p[0]>=rect[0]&&p[0]<=rect[2]&&p[1]>=rect[1]&&p[1]<=rect[3];}
function stretchShape(e,rect,delta){const ps=cadVertices(e).map(p=>stretchContains(rect,p)?p.map((n,i)=>n+delta[i]):p);return cadClosed(e)?[...ps,ps[0]]:ps;}
(()=>{
 const start=cadStart;cadStart=function(mode,...args){const scope=[...selected];start(mode,...args);if(mode==='stretch'&&cadMode){cadMode.scope=scope;cadMode.escapeArmed=false;}};
 function resetStretch(){const m=cadMode;m.points=[];m.rect=null;m.ids=[...(m.scope||[])];m.token=saveToken;cadPreview=null;}
 const button=$('#stretchobjects');button.onclick=()=>cadStart('stretch');button.title='Étirer les sommets dans une fenêtre, puis choisir un déplacement';$('#trimobjects').parentElement.append(button);
 const originalStretch=cadStretch;cadStretch=function(rect,delta,ids){
  for(const id of ids||[...selected]){const e=entities.get(id);if(!cadEligible(e))continue;const ps=stretchShape(e,rect,delta);
   for(let i=1;i<ps.length;i++)if(cadDistance(ps[i-1],ps[i])<1e-8)throw Error('Étirement annulé : un segment deviendrait nul.');
   if(cadClosed(e)){const area=ps.slice(1).reduce((n,p,i)=>n+ps[i][0]*p[1]-p[0]*ps[i][1],0);if(Math.abs(area)<1e-8)throw Error('Étirement annulé : le contour serait aplati.');}
   for(let i=0;i<ps.length-1;i++)for(let j=i+2;j<ps.length-1;j++){if(cadClosed(e)&&i===0&&j===ps.length-2)continue;const hit=cadLineIntersection(ps[i],ps[i+1],ps[j],ps[j+1]);if(hit&&hit.t>1e-8&&hit.t<1-1e-8&&hit.q>1e-8&&hit.q<1-1e-8)throw Error('Étirement annulé : le contour se croiserait.');}
  }return originalStretch(rect,delta,ids);
 };
 const refreshBase=refresh;refresh=function(...args){const result=refreshBase(...args);button.disabled=!scene||busy;return result;};
 const controls=syncLayerControls;syncLayerControls=function(...args){const result=controls(...args);button.disabled=!scene||busy;return result;};button.disabled=!scene||busy;
 document.addEventListener('pointerdown',async ev=>{
  if(ev.target!==overlay||cadMode?.mode!=='stretch'||ev.button!==0||ev.altKey||busy)return;
  ev.stopImmediatePropagation();ev.preventDefault();const mode=cadMode;
  if(mode.docId!==activeId||mode.token!==saveToken){setTool('select');status('Le dessin a changé ; relancez Étirer.');return;}
  mode.escapeArmed=false;
  try{
   if(mode.points.length<2){const p=world(eventPoint(ev));if(!mode.points.length){mode.zonePixel=eventPoint(ev);mode.zonePointer=ev.pointerId;}mode.points.push(p);if(mode.points.length===2){const a=mode.points[0];mode.rect=[Math.min(a[0],p[0]),Math.min(a[1],p[1]),Math.max(a[0],p[0]),Math.max(a[1],p[1])];const candidates=mode.ids.length?mode.ids:[...entities.keys()];mode.ids=candidates.filter(id=>{const e=entities.get(id);return stretchEligible(e)&&visible(e)&&stretchVertices(e).some(v=>stretchContains(mode.rect,v));});if(!mode.ids.length){mode.points=[];mode.rect=null;status('Aucun sommet modifiable dans cette fenêtre · choisissez une autre zone.');}else{selected=new Set(mode.ids);const vertices=mode.ids.flatMap(id=>stretchVertices(entities.get(id))).filter(v=>stretchContains(mode.rect,v));mode.points.push([0,1].map(i=>vertices.reduce((n,v)=>n+v[i],0)/vertices.length));mode.autoAnchor=true;status(mode.ids.length+' objet(s) concernés · orientez la souris, tapez la distance puis Entrée ou clic pour valider · Maj : orthogonal.');}}}
   else if(mode.points.length===2){if(!mm[$('#units').value]){status('Définissez l’unité du dessin pour étirer au pas de 0,5 cm.');return;}mode.points.push(snap(eventPoint(ev)));status('Cliquez le point d’arrivée · aperçu au pas de 0,5 cm · Maj : orthogonal · Échap annule.');}
   else{const p=stretchPoint(eventPoint(ev)),delta=p.map((n,i)=>n-mode.points[2][i]);if(Math.hypot(...delta)<1e-8){status('Choisissez un déplacement non nul · Échap annule.');return;}await cadStretch(mode.rect,delta,mode.ids);resetStretch();status('Étirement validé · nouvelle fenêtre pour continuer · Ctrl+Z pour annuler · deux Échap pour quitter.');}
  }catch(ex){error(ex);}drawOverlay();
 },true);
 document.addEventListener('pointerup',ev=>{if(ev.target!==overlay||ev.button!==0||cadMode?.mode!=='stretch'||cadMode.points.length!==1||cadMode.zonePointer!==ev.pointerId||cadDistance(eventPoint(ev),cadMode.zonePixel)<4)return;const down=new PointerEvent('pointerdown',{bubbles:true,cancelable:true,clientX:ev.clientX,clientY:ev.clientY,button:0,pointerId:ev.pointerId});overlay.dispatchEvent(down);},true);
 document.addEventListener('pointermove',ev=>{
  if(ev.target!==overlay||cadMode?.mode!=='stretch'||busy)return;ev.stopImmediatePropagation();const mode=cadMode,p=world(eventPoint(ev));cadPreview=null;
  if(mode.points.length===1)cadPreview={rect:[...mode.points[0],...p]};
  else if(mode.points.length===3){const target=stretchPoint(eventPoint(ev)),delta=target.map((n,i)=>n-mode.points[2][i]);cadPreview={paths:mode.ids.map(id=>entities.get(id)).filter(stretchEligible).flatMap(e=>e.type==='HATCH'?(e.hatchDisplayedLoops||e.nativeHatch.loops).map(loop=>{const ps=loop.map(p=>stretchContains(mode.rect,p)?p.map((v,i)=>v+delta[i]):p);return [...ps,ps[0]];}):[stretchShape(e,mode.rect,delta)])};}
  drawOverlay();
 },true);
 const draw=drawOverlay;drawOverlay=function(){draw();let quick=$('#quick-stretch');if(tool==='select'&&selected.size&&!quick){quick=document.createElement('button');quick.id='quick-stretch';quick.textContent='Étirer';quick.title=button.title;quick.onclick=()=>cadStart('stretch');$('#toolquickbar').append(quick);}if(tool!=='select'||!selected.size)quick?.remove();let toggle=$('#stretch-hover-xy-toggle');if(cadMode?.mode==='stretch'&&!toggle){toggle=document.createElement('label');toggle.id='stretch-hover-xy-toggle';toggle.innerHTML='<input type="checkbox"> Point de base X/Y au survol';const input=toggle.querySelector('input');input.checked=localStorage.getItem('stretchHoverXY')!=='false';toggle.title='Maintenez la souris sur un point pendant '+stretchAcquisitionDelay()+' ms : il devient le point de base ; saisissez ΔX/ΔY puis Entrée.';input.onchange=()=>{localStorage.setItem('stretchHoverXY',String(input.checked));if(!input.checked&&transformHoverReference?.kind==='stretch'){$('#numeric-clear').click();}requestRender();};$('#toolquickbar').append(toggle);}if(cadMode?.mode!=='stretch')toggle?.remove();
  if(cadMode?.mode!=='stretch'||!cadMode.rect)return;oc.save();oc.fillStyle='#77bdff';for(const id of cadMode.ids){const e=entities.get(id);if(!stretchEligible(e))continue;for(const v of stretchVertices(e))if(stretchContains(cadMode.rect,v)){const p=screen(v);oc.fillRect(p[0]-4,p[1]-4,8,8);}}oc.restore();
 };
})();
