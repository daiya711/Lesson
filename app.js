class ShelfDesigner {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.shelf = null;
        this.grid = null;
        this.dimensionLines = [];
        
        // 定数
        this.constants = { HUMAN_OFFSET_X: 100 }; // mm
        
        // 人物モデル（glTFのみ）
        this.human = null;
        
        this.params = {
            width: 100,    // cm
            height: Math.max(50, Math.min(150, 150)),   // 50-150cmに制限
            depth: 40,     // cm
            shelves: 4,    // 段数
            color: '#8B4513',
            showPerson: false  // 人物表示フラグ
        };

        this.init();
        this.setupControls();
        this.animate();
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
        
        // 棚の作成
        this.createShelf();

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

    createShelf() {
        if (this.shelf) {
            this.scene.remove(this.shelf);
        }

        this.shelf = new THREE.Group();

        const woodMaterial = new THREE.MeshLambertMaterial({ 
            color: this.params.color 
        });

        const thickness = 2; // 板厚 2cm
        
        // サイズをcmからThree.jsの単位に変換（1cm = 1unit）
        const w = this.params.width;
        const h = this.params.height;
        const d = this.params.depth;
        const shelves = this.params.shelves;

        // 左右の側板
        const sideGeometry = new THREE.BoxGeometry(thickness, h, d);
        
        const leftSide = new THREE.Mesh(sideGeometry, woodMaterial);
        leftSide.position.set(-w/2 + thickness/2, h/2, 0);
        leftSide.castShadow = true;
        leftSide.receiveShadow = true;
        this.shelf.add(leftSide);

        const rightSide = new THREE.Mesh(sideGeometry, woodMaterial);
        rightSide.position.set(w/2 - thickness/2, h/2, 0);
        rightSide.castShadow = true;
        rightSide.receiveShadow = true;
        this.shelf.add(rightSide);

        // 天板・底板・棚板
        const shelfGeometry = new THREE.BoxGeometry(w - thickness * 2, thickness, d);
        
        // 底板
        const bottom = new THREE.Mesh(shelfGeometry, woodMaterial);
        bottom.position.set(0, thickness/2, 0);
        bottom.castShadow = true;
        bottom.receiveShadow = true;
        this.shelf.add(bottom);

        // 天板
        const top = new THREE.Mesh(shelfGeometry, woodMaterial);
        top.position.set(0, h - thickness/2, 0);
        top.castShadow = true;
        top.receiveShadow = true;
        this.shelf.add(top);

        // 中間の棚板（段数 = 底板 + 棚板の数）
        // shelves段 = 底板(1) + 棚板(shelves-1) なので、棚板は shelves-1 枚
        const shelfSpacing = (h - thickness * 2) / shelves;
        for (let i = 1; i < shelves; i++) {
            const shelfBoard = new THREE.Mesh(shelfGeometry, woodMaterial);
            shelfBoard.position.set(0, thickness + shelfSpacing * i, 0);
            shelfBoard.castShadow = true;
            shelfBoard.receiveShadow = true;
            this.shelf.add(shelfBoard);
        }

        // 背板（オプション）
        const backGeometry = new THREE.BoxGeometry(w, h, thickness/2);
        const backMaterial = new THREE.MeshLambertMaterial({ 
            color: new THREE.Color(this.params.color).multiplyScalar(0.8)
        });
        const back = new THREE.Mesh(backGeometry, backMaterial);
        back.position.set(0, h/2, -d/2 + thickness/4);
        back.castShadow = true;
        back.receiveShadow = true;
        this.shelf.add(back);

        this.scene.add(this.shelf);
        this.createDimensionLines();
        this.placeHumanNextToShelf();
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
        if (!this.shelf || !this.human) return;
        const box = new THREE.Box3().setFromObject(this.shelf);
        const x = box.max.x + offset;
        this.human.position.set(x, 0, 0); // mm：床に接地
    }

    setupCameraControls() {
        let isMouseDown = false;
        let mouseX = 0;
        let mouseY = 0;
        let targetX = 0;
        let targetY = 0;

        const canvas = this.renderer.domElement;

        canvas.addEventListener('mousedown', (event) => {
            isMouseDown = true;
            mouseX = event.clientX;
            mouseY = event.clientY;
        });

        canvas.addEventListener('mousemove', (event) => {
            if (!isMouseDown) return;

            const deltaX = event.clientX - mouseX;
            const deltaY = event.clientY - mouseY;

            targetX += deltaX * 0.01;
            targetY += deltaY * 0.01;

            mouseX = event.clientX;
            mouseY = event.clientY;

            // カメラを回転
            const radius = 200;
            this.camera.position.x = Math.cos(targetX) * radius;
            this.camera.position.z = Math.sin(targetX) * radius;
            this.camera.position.y = Math.max(50, 120 + targetY * 50);
            this.camera.lookAt(0, this.params.height / 2, 0);
        });

        canvas.addEventListener('mouseup', () => {
            isMouseDown = false;
        });

        canvas.addEventListener('wheel', (event) => {
            const scale = event.deltaY > 0 ? 1.1 : 0.9;
            this.camera.position.multiplyScalar(scale);
            this.camera.lookAt(0, this.params.height / 2, 0);
            event.preventDefault();
        });

        // クリックによる当たり判定とハイライト
        canvas.addEventListener('click', (event) => {
            this.onCanvasClick(event);
        });
    }

    onCanvasClick(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2();
        
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);

        if (this.shelf) {
            const intersects = raycaster.intersectObjects(this.shelf.children, true);
            
            if (intersects.length > 0) {
                const intersectedObject = intersects[0].object;
                
                // ハイライト効果
                this.highlightObject(intersectedObject);
                
                // クリック位置情報を表示
                const point = intersects[0].point;
                this.showClickInfo(point, intersectedObject);
            }
        }
    }

    highlightObject(object) {
        // 既存のハイライトをリセット
        if (this.highlightedObject) {
            this.highlightedObject.material.emissive.setHex(0x000000);
        }

        // 新しいオブジェクトをハイライト
        object.material.emissive.setHex(0x444444);
        this.highlightedObject = object;
        
        // 3秒後にハイライトを解除
        setTimeout(() => {
            if (this.highlightedObject) {
                this.highlightedObject.material.emissive.setHex(0x000000);
                this.highlightedObject = null;
            }
        }, 3000);
    }

    showClickInfo(point, object) {
        // 棚のどの部分がクリックされたかを判定
        let partName = '';
        const objectPosition = object.position;
        const shelfHeight = this.params.height;
        const shelfWidth = this.params.width;
        
        if (Math.abs(objectPosition.x) > shelfWidth / 4) {
            partName = '側板';
        } else if (objectPosition.y < 10) {
            partName = '底板';
        } else if (objectPosition.y > shelfHeight - 10) {
            partName = '天板';
        } else if (Math.abs(objectPosition.z) > this.params.depth / 3) {
            partName = '背板';
        } else {
            partName = '棚板';
        }

        // クリック情報を画面に表示
        this.updateClickInfo(partName, point);
    }

    updateClickInfo(partName, point) {
        const dimensions = document.getElementById('dimensions');
        const clickInfo = document.getElementById('clickInfo') || document.createElement('div');
        
        if (!document.getElementById('clickInfo')) {
            clickInfo.id = 'clickInfo';
            clickInfo.style.cssText = `
                margin-top: 15px;
                padding-top: 15px;
                border-top: 1px solid #ddd;
                font-size: 11px;
                color: #666;
            `;
            dimensions.appendChild(clickInfo);
        }

        clickInfo.innerHTML = `
            <div><strong>クリック情報</strong></div>
            <div>部位: ${partName}</div>
            <div>座標: (${point.x.toFixed(1)}, ${point.y.toFixed(1)}, ${point.z.toFixed(1)})</div>
            <div style="color: #007acc; margin-top: 5px;">✓ 配置確認済み</div>
        `;
    }

    setupControls() {
        // スライダーイベントリスナー
        const widthSlider = document.getElementById('widthSlider');
        const heightSlider = document.getElementById('heightSlider');
        const depthSlider = document.getElementById('depthSlider');
        const shelvesSlider = document.getElementById('shelvesSlider');
        const colorPicker = document.getElementById('colorPicker');

        widthSlider.addEventListener('input', (e) => {
            this.params.width = parseInt(e.target.value);
            document.getElementById('widthValue').textContent = `${this.params.width}cm`;
            document.getElementById('dimWidth').textContent = this.params.width;
            this.createShelf();
        });

        heightSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.params.height = Math.max(50, Math.min(150, value));  // 50-150cmに制限
            document.getElementById('heightValue').textContent = `${this.params.height}cm`;
            document.getElementById('dimHeight').textContent = this.params.height;
            this.createShelf();
        });

        depthSlider.addEventListener('input', (e) => {
            this.params.depth = parseInt(e.target.value);
            document.getElementById('depthValue').textContent = `${this.params.depth}cm`;
            document.getElementById('dimDepth').textContent = this.params.depth;
            this.createShelf();
        });

        shelvesSlider.addEventListener('input', (e) => {
            this.params.shelves = parseInt(e.target.value);
            document.getElementById('shelvesValue').textContent = `${this.params.shelves}段`;
            document.getElementById('dimShelves').textContent = this.params.shelves;
            this.createShelf();
        });

        colorPicker.addEventListener('input', (e) => {
            this.params.color = e.target.value;
            this.createShelf();
        });

        // 人物表示切り替え
        const toggle = document.getElementById('toggleHuman');
        toggle.addEventListener('change', async (e) => {
            if (e.target.checked) {
                try {
                    await this.loadHuman();
                } catch {
                    e.target.checked = false; // アセット未配置時はOFFに戻すだけ
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