// ALCIDE 1.0.96 · Écoute prioritaire (chargée en premier) : les commandes CAO 1.0.96 reçoivent les clics et touches
// avant les autres outils, uniquement lorsqu'elles sont actives.
window.__capture196=[];for(const type of ['pointerdown','pointermove','keydown','contextmenu'])window.addEventListener(type,ev=>{for(const h of window.__capture196)if(h.type===type){try{h.fn(ev);}catch(e){console.warn(e);}if(ev.cancelBubble)break;}},true);
