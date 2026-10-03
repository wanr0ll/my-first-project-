-- Migration: Add receipt_url column to assets table
-- Run this script once to update the database schema

USE gha_asset_manager;

ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS receipt_url TEXT DEFAULT NULL COMMENT 'Path to uploaded receipt / proof-of-purchase scan';
