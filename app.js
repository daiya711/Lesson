// 収納棚設計・デザインプラットフォーム
// Phase 1: コアアーキテクチャ実装 - 3層アーキテクチャ・6コンポーネント設計

/**
 * メイン設計クラス - 6コンポーネント統合管理
 */
class ShelfDesigner {
    constructor() {
        // 6コンポーネント初期化
        this.templateManager = null;
        this.boardManager = null;
        this.viewportManager = null;
        this.uiManager = null;
        this.eventManager = null;
        this.dataManager = null;
        
        // 状態管理
        this.state = new StateManager();
        
        this.init();
    }
    
    async init() {
        try {
            // ViewportManager初期化（3D環境）
            this.viewportManager = new ViewportManager();
            await this.viewportManager.init();
            
            // EventManager初期化（イベント管理）
            this.eventManager = new EventManager(this.viewportManager.canvas, this.viewportManager.camera);
            
            // TemplateManager初期化（箱テンプレート管理）
            this.templateManager = new TemplateManager(this.viewportManager.scene);
            
            // BoardManager初期化（個別板管理）
            this.boardManager = new BoardManager(this.viewportManager.scene);
            
            // UIManager初期化（UI管理）
            this.uiManager = new UIManager();
            
            // DataManager初期化（データ管理）
            this.dataManager = new DataManager();
            console.log('DataManager初期化完了:', this.dataManager);
            
            // DataManager拡張メソッドを直接追加（確実な実行のため）
            this.addDataManagerExtensions();
            
            // DataManager初期化完了イベントを発火
            window.dispatchEvent(new CustomEvent('dataManagerReady', { 
                detail: { dataManager: this.dataManager } 
            }));
            
            // StructureChecker初期化（構造安全性チェック）
            this.structureChecker = new StructureChecker();
            
            // コンポーネント間通信設定
            this.setupComponentCommunication();
            
            // 初期テンプレート作成 (FR001-1)
            this.templateManager.createDefaultTemplate();
            
            // UIを初期状態に設定
            this.uiManager.showTemplateEditPanel();
            this.updateUI();
            
            // アニメーションループ開始
            this.animate();
            
            console.log('収納棚設計プラットフォーム初期化完了');
            
        } catch (error) {
            console.error('初期化エラー:', error);
            
            // エラーの詳細をユーザーに表示
            const errorDetails = error.message || 'Unknown error';
            const helpMessage = `
                初期化に失敗しました: ${errorDetails}
                
                対処方法:
                1. ブラウザを更新してください
                2. WebGLが有効になっているか確認してください
                3. ブラウザが最新版であることを確認してください
                
                それでも問題が解決しない場合は、異なるブラウザを試してください。
            `;
            
            alert(helpMessage);
            throw new Error(`アプリケーションの初期化に失敗しました: ${errorDetails}`);
        }
    }
    
    setupComponentCommunication() {
        // EventManagerからの通知を各コンポーネントに配信
        this.eventManager.on('templateClicked', (templateData) => {
            console.log('テンプレートクリック:', templateData);
            this.state.setSelectedObject(templateData, 'template');
            this.uiManager.showTemplateEditPanel();
            this.updateUI();
        });
        
        this.eventManager.on('templateBoardClicked', (boardData) => {
            console.log('テンプレート板クリック処理:', boardData);
            this.state.setSelectedObject(boardData, 'templateBoard');
            this.uiManager.showTemplateBoardPanel();
            this.updateUI();
        });
        
        this.eventManager.on('independentBoardClicked', (boardData) => {
            console.log('個別板クリック処理:', boardData);
            this.state.setSelectedObject(boardData, 'independent');
            this.uiManager.showIndividualBoardPanel();
            this.updateUI();
        });
        
        this.eventManager.on('backgroundClicked', () => {
            console.log('背景クリック: オブジェクト選択を解除');
            this.state.setSelectedObject(null, null);
            this.uiManager.hideAllPanels();
            this.updateUI();
        });
        
        // UI変更の通知を各コンポーネントに配信
        this.uiManager.on('templateSizeChanged', (dimensions) => {
            this.templateManager.updateTemplateSize(dimensions);
            this.updateUI();
        });
        
        this.uiManager.on('boardToggled', (boardType, enabled) => {
            this.templateManager.toggleBoard(boardType, enabled);
            this.updateUI();
        });
        
        this.uiManager.on('addHorizontalBoard', () => {
            this.boardManager.addBoard('horizontal');
            this.updateUI();
        });
        
        this.uiManager.on('addVerticalBoard', () => {
            this.boardManager.addBoard('vertical');
            this.updateUI();
        });
        
        
        this.uiManager.on('resetTemplate', () => {
            this.templateManager.resetToDefault();
            this.updateUI();
        });
        
        // 個別板操作イベント
        this.uiManager.on('selectIndependentBoard', (boardId) => {
            const board = this.boardManager.getBoard(boardId);
            if (board) {
                this.state.setSelectedObject({ boardId }, 'independent');
                this.uiManager.showIndividualBoardPanel();
                this.updateUI();
            }
        });
        
        this.uiManager.on('deleteIndependentBoard', (boardId) => {
            this.boardManager.deleteBoard(boardId);
            this.uiManager.hideAllPanels();
            this.updateUI();
        });
        
        this.uiManager.on('updateBoardDimension', (boardId, dimension, value) => {
            const updates = { dimensions: {} };
            updates.dimensions[dimension] = value;
            this.boardManager.updateBoard(boardId, updates);
            this.updateUI();
        });
        
        this.uiManager.on('updateBoardPosition', (boardId, axis, value) => {
            const updates = { position: {} };
            updates.position[axis] = value;
            this.boardManager.updateBoard(boardId, updates);
            this.updateUI();
        });
        
        this.uiManager.on('setBoardOrientation', (boardId, orientation) => {
            this.boardManager.setOrientation(boardId, orientation);
            this.updateUI();
        });
        
        this.uiManager.on('rotateBoardY', (boardId, angle) => {
            const board = this.boardManager.getBoard(boardId);
            if (board) {
                const updates = { rotation: { ...board.rotation, y: angle } };
                this.boardManager.updateBoard(boardId, updates);
                this.updateUI();
            }
        });
        
        // 構造チェック
        this.uiManager.on('structureCheck', () => {
            this.performStructureCheck();
        });
        
        // キーボードショートカット
        this.eventManager.on('keyPressed', ({ key, event }) => {
            this.handleKeyPress(key, event);
        });
    }
    
