importScripts('canvas-precision.js','theme09-core.js');
// Geometry compilation, viewport culling, level of detail and raster work stay off the UI thread.
let generation=0,objects=new Map(),complete=false,canvas=null,ctx=null;
let svgPaths=new Map(),svgBytes=0;
function svgPath(svg){let path=svgPaths.get(svg);if(path)return path;path=new Path2D(svg);if(svgBytes+svg.length<20000000){svgPaths.set(svg,path);svgBytes+=svg.length;}return path;}
function pathOf(trace){const base=trace.svg?svgPath(trace.svg):null;if(base&&!trace.ops?.length)return base;const path=base?new Path2D(base):new Path2D();for(const op of trace.ops||[]){if(op[0]==='addPath')path.addPath(pathOf(op[1]),op[2]||undefined);else path[op[0]](...op.slice(1));}return path;}
function intersect(a,b){return a[0]<=b[2]&&a[2]>=b[0]&&a[1]<=b[3]&&a[3]>=b[1];}
function matrix(v){const a=(v.angle||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return new DOMMatrix([v.s*c,v.s*s,v.s*s,-v.s*c,v.tx,v.ty]);}
function projectedBounds(v,w,h){const inv=matrix(v).inverse(),p=[[0,0],[w,0],[w,h],[0,h]].map(([x,y])=>inv.transformPoint({x,y}));return [Math.min(...p.map(p=>p.x)),Math.min(...p.map(p=>p.y)),Math.max(...p.map(p=>p.x)),Math.max(...p.map(p=>p.y))];}
function coarseTrace(trace,stride){if(!trace.svg&&trace.ops?.length===1&&trace.ops[0][0]==='addPath'){const child=coarseTrace(trace.ops[0][1],stride);if(!child)return null;const path=new Path2D();path.addPath(child,trace.ops[0][2]||undefined);return path;}if(!trace.svg||trace.ops.length)return null;const pieces=trace.svg.split('M').slice(1);if(pieces.length<16)return null;return new Path2D(pieces.filter((_,i)=>i%stride===0).map(s=>'M'+s).join(''));}
function coarsePath(p,stride){p.coarse??=new Map();if(p.coarse.has(stride))return p.coarse.get(stride);const path=coarseTrace(p.trace,stride);p.coarse.set(stride,path);return path;}

function render(message){if(message.generation!==generation)return;const start=performance.now(),{width,height,dpr,view}=message;
 if(!canvas)canvas=new OffscreenCanvas(Math.round(width*dpr),Math.round(height*dpr));if(canvas.width!==Math.round(width*dpr))canvas.width=Math.round(width*dpr);if(canvas.height!==Math.round(height*dpr))canvas.height=Math.round(height*dpr);ctx??=canvas.getContext('2d');ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);
 const bounds=projectedBounds(view,width,height),selected=new Set(message.selected),candidates=[...objects.values()].filter(e=>intersect(bounds,e.bounds)).sort((a,b)=>a.rank-b.rank);const m=matrix(view),stats={theme:message.theme||'dark',objects:candidates.length,primitives:0,textSkipped:0,hatchSimplified:0,loaded:objects.size,complete,preview:!!message.interactive};
 for(const e of candidates){const chosen=selected.has(e.id);ctx.setTransform(dpr*m.a,dpr*m.b,dpr*m.c,dpr*m.d,dpr*m.e,dpr*m.f);ctx.translate(e.dx,e.dy);
  for(const p of e.primitives){if(message.lod&&!chosen&&p.kind==='text'&&p.height*view.s*dpr<(message.interactive?5:2.5)){stats.textSkipped++;continue;}let path=null;
   if(message.lod&&!chosen&&p.kind==='hatch'&&!p.fill&&p.spacing>0&&p.spacing*view.s*dpr<(message.interactive?3:1.5)){const stride=Math.min(64,2**Math.ceil(Math.log2((message.interactive?3:1.5)/(p.spacing*view.s*dpr))));const coarse=coarsePath(p,stride);if(coarse){path=coarse;stats.hatchSimplified++;}}
   path??=(p.path??=pathOf(p.trace));
   ctx.fillStyle=ctx.strokeStyle=Theme09Core.color(p.color,message.theme||'dark');ctx.globalAlpha=p.alpha;ctx.lineWidth=p.width/view.s;ctx.setLineDash(p.dash);ctx.save();if(p.offset)ctx.translate(p.offset[0],p.offset[1]);if(p.fill)ctx.fill(path,'evenodd');else ctx.stroke(path);ctx.restore();stats.primitives++;
  }
  if(chosen){ctx.strokeStyle=Theme09Core.color(message.selectionColor||'#66b3ff',message.theme||'dark');ctx.globalAlpha=.8;ctx.lineWidth=2/view.s;ctx.setLineDash([]);for(const p of e.primitives){p.path??=pathOf(p.trace);ctx.save();if(p.offset)ctx.translate(p.offset[0],p.offset[1]);ctx.stroke(p.path);ctx.restore();}}
 }
 const bitmap=canvas.transferToImageBitmap();postMessage({type:'frame',generation,request:message.request,view,width,height,dpr,selected:message.selected,stats:{...stats,workerMs:performance.now()-start},bitmap},[bitmap]);
}
async function unpack(message){try{const bytes=Uint8Array.fromBase64?Uint8Array.fromBase64(message.data.sceneGzip):Uint8Array.from(atob(message.data.sceneGzip),c=>c.charCodeAt(0));const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));const scene=JSON.parse(await new Response(stream).text());postMessage({type:'unpacked',id:message.id,scene});}catch(error){postMessage({type:'unpacked',id:message.id,error:error.message});}}
onmessage=event=>{const m=event.data;try{if(m.type==='unpack'){unpack(m);return;}if(m.type==='begin'){generation=m.generation;complete=false;return;}if(m.type==='prune'){if(m.generation===generation){const keep=new Set(m.ids);for(const id of objects.keys())if(!keep.has(id))objects.delete(id);}return;}if(m.type==='reset'){generation=m.generation;objects=new Map();svgPaths=new Map();svgBytes=0;complete=false;return;}if(m.type==='chunk'){if(m.generation===generation)for(const e of m.objects)objects.set(e.id,e);return;}if(m.type==='complete'){if(m.generation===generation)complete=true;postMessage({type:'complete',generation});return;}if(m.type==='render')render(m);}catch(error){postMessage({type:'failure',generation,error:error.message});}};
postMessage({type:'ready',supported:typeof OffscreenCanvas!=='undefined'&&typeof Path2D!=='undefined'&&typeof DOMMatrix!=='undefined'});
