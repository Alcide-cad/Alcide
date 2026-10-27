(()=>{
 const valid=v=>/^D[1-9]\d*$/i.test(v||''),models=()=>{const live=new Set(Reinforcement.views().filter(v=>!v.deleted).map(v=>v.assemblyId));return Object.values(Reinforcement.book().assemblies).filter(m=>m.linearSet&&m.linear?.composition==='custom'&&live.has(m.id));};
 const candidate=m=>m.column100?(/^C[1-9]\d*$/i.test(m.linear.detailReference||'')?m.linear.detailReference.toUpperCase():null):valid(m.linear.name)?m.linear.name.toUpperCase():valid(m.linear.detailReference)?m.linear.detailReference.toUpperCase():null;
 window.nextDetailReference=()=>{const used=new Set(models().map(candidate).filter(Boolean));let n=1;while(used.has('D'+n))n++;return 'D'+n;};
 function repair(){const all=models(),reserved=new Set(all.map(candidate).filter(Boolean)),used=new Set();let changed=false;for(const m of all){let ref=candidate(m);if(!ref||used.has(ref)){const prefix=m.column100?'C':'D';let n=1;while(used.has(prefix+n)||reserved.has(prefix+n))n++;ref=prefix+n;}used.add(ref);if(m.linear.detailReference!==ref){m.linear.detailReference=ref;changed=true;}if(valid(m.linear.name)&&m.linear.name!==ref){m.linear.name=ref;changed=true;}}return changed;}
 const prior=commit;commit=function(...args){repair();return prior.apply(this,args);};
 const init=initScene;initScene=async function(...args){const r=await init.apply(this,args);if(scene){const before=snapshot();if(repair()){commit(before);status('Références des détails harmonisées : D1, D2… · enregistrez le dessin.');}}return r;};
 window.DetailReferences={repair,models};
})();
