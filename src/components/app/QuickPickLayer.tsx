import { Languages } from 'lucide-react';

interface LanguageOption {
  id: string;
  aliases?: string[];
}

interface ConfirmPalette {
  title: string;
  message?: string;
  onConfirm: () => void;
  onDeny: () => void;
  onCancel: () => void;
}

interface RecentFileEntry {
  path: string;
  name: string;
}

interface QuickPickLayerProps {
  t: (key: string) => string;
  showLanguagePalette: boolean;
  setShowLanguagePalette: (show: boolean) => void;
  languageSearch: string;
  setLanguageSearch: (value: string) => void;
  languageInputRef: React.RefObject<HTMLInputElement | null>;
  handleLanguagePaletteKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  filteredLanguages: LanguageOption[];
  activeFileLanguage?: string;
  activeLanguageIndex: number;
  setActiveLanguageIndex: (index: number) => void;
  selectLanguage: (langId: string) => void;
  showNewFilePalette: boolean;
  setShowNewFilePalette: (show: boolean) => void;
  newFileNameInput: string;
  setNewFileNameInput: (value: string) => void;
  confirmCreateFile: () => void;
  newFileInputRef: React.RefObject<HTMLInputElement | null>;
  showConfirmPalette: ConfirmPalette | null;
  showLangSwitchPalette: boolean;
  setShowLangSwitchPalette: (show: boolean) => void;
  settingsLanguage: 'ja' | 'en';
  setSettingsLanguage: (lang: 'ja' | 'en') => void;
  showRecentPalette: boolean;
  setShowRecentPalette: (show: boolean) => void;
  recentSearch: string;
  setRecentSearch: (value: string) => void;
  recentInputRef: React.RefObject<HTMLInputElement | null>;
  filteredRecentFiles: RecentFileEntry[];
  openRecentFile: (filePath: string) => void;
  handleRecentPaletteKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  activeRecentIndex: number;
  setActiveRecentIndex: (index: number) => void;
}

