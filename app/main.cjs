const {app,BrowserWindow,ipcMain,dialog,webUtils,Menu,shell}=require('electron');
const {spawn}=require('child_process');
const fs=require('fs');const path=require('path');const readline=require('readline');const zlib=require('zlib');
let win,worker,seq=0,pending=new Map(),sources=new Map(),newDrawingSources=new Set();
app.setName('ALCIDE');
if(process.platform==='win32')app.setAppUserModelId('NicolasScherer.ALCIDE');
app.commandLine.appendSwitch('lang','fr');
// Keep the historical profile path to retain shortcuts and preferences after renaming.
app.setPath('userData',app.commandLine.getSwitchValue('user-data-dir')||path.join(app.getPath('appData'),'DWG-Alcide'));
const detachedSessionArgument=process.argv.find(a=>a.startsWith('--alcide-detached-session='));let detachedInitial=null,detachedTransferFile=null;
if(detachedSessionArgument){detachedTransferFile=path.resolve(detachedSessionArgument.split('=').slice(1).join('='));const allowed=path.join(app.getPath('temp'),'ALCIDE-detached')+path.sep;if(!detachedTransferFile.startsWith(allowed))throw Error('Session détachée invalide.');detachedInitial=JSON.parse(fs.readFileSync(detachedTransferFile,'utf8'));app.setPath('userData',path.join(path.dirname(detachedTransferFile),'profile'));}
require('./recovery09-main.cjs')({app,ipcMain,sources});
const recentPath=path.join(app.commandLine.getSwitchValue('user-data-dir')||path.join(app.getPath('appData'),'DWG-Alcide'),'recent-files.json');
function recentFiles(){try{const entries=JSON.parse(fs.readFileSync(recentPath,'utf8'));return Array.isArray(entries)?entries.filter(e=>typeof e.path==='string'&&/\.(dwg|dxf|alcide)$/i.test(e.path)).slice(0,20):[];}catch{return [];}}
function storeRecent(entries){fs.mkdirSync(path.dirname(recentPath),{recursive:true});const temp=recentPath+'.'+process.pid+'.tmp';fs.writeFileSync(temp,JSON.stringify(entries,null,2),'utf8');fs.renameSync(temp,recentPath);return entries;}
const dialogSettingsPath=path.join(path.dirname(recentPath),'file-dialog-settings.json');
function internalDialogFolder(folder){const value=path.resolve(folder).toLowerCase(),roots=[app.getPath('userData'),path.join(process.env.LOCALAPPDATA||app.getPath('temp'),'DWG-Alcide')];return roots.some(root=>value===path.resolve(root).toLowerCase()||value.startsWith(path.resolve(root).toLowerCase()+path.sep));}
function cleanSuggestedName(file){const ext=path.extname(file);let name=path.basename(file,ext);name=name.replace(/(?: - objets libres - [a-f0-9]{8})+(?=-Alcide$|$)/gi,'');return (name||'Dessin sans titre')+ext;}
function lastDialogFolder(){try{const value=JSON.parse(fs.readFileSync(dialogSettingsPath,'utf8')).lastFolder;return typeof value==='string'&&path.isAbsolute(value)&&!internalDialogFolder(value)&&fs.existsSync(value)?value:null;}catch{return null;}}
function rememberDialogFolder(file){try{const folder=path.dirname(path.resolve(file));if(internalDialogFolder(folder))return;fs.mkdirSync(path.dirname(dialogSettingsPath),{recursive:true});const temp=dialogSettingsPath+'.'+process.pid+'.tmp';fs.writeFileSync(temp,JSON.stringify({lastFolder:folder}),'utf8');fs.renameSync(temp,dialogSettingsPath);}catch(error){console.warn('Dossier récent non mémorisé :',error.message);}}
function dialogSavePath(suggested){const folder=lastDialogFolder();return path.join(folder||app.getPath('desktop'),cleanSuggestedName(suggested));}
ipcMain.handle('recent-files',()=>recentFiles());
ipcMain.handle('remember-recent',(_,file)=>{if(typeof file!=='string'||!/\.(dwg|dxf|alcide)$/i.test(file))return recentFiles();const normalized=path.resolve(file);rememberDialogFolder(normalized);return storeRecent([{path:normalized,openedAt:new Date().toISOString()},...recentFiles().filter(e=>e.path.toLowerCase()!==normalized.toLowerCase())].slice(0,20));});
ipcMain.handle('clear-recent',()=>storeRecent([]));
// File associations always route to the primary window; explicitly detached tabs remain independent.
const ownsInstance=!!detachedInitial||app.requestSingleInstanceLock();
let rendererReady=false,externalFiles=[];
function deliverExternalFiles(){if(!rendererReady||!win||win.isDestroyed())return;for(const file of externalFiles.splice(0))win.webContents.send('initial-file',file);}
function acceptExternalFiles(argv,cwd=process.cwd()){for(const value of argv){if(typeof value==='string'&&!value.startsWith('--')&&/\.(dwg|dxf|alcide)$/i.test(value)){const file=path.resolve(cwd,value);if(!externalFiles.includes(file))externalFiles.push(file);}}deliverExternalFiles();}
if(!ownsInstance)app.quit();
else if(!detachedInitial){app.on('second-instance',(_,argv,cwd)=>{acceptExternalFiles(argv,cwd);if(win){if(win.isMinimized())win.restore();win.show();win.focus();}});app.on('open-file',(event,file)=>{event.preventDefault();acceptExternalFiles([file]);});}
ipcMain.on('detached-bootstrap',(event)=>{event.returnValue=detachedInitial?.preferences||null;});

