// Exact plans first; the preview never writes model data.
(()=>{
 let pending=null;
 const distance=(a,b)=>Math.hypot(b[0]-a[0],b[1]-a[1]);
 function supports(e){if(e.type!=='ARC')return null;const ps=cadVertices(e),c=ps[0],r=distance(c,ps[1]),ends=ps.slice(1),matches=ends.map(end=>[...entities.values()].filter(line=>line.type==='LINE'&&visible(line)).flatMap(line=>{const points=cadVertices(line),index=points.findIndex(p=>distance(p,end)<Math.max(1e-6,r*1e-7));if(index<0)return [];const far=points[1-index],v=far.map((n,i)=>n-end[i]),rad=end.map((n,i)=>n-c[i]),length=Math.hypot(...v);return length&&Math.abs(v[0]*rad[0]+v[1]*rad[1])/(length*r)<1e-5?[{e:line,point:far}]:[];}));return matches.every(x=>x.length===1)&&matches[0][0].e.id!==matches[1][0].e.id?matches.map(x=>x[0]):null;}
 function plan(id,field,value){const e=entities.get(id),m=SelectionMeasurements.measure(e);if(!e||!m||isLocked(e)||busy)throw Error('Choisissez une géométrie déverrouillée.');if(!Number.isFinite(value)||field!=='angle'&&value<=0)throw Error('Saisissez une valeur positive.');let points;
  if(e.type==='LINE'){const ps=cadVertices(e),a=ps[0],b=ps[1],angle=field==='angle'?value*Math.PI/180:Math.atan2(b[1]-a[1],b[0]-a[0]),length=field==='length'?value:m.length;points=[a,[a[0]+length*Math.cos(angle),a[1]+length*Math.sin(angle)]];}
  else if(['CIRCLE','ARC'].includes(e.type)){const ps=e.type==='CIRCLE'?cadCirclePoints(e):cadVertices(e),c=ps[0],r=field==='radius'?value:field==='diameter'?value/2:field==='length'?value/(m.sweepDegrees===undefined?Math.PI*2:m.sweepDegrees*Math.PI/180):m.radius;
   if(!(r>0))throw Error('Rayon positif requis.');if(field==='angle'){if(e.type!=='ARC'||value<=0||value>=360)throw Error('L’angle de l’arc doit être entre 0 et 360°.');const a=Math.atan2(ps[1][1]-c[1],ps[1][0]-c[0])+value*Math.PI/180;points=[c,ps[1],[c[0]+r*Math.cos(a),c[1]+r*Math.sin(a)]];}else points=[c,...ps.slice(1).map(p=>p.map((v,i)=>c[i]+(v-c[i])*r/m.radius))];
  }else if(e.type==='LWPOLYLINE'&&field==='length'){if(e.shape?.[1]?.some?.(p=>p[2])||edits[id]?.geometry?.bulges?.some(Boolean))throw Error('Le périmètre des contours courbes est consultable ; modifiez leurs arcs séparément.');if(!m.length)throw Error('Périmètre nul.');return {id,field,value,factor:value/m.length,pivot:cadVertices(e)[0],doc:activeId,token:saveToken};}
  else throw Error('Ce réglage n’est pas disponible pour cet objet.');
  let linked;const pair=supports(e);if(pair){if(field==='angle')throw Error('Cet arrondi reste tangent : modifiez ses supports pour changer l’angle.');if(pair.some(p=>isLocked(p.e)))throw Error('Une ligne support de l’arrondi est verrouillée.');const radius=distance(points[0],points[1]),corner=coreCorner(pair[0],pair[1],radius);points=corner.points;linked=pair.map((p,i)=>({id:p.e.id,points:i?[corner.end2,corner.q]:[corner.end1,corner.p]}));}
  if(points.some(p=>!p.every(Number.isFinite)))throw Error('Valeur trop grande.');return {id,field,value,points,linked,closed:cadClosed(e),doc:activeId,token:saveToken};
 }
 function apply(p=pending){if(!p||p.doc!==activeId||p.token!==saveToken||!selected.has(p.id))throw Error('La sélection a changé : refaites l’aperçu.');const e=entities.get(p.id);if(isLocked(e))throw Error('Objet verrouillé.');pending=null;
  if(p.factor){scaleObjects([p.id],p.pivot,p.factor);return;}
  if(e.type==='CIRCLE'){CircleSize.set(p.id,distance(...p.points));return;}
  if(p.linked?.some(x=>!entities.has(x.id)||isLocked(entities.get(x.id))))throw Error('Un support est indisponible ou verrouillé.');
  const before=snapshot();for(const x of p.linked||[])cadWriteGeometry(entities.get(x.id),x.points,false);cadWriteGeometry(e,p.points,p.closed);commit(before);status('Géométrie modifiée · remplissages liés actualisés · Ctrl+Z annule.');
 }
 function preview(id,field,value){pending=plan(id,field,value);drawOverlay();return pending;}
 function cancel(){pending=null;drawOverlay();}
 function render(){const card=$('#selection-measurements');if(!card||selected.size!==1)return;const id=[...selected][0],e=entities.get(id),m=SelectionMeasurements.measure(e);if(!m||!['LINE','CIRCLE','ARC','LWPOLYLINE'].includes(e.type))return;
  // One editable control per value; retire the former immediate radius controls.
  for(const row of card.querySelectorAll('.selection-measurement-row'))row.remove();
  const root=document.createElement('div');root.id='geometry09-editor';const title=document.createElement('strong');title.textContent='Aperçu avant modification';root.append(title);
  const fields=[['length',e.type==='CIRCLE'?'Circonférence':e.type==='LWPOLYLINE'?'Périmètre':'Longueur',m.length]];
  if(m.radius)fields.push(['radius','Rayon',m.radius],['diameter','Diamètre',m.diameter]);
  if(e.type==='LINE'){const ps=cadVertices(e);fields.push(['angle','Orientation (°)',Math.atan2(ps[1][1]-ps[0][1],ps[1][0]-ps[0][0])*180/Math.PI]);}
  if(e.type==='ARC')fields.push(['angle','Angle de l’arc (°)',m.sweepDegrees]);
  const tangent=!!supports(e),curved=e.type==='LWPOLYLINE'&&(e.shape?.[1]?.some?.(p=>p[2])||edits[id]?.geometry?.bulges?.some(Boolean));let field=fields[0][0];const message=document.createElement('p');message.setAttribute('role','status');
  const show=()=>{try{const input=root.querySelector('[data-field="'+field+'"]');preview(id,field,cadNumeric(input.value));message.textContent='Aperçu prêt · Appliquer pour modifier.';}catch(e){pending=null;message.textContent=e.message;drawOverlay();}};
  for(const [key,label,value]of fields){const row=document.createElement('label'),input=document.createElement('input');input.type='text';input.inputMode='decimal';input.dataset.field=key;input.value=String(Number(value.toFixed(6)));input.setAttribute('aria-label',label);input.disabled=isLocked(e)||!!curved||key==='angle'&&tangent;if(curved)input.title='Périmètre consultable : modifiez les arcs séparément.';if(key==='angle'&&tangent)input.title='Angle imposé par les deux supports tangents.';input.onfocus=()=>{field=key;};input.oninput=()=>{field=key;pending=null;message.textContent='Aperçu puis Appliquer pour valider.';};input.onkeydown=ev=>{if(ev.key==='Enter'){ev.preventDefault();ev.stopImmediatePropagation();show();}};row.append(document.createTextNode(label+(key!=='angle'?' ('+$('#units').value+')':'')),input);root.append(row);}
  const actions=document.createElement('div');actions.className='v09-toolbar';for(const [text,fn]of [['Aperçu',show],['Appliquer',()=>{try{if(!pending)show();if(pending)apply();}catch(e){message.textContent=e.message;}}],['Annuler',cancel]]){const b=document.createElement('button');b.textContent=text;b.onclick=fn;actions.append(b);}root.append(actions,message);card.append(root);
 }
 const props=propertiesUI;propertiesUI=function(...a){const r=props(...a);render();return r;};
 const draw=drawOverlay;drawOverlay=function(...a){const r=draw(...a);if(!pending)return r;if(pending.doc!==activeId||pending.token!==saveToken||!selected.has(pending.id)){pending=null;return r;}const e=entities.get(pending.id),ps=pending.points||cadVertices(e).map(p=>p.map((v,i)=>pending.pivot[i]+(v-pending.pivot[i])*pending.factor));oc.save();oc.strokeStyle='#ffc978';oc.lineWidth=2;oc.setLineDash([6,4]);oc.beginPath();if(e.type==='CIRCLE'||e.type==='ARC'){const [c,a,b]=ps,radius=distance(c,a),start=Math.atan2(a[1]-c[1],a[0]-c[0]),sweep=b?((Math.atan2(b[1]-c[1],b[0]-c[0])-start+Math.PI*2)%(Math.PI*2)):Math.PI*2;for(let i=0;i<=80;i++){const q=screen([c[0]+radius*Math.cos(start+sweep*i/80),c[1]+radius*Math.sin(start+sweep*i/80)]);i?oc.lineTo(...q):oc.moveTo(...q);}}else{ps.forEach((p,i)=>i?oc.lineTo(...screen(p)):oc.moveTo(...screen(p)));if(cadClosed(e))oc.closePath();}oc.stroke();oc.restore();return r;};
 window.addEventListener('keydown',ev=>{if(pending&&ev.key==='Escape'){ev.preventDefault();ev.stopImmediatePropagation();cancel();}},true);
 window.Geometry09={plan,preview,apply,cancel,supports,state:()=>pending};
})();
