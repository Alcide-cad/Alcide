// Local versioned copies. Never replace a source drawing or a user's project.
const fs=require('fs/promises'),path=require('path'),crypto=require('crypto');
module.exports=({app,ipcMain,sources})=>{
 const root=()=>path.join(app.getPath('userData'),'recovery-v09');
 const queues=new Map();
 const hash=x=>crypto.createHash('sha256').update(x.toLowerCase()).digest('hex').slice(0,24);
 async function atomic(file,text){await fs.mkdir(path.dirname(file),{recursive:true});const tmp=file+'.'+crypto.randomUUID()+'.tmp';try{await fs.writeFile(tmp,text,'utf8');await fs.rename(tmp,file);}finally{await fs.unlink(tmp).catch(()=>{});}}
 function identity(data){const source=sources.get(data.docId);if(!source)throw Error('Le dessin est fermé.');return {source,key:hash(path.resolve(data.projectPath||source))};}
 async function list(){const dir=path.join(root(),'index');const files=await fs.readdir(dir).catch(()=>[]),rows=[];for(const f of files.filter(f=>/^[a-f0-9]{24}\.json$/.test(f))){try{const data=JSON.parse(await fs.readFile(path.join(dir,f),'utf8'));for(const row of data.versions||[])if(/^[a-f0-9-]+\.alcide$/.test(row.file))rows.push({...row,key:f.slice(0,-5),path:path.join(root(),'versions',row.file)});}catch{}}return rows.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));}
 async function snapshot(data){const {source,key}=identity(data),stat=await fs.stat(source),ext=path.extname(source).toLowerCase();if(!['.dwg','.dxf'].includes(ext))throw Error('Source de récupération inconnue.');
  const dir=root(),indexPath=path.join(dir,'index',key+'.json');let index={versions:[]};try{index=JSON.parse(await fs.readFile(indexPath,'utf8'));}catch{}
  // Each source revision has its own copy, so older versions remain self-contained.
  const sourceId=hash(source+'|'+stat.size+'|'+stat.mtimeMs),copy=path.join(dir,'sources',sourceId+ext);
  await fs.mkdir(path.dirname(copy),{recursive:true});try{await fs.access(copy);}catch{const temp=copy+'.'+crypto.randomUUID()+'.tmp';try{await fs.copyFile(source,temp);await fs.rename(temp,copy);}finally{await fs.unlink(temp).catch(()=>{});}}
  const saved={};for(const field of ['layerChanges','changes','edits','dimensions','hiddenLayers','layout','units','displayunit','view','dimensionSettings','blockSession'])if(data[field]!==undefined)saved[field]=data[field];
  const createdAt=new Date().toISOString(),file=key+'-'+crypto.randomUUID()+'.alcide',name=String(data.name||path.basename(data.projectPath||source)).slice(0,200);
  const text=JSON.stringify({format:'DWG-Alcide',version:1,source:copy,...saved,recovery:{createdAt,name,originalSource:source,originalProjectPath:data.projectPath||null}});
  if(text.length>80000000)throw Error('Dessin trop volumineux pour la récupération automatique.');
  await atomic(path.join(dir,'versions',file),text);
  const row={file,name,createdAt,dirty:!!data.dirty,reason:data.reason==='manual'?'manual':'automatic',token:data.token};
  const limit=Number.isInteger(data.recoveryVersions)?Math.max(1,Math.min(50,data.recoveryVersions)):12;const previous=index.versions||[],versions=[row,...previous].slice(0,limit);await atomic(indexPath,JSON.stringify({versions}));
  for(const old of previous.slice(limit-1))if(/^[a-f0-9-]+\.alcide$/.test(old.file))await fs.unlink(path.join(dir,'versions',old.file)).catch(()=>{});
  return {...row,key,path:path.join(dir,'versions',file)};
 }
 ipcMain.handle('recovery09-snapshot',(_,data)=>{let id;try{id=identity(data).key;}catch(e){return Promise.reject(e);}const next=(queues.get(id)||Promise.resolve()).catch(()=>{}).then(()=>snapshot(data));queues.set(id,next);next.finally(()=>{if(queues.get(id)===next)queues.delete(id);}).catch(()=>{});return next;});
 ipcMain.handle('recovery09-list',()=>list());
};
