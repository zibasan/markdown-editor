import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettierConfig from 'eslint-config-prettier';

// 1. Stylisticプラグインを追加
import stylistic from '@stylistic/eslint-plugin';

export default defineConfig([
  globalIgnores(['dist']),
  { ignores: ['dist', 'dist-electron', 'build', 'release'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    // 2. プラグインオブジェクトを追加して登録
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      'react-hooks/static-components': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // === 3. @stylistic のルール (Prettierと競合しないもの) ===
      // return文の直前には必ず空行を入れる（JSXを返すコンポーネントの可読性が大幅に向上します）
      '@stylistic/padding-line-between-statements': [
        'off',
        { blankLine: 'always', prev: '*', next: 'return' },
      ],

      // === 4. フロントエンド開発向けのおすすめ標準ルール ===
      // 厳密な等価演算子 (===, !==) を強制（思わぬ型変換によるUIバグを防ぐ）
      eqeqeq: ['error', 'always'],
      // 文字列の結合に + 演算子ではなくテンプレートリテラル (` `) を推奨（クラス名の結合などが見やすくなる）
      'prefer-template': 'warn',
      // 再代入されない変数は const にする（状態管理の意図が明確になる）
      'prefer-const': 'error',
    },
  },

  // 5. 必ず配列の一番最後に Prettier の設定を追加する
  prettierConfig,
]);
