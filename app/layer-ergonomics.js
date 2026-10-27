// Global visibility is independent of the search and of grouping checkboxes.
const layerVisibilityRestore=new Map();
function allLayerNames(){return [...new Set([...layerData.map(l=>l.name),...[...entities.values()].map(e=>baseLayer(e.layer)?.name||e.layer)])];}
function changeAllLayerVisibility(show,only=null){
 if(!scene||busy)return;const names=allLayerNames(),wanted=name=>only?only.has(name):show;
 if(!names.some(name=>layerVisible(name)!==wanted(name)))return;
 const before=snapshot();if(!layerVisibilityRestore.has(activeId))layerVisibilityRestore.set(activeId,{hidden:[...hiddenLayers],visible:Object.fromEntries(names.map(name=>[name,layerPatch(name)?.visible]))});
 for(const name of names){const visible=wanted(name);setLayerPatch(name,{visible});visible?hiddenLayers.delete(name):hiddenLayers.add(name);}
 commit(before,false);layersUI();status(only?'Calques isolés · Rétablir pour retrouver la visibilité précédente.':show?'Tous les calques affichés.':'Tous les calques masqués · utilisez un œil, Tout afficher ou Rétablir.');
}
(()=>{
 const pane=$('#layerpanel'),filter=$('#layerfilter'),actions=$('#layerall').parentElement,section=filter.closest('section');
 const toolbar=document.createElement('div');toolbar.className='layer-tools';filter.before(toolbar);toolbar.append(filter,actions);actions.className='layer-visibility-actions';
 const hide=document.createElement('button');hide.id='layerhideall';hide.textContent='Tout masquer';hide.title='Masquer tous les calques du dessin, même ceux absents des résultats de recherche';hide.onclick=()=>changeAllLayerVisibility(false);$('#layerall').after(hide);
 const restore=document.createElement('button');restore.id='layerrestorevisibility';restore.textContent='Rétablir';restore.title='Retrouver la visibilité précédant le masquage global ou l’isolation';restore.onclick=()=>{const prior=layerVisibilityRestore.get(activeId);if(!prior||!scene||busy)return;const before=snapshot();hiddenLayers=new Set(prior.hidden);for(const name of allLayerNames()){const patch=layerPatch(name);if(patch){const next={...patch};if(Object.hasOwn(prior.visible,name)&&prior.visible[name]!==undefined)next.visible=prior.visible[name];else delete next.visible;Object.defineProperty(layerChanges,name,{value:next,enumerable:true,writable:true,configurable:true});}}layerVisibilityRestore.delete(activeId);commit(before,false);layersUI();status('Visibilité précédente rétablie · Ctrl+Z pour annuler.');};actions.append(restore);
 const info=document.createElement('small');info.id='layervisibilityinfo';info.className='muted';info.setAttribute('role','status');toolbar.append(info);
 $('#layerall').title='Afficher tous les calques du dessin, même ceux absents des résultats de recherche';$('#layerall').onclick=()=>changeAllLayerVisibility(true);
 $('#layerisolate').title='Isoler les calques cochés, sinon ceux des objets sélectionnés, sinon le calque actif';$('#layerisolate').onclick=()=>{if(!scene||busy)return;const names=groupedLayerSelection.size?new Set(groupedLayerSelection):new Set([...selected].map(id=>entities.get(id)?.layer).filter(Boolean));if(!names.size&&layerFocus)names.add(layerFocus);if(!names.size){status('Cochez des calques ou sélectionnez des objets à isoler.');return;}changeAllLayerVisibility(false,names);};
 $('#layerfromselection').textContent='Repérer';$('#layerfromselection').title='Retrouver le calque de l’objet sélectionné';
 const grouping=$('.layer-grouping'),fold=document.createElement('details');fold.id='layergroupingfold';fold.className='layer-grouping-fold';const summary=document.createElement('summary');summary.textContent='Groupes';grouping.before(fold);fold.append(summary,grouping);fold.open=localStorage.getItem('layerGroupingExpanded')==='true';fold.addEventListener('toggle',()=>localStorage.setItem('layerGroupingExpanded',String(fold.open)));
 $('#selectfilteredlayers').textContent='Cocher les résultats';$('#selectfilteredlayers').title='Choisir pour le regroupement les calques correspondant à la recherche';$('#clearlayerselection').textContent='Décocher tout';
 const guide=$('.layer-column-guide');guide.textContent='Case : choisir · Œil : visibilité · Cadenas : verrouillage';section.querySelector('h2').hidden=true;
 function sync(){const names=allLayerNames(),shown=names.filter(layerVisible).length,found=[...document.querySelectorAll('#layers .layer-card')].filter(row=>!row.hidden).length;info.textContent=!scene?'Ouvrez un dessin':`${shown} / ${names.length} calques visibles`+(filter.value?` · ${found} résultats`:'');hide.disabled=busy||!scene||shown===0;$('#layerall').disabled=busy||!scene||shown===names.length;restore.hidden=!layerVisibilityRestore.has(activeId);restore.disabled=busy||!scene;$('#layerisolate').disabled=busy||!scene||!(groupedLayerSelection.size||selected.size||layerFocus);$('#layerfromselection').disabled=busy||!selected.size;summary.textContent='Groupes'+(groupedLayerSelection.size?' · '+groupedLayerSelection.size+' choisis':'');}
 let chosenCount=0;
 const render=layersUI;layersUI=function(){const top=pane.scrollTop;render();sync();chosenCount=groupedLayerSelection.size;pane.scrollTop=top;};
 const controls=syncLayerControls;syncLayerControls=function(){controls();sync();};
 const search=filter.oninput;filter.oninput=ev=>{search(ev);sync();};
 $('#layers').addEventListener('change',ev=>{if(ev.target.classList.contains('layer-group-select')){sync();}});
 $('#layers').addEventListener('contextmenu',()=>queueMicrotask(sync));
 // Keep both global visibility actions available from the existing context menu.
 const menu=$('#layercontextmenu');
 $('#layers').addEventListener('contextmenu',()=>{if(menu.hidden)return;const show=[...menu.querySelectorAll('button')].find(b=>b.textContent==='Tout afficher');if(show){const b=document.createElement('button');b.textContent='Tout masquer';b.setAttribute('role','menuitem');b.onclick=()=>{menu.hidden=true;hide.click();};show.after(b);const rect=menu.getBoundingClientRect();menu.style.top=Math.max(4,Math.min(parseFloat(menu.style.top),innerHeight-rect.height-4))+'px';}});
 layersUI();
})();

