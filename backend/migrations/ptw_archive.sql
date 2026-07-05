-- Migration: archivage PTW
ALTER TABLE permis_travail ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP NULL;
CREATE INDEX IF NOT EXISTS idx_ptw_archived_at ON permis_travail(archived_at);
