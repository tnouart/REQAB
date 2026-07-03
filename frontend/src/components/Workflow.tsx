import React, { useState, useEffect, useRef } from 'react';
import { fetchWorkflowDocuments, fetchWorkflowUsers, transitionWorkflow, createDocumentRevision, fetchDocumentRevisions, toStatutCode } from '../services/api';
import { useUser } from '../contexts/UserContext';
import type { WorkflowDocument, UserRef, Revision } from '../services/api';

type Statut = 'BROUILLON' | 'EN_REVUE' | 'APPROUVE' | 'APPLICABLE' | 'OBSOLETE' | 'ARCHIVE';

const STATUTS: Statut[] = ['BROUILLON', 'EN_REVUE', 'APPROUVE', 'APPLICABLE'];
const STATUT_LABELS: Record<Statut, string> = {
  BROUILLON: 'Brouillon',
  EN_REVUE: 'En revue',
  APPROUVE: 'Approuvé',
  APPLICABLE: 'Applicable',
  OBSOLETE: 'Obsolète',
  ARCHIVE: 'Archivé',
};

const ACTION_CONFIG: Record<string, {
  icon: string;
  title: string;
  desc: string;
  btnClass: string;
  btnLabel: string;
  nextStatut: Statut | null;
  toast: string;
  toastType: 'success' | 'warning' | 'error';
}> = {
  soumettre: {
    icon: '📤', title: 'Soumettre à revue',
    desc: 'Le document sera soumis au chargé de revue pour évaluation. Cette action est traçée dans la piste d\'audit.',
    btnClass: 'dpb-green', btnLabel: 'Confirmer la soumission',
    nextStatut: 'EN_REVUE', toast: 'soumis à revue ✓', toastType: 'success'
  },
  approuver_revue: {
    icon: '✅', title: 'Approuver la revue',
    desc: 'Vous confirmez que ce document est pertinent. Il passera en statut Approuvé.',
    btnClass: 'dpb-blue', btnLabel: 'Approuver',
    nextStatut: 'APPROUVE', toast: 'approuvé ✓', toastType: 'success'
  },
  retourner: {
    icon: '↩', title: 'Retourner en brouillon',
    desc: 'Le document sera renvoyé au rédacteur pour correction.',
    btnClass: 'dpb-danger', btnLabel: 'Retourner en brouillon',
    nextStatut: 'BROUILLON', toast: 'retourné en brouillon', toastType: 'warning'
  },
  rendre_applicable: {
    icon: '📢', title: 'Rendre applicable',
    desc: 'Ce document sera diffusé comme version en vigueur.',
    btnClass: 'dpb-green', btnLabel: 'Rendre applicable',
    nextStatut: 'APPLICABLE', toast: 'rendu applicable ✓', toastType: 'success'
  },
  archiver: {
    icon: '📦', title: 'Archiver le document',
    desc: 'Ce document sera retiré du registre actif.',
    btnClass: 'dpb-danger', btnLabel: 'Archiver',
    nextStatut: 'ARCHIVE', toast: 'archivé', toastType: 'warning'
  },
  nouvelle_revision: {
    icon: '🔄', title: 'Créer une nouvelle révision',
    desc: 'Un nouveau brouillon (révision suivante) sera créé.',
    btnClass: 'dpb-blue', btnLabel: 'Créer la révision',
    nextStatut: null, toast: 'nouvelle révision créée ✓', toastType: 'success'
  },
  modifier: {
    icon: '✏️', title: 'Modifier le brouillon',
    desc: 'Vous allez ouvrir le formulaire de modification du document.',
    btnClass: 'dpb-blue', btnLabel: 'Ouvrir l\'éditeur',
    nextStatut: null, toast: '', toastType: 'success'
  },
  demander_info: {
    icon: '💬', title: 'Demander des informations',
    desc: 'Une notification sera envoyée au rédacteur pour lui demander des précisions.',
    btnClass: 'dpb-blue', btnLabel: 'Envoyer la demande',
    nextStatut: null, toast: 'demande envoyée', toastType: 'success'
  },
};

