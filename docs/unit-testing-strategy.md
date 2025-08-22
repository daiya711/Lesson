# ユニットテスト実装戦略

## 概要
収納棚設計プラットフォームにおいて、「壊れて欲しくない純粋関数を最小単位でテストする」方針に基づき、データ変換関数のユニットテスト実装を行いました。

## 実装背景

### 課題
- データ構造の保存・読み込み処理でバグが発生するリスク
- リファクタリング時の安全性確保
- 複雑なE2Eテストでは発見困難な細かいロジックエラー

### 解決アプローチ
- 純粋関数（同じ入力に対して同じ出力）に焦点を絞る
- 軽量で高速なVitestフレームワーク採用
- データ変換の核となる関数を独立モジュール化

## テスト対象関数

### 1. prepareDesignData関数
**目的**: テンプレートデータと個別板データを保存用JSON形式に変換

**場所**: `src/utils/data-converters.js`

**機能**:
```javascript
prepareDesignData(templateData, boardsData) → {
  version: "1.0",
  metadata: { title, createdAt, platform },
  template: templateData,
  boards: boardsData,
  settings: { units, material, thickness }
}
```

### 2. parseDesignData関数  
**目的**: 保存されたJSONデータを表示用オブジェクトに変換

**場所**: `src/utils/data-converters.js`

**機能**:
```javascript
parseDesignData(designData) → {
  template: templateData || null,
  boards: boardsData || [],
  metadata: metadata || {},
  settings: settings || {}
}
```

## テスト実装詳細

### テストファイル構成
```
tests/unit/
├── data-converters.test.js     # メインテストファイル
└── fixtures/                   # テストデータ
    ├── template-data.js        # テンプレートデータ
    ├── boards-data.js          # 個別板データ  
    └── expected-outputs.js     # 期待値データ
```

### テストケース設計（14ケース）

#### prepareDesignData関数（5ケース）
1. **正常データ変換**: 完全なテンプレート・個別板データの変換確認
2. **空データ処理**: 空配列・空オブジェクトでの構造維持確認
3. **null/undefined処理**: 例外が発生しないことを確認
4. **非配列データ処理**: 個別板が配列でない場合の処理確認
5. **構造一貫性**: 常に同じ形式のオブジェクト構造を返すことを確認

#### parseDesignData関数（7ケース）
1. **JSON文字列パース**: 文字列からオブジェクトへの正常変換
2. **オブジェクト処理**: 既にオブジェクト形式のデータの正規化
3. **不正JSON処理**: パースエラー時のnull返却確認
4. **不完全データ処理**: 欠損プロパティのデフォルト値設定確認
5. **null/undefined処理**: 適切なデフォルト値返却確認
6. **空オブジェクト処理**: {}に対するデフォルト値設定確認
7. **部分欠損処理**: 一部プロパティが欠損した場合の処理確認

#### 相互運用性テスト（2ケース）
1. **ラウンドトリップ**: 保存→読み込みでデータが正しく復元されるか
2. **空データラウンドトリップ**: 空データでのラウンドトリップ確認

## 発見・修正したバグ

### nullチェック不備
**問題**: `parseDesignData`関数でnull値を渡すと`Cannot read properties of null`エラー

**修正前**:
```javascript
return {
    template: designData.template || null,  // designDataがnullだとエラー
    // ...
};
```

**修正後**:
```javascript
// nullやundefinedの場合はデフォルト値を返す
if (!designData || typeof designData !== 'object') {
    return {
        template: null,
        boards: [],
        metadata: {},
        settings: {}
    };
}
```

**影響**: データ読み込み失敗時のアプリクラッシュを防止

## テスト環境・実行方法

### フレームワーク
- **Vitest**: 軽量・高速なJavaScriptテストフレームワーク
- **設定ファイル**: `vitest.config.js`

### 実行コマンド
```bash
npm run test:unit         # 全ユニットテスト実行
npm run test:unit:watch   # ウォッチモード
npm run test:unit:ui      # UIモード（将来対応）
```

### テスト結果
```
✓ 14 tests passed
Duration: 197ms
```

## モジュール分離による設計改善

### 変更前
- `src/api/client.js`内にデータ変換ロジックが混在
- テストが困難な構造

### 変更後
- `src/utils/data-converters.js`として純粋関数を分離
- `src/api/client.js`は分離した関数をimportして使用
- テスト可能な構造に改善

## 今後の拡張方針

### 追加予定のユニットテスト
1. **構造安全性チェック関数**: `StructureChecker`クラスの計算ロジック
2. **材料計算関数**: 重量・コスト・材料使用量計算
3. **3D座標変換関数**: 板の配置・回転計算ロジック
4. **データ検証関数**: 入力値のバリデーション処理

### テスト品質向上
- カバレッジレポート導入
- パフォーマンステスト追加
- より複雑なエッジケースの追加

## 効果・メリット

### 開発速度向上
- バグの早期発見（開発時点でキャッチ）
- リファクタリングの安全性確保
- デバッグ時間の短縮

### コード品質向上
- 純粋関数への設計改善圧力
- 関数の責任分離促進
- ドキュメント効果（テストがサンプル実行例となる）

### 保守性向上
- 変更時の影響範囲把握
- 回帰バグの防止
- 新機能追加時の既存機能保護

---

*実装日: 2025年8月22日*  
*テストファイル: tests/unit/data-converters.test.js*  
*対象関数: src/utils/data-converters.js*