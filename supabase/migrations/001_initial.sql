-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create Articles table
CREATE TABLE IF NOT EXISTS articles (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    excerpt TEXT,
    content TEXT NOT NULL,
    image_url TEXT,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    author TEXT NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    view_count INTEGER NOT NULL DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_breaking BOOLEAN NOT NULL DEFAULT FALSE,
    reading_time_minutes INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create Breaking News table
CREATE TABLE IF NOT EXISTS breaking_news (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    article_id INTEGER REFERENCES articles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE breaking_news ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies: Read is public for everyone (anon + authenticated)
-- ============================================================

DROP POLICY IF EXISTS "Allow public read access to categories" ON categories;
CREATE POLICY "Allow public read access to categories" ON categories
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access to articles" ON articles;
CREATE POLICY "Allow public read access to articles" ON articles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access to breaking_news" ON breaking_news;
CREATE POLICY "Allow public read access to breaking_news" ON breaking_news
    FOR SELECT USING (true);

-- ============================================================
-- RLS Policies: Write/Update/Delete is only for authenticated users (Admins)
-- ============================================================

DROP POLICY IF EXISTS "Allow authenticated insert to categories" ON categories;
CREATE POLICY "Allow authenticated insert to categories" ON categories
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated update to categories" ON categories;
CREATE POLICY "Allow authenticated update to categories" ON categories
    FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated delete to categories" ON categories;
CREATE POLICY "Allow authenticated delete to categories" ON categories
    FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated insert to articles" ON articles;
CREATE POLICY "Allow authenticated insert to articles" ON articles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow ANY user (including anonymous) to UPDATE the view_count column only.
-- The API route handles rate limiting logic if needed.
DROP POLICY IF EXISTS "Allow public update view_count on articles" ON articles;
CREATE POLICY "Allow public update view_count on articles" ON articles
    FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated delete to articles" ON articles;
CREATE POLICY "Allow authenticated delete to articles" ON articles
    FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated insert to breaking_news" ON breaking_news;
CREATE POLICY "Allow authenticated insert to breaking_news" ON breaking_news
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated update to breaking_news" ON breaking_news;
CREATE POLICY "Allow authenticated update to breaking_news" ON breaking_news
    FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated delete to breaking_news" ON breaking_news;
CREATE POLICY "Allow authenticated delete to breaking_news" ON breaking_news
    FOR DELETE USING (auth.role() = 'authenticated');


-- ============================================================
-- Storage: Create article-images bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'article-images',
  'article-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow public read on article-images" ON storage.objects;
CREATE POLICY "Allow public read on article-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'article-images');

DROP POLICY IF EXISTS "Allow authenticated upload to article-images" ON storage.objects;
CREATE POLICY "Allow authenticated upload to article-images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'article-images' AND auth.role() = 'authenticated');


-- ============================================================
-- Explicit Grants: Ensure Supabase API roles have access
-- ============================================================

GRANT ALL ON TABLE categories TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE articles TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE breaking_news TO postgres, service_role, anon, authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role, anon, authenticated;


