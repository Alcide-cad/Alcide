const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('palette152',{onState:cb=>ipcRenderer.on('palette152-state',(_,data)=>cb(data)),event:data=>ipcRenderer.send('palette152-event',data)});
