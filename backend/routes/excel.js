const express = require('express');
const multer = require('multer');
const ExcelJS = require('exceljs');
const { pool } = require('../config/database');

const router = express.Router();

const INITIAL_MEMORY_STORAGE = multer.memoryStorage();
const upload = multer({
  storage: INITIAL_MEMORY_STORAGE,
  limits: { fileSize: 50 * 1024 * 1024 }
});

const ALLOWED_TABLES = [
  'document', 'revision_document', 'type_document', 'processus',
  'niveau_confidentialite', 'methode_classement', 'lieu',
  'fonction_responsable', 'utilisateur', 'role'
];

router.get('/export', async (req, res) => {
  try {
    const { table } = req.query;
    const requestedTable = typeof table === 'string' ? table : null;
    const tablesToExport = requestedTable
      ? (ALLOWED_TABLES.includes(requestedTable) ? [requestedTable] : [])
      : ALLOWED_TABLES;

    if (tablesToExport.length === 0) {
      return res.status(400).json({ error: 'Table non autorisée ou inexistante' });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Gestion Documentaire Qualité';
    workbook.created = new Date();

    for (const t of tablesToExport) {
      try {
        const result = await pool.query(`SELECT * FROM ${t} LIMIT 10000`);
        const rows = result.rows;
        const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

        const sheet = workbook.addWorksheet(t);

        if (columns.length > 0) {
          sheet.columns = columns.map((col) => ({
            header: col,
            key: col,
            width: Math.max(col.length + 2, 18)
          }));

          sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
          sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
          sheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };

          for (const row of rows) {
            const sheetRow = sheet.addRow();
            for (const col of columns) {
              const cell = sheetRow.getCell(col);
              if (row[col] instanceof Date) {
                cell.value = row[col].toISOString();
              } else if (typeof row[col] === 'object' && row[col] !== null) {
                cell.value = JSON.stringify(row[col]);
              } else {
                cell.value = row[col];
              }
            }
          }
        }
      } catch (err) {
        console.error(`Erreur export table ${t}:`, err.message);
        const errorSheet = workbook.addWorksheet(`${t}_erreur`);
        errorSheet.addRow(['Erreur lors de l\'export de cette table', err.message]);
      }
    }

    const fileName = requestedTable
      ? `${requestedTable}_export_${new Date().toISOString().split('T')[0]}.xlsx`
      : `export_complet_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Erreur export:', err);
    res.status(500).json({ error: 'Échec de l\'export', detail: err.message });
  }
});

router.post('/import', upload.single('file'), async (req, res) => {
  try {
    const { table } = req.body;

    if (!table || !ALLOWED_TABLES.includes(table)) {
      return res.status(400).json({ error: 'Table non autorisée' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Fichier requis' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const sheet = workbook.getWorksheet(1);
    if (!sheet) {
      return res.status(400).json({ error: 'Feuille introuvable dans le fichier' });
    }

    const columns = sheet.getRow(1).values.filter((v) => v !== undefined && v !== null).map(String);

    if (columns.length === 0) {
      return res.status(400).json({ error: 'Fichier vide ou sans en-têtes' });
    }

    const validCols = columns.filter((c) => {
      const cleaned = c.trim().toLowerCase();
      return /^[a-z0-9_]+$/.test(cleaned);
    });

    if (validCols.length === 0) {
      return res.status(400).json({ error: 'En-têtes invalides dans le fichier' });
    }

    await pool.query('BEGIN');

    let insertedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 2; i <= sheet.rowCount; i++) {
      const sheetRow = sheet.getRow(i);
      const cellValues = validCols.map((col) => {
        const cell = sheetRow.getCell(col);
        return cell.value;
      });

      const placeholders = validCols.map((_, idx) => `$${idx + 1}`).join(', ');
      const colNames = validCols.map((c) => `"${c}"`).join(', ');

      try {
        await pool.query(
          `INSERT INTO ${table} (${colNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
          cellValues
        );
        insertedCount++;
      } catch (err) {
        errorCount++;
        if (errors.length < 5) {
          errors.push(`Ligne ${i}: ${err.message}`);
        }
      }
    }

    await pool.query('COMMIT');

    res.json({
      table,
      inserted: insertedCount,
      errors: errorCount,
      errorDetails: errors,
      totalRows: sheet.rowCount - 1
    });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Erreur import:', err);
    res.status(500).json({ error: 'Échec de l\'import', detail: err.message });
  }
});

router.get('/tables', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    const tables = result.rows.map((r) => r.table_name);
    res.json(tables.filter((t) => ALLOWED_TABLES.includes(t)));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
