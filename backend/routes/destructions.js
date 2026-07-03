const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.*, doc.titre as document_titre, doc.codification
       FROM destruction_record d
       JOIN document doc ON doc.id = d.document_id
       ORDER BY d.destruction_date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur récupération destructions:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { document_id, revision_id, destroyed_by, method, witness } = req.body;
    const result = await pool.query(
      `INSERT INTO destruction_record (document_id, revision_id, destroyed_by, method, witness)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [document_id, revision_id, destroyed_by, method, witness]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erreur création destruction:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;