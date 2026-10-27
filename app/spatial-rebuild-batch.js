// Les extensions préparent leur géométrie avant la construction finale.
(()=>{
 const rebuild=rebuildTree,build=buildTree,search=query;let depth=0,pending=null,flushing=false;
 window.spatialRebuildStats={requests:0,builds:0,queryFlushes:0};
 function flush(){if(!pending)return;const args=pending;pending=null;flushing=true;try{tree=build.apply(window,args);spatialRebuildStats.builds++;}finally{flushing=false;}}
 buildTree=function(...args){if(!depth||flushing)return build.apply(this,args);pending=args;spatialRebuildStats.requests++;return tree;};
 query=function(...args){if(depth&&pending&&!flushing&&args.length<2){spatialRebuildStats.queryFlushes++;flush();}return search.apply(this,args);};
 rebuildTree=function(...args){depth++;let ok=false;try{const result=rebuild.apply(this,args);ok=true;return result;}finally{depth--;if(!depth){if(ok)flush();else pending=null;}}};
})();
