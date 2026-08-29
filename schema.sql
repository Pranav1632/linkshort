-- ==========================================================
-- LinkShort (Dub.co Clone) - PostgreSQL Schema for Supabase
-- ==========================================================

-- 1. Links Table
CREATE TABLE IF NOT EXISTS links (
    id BIGSERIAL PRIMARY KEY,
    short_code VARCHAR(50) UNIQUE NOT NULL,
    original_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookup on short_code
CREATE INDEX IF NOT EXISTS idx_links_short_code ON links(short_code);

-- 2. Clicks Table (For tracking click analytics)
CREATE TABLE IF NOT EXISTS clicks (
    id BIGSERIAL PRIMARY KEY,
    link_id BIGINT REFERENCES links(id) ON DELETE CASCADE,
    short_code VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45),
    country VARCHAR(100),
    city VARCHAR(100),
    device VARCHAR(50),
    browser VARCHAR(50),
    referrer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for analytical reporting & aggregation
CREATE INDEX IF NOT EXISTS idx_clicks_short_code ON clicks(short_code);
CREATE INDEX IF NOT EXISTS idx_clicks_created_at ON clicks(created_at);
