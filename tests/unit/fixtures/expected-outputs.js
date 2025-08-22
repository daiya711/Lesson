/**
 * 期待される出力データのテスト用フィクスチャ
 */

import { validTemplateData, emptyTemplateData } from './template-data.js';
import { validBoardsData, emptyBoardsData, singleBoardData } from './boards-data.js';

// prepareDesignData関数の期待される出力
export const expectedPreparedDesignData = {
    version: "1.0",
    metadata: {
        title: "収納棚設計",
        createdAt: expect.any(String), // ISO日付文字列
        platform: "Shelf Designer v1.0"
    },
    template: validTemplateData,
    boards: validBoardsData,
    settings: {
        units: "cm",
        material: "pine",
        thickness: 18
    }
};

export const expectedPreparedEmptyData = {
    version: "1.0",
    metadata: {
        title: "収納棚設計",
        createdAt: expect.any(String),
        platform: "Shelf Designer v1.0"
    },
    template: emptyTemplateData,
    boards: emptyBoardsData,
    settings: {
        units: "cm",
        material: "pine",
        thickness: 18
    }
};

// parseDesignData関数のテスト用保存データ
export const savedDesignDataString = JSON.stringify({
    version: "1.0",
    metadata: {
        title: "保存済み収納棚設計",
        createdAt: "2025-01-21T10:30:00.000Z",
        platform: "Shelf Designer v1.0"
    },
    template: validTemplateData,
    boards: singleBoardData,
    settings: {
        units: "cm",
        material: "plywood",
        thickness: 20
    }
});

export const savedDesignDataObject = {
    version: "1.0",
    metadata: {
        title: "オブジェクト形式設計",
        createdAt: "2025-01-21T11:45:00.000Z",
        platform: "Shelf Designer v1.0"
    },
    template: validTemplateData,
    boards: validBoardsData,
    settings: {
        units: "mm",
        material: "oak",
        thickness: 25
    }
};

// parseDesignData関数の期待される出力
export const expectedParsedData = {
    template: validTemplateData,
    boards: singleBoardData,
    metadata: {
        title: "保存済み収納棚設計",
        createdAt: "2025-01-21T10:30:00.000Z",
        platform: "Shelf Designer v1.0"
    },
    settings: {
        units: "cm",
        material: "plywood",
        thickness: 20
    }
};

export const expectedParsedObjectData = {
    template: validTemplateData,
    boards: validBoardsData,
    metadata: {
        title: "オブジェクト形式設計",
        createdAt: "2025-01-21T11:45:00.000Z",
        platform: "Shelf Designer v1.0"
    },
    settings: {
        units: "mm",
        material: "oak",
        thickness: 25
    }
};

// 不正なJSONデータ
export const invalidJsonString = '{"invalid": json}';

// 不完全なデータオブジェクト
export const incompleteDataObject = {
    version: "1.0"
    // template, boards, metadata, settings missing
};

// parseDesignData関数による不完全データの期待される出力
export const expectedParsedIncompleteData = {
    template: null,
    boards: [],
    metadata: {},
    settings: {}
};