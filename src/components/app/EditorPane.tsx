import Editor from '@monaco-editor/react';
import type { Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { Check, ChevronDown, ChevronUp, RotateCcw, Settings, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { remarkAlert } from 'remark-github-blockquote-alert';

import { Toolbar } from '../Toolbar';
import type { EditorFile, EditorSettings } from '../../types';

type ActiveTheme = 'light' | 'dark';

interface EditorPaneProps {
  t: (key: string) => string;
  files: EditorFile[];
  activeFileId: string;
  setActiveFileId: (id: string) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  showSettingsTab: boolean;
  setShowSettingsTab: (show: boolean) => void;
  settings: EditorSettings;
  setSettings: (settings: EditorSettings) => void;
  isSettingModified: <K extends keyof EditorSettings>(key: K) => boolean;
  resetSettingsToDefault: () => void;
  setNumericSetting: (
    key: 'fontSize' | 'lineHeight',
    rawValue: number,
    fallback: number,
    min: number,
    max: number
  ) => void;
  configureMonacoLocale: (lang: 'ja' | 'en') => void;
  activeFile: EditorFile | undefined;
  showPreview: boolean;
  setShowPreview: (show: boolean) => void;
  insertMarkdown: (
    prefix: string,
    suffix: string,
    defaultText: string,
    insertOnNewLine?: boolean
  ) => void;
  handleSave: () => void;
  handleUndo: () => void;
  handleRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  getIsDirty: (file: EditorFile) => boolean;
  closeFile: (e: React.MouseEvent | null, id: string) => void;
  handleEditorChange: (value: string | undefined) => void;
  handleEditorWillMount: (monacoInstance: Monaco) => void;
  handleEditorDidMount: (
    editorInstance: editor.IStandaloneCodeEditor,
    monacoInstance: Monaco
  ) => void;
  activeTheme: ActiveTheme;
  startResizingPreview: (e: React.MouseEvent) => void;
  previewWidth: number;
  logoImage: string;
}

export function EditorPane({
  t,
  files,
  activeFileId,
  setActiveFileId,
  isSettingsOpen,
  setIsSettingsOpen,
  showSettingsTab,
  setShowSettingsTab,
  settings,
  setSettings,
  isSettingModified,
  resetSettingsToDefault,
  setNumericSetting,
  configureMonacoLocale,
  activeFile,
  showPreview,
  setShowPreview,
  insertMarkdown,
  handleSave,
  handleUndo,
  handleRedo,
  canUndo,
  canRedo,
  getIsDirty,
  closeFile,
  handleEditorChange,
  handleEditorWillMount,
  handleEditorDidMount,
  activeTheme,
  startResizingPreview,
  previewWidth,
  logoImage,
}: EditorPaneProps) {
  return (
    <div className="editor-container">
      <div className="tabs-container">
        {files.map((file) => {
          return (
            <div
              key={file.id}
              className={`editor-tab ${!isSettingsOpen && file.id === activeFileId ? 'active' : ''}`}
              onClick={() => {
                setActiveFileId(file.id);
                setIsSettingsOpen(false);
              }}
            >
              <span
                className={`file-codicon ${
                  file.name.endsWith('.md') || file.name.endsWith('.markdown')
                    ? 'codicon codicon-markdown'
                    : file.name.endsWith('.txt')
                      ? 'codicon codicon-file-text'
                      : 'codicon codicon-file'
                }`}
                style={{ fontSize: '14px' }}
                aria-hidden="true"
              />
              <span className="tab-title">{file.name}</span>
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

      {!isSettingsOpen && activeFile && (
        <Toolbar
          onInsertMarkdown={insertMarkdown}
          onSave={handleSave}
          onTogglePreview={() => setShowPreview(!showPreview)}
          showPreview={showPreview}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          isMarkdownMode={activeFile.language !== 'plaintext'}
        />
      )}

      <div
        className={`split-view-container ${showPreview && activeFile ? 'preview-mobile-active' : ''}`}
      >
        {isSettingsOpen ? (
          <div className="settings-tab-content">
            <div className="settings-tab-header">
              <h2 className="settings-tab-title">{t('settings.title')}</h2>
              <button type="button" className="settings-reset-btn" onClick={resetSettingsToDefault}>
                <RotateCcw size={13} />
                <span>{t('settings.resetDefaults')}</span>
              </button>
            </div>
            <div className="settings-content">
              <div className={`setting-row ${isSettingModified('language') ? 'modified' : ''}`}>
                <span className="setting-label">
                  <span className="setting-material-icon" aria-hidden="true">
                    language
                  </span>
                  {t('settings.language')}
                </span>
                <select
                  className="setting-input"
                  style={{ fontFamily: settings.uiFont }}
                  value={settings.language}
                  onChange={(e) => {
                    const newLang = e.target.value as 'ja' | 'en';
                    setSettings({ ...settings, language: newLang });
                    configureMonacoLocale(newLang);
                  }}
                >
                  <option value="ja">{t('langSwitch.ja')}</option>
                  <option value="en">{t('langSwitch.en')}</option>
                </select>
              </div>

              <div
                className={`setting-row ${isSettingModified('menuBarVisibility') ? 'modified' : ''}`}
              >
                <span className="setting-label">
                  <span className="setting-material-icon" aria-hidden="true">
                    menu_open
                  </span>
                  {t('settings.menuBarVisibility')}
                </span>
                <select
                  className="setting-input"
                  style={{ fontFamily: settings.uiFont }}
                  value={settings.menuBarVisibility}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      menuBarVisibility: e.target.value as
                        | 'visible'
                        | 'hidden'
                        | 'compact'
                        | 'toggle',
                    })
                  }
                >
                  <option value="visible">{t('settings.menuBar.visible')}</option>
                  <option value="hidden">{t('settings.menuBar.hidden')}</option>
                  <option value="compact">{t('settings.menuBar.compact')}</option>
                  <option value="toggle">{t('settings.menuBar.toggle')}</option>
                </select>
              </div>

              <div
                className={`setting-row ${isSettingModified('showTabFileName') ? 'modified' : ''}`}
              >
                <span className="setting-label">
                  <span className="setting-material-icon" aria-hidden="true">
                    tab
                  </span>
                  {t('settings.showTabFileName')}
                </span>
                <div
                  className={`toggle-switch ${settings.showTabFileName ? 'active' : ''}`}
                  onClick={() =>
                    setSettings({ ...settings, showTabFileName: !settings.showTabFileName })
                  }
                >
                  <span className="toggle-icon">
                    {settings.showTabFileName ? (
                      <Check size={12} strokeWidth={3} />
                    ) : (
                      <X size={12} strokeWidth={3} />
                    )}
                  </span>
                </div>
              </div>

              <div className={`setting-row ${isSettingModified('fontSize') ? 'modified' : ''}`}>
                <span className="setting-label">
                  <span className="setting-material-icon" aria-hidden="true">
                    format_size
                  </span>
                  {t('settings.fontSize')}
                </span>
                <div className="setting-number-control">
                  <input
                    type="number"
                    className="setting-input setting-number-input"
                    value={settings.fontSize}
                    onChange={(e) =>
                      setNumericSetting('fontSize', Number(e.target.value), 14, 8, 72)
                    }
                    min={8}
                    max={72}
                  />
                  <div className="setting-number-buttons">
                    <button
                      type="button"
                      className="setting-step-btn"
                      onClick={() =>
                        setNumericSetting('fontSize', settings.fontSize + 1, 14, 8, 72)
                      }
                      aria-label="Increase font size"
                    >
                      <ChevronUp size={11} />
                    </button>
                    <button
                      type="button"
                      className="setting-step-btn"
                      onClick={() =>
                        setNumericSetting('fontSize', settings.fontSize - 1, 14, 8, 72)
                      }
                      aria-label="Decrease font size"
                    >
                      <ChevronDown size={11} />
                    </button>
                  </div>
                </div>
              </div>

              <div className={`setting-row ${isSettingModified('lineHeight') ? 'modified' : ''}`}>
                <span className="setting-label">
                  <span className="setting-material-icon" aria-hidden="true">
                    format_line_spacing
                  </span>
                  {t('settings.lineHeight')}
                </span>
                <div className="setting-number-control">
                  <input
                    type="number"
                    className="setting-input setting-number-input"
                    value={settings.lineHeight}
                    onChange={(e) =>
                      setNumericSetting('lineHeight', Number(e.target.value), 24, 12, 100)
                    }
                    min={12}
                    max={100}
                  />
                  <div className="setting-number-buttons">
                    <button
                      type="button"
                      className="setting-step-btn"
                      onClick={() =>
                        setNumericSetting('lineHeight', settings.lineHeight + 1, 24, 12, 100)
                      }
                      aria-label="Increase line height"
                    >
                      <ChevronUp size={11} />
                    </button>
                    <button
                      type="button"
                      className="setting-step-btn"
                      onClick={() =>
                        setNumericSetting('lineHeight', settings.lineHeight - 1, 24, 12, 100)
                      }
                      aria-label="Decrease line height"
                    >
                      <ChevronDown size={11} />
                    </button>
                  </div>
                </div>
              </div>

              <div className={`setting-row ${isSettingModified('minimap') ? 'modified' : ''}`}>
                <span className="setting-label">
                  <span className="setting-material-icon" aria-hidden="true">
                    picture_in_picture_alt
                  </span>
                  {t('settings.minimap')}
                </span>
                <div
                  className={`toggle-switch ${settings.minimap ? 'active' : ''}`}
                  onClick={() => setSettings({ ...settings, minimap: !settings.minimap })}
                >
                  <span className="toggle-icon">
                    {settings.minimap ? (
                      <Check size={12} strokeWidth={3} />
                    ) : (
                      <X size={12} strokeWidth={3} />
                    )}
                  </span>
                </div>
              </div>

              <div
                className={`setting-row ${isSettingModified('showCommandBar') ? 'modified' : ''}`}
              >
                <span className="setting-label">
                  <span className="setting-material-icon" aria-hidden="true">
                    search
                  </span>
                  {t('settings.showCommandBar')}
                </span>
                <div
                  className={`toggle-switch ${settings.showCommandBar ? 'active' : ''}`}
                  onClick={() =>
                    setSettings({ ...settings, showCommandBar: !settings.showCommandBar })
                  }
                >
                  <span className="toggle-icon">
                    {settings.showCommandBar ? (
                      <Check size={12} strokeWidth={3} />
                    ) : (
                      <X size={12} strokeWidth={3} />
                    )}
                  </span>
                </div>
              </div>

              <div className={`setting-row ${isSettingModified('wordWrap') ? 'modified' : ''}`}>
                <span className="setting-label">
                  <span className="setting-material-icon" aria-hidden="true">
                    wrap_text
                  </span>
                  {t('settings.wordWrap')}
                </span>
                <div
                  className={`toggle-switch ${settings.wordWrap === 'on' ? 'active' : ''}`}
                  onClick={() =>
                    setSettings({
                      ...settings,
                      wordWrap: settings.wordWrap === 'on' ? 'off' : 'on',
                    })
                  }
                >
                  <span className="toggle-icon">
                    {settings.wordWrap === 'on' ? (
                      <Check size={12} strokeWidth={3} />
                    ) : (
                      <X size={12} strokeWidth={3} />
                    )}
                  </span>
                </div>
              </div>

              <div className={`setting-row ${isSettingModified('uiFont') ? 'modified' : ''}`}>
                <span className="setting-label">
                  <span className="setting-material-icon" aria-hidden="true">
                    text_fields
                  </span>
                  {t('settings.uiFont')}
                </span>
                <select
                  className="setting-input"
                  style={{ width: '260px', fontFamily: settings.uiFont }}
                  value={settings.uiFont}
                  onChange={(e) => setSettings({ ...settings, uiFont: e.target.value })}
                >
                  <option value="consolas, 'Courier New', monospace">Consolas</option>
                  <option value="'Inter', 'Noto Sans JP', sans-serif">Inter & Noto Sans JP</option>
                  <option value="'Roboto', 'M PLUS 1p', sans-serif">Roboto & M PLUS 1p</option>
                  <option value="'Roboto', 'LINE Seed JP', sans-serif">
                    Roboto & LINE Seed JP
                  </option>
                  <option value="'Google Sans', 'Noto Sans JP', sans-serif">
                    Google Sans & Noto Sans JP
                  </option>
                  <option value="'Google Sans Code', 'BIZ UDGothic', sans-serif">
                    Google Sans Code & BIZ UD
                  </option>
                  <option value="'Source Code Pro', monospace">Source Code Pro</option>
                  {settings.language === 'en' && (
                    <>
                      <option value="'Inter', sans-serif, monospace">Inter (EN)</option>
                      <option value="'Roboto', sans-serif, monospace">Roboto (EN)</option>
                    </>
                  )}
                </select>
              </div>

              <div className={`setting-row ${isSettingModified('editorFont') ? 'modified' : ''}`}>
                <span className="setting-label">
                  <span className="setting-material-icon" aria-hidden="true">
                    code
                  </span>
                  {t('settings.editorFont')}
                </span>
                <select
                  className="setting-input"
                  style={{ width: '260px', fontFamily: settings.uiFont }}
                  value={settings.editorFont}
                  onChange={(e) => setSettings({ ...settings, editorFont: e.target.value })}
                >
                  <option value="consolas, 'Courier New', monospace">Consolas</option>
                  <option value="'Fira Code', 'Noto Sans JP', monospace">
                    Fira Code & Noto Sans
                  </option>
                  <option value="'JetBrains Mono', 'Noto Sans JP', monospace">
                    JetBrains Mono & Noto Sans
                  </option>
                  <option value="'Roboto Mono', 'BIZ UDGothic', monospace">
                    Roboto Mono & BIZ UD
                  </option>
                  <option value="'Google Sans Code', 'Noto Sans JP', monospace">
                    Google Sans Code & Noto Sans JP
                  </option>
                  <option value="'JetBrains Mono', 'BIZ UDGothic', monospace">
                    JetBrains Mono & BIZ UD
                  </option>
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
          <>
            <div className="editor-pane">
              <div className="monaco-wrapper">
                <Editor
                  height="100%"
                  defaultLanguage="markdown"
                  path={activeFile ? activeFile.id : '__empty__'}
                  language={activeFile ? activeFile.language || 'markdown' : 'plaintext'}
                  theme={activeTheme === 'dark' ? 'vscode-markdown-dark' : 'vscode-markdown-light'}
                  value={activeFile ? activeFile.content : ''}
                  onChange={handleEditorChange}
                  beforeMount={handleEditorWillMount}
                  onMount={handleEditorDidMount}
                  options={{
                    readOnly: !activeFile,
                    minimap: { enabled: settings.minimap },
                    wordWrap: settings.wordWrap,
                    fontSize: settings.fontSize,
                    lineHeight: settings.lineHeight,
                    padding: { top: 16, bottom: 16 },
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                    cursorBlinking: 'smooth',
                    fontFamily: settings.editorFont,
                    autoClosingQuotes: 'always',
                    autoClosingBrackets: 'always',
                    autoClosingOvertype: 'always',
                    autoSurround: 'languageDefined',
                  }}
                />
                {!activeFile && (
                  <div
                    className="empty-state-view"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 10,
                      backgroundColor: 'var(--editor-bg)',
                    }}
                  >
                    <div className="empty-state-logo">
                      <img src={logoImage} alt="App Logo" />
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
                <div
                  className="resizer-x"
                  onMouseDown={startResizingPreview}
                  title={t('resizer.tooltip')}
                />
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
                      },
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
  );
}
