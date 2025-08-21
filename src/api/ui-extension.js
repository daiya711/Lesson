/**
 * UI拡張 - データベース機能用イベントリスナー
 * 新しく追加されたクラウド保存・読込ボタンの機能実装
 */

// DOM読み込み完了後に実行
document.addEventListener('DOMContentLoaded', function() {
    console.log('データベースUI拡張機能初期化開始');
    
    // DataManager初期化完了イベントを待機
    window.addEventListener('dataManagerReady', function(event) {
        console.log('dataManagerReady イベント受信:', event.detail);
        initializeDatabaseUI();
    });
    
    // フォールバック: 既に初期化済みの場合
    if (window.shelfDesigner && window.shelfDesigner.dataManager) {
        console.log('DataManager既に初期化済み。即座に初期化します。');
        initializeDatabaseUI();
    } else {
        // タイムアウト設定
        setTimeout(() => {
            if (!window.dataManagerUIInitialized) {
                console.warn('DataManager初期化タイムアウト。フォールバック処理を実行します。');
                initializeDatabaseUIFallback();
            }
        }, 5000);
    }
});

function initializeDatabaseUI() {
    console.log('initializeDatabaseUI 開始');
    window.dataManagerUIInitialized = true;
    
    // DataManager拡張メソッド存在確認
    const dataManager = window.shelfDesigner?.dataManager;
    if (!dataManager) {
        console.error('window.shelfDesigner.dataManager が見つかりません');
        initializeDatabaseUIFallback();
        return;
    }
    
    if (typeof dataManager.saveDesignToDatabase !== 'function') {
        console.error('dataManager.saveDesignToDatabase メソッドが見つかりません');
        console.log('利用可能なメソッド:', Object.getOwnPropertyNames(dataManager));
        initializeDatabaseUIFallback();
        return;
    }
    
    console.log('DataManager拡張メソッド確認完了');

    // クラウド保存ボタン
    const saveToDbBtn = document.getElementById('saveToDatabase');
    if (saveToDbBtn) {
        console.log('クラウド保存ボタン: イベントリスナー設定完了');
        saveToDbBtn.addEventListener('click', async () => {
            console.log('クラウド保存ボタンクリック');
            
            const title = prompt('設計のタイトルを入力してください:', `収納棚設計_${new Date().toLocaleDateString()}`);
            if (!title) return;

            try {
                const dataManager = window.shelfDesigner?.dataManager;
                if (dataManager && dataManager.saveDesignToDatabase) {
                    await dataManager.saveDesignToDatabase(title);
                } else {
                    throw new Error('DataManager not available');
                }
            } catch (error) {
                console.error('クラウド保存エラー:', error);
                console.log('エラー詳細:', {
                    message: error.message,
                    stack: error.stack,
                    dataManager: window.shelfDesigner?.dataManager,
                    apiClient: window.shelfDesignerAPI,
                    currentURL: window.location.href
                });
                
                // より詳細なエラーメッセージを表示
                let errorMessage = `保存に失敗しました: ${error.message}`;
                
                if (error.message === 'DataManager not available') {
                    errorMessage += `\n\n詳細情報:
                    - ShelfDesigner: ${window.shelfDesigner ? '✓' : '✗'}
                    - DataManager: ${window.shelfDesigner?.dataManager ? '✓' : '✗'}
                    - saveDesignToDatabase: ${window.shelfDesigner?.dataManager?.saveDesignToDatabase ? '✓' : '✗'}
                    
                    デバッグのため、ブラウザのコンソールをご確認ください。`;
                }
                
                alert(errorMessage);
            }
        });
    } else {
        console.warn('クラウド保存ボタンが見つかりません');
    }

    // クラウド読込ボタン  
    const loadFromDbBtn = document.getElementById('loadFromDatabase');
    if (loadFromDbBtn) {
        console.log('クラウド読込ボタン: イベントリスナー設定完了');
        loadFromDbBtn.addEventListener('click', async () => {
            console.log('クラウド読込ボタンクリック');
            
            const designId = prompt('読み込む設計のIDを入力してください:');
            if (!designId) return;

            try {
                const dataManager = window.shelfDesigner?.dataManager;
                if (dataManager && dataManager.loadDesignFromDatabase) {
                    await dataManager.loadDesignFromDatabase(designId);
                } else {
                    throw new Error('DataManager not available');
                }
            } catch (error) {
                console.error('クラウド読込エラー:', error);
                alert(`読み込みに失敗しました: ${error.message}`);
            }
        });
    } else {
        console.warn('クラウド読込ボタンが見つかりません');
    }

    // 保存済み一覧ボタン
    const showSavedBtn = document.getElementById('showSavedDesigns');
    if (showSavedBtn) {
        console.log('保存済み一覧ボタン: イベントリスナー設定完了');
        showSavedBtn.addEventListener('click', async () => {
            console.log('保存済み一覧ボタンクリック');
            
            try {
                const dataManager = window.shelfDesigner?.dataManager;
                if (dataManager && dataManager.getSavedDesigns) {
                    const designs = await dataManager.getSavedDesigns();
                    showDesignsList(designs);
                } else {
                    throw new Error('DataManager not available');
                }
            } catch (error) {
                console.error('一覧取得エラー:', error);
                alert(`一覧取得に失敗しました: ${error.message}`);
            }
        });
    } else {
        console.warn('保存済み一覧ボタンが見つかりません');
    }

    /**
     * 設計一覧表示モーダル
     */
    function showDesignsList(designs) {
        // 既存のモーダルを削除
        const existingModal = document.getElementById('designsListModal');
        if (existingModal) {
            existingModal.remove();
        }

        // モーダル作成
        const modal = document.createElement('div');
        modal.id = 'designsListModal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); z-index: 2000; display: flex;
            align-items: center; justify-content: center;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: white; border-radius: 8px; padding: 20px;
            max-width: 600px; max-height: 80vh; overflow-y: auto;
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        `;

        let html = '<h3 style="margin: 0 0 20px 0;">保存済み設計一覧</h3>';
        
        if (designs.length === 0) {
            html += '<p style="color: #666; text-align: center;">保存済みの設計がありません</p>';
        } else {
            html += '<div style="max-height: 400px; overflow-y: auto;">';
            designs.forEach(design => {
                const createdAt = new Date(design.created_at).toLocaleString();
                const updatedAt = new Date(design.updated_at).toLocaleString();
                
                html += `
                    <div style="border: 1px solid #ddd; border-radius: 4px; padding: 12px; margin-bottom: 8px;">
                        <div style="font-weight: bold; margin-bottom: 4px;">${design.title}</div>
                        <div style="font-size: 11px; color: #666; margin-bottom: 8px;">
                            ID: ${design.id}<br>
                            作成: ${createdAt}<br>
                            更新: ${updatedAt}
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button onclick="loadDesignById('${design.id}')" 
                                    style="background: #007acc; color: white; border: none; 
                                           padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 11px;">
                                読み込み
                            </button>
                            <button onclick="deleteDesignById('${design.id}')" 
                                    style="background: #dc3545; color: white; border: none; 
                                           padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 11px;">
                                削除
                            </button>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }
        
        html += `
            <div style="text-align: center; margin-top: 20px;">
                <button onclick="document.getElementById('designsListModal').remove()" 
                        style="background: #6c757d; color: white; border: none; 
                               padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                    閉じる
                </button>
            </div>
        `;

        content.innerHTML = html;
        modal.appendChild(content);
        document.body.appendChild(modal);

        // モーダル外クリックで閉じる
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // グローバル関数として設定（モーダル内のボタンから呼び出し用）
    window.loadDesignById = async function(designId) {
        try {
            const dataManager = window.shelfDesigner?.dataManager;
            if (dataManager && dataManager.loadDesignFromDatabase) {
                await dataManager.loadDesignFromDatabase(designId);
                document.getElementById('designsListModal')?.remove();
            }
        } catch (error) {
            alert(`読み込みに失敗しました: ${error.message}`);
        }
    };

    window.deleteDesignById = async function(designId) {
        if (!confirm('この設計を削除してもよろしいですか？')) return;
        
        try {
            const dataManager = window.shelfDesigner?.dataManager;
            if (dataManager && dataManager.deleteDesignFromDatabase) {
                await dataManager.deleteDesignFromDatabase(designId);
                // 一覧を再表示
                const designs = await dataManager.getSavedDesigns();
                showDesignsList(designs);
            }
        } catch (error) {
            alert(`削除に失敗しました: ${error.message}`);
        }
    };

}

function initializeDatabaseUIFallback() {
    console.warn('DataManagerなしでUI拡張機能を初期化します');
    
    // クラウド保存ボタン
    const saveToDbBtn = document.getElementById('saveToDatabase');
    if (saveToDbBtn) {
        saveToDbBtn.addEventListener('click', () => {
            alert('データベース機能は現在利用できません。\nローカルファイル保存をご利用ください。');
        });
    }
    
    // クラウド読込ボタン  
    const loadFromDbBtn = document.getElementById('loadFromDatabase');
    if (loadFromDbBtn) {
        loadFromDbBtn.addEventListener('click', () => {
            alert('データベース機能は現在利用できません。\nローカルファイル読込をご利用ください。');
        });
    }
    
    // 保存済み一覧ボタン
    const showSavedBtn = document.getElementById('showSavedDesigns');
    if (showSavedBtn) {
        showSavedBtn.addEventListener('click', () => {
            alert('データベース機能は現在利用できません。');
        });
    }
    
    console.log('フォールバックUI拡張機能初期化完了');
}