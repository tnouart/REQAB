import React, { useEffect, useState } from 'react';
import {
  fetchConformites, createConformite, updateConformite, deleteConformite, type ConformiteRecord
} from '../services/api';
import { useToast } from '../contexts/ToastContext';

const DOM_CLS: Record<string, string> = {
  env: 'dom-env',
  sst: 'dom-sst',
  qual: 'dom-qual',
};

const DOM_LBL: Record<string, string> = {
  env: '🌿 Environnement',
  sst: '⚠️ SST',
  qual: '📋 Qualité',
};

const CONF_CLS: Record<string, string> = {
  conf: 'csp-conf',
  alert: 'csp-alert',
  nc: 'csp-nc',
  eval: 'csp-eval',
};

const CONF_LBL: Record<string, string> = {
  conf: '✓ Conforme',
  alert: '⚠️ À réévaluer',
  nc: '✕ Non conforme',
  eval: '◐ En évaluation',
};

const ConformiteLegale: React.FC = () => {
  const { showToast } = useToast();
  const [conformites, setConformites] = useState<ConformiteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDomaine, setFilterDomaine] = useState<string>('all');

  const [showForm, setShowForm] = useState(false);
  const [formReference, setFormReference] = useState('');
  const [formDomaine, setFormDomaine] = useState('sst');
  const [formIntitule, setFormIntitule] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchConformites();
    setConformites(data);
    setLoading(false);
  };

  const fmtDate = (s: string) => {
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
  };

  const handleCreate = async () => {
    if (!formReference || !formIntitule) {
      showToast('warning', 'Référence et intitulé sont obligatoires.');
      return;
    }
    const payload = {
      reference: formReference,
      domaine: formDomaine,
      intitule: formIntitule,
      derniere_evaluation: new Date().toISOString().split('T')[0],
      prochaine_echeance: '',
      statut: 'eval',
    };
    const result = await createConformite(payload);
    if (result) {
      showToast('success', `Texte ${result.reference} ajouté ✓`);
      setShowForm(false);
      setFormReference('');
      setFormDomaine('sst');
      setFormIntitule('');
      loadData();
    }
  };

  const handleDelete = async (item: ConformiteRecord) => {
    if (!confirm(`Supprimer ${item.reference} ?`)) return;
    await deleteConformite(item.id);
    showToast('success', `${item.reference} supprimé`);
    loadData();
  };

  const renderCycleSteps = () => {
    const steps = [
      { ic: '🔍', lbl: 'Identification', count: '18 textes suivis', state: 'done' as const },
      { ic: '📊', lbl: 'Évaluation', count: '1 en cours', state: 'active' as const },
      { ic: '✅', lbl: 'Mise en conformité', count: '15 conformes', state: 'done' as const },
      { ic: '⚠️', lbl: 'Traitement écarts', count: '1 non conforme', state: 'todo' as const },
      { ic: '🔄', lbl: 'Suivi continu', count: 'Révision annuelle', state: 'todo' as const },
    ];

    return (
      <div className="cycle-steps">
        {steps.map((s, i) => (
          <div key={i} className={`cycle-step ${s.state === 'done' ? 'done' : s.state === 'active' ? 'active' : ''}`}>
            <div className="cycle-dot">{s.ic}</div>
            <div className="cycle-label">{s.lbl}</div>
            <div className="cycle-count">{s.count}</div>
          </div>
        ))}
      </div>
    );
  };

  const filtered = filterDomaine === 'all' ? conformites : conformites.filter(c => c.domaine === filterDomaine);

  if (loading) return <div className="detail-pane"><p>Chargement…</p></div>;

  return (
    <div className="detail-pane" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="page-header">
        <div className="ph-icon" style={{ background: '#F0E6FF' }}>⚖️</div>
        <div>
          <div className="ph-title">Conformité légale et réglementaire</div>
          <div className="ph-sub">ISO 9001 §? · 14001 §9.1.2 · 45001 §9.1.2 — Évaluation de la conformité aux obligations légales</div>
        </div>
        <button className="btn btn-ghost btn-sm">⬇ Exporter</button>
        <button className="btn btn-p btn-sm" onClick={() => setShowForm(true)}>+ Ajouter un texte</button>
      </div>

      <div className="scroll-body">
        <div className="cl-cycle-card">
          <div className="cl-cycle-head">
            <div className="cl-cycle-title">🔄 Cycle de veille réglementaire</div>
            <div className="cl-cycle-sub">Processus de gestion de la conformité légale — de l'identification au suivi</div>
          </div>
          {renderCycleSteps()}
        </div>

        <div className="cl-table-card">
          <div className="cl-table-head">
            <span style={{ fontSize: 14 }}>📜</span>
            <div className="cl-table-title">Registre des obligations légales — {filtered.length} textes suivis</div>
            <select value={filterDomaine} onChange={e => setFilterDomaine(e.target.value)} style={{ fontSize: 11, background: 'var(--surf)', border: '1px solid var(--bdr)', borderRadius: 6, padding: '4px 8px', outline: 'none' }}>
              <option value="all">Tous les domaines</option>
              <option value="env">Environnement</option>
              <option value="sst">Santé-Sécurité</option>
              <option value="qual">Qualité</option>
            </select>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="cl-table">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Domaine</th>
                  <th>Intitulé</th>
                  <th>Dernière évaluation</th>
                  <th>Prochaine échéance</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 30, color: 'var(--light)' }}>Aucune obligation légale</td></tr>
                ) : filtered.map(c => (
                  <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => showToast('info', `Fiche ${c.reference} sélectionnée`)}>
                    <td><span style={{ fontFamily: 'var(--font-code)', fontSize: 10.5, color: 'var(--ink)' }}>{c.reference}</span></td>
                    <td><span className={`dom-badge ${DOM_CLS[c.domaine] || 'dom-sst'}`}>{DOM_LBL[c.domaine] || '⚠️ SST'}</span></td>
                    <td style={{ fontWeight: 500, maxWidth: 220 }}>{c.intitule}</td>
                    <td style={{ color: 'var(--muted)', fontSize: 11 }}>{fmtDate(c.derniere_evaluation)}</td>
                    <td style={{ color: 'var(--muted)', fontSize: 11 }}>{fmtDate(c.prochaine_echeance)}</td>
                    <td><span className={`conf-status-pill ${CONF_CLS[c.statut] || 'csp-eval'}`}>{CONF_LBL[c.statut] || '◐ En évaluation'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: 'var(--white)', borderRadius: 14, padding: 24, width: 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--sh3)' }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Nouveau texte réglementaire</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 18 }}>Ajouter une obligation légale à suivre.</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-field">
                <label>Référence <span style={{ color: 'var(--danger)' }}>•</span></label>
                <input value={formReference} onChange={e => setFormReference(e.target.value)} placeholder="ex: Décret exécutif 06-141" />
              </div>
              <div className="form-field">
                <label>Domaine</label>
                <select value={formDomaine} onChange={e => setFormDomaine(e.target.value)}>
                  <option value="sst">⚠️ SST</option>
                  <option value="env">🌿 Environnement</option>
                  <option value="qual">📋 Qualité</option>
                </select>
              </div>
              <div className="form-field" style={{ gridColumn: '1/-1' }}>
                <label>Intitulé <span style={{ color: 'var(--danger)' }}>•</span></label>
                <textarea rows={3} value={formIntitule} onChange={e => setFormIntitule(e.target.value)} placeholder="Nom complet du texte réglementaire" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Annuler</button>
              <button className="btn btn-p btn-sm" onClick={handleCreate}>+ Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConformiteLegale;