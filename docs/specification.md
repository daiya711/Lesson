# 収納棚設計・デザインプラットフォーム 仕様書 (Specification)

## 機能要件（番号付き）

### FR001: 初期テンプレートシステム（Initial Template System）
- FR001-1: アプリ起動時の標準箱モジュールテンプレート自動配置
- FR001-2: テンプレート箱モジュールの全体サイズ調整機能
- FR001-3: テンプレート個別板の有効/無効切替機能
- FR001-4: テンプレートリセット・初期状態復元機能

### FR002: 箱モジュールテンプレート管理（Box Module Template Management）
- FR002-1: 標準箱型テンプレート（天板・底板・左側板・右側板・背板）
- FR002-2: テンプレート全体サイズ調整（幅・高さ・奥行き連動変更）
- FR002-3: テンプレート構成板の選択的有効化/無効化
- FR002-4: テンプレート確定・個別板モード移行機能

### FR003: 個別板追加システム（Independent Board Addition System）
- FR003-1: テンプレート外への水平板（棚板・天板）追加
- FR003-2: テンプレート外への垂直板（側板・背板・仕切り）追加
- FR003-3: 追加板の3D空間自由配置・ドラッグ移動
- FR003-4: 追加板の向き切替（水平⇔垂直）・90度刻み回転

### FR004: ハイブリッド編集システム（Hybrid Editing System）
- FR004-1: テンプレート板と個別板の視覚的区別表示
- FR004-2: テンプレート全体編集モード vs 個別板編集モードの切替
- FR004-3: 統合選択インターフェース（テンプレート・個別板の混在選択）
- FR004-4: テンプレート解除→完全個別板モードへの変換

### FR005: 寸法・材料管理システム（Dimension & Material System）
- FR005-1: センチメートル単位寸法入力・表示・リアルタイム反映
- FR005-2: 板厚プリセット（12mm・15mm・18mm）・カスタム厚み設定
- FR005-3: 材料種別選択（パイン材・合板・MDF・集成材）
- FR005-4: 仕上げ・色選択（無塗装・オイル・ウレタン／ナチュラル・ブラウン・ホワイト）

### FR006: ユーザーインターフェース制御（UI Control System）
- FR006-1: 初期画面：箱テンプレート表示＋編集パネル自動表示
- FR006-2: サイドパネル：テンプレート編集・個別板追加の統合UI
- FR006-3: 選択状態依存パネル切替（テンプレート・個別板・混在）
- FR006-4: 段階的機能開示（シンプル→詳細への自然な流れ）

### FR007: 収納最適化支援（Storage Optimization Support）
- FR007-1: 収納アイテムプリセット（本・CD・A4ファイル・衣類・収納箱）
- FR007-2: アイテム配置シミュレーション・テンプレート/個別板への対応
- FR007-3: 最適棚間隔提案・収納効率計算・デッドスペース検出
- FR007-4: 用途別収納ゾーニング提案（本棚・食器棚・クローゼット等）

### FR008: 構造安全性チェック（Structural Safety Check）
- FR008-1: テンプレート・個別板統合での耐荷重簡易計算
- FR008-2: 構造バランス・転倒リスク評価（テンプレート基準＋追加板考慮）
- FR008-3: 接合部強度チェック・テンプレート⇔個別板接続警告
- FR008-4: 日本住宅環境対応（天井高・地震対策・搬入経路チェック）

### FR009: データ入出力システム（Data I/O System）
- FR009-1: 3面図・アイソメ図出力（テンプレート＋個別板統合表示）
- FR009-2: 部材リスト（BOM）・材料計算（テンプレート/個別板区別）・CSV出力
- FR009-3: 設計データJSON保存・読込（ハイブリッド構造対応）
- FR009-4: 組立説明書・テンプレート組立＋個別板追加手順書生成

## API/入出力/型（API/Input Output/Types）

### 中核データ構造

```typescript
// 箱テンプレートクラス
interface BoxTemplate {
  id: number;
  isActive: boolean; // テンプレートモードで動作中か
  size: { 
    width: number;   // テンプレート全体幅 (cm)
    height: number;  // テンプレート全体高さ (cm) 
    depth: number;   // テンプレート全体奥行き (cm)
  };
  position: { x: number; y: number; z: number }; // 3D空間配置
  boards: TemplateBoard[]; // テンプレート構成板
  material: Material; // テンプレート共通材料設定
  createdAt: Date;
  updatedAt: Date;
}

// テンプレート構成板
interface TemplateBoard {
  id: number;
  type: 'top' | 'bottom' | 'left' | 'right' | 'back'; // 板種別
  templateId: number; // 親テンプレートID
  enabled: boolean; // 有効/無効（無効時は非表示）
  canDetach: boolean; // 個別板として分離可能か
  thickness: number; // 板厚 (mm)
  mesh: THREE.Mesh; // 3D表示メッシュ
  lastModified: Date;
}

// 独立板クラス  
interface IndependentBoard {
  id: number;
  position: { x: number; y: number; z: number }; // 3D空間絶対位置
  dimensions: {
    length: number;    // 主要方向寸法 (cm)
    width: number;     // 副方向寸法 (cm)
    thickness: number; // 板厚 (mm)
  };
  orientation: 'horizontal' | 'vertical'; // 基本向き
  rotation: { x: number; y: number; z: number }; // 回転角度 (度)
  material: Material; // 個別材料設定
  isFromTemplate: boolean; // テンプレートから生成されたか
  parentTemplateId?: number; // 元テンプレートID（分離時）
  enabled: boolean;
  mesh: THREE.Mesh;
  createdAt: Date;
  updatedAt: Date;
}

// 設計管理システム
interface DesignManager {
  // 中核オブジェクト
  boxTemplate: BoxTemplate | null; // 箱テンプレート（初期必須）
  independentBoards: IndependentBoard[]; // 追加個別板
  
  // 選択・編集状態
  selectedObject: BoxTemplate | TemplateBoard | IndependentBoard | null;
  editMode: 'template' | 'individual' | 'mixed'; // 編集モード
  
  // カウンター
  templateBoardCounter: number;
  independentBoardCounter: number;
  
  // テンプレート操作
  createTemplate(size?: Dimensions, position?: Position): BoxTemplate;
  updateTemplateSize(templateId: number, size: Dimensions): void;
  toggleTemplateBoard(templateId: number, boardType: string): void;
  convertTemplateToIndividual(templateId: number): IndependentBoard[];
  
  // 個別板操作
  addIndependentBoard(orientation: 'horizontal' | 'vertical'): IndependentBoard;
  updateIndependentBoard(boardId: number, updates: Partial<IndependentBoard>): void;
  deleteIndependentBoard(boardId: number): boolean;
  
  // 統合操作
  selectObject(object: BoxTemplate | TemplateBoard | IndependentBoard): void;
  getSelectedObjectType(): 'template' | 'templateBoard' | 'independent' | null;
  switchEditMode(mode: 'template' | 'individual' | 'mixed'): void;
}

// 材料定義
interface Material {
  type: 'pine' | 'plywood' | 'mdf' | 'laminated';
  thickness: 12 | 15 | 18; // mm
  finish: 'natural' | 'oil' | 'urethane';
  color: 'natural' | 'brown' | 'white' | 'gray';
  density: number; // kg/m³（重量計算用）
  strength: number; // N/mm²（耐荷重計算用）
  costPerM2: number; // 円/m²（概算コスト用）
}

// 設計データ保存形式
interface DesignData {
  version: string;
  metadata: {
    title: string;
    description: string;
    designType: 'template' | 'individual' | 'hybrid'; // 設計タイプ
    createdAt: Date;
    updatedAt: Date;
    author: string;
  };
  boxTemplate: BoxTemplate | null; // テンプレート情報
  independentBoards: IndependentBoard[]; // 個別板情報
  storageItems: StorageItem[]; // 収納アイテム配置
  settings: {
    units: 'metric' | 'imperial';
    precision: number; // 寸法精度 (mm)
    defaultMaterial: Material;
    safetyFactors: SafetySettings;
  };
}
```

### API設計

```typescript
// ハイブリッド設計API
class HybridDesignAPI {
  // テンプレート操作
  async createBoxTemplate(spec: {
    size: { width: number; height: number; depth: number };
    position?: { x: number; y: number; z: number };
    material?: Material;
    enabledBoards?: string[]; // 有効にする板タイプ
  }): Promise<BoxTemplate>;
  
  async updateTemplateSize(templateId: number, size: {
    width?: number;
    height?: number; 
    depth?: number;
  }): Promise<BoxTemplate>;
  
  async toggleTemplateBoardEnabled(
    templateId: number, 
    boardType: 'top' | 'bottom' | 'left' | 'right' | 'back'
  ): Promise<TemplateBoard>;
  
  // 個別板操作
  async addIndependentBoard(spec: {
    orientation: 'horizontal' | 'vertical';
    dimensions: { length: number; width: number; thickness: number };
    position?: { x: number; y: number; z: number };
    material?: Material;
  }): Promise<IndependentBoard>;
  
  async updateIndependentBoard(boardId: number, updates: {
    dimensions?: Partial<Dimensions>;
    position?: Partial<Position>;
    orientation?: 'horizontal' | 'vertical';
    rotation?: Partial<Rotation>;
    material?: Partial<Material>;
  }): Promise<IndependentBoard>;
  
  // モード・変換操作
  async switchEditMode(mode: 'template' | 'individual' | 'mixed'): Promise<void>;
  
  async convertTemplateToIndividual(templateId: number): Promise<{
    deletedTemplate: BoxTemplate;
    createdBoards: IndependentBoard[];
  }>;
  
  // 統合検索・操作
  async searchAllObjects(query: {
    type?: 'template' | 'individual';
    material?: string;
    minDimensions?: Dimensions;
    maxDimensions?: Dimensions;
  }): Promise<(BoxTemplate | IndependentBoard)[]>;
}
```

