// Drawing-wide and per-object line scales, expressed against a paper reference.
(()=>{
 const current=()=>edits['@linetype-scale145']?.documentLinetypeScale??scene?.linetypeGlobalScale??1;
 const positive=v=>Number.isFinite(v)&&v>0&&v<=1e6;
 function set(value){value=Number(value);if(!scene||busy)return;if(!positive(value))throw Error('Choisissez une échelle positive.');const before=snapshot();edits['@linetype-scale145']={documentLinetypeScale:value};commit(before,false);status('Échelle générale des traits ×'+value+' · Ctrl+Z annule.');}
 window.DocumentLineScale145={current,set,ratio:p=>current()/(p?.nativeDashGlobalScale||scene?.linetypeGlobalScale||1)};
 const dialog=document.createElement('dialog');dialog.id='line-scale-settings';
 dialog.innerHTML=`<form method="dialog"><header><h2>Échelle des traits</h2><button value="cancel" aria-label="Fermer">×</button></header><div class="line-scale-body"><p>Axes et pointillés · taille du motif, sans modifier la géométrie.</p><label>Appliquer à<select id="line-scale-scope"><option value="object">Sélection / prochains objets</option><option value="document">Tout le dessin · facteur général</option></select></label><section id="line-scale-direct"><label>Facteur<input id="line-scale-factor" type="text" inputmode="decimal" value="1"></label></section><section id="line-scale-paper"><label>Échelle papier 1:<input id="line-scale-denominator" type="number" min="1" max="100000" value="50"></label><label>Grand tiret sur papier (mm)<input id="line-scale-mm" type="text" inputmode="decimal" value="6"></label><button type="button" id="line-scale-normalize">Normaliser pour le 1:50</button></section><canvas width="420" height="64" aria-label="Aperçu des pointillés sur papier"></canvas><output></output></div><footer><button value="cancel">Annuler</button><button type="button" id="line-scale-apply" class="primary">Appliquer</button></footer></form>`;
 document.body.append(dialog);
 const q=id=>dialog.querySelector('#line-scale-'+id);let context=null,normalizing=false;
 function targets(){return [...(context?.ids||[])].map(id=>entities.get(id)).filter(e=>e&&!isLocked(e)&&!edits[e.id]?.deleted);}
 function plan(){
  if(!context||activeId!==context.doc||saveToken!==context.token)throw Error('Le dessin a changé. Rouvrez ce réglage.');
  const denominator=cadNumeric(q('denominator').value),paper=cadNumeric(q('mm').value),factor=cadNumeric(q('factor').value),unit=mm[$('#units').value];
  if((!normalizing&&!positive(factor))||!positive(denominator)||!positive(paper)||!unit)throw Error('Vérifiez les facteurs et l’unité du dessin.');
  const es=targets(),updates=[];
  if(normalizing){
   if(!es.length)throw Error('Sélectionnez les axes ou pointillés à normaliser.');
   for(const e of es){const lengths=e.primitives.filter(p=>!p.fill&&p.detailKind!=='text').map(p=>Math.max(0,...objectLineDash(e,p))).filter(n=>n>1e-7).sort((a,b)=>a-b);if(!lengths.length)continue;const scale=(edits[e.id]?.props?.linetypeScale??e.linetypeScale??1)*paper*denominator/unit/lengths[Math.floor(lengths.length/2)];if(!positive(scale))throw Error('Facteur calculé hors limites.');updates.push([e.id,scale]);}
   if(!updates.length)throw Error('Aucun trait discontinu dans cette sélection.');
  }
  return {denominator,paper,factor,unit,updates,es};
 }
 function preview(){
  const c=dialog.querySelector('canvas'),ctx=c.getContext('2d'),out=dialog.querySelector('output');ctx.clearRect(0,0,c.width,c.height);ctx.strokeStyle=getComputedStyle(dialog).color;ctx.lineWidth=2;
  try{const v=plan(),e=v.es.find(e=>e.primitives.some(p=>!p.fill&&objectLineDash(e,p).length)),p=e?.primitives.find(p=>!p.fill&&objectLineDash(e,p).length);let dash=e?objectLineDash(e,p):[6,3];
   if(e){const old=edits[e.id]?.props?.linetypeScale??e.linetypeScale??1;const multiplier=normalizing?(v.updates.find(u=>u[0]===e.id)?.[1]??old)/old:q('scope').value==='document'?v.factor/current():v.factor/old;dash=dash.map(n=>n*multiplier*v.unit/v.denominator*8);}
   if(!e)dash=dash.map(n=>n*v.factor);ctx.setLineDash(dash);ctx.beginPath();ctx.moveTo(12,30);ctx.lineTo(408,30);ctx.stroke();ctx.setLineDash([]);
   out.textContent=(normalizing?v.updates.length+' objet(s) · grand tiret '+v.paper+' mm':q('scope').value==='document'?'Facteur général ×'+v.factor:v.es.length?v.es.length+' objet(s) · facteur ×'+v.factor:'Facteur des prochains objets ×'+v.factor)+' · aperçu au 1:'+v.denominator;
   q('apply').disabled=false;
  }catch(ex){out.textContent=ex.message;q('apply').disabled=true;}
 }
 function open(scope='object'){
  if(!scene||busy)return;context={doc:activeId,token:saveToken,ids:[...selected]};normalizing=false;q('scope').value=scope;
  const es=targets();q('scope').options[0].textContent=es.length?'Sélection · '+es.length+' objet(s)':'Prochains objets';q('scope').options[1].textContent='Dessin entier';q('factor').placeholder='Valeurs différentes';const scales=es.map(e=>edits[e.id]?.props?.linetypeScale??e.linetypeScale??1);q('factor').value=scope==='document'?current():scales.length?(scales.every(n=>n===scales[0])?scales[0]:''):cadNumeric($('#drawing-linetype-scale').value)||1;
  q('denominator').value=50;q('mm').value=6;preview();dialog.showModal();
 }
 q('scope').onchange=()=>{normalizing=false;q('factor').value=q('scope').value==='document'?current():targets()[0]?(edits[targets()[0].id]?.props?.linetypeScale??targets()[0].linetypeScale??1):1;preview();};
 q('factor').oninput=()=>{normalizing=false;preview();};for(const id of ['denominator','mm'])q(id).oninput=()=>{q('normalize').textContent='Normaliser pour le 1:'+q('denominator').value;preview();};
 q('normalize').onclick=()=>{normalizing=true;q('scope').value='object';preview();};
 q('apply').onclick=()=>{try{const v=plan();if(normalizing){const before=snapshot();for(const [id,n]of v.updates)edits[id]={...edits[id],props:{...edits[id]?.props,linetypeScale:n}};commit(before);}else if(q('scope').value==='document')set(v.factor);else if(v.es.length)applySelectionProperties({linetypeScale:v.factor});else{$('#drawing-linetype-scale').value=v.factor;drawingSaveStyle();}dialog.close();status(normalizing?'Traits normalisés pour le 1:'+v.denominator+' · Ctrl+Z annule.':'Échelle du trait mise à jour.');}catch(e){dialog.querySelector('output').textContent=e.message;}};
 window.LineScaleSettings145={open,plan};
 // Keep the type picker focused on choosing a pattern. Scale has one dedicated dialog.
 const footer=document.querySelector('.line-picker-footer');if(footer){footer.querySelector('label')?.remove();footer.querySelector('small')?.remove();const b=document.createElement('button');b.type='button';b.textContent='Régler l’échelle des traits…';b.onclick=()=>{const popup=$('#linetype-picker');if(popup.matches(':popover-open'))popup.hidePopover();popup.hidden=true;open();};footer.append(b);}
 function setup(){
  const row=$('#drawing-linetype-scale')?.closest('label');if(row&&!$('#line-scale-palette-link')){row.firstChild.textContent='Échelle du trait';const link=document.createElement('button');link.id='line-scale-palette-link';link.type='button';link.textContent='Aperçu et normalisation papier…';link.onclick=()=>open();row.after(link);}const original=$('#drawing-style-button');if(!original)return;const group=original.closest('.ribbon-group');if(!group)return;
  group.querySelector(':scope>small').textContent='Style des objets';const host=group.querySelector('.ribbon-tools');
  function button(id,label,svg,action){let b=$('#'+id);if(!b){b=document.createElement('button');b.id=id;b.type='button';b.innerHTML='<span class="ribbon-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">'+svg+'</svg></span><span class="tool-label">'+label+'</span>';b.title=label;b.onclick=action;}host.append(b);return b;}
  button('line-scale-tool','Échelle du trait','<path d="M3 7h18M3 17h18M7 4v6m10 4v6M3 12h3m3 0h6m3 0h3"/>',()=>open());
  button('document-line-scale-tool','Traits du dessin','<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M8 8h8m-8 4h3m2 0h3m-8 4h8"/>',()=>open('document'));
  const pip=$('#style-eyedropper-tool');if(pip){host.append(pip);pip.title='Pipette de style · choisir les paramètres à reprendre';pip.onclick=()=>window.showLineStyleTransfer145();}
  // Put the existing palette shortcut first, then scale and transfer actions.
  host.prepend(original);
  const fillGroup=document.getElementById('bucket-fill-zone')?.closest('.ribbon-group')?.querySelector('.ribbon-tools');for(const id of ['fillsettings','draw-shadow']){const b=document.getElementById(id);if(b&&fillGroup)fillGroup.append(b);}
  const legacy=document.getElementById('matchproperties');if(legacy){legacy.hidden=true;legacy.style.display='none';}
  window.RibbonFit?.fit();
 }
 const css=document.createElement('style');css.textContent='#line-scale-settings{width:min(500px,calc(100vw - 32px));max-height:calc(100vh - 32px);overflow:auto;box-sizing:border-box;padding:20px;border-radius:12px;background:var(--panel,#20313d);color:var(--text,#e6edf3);border:1px solid #658092}#line-scale-settings header,#line-scale-settings footer{display:flex;align-items:center;justify-content:space-between;gap:12px}#line-scale-settings h2{margin:0;font-size:20px}#line-scale-settings label{display:grid;grid-template-columns:1fr 170px;align-items:center;gap:12px;margin:12px 0}#line-scale-settings input,#line-scale-settings select{min-width:0;width:100%;box-sizing:border-box}#line-scale-settings section{border-top:1px solid #65809255;margin-top:12px}#line-scale-settings canvas{position:static!important;inset:auto!important;height:64px!important;pointer-events:none;display:block;width:100%;border:1px solid #65809266;border-radius:6px;margin-top:14px}#line-scale-settings output{display:block;font-size:12px;min-height:34px;margin:8px 0}#line-scale-settings footer{justify-content:flex-end}';css.textContent+='#line-scale-settings{overflow:hidden!important}#line-scale-settings form{display:flex;flex-direction:column;height:100%;max-height:calc(100dvh - 68px);min-height:0;margin:0}#line-scale-settings .line-scale-body{overflow:auto;min-height:0;flex:1;padding-right:4px}#line-scale-settings footer{position:static!important;flex-shrink:0;margin:8px 0 0!important}#line-scale-settings header{flex-shrink:0}#line-style-transfer{padding:20px;border:1px solid var(--border,#658092);border-radius:10px;color:var(--text);background:var(--panel)}';document.head.append(css);
 if(document.readyState==='complete')setup();else window.addEventListener('load',()=>setTimeout(setup,180),{once:true});
})();
