// 0.7.8 : images raster. Ctrl+V d'une image ou glisser-déposer PNG/JPG -> clic pour placer.
// Une image créée est un cadre LWPOLYLINE fermé (déplacer/copier/rotation/miroir/supprimer natifs) + drawing.image
// {src,name,px:[w,h],opacity}. Export : PNG dans <nom>_images/ + IMAGE/IMAGEDEF (chemin relatif).
// Import : IMAGE (bitmap si le fichier est trouvé, sinon cadre + nom), OLE2FRAME (cadre, conservé tel quel).
(()=>{
 const cache=new Map();
 function bitmap(src){if(!src)return null;let r=cache.get(src);if(!r){r={img:new Image(),ok:false,failed:false};r.img.onload=()=>{r.ok=true;drawOverlay();};r.img.onerror=()=>{r.failed=true;};r.img.src=src;cache.set(src,r);}return r;}
 window.imageBitmapCache=cache;
 let pending=null;
 const editable=()=>!!scene&&!busy&&!(document.activeElement&&(/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)||document.activeElement.isContentEditable));
 function load(file){if(!file||!/^image\/(png|jpe?g)$/i.test(file.type)){status('Image : seuls PNG et JPG sont acceptés.');return;}const fr=new FileReader();fr.onload=()=>{const src=String(fr.result),im=new Image();im.onload=()=>{pending={src,name:(file.name&&file.name!=='image.png'?file.name:'image-'+new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')+'.png').replace(/[^\w.\- ]+/g,'_'),px:[im.naturalWidth,im.naturalHeight]};cache.set(src,{img:im,ok:true});overlay.style.cursor='copy';status('Image '+pending.px.join(' × ')+' px · cliquez pour placer le coin inférieur gauche · Échap annule.');};im.onerror=()=>status('Image illisible.');im.src=src;};fr.readAsDataURL(file);}
 window.alcideLoadImage=load;
 document.addEventListener('paste',ev=>{if(!editable())return;const item=[...(ev.clipboardData?.items||[])].find(i=>i.kind==='file'&&/^image\//.test(i.type));if(!item)return;ev.preventDefault();ev.stopImmediatePropagation();load(item.getAsFile());},true);
 window.addEventListener('dragover',ev=>{if(scene&&[...(ev.dataTransfer?.items||[])].some(i=>i.kind==='file'&&/^image\/(png|jpe?g)$/i.test(i.type))){ev.preventDefault();ev.dataTransfer.dropEffect='copy';}},true);
 window.addEventListener('drop',ev=>{const f=[...(ev.dataTransfer?.files||[])].find(f=>/^image\/(png|jpe?g)$/i.test(f.type));if(!f||!scene)return;ev.preventDefault();ev.stopImmediatePropagation();load(f);},true);
 function place(at){const u=mm[$('#units').value]||1;let k=10/u;const [pw,ph]=pending.px,vw=overlay.clientWidth/view.s;if(pw*k>vw*.6)k=vw*.6/pw;const w=pw*k,h=ph*k,x=at[0],y=at[1];
  const before=snapshot();let id;window.arrowSuppressDefault=true;try{id=cadNewDrawing('LWPOLYLINE',[[x,y],[x+w,y],[x+w,y+h],[x,y+h]],{...(typeof drawingStyle==='function'?{layer:drawingStyle().layer}:{}),filled:false},true);}finally{window.arrowSuppressDefault=false;}
  edits[id].drawing.image={src:pending.src,name:pending.name,px:[pw,ph],opacity:1};edits[id].drawing.kind='image';selected=new Set([id]);commit(before);pending=null;overlay.style.cursor='';status('Image placée · déplacer, rotation, copier, supprimer · coin = redimensionner (proportions gardées) · Ctrl+Z annule.');}
 window.addEventListener('pointerdown',ev=>{if(!pending||ev.target!==overlay||ev.button!==0)return;ev.preventDefault();ev.stopImmediatePropagation();try{place(world(eventPoint(ev)));}catch(ex){status(ex.message);}},true);
 window.addEventListener('keydown',ev=>{if(pending&&ev.key==='Escape'){ev.preventDefault();ev.stopImmediatePropagation();pending=null;overlay.style.cursor='';status('Placement d’image annulé.');}},true);
 // coins de l'image
 const imageOf=e=>edits[e.id]?.drawing?.image||null;
 function corners(e){if(imageOf(e))return cadVertices(e);const m=e.image||e.ole;if(!m?.corners)return null;const dx=edits[e.id]?.dx||0,dy=edits[e.id]?.dy||0;return m.corners.map(p=>[p[0]+dx,p[1]+dy]);}
 window.imageCorners=corners;
 // proportions gardées au redimensionnement par un coin
 const cm=commit;commit=function(before,...rest){try{for(const [id,ed] of Object.entries(edits)){const im=ed?.drawing?.image;if(!im||ed.deleted)continue;const pts=(ed.geometry?.points||ed.drawing.points);if(pts.length!==4)continue;const old=im.corners;if(!old||old.length!==4){im.corners=structuredClone(pts);continue;}
   const moved=pts.map((p,i)=>Math.hypot(p[0]-old[i][0],p[1]-old[i][1])>1e-9);const n=moved.filter(Boolean).length;
   if(n===1){const k=moved.indexOf(true),o=(k+2)%4,O=old[o],D=[old[k][0]-O[0],old[k][1]-O[1]],L2=D[0]**2+D[1]**2,s=((pts[k][0]-O[0])*D[0]+(pts[k][1]-O[1])*D[1])/L2;if(s>1e-6){const np=old.map(p=>[O[0]+(p[0]-O[0])*s,O[1]+(p[1]-O[1])*s]);if(ed.geometry?.points)ed.geometry.points=np;else ed.drawing.points=np;refresh();}}
   im.corners=structuredClone(ed.geometry?.points||ed.drawing.points);}}catch(ex){console.warn(ex);}return cm.call(this,before,...rest);};
 // copie : garder l'image
 const copy=copySelection;copySelection=function(dx,dy,ids=[...selected]){const src=ids.filter(id=>edits[id]?.drawing&&!isLocked(entities.get(id))).map(id=>edits[id].drawing);const r=copy.apply(this,arguments);const copied=[...selected].filter(id=>edits[id]?.drawing&&!ids.includes(id));copied.forEach((id,i)=>{const o=src[i];if(o?.image&&!edits[id].drawing.image){edits[id].drawing.image=structuredClone({...o.image,corners:undefined});edits[id].drawing.kind='image';}});if(copied.length)refresh();return r;};
 // rendu (sous les autres tracés de l'overlay)
 const draw=drawOverlay;drawOverlay=function(...args){const r=draw.apply(this,args);if(!scene)return r;
  try{oc.save();oc.globalCompositeOperation='destination-over';
   for(const e of (window.overlayFeatureEntities?overlayFeatureEntities('images'):entities.values())){if(edits[e.id]?.deleted||e.layout&&scene.layout&&e.layout!==scene.layout)continue;const own=imageOf(e),meta=e.image||e.ole;if(!own&&!meta)continue;if(typeof visible==='function'&&!visible(e))continue;const P=corners(e);if(!P)continue;const S=P.map(p=>screen(p));
    const src=own?own.src:e.image?.path||e.ole?.preview,bm=src?bitmap(src):null,op=own?own.opacity??1:1;
    if(bm?.ok){const [pw,ph]=own?own.px:[bm.img.naturalWidth,bm.img.naturalHeight],a=(S[2][0]-S[3][0])/pw,b=(S[2][1]-S[3][1])/pw,c=(S[0][0]-S[3][0])/ph,d=(S[0][1]-S[3][1])/ph;oc.save();oc.globalAlpha=op;oc.setTransform(dpr*a,dpr*b,dpr*c,dpr*d,dpr*S[3][0],dpr*S[3][1]);oc.drawImage(bm.img,0,0);oc.restore();}
    else{oc.save();oc.strokeStyle='#9fb3c8';oc.setLineDash([6,4]);oc.beginPath();S.forEach((p,i)=>i?oc.lineTo(...p):oc.moveTo(...p));oc.closePath();oc.stroke();oc.beginPath();oc.moveTo(...S[0]);oc.lineTo(...S[2]);oc.moveTo(...S[1]);oc.lineTo(...S[3]);oc.globalAlpha=.4;oc.stroke();oc.globalAlpha=1;oc.fillStyle='#cfe3f5';oc.font='12px sans-serif';const cx=S.reduce((s,p)=>s+p[0],0)/4,cy=S.reduce((s,p)=>s+p[1],0)/4;const label=e.ole?'Objet OLE'+(e.ole.name?' · '+e.ole.name:''):(own?.name||e.image?.name||'Image')+(e.image&&!e.image.path?' (introuvable)':'');oc.textAlign='center';oc.fillText(label,cx,cy);oc.restore();}}
   oc.restore();}catch(ex){console.warn(ex);}return r;};
 // opacité dans Propriétés
 const row=document.createElement('div');row.id='image-opacity-row';row.className='row';row.innerHTML='<label>Opacité image <input id="image-opacity" type="range" min="10" max="100" step="5"> <span id="image-opacity-value"></span></label>';const R=row.querySelector('#image-opacity');
 R.addEventListener('change',()=>{const ids=[...selected].filter(id=>edits[id]?.drawing?.image);if(!ids.length)return;const before=snapshot();for(const id of ids)edits[id].drawing.image={...edits[id].drawing.image,opacity:Number(R.value)/100};commit(before);drawOverlay();status('Opacité de l’image : '+R.value+' % · Ctrl+Z annule.');});
 R.addEventListener('input',()=>{$('#image-opacity-value').textContent=R.value+' %';});
 setInterval(()=>{if(!scene)return;const ids=[...selected].filter(id=>edits[id]?.drawing?.image),host=[document.querySelector('#properties .selection-editor'),$('#drawing-style'),$('#properties'),$('#propertiespanel')].find(x=>x&&x.offsetParent);if(ids.length&&host){if(row.parentElement!==host)host.prepend(row);if(document.activeElement!==R){R.value=String(Math.round((edits[ids[0]].drawing.image.opacity??1)*100));$('#image-opacity-value').textContent=R.value+' %';}}else row.remove();},400);
})();
