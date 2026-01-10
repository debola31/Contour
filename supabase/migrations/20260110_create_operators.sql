-- Migration: Create operators and operator_sessions tables
-- Date: 2026-01-10
-- Description: Operator View module - PIN-based authentication for shop floor operators

-- ============================================================================
-- OPERATORS TABLE
-- ============================================================================
-- Stores operator accounts for shop floor workers
-- PIN is stored as bcrypt hash for security

CREATE TABLE IF NOT EXISTS "public"."operators" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "company_id" uuid NOT NULL,
    "name" text NOT NULL,
    "pin_hash" text NOT NULL,  -- bcrypt hash, NOT plaintext
    "qr_code_id" text,         -- Unique ID for QR badge authentication
    "is_active" boolean DEFAULT true,
    "last_login_at" timestamptz,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    CONSTRAINT "operators_pkey" PRIMARY KEY (id),
    CONSTRAINT "operators_qr_code_id_key" UNIQUE (qr_code_id)
);

-- Note: No unique constraint on pin_hash (same PIN can hash differently with bcrypt salt)
-- Lookup by company_id, then verify with bcrypt.checkpw()

-- Foreign key to companies
ALTER TABLE "public"."operators"
    ADD CONSTRAINT "operators_company_id_fkey"
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Row Level Security
ALTER TABLE "public"."operators" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "operators_select" ON "public"."operators";
CREATE POLICY "operators_select" ON "public"."operators" FOR SELECT
    USING (company_id IN (SELECT company_id FROM user_company_access WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "operators_insert" ON "public"."operators";
CREATE POLICY "operators_insert" ON "public"."operators" FOR INSERT
    WITH CHECK (company_id IN (SELECT company_id FROM user_company_access WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "operators_update" ON "public"."operators";
CREATE POLICY "operators_update" ON "public"."operators" FOR UPDATE
    USING (company_id IN (SELECT company_id FROM user_company_access WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "operators_delete" ON "public"."operators";
CREATE POLICY "operators_delete" ON "public"."operators" FOR DELETE
    USING (company_id IN (SELECT company_id FROM user_company_access WHERE user_id = auth.uid()));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_operators_company ON public.operators (company_id);
CREATE INDEX IF NOT EXISTS idx_operators_active ON public.operators (company_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_operators_qr_code ON public.operators (qr_code_id) WHERE qr_code_id IS NOT NULL;

-- Updated_at trigger
DROP TRIGGER IF EXISTS "operators_updated_at" ON "public"."operators";
CREATE TRIGGER operators_updated_at BEFORE UPDATE ON public.operators
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- OPERATOR_SESSIONS TABLE
-- ============================================================================
-- Tracks work sessions when operators are working on jobs
-- Links to job_operations for the specific step being worked

CREATE TABLE IF NOT EXISTS "public"."operator_sessions" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "company_id" uuid NOT NULL,
    "operator_id" uuid NOT NULL,
    "job_id" uuid NOT NULL,
    "job_operation_id" uuid,           -- FK to job_operations (the specific step being worked)
    "operation_type_id" uuid NOT NULL, -- From station QR code
    "started_at" timestamptz DEFAULT now(),
    "ended_at" timestamptz,            -- NULL if session is active
    "notes" text,                      -- Operator comments during session
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    CONSTRAINT "operator_sessions_pkey" PRIMARY KEY (id)
);

-- Foreign keys
ALTER TABLE "public"."operator_sessions"
    ADD CONSTRAINT "operator_sessions_company_id_fkey"
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE "public"."operator_sessions"
    ADD CONSTRAINT "operator_sessions_operator_id_fkey"
    FOREIGN KEY (operator_id) REFERENCES operators(id) ON DELETE CASCADE;

ALTER TABLE "public"."operator_sessions"
    ADD CONSTRAINT "operator_sessions_job_id_fkey"
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;

ALTER TABLE "public"."operator_sessions"
    ADD CONSTRAINT "operator_sessions_job_operation_id_fkey"
    FOREIGN KEY (job_operation_id) REFERENCES job_operations(id) ON DELETE SET NULL;

ALTER TABLE "public"."operator_sessions"
    ADD CONSTRAINT "operator_sessions_operation_type_id_fkey"
    FOREIGN KEY (operation_type_id) REFERENCES operation_types(id) ON DELETE RESTRICT;

-- Row Level Security
ALTER TABLE "public"."operator_sessions" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "operator_sessions_select" ON "public"."operator_sessions";
CREATE POLICY "operator_sessions_select" ON "public"."operator_sessions" FOR SELECT
    USING (company_id IN (SELECT company_id FROM user_company_access WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "operator_sessions_insert" ON "public"."operator_sessions";
CREATE POLICY "operator_sessions_insert" ON "public"."operator_sessions" FOR INSERT
    WITH CHECK (company_id IN (SELECT company_id FROM user_company_access WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "operator_sessions_update" ON "public"."operator_sessions";
CREATE POLICY "operator_sessions_update" ON "public"."operator_sessions" FOR UPDATE
    USING (company_id IN (SELECT company_id FROM user_company_access WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "operator_sessions_delete" ON "public"."operator_sessions";
CREATE POLICY "operator_sessions_delete" ON "public"."operator_sessions" FOR DELETE
    USING (company_id IN (SELECT company_id FROM user_company_access WHERE user_id = auth.uid()));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_operator_sessions_company ON public.operator_sessions (company_id);
CREATE INDEX IF NOT EXISTS idx_operator_sessions_operator ON public.operator_sessions (operator_id);
CREATE INDEX IF NOT EXISTS idx_operator_sessions_job ON public.operator_sessions (job_id);
CREATE INDEX IF NOT EXISTS idx_operator_sessions_job_op ON public.operator_sessions (job_operation_id);
-- Partial index for finding active sessions quickly
CREATE INDEX IF NOT EXISTS idx_operator_sessions_active ON public.operator_sessions (operator_id) WHERE ended_at IS NULL;

-- Updated_at trigger
DROP TRIGGER IF EXISTS "operator_sessions_updated_at" ON "public"."operator_sessions";
CREATE TRIGGER operator_sessions_updated_at BEFORE UPDATE ON public.operator_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE "public"."operators"
    IS 'Shop floor operator accounts. Authenticate via PIN (hashed) or QR badge. Separate from admin users.';

COMMENT ON COLUMN "public"."operators"."pin_hash"
    IS 'bcrypt-hashed 4-6 digit PIN. Never store or return plaintext PIN.';

COMMENT ON COLUMN "public"."operators"."qr_code_id"
    IS 'Unique identifier for QR badge authentication. Generated when badge is created.';

COMMENT ON TABLE "public"."operator_sessions"
    IS 'Work sessions tracking when operators are working on jobs. Used for time tracking and job progress.';

COMMENT ON COLUMN "public"."operator_sessions"."job_operation_id"
    IS 'The specific job operation step being worked. Inferred from job + operation_type when session starts.';

COMMENT ON COLUMN "public"."operator_sessions"."operation_type_id"
    IS 'The operation type from the station QR code. Identifies which workstation the operator is at.';

COMMENT ON COLUMN "public"."operator_sessions"."ended_at"
    IS 'NULL while session is active. Set when operator stops or completes work.';
