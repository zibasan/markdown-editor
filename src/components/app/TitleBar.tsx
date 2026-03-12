import { Check, Monitor, Moon, Search, Sun } from 'lucide-react';

import type { EditorSettings } from '../../types';

type Theme = 'system' | 'light' | 'dark';

interface TitleBarProps {
  t: (key: string) => string;
  effectiveMenuBarMode: 'visible' | 'hidden' | 'compact' | 'toggle';
  isMenuBarVisibleByAlt: boolean;
  activeMenu: string | null;
  setActiveMenu: (menu: string | null) => void;
  openNewFilePalette: () => void;
  openFileFromDisk: () => void;
  hasActiveFile: boolean;
  handleSave: () => void;
  triggerUndo: () => void;
  triggerRedo: () => void;
  triggerCommandPalette: () => void;
  showPreview: boolean;
  setShowPreview: (show: boolean) => void;
  setShowLangSwitchPalette: (show: boolean) => void;
  setIsSettingsOpen: (open: boolean) => void;
  settings: EditorSettings;
  setSettings: (settings: EditorSettings) => void;
  theme: Theme;
  toggleTheme: () => void;
  activeFileName: string;
  titleBarContextMenu: { x: number; y: number } | null;
  setTitleBarContextMenu: (menu: { x: number; y: number } | null) => void;
  onTitleBarContextMenu: (e: React.MouseEvent<HTMLElement>) => void;
  logoImage: string;
}

