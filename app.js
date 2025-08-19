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
        this.isDragging = false;
        this.dragStartPosition = new THREE.Vector2();
        this.objectStartPosition = new THREE.Vector3();
        
        // 箱モジュールベースシステム
        this.boxModules = []; // 箱モジュールの配列
        this.boxCounter = 0;
        this.boardCounter = 0;
        this.supportCounter = 0; // 支柱IDカウンター
        this.shelfCounter = 0;   // 棚板IDカウンター
        this.selectedBoxModule = null; // 選択中の箱モジュール
        
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
        this.renderBoxModuleList();
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

    createBoardMesh(board, width, height, depth, material) {
        const thickness = board.thickness / 10; // mm→cm
        let geometry, position;
        
        switch (board.type) {
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
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(...position);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        return mesh;
    }

    createSupportMesh(support, boxWidth, boxHeight, boxDepth, material) {
        const thickness = support.thickness / 10; // mm→cm
        
        // 支柱：縦の板として作成
        const geometry = new THREE.BoxGeometry(thickness, boxHeight, thickness);
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
        const geometry = new THREE.BoxGeometry(boxWidth - 2, thickness, boxDepth - 2);
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
            for (const board of Object.values(boxModule.boards)) {
                if (board.id === boardId) {
                    board.enabled = false;
                    this.buildBoxModule(boxModule);
                    return;
                }
            }
        }
    }

    addSupportToBox(boxId, x = 0, z = 0) {
        const boxModule = this.getBoxModuleById(boxId);
        if (!boxModule) return null;
        
        const support = this.createSupport(boxId, x, z);
        boxModule.supports.push(support);
        this.buildBoxModule(boxModule);
        return support;
    }

    removeSupportFromBox(supportId) {
        for (const boxModule of this.boxModules) {
            const supportIndex = boxModule.supports.findIndex(s => s.id === supportId);
            if (supportIndex !== -1) {
                boxModule.supports.splice(supportIndex, 1);
                this.buildBoxModule(boxModule);
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
                boxModule.shelves.splice(shelfIndex, 1);
                this.buildBoxModule(boxModule);
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
                    intersect.object.userData.type === 'board'
                );

                if (selectableObject) {
                    // 個別板選択・ドラッグ開始
                    this.selectedObject = selectableObject.object;
                    this.isDragging = true;
                    this.dragStartPosition.set(event.clientX, event.clientY);
                    this.objectStartPosition.copy(this.selectedObject.position);
                    this.highlightSelectedObject(this.selectedObject);
                    
                    // Shiftキーが押されている場合は箱モジュール全体を選択
                    if (event.shiftKey) {
                        this.selectedBoxModule = this.getBoxModuleById(this.selectedObject.userData.boxId);
                        this.objectStartPosition.copy(this.selectedBoxModule.group.position);
                    }
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
        canvas.addEventListener('click', (event) => {
            if (!this.isDragging) {
                this.onCanvasClick(event);
            }
        });
    }

    onCanvasClick(event) {
        // ドラッグ中の場合はクリック処理をスキップ
        if (this.isDragging) return;
        
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
                const intersectedObject = intersects[0].object;
                
                if (intersectedObject.userData && intersectedObject.userData.type === 'board') {
                    // 板の情報を表示
                    this.showBoardInfo(intersectedObject);
                    this.updateDimensionsPanel();
                }
            }
        }
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

    updateSelectedBoxPanel() {
        const panel = document.getElementById('selectedBoxPanel');
        const info = document.getElementById('selectedBoxInfo');
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
        
        // 支柱リスト更新
        supportsList.innerHTML = '';
        this.selectedBoxModule.supports.forEach(support => {
            const supportItem = document.createElement('div');
            supportItem.className = 'support-item';
            supportItem.innerHTML = `
                <div class="support-controls">
                    <span>支柱 ${support.id}</span>
                    <div>
                        X:<input type="number" class="position-input" value="${support.position.x}" data-support-id="${support.id}" data-axis="x">
                        Z:<input type="number" class="position-input" value="${support.position.z}" data-support-id="${support.id}" data-axis="z">
                        <button class="remove-btn" data-support-id="${support.id}">削除</button>
                    </div>
                </div>
            `;
            supportsList.appendChild(supportItem);
        });
        
        // 棚板リスト更新
        shelvesList.innerHTML = '';
        this.selectedBoxModule.shelves.forEach(shelf => {
            const shelfItem = document.createElement('div');
            shelfItem.className = 'shelf-item';
            shelfItem.innerHTML = `
                <div class="shelf-controls">
                    <span>棚板 ${shelf.id}</span>
                    <div>
                        高さ:<input type="number" class="height-input" value="${shelf.height}" data-shelf-id="${shelf.id}">cm
                        <button class="remove-btn" data-shelf-id="${shelf.id}">削除</button>
                    </div>
                </div>
            `;
            shelvesList.appendChild(shelfItem);
        });
        
        this.setupSelectedBoxControls();
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
        const deltaX = event.clientX - this.dragStartPosition.x;
        const deltaY = event.clientY - this.dragStartPosition.y;

        // マウス移動を3D空間の移動に変換
        const movementScale = 0.5;
        let newX = this.objectStartPosition.x + deltaX * movementScale;
        let newY = this.objectStartPosition.y - deltaY * movementScale;
        let newZ = this.objectStartPosition.z;

        if (this.selectedBoxModule) {
            // 箱モジュール全体の移動（Shift+ドラッグ）
            this.selectedBoxModule.group.position.set(newX, Math.max(0, newY), newZ);
            this.selectedBoxModule.position.x = newX;
            this.selectedBoxModule.position.y = Math.max(0, newY);
            this.selectedBoxModule.position.z = newZ;
        } else if (this.selectedObject.userData.type === 'board') {
            // 個別板の移動
            const boardType = this.selectedObject.userData.boardType;
            
            // 板の種類によって移動制限を設定
            switch (boardType) {
                case 'top':
                case 'bottom':
                    // 天板・底板：X,Z方向に移動可能
                    this.selectedObject.position.set(newX, this.selectedObject.position.y, newZ);
                    break;
                case 'left':
                case 'right':
                    // 側板：Y,Z方向に移動可能
                    this.selectedObject.position.set(this.selectedObject.position.x, newY, newZ);
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
        this.setupDefaultSettings();
        
        // 人物表示切り替え
        this.setupHumanToggle();
        
        // キーボードショートカット
        this.setupKeyboardControls();
        
        // 選択箱の支柱・棚板コントロール
        this.setupSelectedBoxMainControls();
    }

    setupBoxModuleControls() {
        // 新しい箱モジュール追加
        document.getElementById('addBoxModule').addEventListener('click', () => {
            this.addBoxModule(0, 0, 0);
            this.renderBoxModuleList();
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

    setupDefaultSettings() {
        const widthSlider = document.getElementById('defaultWidthSlider');
        const heightSlider = document.getElementById('defaultHeightSlider');
        const depthSlider = document.getElementById('defaultDepthSlider');

        widthSlider.addEventListener('input', (e) => {
            this.defaults.boxSize.width = parseInt(e.target.value);
            document.getElementById('defaultWidth').textContent = `${this.defaults.boxSize.width}cm`;
        });

        heightSlider.addEventListener('input', (e) => {
            this.defaults.boxSize.height = parseInt(e.target.value);
            document.getElementById('defaultHeight').textContent = `${this.defaults.boxSize.height}cm`;
        });

        depthSlider.addEventListener('input', (e) => {
            this.defaults.boxSize.depth = parseInt(e.target.value);
            document.getElementById('defaultDepth').textContent = `${this.defaults.boxSize.depth}cm`;
        });
    }

    setupKeyboardControls() {
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Delete' && this.selectedObject) {
                this.removeBoardFromBox(this.selectedObject.userData.boardId);
                this.renderBoxModuleList();
                this.updateDimensionsPanel();
            }
        });
    }

    renderBoxModuleList() {
        const container = document.getElementById('boxModuleList');
        container.innerHTML = '';

        this.boxModules.forEach(boxModule => {
            const moduleItem = document.createElement('div');
            moduleItem.className = 'shelf-item';
            moduleItem.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span><strong>箱モジュール ${boxModule.id}</strong></span>
                    <button class="remove-btn" data-box-id="${boxModule.id}">削除</button>
                </div>
                <div style="font-size: 10px; color: #666; margin-top: 5px;">
                    サイズ: ${boxModule.size.width}×${boxModule.size.height}×${boxModule.size.depth}cm
                </div>
                <div style="font-size: 10px; color: #666;">
                    位置: (${boxModule.position.x.toFixed(1)}, ${boxModule.position.y.toFixed(1)}, ${boxModule.position.z.toFixed(1)})
                </div>
            `;

            // 削除ボタンのイベント
            const removeBtn = moduleItem.querySelector('.remove-btn');
            removeBtn.addEventListener('click', () => {
                this.removeBoxModule(boxModule.id);
                this.renderBoxModuleList();
                this.updateDimensionsPanel();
            });

            container.appendChild(moduleItem);
        });
    }

    setupSelectedBoxMainControls() {
        // 支柱追加ボタン
        document.getElementById('addSupport').addEventListener('click', () => {
            if (this.selectedBoxModule) {
                this.addSupportToBox(this.selectedBoxModule.id, 0, 0);
                this.updateSelectedBoxPanel();
            }
        });

        // 棚板追加ボタン
        document.getElementById('addShelf').addEventListener('click', () => {
            if (this.selectedBoxModule) {
                this.addShelfToBox(this.selectedBoxModule.id, 40);
                this.updateSelectedBoxPanel();
            }
        });
    }

    setupSelectedBoxControls() {
        // 支柱の位置調整
        document.querySelectorAll('#supportsList .position-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const supportId = parseInt(e.target.dataset.supportId);
                const axis = e.target.dataset.axis;
                const value = parseFloat(e.target.value) || 0;
                
                if (axis === 'x') {
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

        // 棚板削除
        document.querySelectorAll('#shelvesList .remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const shelfId = parseInt(e.target.dataset.shelfId);
                this.removeShelfFromBox(shelfId);
                this.updateSelectedBoxPanel();
            });
        });
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