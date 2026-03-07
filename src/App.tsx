/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef, useState, useEffect, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import loader from '@monaco-editor/loader';
import type { Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { Toolbar } from './components/Toolbar';
import { Search, Sun, Moon, Monitor, Files, List as ListIcon, Settings, Plus, X, Check, FileText, FolderOpen, BookOpen, Languages } from 'lucide-react';
import type { EditorFile, EditorSettings } from './types';
import { DEFAULT_SETTINGS } from './types';
import { createT } from './i18n';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { remarkAlert } from 'remark-github-blockquote-alert';
import 'remark-github-blockquote-alert/alert.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './index.css';

type Theme = 'system' | 'light' | 'dark';
type SidebarTab = 'explorer' | 'outline' | 'docs';

// 見出し(Outline)の型定義
interface OutlineItem {
  level: number;
  text: string;
  line: number;
}

// Monaco Editor の言語パック初期設定（動的に変更するには再読み込みが必要）
function configureMonacoLocale(lang: 'ja' | 'en') {
  loader.config({
    paths: {
      vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/min/vs'
    },
    'vs/nls': {
      availableLanguages: {
        '*': lang === 'en' ? '' : lang
      }
    }
  });
}
// 初期設定は localStorage から言語を読み取って適用
(() => {
  try {
    const saved = localStorage.getItem('editor_settings');
    const lang = saved ? (JSON.parse(saved).language || 'ja') : 'ja';
    configureMonacoLocale(lang);
  } catch {
    configureMonacoLocale('ja');
  }
})();

function App() {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  
  const [files, setFiles] = useState<EditorFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string>('');
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>('explorer');

  // 設定機能のState (localStorage対応)
  const [settings, setSettings] = useState<EditorSettings>(() => {
    const saved = localStorage.getItem('editor_settings');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showSettingsTab, setShowSettingsTab] = useState(false); // 設定タブをタブバーに残すためのフラグ

  // v35: 翻訳関数 t() の生成（settings.language に連動）
  const t = useMemo(() => createT(settings.language), [settings.language]);

  // v35: 言語切り替えパレット用の State
  const [showLangSwitchPalette, setShowLangSwitchPalette] = useState(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);

  // ペインの幅管理State
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [previewWidth, setPreviewWidth] = useState(500);

  // 初期テーマ (localStorage対応)
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('editor_theme');
    if (saved === 'system' || saved === 'light' || saved === 'dark') {
      return saved as Theme;
    }
    return 'dark';
  });
  const [activeTheme, setActiveTheme] = useState<'light' | 'dark'>('dark');

  // === 永続化用の副作用 ===
  useEffect(() => {
    localStorage.setItem('editor_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('editor_theme', theme);
  }, [theme]);

  // コンテキストメニュー用のState (fileIdがない場合は余白右クリック)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; fileId?: string } | null>(null);
  // リネーム(名前の変更)用のState
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // メニューバー用のState
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // v11: 追加State
  // v12: QuickPickパレット（言語選択）用のState
  const [showLanguagePalette, setShowLanguagePalette] = useState(false);
  const [languageSearch, setLanguageSearch] = useState('');
  const [availableLanguages, setAvailableLanguages] = useState<{ id: string; aliases?: string[] }[]>([]);
  const languageInputRef = useRef<HTMLInputElement>(null);

  // v16: 新規ファイル作成パレット用のState
  const [showNewFilePalette, setShowNewFilePalette] = useState(false);
  const [newFileNameInput, setNewFileNameInput] = useState('');
  const newFileInputRef = useRef<HTMLInputElement>(null);
  
  // v11: D&Dステータスやトースト
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // v17: ショートカット（リーダーキー）および保存確認パレット用
  const [isChordWaiting, setIsChordWaiting] = useState(false);
  const chordTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showConfirmPalette, setShowConfirmPalette] = useState<{
    title: string;
    message?: string;
    onConfirm: () => void; // 保存して閉じる
    onDeny: () => void;    // 保存せずに閉じる
    onCancel: () => void;  // キャンセル
  } | null>(null);

  // v18: ステータスバー用エディタ情報
  const [cursorPos, setCursorPos] = useState({ line: 1, column: 1 });
  const [selectionCount, setSelectionCount] = useState(0);
  const [eolMode, setEolMode] = useState<'LF' | 'CRLF'>('LF');

  const activeFile = files.find(f => f.id === activeFileId);

  // === 主要な操作関数 (ホイスティング対策で上部に配置) ===
  
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const isSupportedFile = (file: File): boolean => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    return ext === 'md' || ext === 'txt';
  };

  const getLanguageFromFilename = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const map: Record<string, string> = {
      md: 'markdown', markdown: 'markdown',
      ts: 'typescript', tsx: 'typescript',
      js: 'javascript', jsx: 'javascript',
      json: 'json',
      html: 'html', htm: 'html',
      css: 'css',
      py: 'python',
      java: 'java',
      c: 'cpp', cpp: 'cpp', h: 'cpp', hpp: 'cpp',
      cs: 'csharp',
      go: 'go',
      rs: 'rust',
      php: 'php',
      rb: 'ruby',
      xml: 'xml',
      yaml: 'yaml', yml: 'yaml',
      sh: 'shell', bash: 'shell',
      sql: 'sql'
    };
    return map[ext] || 'plaintext';
  };

  const openFileFromDisk = () => {
    fileInputRef.current?.click();
  };

  const openNewFilePalette = () => {
    setNewFileNameInput('');
    setShowNewFilePalette(true);
    setActiveMenu(null);
  };

  const getIsDirty = (file: EditorFile) => {
    return file.content !== (file.savedContent ?? file.content) && file.content !== '';
  };

  const handleSave = React.useCallback(() => {
    if (!activeFile) return;
    setFiles(prev => prev.map(f => 
      f.id === activeFile.id ? { ...f, savedContent: f.content } : f
    ));
    setActiveMenu(null);
  }, [activeFile]);

  const resetChord = () => {
    setIsChordWaiting(false);
    if (chordTimeoutRef.current) {
      clearTimeout(chordTimeoutRef.current);
      chordTimeoutRef.current = null;
    }
  };

  const confirmCreateFile = () => {
    let fileName = newFileNameInput.trim();
    if (!fileName) {
      setShowNewFilePalette(false);
      return;
    }
    
    // 拡張子のチェック
    const hasExtension = fileName.includes('.');
    if (hasExtension) {
      const ext = fileName.split('.').pop()?.toLowerCase();
      if (ext !== 'md' && ext !== 'txt') {
        showToast('エラー: .md または .txt 拡張子のみサポートされています。');
        return;
      }
    } else {
      // 拡張子がない場合は .md を自動付与
      fileName += '.md';
    }

    const newFileId = Date.now().toString();
    const newFile: EditorFile = {
      id: newFileId,
      name: fileName,
      content: '',
      savedContent: '',
      language: getLanguageFromFilename(fileName)
    };
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFileId);
    setShowNewFilePalette(false);
    setNewFileNameInput('');
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const handleUndo = () => {
    if (editorRef.current) {
      editorRef.current.trigger('source', 'editor.action.coreUndo', null);
      editorRef.current.focus();
    }
  };

  const handleRedo = () => {
    if (editorRef.current) {
      editorRef.current.trigger('source', 'editor.action.coreRedo', null);
      editorRef.current.focus();
    }
  };

  // メニューを外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.menu-bar')) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // ショートカット (リーダーキー対応 v17)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 1. リーダーキー (Ctrl+K) の処理
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsChordWaiting(true);
        // 1秒以内に次の入力がない場合は解除
        if (chordTimeoutRef.current) clearTimeout(chordTimeoutRef.current);
        chordTimeoutRef.current = setTimeout(() => {
          setIsChordWaiting(false);
          chordTimeoutRef.current = null;
        }, 1000);
        return;
      }

      // 2. リーダーキー待機中の処理
      if (isChordWaiting) {
        const key = e.key.toLowerCase();
        
        // Ctrl+K -> N: 新規作成
        if (key === 'n') {
          e.preventDefault();
          openNewFilePalette();
          resetChord();
          return;
        }

        // 何かキーが押されたら（上記以外でも）待機を解除
        resetChord();
      }

      // 3. 通常のショートカット (リーダーキーなし)
      // Ctrl+O: 開く (ブラウザ競合が少ないためそのまま)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        openFileFromDisk();
      }
      
      // Ctrl+S: 保存
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isChordWaiting, handleSave]); // isChordWaiting や handleSave の変化を検知する必要がある

  // === ペインリサイズ用のイベントハンドラ定義 ===
  // サイドバーの幅変更
  const startResizingSidebar = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(150, Math.min(600, startWidth + moveEvent.clientX - startX));
      setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // プレビュー領域の幅変更
  const startResizingPreview = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = previewWidth;
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = startX - moveEvent.clientX; 
      const newWidth = Math.max(200, Math.min(window.innerWidth - sidebarWidth - 100, startWidth + delta));
      setPreviewWidth(newWidth);
    };
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 現在のアクティブファイルから見出し（#）を抽出する
  const outlineItems = useMemo(() => {
    if (!activeFile) return [];
    
    const lines = activeFile.content.split(/\r?\n/);
    const items: OutlineItem[] = [];
    
    // Markdownの見出し（行の先頭が1〜6個の#で始まり、その後にスペースがある）を判定
    const headingRegex = /^(#{1,6})\s+(.+)$/;
    
    lines.forEach((line, index) => {
      const match = line.match(headingRegex);
      if (match) {
        items.push({
          level: match[1].length, // #の数が見出しレベル
          text: match[2],
          line: index + 1 // エディターの行番号は1始まり
        });
      }
    });
    
    return items;
  }, [activeFile]);

  useEffect(() => {
    const updateTheme = () => {
      if (theme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setActiveTheme(isDark ? 'dark' : 'light');
      } else {
        setActiveTheme(theme);
      }
    };
    
    updateTheme();
    document.documentElement.setAttribute('data-theme', activeTheme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateTheme);
    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [theme, activeTheme]);

  // 設定のフォントをCSS変数に反映する
  useEffect(() => {
    document.documentElement.style.setProperty('--app-font', settings.uiFont);
    document.documentElement.style.setProperty('--editor-font', settings.editorFont);
  }, [settings.uiFont, settings.editorFont]);

  // === エディターがマウントされる前のイベントハンドラ (テーマ定義用) ===
  const handleEditorWillMount = (monacoInstance: Monaco) => {
    // === 言語設定の拡張 (オートクローズの強制) ===
    monacoInstance.languages.setLanguageConfiguration('markdown', {
      brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')'],
      ],
      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '<', close: '>' },
        { open: '"', close: '"' },
        { open: "'", close: "'" },
        { open: '`', close: '`' },
      ],
      surroundingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
        { open: "'", close: "'" },
        { open: '`', close: '`' },
      ],
      folding: {
        markers: {
          start: new RegExp('^\\s*<!--\\s*#region\\b.*-->'),
          end: new RegExp('^\\s*<!--\\s*#endregion\\b.*-->')
        }
      }
    });

    // === カスタムテーマ(VSCode Dark+風シンタックスハイライト)の定義 ===
    // Monaco EditorのMarkdown Monarchトークナイザーが出力する実際のトークン名に対応
    monacoInstance.editor.defineTheme('vscode-markdown-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        // 見出し(# H1 等)、リスト(- , 1.)のマーカー
        { token: 'keyword.md', foreground: '569cd6' },
        // テーブルヘッダー
        { token: 'keyword.table.header.md', foreground: '4ec9b0', fontStyle: 'bold' },
        { token: 'keyword.table.left.md', foreground: '808080' },
        { token: 'keyword.table.middle.md', foreground: '808080' },
        { token: 'keyword.table.right.md', foreground: '808080' },
        // 太字 (**bold**)
        { token: 'strong.md', foreground: '569cd6', fontStyle: 'bold' },
        // 斜体 (*italic*)
        { token: 'emphasis.md', foreground: '569cd6', fontStyle: 'italic' },
        // インラインコード (`code`)
        { token: 'variable.md', foreground: 'ce9178' },
        // コードブロック内のコード
        { token: 'variable.source.md', foreground: 'ce9178' },
        // コードブロックの開始・終了 (``` や ~~~)
        { token: 'string.md', foreground: 'ce9178' },
        // 引用符で囲まれた文字列 (追加)
        { token: 'string.quote.md', foreground: 'ce9178' },
        // リンク ([text](url))
        { token: 'string.link.md', foreground: '4fc1ff' },
        // リンクターゲット
        { token: 'string.target.md', foreground: '4fc1ff' },
        // HTMLエンティティ (&amp; 等)
        { token: 'string.escape.md', foreground: 'd7ba7d' },
        // 引用 (> quote)
        { token: 'comment.md', foreground: '6a9955' },
        { token: 'comment.content.md', foreground: '6a9955' },
        // HTMLタグ
        { token: 'tag.md', foreground: '808080' },
        { token: 'attribute.name.html.md', foreground: '9cdcfe' },
        { token: 'string.html.md', foreground: 'ce9178' },
        // 水平線 (***) 
        { token: 'meta.separator.md', foreground: '608b4e' },
        // エスケープ文字
        { token: 'escape.md', foreground: 'd7ba7d' },
      ],
      colors: {}
    });

    monacoInstance.editor.defineTheme('vscode-markdown-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'keyword.md', foreground: '0000ff' },
        { token: 'keyword.table.header.md', foreground: '267f99', fontStyle: 'bold' },
        { token: 'keyword.table.left.md', foreground: '808080' },
        { token: 'keyword.table.middle.md', foreground: '808080' },
        { token: 'keyword.table.right.md', foreground: '808080' },
        { token: 'strong.md', foreground: '0000ff', fontStyle: 'bold' },
        { token: 'emphasis.md', foreground: '0000ff', fontStyle: 'italic' },
        { token: 'variable.md', foreground: 'a31515' },
        { token: 'variable.source.md', foreground: 'a31515' },
        { token: 'string.md', foreground: 'a31515' },
        { token: 'string.quote.md', foreground: 'a31515' },
        { token: 'string.link.md', foreground: '0070c1' },
        { token: 'string.target.md', foreground: '0070c1' },
        { token: 'string.escape.md', foreground: 'ee0000' },
        { token: 'comment.md', foreground: '008000' },
        { token: 'comment.content.md', foreground: '008000' },
        { token: 'tag.md', foreground: '800000' },
        { token: 'attribute.name.html.md', foreground: 'e50000' },
        { token: 'string.html.md', foreground: '0000ff' },
        { token: 'meta.separator.md', foreground: '008000' },
        { token: 'escape.md', foreground: 'ee0000' },
      ],
      colors: {}
    });

    // === Monarchトークナイザーの拡張 (引用符のハイライト) ===
    // MarkdownのMonarchプロバイダーを差し替えて、引用符内の文字列をトークナイズする
    monacoInstance.languages.setMonarchTokensProvider('markdown', {
      tokenizer: {
        root: [
          [/"([^"\\]|\\.)*"/, 'string.quote.md'],
          [/'([^'\\]|\\.)*'/, 'string.quote.md'],
          // 残りの標準Markdownルールは継承できないため、最低限のルールをセットする必要があるが、
          // 実はmonacoInstance.languages.getLanguages()から既存のプロバイダを取得して
          // マージするのはMonacoの公開APIでは難しいため、独自にルールを追加する形になる。
          // ただし、完全に上書きすると他のハイライトが消えるため、
          // ここでは引用符の認識のみをシンプルに足しつつ、他の一般的なパターンも拾うようにする。
          [/^#.*$/, 'keyword.md'],
          [/(\*\*|__)(.*)(\*\*|__)/, 'strong.md'],
          [/(\*|_)(.*)(\*|_)/, 'emphasis.md'],
          [/`.*`/, 'variable.md'],
          [/\[.*\]\(.*\)/, 'string.link.md'],
          [/^>.*$/, 'comment.md'],
          [/^(\s*[-+*]|\s*\d+\.)\s/, 'keyword.md'],
        ]
      }
    } as any);
  };

  // === エディターがマウントされたイベントハンドラ ===
  const handleEditorDidMount = (editorInstance: editor.IStandaloneCodeEditor, monacoInstance: Monaco) => {
    editorRef.current = editorInstance;
    monacoRef.current = monacoInstance;
    
    // サポートされている言語（MarkdownとPlain Text）のみをフィルタリングして取得
    const langs = monacoInstance.languages.getLanguages();
    let filtered = langs.filter((l: any) => 
      l.id.toLowerCase() === 'markdown' || 
      l.id.toLowerCase() === 'plaintext' ||
      (l.aliases && l.aliases.some((a: string) => a.toLowerCase() === 'markdown' || a.toLowerCase() === 'plain text'))
    );

    // 万が一フィルタリングで何も取得できなかった場合のフォールバック
    if (filtered.length === 0) {
      filtered = [
        { id: 'markdown', aliases: ['Markdown'] },
        { id: 'plaintext', aliases: ['Plain Text'] }
      ] as any;
    }
    
    setAvailableLanguages(filtered.map((l: any) => ({ 
      id: l.id, 
      aliases: (l as any).aliases // Monaco公式型定義にaliasesがない場合があるため一時的にキャスト
    })));
    const model = editorInstance.getModel();
    if (model) {
      // 常にデフォルトを LF (0) に固定する
      model.setEOL(monacoInstance.editor.EndOfLineSequence.LF);
      setEolMode('LF');
    }

    // === 言語設定の再試行 (オートクローズの確実な動作のため) ===
    monacoInstance.languages.setLanguageConfiguration('markdown', {
      brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')'],
      ],
      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '<', close: '>' },
        { open: '"', close: '"' },
        { open: "'", close: "'" },
        { open: '`', close: '`' },
      ],
    });
    
    // コマンドパレットにアクションを追加 (言語モードの変更)
    editorInstance.addAction({
      id: 'change-language-mode-action',
      label: 'Change Language Mode',
      keybindings: [],
      run: function () {
        setShowLanguagePalette(true);
      }
    });

    // コマンドパレットにアクションを追加 (テーマ切り替え)
    editorInstance.addAction({
      id: 'toggle-theme-action',
      label: 'Preferences: Color Theme',
      keybindings: [],
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1.5,
      run: function () {
        setTheme((prev: Theme) => prev === 'dark' ? 'light' : 'dark');
      }
    });

    // コマンドパレットにアクションを追加 (言語の変更 / Change Language)
    editorInstance.addAction({
      id: 'change-display-language-action',
      label: 'Change Display Language / 言語の変更',
      keybindings: [],
      run: function () {
        setShowLangSwitchPalette(true);
      }
    });

    // === エディタ情報更新リスナー (v18) ===
    editorInstance.onDidChangeCursorPosition((e) => {
      setCursorPos({ line: e.position.lineNumber, column: e.position.column });
    });

    editorInstance.onDidChangeCursorSelection(() => {
      const selection = editorInstance.getSelection();
      if (selection) {
        const model = editorInstance.getModel();
        if (model) {
          const text = model.getValueInRange(selection);
          setSelectionCount(text.length);
        }
      } else {
        setSelectionCount(0);
      }
    });

    // 改行コードの初期取得・設定 (LF固定)
    if (model) {
      model.setEOL(monacoInstance.editor.EndOfLineSequence.LF);
      setEolMode('LF');
    }

    // コマンドパレットにアクションを追加 (プレビュー切り替え)
    editorInstance.addAction({
      id: 'toggle-preview-action',
      label: 'Markdown: Toggle Preview',
      keybindings: [
        monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyMod.Shift | monacoInstance.KeyCode.KeyV
      ],
      run: function () {
        setShowPreview(prev => !prev);
      }
    });

    // コマンドパレットにアクションを追加 (新規ファイル作成 Ctrl+N)
    editorInstance.addAction({
      id: 'new-file-palette-action',
      label: 'File: New File...',
      keybindings: [
        monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyN
      ],
      run: function () {
        openNewFilePalette();
      }
    });

    // コマンドパレットにアクションを追加 (ファイル保存 Ctrl+S)
    editorInstance.addAction({
      id: 'save-file-action',
      label: 'File: Save',
      keybindings: [
        monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS
      ],
      run: function () {
        handleSave();
      }
    });

    // カスタムコマンド: 設定を開く
    editorInstance.addAction({
      id: 'open-settings-action',
      label: 'Preferences: Open Settings',
      keybindings: [
        monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.US_COMMA
      ],
      run: function () {
        setIsSettingsOpen(true);
        setShowSettingsTab(true);
      }
    });

    // カスタムコマンド: ファイルを開く
    editorInstance.addAction({
      id: 'open-file-action',
      label: 'File: Open File...',
      keybindings: [
        monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyO
      ],
      run: function () {
        openFileFromDisk();
      }
    });

    // カスタムコマンド: すべてのファイルを閉じる (初期画面に戻る)
    editorInstance.addAction({
      id: 'close-all-files-action',
      label: 'View: Close All Editor Tabs',
      run: function () {
        // 未保存の確認はひとまずすべて破棄するシンプルな強制クローズとして実装
        setFiles([]);
        setActiveFileId('');
        setIsSettingsOpen(false);
      }
    });

    // コマンドパレット呼び出し用にフォーカス
    editorInstance.focus();
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined || !activeFileId) return;
    setFiles(prevFiles => prevFiles.map(file => 
      file.id === activeFileId ? { ...file, content: value } : file
    ));
  };




  const handleFileOpen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    if (!isSupportedFile(file)) {
      showToast('エラー: Markdown(.md)またはテキスト(.txt)ファイルのみサポートされています。');
      e.target.value = ''; // Reset
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const newFileId = Date.now().toString();
      const newFile: EditorFile = {
        id: newFileId,
        name: file.name,
        content: content,
        savedContent: content,
        language: getLanguageFromFilename(file.name)
      };
      setFiles(prev => [...prev, newFile]);
      setActiveFileId(newFileId);
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset
    setActiveMenu(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    dragCounter.current = 0;
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length === 0) return;
    const file = droppedFiles[0];
    if (!isSupportedFile(file)) {
      showToast('エラー: Markdown(.md)またはテキスト(.txt)ファイルのみサポートされています。');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const newFileId = Date.now().toString();
      const newFile: EditorFile = {
        id: newFileId,
        name: file.name,
        content: content,
        savedContent: content,
        language: getLanguageFromFilename(file.name)
      };
      setFiles(prev => [...prev, newFile]);
      setActiveFileId(newFileId);
    };
    reader.readAsText(file);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDraggingOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };



  const closeFile = (e: React.MouseEvent | null, id: string) => {
    if (e) e.stopPropagation();
    
    const fileToClose = files.find(f => f.id === id);
    if (!fileToClose) return;


    setShowConfirmPalette({
      title: 'タブを閉じますか？',
      message: `'${fileToClose.name}' を閉じようとしています。操作を選択してください。`,
      onConfirm: () => {
        // 保存処理（savedContentを現在のcontentで更新）
        setFiles(prev => prev.map(f => f.id === id ? { ...f, savedContent: f.content } : f));
        // エクスポートして閉じる（最新の内容を確実に渡す）
        handleExport(fileToClose.content);
        executeClose(id);
        setShowConfirmPalette(null);
      },
      onDeny: () => {
        // 保存も何もせずに閉じる
        executeClose(id);
        setShowConfirmPalette(null);
      },
      onCancel: () => setShowConfirmPalette(null)
    });

    // 確認プロンプトを出した後は、ここで処理を中断してユーザーの入力を待つ
    return;
  };

  const executeClose = (id: string) => {
    setFiles(prev => {
      const newFiles = prev.filter(f => f.id !== id);
      
      // 次のアクティブファイルを決定
      if (activeFileId === id) {
        if (newFiles.length > 0) {
          setActiveFileId(newFiles[newFiles.length - 1].id);
        } else {
          setActiveFileId('');
        }
      }
      return newFiles;
    });
  };

  // === コンテキストメニューのイベントハンドラ ===
  // 右クリックでメニューを表示
  const handleContextMenu = (e: React.MouseEvent, fileId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, fileId });
  };

  // メニューの「開く」
  const handleContextOpen = () => {
    if (contextMenu && contextMenu.fileId) {
      setActiveFileId(contextMenu.fileId);
    }
    setContextMenu(null);
  };

  // メニューの「名前の変更」
  const handleContextRename = () => {
    if (contextMenu && contextMenu.fileId) {
      const file = files.find(f => f.id === contextMenu.fileId);
      if (file) {
        setRenamingFileId(contextMenu.fileId);
        setRenameValue(file.name);
      }
    }
    setContextMenu(null);
  };

  // リネーム確定処理
  const commitRename = () => {
    if (renamingFileId && renameValue.trim()) {
      setFiles(prevFiles => prevFiles.map(f =>
        f.id === renamingFileId ? { ...f, name: renameValue.trim() } : f
      ));
    }
    setRenamingFileId(null);
    setRenameValue('');
  };

  // メニューの「削除」
  const handleContextDelete = () => {
    if (contextMenu && files.length > 1) {
      const newFiles = files.filter(f => f.id !== contextMenu.fileId);
      setFiles(newFiles);
      if (activeFileId === contextMenu.fileId) {
        setActiveFileId(newFiles[newFiles.length - 1].id);
      }
    }
    setContextMenu(null);
  };

  const insertMarkdown = (prefix: string, suffix: string, defaultText: string, insertOnNewLine?: boolean) => {
    const editor = editorRef.current;
    if (!editor) return;

    const selection = editor.getSelection();
    if (!selection) return;

    const model = editor.getModel();
    if (!model) return;

    let targetRange: any = selection;
    let actualPrefix = prefix;

    if (insertOnNewLine) {
      const lineContent = model.getLineContent(selection.startLineNumber);
      if (lineContent.trim().length > 0) {
        // 現在行に文字がある場合は、行末に強制移動して空行をあけて挿入する
        const maxCol = model.getLineMaxColumn(selection.endLineNumber);
        targetRange = {
          startLineNumber: selection.endLineNumber,
          startColumn: maxCol,
          endLineNumber: selection.endLineNumber,
          endColumn: maxCol
        };
        actualPrefix = '\n\n' + prefix;
      }
    }

    const selectedText = model.getValueInRange(selection);
    const textToInsert = selectedText || defaultText;
    const newText = `${actualPrefix}${textToInsert}${suffix}`;

    editor.executeEdits('toolbar', [
      {
        range: targetRange,
        text: newText,
        forceMoveMarkers: true,
      }
    ]);

    // フォーカスの復元とカーソル位置調整
    editor.focus();
    // 挿入後に行数が変わった場合、厳密な選択状態の復元は複雑なので、
    // ここでは一番単純に挿入後の末尾にカーソルを合わせる挙動へとフォールバックします
    const position = editor.getPosition();
    if (position) {
      editor.setPosition(position);
    }
  };

  const handleExport = (contentOverride?: string) => {
    if (!activeFile) return;
    // エクスポートは「指定された内容」または「現在の内容」を出力
    const contentToExport = contentOverride !== undefined ? contentOverride : activeFile.content;
    const blob = new Blob([contentToExport], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const triggerCommandPalette = () => {
    const editor = editorRef.current;
    if (editor) {
      editor.focus();
      editor.trigger('App', 'editor.action.quickCommand', null);
    }
  };

  const filteredLanguages = useMemo(() => {
    if (!languageSearch.trim()) return availableLanguages;
    const lowerSearch = languageSearch.toLowerCase();
    return availableLanguages.filter(l => 
      l.id.toLowerCase().includes(lowerSearch) || 
      (l.aliases && l.aliases.some(a => a.toLowerCase().includes(lowerSearch)))
    );
  }, [availableLanguages, languageSearch]);

  const selectLanguage = (langId: string) => {
    if (activeFileId) {
      setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, language: langId } : f));
    }
    setShowLanguagePalette(false);
    setLanguageSearch('');
    editorRef.current?.focus();
  };

  useEffect(() => {
    if (showLanguagePalette && languageInputRef.current) {
      setTimeout(() => languageInputRef.current?.focus(), 50);
    }
  }, [showLanguagePalette]);

  // keydown イベントで Escape / Enter / Arrow 処理
  const handleLanguagePaletteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowLanguagePalette(false);
      setLanguageSearch('');
      editorRef.current?.focus();
    } else if (e.key === 'Enter') {
      if (filteredLanguages.length > 0) {
        selectLanguage(filteredLanguages[0].id);
      }
    }
  };

  const toggleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };



  const toggleEol = () => {
    const newMode = eolMode === 'LF' ? 'CRLF' : 'LF';
    setEolMode(newMode);
    const editor = editorRef.current;
    if (editor) {
      const model = editor.getModel();
      if (model) {
        model.setEOL(newMode === 'LF' ? 0 : 1); // 0: LF, 1: CRLF
      }
    }
  };

  const triggerUndo = () => {
    const editor = editorRef.current;
    if (editor) {
      editor.focus();
      editor.trigger('App', 'undo', null);
      setActiveMenu(null);
    }
  };

  const triggerRedo = () => {
    const editor = editorRef.current;
    if (editor) {
      editor.focus();
      editor.trigger('App', 'redo', null);
      setActiveMenu(null);
    }
  };

  // 見出しをクリックしたときに、エディターの該当行へジャンプスクロールする処理
  const jumpToLine = (lineNumber: number) => {
    const editor = editorRef.current;
    if (editor) {
      editor.revealLineInCenter(lineNumber);
      editor.setPosition({ lineNumber, column: 1 });
      editor.focus();
    }
  };

  return (
    <div className="app-container">
      <header className="app-titlebar">
        <div className="titlebar-section">
          {/* vscode風アプリアイコンの代用 */}
          <div style={{ padding: '0 8px', display: 'flex' }}>
            <img src="/vite.svg" alt="App Icon" style={{ width: 16, height: 16 }} />
          </div>
          
          {/* メニューバー */}
          <div className="menu-bar">
            {/* ファイル メニュー */}
            <div 
              className={`menu-item ${activeMenu === 'file' ? 'active' : ''}`}
              onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
              onMouseEnter={() => activeMenu && setActiveMenu('file')}
            >
              {t('menu.file')}
              {activeMenu === 'file' && (
                <div className="menu-dropdown">
                  <div className="menu-dropdown-item" onClick={(e) => { e.stopPropagation(); openNewFilePalette(); setActiveMenu(null); }}>
                    <span>{t('menu.file.new')}</span>
                    <span className="menu-dropdown-shortcut">Ctrl+K, N</span>
                  </div>
                  <div className="menu-dropdown-item" onClick={(e) => { e.stopPropagation(); openFileFromDisk(); setActiveMenu(null); }}>
                    <span>{t('menu.file.open')}</span>
                    <span className="menu-dropdown-shortcut">Ctrl+O</span>
                  </div>
                  <div className="menu-dropdown-separator"></div>
                  <div className="menu-dropdown-item" onClick={(e) => { e.stopPropagation(); handleSave(); }}>
                    <span>{t('menu.file.save')}</span>
                    <span className="menu-dropdown-shortcut">Ctrl+S</span>
                  </div>
                  <div className="menu-dropdown-separator"></div>
                  <div className="menu-dropdown-item" onClick={(e) => { e.stopPropagation(); handleExport(); setActiveMenu(null); }}>
                    <span>{t('menu.file.export')}</span>
                  </div>
                </div>
              )}
            </div>

            {/* 編集 メニュー */}
            <div 
              className={`menu-item ${activeMenu === 'edit' ? 'active' : ''}`}
              onClick={() => setActiveMenu(activeMenu === 'edit' ? null : 'edit')}
              onMouseEnter={() => activeMenu && setActiveMenu('edit')}
            >
              {t('menu.edit')}
              {activeMenu === 'edit' && (
                <div className="menu-dropdown">
                  <div className="menu-dropdown-item" onClick={(e) => { e.stopPropagation(); triggerUndo(); }}>
                    <span>{t('menu.edit.undo')}</span>
                    <span className="menu-dropdown-shortcut">Ctrl+Z</span>
                  </div>
                  <div className="menu-dropdown-item" onClick={(e) => { e.stopPropagation(); triggerRedo(); }}>
                    <span>{t('menu.edit.redo')}</span>
                    <span className="menu-dropdown-shortcut">Ctrl+Y</span>
                  </div>
                </div>
              )}
            </div>

            {/* 表示 メニュー */}
            <div 
              className={`menu-item ${activeMenu === 'view' ? 'active' : ''}`}
              onClick={() => setActiveMenu(activeMenu === 'view' ? null : 'view')}
              onMouseEnter={() => activeMenu && setActiveMenu('view')}
            >
              {t('menu.view')}
              {activeMenu === 'view' && (
                <div className="menu-dropdown">
                  <div className="menu-dropdown-item" onClick={(e) => { e.stopPropagation(); triggerCommandPalette(); setActiveMenu(null); }}>
                    <span>{t('menu.view.commandPalette')}</span>
                    <span className="menu-dropdown-shortcut">F1</span>
                  </div>
                  <div className="menu-dropdown-separator"></div>
                  <div className="menu-dropdown-item" onClick={(e) => { e.stopPropagation(); setShowPreview(!showPreview); setActiveMenu(null); }}>
                    <span>{showPreview ? t('menu.view.previewClose') : t('menu.view.previewOpen')}</span>
                    <span className="menu-dropdown-shortcut">Ctrl+Shift+V</span>
                  </div>
                  <div className="menu-dropdown-separator"></div>
                  <div className="menu-dropdown-item" onClick={(e) => { e.stopPropagation(); setShowLangSwitchPalette(true); setActiveMenu(null); }}>
                    <span>{t('menu.view.language')}</span>
                  </div>
                  <div className="menu-dropdown-separator"></div>
                  <div className="menu-dropdown-item" onClick={(e) => { e.stopPropagation(); setIsSettingsOpen(true); setActiveMenu(null); }}>
                    <span>{t('menu.view.settings')}</span>
                    <span className="menu-dropdown-shortcut">Ctrl+,</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="titlebar-section titlebar-center">
          <button className="command-palette-trigger" onClick={triggerCommandPalette} data-tooltip={t('titlebar.commandPaletteTooltip')}>
            <Search size={14} />
            <span>{t('titlebar.searchPlaceholder')}</span>
          </button>
        </div>
        <div className="titlebar-section titlebar-right">
          <button className="theme-toggle-btn" onClick={toggleTheme} data-tooltip-left={`${t('titlebar.themeToggle')} (${theme})`}>
            {theme === 'system' ? <Monitor size={16} /> : theme === 'light' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      {/* === 言語選択用 QuickPick パレット === */}
      {showLanguagePalette && (
        <div className="quickpick-overlay" onClick={() => { setShowLanguagePalette(false); setLanguageSearch(''); }}>
          <div className="quickpick-container" onClick={e => e.stopPropagation()}>
            <div className="quickpick-input-wrapper">
              <div className="quickpick-title">{t('langPalette.title')}</div>
              <input
                ref={languageInputRef}
                className="quickpick-input"
                type="text"
                placeholder={t('langPalette.placeholder')}
                value={languageSearch}
                onChange={e => setLanguageSearch(e.target.value)}
                onKeyDown={handleLanguagePaletteKeyDown}
              />
            </div>
            <div className="quickpick-list">
              {filteredLanguages.map(lang => (
                <div 
                  key={lang.id} 
                  className={`quickpick-item ${activeFile?.language === lang.id ? 'active' : ''}`}
                  onClick={() => selectLanguage(lang.id)}
                >
                  <span className="quickpick-item-label">
                    {lang.aliases && lang.aliases.length > 0 ? lang.aliases[0] : lang.id}
                  </span>
                  <span className="quickpick-item-sub">({lang.id})</span>
                </div>
              ))}
              {filteredLanguages.length === 0 && (
                <div className="quickpick-item" style={{ opacity: 0.5, pointerEvents: 'none' }}>
                  {t('langPalette.noMatch')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === 新規ファイル名入力用パレット (v16) === */}
      {showNewFilePalette && (
        <div className="quickpick-overlay" onClick={() => setShowNewFilePalette(false)}>
          <div className="quickpick-container" onClick={e => e.stopPropagation()}>
            <div className="quickpick-input-wrapper">
              <div className="quickpick-title">{t('newFile.title')}</div>
              <input
                ref={newFileInputRef}
                className="quickpick-input"
                type="text"
                placeholder={t('newFile.placeholder')}
                value={newFileNameInput}
                onChange={e => setNewFileNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmCreateFile();
                  if (e.key === 'Escape') setShowNewFilePalette(false);
                }}
                autoFocus
              />
            </div>
            <div style={{ padding: '8px 12px', fontSize: '12px', opacity: 0.6, borderTop: '1px solid var(--border-color)' }}>
                            {t('newFile.hint')}
            </div>
          </div>
        </div>
      )}

      {/* === 確認パレット (保存しますか？ 等) (v17) === */}
      {showConfirmPalette && (
        <div className="quickpick-overlay" onClick={showConfirmPalette.onCancel}>
          <div className="quickpick-container" onClick={e => e.stopPropagation()}>
            <div className="quickpick-header" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>{showConfirmPalette.title}</div>
              {showConfirmPalette.message && (
                <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>{showConfirmPalette.message}</div>
              )}
            </div>
            <div className="quickpick-list" style={{ maxHeight: 'none' }}>
              <div className="quickpick-item" onClick={showConfirmPalette.onConfirm}>
                <div className="quickpick-item-info">
                  <div className="quickpick-item-label">{t('confirm.exportAndClose')}</div>
                  <div className="quickpick-item-desc">{t('confirm.exportAndCloseDesc')}</div>
                </div>
              </div>
              <div className="quickpick-item" onClick={showConfirmPalette.onDeny}>
                <div className="quickpick-item-info">
                  <div className="quickpick-item-label" style={{ color: 'var(--accent-color)' }}>{t('confirm.closeWithoutExport')}</div>
                  <div className="quickpick-item-desc">{t('confirm.closeWithoutExportDesc')}</div>
                </div>
              </div>
              <div className="context-menu-separator" style={{ margin: 0 }} />
              <div className="quickpick-item" onClick={showConfirmPalette.onCancel}>
                <div className="quickpick-item-info">
                  <div className="quickpick-item-label">{t('confirm.cancel')}</div>
                  <div className="quickpick-item-desc">{t('confirm.cancelDesc')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === 言語切り替えパレット (v35) === */}
      {showLangSwitchPalette && (
        <div className="quickpick-overlay" onClick={() => setShowLangSwitchPalette(false)}>
          <div className="quickpick-container" onClick={e => e.stopPropagation()}>
            <div className="quickpick-input-wrapper">
              <div className="quickpick-title">{t('langSwitch.title')}</div>
            </div>
            <div className="quickpick-list" style={{ maxHeight: 'none' }}>
              <div 
                className={`quickpick-item ${settings.language === 'ja' ? 'active' : ''}`} 
                onClick={() => {
                  setSettings({...settings, language: 'ja'});
                  configureMonacoLocale('ja');
                  setShowLangSwitchPalette(false);
                }}
              >
                <Languages size={16} />
                <span className="quickpick-item-label">{t('langSwitch.ja')}</span>
              </div>
              <div 
                className={`quickpick-item ${settings.language === 'en' ? 'active' : ''}`} 
                onClick={() => {
                  setSettings({...settings, language: 'en'});
                  configureMonacoLocale('en');
                  setShowLangSwitchPalette(false);
                }}
              >
                <Languages size={16} />
                <span className="quickpick-item-label">{t('langSwitch.en')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <main 
        className="app-main"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        style={{ position: 'relative' }}
      >
        {/* D&D時のオーバーレイ UI */}
        {isDraggingOver && (
          <div className="drag-overlay">
            <div className="drag-overlay-content">
              <FolderOpen size={48} />
              <span>{t('dnd.drop')}</span>
            </div>
          </div>
        )}

        <div className="activity-bar">
          <div 
            className={`activity-icon ${activeSidebarTab === 'explorer' ? 'active' : ''}`} 
            data-tooltip-right={t('activity.explorer')}
            onClick={() => setActiveSidebarTab('explorer')}
          >
            <Files size={24} />
          </div>
          <div 
            className={`activity-icon ${activeSidebarTab === 'outline' ? 'active' : ''}`} 
            data-tooltip-right={t('activity.outline')}
            onClick={() => setActiveSidebarTab('outline')}
          >
            <ListIcon size={24} />
          </div>
          <div 
            className={`activity-icon ${activeSidebarTab === 'docs' ? 'active' : ''}`} 
            data-tooltip-right={t('activity.docs')}
            onClick={() => setActiveSidebarTab('docs')}
          >
            <BookOpen size={24} />
          </div>
          <div style={{ flex: 1 }}></div>
          <div 
            className={`activity-icon ${(isSettingsOpen || showSettingsTab) ? 'active' : ''}`} 
            data-tooltip-right={t('activity.settings')}
            onClick={() => { setIsSettingsOpen(true); setShowSettingsTab(true); }}
          >
            <Settings size={24} />
          </div>
        </div>

        <div className="side-bar" style={{ width: sidebarWidth }}>
          <div className="side-bar-header">
            {activeSidebarTab === 'explorer' ? (
              <div className="sidebar-header">
                <h3>{t('sidebar.explorer')}</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="sidebar-action-btn" onClick={openNewFilePalette} data-tooltip={t('sidebar.newFile')}>
                    <Plus size={16} />
                  </button>
                  <button className="sidebar-action-btn" onClick={openFileFromDisk} data-tooltip={t('sidebar.openFile')}>
                    <FolderOpen size={16} />
                  </button>
                </div>
              </div>
            ) : activeSidebarTab === 'outline' ? (
              <span style={{ padding: '10px 15px', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.8 }}>{t('sidebar.outline')}</span>
            ) : (
              <span style={{ padding: '10px 15px', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.8 }}>MARKDOWN DOCS</span>
            )}
          </div>
          <div 
            className="side-bar-content" 
            style={{ padding: 0, overflowY: 'auto', flex: 1 }}
            onContextMenu={(e) => {
              // エクスプローラーモードの時だけ余白右クリックを処理
              if (activeSidebarTab === 'explorer') {
                e.preventDefault();
                setContextMenu({ x: e.clientX, y: e.clientY });
              }
            }}
          >
            {activeSidebarTab === 'explorer' ? (
              <ul className="explorer-list">
                {files.map(file => (
                  <li 
                    key={file.id} 
                    className={`explorer-item ${activeFileId === file.id ? 'active' : ''}`}
                    onClick={() => setActiveFileId(file.id)}
                    onContextMenu={(e) => handleContextMenu(e, file.id)}
                  >
                    <FileText size={14} />
                    {renamingFileId === file.id ? (
                      <input
                        className="rename-input"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRename();
                          if (e.key === 'Escape') { setRenamingFileId(null); setRenameValue(''); }
                        }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {file.name}
                        </span>
                        {getIsDirty(file) && <span className="dirty-marker">*</span>}
                      </div>
                    )}
                    <button 
                      className="explorer-close-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeFile(e, file.id);
                      }}
                      data-tooltip={t('sidebar.close')}
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : activeSidebarTab === 'outline' ? (
              <div className="outline-list" style={{ padding: '8px 0' }}>
                {outlineItems.length > 0 ? (
                  outlineItems.map((item, index) => (
                    <div 
                      key={index} 
                      className={`outline-item outline-level-${item.level}`}
                      onClick={() => jumpToLine(item.line)}
                      data-tooltip={item.text}
                    >
                      {item.text}
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '10px 20px', fontSize: '12px', color: 'var(--activity-icon)' }}>
                    {t('sidebar.noHeadings')}
                  </div>
                )}
              </div>
            ) : (
              // Markdown Docs タブ
              <div style={{ padding: '12px', fontSize: '13px', lineHeight: 1.6, color: 'var(--text-color)' }}>
                <p style={{ marginBottom: '16px', fontSize: '12px', opacity: 0.8 }}>{t('docs.intro')}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  <div className="docs-item" style={{ borderBottom: '1px solid var(--sidebar-border)', paddingBottom: '12px' }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--accent-color)' }}>{t('docs.headings')}</div>
                    <code style={{ display: 'block', padding: '4px 8px', background: 'var(--input-bg)', borderRadius: '4px', marginBottom: '8px', whiteSpace: 'pre-wrap' }}>
                      # Heading 1<br/>## Heading 2<br/>### Heading 3
                    </code>
                    <div className="preview-pane docs-preview" style={{ padding: '8px', border: '1px solid var(--toolbar-border)', borderRadius: '4px', background: 'var(--editor-bg)' }}>
                      <h1>Heading 1</h1><h2>Heading 2</h2><h3>Heading 3</h3>
                    </div>
                  </div>

                  <div className="docs-item" style={{ borderBottom: '1px solid var(--sidebar-border)', paddingBottom: '12px' }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--accent-color)' }}>{t('docs.emphasis')}</div>
                    <code style={{ display: 'block', padding: '4px 8px', background: 'var(--input-bg)', borderRadius: '4px', marginBottom: '8px', whiteSpace: 'pre-wrap' }}>
                      **Bold**<br/>*Italic*<br/>~~Strikethrough~~
                    </code>
                    <div className="preview-pane docs-preview" style={{ padding: '8px', border: '1px solid var(--toolbar-border)', borderRadius: '4px', background: 'var(--editor-bg)' }}>
                      <p><strong>Bold</strong><br/><em>Italic</em><br/><del>Strikethrough</del></p>
                    </div>
                  </div>

                  <div className="docs-item" style={{ borderBottom: '1px solid var(--sidebar-border)', paddingBottom: '12px' }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--accent-color)' }}>{t('docs.lists')}</div>
                    <code style={{ display: 'block', padding: '4px 8px', background: 'var(--input-bg)', borderRadius: '4px', marginBottom: '8px', whiteSpace: 'pre-wrap' }}>{`- Item 1\n- Item 2\n  - Sub item`}</code>
                    <div className="preview-pane docs-preview" style={{ padding: '8px', border: '1px solid var(--toolbar-border)', borderRadius: '4px', background: 'var(--editor-bg)' }}>
                      <ul><li>Item 1</li><li>Item 2<ul><li>Sub item</li></ul></li></ul>
                    </div>
                  </div>

                  <div className="docs-item" style={{ borderBottom: '1px solid var(--sidebar-border)', paddingBottom: '12px' }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--accent-color)' }}>{t('docs.codeBlock')}</div>
                    <code style={{ display: 'block', padding: '4px 8px', background: 'var(--input-bg)', borderRadius: '4px', marginBottom: '8px', whiteSpace: 'pre-wrap' }}>
                      ```javascript<br/>const foo = 'bar';<br/>```
                    </code>
                    <div className="preview-pane docs-preview" style={{ padding: '8px', border: '1px solid var(--toolbar-border)', borderRadius: '4px', background: 'var(--editor-bg)' }}>
                      <pre style={{ margin: 0, padding: '4px' }}><code><span style={{ color: '#569cd6' }}>const</span> foo = <span style={{ color: '#ce9178' }}>'bar'</span>;</code></pre>
                    </div>
                  </div>

                  <div className="docs-item" style={{ borderBottom: '1px solid var(--sidebar-border)', paddingBottom: '12px' }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--accent-color)' }}>{t('docs.alerts')}</div>
                    <code style={{ display: 'block', padding: '4px 8px', background: 'var(--input-bg)', borderRadius: '4px', marginBottom: '8px', whiteSpace: 'pre-wrap' }}>
                      &gt; [!NOTE]<br/>&gt; Content here
                    </code>
                    <div className="preview-pane docs-preview" style={{ padding: '8px', border: '1px solid var(--toolbar-border)', borderRadius: '4px', background: 'var(--editor-bg)' }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkAlert]}>
                        {`> [!NOTE]\n> Note content\n\n> [!WARNING]\n> Warning content`}
                      </ReactMarkdown>
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', opacity: 0.7, paddingTop: '8px' }}>
                    {t('docs.reference')}<a href="https://www.tohoho-web.com/ex/markdown.html" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color)' }}>{t('docs.referenceLink')}</a>{t('docs.referenceSuffix')}
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>
        <div className="resizer-x" onMouseDown={startResizingSidebar} title={t('resizer.tooltip')} />
        <div className="editor-container">
          <div className="tabs-container">
          {files.map(file => {
            return (
              <div 
                key={file.id} 
                className={`editor-tab ${!isSettingsOpen && file.id === activeFileId ? 'active' : ''}`}
                onClick={() => { setActiveFileId(file.id); setIsSettingsOpen(false); }}
              >
                <FileText size={14} />
                <span className="tab-title">
                  {file.name}
                </span>
                {getIsDirty(file) && <span className="dirty-marker">*</span>}
                <button 
                  className="tab-close-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeFile(e, file.id);
                  }}
                  data-tooltip="閉じる"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
          {/* 設定タブ */}
          {showSettingsTab && (
            <div 
              className={`editor-tab ${isSettingsOpen ? 'active' : ''}`}
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings size={14} />
              <span className="tab-title">設定</span>
              <button 
                className="tab-close-btn"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setIsSettingsOpen(false);
                  setShowSettingsTab(false);
                }}
                data-tooltip="閉じる"
              >
                <X size={14} />
              </button>
            </div>
          )}
          </div>

          {/* 設定タブが開いていない時、かつファイルが開いている時のみツールバーを表示 */}
          {!isSettingsOpen && activeFile && (
            <Toolbar 
              onInsertMarkdown={insertMarkdown} 
              onExport={handleExport} 
              onTogglePreview={() => setShowPreview(!showPreview)} 
              showPreview={showPreview} 
              onUndo={handleUndo}
              onRedo={handleRedo}
            />
          )}
            
          {/* モバイル時にプレビューが有効であればクラス preview-mobile-active を付与 */}
          <div className={`split-view-container ${showPreview && activeFile ? 'preview-mobile-active' : ''}`}>
            {isSettingsOpen ? (
              /* === 設定画面 (タブ内表示) === */
              <div className="settings-tab-content">
                <h2 className="settings-tab-title">{t('settings.title')}</h2>
                <div className="settings-content">
                  <div className="setting-row">
                    <span className="setting-label">{t('settings.language')}</span>
                    <select 
                      className="setting-input" 
                      style={{ fontFamily: settings.uiFont }}
                      value={settings.language}
                      onChange={e => {
                        const newLang = e.target.value as 'ja' | 'en';
                        setSettings({...settings, language: newLang});
                        configureMonacoLocale(newLang);
                      }}
                    >
                      <option value="ja">{t('langSwitch.ja')}</option>
                      <option value="en">{t('langSwitch.en')}</option>
                    </select>
                  </div>
                  <div className="setting-row">
                    <span className="setting-label">{t('settings.fontSize')}</span>
                    <input 
                      type="number" 
                      className="setting-input" 
                      value={settings.fontSize} 
                      onChange={e => setSettings({...settings, fontSize: Number(e.target.value) || 14})}
                      min={8} max={72}
                    />
                  </div>
                  <div className="setting-row">
                    <span className="setting-label">{t('settings.lineHeight')}</span>
                    <input 
                      type="number" 
                      className="setting-input" 
                      value={settings.lineHeight} 
                      onChange={e => setSettings({...settings, lineHeight: Number(e.target.value) || 24})}
                      min={12} max={100}
                    />
                  </div>
                  <div className="setting-row">
                    <span className="setting-label">{t('settings.minimap')}</span>
                    <div 
                      className={`toggle-switch ${settings.minimap ? 'active' : ''}`}
                      onClick={() => setSettings({...settings, minimap: !settings.minimap})}
                    >
                      <span className="toggle-icon">
                        {settings.minimap ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
                      </span>
                    </div>
                  </div>
                  <div className="setting-row">
                    <span className="setting-label">{t('settings.wordWrap')}</span>
                    <select 
                      className="setting-input" 
                      style={{ fontFamily: settings.uiFont }}
                      value={settings.wordWrap}
                      onChange={e => setSettings({...settings, wordWrap: e.target.value as 'on' | 'off'})}
                    >
                      <option value="on">{t('settings.wordWrapOn')}</option>
                      <option value="off">{t('settings.wordWrapOff')}</option>
                    </select>
                  </div>
                  <div className="setting-row">
                    <span className="setting-label">{t('settings.uiFont')}</span>
                    <select 
                      className="setting-input" 
                      style={{ width: '180px', fontFamily: settings.uiFont }}
                      value={settings.uiFont}
                      onChange={e => setSettings({...settings, uiFont: e.target.value})}
                    >
                      <option value="consolas, 'Courier New', monospace">Consolas</option>
                      <option value="'Inter', 'Noto Sans JP', sans-serif">Inter & Noto Sans JP</option>
                      <option value="'Roboto', 'M PLUS 1p', sans-serif">Roboto & M PLUS 1p</option>
                      <option value="'Roboto', 'LINE Seed JP', sans-serif">Roboto & LINE Seed JP</option>
                      <option value="'Google Sans', 'Noto Sans JP', sans-serif">Google Sans & Noto Sans JP</option>
                      <option value="'Google Sans Code', 'BIZ UDGothic', sans-serif">Google Sans Code & BIZ UD</option>
                      <option value="'Source Code Pro', monospace">Source Code Pro</option>
                      {settings.language === 'en' && (
                        <>
                          <option value="'Inter', sans-serif, monospace">Inter (EN)</option>
                          <option value="'Roboto', sans-serif, monospace">Roboto (EN)</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="setting-row">
                    <span className="setting-label">{t('settings.editorFont')}</span>
                    <select 
                      className="setting-input" 
                      style={{ width: '180px', fontFamily: settings.uiFont }}
                      value={settings.editorFont}
                      onChange={e => setSettings({...settings, editorFont: e.target.value})}
                    >
                      <option value="consolas, 'Courier New', monospace">Consolas</option>
                      <option value="'Fira Code', 'Noto Sans JP', monospace">Fira Code & Noto Sans</option>
                      <option value="'JetBrains Mono', 'Noto Sans JP', monospace">JetBrains Mono & Noto Sans</option>
                      <option value="'Roboto Mono', 'BIZ UDGothic', monospace">Roboto Mono & BIZ UD</option>
                      <option value="'Google Sans Code', 'Noto Sans JP', monospace">Google Sans Code & Noto Sans JP</option>
                      <option value="'JetBrains Mono', 'BIZ UDGothic', monospace">JetBrains Mono & BIZ UD</option>
                      {settings.language === 'en' && (
                        <>
                          <option value="'JetBrains Mono', monospace">JetBrains Mono (EN)</option>
                          <option value="'Fira Code', monospace">Fira Code (EN)</option>
                          <option value="'Cascadia Code', monospace">Cascadia Code (EN)</option>
                          <option value="'Source Code Pro', monospace">Source Code Pro (EN)</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              /* === エディターペイン === */
              <>
              <div className="editor-pane">
                <div className="monaco-wrapper">
                  {/* activeFileの有無に関わらず、コマンドパレット等を使うために常にエディタを配置する */}
                  <Editor
                    height="100%"
                    defaultLanguage="markdown"
                    language={activeFile ? (activeFile.language || 'markdown') : 'plaintext'}
                    theme={activeTheme === 'dark' ? 'vscode-markdown-dark' : 'vscode-markdown-light'}
                    value={activeFile ? activeFile.content : ''}
                    onChange={handleEditorChange}
                    beforeMount={handleEditorWillMount}
                    onMount={handleEditorDidMount}
                    options={{
                      readOnly: !activeFile, // ファイル未選択時は読み取り専用
                      minimap: { enabled: settings.minimap },
                      wordWrap: settings.wordWrap,
                      fontSize: settings.fontSize,
                      lineHeight: settings.lineHeight,
                      padding: { top: 16, bottom: 16 },
                      scrollBeyondLastLine: false,
                      smoothScrolling: true,
                      cursorBlinking: 'smooth',
                      fontFamily: settings.editorFont, // 設定からフォントを反映
                      autoClosingQuotes: 'always',
                      autoClosingBrackets: 'always',
                      autoClosingOvertype: 'always',
                      autoSurround: 'languageDefined',
                    }}
                  />
                  {!activeFile && (
                    <div className="empty-state-view" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, backgroundColor: 'var(--editor-bg)' }}>
                      <div className="empty-state-logo">
                        <img src="/vite.svg" alt="App Logo" />
                      </div>
                      <div className="empty-state-shortcuts">
                        <div className="shortcut-row">
                          <span className="shortcut-label">{t('empty.showCommandPalette')}</span>
                          <span className="shortcut-key">F1</span>
                        </div>
                        <div className="shortcut-row">
                          <span className="shortcut-label">{t('empty.newFile')}</span>
                          <span className="shortcut-key">Ctrl+K, N</span>
                        </div>
                        <div className="shortcut-row">
                          <span className="shortcut-label">{t('empty.openFile')}</span>
                          <span className="shortcut-key">Ctrl+O</span>
                        </div>
                        <div className="shortcut-row">
                          <span className="shortcut-label">{t('empty.toggleTheme')}</span>
                          <span className="shortcut-key">F1 &gt; Theme</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            
            {showPreview && activeFile && (
              <>
                <div className="resizer-x" onMouseDown={startResizingPreview} title={t('resizer.tooltip')} />
                <div className="preview-pane" style={{ width: previewWidth, flex: 'none' }}>
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm, remarkAlert]}
                    components={{
                      code({ className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return match ? (
                          <SyntaxHighlighter
                            style={activeTheme === 'dark' ? vscDarkPlus : vs}
                            language={match[1]}
                            PreTag="div"
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {activeFile.content}
                  </ReactMarkdown>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>

        {/* D&D時のオーバーレイ UI は統合されているのでここでは不要 */}
      </main>

      <footer className="status-bar">
        <div className="status-bar-left">
          {isChordWaiting && (
            <div className="status-bar-item">
              {t('status.chordWaiting')}
            </div>
          )}
        </div>
        
        <div className="status-bar-right">
          {selectionCount > 0 && (
            <div className="status-bar-item">
              {selectionCount} {t('status.charSelected')}
            </div>
          )}
          <div 
            className="status-bar-item highlight" 
            style={{ cursor: 'pointer' }}
            title={t('status.gotoLine')}
            onClick={() => {
              if (editorRef.current) {
                // editorにフォーカスしてGo To Lineパレットを開かせる
                editorRef.current.focus();
                editorRef.current.trigger('source', 'editor.action.gotoLine', null);
              }
            }}
          >
            {t('status.line')} {cursorPos.line}, {t('status.col')} {cursorPos.column}
          </div>
          <div className="status-bar-item" onClick={toggleEol} style={{ cursor: 'pointer' }} data-tooltip={t('status.eolTooltip')}>
            {eolMode}
          </div>
          <div className="status-bar-item">
            UTF-8
          </div>
          <span 
            className="status-bar-item highlight"
            onClick={() => setShowLanguagePalette(true)}
            data-tooltip={t('status.langMode')}
          >
            {activeFile?.language ? (activeFile.language.charAt(0).toUpperCase() + activeFile.language.slice(1)) : 'Markdown'}
          </span>
        </div>
      </footer>


      {/* コンテキストメニュー（右クリック時に表示） */}
      {contextMenu && (
        <div className="context-menu-overlay" onClick={() => setContextMenu(null)} onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}>
          <div 
            className="context-menu" 
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.fileId ? (
              <>
                <div className="context-menu-item" onClick={handleContextOpen}>{t('context.open')}</div>
                <div className="context-menu-separator" />
                <div className="context-menu-item" onClick={handleContextRename}>{t('context.rename')}</div>
                <div className="context-menu-separator" />
                <div 
                  className={`context-menu-item ${files.length <= 1 ? 'disabled' : 'danger'}`} 
                  onClick={files.length > 1 ? handleContextDelete : undefined}
                >
                  {t('context.delete')}
                </div>
              </>
            ) : (
              <>
                <div className="context-menu-item" onClick={() => { openNewFilePalette(); setContextMenu(null); }}>{t('context.newFile')}</div>
                <div className="context-menu-item" onClick={() => { openFileFromDisk(); setContextMenu(null); }}>{t('context.openFile')}</div>
              </>
            )}
          </div>
        </div>
      )}

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileOpen} 
        accept="*/*" 
        style={{ display: 'none' }} 
      />

      {/* エラートースト通知 */}
      {toastMsg && (
        <div className="toast-container">
          <div className="toast-notification">
            {toastMsg}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
