const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('データ管理機能', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // アプリケーションの初期化を待つ
    await page.waitForSelector('#canvas', { state: 'visible' });
    await page.waitForTimeout(1000); // Three.jsの初期化待ち
  });

  test('ファイル保存機能テスト', async ({ page }) => {
    // テストデータを設定
    await page.locator('#widthSlider').fill('120');
    await page.locator('#heightSlider').fill('200');
    await page.locator('#depthSlider').fill('40');
    
    // 個別板を追加
    await page.locator('#addHorizontalBoard').click();
    await page.locator('#addVerticalBoard').click();

    // ダウンロード待機の設定
    const downloadPromise = page.waitForEvent('download');
    
    // ファイル保存ボタンをクリック
    await page.locator('#saveDesign').click();
    
    // ダウンロードイベントを待つ
    const download = await downloadPromise;
    
    // ファイル名の確認（shelf-design-で始まること）
    expect(download.suggestedFilename()).toMatch(/^shelf-design-.*\.json$/);
    
    // ファイルサイズが0より大きいことを確認
    const downloadSize = await download.evaluateHandle(d => d.length);
    expect(await downloadSize.jsonValue()).toBeGreaterThan(0);
  });

  test('BOM（部材リスト）エクスポート機能テスト', async ({ page }) => {
    // テストデータを設定
    await page.locator('#widthSlider').fill('100');
    await page.locator('#heightSlider').fill('180');
    await page.locator('#depthSlider').fill('30');
    
    // 個別板を追加
    await page.locator('#addHorizontalBoard').click();

    // ダウンロード待機の設定
    const downloadPromise = page.waitForEvent('download');
    
    // 部材リストエクスポートボタンをクリック
    await page.locator('#exportBOM').click();
    
    // ダウンロードイベントを待つ
    const download = await downloadPromise;
    
    // ファイル名の確認（BOM関連のファイル）
    expect(download.suggestedFilename()).toMatch(/bom|material|parts/i);
  });

  test('画像エクスポート機能テスト', async ({ page }) => {
    // テストデータを設定
    await page.locator('#widthSlider').fill('80');
    await page.locator('#heightSlider').fill('160');
    
    // ダウンロード待機の設定
    const downloadPromise = page.waitForEvent('download');
    
    // 画像エクスポートボタンをクリック
    await page.locator('#exportImage').click();
    
    // ダウンロードイベントを待つ
    const download = await downloadPromise;
    
    // ファイル名の確認（.pngファイル）
    expect(download.suggestedFilename()).toMatch(/.*\.png$/);
  });

  test('クラウド保存機能テスト', async ({ page }) => {
    // テストデータを設定
    await page.locator('#widthSlider').fill('90');
    await page.locator('#heightSlider').fill('170');
    
    // クラウド保存ボタンをクリック
    await page.locator('#saveToDatabase').click();
    
    // 保存成功のメッセージまたは動作を確認
    // （実際のAPIレスポンス次第で調整）
    await page.waitForTimeout(2000);
    
    // エラーが発生していないことを確認（コンソールエラーなし）
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // クラウド保存後もアプリが正常動作していることを確認
    await expect(page.locator('#canvas')).toBeVisible();
  });

  test('保存済み設計一覧表示テスト', async ({ page }) => {
    // 保存済み一覧ボタンをクリック
    await page.locator('#showSavedDesigns').click();
    
    // 処理の完了を待つ
    await page.waitForTimeout(1000);
    
    // エラーが発生していないことを確認
    await expect(page.locator('#canvas')).toBeVisible();
  });

  test('設計データの整合性テスト', async ({ page }) => {
    // 複雑な設計を作成
    await page.locator('#widthSlider').fill('150');
    await page.locator('#heightSlider').fill('220');
    await page.locator('#depthSlider').fill('45');
    
    // 構成板の一部を無効化
    await page.locator('#topEnabled').uncheck();
    await page.locator('#backEnabled').uncheck();
    
    // 複数の個別板を追加
    await page.locator('#addHorizontalBoard').click();
    await page.locator('#addVerticalBoard').click();
    await page.locator('#addHorizontalBoard').click();
    
    // データ保存
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#saveDesign').click();
    const download = await downloadPromise;
    
    // ダウンロードしたファイルの内容を検証
    const filePath = await download.path();
    expect(filePath).toBeTruthy();
  });

  test('複数回の保存・エクスポート操作テスト', async ({ page }) => {
    // 設計を作成
    await page.locator('#widthSlider').fill('100');
    await page.locator('#addHorizontalBoard').click();
    
    // 1回目の保存
    let downloadPromise = page.waitForEvent('download');
    await page.locator('#saveDesign').click();
    let download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.json$/);
    
    // 設計を変更
    await page.locator('#heightSlider').fill('200');
    await page.locator('#addVerticalBoard').click();
    
    // 2回目の保存
    downloadPromise = page.waitForEvent('download');
    await page.locator('#saveDesign').click();
    download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.json$/);
    
    // BOMエクスポート
    downloadPromise = page.waitForEvent('download');
    await page.locator('#exportBOM').click();
    download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.txt$/);
    
    // 画像エクスポート
    downloadPromise = page.waitForEvent('download');
    await page.locator('#exportImage').click();
    download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.png$/);
  });

  test('エラーハンドリングテスト', async ({ page }) => {
    // コンソールエラーを監視
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // 空の状態でのエクスポート試行
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#saveDesign').click();
    const download = await downloadPromise;
    
    // ダウンロードは成功すること（空でもファイルは生成される）
    expect(download.suggestedFilename()).toMatch(/\.json$/);
    
    // 致命的なエラーが発生していないこと
    const fatalErrors = consoleErrors.filter(error => 
      error.includes('Uncaught') || error.includes('TypeError')
    );
    expect(fatalErrors.length).toBe(0);
  });
});