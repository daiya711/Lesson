# 収納棚設計・デザインプラットフォーム 設計仕様書 (Design Specification)

## 1. システムアーキテクチャ設計

### 1.1 全体アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                   Presentation Layer                        │
├─────────────────┬─────────────────┬─────────────────────────┤
│   UI Components │   3D Rendering  │    Event Management     │
│   (React/HTML)  │   (Three.js)    │    (DOM Events)         │
├─────────────────┼─────────────────┼─────────────────────────┤
│                 Business Logic Layer                        │
├─────────────────┬─────────────────┬─────────────────────────┤
│ Template Manager│  Board Manager  │   Design Validator      │
│   (BoxTemplate) │(IndependentBoard)│  (Safety Checker)       │
├─────────────────┼─────────────────┼─────────────────────────┤
│                   Data Layer                                │
├─────────────────┬─────────────────┬─────────────────────────┤
│  State Manager  │   Data Storage  │     Export Engine       │
│   (Reactive)    │  (LocalStorage) │   (JSON/PDF/CSV)        │
└─────────────────┴─────────────────┴─────────────────────────┘
```

### 1.2 レイヤー責務

**Presentation Layer (表示層)**
- UI コンポーネントの描画・更新
- Three.js による3D可視化
- ユーザーイベントの捕捉・配信

**Business Logic Layer (ビジネスロジック層)**
- テンプレート・個別板の管理
- 設計ルール・制約の適用
- 構造安全性の検証

**Data Layer (データ層)**
- アプリケーション状態の管理
- データの永続化・復元
- 各種形式での出力生成

### 1.3 アーキテクチャ原則

**分離の原則**
- 表示ロジックとビジネスロジックの完全分離
- 3D描画エンジンとデータモデルの独立性
- UI状態とアプリケーション状態の明確な境界

**拡張性の原則**
- 新しい板タイプの追加容易性
- 新しいテンプレートの組み込み対応
- 新しい出力形式の統合簡便性

**パフォーマンス原則**
- 3D描画の最適化（60fps維持）
- メモリ効率的なオブジェクト管理
- レスポンシブなユーザーインタラクション

## 2. コンポーネント設計

### 2.1 コアコンポーネント図

```
┌──────────────────────────────────────────────────────────────┐
│                      ShelfDesigner                          │
│  ┌─────────────────┬─────────────────┬─────────────────────┐ │
│  │TemplateManager  │   BoardManager  │   ViewportManager   │ │
│  │                 │                 │                     │ │
│  │ - BoxTemplate   │ - IndepBoard[]  │ - THREE.Scene       │ │
│  │ - TemplBoard[]  │ - Selection     │ - Camera/Controls   │ │
│  │ - Operations    │ - CRUD Ops      │ - Rendering         │ │
│  └─────────────────┴─────────────────┴─────────────────────┘ │
│  ┌─────────────────┬─────────────────┬─────────────────────┐ │
│  │   UIManager     │  EventManager   │   DataManager       │ │
│  │                 │                 │                     │ │
│  │ - Panel Update  │ - Mouse/Key     │ - State Persist     │ │
│  │ - Modal Control │ - Event Routing │ - Export/Import     │ │
│  │ - State Sync    │ - Action Disp   │ - Validation        │ │
│  └─────────────────┴─────────────────┴─────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 主要コンポーネント詳細

#### TemplateManager
**責務**: 箱テンプレートの管理・操作
```typescript
class TemplateManager {
  private boxTemplate: BoxTemplate | null;
  private templateBoards: Map<string, TemplateBoard>;
  
  // テンプレート操作
  createTemplate(size: Dimensions, position: Position): BoxTemplate
  updateTemplateSize(size: Partial<Dimensions>): void
  toggleBoard(boardType: BoardType, enabled: boolean): void
  
  // 変換操作
  convertToIndividualBoards(): IndependentBoard[]
  resetToDefault(): void
  
  // 状態管理
  getTemplateState(): TemplateState
  validateTemplate(): ValidationResult
}
```