interface WorkflowCard {
  id: number;
  code: string;
  type: string;
  processus: string;
  titre: string;
  rev: number;
  statut: Statut;
  urgent: boolean;
  jours: number | null;
  dateRed: string | null;
  dateRevue: string | null;
  dateApp: string | null;
  motif: string | null;
  confidentiel: number | null;
  confidentiel_label?: string;
  redacteur?: string;
  revu?: string;
  approuve?: string;
}

const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};

interface WorkflowProps {
  onEditDocument?: (doc: WorkflowCard) => void;
}

const Workflow: React.FC<WorkflowProps> = ({ onEditDocument }) => {
  const { user, hasPermission } = useUser();
  const [docs, setDocs] = useState<WorkflowCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<WorkflowCard | null>(null);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProcess, setFilterProcess] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [activePill, setActivePill] = useState('mes-taches');
  const [showModal, setShowModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ docId: string | number; action: string } | null>(null);
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: string }[]>([]);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [users, setUsers] = useState<UserRef[]>([]);
  const [processList, setProcessList] = useState<string[]>([]);

  useEffect(() => {
    const loadRevisions = async () => {
      if (!selectedDoc) return;
      try {
        const data = await fetchDocumentRevisions(selectedDoc.id);
        setRevisions(data);
      } catch (err) {
        console.error(err);
      }
    };
    loadRevisions();
  }, [selectedDoc]);

  const getUserObj = (email?: string) => {
    if (!email) return { initials: '?', name: '—', color: '#9CA3AF', role: '' };
    const found = users.find((u) => u.email === email);
    if (found) {
      const parts = found.nom.split(' ');
      const initials = parts.map((p) => p[0]).join('').slice(0, 2).toUpperCase();
      const color = stringToColor(found.email || found.nom);
      return { initials, name: found.nom, color, role: found.role };
    }
    const initials = email.slice(0, 2).toUpperCase();
    return { initials, name: email, color: stringToColor(email), role: '' };
  };

  const toastId = useRef(0);

  const reloadDocuments = async () => {
    setLoading(true);
    try {
      const [docsData, usersData] = await Promise.all([
        fetchWorkflowDocuments(),
        fetchWorkflowUsers(),
      ]);
      const userMap = new Map<number, UserRef>();
      usersData.forEach((u) => userMap.set(u.id, u));

      const getEmail = (id: string | number | null | undefined): string | undefined => {
        if (id == null) return undefined;
        const num = typeof id === 'string' ? parseInt(id, 10) : id;
        return userMap.get(num)?.email;
      };

      const mapped: WorkflowCard[] = docsData.map((d) => {
        const typeCode = d.type_document === 'Procédure' ? 'PRO' :
                         d.type_document === 'Mode opératoire' ? 'MOD' :
                         d.type_document === 'Instruction' ? 'INS' :
                         d.type_document === 'Enregistrement' ? 'FOR' :
                         d.type_document === 'Tableau' ? 'TAB' :
                         d.type_document === 'Manuel' ? 'MAN' : '';

        const jours = d.date_prochaine_revision
          ? Math.ceil((new Date().getTime() - new Date(d.date_prochaine_revision).getTime()) / (1000 * 60 * 60 * 24))
          : null;
        const urgent = (jours ?? 0) > 5 && (toStatutCode(d.statut) === 'EN_REVUE' || toStatutCode(d.statut) === 'APPROUVE' || toStatutCode(d.statut) === 'BROUILLON');

        return {
          id: d.document_id,
          code: d.codification || '—',
          type: typeCode,
          processus: d.processus || '—',
          titre: d.titre || '—',
          rev: d.numero_revision ?? 0,
          statut: toStatutCode(d.statut) as Statut,
          urgent,
          jours,
          dateRed: d.date_redaction || null,
          dateRevue: d.date_revue || null,
          dateApp: d.date_application || null,
          motif: d.motif_modification || null,
          confidentiel: d.niveau_confidentialite != null && String(d.niveau_confidentialite) === '3' ? 3 : d.niveau_confidentialite != null && String(d.niveau_confidentialite) === '2' ? 2 : d.niveau_confidentialite != null && String(d.niveau_confidentialite) === '1' ? 1 : null,
          confidentiel_label: d.niveau_confidentialite_libelle || undefined,
          redacteur: getEmail(d.redacteur_id),
          revu: getEmail(d.revu_par_id),
          approuve: getEmail(d.approuve_par_id),
        };
      });
      setDocs(mapped);
      setUsers(usersData);
      const procs = Array.from(new Set(docsData.map((d) => d.processus).filter(Boolean))) as string[];
      setProcessList(procs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadDocuments();
  }, []);

  const showToast = (msg: string, type: string) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3200);
  };

  const openDetail = (doc: WorkflowCard) => {
    setSelectedDoc(doc);
  };

  const closeDetail = () => {
    setSelectedDoc(null);
  };

  const triggerAction = (docId: string | number, action: string) => {
    const d = docs.find((x) => x.id === docId);
    if (!d) return;
    const cfg = ACTION_CONFIG[action];
    if (!cfg) return;

    setPendingAction({ docId, action });
    setShowModal(true);
  };

  const confirmAction = async () => {
    if (!pendingAction) return;
    const { docId, action } = pendingAction;
    const cfg = ACTION_CONFIG[action];
    const d = docs.find((x) => x.id === docId);
    if (!d) return;

    setShowModal(false);
    setBusy(true);

    try {
      if (action === 'modifier') {
        onEditDocument?.(d);
        setPendingAction(null);
        return;
      }
      if (cfg.nextStatut) {
        if (cfg.nextStatut === 'ARCHIVE') {
          setDocs((prev) => prev.filter((x) => x.id !== docId));
        } else {
          await transitionWorkflow(docId, cfg.nextStatut, comment || undefined);
        }
      }
      if (action === 'nouvelle_revision') {
        await createDocumentRevision(docId, 'Nouvelle révision créée depuis le workflow');
      }

      setComment('');
      showToast(`${d.code} ${cfg.toast}`, cfg.toastType);
      await reloadDocuments();
      const updated = docs.find((x) => x.id === docId);
      if (updated && cfg.nextStatut !== 'ARCHIVE') {
        setSelectedDoc({ ...updated, statut: cfg.nextStatut || updated.statut });
      } else if (cfg.nextStatut === 'ARCHIVE') {
        setSelectedDoc(null);
        closeDetail();
      }
    } catch (err) {
      console.error(err);
      showToast('Erreur lors de l\'action', 'error');
    } finally {
      setBusy(false);
      setPendingAction(null);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setPendingAction(null);
  };

  const filteredDocs = docs.filter((d) => {
    if (activePill === 'mes-taches') {
      if (users.length === 0) return true;
      if (user?.email) {
        const me = user.email.toLowerCase();
        const isMine = (d.redacteur || '').toLowerCase() === me ||
                       (d.revu || '').toLowerCase() === me ||
                       (d.approuve || '').toLowerCase() === me;
        if (!isMine) return false;
      }
    } else if (activePill === 'retard') {
      if (!d.jours || d.jours <= 0) return false;
    }

    if (filterProcess && d.processus !== filterProcess) return false;
    if (filterAssignee && d.redacteur !== filterAssignee && d.revu !== filterAssignee && d.approuve !== filterAssignee) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      if (!(d.titre || '').toLowerCase().includes(q) && !(d.code || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const counts: Record<Statut, number> = {
    BROUILLON: filteredDocs.filter((d) => d.statut === 'BROUILLON').length,
    EN_REVUE: filteredDocs.filter((d) => d.statut === 'EN_REVUE').length,
    APPROUVE: filteredDocs.filter((d) => d.statut === 'APPROUVE').length,
    APPLICABLE: filteredDocs.filter((d) => d.statut === 'APPLICABLE').length,
    OBSOLETE: 0,
    ARCHIVE: 0,
  };

const cardActions = (d: WorkflowCard) => {
    if (d.statut === 'BROUILLON') {
      return (
        <>
          <button className="card-btn cb-primary" onClick={(e) => { e.stopPropagation(); triggerAction(d.id, 'soumettre'); }} disabled={!hasPermission('write')}>📤 Soumettre à revue</button>
          <button className="card-btn cb-ghost" onClick={(e) => { e.stopPropagation(); openDetail(d); }}>···</button>
        </>
      );
    }
    if (d.statut === 'EN_REVUE') {
      return (
        <>
          <button className="card-btn cb-blue" onClick={(e) => { e.stopPropagation(); triggerAction(d.id, 'approuver_revue'); }} disabled={!hasPermission('approve')}>✅ Approuver</button>
          <button className="card-btn cb-danger" onClick={(e) => { e.stopPropagation(); triggerAction(d.id, 'retourner'); }} disabled={!hasPermission('write')}>↩ Retourner</button>
        </>
      );
    }
    if (d.statut === 'APPROUVE') {
      return (
        <>
          <button className="card-btn cb-primary" onClick={(e) => { e.stopPropagation(); triggerAction(d.id, 'rendre_applicable'); }} disabled={!hasPermission('approve')}>📢 Rendre applicable</button>
          <button className="card-btn cb-ghost" onClick={(e) => { e.stopPropagation(); triggerAction(d.id, 'retourner'); }} disabled={!hasPermission('write')}>↩ Retourner</button>
        </>
      );
    }
    if (d.statut === 'APPLICABLE') {
      return (
        <>
          <button className="card-btn cb-ghost" onClick={(e) => { e.stopPropagation(); triggerAction(d.id, 'nouvelle_revision'); }} disabled={!hasPermission('write')}>🔄 Créer Rév.</button>
          <button className="card-btn cb-danger" onClick={(e) => { e.stopPropagation(); triggerAction(d.id, 'archiver'); }} disabled={!hasPermission('approve')}>📦 Archiver</button>
        </>
      );
    }
    return null;
  };

  const cardDateLine = (d: WorkflowCard) => {
    if (d.dateApp) return `📅 Applicable depuis le ${fmtDate(d.dateApp)}`;
    if (d.dateRed) return `✍️ Rédigé le ${fmtDate(d.dateRed)}`;
    return '';
  };

  const fmtDate = (s: string | null) => {
    if (!s) return '—';
    const [y, m, day] = s.split('-');
    return `${day}/${m}/${y}`;
  };

  const selectedDocDetail = () => {
    if (!selectedDoc) return null;
    const u = getUserObj(selectedDoc.redacteur);
    const urev = getUserObj(selectedDoc.revu);
    const uapp = getUserObj(selectedDoc.approuve);
    const si = STATUTS.indexOf(toStatutCode(selectedDoc.statut) as Statut);

    const audits: { av: string; text: string; time: string; badge: string; bgBadge: string; cBadge: string }[] = [
      { av: selectedDoc.redacteur || '', text: `<strong>${u.name}</strong> a créé le brouillon Rév. ${selectedDoc.rev}`, time: fmtDate(selectedDoc.dateRed), badge: 'Créé', bgBadge: '#E5E7EB', cBadge: '#374151' },
    ];
    if (selectedDoc.dateRevue) {
      audits.push({ av: selectedDoc.redacteur || '', text: `<strong>${u.name}</strong> a soumis à revue`, time: fmtDate(selectedDoc.dateRevue), badge: 'Soumis', bgBadge: '#FEF3C7', cBadge: '#D97706' });
    }
    if (selectedDoc.statut === 'APPROUVE' || selectedDoc.statut === 'APPLICABLE') {
      audits.push({ av: selectedDoc.revu || '', text: `<strong>${urev.name}</strong> a approuvé la revue`, time: fmtDate(selectedDoc.dateApp || selectedDoc.dateRevue), badge: 'Approuvé', bgBadge: '#DBEAFE', cBadge: '#1D4ED8' });
    }
    if (selectedDoc.statut === 'APPLICABLE') {
      audits.push({ av: selectedDoc.approuve || '', text: `<strong>${uapp.name}</strong> a rendu le document applicable`, time: fmtDate(selectedDoc.dateApp), badge: 'Applicable', bgBadge: '#D1FAE5', cBadge: '#059669' });
    }

    let actionsBtns: React.ReactNode = null;
    if (selectedDoc.statut === 'BROUILLON') {
      actionsBtns = (
        <>
          <button className="dp-btn dpb-green" onClick={() => triggerAction(selectedDoc.id, 'soumettre')} disabled={!hasPermission('write')}>📤 Soumettre à revue</button>
          <button className="dp-btn dpb-ghost" onClick={() => triggerAction(selectedDoc.id, 'modifier')} disabled={!hasPermission('write')}>✏️ Modifier le brouillon</button>
        </>
      );
    } else if (selectedDoc.statut === 'EN_REVUE') {
      actionsBtns = (
        <>
          <button className="dp-btn dpb-blue" onClick={() => triggerAction(selectedDoc.id, 'approuver_revue')} disabled={!hasPermission('approve')}>✅ Approuver</button>
          <button className="dp-btn dpb-amber" onClick={() => triggerAction(selectedDoc.id, 'retourner')} disabled={!hasPermission('write')}>↩ Retourner</button>
          <button className="dp-btn dpb-ghost" onClick={() => triggerAction(selectedDoc.id, 'demander_info')}>💬 Demander des infos</button>
        </>
      );
    } else if (selectedDoc.statut === 'APPROUVE') {
      actionsBtns = (
        <>
          <button className="dp-btn dpb-green" onClick={() => triggerAction(selectedDoc.id, 'rendre_applicable')} disabled={!hasPermission('approve')}>📢 Rendre applicable</button>
          <button className="dp-btn dpb-amber" onClick={() => triggerAction(selectedDoc.id, 'retourner')} disabled={!hasPermission('write')}>↩ Retourner</button>
        </>
      );
    } else if (selectedDoc.statut === 'APPLICABLE') {
      actionsBtns = (
        <>
          <button className="dp-btn dpb-ghost" onClick={() => triggerAction(selectedDoc.id, 'nouvelle_revision')} disabled={!hasPermission('write')}>🔄 Créer Rév. {selectedDoc.rev + 1}</button>
          <button className="dp-btn dpb-danger" onClick={() => triggerAction(selectedDoc.id, 'archiver')} disabled={!hasPermission('approve')}>📦 Archiver</button>
        </>
      );
    }

    return (
      <>
        <div className="dp-header">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="dp-code">{selectedDoc.code}</div>
            <div className="dp-title">{selectedDoc.titre}</div>
          </div>
          <div className="dp-close" onClick={closeDetail}>✕</div>
        </div>
        <div className="dp-body">
          <div className="mini-timeline">
            {['Brouillon', 'En revue', 'Approuvé', 'Applicable'].map((lbl, i) => (
              <div key={lbl} className={`mt-step ${i < si ? 'done' : i === si ? 'active' : ''}`}>
                <div className="mt-dot">{i < si ? '✓' : i + 1}</div>
                <div className="mt-lbl">{lbl}</div>
              </div>
            ))}
          </div>

          <div className="dp-section">
            <div className="dp-section-title">📋 Document</div>
            <div className="dp-row"><span className="dp-key">Codification</span><span className="dp-val code">{selectedDoc.code}</span></div>
            <div className="dp-row"><span className="dp-key">Processus</span><span className="dp-val">{selectedDoc.processus}</span></div>
            <div className="dp-row"><span className="dp-key">Révision</span><span className="dp-val">Rév. {selectedDoc.rev}</span></div>
            <div className="dp-row"><span className="dp-key">Confidentialité</span><span className="dp-val">{selectedDoc.confidentiel_label || (selectedDoc.confidentiel === 3 ? 'Confidentiel' : selectedDoc.confidentiel === 2 ? 'Interne' : 'Public')}</span></div>
            <div className="dp-row"><span className="dp-key">Motif</span><span className="dp-val" style={{ maxWidth: 180, textAlign: 'right', wordBreak: 'break-word' }}>{selectedDoc.motif || '—'}</span></div>
          </div>

          <div className="dp-section">
            <div className="dp-section-title">👤 Responsables</div>
            {[
              ['✍️ Rédacteur', selectedDoc.redacteur],
              ['🔍 Relecteur', selectedDoc.revu],
              ['✅ Approbateur', selectedDoc.approuve],
            ].map(([role, uid]) => {
              const usr = getUserObj(uid);
              return (
                <div key={role} className="dp-row">
                  <span className="dp-key">{role}</span>
                  <span className="dp-val" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 18, height: 18, borderRadius: '50%', background: usr.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#fff' }}>{usr.initials}</span>
                    {usr.name}
                  </span>
                </div>
              );
            })}
        </div>

          {selectedDoc.statut !== 'APPLICABLE' && (
            <div className="dp-section">
              <div className="dp-section-title">💬 Commentaire (optionnel)</div>
              <div className="comment-box">
                <textarea
                  id="dp-comment"
                  placeholder="Ajouter un commentaire à l'action (visible dans la piste d'audit)…"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <div className="comment-box-footer">
                  <button style={{ background: 'var(--surface-2)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '4px 10px', fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer' }}>Enregistrer le commentaire</button>
                </div>
              </div>
            </div>
          )}

          <div className="dp-section">
            <div className="dp-section-title">⚡ Actions</div>
            <div className="dp-actions">{actionsBtns}</div>
          </div>

          <div className="dp-section">
            <div className="dp-section-title">📜 Piste d'audit</div>
            {audits.map((a, idx) => (
              <div key={idx} className="audit-item">
                <div className="audit-av" style={{ background: getUserObj(a.av).color }}>{getUserObj(a.av).initials}</div>
                <div className="audit-content">
                  <div className="audit-text" dangerouslySetInnerHTML={{ __html: a.text + ` <span className="audit-badge" style="background:${a.bgBadge};color:${a.cBadge}">${a.badge}</span>` }} />
                  <div className="audit-time">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  };

  const modalCfg = pendingAction ? ACTION_CONFIG[pendingAction.action] : null;
  const modalDoc = pendingAction ? docs.find((d) => d.id === pendingAction.docId) : null;

  if (loading) return <p style={{ padding: 20 }}>Chargement…</p>;

  const activeModalCfg = showModal && modalCfg ? modalCfg : null;
  const activeModalDoc = showModal && modalDoc ? modalDoc : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* TOPBAR */}
      <div className="wf-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="logo-icon">📋</div>
          <div className="logo-text">GED Qualité</div>
          <span className="logo-sep">/</span>
          <span className="topbar-page"><strong>Workflow</strong> d'approbation</span>
        </div>

        <div className="tb-pills">
          <div className={`tb-pill ${activePill === 'mes-taches' ? 'active' : ''}`} onClick={() => setActivePill('mes-taches')}>Mes tâches</div>
          <div className={`tb-pill ${activePill === 'tous' ? 'active' : ''}`} onClick={() => setActivePill('tous')}>Tous les documents</div>
          <div className={`tb-pill ${activePill === 'retard' ? 'active' : ''}`} onClick={() => setActivePill('retard')}>En retard</div>
        </div>

          <div className="tb-right">
            <div className="tb-search">
              <span style={{ color: 'rgba(255,255,255,.35)', fontSize: 13 }}>🔍</span>
              <input
                type="text"
                placeholder="Chercher un document…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {user && (
              <div className="user-chip">
                <div className="user-av">{getUserObj(user.email).initials}</div>
                <div className="user-name-tb">{getUserObj(user.email).name}</div>
              </div>
            )}
          </div>
      </div>

      {/* STATS BAR */}
      <div className="stats-bar">
        <div className="stat-item" onClick={() => {}}>
          <div className="stat-num slate">{counts.BROUILLON}</div>
          <div className="stat-label">En<br />brouillon</div>
        </div>
        <div className="stat-item" onClick={() => {}}>
          <div className="stat-num amber">{counts.EN_REVUE}</div>
          <div className="stat-label">En attente de<br />revue</div>
        </div>
        <div className="stat-item" onClick={() => {}}>
          <div className="stat-num blue">{counts.APPROUVE}</div>
          <div className="stat-label">Approuvés,<br />à publier</div>
        </div>
        <div className="stat-item" onClick={() => {}}>
          <div className="stat-num green">{counts.APPLICABLE}</div>
          <div className="stat-label">Applicables<br />ce mois</div>
        </div>

        <div className="stats-bar-right">
          <select className="filter-sel" value={filterProcess} onChange={(e) => setFilterProcess(e.target.value)}>
            <option value="">Tous les processus</option>
            {processList.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select className="filter-sel" value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}>
            <option value="">Tous les assignés</option>
            {users.map((u) => <option key={u.email} value={u.email}>{u.nom}</option>)}
          </select>
        </div>
      </div>

      {/* KANBAN + DETAIL */}
      <div className="kanban-area">
        <div className="kanban-scroll">
          {STATUTS.map((s) => {
            const colDocs = filteredDocs.filter((d) => d.statut === s);
            return (
              <div key={s} className={`col col-${s.toLowerCase()}`}>
                <div className="col-header">
                  <div className={`col-dot dot-${s === 'BROUILLON' ? 'slate' : s === 'EN_REVUE' ? 'amber' : s === 'APPROUVE' ? 'blue' : 'green'}`}></div>
                  <div className="col-title">{STATUT_LABELS[s]}</div>
                  <div className="col-count">{colDocs.length}</div>
                </div>
<div className="col-body">
                   {colDocs.length === 0 ? (
                     <div className="col-empty">
                       <div className="em-icon">📭</div>
                       <div>Aucun document ici</div>
                     </div>
                   ) : (
                    colDocs.map((d) => {
                      const user = getUserObj(d.redacteur);
                      const revUser = getUserObj(d.revu);
                      const appUser = getUserObj(d.approuve);
                      const urgentCls = d.urgent ? 'urgent' : '';
                      const daysTag = d.urgent && d.jours
                        ? `<span className="meta-tag mt-days">⚡ Urgent · ${d.jours}j</span>`
                        : (!d.urgent && d.jours && d.jours <= 10)
                          ? `<span className="meta-tag mt-days-ok">⏱ ${d.jours}j restants</span>`
                          : '';

                      return (
                        <div
                          key={d.id}
                          className={`wf-card ${urgentCls} ${selectedDoc?.id === d.id ? 'selected' : ''}`}
                          onClick={() => openDetail(d)}
                        >
                          <div className="card-top">
                            <span className="card-code">{d.code}</span>
                            {d.confidentiel === 3 && <span className="card-urgency" title="Confidentiel">🔐</span>}
                          </div>
                          <div className="card-title">{d.titre}</div>
                          <div className="card-meta">
                            <span className="meta-tag mt-proc">{d.processus}</span>
                            <span className="meta-tag mt-type">Rév. {d.rev}</span>
                            {daysTag && <span className="meta-tag mt-days" dangerouslySetInnerHTML={{ __html: daysTag }} />}
                          </div>
                          <div className="card-people">
                            <div className="avatar-xs" style={{ background: user.color }} title={user.name}>{user.initials}</div>
                            <div className="avatar-xs av-blue" title={revUser.name}>{revUser.initials}</div>
                            <div className="avatar-xs av-gold" title={appUser.name}>{appUser.initials}</div>
                            <span className="people-lbl">{user.name}</span>
                          </div>
                          <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                            {cardActions(d)}
                          </div>
                          {cardDateLine(d) && <div className="card-date">{cardDateLine(d)}</div>}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* DETAIL PANEL */}
        <div className={`detail-panel ${selectedDoc ? 'open' : ''}`}>
          {selectedDoc ? (
            <div id="dp-inner" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              {selectedDocDetail()}
            </div>
          ) : (
            <div style={{ padding: 24, color: 'var(--text-light)', textAlign: 'center', fontSize: 12 }}>
              Sélectionnez une carte pour voir les détails
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
      {activeModalCfg && activeModalDoc && (
        <div className="modal-overlay open" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">{activeModalCfg.icon}</div>
            <div className="modal-title">{activeModalCfg.title}</div>
            <div className="modal-desc">{activeModalCfg.desc}</div>
            <div className="modal-doc-chip">
              <span className="modal-doc-code">{activeModalDoc.code}</span>
              <span style={{ color: 'var(--text-muted)' }}>{activeModalDoc.titre.length > 32 ? activeModalDoc.titre.slice(0, 32) + '…' : activeModalDoc.titre}</span>
            </div>
            <div className="modal-actions">
              <button className="btn btn-cancel" onClick={closeModal}>Annuler</button>
              <button className={`btn ${activeModalCfg.btnClass}`} onClick={confirmAction} disabled={busy}>
                {busy ? '…' : activeModalCfg.btnLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOASTS */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map((t) => (
            <div key={t.id} className={`toast ${t.type}`}>
              <span>{t.type === 'success' ? '✅' : t.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
              <span>{t.msg}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Workflow;
