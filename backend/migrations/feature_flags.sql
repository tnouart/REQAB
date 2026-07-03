CREATE TABLE IF NOT EXISTS feature_flags (
  cle VARCHAR(100) PRIMARY KEY,
  valeur BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT,
  date_modification TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO feature_flags (cle, valeur, description) VALUES
  ('require_modification_reason', TRUE, 'Rendre le motif de modification obligatoire lors d''une mise à jour'),
  ('enable_checksum_verification', FALSE, 'Activer la vérification d''intégrité par checksum SHA256'),
  ('enable_audit_log', FALSE, 'Activer le journal d''audit complet'),
  ('enable_signature', FALSE, 'Activer la signature électronique des documents'),
  ('enable_diff_view', FALSE, 'Activer la vue comparative entre versions'),
  ('enable_destruction_tracking', FALSE, 'Activer le suivi de destruction des documents'),
  ('enable_access_control', FALSE, 'Activer le contrôle d''accès basé sur les rôles'),
  ('enable_notifications', TRUE, 'Activer les notifications toast')
ON CONFLICT (cle) DO NOTHING;

