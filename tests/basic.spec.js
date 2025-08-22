const { test, expect } = require('@playwright/test');

test.describe('収納棚設計アプリ 基本機能', () => {
  
  test('アプリケーション起動テスト', async ({ page }) => {
    // アプリにアクセス
    await page.goto('/');
    
    // ページタイトルの確認
    await expect(page).toHaveTitle(/収納棚設計・デザインプラットフォーム/);
    
    // メインタイトルの表示確認
    await expect(page.locator('.title')).toContainText('収納棚設計プラットフォーム');
    
    // 3Dキャンバスの存在確認
    await expect(page.locator('#canvas')).toBeVisible();
    
    // コントロールパネルの表示確認
    await expect(page.locator('.controls')).toBeVisible();
  });

  test('コントロール要素の表示確認', async ({ page }) => {
    await page.goto('/');
    
    // 箱テンプレート編集セクション
    await expect(page.locator('text=箱テンプレート編集')).toBeVisible();
    
    // 寸法スライダーの存在確認
    await expect(page.locator('#widthSlider')).toBeVisible();
    await expect(page.locator('#heightSlider')).toBeVisible();
    await expect(page.locator('#depthSlider')).toBeVisible();
    
    // 構成板チェックボックスの確認
    await expect(page.locator('#topEnabled')).toBeVisible();
    await expect(page.locator('#bottomEnabled')).toBeVisible();
    await expect(page.locator('#leftEnabled')).toBeVisible();
    await expect(page.locator('#rightEnabled')).toBeVisible();
    await expect(page.locator('#backEnabled')).toBeVisible();
    
    // 個別板追加ボタンの確認
    await expect(page.locator('#addHorizontalBoard')).toBeVisible();
    await expect(page.locator('#addVerticalBoard')).toBeVisible();
    
    // データ管理セクション
    await expect(page.locator('text=データ管理')).toBeVisible();
  });

  test('寸法表示の初期値確認', async ({ page }) => {
    await page.goto('/');
    
    // 初期値の確認
    await expect(page.locator('#widthValue')).toContainText('80');
    await expect(page.locator('#heightValue')).toContainText('180');
    await expect(page.locator('#depthValue')).toContainText('35');
    
    // 設計情報パネルの初期値確認
    await expect(page.locator('#templateSize')).toContainText('80×180×35cm');
    await expect(page.locator('#independentCount')).toContainText('0');
    await expect(page.locator('#editMode')).toContainText('テンプレート');
  });

  test('Three.jsの初期化確認', async ({ page }) => {
    await page.goto('/');
    
    // Three.jsライブラリの読み込み確認
    const threeLoaded = await page.evaluate(() => {
      return typeof THREE !== 'undefined';
    });
    expect(threeLoaded).toBe(true);
    
    // WebGLサポートの確認
    const webglSupported = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return gl !== null;
    });
    expect(webglSupported).toBe(true);
    
    // キャンバス要素のサイズ確認（0より大きいことを確認）
    const canvasSize = await page.locator('#canvas').boundingBox();
    expect(canvasSize.width).toBeGreaterThan(0);
    expect(canvasSize.height).toBeGreaterThan(0);
  });

  test('レスポンシブデザインの確認', async ({ page }) => {
    // デスクトップサイズ
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/');
    
    const controlsDesktop = await page.locator('.controls').boundingBox();
    expect(controlsDesktop.width).toBeGreaterThanOrEqual(300); // CSS定義の最小幅
    
    // コンテナのレイアウト確認
    await expect(page.locator('.container')).toHaveCSS('display', 'flex');
  });
});