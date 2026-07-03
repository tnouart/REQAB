// src/components/AdminSettings.tsx
import React, { useState } from 'react';
import type { FeatureFlag } from '../contexts/FeatureFlagsContext';
import { useFeatureFlags } from '../contexts/FeatureFlagsContext';
import { useToast } from '../contexts/ToastContext';
import { fetchTables, exportTable, importTable, fetchAuditLogs, fetchDestructions } from '../services/api';
import type { AuditLog, DestructionRecord } from '../services/api';

interface ToggleRowProps {
  flag: FeatureFlag;
  onToggle: (cle: string, valeur: boolean) => Promise<void>;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ flag, onToggle }) => {
  const [busy, setBusy] = React.useState(false);

  const handleToggle = async () => {
    setBusy(true);
    await onToggle(flag.cle, !flag.valeur);
    setBusy(false);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.85rem 0',
      borderBottom: '1px solid var(--border-light)',
      gap: '1rem',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text)' }}>{flag.description}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '0.15rem' }}>
          {flag.cle}
        </div>
      </div>
      <label style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        cursor: busy ? 'wait' : 'pointer',
        gap: '0.5rem',
      }}>
        <input
          type="checkbox"
          checked={flag.valeur}
          onChange={handleToggle}
          disabled={busy}
          style={{ display: 'none' }}
        />
        <span style={{
          width: '40px',
          height: '22px',
          background: flag.valeur ? 'var(--accent)' : 'var(--border)',
          borderRadius: '999px',
          position: 'relative',
          transition: 'background 150ms',
          flexShrink: 0,
        }}>
          <span style={{
            position: 'absolute',
            top: '2px',
            left: flag.valeur ? '20px' : '2px',
            width: '18px',
            height: '18px',
            background: '#fff',
            borderRadius: '50%',
            transition: 'left 150ms',
            boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
          }} />
        </span>
        <span style={{
          fontSize: '0.75rem',
          fontWeight: 500,
          color: flag.valeur ? 'var(--accent)' : 'var(--text-muted)',
          minWidth: '32px',
        }}>
          {flag.valeur ? 'On' : 'Off'}
        </span>
      </label>
    </div>
  );
};

