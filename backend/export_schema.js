require('dotenv').config();
const { pool } = require('./config/database');

(async () => {
  const tables = await pool.query(`SELECT table_name, column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position`);
  console.log('=== TABLES ===');
  let currentTable = null;
  tables.rows.forEach(r => {
    if (r.table_name !== currentTable) {
      currentTable = r.table_name;
      console.log(`Table: ${currentTable}`);
    }
    console.log(`  ${r.column_name} (${r.data_type}, nullable: ${r.is_nullable})`);
  });

  const constraints = await pool.query(`SELECT tc.table_name, tc.constraint_name, tc.constraint_type, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name FROM information_schema.table_constraints AS tc JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name LEFT JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name WHERE tc.table_schema = 'public' ORDER BY tc.table_name, tc.constraint_name`);
  console.log('\n=== CONSTRAINTS ===');
  constraints.rows.forEach(r => {
    console.log(`${r.table_name}.${r.column_name || '(composite)'} -> ${r.constraint_type} (${r.constraint_name})`);
    if (r.foreign_table_name) console.log(`  references ${r.foreign_table_name}.${r.foreign_column_name}`);
  });

  const views = await pool.query(`SELECT table_name, view_definition FROM information_schema.views WHERE table_schema = 'public' ORDER BY table_name`);
  console.log('\n=== VIEWS ===');
  views.rows.forEach(r => {
    console.log(`View: ${r.table_name}`);
    console.log(`  ${r.view_definition}`);
  });

  const indexes = await pool.query(`SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname`);
  console.log('\n=== INDEXES ===');
  indexes.rows.forEach(r => {
    console.log(`${r.tablename}: ${r.indexname} (${r.indexdef})`);
  });

  await pool.end();
})();
