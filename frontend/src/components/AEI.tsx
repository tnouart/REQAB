import React, { useEffect, useState } from 'react';
import { fetchAEI, fetchAEIStats, createAEI, updateAEI, deleteAEI, fetchProcessus, type AEIRecord } from '../services/api';
import { useToast } from '../contexts/ToastContext';

const IMPACT_CLASSES: Record<string, string> = {
  'Eau': 'it-eau',
  'Air': 'it-air',
  'Sol': 'it-sol',
  'Déchets': 'it-dechets',
  'Énergie': 'it-energie',
};

const CRIT_LABELS = ['Minime', 'Mineur', 'Modéré', 'Majeur', 'Critique'];

const AEI: React.FC = () => {
  const { showToast } = useToast();
  const [aspects, setAspects] = useState<AEIRecord[]>([]);
  const [stats, setStats] = useState({ significatifs: 0, nonsignificatifs: 0, urgence: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedAspect, setSelectedAspect] = useState<AEIRecord | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    activite: '',
    aspect: '',
    impact: 'Eau',
    condition: 'Situation normale',
    criticite: 3,
    significatif: true,
    processus: 'General',
  });

  const [processusList, setProcessusList] = useState<{ id: number; label: string }[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [aspectsData, statsData, processusData] = await Promise.all([fetchAEI(), fetchAEIStats(), fetchProcessus()]);
    const normalized = aspectsData.map((a: any) => ({
      ...a,
      checks: Array.isArray(a.checks) ? a.checks : (() => { try { return JSON.parse(a.checks || '[]'); } catch { return []; } })(),
    }));
    setAspects(normalized);
    setStats(statsData);
    setProcessusList(processusData);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.activite.trim() || !form.aspect.trim()) {
      showToast('warning', 'Activité et aspect sont obligatoires.');
      return;
    }
    const payload: Partial<AEIRecord> = {
      ...form,
      reference: `AEI-${String(aspects.length + 1).padStart(3, '0')}`,
      checks: [],
    };
    const result = await createAEI(payload);
    if (result) {
      showToast('success', `Aspect ${result.reference} créé ✓`);
      setShowForm(false);
      setForm({ activite: '', aspect: '', impact: 'Eau', condition: 'Situation normale', criticite: 3, significatif: true, processus: 'General' });
      loadData();
    }
  };

  const handleCheckToggle = async (aspect: AEIRecord, index: number) => {
    if (!aspect || !Array.isArray(aspect.checks) || index < 0 || index >= aspect.checks.length) return;
    const newChecks = aspect.checks.map((c, i) => i === index ? { ...c, ok: !c.ok } : c);
    const updated = await updateAEI(aspect.id, { checks: newChecks });
    if (updated) {
      setSelectedAspect(updated);
      setAspects(prev => prev.map(a => a.id === updated.id ? updated : a));
    }
  };

  const handleDelete = async (aspect: AEIRecord) => {
    if (!confirm(`Supprimer ${aspect.reference} ?`)) return;
    await deleteAEI(aspect.id);
    showToast('success', `${aspect.reference} supprimé`);
    setSelectedAspect(null);
    loadData();
  };

  if (loading) return <div className="detail-pane"><p>Chargement…</p></div>;

  const critColor = (v: number) => {
    if (v >= 5) return 'crit-very-high';
    if (v >= 4) return 'crit-high';
    if (v >= 3) return 'crit-med';
    return 'crit-low';
  };

  return (
    <div className="detail-pane" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="page-header">
        <div className="ph-icon" style={{ background: '#F0FAE8' }}>🌿</div>
        <div>
          <div className="ph-title">Aspects et impacts environnementaux (AEI)</div>
          <div className="ph-sub">ISO 14001:2015 §6.1.2 — Registre des aspects significatifs · Conformité réglementaire §9.1.2</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-sm">⬇ Exporter</button>
          <button className="btn btn-p btn-sm" onClick={() => setShowForm(true)}>+ Ajouter un aspect</button>
        </div>
      </div>

      <div className="scroll-body">
        {/* KPIs */}
        <div className="env-kpis">
          <div className="env-kpi water">
            <div className="env-kpi-icon">💧</div>
            <div className="env-kpi-lbl">Consommation eau</div>
            <div className="env-kpi-val" style={{ color: 'var(--blue-sst)' }}>4 820</div>
            <div className="env-kpi-sub">m³ · S1 2025</div>
            <div className="env-kpi-trend trend-good">↓ -8%</div>
          </div>
          <div className="env-kpi energy">
            <div className="env-kpi-icon">⚡</div>
            <div className="env-kpi-lbl">Énergie consommée</div>
            <div className="env-kpi-val" style={{ color: 'var(--yellow-d)' }}>12 340</div>
            <div className="env-kpi-sub">MWh · S1 2025</div>
            <div className="env-kpi-trend trend-bad">↑ +3%</div>
          </div>
          <div className="env-kpi waste">
            <div className="env-kpi-icon">♻️</div>
            <div className="env-kpi-lbl">Déchets produits</div>
            <div className="env-kpi-val" style={{ color: 'var(--orange-d)' }}>287</div>
            <div className="env-kpi-sub">tonnes · S1 2025</div>
            <div className="env-kpi-trend trend-good">↓ -12%</div>
          </div>
          <div className="env-kpi emission">
            <div className="env-kpi-icon">💨</div>
            <div className="env-kpi-lbl">Émissions CO₂eq</div>
            <div className="env-kpi-val" style={{ color: 'var(--muted)' }}>6 180</div>
            <div className="env-kpi-sub">t·CO₂eq · S1 2025</div>
            <div className="env-kpi-trend trend-bad">↑ +1%</div>
          </div>
        </div>

        <div className="aie-layout">
          {/* Table AEI */}
          <div className="aie-card">
            <div className="aie-head">
              <span style={{ fontSize: 14 }}>📋</span>
              <div className="aie-head-title">Registre des aspects environnementaux — {aspects.length} aspects identifiés</div>
              <select style={{ fontSize: 11, background: 'var(--surf)', border: '1px solid var(--bdr)', borderRadius: 6, padding: '4px 8px', outline: 'none' }}>
                <option>Tous</option>
                <option>Significatifs uniquement</option>
                <option>Situation normale</option>
                <option>Situation d'urgence</option>
              </select>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="aie-table">
                <thead>
                  <tr>
                    <th>Réf.</th>
                    <th>Activité / Source</th>
                    <th>Aspect</th>
                    <th>Impact</th>
                    <th>Condition</th>
                    <th>Criticité</th>
                    <th>Significatif</th>
                  </tr>
                </thead>
                <tbody>
                  {aspects.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 30, color: 'var(--light)' }}>Aucun aspect</td></tr>
                  ) : aspects.map(a => (
                    <tr key={a.id} className={selectedAspect?.id === a.id ? 'selected' : ''} onClick={() => setSelectedAspect(a)} style={{ cursor: 'pointer' }}>
                      <td><span style={{ fontFamily: 'var(--font-code)', fontSize: 10, color: 'var(--muted)' }}>{a.reference}</span></td>
                      <td style={{ fontWeight: 600, maxWidth: 180 }}>{a.activite}</td>
                      <td style={{ fontWeight: 600 }}>{a.aspect}</td>
                      <td><span className={`impact-tag ${IMPACT_CLASSES[a.impact] || ''}`}>{a.impact}</span></td>
                      <td style={{ maxWidth: 140 }}>{a.condition}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="criticite-bar-wrap">
                            <div className={`criticite-bar ${critColor(a.criticite)}`} style={{ width: `${a.criticite * 20}%` }}></div>
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 700 }}>{a.criticite}/5</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>{a.significatif ? '✅' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Panneau conformité réglementaire */}
          <div className="regl-card">
            <div className="regl-head">
              <div className="regl-head-title">⚖️ Veille réglementaire</div>
              <div className="regl-head-sub">ISO 14001 §9.1.2 — Évaluation de la conformité</div>
            </div>
            <div>
              <div className="regl-item">
                <div className="regl-status rs-conf"></div>
                <div className="regl-content">
                  <div className="regl-ref">Décret n° 2024-1234</div>
                  <div className="regl-name">Gestion des déchets industriels</div>
                  <div className="regl-echeance">Échéance : 15/09/2025</div>
                </div>
              </div>
              <div className="regl-item">
                <div className="regl-status rs-alert"></div>
                <div className="regl-content">
                  <div className="regl-ref">Arrêté ministériel 2025-089</div>
                  <div className="regl-name">Limites rejets atmosphériques</div>
                  <div className="regl-echeance">Évaluation en cours</div>
                </div>
              </div>
              <div className="regl-item">
                <div className="regl-status rs-conf"></div>
                <div className="regl-content">
                  <div className="regl-ref">Norme ISO 14001:2015</div>
                  <div className="regl-name">Exigences système de management</div>
                  <div className="regl-echeance">Audit de suivi : 12/2025</div>
                </div>
              </div>
              <div className="regl-item">
                <div className="regl-status rs-nc"></div>
                <div className="regl-content">
                  <div className="regl-ref">Circulaire DGEP 2025-07</div>
                  <div className="regl-name">Plan de gestion des eaux usées</div>
                  <div className="regl-echeance">Non conforme — action requise</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: 'var(--white)', borderRadius: 14, padding: 24, width: 640, maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--sh3)' }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Nouvel aspect environnemental</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 18 }}>Ajouter un aspect au registre AEI.</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-field form-full">
                <label>Activité <span style={{ color: 'var(--danger)' }}>•</span></label>
                <input value={form.activite} onChange={(e) => setForm({ ...form, activite: e.target.value })} placeholder="ex: Forage puits P-14" />
              </div>
              <div className="form-field form-full">
                <label>Aspect <span style={{ color: 'var(--danger)' }}>•</span></label>
                <input value={form.aspect} onChange={(e) => setForm({ ...form, aspect: e.target.value })} placeholder="ex: Rejet d'hydrocarbures" />
              </div>
              <div className="form-field">
                <label>Impact</label>
                <select value={form.impact} onChange={(e) => setForm({ ...form, impact: e.target.value })}>
                  <option value="Eau">Eau</option>
                  <option value="Air">Air</option>
                  <option value="Sol">Sol</option>
                  <option value="Déchets">Déchets</option>
                  <option value="Énergie">Énergie</option>
                </select>
              </div>
              <div className="form-field">
                <label>Condition</label>
                <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
                  <option value="Situation normale">Situation normale</option>
                  <option value="Situation d'urgence">Situation d'urgence</option>
                </select>
              </div>
              <div className="form-field">
                <label>Criticité</label>
                <select value={String(form.criticite)} onChange={(e) => setForm({ ...form, criticite: Number(e.target.value) })}>
                  {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v} - {CRIT_LABELS[v - 1]}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label>Processus</label>
                <select value={form.processus} onChange={(e) => setForm({ ...form, processus: e.target.value })}>
                  <option value="">-- Sélectionner --</option>
                  {processusList.map(p => <option key={p.id} value={p.label}>{p.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowForm(false); setForm({ activite: '', aspect: '', impact: 'Eau', condition: 'Situation normale', criticite: 3, significatif: true, processus: 'General' }); }}>Annuler</button>
              <button className="btn btn-p btn-sm" onClick={handleCreate}>+ Créer l'aspect</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AEI;
