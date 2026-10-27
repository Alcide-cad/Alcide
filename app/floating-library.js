// Bibliothèque non modale, géométrie mémorisée et huit poignées de redimensionnement.
(()=>{
 const panel=$('#detail-library'),heading=panel.querySelector('.detail-heading'),KEY='alcide:library-window';panel.dataset.floating='true';let state=null,gesture=null;
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved&&['x','y','width','height'].every(k=>Number.isFinite(saved[k])))state=saved;}catch{}
 function defaults(){return {x:56,y:Math.min(130,innerHeight*.15),width:560,height:Math.min(620,innerHeight-48)};}
 function constrain(s){const gap=8,maxW=Math.max(1,innerWidth-16),maxH=Math.max(1,innerHeight-16);const width=Math.min(maxW,Math.max(Math.min(320,maxW),s.width)),height=Math.min(maxH,Math.max(Math.min(280,maxH),s.height));return {x:Math.max(gap,Math.min(innerWidth-width-gap,s.x)),y:Math.max(gap,Math.min(innerHeight-height-gap,s.y)),width,height};}
 function apply(){state=constrain(state||defaults());for(const [prop,value]of Object.entries({left:state.x,top:state.y,width:state.width,height:state.height}))panel.style.setProperty(prop,value+'px','important');panel.style.setProperty('right','auto','important');panel.style.setProperty('bottom','auto','important');panel.style.setProperty('max-height','none','important');}
 function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}}
 function start(ev,direction){if(ev.button!==0||busy)return;if(!direction&&ev.target.closest('button,input,select'))return;ev.preventDefault();ev.stopPropagation();apply();gesture={pointer:ev.pointerId,x:ev.clientX,y:ev.clientY,initial:{...state},direction,target:ev.currentTarget};gesture.target.setPointerCapture(ev.pointerId);}
 function move(ev){if(!gesture||ev.pointerId!==gesture.pointer)return;const g=gesture,dx=ev.clientX-g.x,dy=ev.clientY-g.y,s={...g.initial},d=g.direction;if(!d){s.x+=dx;s.y+=dy;}else{const minW=Math.min(320,innerWidth-16),minH=Math.min(280,innerHeight-16);if(d.includes('e'))s.width=Math.max(minW,Math.min(innerWidth-s.x-8,s.width+dx));if(d.includes('s'))s.height=Math.max(minH,Math.min(innerHeight-s.y-8,s.height+dy));if(d.includes('w')){s.x=Math.max(8,Math.min(g.initial.x+g.initial.width-minW,s.x+dx));s.width=g.initial.width+g.initial.x-s.x;}if(d.includes('n')){s.y=Math.max(8,Math.min(g.initial.y+g.initial.height-minH,s.y+dy));s.height=g.initial.height+g.initial.y-s.y;}}state=s;apply();}
 function end(ev){if(!gesture||ev.pointerId!==gesture.pointer)return;if(ev.type==='pointercancel'){state=gesture.initial;apply();}const g=gesture;gesture=null;if(g.target.hasPointerCapture(g.pointer))g.target.releasePointerCapture(g.pointer);save();}
 heading.title='Glisser pour déplacer · double-clic pour rétablir la taille';heading.addEventListener('pointerdown',ev=>start(ev,''));heading.addEventListener('dblclick',ev=>{if(ev.target.closest('button'))return;state=defaults();apply();save();});
 for(const d of ['n','s','e','w','ne','nw','se','sw']){const h=document.createElement('div');h.className='library-resize '+d;h.dataset.resize=d;h.setAttribute('aria-hidden','true');h.addEventListener('pointerdown',ev=>start(ev,d));panel.append(h);}
 panel.addEventListener('pointermove',move);panel.addEventListener('pointerup',end);panel.addEventListener('pointercancel',end);panel.addEventListener('lostpointercapture',ev=>{if(gesture&&ev.pointerId===gesture.pointer){gesture=null;save();}});
 new MutationObserver(()=>{if(panel.open)apply();}).observe(panel,{attributes:true,attributeFilter:['open']});window.addEventListener('resize',()=>{apply();});
 const css=document.createElement('style');css.textContent=`
 #detail-library[open][data-floating=true]{position:fixed;min-width:0!important;min-height:0!important;max-width:none!important;margin:0!important;padding:14px!important;overflow:hidden!important;box-sizing:border-box;z-index:100;display:flex;flex-direction:column}
 #detail-library[data-floating=true] .detail-heading{cursor:move;touch-action:none;user-select:none;padding-bottom:9px;border-bottom:1px solid #425e6d}
 #detail-library[data-floating=true] #detail-library-list{flex:1 1 0;grid-template-columns:repeat(auto-fit,minmax(min(180px,100%),1fr))!important;align-content:start;min-height:0;overflow:auto;padding:4px 4px 12px 0}
 #detail-library[data-floating=true] #detail-library-message{flex:0 0 auto;margin:6px 0;font-size:11px}
 #detail-library[data-floating=true] .detail-toolbar{margin:6px 0;gap:5px}
 #detail-library[data-floating=true] .detail-card>div:last-child{display:flex;flex-wrap:wrap;gap:3px;margin-top:7px}
 #detail-library[data-floating=true] .detail-card button{margin:0}
 #detail-library[data-floating=true] .detail-crumbs{min-width:0;padding:4px 0 8px}
 #detail-library[data-floating=true] .detail-folder-tools{flex-wrap:wrap;min-width:0}
 #detail-library[data-floating=true] .detail-folder{white-space:normal!important;overflow-wrap:anywhere}
 .library-resize{position:absolute;z-index:2;touch-action:none}
 .library-resize.n,.library-resize.s{left:12px;right:12px;height:8px;cursor:ns-resize}.library-resize.n{top:0}.library-resize.s{bottom:0}
 .library-resize.e,.library-resize.w{top:12px;bottom:12px;width:8px;cursor:ew-resize}.library-resize.e{right:0}.library-resize.w{left:0}
 .library-resize.ne,.library-resize.nw,.library-resize.se,.library-resize.sw{width:14px;height:14px}.library-resize.ne,.library-resize.se{right:0}.library-resize.nw,.library-resize.sw{left:0}.library-resize.ne,.library-resize.nw{top:0}.library-resize.se,.library-resize.sw{bottom:0}.library-resize.ne,.library-resize.sw{cursor:nesw-resize}.library-resize.nw,.library-resize.se{cursor:nwse-resize}
 .library-resize.se:after{content:'';position:absolute;right:3px;bottom:3px;width:7px;height:7px;border-right:2px solid #80b8ce;border-bottom:2px solid #80b8ce}
 `;document.head.append(css);apply();window.floatingLibraryReady=true;
})();
