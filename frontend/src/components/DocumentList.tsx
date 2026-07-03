import React, { useEffect, useState, useMemo } from 'react';
import { fetchWorkflowDocuments, fetchWorkflowUsers, transitionWorkflow, normalizeStatut } from '../services/api';
import { useUser } from '../contexts/UserContext';
import type { WorkflowDocument, UserRef } from '../services/api';

const TYPE_CODE_TO_LIBELLE: Record<string, string> = {
  PRO: 'Procédure',
  MOD: 'Mode opératoire',
  INS: 'Instruction',
  FOR: 'Enregistrement',
  TAB: 'Tableau',
  MAN: 'Manuel',
};

interface DocumentListProps {
  onAdd: () => void;
  onView: (doc: WorkflowDocument) => void;
  onEdit: (doc: WorkflowDocument) => void;
  searchTerm?: string;
  selectedId?: number | string | null;
}

const DocumentList: React.FC<DocumentListProps> = ({ onAdd, onView, onEdit, searchTerm = '', selectedId = null }) => {
  const [documents, setDocuments] = useState<WorkflowDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const { user } = useUser();

  useEffect(() => {
    const loadDocuments = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchWorkflowDocuments();
        setDocuments(data);
      } catch (err) {
        setError('Impossible de charger les documents');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadDocuments();
  }, []);

  const reloadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWorkflowDocuments();
      setDocuments(data);
    } catch (err) {
      setError('Impossible de charger les documents');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const badgeLabel = (statut: string | null) => {
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

  const badgeClass = (statut: string | null) => {
    const map: Record<string, string> = {
      'BROUILLON': 's-brouillon',
      'EN_REVUE': 's-en-revue',
      'APPROUVE': 's-approuve',
      'APPLICABLE': 's-applicable',
      'OBSOLETE': 's-obsolete',
      'ARCHIVE': 's-archive',
    };
    return map[(statut || 'BROUILLON').toUpperCase()] || 's-brouillon';
  };

  const displayedDocuments = useMemo(() => {
    let result = documents;

    if (activeFilter !== 'ALL') {
      const libelle = TYPE_CODE_TO_LIBELLE[activeFilter];
      if (libelle) {
        result = result.filter(d => d.type_document === libelle);
      }
    }

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter(doc => {
        const nivel = String(doc.niveau_confidentialite_libelle || '');
        const nivelCode = String(doc.niveau_confidentialite || '');
        const nivelLabel = nivel || (nivelCode === '1' ? 'Public' : nivelCode === '2' ? 'Interne' : nivelCode === '3' ? 'Confidentiel' : '');

        return (
          (doc.titre?.toLowerCase() || '').includes(term) ||
          (doc.codification?.toLowerCase() || '').includes(term) ||
          (doc.processus?.toLowerCase() || '').includes(term) ||
          (doc.type_document?.toLowerCase() || '').includes(term) ||
          nivel.toLowerCase().includes(term) ||
          nivelLabel.toLowerCase().includes(term) ||
          (doc.statut?.toLowerCase() || '').includes(term)
        );
      });
    }

    return result;
  }, [documents, activeFilter, searchTerm]);

  const handleFilterClick = (type: string) => {
    setActiveFilter(type);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="list-pane">
        <div className="list-toolbar">
          <div className="filter-chip active">Tous</div>
          <div className="filter-chip">PRO</div>
          <div className="filter-chip">MOD</div>
          <div className="filter-chip">INS</div>
          <div className="filter-chip">FOR</div>
          <div className="filter-chip">TAB</div>
          <div className="filter-chip">MAN</div>
          <span className="list-count">Chargement...</span>
        </div>
        <div className="doc-list">
          {[1, 2, 3].map(i => (
            <div key={i} className="doc-item doc-skeleton">
              <div className="doc-item-header">
                <span className="doc-code">—</span>
                <span className="status-badge">—</span>
              </div>
               <div className="doc-title-text skeleton-bar"></div>
              <div className="doc-meta">
                <span className="skeleton-text"></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="list-pane">
        <div className="list-toolbar">
          <div className="filter-chip active">Tous</div>
          <div className="filter-chip">PRO</div>
          <div className="filter-chip">MOD</div>
          <div className="filter-chip">INS</div>
          <div className="filter-chip">FOR</div>
          <div className="filter-chip">TAB</div>
          <div className="filter-chip">MAN</div>
          <span className="list-count">Erreur</span>
        </div>
        <div className="doc-list">
          <div className="empty-state">
            <p className="empty-state-text">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="list-pane">
      <div className="list-toolbar">
        <div className={`filter-chip ${activeFilter === 'ALL' ? 'active' : ''}`} onClick={() => handleFilterClick('ALL')}>Tous</div>
        <div className={`filter-chip ${activeFilter === 'PRO' ? 'active' : ''}`} onClick={() => handleFilterClick('PRO')}>PRO</div>
        <div className={`filter-chip ${activeFilter === 'MOD' ? 'active' : ''}`} onClick={() => handleFilterClick('MOD')}>MOD</div>
        <div className={`filter-chip ${activeFilter === 'INS' ? 'active' : ''}`} onClick={() => handleFilterClick('INS')}>INS</div>
        <div className={`filter-chip ${activeFilter === 'FOR' ? 'active' : ''}`} onClick={() => handleFilterClick('FOR')}>FOR</div>
        <div className={`filter-chip ${activeFilter === 'TAB' ? 'active' : ''}`} onClick={() => handleFilterClick('TAB')}>TAB</div>
        <div className={`filter-chip ${activeFilter === 'MAN' ? 'active' : ''}`} onClick={() => handleFilterClick('MAN')}>MAN</div>
        <span className="list-count">{displayedDocuments.length} résultat{displayedDocuments.length > 1 ? 's' : ''}</span>
      </div>

      <div className="doc-list">
        {displayedDocuments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <p className="empty-state-title">Aucun document trouvé</p>
            <p className="empty-state-text">
              {searchTerm
                ? 'Aucun résultat ne correspond à votre recherche. Essayez de modifier les critères.'
                : 'Le registre est vide. Commencez par créer un nouveau document.'}
            </p>
          </div>
        ) : (
          displayedDocuments.map((doc) => (
            <div
              key={doc.document_id}
              className={`doc-item ${doc.document_id === selectedId ? 'active' : ''}`}
              onClick={() => onView(doc)}
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
                <span className="doc-rev">Rév. {doc.numero_revision ?? 0}</span>
                <span className="doc-rev">• {formatDate(doc.date_application) || 'Non publiée'}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DocumentList;
