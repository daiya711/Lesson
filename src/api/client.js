/**
 * 収納棚設計プラットフォーム - API Client
 * Hono + Cloudflare D1 Database 連携
 */
import { prepareDesignData, parseDesignData } from '../utils/data-converters.js';

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