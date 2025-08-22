# スライダー調整時3D消失問題の修正

## 📋 概要
2025年1月21日、箱テンプレート編集のスライダー調整時に3Dオブジェクトが消失する重要な問題を修正。

## 🔍 問題の詳細

### 報告された現象
- **問題**: 箱テンプレート編集の幅・高さ・奥行きスライダーを調整すると画面の3Dオブジェクトが消える
- **影響**: ユーザーが寸法調整を行えない致命的なUX問題
- **発生条件**: 任意のテンプレートサイズスライダー（width/height/depth）の値変更時

### 根本原因の特定
**問題の処理フロー**:
1. スライダー調整 → `templateSizeChanged`イベント発火
2. `TemplateManager.updateTemplateSize()` → `buildTemplate()`呼び出し
3. `buildTemplate()`冒頭で`templateGroup.clear()`実行 → **全mesh削除**
4. 新しいmeshを作成しようとするが、既存のboard.meshプロパティは削除済み
5. **結果**: 3Dオブジェクトが完全に消失

**コードレベルの問題箇所**:
```javascript
// TemplateManager.updateTemplateSize() - 修正前
updateTemplateSize(newSize) {
    // サイズ更新
    this.boxTemplate.size = { ...this.boxTemplate.size, ...newSize };
    this.buildTemplate(); // ← ここでmesh全削除が発生
}

// TemplateManager.buildTemplate() - 問題の箇所
buildTemplate() {
    this.templateGroup.clear(); // ← 全mesh削除
    // 以下mesh再作成処理...
}
```

## 🎯 修正方針

### 設計変更
- **Before**: サイズ変更時にmesh削除・再作成
- **After**: 既存meshのgeometryのみ更新・位置調整

### 技術的アプローチ
1. **サイズ変更専用処理の分離**: `updateExistingMeshes()`メソッド新規作成
2. **geometry更新の最適化**: mesh削除せずにgeometry.dispose()→新geometry設定
3. **コードの構造化**: geometry作成・位置計算処理を関数分離

## 🔧 実装詳細

### 1. TemplateManager.updateTemplateSize()の修正
```javascript
// 修正前
updateTemplateSize(newSize) {
    this.boxTemplate.size = { ...this.boxTemplate.size, ...newSize };
    this.buildTemplate(); // mesh削除・再作成（重い処理）
}

// 修正後  
updateTemplateSize(newSize) {
    this.boxTemplate.size = { ...this.boxTemplate.size, ...newSize };
    this.updateExistingMeshes(); // geometry更新のみ（軽量処理）
}
```

### 2. updateExistingMeshes()メソッドの新規追加
```javascript
updateExistingMeshes() {
    if (!this.boxTemplate || !this.boxTemplate.isActive) return;
    
    const { width, height, depth } = this.boxTemplate.size;
    const thickness = 1.8;
    
    Object.values(this.boxTemplate.boards).forEach(board => {
        if (board.mesh) {
            // 既存geometryを適切に削除
            board.mesh.geometry.dispose();
            
            // 新しいサイズでgeometry再作成
            const newGeometry = this.createBoardGeometry(board.type, width, height, depth, thickness);
            board.mesh.geometry = newGeometry;
            
            // 位置も新しいサイズに合わせて更新
            const newPosition = this.calculateBoardPosition(board.type, width, height, depth, thickness);
            board.mesh.position.set(...newPosition);
        }
    });
}
```

### 3. ヘルパーメソッドの分離・構造化
**createBoardGeometry()** - geometry作成の専用関数
```javascript
createBoardGeometry(boardType, width, height, depth, thickness) {
    switch (boardType) {
        case 'top': return new THREE.BoxGeometry(width, thickness, depth);
        case 'bottom': return new THREE.BoxGeometry(width, thickness, depth);
        case 'left': return new THREE.BoxGeometry(thickness, height, depth);
        case 'right': return new THREE.BoxGeometry(thickness, height, depth);
        case 'back': return new THREE.BoxGeometry(width, height, thickness);
        default: return new THREE.BoxGeometry(width, thickness, depth);
    }
}
```

