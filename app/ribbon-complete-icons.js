(()=>{
 const paths={
 filter:'M4 5h16l-6 7v7l-4-2v-5z',
 colour:'M4 5h16l-6 7v7l-4-2v-5zM18 15a3 3 0 1 0 0 6 3 3 0 1 0 0-6',
 isolate:'M3 8V3h5M16 3h5v5M21 16v5h-5M8 21H3v-5M8 8h8v8H8z',
 restore:'M3 8V3h5M16 3h5v5M21 16v5h-5M8 21H3v-5M8 8l8 8M16 8l-8 8',
 settings:'M4 6h16M4 12h16M4 18h16M8 3v6M16 9v6M10 15v6',
 repeat:'M20 9a8 8 0 1 0 0 7M20 3v6h-6',
 scale:'M4 5h16v14H4zM8 5v5M12 5v3M16 5v5M8 15h8M13 12l3 3-3 3',
 library:'M4 4h4v16H4zM10 4h4v16h-4zM17 4l4 1-3 15-4-1z',
 save:'M4 3h14l3 3v15H3V3zM7 3v6h10V3M7 21v-8h10v8',
 front:'M3 9h12v12H3zM9 3h12v12H9zM17 18v-7M14 14l3-3 3 3',
 back:'M9 3h12v12H9M3 9h12v12H3zM18 17v5M15 19l3 3 3-3',
 forward:'M3 10h11v11H3zM10 3h11v11H10zM5 7V2M2 5l3-3 3 3',
 backward:'M10 3h11v11H10zM3 10h11v11H3zM18 17v5M15 19l3 3 3-3',
 overlap:'M3 3h12v12H3zM9 9h12v12H9zM9 9h6v6H9z',
 add:'M3 4h10v10H3zM8 9h10v10H8zM18 3v6M15 6h6'
 };
 const map={'home-selection-search-layer-tool':'filter','home-selection-search-color-tool':'colour','home-selection-search-tool':'filter','home-similar-add-tool':'add','repeat-last-command':'repeat','scale-tool':'scale','detail-library-tool':'library','detail-library-save':'save','drawing-order-front':'front','drawing-order-back':'back','drawing-order-forward':'forward','drawing-order-backward':'backward','overlap-selection-tool':'overlap'};
 for(const prefix of ['ribbon-accueil','ribbon-selection'])for(const [suffix,key]of [['isolate','isolate'],['unisolate','restore'],['isolation-settings','settings']])map[prefix+'-'+suffix]=key;
 for(const b of document.querySelectorAll('#ribboncontent .ribbon-tools button,#ribboncontent .rebar-command-tools button')){
  if(b.querySelector('svg,.ribbon-icon'))continue;const key=map[b.id]||'settings',svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),path=document.createElementNS(svg.namespaceURI,'path');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.classList.add('tool-pictogram');path.setAttribute('d',paths[key]);svg.append(path);b.prepend(svg);
 }
 window.ribbonIconAudit=()=>[...document.querySelectorAll('#ribboncontent .ribbon-tools button,#ribboncontent .rebar-command-tools button')].filter(b=>!b.querySelector('svg,.ribbon-icon')).map(b=>b.id);
 window.RibbonFit?.fit();
})();
