/* 1.0.89 · Panneaux stables pendant les réglages.
   Cause : à chaque réglage en direct (curseur, liste, couleur, interrupteur, flèches), le panneau Propriétés / hachures est
   reconstruit ; pendant la reconstruction le navigateur « ancre » le défilement sur un élément qui bouge (scroll anchoring)
   et décale le panneau de quelques pixels à chaque mise à jour, d'où l'effet de défilement pendant un glisser.
   Correctif : ancrage de défilement désactivé dans toute l'interface, et position de défilement des panneaux maintenue
   tant qu'un contrôle est manipulé (bouton de souris enfoncé) et juste après chaque saisie. La molette, les touches de
   navigation et la barre de défilement restent libres. */
(()=>{
 const css=document.createElement('style');css.textContent='html,body,body *{overflow-anchor:none!important}';document.head.append(css);
 const CONTROL='input,select,textarea,button,label,summary,[role=slider],[role=switch],[role=radio],[role=button],.numeric-stepper,.color-favorite-control';
 const scrollers=el=>{const out=[];for(let p=el?.parentElement;p&&p!==document.documentElement;p=p.parentElement){if(p===document.body)break;const o=getComputedStyle(p).overflowY;if(/(auto|scroll|overlay)/.test(o)&&p.scrollHeight>p.clientHeight+1)out.push(p);}return out;};
 let locks=new Map(),pressed=false,until=0,timer=0;
 function lock(el){for(const p of scrollers(el))if(!locks.has(p))locks.set(p,[p.scrollTop,p.scrollLeft]);}
 function restore(){for(const [p,[t,l]]of locks){if(p.scrollTop!==t)p.scrollTop=t;if(p.scrollLeft!==l)p.scrollLeft=l;}}
 function release(){locks.clear();pressed=false;clearTimeout(timer);timer=0;}
 function hold(ms){until=Math.max(until,performance.now()+ms);clearTimeout(timer);timer=setTimeout(function tick(){if(pressed)return;const left=until-performance.now();if(left>0){timer=setTimeout(tick,left);return;}restore();locks.clear();},ms);}
 document.addEventListener('pointerdown',ev=>{const t=ev.target;if(!(t instanceof Element))return;const c=t.closest(CONTROL);if(!c||ev.button!==0){release();return;}release();lock(c);pressed=true;},true);
 const up=()=>{if(!pressed)return;pressed=false;restore();hold(1500);};
 document.addEventListener('pointerup',up,true);document.addEventListener('pointercancel',up,true);window.addEventListener('blur',up);
 for(const type of ['input','change'])document.addEventListener(type,ev=>{const t=ev.target;if(!(t instanceof Element)||!t.closest('aside,.panel,#propertiespanel,dialog,[role=dialog],details'))return;if(!locks.size)lock(t);restore();hold(1500);requestAnimationFrame(restore);},true);
 document.addEventListener('scroll',ev=>{const p=ev.target;if(locks.has(p)&&(pressed||performance.now()<until)){const [t,l]=locks.get(p);if(p.scrollTop!==t||p.scrollLeft!==l){p.scrollTop=t;p.scrollLeft=l;}}},true);
 document.addEventListener('wheel',release,{capture:true,passive:true});
 document.addEventListener('keydown',ev=>{if(['Tab','PageUp','PageDown','Home','End'].includes(ev.key)||(ev.key===' '&&!/INPUT|TEXTAREA|SELECT|BUTTON/.test(ev.target?.tagName||'')))release();},true);
 // Un défilement demandé par l'application (révéler une carte, un champ en erreur…) hors manipulation reste permis.
 const siv=Element.prototype.scrollIntoView;Element.prototype.scrollIntoView=function(...args){if(!pressed)release();return siv.apply(this,args);};
 window.ScrollGuard189={get locked(){return locks.size>0;},release};
})();
