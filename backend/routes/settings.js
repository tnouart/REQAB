const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT cle, valeur, description FROM feature_flags ORDER BY cle');
    const flags = {};
    result.rows.forEach((row) => {
      flags[row.cle] = { valeur: row.valeur, description: row.description };
    });
    res.json(flags);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.put('/:cle', async (req, res) => {
  try {
    const { cle } = req.params;
    const { valeur } = req.body;
    await pool.query('UPDATE feature_flags SET valeur = $1, date_modification = now() WHERE cle = $2', [valeur, cle]);
    res.json({ cle, valeur });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
