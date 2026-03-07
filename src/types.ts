// エディターで扱うファイルの型定義
export interface EditorFile {
  id: string;
  name: string;
  content: string;
  savedContent?: string;
  language?: string; // 動的言語用のプロパティ
  isSettings?: boolean;
  handle?: any; // FileSystemFileHandle: File System Access API 用
}

// エディターの設定の型定義
export interface EditorSettings {
  language: 'ja' | 'en';
  fontSize: number;
  lineHeight: number;
  minimap: boolean;
  wordWrap: 'on' | 'off';
  uiFont: string;
  editorFont: string;
}

export const DEFAULT_SETTINGS: EditorSettings = {
  language: 'ja',
  fontSize: 14,
  lineHeight: 24,
  minimap: false,
  wordWrap: 'on',
  uiFont: 'consolas, "Courier New", monospace',
  editorFont: 'consolas, "Courier New", monospace',
};
