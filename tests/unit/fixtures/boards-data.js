/**
 * 個別板データのテスト用フィクスチャ
 */

export const validBoardsData = [
    {
        id: 1,
        orientation: 'horizontal',
        position: { x: 0, y: 60, z: 0 },
        dimensions: {
            length: 80,
            width: 35,
            thickness: 18
        },
        material: {
            type: 'pine',
            color: '#D2B48C'
        },
        rotation: { x: 0, y: 0, z: 0 }
    },
    {
        id: 2,
        orientation: 'vertical',
        position: { x: 20, y: 90, z: 0 },
        dimensions: {
            length: 180,
            width: 35,
            thickness: 18
        },
        material: {
            type: 'plywood',
            color: '#DEB887'
        },
        rotation: { x: 0, y: 90, z: 0 }
    }
];

export const emptyBoardsData = [];

export const singleBoardData = [
    {
        id: 1,
        orientation: 'horizontal',
        position: { x: 0, y: 30, z: 0 },
        dimensions: {
            length: 60,
            width: 25,
            thickness: 15
        },
        material: {
            type: 'mdf',
            color: '#CD853F'
        },
        rotation: { x: 0, y: 0, z: 0 }
    }
];

export const invalidBoardsData = [
    {
        id: 1,
        // orientation missing
        position: { x: 0, y: 0 }, // z missing
        dimensions: {
            length: 80
            // width, thickness missing
        },
        // material missing
        rotation: { x: 0, y: 0, z: 0 }
    },
    {
        // id missing
        orientation: 'vertical',
        position: { x: 10, y: 20, z: 30 },
        dimensions: {
            length: -50, // negative value
            width: 'invalid', // string instead of number
            thickness: 18
        },
        material: {
            type: 'unknown_material',
            color: 'invalid_color'
        },
        rotation: { x: 0, y: 0, z: 0 }
    }
];