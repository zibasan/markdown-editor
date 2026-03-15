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
  'menu.file.openFolder': 'フォルダを開く',
  'menu.file.save': '保存',
  'menu.file.export': 'エクスポート',
  'menu.file.recent': '最近使ったファイル',
  'menu.file.recent.empty': '最近のファイルはありません',
  'menu.edit.undo': '元に戻す',
  'menu.edit.redo': 'やり直す',
  'menu.view.commandPalette': 'コマンドパレット',
  'menu.view.previewOpen': 'プレビューを開く',
  'menu.view.previewClose': 'プレビューを閉じる',
  'menu.view.settings': '設定',
  'menu.view.language': '言語の変更',
  'menu.view.toggleCommandBar': 'コマンドバーの表示切替',
  'menu.compact.tooltip': 'メニュー',
  'menu.help': 'ヘルプ',
  'menu.help.about': 'Markdown Editorについて',
  'menu.help.association': '.md の関連付け',
  'menu.help.association.register': '関連付ける',
  'menu.help.association.unregister': '関連付けを解除する',
  'recentPalette.title': '最近使ったファイル',
  'recentPalette.placeholder': 'ファイル名やパスで検索...',
  'recentPalette.empty': '最近のファイルはありません',

  // === タイトルバー ===
  'titlebar.searchPlaceholder': '検索またはコマンドを入力...',
  'titlebar.commandPaletteTooltip': 'コマンドパレットを開く (F1)',
  'titlebar.themeToggle': 'テーマ切り替え',

  // === アクティビティバー ===
  'activity.explorer': 'エクスプローラー',
  'activity.outline': 'アウトライン (目次)',
  'activity.docs': 'Markdown Docs',
  'activity.settings': '設定',

  // === サイドバー ===
  'sidebar.explorer': 'エクスプローラー',
  'sidebar.outline': 'アウトライン',
  'sidebar.empty': 'ファイルが開かれていません。',
  'sidebar.empty.createFile': 'ファイルを作成',
  'sidebar.empty.openFile': 'ファイルを開く',
  'sidebar.empty.createFolder': 'フォルダを作成',
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
  'settings.showTabFileName': 'タブにファイル名を表示',
  'settings.menuBarVisibility': 'メニューバーの表示',
  'settings.menuBar.visible': '常に表示',
  'settings.menuBar.hidden': '完全に非表示',
  'settings.menuBar.compact': 'コンパクト（ハンバーガーメニュー）',
  'settings.menuBar.toggle': 'Alt キーで表示切替',
  'settings.showCommandBar': 'コマンドバーを表示する',
  'settings.enableDiscordMarkdown':
    'Discord用Markdown構文を有効化 ※Discordでは一部のMarkdown構文が使用できません',
  'settings.resetDefaults': 'デフォルトに戻す',

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
  'status.registerAssociationSuccess': '関連付けを登録しました。',
  'status.registerAssociationFail': '関連付けの登録に失敗しました。',
  'status.unregisterAssociationSuccess': '関連付けを解除しました。',
  'status.unregisterAssociationFail': '関連付けの解除に失敗しました。',
  'status.openRecentFail': '最近使ったファイルを開けませんでした。',

  // === コンテキストメニュー ===
  'context.open': '開く',
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

  // === ツールバー ===
  'toolbar.save': '保存 (Ctrl+S)',
  'toolbar.undo': '元に戻す (Ctrl+Z)',
  'toolbar.redo': 'やり直す (Ctrl+Y)',
  'toolbar.bold': '太字 (Ctrl+B)',
  'toolbar.italic': '斜体 (Ctrl+I)',
  'toolbar.strike': '打ち消し線',
  'toolbar.heading1': '見出し 1',
  'toolbar.heading2': '見出し 2',
  'toolbar.heading3': '見出し 3',
  'toolbar.heading4': '見出し 4',
  'toolbar.heading5': '見出し 5',
  'toolbar.heading6': '見出し 6',
  'toolbar.bulletList': '箇条書きリスト',
  'toolbar.numberList': '番号付きリスト',
  'toolbar.taskList': 'タスクリスト',
  'toolbar.quote': '引用',
  'toolbar.alert': 'アラート構文',
  'toolbar.alertNote': 'Note',
  'toolbar.alertTip': 'Tip',
  'toolbar.alertImportant': 'Important',
  'toolbar.alertWarning': 'Warning',
  'toolbar.alertCaution': 'Caution',
  'toolbar.inlineCode': 'インラインコード',
  'toolbar.codeBlock': 'コードブロック',
  'toolbar.horizontalRule': '水平線',
  'toolbar.table': 'テーブル',
  'toolbar.link': 'リンク',
  'toolbar.previewOpen': 'プレビューを開く',
  'toolbar.previewClose': 'プレビューを閉じる',
  'toolbar.discordLabel': 'Discord用Markdown構文',
  'toolbar.discordSubtext': 'サブテキスト',
  'toolbar.discordUnderline': '下線',
  'toolbar.discordSpoiler': 'スポイラー',
  'toolbar.alertContent': 'アラートの内容',
  'toolbar.sample.bold': '太字',
  'toolbar.sample.italic': '斜体',
  'toolbar.sample.strike': '打ち消し線',
  'toolbar.sample.heading1': '見出し1',
  'toolbar.sample.heading2': '見出し2',
  'toolbar.sample.heading3': '見出し3',
  'toolbar.sample.heading4': '見出し4',
  'toolbar.sample.heading5': '見出し5',
  'toolbar.sample.heading6': '見出し6',
  'toolbar.sample.list': 'リスト項目',
  'toolbar.sample.task': 'タスク項目',
  'toolbar.sample.quote': '引用文',
  'toolbar.sample.inlineCode': 'コード',
  'toolbar.sample.codeBlock': 'コードを入力',
  'toolbar.sample.link': 'リンクテキスト',
  'toolbar.sample.discordSubtext': 'サブテキスト',
  'toolbar.sample.discordUnderline': '下線',
  'toolbar.sample.discordSpoiler': 'スポイラー',

  // === コマンドパレットのカスタムオプションのラベル ===
  'cmdPalette.customOpt.changeLangMode': '言語モードの変更',
  'cmdPalette.customOpt.changeTheme': '基本設定: ライトテーマとダークテーマの切り替え',
  'cmdPalette.customOpt.toggleMarkdownPreview': 'Markdown: プレビューの切り替え',
  'cmdPalette.customOpt.createNewFile': 'ファイル: 新規ファイルを作成...',
  'cmdPalette.customOpt.saveFile': 'ファイル: 現在のファイルを保存...',
  'cmdPalette.customOpt.openSettings': '基本設定: 設定を開く...',
  'cmdPalette.customOpt.openFile': 'ファイル: ファイルを開く...',
  'cmdPalette.customOpt.openFolder': 'ファイル: フォルダを開く...',
  'cmdPalette.customOpt.closeAllFiles': 'ファイル: 全てのタブを強制的に閉じる',
  'cmdPalette.customOpt.openRecent': 'ファイル: 最近使ったファイルを開く...',
};

