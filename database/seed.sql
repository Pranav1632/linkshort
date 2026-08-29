-- ==========================================================
-- Sample Seed Data for Testing LinkShort
-- ==========================================================

INSERT INTO links (short_code, original_url)
VALUES 
    ('google', 'https://www.google.com'),
    ('github', 'https://github.com'),
    ('dub', 'https://dub.co')
ON CONFLICT (short_code) DO NOTHING;
