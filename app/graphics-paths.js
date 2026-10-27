// Record canvas geometry for exact replay by the dedicated graphics worker.
(()=>{
 const localPaths=new WeakMap();
 window.graphicLocalPath=function(p){if(!p.d)return p.path;let cached=localPaths.get(p);const key=JSON.stringify(p.localMatrix||null);if(!cached||cached.d!==p.d||cached.key!==key){let path=new Path2D(p.d);if(p.localMatrix){const transformed=new Path2D();transformed.addPath(path,new DOMMatrix(p.localMatrix));path=transformed;}cached={d:p.d,key,path};localPaths.set(p,cached);}return cached.path;};
 window.paintGraphicPrimitive=function(context,p,fill=p.fill){const local=!!p.d&&!!p.offset;context.save();if(local)context.translate(p.offset[0],p.offset[1]);const path=local?graphicLocalPath(p):p.path;if(fill)context.fill(path,'evenodd');else context.stroke(path);context.restore();};
 window.graphicPrimitiveHit=function(context,p,x,y,stroke=false){const local=!!p.d&&!!p.offset;if(local){x-=p.offset[0];y-=p.offset[1];}const path=local?graphicLocalPath(p):p.path;return stroke?context.isPointInStroke(path,x,y):context.isPointInPath(path,x,y,'evenodd');};
 window.transformGraphicPrimitive=function(p,matrix){if(!p.d)return null;const origin=matrix.transformPoint({x:p.offset?.[0]||0,y:p.offset?.[1]||0}),linear=new DOMMatrix([matrix.a,matrix.b,matrix.c,matrix.d,0,0]).multiply(new DOMMatrix(p.localMatrix||undefined)),out={...p,offset:[origin.x,origin.y],localMatrix:[linear.a,linear.b,linear.c,linear.d,0,0],selectionPaths:p.selectionPaths?.map(ps=>ps.map(v=>{const q=matrix.transformPoint({x:v[0],y:v[1]});return [q.x,q.y];}))};out.path=graphicPrimitivePath(out);return out;};
 const Native=window.Path2D,traces=new WeakMap();
 const snapshot=p=>{const t=traces.get(p);return t?{svg:t.svg,ops:t.ops.slice()}:null;};
 class RecordedPath extends Native{
  constructor(source){super(source);const t=typeof source==='string'?{svg:source,ops:[]}:source?snapshot(source):{svg:null,ops:[]};if(t)traces.set(this,t);}
  addPath(path,matrix){super.addPath(path,matrix);const t=traces.get(this),child=snapshot(path);if(t&&child)t.ops.push(['addPath',child,matrix?{a:matrix.a,b:matrix.b,c:matrix.c,d:matrix.d,e:matrix.e,f:matrix.f}:null]);else traces.delete(this);}
 }
 for(const name of ['moveTo','lineTo','closePath','arc','arcTo','ellipse','rect','roundRect','bezierCurveTo','quadraticCurveTo'])if(Native.prototype[name])RecordedPath.prototype[name]=function(...args){Native.prototype[name].apply(this,args);traces.get(this)?.ops.push([name,...args]);};
 window.Path2D=RecordedPath;window.graphicsPathTrace=snapshot;
 window.graphicPrimitivePath=function(p){let path=p.d?graphicLocalPath(p):new RecordedPath();if(!p.d)for(const ps of p.paths||[]){if(!ps.length)continue;path.moveTo(...ps[0]);for(const v of ps.slice(1))path.lineTo(...v);if(p.fill)path.closePath();}if(p.d&&p.offset?.some(v=>v!==0)){const translated=new RecordedPath();translated.addPath(path,new DOMMatrix().translate(p.offset[0],p.offset[1]));path=translated;}return path;};
 window.prepareLazyGraphicPath=function(p){if(!p.d||Object.hasOwn(p,'_lazyGraphicPath'))return;p._lazyGraphicPath=true;Object.defineProperty(p,'path',{configurable:true,enumerable:true,get(){const path=graphicPrimitivePath(p);Object.defineProperty(p,'path',{value:path,writable:true,configurable:true,enumerable:true});return path;},set(value){Object.defineProperty(p,'path',{value,writable:true,configurable:true,enumerable:true});}});};
})();
