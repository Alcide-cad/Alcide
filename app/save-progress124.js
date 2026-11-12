// Brief acknowledgment of the snapshot. The save itself stays in the background.
(()=>{
 const host=document.getElementById('busy'),box=document.createElement('section');
 box.id='save-progress124';box.hidden=true;box.setAttribute('role','status');
 box.innerHTML='<span data-thumb aria-hidden="true">👍</span><span data-wait aria-hidden="true"></span><strong data-close-title>Fermeture en attente</strong><small>Instantané pris</small>';
 host.after(box);
 const label=box.querySelector('small');
 let timer=0,doc=null,start=0,step=0,closing=false;
 window.SaveProgress124={
  start(id){
   clearTimeout(timer);
   doc=id;start=performance.now();step=0;closing=false;
   box.className='save124-ack';label.textContent='Instantané pris';box.hidden=false;
   timer=setTimeout(()=>{box.hidden=true;},850);
  },
  finish(){doc=null;if(closing)box.hidden=true;},
  waitForClose(){
   clearTimeout(timer);closing=true;box.className='save124-close';box.hidden=false;
   label.textContent='ALCIDE se fermera après vérification de la sauvegarde.';
  },
  state:()=>({doc,step,elapsed:doc?(performance.now()-start)/1000:0})
 };
 api.onProgress(p=>{
  if(!doc||(p.docId&&p.docId!==doc))return;
  const text=p.text||'';
  step=Math.max(step,/remplacement|publication|copie de sécurité/i.test(text)?3:/vérification|relecture|relire/i.test(text)?2:/conversion|création du DWG|écriture|écrire/i.test(text)?1:0);
 });
 const css=document.createElement('style');
 css.textContent=`
  #save-progress124{position:absolute;right:14px;bottom:14px;z-index:10;pointer-events:none;background:#23313dee;border:1px solid #5b734e;border-radius:9px;padding:8px 12px;display:flex;align-items:center;gap:8px;color:var(--text)}
  #save-progress124[hidden],#save-progress124.save124-close [data-thumb],#save-progress124.save124-ack [data-wait],#save-progress124.save124-ack [data-close-title]{display:none}
  #save-progress124.save124-close{display:grid;grid-template-columns:24px minmax(0,1fr);gap:4px 12px;width:min(360px,calc(100% - 28px));box-sizing:border-box;padding:14px 16px;border:1px solid #efbd74;border-left:4px solid #efbd74;box-shadow:0 6px 24px #0008;animation:save124-attention 650ms ease-out both}
  #save-progress124.save124-close[hidden]{display:none}
  #save-progress124.save124-close strong{font-size:15px;color:#ffd397}
  #save-progress124.save124-close small{grid-column:2;line-height:1.4}
  #save-progress124 [data-wait]{grid-row:span 2;align-self:center;width:18px;height:18px;border:2px solid #efbd7455;border-top-color:#ffd397;border-radius:50%;animation:save124-spin 950ms linear infinite}
  @keyframes save124-attention{from{transform:translateY(8px);box-shadow:0 0 0 8px #efbd7466}to{transform:translateY(0);box-shadow:0 6px 24px #0008}}
  @keyframes save124-spin{to{transform:rotate(360deg)}}
  @media(prefers-reduced-motion:reduce){#save-progress124.save124-close,#save-progress124 [data-wait]{animation:none}}
  #save-progress124 small{font-size:12px}
  #save-progress124.save124-ack [data-thumb]{font-size:20px;animation:save124-thumb 800ms ease both}
  @keyframes save124-thumb{0%{transform:scale(.75);opacity:.4}25%{transform:scale(1.18);opacity:1}50%{transform:scale(1)}100%{transform:scale(1)}}
  @media(prefers-reduced-motion:reduce){#save-progress124.save124-ack [data-thumb]{animation:none}}
 `;
 document.head.append(css);
})();
