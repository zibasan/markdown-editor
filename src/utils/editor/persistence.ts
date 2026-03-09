import type { EditorFile } from '../../types';

export const FILE_SESSION_STORAGE_KEY = 'editor_files_state';

interface PersistedEditorFile {
  id: string;
  name: string;
  content: string;
  savedContent?: string;
  language?: string;
  sourceSignature?: string;
  needsSaveAs?: boolean;
}

interface PersistedEditorState {
  files: PersistedEditorFile[];
  activeFileId: string;
}

export const readPersistedEditorState = (): { files: EditorFile[]; activeFileId: string } => {
  try {
    const raw = localStorage.getItem(FILE_SESSION_STORAGE_KEY);
    if (!raw) {
      return { files: [], activeFileId: '' };
    }
    const parsed = JSON.parse(raw) as Partial<PersistedEditorState>;
    const files = Array.isArray(parsed.files)
      ? parsed.files.filter(
          (file): file is PersistedEditorFile =>
            typeof file?.id === 'string' &&
            typeof file?.name === 'string' &&
            typeof file?.content === 'string'
        )
      : [];
    const activeFileId = typeof parsed.activeFileId === 'string' ? parsed.activeFileId : '';

    return { files, activeFileId };
  } catch {
    return { files: [], activeFileId: '' };
  }
};
