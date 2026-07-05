const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, reference, nom, prenom, competences, date_expiration, statut, checks, created_at, updated_at
      FROM habilitations
      ORDER BY date_expiration ASC
    `);
    const rows = result.rows.map((r) => ({
      ...r,
      competences: Array.isArray(r.competences) ? r.competences : (() => { try { return JSON.parse(r.competences || '[]'); } catch { return []; } })(),
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
        COUNT(*) FILTER (WHERE statut = 'VALIDE') as valide,
        COUNT(*) FILTER (WHERE statut = 'A_RENOUVELER') as a_renouveler,
        COUNT(*) FILTER (WHERE statut = 'EXPIRE') as expire,
        COUNT(*) as total
      FROM habilitations
    `);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM habilitations WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Habilitation non trouvée' });
    const r = result.rows[0];
    const normalized = {
      ...r,
      competences: Array.isArray(r.competences) ? r.competences : (() => { try { return JSON.parse(r.competences || '[]'); } catch { return []; } })(),
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
    const { nom, prenom, competences, date_expiration, statut, checks } = req.body;

    const maxResult = await pool.query(`SELECT MAX(reference) as max_ref FROM habilitations`);
    const maxRef = maxResult.rows[0]?.max_ref || 'HAB-000';
    const maxN = parseInt(maxRef.split('-')[1] || '0', 10);
    const nextRef = `HAB-${String(maxN + 1).padStart(3, '0')}`;

    const competencesStr = JSON.stringify(competences || []);
    const checksStr = JSON.stringify(checks || []);
    const result = await pool.query(
      `INSERT INTO habilitations 
       (reference, nom, prenom, competences, date_expiration, statut, checks)
       VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7::jsonb)
       RETURNING *`,
      [nextRef, nom, prenom, competencesStr, date_expiration, statut, checksStr]
    );
    const r = result.rows[0];
    const normalized = {
      ...r,
      competences: Array.isArray(r.competences) ? r.competences : (() => { try { return JSON.parse(r.competences || '[]'); } catch { return []; } })(),
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
    const { nom, prenom, competences, date_expiration, statut, checks } = req.body;
    const competencesStr = JSON.stringify(competences || []);
    const checksStr = JSON.stringify(checks || []);
    const result = await pool.query(
      `UPDATE habilitations 
       SET nom = COALESCE($1, nom),
           prenom = COALESCE($2, prenom),
           competences = COALESCE($3::jsonb, competences),
           date_expiration = COALESCE($4, date_expiration),
           statut = COALESCE($5, statut),
           checks = COALESCE($6::jsonb, checks),
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [nom, prenom, competencesStr, date_expiration, statut, checksStr, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Habilitation non trouvée' });
    const r = result.rows[0];
    const normalized = {
      ...r,
      competences: Array.isArray(r.competences) ? r.competences : (() => { try { return JSON.parse(r.competences || '[]'); } catch { return []; } })(),
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
    const result = await pool.query('DELETE FROM habilitations WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Habilitation non trouvée' });
    res.json({ success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
