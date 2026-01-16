-- Migration: standardize_team_members
-- Description: Unify team member handling - all roles use user_company_access
-- Date: 2026-01-15
--
-- Changes:
-- 1. Add 'name' column to user_company_access
-- 2. Migrate operator names from operators table
-- 3. Update RLS policies for self-update capability
-- 4. Mark operators table as deprecated (don't drop yet for rollback safety)

-- ============================================================
-- 1. ADD NAME COLUMN TO user_company_access
-- ============================================================

ALTER TABLE "public"."user_company_access"
ADD COLUMN IF NOT EXISTS "name" text;

-- Add index for name searches
CREATE INDEX IF NOT EXISTS idx_user_company_access_name
ON user_company_access(name);

-- ============================================================
-- 2. MIGRATE EXISTING OPERATOR NAMES
-- ============================================================

-- Copy names from operators table to user_company_access
UPDATE user_company_access uca
SET name = o.name
FROM operators o
WHERE uca.user_id = o.user_id
  AND uca.company_id = o.company_id
  AND uca.name IS NULL;

-- ============================================================
-- 3. UPDATE RLS POLICIES FOR user_company_access
-- ============================================================

-- Drop existing policies if they exist (to recreate them)
DROP POLICY IF EXISTS "Users can read own access record" ON "public"."user_company_access";
DROP POLICY IF EXISTS "Users can update own name" ON "public"."user_company_access";

-- Users can read their own access records
CREATE POLICY "Users can read own access record"
ON "public"."user_company_access" FOR SELECT
USING (user_id = auth.uid());

-- Admins can read all access records in their companies
-- (This policy may already exist, using IF NOT EXISTS pattern via DO block)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'user_company_access'
        AND policyname = 'Admins can read company access records'
    ) THEN
        CREATE POLICY "Admins can read company access records"
        ON "public"."user_company_access" FOR SELECT
        USING (
            company_id IN (
                SELECT company_id FROM user_company_access
                WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
            )
        );
    END IF;
END $$;

-- Users can update their own name
CREATE POLICY "Users can update own name"
ON "public"."user_company_access" FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admins can insert new team members
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'user_company_access'
        AND policyname = 'Admins can insert team members'
    ) THEN
        CREATE POLICY "Admins can insert team members"
        ON "public"."user_company_access" FOR INSERT
        WITH CHECK (
            company_id IN (
                SELECT company_id FROM user_company_access
                WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
            )
        );
    END IF;
END $$;

-- Admins can update team members in their companies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'user_company_access'
        AND policyname = 'Admins can update team members'
    ) THEN
        CREATE POLICY "Admins can update team members"
        ON "public"."user_company_access" FOR UPDATE
        USING (
            company_id IN (
                SELECT company_id FROM user_company_access
                WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
            )
        );
    END IF;
END $$;

-- Admins can delete team members in their companies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'user_company_access'
        AND policyname = 'Admins can delete team members'
    ) THEN
        CREATE POLICY "Admins can delete team members"
        ON "public"."user_company_access" FOR DELETE
        USING (
            company_id IN (
                SELECT company_id FROM user_company_access
                WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
            )
        );
    END IF;
END $$;

-- ============================================================
-- 4. ADD COMMENT TO MARK OPERATORS TABLE AS DEPRECATED
-- ============================================================

COMMENT ON TABLE "public"."operators" IS
'DEPRECATED: This table is being phased out. Use user_company_access with role=operator instead. Will be dropped in a future migration after confirming standardization works.';

-- ============================================================
-- 5. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================

COMMENT ON COLUMN "public"."user_company_access"."name" IS
'Display name for the team member. Stored here for easy querying without service role access to auth.users.';

COMMENT ON COLUMN "public"."user_company_access"."role" IS
'Role in the company: admin (full access), user (can use all modules), operator (shop floor access only)';
