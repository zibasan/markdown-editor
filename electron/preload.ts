// import { contextBridge, ipcRenderer } from 'electron'; は使わず、requireを使います
// （TypeScriptのエラー線が出ないように eslint-disable-next-line をつけます）

// eslint-disable-next-line
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (content: string, defaultPath?: string) =>
    ipcRenderer.invoke('dialog:saveFile', content, defaultPath),
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  openFilePath: (filePath: string) => ipcRenderer.invoke('file:openPath', filePath),
  openFolderDialog: (mode?: 'open' | 'create') => ipcRenderer.invoke('dialog:openFolder', mode),
  showAbout: () => ipcRenderer.invoke('app:showAbout'),
  registerFileAssociation: () => ipcRenderer.invoke('system:registerFileAssociation'),
  unregisterFileAssociation: () => ipcRenderer.invoke('system:unregisterFileAssociation'),
  notify: (title: string, body?: string) => ipcRenderer.send('system:notify', { title, body }),
  onOpenFile: (callback: (filePath: string) => void) => {
    const listener = (_event: unknown, filePath: string) => callback(filePath);
    ipcRenderer.on('file:openFromMain', listener);

    return () => {
      ipcRenderer.removeListener('file:openFromMain', listener);
    };
  },
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  onUpdateDownloaded: (callback: (version: string) => void) => {
    // eslint-disable-next-line
    ipcRenderer.on('updater:downloaded', (_event: any, version: string) => callback(version));
  },
  installUpdate: () => ipcRenderer.invoke('updater:install'),
});
