const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const sqlPath = path.join(__dirname, '..', 'migrations', 'hira.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Migration HIRA appliquée avec succès.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erreur migration HIRA:', err.message);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

runMigration();
