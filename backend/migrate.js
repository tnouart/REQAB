const { pool } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  
  for (const file of files) {
    console.log(`Appliquer: ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    try {
      await pool.query(sql);
      console.log(`✓ ${file}`);
    } catch (err) {
      console.error(`✗ ${file}:`, err.message);
    }
  }
  
  await pool.end();
  console.log('Migrations terminées');
}

runMigrations();