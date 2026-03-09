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
  handle?: any; // eslint-disable-line
  // FileSystemFileHandle: File System Access API 用
}

export interface OutlineItem {
  level: number;
  text: string;
  line: number;
}

// エディターの設定の型定義
export interface EditorSettings {
  language: 'ja' | 'en';
  showTabFileName: boolean;
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
  language: 'ja',
  showTabFileName: true,
  fontSize: 14,
  lineHeight: 24,
  minimap: true,
  wordWrap: 'on',
  uiFont: "consolas, 'Courier New', monospace",
  editorFont: "consolas, 'Courier New', monospace",
  menuBarVisibility: 'visible',
  showCommandBar: true,
};
