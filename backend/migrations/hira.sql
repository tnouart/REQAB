-- Migration: Registre HIRA (dangers/risques SST)
CREATE TABLE IF NOT EXISTS hira_dangers (
    id SERIAL PRIMARY KEY,
    reference VARCHAR(50) UNIQUE NOT NULL,
    danger VARCHAR(255) NOT NULL,
    processus VARCHAR(100) NOT NULL,
    probabilite INTEGER NOT NULL CHECK (probabilite BETWEEN 1 AND 5),
    gravite INTEGER NOT NULL CHECK (gravite BETWEEN 1 AND 5),
    risque_residuel VARCHAR(20) NOT NULL,
    controle_prioritaire TEXT NOT NULL,
    document_ref VARCHAR(100),
    checks JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hira_processus ON hira_dangers(processus);
CREATE INDEX IF NOT EXISTS idx_hira_residuel ON hira_dangers(risque_residuel);

INSERT INTO hira_dangers (reference, danger, processus, probabilite, gravite, risque_residuel, controle_prioritaire, document_ref, checks)
VALUES
('D-001', 'Atmosphère explosible (hydrocarbures)', 'Forage', 3, 5, 'Élevé', 'Détection gaz permanente', 'PRO.HSE.FOG.001',
 '[{"label":"Détecteur gaz installé","ok":true},{"label":"Plan d''urgence validé","ok":true},{"label":"Appareil respiratoire disponible","ok":false}]'),
('D-002', 'Chute de hauteur (travaux en élévation)', 'Maintenance', 2, 4, 'Modéré', 'Harnais antichute obligatoire', 'INS.HSE.HAU.003',
 '[{"label":"Point d''ancrage vérifié","ok":true},{"label":"Formation travaux hauteur","ok":true}]'),
('D-003', 'Électrocution (HTA / BT)', 'Maintenance', 2, 5, 'Élevé', 'LOTO systématique + VAT', 'PRO.HSE.ELE.002',
 '[{"label":"Consignation LOTO vérifiée","ok":true},{"label":"Habilitation électrique valide","ok":true}]'),
('D-004', 'Exposition H₂S (gaz toxique)', 'Production', 3, 5, 'Critique', 'ARI + détecteur individuel', 'INS.HSE.GAZ.001',
 '[{"label":"Détecteur H₂S fonctionnel","ok":false},{"label":"ARI disponible","ok":false},{"label":"Plan d''évacuation affiché","ok":false}]'),
('D-005', 'Projection haute pression (fluide)', 'Forage', 2, 3, 'Faible', 'EPI + procédure dépressurisation', 'MOD.HSE.PRE.004',
 '[{"label":"EPI anti-projection porté","ok":true},{"label":"Dépressurisation vérifiée","ok":true}]'),
('D-006', 'Asphyxie (espace confiné)', 'Production', 2, 5, 'Élevé', 'Analyse atmosphérique + ARI', 'PRO.HSE.ESC.001',
 '[{"label":"Analyse O₂ réalisée","ok":false},{"label":"Surveillant de surface désigné","ok":false}]'),
('D-007', 'Incendie feu de nappe', 'Production', 1, 5, 'Modéré', 'Plan urgence + extincteurs', 'PRO.HSE.INC.002',
 '[{"label":"Extincteurs vérifiés","ok":true},{"label":"Plan incendie affiché","ok":true}]'),
('D-008', 'Bruit (exposition sonore)', 'Production', 4, 2, 'Faible', 'Protections auditives', 'INS.HSE.BRU.001',
 '[{"label":"Casque antibruit fourni","ok":true}]');
