// Defaults transcribed from the user's open ALCIDE dimension palette, 18 October 2026.
(()=>{
 const preset={height:12.5,precision:1,rounding:.5,axis:'auto',chainAxis:'auto',unit:'cm',fontFace:'Segoe UI',textGap:.55,textOrientation:'aligned',textBackground:true,showUnit:false,trimZeros:true,decimalComma:true};
 if(localStorage.getItem('dimensionPreset20261018')!=='1'){localStorage.setItem('dimension-font',preset.fontFace);localStorage.setItem('dimension-text-gap',String(preset.textGap));localStorage.setItem('dimensionLineGap','10');localStorage.setItem('drawingPreference:dimension-spacing-assist','true');localStorage.setItem('dimensionPreset20261018','1');}
 if(localStorage.getItem('dimensionSpacing20261019')!=='1'){const gap=Number(localStorage.getItem('dimensionLineGap'));if(!gap||gap===10)localStorage.setItem('dimensionLineGap',String(preset.height*5));localStorage.setItem('dimensionSpacing20261019','1');}
 function apply(){if(selected.size)return;$('#displayunit').value=preset.unit;$('#chainaxis').value=preset.chainAxis;applyDimensionSettings(preset);$('#dimension-font').value=localStorage.getItem('dimension-font')||preset.fontFace;$('#dimension-text-gap').value=localStorage.getItem('dimension-text-gap')||preset.textGap;$('#dimension-spacing-gap').value=localStorage.getItem('dimensionLineGap')||10;$('#dimension-spacing-assist').checked=localStorage.getItem('drawingPreference:dimension-spacing-assist')!=='false';updateDimensionPreview();}
 const init=initScene;initScene=async function(...args){const r=await init.apply(this,args);if(args[1]!==false)apply();return r;};
 apply();window.dimensionUserDefaultsReady=true;
})();
