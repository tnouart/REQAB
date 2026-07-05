const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, reference, description, gravite, zone, statut, date, type, checks, created_at, updated_at
      FROM incidents
      ORDER BY date DESC
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
        COUNT(*) FILTER (WHERE type = 'Accident avec arrêt') as tf,
        COUNT(*) FILTER (WHERE type = 'Accident sans arrêt') as tfp,
        COUNT(*) FILTER (WHERE type = 'Presqu''accident') as pa,
        COUNT(*) as total
      FROM incidents
    `);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM incidents WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Incident non trouvé' });
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
    const { description, gravite, zone, date, type, checks } = req.body;

    const maxResult = await pool.query(`SELECT MAX(reference) as max_ref FROM incidents`);
    const maxRef = maxResult.rows[0]?.max_ref || 'INC-0000';
    const maxN = parseInt(maxRef.split('-')[2] || '0', 10);
    const nextRef = `INC-2025-${String(maxN + 1).padStart(3, '0')}`;

    const checksStr = JSON.stringify(checks || []);
    const result = await pool.query(
      `INSERT INTO incidents 
       (reference, description, gravite, zone, date, type, checks)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
       RETURNING *`,
      [nextRef, description, gravite, zone, date, type, checksStr]
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
    const { description, gravite, zone, date, type, checks } = req.body;
    const checksStr = JSON.stringify(checks || []);
    const result = await pool.query(
      `UPDATE incidents 
       SET description = COALESCE($1, description),
           gravite = COALESCE($2, gravite),
           zone = COALESCE($3, zone),
           date = COALESCE($4, date),
           type = COALESCE($5, type),
           checks = COALESCE($6::jsonb, checks),
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [description, gravite, zone, date, type, checksStr, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Incident non trouvé' });
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
    const result = await pool.query('DELETE FROM incidents WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Incident non trouvé' });
    res.json({ success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
