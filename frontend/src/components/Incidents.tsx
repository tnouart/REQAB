import React, { useEffect, useState } from 'react';
import {
  fetchIncidents, fetchIncidentStats, createIncident, updateIncident, deleteIncident, type IncidentRecord
} from '../services/api';
import { useToast } from '../contexts/ToastContext';

const GRAV_LABELS: Record<string, string> = {
  TF: '🔴 Accident avec arrêt',
  TFP: '🟠 Sans arrêt',
  PA: '🟡 Presqu\'accident',
  TRI: '🔵 Incident mineur',
};

const GRAV_COLOR: Record<string, string> = {
  TF: 'var(--red)',
  TFP: 'var(--orange)',
  PA: 'var(--yellow-d)',
  TRI: 'var(--blue-sst)',
};

const GRAV_CLS: Record<string, string> = {
  TF: 'gb-tf',
  TFP: 'gb-tfp',
  PA: 'gb-pa',
  TRI: 'gb-tri',
};

const INC_STATUT_CLS: Record<string, string> = {
  OUVERT: 'is-ouvert',
  EN_COURS: 'is-cours',
  CLOS: 'is-clos',
};

const INC_STATUT_LBL: Record<string, string> = {
  OUVERT: '● Ouvert',
  EN_COURS: '◐ En cours',
  CLOS: '✓ Clos',
};

interface ExtendedIncident {
  id: number;
  reference: string;
  description: string;
  gravite: string;
  zone: string;
  statut: string;
  date: string;
  type?: string;
  checks?: { label: string; ok: boolean }[];
  causes?: { immediate: string; contrib: string; racine: string };
  actions?: { label: string; done: boolean }[];
}

