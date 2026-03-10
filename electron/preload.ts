import { contextBridge, ipcRenderer } from 'electron';

// 'electronAPI' という名前でReact側の window オブジェクトに機能を生やします
contextBridge.exposeInMainWorld('electronAPI', {
  // 保存ダイアログを開いてファイルに書き込む関数
  saveFile: (content: string, defaultPath?: string) =>
    ipcRenderer.invoke('dialog:saveFile', content, defaultPath),
});
