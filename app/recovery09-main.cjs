// Local versioned copies. Never replace a source drawing or a user's project.
const fs=require('fs/promises'),path=require('path'),crypto=require('crypto');
module.exports=({app,ipcMain,sources})=>{
 const root=()=>path.join(app.getPath('userData'),'recovery-v09');
 const queues=new Map();
 const hash=x=>crypto.createHash('sha256').update(x.toLowerCase()).digest('hex').slice(0,24);
 async function atomic(file,text){await fs.mkdir(path.dirname(file),{recursive:true});const tmp=file+'.'+crypto.randomUUID()+'.tmp';try{const handle=await fs.open(tmp,'w');try{await handle.writeFile(text,'utf8');await handle.sync();}finally{await handle.close();}await fs.rename(tmp,file);}finally{await fs.unlink(tmp).catch(()=>{});}}
 function identity(data){const source=sources.get(data.docId);if(!source)throw Error('Le dessin est fermé.');return {source,key:hash(path.resolve(data.projectPath||data.drawingPath||source))};}
 async function list(){
  const dir=root(),rows=[],known=new Set(),latest=new Map();
  const indexes=await fs.readdir(path.join(dir,'index')).catch(()=>[]);
  for(const f of indexes.filter(f=>/^[a-f0-9]{24}\.json$/.test(f))){try{
   const data=JSON.parse(await fs.readFile(path.join(dir,'index',f),'utf8')),key=f.slice(0,-5);
   if(!Array.isArray(data.versions))continue;
   for(const row of data.versions){if(!row||typeof row.file!=='string'||!row.file.startsWith(key+'-')||!new RegExp('^[a-f0-9-]+\\.alcide$').test(row.file)||typeof row.createdAt!=='string'||!Number.isFinite(Date.parse(row.createdAt)))continue;
    const file=path.join(dir,'versions',row.file);try{await fs.access(file);}catch{continue;}
    rows.push({...row,key,path:file});known.add(row.file);latest.set(key,Math.max(latest.get(key)||0,Date.parse(row.createdAt)));
   }
  }catch{}}
  // A crash can leave a complete version before its index is committed.
  // Reconstruct missing entries from self-contained copies, never from temp files.
  const files=await fs.readdir(path.join(dir,'versions')).catch(()=>[]),sourceRoot=path.resolve(dir,'sources')+path.sep;
  for(const file of files){const match=/^([a-f0-9]{24})-[a-f0-9-]+\.alcide$/.exec(file);if(!match||known.has(file))continue;
   try{const full=path.join(dir,'versions',file),stat=await fs.stat(full),key=match[1];if(stat.size>80000000||stat.mtimeMs<(latest.get(key)||0))continue;
    const saved=JSON.parse(await fs.readFile(full,'utf8')),r=saved.recovery;
    if(saved.format!=='DWG-Alcide'||saved.version!==1||!r||typeof r.createdAt!=='string'||!Number.isFinite(Date.parse(r.createdAt))||typeof saved.source!=='string'||!path.resolve(saved.source).startsWith(sourceRoot))continue;
    if(Date.parse(r.createdAt)<(latest.get(key)||0))continue;await fs.access(saved.source);
    rows.push({file,key,path:full,name:String(r.name||'Dessin récupéré').slice(0,200),createdAt:r.createdAt,dirty:r.dirty!==false,reason:r.reason||'automatic',token:r.token});
   }catch{}
  }
  return rows.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
 }
 async function snapshot(data,verifiedPath=null){const {source:baseline,key}=identity(data),source=verifiedPath||baseline,stat=await fs.stat(source),ext=path.extname(source).toLowerCase();if(!['.dwg','.dxf'].includes(ext))throw Error('Source de récupération inconnue.');
  const dir=root(),indexPath=path.join(dir,'index',key+'.json');let index={versions:[]};try{const parsed=JSON.parse(await fs.readFile(indexPath,'utf8'));if(Array.isArray(parsed?.versions))index=parsed;}catch{}
  // Each source revision has its own copy, so older versions remain self-contained.
  const sourceId=hash(source+'|'+stat.size+'|'+stat.mtimeMs),copy=path.join(dir,'sources',sourceId+ext);
  await fs.mkdir(path.dirname(copy),{recursive:true});try{await fs.access(copy);}catch{const temp=copy+'.'+crypto.randomUUID()+'.tmp';try{await fs.copyFile(source,temp);const handle=await fs.open(temp,'r+');try{await handle.sync();}finally{await handle.close();}await fs.rename(temp,copy);}finally{await fs.unlink(temp).catch(()=>{});}}
  const saved={};for(const field of ['layerChanges','changes','edits','dimensions','hiddenLayers','layout','units','displayunit','view','dimensionSettings','blockSession'])if(data[field]!==undefined)saved[field]=data[field];
  const createdAt=new Date().toISOString(),file=key+'-'+crypto.randomUUID()+'.alcide',name=String(data.name||path.basename(data.projectPath||data.drawingPath||source)).slice(0,200);
  const text=JSON.stringify({format:'DWG-Alcide',version:1,source:copy,...saved,recovery:{createdAt,name,originalSource:source,originalProjectPath:data.projectPath||null,dirty:!!data.dirty,reason:verifiedPath?'verified-dwg':data.reason==='manual'?'manual':'automatic',token:data.token}});
  if(text.length>80000000)throw Error('Dessin trop volumineux pour la récupération automatique.');
  await atomic(path.join(dir,'versions',file),text);
  const row={file,name,createdAt,dirty:!!data.dirty,reason:verifiedPath?'verified-dwg':data.reason==='manual'?'manual':'automatic',token:data.token,...(typeof data.thumbnail==='string'&&data.thumbnail.length<160000&&/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(data.thumbnail)?{thumbnail:data.thumbnail}:{})};
  const limit=Number.isInteger(data.recoveryVersions)?Math.max(1,Math.min(50,data.recoveryVersions)):12;const previous=index.versions||[];
  const candidates=[row,...previous],verified=candidates.find(v=>v.reason==='verified-dwg');
  const versions=[...(verified?[verified]:[]),...candidates.filter(v=>v.reason!=='verified-dwg').slice(0,limit)].sort((a,b)=>b.createdAt.localeCompare(a.createdAt));await atomic(indexPath,JSON.stringify({versions}));
  for(const old of previous.filter(v=>!versions.includes(v)))if(/^[a-f0-9-]+\.alcide$/.test(old.file))await fs.unlink(path.join(dir,'versions',old.file)).catch(()=>{});
  return {...row,key,path:path.join(dir,'versions',file)};
 }
 function enqueue(data,verifiedPath=null){const {key}=identity(data);const next=(queues.get(key)||Promise.resolve()).catch(()=>{}).then(()=>snapshot(data,verifiedPath));queues.set(key,next);next.finally(()=>{if(queues.get(key)===next)queues.delete(key);}).catch(()=>{});return next;}
 ipcMain.handle('recovery09-snapshot',async(_,data)=>enqueue(data));
 ipcMain.handle('recovery09-list',()=>list());
 return {recordVerified:async(docId,drawingPath)=>enqueue({docId,drawingPath},drawingPath)};
};
