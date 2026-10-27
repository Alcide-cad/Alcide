// 0.7.6 : Propriétés (calque, couleur, épaisseur, transparence) appliquées à un contour fermé
// s'appliquent aussi aux hachures natives associées (handles de contour ou boucle identique).
(()=>{
 const base=applySelectionProperties,KEYS=['color','layer','lineweight','transparency'];
 function related(ids){const outlines=ids.map(id=>entities.get(id)).filter(e=>e&&e.type!=='HATCH'&&cadEligible(e)&&cadClosed(e));if(!outlines.length)return [];
  return [...entities.values()].filter(h=>h.type==='HATCH'&&h.nativeHatch&&!ids.includes(h.id)&&!edits[h.id]?.deleted&&outlines.some(o=>{if(h.nativeHatch.boundaryHandles?.includes(sourceHandle(o)))return true;const v=cadVertices(o),s=[edits[h.id]?.dx||0,edits[h.id]?.dy||0];return (h.hatchDisplayedLoops||h.nativeHatch.loops.map(l=>l.map(p=>p.map((n,i)=>n+s[i])))).some(l=>hatchLoopMatches(l,v));}));}
 applySelectionProperties=function(patch){const keys=Object.keys(patch||{});if(!selected.size||!keys.length||!keys.every(k=>KEYS.includes(k)))return base(patch);let extra=[];try{extra=related([...selected]);}catch{}if(!extra.length)return base(patch);const keep=selected;selected=new Set([...keep,...extra.map(h=>h.id)]);try{return base(patch);}finally{selected=keep;refresh();}};
 window.HatchPropsLink={related};
})();
