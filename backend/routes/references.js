const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

async function getRef(req, res, table, labelCol, orderBy) {
  try {
    const result = await pool.query(
      `SELECT id, ${labelCol} AS label FROM ${table} ORDER BY ${orderBy || 'id'}`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
}

router.get('/type-document', (req, res) => getRef(req, res, 'type_document', 'libelle'));
router.get('/processus', (req, res) => getRef(req, res, 'processus', 'code'));
router.get('/niveau-confidentialite', (req, res) => getRef(req, res, 'niveau_confidentialite', 'libelle'));
router.get('/lieu', (req, res) => getRef(req, res, 'lieu', 'libelle'));
router.get('/methode-classement', (req, res) => getRef(req, res, 'methode_classement', 'libelle'));
router.get('/fonction-responsable', (req, res) => getRef(req, res, 'fonction_responsable', 'libelle'));

module.exports = router;
