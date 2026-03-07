/**
 * i18n.ts - 多言語対応（日本語/英語）のための翻訳辞書と翻訳関数
 *
 * アプリ内の全UIテキストをキーで管理し、
 * 設定で選択された言語（'ja' | 'en'）に応じて適切なテキストを返します。
 */

// 翻訳辞書の型定義
type TranslationDict = Record<string, string>;

// 日本語の翻訳辞書
const ja: TranslationDict = {
  // === メニューバー ===
  'menu.file': 'ファイル',
  'menu.edit': '編集',
  'menu.view': '表示',
  'menu.file.new': '新しいファイル',
  'menu.file.open': 'ファイルを開く',
  'menu.file.save': '保存',
  'menu.file.export': 'エクスポート',
  'menu.edit.undo': '元に戻す',
  'menu.edit.redo': 'やり直す',
  'menu.view.commandPalette': 'コマンドパレット',
  'menu.view.previewOpen': 'プレビューを開く',
  'menu.view.previewClose': 'プレビューを閉じる',
  'menu.view.settings': '設定',
  'menu.view.language': '言語の変更',

  // === タイトルバー ===
  'titlebar.searchPlaceholder': '検索またはコマンドを入力...',
  'titlebar.commandPaletteTooltip': 'コマンドパレットを開く (F1)',
  'titlebar.themeToggle': 'テーマ切り替え',

  // === アクティビティバー ===
  'activity.explorer': 'エクスプローラー',
  'activity.outline': 'アウトライン (目次)',
  'activity.docs': 'Markdown Docs',
  'activity.settings': '管理 (設定)',

  // === サイドバー ===
  'sidebar.explorer': 'エクスプローラー',
  'sidebar.outline': 'アウトライン',
  'sidebar.newFile': '新しいファイル...',
  'sidebar.openFile': 'ファイルを開く...',
  'sidebar.close': '閉じる',
  'sidebar.noHeadings': '見出し(#)が見つかりません',

  // === Markdown Docs ===
  'docs.intro': '基本的なMarkdownの書き方とプレビューを確認できます。',
  'docs.headings': '見出し',
  'docs.emphasis': '強調 (太字・斜体・取消線)',
  'docs.lists': 'リスト (箇条書き)',
  'docs.codeBlock': 'コードブロック',
  'docs.alerts': 'アラート構文 (GitHub Alerts)',
  'docs.reference': '詳しくは',
  'docs.referenceLink': 'こちら',
  'docs.referenceSuffix': 'や公式ドキュメントを参照してください。',

  // === 設定画面 ===
  'settings.title': '設定',
  'settings.fontSize': 'フォントサイズ',
  'settings.lineHeight': '行の高さ (行間)',
  'settings.minimap': 'ミニマップの表示',
  'settings.wordWrap': '折り返し',
  'settings.wordWrapOn': 'オン',
  'settings.wordWrapOff': 'オフ',
  'settings.uiFont': 'アプリのフォント (UI)',
  'settings.editorFont': 'エディターのフォント',
  'settings.language': 'アプリの言語 (Language)',

  // === ステータスバー ===
  'status.chordWaiting': '(Ctrl+K) が押されました。2 番目のキーを待っています...',
  'status.charSelected': '文字選択',
  'status.line': '行',
  'status.col': '列',
  'status.gotoLine': '行/列に移動する (Ctrl+G)',
  'status.eolTooltip': '改行コードの切り替え',
  'status.langMode': '言語モードの選択',
  'status.saved': 'に保存しました。',
  'status.errorOpenFile': 'ファイルの読み込みに失敗しました。',
  'status.errorSaveFile': '保存に失敗しました。',
  'status.created': 'を作成しました。',
  'status.fileNotFound':
    'ローカルにファイルが見つかりません。\nファイルをローカルに新規作成しました:',

  // === コンテキストメニュー ===
  'context.open': '開く',
  'context.rename': '名前の変更',
  'context.delete': '削除',
  'context.newFile': '新しいファイル',
  'context.openFile': 'ファイルを開く',

  // === 確認パレット ===
  'confirm.saveAndClose': '保存して閉じる',
  'confirm.saveAndCloseDesc': 'ローカルファイルに保存してからタブを閉じる',
  'confirm.closeWithoutSave': '保存せずに閉じる',
  'confirm.closeWithoutSaveDesc': '変更を破棄してタブを閉じる',
  'confirm.cancel': 'キャンセル',
  'confirm.cancelDesc': '編集を続行します',
  'confirm.closeTitle': 'タブを閉じますか？',
  'confirm.unsavedMessage': 'には未保存の変更があります。',

  // === 新規ファイルパレット ===
  'newFile.title': '新しいファイル名を入力してください',
  'newFile.placeholder': '例: example.md (Enterで作成, Escでキャンセル)',
  'newFile.hint': '拡張子を省略した場合は .md が自動的に付与されます。',

  // === 言語パレット ===
  'langPalette.title': 'Select Language Mode',
  'langPalette.placeholder': 'Type to search languages...',
  'langPalette.noMatch': '一致する言語が見つかりません',

  // === D&D ===
  'dnd.drop': 'このウィンドウにドロップしてファイルを開く',

  // === 空の状態 ===
  'empty.showCommandPalette': 'コマンドパレットを表示',
  'empty.newFile': '新しいファイル',
  'empty.openFile': 'ファイルを開く',
  'empty.toggleTheme': 'テーマを切り替え',

  // === リサイザー ===
  'resizer.tooltip': 'ドラッグしてサイズ変更',

  // === 言語切り替えパレット ===
  'langSwitch.title': '表示言語の変更',
  'langSwitch.ja': '日本語',
  'langSwitch.en': 'English',
};

