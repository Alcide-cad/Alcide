// La case et les deux boutons occupent la même hauteur totale.
(()=>{
 const style=document.createElement('style');style.textContent=`
 .numeric-stepper{align-items:stretch!important}
 .numeric-stepper>input{box-sizing:border-box;min-height:0!important;align-self:stretch}
 .numeric-stepper>.numeric-stepper-buttons{display:grid!important;grid-template-rows:minmax(0,1fr) minmax(0,1fr);align-self:stretch;min-height:0;height:100%!important}
 :is(#propertiespanel,#layerpanel,#rebar-dialog,#textdialog,#linear-rebar-panel) .numeric-stepper>.numeric-stepper-buttons>button,
 #textdialog #rich-text-toolbar .numeric-stepper>.numeric-stepper-buttons>button{box-sizing:border-box;height:100%!important;min-height:0!important;max-height:none!important;margin:0!important;padding:0 3px!important;line-height:1!important}
 #rebar-dialog .numeric-stepper{height:32px!important;min-height:32px!important}
 #rebar-dialog .numeric-stepper>input{height:32px!important;min-height:0!important}
 #textdialog .numeric-stepper{height:30px!important;min-height:30px!important}
 #textdialog .numeric-stepper>input{height:30px!important;min-height:0!important}
 `;document.head.append(style);
})();