    addDataManagerExtensions() {
        // DataManager拡張メソッドを直接追加
        console.log('DataManager拡張メソッドを追加開始');
        console.log('DataManager インスタンス:', this.dataManager);
        console.log('DataManager コンストラクタ:', this.dataManager?.constructor?.name);
        
        if (!this.dataManager) {
            console.error('DataManager not available for extension');
            return;
        }
        
        // データベースに設計を保存
        this.dataManager.saveDesignToDatabase = async function(title) {
            try {
                const shelfDesigner = window.shelfDesigner;
                const templateData = shelfDesigner.templateManager.getTemplateData();
                const boardsData = shelfDesigner.boardManager.getBoardsData();
                
                const designData = window.shelfDesignerAPI.prepareDesignData(templateData, boardsData);
                
                console.log('データベースに保存中...', { title, designData });
                const result = await window.shelfDesignerAPI.saveDesign(title, designData);
                
                if (result.success) {
                    console.log('データベース保存成功:', result.design);
                    this.showSaveMessage('設計をデータベースに保存しました', 'success');
                    return result.design;
                } else {
                    throw new Error(result.error || 'Save failed');
                }
            } catch (error) {
                console.error('データベース保存エラー:', error);
                console.log('API呼び出し詳細:', {
                    url: window.shelfDesignerAPI?.baseURL + window.shelfDesignerAPI?.apiPath + '/designs',
                    error: error.message,
                    apiClient: window.shelfDesignerAPI
                });
                
                let errorMessage = `保存エラー: ${error.message}`;
                if (error.message.includes('fetch')) {
                    errorMessage += `\n\nネットワークエラーの可能性があります。URLを確認してください。`;
                }
                
                this.showSaveMessage(errorMessage, 'error');
                throw error;
            }
        };
        
        // データベースから設計を読み込み
        this.dataManager.loadDesignFromDatabase = async function(designId) {
            try {
                console.log('データベースから読み込み中...', designId);
                const designData = await window.shelfDesignerAPI.getDesign(designId);
                
                if (!designData) {
                    throw new Error('設計データが見つかりません');
                }

                const parsed = window.shelfDesignerAPI.parseDesignData(designData.data);
                const shelfDesigner = window.shelfDesigner;

                // テンプレートデータの復元
                if (parsed.template) {
                    shelfDesigner.templateManager.loadTemplateData(parsed.template);
                }

                // 個別板データの復元
                if (parsed.boards && parsed.boards.length > 0) {
                    shelfDesigner.boardManager.loadBoardsData(parsed.boards);
                }

                // UI更新
                shelfDesigner.updateUI();
                
                console.log('データベース読み込み成功:', designData);
                this.showSaveMessage('設計をデータベースから読み込みました', 'success');
                return designData;
            } catch (error) {
                console.error('データベース読み込みエラー:', error);
                this.showSaveMessage(`読み込みエラー: ${error.message}`, 'error');
                throw error;
            }
        };
        
        // 保存済み設計一覧を取得
        this.dataManager.getSavedDesigns = async function() {
            try {
                const designs = await window.shelfDesignerAPI.getDesigns();
                console.log('保存済み設計一覧:', designs);
                return designs;
            } catch (error) {
                console.error('設計一覧取得エラー:', error);
                this.showSaveMessage(`一覧取得エラー: ${error.message}`, 'error');
                return [];
            }
        };
        
        // 設計を削除
        this.dataManager.deleteDesignFromDatabase = async function(designId) {
            try {
                console.log('データベースから削除中...', designId);
                const result = await window.shelfDesignerAPI.deleteDesign(designId);
                
                if (result.success) {
                    console.log('データベース削除成功');
                    this.showSaveMessage('設計を削除しました', 'success');
                    return true;
                } else {
                    throw new Error(result.error || 'Delete failed');
                }
            } catch (error) {
                console.error('データベース削除エラー:', error);
                this.showSaveMessage(`削除エラー: ${error.message}`, 'error');
                throw error;
            }
        };
        
        // メッセージ表示ヘルパー
        this.dataManager.showSaveMessage = function(message, type = 'info') {
            // 既存のUI要素を利用するか、新しく作成
            let messageContainer = document.getElementById('apiMessage');
            if (!messageContainer) {
                messageContainer = document.createElement('div');
                messageContainer.id = 'apiMessage';
                messageContainer.style.cssText = `
                    position: fixed; top: 20px; right: 20px; z-index: 1000;
                    padding: 12px 20px; border-radius: 8px; font-size: 14px;
                    max-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                `;
                document.body.appendChild(messageContainer);
            }

            const colors = {
                success: { bg: '#d4edda', border: '#c3e6cb', text: '#155724' },
                error: { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24' },
                info: { bg: '#d1ecf1', border: '#bee5eb', text: '#0c5460' }
            };

            const color = colors[type] || colors.info;
            messageContainer.style.backgroundColor = color.bg;
            messageContainer.style.borderLeft = `4px solid ${color.border}`;
            messageContainer.style.color = color.text;
            messageContainer.textContent = message;
            messageContainer.style.display = 'block';

            // 3秒後に自動で非表示
            setTimeout(() => {
                if (messageContainer) {
                    messageContainer.style.display = 'none';
                }
            }, 3000);
        };
        
        console.log('DataManager拡張メソッド追加完了:', {
            saveDesignToDatabase: typeof this.dataManager.saveDesignToDatabase,
            loadDesignFromDatabase: typeof this.dataManager.loadDesignFromDatabase,
            getSavedDesigns: typeof this.dataManager.getSavedDesigns,
            deleteDesignFromDatabase: typeof this.dataManager.deleteDesignFromDatabase
        });
        
        // グローバルデバッグ関数追加
        window.debugDataManager = () => {
            console.log('=== DataManager Debug Info ===');
            console.log('ShelfDesigner:', window.shelfDesigner);
            console.log('DataManager:', window.shelfDesigner?.dataManager);
            console.log('API Client:', window.shelfDesignerAPI);
            console.log('拡張メソッド確認:', {
                saveDesignToDatabase: typeof window.shelfDesigner?.dataManager?.saveDesignToDatabase,
                loadDesignFromDatabase: typeof window.shelfDesigner?.dataManager?.loadDesignFromDatabase,
                getSavedDesigns: typeof window.shelfDesigner?.dataManager?.getSavedDesigns,
                deleteDesignFromDatabase: typeof window.shelfDesigner?.dataManager?.deleteDesignFromDatabase
            });
            console.log('=============================');
        };
    }
    
    
    updateUI() {
        // 現在の状態に基づいてUI更新
        const templateData = this.templateManager.getTemplateData();
        const boardsData = this.boardManager.getBoardsData();
        const selectedObject = this.state.getSelectedObject();
        
        this.uiManager.updateDimensionsPanel(templateData, boardsData);
        this.uiManager.updateSelectionPanels(selectedObject);
    }
    
    performStructureCheck() {
        // FR008: 構造安全性チェック
        const templateData = this.templateManager.getTemplateData();
        const boardsData = this.boardManager.getBoardsData();
        
        const results = this.structureChecker.checkStructure(templateData, boardsData);
        this.uiManager.displayStructureResults(results);
    }
    
    handleKeyPress(key, event) {
        // キーボードショートカット処理
        if (event.ctrlKey || event.metaKey) {
            switch (key.toLowerCase()) {
                case 's':
                    event.preventDefault();
                    this.dataManager.saveDesign();
                    break;
                case 'o':
                    event.preventDefault();
                    document.getElementById('loadFile')?.click();
                    break;
                case 'z':
                    event.preventDefault();
                    // TODO: Undo機能実装
                    console.log('Undo (未実装)');
                    break;
                case 'y':
                    event.preventDefault();
                    // TODO: Redo機能実装
                    console.log('Redo (未実装)');
                    break;
            }
        } else {
            switch (key.toLowerCase()) {
                case 'delete':
                case 'backspace':
                    this.deleteSelectedObject();
                    break;
                case 't':
                    this.uiManager.showTemplateEditPanel();
                    break;
                case 'h':
                    this.boardManager.addBoard('horizontal');
                    this.updateUI();
                    break;
                case 'v':
                    this.boardManager.addBoard('vertical');
                    this.updateUI();
                    break;
                case 'r':
                    this.templateManager.resetToDefault();
                    this.updateUI();
                    break;
                case 'c':
                    this.performStructureCheck();
                    break;
                case 'escape':
                    this.state.setSelectedObject(null, null);
                    this.uiManager.hideAllPanels();
                    this.updateUI();
                    break;
            }
        }
    }
    
    deleteSelectedObject() {
        const selectedObject = this.state.getSelectedObject();
        if (selectedObject.type === 'independent' && selectedObject.object?.boardId) {
            this.boardManager.deleteBoard(selectedObject.object.boardId);
            this.state.setSelectedObject(null, null);
            this.uiManager.hideAllPanels();
            this.updateUI();
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // パフォーマンス監視
        const startTime = performance.now();
        this.viewportManager.render();
        const renderTime = performance.now() - startTime;
        
        // 60fps (16.67ms) を大幅に超える場合は警告
        if (renderTime > 25) {
            console.warn(`描画時間が遅い: ${renderTime.toFixed(2)}ms`);
        }
    }
}

/**
 * リアクティブ状態管理システム
 */
class StateManager {
    constructor() {
        this.state = {
            selectedObject: null,
            selectedType: null, // 'template' | 'templateBoard' | 'independent'
            editMode: 'template', // 'template' | 'individual' | 'mixed'
            templateActive: true
        };
        this.subscribers = new Map();
    }
    
    setSelectedObject(object, type) {
        this.state.selectedObject = object;
        this.state.selectedType = type;
        this.notify('selection', { object, type });
    }
    
    getSelectedObject() {
        return {
            object: this.state.selectedObject,
            type: this.state.selectedType
        };
    }
    
    setEditMode(mode) {
        this.state.editMode = mode;
        this.notify('editMode', mode);
    }
    
    getEditMode() {
        return this.state.editMode;
    }
    
    subscribe(event, callback) {
        if (!this.subscribers.has(event)) {
            this.subscribers.set(event, new Set());
        }
        this.subscribers.get(event).add(callback);
    }
    
    notify(event, data) {
        if (this.subscribers.has(event)) {
            this.subscribers.get(event).forEach(callback => callback(data));
        }
    }
}

/**
 * テンプレート管理（FR001-FR002）
 */
class TemplateManager {
    constructor(scene) {
        this.scene = scene;
        this.boxTemplate = null;
        this.templateGroup = new THREE.Group();
        this.scene.add(this.templateGroup);
        
        // デフォルト設定
        this.defaultSize = { width: 80, height: 180, depth: 35 };
        this.defaultMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    }
    
    createDefaultTemplate() {
        // FR001-1: 標準箱モジュールテンプレート自動配置
        this.boxTemplate = {
            id: 1,
            isActive: true,
            size: { ...this.defaultSize },
            position: { x: 0, y: 0, z: 0 },
            boards: {
                top: { type: 'top', enabled: true, thickness: 1.8, mesh: null },
                bottom: { type: 'bottom', enabled: true, thickness: 1.8, mesh: null },
                left: { type: 'left', enabled: true, thickness: 1.8, mesh: null },
                right: { type: 'right', enabled: true, thickness: 1.8, mesh: null },
                back: { type: 'back', enabled: true, thickness: 1.8, mesh: null }
            },
            material: { type: 'pine', thickness: 1.8, finish: 'natural', color: 'natural' },
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        this.buildTemplate();
        console.log('デフォルトテンプレート作成完了');
    }
    
    buildTemplate() {
        // 既存メッシュをクリア
        this.templateGroup.clear();
        
        if (!this.boxTemplate || !this.boxTemplate.isActive) return;
        
        const { width, height, depth } = this.boxTemplate.size;
        const thickness = 1.8; // 18mm → 1.8cm
        
        // 各板を作成
        Object.values(this.boxTemplate.boards).forEach(board => {
            // 既存meshの確実な削除（有効・無効問わず）
            if (board.mesh) {
                this.templateGroup.remove(board.mesh);
                if (board.mesh.geometry) {
                    board.mesh.geometry.dispose();
                }
                if (board.mesh.material) {
                    if (Array.isArray(board.mesh.material)) {
                        board.mesh.material.forEach(mat => mat.dispose());
                    } else {
                        board.mesh.material.dispose();
                    }
                }
                board.mesh = null;
            }
            
            // 有効な板のみ新しいmeshを生成・追加
            if (board.enabled) {
                board.mesh = this.createBoardMesh(board.type, width, height, depth, thickness);
                board.mesh.userData = {
                    type: 'templateBoard',
                    boardType: board.type,
                    templateId: this.boxTemplate.id
                };
                this.templateGroup.add(board.mesh);
            }
        });
        
        // テンプレート位置設定
        this.templateGroup.position.set(
            this.boxTemplate.position.x,
            this.boxTemplate.position.y,
            this.boxTemplate.position.z
        );
    }
    
    createBoardMesh(boardType, width, height, depth, thickness) {
        let geometry, position;
        
        switch (boardType) {
            case 'top':
                geometry = new THREE.BoxGeometry(width, thickness, depth);
                position = [0, height - thickness/2, 0];
                break;
            case 'bottom':
                geometry = new THREE.BoxGeometry(width, thickness, depth);
                position = [0, thickness/2, 0];
                break;
            case 'left':
                geometry = new THREE.BoxGeometry(thickness, height, depth);
                position = [-width/2 + thickness/2, height/2, 0];
                break;
            case 'right':
                geometry = new THREE.BoxGeometry(thickness, height, depth);
                position = [width/2 - thickness/2, height/2, 0];
                break;
            case 'back':
                geometry = new THREE.BoxGeometry(width, height, thickness);
                position = [0, height/2, -depth/2 + thickness/2];
                break;
        }
        
        const mesh = new THREE.Mesh(geometry, this.defaultMaterial);
        mesh.position.set(...position);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        return mesh;
    }
    
    updateTemplateSize(newSize) {
        // FR001-2: テンプレート全体サイズ調整機能
        if (!this.boxTemplate) return;
        
        this.boxTemplate.size = { ...this.boxTemplate.size, ...newSize };
        this.boxTemplate.updatedAt = new Date();
        this.buildTemplate();
        
        console.log('テンプレートサイズ更新:', this.boxTemplate.size);
    }
    
    toggleBoard(boardType, enabled) {
        // FR001-3: テンプレート個別板の有効/無効切替機能
        if (!this.boxTemplate || !this.boxTemplate.boards[boardType]) return;
        
        this.boxTemplate.boards[boardType].enabled = enabled;
        this.boxTemplate.updatedAt = new Date();
        this.buildTemplate();
        
        console.log(`${boardType}板を${enabled ? '有効' : '無効'}化`);
    }
    
    resetToDefault() {
        // FR001-4: テンプレートリセット・初期状態復元機能
        this.boxTemplate.size = { ...this.defaultSize };
        Object.values(this.boxTemplate.boards).forEach(board => {
            board.enabled = true;
        });
        this.boxTemplate.updatedAt = new Date();
        this.buildTemplate();
        
        console.log('テンプレートを初期状態にリセット');
    }
    
    
    
    
    getTemplateData() {
        return this.boxTemplate;
    }
    
    loadTemplateData(templateData) {
        // データ読込時のテンプレート復元
        this.boxTemplate = {
            ...templateData,
            boards: {
                top: { ...templateData.boards.top, mesh: null },
                bottom: { ...templateData.boards.bottom, mesh: null },
                left: { ...templateData.boards.left, mesh: null },
                right: { ...templateData.boards.right, mesh: null },
                back: { ...templateData.boards.back, mesh: null }
            }
        };
        this.buildTemplate();
        console.log('テンプレートデータ復元完了');
    }
}

/**
 * 個別板管理（FR003）
 */
class BoardManager {
    constructor(scene) {
        this.scene = scene;
        this.boards = new Map();
        this.boardCounter = 0;
        this.selectedBoard = null;
        this.boardGroup = new THREE.Group();
        this.scene.add(this.boardGroup);
        
        this.defaultMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    }
    
    addBoard(orientation, position = { x: 20, y: 20, z: 0 }) {
        // FR003-1, FR003-2: 水平板・垂直板追加
        const boardId = ++this.boardCounter;
        
        const boardData = {
            id: boardId,
            position: { ...position },
            dimensions: {
                length: orientation === 'horizontal' ? 60 : 60,
                width: orientation === 'horizontal' ? 30 : 30,
                thickness: 1.8
            },
            orientation: orientation,
            rotation: orientation === 'vertical' 
                ? { x: 0, y: 90, z: 0 }  // 垂直板はY軸90度回転で立てる
                : { x: 0, y: 0, z: 0 },
            material: {
                type: 'pine',
                thickness: 1.8,
                finish: 'natural',
                color: 'natural'
            },
            isFromTemplate: false,
            parentTemplateId: null,
            enabled: true,
            mesh: null,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        this.boards.set(boardId, boardData);
        this.buildBoard(boardData);
        
        console.log(`${orientation}板追加 (ID: ${boardId})`);
        return boardData;
    }
    
    
    buildBoard(boardData) {
        // 既存メッシュを削除（メモリリーク防止）
        if (boardData.mesh) {
            this.boardGroup.remove(boardData.mesh);
            if (boardData.mesh.geometry) {
                boardData.mesh.geometry.dispose();
            }
            if (boardData.mesh.material) {
                if (Array.isArray(boardData.mesh.material)) {
                    boardData.mesh.material.forEach(mat => mat.dispose());
                } else {
                    boardData.mesh.material.dispose();
                }
            }
        }
        
        const { length, width, thickness } = boardData.dimensions;
        const geometry = new THREE.BoxGeometry(length, thickness, width);
        const mesh = new THREE.Mesh(geometry, this.defaultMaterial);
        
        // 位置・回転設定
        mesh.position.set(boardData.position.x, boardData.position.y, boardData.position.z);
        mesh.rotation.set(
            THREE.MathUtils.degToRad(boardData.rotation.x),
            THREE.MathUtils.degToRad(boardData.rotation.y),
            THREE.MathUtils.degToRad(boardData.rotation.z)
        );
        
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = {
            type: 'independentBoard',
            boardId: boardData.id
        };
        
        boardData.mesh = mesh;
        this.boardGroup.add(mesh);
    }
    
    updateBoard(boardId, updates) {
        // FR003-3: 追加板の3D空間自由配置・ドラッグ移動
        const board = this.boards.get(boardId);
        if (!board) return;
        
        // 深い階層の更新を適切に処理
        if (updates.dimensions) {
            board.dimensions = { ...board.dimensions, ...updates.dimensions };
        }
        if (updates.position) {
            board.position = { ...board.position, ...updates.position };
        }
        if (updates.rotation) {
            board.rotation = { ...board.rotation, ...updates.rotation };
        }
        
        // その他のプロパティを更新
        Object.keys(updates).forEach(key => {
            if (key !== 'dimensions' && key !== 'position' && key !== 'rotation') {
                board[key] = updates[key];
            }
        });
        
        board.updatedAt = new Date();
        this.buildBoard(board);
        
        console.log(`板更新 (ID: ${boardId}):`, updates);
    }
    
    deleteBoard(boardId) {
        const board = this.boards.get(boardId);
        if (!board) return false;
        
        // 適切なリソース解放
        if (board.mesh) {
            this.boardGroup.remove(board.mesh);
            if (board.mesh.geometry) {
                board.mesh.geometry.dispose();
            }
            if (board.mesh.material) {
                if (Array.isArray(board.mesh.material)) {
                    board.mesh.material.forEach(mat => mat.dispose());
                } else {
                    board.mesh.material.dispose();
                }
            }
        }
        
        this.boards.delete(boardId);
        console.log(`板削除 (ID: ${boardId})`);
        return true;
    }
    
    setOrientation(boardId, orientation) {
        // FR003-4: 追加板の向き切替（水平⇔垂直）
        const board = this.boards.get(boardId);
        if (!board) return;
        
        const oldLength = board.dimensions.length;
        const oldWidth = board.dimensions.width;
        
        board.orientation = orientation;
        board.dimensions.length = orientation === 'horizontal' ? Math.max(oldLength, oldWidth) : Math.min(oldLength, oldWidth);
        board.dimensions.width = orientation === 'horizontal' ? Math.min(oldLength, oldWidth) : Math.max(oldLength, oldWidth);
        board.updatedAt = new Date();
        
        this.buildBoard(board);
        console.log(`板の向きを${orientation}に変更 (ID: ${boardId})`);
    }
    
    rotate(boardId, axis, angle) {
        // FR003-4: 90度刻み回転
        const board = this.boards.get(boardId);
        if (!board) return;
        
        board.rotation[axis] = (board.rotation[axis] + angle) % 360;
        board.updatedAt = new Date();
        this.buildBoard(board);
        
        console.log(`板回転 (ID: ${boardId}): ${axis}軸 ${angle}度`);
    }
    
    getBoardsData() {
        return Array.from(this.boards.values());
    }
    
    getBoard(boardId) {
        return this.boards.get(boardId);
    }
    
    loadBoardsData(boardsData) {
        // データ読込時の個別板復元
        this.boards.clear();
        this.boardGroup.clear();
        
        let maxId = 0;
        boardsData.forEach(boardData => {
            const board = {
                ...boardData,
                mesh: null
            };
            this.boards.set(board.id, board);
            this.buildBoard(board);
            maxId = Math.max(maxId, board.id);
        });
        
        this.boardCounter = maxId;
        console.log('個別板データ復元完了:', boardsData.length, '枚');
    }
}

/**
 * 3D描画・可視化管理
 */
class ViewportManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.canvas = null;
        this.controls = null;
        
        // カメラ制御
        this.cameraRadius = 200;
        this.cameraTargetX = 0;
        this.cameraTargetY = 0;
        this.cameraTargetZ = 0;
        this.isMouseDown = false;
        this.isPanMode = false; // 右クリックでパンモード
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetRotationX = 0;
        this.targetRotationY = 0;
    }
    
    async init() {
        // キャンバス取得
        this.canvas = document.getElementById('canvas');
        const viewport = this.canvas.parentElement;
        
        // シーンの初期化
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf0f0f0);
        
        // カメラの設定
        this.camera = new THREE.PerspectiveCamera(
            75,
            viewport.clientWidth / viewport.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(150, 120, 150);
        this.camera.lookAt(0, 0, 0);
        
        // レンダラーの設定
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        });
        this.renderer.setSize(viewport.clientWidth, viewport.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // ライティング設定
        this.setupLighting();
        
        // 床・グリッド作成
        this.createFloorAndGrid();
        
        // ウィンドウリサイズ対応
        window.addEventListener('resize', () => this.onWindowResize());
        
        // カメラコントロール設定
        this.setupCameraControls();
        
        console.log('ViewportManager初期化完了');
    }
    
    setupLighting() {
        // 環境光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        // 方向光
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 200, 100);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -200;
        directionalLight.shadow.camera.right = 200;
        directionalLight.shadow.camera.top = 200;
        directionalLight.shadow.camera.bottom = -200;
        this.scene.add(directionalLight);
    }
    
