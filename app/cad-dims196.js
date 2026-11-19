// ALCIDE 1.0.96 · Cotes rayon, diamètre, angulaire, longueur d'arc (vraies DIMENSION / ARC_DIMENSION DXF, style de cote
// courant) et cotes en ligne de base (cotes ALCIDE linéaires empilées depuis un même point d'origine).
(()=>{
 const C=window.Cad196;
 function style(){const s=dimensionStyleDefaults();return s;}
 function dimLayer(){try{const v=readDimensionSettings()?.layer;if(v)return v;}catch{}return 'ALCIDE_COTES';}
 function fmt(v){const s=style();const x=v*(s.factor||1);return (Math.round(x*Math.pow(10,s.precision??1))/Math.pow(10,s.precision??1)).toString().replace('.',s.decimalComma?',':'.');}
 function curveAt(px){const e=pick(px);const cv=e&&C.curve(e);if(cv&&!isLocked(e))return {e,cv};const p=world(px),tol=8/view.s;let best=null,bd=tol;
  for(const x of query([p[0]-tol,p[1]-tol,p[0]+tol,p[1]+tol])){if(!visible(x)||isLocked(x))continue;const c=C.curve(x);if(!c)continue;const d=Math.abs(C.dist(p,c.center)-c.radius);if(d<=bd&&(c.full||C.onArc(c,C.ang(c.center,p)))){bd=d;best={e:x,cv:c};}}return best;}
 async function create(specs,msg){const before=snapshot();const full=specs.map(s=>({layer:dimLayer(),style:style(),...s}));const data=await C.engine({op:'make',specs:full},'Création de la cote…');const ids=C.addForeign(data,{meta:{kind:'dimension',specs:full}});selected=new Set(ids);commit(before);layersUI();status(msg+' · Ctrl+Z annule.');return ids;}
 // Rayon / diamètre
 function radial(kind){const title=kind==='radius'?'Cote de rayon':'Cote de diamètre';let target=null;
  C.start({name:kind==='radius'?'DIMRAYON':'DIMDIAMETRE',title,raw:false,prompt:()=>target?'placez le texte de la cote · Échap annule':'cliquez un cercle ou un arc',
   onClick:async (p,ev,px)=>{if(!target){const t=curveAt(px);if(!t){status(title+' : cliquez sur un cercle ou un arc.');return;}target=t;return;}const cv=target.cv;C.stop();await create([{kind,center:cv.center,radius:cv.radius,location:p}],(kind==='radius'?'Cote de rayon R':'Cote de diamètre Ø')+fmt(kind==='radius'?cv.radius:cv.radius*2)+' créée');},
   draw:c=>{if(!target||!c)return;const cv=target.cv,a=C.ang(cv.center,c),rim=[cv.center[0]+cv.radius*Math.cos(a),cv.center[1]+cv.radius*Math.sin(a)];if(kind==='radius')C.line(cv.center,c,'#9ccf79',[]);else C.line([cv.center[0]-cv.radius*Math.cos(a),cv.center[1]-cv.radius*Math.sin(a)],c,'#9ccf79',[]);C.label((kind==='radius'?'R':'Ø')+fmt(kind==='radius'?cv.radius:cv.radius*2),c);void rim;}});}
 // Angulaire : deux lignes, ou sommet + deux points.
 function angular(){let l1=null,l2=null,pts=[];const title='Cote angulaire';
  const lineAt=px=>{const e=pick(px);const s=C.nearestSegment(e,world(px));return s?{e,s}:null;};
  C.start({name:'DIMANGULAIRE',title,prompt:()=>l1?(l2?'placez l’arc de cote':'cliquez la seconde ligne'):pts.length===0?'cliquez la première ligne, ou un point vide pour le sommet':pts.length===1?'cliquez un point du premier côté':pts.length===2?'cliquez un point du second côté':'placez l’arc de cote',
   onClick:async (p,ev,px)=>{
    if(!l1&&!pts.length){const t=lineAt(px);if(t){l1=t;return;}pts.push(p);return;}
    if(l1&&!l2){const t=lineAt(px);if(!t||t.e.id===l1.e.id&&t.s===l1.s){status(title+' : cliquez une seconde ligne différente.');return;}const u=C.sub(l1.s[1],l1.s[0]),v=C.sub(t.s[1],t.s[0]);if(Math.abs(u[0]*v[1]-u[1]*v[0])<1e-9*Math.hypot(...u)*Math.hypot(...v)){status(title+' : les deux lignes sont parallèles.');return;}l2=t;return;}
    if(l1&&l2){C.stop();await create([{kind:'angular',line1:l1.s,line2:l2.s,location:p}],'Cote angulaire créée');return;}
    if(pts.length<3){pts.push(p);return;}
    C.stop();await create([{kind:'angular',center:pts[0],p1:pts[1],p2:pts[2],location:p}],'Cote angulaire créée');},
   draw:c=>{if(l1)C.line(...l1.s,'#9ccf79',[]);if(l2)C.line(...l2.s,'#9ccf79',[]);for(const q of pts.slice(1))C.line(pts[0],q,'#9ccf79',[4,3]);if(pts.length&&pts.length<3&&c)C.line(pts[0],c);if(c&&(l1&&l2||pts.length===3))C.label('Angle',c);}});}
 // Longueur d'arc
 function arcLength(){let target=null;const title='Cote de longueur d’arc';
  C.start({name:'DIMARC',title,prompt:()=>target?'placez la cote (distance à l’arc)':'cliquez un arc',
   onClick:async (p,ev,px)=>{if(!target){const t=curveAt(px);if(!t||t.cv.full){status(title+' : cliquez sur un arc (pas un cercle complet).');return;}target=t;return;}const cv=target.cv,d=Math.max(cv.radius*.05,Math.abs(C.dist(p,cv.center)-cv.radius));C.stop();await create([{kind:'arc',center:cv.center,radius:cv.radius,start:cv.start*180/Math.PI,end:cv.end*180/Math.PI,distance:d,location:p}],'Cote de longueur d’arc créée');},
   draw:c=>{if(!target||!c)return;const cv=target.cv;let span=cv.end-cv.start;while(span<0)span+=2*Math.PI;const r=Math.max(cv.radius*1.05,C.dist(c,cv.center));const q=screen(cv.center),rr=r*view.s;oc.save();oc.strokeStyle='#9ccf79';oc.lineWidth=1.5;oc.beginPath();const s0=screen([cv.center[0]+r*Math.cos(cv.start),cv.center[1]+r*Math.sin(cv.start)]);const a0=Math.atan2(s0[1]-q[1],s0[0]-q[0]),flip=screen([0,1])[1]<screen([0,0])[1];oc.arc(q[0],q[1],rr,a0,a0+(flip?-span:span),flip);oc.stroke();oc.restore();C.label('⌒ '+fmt(cv.radius*span),c);}});}
 // Ligne de base : origine commune, cotes empilées.
 function baseline(){let base=null,first=null,line=null,made=0,dir=null;const title='Cotes en ligne de base';
  const step=()=>{const s=style();return Math.max(s.height||2.5,1e-6)*(s.baselineFactor||2.6);};
  function chainFor(b,p,level){const s=style();const angle=dir==='h'?0:dir==='v'?90:Math.atan2(p[1]-b[1],p[0]-b[0])*180/Math.PI;const r=angle*Math.PI/180,n=[-Math.sin(r),Math.cos(r)];const offset=line.offset+level*step()*line.sign;const bp=[b[0]+n[0]*offset,b[1]+n[1]*offset];return {...s,id:'@chain-'+crypto.randomUUID(),anchors:[{id:'base',point:[...b]},{id:'end',point:[...p]}],basePoint:bp,axis:dir==='h'?'horizontal':dir==='v'?'vertical':'aligned',angle,layout:scene.layout,baseline196:true};}
  function place(p){const before=snapshot();const chain=chainFor(base,p,made);edits[chain.id]={chain};regenerateChain(chain);made++;selected=new Set([chain.id]);commit(before);}
  C.start({name:'DIMBASE',title,prompt:()=>!base?'cliquez le point d’origine commun':!first?'cliquez le deuxième point':!line?'placez la première ligne de cote':'cliquez le point suivant · Entrée ou clic droit termine',
   onClick:async p=>{if(!base){base=p;return;}if(!first){if(C.dist(p,base)<1e-9)return;first=p;dir=Math.abs(p[0]-base[0])>=Math.abs(p[1]-base[1])?'h':'v';return;}
    if(!line){const r=(dir==='h'?0:90)*Math.PI/180,n=[-Math.sin(r),Math.cos(r)];const o=(p[0]-base[0])*n[0]+(p[1]-base[1])*n[1];line={offset:o,sign:o<0?-1:1};place(first);return;}
    if(C.dist(p,base)<1e-9)return;place(p);},
   onEnter:()=>C.stop(made?made+' cote(s) en ligne de base créée(s) · Ctrl+Z annule.':'Cotes en ligne de base annulées.'),
   draw:c=>{if(!base)return;C.line(base,c||base);if(first&&!line&&c){C.line(first,c);C.label('Position des cotes',c);}else if(line&&c){C.label('Cote '+(made+1)+' · '+fmt(dir==='h'?Math.abs(c[0]-base[0]):Math.abs(c[1]-base[1])),c);}}});}
 const B=C.button,ic={
  r:'<circle cx="11" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M11 13l6-6" stroke="currentColor" stroke-width="1.6"/><path d="M14.5 6.5H17V9" fill="none" stroke="currentColor" stroke-width="1.4"/><text x="2" y="7" font-size="7" fill="currentColor" stroke="none">R</text>',
  d:'<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M6.3 17.7L17.7 6.3" stroke="currentColor" stroke-width="1.6"/><path d="M15 6.3h2.7V9M9 17.7H6.3V15" fill="none" stroke="currentColor" stroke-width="1.4"/>',
  a:'<path d="M4 20L20 20M4 20L15 6" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M13 20a9 9 0 0 0-2.5-6.5" fill="none" stroke="currentColor" stroke-width="1.4"/>',
  l:'<path d="M4 18a9 9 0 0 1 16 0" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3 12a10 10 0 0 1 18 0" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="2 2"/><text x="9" y="9" font-size="6" fill="currentColor" stroke="none">⌒</text>',
  b:'<path d="M4 4v16M4 8h16M4 13h11M4 18h6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M20 6v4M15 11v4M10 16v4" stroke="currentColor" stroke-width="1.2"/>'};
 const buttons=[
  B('dim-radius196','Rayon',ic.r,'Cote de rayon (DIMRAYON · alias DRA) · cliquez un cercle ou un arc puis placez le texte · vraie cote DXF/DWG',()=>radial('radius')),
  B('dim-diameter196','Diamètre',ic.d,'Cote de diamètre (DIMDIAMETRE · alias DDI) · cliquez un cercle ou un arc puis placez le texte',()=>radial('diameter')),
  B('dim-angular196','Angulaire',ic.a,'Cote angulaire (DIMANGULAIRE · alias DAN) · deux lignes, ou sommet + deux points, puis l’arc de cote',angular),
  B('dim-arc196','Longueur d’arc',ic.l,'Cote de longueur d’arc (DIMARC · alias DAR) · cliquez un arc puis la position',arcLength),
  B('dim-baseline196','Ligne de base',ic.b,'Cotes en ligne de base (DIMBASE · alias DBA) · origine commune, puis chaque point · cotes empilées et modifiables',baseline)];
 for(const b of buttons)C.register(b);
 C.group('ribbon-mesures','ribbon-group-dims196','Cotes CAO',buttons);C.sync();
 window.CadDims196={radial,angular,arcLength,baseline};
})();
