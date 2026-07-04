const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

router.get('/activity-monthly', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        to_char(date_application, 'YYYY-MM') as month,
        COUNT(*) as revisions_count
      FROM revision 
      WHERE date_application IS NOT NULL 
        AND date_application >= NOW() - INTERVAL '12 months'
      GROUP BY to_char(date_application, 'YYYY-MM')
      ORDER BY month
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur GET /api/reports/activity-monthly:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;