(()=>{
 let creating=false;
 window.createNewDrawing=async()=>{if(busy||creating)return;creating=true;try{const p=await api.newDrawing();await openFile(p);if(scene?.source!==p)return;$('#units').value='cm';$('#displayunit').value='cm';view={s:2,tx:w/2,ty:h/2,angle:0};refresh();status('Nouveau dessin · centimètres · prêt à dessiner · Ctrl+S pour enregistrer en DWG.');}catch(ex){error(ex);}finally{creating=false;}};
 const b=document.createElement('button');b.id='new-drawing';b.innerHTML='<span class="ribbon-icon">＋</span><span>Nouveau dessin</span>';b.title='Créer un dessin vide en centimètres · Ctrl+N';b.onclick=()=>createNewDrawing();$('#open').parentElement.prepend(b);
 const welcome=$('#welcome-new');welcome.onclick=()=>createNewDrawing();$('#welcomeopen').onclick=()=>chooseOpen();
 document.addEventListener('keydown',ev=>{if((ev.ctrlKey||ev.metaKey)&&!ev.shiftKey&&!ev.altKey&&ev.key.toLowerCase()==='n'){ev.preventDefault();ev.stopImmediatePropagation();if(!document.querySelector('dialog[open]:not(#helpdialog):not(#detail-library)'))createNewDrawing();}},true);
 api.onAction(action=>{if(action==='new'){if($('#tool-shortcut-dialog')?.open){$('#tool-shortcut-error').textContent='Cette combinaison est réservée à Nouveau dessin.';return;}createNewDrawing();}});
})();
