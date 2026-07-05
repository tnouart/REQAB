-- Migration: Indicateurs environnementaux
CREATE TABLE IF NOT EXISTS indicateurs_env (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    valeur NUMERIC NOT NULL,
    unite VARCHAR(20) NOT NULL,
    mois VARCHAR(20) NOT NULL,
    tendance VARCHAR(20) NOT NULL DEFAULT 'stable',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_indicateurs_type ON indicateurs_env(type);
CREATE INDEX IF NOT EXISTS idx_indicateurs_mois ON indicateurs_env(mois);

INSERT INTO indicateurs_env (type, valeur, unite, mois, tendance) VALUES
('eau', 4820, 'm³', '2025-S1', 'down'),
('energie', 12340, 'MWh', '2025-S1', 'up'),
('dechets', 287, 'tonnes', '2025-S1', 'down'),
('emissions', 6180, 'tCO2eq', '2025-S1', 'up');