#### BoardManager
**責務**: 個別板の管理・操作
```typescript
class BoardManager {
  private boards: Map<number, IndependentBoard>;
  private selection: Set<number>;
  
  // CRUD操作
  addBoard(spec: BoardSpec): IndependentBoard
  updateBoard(id: number, updates: Partial<IndependentBoard>): void
  deleteBoard(id: number): boolean
  duplicateBoard(id: number): IndependentBoard
  
  // 選択管理
  selectBoard(id: number, multiSelect?: boolean): void
  clearSelection(): void
  getSelectedBoards(): IndependentBoard[]
  
  // 一括操作
  updateSelectedBoards(updates: Partial<IndependentBoard>): void
  deleteSelectedBoards(): void
}
```

#### ViewportManager
**責務**: 3D描画・可視化管理
```typescript
class ViewportManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: THREE.OrbitControls;
  
  // 描画管理
  render(): void
  resize(width: number, height: number): void
  updateObject(object: Board | Template): void
  
  // 視覚効果
  highlightObject(object: THREE.Object3D): void
  clearHighlights(): void
  showGrid(visible: boolean): void
  
  // カメラ操作
  focusOnObject(object: THREE.Object3D): void
  resetView(): void
}
```

### 2.3 コンポーネント間通信

```typescript
// イベントベース通信
interface EventBus {
  emit(event: string, data: any): void
  on(event: string, handler: Function): void
  off(event: string, handler: Function): void
}

// 主要イベント
const Events = {
  TEMPLATE_SIZE_CHANGED: 'template:sizeChanged',
  BOARD_ADDED: 'board:added',
  BOARD_SELECTED: 'board:selected',
  SELECTION_CHANGED: 'selection:changed',
  VIEWPORT_UPDATED: 'viewport:updated',
  UI_PANEL_TOGGLE: 'ui:panelToggle'
};
```

## 3. データ設計

### 3.1 ドメインモデル

```typescript
// 中核エンティティ
abstract class DesignElement {
  id: number;
  position: Vector3;
  material: Material;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  abstract render(): THREE.Mesh;
  abstract validate(): ValidationResult;
  abstract clone(): DesignElement;
}

class BoxTemplate extends DesignElement {
  size: Dimensions;
  boards: Map<BoardType, TemplateBoard>;
  isActive: boolean;
  
  updateSize(size: Partial<Dimensions>): void
  toggleBoard(type: BoardType): void
  getBoard(type: BoardType): TemplateBoard | null
}

class IndependentBoard extends DesignElement {
  dimensions: Dimensions;
  orientation: Orientation;
  rotation: Vector3;
  isFromTemplate: boolean;
  parentTemplateId?: number;
  
  setOrientation(orientation: Orientation): void
  rotate(axis: Axis, angle: number): void
  resize(dimensions: Partial<Dimensions>): void
}
```

### 3.2 データフロー設計

```
┌─────────────┐    Event     ┌─────────────┐    Update    ┌─────────────┐
│ UI Action   │ ──────────→  │   Manager   │ ──────────→  │ Data Model  │
└─────────────┘              └─────────────┘              └─────────────┘
      ↑                             │                            │
      │                             ↓                            ↓
      │                      ┌─────────────┐              ┌─────────────┐
      │                      │ Validation  │              │ 3D Render   │
      │                      └─────────────┘              └─────────────┘
      │                             │                            │
      │          Notification       │       Visual               │
      └─────────────────────────────┼──────────────────────────────┘
                                    ↓
                            ┌─────────────┐
                            │ UI Update   │
                            └─────────────┘
```

### 3.3 状態管理設計

```typescript
// リアクティブ状態管理
class StateManager {
  private state: DesignState;
  private subscribers: Map<string, Set<Function>>;
  
  // 状態更新
  setState(path: string, value: any): void
  getState(path?: string): any
  
  // 購読管理
  subscribe(path: string, callback: Function): UnsubscribeFunction
  notify(path: string, oldValue: any, newValue: any): void
  
  // 履歴管理
  undo(): void
  redo(): void
  createSnapshot(): StateSnapshot
  restoreSnapshot(snapshot: StateSnapshot): void
}

interface DesignState {
  template: BoxTemplate | null;
  boards: Map<number, IndependentBoard>;
  selection: SelectionState;
  viewport: ViewportState;
  ui: UIState;
  settings: SettingsState;
}
```

