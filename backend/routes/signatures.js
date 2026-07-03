const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

router.get('/document/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    const result = await pool.query(
      `SELECT * FROM signature WHERE document_id = $1 ORDER BY signed_at DESC`,
      [documentId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur récupération signatures:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { document_id, revision_id, signer_email, signer_name, signature_data } = req.body;
    const result = await pool.query(
      `INSERT INTO signature (document_id, revision_id, signer_email, signer_name, signature_data)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [document_id, revision_id, signer_email, signer_name, signature_data]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erreur création signature:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;