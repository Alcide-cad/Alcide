// 1.0.94 · Installation d'ODA File Converter en un clic, sans l'embarquer dans ALCIDE.
// Téléchargement de l'installeur officiel (opendesign.com) au clic de l'utilisateur, extraction
// par utilisateur (msiexec /a, sans droits administrateur) dans %LOCALAPPDATA%\DWG-Alcide\Tools,
// sinon installation normale de l'MSI (fenêtre Windows et demande d'autorisation), puis auto-test.
'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),{spawn}=require('child_process');
const PAGE='https://www.opendesign.com/guestfiles/oda_file_converter';
const MSI_URL='https://www.opendesign.com/guestfiles/get?filename=ODAFileConverter_QT6_vc16_amd64dll.msi';
const MIN_BYTES=5*1024*1024;

async function download(url,dest,onProgress,fetchImpl){
 const doFetch=fetchImpl||globalThis.fetch;
 const res=await doFetch(url,{redirect:'follow',headers:{'User-Agent':'ALCIDE (ODA File Converter setup)'}});
 if(!res.ok)throw Error('Téléchargement refusé par opendesign.com (HTTP '+res.status+').');
 const total=+res.headers.get('content-length')||0;const finalUrl=res.url||url;
 const version=(decodeURIComponent(finalUrl).match(/ODAFileConverter[^/?]*?_(\d+(?:\.\d+)+)\.msi/i)||[])[1]||null;
 const part=dest+'.part';const out=fs.createWriteStream(part);let received=0,last=0;
 try{
  const reader=res.body.getReader();
  for(;;){const {done,value}=await reader.read();if(done)break;received+=value.length;if(!out.write(Buffer.from(value)))await new Promise(r=>out.once('drain',r));const now=Date.now();if(now-last>150){last=now;onProgress?.({phase:'download',received,total});}}
  await new Promise((r,j)=>out.end(e=>e?j(e):r()));
 }catch(e){out.destroy();fs.rmSync(part,{force:true});throw Error('Téléchargement interrompu : '+(e.message||e));}
 if(received<MIN_BYTES){fs.rmSync(part,{force:true});throw Error('Fichier téléchargé incomplet ('+received+' octets).');}
 const head=Buffer.alloc(8);const fd=fs.openSync(part,'r');fs.readSync(fd,head,0,8,0);fs.closeSync(fd);
 if(head.toString('hex')!=='d0cf11e0a1b11ae1'){fs.rmSync(part,{force:true});throw Error('Le fichier reçu n’est pas un installeur Windows (MSI).');}
 fs.renameSync(part,dest);onProgress?.({phase:'download',received,total:total||received});
 return {path:dest,bytes:received,version,url:finalUrl};
}

function run(exe,commandLine,timeoutMs,spawnImpl){
 return new Promise(resolve=>{
  let child;try{child=(spawnImpl||spawn)(exe,[commandLine],{windowsVerbatimArguments:true,windowsHide:true,stdio:'ignore'});}catch(e){return resolve({code:-1,error:e.message});}
  const timer=setTimeout(()=>{try{child.kill();}catch{}resolve({code:-2,error:'délai dépassé'});},timeoutMs);
  child.on('error',e=>{clearTimeout(timer);resolve({code:-1,error:e.message});});
  child.on('exit',code=>{clearTimeout(timer);resolve({code});});
 });
}
const q=s=>'"'+String(s).replace(/"/g,'')+'"';

// Conversion réelle d'un petit DXF en DWG : prouve que l'exécutable installé fonctionne.
async function selfTest(exe,spawnImpl){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'alcide-oda-test-'));const src=path.join(root,'in'),dst=path.join(root,'out');fs.mkdirSync(src);fs.mkdirSync(dst);
 const dxf=['0','SECTION','2','ENTITIES','0','LINE','8','0','10','0','20','0','30','0','11','100','21','0','31','0','0','ENDSEC','0','EOF',''].join('\r\n');
 fs.writeFileSync(path.join(src,'test.dxf'),dxf);
 const r=await run(exe,[q(src),q(dst),'ACAD2018','DWG','0','1','test.dxf'].join(' '),90000,spawnImpl);
 const ok=fs.existsSync(path.join(dst,'test.dwg'))&&fs.statSync(path.join(dst,'test.dwg')).size>100;
 fs.rmSync(root,{recursive:true,force:true});return {ok,code:r.code};
}

async function install({localAppData=process.env.LOCALAPPDATA,tempDir=os.tmpdir(),onProgress,fetchImpl,spawnImpl,url=MSI_URL}={}){
 if(process.platform!=='win32'&&!spawnImpl)throw Error('L’installation automatique d’ODA File Converter est disponible sous Windows.');
 if(!localAppData)throw Error('Dossier LOCALAPPDATA introuvable.');
 onProgress?.({phase:'download',received:0,total:0});
 const msi=path.join(tempDir,'ODAFileConverter-ALCIDE-'+process.pid+'.msi');
 const got=await download(url,msi,onProgress,fetchImpl);
 const folder=path.join(localAppData,'DWG-Alcide','Tools','ODAFileConverter-'+(got.version||'latest'));
 const exe=path.join(folder,'ODAFileConverter.exe');let method=null;
 try{
  onProgress?.({phase:'install',method:'user'});
  fs.mkdirSync(folder,{recursive:true});
  const log=path.join(tempDir,'alcide-oda-install.log');
  const a=await run('msiexec.exe',['/a',q(msi),'/qn','TARGETDIR='+q(folder),'/L*',q(log)].join(' '),300000,spawnImpl);
  if(fs.existsSync(exe)){method='user';for(const f of fs.readdirSync(folder))if(/\.msi$/i.test(f))fs.rmSync(path.join(folder,f),{force:true});}
  else{
   try{fs.rmSync(folder,{recursive:true,force:true});}catch{}
   onProgress?.({phase:'install',method:'msi',detail:a.code});
   const b=await run('msiexec.exe',['/i',q(msi),'/passive','/norestart'].join(' '),600000,spawnImpl);
   if(b.code!==0&&b.code!==3010)throw Error(b.code===1602?'Installation annulée.':'L’installeur ODA s’est terminé avec le code '+b.code+'.');
   method='msi';
  }
 }finally{try{fs.rmSync(msi,{force:true});}catch{}}
 return {method,version:got.version,folder:method==='user'?folder:null,exe:method==='user'?exe:null,bytes:got.bytes};
}

module.exports={PAGE,MSI_URL,download,install,selfTest,run};
