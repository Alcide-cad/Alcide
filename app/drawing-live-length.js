// Live segment length follows the final snapped preview, without creating an annotation.
(()=>{
 const badge=document.createElement('div');badge.id='drawing-live-length';badge.hidden=true;badge.setAttribute('aria-label','Longueur du segment en cours');document.body.append(badge);
 function sync(){const m=drawingMode;if(!m||m.doc!==activeId||!['line','polyline','polygon'].includes(m.kind)||!m.points.length||!m.cursor||busy){badge.hidden=true;return;}
 const a=m.points.at(-1),b=m.cursor,length=Math.hypot(b[0]-a[0],b[1]-a[1]);if(!Number.isFinite(length)||length<1e-8){badge.hidden=true;return;}
 const factor=mm[$('#units').value],value=factor?length*factor/10:length,unit=factor?'cm':'u';badge.textContent='L = '+value.toLocaleString('fr-FR',{maximumFractionDigits:2})+' '+unit;
 const pa=screen(a),pb=screen(b),rect=overlay.getBoundingClientRect();badge.hidden=false;const width=badge.offsetWidth,height=badge.offsetHeight,x=rect.left+(pa[0]+pb[0])/2-width/2,y=rect.top+(pa[1]+pb[1])/2-height-12;
 badge.style.left=Math.max(rect.left+6,Math.min(rect.right-width-6,x))+'px';badge.style.top=Math.max(rect.top+6,Math.min(rect.bottom-height-6,y))+'px';
 }
 const draw=drawOverlay;drawOverlay=function(){draw();sync();};
 const css=document.createElement('style');css.textContent='#drawing-live-length{position:fixed;z-index:70;pointer-events:none;user-select:none;padding:5px 9px;border:1px solid #6d9fb6;border-radius:6px;background:#203440ed;color:#deeff9;font:600 12px Segoe UI,Arial,sans-serif;line-height:16px;box-shadow:0 2px 8px #0004;white-space:nowrap}#drawing-live-length[hidden]{display:none}';document.head.append(css);
})();