    createFloorAndGrid() {
        // 床面グリッド
        const gridHelper = new THREE.GridHelper(400, 40, 0x888888, 0xcccccc);
        gridHelper.position.y = -1;
        this.scene.add(gridHelper);
        
        // 床面
        const floorGeometry = new THREE.PlaneGeometry(400, 400);
        const floorMaterial = new THREE.MeshLambertMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -1;
        floor.receiveShadow = true;
        this.scene.add(floor);
    }
    
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    
    setupCameraControls() {
        this.canvas.addEventListener('mousedown', (event) => {
            if (event.button === 0 || event.button === 1) { // 左クリックまたは中ボタンで回転操作
                this.isMouseDown = true;
                this.isPanMode = false;
                this.mouseX = event.clientX;
                this.mouseY = event.clientY;
                console.log('カメラ回転操作開始:', event.button === 0 ? '左クリック' : '中ボタン');
                event.preventDefault();
            } else if (event.button === 2) { // 右クリックでパン操作
                this.isMouseDown = true;
                this.isPanMode = true;
                this.mouseX = event.clientX;
                this.mouseY = event.clientY;
                console.log('カメラパン操作開始: 右クリック');
                event.preventDefault();
            }
        });
        
        this.canvas.addEventListener('mousemove', (event) => {
            if (this.isMouseDown) {
                const deltaX = event.clientX - this.mouseX;
                const deltaY = event.clientY - this.mouseY;
                
                if (this.isPanMode) {
                    // 右クリック: パン操作
                    const panSensitivity = 0.5;
                    this.cameraTargetX -= deltaX * panSensitivity;
                    this.cameraTargetY += deltaY * panSensitivity;
                    console.log('カメラパン:', this.cameraTargetX.toFixed(1), this.cameraTargetY.toFixed(1));
                } else {
                    // 左クリック/中ボタン: 回転操作
                    this.targetRotationX += deltaX * 0.01;
                    this.targetRotationY += deltaY * 0.01;
                    
                    // Y軸回転を制限
                    this.targetRotationY = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.targetRotationY));
                }
                
                this.updateCameraPosition();
                
                this.mouseX = event.clientX;
                this.mouseY = event.clientY;
                event.preventDefault();
            }
        });
        
        this.canvas.addEventListener('mouseup', (event) => {
            if (event.button === 0 || event.button === 1 || event.button === 2) {
                this.isMouseDown = false;
                this.isPanMode = false;
                console.log('カメラ操作終了');
                event.preventDefault();
            }
        });
        
        this.canvas.addEventListener('wheel', (event) => {
            // マウスホイールでズーム
            const scale = event.deltaY > 0 ? 1.1 : 0.9;
            this.cameraRadius = Math.max(50, Math.min(500, this.cameraRadius * scale));
            this.updateCameraPosition();
            event.preventDefault();
        });
        
        // コンテキストメニューを無効化
        this.canvas.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
    }
    
    updateCameraPosition() {
        const x = Math.cos(this.targetRotationX) * Math.cos(this.targetRotationY) * this.cameraRadius;
        const y = Math.sin(this.targetRotationY) * this.cameraRadius + 50;
        const z = Math.sin(this.targetRotationX) * Math.cos(this.targetRotationY) * this.cameraRadius;
        
        this.camera.position.set(x, y, z);
        this.camera.lookAt(this.cameraTargetX, this.cameraTargetY, this.cameraTargetZ);
    }
    
    focusOnObject(position) {
        this.cameraTargetX = position.x;
        this.cameraTargetY = position.y;
        this.cameraTargetZ = position.z;
        this.updateCameraPosition();
    }
    
    onWindowResize() {
        const viewport = this.canvas.parentElement;
        this.camera.aspect = viewport.clientWidth / viewport.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(viewport.clientWidth, viewport.clientHeight);
    }
}