## 状態遷移・イベント（State Transition/Events）

### アプリケーション状態フロー

```
[初期化] → [テンプレート表示] → [テンプレート編集] → [個別板追加] → [混在編集] → [完成]
    ↓            ↑               ↓              ↑              ↓           ↓
[エラー] ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←← [保存/出力]
```

### 詳細状態遷移

```
1. 初期化フェーズ
   アプリ起動 → 3Dシーン初期化 → 標準箱テンプレート生成 → テンプレート表示

2. テンプレート編集フェーズ  
   テンプレート選択 → サイズ調整 → 板有効/無効切替 → テンプレート確定

3. 個別板追加フェーズ
   板追加ボタン → 向き選択 → 初期配置 → 寸法調整 → 位置調整

4. 混在編集フェーズ
   オブジェクト選択 → 編集モード判定 → 対応UI表示 → 編集実行 → 更新反映

5. 完成・出力フェーズ
   設計完了 → 構造チェック → データ保存 → 各種出力生成
```

### イベント処理システム

```javascript
// イベント優先度とハンドリング
const EventSystem = {
  // マウスイベント（優先度順）
  mouseEvents: {
    1: 'click',      // オブジェクト選択
    2: 'dblclick',   // 詳細編集モード
    3: 'mousemove',  // ドラッグ・リサイズ
    4: 'wheel',      // 3Dビュー操作
    5: 'contextmenu' // 右クリックメニュー
  },
  
  // キーボードショートカット
  keyboardShortcuts: {
    'Delete': 'deleteSelected',
    'Ctrl+C': 'copySelected', 
    'Ctrl+V': 'pasteObject',
    'T': 'switchToTemplateMode',
    'I': 'switchToIndividualMode',
    'H': 'setHorizontalOrientation',
    'V': 'setVerticalOrientation',
    'R': 'rotateSelected90',
    'Escape': 'clearSelection'
  },
  
  // UI状態イベント
  uiStateEvents: {
    'templateSizeChange': 'updateTemplateSize',
    'boardToggle': 'toggleTemplateBoard',
    'addHorizontalBoard': 'addHorizontalBoard',
    'addVerticalBoard': 'addVerticalBoard',
    'editModeSwitch': 'switchEditMode'
  }
};

// 選択状態管理
const SelectionManager = {
  currentSelection: null,
  selectionType: null, // 'template' | 'templateBoard' | 'independent'
  
  selectTemplate(template) {
    this.currentSelection = template;
    this.selectionType = 'template';
    this.showTemplateEditPanel();
  },
  
  selectIndependentBoard(board) {
    this.currentSelection = board;
    this.selectionType = 'independent';
    this.showIndividualEditPanel();
  },
  
  selectTemplateBoard(board) {
    this.currentSelection = board;
    this.selectionType = 'templateBoard';
    this.showTemplateBoardEditPanel();
  }
};
```

## エラーカタログ（Error Catalog）

### E001: 初期化・テンプレートエラー
- **E001-01**: テンプレート生成失敗
  - メッセージ: "初期テンプレートの作成に失敗しました"
  - 対応: デフォルトサイズでリトライ・手動テンプレート作成案内

- **E001-02**: テンプレートサイズ異常
  - メッセージ: "テンプレートサイズが有効範囲を超えています"
  - 対応: 最小値1cm・最大値500cmにクランプ・警告表示

### E002: 個別板操作エラー
- **E002-01**: 板追加失敗
  - メッセージ: "板の追加に失敗しました。メモリ不足の可能性があります"
  - 対応: 既存板の削除推奨・簡素化提案

