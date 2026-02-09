-- =====================================================
-- UYNM Database Schema for Supabase
-- Run this SQL in the Supabase SQL Editor
-- =====================================================

-- 1. Profiles table (extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    location TEXT,
    involvement_track TEXT CHECK (involvement_track IN ('volunteer', 'partner', 'member', 'mentor')),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Contact form submissions
CREATE TABLE IF NOT EXISTS contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Newsletter subscribers
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- 4. Events
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMPTZ NOT NULL,
    location TEXT,
    image_url TEXT,
    registration_link TEXT,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Event registrations
CREATE TABLE IF NOT EXISTS event_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, email)
);

-- 6. CMS Content (news, articles, pages)
CREATE TABLE IF NOT EXISTS content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('news', 'program', 'page', 'announcement')),
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    body TEXT,
    excerpt TEXT,
    image_url TEXT,
    author TEXT,
    published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

-- Public read access for events
CREATE POLICY "Events are viewable by everyone" ON events
    FOR SELECT USING (is_published = TRUE);

-- Public read access for published content
CREATE POLICY "Published content is viewable by everyone" ON content
    FOR SELECT USING (published = TRUE);

-- Allow service role full access (for backend API)
CREATE POLICY "Service role has full access to profiles" ON profiles
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to contacts" ON contacts
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to newsletter_subscribers" ON newsletter_subscribers
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to events" ON events
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to event_registrations" ON event_registrations
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to content" ON content
    FOR ALL USING (auth.role() = 'service_role');

-- Allow anonymous users to insert into specific tables
CREATE POLICY "Anyone can submit contact form" ON contacts
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Anyone can subscribe to newsletter" ON newsletter_subscribers
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Anyone can register as member" ON profiles
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Anyone can register for events" ON event_registrations
    FOR INSERT WITH CHECK (TRUE);

-- =====================================================
-- Indexes for better performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_track ON profiles(involvement_track);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_created ON contacts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_content_type ON content(type);
CREATE INDEX IF NOT EXISTS idx_content_slug ON content(slug);

-- =====================================================
-- Sample data for testing (optional)
-- =====================================================

-- Insert a sample event
INSERT INTO events (title, description, event_date, location, image_url)
VALUES (
    'National Youth Empowerment Summit',
    'A gathering of young leaders from across Nigeria to discuss innovation, leadership, and sustainable development goals.',
    '2026-03-15 09:00:00+01',
    'Abuja, Nigeria',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'
)
ON CONFLICT DO NOTHING;
