const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runMigration(fileName) {
  const sqlPath = path.join(__dirname, '..', 'migrations', fileName);
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log(`Migration ${fileName} appliquée avec succès.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`Erreur migration ${fileName}:`, err.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

async function main() {
  await runMigration('aei.sql');
  await runMigration('incidents.sql');
  await runMigration('habilitations.sql');
  await runMigration('indicateurs_env.sql');
  await runMigration('conformites.sql');
  process.exit(0);
}

main();
