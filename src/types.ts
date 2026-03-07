// エディターで扱うファイルの型定義
export interface EditorFile {
  id: string;
  name: string;
  content: string;
  savedContent?: string;
  language?: string; // 動的言語用のプロパティ
  isSettings?: boolean;
}

// エディターの設定の型定義
export interface EditorSettings {
  fontSize: number;
  lineHeight: number;
  minimap: boolean;
  wordWrap: 'on' | 'off';
}

export const DEFAULT_SETTINGS: EditorSettings = {
  fontSize: 14,
  lineHeight: 24,
  minimap: false,
  wordWrap: 'on',
};
