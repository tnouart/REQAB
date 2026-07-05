const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, reference, domaine, intitule, derniere_evaluation, prochaine_echeance, statut, checks, created_at, updated_at
      FROM conformites
      ORDER BY prochaine_echeance ASC
    `);
    const rows = result.rows.map((r) => ({
      ...r,
      checks: Array.isArray(r.checks) ? r.checks : (() => { try { return JSON.parse(r.checks || '[]'); } catch { return []; } })(),
    }));
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM conformites WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Conformité non trouvée' });
    const r = result.rows[0];
    const normalized = {
      ...r,
      checks: Array.isArray(r.checks) ? r.checks : (() => { try { return JSON.parse(r.checks || '[]'); } catch { return []; } })(),
    };
    res.json(normalized);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { domaine, intitule, prochaine_echeance, statut, checks } = req.body;

    const maxResult = await pool.query(`SELECT MAX(reference) as max_ref FROM conformites`);
    const maxRef = maxResult.rows[0]?.max_ref || 'REG-000';
    const maxN = parseInt(maxRef.split('-')[1] || '0', 10);
    const nextRef = `REG-${String(maxN + 1).padStart(3, '0')}`;

    const checksStr = JSON.stringify(checks || []);
    const result = await pool.query(
      `INSERT INTO conformites 
       (reference, domaine, intitule, prochaine_echeance, statut, checks)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)
       RETURNING *`,
      [nextRef, domaine, intitule, prochaine_echeance, statut, checksStr]
    );
    const r = result.rows[0];
    const normalized = {
      ...r,
      checks: Array.isArray(r.checks) ? r.checks : (() => { try { return JSON.parse(r.checks || '[]'); } catch { return []; } })(),
    };
    res.json(normalized);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { domaine, intitule, prochaine_echeance, statut, checks } = req.body;
    const checksStr = JSON.stringify(checks || []);
    const result = await pool.query(
      `UPDATE conformites 
       SET domaine = COALESCE($1, domaine),
           intitule = COALESCE($2, intitule),
           prochaine_echeance = COALESCE($3, prochaine_echeance),
           statut = COALESCE($4, statut),
           checks = COALESCE($5::jsonb, checks),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [domaine, intitule, prochaine_echeance, statut, checksStr, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Conformité non trouvée' });
    const r = result.rows[0];
    const normalized = {
      ...r,
      checks: Array.isArray(r.checks) ? r.checks : (() => { try { return JSON.parse(r.checks || '[]'); } catch { return []; } })(),
    };
    res.json(normalized);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM conformites WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Conformité non trouvée' });
    res.json({ success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
