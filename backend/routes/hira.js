const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, reference, danger, processus, probabilite, gravite, risque_residuel,
             controle_prioritaire, document_ref, checks, created_at, updated_at
      FROM hira_dangers
      ORDER BY created_at DESC
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
        COUNT(*) FILTER (WHERE risque_residuel = 'Critique') as critique,
        COUNT(*) FILTER (WHERE risque_residuel = 'Élevé') as eleve,
        COUNT(*) FILTER (WHERE risque_residuel = 'Modéré') as modere,
        COUNT(*) FILTER (WHERE risque_residuel = 'Faible') as faible,
        COUNT(*) FILTER (WHERE risque_residuel = 'Tolérable') as tolerable,
        COUNT(*) as total
      FROM hira_dangers
    `);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/matrix', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT probabilite, gravite, COUNT(*) as count
      FROM hira_dangers
      GROUP BY probabilite, gravite
      ORDER BY probabilite, gravite
    `);
    const matrix = {};
    for (let p = 1; p <= 5; p++) {
      for (let g = 1; g <= 5; g++) {
        const row = result.rows.find(r => r.probabilite === p && r.gravite === g);
        matrix[`${p}-${g}`] = row ? row.count : 0;
      }
    }
    res.json(matrix);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM hira_dangers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Danger non trouvé' });
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
    const { reference, danger, processus, probabilite, gravite, risque_residuel, controle_prioritaire, document_ref, checks } = req.body;
    const result = await pool.query(
      `INSERT INTO hira_dangers 
       (reference, danger, processus, probabilite, gravite, risque_residuel, controle_prioritaire, document_ref, checks)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [reference, danger, processus, probabilite, gravite, risque_residuel, controle_prioritaire, document_ref, checks || []]
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
    const { danger, processus, probabilite, gravite, risque_residuel, controle_prioritaire, document_ref, checks } = req.body;
    const result = await pool.query(
      `UPDATE hira_dangers 
       SET danger = COALESCE($1, danger),
           processus = COALESCE($2, processus),
           probabilite = COALESCE($3, probabilite),
           gravite = COALESCE($4, gravite),
           risque_residuel = COALESCE($5, risque_residuel),
           controle_prioritaire = COALESCE($6, controle_prioritaire),
           document_ref = COALESCE($7, document_ref),
           checks = COALESCE($8, checks),
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [danger, processus, probabilite, gravite, risque_residuel, controle_prioritaire, document_ref, checks, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Danger non trouvé' });
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
    const result = await pool.query('DELETE FROM hira_dangers WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Danger non trouvé' });
    res.json({ success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
