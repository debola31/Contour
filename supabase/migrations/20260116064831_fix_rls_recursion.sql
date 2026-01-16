-- Migration: fix_rls_recursion
-- Description: Remove duplicate RLS policies on user_company_access that cause infinite recursion
-- Date: 2026-01-16
--
-- Problem: The migration 20260115004359_standardize_team_members.sql added policies
-- that use inline subqueries to user_company_access, causing infinite recursion
-- when Postgres evaluates the RLS policies.
--
-- Solution: Drop these duplicate policies. The existing policies using is_company_admin()
-- (a SECURITY DEFINER function that bypasses RLS) already provide the same functionality.

-- ============================================================
-- 1. DROP PROBLEMATIC SELF-REFERENCING POLICIES
-- ============================================================

-- These policies use inline subqueries like:
--   company_id IN (SELECT company_id FROM user_company_access WHERE ...)
-- which causes infinite recursion

DROP POLICY IF EXISTS "Admins can delete team members" ON "public"."user_company_access";
DROP POLICY IF EXISTS "Admins can insert team members" ON "public"."user_company_access";
DROP POLICY IF EXISTS "Admins can read company access records" ON "public"."user_company_access";
DROP POLICY IF EXISTS "Admins can update team members" ON "public"."user_company_access";

-- ============================================================
-- 2. VERIFY EXISTING SAFE POLICIES (NO ACTION NEEDED)
-- ============================================================

-- The following policies already exist and use is_company_admin() which is SECURITY DEFINER:
-- - "Admins can delete company access" (FOR DELETE)
-- - "Admins can update company access" (FOR UPDATE)
-- - "Admins can view company access" (FOR SELECT)
--
-- And these user-based policies work correctly:
-- - "Users can read own access record" (FOR SELECT, uses auth.uid())
-- - "Users can view own access" (FOR SELECT, uses auth.uid())
-- - "Users can update own name" (FOR UPDATE, uses auth.uid())

-- ============================================================
-- 3. FIX INSERT POLICY
-- ============================================================

-- Drop the existing insert policy (may have same recursion issue)
DROP POLICY IF EXISTS "Users can insert own access" ON "public"."user_company_access";

-- Create a safe INSERT policy using the is_company_admin() function
-- Allows: admins to add team members OR users to add their own access
CREATE POLICY "Admins can insert company access"
ON "public"."user_company_access" FOR INSERT
WITH CHECK (is_company_admin(company_id) OR user_id = auth.uid());

-- ============================================================
-- 4. DONE - Summary of remaining policies on user_company_access
-- ============================================================
-- SELECT:
--   - "Admins can view company access" (is_company_admin)
--   - "Users can read own access record" (auth.uid)
--   - "Users can view own access" (auth.uid)
--
-- INSERT:
--   - "Admins can insert company access" (is_company_admin OR own)
--
-- UPDATE:
--   - "Admins can update company access" (is_company_admin)
--   - "Users can update own name" (auth.uid)
--
-- DELETE:
--   - "Admins can delete company access" (is_company_admin)