- **E002-02**: 向き切替不可
  - メッセージ: "現在の寸法では向きを切り替えできません"
  - 対応: 適切な寸法範囲の提示・自動調整提案

### E003: モード切替・変換エラー
- **E003-01**: テンプレート→個別板変換失敗
  - メッセージ: "テンプレートの個別板変換に失敗しました"
  - 対応: 変換前状態に復元・手動分離案内

- **E003-02**: 編集モード競合
  - メッセージ: "選択したオブジェクトは現在の編集モードに対応していません"
  - 対応: 適切なモードに自動切替・ユーザー確認

### E004: 構造・安全性エラー
- **E004-01**: テンプレート構造不安定
  - メッセージ: "テンプレートの構造が不安定です。必要な板を有効にしてください"
  - 対応: 最小必要板の自動有効化・安定化提案

- **E004-02**: 個別板配置干渉
  - メッセージ: "追加した板がテンプレートと干渉しています"
  - 対応: 自動位置調整・手動調整ガイド

### E005: データ保存・出力エラー
- **E005-01**: ハイブリッドデータ保存失敗
  - メッセージ: "テンプレートと個別板の統合保存に失敗しました"
  - 対応: 分離保存・データ整合性チェック

- **E005-02**: 部材リスト生成エラー
  - メッセージ: "部材リストの生成に失敗しました。一部のデータが不完全です"
  - 対応: 完全なデータのみでリスト生成・不完全箇所の明示

## 非機能（数値目標）（Non-Functional Requirements）

### 性能要件（Performance Requirements）
- **応答性**
  - テンプレートサイズ調整: ≤50ms
  - 個別板追加: ≤100ms
  - モード切替: ≤200ms
  - テンプレート→個別板変換: ≤500ms
  - 3D操作レスポンス: ≤16ms (60fps維持)

- **スループット**
  - テンプレート板: 最大5板（天底左右背）
  - 個別板: 最大200板
  - 同時選択: 最大50オブジェクト
  - メモリ使用量: ≤1.5GB (大規模設計時)

### 品質・精度要件（Quality & Precision Requirements）
- **寸法精度**: ±0.1mm
- **テンプレート連動精度**: 100%（サイズ変更時の全板同期）
- **座標変換精度**: ±0.1mm（向き切替・回転時）
- **構造計算精度**: 簡易レベル・安全率2.0

### 可用性・信頼性（Availability & Reliability）
- **稼働率**: 99.5% (ローカル実行)
- **データ整合性**: 100%（テンプレート⇔個別板関係）
- **自動保存**: 20秒間隔（設計状態）
- **復旧時間**: ≤3秒（エラーからの自動復旧）

### 互換性・拡張性（Compatibility & Scalability）
- **ブラウザ対応**: Chrome≥88, Firefox≥85, Safari≥14, Edge≥88
- **データ互換性**: 前版テンプレートデータの読込対応
- **拡張性**: 新テンプレート追加・板タイプ拡張対応
- **国際化**: 単位系切替（cm⇔inch）・多言語UI準備

## 受け入れテスト（Gherkin）（Acceptance Test/Gherkin）

