(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.Theme09Core=api;})(globalThis,()=>{
 function color(value,mode){if(mode==='dark'||typeof value!=='string')return value;const s=value.toLowerCase();if(s==='#33444b')return '#d5dfe8';let rgb;if(/^#[0-9a-f]{6}$/.test(s))rgb=[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));else if(/^#[0-9a-f]{3}$/.test(s))rgb=[...s.slice(1)].map(x=>parseInt(x+x,16));else return value;
  if(mode==='paper')return '#253342';const lum=(.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2])/255,k=lum>.5?.5/lum:1;return '#'+rgb.map(x=>Math.round(x*k).toString(16).padStart(2,'0')).join('');
 }return {color};
});
