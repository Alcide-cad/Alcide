// Double-clic sur une ligne : ouvrir ses propriétés, même si le panneau est masqué.
(()=>{
 overlay.addEventListener('dblclick',ev=>{
  if(ev.button!==0||busy||tool!=='select'||drawingMode||annotationMode||coreTool||window.rotationTool)return;
  const e=pick(eventPoint(ev));
  if(!e||!['LINE','LWPOLYLINE','POLYLINE'].includes(e.type)||e.rebar||e.annotation||e.nativeText||e.arrowHead)return;
  ev.preventDefault();
  selected=new Set([e.id]);
  setPanelVisible(true);
  refresh();
  revealInspector(document.querySelector('#properties .selection-editor')||$('#properties'));
  window.syncArrowControls?.();
 });
})();
