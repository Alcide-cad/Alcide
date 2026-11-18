/* 1.0.87 · Petit message temporaire en bas du dessin (joindre, mesure rapide, dégradés). */
(()=>{
 const box=document.createElement('div');box.id='toast187';box.setAttribute('role','status');box.hidden=true;document.body.append(box);let timer=0;
 window.toast187=(text,ms=3500)=>{box.textContent=text;box.hidden=false;clearTimeout(timer);timer=setTimeout(()=>{box.hidden=true;},ms);};
 const css=document.createElement('style');css.textContent='#toast187{position:fixed;z-index:231;left:50%;transform:translateX(-50%);bottom:28px;max-width:min(560px,calc(100vw - 32px));padding:8px 14px;border-radius:7px;background:#1d2b35;border:1px solid #4d6878;color:#e6edf3;font-size:12.5px;box-shadow:0 8px 24px #0006;pointer-events:none}';document.head.append(css);
})();
