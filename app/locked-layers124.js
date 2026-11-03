// Le verrouillage est un état de travail, pas une modification des couleurs DWG.
(()=>{
 window.lockedLayerScreenColor124=(e,color,p={})=>{if(!e||window.paperCapture116||window.Theme09?.current()?.startsWith('paper'))return color;return layerSettings(e.layer)?.locked||layerSettings(objectLayer(e,p,'paint'))?.locked?'#85919d':color;};
 const base=objectColor;
 objectColor=function(e,p,...args){const color=base.call(this,e,p,...args);
  return window.lockedLayerScreenColor124(e,color,p);
 };
})();
