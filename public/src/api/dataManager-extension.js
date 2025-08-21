/**
 * DataManager拡張 - データベース機能追加
 * 既存のDataManagerクラスにデータベース保存・読込機能を追加
 */

// DataManagerクラスの拡張メソッドを追加
console.log('dataManager-extension.js 読み込み開始');
console.log('DataManager availability check:', typeof DataManager !== 'undefined', typeof DataManager);

// DataManagerクラス定義を待つ関数
function addDataManagerExtensions() {
    if (typeof DataManager !== 'undefined') {
        console.log('DataManager クラス確認完了。拡張メソッドを追加します。');
    
    /**
     * データベースに設計を保存
     */
    DataManager.prototype.saveDesignToDatabase = async function(title) {
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

    /**
     * データベースから設計を読み込み
     */
    DataManager.prototype.loadDesignFromDatabase = async function(designId) {
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

    /**
     * 保存済み設計一覧を取得
     */
    DataManager.prototype.getSavedDesigns = async function() {
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

    /**
     * 設計を削除
     */
    DataManager.prototype.deleteDesignFromDatabase = async function(designId) {
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

    /**
     * メッセージ表示ヘルパー
     */
    DataManager.prototype.showSaveMessage = function(message, type = 'info') {
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

        console.log('DataManager拡張機能が追加されました');
        return true;
    } else {
        console.warn('DataManager クラスが見つかりません。再試行します...');
        return false;
    }
}

// 即座に試行
if (!addDataManagerExtensions()) {
    // DataManagerクラス定義を待つ
    let retryCount = 0;
    const maxRetries = 20;
    
    const checkInterval = setInterval(() => {
        retryCount++;
        console.log(`DataManager 存在確認 試行 ${retryCount}/${maxRetries}`);
        
        if (addDataManagerExtensions()) {
            clearInterval(checkInterval);
            console.log('DataManager拡張機能の遅延追加が完了しました');
        } else if (retryCount >= maxRetries) {
            clearInterval(checkInterval);
            console.error('DataManager拡張機能の追加に失敗しました（タイムアウト）');
        }
    }, 100);
}