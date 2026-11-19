// 1.0.97 · Propriétés appliquées à toutes les cotes sélectionnées (cotes CAO et cotes ALCIDE) :
// décimales et pas d'arrondi saisis au clavier, unités sans bloquer sur les cotes angulaires, calque et couleur des cotes.
// Valeurs différentes : « varié ». Une seule étape d'annulation par modification.
(()=>{
 const dims=()=>typeof tool==='undefined'||tool==='select'?[...selected].map(id=>entities.get(id)).filter(e=>e&&dimensionParameters(e)&&!isLocked(e)):[];
 const angular=e=>{const k=e?.nativeDimension?.kind;if(k===2||k===5)return true;const it=edits[e?.id]?.cad196Item,sp=it&&edits[it.dataId]?.cad196?.specs?.[0];return sp?.kind==='angular';};
 const base=applyDimensionParameter;
 applyDimensionParameter=async function(field,value,ids=[...selected]){if(['unit','factor','showUnit'].includes(field)){const keep=ids.filter(id=>!angular(entities.get(id)));if(!keep.length)return;ids=keep;}return base.call(this,field,value,ids);};
 // Champs numériques (texte avec calcul) : la valeur saisie est lue avec cadNumeric.
 for(const [id,field,check] of [['precision','precision',v=>Number.isInteger(v)&&v>=0&&v<=6],['dimensionround','rounding',v=>Number.isFinite(v)&&v>=0]]){const input=document.getElementById(id);if(!input)continue;
  input.addEventListener('change',async()=>{const es=dims();if(!es.length||busy)return;const v=cadNumeric(input.value);if(!check(v))return;if(field==='precision'&&Number.isFinite(input.valueAsNumber))return;/* déjà traité par le panneau */await applyDimensionParameter(field,v,es.map(e=>e.id));});}
 // Calque et couleur des cotes sélectionnées.
 const card=document.getElementById('inspector-dimensions');if(!card)return;
 const box=document.createElement('div');box.id='dimension-layer197';box.hidden=true;box.innerHTML='<label class="row">Calque des cotes<select id="dimension-layer197-select"></select></label><label class="row">Couleur des cotes<select id="dimension-color197-mode"><option value="bylayer">Du calque</option><option value="custom">Personnalisée</option></select><input id="dimension-color197" type="color" value="#a9df80" title="Couleur des cotes sélectionnées"></label>';
 (card.querySelector('summary')?card.querySelector('summary').nextSibling:null)?card.insertBefore(box,card.querySelector('summary').nextSibling):card.append(box);
 const sel=box.querySelector('#dimension-layer197-select'),mode=box.querySelector('#dimension-color197-mode'),color=box.querySelector('#dimension-color197');
 const layerOf=e=>edits[e.id]?.props?.layer??e.layer,colorOf=e=>{const c=edits[e.id]?.props?.color;if(c)return c;return e.trueColor!=null?'#'+e.trueColor.toString(16).padStart(6,'0'):e.color===256||e.color==null?'bylayer':'aci:'+e.color;};
 let key='';
 function sync(){const es=dims();box.hidden=!es.length;if(!es.length){key='';return;}const names=(typeof layerData!=='undefined'?layerData:[]).map(l=>l.name).filter(Boolean);const ls=es.map(layerOf),cs=es.map(colorOf);const next=JSON.stringify([names,ls,cs]);if(next===key)return;key=next;
  if(document.activeElement!==sel){sel.replaceChildren();const same=ls.every(v=>v===ls[0]);if(!same){const o=new Option('varié','');o.disabled=true;sel.append(o);}for(const n of names)sel.append(new Option(n,n));if(ls[0]&&!names.includes(ls[0]))sel.append(new Option(ls[0],ls[0]));sel.value=same?ls[0]:'';sel.title=same?'':'Valeurs différentes · choisir un calque pour toutes les cotes sélectionnées';}
  const cSame=cs.every(v=>v===cs[0]);if(document.activeElement!==mode){if(!cSame){if(!mode.querySelector('option[value=""]')){const o=new Option('varié','');o.disabled=true;mode.prepend(o);}mode.value='';}else{mode.querySelector('option[value=""]')?.remove();mode.value=cs[0]==='bylayer'?'bylayer':'custom';}}
  if(cSame&&/^#[0-9a-f]{6}$/i.test(cs[0]))color.value=cs[0];color.disabled=mode.value==='bylayer';}
 function apply(patch,label){const es=dims();if(!es.length||busy)return;const before=snapshot();for(const e of es){const props={...(edits[e.id]?.props||{})};for(const [k,v] of Object.entries(patch)){if(v===null)delete props[k];else props[k]=v;}edits[e.id]={...(edits[e.id]||{}),props};}commit(before);layersUI?.();key='';sync();status(label+' · '+es.length+' cote(s) · Ctrl+Z annule.');}
 sel.addEventListener('change',()=>{if(!sel.value)return;apply({layer:sel.value},'Calque « '+sel.value+' »');});
 mode.addEventListener('change',()=>{if(!mode.value)return;apply({color:mode.value==='bylayer'?null:color.value},mode.value==='bylayer'?'Couleur du calque':'Couleur personnalisée');});
 color.addEventListener('change',()=>{mode.value='custom';apply({color:color.value},'Couleur personnalisée');});
 const r=refresh;refresh=function(...a){const out=r.apply(this,a);try{sync();}catch{}return out;};
 window.DimProps197={sync};sync();
})();
