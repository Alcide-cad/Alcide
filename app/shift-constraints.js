let shiftConstraintHeld=false,shiftPointer=null;
function constraintAnchor(){
 if(window.axisAnchor?.())return window.axisAnchor();
 if(window.chainExtensionAnchor?.())return window.chainExtensionAnchor();
 if(activeGrip){const v=activeGrip.vertices[activeGrip.index];return [v[0]+activeGrip.delta[0],v[1]+activeGrip.delta[1]];}
 if(cadMode?.mode==='stretch'&&cadMode.points.length===3)return cadMode.points[2];
 if(['copy','move','measure'].includes(tool)&&points.length)return points[points.length-1];
 if(tool==='dimension'&&continuingChainId){const chain=edits[continuingChainId]?.chain;if(chain)return chain.anchors[chain.anchors.length-1].point;}
 if(tool==='dimension'&&points.length===1)return points[0];
 if(annotationMode==='chain'&&annotationPoints.length)return annotationPoints[annotationPoints.length-1];
 if(reperePlacement?.anchor)return reperePlacement.anchor;
 return null;
}
(()=>{
 const original=snap;snap=function(p){const v=original(p),anchor=constraintAnchor();if(!shiftConstraintHeld||!anchor)return v;const raw=world(p),horizontal=Math.abs(raw[0]-anchor[0])>=Math.abs(raw[1]-anchor[1]),result=horizontal?[v[0],anchor[1]]:[anchor[0],v[1]];if(snapPoint&&Math.hypot(result[0]-snapPoint[0],result[1]-snapPoint[1])>1e-8){snapPoint=null;snapKind=null;}copyAlignment=null;return result;};
 for(const event of ['pointerdown','pointermove','pointerup'])document.addEventListener(event,ev=>{if(ev.target!==overlay)return;shiftConstraintHeld=ev.shiftKey;shiftPointer=eventPoint(ev);},true);
 const update=ev=>{if(ev.key!=='Shift')return;shiftConstraintHeld=ev.type==='keydown';if(shiftPointer&&!busy&&constraintAnchor()){cursor=snap(shiftPointer);if(activeGrip)activeGrip.point=cursor;drawOverlay();}};
 document.addEventListener('keydown',update);document.addEventListener('keyup',update);window.addEventListener('blur',()=>{shiftConstraintHeld=false;});
 const draw=drawOverlay;drawOverlay=function(){draw();if(!shiftConstraintHeld||!constraintAnchor())return;oc.save();oc.fillStyle='#f6d58a';oc.font='12px Segoe UI';oc.fillText('Maj · direction horizontale / verticale',12,h-14);oc.restore();};
})();
