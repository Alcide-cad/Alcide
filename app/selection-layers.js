(()=>{
 let selectionKey='';
 function mark(scroll=false){const names=new Set([...selected].map(id=>entities.get(id)?.layer).filter(Boolean));let first=null;for(const row of document.querySelectorAll('#layers .layer-card')){const on=names.has(row.dataset.layerName);row.classList.toggle('selection-layer',on);row.setAttribute('aria-current',on?'true':'false');if(on){row.title=row.dataset.layerName+' · calque de la sélection';const group=row.closest('details');if(scroll&&group)group.open=true;first??=row;}}
  if(scroll&&first?.hidden){$('#layerfilter').value='';$('#layerfilter').oninput?.();}
  if(scroll&&first&&!$('#layerpanel').hidden)first.scrollIntoView({block:'nearest'});
 }
 const render=layersUI;layersUI=function(){render();mark();};
 const update=propertiesUI;propertiesUI=function(){update();const key=activeId+'|'+[...selected].sort().map(id=>id+':'+entities.get(id)?.layer).join('|');if(key!==selectionKey){selectionKey=key;const layers=[...new Set([...selected].map(id=>entities.get(id)?.layer).filter(Boolean))];if(layers.length){layerFocus=layers[0];layersUI();mark(true);}else mark();}};
})();
