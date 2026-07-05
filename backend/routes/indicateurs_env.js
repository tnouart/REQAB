const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, type, valeur, unite, mois, tendance, created_at
      FROM indicateurs_env
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { type, valeur, unite, mois, tendance } = req.body;
    const result = await pool.query(
      `INSERT INTO indicateurs_env (type, valeur, unite, mois, tendance)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [type, valeur, unite, mois, tendance || 'stable']
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM indicateurs_env WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Indicateur non trouvé' });
    res.json({ success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