## 4. UI/UX設計

### 4.1 画面構成設計

```
┌─────────────────────────────────────────────────────────────┐
│ Header: Title + Actions                                     │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────────────────────────────────┐ │
│ │             │ │                                         │ │
│ │  Control    │ │           3D Viewport                   │ │
│ │  Panel      │ │                                         │ │
│ │             │ │  ┌─────────────────────────────────┐    │ │
│ │ ┌─────────┐ │ │  │         Canvas                  │    │ │
│ │ │Template │ │ │  │                                 │    │ │
│ │ │ Edit    │ │ │  │     [3D Scene]                  │    │ │
│ │ └─────────┘ │ │  │                                 │    │ │
│ │             │ │  └─────────────────────────────────┘    │ │
│ │ ┌─────────┐ │ │                                         │ │
│ │ │ Board   │ │ │  ┌─────────────────────────────────┐    │ │
│ │ │ Add     │ │ │  │        Info Panel               │    │ │
│ │ └─────────┘ │ │  │  Current: W:80 H:180 D:30      │    │ │
│ │             │ │  └─────────────────────────────────┘    │ │
│ │ ┌─────────┐ │ │                                         │ │
│ │ │ Export  │ │ │                                         │ │
│ │ └─────────┘ │ │                                         │ │
│ └─────────────┘ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 パネル設計

#### テンプレート編集パネル
```html
<div class="template-panel">
  <h3>箱テンプレート編集</h3>
  
  <!-- サイズ調整 -->
  <div class="size-controls">
    <div class="control-row">
      <label>幅 (cm)</label>
      <input type="range" min="30" max="200" v-model="template.width">
      <span>{{template.width}}cm</span>
    </div>
    <div class="control-row">
      <label>高さ (cm)</label>
      <input type="range" min="50" max="250" v-model="template.height">
      <span>{{template.height}}cm</span>
    </div>
    <div class="control-row">
      <label>奥行き (cm)</label>
      <input type="range" min="20" max="80" v-model="template.depth">
      <span>{{template.depth}}cm</span>
    </div>
  </div>
  
  <!-- 板の有効/無効 -->
  <div class="board-toggles">
    <h4>構成板</h4>
    <label><input type="checkbox" v-model="boards.top.enabled"> 天板</label>
    <label><input type="checkbox" v-model="boards.bottom.enabled"> 底板</label>
    <label><input type="checkbox" v-model="boards.left.enabled"> 左側板</label>
    <label><input type="checkbox" v-model="boards.right.enabled"> 右側板</label>
    <label><input type="checkbox" v-model="boards.back.enabled"> 背板</label>
  </div>
  
  <!-- 操作ボタン -->
  <div class="actions">
    <button @click="convertToIndividual">個別板モードに切替</button>
    <button @click="resetTemplate">初期状態に戻す</button>
  </div>
</div>
```

#### 個別板追加パネル
```html
<div class="board-add-panel">
  <h3>個別板追加</h3>
  
  <!-- 板追加ボタン -->
  <div class="add-buttons">
    <button @click="addBoard('horizontal')" class="add-horizontal">
      <i class="icon-horizontal"></i>
      水平板追加
    </button>
    <button @click="addBoard('vertical')" class="add-vertical">
      <i class="icon-vertical"></i>
      垂直板追加
    </button>
  </div>
  
  <!-- 個別板一覧 -->
  <div class="board-list">
    <h4>追加した板 ({{independentBoards.length}})</h4>
    <div v-for="board in independentBoards" :key="board.id" 
         class="board-item" :class="{selected: isSelected(board)}">
      <div class="board-info">
        <span class="board-type">{{board.orientation}}</span>
        <span class="board-size">{{board.dimensions.length}}×{{board.dimensions.width}}</span>
      </div>
      <div class="board-actions">
        <button @click="selectBoard(board)">選択</button>
        <button @click="duplicateBoard(board)">複製</button>
        <button @click="deleteBoard(board)">削除</button>
      </div>
    </div>
  </div>
