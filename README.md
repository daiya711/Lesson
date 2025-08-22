# 収納棚設計・デザインプラットフォーム

## 概要
誰でも簡単に収納棚を3D設計できるWebアプリケーションです。
直感的な操作で理想の収納棚をデザインし、DIYや工務店への依頼に活用できます。

## 主な機能
- 🎯 3Dリアルタイム設計・編集
- 📦 収納シミュレーション（本・CD・衣類等）
- 📏 推奨寸法・構造チェック
- 🎨 材料・仕上げ選択
- 📋 設計データ・図面出力
- ☁️ クラウドデータベース保存・共有
- 🗄️ 設計履歴管理・復元機能

## 操作方法
- **シングルクリック**: 箱全体選択・上下左右移動・サイズ調整
- **ダブルクリック**: 個別板選択・個別サイズ調整
- **ドラッグ**: 直感的な3D操作
- **Delete**: 選択板を削除

## ドキュメント体系
- [要求仕様書](docs/requirements.md) - ビジネス要求・機能要求・開発優先度
- [技術仕様書](docs/specification.md) - 機能要件FR001-FR009・API設計・受け入れテスト
- [設計仕様書](docs/design.md) - 3層アーキテクチャ・6コンポーネント設計・実装詳細
- [実装計画書](docs/implementation-plan.md) - 12週間フェーズ別開発ロードマップ・リソース配分・リスク管理
- [キャンバス表示問題修正レポート](docs/fix-canvas-display-issues.md) - UIManager構文エラー等の重要バグ修正詳細
- [機能改善レポート](docs/feature-improvements-2025-01-21.md) - 個別板モード削除・垂直板向き修正・構成板復活機能修正
- [ブラウザアクセス手順書](docs/browser-access-guide.md) - 各種アクセス方法・動作確認・トラブルシューティング

## 技術構成
- **フロントエンド**: Three.js, HTML5, CSS3, JavaScript
- **3Dエンジン**: Three.js WebGL
- **UI**: レスポンシブデザイン
- **バックエンド**: Hono Framework
- **データベース**: Cloudflare D1 (SQLite)
- **ホスティング**: Cloudflare Pages + Functions
- **テスト**: Playwright (E2E), Vitest (Unit)

## 開発環境

### 環境構築
```bash
# 依存関係インストール
npm install

# D1 データベース作成
npm run d1:create

# データベースマイグレーション実行
npm run d1:migrate

# 開発サーバー起動
npm run dev
```

### 本番デプロイ
```bash
# Cloudflare Pages にデプロイ
npm run deploy
```

### テスト実行
```bash
# E2Eテスト（Playwright）
npm run test
npm run test:ui        # UIモード
npm run test:debug     # デバッグモード

# ユニットテスト（Vitest）
npm run test:unit      # ユニットテスト実行
npm run test:unit:ui   # UIモード
npm run test:unit:watch # ウォッチモード
```

### ローカル動作確認
```bash
# Python簡易サーバー（推奨）
cd public
python3 -m http.server 8000
# http://localhost:8000 でアクセス

# または Cloudflare Pages開発サーバー
npx wrangler pages dev public --local
# http://localhost:8788 でアクセス
```

詳細は[ブラウザアクセス手順書](docs/browser-access-guide.md)を参照

## ブラウザ対応
- Chrome（推奨）
- Firefox
- Safari
- Edge
- WebGL対応端末

## 🔄 最新修正状況（2025/01/21）
**重要バグ修正完了** - キャンバス表示問題解決
- ✅ UIManager構文エラー修正（アプリ起動ブロッカー解除）
- ✅ EventManager背景クリック修正（選択解除機能復活）  
- ✅ :has()セレクタ置換（ブラウザ互換性向上）
- ✅ 単位統一修正（mm→cm、計算精度向上）
- ✅ 画像エクスポート時カメラアスペクト修正

**機能改善完了** - 使いやすさ・安定性向上
- ✅ 個別板モード切替機能削除（UIシンプル化）
- ✅ 垂直板向き修正（横向き→縦向き表示）
- ✅ 構成板復活機能修正（有効/無効切替安定化）

**動作確認済み**: アプリ正常起動、3D表示、UI操作、全機能動作  
詳細: [バグ修正レポート](docs/fix-canvas-display-issues.md) | [機能改善レポート](docs/feature-improvements-2025-01-21.md)

## 🧪 テスト実装状況（2025/08/22）
**ユニットテスト導入完了** - データ変換関数の信頼性向上
- ✅ Vitestフレームワーク導入（軽量・高速）
- ✅ データ変換関数純粋関数テスト（14テストケース成功）
- ✅ prepareDesignData関数テスト（保存形式変換）
- ✅ parseDesignData関数テスト（表示形式変換）
- ✅ nullチェックバグ発見・修正
- ✅ ラウンドトリップテスト（保存→読込の整合性）
詳細: [ユニットテスト戦略](docs/unit-testing-strategy.md)

## デプロイメント

### Cloudflare Pages
このプロジェクトはCloudflare Pagesでホスティングされています。

**デプロイ設定**:
- **ブランチ**: `feature/enhancement`
- **ビルドコマンド**: なし（静的サイト）
- **出力ディレクトリ**: `/`（ルート）
- **自動最適化**: 有効

**アクセス方法**:
- デプロイ後に提供される`https://プロジェクト名.pages.dev`でアクセス可能
- Cloudflare CDNによる高速配信

## ライセンス
MIT License

---
*収納の悩みを3Dで解決するプラットフォーム*