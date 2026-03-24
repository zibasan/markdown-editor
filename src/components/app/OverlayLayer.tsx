import { FolderOpen } from 'lucide-react';

interface ContextMenuState {
  x: number;
  y: number;
  fileId?: string;
}

interface OverlayLayerProps {
  t: (key: string) => string;
  isDraggingOver: boolean;
  contextMenu: ContextMenuState | null;
  setContextMenu: (menu: ContextMenuState | null) => void;
  filesLength: number;
  handleContextOpen: () => void;
  handleContextReveal: () => void;
  handleContextDelete: () => void;
  openNewFilePalette: () => void;
  openFileFromDisk: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileOpen: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function OverlayLayer({
  t,
  isDraggingOver,
  contextMenu,
  setContextMenu,
  filesLength,
  handleContextOpen,
  handleContextReveal,
  handleContextDelete,
  openNewFilePalette,
  openFileFromDisk,
  fileInputRef,
  handleFileOpen,
}: OverlayLayerProps) {
  return (
    <>
      {isDraggingOver && (
        <div className='drag-overlay'>
          <div className='drag-overlay-content'>
            <FolderOpen size={48} />
            <span>{t('dnd.drop')}</span>
          </div>
        </div>
      )}

      {contextMenu && (
        <div
          className='context-menu-overlay'
          onClick={() => setContextMenu(null)}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenu(null);
          }}
        >
          <div
            className='context-menu'
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.fileId ? (
              <>
                <div className='context-menu-item' onClick={handleContextOpen}>
                  {t('context.open')}
                </div>
                <div className='context-menu-item' onClick={handleContextReveal}>
                  {t('context.revealInExplorer')}
                </div>
                <div className='context-menu-separator' />
                <div
                  className={`context-menu-item ${filesLength <= 1 ? 'disabled' : 'danger'}`}
                  onClick={filesLength > 1 ? handleContextDelete : undefined}
                >
                  {t('context.delete')}
                </div>
              </>
            ) : (
              <>
                <div
                  className='context-menu-item'
                  onClick={() => {
                    openNewFilePalette();
                    setContextMenu(null);
                  }}
                >
                  {t('context.newFile')}
                </div>
                <div
                  className='context-menu-item'
                  onClick={() => {
                    openFileFromDisk();
                    setContextMenu(null);
                  }}
                >
                  {t('context.openFile')}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <input
        type='file'
        ref={fileInputRef}
        onChange={handleFileOpen}
        accept='*/*'
        style={{ display: 'none' }}
      />
    </>
  );
}
