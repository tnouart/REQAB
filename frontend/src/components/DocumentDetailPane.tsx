import React, { useEffect, useState } from 'react';
import { fetchDocuments, toStatutCode } from '../services/api';
import type { Document } from '../services/api';

const DocumentDetailPane: React.FC = () => {
  const [, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  useEffect(() => {
    fetchDocuments().then(docs => {
      setDocuments(docs);
      setSelectedDoc(docs[0] || null);
    });
  }, []);

  if (!selectedDoc) {
    return (
      <div className="detail-pane">
        <div className="empty-state">
          <div className="empty-state-icon">📄</div>
          <p className="empty-state-title">Sélectionnez un document</p>
        </div>
      </div>
    );
  }

  const workflowSteps = [
    { label: 'Rédaction', icon: '✍️' },
    { label: 'En revue', icon: '🔍' },
    { label: 'Approuvé', icon: '✅' },
    { label: 'Applicable', icon: '📢' },
    { label: 'Obsolète', icon: '📦' },
  ];

  const currentStep = ['BROUILLON', 'EN_REVUE', 'APPROUVE', 'APPLICABLE', 'OBSOLETE'].indexOf(toStatutCode(selectedDoc.statut));

  return (
    <div className="detail-pane">
      {/* Workflow bar */}
      <div className="workflow-bar">
        <h4>Cycle de vie de la révision courante</h4>
        <div className="workflow-steps">
          {workflowSteps.map((step, i) => (
            <div key={step.label} className={`workflow-step ${i < currentStep ? 'done' : i === currentStep ? 'active' : ''}`}>
              <div className="step-dot">{i < currentStep ? '✓' : i + 1}</div>
              <div className="step-label">{step.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* En-tête document */}
      <div className="detail-header">
        <div className="detail-header-top">
          <div className="detail-type-icon">📋</div>
          <div style={{ flex: 1 }}>
            <div className="detail-code">{selectedDoc.codification || '—'}</div>
            <div className="detail-title">{selectedDoc.titre || '—'}</div>
            <div className="detail-tags">
              <span className="tag process-tag">{selectedDoc.processus || '—'}</span>
            </div>
          </div>
        </div>
        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '2px' }}>
          <strong>Motif de révision :</strong> {'—'}
        </div>
        <div className="detail-actions">
          <button className="btn btn-primary">📥 Télécharger PDF</button>
          <button className="btn btn-ghost">🔄 Créer Rév.</button>
          <button className="btn btn-ghost" style={{ marginLeft: 'auto' }}>⋯ Plus</button>
        </div>
      </div>

      {/* Cartes métadonnées */}
      <div className="cards-grid">
        <div className="card">
          <h4>📅 Dates clés</h4>
          <div className="info-row"><span className="info-label">Date d'application</span><span className="info-value">{selectedDoc["Date d'application"] || '—'}</span></div>
          <div className="info-row"><span className="info-label">Prochaine révision</span><span className="info-value">—</span></div>
          <div className="info-row"><span className="info-label">Révision N°</span><span className="info-value">{selectedDoc["N° de révision"] ?? 0}</span></div>
        </div>

        <div className="card">
          <h4>👤 Responsabilités</h4>
          <div className="info-row"><span className="info-label">Rédacteur</span><span className="info-value">—</span></div>
          <div className="info-row"><span className="info-label">Revu par</span><span className="info-value">—</span></div>
          <div className="info-row"><span className="info-label">Approuvé par</span><span className="info-value">—</span></div>
        </div>

        <div className="card">
          <h4>🗂️ Conservation</h4>
          <div className="info-row"><span className="info-label">Lieu de classement</span><span className="info-value">{selectedDoc['lieu de classement'] || '—'}</span></div>
          <div className="info-row"><span className="info-label">Durée de classement</span><span className="info-value">{selectedDoc["durée de classement"] || '—'}</span></div>
          <div className="info-row"><span className="info-label">Lieu d'archivage</span><span className="info-value">{selectedDoc["lieu d'archivage"] || '—'}</span></div>
        </div>

        <div className="card">
          <h4>🔐 Accès & diffusion</h4>
          <div className="info-row"><span className="info-label">Confidentialité</span><span className="info-value">{selectedDoc['niveau de confidentialité'] || '—'}</span></div>
          <div className="info-row"><span className="info-label">Méthode classement</span><span className="info-value">{selectedDoc['méthode de classement'] || '—'}</span></div>
        </div>
      </div>

      {/* Historique */}
      <div className="timeline-card">
        <h4>📜 Historique des révisions</h4>
        <div className="timeline">
          <div className="tl-item">
            <div className="tl-left">
              <div className="tl-dot applicable">0</div>
              <div className="tl-line"></div>
            </div>
            <div className="tl-content">
              <div className="tl-title">Révision 0 — Création initiale</div>
              <div className="tl-meta"> — </div>
              <div className="tl-motif">Document créé</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetailPane;