// Compose canvas matrices with JavaScript doubles, before passing a local transform to Skia.
(()=>{
 const states=new WeakMap(),values=m=>[m.a,m.b,m.c,m.d,m.e,m.f];
 const multiply=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
 globalThis.preciseGraphicMatrixMultiply=multiply;
 for(const Type of [globalThis.CanvasRenderingContext2D,globalThis.OffscreenCanvasRenderingContext2D]){
  if(!Type||Type.prototype.__alcidePreciseMatrices)continue;const p=Type.prototype,native={};for(const k of ['setTransform','getTransform','save','restore'])native[k]=p[k];
  const state=c=>{let s=states.get(c);if(!s){s={matrix:values(native.getTransform.call(c)),stack:[]};states.set(c,s);}return s;};
  const apply=(c,m)=>{native.setTransform.call(c,...m);state(c).matrix=m;};
  p.setTransform=function(...args){const v=args[0];apply(this,args.length===1?[v.a??v.m11??1,v.b??v.m12??0,v.c??v.m21??0,v.d??v.m22??1,v.e??v.m41??0,v.f??v.m42??0]:args.length?args:[1,0,0,1,0,0]);};
  p.resetTransform=function(){apply(this,[1,0,0,1,0,0]);};
  p.transform=function(...v){apply(this,multiply(state(this).matrix,v));};
  p.translate=function(x,y){apply(this,multiply(state(this).matrix,[1,0,0,1,x,y]));};
  p.scale=function(x,y){apply(this,multiply(state(this).matrix,[x,0,0,y,0,0]));};
  p.rotate=function(r){const c=Math.cos(r),s=Math.sin(r);apply(this,multiply(state(this).matrix,[c,s,-s,c,0,0]));};
  p.getTransform=function(){return new DOMMatrix(state(this).matrix);};
  p.save=function(){native.save.call(this);state(this).stack.push(state(this).matrix.slice());};
  p.restore=function(){native.restore.call(this);const m=state(this).stack.pop();if(m)apply(this,m);};
  Object.defineProperty(p,'__alcidePreciseMatrices',{value:true});
 }
})();
