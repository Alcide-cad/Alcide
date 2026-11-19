// 1.0.97 — Point de base temporaire au survol.
// Rester immobile ~0,6 s sur un point accroché pendant une commande de tracé ou de placement
// en fait la base temporaire : la distance tapée (direction de la souris) ou @ΔX,ΔY part de ce point.
// Échap efface la base. Le repère d’alignement (300 ms) reste acquis comme avant.
(()=>{
 let hoverBase=null,pending=null,timer=null,lastPixel=null;
 const KINDS=/^(extrémité|milieu|centre|intersection|quadrant|insertion|nœud|perpendiculaire|tangente)$/i;
 function enabled(){return localStorage.getItem('hoverBase197')!=='false';}
 function delay(){return Math.max(100,Math.min(5000,Number(localStorage.getItem('hoverBaseDelay197'))||600));}
 function context(){try{if(typeof scene==='undefined'||!scene||busy||!enabled()||!document.querySelector('#snap')?.checked)return null;if(document.querySelector('dialog[open]:not(#helpdialog):not(#detail-library)'))return null;return (typeof alignmentTrackingActive==='function'&&alignmentTrackingActive())||(typeof precisionContext==='function'&&precisionContext())||null;}catch{return null;}}
 function valid(){if(!hoverBase)return false;if(hoverBase.doc!==activeId||!context()){hoverBase=null;return false;}return true;}
 function cancel(){clearTimeout(timer);timer=null;pending=null;}
 function clearBase(){const had=!!hoverBase;hoverBase=null;cancel();if(had&&typeof requestRender==='function')requestRender();return had;}
 window.hoverBase197=()=>valid()?[...hoverBase.point]:null;
 window.clearHoverBase197=clearBase;
 // Échap : enregistré tôt pour passer avant l’annulation de la commande.
 window.addEventListener('keydown',ev=>{if(ev.key!=='Escape'||!valid())return;clearBase();
  if(typeof alignmentReferences!=='undefined'){alignmentReferences=[];alignmentGuides=[];alignmentDirections=[];}
  const typing=['numeric-distance','numeric-angle','numeric-x','numeric-y'].some(id=>document.getElementById(id)?.value.trim());
  if(!typing){ev.preventDefault();ev.stopImmediatePropagation();}
  if(typeof status==='function')status('Point de base temporaire effacé.');},true);
 function init(){
  overlay.addEventListener('pointermove',ev=>{if(!context()||typeof drag!=='undefined'&&drag){cancel();return;}
   const pixel=eventPoint(ev);lastPixel=pixel;if(window.geometricSnapAt)window.geometricSnapAt(pixel);else snap(pixel);
   const point=snapPoint&&KINDS.test(snapKind||'')?[...snapPoint]:null;
   if(!point){cancel();return;}
   if(hoverBase&&cadDistance(hoverBase.point,point)*view.s<2){cancel();return;}
   {const c=typeof precisionContext==='function'?precisionContext():null,a=drawingMode?.points?.at(-1)||c?.anchor;if(a&&cadDistance(a,point)*view.s<2){cancel();return;}}
   if(pending&&cadDistance(pending.point,point)*view.s<2)return;
   cancel();pending={point,doc:activeId,kind:snapKind,t0:performance.now()};
   timer=setTimeout(()=>{if(!pending||pending.doc!==activeId||!context())return;{const c=typeof precisionContext==='function'?precisionContext():null,a=drawingMode?.points?.at(-1)||c?.anchor;if(a&&cadDistance(a,pending.point)*view.s<2){cancel();return;}}hoverBase={point:pending.point,doc:activeId,kind:pending.kind,wait:Math.round(performance.now()-pending.t0)};window.hoverBaseWait197=hoverBase.wait;cancel();requestRender();
    status('Point de base temporaire ('+hoverBase.kind+') · visez la direction et tapez la distance, ou @ΔX,ΔY · Échap efface la base.');},delay());},true);
  overlay.addEventListener('pointerleave',cancel);
  // Une base sert au point suivant : elle s’efface une fois le point posé.
  overlay.addEventListener('pointerdown',ev=>{if(ev.button!==0)return;cancel();if(hoverBase)setTimeout(clearBase,0);},true);
  const draw=drawOverlay;drawOverlay=function(){draw();if(!valid())return;const s=screen(hoverBase.point);oc.save();oc.lineWidth=2;oc.strokeStyle='#22e0ff';oc.fillStyle='rgba(34,224,255,.18)';oc.beginPath();oc.arc(s[0],s[1],8,0,Math.PI*2);oc.fill();oc.stroke();oc.beginPath();oc.moveTo(s[0]-13,s[1]);oc.lineTo(s[0]+13,s[1]);oc.moveTo(s[0],s[1]-13);oc.lineTo(s[0],s[1]+13);oc.stroke();
   const label='Base';oc.font='bold 13px Segoe UI';const tw=oc.measureText(label).width;oc.fillStyle='rgba(8,20,28,.85)';oc.fillRect(s[0]+11,s[1]-29,tw+10,18);oc.fillStyle='#22e0ff';oc.fillText(label,s[0]+16,s[1]-15);
   if(lastPixel){const q=lastPixel;if(Math.hypot(q[0]-s[0],q[1]-s[1])>14){oc.setLineDash([3,4]);oc.lineWidth=1.25;oc.beginPath();oc.moveTo(...s);oc.lineTo(...q);oc.stroke();oc.setLineDash([]);}}
   oc.restore();};
  const settings=$('#snap-settings-dialog'),anchor=$('#snap-kinds-settings');if(settings&&anchor){const en=document.createElement('label'),dl=document.createElement('label');en.className=dl.className='row';en.innerHTML='Point de base au survol<input id="hover-base-enabled" type="checkbox">';dl.innerHTML='Point de base au survol (ms)<input id="hover-base-delay" type="number" min="100" max="5000" step="50">';anchor.parentNode.insertBefore(en,anchor);anchor.parentNode.insertBefore(dl,anchor);
   const show=showSnapSettings;showSnapSettings=function(){show();$('#hover-base-enabled').checked=enabled();$('#hover-base-delay').value=delay();};$('#snap-settings-button').onclick=showSnapSettings;
   const save=$('#save-snap-settings').onclick;$('#save-snap-settings').onclick=()=>{const d=cadNumeric($('#hover-base-delay').value);if(!Number.isFinite(d)||d<100||d>5000){$('#snap-setting-error').textContent='Point de base au survol : entre 100 et 5 000 ms.';return;}save();if(settings.open)return;localStorage.setItem('hoverBase197',String($('#hover-base-enabled').checked));localStorage.setItem('hoverBaseDelay197',String(d));clearBase();};}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
