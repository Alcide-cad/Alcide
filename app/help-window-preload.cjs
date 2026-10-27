const {contextBridge,ipcRenderer}=require('electron');contextBridge.exposeInMainWorld('helpWindowApi',{content:()=>ipcRenderer.invoke('help-window-content')});
