class ShelfDesigner {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.grid = null;
        this.dimensionLines = [];
        this.human = null;
        
        // 定数
        this.constants = { HUMAN_OFFSET_X: 100 };
        
        // 選択・ドラッグ管理
        this.selectedObject = null;
        this.selectedBoard = null; // 選択された個別板
        this.isDragging = false;
        this.isDragEnabled = true; // ドラッグ可否の制御フラグ
        this.dragStartPosition = new THREE.Vector2();
        this.objectStartPosition = new THREE.Vector3();
        
        // クリック管理（簡素化）
        this.isDoubleClicking = false; // ダブルクリック中フラグ
        
        // 箱モジュールベースシステム
        this.boxModules = []; // 箱モジュールの配列
        this.boxCounter = 0;
        this.boardCounter = 0;
        this.supportCounter = 0; // 支柱IDカウンター
        this.shelfCounter = 0;   // 棚板IDカウンター
        this.selectedBoxModule = null; // 選択中の箱モジュール
        
        // 削除履歴管理
        this.deletedComponents = []; // 削除された部品の履歴
        
        // デフォルト設定
        this.defaults = {
            boxSize: { width: 60, height: 80, depth: 30 }, // cm
            boardThickness: 18, // mm
            color: '#8B4513'
        };
        
        this.params = {
            showPerson: false
        };
        
        this.init();
        this.setupControls();
        this.animate();
        
        // 初期箱モジュールを追加
        this.addBoxModule(0, 0, 0);
        
        // 最初の箱を自動選択して調整機能を常に表示
        if (this.boxModules.length > 0) {
            this.selectedBoxModule = this.boxModules[0];
            console.log('初期箱を自動選択:', this.selectedBoxModule.id);
        }
        
