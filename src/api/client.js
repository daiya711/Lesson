/**
 * 収納棚設計プラットフォーム - API Client
 * Hono + Cloudflare D1 Database 連携
 */

/**
 * 設計データをデータベース保存形式に変換
 * @param {Object} templateData - テンプレートデータ
 * @param {Array} boardsData - 個別板データ配列
 * @returns {Object} 保存用JSON形式データ
 */
function prepareDesignData(templateData, boardsData) {
    return {
        version: "1.0",
        metadata: {
            title: "収納棚設計",
            createdAt: new Date().toISOString(),
            platform: "Shelf Designer v1.0"
        },
        template: templateData,
        boards: boardsData,
        settings: {
            units: "cm",
            material: "pine",
            thickness: 18
        }
    };
}

/**
 * データベースから読み込んだデータを解析
 * @param {string|Object} designData - 保存されたデータ（JSON文字列またはオブジェクト）
 * @returns {Object|null} 解析済みデータまたはnull（エラー時）
 */
function parseDesignData(designData) {
    if (typeof designData === 'string') {
        try {
            designData = JSON.parse(designData);
        } catch (error) {
            console.error('Design data parse error:', error);
            return null;
        }
    }

    // nullやundefinedの場合はデフォルト値を返す
    if (!designData || typeof designData !== 'object') {
        return {
            template: null,
            boards: [],
            metadata: {},
            settings: {}
        };
    }

    return {
        template: designData.template || null,
        boards: designData.boards || [],
        metadata: designData.metadata || {},
        settings: designData.settings || {}
    };
}

class ShelfDesignerAPI {
    constructor() {
        this.baseURL = window.location.origin;
        this.apiPath = '/api';
    }

    /**
     * HTTP リクエストのベースメソッド
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${this.apiPath}${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const finalOptions = { ...defaultOptions, ...options };
        
        try {
            console.log(`API Request: ${finalOptions.method || 'GET'} ${url}`);
            const response = await fetch(url, finalOptions);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`API Response:`, data);
            return data;
        } catch (error) {
            console.error(`API Error for ${url}:`, error);
            throw error;
        }
    }

    /**
     * ヘルスチェック
     */
    async health() {
        return await this.request('/health');
    }

    /**
     * 設計一覧取得
     */
    async getDesigns() {
        const response = await this.request('/designs');
        return response.designs || [];
    }

    /**
     * 設計詳細取得
     */
    async getDesign(id) {
        const response = await this.request(`/designs/${id}`);
        return response.design;
    }

    /**
     * 設計保存
     */
    async saveDesign(title, designData) {
        return await this.request('/designs', {
            method: 'POST',
            body: JSON.stringify({ title, data: designData })
        });
    }

    /**
     * 設計更新
     */
    async updateDesign(id, title, designData) {
        return await this.request(`/designs/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ title, data: designData })
        });
    }

    /**
     * 設計削除
     */
    async deleteDesign(id) {
        return await this.request(`/designs/${id}`, {
            method: 'DELETE'
        });
    }

    /**
     * 設計データをデータベース形式に変換
     */
    prepareDesignData(templateData, boardsData) {
        return prepareDesignData(templateData, boardsData);
    }

    /**
     * データベースから読み込んだデータを解析
     */
    parseDesignData(designData) {
        return parseDesignData(designData);
    }
}

// グローバルAPIクライアントインスタンス
window.shelfDesignerAPI = new ShelfDesignerAPI();