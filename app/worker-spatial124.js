// Index exact des boîtes : aucune simplification de géométrie ni de sélection.
function graphicsIndex124(values){
 const build=rows=>{
  if(!rows.length)return null;
  const bounds=[Infinity,Infinity,-Infinity,-Infinity];
  for(const e of rows)for(let i=0;i<4;i++)bounds[i]=i<2?Math.min(bounds[i],e.bounds[i]):Math.max(bounds[i],e.bounds[i]);
  if(rows.length<=24)return {bounds,rows};
  const axis=bounds[2]-bounds[0]>=bounds[3]-bounds[1]?0:1;
  rows.sort((a,b)=>(a.bounds[axis]+a.bounds[axis+2])-(b.bounds[axis]+b.bounds[axis+2]));
  const mid=rows.length>>1;return {bounds,left:build(rows.slice(0,mid)),right:build(rows.slice(mid))};
 };
 const rows=[...values],finite=rows.filter(e=>e.bounds?.length===4&&e.bounds.every(Number.isFinite));return {tree:build(finite),other:rows.filter(e=>!e.bounds?.every(Number.isFinite))};
}
function graphicsQuery124(root,bounds,stats){
 const result=(root?.other||[]).filter(e=>e.bounds&&intersect(e.bounds,bounds)),stack=root?.tree?[root.tree]:[];stats.visited=0;
 while(stack.length){const node=stack.pop();stats.visited++;if(!intersect(node.bounds,bounds))continue;
  if(node.rows){for(const e of node.rows)if(intersect(e.bounds,bounds))result.push(e);}
  else{stack.push(node.right,node.left);}
 }
 return result;
}
