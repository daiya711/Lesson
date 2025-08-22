/**
 * テンプレートデータのテスト用フィクスチャ
 */

export const validTemplateData = {
    size: {
        width: 80,
        height: 180,
        depth: 35
    },
    boards: {
        top: { type: 'top', enabled: true },
        bottom: { type: 'bottom', enabled: true },
        left: { type: 'left', enabled: true },
        right: { type: 'right', enabled: true },
        back: { type: 'back', enabled: true }
    },
    material: {
        type: 'pine',
        thickness: 18,
        color: '#D2B48C'
    },
    metadata: {
        name: 'Basic Box Template',
        description: '基本的な箱型テンプレート'
    }
};

export const emptyTemplateData = {
    size: {
        width: 0,
        height: 0,
        depth: 0
    },
    boards: {},
    material: {
        type: '',
        thickness: 0,
        color: ''
    },
    metadata: {
        name: '',
        description: ''
    }
};

export const nullTemplateData = null;

export const invalidTemplateData = {
    // 必須フィールドが欠如
    size: {
        width: 80
        // height, depth missing
    },
    // boards missing
    material: {
        type: 'pine'
        // thickness, color missing
    }
    // metadata missing
};