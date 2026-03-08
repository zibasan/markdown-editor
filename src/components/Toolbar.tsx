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
} from 'lucide-react';

interface ToolbarProps {
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
}

export function Toolbar({
  onInsertMarkdown,
  onSave,
  onTogglePreview,
  showPreview,
  onUndo,
  onRedo,
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
    onInsertMarkdown(`> [!${type}]\n> `, '', 'アラートの内容', true);
    setShowAlertMenu(false);
  };

  return (
    <div className="editor-toolbar">
      <div className="toolbar-inner">
        <div className="toolbar-group">
          <button className="toolbar-btn" onClick={onUndo} data-tooltip="元に戻す (Ctrl+Z)">
            <Undo size={16} />
          </button>
          <button className="toolbar-btn" onClick={onRedo} data-tooltip="やり直す (Ctrl+Y)">
            <Redo size={16} />
          </button>
        </div>

        <div className="toolbar-separator" />

        <div className="toolbar-group">
          <button
            className="toolbar-btn"
            onClick={() => onInsertMarkdown('**', '**', '太字')}
            data-tooltip="太字 (Ctrl+B)"
          >
            <Bold size={16} />
          </button>
          <button
            className="toolbar-btn"
            onClick={() => onInsertMarkdown('*', '*', '斜体')}
            data-tooltip="斜体 (Ctrl+I)"
          >
            <Italic size={16} />
          </button>
          <button
            className="toolbar-btn"
            onClick={() => onInsertMarkdown('~~', '~~', '打ち消し線')}
            data-tooltip="打ち消し線"
          >
            <Strikethrough size={16} />
          </button>
        </div>

        <div className="toolbar-separator" />

        <div className="toolbar-group">
          <button
            className="toolbar-btn"
            onClick={() => onInsertMarkdown('# ', '', '見出し1')}
            data-tooltip="見出し 1"
          >
            <Heading1 size={16} />
          </button>
          <button
            className="toolbar-btn"
            onClick={() => onInsertMarkdown('## ', '', '見出し2')}
            data-tooltip="見出し 2"
          >
            <Heading2 size={16} />
          </button>
          <button
            className="toolbar-btn"
            onClick={() => onInsertMarkdown('### ', '', '見出し3')}
            data-tooltip="見出し 3"
          >
            <Heading3 size={16} />
          </button>
          <button
            className="toolbar-btn"
            onClick={() => onInsertMarkdown('#### ', '', '見出し4')}
            data-tooltip="見出し 4"
          >
            <Heading4 size={16} />
          </button>
          <button
            className="toolbar-btn"
            onClick={() => onInsertMarkdown('##### ', '', '見出し5')}
            data-tooltip="見出し 5"
          >
            <Heading5 size={16} />
          </button>
          <button
            className="toolbar-btn"
            onClick={() => onInsertMarkdown('###### ', '', '見出し6')}
            data-tooltip="見出し 6"
          >
            <Heading6 size={16} />
          </button>
        </div>

        <div className="toolbar-separator" />

        <div className="toolbar-group">
          <button
            className="toolbar-btn"
            onClick={() => onInsertMarkdown('- ', '', 'リスト項目')}
            data-tooltip="箇条書きリスト"
          >
            <List size={16} />
          </button>
          <button
            className="toolbar-btn"
            onClick={() => onInsertMarkdown('1. ', '', 'リスト項目')}
            data-tooltip="番号付きリスト"
          >
            <ListOrdered size={16} />
          </button>
          <button
            className="toolbar-btn"
            onClick={() => onInsertMarkdown('- [ ] ', '', 'タスク項目')}
            data-tooltip="タスクリスト"
          >
            <ListTodo size={16} />
          </button>
        </div>

        <div className="toolbar-separator" />

        <div className="toolbar-group">
          <button
            className="toolbar-btn"
            onClick={() => onInsertMarkdown('> ', '', '引用文')}
            data-tooltip="引用"
          >
            <Quote size={16} />
          </button>
          <div ref={alertMenuRef} style={{ position: 'relative' }}>
            <button
              className={`toolbar-btn ${showAlertMenu ? 'active' : ''}`}
              onClick={() => setShowAlertMenu(!showAlertMenu)}
              data-tooltip="アラート構文"
            >
              <AlertTriangle size={16} />
            </button>
            {showAlertMenu && (
              <div className="alert-popup-menu">
                <button
                  className="toolbar-btn"
                  onClick={() => insertAlert('NOTE')}
                  data-tooltip="Note"
                  style={{ color: '#0969da' }}
                >
                  <Info size={16} />
                </button>
                <button
                  className="toolbar-btn"
                  onClick={() => insertAlert('TIP')}
                  data-tooltip="Tip"
                  style={{ color: '#1a7f37' }}
                >
                  <Lightbulb size={16} />
                </button>
                <button
                  className="toolbar-btn"
                  onClick={() => insertAlert('IMPORTANT')}
                  data-tooltip="Important"
                  style={{ color: '#8250df' }}
                >
                  <MessageCircleWarning size={16} />
                </button>
                <button
                  className="toolbar-btn"
                  onClick={() => insertAlert('WARNING')}
                  data-tooltip="Warning"
                  style={{ color: '#9a6700' }}
                >
                  <AlertTriangle size={16} />
                </button>
                <button
                  className="toolbar-btn"
                  onClick={() => insertAlert('CAUTION')}
                  data-tooltip="Caution"
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
            onClick={() => onInsertMarkdown('```\n', '\n```', 'コードを入力')}
            data-tooltip="コードブロック"
          >
            <Code size={16} />
          </button>
          <button
            className="toolbar-btn"
            onClick={() =>
              onInsertMarkdown(
                '| Column 1 | Column 2 |\n| -------- | -------- |\n| Text     | Text     |\n',
                '',
                ''
              )
            }
            data-tooltip="テーブル"
          >
            <Table size={16} />
          </button>
        </div>

        <div className="toolbar-separator" />

        <div className="toolbar-group">
          <button
            className="toolbar-btn"
            onClick={() => onInsertMarkdown('[', '](https://)', 'リンクテキスト')}
            data-tooltip="リンク"
          >
            <LinkIcon size={16} />
          </button>
        </div>

        <div className="toolbar-separator" />
        <div className="toolbar-group">
          <button className="toolbar-btn" onClick={onSave} data-tooltip="保存 (Ctrl+S)">
            <Save size={16} />
          </button>
        </div>

        <div className="toolbar-group" style={{ marginLeft: 'auto' }}>
          <button
            className={`toolbar-btn ${showPreview ? 'active' : ''}`}
            onClick={onTogglePreview}
            data-tooltip-left={showPreview ? 'プレビューを閉じる' : 'プレビューを開く'}
            style={{ color: showPreview ? 'var(--accent-color)' : 'inherit' }}
          >
            {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
