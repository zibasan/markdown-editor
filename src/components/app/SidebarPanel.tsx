import { FolderOpen, Plus, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { remarkAlert } from 'remark-github-blockquote-alert';

import type { EditorFile, OutlineItem } from '../../types';

type SidebarTab = 'explorer' | 'outline' | 'docs';
type RecentFileEntry = { path: string; name: string };

const renderFileTypeIcon = (filename: string, size = 14) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const iconClass =
    ext === 'md' || ext === 'markdown'
      ? 'codicon codicon-markdown'
      : ext === 'txt'
        ? 'codicon codicon-file-text'
        : 'codicon codicon-file';

  return (
    <span
      className={`file-codicon ${iconClass}`}
      style={{ fontSize: `${size}px` }}
      aria-hidden="true"
    />
  );
};

interface SidebarPanelProps {
  t: (key: string) => string;
  effectiveMenuBarMode: 'visible' | 'hidden' | 'compact' | 'toggle';
  hamburgerMenu: { x: number; y: number } | null;
  setHamburgerMenu: (value: { x: number; y: number } | null) => void;
  hamburgerSubMenu: string | null;
  setHamburgerSubMenu: (value: string | null) => void;
  openNewFilePalette: () => void;
  openFileFromDisk: () => void;
  openFolderFromDisk: () => void;
  createFolderFromDisk: () => void;
  openRecentFile: (filePath: string) => void;
  recentFiles: RecentFileEntry[];
  isElectron: boolean;
  hasActiveFile: boolean;
  handleSave: () => void;
  triggerUndo: () => void;
  triggerRedo: () => void;
  triggerCommandPalette: () => void;
  showPreview: boolean;
  setShowPreview: (show: boolean) => void;
  setShowLangSwitchPalette: (show: boolean) => void;
  setIsSettingsOpen: (show: boolean) => void;
  setShowSettingsTab: (show: boolean) => void;
  registerFileAssociation: () => void;
  unregisterFileAssociation: () => void;
  showAboutDialog: () => void;
  activeSidebarTab: SidebarTab;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (show: boolean) => void;
  setActiveSidebarTab: (tab: SidebarTab) => void;
  setSidebarWidth: (value: number | ((prev: number) => number)) => void;
  sidebarWidth: number;
  openedFolderPath: string | null;
  files: EditorFile[];
  activeFileId: string;
  activateFile: (id: string) => void;
  handleContextMenu: (e: React.MouseEvent, fileId: string) => void;
  closeFile: (e: React.MouseEvent | null, id: string) => void;
  getIsDirty: (file: EditorFile) => boolean;
  outlineItems: OutlineItem[];
  jumpToLine: (line: number) => void;
  setContextMenu: (menu: { x: number; y: number; fileId?: string } | null) => void;
  startResizingSidebar: (e: React.MouseEvent) => void;
}

