/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef, useState, useEffect, useMemo } from 'react';
import loader from '@monaco-editor/loader';
import type { Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import 'remark-github-blockquote-alert/alert.css';
import './index.css';
import logoImage from './assets/logo.svg';
import { EditorPane } from './components/app/EditorPane';
import { OverlayLayer } from './components/app/OverlayLayer';
import { QuickPickLayer } from './components/app/QuickPickLayer';
import { SidebarPanel } from './components/app/SidebarPanel';
import { StatusBar } from './components/app/StatusBar';
import { TitleBar } from './components/app/TitleBar';
import type { EditorFile, EditorSettings, OutlineItem } from './types';
import { DEFAULT_SETTINGS } from './types';
import { createT } from './i18n';
import {
  getFileSourceSignature,
  getLanguageFromFilename,
  isSupportedFile,
} from './utils/editor/fileUtils';
import { clamp } from './utils/editor/number';
import { FILE_SESSION_STORAGE_KEY, readPersistedEditorState } from './utils/editor/persistence';

type Theme = 'system' | 'light' | 'dark';
type SidebarTab = 'explorer' | 'outline' | 'docs';

// Monaco Editor の言語パック初期設定（動的に変更するには再読み込みが必要）
function configureMonacoLocale(lang: 'ja' | 'en') {
  loader.config({
    paths: {
      vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/min/vs',
    },
    'vs/nls': {
      availableLanguages: {
        '*': lang === 'en' ? '' : lang,
      },
    },
  });
}
// 初期設定は localStorage から言語を読み取って適用
(() => {
  try {
    const saved = localStorage.getItem('editor_settings');
    const lang = saved
      ? JSON.parse(saved).language || DEFAULT_SETTINGS.language
      : DEFAULT_SETTINGS.language;
    configureMonacoLocale(lang);
  } catch {
    configureMonacoLocale(DEFAULT_SETTINGS.language);
  }
})();

function App() {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const handleSaveRef = useRef<() => void>(() => {});
  const activeFileIdRef = useRef('');
  const knownFileHandlesRef = useRef<Record<string, any>>({});
  const [historyStateByFile, setHistoryStateByFile] = useState<
    Record<string, { canUndo: boolean; canRedo: boolean }>
  >({});

  const [files, setFiles] = useState<EditorFile[]>(() => readPersistedEditorState().files);
  const filesRef = useRef<EditorFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string>(
    () => readPersistedEditorState().activeFileId
  );
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>('explorer');
  // サイドバーの開閉状態 (画面が狭い場合は初期で閉じておく)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth > 768);

  // === スマホ向け等 ズーム(scale)の自動調整 ===
  const [appScale, setAppScale] = useState(1);
  useEffect(() => {
    const calcScale = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      const baseIdealWidth = isLandscape ? 800 : 400;

      if (window.innerWidth < baseIdealWidth) {
        setAppScale(window.innerWidth / baseIdealWidth);
      } else {
        setAppScale(1);
      }
    };

    calcScale();
    window.addEventListener('resize', calcScale);

    return () => window.removeEventListener('resize', calcScale);
  }, []);

  // === メニューバー表示制御 ===
  // Altキーで一時的にメニューバーを表示するためのフラグ (toggleモード用)
  const [isMenuBarVisibleByAlt, setIsMenuBarVisibleByAlt] = useState(false);
  // ハンバーガーメニューのコンテキストメニュー表示用
  const [hamburgerMenu, setHamburgerMenu] = useState<{ x: number; y: number } | null>(null);
  // ハンバーガーメニュー内のサブメニュー表示状態 ('file' | 'edit' | 'view' | null)
  const [hamburgerSubMenu, setHamburgerSubMenu] = useState<string | null>(null);
  // メニューバー右クリック時のコンテキストメニュー
  const [titleBarContextMenu, setTitleBarContextMenu] = useState<{ x: number; y: number } | null>(
    null
  );

  // 設定機能のState (localStorage対応)
  const [settings, setSettings] = useState<EditorSettings>(() => {
    const saved = localStorage.getItem('editor_settings');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch {
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

  // === effectiveMenuBarMode: 画面幅が狭い時は自動で compact に切り替え ===
  const effectiveMenuBarMode = useMemo(() => {
    // appScale < 1 → スマホ等で画面が狭い → 自動で compact に
    if (appScale < 1) return 'compact';

    return settings.menuBarVisibility;
  }, [appScale, settings.menuBarVisibility]);

  // === Alt キーでメニューバーを一時表示 (toggle モード用) ===
  useEffect(() => {
    if (effectiveMenuBarMode !== 'toggle') {
      setIsMenuBarVisibleByAlt(false);

      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        e.preventDefault();
        setIsMenuBarVisibleByAlt((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [effectiveMenuBarMode]);

  // === コンテキストメニューを外側クリックで閉じる ===
  useEffect(() => {
    if (!hamburgerMenu && !titleBarContextMenu) return;
    const handleClick = () => {
      setHamburgerMenu(null);
      setHamburgerSubMenu(null);
      setTitleBarContextMenu(null);
    };
    window.addEventListener('click', handleClick);

    return () => window.removeEventListener('click', handleClick);
  }, [hamburgerMenu, titleBarContextMenu]);

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

  useEffect(() => {
    const persistedFiles = files.map((file) => ({
      id: file.id,
      name: file.name,
      content: file.content,
      savedContent: file.savedContent,
      language: file.language,
      sourceSignature: file.sourceSignature,
      needsSaveAs: file.needsSaveAs,
    }));
    const state = {
      files: persistedFiles,
      activeFileId,
    };
    localStorage.setItem(FILE_SESSION_STORAGE_KEY, JSON.stringify(state));
  }, [activeFileId, files]);

  // コンテキストメニュー用のState (fileIdがない場合は余白右クリック)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; fileId?: string } | null>(
    null
  );

  // メニューバー用のState
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // v11: 追加State
  // v12: QuickPickパレット（言語選択）用のState
  const [showLanguagePalette, setShowLanguagePalette] = useState(false);
  const [languageSearch, setLanguageSearch] = useState('');
  const [availableLanguages, setAvailableLanguages] = useState<
    { id: string; aliases?: string[] }[]
  >([]);
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
    onDeny: () => void; // 保存せずに閉じる
    onCancel: () => void; // キャンセル
  } | null>(null);

  // v18: ステータスバー用エディタ情報
  const [cursorPos, setCursorPos] = useState({ line: 1, column: 1 });
  const [selectionCount, setSelectionCount] = useState(0);
  const [eolMode, setEolMode] = useState<'LF' | 'CRLF'>('LF');

  const activeFile = files.find((f) => f.id === activeFileId);
  const hasActiveFile = Boolean(activeFile);
  const canUndo = Boolean(activeFileId && historyStateByFile[activeFileId]?.canUndo);
  const canRedo = Boolean(activeFileId && historyStateByFile[activeFileId]?.canRedo);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);
  useEffect(() => {
    activeFileIdRef.current = activeFileId;
  }, [activeFileId]);
  useEffect(() => {
    if (files.length === 0) {
      if (activeFileId !== '') setActiveFileId('');

      return;
    }
    if (!files.some((f) => f.id === activeFileId)) {
      setActiveFileId(files[0].id);
    }
  }, [activeFileId, files]);

  const isSettingModified = <K extends keyof EditorSettings>(key: K) => {
    return settings[key] !== DEFAULT_SETTINGS[key];
  };

  const resetSettingsToDefault = () => {
    setSettings(DEFAULT_SETTINGS);
    configureMonacoLocale(DEFAULT_SETTINGS.language);
  };

  // === 主要な操作関数 (ホイスティング対策で上部に配置) ===

  const showToast = React.useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  }, []);
  const rememberFileHandle = React.useCallback((handle: any) => {
    if (handle?.name) {
      knownFileHandlesRef.current[handle.name] = handle;
    }
  }, []);

  const updateHistoryAvailability = React.useCallback((fileId: string) => {
    const model = editorRef.current?.getModel() as any;
    const nextCanUndo = Boolean(model?.canUndo?.());
    const nextCanRedo = Boolean(model?.canRedo?.());

    setHistoryStateByFile((prev) => ({
      ...prev,
      [fileId]: {
        canUndo: nextCanUndo,
        canRedo: nextCanRedo,
      },
    }));
  }, []);

  const clearFileHistory = (fileId: string) => {
    setHistoryStateByFile((prev) => {
      const next = { ...prev };
      delete next[fileId];

      return next;
    });
  };

  useEffect(() => {
    if (!activeFileId) return;
    requestAnimationFrame(() => updateHistoryAvailability(activeFileId));
  }, [activeFileId, updateHistoryAvailability]);
  const activateFile = React.useCallback((fileId: string) => {
    setActiveFileId(fileId);
    setIsSettingsOpen(false);
  }, []);

  const setNumericSetting = (
    key: 'fontSize' | 'lineHeight',
    rawValue: number,
    fallback: number,
    min: number,
    max: number
  ) => {
    const nextValue = Number.isFinite(rawValue) ? clamp(rawValue, min, max) : fallback;
    setSettings((prev) =>
      key === 'fontSize' ? { ...prev, fontSize: nextValue } : { ...prev, lineHeight: nextValue }
    );
  };
  const findOpenFileBySignature = React.useCallback((sourceSignature: string) => {
    return (
      filesRef.current.find((openFile) => openFile.sourceSignature === sourceSignature) || null
    );
  }, []);

  const findOpenFileByHandle = React.useCallback(async (targetHandle: any) => {
    for (const openFile of filesRef.current) {
      if (!openFile.handle?.isSameEntry) continue;
      try {
        if (await openFile.handle.isSameEntry(targetHandle)) {
          return openFile;
        }
      } catch {
        // 権限状態により isSameEntry が失敗する場合は同一でないものとして扱う
      }
    }

    return null;
  }, []);

  const findOpenFileByLegacyContent = React.useCallback((name: string, content: string) => {
    return (
      filesRef.current.find(
        (openFile) =>
          openFile.name === name &&
          openFile.savedContent === content &&
          !openFile.handle &&
          !openFile.sourceSignature
      ) || null
    );
  }, []);

  const openFileFromDisk = React.useCallback(async () => {
    try {
      // @ts-expect-error: File System Access API
      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: 'Markdown / Text Files',
            accept: {
              'text/markdown': ['.md'],
              'text/plain': ['.txt'],
            },
          },
        ],
        multiple: false,
      });

      const file = await handle.getFile();
      rememberFileHandle(handle);
      const sourceSignature = getFileSourceSignature(file);
      const sameHandleFile = await findOpenFileByHandle(handle);
      if (sameHandleFile) {
        activateFile(sameHandleFile.id);
        setActiveMenu(null);

        return;
      }
      const sameSignatureFile = findOpenFileBySignature(sourceSignature);
      if (sameSignatureFile) {
        activateFile(sameSignatureFile.id);
        setActiveMenu(null);

        return;
      }

      const content = await file.text();
      const legacyMatchedFile = findOpenFileByLegacyContent(file.name, content);
      if (legacyMatchedFile) {
        activateFile(legacyMatchedFile.id);
        setActiveMenu(null);

        return;
      }
      const newFileId = Date.now().toString();

      const newFile: EditorFile = {
        id: newFileId,
        name: file.name,
        content: content,
        savedContent: content,
        sourceSignature: sourceSignature,
        language: getLanguageFromFilename(file.name),
        handle: handle,
      };

      setFiles((prev) => [...prev, newFile]);
      activateFile(newFileId);
      setActiveMenu(null);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error(err);
        showToast(t('status.errorOpenFile') || 'ファイルの読み込みに失敗しました。');
      }
    }
  }, [
    activateFile,
    findOpenFileByHandle,
    findOpenFileByLegacyContent,
    findOpenFileBySignature,
    showToast,
    rememberFileHandle,
    t,
  ]);

  const openNewFilePalette = () => {
    setNewFileNameInput('');
    setShowNewFilePalette(true);
    setActiveMenu(null);
  };

  const getIsDirty = (file: EditorFile) => {
    if (file.needsSaveAs) return true;

    return file.content !== (file.savedContent ?? file.content) && file.content !== '';
  };

  const handleSave = React.useCallback(async () => {
    if (!activeFile) return;

    try {
      let handle = activeFile.handle;
      if (!handle) {
        const knownHandle = knownFileHandlesRef.current[activeFile.name];
        if (knownHandle) {
          handle = knownHandle;
        }
      }

      // ハンドルがない（新規ファイルなど）場合は保存ダイアログを表示
      if (!handle) {
        try {
          // @ts-expect-error: File System Access API
          handle = await window.showSaveFilePicker({
            suggestedName: activeFile.name,
            types: [
              {
                description: 'Markdown / Text Files',
                accept: {
                  'text/markdown': ['.md'],
                  'text/plain': ['.txt'],
                },
              },
            ],
          });
        } catch (err: any) {
          if (err.name === 'AbortError') return;
          throw err;
        }
      }

      // ファイルの存在確認 & 書き込み
      let fileExists = true;
      try {
        await handle.getFile();
      } catch {
        fileExists = false;
      }

      const writable = await handle.createWritable();
      await writable.write(activeFile.content);
      await writable.close();

      let savedSourceSignature = activeFile.sourceSignature;
      try {
        const savedFile = await handle.getFile();
        savedSourceSignature = getFileSourceSignature(savedFile);
      } catch {
        // 署名取得に失敗した場合は既存の値を維持
      }

      // 状態を更新（ハンドルを保持し、savedContentを更新）
      setFiles((prev) =>
        prev.map((f) =>
          f.id === activeFile.id
            ? {
                ...f,
                savedContent: f.content,
                name: handle.name,
                handle: handle,
                sourceSignature: savedSourceSignature,
                needsSaveAs: false,
              }
            : f
        )
      );

      if (fileExists) {
        showToast(`${handle.name} ${t('status.saved') || 'に保存しました。'}`);
      } else {
        showToast(`${t('status.fileNotFound')} ${handle.name}`);
      }
      rememberFileHandle(handle);
      setActiveMenu(null);
    } catch (err: any) {
      console.error(err);
      showToast(t('status.errorSaveFile') || '保存に失敗しました。');
    }
  }, [activeFile, rememberFileHandle, showToast, t]);

  // handleSaveRef を更新（Monaco Editor の addAction が常に最新の handleSave を参照するため）
  useEffect(() => {
    handleSaveRef.current = handleSave;
  }, [handleSave]);

  const resetChord = () => {
    setIsChordWaiting(false);
    if (chordTimeoutRef.current) {
      clearTimeout(chordTimeoutRef.current);
      chordTimeoutRef.current = null;
    }
  };

  const confirmCreateFile = async () => {
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

    setShowNewFilePalette(false);
    setNewFileNameInput('');

    // ローカルにファイルを作成するための保存ダイアログを表示
    try {
      // @ts-expect-error: File System Access API
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: 'Markdown / Text Files',
            accept: {
              'text/markdown': ['.md'],
              'text/plain': ['.txt'],
            },
          },
        ],
      });

      // 空の内容でローカルファイルを作成
      const writable = await handle.createWritable();
      await writable.write('');
      await writable.close();
      rememberFileHandle(handle);

      const newFileId = Date.now().toString();
      const newFile: EditorFile = {
        id: newFileId,
        name: handle.name,
        content: '',
        savedContent: '',
        language: getLanguageFromFilename(handle.name),
        handle: handle,
      };
      setFiles((prev) => [...prev, newFile]);
      activateFile(newFileId);
      showToast(`${handle.name} ${t('status.created') || 'を作成しました。'}`);
      if (editorRef.current) {
        editorRef.current.focus();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error(err);
        showToast(t('status.errorSaveFile') || 'ファイルの作成に失敗しました。');
      }
    }
  };

  const handleUndo = () => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const undoAction = editor.getAction('undo');
    if (undoAction) {
      void undoAction.run();

      return;
    }
    editor.trigger('App', 'undo', null);
  };

  const handleRedo = () => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const redoAction = editor.getAction('redo');
    if (redoAction) {
      void redoAction.run();

      return;
    }
    editor.trigger('App', 'redo', null);
  };

  const triggerCommandPalette = React.useCallback(() => {
    const editor = editorRef.current;
    if (editor) {
      editor.focus();
      editor.trigger('App', 'editor.action.quickCommand', null);
    }
  }, []);

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
      // F1: コマンドパレットを開く（初期画面などEditor未フォーカス時にも有効）
      if (e.key === 'F1') {
        e.preventDefault();
        triggerCommandPalette();

        return;
      }

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
  }, [isChordWaiting, handleSave, openFileFromDisk, triggerCommandPalette]); // isChordWaiting や handleSave, openFileFromDisk の変化を検知する必要がある

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
      const newWidth = Math.max(
        200,
        Math.min(window.innerWidth - sidebarWidth - 100, startWidth + delta)
      );
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
          line: index + 1, // エディターの行番号は1始まり
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
          end: new RegExp('^\\s*<!--\\s*#endregion\\b.*-->'),
        },
      },
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
      colors: {},
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
      colors: {},
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
        ],
      },
    } as any);
  };

  // === エディターがマウントされたイベントハンドラ ===
  const handleEditorDidMount = (
    editorInstance: editor.IStandaloneCodeEditor,
    monacoInstance: Monaco
  ) => {
    editorRef.current = editorInstance;
    monacoRef.current = monacoInstance;

    // サポートされている言語（MarkdownとPlain Text）のみをフィルタリングして取得
    const langs = monacoInstance.languages.getLanguages();
    let filtered = langs.filter(
      (l: any) =>
        l.id.toLowerCase() === 'markdown' ||
        l.id.toLowerCase() === 'plaintext' ||
        (l.aliases &&
          l.aliases.some(
            (a: string) => a.toLowerCase() === 'markdown' || a.toLowerCase() === 'plain text'
          ))
    );

    // 万が一フィルタリングで何も取得できなかった場合のフォールバック
    if (filtered.length === 0) {
      filtered = [
        { id: 'markdown', aliases: ['Markdown'] },
        { id: 'plaintext', aliases: ['Plain Text'] },
      ] as any;
    }

    setAvailableLanguages(
      filtered.map((l: any) => ({
        id: l.id,
        aliases: (l as any).aliases, // Monaco公式型定義にaliasesがない場合があるため一時的にキャスト
      }))
    );
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
      label: t('cmdPalette.customOpt.changeLangMode'),
      keybindings: [],
      run: function () {
        setShowLanguagePalette(true);
      },
    });

    // コマンドパレットにアクションを追加 (テーマ切り替え)
    editorInstance.addAction({
      id: 'toggle-theme-action',
      label: t('cmdPalette.customOpt.changeTheme'),
      keybindings: [],
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1.5,
      run: function () {
        setTheme((prev: Theme) => (prev === 'dark' ? 'light' : 'dark'));
      },
    });

    // コマンドパレットにアクションを追加 (言語の変更 / Change Language)
    editorInstance.addAction({
      id: 'change-display-language-action',
      label: 'Change Display Language / 言語の変更',
      keybindings: [],
      run: function () {
        setShowLangSwitchPalette(true);
      },
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

    editorInstance.onDidChangeModelContent(() => {
      const fileId = activeFileIdRef.current;
      if (!fileId) return;
      updateHistoryAvailability(fileId);
    });

    editorInstance.onDidChangeModel(() => {
      const fileId = activeFileIdRef.current;
      if (!fileId) return;
      updateHistoryAvailability(fileId);
    });

    // 改行コードの初期取得・設定 (LF固定)
    if (model) {
      model.setEOL(monacoInstance.editor.EndOfLineSequence.LF);
      setEolMode('LF');
    }

    // コマンドパレットにアクションを追加 (プレビュー切り替え)
    editorInstance.addAction({
      id: 'toggle-preview-action',
      label: t('cmdPalette.customOpt.toggleMarkdownPreview'),
      keybindings: [
        monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyMod.Shift | monacoInstance.KeyCode.KeyV,
      ],
      run: function () {
        setShowPreview((prev) => !prev);
      },
    });

    // コマンドパレットにアクションを追加 (新規ファイル作成 Ctrl+N)
    editorInstance.addAction({
      id: 'new-file-palette-action',
      label: t('cmdPalette.customOpt.createNewFile'),
      keybindings: [monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyN],
      run: function () {
        openNewFilePalette();
      },
    });

    // コマンドパレットにアクションを追加 (ファイル保存 Ctrl+S)
    editorInstance.addAction({
      id: 'save-file-action',
      label: t('cmdPalette.customOpt.saveFile'),
      keybindings: [monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS],
      run: function () {
        handleSaveRef.current();
      },
    });

    // カスタムコマンド: 設定を開く
    editorInstance.addAction({
      id: 'open-settings-action',
      label: t('cmdPalette.customOpt.openSettings'),
      keybindings: [monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.US_COMMA],
      run: function () {
        setIsSettingsOpen(true);
        setShowSettingsTab(true);
      },
    });

    // カスタムコマンド: ファイルを開く
    editorInstance.addAction({
      id: 'open-file-action',
      label: t('cmdPalette.customOpt.openFile'),
      keybindings: [monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyO],
      run: function () {
        openFileFromDisk();
      },
    });

    // カスタムコマンド: すべてのファイルを閉じる (初期画面に戻る)
    editorInstance.addAction({
      id: 'close-all-files-action',
      label: t('cmdPalette.customOpt.closeAllFiles'),
      run: function () {
        // 未保存の確認はひとまずすべて破棄するシンプルな強制クローズとして実装
        setFiles([]);
        setActiveFileId('');
        setHistoryStateByFile({});
        setIsSettingsOpen(false);
      },
    });

    // コマンドパレット呼び出し用にフォーカス
    editorInstance.focus();
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined || !activeFileId) return;
    setFiles((prevFiles) =>
      prevFiles.map((file) => (file.id === activeFileId ? { ...file, content: value } : file))
    );
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
    const sourceSignature = getFileSourceSignature(file);
    const existingFile = findOpenFileBySignature(sourceSignature);
    if (existingFile) {
      activateFile(existingFile.id);
      e.target.value = ''; // Reset
      setActiveMenu(null);

      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const legacyMatchedFile = findOpenFileByLegacyContent(file.name, content);
      if (legacyMatchedFile) {
        activateFile(legacyMatchedFile.id);

        return;
      }
      const newFileId = Date.now().toString();
      const newFile: EditorFile = {
        id: newFileId,
        name: file.name,
        content: content,
        savedContent: content,
        sourceSignature: sourceSignature,
        language: getLanguageFromFilename(file.name),
      };
      setFiles((prev) => [...prev, newFile]);
      activateFile(newFileId);
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset
    setActiveMenu(null);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    dragCounter.current = 0;

    const items = e.dataTransfer.items;
    if (!items || items.length === 0) return;

    // 最初の1つだけ処理
    const item = items[0];
    if (item.kind !== 'file') return;

    try {
      // @ts-expect-error: File System Access API
      const handle = await item.getAsFileSystemHandle();
      if (!handle || handle.kind !== 'file') {
        // ハンドルが取得できない場合はフォールバック（従来の挙動）
        const file = e.dataTransfer.files[0];
        if (!file || !isSupportedFile(file)) return;
        readDroppedFile(file);

        return;
      }

      const file = await handle.getFile();
      rememberFileHandle(handle);
      if (!isSupportedFile(file)) {
        showToast('エラー: Markdown(.md)またはテキスト(.txt)ファイルのみサポートされています。');

        return;
      }

      const sourceSignature = getFileSourceSignature(file);
      const sameHandleFile = await findOpenFileByHandle(handle);
      if (sameHandleFile) {
        activateFile(sameHandleFile.id);

        return;
      }
      const sameSignatureFile = findOpenFileBySignature(sourceSignature);
      if (sameSignatureFile) {
        activateFile(sameSignatureFile.id);

        return;
      }

      const content = await file.text();
      const legacyMatchedFile = findOpenFileByLegacyContent(file.name, content);
      if (legacyMatchedFile) {
        activateFile(legacyMatchedFile.id);

        return;
      }
      const newFileId = Date.now().toString();
      const newFile: EditorFile = {
        id: newFileId,
        name: file.name,
        content: content,
        savedContent: content,
        sourceSignature: sourceSignature,
        language: getLanguageFromFilename(file.name),
        handle: handle,
      };
      setFiles((prev) => [...prev, newFile]);
      activateFile(newFileId);
    } catch (err: any) {
      console.error(err);
      // フォールバック
      const file = e.dataTransfer.files[0];
      if (file && isSupportedFile(file)) {
        readDroppedFile(file);
      }
    }
  };

  const readDroppedFile = (file: File) => {
    const sourceSignature = getFileSourceSignature(file);
    const existingFile = findOpenFileBySignature(sourceSignature);
    if (existingFile) {
      activateFile(existingFile.id);

      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const legacyMatchedFile = findOpenFileByLegacyContent(file.name, content);
      if (legacyMatchedFile) {
        activateFile(legacyMatchedFile.id);

        return;
      }
      const newFileId = Date.now().toString();
      const newFile: EditorFile = {
        id: newFileId,
        name: file.name,
        content: content,
        savedContent: content,
        sourceSignature: sourceSignature,
        language: getLanguageFromFilename(file.name),
      };
      setFiles((prev) => [...prev, newFile]);
      activateFile(newFileId);
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

    const fileToClose = files.find((f) => f.id === id);
    if (!fileToClose) return;

    // 未保存の変更がない場合はそのまま閉じる
    if (!getIsDirty(fileToClose)) {
      executeClose(id);

      return;
    }

    // 未保存の変更がある場合のみ確認パレットを表示
    setShowConfirmPalette({
      title: t('confirm.closeTitle') || 'タブを閉じますか？',
      message: `'${fileToClose.name}' ${t('confirm.unsavedMessage') || 'には未保存の変更があります。'}`,
      onConfirm: async () => {
        // 保存して閉じる
        try {
          const handle = fileToClose.handle;
          if (handle) {
            let closeFileExists = true;
            try {
              await handle.getFile();
            } catch {
              closeFileExists = false;
            }

            const writable = await handle.createWritable();
            await writable.write(fileToClose.content);
            await writable.close();

            if (closeFileExists) {
              showToast(`${fileToClose.name} ${t('status.saved')}`);
            } else {
              showToast(`${t('status.fileNotFound')} ${handle.name}`);
            }
          } else {
            handleExport(fileToClose.content);
          }
        } catch (err) {
          console.error(err);
          showToast(t('status.errorSaveFile') || '保存に失敗しました。');
        }
        executeClose(id);
        setShowConfirmPalette(null);
      },
      onDeny: () => {
        // 保存せずに閉じる
        executeClose(id);
        setShowConfirmPalette(null);
      },
      onCancel: () => setShowConfirmPalette(null),
    });
  };

  const executeClose = (id: string) => {
    clearFileHistory(id);
    setFiles((prev) => {
      const newFiles = prev.filter((f) => f.id !== id);

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
      activateFile(contextMenu.fileId);
    }
    setContextMenu(null);
  };

  // メニューの「削除」
  const handleContextDelete = () => {
    if (contextMenu && files.length > 1) {
      if (contextMenu.fileId) {
        clearFileHistory(contextMenu.fileId);
      }
      const newFiles = files.filter((f) => f.id !== contextMenu.fileId);
      setFiles(newFiles);
      if (activeFileId === contextMenu.fileId) {
        setActiveFileId(newFiles[newFiles.length - 1].id);
      }
    }
    setContextMenu(null);
  };

  const insertMarkdown = (
    prefix: string,
    suffix: string,
    defaultText: string,
    insertOnNewLine?: boolean
  ) => {
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
          endColumn: maxCol,
        };
        actualPrefix = `\n\n${prefix}`;
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
      },
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

  const filteredLanguages = useMemo(() => {
    if (!languageSearch.trim()) return availableLanguages;
    const lowerSearch = languageSearch.toLowerCase();

    return availableLanguages.filter(
      (l) =>
        l.id.toLowerCase().includes(lowerSearch) ||
        (l.aliases && l.aliases.some((a) => a.toLowerCase().includes(lowerSearch)))
    );
  }, [availableLanguages, languageSearch]);

  const selectLanguage = (langId: string) => {
    if (activeFileId) {
      setFiles((prev) =>
        prev.map((f) => {
          if (f.id !== activeFileId) return f;

          const targetExt = langId === 'plaintext' ? 'txt' : langId === 'markdown' ? 'md' : null;
          if (!targetExt) {
            return { ...f, language: langId };
          }

          const baseName = f.name.replace(/\.[^.]+$/, '');
          const currentExt = f.name.split('.').pop()?.toLowerCase();
          const shouldRename = currentExt !== targetExt;
          const nextName = `${baseName}.${targetExt}`;

          if (!shouldRename) {
            return { ...f, language: langId };
          }

          const matchedHandle = knownFileHandlesRef.current[nextName];

          return {
            ...f,
            language: langId,
            name: nextName,
            needsSaveAs: !matchedHandle,
            handle: matchedHandle,
            sourceSignature: undefined,
          };
        })
      );
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
    handleUndo();
    setActiveMenu(null);
  };

  const triggerRedo = () => {
    handleRedo();
    setActiveMenu(null);
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

  const applySettings = (nextSettings: EditorSettings) => {
    setSettings(nextSettings);
  };

  const setSettingsLanguage = (lang: 'ja' | 'en') => {
    setSettings({ ...settings, language: lang });
    configureMonacoLocale(lang);
  };

  return (
    <div
      className="app-container"
      style={{
        transform: `scale(${appScale})`,
        transformOrigin: 'top left',
        width: appScale < 1 ? `calc(100vw / ${appScale})` : '100vw',
        height: appScale < 1 ? `calc(100vh / ${appScale})` : '100vh',
        overflow: 'hidden',
      }}
    >
      <TitleBar
        t={t}
        effectiveMenuBarMode={effectiveMenuBarMode}
        isMenuBarVisibleByAlt={isMenuBarVisibleByAlt}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        openNewFilePalette={openNewFilePalette}
        openFileFromDisk={openFileFromDisk}
        hasActiveFile={hasActiveFile}
        handleSave={handleSave}
        triggerUndo={triggerUndo}
        triggerRedo={triggerRedo}
        triggerCommandPalette={triggerCommandPalette}
        showPreview={showPreview}
        setShowPreview={setShowPreview}
        setShowLangSwitchPalette={setShowLangSwitchPalette}
        setIsSettingsOpen={setIsSettingsOpen}
        settings={settings}
        setSettings={applySettings}
        theme={theme}
        toggleTheme={toggleTheme}
        activeFileName={activeFile?.name || 'Markdown Editor'}
        titleBarContextMenu={titleBarContextMenu}
        setTitleBarContextMenu={setTitleBarContextMenu}
        onTitleBarContextMenu={(e) => {
          e.preventDefault();
          setTitleBarContextMenu({ x: e.clientX, y: e.clientY });
        }}
        logoImage={logoImage}
      />

      <QuickPickLayer
        t={t}
        showLanguagePalette={showLanguagePalette}
        setShowLanguagePalette={setShowLanguagePalette}
        languageSearch={languageSearch}
        setLanguageSearch={setLanguageSearch}
        languageInputRef={languageInputRef}
        handleLanguagePaletteKeyDown={handleLanguagePaletteKeyDown}
        filteredLanguages={filteredLanguages}
        activeFileLanguage={activeFile?.language}
        selectLanguage={selectLanguage}
        showNewFilePalette={showNewFilePalette}
        setShowNewFilePalette={setShowNewFilePalette}
        newFileNameInput={newFileNameInput}
        setNewFileNameInput={setNewFileNameInput}
        confirmCreateFile={confirmCreateFile}
        newFileInputRef={newFileInputRef}
        showConfirmPalette={showConfirmPalette}
        showLangSwitchPalette={showLangSwitchPalette}
        setShowLangSwitchPalette={setShowLangSwitchPalette}
        settingsLanguage={settings.language}
        setSettingsLanguage={setSettingsLanguage}
      />

      <main
        className="app-main"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        style={{ position: 'relative' }}
      >
        <SidebarPanel
          t={t}
          effectiveMenuBarMode={effectiveMenuBarMode}
          hamburgerMenu={hamburgerMenu}
          setHamburgerMenu={setHamburgerMenu}
          hamburgerSubMenu={hamburgerSubMenu}
          setHamburgerSubMenu={setHamburgerSubMenu}
          openNewFilePalette={openNewFilePalette}
          openFileFromDisk={openFileFromDisk}
          hasActiveFile={hasActiveFile}
          handleSave={handleSave}
          triggerUndo={triggerUndo}
          triggerRedo={triggerRedo}
          triggerCommandPalette={triggerCommandPalette}
          showPreview={showPreview}
          setShowPreview={setShowPreview}
          setShowLangSwitchPalette={setShowLangSwitchPalette}
          setIsSettingsOpen={setIsSettingsOpen}
          setShowSettingsTab={setShowSettingsTab}
          activeSidebarTab={activeSidebarTab}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          setActiveSidebarTab={setActiveSidebarTab}
          setSidebarWidth={setSidebarWidth}
          sidebarWidth={sidebarWidth}
          files={files}
          activeFileId={activeFileId}
          activateFile={activateFile}
          handleContextMenu={handleContextMenu}
          closeFile={closeFile}
          getIsDirty={getIsDirty}
          outlineItems={outlineItems}
          jumpToLine={jumpToLine}
          setContextMenu={setContextMenu}
          startResizingSidebar={startResizingSidebar}
        />

        <EditorPane
          t={t}
          files={files}
          activeFileId={activeFileId}
          setActiveFileId={setActiveFileId}
          isSettingsOpen={isSettingsOpen}
          setIsSettingsOpen={setIsSettingsOpen}
          showSettingsTab={showSettingsTab}
          setShowSettingsTab={setShowSettingsTab}
          settings={settings}
          setSettings={applySettings}
          isSettingModified={isSettingModified}
          resetSettingsToDefault={resetSettingsToDefault}
          setNumericSetting={setNumericSetting}
          configureMonacoLocale={configureMonacoLocale}
          activeFile={activeFile}
          showPreview={showPreview}
          setShowPreview={setShowPreview}
          insertMarkdown={insertMarkdown}
          handleSave={handleSave}
          handleUndo={handleUndo}
          handleRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          getIsDirty={getIsDirty}
          closeFile={closeFile}
          handleEditorChange={handleEditorChange}
          handleEditorWillMount={handleEditorWillMount}
          handleEditorDidMount={handleEditorDidMount}
          activeTheme={activeTheme}
          startResizingPreview={startResizingPreview}
          previewWidth={previewWidth}
          logoImage={logoImage}
        />

        <OverlayLayer
          t={t}
          isDraggingOver={isDraggingOver}
          contextMenu={contextMenu}
          setContextMenu={setContextMenu}
          filesLength={files.length}
          handleContextOpen={handleContextOpen}
          handleContextDelete={handleContextDelete}
          openNewFilePalette={openNewFilePalette}
          openFileFromDisk={openFileFromDisk}
          fileInputRef={fileInputRef}
          handleFileOpen={handleFileOpen}
          toastMsg={toastMsg}
        />
      </main>

      <StatusBar
        t={t}
        isChordWaiting={isChordWaiting}
        selectionCount={selectionCount}
        cursorPos={cursorPos}
        eolMode={eolMode}
        onGotoLine={() => {
          if (editorRef.current) {
            editorRef.current.focus();
            editorRef.current.trigger('source', 'editor.action.gotoLine', null);
          }
        }}
        toggleEol={toggleEol}
        openLanguagePalette={() => setShowLanguagePalette(true)}
        activeFileLanguage={activeFile?.language}
      />
    </div>
  );
}

export default App;
