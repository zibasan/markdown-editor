// import { contextBridge, ipcRenderer } from 'electron'; は使わず、requireを使います
// （TypeScriptのエラー線が出ないように eslint-disable-next-line をつけます）

// eslint-disable-next-line
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (content: string, defaultPath?: string) =>
    ipcRenderer.invoke('dialog:saveFile', content, defaultPath),
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
});
