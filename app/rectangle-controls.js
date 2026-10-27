// Rectangle geometry stays rectangular, including after rotation and resizing.
let rectangleGrip=null;
const rectangleEditSides={w:0,h:0};
function rectangleDimensionPoints(r,key,value){const axis=key==='w'?r.u:r.v,origin=screen(r.ps[0]),end=screen(r.ps[0].map((n,i)=>n+axis[i])),vector=end.map((n,i)=>n-origin[i]),sign=(vector[0]>.0001||Math.abs(vector[0])<=.0001&&vector[1]<0)?1:-1,d=value-r[key],mode=rectangleEditSides[key];let start=mode===0?-d/2:mode===1?(sign>0?-d:0):(sign>0?0:-d);return rectanglePoints(r,key==='w'?start:0,key==='h'?start:0,key==='w'?start+value:r.w,key==='h'?start+value:r.h);}

function rectangleInfo(e){
 if(!e||e.type!=='LWPOLYLINE'||isLocked(e)||!cadClosed(e))return null;
 const ps=editableVertices(e);if(ps.length!==4)return null;
 const sub=(a,b)=>a.map((v,i)=>v-b[i]),u=sub(ps[1],ps[0]),v=sub(ps[3],ps[0]),w=Math.hypot(...u),h=Math.hypot(...v);
 if(w<1e-8||h<1e-8||Math.abs(u[0]*v[0]+u[1]*v[1])>w*h*1e-7||Math.hypot(...sub(ps[2],ps[1].map((n,i)=>n+v[i])))>Math.max(w,h)*1e-7)return null;
 return {ps,w,h,u:u.map(n=>n/w),v:v.map(n=>n/h),delta:[edits[e.id]?.dx||0,edits[e.id]?.dy||0]};
}
function rectangleStep(){return 5/(mm[$('#units').value]||10);}
function rectanglePoints(r,x0,y0,x1,y1){return [[x0,y0],[x1,y0],[x1,y1],[x0,y1]].map(([x,y])=>r.ps[0].map((n,i)=>n+x*r.u[i]+y*r.v[i]));}
function rectangleHandles(r){return r.ps.flatMap((p,i)=>[p,p.map((n,j)=>(n+r.ps[(i+1)%4][j])/2)]);}
function rectangleResize(r,index,point){
 const q=point.map((n,i)=>n-r.delta[i]-r.ps[0][i]),x=q[0]*r.u[0]+q[1]*r.u[1],y=q[0]*r.v[0]+q[1]*r.v[1],step=rectangleStep(),round=n=>Math.max(step,Math.round(n/step)*step);
 let x0=0,y0=0,x1=r.w,y1=r.h;
 if([0,6,7].includes(index))x0=r.w-round(r.w-x);
 if([2,3,4].includes(index))x1=round(x);
 if([0,1,2].includes(index))y0=r.h-round(r.h-y);
 if([4,5,6].includes(index))y1=round(y);
 return rectanglePoints(r,x0,y0,x1,y1);
}
function saveRectangle(e,ps,before){edits[e.id]={...edits[e.id],geometry:{points:ps,closed:true}};delete edits[e.id].rotation;commit(before);status('Rectangle modifié · pas 0,5 cm · Ctrl+Z pour annuler.');}
(()=>{
 const rotate=canRotateGrip;canRotateGrip=function(e){return !!rectangleInfo(e)||rotate(e);};
 const pivot=gripRotationPivot;gripRotationPivot=function(e){const r=rectangleInfo(e);return r?r.ps[0].map((n,i)=>(n+r.ps[2][i])/2):pivot(e);};
 const apply=applyGripRotation;applyGripRotation=function(e,angle){const r=rectangleInfo(e);if(!r)return apply(e,angle);edits[e.id]={...edits[e.id],geometry:{points:r.ps.map(p=>gripRotatePoint(p,gripRotationPivot(e),angle)),closed:true}};};
 const set=setTool;setTool=function(...args){rectangleGrip=null;return set(...args);};
 document.addEventListener('pointerdown',ev=>{
  if(ev.target!==overlay||ev.button!==0||ev.altKey||busy)return;
  if(rectangleGrip){ev.stopImmediatePropagation();ev.preventDefault();const g=rectangleGrip;rectangleGrip=null;const e=entities.get(g.id);if(e&&g.doc===activeId)saveRectangle(e,rectangleResize(g.r,g.index,snap(eventPoint(ev))),g.before);return;}
  if(tool!=='select'||selected.size!==1||activeGrip||rotationGrip)return;
  const e=entities.get([...selected][0]),r=rectangleInfo(e);if(!r)return;
  const p=eventPoint(ev),index=rectangleHandles(r).findIndex(v=>{const q=screen(v.map((n,i)=>n+r.delta[i]));return Math.hypot(p[0]-q[0],p[1]-q[1])<8;});if(index<0)return;
  ev.preventDefault();ev.stopImmediatePropagation();rectangleGrip={id:e.id,doc:activeId,r,index,before:snapshot(),start:p,point:snap(p)};
  status('Redimensionner le rectangle · pas 0,5 cm · cliquez pour déposer · Échap annule.');drawOverlay();
 },true);
 document.addEventListener('pointermove',ev=>{if(!rectangleGrip||ev.target!==overlay)return;ev.stopImmediatePropagation();rectangleGrip.point=snap(eventPoint(ev));drawOverlay();},true);
 document.addEventListener('pointerup',ev=>{if(!rectangleGrip||ev.target!==overlay)return;ev.stopImmediatePropagation();const g=rectangleGrip;if(Math.hypot(...eventPoint(ev).map((n,i)=>n-g.start[i]))>4){rectangleGrip=null;const e=entities.get(g.id);if(e&&activeId===g.doc)saveRectangle(e,rectangleResize(g.r,g.index,g.point),g.before);}},true);
 document.addEventListener('keydown',ev=>{if(ev.key==='Escape'){rectangleGrip=null;drawOverlay();}});
 const draw=drawOverlay;drawOverlay=function(){draw();const e=tool==='select'&&selected.size===1?entities.get([...selected][0]):null,r=rectangleInfo(e);let controls=$('#quick-rectangle-size');
  if(!r){controls?.remove();return;}
  if(!controls){controls=document.createElement('span');controls.id='quick-rectangle-size';controls.className='rectangle-object-controls';controls.setAttribute('aria-label','Dimensions du rectangle sélectionné');Object.assign(controls.style,{position:'absolute',inset:'0',pointerEvents:'none',zIndex:'5'});for(const [key,label]of [['w','Largeur'],['h','Hauteur']]){const row=document.createElement('label');row.title=label+' en cm';row.setAttribute('aria-label',label+' en cm');row.dataset.axis=key;Object.assign(row.style,{position:'absolute',display:'flex',alignItems:'center',gap:'2px',padding:'2px',border:'1px solid #66b3ff',borderRadius:'7px',background:'#1c2b36',boxShadow:'0 2px 8px #0009',pointerEvents:'auto',whiteSpace:'nowrap',fontSize:'12px'});const input=document.createElement('input');input.type='text';input.inputMode='decimal';input.step='0.5';input.min='0.5';input.id='quick-rectangle-'+key;input.style.cssText='width:62px;height:26px;min-height:0;padding:2px 5px;font-size:12px';input.onchange=()=>{const current=entities.get([...selected][0]),info=rectangleInfo(current),cm=cadNumeric(input.value);if(!info||!Number.isFinite(cm)||cm<=0){drawOverlay();return;}const value=Math.max(.5,Math.round(cm*2)/2)*10/(mm[$('#units').value]||10);saveRectangle(current,rectangleDimensionPoints(info,key,value),snapshot());};const arrows=[document.createElement('button'),document.createElement('button')];for(const [i,arrow]of arrows.entries()){arrow.type='button';arrow.id='rectangle-side-'+key+'-'+i;arrow.textContent=key==='w'?(i?'→':'←'):(i?'↑':'↓');arrow.style.cssText='width:26px;height:26px;min-width:0;min-height:0;padding:0;font-size:16px';arrow.onpointerdown=ev=>ev.preventDefault();arrow.onclick=ev=>{ev.preventDefault();rectangleEditSides[key]=(rectangleEditSides[key]+1)%3;drawOverlay();};}input.onkeydown=ev=>{if(ev.key==='Enter'){ev.preventDefault();ev.stopPropagation();input.onchange();input.blur();}};arrows[1].hidden=true;row.append(input,arrows[0],arrows[1]);controls.append(row);}$('#workspace').append(controls);}
  for(const key of ['w','h']){for(let i=0;i<2;i++){const arrow=$('#rectangle-side-'+key+'-'+i),active=rectangleEditSides[key]===0||rectangleEditSides[key]===i+1;if(i===0){arrow.style.width='32px';arrow.innerHTML=[0,1].map(j=>'<span style="color:'+(rectangleEditSides[key]===0||rectangleEditSides[key]===j+1?'#b2e58a':'#63717c')+'">'+(key==='w'?(j?'→':'←'):(j?'↑':'↓'))+'</span>').join('');}arrow.setAttribute('aria-pressed',String(active));arrow.style.opacity='1';arrow.style.color=active?'#b2e58a':'';arrow.title=(key==='w'?'Largeur':'Hauteur')+' : '+(rectangleEditSides[key]===0?'centré':rectangleEditSides[key]===1?(key==='w'?'vers la gauche':'vers le bas'):(key==='w'?'vers la droite':'vers le haut'))+' · cliquer pour changer';}const input=$('#quick-rectangle-'+key);if(document.activeElement!==input)input.value=String(Number((r[key]*(mm[$('#units').value]||10)/10).toFixed(6)));}
  const corners=r.ps.map(v=>screen(v.map((n,i)=>n+r.delta[i]))),mid=i=>corners[i].map((n,j)=>(n+corners[(i+1)%4][j])/2),bottom=[mid(0),mid(2)].sort((a,b)=>b[1]-a[1])[0],right=[mid(1),mid(3)].sort((a,b)=>b[0]-a[0])[0];
  for(const key of ['w','h']){const row=controls.querySelector('[data-axis="'+key+'"]'),width=row.offsetWidth,height=row.offsetHeight,point=key==='w'?[bottom[0]-width/2,bottom[1]+18]:[right[0]+18,right[1]-height/2];row.style.left=Math.max(4,Math.min(w-width-4,point[0]))+'px';row.style.top=Math.max(4,Math.min(h-height-4,point[1]))+'px';}
  oc.save();oc.fillStyle='#163854';oc.strokeStyle='#77bdff';for(const v of rectangleHandles(r)){const p=screen(v.map((n,i)=>n+r.delta[i]));oc.fillRect(p[0]-4,p[1]-4,8,8);oc.strokeRect(p[0]-4,p[1]-4,8,8);}
  if(rectangleGrip){const ps=rectangleResize(rectangleGrip.r,rectangleGrip.index,rectangleGrip.point);oc.strokeStyle='#ffc978';oc.beginPath();[...ps,ps[0]].forEach((v,i)=>{const p=screen(v.map((n,j)=>n+rectangleGrip.r.delta[j]));i?oc.lineTo(...p):oc.moveTo(...p);});oc.stroke();}oc.restore();
 };
})();
