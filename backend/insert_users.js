const { pool } = require('./config/database');

async function insertTestUsers() {
  try {
    // Insérer utilisateurs de test
    const users = [
      { email: 'admin@qualite.com', nom: 'Admin', role: 'admin' },
      { email: 'qualite@qualite.com', nom: 'Resp. Qualité', role: 'responsable_qualite' },
      { email: 'user@qualite.com', nom: 'User', role: 'redacteur' },
      { email: 'viewer@qualite.com', nom: 'Viewer', role: 'lecteur' }
    ];
    
    for (const u of users) {
      const roleRes = await pool.query('SELECT id FROM role WHERE code = $1', [u.role]);
      const roleId = roleRes.rows[0]?.id || 1;
      // Insérer l'utilisateur sans role_id (les rôles sont dans utilisateur_role)
      await pool.query(
        'INSERT INTO utilisateur (email, nom, actif) VALUES ($1, $2, true) ON CONFLICT (email) DO NOTHING',
        [u.email, u.nom]
      );
      // Récupérer l'ID utilisateur
      const userRes = await pool.query('SELECT id FROM utilisateur WHERE email = $1', [u.email]);
      const userId = userRes.rows[0]?.id;
      if (userId) {
        await pool.query(
          'INSERT INTO utilisateur_role (utilisateur_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [userId, roleId]
        );
      }
    }
    
    console.log('Utilisateurs insérés avec succès');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit(0);
  }
}

insertTestUsers();