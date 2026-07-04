CREATE TABLE IF NOT EXISTS utilisateur (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  matricule VARCHAR(10) UNIQUE NOT NULL,
  nom VARCHAR(255),
  prenom VARCHAR(255),
  mot_de_passe_hash VARCHAR(255),
  processus_id INTEGER REFERENCES processus(id),
  fonction_responsable_id INTEGER REFERENCES fonction_responsable(id),
  actif BOOLEAN DEFAULT true,
  date_creation TIMESTAMPTZ DEFAULT now(),
  derniere_connexion TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS role (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  libelle VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB
);

CREATE TABLE IF NOT EXISTS utilisateur_role (
  utilisateur_id INTEGER REFERENCES utilisateur(id) ON DELETE CASCADE,
  role_id INTEGER REFERENCES role(id) ON DELETE CASCADE,
  PRIMARY KEY (utilisateur_id, role_id)
);

INSERT INTO role (code, libelle, description, permissions) VALUES
  ('admin', 'Administrateur', 'Accès complet', '{"all": true}'),
  ('responsable_qualite', 'Responsable Qualité', 'Gestion qualité', '{"read": true, "write": true, "approve": true}'),
  ('redacteur', 'Rédacteur', 'Création documents', '{"read": true, "write": true}'),
  ('lecteur', 'Lecteur', 'Lecture seule', '{"read": true}')
ON CONFLICT (code) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_utilisateur_email ON utilisateur(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_utilisateur_matricule ON utilisateur(matricule);
CREATE INDEX IF NOT EXISTS idx_utilisateur_role ON utilisateur_role(role_id);