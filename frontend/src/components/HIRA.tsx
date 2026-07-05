import React, { useEffect, useState } from 'react';
import { fetchHIRA, fetchHIRAStats, fetchHIRAMatrix, createHIRA, updateHIRA, deleteHIRA, fetchProcessus, type HIRADanger } from '../services/api';
import { useToast } from '../contexts/ToastContext';

const RESIDUEL_CLS: Record<string, string> = {
  Critique: 'rp-crit',
  Élevé: 'rp-elev',
  Modéré: 'rp-mod',
  Faible: 'rp-fai',
  Tolérable: 'rp-tol',
};

const riskClass = (val: number) => {
  if (val >= 20) return 'rc-critique';
  if (val >= 12) return 'rc-eleve';
  if (val >= 6) return 'rc-modere';
  if (val >= 3) return 'rc-faible';
  return 'rc-tolerable';
};

const graviteLabels = ['Insignifiant', 'Mineur', 'Modéré', 'Grave', 'Catastrophique'];
const probaLabels = ['Rare', 'Peu probable', 'Possible', 'Probable', 'Très probable'];

const HIRA: React.FC = () => {
  const { showToast } = useToast();
  const [dangers, setDangers] = useState<HIRADanger[]>([]);
  const [stats, setStats] = useState({ critique: 0, eleve: 0, modere: 0, faible: 0, tolerable: 0, total: 0 });
  const [matrix, setMatrix] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDanger, setSelectedDanger] = useState<HIRADanger | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filterProcess, setFilterProcess] = useState<string>('all');
  const [formProcessus, setFormProcessus] = useState<string>('');
  const [formDanger, setFormDanger] = useState('');
  const [formProba, setFormProba] = useState('2');
  const [formGrav, setFormGrav] = useState('3');
  const [formControle, setFormControle] = useState('');
  const [processusList, setProcessusList] = useState<{ id: number; label: string }[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [dangersData, statsData, matrixData, processusData] = await Promise.all([fetchHIRA(), fetchHIRAStats(), fetchHIRAMatrix(), fetchProcessus()]);
    const normalized = dangersData.map((d: any) => ({
      ...d,
      checks: Array.isArray(d.checks) ? d.checks : (() => { try { return JSON.parse(d.checks || '[]'); } catch { return []; } })(),
    }));
    setDangers(normalized);
    setStats(statsData);
    setMatrix(matrixData);
    setProcessusList(processusData);
    setLoading(false);
  };

  const filtered = filterProcess === 'all' ? dangers : dangers.filter(d => d.processus === filterProcess);

  const handleCreate = async () => {
    if (!formDanger.trim() || !formProcessus) {
      showToast('warning', 'Danger et processus sont obligatoires.');
      return;
    }
    const payload: Partial<HIRADanger> = {
      danger: formDanger.trim(),
      processus: formProcessus,
      probabilite: Number(formProba),
      gravite: Number(formGrav),
      risque_residuel: 'Modéré',
      controle_prioritaire: formControle.trim() || 'À définir',
      document_ref: '',
      checks: [],
    };
    const result = await createHIRA(payload);
    if (result) {
      showToast('success', `Danger ${result.reference} créé ✓`);
      setShowForm(false);
      setFormProcessus('');
      setFormDanger('');
      setFormControle('');
      setFormProba('2');
      setFormGrav('3');
      loadData();
    }
  };

  const handleCheckToggle = async (danger: HIRADanger, index: number) => {
    if (!danger || !Array.isArray(danger.checks) || index < 0 || index >= danger.checks.length) return;
    const newChecks = danger.checks.map((c, i) => i === index ? { ...c, ok: !c.ok } : c);
    const updated = await updateHIRA(danger.id, { checks: newChecks });
    if (updated) {
      setSelectedDanger(updated);
      setDangers(prev => prev.map(d => d.id === updated.id ? updated : d));
    }
  };

  const handleDelete = async (danger: HIRADanger) => {
    if (!confirm(`Supprimer ${danger.reference} ?`)) return;
    await deleteHIRA(danger.id);
    showToast('success', `${danger.reference} supprimé`);
    setSelectedDanger(null);
    loadData();
  };

  if (loading) return <div className="detail-pane"><p>Chargement…</p></div>;

  return (
    <div className="detail-pane">
      <div className="page-header">
        <div className="ph-icon" style={{ background: '#FFF1F0' }}>⚠️</div>
        <div>
          <div className="ph-title">Registre des dangers et évaluation des risques (HIRA)</div>
          <div className="ph-sub">ISO 45001:2018 §6.1.2 — Identification des dangers, appréciation et maîtrise des risques</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={filterProcess} onChange={e => setFilterProcess(e.target.value)} style={{ fontSize: 11, background: 'var(--surf)', border: '1px solid var(--bdr)', borderRadius: 6, padding: '4px 8px', outline: 'none' }}>
            <option value="all">Tous les processus</option>
            {processusList.map(p => <option key={p.id} value={p.label}>{p.label}</option>)}
          </select>
          <button className="btn btn-ghost btn-sm">⬇ Exporter</button>
          <button className="btn btn-p btn-sm" onClick={() => setShowForm(true)}>+ Ajouter un danger</button>
        </div>
      </div>

      <div className="scroll-body">
        <div className="hira-layout">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="hira-matrix-card">
              <div className="hira-matrix-head">
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--blue-sst)' }}></span>
                <div className="hira-matrix-title">Matrice de criticité 5×5</div>
              </div>
              <div className="risk-matrix">
                <div className="matrix-grid">
                  <div></div>
                  {graviteLabels.map(g => <div key={g} className="matrix-label-top">{g}</div>)}
                  {[5,4,3,2,1].map((p, pi) => (
                    <React.Fragment key={p}>
                      <div className="matrix-label-left">{probaLabels[pi]}</div>
                      {[1,2,3,4,5].map(g => {
                        const val = p * g;
                        const count = matrix[`${p}-${g}`] || 0;
                        return (
                          <div key={g} className={`matrix-cell ${riskClass(val)}`} onClick={() => {}}>
                            {val}
                            {count > 0 && <div className="mc-count">{count}</div>}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
                <div className="matrix-legend">
                  <div className="ml-item"><div className="ml-dot" style={{ background: '#D4EDDA' }}></div>Tolérable</div>
                  <div className="ml-item"><div className="ml-dot" style={{ background: '#FFF3CD' }}></div>Faible</div>
                  <div className="ml-item"><div className="ml-dot" style={{ background: '#FFD6A5' }}></div>Modéré</div>
                  <div className="ml-item"><div className="ml-dot" style={{ background: '#FFBEBE' }}></div>Élevé</div>
                  <div className="ml-item"><div className="ml-dot" style={{ background: '#FF4D4F' }}></div>Critique</div>
                </div>
              </div>
            </div>

            <div className="hira-list-card">
              <div className="hira-list-head">
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }}></span>
                <div className="hl-title">Dangers identifiés — {filtered.length} fiches actives</div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="hira-table">
                  <thead>
                    <tr>
                      <th>Réf.</th>
                      <th>Danger identifié</th>
                      <th>Processus</th>
                      <th>P</th>
                      <th>G</th>
                      <th>Résiduel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 30, color: 'var(--light)' }}>Aucun danger</td></tr>
                    ) : filtered.map(d => (
                      <tr key={d.id} className={selectedDanger?.id === d.id ? 'selected' : ''} onClick={() => setSelectedDanger(d)}>
                        <td><span style={{ fontFamily: 'var(--font-code)', fontSize: 10, color: 'var(--muted)' }}>{d.reference}</span></td>
                        <td style={{ fontWeight: 600, maxWidth: 220 }}>{d.danger}</td>
                        <td style={{ color: 'var(--muted)' }}>{d.processus}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{d.probabilite}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{d.gravite}</td>
                        <td><span className={`risk-pill ${RESIDUEL_CLS[d.risque_residuel] || 'rp-fai'}`}>{d.risque_residuel}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div>
            {selectedDanger ? (
              <div className="hira-detail-card">
                <div style={{ padding: 14, borderBottom: '1px solid var(--bdr)', flexShrink: 0, marginBottom: 14 }}>
                  <div style={{ fontFamily: 'var(--font-code)', fontSize: 10, color: 'var(--muted)', marginBottom: 3 }}>{selectedDanger.reference}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.3, marginBottom: 6 }}>{selectedDanger.danger}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: 'var(--surface-2)', color: 'var(--muted)' }}>{selectedDanger.processus}</span>
                    <span className={`risk-pill ${RESIDUEL_CLS[selectedDanger.risque_residuel] || 'rp-fai'}`}>{selectedDanger.risque_residuel}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  <div style={{ flex: 1, textAlign: 'center', background: 'var(--surface)', borderRadius: 8, padding: 10 }}>
                    <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.7px', color: 'var(--muted)', marginBottom: 4 }}>Probabilité</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--orange)' }}>{selectedDanger.probabilite}/5</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center', background: 'var(--surface)', borderRadius: 8, padding: 10 }}>
                    <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.7px', color: 'var(--muted)', marginBottom: 4 }}>Gravité</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--danger)' }}>{selectedDanger.gravite}/5</div>
                  </div>
                </div>

                <div className="hierarchy-strip">
                  <div className="hier-col">
                    <div className="hier-label prevention">Prévention</div>
                    <div className="hier-item">🛡️ {selectedDanger.controle_prioritaire}</div>
                  </div>
                  <div className="hier-danger">⚠️ {selectedDanger.danger}</div>
                  <div className="hier-col">
                    <div className="hier-label protection">Protection</div>
                    <div className="hier-item">👷 {selectedDanger.processus}</div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.7px', color: 'var(--muted)', marginBottom: 8 }}>Checklist</div>
                  {selectedDanger.checks.map((c, i) => (
                    <div key={i} onClick={() => handleCheckToggle(selectedDanger, i)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', background: c.ok ? 'var(--teal-l)' : 'var(--surface)', borderRadius: 7, fontSize: 12, cursor: 'pointer', border: `1px solid ${c.ok ? 'rgba(0,212,170,.3)' : 'transparent'}`, userSelect: 'none', marginBottom: 6 }}>
                      <div className={`hi-check ${c.ok ? 'ok' : ''}`}>{c.ok ? '✓' : ''}</div>
                      <div style={{ flex: 1, textDecoration: c.ok ? 'line-through' : 'none', color: c.ok ? 'var(--muted)' : 'var(--text)' }}>{c.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="hira-detail-card" style={{ alignItems: 'center', justifyContent: 'center', color: 'var(--light)', fontSize: 12 }}>
                Sélectionnez un danger pour voir les détails
              </div>
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: 'var(--white)', borderRadius: 14, padding: 24, width: 640, maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--sh3)' }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Nouveau danger HIRA</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 18 }}>Ajouter un danger au registre des risques SST.</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-field">
                <label>Danger <span style={{ color: 'var(--danger)' }}>•</span></label>
                <input value={formDanger} onChange={(e) => setFormDanger(e.target.value)} placeholder="ex: Exposition H₂S" />
              </div>
              <div className="form-field">
                <label>Processus <span style={{ color: 'var(--danger)' }}>•</span></label>
                <select value={formProcessus} onChange={(e) => setFormProcessus(e.target.value)}>
                  <option value="">-- Sélectionner --</option>
                  {processusList.map(p => <option key={p.id} value={p.label}>{p.label}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label>Probabilité <span style={{ color: 'var(--danger)' }}>•</span></label>
                <select value={formProba} onChange={(e) => setFormProba(e.target.value)}>
                  <option value="1">1 - Rare</option>
                  <option value="2">2 - Peu probable</option>
                  <option value="3">3 - Possible</option>
                  <option value="4">4 - Probable</option>
                  <option value="5">5 - Très probable</option>
                </select>
              </div>
              <div className="form-field">
                <label>Gravité <span style={{ color: 'var(--danger)' }}>•</span></label>
                <select value={formGrav} onChange={(e) => setFormGrav(e.target.value)}>
                  <option value="1">1 - Insignifiant</option>
                  <option value="2">2 - Mineur</option>
                  <option value="3">3 - Modéré</option>
                  <option value="4">4 - Grave</option>
                  <option value="5">5 - Catastrophique</option>
                </select>
              </div>
              <div className="form-field form-full">
                <label>Contrôle prioritaire <span style={{ color: 'var(--danger)' }}>•</span></label>
                <textarea rows={2} value={formControle} onChange={(e) => setFormControle(e.target.value)} placeholder="Mesure de maîtrise principale" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowForm(false); setFormProcessus(''); setFormDanger(''); setFormControle(''); setFormProba('2'); setFormGrav('3'); }}>Annuler</button>
              <button className="btn btn-p btn-sm" onClick={handleCreate}>+ Créer le danger</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HIRA;
