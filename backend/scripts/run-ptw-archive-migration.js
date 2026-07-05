const { pool } = require('../config/database');
(async () => {
  try {
    await pool.query('ALTER TABLE permis_travail ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP NULL');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_ptw_archived_at ON permis_travail(archived_at)');
    console.log('PTW archive migration ok');
  } catch (e) {
    console.error(e.message);
  } finally {
    process.exit(0);
  }
})();
