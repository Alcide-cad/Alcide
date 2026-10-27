// Standard panel fractions; dimensions and area must both belong to this set.
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MeshFractions=api;})(globalThis,()=>{
 const units=[3,4,6,8,9,12],EPS=1e-6;
 const label=u=>({3:'1/4',4:'1/3',6:'1/2',8:'2/3',9:'3/4',12:'1'}[u]||null);
 function fraction(w,h,c){const x=units.find(u=>Math.abs(w-c.length*u/12)<.01),y=units.find(u=>Math.abs(h-c.width*u/12)<.01);return x&&y?label(x*y/12):null;}
 function axis(span,full,overlap,allowed,cost=u=>u){
  const valid=allowed.filter(u=>full*u/12<=span+EPS&&full*u/12>overlap+EPS);
  // One piece does not need an overlap.
  const single=allowed.find(u=>Math.abs(full*u/12-span)<EPS);
  const options=single?[{units:[single],starts:[0],cost:cost(single),sum:single}]:[];
  if(!valid.length)return options.sort((a,b)=>a.cost-b.cost)[0]||null;
  const max=full*Math.max(...valid)/12,base=Math.max(2,Math.ceil((span-max)/(max-overlap)-EPS)+1);
  if(base>1000)return null;
  for(let n=base;n<=Math.min(1000,base+2);n++){
   const target=(span+(n-1)*overlap)*12/full,limit=Math.ceil(target)+12;
   let dp=new Map([[0,{cost:0,prev:null,u:0}]]);
   for(let i=0;i<n;i++){
    const next=new Map();for(const [sum,node]of dp)for(const u of valid){const total=sum+u;if(total>limit||total+(n-i-1)*Math.max(...valid)<target-EPS)continue;const value=node.cost+cost(u),prior=next.get(total);if(!prior||value<prior.cost-EPS)next.set(total,{cost:value,prev:node,u});}dp=next;if(!dp.size)break;
   }
   for(const [sum,node]of dp){if(sum<target-EPS)continue;const parts=[];for(let p=node;p?.prev;p=p.prev)parts.push(p.u);parts.sort((a,b)=>b-a);let start=0;const starts=parts.map(u=>{const x=Math.min(start,span-full*u/12);start+=full*u/12-overlap;return Math.max(0,x);});options.push({units:parts,starts,cost:node.cost,sum});}
  }
  return options.sort((a,b)=>a.cost-b.cost||a.units.length-b.units.length||a.sum-b.sum)[0]||null;
 }
 // Start with the requested head piece, then whole compatible panels and one standard tail.
 function rowAxis(span,full,overlap,allowed,head=null){
  const valid=allowed.filter(u=>full*u/12<=span+EPS).sort((a,b)=>b-a);
  if(!valid.length)return null;
  const first=head??valid[0];if(!valid.includes(first))return null;
  const parts=[first],starts=[0];let end=full*first/12;
  while(end<span-EPS){
   if(parts.length>=1000)return null;
   const nextStart=end-overlap;if(nextStart<=starts.at(-1)+EPS)return null;
   const need=span-nextStart,tail=[...valid].reverse().find(u=>full*u/12>=need-EPS),u=tail??valid[0],length=full*u/12;
   if(length<=overlap+EPS)return null;
   const x=Math.min(nextStart,span-length);if(x<=starts.at(-1)+EPS)return null;
   parts.push(u);starts.push(x);end=x+length;
  }
  return {units:parts,starts,sum:parts.reduce((a,b)=>a+b,0)};
 }
 function layout(model,c){
  const zone=model.zone,xx=zone.map(p=>p[0]),yy=zone.map(p=>p[1]),lo=[Math.min(...xx),Math.min(...yy)],hi=[Math.max(...xx),Math.max(...yy)],width=hi[0]-lo[0],height=hi[1]-lo[1];
  let area=0;for(let i=0;i<zone.length;i++){const p=zone[i],q=zone[(i+1)%zone.length];area+=p[0]*q[1]-p[1]*q[0];if(Math.abs(p[0]-q[0])>EPS&&Math.abs(p[1]-q[1])>EPS)throw Error('Fractions TS : contour rectangulaire requis.');}
  if((model.holes||[]).length||Math.abs(Math.abs(area)/2-width*height)>.01)throw Error('Fractions TS : contour rectangulaire sans réservation requis.');
  if(model.gridOffsetX||model.gridOffsetY)throw Error('Fractions TS : décalez le contour ou remettez les décalages de grille à zéro.');
  const staggered=model.meshLayout==='staggered';
  if(staggered&&model.staggerOffset!=null&&Math.abs(model.staggerOffset-(c.length-model.overlapX)/2)>.01)throw Error('Quinconce en fractions simples : laissez le décalage des rangées automatique.');
  // Heights compatible with a half-length starter keep the area fractions standard too.
  const heights=(staggered&&height>=c.width/2-EPS?[6,8,12]:units).filter(y=>rowAxis(width,c.length,model.overlapX,units.filter(x=>label(x*y/12))));
  const ys=rowAxis(height,c.width,model.overlapY,heights);
  if(!ys)throw Error('Hauteur incompatible avec les fractions TS et le recouvrement Y saisi.');
  const panels=[];for(let j=0;j<ys.units.length;j++){
   const uy=ys.units[j],allowed=units.filter(x=>label(x*uy/12));
   const half=staggered&&j%2===1&&width>=c.length/2-EPS?6:null;
   const xs=rowAxis(width,c.length,model.overlapX,allowed,half);
   if(!xs)throw Error('Quinconce incompatible avec ces dimensions et le recouvrement X : adaptez la zone ou choisissez des rangées alignées.');
   for(let i=0;i<xs.units.length;i++){const ux=xs.units[i],x=lo[0]+xs.starts[i],y=lo[1]+ys.starts[j];panels.push({rect:[x,y,x+c.length*ux/12,y+c.width*uy/12],fraction:label(ux*uy/12)});}
  }
  if(panels.length>1000)throw Error('Plus de 1 000 panneaux : réduisez la zone.');return panels;
 }
 return {units,label,fraction,axis,rowAxis,layout};
});
