import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url'; // ← これを追加
import fs from 'node:fs/promises';

// ESモジュール(type: "module")環境で __dirname を復元するためのコード
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// この変数はViteによって自動的に注入されます
process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, '../public');

let win: BrowserWindow | null;

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(process.env.VITE_PUBLIC!, 'icon.png'),
    // 【追加】タイトルバーを隠し、ネイティブボタンだけを残す
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#181818', // ボタンの背景色（.app-titlebarの背景色に合わせる）
      symbolColor: '#cccccc', // アイコン（横棒やバツ）の色
      height: 30, // 高さ（CSSのタイトルバーの高さに合わせる）
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // セキュリティ設定（後々ローカルファイルを触る際に重要になります）
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // 開発中はViteのローカルサーバーを読み込み、ビルド後はファイルを出力
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    // 開発ツールを開く場合はコメントアウトを外す
    // win.webContents.openDevTools()
  } else {
    // electron-vite-vue#298
    win.loadFile(path.join(process.env.DIST!, 'index.html'));
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 2. createWindow() の呼び出しの前に、IPCの受信処理を追加します
app.whenReady().then(() => {
  // React側から 'dialog:saveFile' が呼ばれた時の処理
  ipcMain.handle('dialog:saveFile', async (_event, content: string, defaultPath?: string) => {
    // OSのネイティブな保存ダイアログを表示
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: defaultPath || 'Untitled.md',
      filters: [
        { name: 'Markdown / Text Files', extensions: ['md', 'txt'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    // キャンセルされた場合は null を返す
    if (canceled || !filePath) {
      return null;
    }

    // Node.js の fs モジュールを使ってローカルPCに直接書き込む
    await fs.writeFile(filePath, content, 'utf-8');

    // 保存したファイルのパスをReact側に返す
    return filePath;
  });

  // 【追加】ウィンドウ操作の処理
  ipcMain.on('window:minimize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    window?.minimize();
  });

  ipcMain.on('window:maximize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window?.isMaximized()) {
      window.unmaximize(); // すでに最大化されていれば元に戻す
    } else {
      window?.maximize();
    }
  });

  ipcMain.on('window:close', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    window?.close();
  });

  createWindow();
});
