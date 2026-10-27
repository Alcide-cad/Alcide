// 0.7.7 : éditeur de texte multiligne façon MTEXT AutoCAD. Mise en forme par sélection (gras, italique, souligné,
// barré, surligné, police, hauteur, couleur), symboles, alignement, aperçu WYSIWYG dans la zone de saisie.
// Stockage en codes MTEXT (\f…|b1|i1; \L \K \O \H…; \c…;), rendu au canevas, export / import DXF-DWG.
(()=>{
 const dialog=$('#textdialog'),area=$('#annotationtext');if(!dialog||!area)return;
 // ---------- MTEXT <-> segments ----------
 const esc=t=>t.replace(/\\/g,'\\\\').replace(/\{/g,'\\{').replace(/\}/g,'\\}');
 const rgbInt=h=>{const n=parseInt(h.slice(1),16);return ((n>>16)&255)+(((n>>8)&255)<<8)+((n&255)<<16);};
 const intRgb=v=>'#'+[v&255,(v>>8)&255,(v>>16)&255].map(x=>x.toString(16).padStart(2,'0')).join('');
 const ACI={1:'#ff0000',2:'#ffff00',3:'#00ff00',4:'#00ffff',5:'#0000ff',6:'#ff00ff',7:'#ffffff',8:'#808080',9:'#c0c0c0'};
 const parsedTextCache=new Map();
 function parse(src,base){const cacheKey=JSON.stringify([src,base]);if(parsedTextCache.has(cacheKey))return parsedTextCache.get(cacheKey).map(r=>({...r}));const out=[],stack=[];let st={};let buf='';const flush=()=>{if(buf){out.push({...st,text:buf});buf='';}};let i=0;const read=()=>{const j=src.indexOf(';',i);const v=j<0?src.slice(i):src.slice(i,j);i=j<0?src.length:j+1;return v;};
  while(i<src.length){const c=src[i];if(c==='{'){flush();stack.push({...st});i++;continue;}if(c==='}'){flush();st=stack.pop()||{};i++;continue;}if(c!=='\\'){buf+=c;i++;continue;}const k=src[i+1];i+=2;
   if(k==='\\'||k==='{'||k==='}'){buf+=k;continue;}if(k==='P'){buf+='\n';continue;}if(k==='~'){buf+='\u00a0';continue;}
   flush();if(k==='L')st.u=1;else if(k==='l')st.u=0;else if(k==='O')st.o=1;else if(k==='o')st.o=0;else if(k==='K')st.k=1;else if(k==='k')st.k=0;
   else if(k==='f'||k==='F'){const v=read().split('|');st.font=v[0]||st.font;for(const p of v.slice(1)){if(p[0]==='b')st.b=+p.slice(1)?1:0;if(p[0]==='i')st.i=+p.slice(1)?1:0;}}
   else if(k==='H'){const v=read();const n=parseFloat(v);if(n>0)st.h=/x$/i.test(v)?(st.h||base)*n:n;}
   else if(k==='c'){st.color=intRgb(+read()||0);}else if(k==='C'){const n=+read();st.color=n===256||n===0?undefined:ACI[n]||st.color;}
   else if('AQTWp'.includes(k))read();else if(k==='S'){const v=read();buf+=v.replace(/[#^\/]/,'/');}
  }flush();if(src.length<24000){if(parsedTextCache.size>=128)parsedTextCache.delete(parsedTextCache.keys().next().value);parsedTextCache.set(cacheKey,out.map(r=>({...r})));}return out;}
 function serialize(runs,base){return runs.map(r=>{const t=esc(r.text).replace(/\n/g,'\\P');if(!t)return '';let c='';if(r.font||r.b||r.i)c+='\\f'+(r.font||$('#dialog-text-font')?.value||'Arial')+'|b'+(r.b?1:0)+'|i'+(r.i?1:0)+';';if(r.u)c+='\\L';if(r.o)c+='\\O';if(r.k)c+='\\K';if(r.h&&Math.abs(r.h-base)>1e-9)c+='\\H'+(+r.h.toFixed(4))+';';if(r.color)c+='\\c'+rgbInt(r.color)+';';return c?'{'+c+t+'}':t;}).join('');}
 const rich=runs=>runs.some(r=>r.b||r.i||r.u||r.o||r.k||r.color||r.font||r.h);
 window.RichText={parse,serialize,plain:runs=>runs.map(r=>r.text).join('')};
 // ---------- éditeur ----------
 const ed=document.createElement('div');ed.id='rich-text-editor';ed.contentEditable='true';ed.spellcheck=false;ed.setAttribute('role','textbox');ed.setAttribute('aria-multiline','true');ed.setAttribute('aria-label','Texte');
 const bar=document.createElement('div');bar.id='rich-text-toolbar';bar.setAttribute('role','toolbar');
 const B=(label,title,fn,cls='')=>{const b=document.createElement('button');b.type='button';b.innerHTML=label;b.title=title;b.className='rt-btn '+cls;b.onmousedown=e=>e.preventDefault();b.onclick=()=>{ed.focus();fn();sync();};bar.append(b);return b;};
 const sep=()=>bar.append(Object.assign(document.createElement('span'),{className:'rt-sep'}));
 const cmd=(c,v=null)=>{document.execCommand('styleWithCSS',false,true);document.execCommand(c,false,v);};
 B('<b>G</b>','Gras · Ctrl+B',()=>cmd('bold'));B('<i>I</i>','Italique · Ctrl+I',()=>cmd('italic'));B('<u>S</u>','Souligné · Ctrl+U',()=>cmd('underline'));B('<s>B</s>','Barré',()=>cmd('strikeThrough'));B('<span style="text-decoration:overline">O</span>','Surligné',()=>wrapStyle('textDecorationLine','overline'));sep();
 const font=document.createElement('select');font.id='rich-text-font';font.title='Police de la sélection';bar.append(font);font.onchange=()=>{ed.focus();restoreSel();cmd('fontName',font.value);sync();};
 const hgt=document.createElement('input');hgt.id='rich-text-height';hgt.type='number';hgt.min='0.01';hgt.step='0.5';hgt.title='Hauteur de la sélection (unités du dessin)';bar.append(hgt);hgt.onchange=()=>{const v=cadNumeric(hgt.value);if(!(v>0))return;ed.focus();restoreSel();cmd('fontSize','7');for(const f of ed.querySelectorAll('font[size="7"],[style*="xxx-large"]')){const s=document.createElement('span');s.dataset.h=v;s.style.fontSize=px(v)+'px';s.append(...f.childNodes);f.replaceWith(s);}sync();};
 const col=document.createElement('input');col.id='rich-text-color';col.type='color';col.value='#ffffff';col.title='Couleur de la sélection';bar.append(col);col.oninput=()=>{ed.focus();restoreSel();cmd('foreColor',col.value);sync();};
 B('↺','Couleur par défaut (DuCalque) pour la sélection',()=>{cmd('removeFormat');});sep();
 for(const s of ['²','³','Ø','°','±'])B(s,'Insérer '+s,()=>cmd('insertText',s),'rt-sym');sep();
 const al=document.querySelector('#dialog-text-alignment');for(const [h,label,t] of [['left','⯇','Aligner à gauche'],['center','≡','Centrer'],['right','⯈','Aligner à droite']]){const b=B(label,t,()=>{if(!al)return;const v=(al.value||'left-top').split('-')[1]||'top';al.value=h+'-'+v;al.dispatchEvent(new Event('change',{bubbles:true}));paintAlign();},'rt-al');b.dataset.h=h;}
 let saved=null;const saveSel=()=>{const s=getSelection();if(s.rangeCount&&ed.contains(s.anchorNode))saved=s.getRangeAt(0).cloneRange();};const restoreSel=()=>{if(!saved)return;const s=getSelection();s.removeAllRanges();s.addRange(saved);};
 document.addEventListener('selectionchange',()=>{if(dialog.open)saveSel();});
 function wrapStyle(prop,val){restoreSel();const s=getSelection();if(!s.rangeCount||s.isCollapsed)return;const r=s.getRangeAt(0),span=document.createElement('span');span.style[prop]=val;span.append(r.extractContents());r.insertNode(span);}
 const base=()=>cadNumeric($('#annotationheight').value)||2.5;const px=h=>Math.max(8,Math.min(64,16*h/base()));
 function paintAlign(){const h=(al?.value||'left').split('-')[0];ed.style.textAlign=h;for(const b of bar.querySelectorAll('.rt-al'))b.classList.toggle('active',b.dataset.h===h);ed.style.fontFamily='"'+($('#dialog-text-font')?.value||'Segoe UI')+'", "Segoe UI", Arial, sans-serif';}
 // DOM -> segments
 function runs(){const out=[];const push=(text,st)=>{const l=out.at(-1);if(l&&['b','i','u','o','k','font','h','color'].every(k=>l[k]===st[k]))l.text+=text;else out.push({...st,text});};const baseFont=$('#dialog-text-font')?.value||'';
  const walk=(n,first)=>{for(const c of n.childNodes){if(c.nodeType===3){const el=c.parentElement,cs=getComputedStyle(el),dec=cs.textDecorationLine||'';let anc=el,h,o=0,u=0,k=0;while(anc&&anc!==ed){if(anc.dataset?.h&&h===undefined)h=+anc.dataset.h;const d=getComputedStyle(anc).textDecorationLine||'';if(d.includes('overline'))o=1;if(d.includes('underline'))u=1;if(d.includes('line-through'))k=1;if(anc.tagName==='U')u=1;if(anc.tagName==='S'||anc.tagName==='STRIKE')k=1;anc=anc.parentElement;}const fam=cs.fontFamily.split(',')[0].replace(/["']/g,'').trim(),edFam=getComputedStyle(ed).fontFamily.split(',')[0].replace(/["']/g,'').trim();const color=cs.color,edColor=getComputedStyle(ed).color;push(c.data.replace(/\u200b/g,''),{b:+cs.fontWeight>=600?1:0,i:cs.fontStyle==='italic'?1:0,u,o,k,font:fam&&fam!==edFam?fam:undefined,h,color:color!==edColor?'#'+color.match(/\d+/g).slice(0,3).map(x=>(+x).toString(16).padStart(2,'0')).join(''):undefined});}else if(c.nodeName==='BR'){push('\n',{});}else{const block=/^(DIV|P)$/.test(c.nodeName);if(block&&(out.length&&!out.at(-1).text.endsWith('\n')))push('\n',{});walk(c,false);}}};walk(ed,true);
  for(const r of out){for(const k of ['b','i','u','o','k'])if(!r[k])delete r[k];for(const k of ['font','h','color'])if(r[k]===undefined)delete r[k];}
  const last=out.at(-1);if(last&&last.text.endsWith('\n')&&ed.lastChild?.nodeName!=='BR')last.text=last.text.replace(/\n$/,'');return out.filter(r=>r.text);}
 function load(list){ed.replaceChildren();for(const r of list){const parts=r.text.split('\n');parts.forEach((t,j)=>{if(j)ed.append(document.createElement('br'));if(!t)return;const s=document.createElement('span');s.textContent=t;if(r.b)s.style.fontWeight='700';if(r.i)s.style.fontStyle='italic';const d=[r.u&&'underline',r.o&&'overline',r.k&&'line-through'].filter(Boolean).join(' ');if(d)s.style.textDecorationLine=d;if(r.font)s.style.fontFamily=r.font;if(r.color)s.style.color=r.color;if(r.h){s.dataset.h=r.h;s.style.fontSize=px(r.h)+'px';}ed.append(s);});}}
 let single=false;
 function sync(){const r=runs();area.value=RichText.plain(r);window.richTextMtext=!single&&rich(r)?serialize(r,base()):null;area.dispatchEvent(new Event('input',{bubbles:true}));}
 ed.addEventListener('input',sync);
 ed.addEventListener('keydown',ev=>{const m=ev.ctrlKey||ev.metaKey;if(m&&!ev.shiftKey&&/^[biu]$/i.test(ev.key)){ev.preventDefault();if(single)return;cmd({b:'bold',i:'italic',u:'underline'}[ev.key.toLowerCase()]);sync();return;}if(ev.key==='Enter'&&!m){ev.preventDefault();if(single)return;cmd('insertLineBreak');sync();}});
 ed.addEventListener('paste',ev=>{ev.preventDefault();const t=(ev.clipboardData.getData('text/plain')||'').replace(/\r/g,'');cmd('insertText',single?t.replace(/\n/g,' '):t);sync();});
 area.after(bar,ed);area.style.setProperty('display','none','important');
 const prev=$('#text-live-preview');if(prev)prev.style.setProperty('display','none','important');
 // ---------- ouverture ----------
 const open=openTextEditor;openTextEditor=function(...a){const r=open.apply(this,a);if(!dialog.open)return r;const e=selected.size===1?entities.get([...selected][0]):null,p=e?textProperties(e):null;
  font.replaceChildren(...[...($('#dialog-text-font')?.options||[])].map(o=>new Option(o.text,o.value)));font.value=$('#dialog-text-font')?.value||'';hgt.value=base();
  single=!!(e?.nativeText&&!e.annotation&&e.type==='TEXT');for(const b of bar.querySelectorAll('button:not(.rt-sym),select,input'))b.disabled=single;bar.title=single?'Texte simple (TEXT) : une ligne, sans mise en forme · les textes multilignes (MTEXT) acceptent la mise en forme':'';
  const src=p?.mtext||(e?.annotation?.mtext)||null;load(src?parse(src,base()):[{text:area.value}]);paintAlign();sync();setTimeout(()=>{ed.focus();const s=getSelection(),rg=document.createRange();rg.selectNodeContents(ed);s.removeAllRanges();s.addRange(rg);},0);return r;};
 dialog.addEventListener('change',ev=>{if(ev.target.id==='dialog-text-font'||ev.target.id==='dialog-text-alignment')paintAlign();if(ev.target.id==='annotationheight')for(const s of ed.querySelectorAll('[data-h]'))s.style.fontSize=px(+s.dataset.h)+'px';});
 // ---------- validation : codes MTEXT transmis ----------
 const ctp=changeTextProperties;changeTextProperties=function(patch,...rest){if(dialog.open&&patch&&'text' in patch){patch={...patch,mtext:window.richTextMtext||null};}return ctp.call(this,patch,...rest);};
 const confirm=$('#textconfirm').onclick;$('#textconfirm').onclick=async(...a)=>{sync();const m=window.richTextMtext,id=typeof textDraft==='string'?textDraft:null;const r=await confirm(...a);if(dialog.open)return r;if(id&&edits[id]?.annotation){if(m)edits[id].annotation.mtext=m;else delete edits[id].annotation.mtext;}if(textDraft&&typeof textDraft==='object'){if(m)textDraft.mtext=m;else delete textDraft.mtext;}if(typeof reperePlacement!=='undefined'&&reperePlacement&&!reperePlacement.editing){if(m)reperePlacement.mtext=m;}drawOverlay();return r;};
 // ---------- rendu canevas des textes ALCIDE mis en forme ----------
 window.drawRichText=function(oc,a,s){const list=parse(a.mtext,a.height),def=oc.fillStyle,lh=a.height*s*1.4;let x=0,y=0;for(const r of list){const parts=r.text.split('\n');parts.forEach((t,j)=>{if(j){x=0;y+=lh;}if(!t)return;const h=(r.h||a.height)*s;oc.font=fontCss({...a,fontFace:r.font||a.fontFace,bold:!!r.b,italic:!!r.i},h);oc.fillStyle=r.color&&def!==selectionColor()?r.color:def;oc.fillText(t,x,y);const w=oc.measureText(t).width;oc.strokeStyle=oc.fillStyle;oc.lineWidth=Math.max(1,h/14);for(const [on,dy] of [[r.u,h*.15],[r.o,-h*.95],[r.k,-h*.32]])if(on){oc.beginPath();oc.moveTo(x,y+dy);oc.lineTo(x+w,y+dy);oc.stroke();}x+=w;});}};
 const css=document.createElement('style');css.textContent=`
#textdialog{width:min(600px,92vw)!important;padding:14px 16px!important;max-height:90vh}
#textdialog h2{font-size:15px!important;margin:0 0 8px!important}
#rich-text-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:3px;padding:4px;background:#17222c;border:1px solid #33434f;border-bottom:0;border-radius:6px 6px 0 0}
#rich-text-toolbar .rt-btn{min-width:26px;height:24px;padding:0 6px!important;font-size:13px;border-radius:4px;line-height:22px}
#rich-text-toolbar .rt-btn.active{background:#344738;border-color:#89b872}
#rich-text-toolbar .rt-sep{width:1px;height:18px;background:#3a4b58;margin:0 3px}
#rich-text-toolbar select{height:24px;max-width:150px;font-size:12px;padding:0 4px}
#rich-text-toolbar input[type=number]{width:62px;height:24px;font-size:12px;padding:0 4px}
#rich-text-toolbar .numeric-stepper{display:inline-flex!important;width:84px!important;flex:0 0 84px!important;height:24px}#rich-text-toolbar .numeric-stepper input{width:58px!important;height:24px!important}#rich-text-toolbar .numeric-stepper-buttons button{height:12px!important;min-height:0!important;padding:0 4px!important;font-size:8px!important}
#rich-text-toolbar .color-favorite-control{display:inline-flex!important;align-items:center;gap:2px;width:auto!important;flex:0 0 auto!important}#rich-text-toolbar .color-favorite-open,#rich-text-toolbar .color-favorite-add{display:none!important}#rich-text-toolbar .color-favorite-swatches{display:inline-flex;gap:2px}#rich-text-toolbar .color-favorite-swatches>*{width:14px!important;height:14px!important;min-width:0!important;padding:0!important}
#rich-text-toolbar .rt-sym{font-size:13px!important;font-weight:600}
#rich-text-toolbar input[type=color]{width:28px;height:24px;padding:1px;border-radius:4px}
#rich-text-editor{min-height:90px;max-height:38vh;overflow:auto;padding:8px 10px;background:#0f171e;border:1px solid #33434f;border-radius:0 0 6px 6px;font-size:16px;line-height:1.4;color:#e6edf3;white-space:pre-wrap;overflow-wrap:anywhere;outline:none}
#rich-text-editor:focus{border-color:#8fd06c}
#textdialog .text-dialog-grid{gap:6px 12px!important;margin:8px 0!important}
#textdialog .text-dialog-field{font-size:12px!important;gap:2px!important}
#textdialog .text-dialog-field input,#textdialog .text-dialog-field select{min-height:24px!important;height:26px;padding:2px 6px!important;font-size:12px!important}
#textdialog .text-dialog-options{margin:4px 0;border:1px solid #2b3946;border-radius:6px;padding:4px 8px}
#textdialog .text-dialog-options:not([open]){padding:3px 8px}
#textdialog .text-dialog-hint{margin:6px 0!important}
#textdialog .text-dialog-footer button{min-height:28px!important;padding:4px 12px!important;font-size:12px!important}
`;document.head.append(css);
 const hint=[...dialog.querySelectorAll('p')].find(p=>p.textContent.includes('Ctrl+Entrée'));if(hint)hint.textContent='Entrée : nouvelle ligne · Ctrl+B / I / U : gras, italique, souligné · Ctrl+Entrée : valider · Échap : annuler';
 window.richTextReady=true;
})();
