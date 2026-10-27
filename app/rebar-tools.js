// Dedicated entry points share the live reinforcement placement engine.
(()=>{
 const page=$('#ribbon-armatures'),group=page.querySelector('.rebar-command-group'),tools=group.querySelector('.rebar-command-tools');
 const defs=[
  ['straight','rebar-new-bar','Barre droite','M3 16H29'],
  ['hooked','rebar-new-hooked','Barre à crosses','M7 7L4 10Q1 16 8 16H24Q31 16 28 10L25 7'],
  ['U','rebar-new-u','U','M5 4V23Q5 28 10 28H22Q27 28 27 23V4'],
  ['octagon','rebar-new-octagon','Cadre octogonal','M5 11L11 5H21L27 11V21L21 27H11L5 21V11L11 17M5 11H13'],
  ['cadre','rebar-new-cadre','Cadre','M19 13L25 7Q28 3 24 3H7Q4 3 4 6V26Q4 29 7 29H25Q28 29 28 26V7Q28 3 25 6L21 10'],
  ['epingle','rebar-new-epingle','Épingle 180°','M10 24H8A5 5 0 0 1 8 14H24A5 5 0 0 1 24 24H22'],
  ['L','rebar-new-l','Équerre L','M5 4V24Q5 28 9 28H29']
 ];
 const extra=document.createElement('div');extra.className='ribbon-group rebar-command-group';const extraTools=document.createElement('div');extraTools.className='rebar-command-tools';for(const id of ['rebar-new-mesh','rebar-convert-line-ribbon'])extraTools.append($('#'+id));const caption=document.createElement('small');caption.textContent='Treillis et conversion';extra.append(extraTools,caption);group.after(extra);group.querySelector('small').textContent='Dessiner une barre';
 for(const [key,id,title,path]of defs){const button=$('#'+id)||document.createElement('button');button.id=id;button.classList.add('rebar-shape-command');button.innerHTML=`<svg class="rebar-shape-icon" viewBox="0 0 32 32" aria-hidden="true"><path d="${path}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>${title}</span>`;button.title=title+' · aperçu avant pose · dimensions en cm';button.onclick=()=>Reinforcement.startPreset(key);tools.append(button);}
 const meshButton=$('#rebar-new-mesh'),startMesh=meshButton.onclick;meshButton.onclick=()=>{startMesh();$('#rebar-dialog').classList.add('rebar-settings');};
 const css=document.createElement('style');css.textContent='#ribbon-armatures .rebar-shape-command{display:flex;align-items:center;gap:7px}#ribbon-armatures .rebar-shape-icon{width:23px;height:23px;flex:none;color:#b3e58c}#ribbon-armatures .rebar-shape-command span{white-space:nowrap}';document.head.append(css);
})();
