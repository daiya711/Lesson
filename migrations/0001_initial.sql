-- Migration: 0001_initial.sql
-- Create initial tables for Shelf Designer Platform

-- 設計データテーブル
CREATE TABLE designs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 設計テンプレートテーブル
CREATE TABLE design_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    template_data TEXT NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 構造チェック結果テーブル
CREATE TABLE structure_checks (
    id TEXT PRIMARY KEY,
    design_id TEXT NOT NULL,
    check_results TEXT NOT NULL,
    overall_status TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (design_id) REFERENCES designs(id) ON DELETE CASCADE
);

-- インデックス作成
CREATE INDEX idx_designs_updated_at ON designs(updated_at);
CREATE INDEX idx_designs_title ON designs(title);
CREATE INDEX idx_templates_public ON design_templates(is_public);
CREATE INDEX idx_structure_checks_design_id ON structure_checks(design_id);