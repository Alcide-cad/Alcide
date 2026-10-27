// Segments remain native dimensions for export; a chain has one public entity.
let continuingChainId=null;
function beginDimensionChain(d,position){
 if(layerSettings('ALCIDE_COTES')?.locked){status('Déverrouillez le calque ALCIDE_COTES pour coter.');return false;}
 const angle=d.angle??Math.atan2(d.b[1]-d.a[1],d.b[0]-d.a[0])*180/Math.PI;
 if(Math.abs((d.b[0]-d.a[0])*Math.cos(angle*Math.PI/180)+(d.b[1]-d.a[1])*Math.sin(angle*Math.PI/180))<1e-8){status('Choisissez deux points distincts dans la direction de cotation.');return false;}
 const chain={...d,id:'@chain-'+crypto.randomUUID(),angle,basePoint:d.basePoint||dimensionVertices(d)[2],anchors:[d.a,d.b].map(point=>({id:crypto.randomUUID(),point:[...point]}))};
 delete chain.a;delete chain.b;edits[chain.id]={chain};regenerateChain(chain);continuingChainId=chain.id;selected=new Set([chain.id]);
 return true;
}
function continueDimensionChain(point){
 const chain=edits[continuingChainId]?.chain;if(!chain||chain.layout!==scene?.layout||edits[chain.id]?.deleted)return false;
 const r=chain.angle*Math.PI/180,project=p=>p[0]*Math.cos(r)+p[1]*Math.sin(r);
 if(chain.anchors.some(a=>Math.abs(project(a.point)-project(point))<1e-8)){status('Ce point est déjà coté · choisissez un autre point.');return true;}
 if(isLocked(entities.get(chain.id))){status('La chaîne est sur un calque verrouillé.');return true;}
 const before=snapshot();delete chain.totalOf;chain.anchors.push({id:crypto.randomUUID(),point:[...point]});regenerateChain(chain);selected=new Set([chain.id]);commit(before);status('Point ajouté à la même chaîne · Échap pour terminer.');return true;
}
(()=>{
 const rebuild=rebuildTree;rebuildTree=function(){rebuild();if(!scene)return;
  const groups=new Map();for(const e of entities.values())if(e.dimension?.chainId){const id=e.dimension.chainId;if(!groups.has(id))groups.set(id,[]);groups.get(id).push(e);}
  for(const [id,members]of groups){const chain=edits[id]?.chain;if(!chain)continue;for(const e of members)entities.delete(e.id);const e={...members[0],id,dimensionChain:chain,dimensionMembers:members.map(m=>m.dimension),bounds:mergeBounds(members),snap:chain.anchors.map(a=>a.point),layer:edits[id]?.props?.layer||'ALCIDE_COTES',tags:{...members[0].tags,5:id,8:edits[id]?.props?.layer||'ALCIDE_COTES'}};entities.set(id,e);for(const member of members)if(selected.delete(member.id))selected.add(id);}
  if(groups.size)tree=buildTree([...items,...[...entities.values()].filter(e=>e.dimension)]);
 };
 const pickBase=pick;pick=function(p){const wp=world(p),radius=7/view.s;
  for(const e of [...entities.values()].reverse())if(e.dimensionChain&&visible(e))for(const d of e.dimensionMembers){const box=dimensionLabelBoxes.get(d.id);if(box&&p[0]>=box[0]&&p[0]<=box[2]&&p[1]>=box[1]&&p[1]<=box[3])return e;const [a,b,c,end]=dimensionVertices(d);if([[a,c],[b,end],[c,end]].some(([v,u])=>segmentDistance(wp,v,u)<radius))return e;}
  return pickBase(p);
 };
 const crosses=crossesSelection;crossesSelection=function(e,r){return e.dimensionChain?e.dimensionMembers.some(d=>crosses({...e,dimensionChain:null,dimension:d},r)):crosses(e,r);};
 const copy=copySelection;copySelection=function(dx,dy,ids=[...selected]){
  if(busy||!Number.isFinite(dx)||!Number.isFinite(dy))return;
  const chains=ids.map(id=>entities.get(id)).filter(e=>e?.dimensionChain&&!isLocked(e));if(!chains.length){copy(dx,dy,ids);return;}
  const before=snapshot(),depth=history.length;copy(dx,dy,ids.filter(id=>!entities.get(id)?.dimensionChain));history.splice(depth);const result=ids.some(id=>!entities.get(id)?.dimensionChain)?[...selected]:[];
  for(const e of chains){const chain=structuredClone(e.dimensionChain),prior=edits[e.id];chain.id='@chain-'+crypto.randomUUID();chain.basePoint=chain.basePoint.map((v,i)=>v+(i?dy:dx));chain.anchors.forEach(a=>{a.point=[a.point[0]+dx,a.point[1]+dy];});edits[chain.id]={chain,props:structuredClone(prior.props||{})};if(Object.hasOwn(changes,e.id))changes[chain.id]=changes[e.id];regenerateChain(chain);for(const d of dimensions.filter(d=>d.chainId===chain.id)){const old=e.dimensionMembers.find(m=>m.id.split(':').slice(1).join(':')===d.id.split(':').slice(1).join(':'));if(old?.textPosition)d.textPosition=[old.textPosition[0]+dx,old.textPosition[1]+dy];}result.push(chain.id);}
  selected=new Set(result);commit(before);layersUI();status(result.length+' objet(s) copiés · chaînes conservées.');
 };
 const set=setTool;setTool=function(t){continuingChainId=null;set(t);};
 document.addEventListener('keydown',ev=>{if(ev.key==='Escape')continuingChainId=null;});
 const params=dimensionParameters;dimensionParameters=function(e){const p=params(e);return e?.dimensionChain?{...p,chain:true}:p;};
 const textMove=window.startDimensionTextMove;window.startDimensionTextMove=function(){if([...selected].some(id=>entities.get(id)?.dimensionChain)){status('Pour déplacer un texte de la chaîne, choisissez son libellé puis sa nouvelle position.');chainTextMove=true;return;}textMove();};
 let chainTextMove=false,chosenLabel=null;
 overlay.addEventListener('pointerdown',ev=>{if(!chainTextMove||ev.button!==0||busy)return;ev.stopImmediatePropagation();const p=eventPoint(ev);if(!chosenLabel){for(const id of selected){const e=entities.get(id);if(!e?.dimensionChain)continue;for(const d of e.dimensionMembers){const b=dimensionLabelBoxes.get(d.id);if(b&&p[0]>=b[0]&&p[0]<=b[2]&&p[1]>=b[1]&&p[1]<=b[3]){chosenLabel=d.id;status('Cliquez la nouvelle position du texte.');return;}}}status('Cliquez le texte à déplacer dans la chaîne sélectionnée.');return;}const d=dimensions.find(d=>d.id===chosenLabel);if(d&&!isLocked(entities.get(d.chainId))){const before=snapshot();d.textPosition=world(p);commit(before);}chainTextMove=false;chosenLabel=null;},true);
 document.addEventListener('keydown',ev=>{if(ev.key==='Escape'){chainTextMove=false;chosenLabel=null;}});
})();
