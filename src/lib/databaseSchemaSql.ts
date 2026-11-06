/**
 * COMPLETE POSTGRESQL SQL SCHEMA & RLS POLICIES FOR SUPABASE
 * Project: REGISTER TO EVENT (RTE)
 * Tagline: Discover. Register. Participate.
 */

export const SUPABASE_COMPLETE_SQL_SCHEMA = `-- ==============================================================================
-- REGISTER TO EVENT (RTE) — PRODUCTION POSTGRESQL SCHEMA FOR SUPABASE
-- Tagline: Discover. Register. Participate.
-- Includes: Profiles, Admin Roles, Forums, Events, Registrations,
--           DOB Rules, PDF Templates, Payments, Announcements, Storage, and RLS.
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Linked with Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  class_grade TEXT,
  contact_number TEXT,
  participant_id_number VARCHAR(12) NOT NULL, -- 12-digit participant identification number
  date_of_birth DATE NOT NULL,
  masked_id_type TEXT DEFAULT 'school_id' CHECK (masked_id_type IN ('school_id', 'masked_aadhaar')),
  masked_id_value TEXT NOT NULL, -- Stores School ID or Masked Aadhaar last 4 digits (e.g. XXXX-XXXX-4589)
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ADMIN ROLES TABLE (Authoritative role enforcement)
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'main_admin')),
  granted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Helper function to check if requesting user is authorized admin
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE user_id = check_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. EVENTS TABLE (Master event details)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL DEFAULT 'REGISTER TO EVENT (RTE) NATIONAL SUMMIT 2026',
  tagline TEXT NOT NULL DEFAULT 'Discover. Register. Participate.',
  event_dates TEXT NOT NULL DEFAULT '03 December 2026 – 06 December 2026',
  venue TEXT NOT NULL DEFAULT 'Jamshedpur, Jharkhand, India',
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata (IST)',
  description TEXT NOT NULL,
  registration_open_date DATE NOT NULL,
  registration_close_date DATE NOT NULL,
  contact_email TEXT NOT NULL DEFAULT 'contact@registertoevent.org',
  contact_phone TEXT NOT NULL DEFAULT '+91 657 243 1900',
  organizer_name TEXT NOT NULL DEFAULT 'RTE National Organizing Committee',
  website_url TEXT DEFAULT 'https://registertoevent.org',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. FORUMS TABLE (Independent event categories)
CREATE TABLE IF NOT EXISTS public.forums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('STEM & Robotics', 'Literature & Debate', 'Computer Science', 'Arts & Culture', 'Business & Quiz')),
  logo_url TEXT,
  banner_url TEXT,
  event_dates TEXT NOT NULL,
  venue TEXT NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  registration_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  upi_id TEXT,
  payment_instructions TEXT,
  registration_open_date DATE NOT NULL,
  registration_close_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'upcoming')),
  max_capacity INTEGER NOT NULL DEFAULT 250,
  registered_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. DOB ELIGIBILITY RULES TABLE (Forum-wise and global)
CREATE TABLE IF NOT EXISTS public.dob_eligibility_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  forum_id UUID REFERENCES public.forums(id) ON DELETE CASCADE, -- NULL indicates global fallback rule
  min_dob DATE,
  max_dob DATE,
  blocked_dobs TEXT[] DEFAULT '{}', -- Array of specific blocked dates (YYYY-MM-DD)
  blocked_ranges JSONB DEFAULT '[]'::jsonb, -- Array of { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD", "reason": "..." }
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(forum_id)
);

-- 6. FORUM INVITATION TEMPLATES TABLE (Forum-specific PDF template)
CREATE TABLE IF NOT EXISTS public.forum_invitation_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  forum_id UUID NOT NULL REFERENCES public.forums(id) ON DELETE CASCADE,
  organizer_logo_text TEXT NOT NULL DEFAULT 'REGISTER TO EVENT (RTE)',
  accent_color TEXT NOT NULL DEFAULT '#1E1B4B', -- Navy
  formal_salutation TEXT NOT NULL DEFAULT 'Distinguished Delegate,',
  invitation_text TEXT NOT NULL,
  special_instructions TEXT,
  terms_and_conditions TEXT[] NOT NULL DEFAULT '{}',
  contact_phone TEXT NOT NULL DEFAULT '+91 657 243 1900',
  contact_email TEXT NOT NULL DEFAULT 'invitations@registertoevent.org',
  signatory_name TEXT NOT NULL DEFAULT 'Director General, RTE Secretariat',
  signatory_designation TEXT NOT NULL DEFAULT 'Secretary General, RTE Committee',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(forum_id)
);

-- 7. REGISTRATIONS TABLE (Forum-wise participant records)
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_number VARCHAR(20) NOT NULL UNIQUE, -- Example: JSR-2026-XXXXX
  forum_id UUID NOT NULL REFERENCES public.forums(id) ON DELETE RESTRICT,
  forum_name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  class_grade TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  email TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  participant_id_number VARCHAR(12) NOT NULL, -- 12-digit participant identification number
  masked_id_type TEXT NOT NULL CHECK (masked_id_type IN ('school_id', 'masked_aadhaar')),
  masked_id_value TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending_payment', 'verified', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'free' CHECK (payment_status IN ('free', 'pending_verification', 'verified', 'rejected')),
  payment_reference TEXT,
  payment_notes TEXT,
  qr_verification_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  -- Prevent duplicate registration for the same forum and participant ID
  CONSTRAINT unique_forum_participant UNIQUE(forum_id, participant_id_number)
);

-- 8. PAYMENTS TABLE (Manual payment verification tracking)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  registration_number VARCHAR(20) NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  forum_id UUID NOT NULL REFERENCES public.forums(id) ON DELETE CASCADE,
  forum_name TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  transaction_ref TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_verification' CHECK (status IN ('pending_verification', 'verified', 'rejected')),
  notes TEXT,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'important', 'urgent')),
  target_forum_id UUID REFERENCES public.forums(id) ON DELETE CASCADE,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON public.registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_forum_id ON public.registrations(forum_id);
CREATE INDEX IF NOT EXISTS idx_registrations_reg_number ON public.registrations(registration_number);
CREATE INDEX IF NOT EXISTS idx_payments_registration_id ON public.payments(registration_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_announcements_published ON public.announcements(is_published, published_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dob_eligibility_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_invitation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
CREATE POLICY "Public read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin(auth.uid()));

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. ADMIN ROLES POLICIES (Admins read; only main_admin modifies)
CREATE POLICY "Admins view admin roles"
  ON public.admin_roles FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Main admins manage admin roles"
  ON public.admin_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles
      WHERE user_id = auth.uid() AND role = 'main_admin'
    )
  );

-- 3. EVENTS POLICIES (Public read, admin write)
CREATE POLICY "Everyone reads event info"
  ON public.events FOR SELECT
  USING (true);

CREATE POLICY "Admins update event info"
  ON public.events FOR ALL
  USING (public.is_admin(auth.uid()));

-- 4. FORUMS POLICIES (Public read, admin write)
CREATE POLICY "Everyone reads forums"
  ON public.forums FOR SELECT
  USING (true);

CREATE POLICY "Admins manage forums"
  ON public.forums FOR ALL
  USING (public.is_admin(auth.uid()));

-- 5. DOB ELIGIBILITY RULES POLICIES (Public read active rules for checks, admin manage)
CREATE POLICY "Everyone reads active DOB rules"
  ON public.dob_eligibility_rules FOR SELECT
  USING (true);

CREATE POLICY "Admins manage DOB rules"
  ON public.dob_eligibility_rules FOR ALL
  USING (public.is_admin(auth.uid()));

-- 6. FORUM INVITATION TEMPLATES (Public read for generation, admin manage)
CREATE POLICY "Everyone reads invitation templates"
  ON public.forum_invitation_templates FOR SELECT
  USING (true);

CREATE POLICY "Admins manage invitation templates"
  ON public.forum_invitation_templates FOR ALL
  USING (public.is_admin(auth.uid()));

-- 7. REGISTRATIONS POLICIES (Students view own, admins view all)
CREATE POLICY "Students view own registrations"
  ON public.registrations FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Students create own registration"
  ON public.registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins update registrations"
  ON public.registrations FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins delete registrations"
  ON public.registrations FOR DELETE
  USING (public.is_admin(auth.uid()));

-- 8. PAYMENTS POLICIES (Students insert and view own, admins verify)
CREATE POLICY "Students view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Students insert payment references"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage payments"
  ON public.payments FOR ALL
  USING (public.is_admin(auth.uid()));

-- 9. ANNOUNCEMENTS POLICIES (Published visible to all, admin manage)
CREATE POLICY "Everyone reads published announcements"
  ON public.announcements FOR SELECT
  USING (is_published = TRUE OR public.is_admin(auth.uid()));

CREATE POLICY "Admins manage announcements"
  ON public.announcements FOR ALL
  USING (public.is_admin(auth.uid()));

-- ==============================================================================
-- INITIAL SEED DATA
-- ==============================================================================

-- Seed master event (Dates: 03-06 Dec 2026, Jamshedpur, Jharkhand, India)
INSERT INTO public.events (title, tagline, event_dates, venue, timezone, description, registration_open_date, registration_close_date)
VALUES (
  'REGISTER TO EVENT (RTE) NATIONAL SUMMIT 2026',
  'Discover. Register. Participate.',
  '03 December 2026 – 06 December 2026',
  'Jamshedpur, Jharkhand, India',
  'Asia/Kolkata (IST)',
  'The flagship national gathering for student innovators, orators, coders, and researchers. Four days of intensive forum tracks, keynotes, competitive exhibitions, and national awards.',
  '2026-08-01',
  '2026-11-25'
) ON CONFLICT DO NOTHING;

-- Seed initial Forums
INSERT INTO public.forums (slug, name, tagline, description, category, event_dates, venue, is_paid, registration_fee, upi_id, registration_open_date, registration_close_date, status, max_capacity)
VALUES
(
  'robotics-ai-conclave',
  'National Robotics & Autonomous AI Conclave',
  'Build. Automate. Lead.',
  'Showcase autonomous rovers, drone navigation, embedded systems, and machine intelligence in real-time arena obstacles.',
  'STEM & Robotics',
  '03 Dec 2026 – 04 Dec 2026',
  'Auditorium Complex A, Jamshedpur',
  TRUE,
  350.00,
  'rte.robotics@okhdfcbank',
  '2026-08-01',
  '2026-11-25',
  'open',
  300
),
(
  'codehack-olympiad',
  'CodeHack National Algorithmic Olympiad',
  'Algorithms. Systems. Scale.',
  'A rigorous 24-hour competitive programming and systems design hackathon tackling high-scale distributed problems.',
  'Computer Science',
  '04 Dec 2026 – 05 Dec 2026',
  'Tech Center Hall 4, Jamshedpur',
  FALSE,
  0.00,
  NULL,
  '2026-08-01',
  '2026-11-25',
  'open',
  400
),
(
  'literary-parliamentary-debate',
  'National Parliamentary & Diplomatic Debate Summit',
  'Voice. Discourse. Resolution.',
  'Asian Parliamentary debate format covering international diplomacy, technological ethics, and national socio-economic policy.',
  'Literature & Debate',
  '04 Dec 2026 – 06 Dec 2026',
  'Heritage Chamber, Jamshedpur',
  TRUE,
  200.00,
  'rte.debate@icici',
  '2026-08-01',
  '2026-11-25',
  'open',
  250
),
(
  'arts-cultural-expression',
  'Kala-Sangam Cultural Arts & Creative Media',
  'Tradition. Vision. Expression.',
  'Fine arts, theatre productions, digital visual storytelling, and traditional folk heritage exhibitions.',
  'Arts & Culture',
  '05 Dec 2026 – 06 Dec 2026',
  'Open Air Amphitheatre, Jamshedpur',
  FALSE,
  0.00,
  NULL,
  '2026-08-01',
  '2026-11-25',
  'open',
  500
)
ON CONFLICT (slug) DO NOTHING;

-- Seed initial DOB Rules for Forums
-- Rule: Minimum DOB 2004-01-01, Maximum DOB 2012-12-31, with specific blocked dates
INSERT INTO public.dob_eligibility_rules (forum_id, min_dob, max_dob, blocked_dobs, blocked_ranges, is_enabled, description)
SELECT id, '2004-01-01', '2012-12-31', ARRAY['2007-04-14', '2008-09-22'], '[{"start": "2006-03-01", "end": "2006-03-31", "reason": "Cohort restriction"}]'::jsonb, TRUE, 'Standard Student Age Window'
FROM public.forums
ON CONFLICT (forum_id) DO NOTHING;

-- Seed Forum Invitation Templates
INSERT INTO public.forum_invitation_templates (forum_id, organizer_logo_text, accent_color, formal_salutation, invitation_text, special_instructions, terms_and_conditions, contact_phone, contact_email, signatory_name, signatory_designation)
SELECT
  id,
  'REGISTER TO EVENT (RTE)',
  '#1E1B4B',
  'Distinguished Delegate,',
  'On behalf of the National Executive Board of REGISTER TO EVENT (RTE), we take great pride in formally confirming your official accreditation and participation in the ' || name || '. Your credentials have been officially vetted and admitted to the national delegate roll for the 2026 Summit in Jamshedpur.',
  'Please carry this original PDF invitation printout along with a valid institutional photo ID for physical security clearance at the registration counter.',
  ARRAY[
    'This invitation is strictly non-transferable and issued solely to the accredited delegate named herein.',
    'Delegates must report to the Jamshedpur Summit Center by 08:30 AM IST on the commencing date.',
    'All participants must strictly adhere to the RTE Code of Academic & Professional Conduct.',
    'Possession of digital or physical duplicate delegate badges is strictly prohibited and subject to immediate de-registration.'
  ],
  '+91 657 243 1900',
  'secretariat@registertoevent.org',
  'Director General, RTE Secretariat',
  'Secretary General, RTE National Committee'
FROM public.forums
ON CONFLICT (forum_id) DO NOTHING;

-- ==============================================================================
-- BOOTSTRAP INSTRUCTIONS FOR FIRST MAIN ADMIN
-- ==============================================================================
-- 1. Create your user account using the RTE Student Registration or Admin Sign-in UI.
-- 2. Find your user ID in auth.users table.
-- 3. Execute this SQL query in Supabase SQL Editor:
--
-- INSERT INTO public.admin_roles (user_id, email, role)
-- VALUES ('YOUR_AUTH_USER_UUID', 'your_admin_email@example.com', 'main_admin')
-- ON CONFLICT (email) DO UPDATE SET role = 'main_admin';
-- ==============================================================================
`;
