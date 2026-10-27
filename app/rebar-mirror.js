// A reflection changes the handedness of a representation, not its developed length.
(()=>{
 const prior=coreMirror;
 coreMirror=function(ids,a,b,keep=true){
  const ours=ids.filter(id=>edits[id]?.rebarView),others=ids.filter(id=>!ours.includes(id));
  if(!ours.length)return prior(ids,a,b,keep);
  coreReflection(a,a,b);
  const tasks=ours.map(id=>{
   const e=entities.get(id),edit=edits[id];
   if(!e?.rebar||isLocked(e)||edit.deleted)throw Error('Déverrouillez toutes les armatures avant le miroir.');
   return {id,e,edit:structuredClone(edit),label:RebarLabels.labelData(e)};
  });
  const before=snapshot(),depth=history.length,created=[],clones=new Map(),book=Reinforcement.book(),axis=Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI;
  try{
   if(others.length)created.push(...prior(others,a,b,keep));
   for(const {id,e,edit,label}of tasks){
    const old=edit.rebarView,origin=[old.origin[0]+(edit.dx||0),old.origin[1]+(edit.dy||0)],nextOrigin=coreReflection(origin,a,b),relative=p=>coreReflection([origin[0]+p[0],origin[1]+p[1]],a,b).map((n,i)=>n-nextOrigin[i]);
    let assemblyId=old.assemblyId,target=id;
    if(keep){
     if(!clones.has(assemblyId)){
      const m=structuredClone(book.assemblies[assemblyId]);m.id=crypto.randomUUID();m.position=RebarCore.nextPosition(book.assemblies,m.kind);if(m.linearSet&&window.LinearRebar){m.componentPositions={};LinearRebar.positions(m);}book.assemblies[m.id]=m;clones.set(assemblyId,m.id);
     }
     assemblyId=clones.get(assemblyId);target=Reinforcement.createView(assemblyId,nextOrigin,old.role,old.angle,old.mmPerUnit);
    }
    const v={...old,assemblyId,origin:nextOrigin,angle:2*axis-old.angle,mirrorY:!old.mirrorY,labelOffset:relative(label.offset),labelAnchors:old.labelAnchors?.map(relative),labelBends:old.labelBends?.map(ps=>ps.map(relative))};
    Reinforcement.shape(book.assemblies[assemblyId],v);
    edits[target]={...edit,rebarView:v,dx:0,dy:0};created.push(target);
   }
   history.splice(depth);selected=new Set(created);commit(before);layersUI();
   status(created.length+' objet(s) en '+(keep?'copie miroir':'miroir')+' · armatures conservées · Ctrl+Z annule.');return created;
  }catch(ex){history.splice(depth);restore(before);throw ex;}
 };
 const draw=drawOverlay;
 drawOverlay=function(){
  draw();const m=coreTool;if(m?.mode!=='mirror'||!m.points.length||!m.cursor||cadDistance(m.points[0],m.cursor)<1e-7)return;
  oc.save();oc.strokeStyle='#ffc978';oc.lineWidth=1.5;oc.setLineDash([5,4]);
  for(const id of m.ids){const e=entities.get(id);if(!e?.rebar||isLocked(e))continue;
   const edit=edits[id],v=edit.rebarView,s=Reinforcement.shape(e.rebar.model,v),origin=[v.origin[0]+(edit.dx||0),v.origin[1]+(edit.dy||0)],map=p=>screen(coreReflection([origin[0]+p[0],origin[1]+p[1]],m.points[0],m.cursor));
   for(const ps of s.paths){oc.beginPath();ps.map(map).forEach((p,i)=>i?oc.lineTo(...p):oc.moveTo(...p));oc.stroke();}
   for(const c of s.circles){oc.beginPath();oc.arc(...map(c.center),c.radius*view.s,0,Math.PI*2);oc.stroke();}
  }oc.restore();
 };
})();
