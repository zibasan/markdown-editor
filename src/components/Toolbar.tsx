import { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  List,
  ListOrdered,
  Quote,
  Code,
  CodeXml,
  Link as LinkIcon,
  Eye,
  EyeOff,
  Table,
  ListTodo,
  Strikethrough,
  AlertTriangle,
  Save,
  Undo,
  Redo,
  Info,
  Lightbulb,
  MessageCircleWarning,
  OctagonAlert,
  Minus,
  Underline,
} from 'lucide-react';

interface ToolbarProps {
  t: (key: string) => string;
  onInsertMarkdown: (
    prefix: string,
    suffix: string,
    defaultText: string,
    insertOnNewLine?: boolean
  ) => void;
  onSave: () => void;
  onTogglePreview: () => void;
  showPreview: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isMarkdownMode: boolean;
  enableDiscordMarkdown: boolean;
}

export function Toolbar({
  t,
  onInsertMarkdown,
  onSave,
  onTogglePreview,
  showPreview,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isMarkdownMode,
  enableDiscordMarkdown,
}: ToolbarProps) {
  const [showAlertMenu, setShowAlertMenu] = useState(false);
  const alertMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (alertMenuRef.current && !alertMenuRef.current.contains(event.target as Node)) {
        setShowAlertMenu(false);
      }
    };
    if (showAlertMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAlertMenu]);

  const insertAlert = (type: string) => {
    if (!isMarkdownMode) return;
    onInsertMarkdown(`> [!${type}]\n> `, '', t('toolbar.alertContent'), true);
    setShowAlertMenu(false);
  };

  const isDiscordRestricted = isMarkdownMode && enableDiscordMarkdown;
  const isMenuVisible = isMarkdownMode && !enableDiscordMarkdown && showAlertMenu;

  return (
    <div className="editor-toolbar">
      <div className="toolbar-inner">
        <div className="toolbar-group">
          <button
            className="toolbar-btn"
            onClick={onUndo}
            disabled={!canUndo}
            data-tooltip={t('toolbar.undo')}
          >
            <Undo size={16} />
          </button>
          <button
            className="toolbar-btn"
            onClick={onRedo}
            disabled={!canRedo}
            data-tooltip={t('toolbar.redo')}
          >
            <Redo size={16} />
          </button>
        </div>

        <div className="toolbar-separator" />

        <div className="toolbar-group">
          <button
            className="toolbar-btn"
            disabled={!isMarkdownMode}
            onClick={() => onInsertMarkdown('**', '**', t('toolbar.sample.bold'))}
            data-tooltip={t('toolbar.bold')}
          >
            <Bold size={16} />
          </button>
          <button
            className="toolbar-btn"
            disabled={!isMarkdownMode}
            onClick={() => onInsertMarkdown('*', '*', t('toolbar.sample.italic'))}
            data-tooltip={t('toolbar.italic')}
          >
            <Italic size={16} />
          </button>
          <button
            className="toolbar-btn"
            disabled={!isMarkdownMode}
            onClick={() => onInsertMarkdown('~~', '~~', t('toolbar.sample.strike'))}
            data-tooltip={t('toolbar.strike')}
          >
            <Strikethrough size={16} />
          </button>
        </div>

        <div className="toolbar-separator" />

        <div className="toolbar-group">
          <button
            className="toolbar-btn"
            disabled={!isMarkdownMode}
            onClick={() => onInsertMarkdown('# ', '', t('toolbar.sample.heading1'))}
            data-tooltip={t('toolbar.heading1')}
          >
            <Heading1 size={16} />
          </button>
          <button
            className="toolbar-btn"
            disabled={!isMarkdownMode}
            onClick={() => onInsertMarkdown('## ', '', t('toolbar.sample.heading2'))}
            data-tooltip={t('toolbar.heading2')}
          >
            <Heading2 size={16} />
          </button>
          <button
            className="toolbar-btn"
            disabled={!isMarkdownMode}
            onClick={() => onInsertMarkdown('### ', '', t('toolbar.sample.heading3'))}
            data-tooltip={t('toolbar.heading3')}
          >
            <Heading3 size={16} />
          </button>
          <button
            className="toolbar-btn"
            disabled={!isMarkdownMode || isDiscordRestricted}
            onClick={() => onInsertMarkdown('#### ', '', t('toolbar.sample.heading4'))}
            data-tooltip={t('toolbar.heading4')}
          >
            <Heading4 size={16} />
          </button>
          <button
            className="toolbar-btn"
            disabled={!isMarkdownMode || isDiscordRestricted}
            onClick={() => onInsertMarkdown('##### ', '', t('toolbar.sample.heading5'))}
            data-tooltip={t('toolbar.heading5')}
          >
            <Heading5 size={16} />
          </button>
          <button
            className="toolbar-btn"
            disabled={!isMarkdownMode || isDiscordRestricted}
            onClick={() => onInsertMarkdown('###### ', '', t('toolbar.sample.heading6'))}
            data-tooltip={t('toolbar.heading6')}
          >
            <Heading6 size={16} />
          </button>
        </div>

        <div className="toolbar-separator" />

        <div className="toolbar-group">
          <button
            className="toolbar-btn"
            disabled={!isMarkdownMode}
            onClick={() => onInsertMarkdown('- ', '', t('toolbar.sample.list'))}
            data-tooltip={t('toolbar.bulletList')}
          >
            <List size={16} />
          </button>
          <button
            className="toolbar-btn"
            disabled={!isMarkdownMode}
            onClick={() => onInsertMarkdown('1. ', '', t('toolbar.sample.list'))}
            data-tooltip={t('toolbar.numberList')}
          >
            <ListOrdered size={16} />
          </button>
          <button
            className="toolbar-btn"
            disabled={!isMarkdownMode || isDiscordRestricted}
            onClick={() => onInsertMarkdown('- [ ] ', '', t('toolbar.sample.task'))}
            data-tooltip={t('toolbar.taskList')}
          >
            <ListTodo size={16} />
          </button>
        </div>

        <div className="toolbar-separator" />

        <div className="toolbar-group">
          <button
            className="toolbar-btn"
            disabled={!isMarkdownMode}
            onClick={() => onInsertMarkdown('> ', '', t('toolbar.sample.quote'))}
            data-tooltip={t('toolbar.quote')}
          >
            <Quote size={16} />
          </button>
          <div ref={alertMenuRef} style={{ position: 'relative' }}>
            <button
              className={`toolbar-btn ${isMenuVisible ? 'active' : ''}`}
              disabled={!isMarkdownMode || isDiscordRestricted}
              onClick={() => setShowAlertMenu((prev) => (isDiscordRestricted ? false : !prev))}
              data-tooltip={t('toolbar.alert')}
            >
              <AlertTriangle size={16} />
            </button>
            {isMenuVisible && (
              <div className="alert-popup-menu">
                <button
                  className="toolbar-btn"
                  disabled={!isMarkdownMode}
                  onClick={() => insertAlert('NOTE')}
                  data-tooltip={t('toolbar.alertNote')}
                  style={{ color: '#0969da' }}
                >
                  <Info size={16} />
                </button>
                <button
                  className="toolbar-btn"
                  disabled={!isMarkdownMode}
                  onClick={() => insertAlert('TIP')}
                  data-tooltip={t('toolbar.alertTip')}
                  style={{ color: '#1a7f37' }}
                >
                  <Lightbulb size={16} />
                </button>
                <button
                  className="toolbar-btn"
                  disabled={!isMarkdownMode}
                  onClick={() => insertAlert('IMPORTANT')}
                  data-tooltip={t('toolbar.alertImportant')}
                  style={{ color: '#8250df' }}
                >
                  <MessageCircleWarning size={16} />
                </button>
                <button
                  className="toolbar-btn"
                  disabled={!isMarkdownMode}
                  onClick={() => insertAlert('WARNING')}
                  data-tooltip={t('toolbar.alertWarning')}
                  style={{ color: '#9a6700' }}
                >
                  <AlertTriangle size={16} />
                </button>
                <button
                  className="toolbar-btn"
                  disabled={!isMarkdownMode}
                  onClick={() => insertAlert('CAUTION')}
                  data-tooltip={t('toolbar.alertCaution')}
                  style={{ color: '#d1242f' }}
                >
                  <OctagonAlert size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="toolbar-separator" />

        <div className="toolbar-group">
          <button
            className="toolbar-btn"
            disabled={!isMarkdownMode}
            onClick={() => onInsertMarkdown('`', '`', t('toolbar.sample.inlineCode'))}
            data-tooltip={t('toolbar.inlineCode')}
          >
            <CodeXml size={16} />
          </button>
          <button
            className="toolbar-btn"
            disabled={!isMarkdownMode}
            onClick={() => onInsertMarkdown('```\n', '\n```', t('toolbar.sample.codeBlock'))}
            data-tooltip={t('toolbar.codeBlock')}
          >
            <Code size={16} />
          </button>
          <button
            className="toolbar-btn"
            disabled={!isMarkdownMode || isDiscordRestricted}
            onClick={() => onInsertMarkdown('\n---\n', '', '', true)}
            data-tooltip={t('toolbar.horizontalRule')}
          >
            <Minus size={16} />
          </button>
          <button
            className="toolbar-btn"
            disabled={!isMarkdownMode || isDiscordRestricted}
            onClick={() =>
              onInsertMarkdown(
                '| Column 1 | Column 2 |\n| -------- | -------- |\n| Text     | Text     |\n',
                '',
                ''
              )
            }
            data-tooltip={t('toolbar.table')}
          >
            <Table size={16} />
          </button>
        </div>

        <div className="toolbar-separator" />

        <div className="toolbar-group">
          <button
            className="toolbar-btn"
            disabled={!isMarkdownMode}
            onClick={() => onInsertMarkdown('[', '](https://)', t('toolbar.sample.link'))}
            data-tooltip={t('toolbar.link')}
          >
            <LinkIcon size={16} />
          </button>
        </div>

        <div className="toolbar-separator" />
        <div className="toolbar-group">
          <button className="toolbar-btn" onClick={onSave} data-tooltip={t('toolbar.save')}>
            <Save size={16} />
          </button>
        </div>

        <div className="toolbar-group" style={{ marginLeft: 'auto' }}>
          <button
            className={`toolbar-btn ${showPreview ? 'active' : ''}`}
            onClick={onTogglePreview}
            data-tooltip-left={showPreview ? t('toolbar.previewClose') : t('toolbar.previewOpen')}
            style={{ color: showPreview ? 'var(--accent-color)' : 'inherit' }}
          >
            {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {enableDiscordMarkdown && (
        <div className="toolbar-inner toolbar-inner-discord">
          <div className="toolbar-discord-label">{t('toolbar.discordLabel')}</div>
          <div className="toolbar-separator" />
          <div className="toolbar-group">
            <button
              className="toolbar-btn"
              disabled={!isMarkdownMode}
              onClick={() => onInsertMarkdown('-# ', '', t('toolbar.sample.discordSubtext'), true)}
              data-tooltip={t('toolbar.discordSubtext')}
            >
              <span className="setting-material-icon toolbar-material-icon" aria-hidden="true">
                short_text
              </span>
            </button>
            <button
              className="toolbar-btn"
              disabled={!isMarkdownMode}
              onClick={() => onInsertMarkdown('__', '__', t('toolbar.sample.discordUnderline'))}
              data-tooltip={t('toolbar.discordUnderline')}
            >
              <Underline size={16} />
            </button>
            <button
              className="toolbar-btn"
              disabled={!isMarkdownMode}
              onClick={() => onInsertMarkdown('||', '||', t('toolbar.sample.discordSpoiler'))}
              data-tooltip={t('toolbar.discordSpoiler')}
            >
              <EyeOff size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
