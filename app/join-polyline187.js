/* 1.0.87 · « Joindre en polyligne » (équivalent JOIN d'AutoCAD) dans le clic droit.
   Lignes, arcs et polylignes ouvertes qui se touchent bout à bout deviennent une seule polyligne (arcs conservés en bulges),
   fermée quand la chaîne se referme. Propriétés du premier objet. Une seule étape d'annulation. */
(()=>{
 const tau=Math.PI*2,mod=a=>(a%tau+tau)%tau,dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 function shift(e){const d=edits[e.id]||{};return p=>[p[0]+(d.dx||0),p[1]+(d.dy||0)];}
 function eligible(e){if(!e||isLocked(e)||e.rebar||e.annotation||e.dimension||e.dimensionChain||e.image||edits[e.id]?.deleted||edits[e.id]?.props?.fillOnly||edits[e.id]?.drawing?.cloud||edits[e.id]?.drawing?.image)return false;if(!['LINE','ARC','LWPOLYLINE'].includes(e.type))return false;if(e.type==='LWPOLYLINE'&&cadClosed(e))return false;try{return !!piece(e);}catch{return false;}}
 // Morceau ouvert : sommets + bulges (un par segment).
 function piece(e){const edit=edits[e.id]||{},move=shift(e);
  if(e.type==='LINE'){const ps=cadVertices(e);return ps.length===2&&dist(ps[0],ps[1])>1e-12?{pts:ps,bulges:[0]}:null;}
  if(e.type==='ARC'){let c,a,b;if(edit.drawing){[c,a,b]=(edit.geometry?.points||edit.drawing.points).map(move);}else if(e.nativeArc){const n=e.nativeArc,r=n.radius,s=n.startAngle*Math.PI/180,t=n.endAngle*Math.PI/180;c=move(n.center);a=[c[0]+r*Math.cos(s),c[1]+r*Math.sin(s)];b=[c[0]+r*Math.cos(t),c[1]+r*Math.sin(t)];}else return null;
   const r=dist(c,a),span=mod(Math.atan2(b[1]-c[1],b[0]-c[0])-Math.atan2(a[1]-c[1],a[0]-c[0]));if(!(r>0)||span<1e-9)return null;const end=[c[0]+r*Math.cos(Math.atan2(a[1]-c[1],a[0]-c[0])+span),c[1]+r*Math.sin(Math.atan2(a[1]-c[1],a[0]-c[0])+span)];return {pts:[a,end],bulges:[Math.tan(span/4)]};}
  let pts,bulges;if(edit.geometry?.points||edit.drawing){pts=(edit.geometry?.points||edit.drawing.points).map(move);bulges=edit.geometry?.bulges||edit.drawing?.bulges||[];}else{pts=(e.originalSnap||e.snap||[]).map(p=>[p[0],p[1]]).map(move);bulges=Array.isArray(e.shape?.[1])?e.shape[1].map(v=>+v[2]||0):[];}
  if(pts.length<2)return null;const out={pts:[pts[0]],bulges:[]};for(let i=1;i<pts.length;i++){if(dist(pts[i],out.pts.at(-1))<1e-12)continue;out.bulges.push(+bulges[i-1]||0);out.pts.push(pts[i]);}return out.pts.length>=2?out:null;}
 const reverse=p=>({pts:[...p.pts].reverse(),bulges:[...p.bulges].reverse().map(b=>-b)});
 function chains(list,tol){const left=[...list],result=[];while(left.length){const first=left.shift();let c={pts:[...first.p.pts],bulges:[...first.p.bulges]},members=[first],grown=true;
   while(grown&&!(members.length>1&&dist(c.pts[0],c.pts.at(-1))<=tol)){grown=false;for(let i=0;i<left.length;i++){const q=left[i].p,end=c.pts.at(-1),start=c.pts[0];let add=null,front=false;
     if(dist(end,q.pts[0])<=tol)add=q;else if(dist(end,q.pts.at(-1))<=tol)add=reverse(q);else if(dist(start,q.pts.at(-1))<=tol){add=q;front=true;}else if(dist(start,q.pts[0])<=tol){add=reverse(q);front=true;}
     if(!add)continue;if(front){c={pts:[...add.pts.slice(0,-1),...c.pts],bulges:[...add.bulges,...c.bulges]};}else{c={pts:[...c.pts,...add.pts.slice(1)],bulges:[...c.bulges,...add.bulges]};}members.push(left.splice(i,1)[0]);grown=true;break;}}
   const closed=members.length>1&&dist(c.pts[0],c.pts.at(-1))<=tol;if(closed)c.pts.pop();else c.bulges.push(0);result.push({...c,closed,members});}return result;}
 // 1.0.89 : nettoyage après jonction. Les sommets où se rejoignaient d'anciens traits alignés sont retirés (écart d'angle
 // ≤ 0,1° ou flèche ≤ tolérance, segments droits uniquement), ainsi que les points doublés : un carré fait de traits
 // morcelés donne 4 sommets. Les arcs (bulge ≠ 0) et les vrais angles ne sont jamais fusionnés.
 const SIN_TOL=Math.sin(0.1*Math.PI/180);
 function simplify(c,tol){let P=c.pts.map(p=>[p[0],p[1]]),B=c.bulges.slice(0,P.length).map(b=>+b||0);while(B.length<P.length)B.push(0);const closed=c.closed,straight=b=>Math.abs(b)<=1e-12;let changed=true;
  while(changed&&P.length>(closed?3:2)){changed=false;const n=P.length;
   for(let i=0;i<n&&P.length>(closed?3:2);i++){const m=P.length;if(i>=m)break;if(!closed&&(i===0||i===m-1))continue;const j=(i+1)%m,h=(i-1+m)%m;
    if(dist(P[i],P[j])<=tol&&(closed||j!==0)&&(j!==0||closed)){if(!closed&&j===m-1){P.splice(i,1);B.splice(i,1);}else{B[i]=B[j];P.splice(j,1);B.splice(j,1);}changed=true;break;}
    if(!straight(B[h])||!straight(B[i]))continue;const a=P[h],b=P[i],d=P[j],ux=b[0]-a[0],uy=b[1]-a[1],vx=d[0]-b[0],vy=d[1]-b[1],la=Math.hypot(ux,uy),lb=Math.hypot(vx,vy);
    if(la<=tol){P.splice(i,1);B.splice(i,1);changed=true;break;}
    const dot=ux*vx+uy*vy,cross=Math.abs(ux*vy-uy*vx),L=Math.hypot(d[0]-a[0],d[1]-a[1]),dev=L>0?cross/L:0;
    if(dot>0&&(cross<=SIN_TOL*la*lb||dev<=tol)){P.splice(i,1);B.splice(i,1);changed=true;break;}}}
  if(!closed){B=B.slice(0,P.length-1);B.push(0);}return {...c,pts:P,bulges:B};}
 function targets(){return [...selected].map(id=>entities.get(id)).filter(e=>e&&!edits[e.id]?.deleted);}
 function joinSelection(){if(!scene||busy)return 0;const all=targets(),ok=all.filter(eligible);if(ok.length<2){toast187('Joindre : sélectionnez au moins 2 lignes, arcs ou polylignes ouvertes.');return 0;}
  const ps=ok.map(e=>({e,p:piece(e)})),xs=ps.flatMap(m=>m.p.pts.map(p=>p[0])),ys=ps.flatMap(m=>m.p.pts.map(p=>p[1])),diag=Math.hypot(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys)),tol=Math.max(1e-6,diag*1e-6);
  const groups=chains(ps,tol).filter(c=>c.members.length>1).map(c=>simplify(c,tol));if(!groups.length){toast187('Aucun objet joint : leurs extrémités ne se touchent pas.');status('Joindre : aucune extrémité commune.');return 0;}
  const before=snapshot(),ids=[];let joined=0,closedCount=0;try{for(const c of groups){const first=c.members[0].e,props=cadProps(first),id=cadNewDrawing('LWPOLYLINE',c.pts,{...props,filled:false},c.closed);if(c.bulges.some(b=>Math.abs(b)>1e-12))edits[id].drawing.bulges=c.bulges.slice(0,c.pts.length);for(const m of c.members)edits[m.e.id]={...edits[m.e.id],deleted:true};ids.push(id);joined+=c.members.length;if(c.closed)closedCount++;}
   const kept=all.filter(e=>!groups.some(c=>c.members.some(m=>m.e.id===e.id))).map(e=>e.id);selected=new Set([...ids,...kept]);commit(before);layersUI();}catch(ex){restore(before);error(ex);return 0;}
  const skipped=all.length-joined,text=joined+' objets joints en '+ids.length+' polyligne'+(ids.length>1?'s':'')+(closedCount?' ('+closedCount+' fermée'+(closedCount>1?'s':'')+')':'')+(skipped?' · '+skipped+' non joint'+(skipped>1?'s':''):'')+'.';toast187(text);status(text+' Ctrl+Z pour annuler.');return joined;}
 window.JoinPolyline187={eligible,piece,chains,simplify,joinSelection};
 overlay.addEventListener('contextmenu',()=>queueMicrotask(addMenu));
 function addMenu(){const panel=$('#context-commands');if(!panel||!scene||busy||tool!=='select'||drawingMode||selected.size<2)return;
  const b=document.createElement('button');b.type='button';b.id='context-join187';const t=document.createElement('span');t.textContent='Joindre en polyligne';b.append(t);b.title='Fusionne les lignes, arcs et polylignes qui se touchent bout à bout';b.disabled=targets().filter(eligible).length<2;b.onclick=ev=>{ev.preventDefault();ev.stopPropagation();hideMenu();joinSelection();};
  const del=[...panel.children].find(n=>n.tagName==='BUTTON'&&n.textContent.trim().startsWith('Supprimer'));if(del)del.before(b);else panel.append(b);}
 if(typeof registerHelpTopic==='function')registerHelpTopic('Joindre en polyligne',[Object.assign(document.createElement('p'),{textContent:'Sélectionnez au moins deux lignes, arcs ou polylignes ouvertes, puis clic droit · Joindre en polyligne. Les objets qui se touchent bout à bout deviennent une polyligne (les arcs sont conservés), fermée si le contour se referme. Elle reprend le calque et les propriétés du premier objet. Les objets qui ne touchent pas la chaîne restent inchangés. Ctrl+Z annule en une fois.'})]);
})();
