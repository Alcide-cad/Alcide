// Reduce ribbon height without hiding any command; horizontal scrolling stays available.
(()=>{const style=document.createElement('style');style.textContent=`
 #ribboncontent{height:96px!important;min-height:96px!important;max-height:96px!important}
 #ribboncontent .ribbon-page{height:96px!important;min-height:96px!important;padding:4px 9px!important}
 #ribboncontent .ribbon-group>.ribbon-tools{grid-template-rows:repeat(3,22px)!important;gap:2px!important;min-height:70px!important;max-height:70px!important}
 #ribboncontent .ribbon-group .ribbon-tools>button{height:22px!important;min-height:22px!important}
 #ribboncontent .ribbon-group .ribbon-tools>button.ribbon-featured{height:70px!important;min-height:70px!important;gap:3px!important}
 #ribbon-armatures .rebar-command-group{min-height:84px!important}
 #ribbon-armatures .rebar-command-group>small{margin-top:3px!important}
 #ribbon-armatures .rebar-command-tools{grid-template-rows:repeat(3,22px)!important;gap:2px 5px!important}
 #ribbon-armatures .rebar-command-tools button{height:22px!important;min-height:22px!important;padding:2px 6px!important;gap:6px}
 #ribbon-armatures .rebar-command-tools button svg{width:18px;height:18px;flex-basis:18px}
 #ribbon-armatures .rebar-shapes-group .rebar-command-tools{grid-template-rows:repeat(2,32px)!important;gap:4px!important}
 #ribbon-armatures .rebar-shapes-group .rebar-command-tools button{height:32px!important;min-height:32px!important;flex-direction:row;gap:5px;padding:2px 4px!important}
 #ribbon-armatures .rebar-shapes-group .rebar-command-tools button svg{width:21px;height:21px;flex:0 0 21px}
 #ribbon-armatures .rebar-shapes-group .rebar-command-tools{grid-template-columns:repeat(3,103px)}
 #ribbon-armatures .rebar-shapes-group .rebar-command-tools button{width:103px!important}
 `;document.head.append(style);})();