export function QuickPickLayer({
  t,
  showLanguagePalette,
  setShowLanguagePalette,
  languageSearch,
  setLanguageSearch,
  languageInputRef,
  handleLanguagePaletteKeyDown,
  filteredLanguages,
  activeLanguageIndex,
  setActiveLanguageIndex,
  selectLanguage,
  showNewFilePalette,
  setShowNewFilePalette,
  newFileNameInput,
  setNewFileNameInput,
  confirmCreateFile,
  newFileInputRef,
  showConfirmPalette,
  showLangSwitchPalette,
  setShowLangSwitchPalette,
  settingsLanguage,
  setSettingsLanguage,
  showRecentPalette,
  setShowRecentPalette,
  recentSearch,
  setRecentSearch,
  recentInputRef,
  filteredRecentFiles,
  openRecentFile,
  handleRecentPaletteKeyDown,
  activeRecentIndex,
  setActiveRecentIndex,
}: QuickPickLayerProps) {
  return (
    <>
      {showLanguagePalette && (
        <div
          className='quickpick-overlay'
          onClick={() => {
            setShowLanguagePalette(false);
            setLanguageSearch('');
          }}
        >
          <div className='quickpick-container' onClick={(e) => e.stopPropagation()}>
            <div className='quickpick-input-wrapper'>
              <div className='quickpick-title'>{t('langPalette.title')}</div>
              <input
                ref={languageInputRef}
                className='quickpick-input'
                type='text'
                placeholder={t('langPalette.placeholder')}
                value={languageSearch}
                onChange={(e) => setLanguageSearch(e.target.value)}
                onKeyDown={handleLanguagePaletteKeyDown}
              />
            </div>
            <div className='quickpick-list'>
              {filteredLanguages.map((lang, index) => (
                <div
                  key={lang.id}
                  className={`quickpick-item ${activeLanguageIndex === index ? 'active' : ''}`}
                  onClick={() => selectLanguage(lang.id)}
                  onMouseEnter={() => setActiveLanguageIndex(index)}
                >
                  <span className='quickpick-item-label'>
                    {lang.aliases && lang.aliases.length > 0 ? lang.aliases[0] : lang.id}
                  </span>
                  <span className='quickpick-item-sub'>({lang.id})</span>
                </div>
              ))}
              {filteredLanguages.length === 0 && (
                <div className='quickpick-item' style={{ opacity: 0.5, pointerEvents: 'none' }}>
                  {t('langPalette.noMatch')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showNewFilePalette && (
        <div className='quickpick-overlay' onClick={() => setShowNewFilePalette(false)}>
          <div className='quickpick-container' onClick={(e) => e.stopPropagation()}>
            <div className='quickpick-input-wrapper'>
              <div className='quickpick-title'>{t('newFile.title')}</div>
              <input
                ref={newFileInputRef}
                className='quickpick-input'
                type='text'
                placeholder={t('newFile.placeholder')}
                value={newFileNameInput}
                onChange={(e) => setNewFileNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmCreateFile();
                  if (e.key === 'Escape') setShowNewFilePalette(false);
                }}
                autoFocus
              />
            </div>
            <div
              style={{
                padding: '8px 12px',
                fontSize: '12px',
                opacity: 0.6,
                borderTop: '1px solid var(--border-color)',
              }}
            >
              {t('newFile.hint')}
            </div>
          </div>
        </div>
      )}

      {showConfirmPalette && (
        <div className='quickpick-overlay' onClick={showConfirmPalette.onCancel}>
          <div className='quickpick-container' onClick={(e) => e.stopPropagation()}>
            <div
              className='quickpick-header'
              style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}
            >
              <div style={{ fontSize: '13px', fontWeight: 600 }}>{showConfirmPalette.title}</div>
              {showConfirmPalette.message && (
                <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>
                  {showConfirmPalette.message}
                </div>
              )}
            </div>
            <div className='quickpick-list' style={{ maxHeight: 'none' }}>
              <div className='quickpick-item' onClick={showConfirmPalette.onConfirm}>
                <div className='quickpick-item-info'>
                  <div className='quickpick-item-label'>{t('confirm.saveAndClose')}</div>
                  <div className='quickpick-item-desc'>{t('confirm.saveAndCloseDesc')}</div>
                </div>
              </div>
              <div className='quickpick-item' onClick={showConfirmPalette.onDeny}>
                <div className='quickpick-item-info'>
                  <div className='quickpick-item-label' style={{ color: 'var(--accent-color)' }}>
                    {t('confirm.closeWithoutSave')}
                  </div>
                  <div className='quickpick-item-desc'>{t('confirm.closeWithoutSaveDesc')}</div>
                </div>
              </div>
              <div className='context-menu-separator' style={{ margin: 0 }} />
              <div className='quickpick-item' onClick={showConfirmPalette.onCancel}>
                <div className='quickpick-item-info'>
                  <div className='quickpick-item-label'>{t('confirm.cancel')}</div>
                  <div className='quickpick-item-desc'>{t('confirm.cancelDesc')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLangSwitchPalette && (
        <div className='quickpick-overlay' onClick={() => setShowLangSwitchPalette(false)}>
          <div className='quickpick-container' onClick={(e) => e.stopPropagation()}>
            <div className='quickpick-input-wrapper'>
              <div className='quickpick-title'>{t('langSwitch.title')}</div>
            </div>
            <div className='quickpick-list' style={{ maxHeight: 'none' }}>
              <div
                className={`quickpick-item ${settingsLanguage === 'ja' ? 'active' : ''}`}
                onClick={() => {
                  setSettingsLanguage('ja');
                  setShowLangSwitchPalette(false);
                }}
              >
                <Languages size={16} />
                <span className='quickpick-item-label'>{t('langSwitch.ja')}</span>
              </div>
              <div
                className={`quickpick-item ${settingsLanguage === 'en' ? 'active' : ''}`}
                onClick={() => {
                  setSettingsLanguage('en');
                  setShowLangSwitchPalette(false);
                }}
              >
                <Languages size={16} />
                <span className='quickpick-item-label'>{t('langSwitch.en')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRecentPalette && (
        <div
          className='quickpick-overlay'
          onClick={() => {
            setShowRecentPalette(false);
            setRecentSearch('');
          }}
        >
          <div className='quickpick-container' onClick={(e) => e.stopPropagation()}>
            <div className='quickpick-input-wrapper'>
              <div className='quickpick-title'>{t('recentPalette.title')}</div>
              <input
                ref={recentInputRef}
                className='quickpick-input'
                type='text'
                placeholder={t('recentPalette.placeholder')}
                value={recentSearch}
                onChange={(e) => setRecentSearch(e.target.value)}
                onKeyDown={handleRecentPaletteKeyDown}
              />
            </div>
            <div className='quickpick-list'>
              {filteredRecentFiles.map((entry, index) => (
                <div
                  key={entry.path}
                  className={`quickpick-item ${activeRecentIndex === index ? 'active' : ''}`}
                  onClick={() => {
                    openRecentFile(entry.path);
                    setShowRecentPalette(false);
                    setRecentSearch('');
                  }}
                  onMouseEnter={() => setActiveRecentIndex(index)}
                  title={entry.path}
                >
                  <span className='quickpick-item-label'>{entry.name}</span>
                  <span className='quickpick-item-sub'>{entry.path}</span>
                </div>
              ))}
              {filteredRecentFiles.length === 0 && (
                <div className='quickpick-item' style={{ opacity: 0.5, pointerEvents: 'none' }}>
                  {t('recentPalette.empty')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
