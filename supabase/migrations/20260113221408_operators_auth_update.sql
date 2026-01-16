-- Migration: operators_auth_update
-- Description: Update operators table for Supabase Auth (email/password)
-- Date: 2026-01-13
--
-- Changes:
-- 1. Add user_id column (FK to auth.users)
-- 2. Drop pin_hash and qr_code_id columns (no longer needed)
-- 3. Update RLS policies for operators to allow self-read

-- ============================================================
-- 1. ADD user_id COLUMN TO operators TABLE
-- ============================================================

-- Add user_id column (nullable initially for migration safety)
ALTER TABLE "public"."operators"
ADD COLUMN IF NOT EXISTS "user_id" uuid;

-- Add foreign key constraint to auth.users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'operators_user_id_fkey'
        AND table_name = 'operators'
    ) THEN
        ALTER TABLE "public"."operators"
        ADD CONSTRAINT "operators_user_id_fkey"
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add unique constraint on user_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'operators_user_id_key'
        AND table_name = 'operators'
    ) THEN
        ALTER TABLE "public"."operators"
        ADD CONSTRAINT "operators_user_id_key" UNIQUE (user_id);
    END IF;
END $$;

-- Add index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_operators_user_id ON operators(user_id);

-- ============================================================
-- 2. DROP OLD PIN/QR COLUMNS
-- ============================================================

-- Drop the unique constraint on qr_code_id first (if exists)
ALTER TABLE "public"."operators"
DROP CONSTRAINT IF EXISTS "operators_qr_code_id_key";

-- Drop old columns
ALTER TABLE "public"."operators"
DROP COLUMN IF EXISTS "pin_hash";

ALTER TABLE "public"."operators"
DROP COLUMN IF EXISTS "qr_code_id";

-- ============================================================
-- 3. UPDATE RLS POLICIES FOR OPERATORS
-- ============================================================

-- Drop existing policies that we'll replace
DROP POLICY IF EXISTS "operators_select" ON "public"."operators";
DROP POLICY IF EXISTS "operators_insert" ON "public"."operators";
DROP POLICY IF EXISTS "operators_update" ON "public"."operators";
DROP POLICY IF EXISTS "operators_delete" ON "public"."operators";

-- Users can read their own operator record (for operator login flow)
CREATE POLICY "Users can read own operator record"
ON "public"."operators" FOR SELECT
USING (user_id = auth.uid());

-- Admins can read all operators in their companies
CREATE POLICY "Admins can read company operators"
ON "public"."operators" FOR SELECT
USING (
    company_id IN (
        SELECT company_id FROM user_company_access
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

-- Operators can update their own last_login_at
CREATE POLICY "Operators can update own last_login_at"
ON "public"."operators" FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admins can insert operators
CREATE POLICY "Admins can insert operators"
ON "public"."operators" FOR INSERT
WITH CHECK (
    company_id IN (
        SELECT company_id FROM user_company_access
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

-- Admins can update operators in their companies
CREATE POLICY "Admins can update company operators"
ON "public"."operators" FOR UPDATE
USING (
    company_id IN (
        SELECT company_id FROM user_company_access
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

-- Admins can delete operators in their companies
CREATE POLICY "Admins can delete company operators"
ON "public"."operators" FOR DELETE
USING (
    company_id IN (
        SELECT company_id FROM user_company_access
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

-- ============================================================
-- 4. UPDATE RLS POLICIES FOR OPERATOR_SESSIONS
-- ============================================================

-- Drop existing policies
DROP POLICY IF EXISTS "operator_sessions_select" ON "public"."operator_sessions";
DROP POLICY IF EXISTS "operator_sessions_insert" ON "public"."operator_sessions";
DROP POLICY IF EXISTS "operator_sessions_update" ON "public"."operator_sessions";
DROP POLICY IF EXISTS "operator_sessions_delete" ON "public"."operator_sessions";

-- Operators can read their own sessions
CREATE POLICY "Operators can read own sessions"
ON "public"."operator_sessions" FOR SELECT
USING (
    operator_id IN (
        SELECT id FROM operators WHERE user_id = auth.uid()
    )
);

-- Admins can read all sessions in their companies
CREATE POLICY "Admins can read company sessions"
ON "public"."operator_sessions" FOR SELECT
USING (
    company_id IN (
        SELECT company_id FROM user_company_access
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

-- Operators can insert their own sessions
CREATE POLICY "Operators can insert own sessions"
ON "public"."operator_sessions" FOR INSERT
WITH CHECK (
    operator_id IN (
        SELECT id FROM operators WHERE user_id = auth.uid()
    )
);

-- Operators can update their own sessions
CREATE POLICY "Operators can update own sessions"
ON "public"."operator_sessions" FOR UPDATE
USING (
    operator_id IN (
        SELECT id FROM operators WHERE user_id = auth.uid()
    )
);

-- Admins can delete sessions in their companies
CREATE POLICY "Admins can delete company sessions"
ON "public"."operator_sessions" FOR DELETE
USING (
    company_id IN (
        SELECT company_id FROM user_company_access
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

-- ============================================================
-- 5. COMMENTS
-- ============================================================
COMMENT ON COLUMN "public"."operators"."user_id" IS 'FK to auth.users - email stored in auth.users, not duplicated here';
