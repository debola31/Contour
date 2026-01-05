-- Migration: Remove routing revisions concept
-- Date: 2026-01-04
-- Description: Remove the revision column from the routings table as revisions are no longer used

-- Drop the comment on the revision column first
COMMENT ON COLUMN "public"."routings"."revision" IS NULL;

-- Remove the revision column from the routings table
ALTER TABLE "public"."routings" DROP COLUMN IF EXISTS "revision";
