// 0.7.7 : système de mise en page compact (variables CSS) : lignes ~26 px, libellé et champ sur une ligne, police 12 px,
// champs à la largeur du panneau. Thème sombre et accent vert conservés. Ne touche pas au ruban (hauteur 96 px).
(()=>{
 const P='#propertiespanel',R='#rebar-dialog',S=`${P},${R},#hatch-cards,#detail-library,#linear-rebar-panel,dialog`;
 const css=document.createElement('style');css.id='ui-compact-css';css.textContent=`
:root{--ui-row:26px;--ui-field-h:24px;--ui-font:12px;--ui-small:11px;--ui-gap:6px;--ui-pad-x:8px;--ui-radius:4px;--ui-sep:#2b3946}
:is(${S}){font-size:var(--ui-font)}
:is(${S}) :is(select,input[type=text],input[type=number],input:not([type])){height:var(--ui-field-h)!important;min-height:0!important;padding:2px 6px!important;font-size:var(--ui-font)!important;border-radius:var(--ui-radius);min-width:0;max-width:100%;text-overflow:ellipsis}
:is(${S}) button:not(.rf-toggle):not(.switch):not([role=switch]){min-height:var(--ui-field-h);padding:3px var(--ui-pad-x);font-size:var(--ui-font);border-radius:var(--ui-radius);line-height:16px}
${P} label.row,${P} .inspector-card label.row,${P} .row:not(.rebar-geometry-grid){display:grid!important;grid-template-columns:minmax(78px,36%) minmax(0,1fr) auto!important;align-items:center!important;column-gap:var(--ui-gap)!important;row-gap:2px!important;min-height:var(--ui-row)!important;padding:1px 0!important;margin:0!important}
${P} label.row>:is(select,input,button):not([type=checkbox]),${P} .row>:is(select,input,button,.linetype-picker,[class*=picker]):not([type=checkbox]){width:100%!important;max-width:none!important;min-width:0!important}
${P} .numeric-stepper{min-width:70px!important;display:inline-flex!important}${P} .numeric-stepper input{min-width:40px!important;width:100%!important}${P} .numeric-stepper:has(>input[hidden]){display:none!important}${P} .row:has(.transparency-slider),${P} label.row:has(.transparency-slider){grid-template-columns:minmax(78px,36%) minmax(0,1fr)!important}${P} .transparency-slider{display:flex;align-items:center;gap:6px;min-width:0}${P} .transparency-slider input[type=range]{flex:1;min-width:0;width:auto!important}${P}{overflow-x:hidden}
${P} .inspector-card,${P} details{padding:4px 8px!important;margin:0 0 4px!important;border-radius:6px}
${P} :is(summary,h2,h3,h4,.card-title),${R} :is(summary,h2,h3,h4),#hatch-cards .hatch-card>summary{font-size:var(--ui-font)!important;font-weight:600;padding:5px 2px!important;min-height:0!important;border-bottom:1px solid var(--ui-sep);margin-bottom:4px!important}
${P} p,${P} small{font-size:var(--ui-small);margin:2px 0}
${P} button.wide,${P} .inspector-card>button{min-height:24px}
${R} .rebar-property-section>label:not(:has(input[type=checkbox])){min-height:var(--ui-row);grid-template-columns:minmax(0,1fr) minmax(0,1.2fr)!important;column-gap:var(--ui-gap)}
${R} label{font-size:var(--ui-font);margin:2px 0!important;gap:3px}
${R} .rebar-geometry-grid{gap:3px 10px!important}
${R} section,${R} details{padding:6px 8px!important;margin:0 0 6px!important}
#hatch-cards .hatch-card{margin:0 0 6px!important}
#hatch-cards label{display:grid;grid-template-columns:minmax(70px,34%) minmax(0,1fr) auto;align-items:center;column-gap:var(--ui-gap);min-height:var(--ui-row);margin:1px 0!important;font-size:var(--ui-font)}
#hatch-cards .hatch-card-gallery{gap:3px!important}
#detail-library label{min-height:var(--ui-row);font-size:var(--ui-font)}
dialog label{font-size:var(--ui-font)}
#ribboncontent .ribbon-group.rf-collapsed.rf-open>:not(.rf-toggle):not(small){padding:4px!important;gap:2px!important}
`;document.head.append(css);
 // valeurs encore trop longues : infobulle avec le texte complet
 function tips(){for(const el of document.querySelectorAll(`${P} select,${R} select,#hatch-cards select`)){const t=el.selectedOptions?.[0]?.text||'';if(t&&el.title!==t)el.title=t;}}
 document.addEventListener('change',tips,true);const draw=drawOverlay;let q=0;drawOverlay=function(...a){const r=draw.apply(this,a);if(!q){q=requestAnimationFrame(()=>{q=0;tips();});}return r;};
})();
