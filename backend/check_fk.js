const { pool } = require('./config/database');
pool.query(`
  SELECT conname, pg_get_constraintdef(oid) 
  FROM pg_constraint 
  WHERE conrelid = 'utilisateur'::regclass
`).then(r => console.log(r.rows)).catch(e => console.log('Error:', e.message));