(()=>{
 const entries=[['beam',Beam100],['lintel',Lintel100],['column',Column100]];
 function hide(except=null){for(const [name]of entries){if(name===except)continue;const p=document.getElementById(name+'100-panel');if(p)p.hidden=true;}}
 const prior=setTool;setTool=function(...args){hide();return prior.apply(this,args);};
 for(const [name,api]of entries){const show=api.show;api.show=function(...args){setTool('select');hide(name);return show.apply(this,args);};}
 window.addEventListener('keydown',ev=>{if(ev.key!=='Escape')return;const open=entries.some(([name])=>!document.getElementById(name+'100-panel').hidden);if(!open)return;ev.preventDefault();ev.stopImmediatePropagation();hide();overlay.focus({preventScroll:true});status('Outil terminé · panneau fermé.');},true);
 window.MemberPanels100={hide};
})();
