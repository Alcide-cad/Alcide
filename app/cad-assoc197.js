// 1.0.97 · Cotes CAO associatives (angulaire, rayon, diamètre, longueur d'arc).
// La cote suit ses objets (déplacement / étirement des lignes, du cercle ou de l'arc) ; déplacer la cote seule ne la décroche
// pas : l'arc garde son centre au sommet, les flèches restent sur les lignes (ligne d'attache au-delà de leur bout).
// Cote angulaire : orientation configurable et poignée de texte le long de l’arc.
(()=>{
 const C=window.Cad196;if(!C)return;
 const DIMS=['radius','diameter','angular','arc'],TAU=Math.PI*2,mod=x=>((x%TAU)+TAU)%TAU;
 const sub=(a,b)=>[a[0]-b[0],a[1]-b[1]],add=(a,b)=>[a[0]+b[0],a[1]+b[1]],len=v=>Math.hypot(v[0],v[1]);
 const rot=(v,t)=>[v[0]*Math.cos(t)-v[1]*Math.sin(t),v[0]*Math.sin(t)+v[1]*Math.cos(t)];
 const r6=v=>Math.round(v*1e6)/1e6,key=x=>JSON.stringify(x,(k,v)=>typeof v==='number'?r6(v):v);
 function groups(ids=Object.keys(edits)){const out=[];if(!scene)return out;for(const id of ids){const e=edits[id];if(!e||!e.cad196Item||e.deleted||!e.foreignEntity131||e.layout!==scene.layout)continue;const d=edits[e.cad196Item.dataId],specs=d?.cad196?.specs;if(!Array.isArray(specs)||specs.length!==1||!DIMS.includes(specs[0]?.kind))continue;out.push({id,dataId:e.cad196Item.dataId,spec:specs[0],edit:e});}return out;}
 // Même choix de secteur que cad196._angular_legs (le secteur < 180° qui contient le point de l'arc).
 function sector(l1,l2,w){const u=sub(l1[1],l1[0]),v=sub(l2[1],l2[0]),den=u[0]*v[1]-u[1]*v[0];if(Math.abs(den)<1e-12)return null;
  const t=((l2[0][0]-l1[0][0])*v[1]-(l2[0][1]-l1[0][1])*v[0])/den,V=[l1[0][0]+u[0]*t,l1[0][1]+u[1]*t],wa=Math.atan2(w[1]-V[1],w[0]-V[0]);
  const neg=x=>[-x[0],-x[1]];let pairs=[];for(const a of [u,neg(u)])for(const b of [v,neg(v)])pairs.push([a,b]);pairs=pairs.concat(pairs.map(([a,b])=>[b,a]));
  for(const [a,b] of pairs){const aa=Math.atan2(a[1],a[0]),span=mod(Math.atan2(b[1],b[0])-aa);if(span>=Math.PI)continue;if(mod(wa-aa)<=span)return {V,a0:aa,span,R:Math.max(len(sub(w,V)),1e-9),u};}return null;}
 function legsOf(s){return s.line1&&s.line2?[s.line1,s.line2]:s.center&&s.p1&&s.p2?[[s.center,s.p1],[s.center,s.p2]]:null;}
 function currentLines(s){const a=s.assoc;if(!a?.ids||a.ids.length!==2||!s.line1)return null;const out=[];for(let i=0;i<2;i++){const e=entities.get(a.ids[i]);if(!e||edits[a.ids[i]]?.deleted)return null;const segs=C.segments(e);const sg=segs[a.seg?.[i]]||(segs.length===1?segs[0]:null);if(!sg)return null;out.push(sg.map(p=>[p[0],p[1]]));}return out;}
 function currentCurve(s){const id=s.assoc?.ids?.[0];if(!id||edits[id]?.deleted)return null;const e=entities.get(id);return e?C.curve(e):null;}
 function angularGeom(s){const L=legsOf(s);if(!L)return null;const base=s.base||s.location;const g=sector(L[0],L[1],base);if(!g)return null;return g;}
 function textAngle(g,loc){if(!loc)return g.a0+g.span/2;const t=Math.atan2(loc[1]-g.V[1],loc[0]-g.V[0]);return mod(t-g.a0)<=g.span?t:g.a0+g.span/2;}
 function clampAngle(g,t){const rel=mod(t-g.a0);if(rel<=g.span)return g.a0+rel;return (rel-g.span<TAU-rel)?g.a0+g.span:g.a0;}
 // Nouvelle spécification si la cote doit suivre ses objets ou revenir sur eux après un déplacement ; sinon null.
 function follow(g0){const s=g0.spec,e=g0.edit,mv=[Number(e.dx)||0,Number(e.dy)||0],moved=len(mv)>1e-9;
  if(Object.keys(e).some(k=>/^(rotation|angle|scale|sx|sy|mirror|matrix|transform)$/i.test(k)&&e[k]))return null;
  if(s.kind==='angular'){const L=legsOf(s);if(!L)return null;const cur=currentLines(s),changed=!!cur&&key(cur)!==key([s.line1,s.line2]);if(!changed&&!moved)return null;
   const g=angularGeom(s);if(!g)return null;const fraction=mod(textAngle(g,s.location)-g.a0)/g.span;const next={...s};
   let V=g.V,base=s.base||s.location,dirRot=0;
   if(changed){const u2=sub(cur[0][1],cur[0][0]),u1=sub(s.line1[1],s.line1[0]);dirRot=Math.atan2(u2[1],u2[0])-Math.atan2(u1[1],u1[0]);
    const nu=sub(cur[0][1],cur[0][0]),nv=sub(cur[1][1],cur[1][0]),den=nu[0]*nv[1]-nu[1]*nv[0];if(Math.abs(den)<1e-12)return null;const t=((cur[1][0][0]-cur[0][0][0])*nv[1]-(cur[1][0][1]-cur[0][0][1])*nv[0])/den;const V2=[cur[0][0][0]+nu[0]*t,cur[0][0][1]+nu[1]*t];
    base=add(V2,rot(sub(base,V),dirRot));V=V2;next.line1=cur[0];next.line2=cur[1];}
   // Objets et cote déplacés ensemble : la cote suit les objets (le déplacement propre est ignoré).
   if(moved&&!changed)base=add(base,mv);
   const g3=sector(legsOf(next)[0],legsOf(next)[1],base);if(!g3)return null;const R=g3.R;

   const t=g3.a0+g3.span*Math.min(Math.max(fraction,0),1);
   next.base=base;next.location=[g3.V[0]+R*Math.cos(t),g3.V[1]+R*Math.sin(t)];return next;}
  if(s.kind==='radius'||s.kind==='diameter'){const cv=currentCurve(s),c0=s.center,r0=Number(s.radius);let c=c0,r=r0;const changed=!!cv&&(len(sub(cv.center,c0))>1e-9||Math.abs(cv.radius-r0)>1e-9);if(!changed&&!moved)return null;
   let loc=s.location;if(changed){const d=sub(loc,c0),n=len(d)||1,off=n-r0;c=cv.center;r=cv.radius;loc=add(c,[d[0]/n*(r+off),d[1]/n*(r+off)]);}
   if(moved&&!changed)loc=add(loc,mv);return {...s,center:c,radius:r,location:loc};}
  if(s.kind==='arc'){const cv=currentCurve(s);let c=s.center,r=Number(s.radius),a0=s.start,a1=s.end;const changed=!!cv&&!cv.full&&(len(sub(cv.center,c))>1e-9||Math.abs(cv.radius-r)>1e-9||Math.abs(mod(cv.start)-mod(a0*Math.PI/180))>1e-9||Math.abs(mod(cv.end)-mod(a1*Math.PI/180))>1e-9);if(!changed&&!moved)return null;
   let loc=s.location;if(changed){loc=add(loc,sub(cv.center,c));c=cv.center;r=cv.radius;a0=cv.start*180/Math.PI;a1=cv.end*180/Math.PI;}
   if(moved&&!changed)loc=add(loc,mv);const dist=Math.max(r*.05,Math.abs(len(sub(loc,c))-r));return {...s,center:c,radius:r,start:a0,end:a1,distance:dist,location:loc};}
  return null;}
 // Remplace la géométrie d'une cote sans changer son identifiant (sélection et historique conservés).
 async function regenerate(g,spec){const ds=edits[g.id]?.dimensionStyle;if(ds&&typeof ds==='object'){const {textPosition,...rest}=ds;if(spec.kind==='angular'&&Number.isInteger(rest.precision))rest.anglePrecision=rest.precision;spec={...spec,style:{...(spec.style||{}),...rest}};}const data=await api.cad196(activeId,{op:'make',specs:[spec]});const sc=expandNativeScene(data.scene),items=sc.items||[];const handle=data.handles?.[0];const item=items.find(x=>x.id===handle)||items[0];if(!item)throw Error('Cote non régénérée.');
  return ()=>{edits[g.dataId]={...edits[g.dataId],clipboardData131:data.dxf,clipboardLinetypes131:sc.linetypes,cad196:{...(edits[g.dataId]?.cad196||{kind:'dimension'}),specs:[spec]}};
   const ent=structuredClone(item);ent.id=g.id;ent.layout=scene.layout;ent.locked=false;delete ent.selectionGroup;
   const current={...edits[g.id]};if(spec.kind==='angular')delete current.dimensionRender;
   edits[g.id]={...current,clipboard131:{dataId:g.dataId,handle:item.id},cad196Item:{dataId:g.dataId,handle:item.id},foreignEntity131:ent,dx:0,dy:0};};}
 let running=false,again=false;
 async function reconcile(){if(running){again=true;return;}running=true;try{for(let k=0;k<4;k++){again=false;await pass();if(!again)break;}}catch(e){console.warn('Cotes associatives :',e);}finally{running=false;}}
 async function pass(){if(!scene)return;const token=saveToken,doc=activeId,jobs=[];for(const g of groups()){const n=follow(g);if(n)jobs.push([g,n]);}if(!jobs.length)return;
  const appliers=[];for(const [g,n] of jobs){try{appliers.push(await regenerate(g,n));}catch(e){console.warn(e);}}
  if(saveToken!==token||activeId!==doc){again=true;return;}
  // Rattaché à l'étape d'annulation qui vient d'être validée (pas d'étape supplémentaire).
  for(const f of appliers)f();dirty=true;saveToken++;refresh(true);requestRender();window.dimAssocRuns197=(window.dimAssocRuns197||0)+1;}
 const angleSettings={unit:localStorage.getItem('cadAngularUnit1101')||'deg',horizontal:localStorage.getItem('cadAngularHorizontal1101')==='true'};
 const card=document.getElementById('inspector-dimensions');
 const controls=document.createElement('div');
 controls.innerHTML='<label class="row">Unité angulaire<select id="cad-angular-unit"><option value="deg">Degrés (°)</option><option value="rad">Radians (rad)</option><option value="grad">Grades (gon)</option></select></label><label class="row">Texte de la cote angulaire<select id="cad-angular-text"><option value="tangent">Suivre l’arc</option><option value="horizontal">Horizontal</option></select></label>';
 card.append(controls);
 const unit=controls.querySelector('#cad-angular-unit'),orientation=controls.querySelector('#cad-angular-text');
 const chosen=()=>groups(selected).filter(g=>g.spec.kind==='angular'&&!isLocked(entities.get(g.id)));
 const importedAngles=()=>[...selected].map(id=>entities.get(id)).filter(e=>e?.nativeDimension?.editable&&[2,5].includes(e.nativeDimension.kind)&&!edits[e.id]?.cad196Item&&!isLocked(e));
 function syncSettings(){
  const gs=chosen();
  const imported=importedAngles().map(dimensionParameters);
  controls.hidden=selected.size>0&&!gs.length&&!imported.length;
  const units=[...gs.map(g=>g.spec.style?.angleUnit||'deg'),...imported.map(d=>d.angleUnit||'deg')];
  const modes=[...gs.map(g=>g.spec.textHorizontal?'horizontal':'tangent'),...imported.map(d=>d.angularTextMode||'tangent')];
  for(const [input,values] of [[unit,units.length?units:[angleSettings.unit]],[orientation,modes.length?modes:[angleSettings.horizontal?'horizontal':'tangent']]]){
   if(document.activeElement===input)continue;
   input.value=values.every(v=>v===values[0])?values[0]:'';
  }
 }
 async function changeAngle(setting,value){
  if(busy||(setting==='unit'&&!value))return;
  const gs=chosen();
  const imported=importedAngles();
  if(!gs.length){
   if(imported.length){
    await applyDimensionParameter(setting==='unit'?'angleUnit':'angularTextMode',setting==='unit'?value:value?'horizontal':'tangent',imported.map(e=>e.id));
    return;
   }
   if(selected.size)return;
   angleSettings[setting]=value;
   localStorage.setItem(setting==='unit'?'cadAngularUnit1101':'cadAngularHorizontal1101',String(value));
   return;
  }
  const doc=activeId,token=saveToken,before=snapshot();
  try{
   busyState(true,'Mise à jour des cotes angulaires…');
   const updates=[];
   for(const g of gs){
    const spec=setting==='unit'?{...g.spec,style:{...g.spec.style,angleUnit:value}}:{...g.spec,textHorizontal:value};
    updates.push(await regenerate(g,spec));
   }
   if(activeId!==doc||saveToken!==token)return;
   for(const update of updates)update();
   commit(before);
   status('Cotes angulaires mises à jour · Ctrl+Z annule.');
  }catch(e){error(e);}finally{busyState(false);syncSettings();}
 }
 unit.onchange=()=>changeAngle('unit',unit.value);
 orientation.onchange=()=>changeAngle('horizontal',orientation.value==='horizontal');
 const refreshSettings=refresh;
 refresh=function(...args){const result=refreshSettings.apply(this,args);syncSettings();return result;};
 syncSettings();
 window.DimAssoc197={reconcile,follow,groups,sector,angularGeom,angleUnit:()=>angleSettings.unit,textHorizontal:()=>angleSettings.horizontal};
 const baseCommit=commit;commit=function(...args){const r=baseCommit.apply(this,args);setTimeout(reconcile,0);return r;};
 // Poignée de texte de la cote angulaire : glisse le long de l'arc de cote (bornée à l'arc). La poignée de position 1.0.96
 // (rayon / secteur de la cote) reste disponible, placée sur l'arc à l'écart du texte (cad-move196.js).
 let textDrag=null;
 function selectedAngular(){if(selected.size!==1)return null;const id=[...selected][0];const g=groups([id])[0];if(!g||g.spec.kind!=='angular'||isLocked(entities.get(id)))return null;if((Number(g.edit.dx)||0)||(Number(g.edit.dy)||0))return null;const geo=angularGeom(g.spec);if(!geo)return null;const t=textAngle(geo,g.spec.location);const rendered=entities.get(id)?.nativeDimension?.angularTextPoint;const radius=rendered?len(sub(rendered,geo.V)):geo.R;return {g,geo,t,radius,point:rendered||[geo.V[0]+radius*Math.cos(t),geo.V[1]+radius*Math.sin(t)]};}
 window.angularTextGrip197=()=>{const a=selectedAngular();return a?a.point:null;};
 // Point de l'arc le plus éloigné du texte (pour la poignée de position, qui ne doit pas se superposer au texte).
 window.angularArcGrip197=spec=>{if(spec?.kind!=='angular')return null;const g=angularGeom(spec);if(!g)return null;const tr=mod(textAngle(g,spec.location)-g.a0),f=Math.abs(.5*g.span-tr)>g.span*.2?.5:(Math.abs(.15*g.span-tr)>Math.abs(.85*g.span-tr)?.15:.85),best=g.a0+g.span*f;return [g.V[0]+g.R*Math.cos(best),g.V[1]+g.R*Math.sin(best)];};
 const activeTool=()=>typeof tool==='undefined'||['select','move-select'].includes(tool);
 window.addEventListener('pointerdown',ev=>{if(ev.button!==0||ev.target!==overlay||busy||!activeTool()||(typeof drawingMode!=='undefined'&&drawingMode)||window.Cad196?.mode)return;const a=selectedAngular();if(!a)return;const s=screen(a.point),p=eventPoint(ev);if(Math.hypot(p[0]-s[0],p[1]-s[1])>9)return;
  ev.preventDefault();ev.stopImmediatePropagation();textDrag={...a,cur:a.t,pointer:ev.pointerId,doc:activeId};overlay.setPointerCapture?.(ev.pointerId);status('Glissez le texte le long de l’arc de cote · relâchez pour poser · Échap annule.');},true);
 window.addEventListener('pointermove',ev=>{if(!textDrag||ev.pointerId!==textDrag.pointer)return;ev.preventDefault();ev.stopImmediatePropagation();const p=world(eventPoint(ev)),g=textDrag.geo;textDrag.cur=clampAngle(g,Math.atan2(p[1]-g.V[1],p[0]-g.V[0]));requestRender();},true);
 window.addEventListener('pointerup',async ev=>{if(!textDrag||ev.pointerId!==textDrag.pointer)return;ev.preventDefault();ev.stopImmediatePropagation();const d=textDrag;textDrag=null;requestRender();if(d.doc!==activeId||Math.abs(d.cur-d.t)<1e-9)return;
  const g=d.geo,spec={...d.g.spec,base:d.g.spec.base||d.g.spec.location,location:[g.V[0]+g.R*Math.cos(d.cur),g.V[1]+g.R*Math.sin(d.cur)]};
  const before=snapshot();try{busyState(true,'Cote…');const f=await regenerate(d.g,spec);f();}catch(e){error?.(e);return;}finally{busyState(false);}commit(before);status('Texte de la cote déplacé le long de l’arc · Ctrl+Z annule.');},true);
 window.addEventListener('pointercancel',ev=>{if(ev.pointerId===textDrag?.pointer){textDrag=null;requestRender();}},true);
 window.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&textDrag){textDrag=null;requestRender();ev.preventDefault();ev.stopImmediatePropagation();}},true);
 const draw=drawOverlay;drawOverlay=function(){draw();const a=selectedAngular();if(!a)return;const t=textDrag?textDrag.cur:a.t,g=a.geo,RR=a.radius,pt=textDrag?[g.V[0]+RR*Math.cos(t),g.V[1]+RR*Math.sin(t)]:a.point,s=screen(pt);oc.save();
  if(textDrag){const q=screen(g.V),rr=RR*view.s;oc.strokeStyle='rgba(34,224,255,.55)';oc.setLineDash([4,4]);oc.lineWidth=1;const s0=screen([g.V[0]+RR*Math.cos(g.a0),g.V[1]+RR*Math.sin(g.a0)]),s1=screen([g.V[0]+RR*Math.cos(g.a0+g.span),g.V[1]+RR*Math.sin(g.a0+g.span)]);const b0=Math.atan2(s0[1]-q[1],s0[0]-q[0]),b1=Math.atan2(s1[1]-q[1],s1[0]-q[0]);oc.beginPath();oc.arc(q[0],q[1],rr,Math.min(b0,b1),Math.max(b0,b1),Math.max(b0,b1)-Math.min(b0,b1)>Math.PI);oc.stroke();oc.setLineDash([]);}
  oc.fillStyle='#22e0ff';oc.strokeStyle='#08141c';oc.lineWidth=1.5;oc.beginPath();oc.moveTo(s[0],s[1]-7);oc.lineTo(s[0]+7,s[1]);oc.lineTo(s[0],s[1]+7);oc.lineTo(s[0]-7,s[1]);oc.closePath();oc.fill();oc.stroke();oc.restore();};
})();
