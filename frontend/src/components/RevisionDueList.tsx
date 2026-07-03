import React, { useEffect, useState } from 'react';
import { fetchDueRevisions } from '../services/api';
import type { DueRevision } from '../services/api';

interface RevisionDueListProps {
  onOpenDocument?: (id: number) => void;
}

const RevisionDueList: React.FC<RevisionDueListProps> = ({ onOpenDocument }) => {
  const [items, setItems] = useState<DueRevision[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDueRevisions().then((data) => { setItems(data); setLoading(false); });
  }, []);

  if (loading) return <p>Chargement…</p>;

  const getDaysClass = (dateStr: string) => {
    const diff = Math.ceil((new Date().getTime() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
    if (diff > 0) return ''; // retard
    if (diff > -30) return 'soon'; // bientôt
    return 'ok'; // ok
  };

  return (
    <div className="rev-list">
      {items.length === 0 ? (
        <div className="rev-item" style={{ justifyContent: 'center', color: 'var(--text-muted)' }}>Aucune révision planifiée.</div>
      ) : (
        items.map((item) => (
          <div key={item.id} className="rev-item" onClick={() => onOpenDocument?.(item.id)} style={{ cursor: 'pointer' }}>
            <div>
              <span className="rev-code">{item.codification || '—'}</span>
              <div className="rev-title">{item.titre}</div>
              {item.processus && <div className="rev-meta">{item.processus}</div>}
            </div>
            <div className={`rev-date ${getDaysClass(item.date_prochaine_revision)}`}>
              {new Date(item.date_prochaine_revision).toLocaleDateString('fr-FR')}
            </div>
            <div className="rev-actions" onClick={(e) => e.stopPropagation()}>
              <button className="btn btn-ghost btn-sm" title="Voir" onClick={() => onOpenDocument?.(item.id)}>👁️</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default RevisionDueList;