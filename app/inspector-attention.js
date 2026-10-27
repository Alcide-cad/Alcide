(()=>{
 const base=revealInspector;let animations=[];
 revealInspector=function(el){if(!el)return;const result=base(el),aside=document.getElementById('propertiespanel'),card=el.closest('details,section')||el;
  for(const animation of animations)animation.cancel();animations=[];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  animations.push(aside.animate([{boxShadow:'inset 4px 0 #b5e88b'},{boxShadow:'inset 4px 0 #b5e88b'},{boxShadow:'inset 0 0 transparent'}],{duration:reduced?1500:1800}));
  animations.push(card.animate([{outline:'2px solid #b5e88b',outlineOffset:'2px',backgroundColor:'#314a3b'},{outline:'2px solid #b5e88b',outlineOffset:'2px',backgroundColor:'#314a3b'},{outline:'2px solid transparent',outlineOffset:'2px',backgroundColor:'transparent'}],{duration:reduced?1500:1800}));
  return result;
 };
})();
