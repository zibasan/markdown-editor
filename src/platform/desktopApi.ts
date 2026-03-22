import { invoke } from '@tauri-apps/api/core';
import type { ElectronAPI } from '../types';

const isTauriRuntime = () => {
  return typeof window !== 'undefined' && typeof window.__TAURI_INTERNALS__ !== 'undefined';
};

const notifyFallback = async (title: string, body?: string) => {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission === 'granted') {
    new Notification(title, body ? { body } : undefined);
    return;
  }
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification(title, body ? { body } : undefined);
    }
  }
};

const createTauriElectronApiAdapter = (): ElectronAPI => {
  return {
    saveFile: async (content: string, defaultPath?: string) => {
      return invoke<string | null>('save_file', { content, defaultPath });
    },
    openFileDialog: async () => {
      return invoke<{ path: string; name: string; content: string } | null>('open_file_dialog');
    },
    openFilePath: async (filePath: string) => {
      return invoke<{ path: string; name: string; content: string } | null>('open_file_path', {
        filePath,
      });
    },
    openFolderDialog: async (mode: 'open' | 'create' = 'open') => {
      return invoke<{
        folderPath: string;
        files: { path: string; name: string; content: string }[];
      } | null>('open_folder_dialog', { mode });
    },
    showAbout: async () => {
      return invoke<boolean>('show_about');
    },
    registerFileAssociation: async () => {
      return invoke<boolean>('register_file_association');
    },
    unregisterFileAssociation: async () => {
      return invoke<boolean>('unregister_file_association');
    },
    notify: (title: string, body?: string) => {
      void notifyFallback(title, body);
    },
    onOpenFile: () => {
      return () => undefined;
    },
    minimize: () => {
      void invoke('minimize_window');
    },
    maximize: () => {
      void invoke('toggle_maximize_window');
    },
    close: () => {
      void invoke('close_window');
    },
    onUpdateDownloaded: () => {
      // Tauri updater wiring will be added in a follow-up iteration.
    },
    installUpdate: async () => {
      await invoke('install_update');
    },
  };
};

export const bootstrapDesktopApi = async () => {
  if (typeof window === 'undefined') return;
  if (window.electronAPI) return;
  if (!isTauriRuntime()) return;

  window.electronAPI = createTauriElectronApiAdapter();
};
