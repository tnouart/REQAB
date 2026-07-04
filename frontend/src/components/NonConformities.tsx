import React, { useEffect, useState } from 'react';
import { fetchNonConformities, createNonConformity, updateNonConformity, fetchNonConformityStats, fetchWorkflowDocuments, createDocumentRevision } from '../services/api';
import { useToast } from '../contexts/ToastContext';

const NonConformities: React.FC = () => {
  const { showToast } = useToast();
  const [ncs, setNcs] = useState<any[]>([]);
  const [filteredNcs, setFilteredNcs] = useState<any[]>([]);
  const [stats, setStats] = useState({ critiques: 0, majeures: 0, mineures: 0, cloturees: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedNC, setSelectedNC] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [filterCriticite, setFilterCriticite] = useState<string>('Toutes');

  const [form, setForm] = useState({
    type_nc: '',
    criticite: '',
    description: '',
    document_id: null as number | null,
    detecte_lors_de: 'Audit interne',
    responsable_traitement: '',
    delai_traitement: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [ncsData, statsData, docsData] = await Promise.all([
      fetchNonConformities(),
      fetchNonConformityStats(),
      fetchWorkflowDocuments()
    ]);
    console.log('[NC] Loaded data:', ncsData.length, 'items');
    setNcs(ncsData);
    setFilteredNcs(ncsData);
    setStats(statsData);
    setDocuments(docsData);
    setLoading(false);
  };

  const formatDate = (s: string | Date | null) => {
    if (!s) return '—';
    const d = typeof s === 'string' ? new Date(s) : s;
    return d.toLocaleDateString('fr-FR');
  };

  const critLabel = (c: string) => ({
    CRITIQUE: '🔴 Critique',
    MAJEURE: '🟠 Majeure',
    MINEURE: '🟡 Mineure'
  }[c] || c);

  const applyFilter = (criticite: string, allNcs: any[]) => {
    if (criticite === 'Toutes') return allNcs;
    return allNcs.filter((nc: any) => nc.criticite === criticite);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFilterCriticite(value);
    setFilteredNcs(applyFilter(value, ncs));
  };

  const statutClass = (s: string) => ({
    OUVERTE: 'ns-ouverte',
    EN_COURS: 'ns-en-cours',
    CLOTUREE: 'ns-cloturee'
  }[s] || '');

  const statutLabel = (s: string) => ({
    OUVERTE: '● Ouverte',
    EN_COURS: '◐ En cours',
    CLOTUREE: '✓ Clôturée'
  }[s] || s);

  const handleCreate = async () => {
    if (!form.criticite || !form.description) return;
    
    const result = await createNonConformity(form);
    if (result) {
      showToast('success', `Non-conformité ${result.numero_nc} créée ✓`);
      setShowModal(false);
      setForm({
        type_nc: '',
        criticite: '',
        description: '',
        document_id: null,
        detecte_lors_de: 'Audit interne',
        responsable_traitement: '',
        delai_traitement: ''
      });
      loadData();
    }
  };

  const handleValidateAction = async (nc: any) => {
    await updateNonConformity(nc.id, { statut: 'CLOTUREE' });
    showToast('success', 'NC clôturée ✓');
    loadData();
  };

  const handleCreateRevision = async () => {
    if (!selectedNC?.document_id) return;
    const result = await createDocumentRevision(selectedNC.document_id, 'Révision corrective suite à NC');
    if (result) {
      showToast('success', `Révision corrective créée pour ${selectedNC.document_code} ✓`);
    }
  };

  if (loading) return <div className="detail-pane"><p>Chargement…</p></div>;

  return (
    <div className="detail-pane">
      <div className="page-header">
        <div className="ph-icon" style={{ background: '#FEF2F2' }}>⚠️</div>
        <div>
          <div className="ph-title">Gestion des non-conformités documentaires</div>
          <div className="ph-sub">Conformité ISO 9001:2015 §10.2 — Identification, traitement et actions correctives</div>
        </div>
        <button className="btn btn-p btn-sm" onClick={() => setShowModal(true)}>+ Déclarer une NC</button>
      </div>

      <div className="scroll-body">
        <div className="nc-stats">
          <div className="nc-stat crit">
            <div className="nc-stat-lbl">Critiques</div>
            <div className="nc-stat-val">{stats.critiques}</div>
            <div className="nc-stat-sub">Action immédiate requise</div>
          </div>
          <div className="nc-stat maj">
            <div className="nc-stat-lbl">Majeures</div>
            <div className="nc-stat-val">{stats.majeures}</div>
            <div className="nc-stat-sub">Délai de traitement dépassé</div>
          </div>
          <div className="nc-stat min">
            <div className="nc-stat-lbl">Mineures</div>
            <div className="nc-stat-val">{stats.mineures}</div>
            <div className="nc-stat-sub">En cours de traitement</div>
          </div>
          <div className="nc-stat clos">
            <div className="nc-stat-lbl">Clôturées</div>
            <div className="nc-stat-val">{stats.cloturees}</div>
            <div className="nc-stat-sub">Depuis 12 mois</div>
          </div>
        </div>

        <div className="nc-split">
          <div className="nc-list-card">
            <div className="nc-list-head">
              <div className="nc-list-head-title">Non-conformités ouvertes</div>
              <select value={filterCriticite} onChange={handleFilterChange} style={{ fontSize: 11, background: 'var(--surf)', border: '1px solid var(--bdr)', borderRadius: 6, padding: '4px 8px', outline: 'none' }}>
                <option value="Toutes">Toutes les criticités</option>
                <option value="CRITIQUE">Critique</option>
                <option value="MAJEURE">Majeure</option>
                <option value="MINEURE">Mineure</option>
              </select>
            </div>
            <table className="nc-table">
              <thead>
                <tr>
                  <th>Réf.</th>
                  <th>Description</th>
                  <th>Criticité</th>
                  <th>Document lié</th>
                  <th>Statut</th>
                  <th>Délai</th>
                </tr>
              </thead>
              <tbody>
                {filteredNcs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                      Aucune non-conformité déclarée
                    </td>
                  </tr>
                ) : (
                  filteredNcs.map((nc: any) => (
                    <tr key={nc.id} className={selectedNC?.id === nc.id ? 'selected' : ''} onClick={() => setSelectedNC(nc)} style={{ cursor: 'pointer' }}>
                      <td><span className="nc-ref">{nc.numero_nc}</span></td>
                      <td style={{ maxWidth: 220 }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {nc.description}
                        </div>
                      </td>
                      <td>
                        <span className={`crit-badge ${nc.criticite === 'CRITIQUE' ? 'cb-crit' : nc.criticite === 'MAJEURE' ? 'cb-maj' : 'cb-min'}`}>
                          {critLabel(nc.criticite)}
                        </span>
                      </td>
                      <td>{nc.document_code ? <span className="doc-code">{nc.document_code}</span> : '—'}</td>
                      <td>
                        <span className={`nc-status ${statutClass(nc.statut)}`}>
                          {statutLabel(nc.statut)}
                        </span>
                      </td>
                      <td>
                        {nc.jours_retard > 0
                          ? <span style={{ color: 'var(--red)', fontWeight: 700 }}>+{nc.jours_retard}j</span>
                          : <span>{formatDate(nc.delai_traitement)}</span>
                        }
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="nc-detail">
            {selectedNC ? (
              <>
                <div className="ncd-head">
                  <div className="ncd-num">{selectedNC.numero_nc}</div>
                  <div className="ncd-title">{selectedNC.description}</div>
                  <div className="ncd-tags">
                    <span className={`crit-badge ${selectedNC.criticite === 'CRITIQUE' ? 'cb-crit' : selectedNC.criticite === 'MAJEURE' ? 'cb-maj' : 'cb-min'}`}>{critLabel(selectedNC.criticite)}</span>
                    <span className={`nc-status ${statutClass(selectedNC.statut)}`}>{statutLabel(selectedNC.statut)}</span>
                  </div>
                </div>

                <div className="ncd-body">
                  <div className="crit-ring-wrap">
                    <div className="countdown-ring">
                      <svg width="64" height="64" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r="28" fill="none" stroke={selectedNC.criticite === 'MAJEURE' ? '#FFF7ED' : selectedNC.criticite === 'CRITIQUE' ? '#FEF2F2' : '#FFFBEB'} strokeWidth="8" />
                        <circle 
                          cx="32" cy="32" r="28" fill="none" 
                          stroke={selectedNC.criticite === 'MAJEURE' ? '#EA580C' : selectedNC.criticite === 'CRITIQUE' ? '#DC2626' : '#D97706'} 
                          strokeWidth="8"
                          strokeDasharray="175.93"
                          strokeDashoffset="70.37"
                          strokeLinecap="round"
                          style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
                        />
                      </svg>
                      <div className="cr-text">
                        <div className="cr-days" style={{ color: selectedNC.criticite === 'MAJEURE' ? '#EA580C' : selectedNC.criticite === 'CRITIQUE' ? '#DC2626' : '#D97706' }}>
                          {selectedNC.criticite === 'CRITIQUE' ? '90%' : selectedNC.criticite === 'MAJEURE' ? '60%' : '35%'}
                        </div>
                        <div className="cr-unit">impact</div>
                      </div>
                    </div>
                    <div className="crit-ring-info">
                      <div className="crit-label" style={{ color: selectedNC.criticite === 'MAJEURE' ? '#EA580C' : selectedNC.criticite === 'CRITIQUE' ? '#DC2626' : '#D97706' }}>
                        {critLabel(selectedNC.criticite)}
                      </div>
                      <div className="crit-desc">
                        Détectée lors d'un {selectedNC.detecte_lors_de?.toLowerCase() || 'contrôle'}<br />
                        Responsable : {selectedNC.responsable_traitement}
                      </div>
                    </div>
                  </div>
                  
                  <div className="ncd-section-title">📄 Document lié</div>
{selectedNC?.document_id ? (
                      <>
                        <div className="doc-link">
                          <span className="doc-link-code">{selectedNC.document_code}</span>
                          <span className="doc-link-title">{selectedNC.document_titre}</span>
                          <span className="doc-link-rev">→</span>
                        </div>
                        <button className="btn btn-p btn-sm" style={{ width: '100%', marginBottom: 10 }} onClick={handleCreateRevision}>
                          🔄 Créer une révision corrective
                        </button>
                      </>
                    ) : <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Aucun document lié</p>}

                  <div className="ncd-section">
                    <div className="ncd-section-title">Informations</div>
                    <div className="ncd-info-row"><span className="ncd-key">Détecté lors de</span><span className="ncd-val">{selectedNC.detecte_lors_de}</span></div>
                    <div className="ncd-info-row"><span className="ncd-key">Responsable</span><span className="ncd-val">{selectedNC.responsable_traitement}</span></div>
                    <div className="ncd-info-row"><span className="ncd-key">Délai de traitement</span><span className="ncd-val" style={selectedNC.jours_retard > 0 ? { color: 'var(--red-d)' } : {}}>{formatDate(selectedNC.delai_traitement)}{selectedNC.jours_retard > 0 ? ` (+${selectedNC.jours_retard}j)` : ''}</span></div>
                  </div>

                  <div>
                    {selectedNC.action_corrective ? (
                      <div className="action-corrective">
                        <div className="ac-title">✅ Action corrective proposée</div>
                        <div className="ac-text">{selectedNC.action_corrective}</div>
                        {selectedNC.statut !== 'CLOTUREE' && (
                          <div className="ac-btn" onClick={() => handleValidateAction(selectedNC)}>✓ Valider cette action →</div>
                        )}
                      </div>
                    ) : (
                      <div className="action-corrective" style={{ background: '#FFFBEB', borderColor: '#FCD34D' }}>
                        <div className="ac-title" style={{ color: '#D97706' }}>⚠️ Action corrective — à définir</div>
                        <div className="ac-text" style={{ color: '#D97706' }}>Aucune action corrective n'a encore été définie pour cette NC.</div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ padding: 20, color: 'var(--text-muted)' }}>Sélectionnez une non-conformité pour voir les détails</div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay open">
          <div className="modal">
            <div className="modal-title">⚠️ Déclarer une non-conformité</div>
            <div className="modal-sub">Cette NC sera liée au document concerné. Une révision corrective peut être créée directement depuis cette fiche.</div>
            <div className="form-grid">
              <div className="form-field">
                <label>Type de NC <span className="required-dot">•</span></label>
                <select value={form.type_nc} onChange={e => setForm({ ...form, type_nc: e.target.value })}>
                  <option value="">Sélectionner…</option>
                  <option>Document obsolète encore utilisé</option>
                  <option>Révision non effectuée à l'échéance</option>
                  <option>Document sans approbation formelle</option>
                  <option>Codification incorrecte</option>
                  <option>Autre</option>
                </select>
              </div>

              <div className="form-field">
                <label>Criticité <span className="required-dot">•</span></label>
                <select value={form.criticite} onChange={e => setForm({ ...form, criticite: e.target.value })}>
                  <option value="">Sélectionner…</option>
                  <option value="CRITIQUE">🔴 Critique — risque immédiat</option>
                  <option value="MAJEURE">🟠 Majeure — impact significatif</option>
                  <option value="MINEURE">🟡 Mineure — écart ponctuel</option>
                </select>
              </div>

              <div className="form-field form-full">
                <label>Description <span className="required-dot">•</span></label>
                <textarea rows={3} placeholder="Décrire la non-conformité…" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>

              <div className="form-field">
                <label>Document concerné</label>
                <select value={form.document_id || ''} onChange={e => setForm({ ...form, document_id: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">— Aucun document —</option>
                  {documents.map(d => (
                    <option key={d.document_id} value={d.document_id}>{d.codification} — {d.titre}</option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>Détecté lors de</label>
                <select value={form.detecte_lors_de} onChange={e => setForm({ ...form, detecte_lors_de: e.target.value })}>
                  <option>Audit interne</option>
                  <option>Revue de direction</option>
                  <option>Contrôle qualité terrain</option>
                  <option>Auto-contrôle</option>
                </select>
              </div>

              <div className="form-field">
                <label>Responsable de traitement</label>
                <input type="text" placeholder="Nom du responsable" value={form.responsable_traitement} onChange={e => setForm({ ...form, responsable_traitement: e.target.value })} />
              </div>

              <div className="form-field">
                <label>Délai de traitement</label>
                <input type="date" value={form.delai_traitement} onChange={e => setForm({ ...form, delai_traitement: e.target.value })} />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-g btn-sm" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn btn-p btn-sm" onClick={handleCreate}>✓ Créer la NC et lier le document →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NonConformities;