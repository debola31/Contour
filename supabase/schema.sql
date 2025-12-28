-- Jigged Phase 0 Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension (usually already enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- COMPANIES TABLE
-- ============================================
-- Stores company/organization information
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);

-- ============================================
-- USER COMPANY ACCESS TABLE
-- ============================================
-- Junction table linking users to companies with roles
CREATE TABLE IF NOT EXISTS user_company_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'user' CHECK (role IN ('owner', 'admin', 'user', 'operator', 'bookkeeper', 'engineer', 'quality')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_company_access_user_id ON user_company_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_company_access_company_id ON user_company_access(company_id);

-- ============================================
-- USER PREFERENCES TABLE
-- ============================================
-- Stores user preferences including last accessed company
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  last_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_company_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES FOR COMPANIES
-- ============================================

-- Users can only view companies they have access to
CREATE POLICY "Users can view companies they have access to"
  ON companies
  FOR SELECT
  USING (
    id IN (
      SELECT company_id
      FROM user_company_access
      WHERE user_id = auth.uid()
    )
  );

-- Only admins/owners can update company details
CREATE POLICY "Admins can update company details"
  ON companies
  FOR UPDATE
  USING (
    id IN (
      SELECT company_id
      FROM user_company_access
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================
-- RLS POLICIES FOR USER COMPANY ACCESS
-- ============================================

-- Security definer function to check admin status without triggering RLS recursion
CREATE OR REPLACE FUNCTION is_company_admin(check_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_company_access
    WHERE user_id = auth.uid()
    AND company_id = check_company_id
    AND role IN ('owner', 'admin')
  );
$$;

-- Users can view their own company access records
CREATE POLICY "Users can view their own company access"
  ON user_company_access
  FOR SELECT
  USING (user_id = auth.uid());

-- Admins/owners can view all access records for their companies
CREATE POLICY "Admins can view all company access"
  ON user_company_access
  FOR SELECT
  USING (is_company_admin(company_id));

-- Admins can insert access for their companies
CREATE POLICY "Admins can insert company access"
  ON user_company_access
  FOR INSERT
  WITH CHECK (is_company_admin(company_id));

-- Admins can update access for their companies
CREATE POLICY "Admins can update company access"
  ON user_company_access
  FOR UPDATE
  USING (is_company_admin(company_id));

-- Admins can delete access for their companies
CREATE POLICY "Admins can delete company access"
  ON user_company_access
  FOR DELETE
  USING (is_company_admin(company_id));

-- ============================================
-- RLS POLICIES FOR USER PREFERENCES
-- ============================================

-- Users can view their own preferences
CREATE POLICY "Users can view their own preferences"
  ON user_preferences
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own preferences
CREATE POLICY "Users can insert their own preferences"
  ON user_preferences
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own preferences
CREATE POLICY "Users can update their own preferences"
  ON user_preferences
  FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own preferences
CREATE POLICY "Users can delete their own preferences"
  ON user_preferences
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for companies table
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_preferences table
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA (OPTIONAL - FOR TESTING)
-- ============================================
-- Uncomment the following to create a test company

-- INSERT INTO companies (name) VALUES ('Contour Tool Inc');
