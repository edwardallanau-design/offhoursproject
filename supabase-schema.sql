-- ============================================================
-- OFF-HOURS SERVICE MANAGEMENT PLATFORM — SUPABASE SCHEMA
-- Run this entire file in your Supabase SQL editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ──────────────────────────────────────────────────────────────
-- ENUMS
-- ──────────────────────────────────────────────────────────────
CREATE TYPE job_status AS ENUM (
  'new', 'assigned', 'accepted', 'rejected',
  'in_progress', 'completed', 'billed', 'cancelled'
);

CREATE TYPE service_type AS ENUM (
  'plumbing', 'electrical', 'hvac', 'locksmith',
  'appliance_repair', 'structural', 'other'
);

-- ──────────────────────────────────────────────────────────────
-- USER PROFILE TABLES
-- ──────────────────────────────────────────────────────────────
CREATE TABLE public.unit_owners (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  email       TEXT NOT NULL,
  unit_number TEXT NOT NULL,
  building    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.contractors (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  email       TEXT NOT NULL,
  trade       TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.strata_managers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  email       TEXT NOT NULL,
  company     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────
-- JOBS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE public.jobs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_owner_id     UUID REFERENCES public.unit_owners(id),
  strata_manager_id UUID REFERENCES public.strata_managers(id),
  homeowner_name    TEXT NOT NULL,
  homeowner_phone   TEXT NOT NULL,
  homeowner_address TEXT NOT NULL,
  unit_number       TEXT,
  service_type      service_type NOT NULL,
  description       TEXT,
  status            job_status NOT NULL DEFAULT 'new',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.job_assignments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id        UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES public.contractors(id),
  assigned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_job_assignments_job ON public.job_assignments(job_id);
CREATE INDEX idx_job_assignments_contractor ON public.job_assignments(contractor_id);

CREATE TABLE public.job_completions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id           UUID NOT NULL UNIQUE REFERENCES public.jobs(id) ON DELETE CASCADE,
  work_description TEXT NOT NULL,
  labor_cost       NUMERIC(10,2) NOT NULL DEFAULT 0,
  materials_cost   NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount     NUMERIC(10,2) NOT NULL,
  submitted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.job_photos (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id       UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  uploaded_by  UUID NOT NULL REFERENCES auth.users(id),
  uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.billing_records (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id            UUID NOT NULL UNIQUE REFERENCES public.jobs(id),
  strata_manager_id UUID NOT NULL REFERENCES public.strata_managers(id),
  amount            NUMERIC(10,2) NOT NULL,
  notes             TEXT,
  payment_status    TEXT NOT NULL DEFAULT 'billed'
                      CONSTRAINT billing_payment_status_check
                        CHECK (payment_status IN ('billed', 'paid', 'reconciliation')),
  billed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── MIGRATION (run on existing databases) ─────────────────────
-- ALTER TABLE public.billing_records
--   ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'billed'
--   CONSTRAINT billing_payment_status_check
--     CHECK (payment_status IN ('billed', 'paid', 'reconciliation'));

-- ──────────────────────────────────────────────────────────────
-- NOTIFICATIONS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE public.push_subscriptions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.expo_push_tokens (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────
-- AUTO-UPDATE updated_at
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_contractors_updated_at
  BEFORE UPDATE ON public.contractors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ──────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- (Express backend uses service role key and bypasses RLS.
--  RLS protects against direct DB access from client.)
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.unit_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strata_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expo_push_tokens ENABLE ROW LEVEL SECURITY;

-- Each user can read their own profile row
CREATE POLICY "self_read_contractors" ON public.contractors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "self_read_unit_owners" ON public.unit_owners FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "self_read_strata" ON public.strata_managers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "self_push_subs" ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "self_expo_tokens" ON public.expo_push_tokens FOR ALL USING (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────
-- SUPABASE STORAGE
-- Run in Supabase dashboard → Storage → Create bucket: "job-photos"
-- Set to private (use signed URLs for access)
-- ──────────────────────────────────────────────────────────────

-- ──────────────────────────────────────────────────────────────
-- DESIGNATE ADMIN USER (run after creating user in Auth dashboard)
-- Replace 'admin@yourdomain.com' with your admin email
-- ──────────────────────────────────────────────────────────────
-- UPDATE auth.users
-- SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
-- WHERE email = 'admin@yourdomain.com';
