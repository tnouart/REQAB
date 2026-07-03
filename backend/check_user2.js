const { pool } = require('./config/database');
pool.query('SELECT * FROM utilisateur LIMIT 1').then(r => {
  console.log('Structure:', Object.keys(r.rows[0] || {}));
}).catch(e => console.log('Error:', e.message));