</div>
```

### 4.3 レスポンシブ設計

```css
/* デスクトップ: サイドパネル + 3Dビューア */
@media (min-width: 1024px) {
  .container {
    display: flex;
    height: 100vh;
  }
  .control-panel {
    width: 320px;
    flex-shrink: 0;
  }
  .viewport {
    flex: 1;
  }
}

/* タブレット: 縦向きパネル + コンパクトビューア */
@media (max-width: 1023px) and (min-width: 768px) {
  .container {
    display: flex;
    flex-direction: column;
  }
  .control-panel {
    height: 200px;
    overflow-y: auto;
  }
  .viewport {
    flex: 1;
    min-height: 400px;
  }
}

/* モバイル: フルスクリーンビューア + 底部パネル */
@media (max-width: 767px) {
  .container {
    position: relative;
    height: 100vh;
  }
  .viewport {
    height: 70vh;
  }
  .control-panel {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 30vh;
    background: white;
    border-top: 1px solid #ccc;
  }
}
```

## 5. パフォーマンス設計

### 5.1 3D描画最適化

```typescript
class RenderOptimizer {
  private lastRenderTime: number = 0;
  private renderQueue: Set<THREE.Object3D> = new Set();
  private isRendering: boolean = false;
  
  // フレームレート制御
  scheduleRender(object?: THREE.Object3D): void {
    if (object) {
      this.renderQueue.add(object);
    }
    
    if (!this.isRendering) {
      this.isRendering = true;
      requestAnimationFrame(() => this.performRender());
    }
  }
  
  private performRender(): void {
    const currentTime = performance.now();
    
    // 60fps維持 (16.67ms間隔)
    if (currentTime - this.lastRenderTime < 16.67) {
      requestAnimationFrame(() => this.performRender());
      return;
    }
    
    // バッチ更新
    this.renderQueue.forEach(object => {
      this.updateObjectGeometry(object);
    });
    this.renderQueue.clear();
    
    this.renderer.render(this.scene, this.camera);
    this.lastRenderTime = currentTime;
    this.isRendering = false;
  }
}
```

### 5.2 メモリ管理

```typescript
class MemoryManager {
  private geometryCache: Map<string, THREE.BufferGeometry> = new Map();
  private materialCache: Map<string, THREE.Material> = new Map();
  private disposedObjects: Set<THREE.Object3D> = new Set();
  
  // ジオメトリキャッシュ
  getGeometry(spec: GeometrySpec): THREE.BufferGeometry {
    const key = this.getGeometryKey(spec);
    
    if (!this.geometryCache.has(key)) {
      const geometry = this.createGeometry(spec);
      this.geometryCache.set(key, geometry);
    }
    
    return this.geometryCache.get(key)!.clone();
  }
  
  // オブジェクト破棄
  disposeObject(object: THREE.Object3D): void {
    if (this.disposedObjects.has(object)) return;
    
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => mat.dispose());
        } else {
          child.material?.dispose();
        }
      }
    });
    
    this.disposedObjects.add(object);
  }
  
  // メモリクリーンアップ
  cleanup(): void {
    // 未使用ジオメトリの削除
    this.cleanupGeometryCache();
    // 未使用マテリアルの削除
    this.cleanupMaterialCache();
    // ガベージコレクション促進
    if (window.gc) window.gc();
  }
}
```

### 5.3 データ永続化最適化

```typescript
class PersistenceManager {
  private saveQueue: Map<string, any> = new Map();
  private saveTimeout: number | null = null;
  
  // 遅延保存（デバウンス）
  scheduleSave(key: string, data: any, delay: number = 500): void {
    this.saveQueue.set(key, data);
    
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    this.saveTimeout = setTimeout(() => {
      this.performBatchSave();
    }, delay);
  }
  
  private performBatchSave(): void {
    const batch = Array.from(this.saveQueue.entries());
    this.saveQueue.clear();
    this.saveTimeout = null;
    
    // IndexedDBへの一括保存
    this.saveBatch(batch);
  }
  
  // 圧縮保存
  async saveCompressed(key: string, data: any): Promise<void> {
    const compressed = await this.compressData(JSON.stringify(data));
    localStorage.setItem(key, compressed);
  }
  