        this.renderBoxModuleList();
        this.updateSelectedBoxPanel(); // 選択箱パネルを表示
        this.updateDimensionsPanel();
    }

    init() {
        const canvas = document.getElementById('canvas');
        const viewport = canvas.parentElement;
        
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
            canvas: canvas,
            antialias: true 
        });
        this.renderer.setSize(viewport.clientWidth, viewport.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // ライティング
        this.setupLighting();
        
        // 床グリッド
        this.createGrid();
        
        // 初期表示（箱モジュールは後でコンストラクターで追加される）

        // ウィンドウリサイズ対応
        window.addEventListener('resize', () => this.onWindowResize());
        
        // カメラコントロール（簡単なマウス操作）
        this.setupCameraControls();
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

    createGrid() {
        // 床面グリッド
        const gridHelper = new THREE.GridHelper(400, 40, 0x888888, 0xcccccc);
        gridHelper.position.y = -1;
        this.scene.add(gridHelper);
        this.grid = gridHelper;

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

    addBoxModule(x = 0, y = 0, z = 0) {
        const boxId = ++this.boxCounter;
        const size = this.defaults.boxSize;
        
        const boxModule = {
            id: boxId,
            position: { x, y, z },
            size: { ...size },
            boards: {
                top: this.createBoard('top', boxId),
                bottom: this.createBoard('bottom', boxId),
                left: this.createBoard('left', boxId),
                right: this.createBoard('right', boxId),
                back: this.createBoard('back', boxId)
            },
            supports: [], // 縦支柱の配列
            shelves: [],  // 棚板の配列
            group: new THREE.Group()
        };
        
        this.boxModules.push(boxModule);
        this.buildBoxModule(boxModule);
        this.scene.add(boxModule.group);
        
        return boxModule;
    }

    createBoard(type, boxId) {
        return {
            id: ++this.boardCounter,
            type: type,
            boxId: boxId,
            enabled: true,
            thickness: this.defaults.boardThickness,
            individualSize: null, // 個別サイズ（null = 箱サイズに従う）
            mesh: null
        };
    }

    createSupport(boxId, x = 0, z = 0) {
        return {
            id: ++this.supportCounter,
            type: 'support',
            boxId: boxId,
            position: { x, z }, // 箱内の相対位置
            thickness: this.defaults.boardThickness,
            width: 10, // 支柱の幅 (cm)
            enabled: true,
            mesh: null
        };
    }

    createShelf(boxId, height = 40) {
        return {
            id: ++this.shelfCounter,
            type: 'shelf',
            boxId: boxId,
            height: height, // 底板からの高さ(cm)
            thickness: this.defaults.boardThickness,
            width: null, // 棚板の幅 (null = 箱幅に従う)
            depth: null, // 棚板の奥行き (null = 箱奥行きに従う)
            enabled: true,
            mesh: null
        };
    }

    buildBoxModule(boxModule) {
        // 既存メッシュをクリア
        boxModule.group.clear();
        
        const { width, height, depth } = boxModule.size;
        const material = new THREE.MeshLambertMaterial({ color: this.defaults.color });
        
        // 各板を作成
        Object.values(boxModule.boards).forEach(board => {
            if (board.enabled) {
                board.mesh = this.createBoardMesh(board, width, height, depth, material);
                board.mesh.userData = { 
                    type: 'board', 
                    boardId: board.id,
                    boardType: board.type,
                    boxId: boxModule.id 
                };
                boxModule.group.add(board.mesh);
            }
        });
        
        // 支柱を作成
        boxModule.supports.forEach(support => {
            if (support.enabled) {
                support.mesh = this.createSupportMesh(support, width, height, depth, material);
                support.mesh.userData = {
                    type: 'support',
                    supportId: support.id,
                    boxId: boxModule.id
                };
                boxModule.group.add(support.mesh);
            }
        });
        
        // 棚板を作成
        boxModule.shelves.forEach(shelf => {
            if (shelf.enabled) {
                shelf.mesh = this.createShelfMesh(shelf, width, height, depth, material);
                shelf.mesh.userData = {
                    type: 'shelf',
                    shelfId: shelf.id,
                    boxId: boxModule.id
                };
                boxModule.group.add(shelf.mesh);
            }
        });
        
        // 箱モジュールの位置設定
        boxModule.group.position.set(boxModule.position.x, boxModule.position.y, boxModule.position.z);
    }

    createBoardMesh(board, boxWidth, boxHeight, boxDepth, material) {
        const thickness = board.thickness / 10; // mm→cm
        
        // 個別サイズがあればそれを使用、なければ箱サイズを使用
        let width, height, depth;
        if (board.individualSize) {
            width = board.individualSize.width || boxWidth;
            height = board.individualSize.height || boxHeight;
            depth = board.individualSize.depth || boxDepth;
        } else {
            width = boxWidth;
            height = boxHeight;
            depth = boxDepth;
        }
        
        let geometry, position;
        
        switch (board.type) {
            case 'top':
                geometry = new THREE.BoxGeometry(width, thickness, depth);
                position = [0, boxHeight - thickness/2, 0]; // 位置は箱の高さに基づく
                break;
            case 'bottom':
                geometry = new THREE.BoxGeometry(width, thickness, depth);
                position = [0, thickness/2, 0];
                break;
            case 'left':
                geometry = new THREE.BoxGeometry(thickness, height, depth);
                position = [-boxWidth/2 + thickness/2, boxHeight/2, 0]; // 位置は箱サイズに基づく
                break;
            case 'right':
                geometry = new THREE.BoxGeometry(thickness, height, depth);
                position = [boxWidth/2 - thickness/2, boxHeight/2, 0]; // 位置は箱サイズに基づく
                break;
            case 'back':
                geometry = new THREE.BoxGeometry(width, height, thickness);
                position = [0, boxHeight/2, -boxDepth/2 + thickness/2]; // 位置は箱サイズに基づく
                break;
        }
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(...position);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        return mesh;
    }

    createSupportMesh(support, boxWidth, boxHeight, boxDepth, material) {
        const thickness = support.thickness / 10; // mm→cm
        const supportWidth = support.width || 10; // デフォルト10cm
        
        // 支柱：縦の板として作成（厚み×高さ×幅）
        const geometry = new THREE.BoxGeometry(thickness, boxHeight, supportWidth);
        const mesh = new THREE.Mesh(geometry, material);
        
        // 箱内の相対位置に配置
        const x = support.position.x;
        const z = support.position.z;
        mesh.position.set(x, boxHeight/2, z);
        
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        return mesh;
    }

    createShelfMesh(shelf, boxWidth, boxHeight, boxDepth, material) {
        const thickness = shelf.thickness / 10; // mm→cm
        
        // 棚板：水平の板として作成
        const shelfWidth = shelf.width || (boxWidth - 2);
        const shelfDepth = shelf.depth || (boxDepth - 2);
        const geometry = new THREE.BoxGeometry(shelfWidth, thickness, shelfDepth);
        const mesh = new THREE.Mesh(geometry, material);
        
        // 底板からの高さに配置
        mesh.position.set(0, shelf.height, 0);
        
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        return mesh;
    }

    duplicateBoxModule(sourceBoxId) {
        const sourceBox = this.boxModules.find(box => box.id === sourceBoxId);
        if (!sourceBox) return null;
        
        // 複製位置（元の箱の右隣）
        const newX = sourceBox.position.x + sourceBox.size.width + 10;
        const newBox = this.addBoxModule(newX, sourceBox.position.y, sourceBox.position.z);
        
        // サイズと設定をコピー
        newBox.size = { ...sourceBox.size };
        Object.keys(newBox.boards).forEach(key => {
            newBox.boards[key].enabled = sourceBox.boards[key].enabled;
            newBox.boards[key].thickness = sourceBox.boards[key].thickness;
        });
        
        this.buildBoxModule(newBox);
        return newBox;
    }

    removeBoxModule(boxId) {
        const boxIndex = this.boxModules.findIndex(box => box.id === boxId);
        if (boxIndex === -1) return;
        
        const boxModule = this.boxModules[boxIndex];
        this.scene.remove(boxModule.group);
        this.boxModules.splice(boxIndex, 1);
    }

    removeBoardFromBox(boardId) {
        for (const boxModule of this.boxModules) {
            for (const [boardType, board] of Object.entries(boxModule.boards)) {
                if (board.id === boardId) {
                    // 削除履歴に追加
                    this.deletedComponents.push({
                        type: 'board',
                        boardType: boardType,
                        data: { ...board },
                        boxId: boxModule.id,
                        deletedAt: Date.now()
                    });
                    
                    board.enabled = false;
                    this.buildBoxModule(boxModule);
                    this.updateSelectedBoxPanel(); // 復活リスト更新
                    return;
                }
            }
        }
    }

    addSupportToBox(boxId, x = 0, z = 0) {
        console.log(`addSupportToBox呼び出し: boxId=${boxId}, x=${x}, z=${z}`);
        const boxModule = this.getBoxModuleById(boxId);
        if (!boxModule) {
            console.log('boxModuleが見つかりません:', boxId);
            return null;
        }
        
        const support = this.createSupport(boxId, x, z);
        boxModule.supports.push(support);
        console.log(`支柱追加完了: supportId=${support.id}, 現在の支柱数=${boxModule.supports.length}`);
        this.buildBoxModule(boxModule);
        return support;
    }

    removeSupportFromBox(supportId) {
        for (const boxModule of this.boxModules) {
            const supportIndex = boxModule.supports.findIndex(s => s.id === supportId);
            if (supportIndex !== -1) {
                const support = boxModule.supports[supportIndex];
                
                // 削除履歴に追加
                this.deletedComponents.push({
                    type: 'support',
                    data: { ...support },
                    boxId: boxModule.id,
                    deletedAt: Date.now()
                });
                
                boxModule.supports.splice(supportIndex, 1);
                this.buildBoxModule(boxModule);
                this.updateSelectedBoxPanel(); // 復活リスト更新
                return;
            }
        }
    }

    addShelfToBox(boxId, height = 40) {
        const boxModule = this.getBoxModuleById(boxId);
        if (!boxModule) return null;
        
        const shelf = this.createShelf(boxId, height);
        boxModule.shelves.push(shelf);
        this.buildBoxModule(boxModule);
        return shelf;
    }

    removeShelfFromBox(shelfId) {
        for (const boxModule of this.boxModules) {
            const shelfIndex = boxModule.shelves.findIndex(s => s.id === shelfId);
            if (shelfIndex !== -1) {
                const shelf = boxModule.shelves[shelfIndex];
                
                // 削除履歴に追加
                this.deletedComponents.push({
                    type: 'shelf',
                    data: { ...shelf },
                    boxId: boxModule.id,
                    deletedAt: Date.now()
                });
                
                boxModule.shelves.splice(shelfIndex, 1);
                this.buildBoxModule(boxModule);
                this.updateSelectedBoxPanel(); // 復活リスト更新
                return;
            }
        }
    }

    updateSupportPosition(supportId, x, z) {
        for (const boxModule of this.boxModules) {
            const support = boxModule.supports.find(s => s.id === supportId);
            if (support) {
                if (x !== null) support.position.x = x;
                if (z !== null) support.position.z = z;
                this.buildBoxModule(boxModule);
                return;
            }
        }
    }

    updateShelfHeight(shelfId, height) {
        for (const boxModule of this.boxModules) {
            const shelf = boxModule.shelves.find(s => s.id === shelfId);
            if (shelf) {
                shelf.height = height;
                this.buildBoxModule(boxModule);
                return;
            }
        }
    }

    updateSupportWidth(supportId, width) {
        for (const boxModule of this.boxModules) {
            const support = boxModule.supports.find(s => s.id === supportId);
            if (support) {
                support.width = width;
                this.buildBoxModule(boxModule);
                return;
            }
        }
    }

    updateShelfSize(shelfId, dimension, value) {
        for (const boxModule of this.boxModules) {
            const shelf = boxModule.shelves.find(s => s.id === shelfId);
            if (shelf) {
                switch (dimension) {
                    case 'width':
                        shelf.width = value;
                        break;
                    case 'depth':
                        shelf.depth = value;
                        break;
                }
                this.buildBoxModule(boxModule);
                return;
            }
        }
    }

    restoreDeletedComponent(componentIndex) {
        const component = this.deletedComponents[componentIndex];
        if (!component) return;
        
        const boxModule = this.getBoxModuleById(component.boxId);
        if (!boxModule) return;
        
        switch (component.type) {
            case 'board':
                // 板を復活
                const board = boxModule.boards[component.boardType];
                if (board && board.id === component.data.id) {
                    board.enabled = true;
                    // 個別サイズも復元
                    if (component.data.individualSize) {
                        board.individualSize = component.data.individualSize;
                    }
                }
                break;
                
            case 'support':
                // 支柱を復活（重複チェック）
                const existingSupport = boxModule.supports.find(s => s.id === component.data.id);
                if (!existingSupport) {
                    boxModule.supports.push({ ...component.data, mesh: null });
                }
                break;
                
            case 'shelf':
                // 棚板を復活（重複チェック）
                const existingShelf = boxModule.shelves.find(s => s.id === component.data.id);
                if (!existingShelf) {
                    boxModule.shelves.push({ ...component.data, mesh: null });
                }
                break;
        }
        
        // 削除履歴から削除
        this.deletedComponents.splice(componentIndex, 1);
        
        // 再構築と更新
        this.buildBoxModule(boxModule);
        this.updateSelectedBoxPanel();
    }

    refreshAllModules() {
        // 全ての箱モジュールを再構築
        this.boxModules.forEach(boxModule => {
            this.buildBoxModule(boxModule);
        });
        this.placeHumanNextToShelf();
    }

    createLShapeTemplate() {
        // 既存の箱モジュールをクリア
        this.clearAllModules();
        
        // L字型の配置
        // 横の部分
        this.addBoxModule(0, 0, 0);
        this.addBoxModule(70, 0, 0);
        this.addBoxModule(140, 0, 0);
        
        // 縦の部分
        this.addBoxModule(0, 0, 40);
        this.addBoxModule(0, 0, 80);
        
        return this.boxModules;
    }

    clearAllModules() {
        this.boxModules.forEach(boxModule => {
            this.scene.remove(boxModule.group);
        });
        this.boxModules = [];
        this.boxCounter = 0;
        this.boardCounter = 0;
    }

    createDimensionLines() {
        // 既存の寸法線を削除
        this.dimensionLines.forEach(line => this.scene.remove(line));
        this.dimensionLines = [];

        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x333333 });
        const w = this.params.width;
        const h = this.params.height;
        const d = this.params.depth;

        // 幅の寸法線
        const widthPoints = [
            new THREE.Vector3(-w/2, -20, d/2 + 10),
            new THREE.Vector3(-w/2, -15, d/2 + 10),
            new THREE.Vector3(w/2, -15, d/2 + 10),
            new THREE.Vector3(w/2, -20, d/2 + 10)
        ];
        const widthGeometry = new THREE.BufferGeometry().setFromPoints(widthPoints);
        const widthLine = new THREE.Line(widthGeometry, lineMaterial);
        this.scene.add(widthLine);
        this.dimensionLines.push(widthLine);

        // 高さの寸法線
        const heightPoints = [
            new THREE.Vector3(-w/2 - 15, 0, d/2 + 10),
            new THREE.Vector3(-w/2 - 10, 0, d/2 + 10),
            new THREE.Vector3(-w/2 - 10, h, d/2 + 10),
            new THREE.Vector3(-w/2 - 15, h, d/2 + 10)
        ];
        const heightGeometry = new THREE.BufferGeometry().setFromPoints(heightPoints);
        const heightLine = new THREE.Line(heightGeometry, lineMaterial);
        this.scene.add(heightLine);
        this.dimensionLines.push(heightLine);

        // 奥行きの寸法線
        const depthPoints = [
            new THREE.Vector3(w/2 + 10, -15, -d/2),
            new THREE.Vector3(w/2 + 10, -10, -d/2),
            new THREE.Vector3(w/2 + 10, -10, d/2),
            new THREE.Vector3(w/2 + 10, -15, d/2)
        ];
        const depthGeometry = new THREE.BufferGeometry().setFromPoints(depthPoints);
        const depthLine = new THREE.Line(depthGeometry, lineMaterial);
        this.scene.add(depthLine);
        this.dimensionLines.push(depthLine);
    }

    async loadHuman(url = './assets/human.glb') {
        return new Promise((resolve, reject) => {
            const loader = new THREE.GLTFLoader();
            loader.load(url, (gltf) => {
                // 身長を1700mmに正規化
                const box = new THREE.Box3().setFromObject(gltf.scene);
                const size = box.getSize(new THREE.Vector3());
                const s = 1700 / size.y;
                gltf.scene.scale.setScalar(s);
                gltf.scene.traverse(o => {
                    o.castShadow = true;
                    o.receiveShadow = true;
                });
                
                // 既存を破棄して差し替え
                if (this.human) {
                    this.scene.remove(this.human);
                    disposeObject3D(this.human);
                }
                this.human = gltf.scene;
                this.human.visible = true;
                this.scene.add(this.human);
                this.placeHumanNextToShelf();
                resolve();
            }, undefined, (err) => {
                console.warn('human.glb を読み込めません', err);
                reject(err);
            });
        });
    }

    placeHumanNextToShelf(offset = this.constants.HUMAN_OFFSET_X) {
        if (!this.human || this.boxModules.length === 0) return;
        
        // 全ての箱モジュールの境界ボックスを計算
        const allBoxes = new THREE.Box3();
        this.boxModules.forEach(boxModule => {
            const box = new THREE.Box3().setFromObject(boxModule.group);
            allBoxes.union(box);
        });
        
        const x = allBoxes.max.x + offset;
        this.human.position.set(x, 0, 0);
    }

    setupCameraControls() {
        let isMouseDown = false;
        let mouseX = 0;
        let mouseY = 0;
        let targetX = 0;
        let targetY = 0;

        const canvas = this.renderer.domElement;

        canvas.addEventListener('mousedown', (event) => {
            const rect = canvas.getBoundingClientRect();
            const mouse = new THREE.Vector2();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            // レイキャスティングで選択可能オブジェクトをチェック
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, this.camera);

            // 全ての箱モジュールから選択可能オブジェクトを検索
            const allObjects = [];
            this.boxModules.forEach(boxModule => {
                allObjects.push(...boxModule.group.children);
            });

            if (allObjects.length > 0) {
                const intersects = raycaster.intersectObjects(allObjects, true);
                const selectableObject = intersects.find(intersect => 
                    intersect.object.userData && 
                    (intersect.object.userData.type === 'board' || 
                     intersect.object.userData.type === 'support' || 
                     intersect.object.userData.type === 'shelf')
                );

                if (selectableObject) {
                    // ドラッグ開始位置を記録
                    this.dragStartPosition.set(event.clientX, event.clientY);
                    this.handleObjectClick(selectableObject.object, event);
                    return;
                }
            }

            // オブジェクトが選択されていない場合はカメラ操作
            isMouseDown = true;
            mouseX = event.clientX;
            mouseY = event.clientY;
        });

        canvas.addEventListener('mousemove', (event) => {
            if (this.isDragging && this.selectedObject) {
                // オブジェクトドラッグ
                this.handleObjectDrag(event);
            } else if (isMouseDown) {
                // カメラ回転
                const deltaX = event.clientX - mouseX;
                const deltaY = event.clientY - mouseY;

                targetX += deltaX * 0.01;
                targetY += deltaY * 0.01;

                mouseX = event.clientX;
                mouseY = event.clientY;

                const radius = 200;
                this.camera.position.x = Math.cos(targetX) * radius;
                this.camera.position.z = Math.sin(targetX) * radius;
                this.camera.position.y = Math.max(50, 120 + targetY * 50);
                
                // 箱モジュールの中心を動的に計算
                const center = this.getSceneCenter();
                this.camera.lookAt(center.x, center.y, center.z);
            }
        });

        canvas.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.selectedBoxModule = null;
                this.updateObjectData();
            }
            isMouseDown = false;
        });

        canvas.addEventListener('wheel', (event) => {
            const scale = event.deltaY > 0 ? 1.1 : 0.9;
            this.camera.position.multiplyScalar(scale);
            
            // 箱モジュールの中心を動的に計算
            const center = this.getSceneCenter();
            this.camera.lookAt(center.x, center.y, center.z);
            event.preventDefault();
        });

        // クリックによる当たり判定とハイライト
        // シングルクリック処理
        canvas.addEventListener('click', (event) => {
            if (!this.isDragging && !this.isDoubleClicking) {
                // ダブルクリック判定のため短時間待機
                setTimeout(() => {
                    if (!this.isDoubleClicking) {
                        this.onCanvasSingleClick(event);
                    }
                }, 200);
            }
        });

        // ダブルクリック処理
        canvas.addEventListener('dblclick', (event) => {
            if (!this.isDragging) {
                this.isDoubleClicking = true; // フラグを設定
                this.onCanvasDoubleClick(event);
                // フラグをリセット
                setTimeout(() => {
                    this.isDoubleClicking = false;
                }, 300);
            }
        });
    }

    onCanvasSingleClick(event) {
        console.log('onCanvasSingleClick実行');
        const intersectedObject = this.getIntersectedObject(event);
        
        if (intersectedObject && intersectedObject.userData && intersectedObject.userData.type === 'board') {
            const boxId = intersectedObject.userData.boxId;
            console.log('板オブジェクト検出, boxId:', boxId);
            
            // 既に同じ箱が選択されている場合は選択解除（トグル動作）
            if (this.selectedBoxModule && this.selectedBoxModule.id === boxId) {
                console.log('同じ箱の再選択: 選択解除');
                this.clearSelection();
            } else {
                console.log('異なる箱の選択: 箱モジュール選択');
                this.handleSingleClick(intersectedObject);
            }
            this.updateDimensionsPanel();
        } else {
            // 空のスペースをクリックした場合は選択解除
            console.log('空スペースクリック: 選択解除');
            this.clearSelection();
            this.updateDimensionsPanel();
        }
    }

    onCanvasDoubleClick(event) {
        console.log('===== ダブルクリック処理開始 =====');
        console.log('onCanvasDoubleClick実行');
        const intersectedObject = this.getIntersectedObject(event);
        console.log('ダブルクリック - 交差オブジェクト:', intersectedObject);
        
        if (intersectedObject) {
            console.log('ダブルクリック - オブジェクトのuserData:', intersectedObject.userData);
            
            if (intersectedObject.userData && intersectedObject.userData.type === 'board') {
                console.log('ダブルクリック: 個別板選択開始');
                this.handleDoubleClick(intersectedObject);
                this.updateDimensionsPanel();
                console.log('ダブルクリック: 処理完了');
            } else {
                console.log('ダブルクリック: 板オブジェクトではない', intersectedObject.userData);
            }
        } else {
            console.log('ダブルクリック: オブジェクトが検出されませんでした');
        }
        console.log('===== ダブルクリック処理終了 =====');
    }

    getIntersectedObject(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2();
        
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);

        // 全ての箱モジュールから選択可能オブジェクトを検索
        const allObjects = [];
        this.boxModules.forEach(boxModule => {
            allObjects.push(...boxModule.group.children);
        });

        if (allObjects.length > 0) {
            const intersects = raycaster.intersectObjects(allObjects, true);
            
            if (intersects.length > 0) {
                return intersects[0].object;
            }
        }
        
        return null;
    }

    showBoardInfo(boardMesh) {
        const boardData = boardMesh.userData;
        const boxModule = this.getBoxModuleById(boardData.boxId);
        
        console.log(`選択された板: ${boardData.boardType} (箱モジュール${boardData.boxId})`);
        
        // UI上でのハイライト表示
        this.highlightSelectedObject(boardMesh);
        
        // 選択箱として設定
        this.setSelectedBoxModule(boxModule);
    }

    setSelectedBoxModule(boxModule) {
        this.selectedBoxModule = boxModule;
        this.updateSelectedBoxPanel();
    }

    clearSelection() {
        console.log('選択をクリア');
        // 選択状態をクリア
        this.selectedBoxModule = null;
        this.selectedObject = null;
        this.selectedBoard = null;
        
        // ドラッグ状態をリセット
        this.isDragging = false;
        this.isDragEnabled = false;
        
        // ハイライトを解除
        if (this.highlightedObject) {
            this.highlightedObject.material.emissive.setHex(0x000000);
            this.highlightedObject = null;
        }
        
        // UIパネルを非表示
        document.getElementById('selectedBoxPanel').style.display = 'none';
        document.getElementById('selectedBoardPanel').style.display = 'none';
        
        console.log('選択クリア完了');
    }

    handleSingleClick(clickedObject) {
        // ワンクリック: 箱モジュール全体の選択
        const boxId = clickedObject.userData.boxId;
        this.selectedBoxModule = this.getBoxModuleById(boxId);
        this.selectedObject = this.selectedBoxModule.group; // ドラッグ対象として設定
        
        // ドラッグ開始の準備
        this.isDragging = true;
        this.isDragEnabled = true; // シングルクリック時はドラッグ有効
        this.objectStartPosition.copy(this.selectedBoxModule.group.position);
        
        this.updateSelectedBoxPanel();
        // 板パネルを非表示
        document.getElementById('selectedBoardPanel').style.display = 'none';
        console.log('箱モジュール選択:', boxId);
    }

    handleDoubleClick(clickedObject) {
        console.log('ダブルクリック処理開始:', clickedObject.userData);
        
        // ダブルクリック: 個別板の選択（ドラッグ移動は無効）
        this.selectedObject = clickedObject; // 選択オブジェクトとして保持（Deleteキー等のため）
        this.selectedBoard = clickedObject;
        this.isDragEnabled = false; // ドラッグのみ無効化
        
        console.log('ハイライト処理開始');
        this.highlightSelectedObject(clickedObject);
        
        console.log('選択板パネル更新開始');
        this.updateSelectedBoardPanel();
        
        // 箱パネルを非表示
        document.getElementById('selectedBoxPanel').style.display = 'none';
        console.log('板選択完了:', clickedObject.userData);
    }

    updateSelectedBoardPanel() {
        console.log('updateSelectedBoardPanel開始, selectedBoard:', this.selectedBoard);
        const panel = document.getElementById('selectedBoardPanel');
        const info = document.getElementById('selectedBoardInfo');
        const sizeControls = document.getElementById('boardSizeControls');
        const positionControls = document.getElementById('boardPositionControls');
        
        if (!this.selectedBoard) {
            console.log('selectedBoardがnullのためパネル非表示');
            panel.style.display = 'none';
            return;
        }
        
        console.log('選択板パネルを表示');
        panel.style.display = 'block';
        
        const boardData = this.selectedBoard.userData;
        const boxModule = this.getBoxModuleById(boardData.boxId);
        const board = this.getBoardById(boardData.boardId);
        
        // 選択板の情報表示
        info.innerHTML = `
            <div><strong>${this.getBoardTypeName(boardData.boardType)} (ID: ${boardData.boardId})</strong></div>
            <div style="font-size: 10px; color: #666;">
                箱モジュール ${boardData.boxId}
            </div>
        `;
        
        // サイズ調整コントロール
        this.createBoardSizeControls(sizeControls, board, boardData.boardType);
        
        // 位置調整コントロール
        this.createBoardPositionControls(positionControls, board, boardData.boardType);
        
        this.setupSelectedBoardControls();
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

    getBoardById(boardId) {
        for (const boxModule of this.boxModules) {
            for (const board of Object.values(boxModule.boards)) {
                if (board.id === boardId) {
                    return board;
                }
            }
        }
        return null;
    }

    createBoardSizeControls(container, board, boardType) {
        const boxModule = this.getBoxModuleById(board.boxId);
        
        // 個別サイズがある場合はそれを使用、なければ箱サイズ
        let currentSize;
        if (board.individualSize) {
            currentSize = board.individualSize;
        } else {
            currentSize = boxModule.size;
        }
        
        const { width, height, depth } = currentSize;
        
        let sizeControls = '';
        
        switch (boardType) {
            case 'top':
            case 'bottom':
                // 天板・底板: 幅と奥行きを調整可能
                sizeControls = `
                    <div style="margin-bottom: 8px;">
                        <label style="font-size: 11px;">幅: </label>
                        <input type="number" id="boardWidth" value="${width}" min="10" max="200" style="width: 60px; font-size: 11px;">cm
                    </div>
                    <div style="margin-bottom: 8px;">
                        <label style="font-size: 11px;">奥行: </label>
                        <input type="number" id="boardDepth" value="${depth}" min="10" max="100" style="width: 60px; font-size: 11px;">cm
                    </div>
                `;
                break;
            case 'left':
            case 'right':
                // 側板: 高さと奥行きを調整可能
                sizeControls = `
                    <div style="margin-bottom: 8px;">
                        <label style="font-size: 11px;">高さ: </label>
                        <input type="number" id="boardHeight" value="${height}" min="20" max="250" style="width: 60px; font-size: 11px;">cm
                    </div>
                    <div style="margin-bottom: 8px;">
                        <label style="font-size: 11px;">奥行: </label>
                        <input type="number" id="boardDepth" value="${depth}" min="10" max="100" style="width: 60px; font-size: 11px;">cm
                    </div>
                `;
                break;
            case 'back':
                // 背板: 幅と高さを調整可能
                sizeControls = `
                    <div style="margin-bottom: 8px;">
                        <label style="font-size: 11px;">幅: </label>
                        <input type="number" id="boardWidth" value="${width}" min="10" max="200" style="width: 60px; font-size: 11px;">cm
                    </div>
                    <div style="margin-bottom: 8px;">
                        <label style="font-size: 11px;">高さ: </label>
                        <input type="number" id="boardHeight" value="${height}" min="20" max="250" style="width: 60px; font-size: 11px;">cm
                    </div>
                `;
                break;
        }
        
        container.innerHTML = sizeControls;
    }

    createBoardPositionControls(container, board, boardType) {
        const position = this.selectedBoard.position;
        
        let positionControls = '';
        
        switch (boardType) {
            case 'top':
            case 'bottom':
                positionControls = `
                    <div style="margin-bottom: 8px;">
                        <label style="font-size: 11px;">左右: </label>
                        <input type="number" id="boardPosX" value="${position.x.toFixed(1)}" step="0.5" style="width: 60px; font-size: 11px;">cm
                    </div>
                    <div style="margin-bottom: 8px;">
                        <label style="font-size: 11px;">前後: </label>
                        <input type="number" id="boardPosZ" value="${position.z.toFixed(1)}" step="0.5" style="width: 60px; font-size: 11px;">cm
                    </div>
                `;
                break;
            case 'left':
            case 'right':
                positionControls = `
                    <div style="margin-bottom: 8px;">
                        <label style="font-size: 11px;">高さ: </label>
                        <input type="number" id="boardPosY" value="${position.y.toFixed(1)}" step="0.5" style="width: 60px; font-size: 11px;">cm
                    </div>
                    <div style="margin-bottom: 8px;">
                        <label style="font-size: 11px;">前後: </label>
                        <input type="number" id="boardPosZ" value="${position.z.toFixed(1)}" step="0.5" style="width: 60px; font-size: 11px;">cm
                    </div>
                `;
                break;
            case 'back':
                positionControls = `
                    <div style="margin-bottom: 8px;">
                        <label style="font-size: 11px;">左右: </label>
                        <input type="number" id="boardPosX" value="${position.x.toFixed(1)}" step="0.5" style="width: 60px; font-size: 11px;">cm
                    </div>
                    <div style="margin-bottom: 8px;">
                        <label style="font-size: 11px;">高さ: </label>
                        <input type="number" id="boardPosY" value="${position.y.toFixed(1)}" step="0.5" style="width: 60px; font-size: 11px;">cm
                    </div>
                `;
                break;
        }
        
        container.innerHTML = positionControls;
    }

    updateSelectedBoxPanel() {
        const panel = document.getElementById('selectedBoxPanel');
        const info = document.getElementById('selectedBoxInfo');
        const boxSizeControls = document.getElementById('boxSizeControls');
        const supportsList = document.getElementById('supportsList');
        const shelvesList = document.getElementById('shelvesList');
        
        if (!this.selectedBoxModule) {
            panel.style.display = 'none';
            return;
        }
        
        panel.style.display = 'block';
        
        // 選択箱の情報表示
        info.innerHTML = `
            <div><strong>箱モジュール ${this.selectedBoxModule.id}</strong></div>
            <div style="font-size: 10px; color: #666;">
                ${this.selectedBoxModule.size.width}×${this.selectedBoxModule.size.height}×${this.selectedBoxModule.size.depth}cm
            </div>
        `;
        
        // 箱サイズ調整コントロール
        this.createBoxSizeControls(boxSizeControls);
        
        // 支柱リスト更新
        supportsList.innerHTML = '';
        this.selectedBoxModule.supports.forEach(support => {
            const supportItem = document.createElement('div');
            supportItem.className = 'support-item';
            supportItem.innerHTML = `
                <div class="support-controls">
                    <span>支柱 ${support.id}</span>
                    <div style="margin-top: 5px;">
                        X:<input type="number" class="position-input" value="${support.position.x}" data-support-id="${support.id}" data-axis="x">
                        Z:<input type="number" class="position-input" value="${support.position.z}" data-support-id="${support.id}" data-axis="z">
                    </div>
                    <div style="margin-top: 5px;">
                        幅:<input type="number" class="position-input" value="${support.width || 10}" data-support-id="${support.id}" data-type="width" min="5" max="50">cm
                        <button class="remove-btn" data-support-id="${support.id}">削除</button>
                    </div>
                </div>
            `;
            supportsList.appendChild(supportItem);
        });
        
        // 棚板リスト更新
        shelvesList.innerHTML = '';
        this.selectedBoxModule.shelves.forEach(shelf => {
            const boxWidth = this.selectedBoxModule.size.width;
            const boxDepth = this.selectedBoxModule.size.depth;
            const shelfItem = document.createElement('div');
            shelfItem.className = 'shelf-item';
            shelfItem.innerHTML = `
                <div class="shelf-controls">
                    <span>棚板 ${shelf.id}</span>
                    <div style="margin-top: 5px;">
                        高さ:<input type="number" class="height-input" value="${shelf.height}" data-shelf-id="${shelf.id}">cm
                    </div>
                    <div style="margin-top: 5px;">
                        幅:<input type="number" class="position-input" value="${shelf.width || (boxWidth - 2)}" data-shelf-id="${shelf.id}" data-type="width" min="10" max="200">cm
                        奥行:<input type="number" class="position-input" value="${shelf.depth || (boxDepth - 2)}" data-shelf-id="${shelf.id}" data-type="depth" min="10" max="100">cm
                    </div>
                    <div style="margin-top: 5px;">
                        <button class="remove-btn" data-shelf-id="${shelf.id}">削除</button>
                    </div>
                </div>
            `;
            shelvesList.appendChild(shelfItem);
        });
        
        this.setupSelectedBoxControls();
        this.setupBoxSizeControls();
        
        // 削除部品リスト更新
        this.updateDeletedComponentsList();
        
    }

    updateDeletedComponentsList() {
        const deletedList = document.getElementById('deletedComponentsList');
        if (!deletedList || !this.selectedBoxModule) return;
        
        // この箱の削除部品のみ表示
        const boxDeletedComponents = this.deletedComponents.filter(
            comp => comp.boxId === this.selectedBoxModule.id
        );
        
        deletedList.innerHTML = '';
        
        if (boxDeletedComponents.length === 0) {
            deletedList.innerHTML = '<div style="font-size: 10px; color: #999;">削除された部品はありません</div>';
            return;
        }
        
        boxDeletedComponents.forEach((component, globalIndex) => {
            const componentItem = document.createElement('div');
            componentItem.style.cssText = 'background: #f0f0f0; border: 1px solid #ccc; border-radius: 3px; padding: 4px; margin-bottom: 3px; font-size: 10px;';
            
            let componentName = '';
            switch (component.type) {
                case 'board':
                    componentName = `${this.getBoardTypeName(component.boardType)} (ID: ${component.data.id})`;
                    break;
                case 'support':
                    componentName = `支柱 (ID: ${component.data.id})`;
                    break;
                case 'shelf':
                    componentName = `棚板 (ID: ${component.data.id})`;
                    break;
            }
            
            componentItem.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>${componentName}</span>
                    <button class="add-btn" style="font-size: 9px; padding: 2px 4px;" data-component-index="${this.deletedComponents.indexOf(component)}">復活</button>
                </div>
            `;
            
            // 復活ボタンイベント
            const restoreBtn = componentItem.querySelector('.add-btn');
            restoreBtn.addEventListener('click', (e) => {
                const componentIndex = parseInt(e.target.dataset.componentIndex);
                this.restoreDeletedComponent(componentIndex);
            });
            
            deletedList.appendChild(componentItem);
        });
    }

    createBoxSizeControls(container) {
        const { width, height, depth } = this.selectedBoxModule.size;
        
        container.innerHTML = `
            <div style="margin-bottom: 8px;">
                <label style="font-size: 11px;">幅: </label>
                <input type="number" id="boxWidth" value="${width}" min="20" max="300" style="width: 60px; font-size: 11px;">cm
            </div>
            <div style="margin-bottom: 8px;">
                <label style="font-size: 11px;">高さ: </label>
                <input type="number" id="boxHeight" value="${height}" min="30" max="400" style="width: 60px; font-size: 11px;">cm
            </div>
            <div style="margin-bottom: 8px;">
                <label style="font-size: 11px;">奥行: </label>
                <input type="number" id="boxDepth" value="${depth}" min="15" max="150" style="width: 60px; font-size: 11px;">cm
            </div>
            <div style="margin-bottom: 8px;">
                <label style="font-size: 11px;">左右位置: </label>
                <input type="number" id="boxPosX" value="${this.selectedBoxModule.position.x.toFixed(1)}" step="0.5" style="width: 60px; font-size: 11px;">cm
            </div>
            <div style="margin-bottom: 8px;">
                <label style="font-size: 11px;">上下位置: </label>
                <input type="number" id="boxPosY" value="${this.selectedBoxModule.position.y.toFixed(1)}" step="0.5" style="width: 60px; font-size: 11px;">cm
            </div>
            <div style="margin-bottom: 8px;">
                <label style="font-size: 11px;">前後位置: </label>
                <input type="number" id="boxPosZ" value="${this.selectedBoxModule.position.z.toFixed(1)}" step="0.5" style="width: 60px; font-size: 11px;">cm
            </div>
        `;
    }

    updateDimensionsPanel() {
        const dimensions = document.getElementById('dimensions');
        if (!dimensions) return;
        
        const totalBoxes = this.boxModules.length;
        const allBounds = new THREE.Box3();
        
        this.boxModules.forEach(boxModule => {
            const box = new THREE.Box3().setFromObject(boxModule.group);
            allBounds.union(box);
        });
        
        const size = allBounds.getSize(new THREE.Vector3());
        
        dimensions.innerHTML = `
            <div><strong>プロジェクト情報</strong></div>
            <div>箱モジュール数: ${totalBoxes}</div>
            <div>全体サイズ:</div>
            <div>幅: ${size.x.toFixed(1)}cm</div>
            <div>高さ: ${size.y.toFixed(1)}cm</div>
            <div>奥行き: ${size.z.toFixed(1)}cm</div>
        `;
    }

    handleObjectDrag(event) {
        // ドラッグが無効化されている場合は処理をスキップ
        if (!this.selectedObject || !this.isDragEnabled) {
            return;
        }
        
        const deltaX = event.clientX - this.dragStartPosition.x;
        const deltaY = event.clientY - this.dragStartPosition.y;

        // マウス移動を3D空間の移動に変換
        const movementScale = 0.3; // スケールを小さくして操作しやすく
        let newX = this.objectStartPosition.x + deltaX * movementScale; // 左右移動
        let newY = this.objectStartPosition.y - deltaY * movementScale; // 上下移動（マウス上移動で高さ増加）
        let newZ = this.objectStartPosition.z;

        // 箱モジュール全体の移動（シングルクリック）- 上下・左右のみ
        if (this.selectedBoxModule && this.selectedObject === this.selectedBoxModule.group) {
            // Y軸（上下）とX軸（左右）のみ移動、Z軸は固定
            const currentZ = this.selectedBoxModule.position.z;
            this.selectedBoxModule.group.position.set(newX, Math.max(0, newY), currentZ);
            this.selectedBoxModule.position.x = newX;
            this.selectedBoxModule.position.y = Math.max(0, newY);
            // Z軸は変更しない
            
            // UI更新
            this.updateSelectedBoxPanel();
            this.updateDimensionsPanel();
            this.placeHumanNextToShelf();
        } 
        // 個別板の移動（ダブルクリック）
        else if (this.selectedObject && this.selectedObject.userData && this.selectedObject.userData.type === 'board') {
            const boardType = this.selectedObject.userData.boardType;
            
            // 板の種類によって移動制限を設定
            switch (boardType) {
                case 'top':
                case 'bottom':
                    // 天板・底板：X,Z方向に移動可能（前後はマウスの縦移動に対応）
                    let newZForBoard = this.objectStartPosition.z + deltaY * movementScale * 0.5;
                    this.selectedObject.position.set(newX, this.selectedObject.position.y, newZForBoard);
                    break;
                case 'left':
                case 'right':
                    // 側板：Y,Z方向に移動可能
                    let newZForSide = this.objectStartPosition.z + deltaX * movementScale * 0.5;
                    this.selectedObject.position.set(this.selectedObject.position.x, newY, newZForSide);
                    break;
                case 'back':
                    // 背板：X,Y方向に移動可能
                    this.selectedObject.position.set(newX, newY, this.selectedObject.position.z);
                    break;
            }
        }
    }

    getBoxModuleById(boxId) {
        return this.boxModules.find(box => box.id === boxId);
    }

    getSceneCenter() {
        if (this.boxModules.length === 0) {
            return new THREE.Vector3(0, 40, 0); // デフォルト位置
        }

        // 全ての箱モジュールの境界ボックスを計算
        const allBounds = new THREE.Box3();
        this.boxModules.forEach(boxModule => {
            const box = new THREE.Box3().setFromObject(boxModule.group);
            allBounds.union(box);
        });

        const center = new THREE.Vector3();
        allBounds.getCenter(center);
        return center;
    }

    highlightSelectedObject(object) {
        // 既存のハイライトを解除
        if (this.highlightedObject && this.highlightedObject !== object) {
            this.highlightedObject.material.emissive.setHex(0x000000);
        }

        // 新しいオブジェクトをハイライト
        object.material.emissive.setHex(0x444444);
        this.highlightedObject = object;
    }

    updateObjectData() {
        if (!this.selectedObject) return;

        if (this.selectedObject.userData.type === 'board') {
            // 板の位置データを更新
            console.log(`板 ${this.selectedObject.userData.boardId} の位置が更新されました`);
            // リアルタイムでUIを更新
            this.renderBoxModuleList();
            this.updateDimensionsPanel();
        }
    }

    setupControls() {
        // 箱モジュール操作
        this.setupBoxModuleControls();
        
        // デフォルト設定
        
        // 人物表示切り替え
        this.setupHumanToggle();
        
        // キーボードショートカット
        this.setupKeyboardControls();
        
        // 選択箱の支柱・棚板コントロール
        this.setupSelectedBoxMainControls();
        
        // 選択板のコントロール
        this.setupSelectedBoardMainControls();
    }

    setupBoxModuleControls() {
        // 新しい箱モジュール追加
        document.getElementById('addBoxModule').addEventListener('click', () => {
            const newBox = this.addBoxModule(0, 0, 0);
            // 新しい箱を自動選択
            this.selectedBoxModule = newBox;
            console.log('新しい箱を自動選択:', newBox.id);
            this.renderBoxModuleList();
            this.updateSelectedBoxPanel();
            this.updateDimensionsPanel();
        });

        // L字型テンプレート作成
        document.getElementById('createLShape').addEventListener('click', () => {
            this.createLShapeTemplate();
            this.renderBoxModuleList();
            this.updateDimensionsPanel();
        });

        // 全てクリア
        document.getElementById('clearAll').addEventListener('click', () => {
            if (confirm('全ての箱モジュールを削除しますか？')) {
                this.clearAllModules();
                this.renderBoxModuleList();
                this.updateDimensionsPanel();
            }
        });
    }


    setupKeyboardControls() {
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Delete') {
                // ダブルクリック選択時はselectedBoardを、シングルクリック選択時はselectedObjectを確認
                const targetObject = this.selectedBoard || this.selectedObject;
                if (targetObject && targetObject.userData && targetObject.userData.boardId) {
                    this.removeBoardFromBox(targetObject.userData.boardId);
                    this.selectedBoard = null;
                    this.selectedObject = null;
                    document.getElementById('selectedBoardPanel').style.display = 'none';
                    this.renderBoxModuleList();
                    this.updateDimensionsPanel();
                }
            }
        });
    }

    renderBoxModuleList() {
        const container = document.getElementById('boxModuleList');
        container.innerHTML = '';

        this.boxModules.forEach(boxModule => {
            const moduleItem = document.createElement('div');
            moduleItem.className = 'shelf-item';
            const isSelected = this.selectedBoxModule && this.selectedBoxModule.id === boxModule.id;
            moduleItem.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span><strong>箱モジュール ${boxModule.id}</strong> ${isSelected ? '(選択中)' : ''}</span>
                    <div>
                        <button class="thickness-btn select-btn" data-box-id="${boxModule.id}" style="margin-right: 5px;">選択</button>
                        <button class="remove-btn" data-box-id="${boxModule.id}">削除</button>
                    </div>
                </div>
                <div style="font-size: 10px; color: #666; margin-top: 5px;">
                    サイズ: ${boxModule.size.width}×${boxModule.size.height}×${boxModule.size.depth}cm
                </div>
                <div style="font-size: 10px; color: #666;">
                    位置: (${boxModule.position.x.toFixed(1)}, ${boxModule.position.y.toFixed(1)}, ${boxModule.position.z.toFixed(1)})
                </div>
            `;

            // 選択ボタンのイベント
            const selectBtn = moduleItem.querySelector('.select-btn');
            selectBtn.addEventListener('click', () => {
                this.selectedBoxModule = boxModule;
                console.log('箱モジュール一覧から選択:', boxModule.id);
                this.renderBoxModuleList(); // 選択状態の表示を更新
                this.updateSelectedBoxPanel(); // 選択箱パネルを表示
            });

            // 削除ボタンのイベント
            const removeBtn = moduleItem.querySelector('.remove-btn');
            removeBtn.addEventListener('click', () => {
                this.removeBoxModule(boxModule.id);
                
                // 削除した箱が選択中だった場合、他の箱を自動選択
                if (this.selectedBoxModule && this.selectedBoxModule.id === boxModule.id) {
                    if (this.boxModules.length > 0) {
                        this.selectedBoxModule = this.boxModules[0];
                        this.updateSelectedBoxPanel();
                    } else {
                        this.clearSelection();
                    }
                }
                
                this.renderBoxModuleList();
                this.updateDimensionsPanel();
            });

            container.appendChild(moduleItem);
        });
    }

    setupSelectedBoxMainControls() {
        // イベント委譲を使用して動的要素にも対応
        document.addEventListener('click', (event) => {
            // 支柱追加ボタン
            if (event.target && event.target.id === 'addSupport') {
                console.log('支柱追加ボタンクリック');
                if (this.selectedBoxModule) {
                    this.addSupportToBox(this.selectedBoxModule.id, 0, 0);
                    this.updateSelectedBoxPanel();
                }
            }
            
            // 棚板追加ボタン
            if (event.target && event.target.id === 'addShelf') {
                console.log('棚板追加ボタンクリック');
                if (this.selectedBoxModule) {
                    this.addShelfToBox(this.selectedBoxModule.id, 40);
                    this.updateSelectedBoxPanel();
                }
            }
        });
    }

    setupSelectedBoxControls() {
        // 支柱の位置・幅調整
        document.querySelectorAll('#supportsList .position-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const supportId = parseInt(e.target.dataset.supportId);
                const axis = e.target.dataset.axis;
                const type = e.target.dataset.type;
                const value = parseFloat(e.target.value) || 0;
                
                if (type === 'width') {
                    this.updateSupportWidth(supportId, value);
                } else if (axis === 'x') {
                    this.updateSupportPosition(supportId, value, null);
                } else if (axis === 'z') {
                    this.updateSupportPosition(supportId, null, value);
                }
            });
        });

        // 支柱削除
        document.querySelectorAll('#supportsList .remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const supportId = parseInt(e.target.dataset.supportId);
                this.removeSupportFromBox(supportId);
                this.updateSelectedBoxPanel();
            });
        });

        // 棚板の高さ調整
        document.querySelectorAll('#shelvesList .height-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const shelfId = parseInt(e.target.dataset.shelfId);
                const height = parseFloat(e.target.value) || 0;
                this.updateShelfHeight(shelfId, height);
            });
        });

        // 棚板の幅・奥行き調整
        document.querySelectorAll('#shelvesList .position-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const shelfId = parseInt(e.target.dataset.shelfId);
                const type = e.target.dataset.type;
                const value = parseFloat(e.target.value) || 0;
                
                if (type === 'width' || type === 'depth') {
                    this.updateShelfSize(shelfId, type, value);
                }
            });
        });

        // 棚板削除
        document.querySelectorAll('#shelvesList .remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const shelfId = parseInt(e.target.dataset.shelfId);
                this.removeShelfFromBox(shelfId);
                this.updateSelectedBoxPanel();
            });
        });
    }

    setupSelectedBoardMainControls() {
        // 板削除ボタン
        document.getElementById('removeBoardBtn').addEventListener('click', () => {
            if (this.selectedBoard) {
                const boardId = this.selectedBoard.userData.boardId;
                this.removeBoardFromBox(boardId);
                this.selectedBoard = null;
                document.getElementById('selectedBoardPanel').style.display = 'none';
                this.renderBoxModuleList();
                this.updateDimensionsPanel();
            }
        });

        // 選択板に支柱追加
        document.getElementById('addSupportToBoard').addEventListener('click', () => {
            if (this.selectedBoard) {
                const boxId = this.selectedBoard.userData.boxId;
                const boardData = this.selectedBoard.userData;
                
                // 板の上に支柱を追加
                if (boardData.boardType === 'top' || boardData.boardType === 'bottom') {
                    this.addSupportToBox(boxId, 0, 0);
                    this.updateSelectedBoardPanel();
                }
            }
        });
    }

    setupSelectedBoardControls() {
        // サイズ調整
        const boardWidth = document.getElementById('boardWidth');
        const boardHeight = document.getElementById('boardHeight');
        const boardDepth = document.getElementById('boardDepth');
        
        if (boardWidth) {
            boardWidth.addEventListener('input', (e) => {
                this.updateBoardSize('width', parseFloat(e.target.value));
            });
        }
        
        if (boardHeight) {
            boardHeight.addEventListener('input', (e) => {
                this.updateBoardSize('height', parseFloat(e.target.value));
            });
        }
        
        if (boardDepth) {
            boardDepth.addEventListener('input', (e) => {
                this.updateBoardSize('depth', parseFloat(e.target.value));
            });
        }
        
        // 位置調整
        const boardPosX = document.getElementById('boardPosX');
        const boardPosY = document.getElementById('boardPosY');
        const boardPosZ = document.getElementById('boardPosZ');
        
        if (boardPosX) {
            boardPosX.addEventListener('input', (e) => {
                this.updateBoardPosition('x', parseFloat(e.target.value));
            });
        }
        
        if (boardPosY) {
            boardPosY.addEventListener('input', (e) => {
                this.updateBoardPosition('y', parseFloat(e.target.value));
            });
        }
        
        if (boardPosZ) {
            boardPosZ.addEventListener('input', (e) => {
                this.updateBoardPosition('z', parseFloat(e.target.value));
            });
        }
    }

    updateBoardSize(dimension, value) {
        if (!this.selectedBoard) return;
        
        const boardData = this.selectedBoard.userData;
        const boxModule = this.getBoxModuleById(boardData.boxId);
        const board = this.getBoardById(boardData.boardId);
        
        if (!board) return;
        
        // 個別サイズが未設定の場合は初期化
        if (!board.individualSize) {
            board.individualSize = {
                width: boxModule.size.width,
                height: boxModule.size.height,
                depth: boxModule.size.depth
            };
        }
        
        // 板の個別サイズを更新
        switch (dimension) {
            case 'width':
                board.individualSize.width = value;
                break;
            case 'height':
                board.individualSize.height = value;
                break;
            case 'depth':
                board.individualSize.depth = value;
                break;
        }
        
        // 箱モジュールを再構築
        this.buildBoxModule(boxModule);
        
        // 選択板を再設定
        this.selectedBoard = boxModule.group.children.find(child => 
            child.userData.boardId === boardData.boardId
        );
        
        this.highlightSelectedObject(this.selectedBoard);
    }

    updateBoardPosition(axis, value) {
        if (!this.selectedBoard) return;
        
        switch (axis) {
            case 'x':
                this.selectedBoard.position.x = value;
                break;
            case 'y':
                this.selectedBoard.position.y = value;
                break;
            case 'z':
                this.selectedBoard.position.z = value;
                break;
        }
    }

    setupBoxSizeControls() {
        console.log('setupBoxSizeControls開始');
        // 箱のサイズ調整
        const boxWidth = document.getElementById('boxWidth');
        const boxHeight = document.getElementById('boxHeight');
        const boxDepth = document.getElementById('boxDepth');
        
        console.log('boxWidth要素:', boxWidth);
        console.log('boxHeight要素:', boxHeight);
        console.log('boxDepth要素:', boxDepth);
        
        if (boxWidth) {
            console.log('boxWidth にイベントリスナー追加');
            boxWidth.addEventListener('input', (e) => {
                console.log('箱の幅変更:', e.target.value);
                this.updateBoxSize('width', parseFloat(e.target.value));
            });
        } else {
            console.log('boxWidth要素が見つかりません');
        }
        
        if (boxHeight) {
            console.log('boxHeight にイベントリスナー追加');
            boxHeight.addEventListener('input', (e) => {
                console.log('箱の高さ変更:', e.target.value);
                this.updateBoxSize('height', parseFloat(e.target.value));
            });
        } else {
            console.log('boxHeight要素が見つかりません');
        }
        
        if (boxDepth) {
            console.log('boxDepth にイベントリスナー追加');
            boxDepth.addEventListener('input', (e) => {
                console.log('箱の奥行き変更:', e.target.value);
                this.updateBoxSize('depth', parseFloat(e.target.value));
            });
        } else {
            console.log('boxDepth要素が見つかりません');
        }
        
        // 箱の位置調整
        const boxPosX = document.getElementById('boxPosX');
        const boxPosY = document.getElementById('boxPosY');
        const boxPosZ = document.getElementById('boxPosZ');
        
        if (boxPosX) {
            boxPosX.addEventListener('input', (e) => {
                this.updateBoxPosition('x', parseFloat(e.target.value));
            });
        }
        
        if (boxPosY) {
            boxPosY.addEventListener('input', (e) => {
                this.updateBoxPosition('y', parseFloat(e.target.value));
            });
        }
        
        if (boxPosZ) {
            boxPosZ.addEventListener('input', (e) => {
                this.updateBoxPosition('z', parseFloat(e.target.value));
            });
        }
    }

    updateBoxSize(dimension, value) {
        console.log(`updateBoxSize呼び出し: ${dimension} = ${value}`);
        console.log('selectedBoxModule:', this.selectedBoxModule);
        
        if (!this.selectedBoxModule) {
            console.log('selectedBoxModuleがnullのため処理終了');
            return;
        }
        
        // 箱のサイズを更新
        switch (dimension) {
            case 'width':
                console.log(`幅を${this.selectedBoxModule.size.width}から${value}に変更`);
                this.selectedBoxModule.size.width = value;
                break;
            case 'height':
                console.log(`高さを${this.selectedBoxModule.size.height}から${value}に変更`);
                this.selectedBoxModule.size.height = value;
                break;
            case 'depth':
                console.log(`奥行きを${this.selectedBoxModule.size.depth}から${value}に変更`);
                this.selectedBoxModule.size.depth = value;
                break;
        }
        
        console.log('箱モジュール再構築開始');
        // 箱モジュールを再構築
        this.buildBoxModule(this.selectedBoxModule);
        console.log('寸法パネル更新');
        this.updateDimensionsPanel();
    }

    updateBoxPosition(axis, value) {
        if (!this.selectedBoxModule) return;
        
        // 箱の位置を更新
        switch (axis) {
            case 'x':
                this.selectedBoxModule.position.x = value;
                this.selectedBoxModule.group.position.x = value;
                break;
            case 'y':
                this.selectedBoxModule.position.y = value;
                this.selectedBoxModule.group.position.y = value;
                break;
            case 'z':
                this.selectedBoxModule.position.z = value;
                this.selectedBoxModule.group.position.z = value;
                break;
        }
        
        this.updateDimensionsPanel();
        this.placeHumanNextToShelf();
    }


    setupHumanToggle() {
        const toggle = document.getElementById('toggleHuman');
        toggle.addEventListener('change', async (e) => {
            if (e.target.checked) {
                try {
                    await this.loadHuman();
                } catch {
                    e.target.checked = false;
                }
            } else {
                if (this.human) {
                    this.scene.remove(this.human);
                    disposeObject3D(this.human);
                    this.human = null;
                }
            }
            this.renderer.render(this.scene, this.camera);
        });
    }


    onWindowResize() {
        const viewport = this.renderer.domElement.parentElement;
        this.camera.aspect = viewport.clientWidth / viewport.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(viewport.clientWidth, viewport.clientHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }
}

// 破棄ユーティリティ
function disposeObject3D(obj) {
    obj.traverse(o => {
        o.geometry?.dispose?.();
        o.material?.dispose?.();
    });
}

// アプリケーション開始
document.addEventListener('DOMContentLoaded', () => {
    new ShelfDesigner();
});