// Éditeur compact : une seule barre typographique, placement séparé.
(()=>{
 const dialog=$('#textdialog'),bar=$('#rich-text-toolbar'),editor=$('#rich-text-editor');if(!dialog||!bar||!editor)return;
 const font=$('#rich-text-font'),height=$('#rich-text-height'),baseFont=$('#dialog-text-font'),baseHeight=$('#annotationheight');
 const legacy=document.createElement('div');legacy.hidden=true;legacy.id='text-typography-storage';dialog.append(legacy);
 for(const node of [baseFont,baseHeight])legacy.append(node.closest('label'));
 const grid=dialog.querySelector('.text-dialog-grid'),placement=document.createElement('details');placement.className='text-dialog-options text-placement';placement.innerHTML='<summary>Placement et proportions</summary>';grid.before(placement);placement.append(grid);
 const anchor=$('#dialog-text-alignment').closest('label');const text=[...anchor.childNodes].find(n=>n.nodeType===3);if(text)text.textContent='Point d’ancrage';
 const top=document.createElement('div');top.className='rt-typography';const formats=document.createElement('div');formats.className='rt-formats';
 const field=(label,node)=>{const l=document.createElement('label');l.className='rt-field';const span=document.createElement('span');span.textContent=label;l.append(span,node);top.append(l);};
 const scope=document.createElement('select');scope.id='rich-text-scope';scope.setAttribute('aria-label','Portée de la mise en forme');scope.append(new Option('Tout le texte','all'),new Option('Sélection','selection'));field('Appliquer à',scope);
 field('Police',font);field('Hauteur',height.closest('.numeric-stepper')||height);
 const color=$('#rich-text-color'),colorHost=color.closest('.color-favorite-control')||color;field('Couleur',colorHost);
 const symbolMenu=document.createElement('details');symbolMenu.className='rt-symbol-menu';symbolMenu.innerHTML='<summary>Symboles ▾</summary><div></div>';
 for(const b of [...bar.querySelectorAll('.rt-btn')]){if(b.classList.contains('rt-sym'))symbolMenu.lastChild.append(b);else formats.append(b);}
 formats.append(symbolMenu);for(const sep of bar.querySelectorAll('.rt-sep'))sep.remove();bar.append(top,formats);
 const clear=[...formats.querySelectorAll('.rt-btn')].find(b=>b.textContent==='↺');if(clear)clear.title='Effacer la mise en forme de la sélection';
 let range=null;const remember=()=>{if(!dialog.open)return;const s=getSelection();if(!s.rangeCount||!editor.contains(s.anchorNode))return;range=s.getRangeAt(0).cloneRange();const partial=!s.isCollapsed&&s.toString().length<(editor.textContent||'').length;scope.value=partial?'selection':'all';};document.addEventListener('selectionchange',remember);
 function restore(){editor.focus();if(range&&editor.contains(range.commonAncestorContainer)){const s=getSelection();s.removeAllRanges();s.addRange(range);}}
 formats.addEventListener('click',ev=>{if(ev.target.closest('.rt-btn'))restore();},true);
 const notify=node=>{node.dispatchEvent(new Event('input',{bubbles:true}));node.dispatchEvent(new Event('change',{bubbles:true}));};
 const richFont=font.onchange,richHeight=height.onchange;
 font.onchange=()=>{if(scope.value==='selection'){restore();richFont();return;}baseFont.value=font.value;notify(baseFont);editor.style.fontFamily='"'+font.value+'", Arial, sans-serif';for(const n of editor.querySelectorAll('[style*="font-family"],font[face]')){n.style.removeProperty('font-family');n.removeAttribute('face');}editor.dispatchEvent(new Event('input',{bubbles:true}));};
 height.onchange=()=>{const value=cadNumeric(height.value);if(!(Number.isFinite(value)&&value>0)){height.setCustomValidity('Saisissez une hauteur positive.');height.reportValidity();return;}height.setCustomValidity('');if(scope.value==='selection'){restore();richHeight();return;}baseHeight.value=String(value);notify(baseHeight);for(const n of editor.querySelectorAll('[data-h]')){delete n.dataset.h;n.style.removeProperty('font-size');}editor.dispatchEvent(new Event('input',{bubbles:true}));};
 height.addEventListener('input',()=>height.setCustomValidity(''));
 const open=openTextEditor;openTextEditor=function(...args){const r=open.apply(this,args);scope.value='all';range=null;placement.open=false;symbolMenu.open=false;const single=selected.size===1&&entities.get([...selected][0])?.type==='TEXT';font.disabled=false;height.disabled=false;scope.disabled=single;return r;};
 const css=document.createElement('style');css.textContent=`
 #textdialog{width:min(690px,94vw)!important;max-height:92vh!important;padding:16px 18px!important;overflow:auto!important}
 #textdialog #text-typography-storage{display:none!important}
 #textdialog #rich-text-toolbar{display:flex;flex-direction:column;align-items:stretch;gap:7px;padding:8px}
 #textdialog .rt-typography{display:flex;flex-wrap:wrap;align-items:end;gap:8px}
 #textdialog .rt-field{display:flex!important;flex-direction:column;gap:3px!important;font-size:11px!important;min-width:0;margin:0!important}
 #textdialog .rt-field:has(#rich-text-font){flex:1;min-width:130px}
 #textdialog .rt-field>span{color:var(--muted)}
 #textdialog #rich-text-toolbar select{max-width:100%;height:30px!important;font-size:12px!important}
 #textdialog #rich-text-font{width:100%;min-width:110px}
 #textdialog #rich-text-scope{width:112px}
 #textdialog #rich-text-toolbar .numeric-stepper{width:85px!important;height:30px!important;flex:none!important;min-height:30px!important}
 #textdialog #rich-text-toolbar .numeric-stepper input{height:30px!important;width:60px!important}
 #textdialog #rich-text-toolbar .numeric-stepper-buttons{flex-basis:20px!important}
 #textdialog #rich-text-toolbar .numeric-stepper-buttons>button{height:15px!important;min-height:0!important;padding:0!important;line-height:12px!important;font-size:10px!important}
 #textdialog .rt-formats{display:flex;align-items:center;gap:4px;flex-wrap:wrap}
 #textdialog #rich-text-toolbar .rt-btn{height:28px!important;min-height:0!important;min-width:28px!important;padding:0 7px!important}
 #textdialog #rich-text-toolbar .color-favorite-control{height:30px;gap:3px}
 #textdialog #rich-text-color{height:28px!important;width:30px!important}
 #textdialog .rt-symbol-menu{position:relative;margin-left:auto;border:0;padding:0;font-size:12px}
 #textdialog .rt-symbol-menu>summary{cursor:pointer;list-style:none;padding:3px 8px;border:1px solid var(--border);border-radius:4px}
 #textdialog .rt-symbol-menu>div{position:absolute;right:0;top:100%;z-index:5;display:flex;gap:4px;padding:6px;background:var(--panel);border:1px solid var(--border);border-radius:5px}
 #textdialog #rich-text-editor{min-height:115px;max-height:35vh;resize:vertical;overflow:auto;font-size:17px}
 #textdialog .text-placement{margin:10px 0!important}
 #textdialog .text-dialog-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
 #textdialog .text-dialog-field:first-child{grid-column:auto!important}
 #textdialog .text-dialog-field:has(#dialog-text-alignment){grid-column:1/-1!important}
 #textdialog .text-dialog-grid .numeric-stepper{display:flex!important;height:30px!important;width:100%!important}
 #textdialog .text-dialog-grid .numeric-stepper>input{height:30px!important;width:100%!important}
 #textdialog .text-dialog-grid .numeric-stepper-buttons{flex:0 0 22px}
 #textdialog .text-dialog-grid .numeric-stepper-buttons>button{height:15px!important;min-height:0!important;line-height:12px!important;padding:0!important}
 #textdialog .text-dialog-footer{position:sticky;bottom:-16px;background:var(--panel);padding:10px 0!important}
 @media(max-width:500px){#textdialog .rt-field:has(#rich-text-font){min-width:130px}#textdialog .rt-field:has(#rich-text-scope){flex:1}#textdialog .text-dialog-grid{grid-template-columns:1fr!important}}
 `;document.head.append(css);window.textDialogPolishReady=true;
})();
