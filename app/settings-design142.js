(()=>{
 const roots='#propertiespanel,#layerpanel,#rebar-dialog,#beam100-panel,#lintel100-panel,#column100-panel,#rebar-style136,#steel-inspect132,dialog:not(#startup-dialog)';
 // Preserve each dialog's modal behaviour and existing specialised floating windows.
 function windowGeometry152(root){
  if(root.classList.contains('settings152'))window.PaletteWindows152?.enhance(root);
  if(root.tagName!=='DIALOG'||root.dataset.geometry152||root.matches('.floating-tool-window,#startup-dialog,#rebar-style136,#steel-inspect132')||root.querySelector('.floating-titlebar'))return;
  const title=root.querySelector('h2');if(!title)return;
  root.dataset.geometry152='1';root.classList.add('settings152');const handle=title.closest('header')||title;handle.classList.add('settings152-handle');handle.title='Glisser pour déplacer · angle inférieur droit pour redimensionner';let drag=null;
  const key=root.id?'alcide.dialogGeometry.'+root.id:null;
  if(key){
   try{
    const saved=JSON.parse(localStorage.getItem(key));
    if(saved&&Number.isFinite(saved.left)&&Number.isFinite(saved.top)){
     pin(saved.left,saved.top);
     if(saved.width)root.style.width=saved.width;
     if(saved.height)root.style.height=saved.height;
    }
   }catch{}
  }
  function pin(left,top){
   Object.assign(root.style,{margin:'0',left:left+'px',top:top+'px',right:'auto',bottom:'auto'});
   root.style.setProperty('--dialog-room-width',Math.max(0,innerWidth-left-12)+'px');
   root.style.setProperty('--dialog-room-height',Math.max(0,innerHeight-top-12)+'px');
  }
  function place(){
   if(!root.open)return;
   const r=root.getBoundingClientRect();
   const width=Math.min(parseFloat(root.style.width)||r.width,innerWidth-24);
   const height=Math.min(parseFloat(root.style.height)||r.height,innerHeight-24);
   pin(Math.max(12,Math.min(r.left,innerWidth-width-12)),Math.max(12,Math.min(r.top,innerHeight-height-12)));
  }
  function remember(){
   if(!key||!root.style.left)return;
   const value=JSON.stringify({left:parseFloat(root.style.left),top:parseFloat(root.style.top),width:root.style.width,height:root.style.height});
   try{if(localStorage.getItem(key)!==value)localStorage.setItem(key,value);}catch{}
  }
  root.addEventListener('alcide-recenter',()=>{place();remember();});
  handle.addEventListener('pointerdown',ev=>{if(ev.button!==0||ev.target.closest('button,input,select,a'))return;const r=root.getBoundingClientRect();Object.assign(root.style,{margin:'0',left:r.left+'px',top:r.top+'px',right:'auto',bottom:'auto',width:r.width+'px'});drag={x:ev.clientX,y:ev.clientY,left:r.left,top:r.top};handle.setPointerCapture(ev.pointerId);ev.preventDefault();});
  handle.addEventListener('pointermove',ev=>{if(!drag)return;const r=root.getBoundingClientRect();pin(Math.max(12,Math.min(innerWidth-r.width-12,drag.left+ev.clientX-drag.x)),Math.max(12,Math.min(innerHeight-r.height-12,drag.top+ev.clientY-drag.y)));});
  const stop=()=>{if(drag)remember();drag=null;};handle.addEventListener('pointerup',stop);handle.addEventListener('pointercancel',stop);handle.addEventListener('lostpointercapture',stop);
  new MutationObserver(place).observe(root,{attributes:true,attributeFilter:['open']});
  new ResizeObserver(()=>{if(root.open)remember();}).observe(root);
  window.addEventListener('resize',place);
  place();
 }
 const names={'#ff0000':'Rouge','#ffff00':'Jaune','#00ff00':'Vert','#00ffff':'Cyan','#0000ff':'Bleu','#ffffff':'Blanc','#e6edf3':'Blanc','#000000':'Noir','#a9df80':'Vert ALCIDE','#808080':'Gris'};
 function scan(){for(const root of document.querySelectorAll(roots)){root.classList.add('settings142');for(const c of root.querySelectorAll('.color-favorite-control')){const input=c.querySelector('input[type=color]');if(!input)continue;let name=c.querySelector('.settings142-color-name');if(!name){name=document.createElement('span');name.className='settings142-color-name';const open=c.querySelector('.color-favorite-open');open?open.before(name):c.append(name);}const label=names[input.value.toLowerCase()]||'Personnalisée';if(name.textContent!==label)name.textContent=label;if(name.title!==label)name.title=label;}for(const s of root.querySelectorAll('select'))for(const o of s.options){const v=o.value.toUpperCase();const label=v==='BYLAYER'||o.textContent==='DuCalque'?'Du calque':v==='BYBLOCK'||o.textContent==='DuBloc'?'Du bloc':v==='CONTINUOUS'?'Continu':null;if(label&&o.textContent!==label)o.textContent=label;}}

 }
 const geometryScan=()=>{for(const root of document.querySelectorAll(roots))windowGeometry152(root);};
 let frame=0;function schedule(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;scan();geometryScan();});}
 new MutationObserver(ms=>{if(ms.some(m=>m.type==='childList'&&[...m.addedNodes].some(n=>n.nodeType===1&&!n.classList.contains('settings142-color-name'))))schedule();}).observe(document.body,{childList:true,subtree:true});document.addEventListener('change',schedule,true);scan();geometryScan();window.SettingsDesign142={scan:()=>{scan();geometryScan();}};
})();
