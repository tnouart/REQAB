import React, { useState, useEffect, useMemo } from 'react';
import { fetchAuditLogs } from '../services/api';
import type { AuditLog } from '../services/api';
import { useUser } from '../contexts/UserContext';

interface AuditFilter {
  q: string;
  action: string;
  user: string;
  period: string;
}

const ACTION_LABELS: Record<string, { lbl: string; cls: string; ic: string }> = {
  UPDATE: { lbl: 'Modification', cls: 'ab-user', ic: '✏️' },
  INSERT: { lbl: 'Création', cls: 'ab-create', ic: '✍️' },
  DELETE: { lbl: 'Suppression', cls: 'ab-archive', ic: '🗑️' },
  TRANSITION: { lbl: 'Transition', cls: 'ab-submit', ic: '📤' },
  CREATE_REVISION: { lbl: 'Révision créée', cls: 'ab-create', ic: '🔄' },
  SIGNATURE: { lbl: 'Signature', cls: 'ab-approve', ic: '✅' },
  DESTRUCTION: { lbl: 'Destruction', cls: 'ab-archive', ic: '📦' },
  LOGIN: { lbl: 'Connexion', cls: 'ab-submit', ic: '🔑' },
  EXPORT: { lbl: 'Export', cls: 'ab-download', ic: '⬇️' },
  IMPORT: { lbl: 'Import', cls: 'ab-download', ic: '📥' },
};

const USERS_MAP: Record<string, { name: string; color: string }> = {
  'admin@qualite.com': { name: 'Admin', color: '#1D4ED8' },
  'qualite@qualite.com': { name: 'Resp. Qualité', color: '#059669' },
  'user@qualite.com': { name: 'Rédacteur', color: '#D97706' },
  'viewer@qualite.com': { name: 'Lecteur', color: '#7C3AED' },
  'anonymous': { name: 'Anonyme', color: '#6B7280' },
};

const statusLabels: Record<string, string> = {
  BROUILLON: 'Brouillon',
  EN_REVUE: 'En revue',
  APPROUVE: 'Approuvé',
  APPLICABLE: 'Applicable',
  OBSOLETE: 'Obsolète',
  ARCHIVE: 'Archivé',
};

const getStatusBadgeClass = (status: string) => {
  const classes: Record<string, string> = {
    BROUILLON: 'st-BROUILLON',
    EN_REVUE: 'st-EN_REVUE',
    APPROUVE: 'st-APPROUVE',
    APPLICABLE: 'st-APPLICABLE',
    OBSOLETE: 'st-OBSOLETE',
    ARCHIVE: 'st-ARCHIVE',
   };
  return classes[status] || '';
};


