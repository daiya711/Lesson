// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',
  /* 1つのテストファイルで複数のファイルを並行実行 */
  fullyParallel: true,
  /* CIで失敗時の再試行を無効化 */
  forbidOnly: !!process.env.CI,
  /* CIでの失敗時再試行 */
  retries: process.env.CI ? 2 : 0,
  /* 並行実行ワーカー数 */
  workers: process.env.CI ? 1 : undefined,
  /* レポーター設定 */
  reporter: 'html',
  /* すべてのテストで共有する設定 */
  use: {
    /* ベースURL - Wrangler Pages Devサーバー */
    baseURL: 'http://localhost:8788',
    /* 失敗時のスクリーンショット */
    screenshot: 'only-on-failure',
    /* 失敗時の動画録画 */
    video: 'retain-on-failure',
    /* トレース設定 */
    trace: 'on-first-retry',
  },

  /* テスト用プロジェクト設定 */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        /* WebGL対応のためにChromiumの追加設定 */
        launchOptions: {
          args: [
            '--enable-webgl',
            '--enable-webgl-draft-extensions',
            '--use-gl=swiftshader', // ソフトウェアレンダリング
            '--disable-web-security', // CORS問題対策
          ]
        }
      },
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        /* Firefox WebGL設定 */
        launchOptions: {
          firefoxUserPrefs: {
            'webgl.force-enabled': true,
            'webgl.disabled': false,
          }
        }
      },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* モバイルテスト */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  /* 開発サーバーを自動起動 */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8788',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2分でタイムアウト
  },
});