const AdminSettings: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { flags, loading, updateFlag } = useFeatureFlags();
  const { showToast } = useToast();
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'features' | 'audit' | 'destructions'>('features');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [destructions, setDestructions] = useState<DestructionRecord[]>([]);

  React.useEffect(() => {
    fetchTables().then(setTables).catch(console.error);
  }, []);

  const loadAuditLogs = async () => {
    const logs = await fetchAuditLogs();
    setAuditLogs(logs);
  };

  const loadDestructions = async () => {
    const destr = await fetchDestructions();
    setDestructions(destr);
  };

  React.useEffect(() => {
    if (activeTab === 'audit') loadAuditLogs();
    if (activeTab === 'destructions') loadDestructions();
  }, [activeTab]);

  const handleExport = async () => {
    try {
      await exportTable(selectedTable || 'all');
      showToast('success', `Export de « ${selectedTable || 'toutes les tables'} » réussi.`);
    } catch (err: any) {
      showToast('error', `Échec de l'export: ${err.message}`);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const result = await importTable(file, selectedTable || 'document');
      setImportResult(result);
      showToast('success', `Import: ${result.inserted} ligne(s) insérée(s), ${result.errors} erreur(s).`);
    } catch (err: any) {
      showToast('error', `Échec de l'import: ${err.message}`);
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleToggle = async (cle: string, valeur: boolean) => {
    await updateFlag(cle, valeur);
    showToast('success', `Paramètre "${cle}" mis à jour.`);
  };

  return (
    <div>
      <div className="page-title">
        <div>
          Administration
          <div className="page-title-secondary">Activez ou désactivez les fonctionnalités de l'application</div>
        </div>
        {onBack && (
          <button onClick={onBack} className="btn btn-ghost" type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Retour
          </button>
        )}
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h2>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}>
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Import / Export Excel
          </h2>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label className="form-label" htmlFor="table-select">Table</label>
              <select
                id="table-select"
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="form-select"
                style={{ minWidth: '200px' }}
              >
                <option value="">-- Sélectionner --</option>
                <option value="all">Toutes les tables</option>
                {tables.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleExport}
              className="btn btn-primary"
              type="button"
              disabled={!selectedTable}
              title="Exporter la table sélectionnée en Excel"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Exporter
            </button>
            <label className="btn btn-ghost" style={{ cursor: 'pointer' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Importer
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImport}
                style={{ display: 'none' }}
                disabled={!selectedTable || selectedTable === 'all' || importing}
              />
            </label>
          </div>
          {importing && (
            <div style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Import en cours, veuillez patienter...
            </div>
          )}
          {importResult && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--border-light)', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}>
              <strong>Résultat de l'import:</strong>
              <ul style={{ margin: '0.5rem 0 0 1rem', padding: 0 }}>
                <li>Table: <strong>{importResult.table}</strong></li>
                <li>Lignes insérées: <strong>{importResult.inserted}</strong></li>
                <li>Erreurs: <strong>{importResult.errors}</strong></li>
                <li>Total fichier: <strong>{importResult.totalRows}</strong></li>
              </ul>
              {importResult.errorDetails && importResult.errorDetails.length > 0 && (
                <details style={{ marginTop: '0.75rem' }}>
                  <summary style={{ cursor: 'pointer', color: 'var(--danger)', fontWeight: 500 }}>Détails des erreurs</summary>
                  <ul style={{ margin: '0.5rem 0 0 1rem', padding: 0, color: 'var(--danger)', fontSize: '0.8125rem' }}>
                    {importResult.errorDetails.map((err: string, idx: number) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>
      </div>

<div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header" style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setActiveTab('features')} className={`btn ${activeTab === 'features' ? 'btn-primary' : 'btn-ghost'}`} type="button" style={{ fontSize: '0.875rem', padding: '0.4rem 0.75rem' }}>
            Fonctionnalités
          </button>
          <button onClick={() => setActiveTab('audit')} className={`btn ${activeTab === 'audit' ? 'btn-primary' : 'btn-ghost'}`} type="button" style={{ fontSize: '0.875rem', padding: '0.4rem 0.75rem' }}>
            Journal d'audit
          </button>
          <button onClick={() => setActiveTab('destructions')} className={`btn ${activeTab === 'destructions' ? 'btn-primary' : 'btn-ghost'}`} type="button" style={{ fontSize: '0.875rem', padding: '0.4rem 0.75rem' }}>
            Destructions
          </button>
        </div>
      </div>

      {activeTab === 'features' && (
        <div className="card">
          <div className="card-header">
            <h2>Fonctionnalités</h2>
          </div>
          <div className="card-body">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                Chargement...
              </div>
            ) : flags.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-title">Aucune fonctionnalité configurable</p>
              </div>
            ) : (
              flags.map((flag) => (
                <ToggleRow key={flag.cle} flag={flag} onToggle={handleToggle} />
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="card">
          <div className="card-header">
            <h2>Journal d'audit</h2>
          </div>
          <div className="card-body">
            {auditLogs.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-title">Aucun événement enregistré</p>
              </div>
            ) : (
              <table className="documents-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Table</th>
                    <th>Action</th>
                    <th>Utilisateur</th>
                    <th style={{ textAlign: 'right' }}>ID</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(log => (
                    <tr key={log.id}>
                      <td className="text-secondary">{new Date(log.created_at).toLocaleString()}</td>
                      <td>{log.table_name}</td>
                      <td><span className={`badge badge-${log.action.toLowerCase()}`}>{log.action}</span></td>
                      <td>{log.user_email || '—'}</td>
                      <td style={{ textAlign: 'right' }}>{log.record_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeTab === 'destructions' && (
        <div className="card">
          <div className="card-header">
            <h2>Suivi des destructions</h2>
          </div>
          <div className="card-body">
            {destructions.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-title">Aucun document détruit</p>
              </div>
            ) : (
              <table className="documents-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Document</th>
                    <th>Détruit par</th>
                    <th>Méthode</th>
                    <th>Témoignage</th>
                  </tr>
                </thead>
                <tbody>
                  {destructions.map(d => (
                    <tr key={d.id}>
                      <td className="text-secondary">{d.destruction_date}</td>
                      <td>{d.document_codification || d.document_titre}</td>
                      <td>{d.destroyed_by}</td>
                      <td>{d.method || '—'}</td>
                      <td>{d.witness || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