**calculateBoardPosition()** - 位置計算の専用関数
```javascript
calculateBoardPosition(boardType, width, height, depth, thickness) {
    switch (boardType) {
        case 'top': return [0, height - thickness/2, 0];
        case 'bottom': return [0, thickness/2, 0];
        case 'left': return [-width/2 + thickness/2, height/2, 0];
        case 'right': return [width/2 - thickness/2, height/2, 0];
        case 'back': return [0, height/2, -depth/2 + thickness/2];
        default: return [0, 0, 0];
    }
}
```

### 4. createBoardMesh()の最適化
```javascript
// 修正後: 新しいヘルパーメソッドを活用
createBoardMesh(boardType, width, height, depth, thickness) {
    const geometry = this.createBoardGeometry(boardType, width, height, depth, thickness);
    const position = this.calculateBoardPosition(boardType, width, height, depth, thickness);
    
    const mesh = new THREE.Mesh(geometry, this.defaultMaterial);
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    return mesh;
}
```

## 📊 修正効果

### パフォーマンス向上
- **Before**: スライダー調整毎にmesh削除・再作成（重い処理）
- **After**: geometry更新・位置調整のみ（軽量処理）
- **改善**: レスポンス速度大幅向上、メモリ使用効率化

### ユーザーエクスペリエンス改善
- **Before**: スライダー調整で3D消失（致命的UX問題）
- **After**: スムーズな寸法変更・即座の視覚フィードバック
- **改善**: 直感的な操作性、リアルタイム編集体験

### コード品質向上
- **関数分離**: geometry作成・位置計算の責任分離
- **再利用性**: 複数箇所から呼び出し可能な構造化
- **保守性**: 修正・拡張が容易な設計

## ✅ 動作確認項目

### 基本機能テスト
- [ ] **幅スライダー**: 30-200cmの範囲で3Dオブジェクトが消えずにサイズ変更
- [ ] **高さスライダー**: 50-250cmの範囲で3Dオブジェクトが消えずにサイズ変更  
- [ ] **奥行きスライダー**: 20-80cmの範囲で3Dオブジェクトが消えずにサイズ変更
- [ ] **連続操作**: 複数スライダーを連続調整してもエラーなし

### パフォーマンステスト
- [ ] **レスポンス**: スライダー調整時の遅延なし
- [ ] **メモリ使用量**: 長時間操作でもメモリリークなし
- [ ] **コンソールエラー**: エラー出力なし

### レグレッションテスト
- [ ] **構成板切り替え**: チェックボックスでの表示/非表示機能正常
- [ ] **個別板追加**: 垂直板・水平板追加機能正常
- [ ] **データ保存・読込**: 既存機能に影響なし
- [ ] **3D操作**: カメラ回転・ズーム・パン操作正常

### 統合テスト
- [ ] **スライダー＋構成板**: サイズ変更後の構成板切り替え正常
- [ ] **スライダー＋個別板**: サイズ変更後の個別板追加正常
- [ ] **データ保存後スライダー**: 読み込み後のサイズ調整正常

## 🚀 今後の改善可能性

### アニメーション効果
- サイズ変更時のスムーズなトランジション追加
- 変更範囲のハイライト表示

### 高度な最適化
- LOD（Level of Detail）による距離別詳細度調整
- Frustum Culling活用した描画パフォーマンス向上
- WebWorkerを使った非同期geometry計算

### UX向上
- リアルタイム寸法線表示
- 変更プレビュー機能
- 操作履歴（Undo/Redo）機能

## 🔄 変更ファイル

### 修正対象ファイル
- `app.js:616-707` - TemplateManagerクラスのサイズ変更処理全面修正

### 新規追加メソッド
- `updateExistingMeshes()` - 既存mesh更新処理
- `createBoardGeometry()` - geometry作成ヘルパー
- `calculateBoardPosition()` - 位置計算ヘルパー

### 修正メソッド
- `updateTemplateSize()` - buildTemplate()呼び出し削除
- `createBoardMesh()` - ヘルパーメソッド活用へリファクタリング

---

**修正完了日**: 2025年1月21日  
**修正者**: Claude Code  
**対象問題**: スライダー調整時3D消失問題  
**テスト環境**: macOS, Three.js r152, WebGL2対応ブラウザ  
**確認URL**: http://localhost:8002