let workerFailure=null,workerStderr='';
function engineDiagnostic(event,detail){try{const dir=path.join(app.getPath('userData'),'diagnostics');fs.mkdirSync(dir,{recursive:true});fs.appendFileSync(path.join(dir,'engine-startup.log'),JSON.stringify({at:new Date().toISOString(),version:app.getVersion(),event,detail})+'\n');}catch{}}
async function openCompatibilityDiagnostic(){const dir=path.join(app.getPath('userData'),'diagnostics');fs.mkdirSync(dir,{recursive:true});engineDiagnostic('manual-check',{engineRunning:!!worker&&!workerFailure&&worker.exitCode===null,error:workerFailure?.message||null});return shell.openPath(path.join(dir,'engine-startup.log'));}
ipcMain.handle('compatibility-diagnostic',()=>openCompatibilityDiagnostic());
function startWorker(){
 const exe=path.join(__dirname,'engine','alcide-engine.exe');
 workerFailure=null;workerStderr='';engineDiagnostic('start',{engine:exe,exists:fs.existsSync(exe),platform:process.platform,arch:process.arch});const args=[];worker=spawn(exe,args,{windowsHide:true,stdio:['pipe','pipe','pipe']});
 readline.createInterface({input:worker.stdout}).on('line',line=>{try{const msg=JSON.parse(line);if(msg.event){win?.webContents.send('load-progress',msg);return;}const p=pending.get(msg.id);if(p){pending.delete(msg.id);clearTimeout(p.timer);msg.error?p.reject(new Error(msg.error)):p.resolve(msg.result);}}catch(e){console.error(e);}});
 worker.stderr.on('data',d=>{const text=d.toString().slice(0,2000);workerStderr=(workerStderr+text).slice(-6000);engineDiagnostic('stderr',text);console.error(text);});
 worker.stdin.on('error',error=>{workerFailure=error;engineDiagnostic('stdin-error',{message:error.message,code:error.code});fail(error);});worker.on('error',error=>{workerFailure=new Error('Le moteur de dessin ne peut pas démarrer : '+error.message+' · Composant : '+exe);engineDiagnostic('launch-error',{message:error.message,code:error.code,engine:exe});fail(workerFailure);});worker.on('exit',(code,signal)=>{workerFailure=new Error('Le moteur de dessin s’est arrêté (code '+code+'). '+(workerStderr.trim()||'Consultez le diagnostic de compatibilité dans Aide.'));engineDiagnostic('exit',{code,signal});fail(workerFailure);});
}
function fail(e){for(const p of pending.values()){clearTimeout(p.timer);p.reject(e);}pending.clear();}
function request(cmd){if(workerFailure)return Promise.reject(workerFailure);if(!worker?.stdin?.writable)return Promise.reject(new Error('Moteur de dessin indisponible. Consultez Aide → Diagnostic de compatibilité.'));return new Promise((resolve,reject)=>{const id=++seq;const timer=setTimeout(()=>{pending.delete(id);reject(new Error('Le traitement du dessin dépasse le délai prévu.'));},['export','decompose-all','begin-block-edit','finish-block-edit'].includes(cmd.cmd)?600000:180000);pending.set(id,{resolve,reject,timer});worker.stdin.write(JSON.stringify({...cmd,id})+'\n');});}
function validateFile(p,exts){if(typeof p!=='string'||!exts.includes(path.extname(p).toLowerCase())||!fs.statSync(p).isFile())throw new Error('Fichier non pris en charge.');return path.resolve(p);}
app.whenReady().then(()=>{
 if(!ownsInstance)return;
 startWorker();
 const action=name=>()=>win?.webContents.send('menu-action',name);
 Menu.setApplicationMenu(Menu.buildFromTemplate([{label:'&Fichier',submenu:[{label:'&Nouveau dessin',accelerator:'Ctrl+N',click:action('new')},{label:'&Ouvrir…',accelerator:'Ctrl+O',click:action('open')},{type:'separator'},{label:'&Enregistrer',accelerator:'Ctrl+S',click:action('save')},{label:'Enregistrer &sous…',accelerator:'Ctrl+Shift+S',click:action('saveas')},{label:'Enregistrer un projet ALCIDE…',click:action('saveproject')},{label:'Exporter en DXF…',accelerator:'Ctrl+E',click:action('export')},{label:'Charger un LISP…',click:action('lisp')},{type:'separator'},{label:'Fermer le dessin',accelerator:'Ctrl+W',click:action('close')},{label:'Quitter',accelerator:'Alt+F4',click:()=>win?.close()}]},{label:'&Édition',submenu:[{label:'Annuler',click:action('undo')},{label:'Rétablir',click:action('redo')},{type:'separator'},{label:'Paramètres…',click:action('settings')},{label:'Raccourcis clavier…',click:action('shortcuts')}]},{label:'&Aide',submenu:[{label:'Aide et version…',accelerator:'F1',click:action('help')},{label:'Diagnostic de compatibilité…',click:()=>openCompatibilityDiagnostic()}]}]));
 win=new BrowserWindow({width:1440,height:940,minWidth:1050,minHeight:680,title:'ALCIDE',icon:path.join(__dirname,'app-icon.ico'),backgroundColor:'#111820',autoHideMenuBar:false,webPreferences:{backgroundThrottling:false,preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 win.setMenuBarVisibility(false);
 if(detachedInitial)win.once('ready-to-show',()=>{if(!win?.isDestroyed()){if(win.isMinimized())win.restore();win.show();win.focus();}});
 if(detachedInitial?.position){const pt=detachedInitial.position,area=require('electron').screen.getDisplayNearestPoint({x:Math.round(pt.x),y:Math.round(pt.y)}).workArea;win.setPosition(Math.max(area.x,Math.min(Math.round(pt.x)-100,area.x+area.width-400)),Math.max(area.y,Math.min(Math.round(pt.y)-30,area.y+area.height-200)));}
 let altUsed=false,lastAltToggle=0;
 const toggleMenu=()=>{const now=Date.now();if(now-lastAltToggle<150)return;lastAltToggle=now;win.setMenuBarVisibility(!win.isMenuBarVisible());};
 ipcMain.on('menu-alt-used',event=>{if(event.sender===win.webContents)altUsed=true;});
 ipcMain.on('toggle-menu',event=>{if(event.sender===win.webContents)toggleMenu();});
 win.webContents.on('before-input-event',(event,input)=>{if(input.key==='Alt'){if(input.type==='keyDown'&&!input.isAutoRepeat)altUsed=false;if(input.type==='keyUp'&&!altUsed){event.preventDefault();toggleMenu();}}else if(input.alt&&input.type==='keyDown'){altUsed=true;win.setMenuBarVisibility(true);}});
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 win.webContents.on('will-navigate',(e,url)=>{if(url!==win.webContents.getURL())e.preventDefault();});
 win.loadFile('index.html');
 win.webContents.on('did-finish-load',()=>{if(detachedInitial){win.webContents.send('detached-session',detachedInitial);return;}rendererReady=true;acceptExternalFiles(process.argv);});
});
ipcMain.handle('choose-open',async()=>{const r=await dialog.showOpenDialog(win,{title:'Ouvrir un dessin',buttonLabel:'Ouvrir',defaultPath:lastDialogFolder()||app.getPath('documents'),filters:[{name:'Dessins DWG / DXF / projets Alcide',extensions:['dwg','dxf','alcide']}],properties:['openFile']});if(r.canceled)return null;rememberDialogFolder(r.filePaths[0]);return r.filePaths[0];});
async function readScene(r){if(!r.sceneFile)return r;const t=performance.now();const data=await fs.promises.readFile(r.sceneFile);return {sceneGzip:data.toString('base64'),cacheHit:r.cacheHit,docId:r.docId,openSeconds:r.openSeconds,loadTimings:r.loadTimings,transferSeconds:(performance.now()-t)/1000};}
ipcMain.handle('open-drawing',async(_,p,docId)=>{p=validateFile(p,['.dwg','.dxf']);const r=await request({cmd:'open',path:p,docId});sources.set(docId,p);return readScene(r);});
ipcMain.handle('layout',async(_,layout,docId)=>readScene(await request({cmd:'layout',layout,docId})));
ipcMain.handle('close-drawing',async(_,docId)=>{sources.delete(docId);return request({cmd:'close',docId});});
ipcMain.handle('dimension-preview',async(_,docId,requests)=>{const result=await request({cmd:'dimension-preview',docId,requests});return {dimensionGzip:zlib.gzipSync(JSON.stringify(result),{level:1}).toString('base64')};});
ipcMain.handle('hatch-preview',(_,docId,requests)=>request({cmd:'hatch-preview',docId,requests}));
ipcMain.handle('text-preview',(_,docId,requests)=>request({cmd:'text-preview',docId,requests}));
ipcMain.handle('fonts',()=>request({cmd:'fonts'}));
ipcMain.handle('cache-info',()=>request({cmd:'cache-info'}));
ipcMain.handle('clear-cache',()=>request({cmd:'clear-cache'}));
ipcMain.handle('read-lisp',(_,p)=>fs.readFileSync(validateFile(p,['.lsp']),'utf8'));
ipcMain.handle('choose-lisp',async()=>{const r=await dialog.showOpenDialog(win,{title:'Charger un fichier AutoLISP',buttonLabel:'Charger',filters:[{name:'AutoLISP',extensions:['lsp']}],properties:['openFile']});return r.canceled?null:r.filePaths[0];});
ipcMain.handle('save-project',async(_,data)=>{const source=sources.get(data.docId);if(!source)throw Error('Dessin fermé ou inconnu.');const {docId,projectPath,saveAs,...saved}=data;let target=projectPath;if(target&&path.extname(target).toLowerCase()!=='.alcide')throw Error('Enregistrer le projet demande un fichier .alcide.');if(saveAs||!target){const r=await dialog.showSaveDialog(win,{title:saveAs?'Enregistrer le projet sous…':'Enregistrer le projet',buttonLabel:'Enregistrer',defaultPath:dialogSavePath(target||(newDrawingSources.has(source)?path.join(app.getPath('documents'),'Dessin sans titre.alcide'):source.replace(/\.[^.]+$/,'.alcide'))),filters:[{name:'Projet ALCIDE',extensions:['alcide']}]});if(r.canceled)return null;target=r.filePath;if(path.extname(target).toLowerCase()!=='.alcide')target+='.alcide';}target=path.resolve(target);const tmp=target+'.'+Date.now()+'.tmp';try{fs.writeFileSync(tmp,JSON.stringify({format:'DWG-Alcide',version:1,source,...saved},null,2),'utf8');fs.renameSync(tmp,target);}finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp);}rememberDialogFolder(target);return target;});
ipcMain.handle('read-project',(_,p)=>{const data=JSON.parse(fs.readFileSync(validateFile(p,['.alcide']),'utf8'));if(data.format!=='DWG-Alcide'||data.version!==1)throw new Error('Projet Alcide non reconnu.');return data;});
// DWG save and DXF export share one verified publisher; no legacy post-export dialog.
const frozenSaveSources=new Set();
async function freezeSaveSource(docId){
 const source=sources.get(docId);if(!source)throw Error('Dessin fermé ou inconnu.');
 if(frozenSaveSources.has(docId))return source;
 const baselineParent=path.join(app.getPath('userData'),'save-baselines'),root=path.join(baselineParent,require('crypto').randomUUID());fs.mkdirSync(root,{recursive:true});
 const frozen=path.join(root,path.basename(source));fs.copyFileSync(source,frozen);
 try{await request({cmd:'freeze-source',docId,path:frozen});}catch(error){if(path.dirname(path.resolve(root))===path.resolve(baselineParent))fs.rmSync(root,{recursive:true,force:true});throw error;}
 sources.set(docId,frozen);frozenSaveSources.add(docId);return frozen;
}
async function saveDrawing(data,dxf=false){
 const source=sources.get(data.docId);if(!source)throw Error('Dessin fermé ou inconnu.');
 const current=data.drawingPath&&path.extname(data.drawingPath).toLowerCase()==='.dwg'?path.resolve(data.drawingPath):null;
 let target=!dxf&&!data.saveAs?current:null;
 if(!target){const ext=dxf?'dxf':'dwg',suggested=current||data.suggestedPath||source;const suggestedName=cleanSuggestedName(suggested).replace(/\.[^.]+$/,'.'+ext);
  const result=await dialog.showSaveDialog(win,{title:dxf?'Exporter en DXF':'Enregistrer sous',buttonLabel:'Enregistrer',defaultPath:dialogSavePath(newDrawingSources.has(source)?'Dessin sans titre.'+ext:suggestedName),filters:[{name:dxf?'Dessin DXF':'Dessin DWG 2018',extensions:[ext]}],properties:['showOverwriteConfirmation']});
  if(result.canceled)return null;target=result.filePath;if(!path.extname(target))target+='.'+ext;
 }
 target=path.resolve(target);if(path.extname(target).toLowerCase()!==(dxf?'.dxf':'.dwg'))throw Error(dxf?'Choisissez un fichier .dxf.':'Choisissez un fichier .dwg.');
 // Freeze every affected base before replacing a source opened in this session.
 await freezeSaveSource(data.docId);
 for(const [id,original] of sources)if(id!==data.docId&&path.resolve(original).toLowerCase()===target.toLowerCase())await freezeSaveSource(id);
 const result=await request({cmd:'export',...data,path:target,backup:!dxf});
 if(!result?.path||!result.verified||!fs.statSync(result.path).isFile()||!fs.statSync(result.path).size)throw Error('Le dessin enregistré est absent ou non vérifié.');
 rememberDialogFolder(result.recovery?result.requestedPath:result.path);
 if(result.recovery)await dialog.showMessageBox(win,{type:'warning',title:'Copie locale de secours',message:'Le dossier demandé refuse l’écriture. Le fichier précédent est conservé.',detail:'Une copie vérifiée est disponible ici : '+result.path,buttons:['Fermer']});
 return {...result,sourceBase:sources.get(data.docId)};
}
ipcMain.handle('save-drawing',(_,data)=>saveDrawing(data));
ipcMain.handle('export-dxf',(_,data)=>saveDrawing(data,true));
ipcMain.handle('confirm-close',async()=>{const r=await dialog.showMessageBox(win,{type:'question',buttons:['Annuler','Continuer'],defaultId:0,cancelId:0,message:'Des modifications ne sont pas enregistrées.',detail:'Enregistrez le dessin DWG ou un projet ALCIDE pour conserver votre travail.'});return r.response===1;});
app.on('window-all-closed',()=>app.quit());app.on('before-quit',()=>worker?.kill());



ipcMain.handle('decompose-all',(_,data)=>request({cmd:'decompose-all',...data}));

ipcMain.handle('recognize-dimensions',(_,data)=>request({cmd:'recognize-dimensions',...data}));

ipcMain.handle('begin-block-edit',(_,data)=>request({cmd:'begin-block-edit',...data}));
ipcMain.handle('finish-block-edit',(_,data)=>request({cmd:'finish-block-edit',...data}));

ipcMain.handle('new-drawing',async()=>{const folder=path.join(app.getPath('userData'),'drawings',require('crypto').randomUUID()),target=path.join(folder,'Dessin sans titre.dxf');const result=await request({cmd:'new-drawing',path:target});newDrawingSources.add(result);return result;});

ipcMain.handle('open-coffee',()=>shell.openExternal('https://buymeacoffee.com/alcide'));

ipcMain.handle('open-default-apps',async()=>{if(process.platform!=='win32')throw Error('Cette option est disponible sous Windows.');try{await shell.openExternal('ms-settings:defaultapps?registeredAppUser=ALCIDE');}catch{await shell.openExternal('ms-settings:defaultapps');}return true;});

let helpWindow=null,helpWindowContent=null;
ipcMain.handle('open-help-window',async(event,data)=>{
 if(event.sender!==win?.webContents)throw Error('Fenêtre non autorisée.');
 if(!Array.isArray(data?.topics)||data.topics.length>500||JSON.stringify(data).length>2000000)throw Error('Aide indisponible.');
 helpWindowContent=data;
 if(helpWindow&&!helpWindow.isDestroyed()){if(helpWindow.isMinimized())helpWindow.restore();helpWindow.show();helpWindow.focus();helpWindow.webContents.reload();return true;}
 helpWindow=new BrowserWindow({width:1050,height:800,minWidth:560,minHeight:400,title:'Aide — ALCIDE',icon:path.join(__dirname,'app-icon.ico'),backgroundColor:'#1b2630',autoHideMenuBar:true,show:false,webPreferences:{preload:path.join(__dirname,'help-window-preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 helpWindow.setMenu(null);helpWindow.webContents.setWindowOpenHandler(()=>({action:'deny'}));helpWindow.webContents.on('will-navigate',e=>e.preventDefault());
 helpWindow.on('closed',()=>{helpWindow=null;});helpWindow.once('ready-to-show',()=>helpWindow?.show());await helpWindow.loadFile(path.join(__dirname,'help-window.html'));return true;
});
ipcMain.handle('help-window-content',event=>{if(event.sender!==helpWindow?.webContents)throw Error('Fenêtre non autorisée.');return helpWindowContent;});
app.on('browser-window-created',(_,window)=>{if(window===helpWindow)return;window.on('closed',()=>{if(window===win&&helpWindow&&!helpWindow.isDestroyed())helpWindow.destroy();});});

ipcMain.handle('detach-tab',async(event,data)=>{
 if(event.sender!==win?.webContents||!data?.source||typeof data.inputPath!=='string')throw Error('Dessin indisponible.');validateFile(data.source,['.dwg','.dxf']);
 fs.mkdirSync(path.join(app.getPath('temp'),'ALCIDE-detached'),{recursive:true});const folder=fs.mkdtempSync(path.join(app.getPath('temp'),'ALCIDE-detached', 'session-')),file=path.join(folder,'session.json'),ack=file+'.ready',failure=file+'.error';
 const transfer={...data,isNew:newDrawingSources.has(data.source)};fs.writeFileSync(file,JSON.stringify(transfer),'utf8');
 const debug=process.env.ALCIDE_DEBUG_DETACHED==='1';const args=[...(debug?['--remote-debugging-port=0']:[]),'--alcide-detached-session='+file];
 // This is an explicitly requested GUI window; STARTF_USESHOWWINDOW/SW_HIDE
 // can suppress Electron's first native ShowWindow call on Windows.
 const child=spawn(process.execPath,args,{cwd:__dirname,detached:true,windowsHide:false,stdio:'ignore'});child.unref();
 return new Promise((resolve,reject)=>{let settled=false;const finish=(err)=>{if(settled)return;settled=true;clearInterval(timer);clearTimeout(timeout);if(err)reject(err);else resolve({pid:child.pid,folder});};child.once('error',finish);child.once('exit',code=>{if(!settled&&!fs.existsSync(ack))finish(Error('La nouvelle fenêtre n’a pas chargé le dessin (code '+code+').'));});const timer=setInterval(()=>{if(fs.existsSync(ack))finish();else if(fs.existsSync(failure))finish(Error(fs.readFileSync(failure,'utf8')));},150);const timeout=setTimeout(()=>finish(Error('La nouvelle fenêtre tarde à charger : l’onglet source est conservé.')),180000);});
});
ipcMain.handle('detached-ready',(event,result)=>{if(!detachedTransferFile||event.sender!==win?.webContents)return;if(result?.error){fs.writeFileSync(detachedTransferFile+'.error',result.error,'utf8');return;}if(!win||win.isDestroyed()){fs.writeFileSync(detachedTransferFile+'.error','La fenêtre détachée a été fermée.','utf8');return;}if(win.isMinimized())win.restore();win.show();win.focus();if(!win.isVisible()){fs.writeFileSync(detachedTransferFile+'.error','La fenêtre détachée n’est pas visible.','utf8');return;}if(detachedInitial.isNew&&result.docId)sources.get(result.docId)&&newDrawingSources.add(sources.get(result.docId));fs.writeFileSync(detachedTransferFile+'.ready',JSON.stringify({pid:process.pid,visible:win.isVisible(),bounds:win.getBounds(),...result}),'utf8');});

ipcMain.handle('detail-library-export',async(event,data)=>{const text=JSON.stringify(data,null,2);if(!data||data.format!=='ALCIDE-DETAIL-LIBRARY'||text.length>10000000)throw Error('Bibliothèque invalide ou trop volumineuse.');const owner=BrowserWindow.fromWebContents(event.sender)||win,r=await dialog.showSaveDialog(owner,{title:'Exporter la bibliothèque de détails',defaultPath:path.join(app.getPath('documents'),'Bibliotheque-ALCIDE.json'),filters:[{name:'Bibliothèque ALCIDE',extensions:['json']}]});if(r.canceled)return null;await fs.promises.writeFile(r.filePath,text,'utf8');return r.filePath;});
ipcMain.handle('detail-library-import',async(event)=>{const owner=BrowserWindow.fromWebContents(event.sender)||win,r=await dialog.showOpenDialog(owner,{title:'Importer une bibliothèque de détails',filters:[{name:'Bibliothèque ALCIDE',extensions:['json']}],properties:['openFile']});if(r.canceled)return null;const file=r.filePaths[0],stat=await fs.promises.stat(file);if(stat.size>10000000)throw Error('Bibliothèque trop volumineuse.');return JSON.parse(await fs.promises.readFile(file,'utf8'));});

ipcMain.handle('app-version',()=>app.getVersion());