// 英語の翻訳辞書
const en: TranslationDict = {
  // === Menu bar ===
  'menu.file': 'File',
  'menu.edit': 'Edit',
  'menu.view': 'View',
  'menu.file.new': 'New File',
  'menu.file.open': 'Open File',
  'menu.file.save': 'Save',
  'menu.file.export': 'Export',
  'menu.edit.undo': 'Undo',
  'menu.edit.redo': 'Redo',
  'menu.view.commandPalette': 'Command Palette',
  'menu.view.previewOpen': 'Open Preview',
  'menu.view.previewClose': 'Close Preview',
  'menu.view.settings': 'Settings',
  'menu.view.language': 'Change Language',

  // === Title bar ===
  'titlebar.searchPlaceholder': 'Search or enter a command...',
  'titlebar.commandPaletteTooltip': 'Open Command Palette (F1)',
  'titlebar.themeToggle': 'Toggle Theme',

  // === Activity bar ===
  'activity.explorer': 'Explorer',
  'activity.outline': 'Outline',
  'activity.docs': 'Markdown Docs',
  'activity.settings': 'Settings',

  // === Sidebar ===
  'sidebar.explorer': 'Explorer',
  'sidebar.outline': 'Outline',
  'sidebar.newFile': 'New File...',
  'sidebar.openFile': 'Open File...',
  'sidebar.close': 'Close',
  'sidebar.noHeadings': 'No headings (#) found',

  // === Markdown Docs ===
  'docs.intro': 'Learn basic Markdown syntax with live previews.',
  'docs.headings': 'Headings',
  'docs.emphasis': 'Emphasis (Bold, Italic, Strikethrough)',
  'docs.lists': 'Lists',
  'docs.codeBlock': 'Code Block',
  'docs.alerts': 'Alerts (GitHub Alerts)',
  'docs.reference': 'For more details, see ',
  'docs.referenceLink': 'here',
  'docs.referenceSuffix': ' or the official documentation.',

  // === Settings ===
  'settings.title': 'Settings',
  'settings.fontSize': 'Font Size',
  'settings.lineHeight': 'Line Height',
  'settings.minimap': 'Minimap',
  'settings.wordWrap': 'Word Wrap',
  'settings.wordWrapOn': 'On',
  'settings.wordWrapOff': 'Off',
  'settings.uiFont': 'UI Font',
  'settings.editorFont': 'Editor Font',
  'settings.language': 'Language',

  // === Status bar ===
  'status.chordWaiting': '(Ctrl+K) was pressed. Waiting for second key...',
  'status.charSelected': ' selected',
  'status.line': 'Ln',
  'status.col': 'Col',
  'status.gotoLine': 'Go to Line (Ctrl+G)',
  'status.eolTooltip': 'Toggle End of Line',
  'status.langMode': 'Select Language Mode',
  'status.saved': 'saved.',
  'status.errorOpenFile': 'Failed to open file.',
  'status.errorSaveFile': 'Failed to save file.',
  'status.created': 'created.',
  'status.fileNotFound': 'File not found locally. Created as new file:',

  // === Context menu ===
  'context.open': 'Open',
  'context.rename': 'Rename',
  'context.delete': 'Delete',
  'context.newFile': 'New File',
  'context.openFile': 'Open File',

  // === 確認パレット ===
  'confirm.saveAndClose': 'Save and Close',
  'confirm.saveAndCloseDesc': 'Save to local file and close the tab',
  'confirm.closeWithoutSave': 'Close Without Saving',
  'confirm.closeWithoutSaveDesc': 'Discard changes and close the tab',
  'confirm.cancel': 'Cancel',
  'confirm.cancelDesc': 'Continue editing',
  'confirm.closeTitle': 'Close Tab?',
  'confirm.unsavedMessage': 'has unsaved changes.',

  // === New file palette ===
  'newFile.title': 'Enter a new file name',
  'newFile.placeholder': 'e.g. example.md (Enter to create, Esc to cancel)',
  'newFile.hint': 'If no extension is provided, .md will be added automatically.',

  // === Language palette ===
  'langPalette.title': 'Select Language Mode',
  'langPalette.placeholder': 'Type to search languages...',
  'langPalette.noMatch': 'No matching languages found',

  // === D&D ===
  'dnd.drop': 'Drop to open file in this window',

  // === Empty state ===
  'empty.showCommandPalette': 'Show Command Palette',
  'empty.newFile': 'New File',
  'empty.openFile': 'Open File',
  'empty.toggleTheme': 'Toggle Theme',

  // === Resizer ===
  'resizer.tooltip': 'Drag to resize',

  // === Language switch palette ===
  'langSwitch.title': 'Change Display Language',
  'langSwitch.ja': '日本語',
  'langSwitch.en': 'English',
};

// 翻訳辞書のマップ
const translations: Record<string, TranslationDict> = { ja, en };

/**
 * 翻訳関数を生成するファクトリ
 * 使い方: const t = createT('ja'); t('menu.file') => 'ファイル'
 */
export function createT(lang: 'ja' | 'en') {
  const dict = translations[lang] || translations['ja'];

  return (key: string): string => {
    return dict[key] ?? key; // キーが見つからない場合はキーそのものを返す
  };
}
