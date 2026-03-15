import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';

// defineConfigにアロー関数を渡す形に変更します
export default defineConfig(() => {
  // 環境変数からElectron用のビルドかどうかを判定
  const isElectron = process.env.BUILD_TARGET === 'electron';

  return {
    // 【重要】
    // isElectron が true ならデスクトップアプリ用の相対パス './'
    // false なら GitHub Pages用のパス '/リポジトリ名/' にします
    base: isElectron ? './' : '/markdown-code-editor/', // ← 実際のリポジトリ名に変更してください
    build: { chunkSizeWarningLimit: 2000 },
    plugins: [
      react(),
      // Electronモードの時だけElectron関連のプラグインを有効にする
      ...(isElectron
        ? [
            electron([
              { entry: 'electron/main.ts' },
              {
                entry: 'electron/preload.ts',
                onstart(options) {
                  options.reload();
                },
              },
            ]),
            renderer(),
          ]
        : []),
    ],
  };
});
