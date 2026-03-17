import { app, BrowserWindow, ipcMain, dialog, Notification, nativeImage } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'node:path';
import { fileURLToPath } from 'node:url'; // ← これを追加
import fs from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// ESモジュール(type: "module")環境で __dirname を復元するためのコード
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// この変数はViteによって自動的に注入されます
process.env.ROOT = path.join(__dirname, '../');
process.env.DIST = path.join(__dirname, '../dist');

process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, '../public');
process.env.VITE_BUILD = app.isPackaged ? process.env.DIST : path.join(process.env.ROOT, '/build');

let win: BrowserWindow | null;
const pendingOpenPaths: string[] = [];

const windowStatePath = () => path.join(app.getPath('userData'), 'window-state.json');

const loadWindowState = async () => {
  try {
    const raw = await fs.readFile(windowStatePath(), 'utf-8');
    const parsed = JSON.parse(raw) as {
      width?: number;
      height?: number;
      x?: number;
      y?: number;
      isMaximized?: boolean;
    };

    return parsed;
  } catch {
    return {};
  }
};

const saveWindowState = async (target: BrowserWindow) => {
  try {
    if (target.isMinimized()) return;
    const bounds = target.getBounds();
    const payload = {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      isMaximized: target.isMaximized(),
    };
    await fs.writeFile(windowStatePath(), JSON.stringify(payload), 'utf-8');
  } catch {
    // 保存失敗は無視
  }
};

const APP_PROG_ID = 'MarkdownEditor.md';
const getRegisterCommand = () => {
  const exePath = process.execPath;
  if (app.isPackaged) {
    return `"${exePath}" "%1"`;
  }
  const appPath = app.getAppPath();

  return `"${exePath}" "${appPath}" "%1"`;
};

const getRegisterIcon = () => {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'icon.ico');
  }
  return path.join(app.getAppPath(), 'build', 'icon.ico');
};

const extractMarkdownPaths = (argv: string[]) => {
  return argv.filter((arg) => arg && arg.toLowerCase().endsWith('.md'));
};

const sendFileToRenderer = (filePath: string) => {
  if (!filePath) return;
  if (win && !win.isDestroyed()) {
    win.webContents.send('file:openFromMain', filePath);
  } else {
    pendingOpenPaths.push(filePath);
  }
};

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

async function createWindow() {
  const savedBounds = await loadWindowState();
  win = new BrowserWindow({
    width: savedBounds.width ?? 1400,
    height: savedBounds.height ?? 800,
    x: savedBounds.x,
    y: savedBounds.y,
    minWidth: 960,
    minHeight: 600,
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

  win.webContents.on('did-finish-load', () => {
    while (pendingOpenPaths.length > 0) {
      const nextPath = pendingOpenPaths.shift();
      if (nextPath) {
        win?.webContents.send('file:openFromMain', nextPath);
      }
    }
  });

  if (savedBounds.isMaximized) {
    win.maximize();
  }

  win.on('close', () => {
    if (win) {
      void saveWindowState(win);
    }
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 2. createWindow() の呼び出しの前に、IPCの受信処理を追加します
app.whenReady().then(() => {
  if (!gotLock) return;
  app.on('second-instance', (_event, argv) => {
    const paths = extractMarkdownPaths(argv);
    if (paths.length > 0) {
      paths.forEach((p) => sendFileToRenderer(p));
    }
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    } else {
      void createWindow();
    }
  });

  // ==========================================
  // 【追加】自動アップデート機能
  // ==========================================
  autoUpdater.autoDownload = true; // 更新があれば自動で裏でダウンロード
  autoUpdater.autoInstallOnAppQuit = true; // アプリを普通に閉じた時もついでに更新する

  // ダウンロードが完了したら、React(画面)側に「ボタンを出して！」と通知する
  autoUpdater.on('update-downloaded', (info) => {
    if (win && !win.isDestroyed()) {
      win.webContents.send('updater:downloaded', info.version);
    }
  });

  // React(画面)のボタンが押されたら、アプリを終了して更新を適用する
  ipcMain.handle('updater:install', () => {
    autoUpdater.quitAndInstall();
  });

  // 開発中(dev)はエラーになるため、ビルドされた本番環境のみで実行する
  if (app.isPackaged) {
    // 起動して少し（例: 3秒）経ってから裏で確認を開始する（起動を重くしないため）
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify().catch(() => {
        // オフライン時などのエラーは無視する
      });
    }, 3000);
  }

  app.on('open-file', (event, filePath) => {
    event.preventDefault();
    sendFileToRenderer(filePath);
  });

  // React側から 'dialog:saveFile' が呼ばれた時の処理
  ipcMain.handle('dialog:saveFile', async (_event, content: string, defaultPath?: string) => {
    if (defaultPath && path.isAbsolute(defaultPath)) {
      try {
        await fs.writeFile(defaultPath, content, 'utf-8');

        return defaultPath;
      } catch {
        // fallback to dialog
      }
    }
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

  ipcMain.handle('dialog:openFile', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Markdown Files', extensions: ['md'] }],
    });
    if (canceled || !filePaths || filePaths.length === 0) {
      return null;
    }
    const filePath = filePaths[0];
    const content = await fs.readFile(filePath, 'utf-8');
    const name = path.basename(filePath);

    return { path: filePath, name, content };
  });

  ipcMain.handle('dialog:openFolder', async (_event, mode?: 'open' | 'create') => {
    const properties: Array<'openDirectory' | 'createDirectory'> = ['openDirectory'];
    if (mode === 'create') properties.push('createDirectory');
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties,
    });
    if (canceled || !filePaths || filePaths.length === 0) {
      return null;
    }
    const folderPath = filePaths[0];
    const entries = await fs.readdir(folderPath, { withFileTypes: true });
    const targetFiles = entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => {
        const lower = name.toLowerCase();

        return lower.endsWith('.md') || lower.endsWith('.txt');
      });
    const files = await Promise.all(
      targetFiles.map(async (name) => {
        const fullPath = path.join(folderPath, name);
        const content = await fs.readFile(fullPath, 'utf-8');

        return { path: fullPath, name, content };
      })
    );

    return { folderPath, files };
  });

  ipcMain.handle('file:openPath', async (_event, filePath: string) => {
    if (!filePath) return null;
    const content = await fs.readFile(filePath, 'utf-8');
    const name = path.basename(filePath);

    return { path: filePath, name, content };
  });

  ipcMain.handle('app:showAbout', async () => {
    // 修正1: undefined を明示的に代入するのをやめる
    const targetWindow = BrowserWindow.getFocusedWindow() ?? win;
    const iconPath = path.join(process.env.VITE_PUBLIC!, 'icon.ico');
    const icon = nativeImage.createFromPath(iconPath);
    const version = app.getVersion();

    // 修正2: オプションを一度変数にまとめる（'info' に as const を付けて型エラーを防ぐ）
    const options = {
      type: 'info' as const,
      title: 'Markdown Editor',
      message: 'Markdown Editor',
      detail: `Version ${version}`,
      icon: icon.isEmpty() ? undefined : icon,
      buttons: ['OK'],
      defaultId: 0,
    };

    // 修正3: ウィンドウが存在するかどうかで呼び出し方を分ける
    if (targetWindow && !targetWindow.isDestroyed()) {
      await dialog.showMessageBox(targetWindow, options);
    } else {
      await dialog.showMessageBox(options);
    }

    return true;
  });

  ipcMain.on('system:notify', (_event, payload: { title: string; body?: string }) => {
    if (!payload?.title) return;
    if (!Notification.isSupported()) return;
    new Notification({ title: payload.title, body: payload.body }).show();
  });

  // ==========================================
  // 【修正】安全なファイルの関連付け（登録）
  // ==========================================
  ipcMain.handle('system:registerFileAssociation', async () => {
    if (process.platform !== 'win32') return false;
    const iconValue = getRegisterIcon();
    const commandValue = getRegisterCommand();

    try {
      // 1. あなたのアプリ専用の身分証明書（ProgID）を作成
      await execFileAsync('reg', [
        'add',
        `HKCU\\Software\\Classes\\${APP_PROG_ID}`,
        '/ve',
        '/d',
        'Markdown Editor File',
        '/f',
      ]);
      await execFileAsync('reg', [
        'add',
        `HKCU\\Software\\Classes\\${APP_PROG_ID}\\DefaultIcon`,
        '/ve',
        '/d',
        iconValue,
        '/f',
      ]);
      await execFileAsync('reg', [
        'add',
        `HKCU\\Software\\Classes\\${APP_PROG_ID}\\shell\\open\\command`,
        '/ve',
        '/d',
        commandValue,
        '/f',
      ]);

      // 2. 【超重要】 .md を乗っ取るのではなく、「プログラムから開く(OpenWithProgids)」の候補リストに自分をそっと追加する
      await execFileAsync('reg', [
        'add',
        `HKCU\\Software\\Classes\\.md\\OpenWithProgids`,
        '/v',
        APP_PROG_ID,
        '/d',
        '',
        '/f',
      ]);

      return true;
    } catch (e) {
      console.error('Failed to register file association:', e);
      return false;
    }
  });

  // ==========================================
  // 【修正】安全なファイルの関連付け（解除）
  // ==========================================
  ipcMain.handle('system:unregisterFileAssociation', async () => {
    if (process.platform !== 'win32') return false;

    try {
      // 1. 「プログラムから開く」のリストから、自分の名前(APP_PROG_ID)だけをピンポイントで消す
      // （※ .md 自体は絶対に消さないので、VS Codeには一切影響しません！）
      await execFileAsync('reg', [
        'delete',
        `HKCU\\Software\\Classes\\.md\\OpenWithProgids`,
        '/v',
        APP_PROG_ID,
        '/f',
      ]);

      // 2. アプリの身分証明書を消す
      await execFileAsync('reg', ['delete', `HKCU\\Software\\Classes\\${APP_PROG_ID}`, '/f']);

      return true;
    } catch {
      // 既に消えていた場合のエラーなどは無視してOK
      return false;
    }
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

  void createWindow();

  const initialPaths = extractMarkdownPaths(process.argv);
  if (initialPaths.length > 0) {
    initialPaths.forEach((p) => sendFileToRenderer(p));
  }
});