  async loadCompressed(key: string): Promise<any> {
    const compressed = localStorage.getItem(key);
    if (!compressed) return null;
    
    const decompressed = await this.decompressData(compressed);
    return JSON.parse(decompressed);
  }
}
```

## 6. セキュリティ設計

### 6.1 入力検証

```typescript
class InputValidator {
  // 寸法値検証
  validateDimension(value: number, min: number = 1, max: number = 500): ValidationResult {
    if (typeof value !== 'number' || isNaN(value)) {
      return { valid: false, error: '数値を入力してください' };
    }
    
    if (value < min || value > max) {
      return { 
        valid: false, 
        error: `${min}cm以上${max}cm以下で入力してください`,
        correctedValue: Math.max(min, Math.min(max, value))
      };
    }
    
    return { valid: true };
  }
  
  // ファイル検証
  validateImportFile(file: File): ValidationResult {
    // ファイルサイズ制限 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return { valid: false, error: 'ファイルサイズが大きすぎます（10MB以下）' };
    }
    
    // MIME タイプ検証
    const allowedTypes = ['application/json', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'サポートされていないファイル形式です' };
    }
    
    return { valid: true };
  }
}
```

### 6.2 データサニタイゼーション

```typescript
class DataSanitizer {
  // HTML/XSS対策
  sanitizeString(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  
  // オブジェクト深度制限
  sanitizeObject(obj: any, maxDepth: number = 10): any {
    if (maxDepth <= 0) return null;
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item, maxDepth - 1));
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value, maxDepth - 1);
      }
      return sanitized;
    }
    
    return obj;
  }
}
```

## 7. エラーハンドリング設計

### 7.1 エラー分類・処理

```typescript
// エラー階層
abstract class DesignError extends Error {
  abstract readonly category: ErrorCategory;
  abstract readonly severity: ErrorSeverity;
  abstract readonly recoverable: boolean;
  
  constructor(
    message: string,
    public readonly context: ErrorContext = {}
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

class TemplateError extends DesignError {
  readonly category = 'template';
  readonly severity: ErrorSeverity;
  readonly recoverable = true;
  
  constructor(message: string, severity: ErrorSeverity = 'warning') {
    super(message);
    this.severity = severity;
  }
}

class BoardError extends DesignError {
  readonly category = 'board';
  readonly severity: ErrorSeverity = 'error';
  readonly recoverable = true;
}

class RenderError extends DesignError {
  readonly category = 'render';
  readonly severity: ErrorSeverity = 'critical';
  readonly recoverable = false;
}
```

### 7.2 エラー復旧戦略

```typescript
class ErrorRecoveryManager {
  private recoveryStrategies: Map<string, RecoveryStrategy> = new Map();
  
  constructor() {
    this.initializeStrategies();
  }
  
  async handleError(error: DesignError): Promise<RecoveryResult> {
    const strategy = this.recoveryStrategies.get(error.category);
    
    if (!strategy || !error.recoverable) {
      return { success: false, action: 'reload' };
    }
    
    try {
      const result = await strategy.recover(error);
      this.logRecovery(error, result);
      return result;
    } catch (recoveryError) {
      console.error('Recovery failed:', recoveryError);
      return { success: false, action: 'reset' };
    }
  }
  
  private initializeStrategies(): void {
    // テンプレートエラー復旧
    this.recoveryStrategies.set('template', {
      recover: async (error: TemplateError) => {
        // デフォルト値にリセット
        const defaultTemplate = this.createDefaultTemplate();
        this.templateManager.setTemplate(defaultTemplate);
        return { success: true, action: 'reset_template' };
      }
    });
    
    // 個別板エラー復旧
    this.recoveryStrategies.set('board', {
      recover: async (error: BoardError) => {
        // 問題のある板を削除
        if (error.context.boardId) {
          this.boardManager.deleteBoard(error.context.boardId);
          return { success: true, action: 'delete_board' };
        }
        return { success: false, action: 'manual_fix' };
      }
    });
  }
}
```

---

*最終更新日: 2025-08-20*  
*バージョン: 1.0*  
*対象システム: 収納棚設計・デザインプラットフォーム*