// Keep the original fill controls beside drawing style; do not clone their state.
(()=>{
 const start=startDrawingTool;startDrawingTool=function(kind){const r=start.apply(this,arguments);if(['rectangle','polygon','circle'].includes(kind)&&drawingMode){const panel=document.getElementById('propertiespanel');if(panel.dataset.sideTab!=='properties')document.querySelector('.side-tabs.right [data-side-tab=properties]')?.click();const card=document.getElementById('hatch-properties');card.open=true;card.hidden=false;drawOverlay();}return r;};
 const heading=document.querySelector('#drawing-style>summary');if(heading)heading.textContent='Dessin · traits';
})();