export function TitleBar({
  t,
  effectiveMenuBarMode,
  isMenuBarVisibleByAlt,
  activeMenu,
  setActiveMenu,
  openNewFilePalette,
  openFileFromDisk,
  hasActiveFile,
  handleSave,
  triggerUndo,
  triggerRedo,
  triggerCommandPalette,
  showPreview,
  setShowPreview,
  setShowLangSwitchPalette,
  setIsSettingsOpen,
  settings,
  setSettings,
  theme,
  toggleTheme,
  activeFileName,
  titleBarContextMenu,
  setTitleBarContextMenu,
  onTitleBarContextMenu,
  logoImage,
}: TitleBarProps) {
  // 【追加】Electron環境（デスクトップアプリ）かどうかを判定
  const isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined;
  // eslint-disable-next-line no-console
  console.log('★Electron環境ですか？:', isElectron, window.electronAPI);

  return (
    <>
      <header
        className={`app-titlebar ${isElectron ? 'is-electron' : ''}`}
        onContextMenu={onTitleBarContextMenu}
      >
        <div className="titlebar-section">
          <div style={{ padding: '0 8px', display: 'flex' }}>
            <img src={logoImage} alt="App Icon" style={{ width: 16, height: 16 }} />
          </div>

          {(effectiveMenuBarMode === 'visible' ||
            (effectiveMenuBarMode === 'toggle' && isMenuBarVisibleByAlt)) && (
            <div className="menu-bar">
              <div
                className={`menu-item ${activeMenu === 'file' ? 'active' : ''}`}
                onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
                onMouseEnter={() => activeMenu && setActiveMenu('file')}
              >
                {t('menu.file')}
                {activeMenu === 'file' && (
                  <div className="menu-dropdown">
                    <div
                      className="menu-dropdown-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        openNewFilePalette();
                        setActiveMenu(null);
                      }}
                    >
                      <span>{t('menu.file.new')}</span>
                      <span className="menu-dropdown-shortcut">Ctrl+K, N</span>
                    </div>
                    <div
                      className="menu-dropdown-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        openFileFromDisk();
                        setActiveMenu(null);
                      }}
                    >
                      <span>{t('menu.file.open')}</span>
                      <span className="menu-dropdown-shortcut">Ctrl+O</span>
                    </div>
                    <div className="menu-dropdown-separator"></div>
                    <div
                      className={`menu-dropdown-item ${!hasActiveFile ? 'disabled' : ''}`}
                      onClick={(e) => {
                        if (!hasActiveFile) return;
                        e.stopPropagation();
                        handleSave();
                      }}
                    >
                      <span>{t('menu.file.save')}</span>
                      <span className="menu-dropdown-shortcut">Ctrl+S</span>
                    </div>
                  </div>
                )}
              </div>

              <div
                className={`menu-item ${activeMenu === 'edit' ? 'active' : ''}`}
                onClick={() => setActiveMenu(activeMenu === 'edit' ? null : 'edit')}
                onMouseEnter={() => activeMenu && setActiveMenu('edit')}
              >
                {t('menu.edit')}
                {activeMenu === 'edit' && (
                  <div className="menu-dropdown">
                    <div
                      className={`menu-dropdown-item ${!hasActiveFile ? 'disabled' : ''}`}
                      onClick={(e) => {
                        if (!hasActiveFile) return;
                        e.stopPropagation();
                        triggerUndo();
                      }}
                    >
                      <span>{t('menu.edit.undo')}</span>
                      <span className="menu-dropdown-shortcut">Ctrl+Z</span>
                    </div>
                    <div
                      className={`menu-dropdown-item ${!hasActiveFile ? 'disabled' : ''}`}
                      onClick={(e) => {
                        if (!hasActiveFile) return;
                        e.stopPropagation();
                        triggerRedo();
                      }}
                    >
                      <span>{t('menu.edit.redo')}</span>
                      <span className="menu-dropdown-shortcut">Ctrl+Y</span>
                    </div>
                  </div>
                )}
              </div>

              <div
                className={`menu-item ${activeMenu === 'view' ? 'active' : ''}`}
                onClick={() => setActiveMenu(activeMenu === 'view' ? null : 'view')}
                onMouseEnter={() => activeMenu && setActiveMenu('view')}
              >
                {t('menu.view')}
                {activeMenu === 'view' && (
                  <div className="menu-dropdown">
                    <div
                      className="menu-dropdown-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerCommandPalette();
                        setActiveMenu(null);
                      }}
                    >
                      <span>{t('menu.view.commandPalette')}</span>
                      <span className="menu-dropdown-shortcut">F1</span>
                    </div>
                    <div className="menu-dropdown-separator"></div>
                    <div
                      className={`menu-dropdown-item ${!hasActiveFile ? 'disabled' : ''}`}
                      onClick={(e) => {
                        if (!hasActiveFile) return;
                        e.stopPropagation();
                        setShowPreview(!showPreview);
                        setActiveMenu(null);
                      }}
                    >
                      <span>
                        {showPreview ? t('menu.view.previewClose') : t('menu.view.previewOpen')}
                      </span>
                      <span className="menu-dropdown-shortcut">Ctrl+Shift+V</span>
                    </div>
                    <div className="menu-dropdown-separator"></div>
                    <div
                      className={`menu-dropdown-item ${!hasActiveFile ? 'disabled' : ''}`}
                      onClick={(e) => {
                        if (!hasActiveFile) return;
                        e.stopPropagation();
                        setShowLangSwitchPalette(true);
                        setActiveMenu(null);
                      }}
                    >
                      <span>{t('menu.view.language')}</span>
                    </div>
                    <div className="menu-dropdown-separator"></div>
                    <div
                      className="menu-dropdown-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSettingsOpen(true);
                        setActiveMenu(null);
                      }}
                    >
                      <span>{t('menu.view.settings')}</span>
                      <span className="menu-dropdown-shortcut">Ctrl+,</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="titlebar-section titlebar-center">
          {settings.showCommandBar ? (
            <button
              className="command-palette-trigger"
              onClick={triggerCommandPalette}
              data-tooltip={t('titlebar.commandPaletteTooltip')}
            >
              <Search size={14} />
              <span>{t('titlebar.searchPlaceholder')}</span>
            </button>
          ) : (
            <div className="titlebar-center-title">{activeFileName || 'Markdown Editor'}</div>
          )}
        </div>

        {/* 【修正】右側セクション（テーマ切り替え + ウィンドウコントロール） */}
        <div className="titlebar-section titlebar-right">
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            data-tooltip-left={`${t('titlebar.themeToggle')} (${theme})`}
          >
            {theme === 'system' ? (
              <Monitor size={16} />
            ) : theme === 'light' ? (
              <Sun size={16} />
            ) : (
              <Moon size={16} />
            )}
          </button>
        </div>
      </header>

      {titleBarContextMenu && (
        <div
          className="context-menu"
          style={{
            position: 'fixed',
            top: titleBarContextMenu.y,
            left: titleBarContextMenu.x,
            zIndex: 10001,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="context-menu-item"
            onClick={() => {
              setSettings({ ...settings, showCommandBar: !settings.showCommandBar });
              setTitleBarContextMenu(null);
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {settings.showCommandBar ? <Check size={14} /> : <div style={{ width: 14 }} />}
              <span>{t('settings.showCommandBar')}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
