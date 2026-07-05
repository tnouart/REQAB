import React, { useEffect, useState } from 'react';
import {
  fetchPTW, createPTW, updatePTW, deletePTW, fetchPTWStats, fetchProcessus, fetchPTWArchives, archivePTW, restorePTW, type PTWRecord, type PTWArchive
} from '../services/api';
import { useToast } from '../contexts/ToastContext';

const PTW: React.FC = () => {
  const { showToast } = useToast();
  const [ptws, setPtws] = useState<PTWRecord[]>([]);
  const [stats, setStats] = useState({ attente: 0, approuve: 0, actif: 0, clos: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedPTW, setSelectedPTW] = useState<PTWRecord | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalSize, setModalSize] = useState({ width: 640, height: 520 });
  const [modalDrag, setModalDrag] = useState<{ x: number; y: number } | null>(null);
  const [showArchives, setShowArchives] = useState(false);
  const [archives, setArchives] = useState<PTWArchive[]>([]);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveSearch, setArchiveSearch] = useState('');
  const [archiveFilterType, setArchiveFilterType] = useState('');
  const [archiveFilterResponsable, setArchiveFilterResponsable] = useState('');
  const [archiveDateFrom, setArchiveDateFrom] = useState('');
  const [archiveDateTo, setArchiveDateTo] = useState('');
  const [archiveArchivedFrom, setArchiveArchivedFrom] = useState('');
  const [archiveArchivedTo, setArchiveArchivedTo] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const [form, setForm] = useState({
    type_travail: 'chaud',
    titre: '',
    zone: '',
    description: '',
    responsable: '',
    processus: '',
    date_debut: '',
    date_fin: '',
    urgence: 'norm',
    risques: '',
    epi: ''
  });

  const [processusList, setProcessusList] = useState<{ id: number; label: string }[]>([]);
  const [checkItems, setCheckItems] = useState<{ label: string; ok: boolean }[]>([]);
  const [checkInput, setCheckInput] = useState('');

  const DEFAULT_CHECKLISTS: Record<string, { label: string; ok: boolean }[]> = {
    chaud: [
      { label: 'Zone délimitée et balisée', ok: false },
      { label: 'Extinction incendie positionnée', ok: false },
      { label: 'Analyse atmosphérique effectuée', ok: false },
      { label: 'Consignation équipements vérifiée', ok: false },
      { label: 'Communication urgence testée', ok: false },
    ],
    electr: [
      { label: 'Consignation LOTO effectuée', ok: false },
      { label: 'VAT vérification absence tension', ok: false },
      { label: 'Zone de travail isolée', ok: false },
      { label: 'Habilitation électrique vérifiée', ok: false },
    ],
    confine: [
      { label: 'Analyse O2 ≥ 19,5%', ok: false },
      { label: 'LEL < 10% vérifié', ok: false },
      { label: 'Surveillant de surface désigné', ok: false },
      { label: 'Moyen de récupération opérationnel', ok: false },
    ],
    hauteur: [
      { label: 'Point d\'ancrage vérifié', ok: false },
      { label: 'Harnais antichute porté', ok: false },
      { label: 'Filet de sécurité installé', ok: false },
      { label: 'Zone de travail balisée', ok: false },
    ],
    general: [
      { label: 'Zone de travail délimitée', ok: false },
      { label: 'Consignes de sécurité lues', ok: false },
      { label: 'EPI vérifiés', ok: false },
    ],
  };

  useEffect(() => { loadData(); }, []);

  const loadArchives = async () => {
    setArchiveLoading(true);
    const data = await fetchPTWArchives({
      search: archiveSearch || undefined,
      type_travail: archiveFilterType || undefined,
      responsable: archiveFilterResponsable || undefined,
      date_from: archiveDateFrom || undefined,
      date_to: archiveDateTo || undefined,
      archived_from: archiveArchivedFrom || undefined,
      archived_to: archiveArchivedTo || undefined,
    });
    setArchives(data);
    setArchiveLoading(false);
  };

  useEffect(() => {
    if (showArchives) loadArchives();
  }, [showArchives]);

  const loadData = async () => {
    setLoading(true);
    const [ptwsData, statsData, processusData] = await Promise.all([fetchPTW(), fetchPTWStats(), fetchProcessus()]);
    const normalized = ptwsData.map((p: any) => ({
      ...p,
      risques: Array.isArray(p.risques) ? p.risques : (() => { try { return JSON.parse(p.risques || '[]'); } catch { return []; } })(),
      epi: Array.isArray(p.epi) ? p.epi : (() => { try { return JSON.parse(p.epi || '[]'); } catch { return []; } })(),
      checks: Array.isArray(p.checks) ? p.checks : (() => { try { return JSON.parse(p.checks || '[]'); } catch { return []; } })(),
    }));
    setPtws(normalized);
    setStats(statsData);
    setProcessusList(processusData);
    setLoading(false);
  };

  useEffect(() => {
    if (showForm && !editingId) {
      setCheckItems(DEFAULT_CHECKLISTS[form.type_travail] ? JSON.parse(JSON.stringify(DEFAULT_CHECKLISTS[form.type_travail])) : []);
      setCheckInput('');
    }
  }, [showForm, form.type_travail, editingId]);

  const filtered = filterType === 'all' ? ptws : ptws.filter(p => p.type_travail === filterType);

  const cols = [
    { key: 'ATTENTE', label: 'En attente' },
    { key: 'APPROUVE', label: 'Approuvé' },
    { key: 'ACTIF', label: 'Actif' },
    { key: 'CLOS', label: 'Clôturé' },
  ];

  const typeIcons: Record<string, string> = { chaud: '🔥', electr: '⚡', confine: '🔵', hauteur: '🟢', general: '🔧' };
  const typeLabels: Record<string, string> = { chaud: 'Feu chaud', electr: 'Électrique', confine: 'Espace confiné', hauteur: 'Hauteur', general: 'Général' };

  const urgenceCls = (u: string) => ({ haute: 'urg-haute', moy: 'urg-moy', norm: 'urg-norm' }[u] || 'urg-norm');
  const urgenceLbl = (u: string) => ({ haute: 'URGENT', moy: 'Moyen', norm: 'Normal' }[u] || 'Normal');

  const handleCreate = async () => {
    if (!form.titre || !form.zone || !form.responsable || !form.date_debut || !form.date_fin) return;
    const payload: Partial<PTWRecord> = {
      ...form,
      risques: form.risques.split('\n').filter(Boolean),
      epi: form.epi.split('\n').filter(Boolean),
      checks: checkItems,
    };
    const result = await createPTW({
      ...payload,
      date_debut: new Date(form.date_debut).toISOString(),
      date_fin: new Date(form.date_fin).toISOString()
    });
    if (result) {
      showToast('success', `PTW ${result.numero_ptw} créé — en attente d'approbation ✓`);
      setShowForm(false);
      setEditingId(null);
      setForm({ type_travail: 'chaud', titre: '', zone: '', description: '', responsable: '', processus: '', date_debut: '', date_fin: '', urgence: 'norm', risques: '', epi: '' });
      setCheckItems([]);
      setCheckInput('');
      loadData();
    }
  };

  const handleSubmit = async () => {
    if (!form.titre || !form.zone || !form.responsable || !form.date_debut || !form.date_fin) return;
    const payload: Partial<PTWRecord> = {
      ...form,
      risques: form.risques.split('\n').filter(Boolean),
      epi: form.epi.split('\n').filter(Boolean),
      checks: checkItems,
    };
    let result: PTWRecord | null = null;
    if (editingId) {
      const updated = await updatePTW(editingId, {
        ...payload,
        date_debut: new Date(form.date_debut).toISOString(),
        date_fin: new Date(form.date_fin).toISOString()
      });
      result = updated;
      if (updated) {
        showToast('success', `PTW ${updated.numero_ptw} modifié ✓`);
      }
    } else {
      const created = await createPTW({
        ...payload,
        date_debut: new Date(form.date_debut).toISOString(),
        date_fin: new Date(form.date_fin).toISOString()
      });
      result = created;
      if (created) {
        showToast('success', `PTW ${created.numero_ptw} créé — en attente d'approbation ✓`);
      }
    }

    if (result) {
      setShowForm(false);
      setEditingId(null);
      setForm({ type_travail: 'chaud', titre: '', zone: '', description: '', responsable: '', processus: '', date_debut: '', date_fin: '', urgence: 'norm', risques: '', epi: '' });
      setCheckItems([]);
      setCheckInput('');
      loadData();
    }
  };

  const handleStatutChange = async (ptw: PTWRecord, newStatut: string) => {
    const updated = await updatePTW(ptw.id, { statut: newStatut });
    if (updated) {
      showToast('success', `${ptw.numero_ptw} → ${newStatut} ✓`);
      setSelectedPTW(updated);
      loadData();
    }
  };

  const handleCheckToggle = async (ptw: PTWRecord, index: number) => {
    if (!ptw || !Array.isArray(ptw.checks) || index < 0 || index >= ptw.checks.length) return;
    const newChecks = ptw.checks.map((c, i) => i === index ? { ...c, ok: !c.ok } : c);
    const updated = await updatePTW(ptw.id, { checks: newChecks });
    if (updated) {
      setSelectedPTW(updated);
      setPtws(prev => prev.map(p => p.id === updated.id ? updated : p));
    }
  };

  const handleEdit = (ptw: PTWRecord) => {
    const formatDateTimeLocal = (iso: string) => {
      const d = new Date(iso);
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    const risquesArr = Array.isArray(ptw.risques) ? ptw.risques : [];
    const epiArr = Array.isArray(ptw.epi) ? ptw.epi : [];
    const checksArr = Array.isArray(ptw.checks) ? ptw.checks : [];
    setEditingId(ptw.id);
    setShowForm(true);
    setForm({
      type_travail: ptw.type_travail,
      titre: ptw.titre,
      zone: ptw.zone || '',
      description: ptw.description || '',
      responsable: ptw.responsable || '',
      processus: '',
      date_debut: formatDateTimeLocal(ptw.date_debut),
      date_fin: formatDateTimeLocal(ptw.date_fin),
      urgence: ptw.urgence || 'norm',
      risques: risquesArr.join('\n'),
      epi: epiArr.join('\n'),
    });
    setCheckItems(checksArr);
    setCheckInput('');
  };

  const handleDelete = async (ptw: PTWRecord) => {
    if (!confirm(`Supprimer ${ptw.numero_ptw} ?`)) return;
    await deletePTW(ptw.id);
    showToast('success', `${ptw.numero_ptw} supprimé`);
    setSelectedPTW(null);
    loadData();
  };

  const handleArchive = async (ptw: PTWRecord) => {
    if (!confirm(`Archiver ${ptw.numero_ptw} ?`)) return;
    const updated = await archivePTW(ptw.id);
    if (updated) {
      showToast('success', `${ptw.numero_ptw} archivé ✓`);
      setSelectedPTW(null);
      loadData();
    }
  };

  const handleRestore = async (ptw: PTWRecord | PTWArchive) => {
    if (!confirm(`Restaurer ${ptw.numero_ptw} ?`)) return;
    const updated = await restorePTW(ptw.id);
    if (updated) {
      showToast('success', `${ptw.numero_ptw} restauré ✓`);
      setSelectedPTW(null);
      if (showArchives) loadArchives();
      else loadData();
    }
  };

  const handleArchiveMouseDown = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = modalSize.width;
    const startH = modalSize.height;
    const handleMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      setModalSize({
        width: Math.max(480, startW + dx),
        height: Math.max(320, startH + dy)
      });
    };
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  if (loading) return <div className="detail-pane"><p>Chargement…</p></div>;

  return (
    <div className="detail-pane" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="page-header" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
  {/* BLOC GAUCHE : Icône et Titres */}
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <div className="ph-icon" style={{ background: '#FFF3EE', padding: '8px', borderRadius: '8px' }}>🔶</div>
    <div>
      <div className="ph-title" style={{ fontWeight: 'bold' }}>Permis de travail (PTW)</div>
      <div className="ph-sub" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ISO 45001:2018 §8.1.3 — Gestion des travaux à risques élevés · ENSP</div>
    </div>
  </div>

  {/* BLOC DROITE : Filtre et Boutons (poussés tout à droite) */}
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
    <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ fontSize: 11, background: 'var(--surf)', border: '1px solid var(--bdr)', borderRadius: 6, padding: '4px 8px', outline: 'none' }}>
      <option value="all">Tous types</option>
      <option value="chaud">🔥 Feu chaud</option>
      <option value="electr">⚡ Électrique</option>
      <option value="confine">🔵 Espace confiné</option>
      <option value="hauteur">🟢 Hauteur</option>
      <option value="general">🔧 Général</option>
    </select>
    <button className="btn btn-ghost btn-sm" onClick={() => { setShowArchives(true); setSelectedPTW(null); }}>📦 Archives</button>
    <button className="btn btn-p btn-sm" onClick={() => { setEditingId(null); setShowForm(true); }}>+ Nouveau PTW</button>
  </div>
