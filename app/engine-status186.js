/* 1.0.86 · Automatic engine restart notice. The drawing edits stay in this window. */
(()=>{
 if(typeof api?.onEngineStatus!=='function')return;
 const box=document.createElement('section');box.id='engine-status186';box.hidden=true;box.setAttribute('role','alert');
 const text=document.createElement('span'),close=document.createElement('button');close.type='button';close.textContent='OK';close.onclick=()=>{box.hidden=true;};
 box.append(text,close);document.body.append(box);let timer=0;
 api.onEngineStatus(data=>{
  const message=String(data?.message||'');if(!message)return;
  try{log(message);status(message);}catch{}
  text.textContent=message;box.dataset.state=data.state||'';box.hidden=false;clearTimeout(timer);
  if(data.state==='restarted')timer=setTimeout(()=>{box.hidden=true;},12000);
 });
 const css=document.createElement('style');css.textContent='#engine-status186{position:fixed;z-index:230;left:50%;transform:translateX(-50%);bottom:65px;max-width:min(720px,calc(100vw - 32px));display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--panel,#1b2630);color:var(--text,#e6edf3);border:1px solid #d9a441;border-radius:9px;box-shadow:0 6px 24px #0005;font-size:12px;line-height:1.45}#engine-status186[data-state=restarted]{border-color:#4caf7a}#engine-status186[data-state=failed]{border-color:#e05555}#engine-status186[hidden]{display:none}#engine-status186 button{padding:5px 10px}';document.head.append(css);
 window.EngineStatus186={show:data=>{text.textContent=data.message;box.dataset.state=data.state||'';box.hidden=false;}};
})();
