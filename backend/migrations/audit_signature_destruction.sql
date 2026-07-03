CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  table_name VARCHAR(50) NOT NULL,
  record_id INTEGER,
  action VARCHAR(20) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  user_email VARCHAR(255),
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_table ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_record ON audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);

CREATE TABLE IF NOT EXISTS signature (
  id SERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES document(id) ON DELETE CASCADE,
  revision_id INTEGER REFERENCES revision_document(id) ON DELETE SET NULL,
  signer_email VARCHAR(255) NOT NULL,
  signer_name VARCHAR(255) NOT NULL,
  signature_data TEXT,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signature_document ON signature(document_id);
CREATE INDEX IF NOT EXISTS idx_signature_signer ON signature(signer_email);

CREATE TABLE IF NOT EXISTS destruction_record (
  id SERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES document(id) ON DELETE CASCADE,
  revision_id INTEGER REFERENCES revision_document(id) ON DELETE SET NULL,
  destroyed_by VARCHAR(255) NOT NULL,
  destruction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  method VARCHAR(100),
  witness VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_destruction_document ON destruction_record(document_id);