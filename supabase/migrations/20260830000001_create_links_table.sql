-- ==========================================================
-- Migration: Create Links Table & Indexes
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.links (
    id BIGSERIAL PRIMARY KEY,
    short_code VARCHAR(50) UNIQUE NOT NULL,
    original_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for O(1) B-tree lookup
CREATE INDEX IF NOT EXISTS idx_links_short_code ON public.links(short_code);
