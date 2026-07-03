const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const { pool } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024   }
});

module.exports = router;

router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' });
  res.json({ filename: req.file.filename, originalName: req.file.originalname });
});

const logAudit = async (req, action, oldData = null, newData = null) => {
  try {
    await pool.query(
      `INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, user_email, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ['document', req.params?.id || req.body?.id, action, 
       JSON.stringify(oldData), JSON.stringify(newData),
       req.headers['x-user-email'] || 'anonymous',
       req.ip]
    );
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

// GET all documents
router.get('/', async (req, res) => {
  try {
    const documents = await Document.findAll();
    res.json(documents);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// GET documents due for revision
router.get('/due-revision', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const result = await pool.query(`
      SELECT d.id, r.titre, d.codification, r.date_application, r.date_prochaine_revision
      FROM document d
      JOIN revision_document r ON r.document_id = d.id AND r.statut = 'APPLICABLE'
      WHERE r.date_prochaine_revision IS NOT NULL 
        AND r.date_prochaine_revision <= (CURRENT_DATE + ($1 || ' days')::INTERVAL)
      ORDER BY r.date_prochaine_revision ASC
    `, [days]);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// GET a document by id
router.get('/:id', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ msg: 'Document not found' });
    }
    res.json(document);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// GET revisions history for a document
router.get('/:id/revisions', async (req, res) => {
  try {
    const revisions = await Document.findRevisions(req.params.id);
    res.json(revisions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// GET document with checksum
router.get('/:id/checksum', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ msg: 'Document not found' });
    }
    const crypto = require('crypto');
    const dataToHash = JSON.stringify({
      numero_ordre: document.numero_ordre,
      codification: document.codification,
      titre: document.titre,
      processus_id: document.processus_id,
    });
    const checksum = crypto.createHash('sha256').update(dataToHash).digest('hex');
    
    await pool.query('UPDATE document SET checksum = $1 WHERE id = $2', [checksum, req.params.id]);
    
    res.json({ checksum });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// POST a new document
router.post('/', async (req, res) => {
  try {
    const document = await Document.create(req.body);
    await logAudit(req, 'CREATE', null, document);
    res.json(document);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// PUT update a document
router.put('/:id', async (req, res) => {
  try {
    const oldDoc = await Document.findById(req.params.id);
    const document = await Document.update(req.params.id, req.body);
    if (!document) {
      return res.status(404).json({ msg: 'Document not found' });
    }
    await logAudit(req, 'UPDATE', oldDoc, document);
    res.json(document);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// DELETE a document
router.delete('/:id', async (req, res) => {
  try {
    const oldDoc = await Document.findById(req.params.id);
    await Document.delete(req.params.id);
    await logAudit(req, 'DELETE', oldDoc, null);
    res.json({ msg: 'Document removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.post('/:id/transition', async (req, res) => {
  try {
    const { id } = req.params;
    const { statut, motif_modification } = req.body;
    const allowed = ['BROUILLON', 'EN_REVUE', 'APPROUVE', 'APPLICABLE', 'OBSOLETE', 'ARCHIVE'];
    if (!allowed.includes(statut)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }
    const result = await pool.query(
      `UPDATE revision_document
       SET statut = $1,
           motif_modification = COALESCE($2, motif_modification),
           date_enregistrement = now()
       WHERE document_id = $3 AND statut != $1
       RETURNING *`,
      [statut, motif_modification || null, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Révision non trouvée' });
    }
    await logAudit(req, 'TRANSITION', null, result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/:id/revisions', async (req, res) => {
  try {
    const { id } = req.params;
    const { titre, motif_modification } = req.body;
    const maxRevResult = await pool.query(
      `SELECT MAX(numero_revision) AS max_rev FROM revision_document WHERE document_id = $1`,
      [id]
    );
    const nextRev = (maxRevResult.rows[0].max_rev || 0) + 1;
    const result = await pool.query(
      `INSERT INTO revision_document (document_id, numero_revision, titre, statut, motif_modification)
        VALUES ($1, $2, $3, 'BROUILLON', $4)
        RETURNING *`,
      [id, nextRev, titre || `Révision ${nextRev}`, motif_modification || 'Nouvelle révision']
    );
    await pool.query(
      `UPDATE document SET numero_revision = $1 WHERE id = $2`,
      [nextRev, id]
    );
    await logAudit(req, 'CREATE_REVISION', null, result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});