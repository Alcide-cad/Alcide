// Même lecture verticale dans les exports natifs, sans changer les points mesurés.
(()=>{
 const records=dimensionExportRecords;dimensionExportRecords=function(...args){return records.apply(this,args).map(d=>{if((d.textOrientation||'aligned')!=='aligned')return d;const angle=d.angle??Math.atan2(d.b[1]-d.a[1],d.b[0]-d.a[0])*180/Math.PI;if(Math.abs(Math.cos(angle*Math.PI/180))<1e-9)return {...d,textOrientation:'vertical'};return d;});};
})();
