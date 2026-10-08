-- ============================================================
-- Migration: Widen profile_image column for base64 image storage
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================
--
-- The profile_image column was VARCHAR(255) which is too small
-- for base64-encoded images (which can be 100KB-200KB as text).
-- PostgreSQL TEXT type has no length limit and supports any size.

ALTER TABLE users ALTER COLUMN profile_image TYPE TEXT;

-- Verify the change
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'profile_image';
