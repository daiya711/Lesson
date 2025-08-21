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
- [ブラウザアクセス手順書](docs/browser-access-guide.md) - 各種アクセス方法・動作確認・トラブルシューティング

## 技術構成
- **フロントエンド**: Three.js, HTML5, CSS3, JavaScript
- **3Dエンジン**: Three.js WebGL
- **UI**: レスポンシブデザイン
- **バックエンド**: Hono Framework
- **データベース**: Cloudflare D1 (SQLite)
- **ホスティング**: Cloudflare Pages + Functions

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

**動作確認済み**: アプリ正常起動、3D表示、UI操作、全機能動作  
詳細: [修正レポート](docs/fix-canvas-display-issues.md)

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