const Incidents: React.FC = () => {
  const { showToast } = useToast();
  const [incidents, setIncidents] = useState<ExtendedIncident[]>([]);
  const [stats, setStats] = useState({ tf: 0, tfp: 0, pa: 0, tri: 0, tf_taux: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<ExtendedIncident | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    reference: '',
    description: '',
    gravite: 'PA',
    zone: '',
    statut: 'OUVERT',
    date: '',
    type: 'incident',
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [incidentsData, statsData] = await Promise.all([fetchIncidents(), fetchIncidentStats()]);
    const normalized = incidentsData.map((i: any) => ({
      ...i,
      checks: Array.isArray(i.checks) ? i.checks : (() => { try { return JSON.parse(i.checks || '[]'); } catch { return []; } })(),
      causes: i.causes || { immediate: '', contrib: '', racine: '' },
      actions: Array.isArray(i.actions) ? i.actions : (() => { try { return JSON.parse(i.actions || '[]'); } catch { return []; } })(),
    }));
    setIncidents(normalized);
    setStats(statsData);
    setLoading(false);
  };

  const fmtDateShort = (s: string) => {
    const [y, m, d] = s.split('-');
    return `${d}/${m}`;
  };

  const fmtDateFull = (s: string) => {
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
  };

  const handleCreate = async () => {
    if (!form.description || !form.zone || !form.date) return;
    const payload: any = {
      ...form,
      causes: { immediate: '', contrib: '', racine: '' },
      actions: [],
    };
    const result = await createIncident(payload);
    if (result) {
      showToast('success', `Incident ${result.reference} déclaré ✓`);
      setShowForm(false);
      setForm({ reference: '', description: '', gravite: 'PA', zone: '', statut: 'OUVERT', date: '', type: 'incident' });
      loadData();
    }
  };

  const handleActionToggle = async (incident: ExtendedIncident, index: number) => {
    if (!incident || !Array.isArray(incident.actions) || index < 0 || index >= incident.actions.length) return;
    const newActions = incident.actions.map((a, i) => i === index ? { ...a, done: !a.done } : a);
    const updated = await updateIncident(incident.id, { actions: newActions } as any);
    if (updated) {
      const normalized = {
        ...updated,
        causes: (updated as any).causes || { immediate: '', contrib: '', racine: '' },
        actions: Array.isArray((updated as any).actions) ? (updated as any).actions : [],
      };
      setSelectedIncident(normalized);
      setIncidents(prev => prev.map(i => i.id === updated.id ? normalized : i));
    }
  };

  const handleCloseIncident = async () => {
    if (!selectedIncident) return;
    const updated = await updateIncident(selectedIncident.id, { statut: 'CLOS' });
    if (updated) {
      showToast('success', `${selectedIncident.reference} clôturé ✓`);
      setSelectedIncident(null);
      loadData();
    }
  };

  const handleDelete = async (incident: ExtendedIncident) => {
    if (!incident || !confirm(`Supprimer ${incident.reference} ?`)) return;
    await deleteIncident(incident.id);
    showToast('success', `${incident.reference} supprimé`);
    setSelectedIncident(null);
    loadData();
  };

  const renderTimeline = () => {
    const sorted = [...incidents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (sorted.length === 0) return <div style={{ padding: 24, color: 'var(--light)', textAlign: 'center', fontSize: 12 }}>Aucun incident à afficher</div>;

    const dates = sorted.map(i => new Date(i.date).getTime());
    const min = Math.min(...dates);
    const max = Math.max(...dates);
    const range = max - min || 1;
    const w = 900;
    const margin = 40;

    return (
      <div className="inc-timeline-track">
        <div className="inc-timeline-line" style={{ left: margin, right: margin }}></div>
        {sorted.map(inc => {
          const t = (new Date(inc.date).getTime() - min) / range;
          const x = margin + t * (w - 2 * margin);
          return (
            <div key={inc.id} className="inc-tl-point" style={{ left: x }} onClick={() => setSelectedIncident(inc)}>
              <div className="inc-tl-dot" style={{ background: GRAV_COLOR[inc.gravite] || 'var(--red)' }}></div>
              <div className="inc-tl-label">{inc.reference.split('-')[2]}</div>
              <div className="inc-tl-date">{fmtDateShort(inc.date)}</div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) return <div className="detail-pane"><p>Chargement…</p></div>;

  return (
    <div className="detail-pane" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="page-header">
        <div className="ph-icon" style={{ background: 'var(--red-l)' }}>🚑</div>
        <div>
          <div className="ph-title">Incidents et accidents du travail</div>
          <div className="ph-sub">ISO 45001:2018 §10.2 — Déclaration, investigation et actions correctives</div>
        </div>
        <button className="btn btn-ghost btn-sm">⬇ Exporter</button>
        <button className="btn btn-p btn-sm" onClick={() => setShowForm(true)}>+ Déclarer un événement</button>
      </div>

      <div className="scroll-body">
        <div className="inc-stats">
          <div className="inc-stat tf">
            <div className="inc-stat-lbl">Accidents avec arrêt (TF)</div>
            <div className="inc-stat-val">{stats.tf}</div>
            <div className="inc-stat-sub">Depuis janvier 2025</div>
          </div>
          <div className="inc-stat tfp">
            <div className="inc-stat-lbl">Sans arrêt (TFP)</div>
            <div className="inc-stat-val">{stats.tfp}</div>
            <div className="inc-stat-sub">Soins médicaux simples</div>
          </div>
          <div className="inc-stat pa">
            <div className="inc-stat-lbl">Presqu'accidents</div>
            <div className="inc-stat-val">{stats.pa}</div>
            <div className="inc-stat-sub">Signalements proactifs</div>
          </div>
          <div className="inc-stat tri">
            <div className="inc-stat-lbl">Taux de fréquence (Tf)</div>
            <div className="inc-stat-val">{stats.tf_taux}</div>
            <div className="inc-stat-sub">Objectif : &lt; 5.0</div>
          </div>
        </div>

        <div className="inc-timeline-card">
          <div className="inc-timeline-head">
            <span style={{ fontSize: 14 }}>📅</span>
            <div className="inc-timeline-title">Chronologie des événements — 6 derniers mois</div>
          </div>
          <div className="inc-timeline-scroll">
            {renderTimeline()}
          </div>
        </div>

        <div className="inc-split">
          <div className="inc-list-card">
            <div className="inc-list-head">
              <span style={{ fontSize: 14 }}>📋</span>
              <div style={{ fontSize: 12, fontWeight: 800, flex: 1 }}>Registre des événements — {incidents.length} fiches actives</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="inc-table">
                <thead>
                  <tr>
                    <th>Réf.</th>
                    <th>Description</th>
                    <th>Gravité</th>
                    <th>Zone</th>
                    <th>Statut</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 30, color: 'var(--light)' }}>Aucun incident</td></tr>
                  ) : incidents.map(inc => (
                    <tr key={inc.id} className={selectedIncident?.id === inc.id ? 'sel' : ''} onClick={() => setSelectedIncident(inc)}>
                      <td><span style={{ fontFamily: 'var(--font-code)', fontSize: 10, color: 'var(--muted)' }}>{inc.reference}</span></td>
                      <td style={{ maxWidth: 220 }}><div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>{inc.description}</div></td>
                      <td><span className={`grav-badge ${GRAV_CLS[inc.gravite] || 'gb-pa'}`}>{GRAV_LABELS[inc.gravite] || inc.gravite}</span></td>
                      <td style={{ color: 'var(--muted)' }}>{inc.zone}</td>
                      <td><span className={`inc-status ${INC_STATUT_CLS[inc.statut] || 'is-ouvert'}`}>{INC_STATUT_LBL[inc.statut] || '● Ouvert'}</span></td>
                      <td style={{ fontSize: 10.5, color: 'var(--muted)' }}>{fmtDateFull(inc.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="inc-detail-card">
            {selectedIncident ? (
              <>
                <div style={{ padding: 16, flex: 'none' }}>
                  <div className="inc-detail-stripe" style={{ background: GRAV_COLOR[selectedIncident.gravite] || 'var(--red)' }}></div>
                  <div style={{ fontFamily: 'var(--font-code)', fontSize: 10, color: 'var(--muted)', marginBottom: 5 }}>{selectedIncident.reference}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, lineHeight: 1.35, marginBottom: 8 }}>{selectedIncident.description}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span className={`grav-badge ${GRAV_CLS[selectedIncident.gravite] || 'gb-pa'}`}>{GRAV_LABELS[selectedIncident.gravite]}</span>
                    <span className={`inc-status ${INC_STATUT_CLS[selectedIncident.statut]}`}>{INC_STATUT_LBL[selectedIncident.statut]}</span>
                  </div>
                </div>
                <div className="inc-detail-body" style={{ padding: '0 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, padding: '8px 0', borderBottom: '1px solid var(--surf2)', marginBottom: 10 }}>
                    <span style={{ color: 'var(--muted)' }}>Zone</span>
                    <span style={{ fontWeight: 600 }}>{selectedIncident.zone}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, padding: '0 0 12px', borderBottom: '1px solid var(--surf2)', marginBottom: 12 }}>
                    <span style={{ color: 'var(--muted)' }}>Date</span>
                    <span style={{ fontWeight: 600 }}>{fmtDateFull(selectedIncident.date)}</span>
                  </div>

                  <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.7px', color: 'var(--muted)', marginBottom: 8 }}>🌳 Arbre des causes</div>
                  <div className="cause-tree">
                    {selectedIncident.causes && (
                      <>
                        <div className="cause-box root">Cause racine : {selectedIncident.causes.racine}</div>
                        <div className="cause-level">
                          <div className="cause-connector" style={{ width: 20, flexShrink: 0, display: 'flex', justifyContent: 'center', position: 'relative', top: 2 }}></div>
                          <div className="cause-box">Cause contributive : {selectedIncident.causes.contrib}</div>
                        </div>
                        <div className="cause-level">
                          <div className="cause-connector" style={{ width: 20, flexShrink: 0, display: 'flex', justifyContent: 'center', position: 'relative', top: 2 }}></div>
                          <div className="cause-box">Cause immédiate : {selectedIncident.causes.immediate}</div>
                        </div>
                      </>
                    )}
                  </div>

                  <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.7px', color: 'var(--muted)', margin: '14px 0 8px' }}>
                    ✅ Actions correctives — {selectedIncident.actions?.filter(a => a.done).length || 0}/{selectedIncident.actions?.length || 0}
                  </div>
                  {selectedIncident.actions?.map((a, i) => (
                    <div key={i} className={`corr-action ${a.done ? 'done' : ''}`} onClick={() => handleActionToggle(selectedIncident, i)} style={{ cursor: 'pointer' }}>
                      <div className="corr-check" style={{ width: 16, height: 16, borderRadius: 4, borderWidth: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, flexShrink: 0, borderColor: a.done ? 'var(--teal)' : 'var(--bdr)', background: a.done ? 'var(--teal)' : 'transparent', color: a.done ? '#fff' : 'transparent' }}>
                        {a.done ? '✓' : ''}
                      </div>
                      <div style={{ flex: 1 }}>{a.label}</div>
                    </div>
                  ))}

                  {selectedIncident.statut !== 'CLOS' && (
                    <button className="btn btn-p" style={{ width: '100%', marginTop: 14, background: 'var(--orange)' }} onClick={handleCloseIncident}>
                      ✓ Clôturer l'événement
                    </button>
                  )}

                  <button className="btn btn-ghost btn-sm" style={{ marginTop: 8, width: '100%' }} onClick={() => handleDelete(selectedIncident)}>🗑 Supprimer</button>
                </div>
              </>
            ) : (
              <div style={{ padding: 24, color: 'var(--light)', textAlign: 'center', fontSize: 12 }}>
                Sélectionnez un incident pour voir les détails
              </div>
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: 'var(--white)', borderRadius: 14, padding: 24, width: 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--sh3)' }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Nouveau incident</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 18 }}>Déclarer un événement QHSE.</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-field">
                <label>Gravité</label>
                <select value={form.gravite} onChange={e => setForm({ ...form, gravite: e.target.value })}>
                  <option value="PA">🟡 Presqu'accident</option>
                  <option value="TFP">🟠 Sans arrêt</option>
                  <option value="TF">🔴 Accident avec arrêt</option>
                </select>
              </div>
              <div className="form-field">
                <label>Zone</label>
                <input value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })} placeholder="Zone / Installation" />
              </div>
              <div className="form-field" style={{ gridColumn: '1/-1' }}>
                <label>Description <span style={{ color: 'var(--danger)' }}>•</span></label>
                <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-field">
                <label>Date <span style={{ color: 'var(--danger)' }}>•</span></label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Annuler</button>
              <button className="btn btn-p btn-sm" onClick={handleCreate}>+ Déclarer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Incidents;