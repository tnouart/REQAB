require('dotenv').config();
const { pool } = require('./config/database');
(async () => {
  const r = await pool.query("SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'statut_revision_enum')");
  console.log('Enum values:', r.rows.map(x => x.enumlabel).join(', '));
  const r2 = await pool.query("SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'audit_action_enum')");
  console.log('Audit action enum:', r2.rows.map(x => x.enumlabel).join(', '));
  const r3 = await pool.query("SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'permission_enum')");
  console.log('Permission enum:', r3.rows.map(x => x.enumlabel).join(', '));
  await pool.end();
})();
