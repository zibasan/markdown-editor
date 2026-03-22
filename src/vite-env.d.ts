/// <reference types="vite/client" />
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    __TAURI_INTERNALS__?: unknown;
  }
}

export {};
