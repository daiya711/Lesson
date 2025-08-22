/**
 * データ変換関数のユニットテスト
 * 壊れて欲しくない最小単位での純粋関数テスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prepareDesignData, parseDesignData } from '../../src/utils/data-converters.js';

// テストフィクスチャ
import { 
    validTemplateData, 
    emptyTemplateData, 
    nullTemplateData 
} from './fixtures/template-data.js';

import { 
    validBoardsData, 
    emptyBoardsData, 
    singleBoardData 
} from './fixtures/boards-data.js';

import {
    expectedPreparedDesignData,
    expectedPreparedEmptyData,
    savedDesignDataString,
    savedDesignDataObject,
    expectedParsedData,
    expectedParsedObjectData,
    invalidJsonString,
    incompleteDataObject,
    expectedParsedIncompleteData
} from './fixtures/expected-outputs.js';

describe('prepareDesignData関数', () => {
    beforeEach(() => {
        // 各テストでDateをモックして一貫した結果を得る
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-01-21T12:00:00.000Z'));
    });

    it('正常なテンプレートデータと個別板データを正しい保存形式に変換する', () => {
        const result = prepareDesignData(validTemplateData, validBoardsData);
        
        expect(result).toEqual({
            version: "1.0",
            metadata: {
                title: "収納棚設計",
                createdAt: "2025-01-21T12:00:00.000Z",
                platform: "Shelf Designer v1.0"
            },
            template: validTemplateData,
            boards: validBoardsData,
            settings: {
                units: "cm",
                material: "pine",
                thickness: 18
            }
        });
        
        // バージョン情報が正しく設定されることを確認
        expect(result.version).toBe("1.0");
        
        // メタデータが自動生成されることを確認
        expect(result.metadata.title).toBe("収納棚設計");
        expect(result.metadata.platform).toBe("Shelf Designer v1.0");
        expect(result.metadata.createdAt).toBe("2025-01-21T12:00:00.000Z");
    });

    it('空のデータでも正しい構造を維持する', () => {
        const result = prepareDesignData(emptyTemplateData, emptyBoardsData);
        
        expect(result.template).toEqual(emptyTemplateData);
        expect(result.boards).toEqual(emptyBoardsData);
        expect(result.boards).toHaveLength(0);
        
        // 基本構造は維持される
        expect(result.version).toBe("1.0");
        expect(result.settings).toEqual({
            units: "cm",
            material: "pine", 
            thickness: 18
        });
    });

    it('nullやundefinedを渡しても例外が発生しない', () => {
        expect(() => {
            prepareDesignData(null, null);
        }).not.toThrow();
        
        expect(() => {
            prepareDesignData(undefined, undefined);
        }).not.toThrow();
        
        const result = prepareDesignData(nullTemplateData, null);
        expect(result.template).toBe(null);
        expect(result.boards).toBe(null);
    });

    it('個別板データが配列でない場合も処理できる', () => {
        const result = prepareDesignData(validTemplateData, singleBoardData[0]); // 配列ではなく単一オブジェクト
        
        expect(result.boards).toBe(singleBoardData[0]);
        expect(result.template).toEqual(validTemplateData);
    });

    it('常に同じ構造のオブジェクトを返す（一貫性確認）', () => {
        const result1 = prepareDesignData(validTemplateData, validBoardsData);
        const result2 = prepareDesignData(emptyTemplateData, emptyBoardsData);
        
        // 基本構造が同じであることを確認
        expect(Object.keys(result1)).toEqual(Object.keys(result2));
        expect(Object.keys(result1.metadata)).toEqual(Object.keys(result2.metadata));
        expect(Object.keys(result1.settings)).toEqual(Object.keys(result2.settings));
    });
});

describe('parseDesignData関数', () => {
    beforeEach(() => {
        // コンソールエラーをモック
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('JSON文字列を正しいオブジェクト形式に変換する', () => {
        const result = parseDesignData(savedDesignDataString);
        
        expect(result).toEqual(expectedParsedData);
        expect(result.template).toEqual(validTemplateData);
        expect(result.boards).toEqual(singleBoardData);
        expect(result.metadata.title).toBe("保存済み収納棚設計");
    });

    it('オブジェクト形式のデータをそのまま正規化する', () => {
        const result = parseDesignData(savedDesignDataObject);
        
        expect(result).toEqual(expectedParsedObjectData);
        expect(result.template).toEqual(validTemplateData);
        expect(result.boards).toEqual(validBoardsData);
    });

    it('不正なJSON文字列に対してnullを返す', () => {
        const result = parseDesignData(invalidJsonString);
        
        expect(result).toBe(null);
        expect(console.error).toHaveBeenCalled();
    });

    it('不完全なデータオブジェクトにデフォルト値を設定する', () => {
        const result = parseDesignData(incompleteDataObject);
        
        expect(result).toEqual(expectedParsedIncompleteData);
        expect(result.template).toBe(null);
        expect(result.boards).toEqual([]);
        expect(result.metadata).toEqual({});
        expect(result.settings).toEqual({});
    });

    it('nullやundefinedに対して適切なデフォルト値を返す', () => {
        const resultNull = parseDesignData(null);
        const resultUndefined = parseDesignData(undefined);
        
        expect(resultNull).toEqual(expectedParsedIncompleteData);
        expect(resultUndefined).toEqual(expectedParsedIncompleteData);
    });

    it('空のオブジェクトに対してデフォルト値を設定する', () => {
        const result = parseDesignData({});
        
        expect(result).toEqual({
            template: null,
            boards: [],
            metadata: {},
            settings: {}
        });
    });

    it('一部のプロパティが欠損したデータでも適切に処理する', () => {
        const partialData = {
            template: validTemplateData,
            // boards, metadata, settings missing
        };
        
        const result = parseDesignData(partialData);
        
        expect(result.template).toEqual(validTemplateData);
        expect(result.boards).toEqual([]);
        expect(result.metadata).toEqual({});
        expect(result.settings).toEqual({});
    });
});

describe('データ変換関数の相互運用性', () => {
    it('prepareDesignData → parseDesignData のラウンドトリップが正常に動作する', () => {
        // 元データ
        const originalTemplate = validTemplateData;
        const originalBoards = validBoardsData;
        
        // 保存形式に変換
        const prepared = prepareDesignData(originalTemplate, originalBoards);
        
        // JSON文字列化をシミュレート
        const jsonString = JSON.stringify(prepared);
        
        // 読み込み形式に変換
        const parsed = parseDesignData(jsonString);
        
        // 元データが正しく復元されることを確認
        expect(parsed.template).toEqual(originalTemplate);
        expect(parsed.boards).toEqual(originalBoards);
    });

    it('空データのラウンドトリップも正常に動作する', () => {
        const prepared = prepareDesignData(emptyTemplateData, emptyBoardsData);
        const jsonString = JSON.stringify(prepared);
        const parsed = parseDesignData(jsonString);
        
        expect(parsed.template).toEqual(emptyTemplateData);
        expect(parsed.boards).toEqual(emptyBoardsData);
    });
});