export function SidebarPanel({
  t,
  effectiveMenuBarMode,
  hamburgerMenu,
  setHamburgerMenu,
  hamburgerSubMenu,
  setHamburgerSubMenu,
  openNewFilePalette,
  openFileFromDisk,
  openFolderFromDisk,
  createFolderFromDisk,
  openRecentFile,
  recentFiles,
  isElectron,
  hasActiveFile,
  handleSave,
  triggerUndo,
  triggerRedo,
  triggerCommandPalette,
  showPreview,
  setShowPreview,
  setShowLangSwitchPalette,
  setIsSettingsOpen,
  setShowSettingsTab,
  registerFileAssociation,
  unregisterFileAssociation,
  showAboutDialog,
  activeSidebarTab,
  isSidebarOpen,
  setIsSidebarOpen,
  setActiveSidebarTab,
  setSidebarWidth,
  sidebarWidth,
  openedFolderPath,
  files,
  activeFileId,
  activateFile,
  handleContextMenu,
  closeFile,
  getIsDirty,
  outlineItems,
  jumpToLine,
  setContextMenu,
  startResizingSidebar,
}: SidebarPanelProps) {
  return (
    <>
      <div className="activity-bar">
        {effectiveMenuBarMode === 'compact' && (
          <div style={{ position: 'relative' }}>
            <div
              className="activity-icon"
              data-tooltip-right={t('menu.compact.tooltip')}
              onClick={(e) => {
                e.stopPropagation();
                if (hamburgerMenu) {
                  setHamburgerMenu(null);
                  setHamburgerSubMenu(null);
                } else {
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  setHamburgerMenu({ x: rect.right + 2, y: rect.top });
                }
              }}
            >
              <span className="activity-material-icon" aria-hidden="true">
                menu
              </span>
            </div>
            {hamburgerMenu && (
              <div
                className="context-menu hamburger-context-menu"
                style={{ top: 0, left: '100%', marginLeft: '2px' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className={`context-menu-item has-submenu ${hamburgerSubMenu === 'file' ? 'active' : ''}`}
                  onMouseEnter={() => setHamburgerSubMenu('file')}
                  onClick={() => setHamburgerSubMenu(hamburgerSubMenu === 'file' ? null : 'file')}
                >
                  <span>{t('menu.file')}</span>
                </div>
                {hamburgerSubMenu === 'file' && (
                  <div className="hamburger-sub-menu" style={{ top: 0 }}>
                    <div
                      className="context-menu-item"
                      onClick={() => {
                        openNewFilePalette();
                        setHamburgerMenu(null);
                      }}
                    >
                      <span>{t('menu.file.new')}</span>
                      <span style={{ opacity: 0.5, marginLeft: 'auto', fontSize: '11px' }}>
                        Ctrl+K, N
                      </span>
                    </div>
                    <div
                      className="context-menu-item"
                      onClick={() => {
                        openFileFromDisk();
                        setHamburgerMenu(null);
                      }}
                    >
                      <span>{t('menu.file.open')}</span>
                      <span style={{ opacity: 0.5, marginLeft: 'auto', fontSize: '11px' }}>
                        Ctrl+O
                      </span>
                    </div>
                    {isElectron && (
                      <div
                        className="context-menu-item"
                        onClick={() => {
                          openFolderFromDisk();
                          setHamburgerMenu(null);
                        }}
                      >
                        <span>{t('menu.file.openFolder')}</span>
                      </div>
                    )}
                    <div className="context-menu-separator" />
                    <div
                      className={`context-menu-item ${!hasActiveFile ? 'disabled' : ''}`}
                      onClick={
                        hasActiveFile
                          ? () => {
                              handleSave();
                              setHamburgerMenu(null);
                            }
                          : undefined
                      }
                    >
                      <span>{t('menu.file.save')}</span>
                      <span style={{ opacity: 0.5, marginLeft: 'auto', fontSize: '11px' }}>
                        Ctrl+S
                      </span>
                    </div>
                    {isElectron && (
                      <>
                        <div className="context-menu-separator" />
                        <div className="context-menu-item has-submenu">
                          <span>{t('menu.file.recent')}</span>
                          <span style={{ opacity: 0.5, marginLeft: 'auto', fontSize: '11px' }}>
                            ▶
                          </span>
                          <div className="context-menu-submenu">
                            {recentFiles.length === 0 ? (
                              <div className="context-menu-item disabled">
                                <span>{t('menu.file.recent.empty')}</span>
                              </div>
                            ) : (
                              recentFiles.map((entry) => (
                                <div
                                  key={entry.path}
                                  className="context-menu-item recent-file-item"
                                  onClick={() => {
                                    openRecentFile(entry.path);
                                    setHamburgerMenu(null);
                                  }}
                                  title={entry.path}
                                >
                                  <div className="recent-file-label">
                                    <span className="recent-file-name">{entry.name}</span>
                                    <span className="recent-file-path">{entry.path}</span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div
                  className={`context-menu-item has-submenu ${hamburgerSubMenu === 'edit' ? 'active' : ''}`}
                  onMouseEnter={() => setHamburgerSubMenu('edit')}
                  onClick={() => setHamburgerSubMenu(hamburgerSubMenu === 'edit' ? null : 'edit')}
                >
                  <span>{t('menu.edit')}</span>
                </div>
                {hamburgerSubMenu === 'edit' && (
                  <div className="hamburger-sub-menu" style={{ top: '30px' }}>
                    <div
                      className={`context-menu-item ${!hasActiveFile ? 'disabled' : ''}`}
                      onClick={
                        hasActiveFile
                          ? () => {
                              triggerUndo();
                              setHamburgerMenu(null);
                            }
                          : undefined
                      }
                    >
                      <span>{t('menu.edit.undo')}</span>
                      <span style={{ opacity: 0.5, marginLeft: 'auto', fontSize: '11px' }}>
                        Ctrl+Z
                      </span>
                    </div>
                    <div
                      className={`context-menu-item ${!hasActiveFile ? 'disabled' : ''}`}
                      onClick={
                        hasActiveFile
                          ? () => {
                              triggerRedo();
                              setHamburgerMenu(null);
                            }
                          : undefined
                      }
                    >
                      <span>{t('menu.edit.redo')}</span>
                      <span style={{ opacity: 0.5, marginLeft: 'auto', fontSize: '11px' }}>
                        Ctrl+Y
                      </span>
                    </div>
                  </div>
                )}

                <div
                  className={`context-menu-item has-submenu ${hamburgerSubMenu === 'view' ? 'active' : ''}`}
                  onMouseEnter={() => setHamburgerSubMenu('view')}
                  onClick={() => setHamburgerSubMenu(hamburgerSubMenu === 'view' ? null : 'view')}
                >
                  <span>{t('menu.view')}</span>
                </div>
                {hamburgerSubMenu === 'view' && (
                  <div className="hamburger-sub-menu" style={{ top: '60px' }}>
                    <div
                      className="context-menu-item"
                      onClick={() => {
                        triggerCommandPalette();
                        setHamburgerMenu(null);
                      }}
                    >
                      <span>{t('menu.view.commandPalette')}</span>
                      <span style={{ opacity: 0.5, marginLeft: 'auto', fontSize: '11px' }}>F1</span>
                    </div>
                    <div className="context-menu-separator" />
                    <div
                      className={`context-menu-item ${!hasActiveFile ? 'disabled' : ''}`}
                      onClick={
                        hasActiveFile
                          ? () => {
                              setShowPreview(!showPreview);
                              setHamburgerMenu(null);
                            }
                          : undefined
                      }
                    >
                      <span>
                        {showPreview ? t('menu.view.previewClose') : t('menu.view.previewOpen')}
                      </span>
                    </div>
                    <div
                      className={`context-menu-item ${!hasActiveFile ? 'disabled' : ''}`}
                      onClick={
                        hasActiveFile
                          ? () => {
                              setShowLangSwitchPalette(true);
                              setHamburgerMenu(null);
                            }
                          : undefined
                      }
                    >
                      <span>{t('menu.view.language')}</span>
                    </div>
                    <div
                      className="context-menu-item"
                      onClick={() => {
                        setIsSettingsOpen(true);
                        setShowSettingsTab(true);
                        setHamburgerMenu(null);
                      }}
                    >
                      <span>{t('menu.view.settings')}</span>
                      <span style={{ opacity: 0.5, marginLeft: 'auto', fontSize: '11px' }}>
                        Ctrl+,
                      </span>
                    </div>
                  </div>
                )}

                {isElectron && (
                  <>
                    <div
                      className={`context-menu-item has-submenu ${hamburgerSubMenu === 'help' ? 'active' : ''}`}
                      onMouseEnter={() => setHamburgerSubMenu('help')}
                      onClick={() =>
                        setHamburgerSubMenu(hamburgerSubMenu === 'help' ? null : 'help')
                      }
                    >
                      <span>{t('menu.help')}</span>
                    </div>
                    {hamburgerSubMenu === 'help' && (
                      <div className="hamburger-sub-menu" style={{ top: '90px' }}>
                        <div
                          className="context-menu-item"
                          onClick={() => {
                            showAboutDialog();
                            setHamburgerMenu(null);
                          }}
                        >
                          <span>{t('menu.help.about')}</span>
                        </div>
                        <div className="context-menu-item has-submenu">
                          <span>{t('menu.help.association')}</span>
                          <div className="context-menu-submenu">
                            <div
                              className="context-menu-item"
                              onClick={() => {
                                registerFileAssociation();
                                setHamburgerMenu(null);
                              }}
                            >
                              <span>{t('menu.help.association.register')}</span>
                            </div>
                            <div
                              className="context-menu-item"
                              onClick={() => {
                                unregisterFileAssociation();
                                setHamburgerMenu(null);
                              }}
                            >
                              <span>{t('menu.help.association.unregister')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <div
          className={`activity-icon ${activeSidebarTab === 'explorer' && isSidebarOpen ? 'active' : ''}`}
          data-tooltip-right={t('activity.explorer')}
          onClick={() => {
            if (activeSidebarTab === 'explorer') setIsSidebarOpen(!isSidebarOpen);
            else {
              setActiveSidebarTab('explorer');
              setIsSidebarOpen(true);
            }
          }}
        >
          <span className="activity-material-icon" aria-hidden="true">
            folder
          </span>
        </div>

        <div
          className={`activity-icon ${activeSidebarTab === 'outline' && isSidebarOpen ? 'active' : ''}`}
          data-tooltip-right={t('activity.outline')}
          onClick={() => {
            if (activeSidebarTab === 'outline') setIsSidebarOpen(!isSidebarOpen);
            else {
              setActiveSidebarTab('outline');
              setIsSidebarOpen(true);
            }
          }}
        >
          <span className="activity-material-icon" aria-hidden="true">
            format_list_bulleted
          </span>
        </div>

        <div
          className={`activity-icon ${activeSidebarTab === 'docs' && isSidebarOpen ? 'active' : ''}`}
          data-tooltip-right={t('activity.docs')}
          onClick={() => {
            if (activeSidebarTab === 'docs') setIsSidebarOpen(!isSidebarOpen);
            else {
              setActiveSidebarTab('docs');
              setIsSidebarOpen(true);
              setSidebarWidth((prev) => Math.max(prev, 360));
            }
          }}
        >
          <span className="activity-material-icon" aria-hidden="true">
            menu_book
          </span>
        </div>

        <div style={{ flex: 1 }}></div>

        <div
          className="activity-icon"
          data-tooltip-right={t('activity.settings')}
          onClick={() => {
            setIsSettingsOpen(true);
            setShowSettingsTab(true);
          }}
        >
          <span className="activity-material-icon" aria-hidden="true">
            settings
          </span>
        </div>
      </div>

      <div
        className={`side-bar ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}
        style={{ width: isSidebarOpen ? sidebarWidth : 0 }}
      >
        <div className="side-bar-header">
          {activeSidebarTab === 'explorer' ? (
            <div className="sidebar-header">
              <h3>{t('sidebar.explorer')}</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="sidebar-action-btn"
                  onClick={openNewFilePalette}
                  data-tooltip={t('sidebar.newFile')}
                >
                  <Plus size={16} />
                </button>
                <button
                  className="sidebar-action-btn"
                  onClick={openFileFromDisk}
                  data-tooltip={t('sidebar.openFile')}
                >
                  <FolderOpen size={16} />
                </button>
              </div>
            </div>
          ) : activeSidebarTab === 'outline' ? (
            <span
              style={{
                padding: '10px 15px',
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                opacity: 0.8,
              }}
            >
              {t('sidebar.outline')}
            </span>
          ) : (
            <span
              style={{
                padding: '10px 15px',
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                opacity: 0.8,
              }}
            >
              MARKDOWN DOCS
            </span>
          )}
        </div>

        <div
          className="side-bar-content"
          style={{ padding: 0, overflowY: 'auto', flex: 1 }}
          onContextMenu={(e) => {
            if (activeSidebarTab === 'explorer') {
              e.preventDefault();
              setContextMenu({ x: e.clientX, y: e.clientY });
            }
          }}
        >
          {activeSidebarTab === 'explorer' ? (
            files.length === 0 && !openedFolderPath ? (
              <div className="explorer-empty">
                <div className="explorer-empty-title">{t('sidebar.empty')}</div>
                <div className="explorer-empty-actions">
                  <button className="explorer-empty-btn" onClick={openNewFilePalette}>
                    {t('sidebar.empty.createFile')}
                  </button>
                  <button className="explorer-empty-btn" onClick={openFileFromDisk}>
                    {t('sidebar.empty.openFile')}
                  </button>
                  {isElectron && (
                    <button className="explorer-empty-btn" onClick={createFolderFromDisk}>
                      {t('sidebar.empty.createFolder')}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <ul className="explorer-list">
                {files.map((file) => (
                  <li
                    key={file.id}
                    className={`explorer-item ${activeFileId === file.id ? 'active' : ''}`}
                    onClick={() => activateFile(file.id)}
                    onContextMenu={(e) => handleContextMenu(e, file.id)}
                  >
                    {renderFileTypeIcon(file.name)}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: '13px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                        }}
                      >
                        {file.name}
                      </span>
                      {getIsDirty(file) && <span className="dirty-marker">*</span>}
                    </div>
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
            )
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
                <div
                  style={{
                    padding: '10px 20px',
                    fontSize: '12px',
                    color: 'var(--activity-icon)',
                  }}
                >
                  {t('sidebar.noHeadings')}
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                padding: '12px',
                fontSize: '13px',
                lineHeight: 1.6,
                color: 'var(--text-color)',
              }}
            >
              <p style={{ marginBottom: '16px', fontSize: '12px', opacity: 0.8 }}>
                {t('docs.intro')}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div
                  className="docs-item"
                  style={{ borderBottom: '1px solid var(--sidebar-border)', paddingBottom: '12px' }}
                >
                  <div
                    style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--accent-color)' }}
                  >
                    {t('docs.headings')}
                  </div>
                  <code
                    style={{
                      display: 'block',
                      padding: '4px 8px',
                      background: 'var(--input-bg)',
                      borderRadius: '4px',
                      marginBottom: '8px',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    # Heading 1<br />
                    ## Heading 2<br />
                    ### Heading 3
                  </code>
                  <div
                    className="preview-pane docs-preview"
                    style={{
                      padding: '8px',
                      border: '1px solid var(--toolbar-border)',
                      borderRadius: '4px',
                      background: 'var(--editor-bg)',
                    }}
                  >
                    <h1>Heading 1</h1>
                    <h2>Heading 2</h2>
                    <h3>Heading 3</h3>
                  </div>
                </div>
                <div
                  className="docs-item"
                  style={{ borderBottom: '1px solid var(--sidebar-border)', paddingBottom: '12px' }}
                >
                  <div
                    style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--accent-color)' }}
                  >
                    {t('docs.emphasis')}
                  </div>
                  <code
                    style={{
                      display: 'block',
                      padding: '4px 8px',
                      background: 'var(--input-bg)',
                      borderRadius: '4px',
                      marginBottom: '8px',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    **Bold**
                    <br />
                    *Italic*
                    <br />
                    ~~Strikethrough~~
                  </code>
                  <div
                    className="preview-pane docs-preview"
                    style={{
                      padding: '8px',
                      border: '1px solid var(--toolbar-border)',
                      borderRadius: '4px',
                      background: 'var(--editor-bg)',
                    }}
                  >
                    <p>
                      <strong>Bold</strong>
                      <br />
                      <em>Italic</em>
                      <br />
                      <del>Strikethrough</del>
                    </p>
                  </div>
                </div>
                <div
                  className="docs-item"
                  style={{ borderBottom: '1px solid var(--sidebar-border)', paddingBottom: '12px' }}
                >
                  <div
                    style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--accent-color)' }}
                  >
                    {t('docs.lists')}
                  </div>
                  <code
                    style={{
                      display: 'block',
                      padding: '4px 8px',
                      background: 'var(--input-bg)',
                      borderRadius: '4px',
                      marginBottom: '8px',
                      whiteSpace: 'pre-wrap',
                    }}
                  >{`- Item 1\n- Item 2\n  - Sub item`}</code>
                  <div
                    className="preview-pane docs-preview"
                    style={{
                      padding: '8px',
                      border: '1px solid var(--toolbar-border)',
                      borderRadius: '4px',
                      background: 'var(--editor-bg)',
                    }}
                  >
                    <ul>
                      <li>Item 1</li>
                      <li>
                        Item 2
                        <ul>
                          <li>Sub item</li>
                        </ul>
                      </li>
                    </ul>
                  </div>
                </div>
                <div
                  className="docs-item"
                  style={{ borderBottom: '1px solid var(--sidebar-border)', paddingBottom: '12px' }}
                >
                  <div
                    style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--accent-color)' }}
                  >
                    {t('docs.codeBlock')}
                  </div>
                  <code
                    style={{
                      display: 'block',
                      padding: '4px 8px',
                      background: 'var(--input-bg)',
                      borderRadius: '4px',
                      marginBottom: '8px',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    ```javascript
                    <br />
                    const foo = 'bar';
                    <br />
                    ```
                  </code>
                  <div
                    className="preview-pane docs-preview"
                    style={{
                      padding: '8px',
                      border: '1px solid var(--toolbar-border)',
                      borderRadius: '4px',
                      background: 'var(--editor-bg)',
                    }}
                  >
                    <pre style={{ margin: 0, padding: '4px' }}>
                      <code>
                        <span style={{ color: '#569cd6' }}>const</span> foo ={' '}
                        <span style={{ color: '#ce9178' }}>'bar'</span>;
                      </code>
                    </pre>
                  </div>
                </div>
                <div
                  className="docs-item"
                  style={{ borderBottom: '1px solid var(--sidebar-border)', paddingBottom: '12px' }}
                >
                  <div
                    style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--accent-color)' }}
                  >
                    {t('docs.alerts')}
                  </div>
                  <code
                    style={{
                      display: 'block',
                      padding: '4px 8px',
                      background: 'var(--input-bg)',
                      borderRadius: '4px',
                      marginBottom: '8px',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    &gt; [!NOTE]
                    <br />
                    &gt; Content here
                  </code>
                  <div
                    className="preview-pane docs-preview"
                    style={{
                      padding: '8px',
                      border: '1px solid var(--toolbar-border)',
                      borderRadius: '4px',
                      background: 'var(--editor-bg)',
                    }}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkAlert]}>
                      {`> [!NOTE]\n> Note content\n\n> [!WARNING]\n> Warning content`}
                    </ReactMarkdown>
                  </div>
                </div>
                <div style={{ fontSize: '12px', opacity: 0.7, paddingTop: '8px' }}>
                  {t('docs.reference')}
                  <a
                    href="https://www.tohoho-web.com/ex/markdown.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--accent-color)' }}
                  >
                    {t('docs.referenceLink')}
                  </a>
                  {t('docs.referenceSuffix')}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="resizer-x" onMouseDown={startResizingSidebar} title={t('resizer.tooltip')} />
    </>
  );
}
