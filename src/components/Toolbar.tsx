import { Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Code, Link as LinkIcon, Image as ImageIcon, Download, Eye, EyeOff } from 'lucide-react';

interface ToolbarProps {
  onInsertMarkdown: (prefix: string, suffix: string, defaultText: string) => void;
  onExport: () => void;
  onTogglePreview: () => void;
  showPreview: boolean;
}

export function Toolbar({ onInsertMarkdown, onExport, onTogglePreview, showPreview }: ToolbarProps) {
  return (
    <div className="editor-toolbar">
      <div className="toolbar-inner">
        <div className="toolbar-group">
          <button className="toolbar-btn" onClick={() => onInsertMarkdown('**', '**', '太字')} data-tooltip="太字 (Ctrl+B)">
            <Bold size={16} />
          </button>
          <button className="toolbar-btn" onClick={() => onInsertMarkdown('*', '*', '斜体')} data-tooltip="斜体 (Ctrl+I)">
            <Italic size={16} />
          </button>
        </div>
        
        <div className="toolbar-separator" />
        
        <div className="toolbar-group">
          <button className="toolbar-btn" onClick={() => onInsertMarkdown('# ', '', '見出し1')} data-tooltip="見出し 1">
            <Heading1 size={16} />
          </button>
          <button className="toolbar-btn" onClick={() => onInsertMarkdown('## ', '', '見出し2')} data-tooltip="見出し 2">
            <Heading2 size={16} />
          </button>
          <button className="toolbar-btn" onClick={() => onInsertMarkdown('### ', '', '見出し3')} data-tooltip="見出し 3">
            <Heading3 size={16} />
          </button>
        </div>

        <div className="toolbar-separator" />
        
        <div className="toolbar-group">
          <button className="toolbar-btn" onClick={() => onInsertMarkdown('- ', '', 'リスト項目')} data-tooltip="箇条書きリスト">
            <List size={16} />
          </button>
          <button className="toolbar-btn" onClick={() => onInsertMarkdown('1. ', '', 'リスト項目')} data-tooltip="番号付きリスト">
            <ListOrdered size={16} />
          </button>
        </div>

        <div className="toolbar-separator" />

        <div className="toolbar-group">
          <button className="toolbar-btn" onClick={() => onInsertMarkdown('> ', '', '引用文')} data-tooltip="引用">
            <Quote size={16} />
          </button>
          <button className="toolbar-btn" onClick={() => onInsertMarkdown('```\n', '\n```', 'コードを入力')} data-tooltip="コードブロック">
            <Code size={16} />
          </button>
        </div>

        <div className="toolbar-separator" />

        <div className="toolbar-group">
          <button className="toolbar-btn" onClick={() => onInsertMarkdown('[', '](https://)', 'リンクテキスト')} data-tooltip="リンク">
            <LinkIcon size={16} />
          </button>
          <button className="toolbar-btn" onClick={() => onInsertMarkdown('![', '](https://)', '代替テキスト')} data-tooltip="画像">
            <ImageIcon size={16} />
          </button>
        </div>

        <div className="toolbar-separator" />
        <div className="toolbar-group">
          <button className="toolbar-btn" onClick={onExport} data-tooltip="Markdownとして保存 (エクスポート)">
            <Download size={16} />
          </button>
        </div>

        <div className="toolbar-group" style={{ marginLeft: 'auto' }}>
          <button 
            className={`toolbar-btn ${showPreview ? 'active' : ''}`} 
            onClick={onTogglePreview} 
            data-tooltip-left={showPreview ? "プレビューを閉じる" : "プレビューを開く"}
            style={{ color: showPreview ? 'var(--accent-color)' : 'inherit' }}
          >
            {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