</div>

      <div className="kanban-area">
        <div className="kanban-scroll">
          {cols.map(c => {
            const items = filtered.filter(p => p.statut === c.key);
            return (
              <div key={c.key} className="col">
                <div className="col-header">
                  <div className="col-dot" style={{ background: c.key === 'ATTENTE' ? 'var(--amber)' : c.key === 'APPROUVE' ? 'var(--accent)' : c.key === 'ACTIF' ? 'var(--orange)' : 'var(--border)' }}></div>
                  <div className="col-title">{c.label}</div>
                  <div className="col-count">{items.length}</div>
                </div>
                <div className="col-body">
                  {items.length === 0 && (
                    <div className="col-empty">
                      <div className="em-icon">📭</div>
                      <div>Aucun PTW</div>
                    </div>
                  )}
                  {items.map(ptw => {
                    const pct = ptw.checks.length ? Math.round((ptw.checks.filter(c => c.ok).length / ptw.checks.length) * 100) : 0;
                    return (
                      <div
                        key={ptw.id}
                        className={`wf-card ${selectedPTW?.id === ptw.id ? 'selected' : ''}`}
                        onClick={() => setSelectedPTW(ptw)}
                      >
                        <div className="card-top">
                          <span className="card-code">{ptw.numero_ptw}</span>
                          <span className={`card-urgency ${urgenceCls(ptw.urgence)}`} style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 5, textTransform: 'uppercase', letterSpacing: '.5px', background: ptw.urgence === 'haute' ? 'var(--red-l)' : ptw.urgence === 'moy' ? 'var(--orange-l)' : 'var(--surface-2)', color: ptw.urgence === 'haute' ? 'var(--red-d)' : ptw.urgence === 'moy' ? 'var(--orange-d)' : 'var(--text-muted)' }}>{urgenceLbl(ptw.urgence)}</span>
                        </div>
                        <div className="card-title">{ptw.titre}</div>
                        <div className="card-meta">
                          <span className="meta-tag mt-proc">{typeIcons[ptw.type_travail]} {typeLabels[ptw.type_travail]}</span>
                        </div>
                        <div className="card-people">
                          <span className="people-lbl">{ptw.responsable}</span>
                        </div>
                        {ptw.checks.length > 0 && (
                          <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: 'var(--surface-2)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? 'var(--accent)' : pct > 50 ? 'var(--amber)' : 'var(--danger)', borderRadius: 2, transition: 'width .3s' }}></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className={`detail-panel ${selectedPTW ? 'open' : ''}`}>
          {selectedPTW ? (
            <div id="dp-inner" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              <div style={{ padding: 14, borderBottom: '1px solid var(--border)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, fontFamily: 'var(--font-code)' }}>{selectedPTW.numero_ptw}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>{selectedPTW.titre}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: 'var(--surface-2)', color: 'var(--text-muted)' }}>{typeIcons[selectedPTW.type_travail]} {typeLabels[selectedPTW.type_travail]}</span>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 5, textTransform: 'uppercase', background: selectedPTW.urgence === 'haute' ? 'var(--red-l)' : selectedPTW.urgence === 'moy' ? 'var(--orange-l)' : 'var(--surface-2)', color: selectedPTW.urgence === 'haute' ? 'var(--red-d)' : selectedPTW.urgence === 'moy' ? 'var(--orange-d)' : 'var(--text-muted)' }}>{urgenceLbl(selectedPTW.urgence)}</span>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedPTW(null)}>✕ Fermer</button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.6px', color: 'var(--text-muted)', marginBottom: 6 }}>Informations</div>
                  {[
                    { k: 'Zone', v: selectedPTW.zone },
                    { k: 'Responsable', v: selectedPTW.responsable },
                    { k: 'Début', v: new Date(selectedPTW.date_debut).toLocaleString('fr-FR') },
                    { k: 'Fin prévue', v: new Date(selectedPTW.date_fin).toLocaleString('fr-FR') },
                  ].map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--surface-2)', fontSize: 11.5 }}>
                      <span style={{ color: 'var(--text-muted)' }}>{r.k}</span><span style={{ fontWeight: 600 }}>{r.v}</span>
                    </div>
                  ))}
                </div>

                {selectedPTW.risques?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.6px', color: 'var(--text-muted)', marginBottom: 6 }}>Risques</div>
                    {selectedPTW.risques.map((r, i) => (
                      <div key={i} style={{ display: 'flex', gap: 7, fontSize: 12, padding: '3px 0', borderBottom: '1px solid var(--surface-2)' }}>
                        <span style={{ color: 'var(--danger)', fontWeight: 800, flexShrink: 0 }}>›</span>{r}
                      </div>
                    ))}
                  </div>
                )}

                {selectedPTW.epi?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.6px', color: 'var(--text-muted)', marginBottom: 6 }}>EPI requis</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {selectedPTW.epi.map((e, i) => (
                        <span key={i} style={{ fontSize: 10.5, fontWeight: 600, background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 6 }}>{e}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.6px', color: 'var(--text-muted)', marginBottom: 8 }}>Checklist — {selectedPTW.checks.filter(c => c.ok).length}/{selectedPTW.checks.length}</div>
                  {selectedPTW.checks.map((c, i) => (
                    <div key={i} onClick={() => handleCheckToggle(selectedPTW, i)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', background: c.ok ? 'var(--teal-l)' : 'var(--surface)', borderRadius: 7, fontSize: 12, cursor: 'pointer', border: `1px solid ${c.ok ? 'rgba(0,212,170,.3)' : 'transparent'}`, userSelect: 'none', transition: 'background .15s, border-color .15s' }}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${c.ok ? 'var(--teal)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, background: c.ok ? 'var(--teal)' : 'transparent', color: c.ok ? '#fff' : 'transparent', transition: 'all .15s' }}>{c.ok ? '✓' : ''}</div>
                      <div style={{ flex: 1, textDecoration: c.ok ? 'line-through' : 'none', color: c.ok ? 'var(--text-muted)' : 'var(--text)', transition: 'color .15s' }}>{c.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ padding: 14, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                {selectedPTW.statut === 'ATTENTE' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-p btn-sm" style={{ flex: 1, background: 'var(--accent)' }} onClick={() => handleStatutChange(selectedPTW, 'APPROUVE')}>✅ Approuver</button>
                    <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => handleEdit(selectedPTW)}>✏️ Modifier</button>
                    <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => handleDelete(selectedPTW)}>🗑 Supprimer</button>
                  </div>
                )}
                {selectedPTW.statut === 'APPROUVE' && (
                  <button className="btn btn-p btn-sm" style={{ width: '100%', background: 'var(--orange)', color: '#fff' }} onClick={() => handleStatutChange(selectedPTW, 'ACTIF')}>▶ Activer les travaux</button>
                )}
                {selectedPTW.statut === 'ACTIF' && (
                  <button className="btn btn-p btn-sm" style={{ width: '100%' }} onClick={() => handleStatutChange(selectedPTW, 'CLOS')}>✓ Clôturer les travaux</button>
                )}
                {selectedPTW.statut === 'CLOS' && (
                  <button className="btn btn-p btn-sm" style={{ width: '100%' }} onClick={() => handleArchive(selectedPTW)}>📦 Archiver le permis</button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ padding: 24, color: 'var(--text-light)', textAlign: 'center', fontSize: 12 }}>
              Sélectionnez un permis de travail
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: 'var(--white)', borderRadius: 14, width: modalSize.width, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--sh3)', resize: 'both', overflow: 'auto', minWidth: 480, minHeight: 320 }}>
            <div style={{ padding: 24, borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{editingId ? 'Modifier le permis de travail' : 'Nouveau permis de travail'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{editingId ? 'Modifier les informations du permis.' : 'Remplir tous les champs obligatoires.'}</div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-field">
                  <label>Type <span style={{ color: 'var(--danger)' }}>•</span></label>
                  <select value={form.type_travail} onChange={e => setForm({ ...form, type_travail: e.target.value })}>
                    <option value="chaud">🔥 Feu chaud</option>
                    <option value="electr">⚡ Électrique</option>
                    <option value="confine">🔵 Espace confiné</option>
                    <option value="hauteur">🟢 Hauteur</option>
                    <option value="general">🔧 Général</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Intitulé <span style={{ color: 'var(--danger)' }}>•</span></label>
                  <input value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} placeholder="ex: Soudure bride puits P-14" />
                </div>
                <div className="form-field">
                  <label>Zone <span style={{ color: 'var(--danger)' }}>•</span></label>
                  <input value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })} placeholder="Zone / Installation" />
                </div>
                <div className="form-field">
                  <label>Responsable <span style={{ color: 'var(--danger)' }}>•</span></label>
                  <input value={form.responsable} onChange={e => setForm({ ...form, responsable: e.target.value })} placeholder="Responsable des travaux" />
                </div>
                <div className="form-field">
                  <label>Processus</label>
                  <select value={form.processus} onChange={e => setForm({ ...form, processus: e.target.value })}>
                    <option value="">-- Sélectionner --</option>
                    {processusList.map(p => <option key={p.id} value={p.label}>{p.label}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label>Date début <span style={{ color: 'var(--danger)' }}>•</span></label>
                  <input type="datetime-local" value={form.date_debut} onChange={e => setForm({ ...form, date_debut: e.target.value })} />
                </div>
                <div className="form-field">
                  <label>Date fin <span style={{ color: 'var(--danger)' }}>•</span></label>
                  <input type="datetime-local" value={form.date_fin} onChange={e => setForm({ ...form, date_fin: e.target.value })} />
                </div>
                <div className="form-field">
                  <label>Urgence</label>
                  <select value={form.urgence} onChange={e => setForm({ ...form, urgence: e.target.value })}>
                    <option value="norm">Normale</option>
                    <option value="moy">Moyenne</option>
                    <option value="haute">Haute</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Description</label>
                  <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="form-field">
                  <label>EPI (1 par ligne)</label>
                  <textarea rows={3} value={form.epi} onChange={e => setForm({ ...form, epi: e.target.value })} />
                </div>
                <div className="form-field">
                  <label>Risques (1 par ligne)</label>
                  <textarea rows={3} value={form.risques} onChange={e => setForm({ ...form, risques: e.target.value })} />
                </div>
              </div>
              <div className="form-field form-full">
                <label>
                  Checklist de vérification avant approbation
                  <span style={{ color: 'var(--danger)' }}>•</span>
                </label>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8 }}>
                  Vérifications obligatoires avant activation du permis. Appliquez un modèle par défaut, puis ajustez les items.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.6px', color: 'var(--muted)' }}>Modèle par défaut</div>
                    <button type="button" className="btn btn-p btn-sm" onClick={() => { if (DEFAULT_CHECKLISTS[form.type_travail]) setCheckItems(JSON.parse(JSON.stringify(DEFAULT_CHECKLISTS[form.type_travail]))); showToast('success', 'Checklist par défaut appliquée'); }}>📋 Appliquer le modèle</button>
                    <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.5 }}>
                      Applique un modèle standardisé selon le type de travaux sélectionné en haut. Vous pourrez ensuite modifier, ajouter ou supprimer des items dans la zone de droite.
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.6px', color: 'var(--muted)' }}>Checklist courante</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input value={checkInput} onChange={e => setCheckInput(e.target.value)} placeholder="ex: Zone délimitée et balisée" onKeyDown={e => { if (e.key === 'Enter') { if (!checkInput.trim()) return; setCheckItems([...checkItems, { label: checkInput.trim(), ok: false }]); setCheckInput(''); } }} />
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => { if (!checkInput.trim()) return; setCheckItems([...checkItems, { label: checkInput.trim(), ok: false }]); setCheckInput(''); }}>+ Ajouter</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
                      {checkItems.map((c, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: c.ok ? 'var(--teal-l)' : 'var(--white)', borderRadius: 7, fontSize: 12, border: `1px solid ${c.ok ? 'rgba(0,212,170,.3)' : 'var(--border)'}` }}>
                          <div style={{ width: 16, height: 16, borderRadius: 3, border: `2px solid ${c.ok ? 'var(--teal)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, background: c.ok ? 'var(--teal)' : 'transparent', color: c.ok ? '#fff' : 'transparent', cursor: 'pointer', flexShrink: 0 }} onClick={() => setCheckItems(checkItems.map((x, idx) => idx === i ? { ...x, ok: !x.ok } : x))}>{c.ok ? '✓' : ''}</div>
                          <div style={{ flex: 1, textDecoration: c.ok ? 'line-through' : 'none', color: c.ok ? 'var(--text-muted)' : 'var(--text)' }}>{c.label}</div>
                          <button type="button" style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 11 }} onClick={() => setCheckItems(checkItems.filter((_, idx) => idx !== i))}>❌</button>
                        </div>
                      ))}
                      {checkItems.length === 0 && <div style={{ fontSize: 11, color: 'var(--light)', textAlign: 'center', padding: 10 }}>Aucun item de checklist</div>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ padding: 24, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Annuler</button>
              <button type="button" className="btn btn-p" onClick={handleSubmit}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {showArchives && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: 'var(--white)', borderRadius: 14, padding: 24, width: 860, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--sh3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Archives PTW</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Permis de travail archivés. Vous pouvez consulter, filtrer ou restaurer.</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowArchives(false)}>Fermer</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
              <input value={archiveSearch} onChange={e => setArchiveSearch(e.target.value)} placeholder="Recherche: numéro, titre, zone, responsable..." />
              <select value={archiveFilterType} onChange={e => setArchiveFilterType(e.target.value)}>
                <option value="">Tous types</option>
                <option value="chaud">🔥 Feu chaud</option>
                <option value="electr">⚡ Électrique</option>
                <option value="confine">🔵 Espace confiné</option>
                <option value="hauteur">🟢 Hauteur</option>
                <option value="general">🔧 Général</option>
              </select>
              <input type="date" value={archiveDateFrom} onChange={e => setArchiveDateFrom(e.target.value)} placeholder="Date début from" />
              <input type="date" value={archiveDateTo} onChange={e => setArchiveDateTo(e.target.value)} placeholder="Date fin to" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
              <input value={archiveFilterResponsable} onChange={e => setArchiveFilterResponsable(e.target.value)} placeholder="Responsable" />
              <input type="datetime-local" value={archiveArchivedFrom} onChange={e => setArchiveArchivedFrom(e.target.value)} placeholder="Archivé depuis" />
              <input type="datetime-local" value={archiveArchivedTo} onChange={e => setArchiveArchivedTo(e.target.value)} placeholder="Archivé jusqu'à" />
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button className="btn btn-p btn-sm" onClick={loadArchives}>🔍 Rechercher</button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setArchiveSearch(''); setArchiveFilterType(''); setArchiveFilterResponsable(''); setArchiveDateFrom(''); setArchiveDateTo(''); setArchiveArchivedFrom(''); setArchiveArchivedTo(''); loadArchives(); }}>Réinitialiser</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--surface-2)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px' }}>Numéro</th>
                    <th style={{ padding: '8px 10px' }}>Type</th>
                    <th style={{ padding: '8px 10px' }}>Titre</th>
                    <th style={{ padding: '8px 10px' }}>Zone</th>
                    <th style={{ padding: '8px 10px' }}>Responsable</th>
                    <th style={{ padding: '8px 10px' }}>Dates</th>
                    <th style={{ padding: '8px 10px' }}>Statut</th>
                    <th style={{ padding: '8px 10px' }}>Archivé le</th>
                    <th style={{ padding: '8px 10px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {archiveLoading ? (
                    <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement...</td></tr>
                  ) : archives.length === 0 ? (
                    <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Aucun PTW archivé</td></tr>
                  ) : archives.map(a => (
                    <tr key={a.id} style={{ borderBottom: '1px solid var(--surface-2)', cursor: 'pointer' }} onClick={() => { setSelectedPTW(a); setShowForm(false); setShowArchives(false); }}>
                      <td style={{ padding: '8px 10px', fontFamily: 'var(--font-code)', fontWeight: 700 }}>{a.numero_ptw}</td>
                      <td style={{ padding: '8px 10px' }}>{typeIcons[a.type_travail]} {typeLabels[a.type_travail]}</td>
                      <td style={{ padding: '8px 10px', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.titre}</td>
                      <td style={{ padding: '8px 10px' }}>{a.zone}</td>
                      <td style={{ padding: '8px 10px' }}>{a.responsable}</td>
                      <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{new Date(a.date_debut).toLocaleDateString('fr-FR')} → {new Date(a.date_fin).toLocaleDateString('fr-FR')}</td>
                      <td style={{ padding: '8px 10px' }}>{a.statut}</td>
                      <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{a.archived_at ? new Date(a.archived_at).toLocaleString('fr-FR') : ''}</td>
                      <td style={{ padding: '8px 10px' }} onClick={(e) => e.stopPropagation()}>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleRestore(a)}>♻️ Restaurer</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PTW;