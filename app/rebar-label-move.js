// A label selected by its bubble/text uses the same Move and precision workflow.
(()=>{
 let target=null;
 function current(){if(!target||target.doc!==activeId||selected.size!==1||!selected.has(target.id))return null;const e=entities.get(target.id);return e?.rebar&&!isLocked(e)?e:null;}
 const set=setTool;setTool=function(t,...args){if(t==='move'){const label=window.selectedRebarLabel;if(label?.doc===activeId&&selected.size===1&&selected.has(label.id))target={...label};else target=null;}else if(t!=='select')target=null;return set(t,...args);};
 window.addEventListener('pointerdown',ev=>{if(ev.target!==overlay||ev.button!==0||ev.altKey||tool!=='select'||RebarLabels.interaction())return;window.selectedRebarLabel=null;target=null;},true);
 const move=moveSelection;moveSelection=function(dx,dy,ids=[...selected]){const e=current();if(!e||ids.length!==1||ids[0]!==e.id)return move(dx,dy,ids);if(busy||![dx,dy].every(Number.isFinite))return;const before=snapshot(),d=RebarLabels.labelData(e),v=edits[e.id].rebarView;v.labelOffset=d.offset.map((n,i)=>n+(i?dy:dx));v.labelVisible=true;commit(before);status('Repère déplacé · acier et pointes des rappels conservés · Ctrl+Z annule.');};
 const preview=drawTransformPreview;drawTransformPreview=function(...args){const e=tool==='move'&&current();if(!e||!points.length||!cursor)return preview(...args);const delta=cursor.map((n,i)=>n-points[0][i]),d=RebarLabels.labelData(e);RebarLabels.paintOffset(e.id,d.offset.map((n,i)=>n+delta[i]));};
})();
