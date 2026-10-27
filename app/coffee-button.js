(()=>{
 const bar=document.querySelector('.ribbon-tabs');if(!bar)return;
 const button=document.createElement('button');button.id='offerCoffee';button.type='button';
 button.innerHTML='<span aria-hidden="true">☕</span><span>Café</span>';
 button.title='Offrir un café · soutenir ALCIDE';
 button.setAttribute('aria-label','Offrir un café — soutenir ALCIDE');
 button.onclick=async()=>{try{await window.alcide.openCoffee();}catch(error){console.error(error);button.title='Impossible d’ouvrir le navigateur. Réessayez.';}};
 const fold=document.querySelector('.ribbon-fold'),ribbon=document.getElementById('ribbon');const topbar=document.createElement('div');topbar.className='ribbon-topbar';ribbon.insertBefore(topbar,bar);topbar.append(bar,fold);fold.insertBefore(button,document.getElementById('toggleribbon'));
 const style=document.createElement('style');style.textContent='.ribbon-topbar{display:flex;align-items:center;min-width:0;border-bottom:1px solid var(--border)}.ribbon-topbar>.ribbon-tabs{flex:1;min-width:0;overflow-x:auto;scrollbar-width:thin;padding:0 8px;border-bottom:0}.ribbon-topbar>.ribbon-fold{position:static;flex-shrink:0;gap:8px;padding:3px 8px;min-height:28px}.ribbon-topbar .autohide{flex-shrink:0}.ribbon-topbar #toggleribbon{flex-shrink:0}#offerCoffee{margin-left:0;width:auto;min-width:0;display:inline-flex;align-items:center;justify-content:center;gap:5px;white-space:nowrap;flex-shrink:0;min-height:24px;height:24px;padding:2px 8px;font-size:11px;font-weight:400;color:#a6b4be;background:transparent;border:1px solid #35434d;border-radius:12px}#offerCoffee:hover,#offerCoffee:focus-visible{color:#c4e6a4;background:#26372e;border-color:#8caf72}#offerCoffee:focus-visible{outline:1px solid #c4e6a4;outline-offset:2px}';document.head.append(style);
})();
