import React, { useEffect, useState } from 'react';
import { fetchDocuments, normalizeStatut } from '../services/api';
import type { Document } from '../services/api';

interface DocumentListPaneProps {
  onSelect?: (doc: Document) => void;
  refreshKey?: number;
}

const DocumentListPane: React.FC<DocumentListPaneProps> = ({ onSelect, refreshKey }) => {
  const [documents, setDocuments] = useState<Document[]>([]);

  useEffect(() => {
    fetchDocuments().then(setDocuments);
  }, [refreshKey]);

  const badgeLabel = (statut: string) => {
    const map: Record<string, string> = {
      'BROUILLON': 'Brouillon',
      'EN_REVUE': 'En revue',
      'APPROUVE': 'Approuvé',
      'APPLICABLE': 'Applicable',
      'OBSOLETE': 'Obsolète',
      'ARCHIVE': 'Archivé',
    };
    return map[(statut || 'BROUILLON').toUpperCase()] || 'Brouillon';
  };

  const badgeClass = (statut: string) => {
    const map: Record<string, string> = {
      'BROUILLON': 's-brouillon',
      'EN_REVUE': 's-en-revue',
      'APPROUVE': 's-approuve',
      'APPLICABLE': 's-applicable',
      'OBSOLETE': 's-obsolete',
      'ARCHIVE': 's-archive',
    };
    const key = (statut || 'BROUILLON').toUpperCase();
    return map[key] || 's-brouillon';
  };

  return (
    <div className="list-pane">
      <div className="list-toolbar">
        <div className="filter-chip active">Tous</div>
        <div className="filter-chip">PRO</div>
        <div className="filter-chip">MOD</div>
        <div className="filter-chip">INS</div>
        <div className="filter-chip">FOR</div>
        <span className="list-count">{documents.length} résultats</span>
      </div>

      <div className="doc-list">
        {documents.map((doc) => (
          <div 
            key={doc.id} 
            className="doc-item"
            onClick={() => onSelect?.(doc)}
          >
            <div className="doc-item-header">
              <span className="doc-code">{doc.codification || '—'}</span>
              <span className={`status-badge ${badgeClass(doc.statut || 'BROUILLON')}`}>
                {badgeLabel(doc.statut || 'BROUILLON')}
              </span>
            </div>
            <div className="doc-title-text">{doc.titre || '—'}</div>
            <div className="doc-meta">
              <span className="doc-process">{doc.processus || '—'}</span>
              <span className="doc-rev">Rév. {doc["N° de révision"] ?? 0}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentListPane;