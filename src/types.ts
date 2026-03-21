// エディターで扱うファイルの型定義
export interface EditorFile {
  id: string;
  name: string;
  content: string;
  savedContent?: string;
  needsSaveAs?: boolean;
  sourceSignature?: string;
  language?: string; // 動的言語用のプロパティ
  isSettings?: boolean;
  handle?: string | FileSystemFileHandle;
  // FileSystemFileHandle: File System Access API 用
}

export interface OutlineItem {
  level: number;
  text: string;
  line: number;
}

const getDefaultUiLanguage = (): 'ja' | 'en' => {
  if (typeof navigator === 'undefined') {
    return 'ja';
  }

  return navigator.language.toLowerCase().startsWith('ja') ? 'ja' : 'en';
};

// エディターの設定の型定義
export interface EditorSettings {
  language: 'ja' | 'en';
  showTabFileName: boolean;
  enableDiscordMarkdown: boolean;
  fontSize: number;
  lineHeight: number;
  minimap: boolean;
  wordWrap: 'on' | 'off';
  uiFont: string;
  editorFont: string;
  // メニューバーの表示モード
  // visible: 常に表示, hidden: 完全非表示,
  // compact: ハンバーガーメニュー化, toggle: Altキーで表示切替
  menuBarVisibility: 'visible' | 'hidden' | 'compact' | 'toggle';
  // コマンドバーの表示状態
  showCommandBar: boolean;
}

export const DEFAULT_SETTINGS: EditorSettings = {
  language: getDefaultUiLanguage(),
  showTabFileName: true,
  enableDiscordMarkdown: false,
  fontSize: 14,
  lineHeight: 24,
  minimap: true,
  wordWrap: 'on',
  uiFont: "consolas, 'Courier New', monospace",
  editorFont: "consolas, 'Courier New', monospace",
  menuBarVisibility: 'visible',
  showCommandBar: true,
};

export interface ElectronAPI {
  saveFile: (content: string, defaultPath?: string) => Promise<string | null>;
  openFileDialog: () => Promise<{ path: string; name: string; content: string } | null>;
  openFilePath: (
    filePath: string
  ) => Promise<{ path: string; name: string; content: string } | null>;
  openFolderDialog: (mode?: 'open' | 'create') => Promise<{
    folderPath: string;
    files: { path: string; name: string; content: string }[];
  } | null>;
  showAbout: () => Promise<boolean>;
  registerFileAssociation: () => Promise<boolean>;
  unregisterFileAssociation: () => Promise<boolean>;
  notify: (title: string, body?: string) => void;
  onOpenFile: (callback: (filePath: string) => void) => () => void;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  onUpdateDownloaded: (callback: (version: string) => void) => void;
  installUpdate: () => Promise<void>;
}
