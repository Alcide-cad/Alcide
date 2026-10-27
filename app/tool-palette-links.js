// Une liaison commune pour les commandes du ruban, les raccourcis et les outils contextuels.
(()=>{
 let lastOperation='',lastSelection='',scheduled=0;
 function operation(){
  if(typeof activeGrip!=='undefined'&&activeGrip)return 'properties:grip';
  if(window.rotationTool)return 'properties:rotation';
  if(typeof cadMode!=='undefined'&&cadMode)return 'properties:'+cadMode.mode;
  if(window.bucketFillActive)return 'hatch:bucket';
  if(typeof levelMode!=='undefined'&&levelMode)return 'text:level';
  if(typeof axesMode!=='undefined'&&axesMode)return 'text:axes';
  if(typeof reperePlacement!=='undefined'&&reperePlacement)return 'text:repere';
  if(typeof annotationMode!=='undefined'&&annotationMode)return (annotationMode.startsWith('chain')?'dimension:':'text:')+annotationMode;
  if(drawingMode)return 'properties:draw:'+drawingMode.kind;
  if(tool==='dimension'||tool==='measure'||measurementCalibration)return 'dimension:'+tool;
  if(tool==='move'||tool==='copy'||pendingTransformSelection)return 'properties:'+tool+':'+pendingTransformSelection;
  if(typeof coreTool!=='undefined'&&coreTool)return 'properties:core:'+coreTool.mode;
  return '';
 }
 function sync(){scheduled=0;const op=operation(),selection=JSON.stringify([activeId,[...selected]]),changed=selection!==lastSelection;lastSelection=selection;if(op!==lastOperation){lastOperation=op;if(op)window.openSidePropertyTab?.(op.split(':')[0]);}if(!op&&changed&&selected.size){const es=[...selected].map(id=>entities.get(id)).filter(Boolean);const tab=es.every(e=>e.rebar)?'rebar':es.every(e=>dimensionParameters(e))?'dimension':es.every(e=>textProperties(e)||e.annotation)?'text':es.every(e=>e.type==='HATCH')?'hatch':'properties';window.openSidePropertyTab?.(tab);}}
 function later(){if(!scheduled)scheduled=requestAnimationFrame(sync);}
 const draw=drawOverlay;drawOverlay=function(...args){const result=draw.apply(this,args);later();return result;};
 // Les catégories sans palette dédiée (Fichier, Affichage) ne changent pas le contexte.
 document.querySelector('.ribbon-tabs').addEventListener('click',ev=>{const id=ev.target.closest('[data-tab]')?.dataset.tab;const tab={mesures:'dimension',armatures:'rebar',dessin:'properties',selection:'properties',accueil:'properties'}[id];if(tab&&!operation())window.openSidePropertyTab?.(tab);});
 document.querySelector('#ribboncontent').addEventListener('click',ev=>{const button=ev.target.closest('button');if(!button||button.disabled)return;const id=button.dataset.commandTarget||button.id;if(/hatch|filled-zone|fillsettings/.test(id))window.openSidePropertyTab?.('hatch');else if(/text|repere|level|axes/.test(id))window.openSidePropertyTab?.('text');else if(/dimension|chain|measure/.test(id))window.openSidePropertyTab?.('dimension');later();});
 window.toolPaletteContext=operation;window.toolPaletteLinksReady=true;
})();
