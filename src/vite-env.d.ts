/// <reference types="vite/client" />

interface Window {
  electronAPI?: {
    saveFile: (content: string, defaultPath?: string) => Promise<string | null>;
  };
}
