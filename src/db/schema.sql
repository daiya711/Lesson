-- 収納棚設計データベーススキーマ
-- Cloudflare D1 Database for Shelf Designer Platform

-- 設計データテーブル
CREATE TABLE IF NOT EXISTS designs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    data TEXT NOT NULL,  -- JSON形式の設計データ（テンプレート・個別板・材料情報等）
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 設計テンプレートテーブル（将来の共有機能用）
CREATE TABLE IF NOT EXISTS design_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    template_data TEXT NOT NULL,  -- JSON形式のテンプレートデータ
    is_public BOOLEAN DEFAULT FALSE,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 構造チェック結果テーブル（履歴保持用）
CREATE TABLE IF NOT EXISTS structure_checks (
    id TEXT PRIMARY KEY,
    design_id TEXT NOT NULL,
    check_results TEXT NOT NULL,  -- JSON形式のチェック結果
    overall_status TEXT NOT NULL,  -- 'safe', 'warning', 'danger'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (design_id) REFERENCES designs(id) ON DELETE CASCADE
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_designs_updated_at ON designs(updated_at);
CREATE INDEX IF NOT EXISTS idx_designs_title ON designs(title);
CREATE INDEX IF NOT EXISTS idx_templates_public ON design_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_structure_checks_design_id ON structure_checks(design_id);