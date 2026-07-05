const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, reference, activite, aspect, impact, condition, criticite, significatif, processus, checks, created_at, updated_at
      FROM aspects_environnementaux
      ORDER BY criticite DESC, created_at DESC
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

router.get('/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE significatif = true) as significatifs,
        COUNT(*) FILTER (WHERE significatif = false) as nonsignificatifs,
        COUNT(*) FILTER (WHERE condition = 'Situation d''urgence') as urgence,
        COUNT(*) as total
      FROM aspects_environnementaux
    `);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM aspects_environnementaux WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Aspect non trouvé' });
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
    const { activite, aspect, impact, condition, criticite, significatif, processus, checks } = req.body;

    const maxResult = await pool.query(`SELECT MAX(reference) as max_ref FROM aspects_environnementaux`);
    const maxRef = maxResult.rows[0]?.max_ref || 'AEI-000';
    const maxN = parseInt(maxRef.split('-')[1] || '0', 10);
    const nextRef = `AEI-${String(maxN + 1).padStart(3, '0')}`;

    const checksStr = JSON.stringify(checks || []);
    const result = await pool.query(
      `INSERT INTO aspects_environnementaux 
       (reference, activite, aspect, impact, condition, criticite, significatif, processus, checks)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
       RETURNING *`,
      [nextRef, activite, aspect, impact, condition, criticite, significatif, processus, checksStr]
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
    const { activite, aspect, impact, condition, criticite, significatif, processus, checks } = req.body;
    const checksStr = JSON.stringify(checks || []);
    const result = await pool.query(
      `UPDATE aspects_environnementaux 
       SET activite = COALESCE($1, activite),
           aspect = COALESCE($2, aspect),
           impact = COALESCE($3, impact),
           condition = COALESCE($4, condition),
           criticite = COALESCE($5, criticite),
           significatif = COALESCE($6, significatif),
           processus = COALESCE($7, processus),
           checks = COALESCE($8::jsonb, checks),
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [activite, aspect, impact, condition, criticite, significatif, processus, checksStr, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Aspect non trouvé' });
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
    const result = await pool.query('DELETE FROM aspects_environnementaux WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Aspect non trouvé' });
    res.json({ success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
