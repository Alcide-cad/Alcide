/* A live, non-mutating preview for the two-click move and copy tools. */
function drawTransformPreview(){
 const target=points.numericTarget||cursor;
 const dx=target[0]-points[0][0],dy=target[1]-points[0][1];
 for(const id of moveIds){const e=entities.get(id);if(!e||isLocked(e))continue;
  oc.save();oc.setLineDash([]);
  if(e.dimension){oc.translate(...screenDelta([dx,dy]));oc.globalAlpha=.65;const labels=new Map(dimensionLabelBoxes),grid=new Map([...dimensionLabelGrid].map(([k,v])=>[k,[...v]]));for(const d of e.dimensionMembers||[e.dimension])drawDimension(d);dimensionLabelBoxes=labels;dimensionLabelGrid=grid;}
  else if(e.annotation){oc.translate(...screenDelta([dx,dy]));drawAnnotation(e);const decoration=repereDecoration(e.annotation);applyViewTransform(oc);oc.translate(dx+(edits[id]?.dx||0),dy+(edits[id]?.dy||0));oc.strokeStyle='#ffc978';oc.lineWidth=1.5/view.s;for(const ps of decoration||[]){oc.beginPath();ps.forEach((p,i)=>i?oc.lineTo(...p):oc.moveTo(...p));oc.stroke();}}
  else{applyViewTransform(oc);oc.translate(dx+(edits[id]?.dx||0),dy+(edits[id]?.dy||0));oc.strokeStyle='#ffc978';oc.fillStyle='#ffc978';oc.lineWidth=1.5/view.s;oc.globalAlpha=.65;for(const p of e.primitives||[])if(primitiveVisible(e,p)){if(p.fill){oc.globalAlpha=.2;oc.fill(p.path,'evenodd');oc.globalAlpha=.8;}paintGraphicPrimitive(oc,p,false);}}
  oc.restore();
 }
 const a=screen(points[0]),b=screen(target);oc.save();oc.strokeStyle='#ffc978';oc.fillStyle='#ffc978';oc.lineWidth=1.5;oc.setLineDash([6,4]);oc.beginPath();oc.moveTo(...a);oc.lineTo(...b);oc.stroke();oc.setLineDash([]);oc.beginPath();oc.arc(...a,4,0,Math.PI*2);oc.stroke();const angle=Math.atan2(b[1]-a[1],b[0]-a[0]);if(Math.hypot(b[0]-a[0],b[1]-a[1])>12){oc.beginPath();oc.moveTo(...b);oc.lineTo(b[0]-10*Math.cos(angle-.45),b[1]-10*Math.sin(angle-.45));oc.moveTo(...b);oc.lineTo(b[0]-10*Math.cos(angle+.45),b[1]-10*Math.sin(angle+.45));oc.stroke();}oc.font='12px Segoe UI';oc.fillText('ΔX '+dx.toLocaleString('fr-FR',{maximumFractionDigits:3})+' · ΔY '+dy.toLocaleString('fr-FR',{maximumFractionDigits:3}),b[0]+12,b[1]-12);oc.restore();
}