// 英語の翻訳辞書
const en: TranslationDict = {
  // === Menu bar ===
  'menu.file': 'File',
  'menu.edit': 'Edit',
  'menu.view': 'View',
  'menu.file.new': 'New File',
  'menu.file.open': 'Open File',
  'menu.file.openFolder': 'Open Folder',
  'menu.file.save': 'Save',
  'menu.file.export': 'Export',
  'menu.file.recent': 'Recent Files',
  'menu.file.recent.empty': 'No recent files',
  'menu.edit.undo': 'Undo',
  'menu.edit.redo': 'Redo',
  'menu.view.commandPalette': 'Command Palette',
  'menu.view.previewOpen': 'Open Preview',
  'menu.view.previewClose': 'Close Preview',
  'menu.view.settings': 'Settings',
  'menu.view.language': 'Change Language',
  'menu.view.toggleCommandBar': 'Toggle Command Bar',
  'menu.compact.tooltip': 'Menu',
  'menu.help': 'Help',
  'menu.help.about': 'About Markdown Editor',
  'menu.help.association': 'File Association',
  'menu.help.association.register': 'Associate .md Files',
  'menu.help.association.unregister': 'Remove Association',
  'recentPalette.title': 'Recent Files',
  'recentPalette.placeholder': 'Search by name or path...',
  'recentPalette.empty': 'No recent files',

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
  'sidebar.empty': 'No files are open.',
  'sidebar.empty.createFile': 'Create File',
  'sidebar.empty.openFile': 'Open File',
  'sidebar.empty.createFolder': 'Create Folder',
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
  'settings.showTabFileName': 'Show File Name in Tabs',
  'settings.menuBarVisibility': 'Menu Bar Visibility',
  'settings.menuBar.visible': 'Always Visible',
  'settings.menuBar.hidden': 'Hidden',
  'settings.menuBar.compact': 'Compact (Hamburger Menu)',
  'settings.menuBar.toggle': 'Toggle with Alt Key',
  'settings.showCommandBar': 'Show Command Bar',
  'settings.enableDiscordMarkdown':
    'Enable Discord Markdown Syntax (Some Markdown syntaxes cannot use on Discord.)',
  'settings.resetDefaults': 'Reset to Defaults',

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
  'status.registerAssociationSuccess': 'File association registered.',
  'status.registerAssociationFail': 'Failed to register file association.',
  'status.unregisterAssociationSuccess': 'File association removed.',
  'status.unregisterAssociationFail': 'Failed to remove file association.',
  'status.openRecentFail': 'Failed to open recent file.',

  // === Context menu ===
  'context.open': 'Open',
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
  'langSwitch.ja': 'Japanese',
  'langSwitch.en': 'English',

  // === Toolbar ===
  'toolbar.save': 'Save (Ctrl+S)',
  'toolbar.undo': 'Undo (Ctrl+Z)',
  'toolbar.redo': 'Redo (Ctrl+Y)',
  'toolbar.bold': 'Bold (Ctrl+B)',
  'toolbar.italic': 'Italic (Ctrl+I)',
  'toolbar.strike': 'Strikethrough',
  'toolbar.heading1': 'Heading 1',
  'toolbar.heading2': 'Heading 2',
  'toolbar.heading3': 'Heading 3',
  'toolbar.heading4': 'Heading 4',
  'toolbar.heading5': 'Heading 5',
  'toolbar.heading6': 'Heading 6',
  'toolbar.bulletList': 'Bullet List',
  'toolbar.numberList': 'Numbered List',
  'toolbar.taskList': 'Task List',
  'toolbar.quote': 'Quote',
  'toolbar.alert': 'Alert Syntax',
  'toolbar.alertNote': 'Note',
  'toolbar.alertTip': 'Tip',
  'toolbar.alertImportant': 'Important',
  'toolbar.alertWarning': 'Warning',
  'toolbar.alertCaution': 'Caution',
  'toolbar.inlineCode': 'Inline Code',
  'toolbar.codeBlock': 'Code Block',
  'toolbar.horizontalRule': 'Horizontal Rule',
  'toolbar.table': 'Table',
  'toolbar.link': 'Link',
  'toolbar.previewOpen': 'Open Preview',
  'toolbar.previewClose': 'Close Preview',
  'toolbar.discordLabel': 'Discord Markdown Syntax',
  'toolbar.discordSubtext': 'Subtext',
  'toolbar.discordUnderline': 'Underline',
  'toolbar.discordSpoiler': 'Spoiler',
  'toolbar.alertContent': 'Alert content',
  'toolbar.sample.bold': 'bold',
  'toolbar.sample.italic': 'italic',
  'toolbar.sample.strike': 'strikethrough',
  'toolbar.sample.heading1': 'Heading 1',
  'toolbar.sample.heading2': 'Heading 2',
  'toolbar.sample.heading3': 'Heading 3',
  'toolbar.sample.heading4': 'Heading 4',
  'toolbar.sample.heading5': 'Heading 5',
  'toolbar.sample.heading6': 'Heading 6',
  'toolbar.sample.list': 'list item',
  'toolbar.sample.task': 'task item',
  'toolbar.sample.quote': 'quote',
  'toolbar.sample.inlineCode': 'code',
  'toolbar.sample.codeBlock': 'Enter code',
  'toolbar.sample.link': 'link text',
  'toolbar.sample.discordSubtext': 'subtext',
  'toolbar.sample.discordUnderline': 'underline',
  'toolbar.sample.discordSpoiler': 'spoiler',

  // === コマンドパレットのカスタムオプションのラベル ===
  'cmdPalette.customOpt.changeLangMode': 'Change Language Mode',
  'cmdPalette.customOpt.changeTheme': 'Preferences: Toggle Color Theme(Light/Dark)',
  'cmdPalette.customOpt.toggleMarkdownPreview': 'Markdown: Toggle Preview',
  'cmdPalette.customOpt.createNewFile': 'File: New File...',
  'cmdPalette.customOpt.saveFile': 'File: Save Current File...',
  'cmdPalette.customOpt.openSettings': 'Preferences: Open Settings',
  'cmdPalette.customOpt.openFile': 'File: Open File...',
  'cmdPalette.customOpt.openFolder': 'File: Open Folder...',
  'cmdPalette.customOpt.closeAllFiles': 'File: Force Close All Editor Tabs',
  'cmdPalette.customOpt.openRecent': 'File: Open Recent File...',
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
