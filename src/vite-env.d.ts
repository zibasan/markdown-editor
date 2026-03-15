/// <reference types="vite/client" />

interface Window {
  electronAPI?: {
    saveFile: (content: string, defaultPath?: string) => Promise<string | null>;
    openFileDialog: () => Promise<{ path: string; name: string; content: string } | null>;
    openFilePath: (
      filePath: string
    ) => Promise<{ path: string; name: string; content: string } | null>;
    openFolderDialog: (mode?: 'open' | 'create') => Promise<{
      folderPath: string;
      files: { path: string; name: string; content: string }[];
    } | null>;
    showAbout: () => Promise<boolean>;
    registerFileAssociation: () => Promise<boolean>;
    unregisterFileAssociation: () => Promise<boolean>;
    notify: (title: string, body?: string) => void;
    onOpenFile: (callback: (filePath: string) => void) => () => void;
    minimize: () => void;
    maximize: () => void;
    close: () => void;
  };
}
