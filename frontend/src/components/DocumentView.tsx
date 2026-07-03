import React, { useEffect, useState } from 'react';
import { fetchDocumentRevisions, createDocumentRevision, transitionWorkflow, normalizeStatut, toStatutCode } from '../services/api';
import type { WorkflowDocument, Revision } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useUser } from '../contexts/UserContext';

interface DocumentViewProps {
  document: WorkflowDocument;
  onEdit: () => void;
  onBack: () => void;
  onDelete?: () => void;
  onRevisionCreated?: (revision?: Revision) => void;
}

type ConfirmAction = 'delete' | 'revision' | 'transition';

const DocumentView: React.FC<DocumentViewProps> = ({ document, onEdit, onBack, onDelete, onRevisionCreated }) => {
  const { showToast } = useToast();
  const { hasPermission } = useUser();
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [busy, setBusy] = useState(false);
  const [statut, setStatut] = useState<string>(document.statut || 'BROUILLON');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);
  const [confirmLabel, setConfirmLabel] = useState<string>('');
  const [confirmDesc, setConfirmDesc] = useState<string>('');

  useEffect(() => {
    setStatut(document.statut || 'BROUILLON');
    const loadRevisions = async () => {
      const data = await fetchDocumentRevisions(document.document_id);
      setRevisions(data);
    };
    loadRevisions();
  }, [document.document_id, document.statut]);

  const nivelLabel = document.niveau_confidentialite_libelle || (String(document.niveau_confidentialite) === '3' ? 'Confidentiel' :
                     String(document.niveau_confidentialite) === '2' ? 'Interne' :
                     String(document.niveau_confidentialite) === '1' ? 'Public' : '—');

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getDaysLate = () => {
    if (!document.date_prochaine_revision) return null;
    const next = new Date(document.date_prochaine_revision);
    const now = new Date();
    const diff = Math.ceil((now.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : null;
  };

  const daysLate = getDaysLate();

  const badgeLabel = (statut: string) => {
    const map: Record<string, string> = {
      'BROUILLON': 'Brouillon',
      'EN_REVUE': 'En revue',
      'APPROUVE': 'Approuvé',
      'APPLICABLE': 'Applicable',
      'OBSOLETE': 'Obsolète',
      'ARCHIVE': 'Archivé',
    };
    return map[(statut || '').toUpperCase()] || 'Brouillon';
  };

  const statusBadge = (statut: string) => {
    const map: Record<string, string> = {
      'BROUILLON': 's-brouillon',
      'EN_REVUE': 's-en-revue',
      'APPROUVE': 's-approuve',
      'APPLICABLE': 's-applicable',
      'OBSOLETE': 's-obsolete',
      'ARCHIVE': 's-archive',
    };
    const cls = map[(statut || '').toUpperCase()] || 's-brouillon';
    return `status-badge ${cls}`;
  };

  const workflowSteps = [
    { label: 'Rédaction', icon: '✍️' },
    { label: 'En revue', icon: '🔍' },
    { label: 'Approuvé', icon: '✅' },
    { label: 'Applicable', icon: '📢' },
    { label: 'Obsolète', icon: '📦' },
  ];

  const statutCode = toStatutCode(statut);
  const currentStep = ['BROUILLON', 'EN_REVUE', 'APPROUVE', 'APPLICABLE', 'OBSOLETE'].indexOf(statutCode);

  const handleDownload = () => {
    if (document.fichier_nom) {
      window.open(`http://localhost:5000/uploads/${document.fichier_nom}`, '_blank');
    } else {
      showToast('warning', 'Aucun fichier attaché à ce document.');
    }
  };

  const handleCreateRevision = () => {
    openConfirm('revision', null, 'Créer une nouvelle révision', 'Le document passera en Brouillon (révision suivante). Cette action est traçable dans l\'historique.');
  };

  const handleDelete = () => {
    openConfirm('delete', null, 'Supprimer le document', 'Cette action est irréversible. Le document sera définitivement retiré du registre.');
  };

  const handleTransition = (target: string, label: string) => {
    openConfirm('transition', target, label, 'Le changement de statut sera enregistré dans la piste d\'audit.');
  };

  const openConfirm = (action: ConfirmAction, target: string | null, label: string, desc: string) => {
    setConfirmAction(action);
    setConfirmTarget(target);
    setConfirmLabel(label);
    setConfirmDesc(desc);
    setShowConfirmModal(true);
  };

  const closeConfirm = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmTarget(null);
    setConfirmLabel('');
    setConfirmDesc('');
  };

  const confirmActionHandler = async () => {
    if (!confirmAction) return;
    setBusy(true);
    try {
      if (confirmAction === 'delete') {
        onDelete?.();
        showToast('success', 'Document supprimé ✓');
      } else if (confirmAction === 'revision') {
        const newRev = await createDocumentRevision(document.document_id, 'Nouvelle révision créée');
        const updatedRevisions = await fetchDocumentRevisions(document.document_id);
        setRevisions(updatedRevisions);
        onRevisionCreated?.(newRev);
        showToast('success', 'Nouvelle révision créée ✓');
      } else if (confirmAction === 'transition' && confirmTarget) {
        await transitionWorkflow(document.document_id, confirmTarget, undefined);
        setStatut(confirmTarget);
        const updated = await fetchDocumentRevisions(document.document_id);
        setRevisions(updated);
        onRevisionCreated?.();
        showToast('success', `${confirmLabel} effectué ✓`);
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Erreur lors de l\'action');
    } finally {
      setBusy(false);
      closeConfirm();
    }
  };

  return (
    <div className="detail-pane">
      {daysLate && (
        <div className="alert-banner">
          <span className="alert-icon">🔴</span>
          <div>
            <div className="alert-text">Révision en retard</div>
            <div className="alert-sub">Date de prochaine révision : {formatDate(document.date_prochaine_revision)} (dépassée de {daysLate} jours)</div>
          </div>
        </div>
      )}

      <div className="workflow-bar">
        <h4>Cycle de vie de la révision courante {document.numero_revision != null && `(Rév. ${document.numero_revision})`}</h4>
        <div className="workflow-steps">
          {workflowSteps.map((step, i) => (
            <div key={step.label} className={`workflow-step ${i < currentStep ? 'done' : i === currentStep ? 'active' : ''}`}>
              <div className="step-dot">{i < currentStep ? '✓' : i + 1}</div>
              <div className="step-label">{step.label}</div>
              {i === currentStep && document.date_application && (
                <div className="step-date">{formatDate(document.date_application)}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="detail-header">
        <div className="detail-header-top">
          <div className="detail-type-icon">📋</div>
          <div className="flex-1">
            <div className="detail-code">{document.codification || '—'}</div>
            <div className="detail-title">{document.titre || '—'}</div>
            <div className="detail-tags">
              <span className="tag process-tag">{document.processus || '—'}</span>
              <span className="tag">{document.type_document === 'Procédure' ? 'Procédure' : document.type_document === 'Mode opératoire' ? 'Mode opératoire' : document.type_document === 'Instruction' ? 'Instruction' : document.type_document === 'Enregistrement' ? 'Enregistrement' : document.type_document === 'Tableau' ? 'Tableau' : 'Manuel'}</span>
              <span className="tag">Confid. niveau {document.niveau_confidentialite_libelle || document.niveau_confidentialite || '—'}</span>
                <span className={statusBadge(statut)}>
                  {badgeLabel(statut)}
                </span>
            </div>
          </div>
        </div>
        <div className="text-muted-sm">
          <strong>Motif de révision :</strong> {document.motif_modification || '—'}
        </div>
        <div className="detail-actions">
          <button
            className={`btn ${statutCode === 'APPLICABLE' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={handleDownload}
            disabled={!document.fichier_nom}
          >📥 Télécharger</button>

{statutCode === 'BROUILLON' && (
             <button className="btn btn-primary" onClick={() => handleTransition('EN_REVUE', 'Soumettre à revue')} disabled={busy || !hasPermission('write')}>📤 Soumettre à revue</button>
           )}
           {statutCode === 'EN_REVUE' && (
             <>
               <button className="btn btn-primary" onClick={() => handleTransition('APPROUVE', 'Approuver')} disabled={busy || !hasPermission('approve')}>✅ Approuver</button>
               <button className="btn btn-ghost" onClick={() => handleTransition('BROUILLON', 'Retour en brouillon')} disabled={busy || !hasPermission('write')}>↩ Retour brouillon</button>
             </>
           )}
           {statutCode === 'APPROUVE' && (
             <>
               <button className="btn btn-primary" onClick={() => handleTransition('APPLICABLE', 'Rendre applicable')} disabled={busy || !hasPermission('approve')}>📢 Rendre applicable</button>
               <button className="btn btn-ghost" onClick={() => handleTransition('BROUILLON', 'Retour en brouillon')} disabled={busy || !hasPermission('write')}>↩ Retour brouillon</button>
             </>
           )}
{statutCode === 'APPLICABLE' && (
             <button className="btn btn-ghost" onClick={handleCreateRevision} disabled={busy || !hasPermission('write')}>🔄 Créer Rév.</button>
           )}

           <button className="btn btn-ghost" onClick={onEdit} disabled={!hasPermission('write')}>✏️ Modifier</button>
           <button className="btn btn-ghost btn-danger ms-auto" onClick={handleDelete} disabled={!hasPermission('delete')}>🗑️ Supprimer</button>
        </div>
      </div>

      <div className="cards-grid">
        <div className="card">
          <h4>📅 Dates clés</h4>
          <div className="info-row"><span className="info-label">Date d'application</span><span className="info-value">{formatDate(document.date_application)}</span></div>
          <div className="info-row"><span className="info-label">Prochaine révision</span><span className="info-value">{formatDate(document.date_prochaine_revision)}</span></div>
          <div className="info-row"><span className="info-label">Révision N°</span><span className="info-value">{document.numero_revision ?? 0}</span></div>
        </div>

        <div className="card">
          <h4>👤 Responsabilités</h4>
          <div className="info-row"><span className="info-label">Rédacteur</span><span className="info-value">{document.redacteur_id || '—'}</span></div>
          <div className="info-row"><span className="info-label">Revu par</span><span className="info-value">{document.revu_par_id || '—'}</span></div>
          <div className="info-row"><span className="info-label">Approuvé par</span><span className="info-value">{document.approuve_par_id || '—'}</span></div>
        </div>

        <div className="card">
          <h4>🗂️ Conservation</h4>
          <div className="info-row"><span className="info-label">Lieu de classement</span><span className="info-value">{document.lieu_classement || '—'}</span></div>
          <div className="info-row"><span className="info-label">Durée de classement</span><span className="info-value">{document.duree_classement || '—'}</span></div>
          <div className="info-row"><span className="info-label">Lieu d'archivage</span><span className="info-value">{document.lieu_archivage || '—'}</span></div>
        </div>

        <div className="card">
          <h4>🔐 Accès & diffusion</h4>
          <div className="info-row"><span className="info-label">Confidentialité</span><span className="info-value">{nivelLabel}</span></div>
          <div className="info-row"><span className="info-label">Méthode classement</span><span className="info-value">{document.methode_classement_libelle || document.methode_classement || '—'}</span></div>
          <div className="info-row"><span className="info-label">Versions totales</span><span className="info-value">{revisions.length}</span></div>
        </div>
      </div>

      <div className="timeline-card">
        <h4>📜 Historique des révisions</h4>
        <div className="timeline">
          {revisions.map((rev) => (
            <div key={rev.id} className="tl-item">
              <div className="tl-left">
                <div className={`tl-dot ${rev.statut.toLowerCase()}`}>{rev.numero_revision}</div>
                <div className="tl-line"></div>
              </div>
              <div className="tl-content">
                <div className="tl-title">
                   Révision {rev.numero_revision} — <span className={statusBadge(rev.statut)}>{badgeLabel(rev.statut)}</span>
                </div>
                <div className="tl-meta">
                  {rev.date_application ? `Mise en application : ${formatDate(rev.date_application)}` : 'Non encore publiée'}
                </div>
                <div className="tl-motif">{rev.motif_modification || '—'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showConfirmModal && (
        <div className="modal-overlay open" onClick={closeConfirm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">{confirmAction === 'delete' ? '🗑️' : confirmAction === 'revision' ? '🔄' : '🔄'}</div>
            <div className="modal-title">{confirmLabel}</div>
            <div className="modal-desc">{confirmDesc}</div>
            <div className="modal-actions">
              <button className="btn btn-cancel" onClick={closeConfirm}>Annuler</button>
              <button className={`btn ${confirmAction === 'delete' ? 'btn-danger' : 'btn-primary'}`} onClick={confirmActionHandler} disabled={busy}>
                {busy ? '…' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentView;
