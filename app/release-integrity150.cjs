const fs=require('fs'),path=require('path'),crypto=require('crypto');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const codeFile=n=>/\.(?:js|cjs|html|css)$/.test(n)||n==='package.json';
function seal(dir){
 const version=JSON.parse(fs.readFileSync(path.join(dir,'package.json'),'utf8')).version;
 const files={};for(const name of fs.readdirSync(dir).sort())if(codeFile(name))files[name]=hash(fs.readFileSync(path.join(dir,name)));
 const engineFiles=folder=>{for(const entry of fs.readdirSync(folder,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const f=path.join(folder,entry.name);if(entry.isDirectory())engineFiles(f);else if(entry.isFile())files[path.relative(dir,f).split(path.sep).join('/')]=hash(fs.readFileSync(f));}};
 engineFiles(path.join(dir,'engine'));
 const buildId=hash(JSON.stringify({version,files}));const manifest={schema:1,version,buildId,files};
 fs.writeFileSync(path.join(dir,'release-manifest150.json'),JSON.stringify(manifest,null,2)+'\n');
 return manifest;
}
async function verify(dir,current,{deep=false}={}){
 const started=Date.now(),errors=[];let m;
 try{m=JSON.parse(await fs.promises.readFile(path.join(dir,'release-manifest150.json'),'utf8'));}catch{return {ok:false,version:current,errors:['Manifeste de version absent ou illisible.'],milliseconds:Date.now()-started};}
 if(m.schema!==1||m.version!==current||!m.files||m.buildId!==hash(JSON.stringify({version:m.version,files:m.files})))errors.push('Le manifeste ne correspond pas à la version du programme.');
 const required=['package.json','main.cjs','preload.cjs','index.html','release-integrity150.cjs'];
 for(const n of required)if(!m.files?.[n])errors.push('Composant obligatoire absent du manifeste : '+n);
 const stampFile=path.resolve(dir,'../../installed-release150.json');
 if(fs.existsSync(stampFile))try{const stamp=JSON.parse(await fs.promises.readFile(stampFile,'utf8'));if(stamp.version!==current||stamp.buildId!==m.buildId)errors.push('Les fichiers lancés ne correspondent pas à la dernière installation dans ce dossier.');}catch{errors.push('Le contrôle de fin d’installation est illisible.');}
 for(const [name,expected] of Object.entries(m.files||{})){
  if(!deep&&(name.includes('/')||!codeFile(name)))continue;
  if(name.includes('..')||name.includes('\\')||path.isAbsolute(name)){errors.push('Chemin de manifeste invalide.');continue;}
  try{if(hash(await fs.promises.readFile(path.join(dir,name)))!==expected)errors.push('Fichier différent de cette version : '+name);}catch{errors.push('Fichier manquant : '+name);}
 }
 return {ok:!errors.length,version:current,buildId:m.buildId,errors,milliseconds:Date.now()-started,deep};
}
async function prepareSession(session,profile,buildId){
 const marker=path.join(profile,'release-cache150.json');let previous;try{previous=JSON.parse(await fs.promises.readFile(marker,'utf8')).buildId;}catch{}
 if(previous===buildId)return false;
 await session.clearCache();
 // Only compiled JS is cleared; user preferences, recovery files and drawings remain intact.
 if(typeof session.clearCodeCaches==='function')await session.clearCodeCaches({urls:[]});
 await fs.promises.mkdir(profile,{recursive:true});const temp=marker+'.'+process.pid+'.tmp';await fs.promises.writeFile(temp,JSON.stringify({buildId}));await fs.promises.rename(temp,marker);return true;
}
module.exports={seal,verify,prepareSession};
if(require.main===module){const dir=path.resolve(process.argv[2]||__dirname);const m=seal(dir);console.log(JSON.stringify({version:m.version,buildId:m.buildId,files:Object.keys(m.files).length}));}
