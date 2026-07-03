const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const { table_name, record_id, limit = 100, offset = 0 } = req.query;
    let query = 'SELECT * FROM audit_log';
    const conditions = [];
    const params = [];

    if (table_name) {
      conditions.push(`table_name = $${conditions.length + 1}`);
      params.push(table_name);
    }
    if (record_id) {
      conditions.push(`record_id = $${conditions.length + 1}`);
      params.push(parseInt(record_id));
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` ORDER BY created_at DESC LIMIT $${conditions.length + 1} OFFSET $${conditions.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur audit log:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { table_name, record_id, action, old_values, new_values, user_email, ip_address } = req.body;
    const result = await pool.query(
      `INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, user_email, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $6) RETURNING *`,
      [table_name, record_id, action, JSON.stringify(old_values), JSON.stringify(new_values), user_email]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erreur création audit log:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;