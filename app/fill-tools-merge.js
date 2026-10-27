// 0.7.7 : groupe Hachures et remplissages simplifié. « Contour hachuré » et « Contour uni » ne différaient que par le motif
// imposé (ANSI31 / SOLID) : fusionnés en « Par contour », qui utilise le type choisi dans le panneau. Anciens boutons gardés (masqués) pour les raccourcis.
(()=>{
 const hatched=$('#create-hatched-zone'),filled=$('#create-filled-zone'),settings=$('#hatchsettings'),bucket=$('#bucket-fill-zone');if(!hatched||!filled||!settings)return;
 const svg=d=>'<svg class="tool-pictogram" viewBox="0 0 24 24" aria-hidden="true"><path d="'+d+'"/></svg>';
 const b=document.createElement('button');b.id='fill-by-contour';b.className='ribbon-button uniform-tool ui-button';b.innerHTML=svg('M4 18 7 5l11 3 2 10ZM4 18h.01M7 5h.01M18 8h.01M20 18h.01M8 15l3-3M8 11l2-2M12 16l5-5')+'<span class="tool-label">Par contour</span>';
 b.dataset.fullTooltip='Par contour · cliquez les sommets d’une zone puis Entrée (ou sélectionnez des contours fermés) · le type uni / hachure / motif est celui choisi dans le panneau';
 b.onclick=()=>{const pat=$('#hatch-pattern'),en=$('#hatch-enabled');const keep=pat&&en?.checked&&pat.value?pat.value:'ANSI31';hatched.click();if(pat&&pat.value!==keep){pat.value=keep;pat.dispatchEvent(new Event('input',{bubbles:true}));pat.dispatchEvent(new Event('change',{bubbles:true}));try{drawingSaveStyle();}catch{}}};
 filled.after(b);
 for(const x of [hatched,filled])x.style.setProperty('display','none','important');
 const label=settings.querySelector('.tool-label')||settings;const tn=[...label.childNodes].reverse().find(n=>n.nodeType===3&&n.textContent.trim());if(tn)tn.textContent='Type et motif';else label.textContent='Type et motif';
 if(!settings.querySelector('svg'))settings.insertAdjacentHTML('afterbegin',svg('M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4'));
 settings.dataset.fullTooltip='Type et motif · ouvre le panneau Remplissage / Hachures / Motifs : couleur, angle, échelle, transparence · s’applique aussi aux hachures sélectionnées';
 if(bucket){bucket.dataset.fullTooltip='Remplir au clic · cliquez à l’intérieur d’une zone fermée · uni, hachure ou motif selon le panneau Type et motif';}

 const draw=drawOverlay;drawOverlay=function(...a){const r=draw.apply(this,a);b.disabled=!scene||busy;return r;};
})();
