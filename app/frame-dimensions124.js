// Champs en emprise extérieure ; le modèle conserve les axes pour le développé.
(()=>{
 const row=document.createElement('label');row.innerHTML='Fermeture du cadre<select id="rebar-frameClosureRule124"><option value="ec2-2005">EC2 courant · 135° · max(5Ø, 5 cm)</option><option value="ec8-first">EC8 sismique · 135° · max(10Ø, 7 cm)</option><option value="legacy">Convention historique · queues conservées</option></select>';document.getElementById('rebar-hookStart').closest('details').append(row);
 let previous='';
 function sync(){const shape=document.getElementById('rebar-shape'),frame=shape.value==='cadre',cover=document.getElementById('rebar-corner-cover124')?.checked,key=[frame,cover].join('|');row.hidden=!frame;if(key===previous)return;previous=key;
  const label=(id,text)=>{const row=document.getElementById(id).closest('label'),node=[...row.childNodes].find(n=>n.nodeType===Node.TEXT_NODE);if(node)node.textContent=text;row.title=text;};
  label('rebar-width',frame?'Largeur extérieure (cm)':'Longueur / largeur à l’axe (cm)');label('rebar-height',frame?'Hauteur extérieure (cm)':'Hauteur à l’axe (cm)');
  const note=document.querySelector('.rebar-units-note');if(note)note.textContent=frame?'Cadre : dimensions hors tout · cm':'Dimensions à l’axe · cm';
  const mode=document.getElementById('rebar-barmode');mode.options[0].textContent=frame?(cover?'Deux coins du coffrage':'Deux coins extérieurs du cadre'):'Tracer entre deux points';
 }
 const base=drawOverlay;drawOverlay=function(...args){sync();return base.apply(this,args);};sync();
})();
