const { test, expect } = require('@playwright/test');

test.describe('個別板操作機能', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // アプリケーションの初期化を待つ
    await page.waitForSelector('#canvas', { state: 'visible' });
    await page.waitForTimeout(1000); // Three.jsの初期化待ち
  });

  test('水平板追加テスト', async ({ page }) => {
    const addHorizontalBtn = page.locator('#addHorizontalBoard');
    const independentCount = page.locator('#independentCount');
    const independentBoardsList = page.locator('#independentBoardsList');

    // 初期状態確認
    await expect(independentCount).toContainText('0');

    // 水平板を追加
    await addHorizontalBtn.click();
    
    // カウント更新確認
    await expect(independentCount).toContainText('1');
    
    // リストに追加されたことを確認
    const boardItems = independentBoardsList.locator('.shelf-item');
    await expect(boardItems).toHaveCount(1);

    // もう一枚追加
    await addHorizontalBtn.click();
    await expect(independentCount).toContainText('2');
    await expect(boardItems).toHaveCount(2);
  });

  test('垂直板追加テスト', async ({ page }) => {
    const addVerticalBtn = page.locator('#addVerticalBoard');
    const independentCount = page.locator('#independentCount');
    const independentBoardsList = page.locator('#independentBoardsList');

    // 初期状態確認
    await expect(independentCount).toContainText('0');

    // 垂直板を追加
    await addVerticalBtn.click();
    
    // カウント更新確認
    await expect(independentCount).toContainText('1');
    
    // リストに追加されたことを確認
    const boardItems = independentBoardsList.locator('.shelf-item');
    await expect(boardItems).toHaveCount(1);

    // もう一枚追加
    await addVerticalBtn.click();
    await expect(independentCount).toContainText('2');
    await expect(boardItems).toHaveCount(2);
  });

  test('水平板と垂直板の混在追加テスト', async ({ page }) => {
    const addHorizontalBtn = page.locator('#addHorizontalBoard');
    const addVerticalBtn = page.locator('#addVerticalBoard');
    const independentCount = page.locator('#independentCount');
    const independentBoardsList = page.locator('#independentBoardsList');

    // 水平板を2枚追加
    await addHorizontalBtn.click();
    await addHorizontalBtn.click();
    await expect(independentCount).toContainText('2');

    // 垂直板を1枚追加
    await addVerticalBtn.click();
    await expect(independentCount).toContainText('3');

    // 最終的に3枚の板がリストにあることを確認
    const boardItems = independentBoardsList.locator('.shelf-item');
    await expect(boardItems).toHaveCount(3);
  });

  test('個別板削除テスト', async ({ page }) => {
    const addHorizontalBtn = page.locator('#addHorizontalBoard');
    const independentCount = page.locator('#independentCount');
    const independentBoardsList = page.locator('#independentBoardsList');

    // 複数の板を追加
    await addHorizontalBtn.click();
    await addHorizontalBtn.click();
    await addHorizontalBtn.click();
    await expect(independentCount).toContainText('3');

    // 最初の板の削除ボタンをクリック
    const firstBoardDeleteBtn = independentBoardsList.locator('.shelf-item').first().locator('.remove-btn');
    await firstBoardDeleteBtn.click();

    // カウントが減ったことを確認
    await expect(independentCount).toContainText('2');
    
    // 板の数が減ったことを確認
    const boardItems = independentBoardsList.locator('.shelf-item');
    await expect(boardItems).toHaveCount(2);

    // もう一つ削除
    const secondBoardDeleteBtn = independentBoardsList.locator('.shelf-item').first().locator('.remove-btn');
    await secondBoardDeleteBtn.click();
    
    await expect(independentCount).toContainText('1');
    await expect(boardItems).toHaveCount(1);

    // 最後の一つも削除
    const lastBoardDeleteBtn = independentBoardsList.locator('.shelf-item').first().locator('.remove-btn');
    await lastBoardDeleteBtn.click();
    
    await expect(independentCount).toContainText('0');
    await expect(boardItems).toHaveCount(0);
  });

  test('個別板サイズ調整テスト', async ({ page }) => {
    const addHorizontalBtn = page.locator('#addHorizontalBoard');
    const independentBoardsList = page.locator('#independentBoardsList');

    // 水平板を1枚追加
    await addHorizontalBtn.click();

    // 追加された板をダブルクリックして編集モードに
    const firstBoard = independentBoardsList.locator('.shelf-item').first();
    await firstBoard.dblclick();

    // 編集モードの確認（編集パネルが表示される）
    const editMode = page.locator('#editMode');
    await expect(editMode).toContainText('個別板', { timeout: 2000 });

    // 個別板編集パネルが表示されることを確認
    const individualBoardPanel = page.locator('#individualBoardPanel');
    await expect(individualBoardPanel).toBeVisible();
  });

  test('編集モード切替テスト', async ({ page }) => {
    const addHorizontalBtn = page.locator('#addHorizontalBoard');
    const editMode = page.locator('#editMode');

    // 初期状態はテンプレートモード
    await expect(editMode).toContainText('テンプレート');

    // 個別板を追加
    await addHorizontalBtn.click();

    // テンプレート領域をクリックしてテンプレートモードに戻る
    const canvas = page.locator('#canvas');
    await canvas.click();

    // まだテンプレートモードのままであることを確認
    await expect(editMode).toContainText('テンプレート');
  });

  test('個別板の向き変更テスト', async ({ page }) => {
    const addHorizontalBtn = page.locator('#addHorizontalBoard');
    const independentBoardsList = page.locator('#independentBoardsList');

    // 水平板を1枚追加
    await addHorizontalBtn.click();

    // 板をダブルクリックして編集モードに
    const firstBoard = independentBoardsList.locator('.shelf-item').first();
    await firstBoard.dblclick();

    // 個別板編集パネルが表示されるまで待つ
    const individualBoardPanel = page.locator('#individualBoardPanel');
    await expect(individualBoardPanel).toBeVisible();

    // 垂直ボタンが存在することを確認
    const setVerticalBtn = page.locator('#setVertical');
    await expect(setVerticalBtn).toBeVisible();

    // 水平ボタンが存在することを確認
    const setHorizontalBtn = page.locator('#setHorizontal');
    await expect(setHorizontalBtn).toBeVisible();

    // 向きを垂直に変更
    await setVerticalBtn.click();
    
    // 回転入力フィールドも確認
    const rotationInput = page.locator('#boardRotation');
    await expect(rotationInput).toBeVisible();
    await rotationInput.fill('90');
  });

  test('大量の個別板追加・削除ストレステスト', async ({ page }) => {
    const addHorizontalBtn = page.locator('#addHorizontalBoard');
    const addVerticalBtn = page.locator('#addVerticalBoard');
    const independentCount = page.locator('#independentCount');
    const independentBoardsList = page.locator('#independentBoardsList');

    // 10枚の板を追加
    for (let i = 0; i < 5; i++) {
      await addHorizontalBtn.click();
      await addVerticalBtn.click();
    }

    // カウントが正しいことを確認
    await expect(independentCount).toContainText('10');

    // リストの板数を確認
    const boardItems = independentBoardsList.locator('.shelf-item');
    await expect(boardItems).toHaveCount(10);

    // 全部削除
    for (let i = 0; i < 10; i++) {
      const deleteBtn = independentBoardsList.locator('.shelf-item').first().locator('.remove-btn');
      await deleteBtn.click();
      // 少し待つことでUIの更新を確実にする
      await page.waitForTimeout(100);
    }

    // すべて削除されたことを確認
    await expect(independentCount).toContainText('0');
    await expect(boardItems).toHaveCount(0);
  });
});