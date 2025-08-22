const { test, expect } = require('@playwright/test');

test.describe('テンプレート操作機能', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // アプリケーションの初期化を待つ
    await page.waitForSelector('#canvas', { state: 'visible' });
    await page.waitForTimeout(1000); // Three.jsの初期化待ち
  });

  test('幅スライダー操作テスト', async ({ page }) => {
    const widthSlider = page.locator('#widthSlider');
    const widthValue = page.locator('#widthValue');
    const templateSize = page.locator('#templateSize');

    // 初期値確認
    await expect(widthValue).toContainText('80');

    // スライダーを150に設定
    await widthSlider.fill('150');
    
    // 値の更新確認
    await expect(widthValue).toContainText('150');
    await expect(templateSize).toContainText('150×180×35cm');

    // スライダーを50に設定
    await widthSlider.fill('50');
    
    // 値の更新確認
    await expect(widthValue).toContainText('50');
    await expect(templateSize).toContainText('50×180×35cm');
  });

  test('高さスライダー操作テスト', async ({ page }) => {
    const heightSlider = page.locator('#heightSlider');
    const heightValue = page.locator('#heightValue');
    const templateSize = page.locator('#templateSize');

    // 初期値確認
    await expect(heightValue).toContainText('180');

    // スライダーを200に設定
    await heightSlider.fill('200');
    
    // 値の更新確認
    await expect(heightValue).toContainText('200');
    await expect(templateSize).toContainText('80×200×35cm');

    // スライダーを100に設定
    await heightSlider.fill('100');
    
    // 値の更新確認
    await expect(heightValue).toContainText('100');
    await expect(templateSize).toContainText('80×100×35cm');
  });

  test('奥行きスライダー操作テスト', async ({ page }) => {
    const depthSlider = page.locator('#depthSlider');
    const depthValue = page.locator('#depthValue');
    const templateSize = page.locator('#templateSize');

    // 初期値確認
    await expect(depthValue).toContainText('35');

    // スライダーを50に設定
    await depthSlider.fill('50');
    
    // 値の更新確認
    await expect(depthValue).toContainText('50');
    await expect(templateSize).toContainText('80×180×50cm');

    // スライダーを25に設定
    await depthSlider.fill('25');
    
    // 値の更新確認
    await expect(depthValue).toContainText('25');
    await expect(templateSize).toContainText('80×180×25cm');
  });

  test('複数スライダー同時操作テスト', async ({ page }) => {
    const widthSlider = page.locator('#widthSlider');
    const heightSlider = page.locator('#heightSlider');
    const depthSlider = page.locator('#depthSlider');
    const templateSize = page.locator('#templateSize');

    // 複数のスライダーを同時に変更
    await widthSlider.fill('120');
    await heightSlider.fill('160');
    await depthSlider.fill('40');

    // 最終的な値の確認
    await expect(templateSize).toContainText('120×160×40cm');
  });

  test('構成板チェックボックス操作テスト', async ({ page }) => {
    // 天板の切り替え
    const topEnabled = page.locator('#topEnabled');
    await expect(topEnabled).toBeChecked();
    
    await topEnabled.uncheck();
    await expect(topEnabled).not.toBeChecked();
    
    await topEnabled.check();
    await expect(topEnabled).toBeChecked();

    // 底板の切り替え
    const bottomEnabled = page.locator('#bottomEnabled');
    await expect(bottomEnabled).toBeChecked();
    
    await bottomEnabled.uncheck();
    await expect(bottomEnabled).not.toBeChecked();
    
    await bottomEnabled.check();
    await expect(bottomEnabled).toBeChecked();

    // 左側板の切り替え
    const leftEnabled = page.locator('#leftEnabled');
    await expect(leftEnabled).toBeChecked();
    
    await leftEnabled.uncheck();
    await expect(leftEnabled).not.toBeChecked();
    
    await leftEnabled.check();
    await expect(leftEnabled).toBeChecked();

    // 右側板の切り替え
    const rightEnabled = page.locator('#rightEnabled');
    await expect(rightEnabled).toBeChecked();
    
    await rightEnabled.uncheck();
    await expect(rightEnabled).not.toBeChecked();
    
    await rightEnabled.check();
    await expect(rightEnabled).toBeChecked();

    // 背板の切り替え
    const backEnabled = page.locator('#backEnabled');
    await expect(backEnabled).toBeChecked();
    
    await backEnabled.uncheck();
    await expect(backEnabled).not.toBeChecked();
    
    await backEnabled.check();
    await expect(backEnabled).toBeChecked();
  });

  test('全構成板無効化・有効化テスト', async ({ page }) => {
    const checkboxes = [
      page.locator('#topEnabled'),
      page.locator('#bottomEnabled'),
      page.locator('#leftEnabled'),
      page.locator('#rightEnabled'),
      page.locator('#backEnabled')
    ];

    // 全て無効化
    for (const checkbox of checkboxes) {
      await checkbox.uncheck();
      await expect(checkbox).not.toBeChecked();
    }

    // 少し待って3D描画の更新を確認
    await page.waitForTimeout(500);

    // 全て有効化
    for (const checkbox of checkboxes) {
      await checkbox.check();
      await expect(checkbox).toBeChecked();
    }

    await page.waitForTimeout(500);
  });

  test('初期状態に戻すボタンテスト', async ({ page }) => {
    // 値を変更
    await page.locator('#widthSlider').fill('150');
    await page.locator('#heightSlider').fill('200');
    await page.locator('#depthSlider').fill('50');
    await page.locator('#topEnabled').uncheck();
    
    // 変更された値を確認
    await expect(page.locator('#widthValue')).toContainText('150');
    await expect(page.locator('#heightValue')).toContainText('200');
    await expect(page.locator('#depthValue')).toContainText('50');
    await expect(page.locator('#topEnabled')).not.toBeChecked();
    
    // 初期状態に戻すボタンをクリック
    await page.locator('#resetTemplate').click();
    
    // 初期値に戻ったことを確認
    await expect(page.locator('#widthValue')).toContainText('80');
    await expect(page.locator('#heightValue')).toContainText('180');
    await expect(page.locator('#depthValue')).toContainText('35');
    await expect(page.locator('#topEnabled')).toBeChecked();
    await expect(page.locator('#templateSize')).toContainText('80×180×35cm');
  });

  test('人物表示切替テスト', async ({ page }) => {
    const humanToggle = page.locator('#toggleHuman');
    
    // 初期状態は非表示
    await expect(humanToggle).not.toBeChecked();
    
    // 人物表示をON
    await humanToggle.check();
    await expect(humanToggle).toBeChecked();
    
    // 人物表示をOFF
    await humanToggle.uncheck();
    await expect(humanToggle).not.toBeChecked();
  });
});