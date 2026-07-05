const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, numero_ptw, type_travail, titre, zone, description, responsable,
             date_debut, date_fin, urgence, statut, risques, epi, checks, created_at, updated_at
      FROM permis_travail
      ORDER BY created_at DESC
    `);
    const rows = result.rows.map((r) => ({
      ...r,
      risques: Array.isArray(r.risques) ? r.risques : (() => { try { return JSON.parse(r.risques || '[]'); } catch { return []; } })(),
      epi: Array.isArray(r.epi) ? r.epi : (() => { try { return JSON.parse(r.epi || '[]'); } catch { return []; } })(),
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
        COUNT(*) FILTER (WHERE statut = 'ATTENTE') as attente,
        COUNT(*) FILTER (WHERE statut = 'APPROUVE') as approuve,
        COUNT(*) FILTER (WHERE statut = 'ACTIF') as actif,
        COUNT(*) FILTER (WHERE statut = 'CLOS') as clos,
        COUNT(*) as total
      FROM permis_travail
    `);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM permis_travail WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'PTW non trouvé' });
    const r = result.rows[0];
    const normalized = {
      ...r,
      risques: Array.isArray(r.risques) ? r.risques : (() => { try { return JSON.parse(r.risques || '[]'); } catch { return []; } })(),
      epi: Array.isArray(r.epi) ? r.epi : (() => { try { return JSON.parse(r.epi || '[]'); } catch { return []; } })(),
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
    const {
      type_travail, titre, zone, description, responsable,
      date_debut, date_fin, urgence, statut, risques, epi, checks
    } = req.body;

    const maxResult = await pool.query(`SELECT MAX(numero_ptw) as max_ptw FROM permis_travail`);
    const year = new Date().getFullYear();
    const maxN = parseInt(maxResult.rows[0].max_ptw?.split('-')[2] || '0');
    const nextNum = `PTW-${year}-${String(maxN + 1).padStart(3, '0')}`;

    const risqueStr = JSON.stringify(risques || []);
    const epiStr = JSON.stringify(epi || []);
    const checksStr = JSON.stringify(checks || []);

    const result = await pool.query(
      `INSERT INTO permis_travail 
       (numero_ptw, type_travail, titre, zone, description, responsable, date_debut, date_fin, urgence, statut, risques, epi, checks)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::text[], $12::text[], $13::jsonb)
       RETURNING *`,
      [
        nextNum,
        type_travail,
        titre,
        zone,
        description || '',
        responsable,
        date_debut,
        date_fin,
        urgence || 'norm',
        statut || 'ATTENTE',
        risques || [],
        epi || [],
        JSON.stringify(checks || [])
      ]
    );

    const r = result.rows[0];
    const normalized = {
      ...r,
      risques: Array.isArray(r.risques) ? r.risques : (() => { try { return JSON.parse(r.risques || '[]'); } catch { return []; } })(),
      epi: Array.isArray(r.epi) ? r.epi : (() => { try { return JSON.parse(r.epi || '[]'); } catch { return []; } })(),
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
    const { statut, checks, titre, zone, responsable, date_debut, date_fin, urgence, description, risques, epi } = req.body;

    const result = await pool.query(
      `UPDATE permis_travail 
       SET statut = COALESCE($1, statut),
           checks = COALESCE($2::jsonb, checks),
           titre = COALESCE($3, titre),
           zone = COALESCE($4, zone),
           responsable = COALESCE($5, responsable),
           date_debut = COALESCE($6, date_debut),
           date_fin = COALESCE($7, date_fin),
           urgence = COALESCE($8, urgence),
           description = COALESCE($9, description),
           risques = COALESCE($10::text[], risques),
           epi = COALESCE($11::text[], epi),
           updated_at = NOW()
       WHERE id = $12
       RETURNING *`,
      [statut, checks ? JSON.stringify(checks) : null, titre, zone, responsable, date_debut, date_fin, urgence, description, risques || null, epi || null, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'PTW non trouvé' });
    const r = result.rows[0];
    const normalized = {
      ...r,
      risques: Array.isArray(r.risques) ? r.risques : (() => { try { return JSON.parse(r.risques || '[]'); } catch { return []; } })(),
      epi: Array.isArray(r.epi) ? r.epi : (() => { try { return JSON.parse(r.epi || '[]'); } catch { return []; } })(),
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
    const result = await pool.query('DELETE FROM permis_travail WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'PTW non trouvé' });
    res.json({ success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
