-- ==========================================================
-- Migration 001: Create Links Table
-- ==========================================================

CREATE TABLE IF NOT EXISTS links (
    id BIGSERIAL PRIMARY KEY,
    short_code VARCHAR(50) UNIQUE NOT NULL,
    original_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_links_short_code ON links(short_code);
