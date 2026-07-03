const { pool } = require('./config/database');
pool.query('SELECT * FROM fonction_responsable LIMIT 3').then(r => console.log(r.rows)).catch(e => console.log('Error:', e.message));