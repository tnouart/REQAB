ALTER TABLE role ADD COLUMN IF NOT EXISTS permissions JSONB;
UPDATE role SET permissions = '{"read": true}' WHERE permissions IS NULL;
ALTER TABLE role ALTER COLUMN permissions SET DEFAULT '{"read": true}';