/**
 * イベント管理システム
 */
class EventManager {
    constructor(canvas, camera) {
        this.canvas = canvas;
        this.camera = camera;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        this.listeners = new Map();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // マウスイベント
        this.canvas.addEventListener('click', (event) => this.onMouseClick(event));
        this.canvas.addEventListener('dblclick', (event) => this.onMouseDoubleClick(event));
        
        // キーボードイベント
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
    }
    
    onMouseClick(event) {
        this.updateMousePosition(event);
        const intersectedObject = this.getIntersectedObject();
        
        if (intersectedObject) {
            const userData = intersectedObject.userData;
            
            switch (userData.type) {
                case 'templateBoard':
                    console.log('テンプレート板クリック:', userData);
                    this.emit('templateBoardClicked', userData);
                    break;
                case 'independentBoard':
                    console.log('個別板クリック:', userData);
                    this.emit('independentBoardClicked', userData);
                    break;
                case 'template':
                    console.log('テンプレート全体クリック:', userData);
                    this.emit('templateClicked', userData);
                    break;
                default:
                    console.log('不明なオブジェクトクリック:', userData);
                    this.emit('backgroundClicked');
            }
        } else {
            console.log('背景クリック検出');
            this.emit('backgroundClicked');
        }
    }
    
    onMouseDoubleClick(event) {
        this.updateMousePosition(event);
        const intersectedObject = this.getIntersectedObject();
        
        if (intersectedObject) {
            const userData = intersectedObject.userData;
            this.emit('objectDoubleClicked', userData);
        }
    }
    
