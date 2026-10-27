// Illustrated representation choices retain the native select's business handlers.
(()=>{
 const source=document.getElementById('rebar-role'),label=source.closest('label'),section=label.closest('details'),ns='http://www.w3.org/2000/svg';
 const choices=[
 ['shape','Forme complète','Plan ou élévation','M8 7V29Q8 32 11 32H45V7','La forme de l’acier est dessinée entièrement.'],
 ['distribution','Répartition de face','Formes répétées','M5 7V25H18V7M21 7V25H34V7M37 7V25H50V7','La forme complète est répétée selon la quantité et l’espacement.'],
 ['distribution-side','Vue de dessus','Projection des branches','M7 9H49M7 18H49M7 27H49','Pour un U : chaque trait représente la longueur d’une branche.'],
 ['distribution-top','Vue de côté','Projection de l’écartement','M16 6H40M16 18H40M16 30H40','Pour un U : chaque trait représente l’écartement entre les branches.'],
 ['section','Coupe en points','Barres vues en coupe','M10 18h.01M22 18h.01M34 18h.01M46 18h.01','Chaque barre est représentée par un point à son diamètre. Les crosses restent prises en compte dans la nomenclature.']
 ];
 const root=document.createElement('div');root.id='rebar-representation-buttons';root.setAttribute('role','group');root.setAttribute('aria-label','Représentation de l’acier');const note=document.createElement('p');note.id='rebar-representation-hint';note.setAttribute('role','status');
 label.hidden=true;label.after(root,note);const buttons=new Map();
 for(const [value,title,subtitle,path,hint]of choices){const b=document.createElement('button');b.type='button';b.dataset.role=value;b.setAttribute('aria-pressed','false');b.title=hint;const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 56 38');svg.setAttribute('aria-hidden','true');const p=document.createElementNS(ns,'path');p.setAttribute('d',path);if(value==='section')p.setAttribute('stroke-width','7');svg.append(p);const text=document.createElement('span'),strong=document.createElement('strong'),small=document.createElement('small');strong.textContent=title;small.textContent=subtitle;text.append(strong,small);b.append(svg,text);b.onclick=()=>{if(source.disabled)return;source.value=value;source.dispatchEvent(new Event('input',{bubbles:true}));source.dispatchEvent(new Event('change',{bubbles:true}));sync();};root.append(b);buttons.set(value,b);}
 // Keep the full explanation in the existing help topic, but remove it from the palette.
 for(const child of [...section.children])if(child.tagName==='SMALL')child.hidden=true;
 const linked=document.createElement('small');linked.id='rebar-representation-linked-note';linked.textContent='Même acier dans une autre vue ? Utilisez « Ajouter une vue liée » : il ne sera pas compté deux fois.';section.append(linked);
 let previous='';function sync(){const key=source.value+'|'+source.disabled+'|'+[...source.options].map(o=>o.value+o.disabled).join();if(previous===key)return;previous=key;for(const [value,b]of buttons){const option=[...source.options].find(o=>o.value===value);b.disabled=source.disabled||!option||option.disabled;b.setAttribute('aria-pressed',String(value===source.value));}note.textContent=choices.find(row=>row[0]===source.value)?.[4]||'';}
 source.addEventListener('change',sync);source.addEventListener('input',sync);const draw=drawOverlay;drawOverlay=function(...args){const r=draw(...args);sync();return r;};sync();window.RebarRepresentationButtons={sync};
})();
