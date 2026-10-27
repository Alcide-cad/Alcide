let autoTrimActive=false,autoTrimPreview=null;

function autoTrimRange(e,p){try{const r=window.CutPortion?.bounded(e,p,true);return r?{...r,source:e.id}:null;}catch{return null;}}

function startAutoTrim(){if(!scene||busy)return;setTool('auto-trim');autoTrimActive=true;status('Couper au clic : survolez puis cliquez la portion à supprimer · limites détectées automatiquement · Échap quitte.');drawOverlay();}

(()=>{const b=document.createElement('button');b.id='auto-trim-tool';b.className='ribbon-button';b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5l16 14M4 19l6-6M14 9l6-4M12 3v18" fill="none" stroke="currentColor" stroke-width="1.7"/></svg><span class="tool-label">Couper au clic</span>';b.title='Retirer la portion entre intersections voisines ; une limite : couper du côté cliqué';b.onclick=startAutoTrim;$('#cutbetweenobjects').parentElement.prepend(b);

 window.addEventListener('pointermove',ev=>{if(!autoTrimActive||ev.target!==overlay||busy)return;const e=window.CutPortion.pick(eventPoint(ev));autoTrimPreview=autoTrimRange(e,world(eventPoint(ev)));drawOverlay();},true);

 window.addEventListener('pointerdown',ev=>{if(!autoTrimActive||ev.target!==overlay||ev.button!==0||ev.altKey||busy)return;ev.preventDefault();ev.stopImmediatePropagation();const e=window.CutPortion.pick(eventPoint(ev)),cut=autoTrimRange(e,world(eventPoint(ev)));if(!cut){status('Cliquez une ligne ou polyligne ouverte traversée par une limite visible, à distance des intersections.');return;}if(cut.ambiguous){status('Cliquez au milieu de la portion, à distance de l’intersection.');return;}try{window.CutPortion.apply(e,cut);startAutoTrim();autoTrimPreview=null;status('Portion supprimée · cliquez la suivante · Ctrl+Z annule.');}catch(ex){error(ex);}},true);

 window.addEventListener('keydown',ev=>{if(autoTrimActive&&ev.key==='Escape'&&!['INPUT','TEXTAREA','SELECT'].includes(ev.target.tagName)){ev.preventDefault();ev.stopImmediatePropagation();setTool('select');}},true);

 const set=setTool;setTool=function(...args){autoTrimActive=false;autoTrimPreview=null;return set(...args);};const draw=drawOverlay;drawOverlay=function(){draw();if(!autoTrimActive)return;$('#toolquickbar strong').textContent='Couper au clic';if(!autoTrimPreview||autoTrimPreview.ambiguous)return;oc.save();oc.strokeStyle='#ff6868';oc.lineWidth=4;oc.beginPath();autoTrimPreview.removed.forEach((p,i)=>i?oc.lineTo(...screen(p)):oc.moveTo(...screen(p)));oc.stroke();oc.restore();};})();

