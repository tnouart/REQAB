const { pool } = require('../config/database');
(async () => {
  try {
    const res = await pool.query("SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name='permis_travail' ORDER BY ordinal_position");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.error(e.message);
  } finally {
    process.exit(0);
  }
})();
