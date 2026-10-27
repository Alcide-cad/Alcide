// Actions communes, réutilisant les validations et annulations natives des outils.
(()=>{
 const actions=document.createElement('span');actions.id='gesture-actions';actions.className='selection-actions';
 const hint=document.createElement('span'),finish=document.createElement('button'),cancel=document.createElement('button');
 finish.textContent='Terminer · Entrée';cancel.textContent='Annuler · Échap';
 actions.append(hint,finish,cancel);$('#toolquickbar').append(actions);let previous='';
 function key(name){document.activeElement?.blur();overlay.focus();overlay.dispatchEvent(new KeyboardEvent('keydown',{key:name,code:name,bubbles:true,cancelable:true}));drawOverlay();}
 finish.onclick=()=>key('Enter');cancel.onclick=()=>key('Escape');
 function sync(){if(!actions.isConnected)$('#toolquickbar').append(actions);const op=window.toolPaletteContext?.()||'',rotation=window.rotationTool;const canFinish=!!(drawingMode&&drawingMode.points.length>1||rotation&&(rotation.phase==='selection'||rotation.pivot));const phase=rotation?rotation.pivot?'Choisir l’angle':'Choisir le pivot':tool==='move'||tool==='copy'?points.length?'Choisir l’arrivée':'Choisir le départ':drawingMode?'Cliquer pour placer les points':'Cliquer pour définir la géométrie';const value=JSON.stringify([op,phase,canFinish]);if(value===previous)return;previous=value;actions.hidden=!op;finish.hidden=!canFinish;hint.textContent=phase;}
 const draw=drawOverlay;drawOverlay=function(...args){const result=draw.apply(this,args);sync();return result;};sync();
 const css=document.createElement('style');css.textContent='#gesture-actions{gap:8px;align-items:center}#gesture-actions[hidden]{display:none}#gesture-actions>span{font-size:12px;color:var(--muted,#b4c1ca)}';document.head.append(css);
 window.gestureActionsReady=true;
})();
