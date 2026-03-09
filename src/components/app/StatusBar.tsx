interface StatusBarProps {
  t: (key: string) => string;
  isChordWaiting: boolean;
  selectionCount: number;
  cursorPos: { line: number; column: number };
  eolMode: 'LF' | 'CRLF';
  onGotoLine: () => void;
  toggleEol: () => void;
  openLanguagePalette: () => void;
  activeFileLanguage?: string;
}

export function StatusBar({
  t,
  isChordWaiting,
  selectionCount,
  cursorPos,
  eolMode,
  onGotoLine,
  toggleEol,
  openLanguagePalette,
  activeFileLanguage,
}: StatusBarProps) {
  return (
    <footer className="status-bar">
      <div className="status-bar-left">
        {isChordWaiting && <div className="status-bar-item">{t('status.chordWaiting')}</div>}
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
          onClick={onGotoLine}
        >
          {t('status.line')} {cursorPos.line}, {t('status.col')} {cursorPos.column}
        </div>
        <div
          className="status-bar-item"
          onClick={toggleEol}
          style={{ cursor: 'pointer' }}
          data-tooltip={t('status.eolTooltip')}
        >
          {eolMode}
        </div>
        <div className="status-bar-item">UTF-8</div>
        <span
          className="status-bar-item highlight"
          onClick={openLanguagePalette}
          data-tooltip={t('status.langMode')}
        >
          {activeFileLanguage
            ? activeFileLanguage.charAt(0).toUpperCase() + activeFileLanguage.slice(1)
            : 'Markdown'}
        </span>
      </div>
    </footer>
  );
}
