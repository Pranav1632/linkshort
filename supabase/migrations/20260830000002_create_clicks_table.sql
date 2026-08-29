-- ==========================================================
-- Migration: Create Clicks Table & Analytical Indexes
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.clicks (
    id BIGSERIAL PRIMARY KEY,
    link_id BIGINT REFERENCES public.links(id) ON DELETE CASCADE,
    short_code VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45),
    country VARCHAR(100),
    city VARCHAR(100),
    device VARCHAR(50),
    browser VARCHAR(50),
    referrer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast analytics queries
CREATE INDEX IF NOT EXISTS idx_clicks_short_code ON public.clicks(short_code);
CREATE INDEX IF NOT EXISTS idx_clicks_created_at ON public.clicks(created_at);
