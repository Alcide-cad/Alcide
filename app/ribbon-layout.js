// Reparent existing buttons so all tested handlers and keyboard bindings survive.
(()=>{
 function group(page,title,buttons){const found=buttons.map(id=>$('#'+id)).filter(Boolean);if(!found.length)return;const g=document.createElement('div');g.className='ribbon-group';g.dataset.family=title;const tools=document.createElement('div');tools.className='ribbon-tools';tools.append(...found);const label=document.createElement('small');label.textContent=title;g.append(tools,label);page.append(g);}
 const page=$('#ribbon-dessin'),old=[...page.children];
 group(page,'Tracer',['draw-line','draw-polyline']);group(page,'Formes fermées',['draw-rectangle','draw-polygon','draw-circle']);group(page,'Modifier les contours',['stretchobjects','offsetobjects','cutbetweenobjects','trimobjects','extendobjects','joinlines']);group(page,'Traits et remplissages',['drawing-style-button','fillsettings','hatchsettings']);for(const g of old)if(!g.querySelector('button,input,select'))g.remove();
 const names={'Modifier':'Modifier les objets','Position':'Distances précises','Similaires':'Sélection ciblée','Précision':'Aides au dessin','Mesurer et annoter':'Mesurer et coter','Réglages':'Styles de cotes','Textes':'Textes','Chaînes de cotes':'Modifier les lignes de cotes','Repères':'Repères et axes','Navigation':'Vues','Organisation':'Panneaux','Application':'Application'};
 for(const small of document.querySelectorAll('#ribboncontent .ribbon-group>small'))if(names[small.textContent])small.textContent=names[small.textContent];
 $('#stretchobjects').querySelector('path')?.setAttribute('d','M3 4h7v16H3zM14 4h7v16h-7M8 12h10M15 9l3 3-3 3');
 $('#joinlines').querySelector('path')?.setAttribute('d','M3 17h14V3M3 17h6M17 3v6M12 17h5v-5M10 7l5 5M11 12h4V8');
})();

(()=>{const actions=$('.layer-visibility-actions');if(!actions)return;const fold=document.createElement('details');fold.id='layer-visibility-fold';const title=document.createElement('summary');title.textContent='Visibilité des calques';actions.before(fold);fold.append(title,actions);})();

$('#ribboncontent').addEventListener('wheel',ev=>{const page=document.querySelector('.ribbon-page:not([hidden])');if(!page||page.scrollWidth<=page.clientWidth||!ev.deltaY||ev.ctrlKey)return;ev.preventDefault();page.scrollLeft+=ev.deltaY;},{passive:false});

for(const group of document.querySelectorAll('#ribboncontent .ribbon-group')){const label=group.querySelector(':scope>small')?.textContent;if(label){group.title=label;group.setAttribute('role','group');group.setAttribute('aria-label',label);}}
