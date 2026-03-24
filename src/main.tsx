import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@vscode/codicons/dist/codicon.css';
import './index.css';
import App from './App.tsx';
import { bootstrapDesktopApi } from './platform/desktopApi';

await bootstrapDesktopApi();

// WebViewデフォルトのコンテキストメニューを無効化（Monacoエディタ内は除く）
document.addEventListener('contextmenu', (e) => {
  if (e.target instanceof Element && !e.target.closest('.monaco-editor')) {
    e.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
