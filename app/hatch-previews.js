// Aperçus des motifs : dessinés avec le même générateur de lignes que le rendu réel (angle et espacement cohérents).
(()=>{
 function preview(pattern){const c=document.createElement('canvas');c.width=84;c.height=56;const g=c.getContext('2d');g.fillStyle='#101820';g.fillRect(0,0,84,56);if(pattern==='SOLID'){g.fillStyle='#b2d893';g.fillRect(0,0,84,56);return c.toDataURL();}
  const box=[[0,0],[84,0],[84,56],[0,56]];g.strokeStyle='#b2d893';g.lineWidth=1.5;g.beginPath();for(const [a,b]of hatchPatternLines(hatchLines,box,10,pattern,0)){g.moveTo(a[0],56-a[1]);g.lineTo(b[0],56-b[1]);}g.stroke();return c.toDataURL();}
 window.hatchPreviewURL=preview;
 function paint(){for(const s of document.querySelectorAll('#hatch-pattern-gallery [data-pattern] .hatch-swatch')){if(s.dataset.previewed)continue;const p=s.closest('[data-pattern]').dataset.pattern;try{s.style.background='url('+preview(p)+') center/cover';s.dataset.previewed='1';}catch{}}}
 paint();if(!document.querySelector('#hatch-pattern-gallery')){const o=new MutationObserver(()=>{if(document.querySelector('#hatch-pattern-gallery')){paint();o.disconnect();}});o.observe(document.body,{childList:true,subtree:true});}
 const SHORT={SOLID:'Uni',ANSI31:'Diag.',ANSI37:'Croisées',HORIZ:'Horiz.',VERT:'Vert.',DIAG_INV:'Diag. inv.',CARREAUX:'Grille',LOSANGES:'Losanges',SERREES:'Serrées',BETON:'Béton'};
 function tidy(){const g=document.querySelector('#hatch-pattern-gallery');if(!g)return;for(const b of g.querySelectorAll('button[data-pattern]')){const p=b.dataset.pattern,full=p==='SOLID'?'Uni':(HATCH_PATTERNS[p]?.label||p),label=b.querySelector('span:not(.hatch-swatch)');b.title=full;b.setAttribute('aria-label',full);if(label&&SHORT[p])label.textContent=SHORT[p];}const modes=g.previousElementSibling;if(modes&&!modes.id&&modes.querySelectorAll('button').length===2){modes.id='hatch-fill-modes';modes.style.cssText='';}}
 tidy();setTimeout(tidy,0);window.addEventListener('load',tidy);if(!document.querySelector('#hatch-pattern-gallery')){const o2=new MutationObserver(()=>{if(document.querySelector('#hatch-pattern-gallery')){tidy();o2.disconnect();}});o2.observe(document.body,{childList:true,subtree:true});}
 const css=document.createElement('style');css.textContent=`
#hatch-properties #hatch-pattern-gallery{display:grid!important;grid-template-columns:repeat(auto-fill,minmax(72px,1fr));gap:6px;margin:8px 0}
#hatch-properties #hatch-pattern-gallery button{display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:4px;width:auto;min-width:0;height:72px;padding:6px 4px;margin:0;font-size:11px;line-height:1.2;border:1px solid #3e5260;border-radius:6px;background:#1a2731;color:#d6e2ea;cursor:pointer;transition:border-color .12s,background .12s}
#hatch-properties #hatch-pattern-gallery button>span:not(.hatch-swatch){display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#hatch-properties #hatch-pattern-gallery .hatch-swatch{flex:0 0 auto;width:46px;height:38px;border:1px solid #5d707c;border-radius:3px}
#hatch-properties #hatch-pattern-gallery button:hover{border-color:#7f97a6;background:#22333f}
#hatch-properties #hatch-pattern-gallery button:focus-visible{outline:2px solid #8fc3ff;outline-offset:1px}
#hatch-properties #hatch-pattern-gallery button[aria-pressed=true]{border-color:#b2e58a;background:#2b3f32;box-shadow:inset 0 0 0 1px #b2e58a}
#hatch-properties #hatch-fill-modes{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:8px 0}
#hatch-properties #hatch-fill-modes button{width:100%;min-width:0;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}`;document.head.append(css);
})();