```gherkin
Feature: 箱テンプレート＋個別板ハイブリッド収納棚設計

Background:
  Given ユーザーがアプリケーションを開いている
  And 3D空間が正常に表示されている

Scenario: 初期テンプレート自動表示
  When アプリケーションが完全に読み込まれる
  Then 標準サイズの箱テンプレートが3D空間に表示される
  And 箱テンプレート編集パネルが自動的に表示される
  And テンプレートサイズ調整スライダーが利用可能である
  And すべてのテンプレート板（天底左右背）が有効状態である

Scenario: テンプレート全体サイズ調整
  Given 箱テンプレートが表示されている
  When 幅スライダーを120cmに設定する
  Then 箱テンプレート全体の幅が120cmに変更される
  And すべての板が連動してサイズ変更される
  And 天板・底板の幅が120cmになる
  And 左右側板の間隔が120cmになる
  And 3D表示が即座に更新される

Scenario: テンプレート板の選択的無効化
  Given 箱テンプレートが選択されている
  When 背板の"無効"チェックボックスをクリックする
  Then 背板が3D表示から消える
  And 箱が背板なしの構造になる
  And 他の板（天底左右）には影響しない
  And 背板を"有効"に戻すと再び表示される

Scenario: 個別板の追加（水平板）
  Given 箱テンプレートが配置されている
  When "水平板追加"ボタンをクリックする
  Then 新しい水平板がテンプレートの近くに配置される
  And 水平板が選択状態になる
  And 個別板編集パネルが表示される
  And 板の寸法（長さ・幅・厚み）が調整可能になる
  And 板の位置（X・Y・Z）が調整可能になる

Scenario: 個別板の追加（垂直板）
  Given 箱テンプレートが配置されている  
  When "垂直板追加"ボタンをクリックする
  Then 新しい垂直板がテンプレートの近くに配置される
  And 垂直板が選択状態になる
  And 個別板編集パネルが表示される
  And 板の向きが"垂直"に設定されている

Scenario: テンプレートと個別板の混在編集
  Given 箱テンプレートと追加の棚板がある
  When 箱テンプレートをクリックして選択する
  Then テンプレート全体がハイライト表示される
  And テンプレート編集パネルが表示される
  And テンプレート全体のサイズ調整が可能である
  When 追加棚板をクリックして選択する
  Then 個別板のみがハイライト表示される
  And 個別板編集パネルが表示される
  And テンプレートの選択が自動的に解除される

Scenario: 個別板の向き切替
  Given 水平板が選択されている
  When "垂直向きに変更"ボタンをクリックする
  Then 板が90度回転して垂直向きになる
  And 板の寸法ラベルが適切に更新される（長さ⇔幅）
  And 3D表示が即座に更新される
  And 向きを"水平"に戻すことも可能である

Scenario: 個別板の回転調整
  Given 垂直板が選択されている
  When Y軸回転を90度に設定する
  Then 板が指定角度回転する
  And 回転後の向きが3D表示に反映される
  And 他のオブジェクトとの干渉がチェックされる
  And 干渉がある場合は警告が表示される

Scenario: テンプレートから完全個別板モードへの変換
  Given 箱テンプレートで基本形状を作成している
  And テンプレートの一部の板を無効にしている
  When "個別板モードに切替"ボタンをクリックする
  Then 確認ダイアログが表示される
  When 変換を確認する
  Then テンプレートの有効板がすべて個別板に変換される
  And 各板が独立して編集可能になる
  And テンプレート編集パネルが非表示になる
  And 変換された板は元の位置・サイズを維持する

Scenario: 混在状態での構造チェック
  Given テンプレート（幅150cm）と追加棚板がある
  And テンプレートの板厚が12mmに設定されている
  And 追加棚板も12mmに設定されている
  When 構造安全性チェックが実行される
  Then "テンプレート・個別板ともに耐荷重不足"の警告が表示される
  And "すべての板厚を18mmに変更"の提案が表示される
  And 問題のある板が赤色でハイライトされる

Scenario: ハイブリッド設計データの保存・読み込み
  Given テンプレートと複数の個別板で構成された設計がある
  When "設計保存"ボタンをクリックする
  Then 設計データがJSONファイルとしてダウンロードされる
  And ファイルにテンプレート情報が含まれる
  And ファイルに個別板情報が含まれる
  And 板の関係性（テンプレート由来・独立追加）が保存される
  When 保存したファイルを読み込む
  Then テンプレート状態が正確に復元される
  And すべての個別板が正確に復元される
  And 編集モードが適切に設定される

Scenario: 統合部材リストの生成
  Given テンプレート（パイン材18mm）と個別板（合板15mm）がある
  When "部材リスト出力"ボタンをクリックする
  Then 部材リストが材料別に分類される
  And テンプレート板の寸法・枚数が正確に表示される
  And 個別板の寸法・枚数が正確に表示される
  And 板の種別（テンプレート由来・独立追加）が区別される
  And 材料使用量の合計が表示される
  And CSVファイルとしてダウンロード可能である

Scenario: エラー処理とユーザーガイダンス
  Given テンプレートが選択されている
  When 幅に無効な値（600cm）を入力する
  Then エラーメッセージ"最大500cmまでです"が表示される
  And 値が最大値（500cm）に自動修正される
  And 修正内容がユーザーに通知される
  When 個別板追加時にメモリ不足が発生する
  Then "板数が多すぎます"の警告が表示される
  And 不要な板の削除が推奨される

Scenario: パフォーマンス・レスポンス確認
  Given テンプレート1個と個別板50個が配置されている
  When テンプレートサイズを変更する
  Then 変更が50ms以内に反映される
  And 3D表示が60fpsで滑らかに動作する
  When 個別板を追加する
  Then 追加が100ms以内に完了する
  And UI応答が遅延しない
  And メモリ使用量が適切な範囲内に保たれる
```

---

*最終更新日: 2025-08-20*  
*バージョン: 2.1 - 箱テンプレート＋個別板ハイブリッドシステム*  
*対象システム: 収納棚設計・デザインプラットフォーム*