const AuditTrail: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AuditFilter>({ q: '', action: '', user: '', period: '30' });
  const { hasPermission } = useUser();

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true);
      try {
        const data = await fetchAuditLogs();
        setLogs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    const now = new Date();
    const periodDays = parseInt(filter.period) || 30;
    const cutoff = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    return logs.filter((log) => {
      if (filter.q) {
        const q = filter.q.toLowerCase();
        const docCode = (log.new_values as any)?.codification || (log.old_values as any)?.codification || '';
        const titre = (log.new_values as any)?.titre || (log.old_values as any)?.titre || '';
        const userName = USERS_MAP[log.user_email]?.name || log.user_email;
        if (!docCode.toLowerCase().includes(q) && !titre.toLowerCase().includes(q) && !userName.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (filter.action && log.action !== filter.action) return false;
      if (filter.user && log.user_email !== filter.user) return false;
      if (new Date(log.created_at) < cutoff) return false;
      return true;
    });
  }, [logs, filter]);

  const exportCSV = () => {
    const headers = ['Horodatage', 'Acteur', 'Document', 'Action', 'Transition', 'Détail'];
    const rows = filteredLogs.map((log) => {
      const docCode = (log.new_values as any)?.codification || (log.old_values as any)?.codification || '';
      const userName = USERS_MAP[log.user_email]?.name || log.user_email;
      const fromStatut = (log.old_values as any)?.statut;
      const toStatut = (log.new_values as any)?.statut;
      const transition = fromStatut && toStatut ? `${fromStatut} → ${toStatut}` : '';
      return [
        log.created_at,
        userName,
        docCode,
        log.action,
        transition,
        log.old_values ? JSON.stringify(log.old_values) : '',
      ];
    });
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `piste_audit_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const getUserObj = (email: string) => USERS_MAP[email] || { name: email, color: '#6B7280' };
  const getActionLabel = (action: string) => ACTION_LABELS[action] || { lbl: action, cls: 'ab-download', ic: '•' };

  return (
    <div className="detail-pane">
      <div className="view-header">
        <div>
          <div className="vh-title">📜 Piste d'audit</div>
          <div className="vh-sub">Toutes les actions sur les documents — immuable, conforme ISO 9001 §9.1</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={exportCSV} disabled={!hasPermission('export')}>⬇ Exporter CSV</button>
      </div>

      <div className="audit-filters">
        <input
          className="af-input"
          type="text"
          placeholder="🔍 Chercher par document, utilisateur…"
          value={filter.q}
          onChange={(e) => setFilter((f) => ({ ...f, q: e.target.value }))}
        />
        <select
          className="af-sel"
          value={filter.action}
          onChange={(e) => setFilter((f) => ({ ...f, action: e.target.value }))}
        >
          <option value="">Toutes les actions</option>
          <option value="UPDATE">Modification</option>
          <option value="INSERT">Création</option>
          <option value="DELETE">Suppression</option>
          <option value="TRANSITION">Transition</option>
          <option value="CREATE_REVISION">Révision créée</option>
          <option value="SIGNATURE">Signature</option>
          <option value="DESTRUCTION">Destruction</option>
        </select>
        <select
          className="af-sel"
          value={filter.user}
          onChange={(e) => setFilter((f) => ({ ...f, user: e.target.value }))}
        >
          <option value="">Tous les utilisateurs</option>
          {Object.entries(USERS_MAP).map(([email, u]) => (
            <option key={email} value={email}>{u.name}</option>
          ))}
        </select>
        <select
          className="af-sel"
          value={filter.period}
          onChange={(e) => setFilter((f) => ({ ...f, period: e.target.value }))}
        >
          <option value="7">7 derniers jours</option>
          <option value="30">30 derniers jours</option>
          <option value="90">3 derniers mois</option>
          <option value="365">1 an</option>
        </select>
        <div className="af-right">{filteredLogs.length} entrées</div>
      </div>

      <div className="audit-table-wrap">
        <table className="audit-tbl">
          <thead>
            <tr>
<th>Horodatage</th>
             <th>Acteur</th>
             <th>Document</th>
             <th>Action</th>
             <th>Transition de statut</th>
             <th>Détail</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24 }}>Chargement…</td></tr>
            ) : filteredLogs.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24 }}>Aucune entrée trouvée</td></tr>
            ) : (
              filteredLogs.map((log) => {
                const user = getUserObj(log.user_email);
                const action = getActionLabel(log.action);
                const docCode = (log.new_values as any)?.codification || (log.old_values as any)?.codification || `ID ${log.record_id}`;
                const titre = (log.new_values as any)?.titre || (log.old_values as any)?.titre || '';
                return (
                  <tr key={log.id}>
                    <td>
                      <div className="ts">{formatTime(log.created_at)}</div>
                      <div className="ts-date">{formatDate(log.created_at)}</div>
                    </td>
                    <td>
                      <div className="actor-cell">
                        <div className="av-sm" style={{ background: user.color }}>{user.name.substring(0, 2).toUpperCase()}</div>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{user.name}</span>
                      </div>
                    </td>
                    <td>
                      <div><span className="doc-code-cell">{docCode}</span></div>
                      {titre && <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 2 }}>{titre}</div>}
                    </td>
<td><span className={`action-badge ${action.cls}`}>{action.ic} {action.lbl}</span></td>
                     <td>
                       <div className="transition-cell">
                         {(log.old_values as any)?.statut && (
                           <span className={`st-badge st-${(log.old_values as any).statut}`}>
                             {statusLabels[(log.old_values as any).statut] || (log.old_values as any).statut}
                           </span>
                         )}
                         {(log.old_values as any)?.statut && (log.new_values as any)?.statut && (
                           <span className="arr">→</span>
                         )}
                         {(log.new_values as any)?.statut && (
                           <span className={`st-badge st-${(log.new_values as any).statut}`}>
                             {statusLabels[(log.new_values as any).statut] || (log.new_values as any).statut}
                           </span>
                         )}
                       </div>
                     </td>
                     <td>
                       <div className="detail-json">
                         {log.old_values && JSON.stringify(log.old_values).substring(0, 60)}…
                       </div>
                     </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditTrail;
