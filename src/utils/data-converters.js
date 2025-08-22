/**
 * データ構造変換ユーティリティ
 * 収納棚設計データの保存・読み込み形式変換
 */

/**
 * 設計データをデータベース保存形式に変換
 * @param {Object} templateData - テンプレートデータ
 * @param {Array} boardsData - 個別板データ配列
 * @returns {Object} 保存用JSON形式データ
 */
export function prepareDesignData(templateData, boardsData) {
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
export function parseDesignData(designData) {
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