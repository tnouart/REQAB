CREATE TABLE IF NOT EXISTS non_conformite (
  id SERIAL PRIMARY KEY,
  numero_nc INTEGER NOT NULL,
  type_nc VARCHAR(100),
  criticite VARCHAR(20) NOT NULL CHECK (criticite IN ('CRITIQUE', 'MAJEURE', 'MINEURE')),
  description TEXT NOT NULL,
  document_id INTEGER REFERENCES document(id) ON DELETE SET NULL,
  detecte_lors_de VARCHAR(100),
  responsable_traitement VARCHAR(255),
  delai_traitement DATE,
  jours_retard INTEGER DEFAULT 0,
  action_corrective TEXT,
  statut VARCHAR(20) NOT NULL DEFAULT 'OUVERTE' CHECK (statut IN ('OUVERTE', 'EN_COURS', 'CLOTUREE')),
  date_detection DATE NOT NULL DEFAULT CURRENT_DATE,
  date_cloture DATE,
  date_creation TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_non_conformite_document ON non_conformite(document_id);
CREATE INDEX IF NOT EXISTS idx_non_conformite_statut ON non_conformite(statut);
CREATE INDEX IF NOT EXISTS idx_non_conformite_criticite ON non_conformite(criticite);
CREATE INDEX IF NOT EXISTS idx_non_conformite_date ON non_conformite(date_detection);