    onKeyDown(event) {
        this.emit('keyPressed', { key: event.key, event });
    }
    
    updateMousePosition(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }
    
    getIntersectedObject() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // グローバルなシーン参照を取得
        const scene = window.shelfDesigner?.viewportManager?.scene;
        if (!scene) return null;
        
        // シーン内の全オブジェクトと交差判定
        const intersects = this.raycaster.intersectObjects(scene.children, true);
        
        if (intersects.length > 0) {
            return intersects[0].object;
        }
        return null;
    }
    
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
    }
    
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => callback(data));
        }
    }
}

/**
 * UI管理システム
 */
class UIManager {
    constructor() {
        this.currentPanel = 'template';
        this.listeners = new Map();
        this.highlightedObject = null;
        
        // DOM読み込み完了後にUIイベントリスナーを設定
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                console.log('DOMContentLoaded: UIEventListeners初期化開始');
                this.setupUIEventListeners();
            });
        } else {
            console.log('DOM既に読み込み済み: UIEventListeners即座に初期化');
            this.setupUIEventListeners();
        }
    }
    
    setupUIEventListeners() {
        console.log('UIEventListeners設定開始');
        
        // テンプレートサイズスライダー
        ['width', 'height', 'depth'].forEach(dimension => {
            const slider = document.getElementById(`${dimension}Slider`);
            const value = document.getElementById(`${dimension}Value`);
            
            if (slider && value) {
                console.log(`${dimension}スライダー: イベントリスナー設定完了`);
                slider.addEventListener('input', (e) => {
                    const newValue = parseInt(e.target.value);
                    value.textContent = newValue;
                    console.log(`${dimension}サイズ変更:`, newValue);
                    this.emit('templateSizeChanged', { [dimension]: newValue });
                });
            } else {
                console.warn(`${dimension}スライダー要素が見つかりません:`, {slider, value});
            }
        });
        
        // 板の有効/無効切替
        ['top', 'bottom', 'left', 'right', 'back'].forEach(boardType => {
            const checkbox = document.getElementById(`${boardType}Enabled`);
            if (checkbox) {
                console.log(`${boardType}板チェックボックス: イベントリスナー設定完了`);
                checkbox.addEventListener('change', (e) => {
                    console.log(`${boardType}板切替:`, e.target.checked);
                    this.emit('boardToggled', boardType, e.target.checked);
                });
            } else {
                console.warn(`${boardType}板チェックボックスが見つかりません`);
            }
        });
        
        // 個別板追加ボタン
        const addHorizontalBtn = document.getElementById('addHorizontalBoard');
        const addVerticalBtn = document.getElementById('addVerticalBoard');
        
        if (addHorizontalBtn) {
            console.log('水平板追加ボタン: イベントリスナー設定完了');
            addHorizontalBtn.addEventListener('click', () => {
                console.log('水平板追加ボタンクリック');
                this.emit('addHorizontalBoard');
            });
        } else {
            console.warn('水平板追加ボタンが見つかりません');
        }
        
        if (addVerticalBtn) {
            console.log('垂直板追加ボタン: イベントリスナー設定完了');
            addVerticalBtn.addEventListener('click', () => {
                console.log('垂直板追加ボタンクリック');
                this.emit('addVerticalBoard');
            });
        } else {
            console.warn('垂直板追加ボタンが見つかりません');
        }
        
        // その他のボタン
        const resetBtn = document.getElementById('resetTemplate');
        
        if (resetBtn) {
            console.log('リセットボタン: イベントリスナー設定完了');
            resetBtn.addEventListener('click', () => {
                console.log('リセットボタンクリック');
                this.emit('resetTemplate');
            });
        } else {
            console.warn('リセットボタンが見つかりません');
        }
        
        // 構造チェックボタン（JavaScriptで動的作成）
        console.log('構造チェックボタン作成開始');
        this.createStructureCheckButton();
        
        console.log('UIEventListeners設定完了');
    }
    
    showTemplateEditPanel() {
        this.hideAllPanels();
        // テンプレート編集コントロールは常に表示されているのでパネル切替は不要
        this.currentPanel = 'template';
    }
    
    showTemplateBoardPanel() {
        this.hideAllPanels();
        const panel = document.getElementById('templateBoardPanel');
        if (panel) {
            panel.style.display = 'block';
        }
        this.currentPanel = 'templateBoard';
    }
    
    showIndividualBoardPanel() {
        this.hideAllPanels();
        const panel = document.getElementById('individualBoardPanel');
        if (panel) {
            panel.style.display = 'block';
        }
        this.currentPanel = 'individual';
    }
    
    hideAllPanels() {
        ['templateBoardPanel', 'individualBoardPanel'].forEach(panelId => {
            const panel = document.getElementById(panelId);
            if (panel) {
                panel.style.display = 'none';
            }
        });
    }
    
    updateDimensionsPanel(templateData, boardsData) {
        const templateSize = document.getElementById('templateSize');
        const independentCount = document.getElementById('independentCount');
        const editMode = document.getElementById('editMode');
        
        if (templateData && templateSize) {
            const { width, height, depth } = templateData.size;
            templateSize.textContent = `${width}×${height}×${depth}cm`;
        }
        
        if (independentCount) {
            independentCount.textContent = boardsData.length;
        }
        
        if (editMode) {
            editMode.textContent = this.currentPanel === 'template' ? 'テンプレート' : 
                                   this.currentPanel === 'individual' ? '個別板' : '混在';
        }
        
        // 個別板一覧を更新
        this.updateIndependentBoardsList(boardsData);
    }
    
    updateIndependentBoardsList(boardsData) {
        const container = document.getElementById('independentBoardsList');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (boardsData.length === 0) {
            container.innerHTML = '<div style="font-size: 10px; color: #999; text-align: center; padding: 10px;">個別板はありません</div>';
            return;
        }
        
        boardsData.forEach(board => {
            const boardItem = document.createElement('div');
            boardItem.className = 'shelf-item';
            boardItem.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: bold;">板${board.id}</div>
                        <div style="font-size: 10px; color: #666;">${board.orientation} ${board.dimensions.length}×${board.dimensions.width}×${board.dimensions.thickness}cm</div>
                    </div>
                    <div>
                        <button class="thickness-btn" data-board-id="${board.id}" data-action="select" style="margin-right: 3px;">選択</button>
                        <button class="remove-btn" data-board-id="${board.id}" data-action="delete">削除</button>
                    </div>
                </div>
            `;
            
            // イベントリスナー設定
            const selectBtn = boardItem.querySelector('[data-action="select"]');
            const deleteBtn = boardItem.querySelector('[data-action="delete"]');
            
            selectBtn.addEventListener('click', () => {
                this.emit('selectIndependentBoard', board.id);
            });
            
            deleteBtn.addEventListener('click', () => {
                this.emit('deleteIndependentBoard', board.id);
            });
            
            container.appendChild(boardItem);
        });
    }
    
    updateSelectionPanels(selectedObject) {
        // 選択オブジェクトに応じてパネル内容を更新
        if (selectedObject.type === 'templateBoard') {
            this.updateTemplateBoardPanel(selectedObject.object);
            this.highlightSelectedObject(selectedObject.object);
        } else if (selectedObject.type === 'independent') {
            this.updateIndividualBoardPanel(selectedObject.object);
            this.highlightSelectedObject(selectedObject.object);
        }
    }
    
    highlightSelectedObject(boardData) {
        // 既存のハイライトを解除
        this.clearHighlight();
        
        // 新しいオブジェクトをハイライト - メッシュを直接取得
        const scene = window.shelfDesigner?.viewportManager?.scene;
        if (!scene) return;
        
        scene.traverse((object) => {
            if (object.userData && 
                ((object.userData.type === 'templateBoard' && object.userData.boardType === boardData.boardType) ||
                 (object.userData.type === 'independentBoard' && object.userData.boardId === boardData.boardId))) {
                object.material = object.material.clone();
                object.material.emissive.setHex(0x444444);
                this.highlightedObject = object;
            }
        });
    }
    
    clearHighlight() {
        if (this.highlightedObject) {
            this.highlightedObject.material.emissive.setHex(0x000000);
            this.highlightedObject = null;
        }
    }
    
    updateTemplateBoardPanel(boardData) {
        const info = document.getElementById('templateBoardInfo');
        if (info) {
            info.innerHTML = `
                <div><strong>${this.getBoardTypeName(boardData.boardType)}</strong></div>
                <div style="font-size: 10px; color: #666;">テンプレート板</div>
            `;
        }
    }
    
    updateIndividualBoardPanel(boardData) {
        const info = document.getElementById('individualBoardInfo');
        const sizeControls = document.getElementById('individualBoardSizeControls');
        const positionControls = document.getElementById('individualBoardPositionControls');
        
        if (info) {
            info.innerHTML = `
                <div><strong>個別板 ${boardData.boardId}</strong></div>
                <div style="font-size: 10px; color: #666;">${boardData.orientation || 'horizontal'}</div>
            `;
        }
        
        // 寸法調整コントロール
        if (sizeControls) {
            const board = window.shelfDesigner?.boardManager?.getBoard(boardData.boardId);
            if (board) {
                sizeControls.innerHTML = `
                    <div style="margin-bottom: 8px;">
                        <label style="font-size: 11px;">長さ: </label>
                        <input type="number" id="boardLength" value="${board.dimensions.length}" min="10" max="300" style="width: 60px; font-size: 11px;">cm
                    </div>
                    <div style="margin-bottom: 8px;">
                        <label style="font-size: 11px;">幅: </label>
                        <input type="number" id="boardWidth" value="${board.dimensions.width}" min="10" max="200" style="width: 60px; font-size: 11px;">cm
                    </div>
                    <div style="margin-bottom: 8px;">
                        <label style="font-size: 11px;">厚み: </label>
                        <input type="number" id="boardThickness" value="${board.dimensions.thickness}" min="0.9" max="5" step="0.1" style="width: 60px; font-size: 11px;">cm
                    </div>
                `;
            }
        }
        
        // 位置調整コントロール
        if (positionControls) {
            const board = window.shelfDesigner?.boardManager?.getBoard(boardData.boardId);
            if (board) {
                positionControls.innerHTML = `
                    <div style="margin-bottom: 8px;">
                        <label style="font-size: 11px;">X (左右): </label>
                        <input type="number" id="boardPosX" value="${board.position.x.toFixed(1)}" step="0.5" style="width: 60px; font-size: 11px;">cm
                    </div>
                    <div style="margin-bottom: 8px;">
                        <label style="font-size: 11px;">Y (上下): </label>
                        <input type="number" id="boardPosY" value="${board.position.y.toFixed(1)}" step="0.5" style="width: 60px; font-size: 11px;">cm
                    </div>
                    <div style="margin-bottom: 8px;">
                        <label style="font-size: 11px;">Z (前後): </label>
                        <input type="number" id="boardPosZ" value="${board.position.z.toFixed(1)}" step="0.5" style="width: 60px; font-size: 11px;">cm
                    </div>
                `;
            }
        }
        
        // 寸法・位置コントロールのイベントリスナー設定
        this.setupIndividualBoardControls(boardData.boardId);
    }
    
    setupIndividualBoardControls(boardId) {
        // 寸法調整
        const lengthInput = document.getElementById('boardLength');
        const widthInput = document.getElementById('boardWidth');
        const thicknessInput = document.getElementById('boardThickness');
        
        // 位置調整
        const posXInput = document.getElementById('boardPosX');
        const posYInput = document.getElementById('boardPosY');
        const posZInput = document.getElementById('boardPosZ');
        
        // 向き変更ボタン
        const horizontalBtn = document.getElementById('setHorizontal');
        const verticalBtn = document.getElementById('setVertical');
        const rotationInput = document.getElementById('boardRotation');
        
        // 削除ボタン
        const deleteBtn = document.getElementById('deleteIndividualBoard');
        
        if (lengthInput) {
            lengthInput.addEventListener('input', (e) => {
                this.emit('updateBoardDimension', boardId, 'length', parseFloat(e.target.value));
            });
        }
        
        if (widthInput) {
            widthInput.addEventListener('input', (e) => {
                this.emit('updateBoardDimension', boardId, 'width', parseFloat(e.target.value));
            });
        }
        
        if (thicknessInput) {
            thicknessInput.addEventListener('input', (e) => {
                this.emit('updateBoardDimension', boardId, 'thickness', parseFloat(e.target.value));
            });
        }
        
        if (posXInput) {
            posXInput.addEventListener('input', (e) => {
                this.emit('updateBoardPosition', boardId, 'x', parseFloat(e.target.value));
            });
        }
        
        if (posYInput) {
            posYInput.addEventListener('input', (e) => {
                this.emit('updateBoardPosition', boardId, 'y', parseFloat(e.target.value));
            });
        }
        
        if (posZInput) {
            posZInput.addEventListener('input', (e) => {
                this.emit('updateBoardPosition', boardId, 'z', parseFloat(e.target.value));
            });
        }
        
        if (horizontalBtn) {
            horizontalBtn.addEventListener('click', () => {
                this.emit('setBoardOrientation', boardId, 'horizontal');
            });
        }
        
        if (verticalBtn) {
            verticalBtn.addEventListener('click', () => {
                this.emit('setBoardOrientation', boardId, 'vertical');
            });
        }
        
        if (rotationInput) {
            rotationInput.addEventListener('input', (e) => {
                this.emit('rotateBoardY', boardId, parseFloat(e.target.value));
            });
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.emit('deleteIndividualBoard', boardId);
            });
        }
    }
    
    getBoardTypeName(boardType) {
        const names = {
            'top': '天板',
            'bottom': '底板', 
            'left': '左側板',
            'right': '右側板',
            'back': '背板'
        };
        return names[boardType] || boardType;
    }
    
    createStructureCheckButton() {
        // データ管理セクションの後に構造チェックセクションを動的作成
        const dataSection = document.getElementById('dataSection');
        console.log('データ管理セクション検索結果:', dataSection);
        
        if (dataSection && !document.getElementById('structureCheck')) {
            console.log('構造チェックボタンを動的作成中...');
            const structureSection = document.createElement('div');
            structureSection.className = 'control-group';
            structureSection.innerHTML = `
                <h3>構造・安全性</h3>
                <div style="margin-bottom: 10px;">
                    <button id="structureCheck" class="add-btn" style="width: 100%;">構造チェック実行</button>
                </div>
                <div id="structureResults" style="font-size: 10px; color: #666; padding: 8px; background: #f8f9fa; border-radius: 4px; display: none;">
                    <!-- 構造チェック結果 -->
                </div>
            `;
            
            dataSection.parentNode.insertBefore(structureSection, dataSection.nextSibling);
            
            // イベントリスナー設定
            const structureBtn = document.getElementById('structureCheck');
            if (structureBtn) {
                console.log('構造チェックボタン: イベントリスナー設定完了');
                structureBtn.addEventListener('click', () => {
                    console.log('構造チェックボタンクリック');
                    this.emit('structureCheck');
                });
            } else {
                console.error('構造チェックボタンの取得に失敗');
            }
        } else {
            console.warn('構造チェックボタン作成条件が満たされません:', {dataSection, existingButton: document.getElementById('structureCheck')});
        }
    }
    
    displayStructureResults(results) {
        const resultsDiv = document.getElementById('structureResults');
        if (!resultsDiv) return;
        
        resultsDiv.style.display = 'block';
        
        let html = '<div style="margin-bottom: 8px;"><strong>構造チェック結果</strong></div>';
        
        // 統計情報
        html += `
            <div style="margin-bottom: 8px; padding: 4px; background: #e9ecef; border-radius: 3px;">
                <div>総重量: ${results.stats.totalWeight}kg</div>
                <div>最大スパン: ${results.stats.maxSpan}cm</div>
                <div>概算コスト: ¥${results.stats.estimatedCost.toLocaleString()}</div>
            </div>
        `;
        
        // 総合評価
        const statusColors = {
            safe: '#28a745',
            warning: '#ffc107', 
            danger: '#dc3545'
        };
        
        const statusTexts = {
            safe: '✓ 安全',
            warning: '⚠ 注意',
            danger: '✗ 危険'
        };
        
        html += `
            <div style="margin-bottom: 8px; padding: 4px; color: white; background: ${statusColors[results.overall]}; border-radius: 3px; text-align: center;">
                ${statusTexts[results.overall]}
            </div>
        `;
        
        // 問題点
        if (results.issues.length > 0) {
            html += '<div style="margin-bottom: 8px;"><strong>問題点:</strong></div>';
            results.issues.forEach(issue => {
                const color = issue.severity === 'danger' ? '#dc3545' : '#ffc107';
                html += `
                    <div style="margin-bottom: 4px; padding: 3px; background: #fff; border-left: 3px solid ${color}; font-size: 9px;">
                        <div style="font-weight: bold;">${issue.message}</div>
                        <div style="color: #666;">${issue.description}</div>
                    </div>
                `;
            });
        }
        
        // 推奨事項
        if (results.recommendations.length > 0) {
            html += '<div style="margin-top: 8px; margin-bottom: 4px;"><strong>推奨事項:</strong></div>';
            results.recommendations.forEach(rec => {
                html += `<div style="margin-bottom: 2px; font-size: 9px; color: #666;">• ${rec}</div>`;
            });
        }
        
        resultsDiv.innerHTML = html;
    }
    
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
    }
    
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => callback(data));
        }
    }
}

/**
 * 構造安全性チェッカー (FR008)
 */
class StructureChecker {
    constructor() {
        // 材料定義（簡易版）
        this.materials = {
            pine: { 
                density: 500, // kg/m³
                strength: 40, // N/mm²
                cost: 3000 // 円/m²
            },
            plywood: { 
                density: 600, 
                strength: 60, 
                cost: 2500 
            },
            mdf: { 
                density: 750, 
                strength: 25, 
                cost: 2000 
            },
            laminated: { 
                density: 450, 
                strength: 50, 
                cost: 4500 
            }
        };
        
        // 安全係数
        this.safetyFactor = 2.0;
    }
    
    checkStructure(templateData, boardsData) {
        const results = {
            overall: 'safe', // 'safe' | 'warning' | 'danger'
            issues: [],
            recommendations: [],
            stats: {
                totalWeight: 0,
                maxSpan: 0,
                estimatedCost: 0
            }
        };
        
        try {
            // 重量計算
            results.stats.totalWeight = this.calculateWeight(templateData, boardsData);
            
            // スパン計算
            results.stats.maxSpan = this.calculateMaxSpan(templateData, boardsData);
            
            // コスト計算
            results.stats.estimatedCost = this.calculateCost(templateData, boardsData);
            
            // 構造チェック実行
            this.checkLoadCapacity(templateData, boardsData, results);
            this.checkStability(templateData, boardsData, results);
            this.checkMaterialThickness(templateData, boardsData, results);
            this.checkSpanLimits(templateData, boardsData, results);
            
            // 総合評価
            if (results.issues.some(issue => issue.severity === 'danger')) {
                results.overall = 'danger';
            } else if (results.issues.some(issue => issue.severity === 'warning')) {
                results.overall = 'warning';
            }
            
        } catch (error) {
            console.error('構造チェックエラー:', error);
            results.overall = 'danger';
            results.issues.push({
                type: 'system',
                severity: 'danger',
                message: '構造チェック中にエラーが発生しました',
                description: error.message
            });
        }
        
        return results;
    }
    
    calculateWeight(templateData, boardsData) {
        let totalWeight = 0;
        
        // テンプレート板の重量
        if (templateData) {
            const material = this.materials[templateData.material.type] || this.materials.pine;
            Object.values(templateData.boards).forEach(board => {
                if (board.enabled) {
                    const dimensions = this.getTemplateBoardDimensions(board.type, templateData.size);
                    const volume = (dimensions.length / 100) * (dimensions.width / 100) * (dimensions.thickness / 1000);
                    totalWeight += volume * material.density;
                }
            });
        }
        
        // 個別板の重量
        boardsData.forEach(board => {
            const material = this.materials[board.material.type] || this.materials.pine;
            const volume = (board.dimensions.length / 100) * (board.dimensions.width / 100) * (board.dimensions.thickness / 100);
            totalWeight += volume * material.density;
        });
        
        return Math.round(totalWeight * 10) / 10; // kg
    }
    
    calculateMaxSpan(templateData, boardsData) {
        let maxSpan = 0;
        
        if (templateData) {
            maxSpan = Math.max(maxSpan, templateData.size.width, templateData.size.height);
        }
        
        boardsData.forEach(board => {
            maxSpan = Math.max(maxSpan, board.dimensions.length, board.dimensions.width);
        });
        
        return maxSpan;
    }
    
    calculateCost(templateData, boardsData) {
        let totalCost = 0;
        
        // テンプレート板のコスト
        if (templateData) {
            const material = this.materials[templateData.material.type] || this.materials.pine;
            Object.values(templateData.boards).forEach(board => {
                if (board.enabled) {
                    const dimensions = this.getTemplateBoardDimensions(board.type, templateData.size);
                    const area = (dimensions.length / 100) * (dimensions.width / 100);
                    totalCost += area * material.cost;
                }
            });
        }
        
        // 個別板のコスト
        boardsData.forEach(board => {
            const material = this.materials[board.material.type] || this.materials.pine;
            const area = (board.dimensions.length / 100) * (board.dimensions.width / 100);
            totalCost += area * material.cost;
        });
        
        return Math.round(totalCost);
    }
    
    checkLoadCapacity(templateData, boardsData, results) {
        // 耐荷重チェック（簡易計算）
        if (templateData) {
            const material = this.materials[templateData.material.type] || this.materials.pine;
            const thickness = 18; // mm
            
            // 棚板の耐荷重チェック
            if (templateData.size.width > 100 && thickness < 18) {
                results.issues.push({
                    type: 'load_capacity',
                    severity: 'warning',
                    message: `幅${templateData.size.width}cmに対して板厚${thickness}mmは不足の可能性`,
                    description: '長いスパンには18mm以上の板厚を推奨します'
                });
                results.recommendations.push('板厚を18mm以上に変更することを検討してください');
            }
        }
    }
    
    checkStability(templateData, boardsData, results) {
        // 転倒リスク評価
        if (templateData) {
            const { width, height, depth } = templateData.size;
            const aspectRatio = height / Math.min(width, depth);
            
            if (aspectRatio > 4) {
                results.issues.push({
                    type: 'stability',
                    severity: 'warning',
                    message: `高さ${height}cm、奥行き${depth}cmは転倒リスクがあります`,
                    description: '高さに対して奥行きが不足しています'
                });
                results.recommendations.push('奥行きを増やすか、壁固定を検討してください');
            }
            
            if (aspectRatio > 6) {
                results.issues.push({
                    type: 'stability',
                    severity: 'danger',
                    message: '転倒の危険性が高いです',
                    description: 'このサイズ比は非常に不安定です'
                });
            }
        }
    }
    
    checkMaterialThickness(templateData, boardsData, results) {
        // 板厚チェック
        const minThickness = 12; // mm
        
        if (templateData) {
            Object.values(templateData.boards).forEach(board => {
                if (board.enabled && board.thickness < minThickness) {
                    results.issues.push({
                        type: 'thickness',
                        severity: 'warning',
                        message: `${this.getBoardTypeName(board.type)}の板厚${board.thickness}mmは薄すぎます`,
                        description: `最低${minThickness}mm以上を推奨します`
                    });
                }
            });
        }
        
        boardsData.forEach(board => {
            if (board.dimensions.thickness * 10 < minThickness) {
                results.issues.push({
                    type: 'thickness',
                    severity: 'warning',
                    message: `個別板${board.id}の板厚${board.dimensions.thickness}cmは薄すぎます`,
                    description: `最低${minThickness}mm以上を推奨します`
                });
            }
        });
    }
    
    checkSpanLimits(templateData, boardsData, results) {
        // スパン制限チェック
        const maxRecommendedSpan = 120; // cm
        
        if (templateData && templateData.size.width > maxRecommendedSpan) {
            results.issues.push({
                type: 'span',
                severity: 'warning',
                message: `幅${templateData.size.width}cmは推奨限界を超えています`,
                description: `${maxRecommendedSpan}cm以下を推奨します。支柱の追加を検討してください`
            });
        }
        
        boardsData.forEach(board => {
            if (board.dimensions.length > maxRecommendedSpan) {
                results.issues.push({
                    type: 'span',
                    severity: 'warning',
                    message: `個別板${board.id}の長さ${board.dimensions.length}cmは推奨限界を超えています`,
                    description: `支持を追加することを検討してください`
                });
            }
        });
    }
    
    getTemplateBoardDimensions(boardType, templateSize) {
        const { width, height, depth } = templateSize;
        
        switch (boardType) {
            case 'top':
            case 'bottom':
                return { length: width, width: depth, thickness: 1.8 };
            case 'left':
            case 'right':
                return { length: height, width: depth, thickness: 1.8 };
            case 'back':
                return { length: width, width: height, thickness: 1.8 };
            default:
                return { length: 0, width: 0, thickness: 1.8 };
        }
    }
    
    getBoardTypeName(boardType) {
        const names = {
            'top': '天板',
            'bottom': '底板',
            'left': '左側板',
            'right': '右側板',
            'back': '背板'
        };
        return names[boardType] || boardType;
    }
}

/**
 * データ管理システム (FR009)
 */
class DataManager {
    constructor() {
        console.log('DataManager初期化開始');
        
        // DOM読み込み完了後にイベントリスナーを設定
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                console.log('DOMContentLoaded: DataEventListeners初期化開始');
                this.setupDataEventListeners();
            });
        } else {
            console.log('DOM既に読み込み済み: DataEventListeners即座に初期化');
            this.setupDataEventListeners();
        }
    }
    
    setupDataEventListeners() {
        console.log('DataEventListeners設定開始');
        
        // データ保存・読込
        const saveBtn = document.getElementById('saveDesign');
        const loadBtn = document.getElementById('loadDesign');
        const loadFile = document.getElementById('loadFile');
        const exportBOMBtn = document.getElementById('exportBOM');
        const exportImageBtn = document.getElementById('exportImage');
        
        if (saveBtn) {
            console.log('保存ボタン: イベントリスナー設定完了');
            saveBtn.addEventListener('click', () => {
                console.log('保存ボタンクリック');
                this.saveDesign();
            });
        } else {
            console.warn('保存ボタンが見つかりません');
        }
        
        if (loadBtn) {
            console.log('読込ボタン: イベントリスナー設定完了');
            loadBtn.addEventListener('click', () => {
                console.log('読込ボタンクリック');
                loadFile.click();
            });
        } else {
            console.warn('読込ボタンが見つかりません');
        }
        
        if (loadFile) {
            console.log('ファイル選択: イベントリスナー設定完了');
            loadFile.addEventListener('change', (e) => {
                console.log('ファイル選択変更');
                this.loadDesign(e);
            });
        } else {
            console.warn('ファイル選択要素が見つかりません');
        }
        
        if (exportBOMBtn) {
            console.log('部材リスト出力ボタン: イベントリスナー設定完了');
            exportBOMBtn.addEventListener('click', () => {
                console.log('部材リスト出力ボタンクリック');
                this.exportBOM();
            });
        } else {
            console.warn('部材リスト出力ボタンが見つかりません');
        }
        
        if (exportImageBtn) {
            console.log('画像出力ボタン: イベントリスナー設定完了');
            exportImageBtn.addEventListener('click', () => {
                console.log('画像出力ボタンクリック');
                this.exportImage();
            });
        } else {
            console.warn('画像出力ボタンが見つかりません');
        }
        
        console.log('DataEventListeners設定完了');
    }
    
    saveDesign() {
        // FR009-3: 設計データJSON保存（ハイブリッド構造対応）
        try {
            const shelfDesigner = window.shelfDesigner;
            const templateData = shelfDesigner.templateManager.getTemplateData();
            const boardsData = shelfDesigner.boardManager.getBoardsData();
            
            const designData = {
                version: "1.0",
                metadata: {
                    title: "収納棚設計",
                    description: "収納棚設計・デザインプラットフォームで作成",
                    designType: templateData ? (boardsData.length > 0 ? 'hybrid' : 'template') : 'individual',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    author: "ユーザー"
                },
                boxTemplate: templateData,
                independentBoards: boardsData,
                settings: {
                    units: 'metric',
                    precision: 1,
                    defaultMaterial: {
                        type: 'pine',
                        thickness: 1.8,
                        finish: 'natural',
                        color: 'natural'
                    }
                }
            };
            
            const dataStr = JSON.stringify(designData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `shelf-design-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('設計データ保存完了:', designData.metadata.designType);
            
        } catch (error) {
            console.error('設計データ保存エラー:', error);
            alert('設計データの保存に失敗しました。');
        }
    }
    
    loadDesign(event) {
        // FR009-3: 設計データ読込（ハイブリッド構造対応）
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const designData = JSON.parse(e.target.result);
                const shelfDesigner = window.shelfDesigner;
                
                // バージョンチェック
                if (!designData.version || designData.version !== "1.0") {
                    console.warn('未対応のデータバージョン:', designData.version);
                }
                
                // テンプレートデータ復元
                if (designData.boxTemplate) {
                    shelfDesigner.templateManager.loadTemplateData(designData.boxTemplate);
                }
                
                // 個別板データ復元
                if (designData.independentBoards && Array.isArray(designData.independentBoards)) {
                    shelfDesigner.boardManager.loadBoardsData(designData.independentBoards);
                }
                
                // UI更新
                shelfDesigner.updateUI();
                
                console.log('設計データ読込完了:', designData.metadata?.designType);
                
            } catch (error) {
                console.error('設計データ読込エラー:', error);
                alert('設計データの読み込みに失敗しました。ファイル形式を確認してください。');
            }
        };
        
        reader.readAsText(file);
        event.target.value = ''; // ファイル選択をリセット
    }
    
    exportBOM() {
        // FR009-2: 部材リスト（BOM）・CSV出力
        try {
            const shelfDesigner = window.shelfDesigner;
            const templateData = shelfDesigner.templateManager.getTemplateData();
            const boardsData = shelfDesigner.boardManager.getBoardsData();
            
            let csvContent = "部材,種別,長さ(cm),幅(cm),厚み(cm),材料,数量\n";
            
            // テンプレート板の追加
            if (templateData) {
                Object.values(templateData.boards).forEach((board, index) => {
                    if (board.enabled) {
                        const dimensions = this.getTemplateBoardDimensions(board.type, templateData.size);
                        csvContent += `${this.getBoardTypeName(board.type)},テンプレート板,${dimensions.length},${dimensions.width},${dimensions.thickness},"${templateData.material.type}",1\n`;
                    }
                });
            }
            
            // 個別板の追加
            boardsData.forEach((board, index) => {
                csvContent += `個別板${board.id},個別板,${board.dimensions.length},${board.dimensions.width},${board.dimensions.thickness},"${board.material.type}",1\n`;
            });
            
            // 材料使用量合計
            csvContent += "\n材料使用量合計\n";
            const materialSummary = this.calculateMaterialUsage(templateData, boardsData);
            Object.entries(materialSummary).forEach(([material, volume]) => {
                csvContent += `${material},,,,,${volume.toFixed(3)}m³\n`;
            });
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `shelf-bom-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('部材リスト出力完了');
            
        } catch (error) {
            console.error('部材リスト出力エラー:', error);
            alert('部材リストの出力に失敗しました。');
        }
    }
    
    exportImage() {
        // FR009-1: 3D画像出力
        try {
            const shelfDesigner = window.shelfDesigner;
            const canvas = shelfDesigner.viewportManager.canvas;
            
            // 高解像度で描画
            const originalWidth = canvas.width;
            const originalHeight = canvas.height;
            
            canvas.width = 1920;
            canvas.height = 1080;
            shelfDesigner.viewportManager.camera.aspect = 1920 / 1080;
            shelfDesigner.viewportManager.camera.updateProjectionMatrix();
            shelfDesigner.viewportManager.renderer.setSize(1920, 1080);
            shelfDesigner.viewportManager.render();
            
            // 画像として出力
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `shelf-design-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                // 元のサイズに戻す
                canvas.width = originalWidth;
                canvas.height = originalHeight;
                shelfDesigner.viewportManager.camera.aspect = originalWidth / originalHeight;
                shelfDesigner.viewportManager.camera.updateProjectionMatrix();
                shelfDesigner.viewportManager.renderer.setSize(originalWidth, originalHeight);
                shelfDesigner.viewportManager.render();
                
                console.log('画像出力完了');
            }, 'image/png');
            
        } catch (error) {
            console.error('画像出力エラー:', error);
            alert('画像の出力に失敗しました。');
        }
    }
    
    getTemplateBoardDimensions(boardType, templateSize) {
        const { width, height, depth } = templateSize;
        const thickness = 1.8;
        
        switch (boardType) {
            case 'top':
            case 'bottom':
                return { length: width, width: depth, thickness: 1.8 };
            case 'left':
            case 'right':
                return { length: height, width: depth, thickness: 1.8 };
            case 'back':
                return { length: width, width: height, thickness: 1.8 };
            default:
                return { length: 0, width: 0, thickness: 1.8 };
        }
    }
    
    getBoardTypeName(boardType) {
        const names = {
            'top': '天板',
            'bottom': '底板',
            'left': '左側板',
            'right': '右側板',
            'back': '背板'
        };
        return names[boardType] || boardType;
    }
    
    calculateMaterialUsage(templateData, boardsData) {
        const usage = {};
        
        // テンプレート板の材料使用量
        if (templateData) {
            const materialType = templateData.material.type;
            if (!usage[materialType]) usage[materialType] = 0;
            
            Object.values(templateData.boards).forEach(board => {
                if (board.enabled) {
                    const dimensions = this.getTemplateBoardDimensions(board.type, templateData.size);
                    const volume = (dimensions.length / 100) * (dimensions.width / 100) * (dimensions.thickness / 1000);
                    usage[materialType] += volume;
                }
            });
        }
        
        // 個別板の材料使用量
        boardsData.forEach(board => {
            const materialType = board.material.type;
            if (!usage[materialType]) usage[materialType] = 0;
            
            const volume = (board.dimensions.length / 100) * (board.dimensions.width / 100) * (board.dimensions.thickness / 100);
            usage[materialType] += volume;
        });
        
        return usage;
    }
}

// アプリケーション開始
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.shelfDesigner = new ShelfDesigner();
        console.log('収納棚設計・デザインプラットフォーム起動完了');
    } catch (error) {
        console.error('アプリケーション起動エラー:', error);
        alert('アプリケーションの起動に失敗しました。ページを再読み込みしてください。');
    }
});