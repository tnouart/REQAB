import { useEffect, useState } from 'react';
import { fetchNotifications, type Notification } from '../services/api';
import { useToast } from '../contexts/ToastContext';

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (err) {
      showToast('error', 'Erreur lors du chargement des notifications');
    } finally {
      setLoading(false);
    }
  };

  const groups = {
    RETARD: notifications.filter(n => n.type === 'RETARD'),
    URGENT: notifications.filter(n => n.type === 'URGENT'),
    ANTICIPE: notifications.filter(n => n.type === 'ANTICIPE'),
  };

  const labels: Record<string, { l: string; col: string; bg: string; dot: string }> = {
    RETARD: { l: '🔴 En retard', col: 'var(--red)', bg: 'var(--red-l)', dot: '#DC2626' },
    URGENT: { l: '🟡 Urgent — moins de 30 jours', col: 'var(--amber)', bg: 'var(--amber-l)', dot: '#D97706' },
    ANTICIPE: { l: '🔵 À planifier — moins de 90 jours', col: 'var(--blue)', bg: 'var(--blue-l)', dot: '#2563EB' },
  };

  const fmtDate = (s: string) => {
    if (!s) return '—';
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
  };

  if (loading) {
    return (
      <div className="vscroll">
        <p className="empty-state-text">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="vscroll">
      <div className="page-header">
        <div className="ph-icon" style={{ background: '#EDE9FE' }}>🔔</div>
        <div>
          <div className="ph-title">Notifications d'échéance</div>
          <div className="ph-sub">Révisions à planifier — Revues à mener</div>
        </div>
      </div>

      <div className="scroll-body">
        {notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <p className="empty-state-title">Aucune notification</p>
            <p className="empty-state-text">Tous les documents sont à jour.</p>
          </div>
        ) : (
          Object.entries(groups).map(([type, items]) => {
            if (items.length === 0) return null;
            const { l, col, bg, dot } = labels[type];
            return (
              <div className="notif-group" key={type}>
                <div className="notif-group-label">
                  <div className="ng-dot" style={{ background: dot }}></div>
                  {l} ({items.length})
                </div>
                {items.map((n, idx) => {
                  const abs = Math.abs(n.jours);
                  const isRet = n.jours < 0;
                  const jLabel = isRet ? `+${abs}j de retard` : `J-${abs}`;
                  const pct = isRet ? 100 : Math.max(5, 100 - Math.round(abs / 90 * 100));
                  const r = 22;
                  const circ = 2 * Math.PI * r;
                  const ringCol = isRet ? '#DC2626' : n.jours < 30 ? '#D97706' : '#2563EB';
                  const ringBg = isRet ? '#FEE2E2' : n.jours < 30 ? '#FEF3C7' : '#DBEAFE';

                  return (
                    <div className={`notif-item unread ${isRet ? 'crit-item' : n.jours < 30 ? 'maj-item' : 'ok-item'}`} key={idx}>
                      <div className="countdown-ring">
                        <svg width="52" height="52" viewBox="0 0 52 52">
                          <circle cx="26" cy="26" r={r} fill="none" stroke={ringBg} strokeWidth="6" />
                          <circle
                            cx="26" cy="26" r={r} fill="none" stroke={ringCol} strokeWidth="6"
                            strokeDasharray={circ}
                            strokeDashoffset={circ * (1 - pct / 100)}
                            strokeLinecap="round"
                            style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
                          />
                        </svg>
                        <div className="cr-text">
                          <div className="cr-days" style={{ color: ringCol, fontSize: isRet ? '9px' : '10px' }}>
                            {isRet ? '+' + abs : abs}
                          </div>
                          <div className="cr-unit">{isRet ? 'retard' : 'jours'}</div>
                        </div>
                      </div>
                      <div className="notif-content">
                        <div className="notif-doc-code">{n.document}</div>
                        <div className="notif-title">{n.title}</div>
                        <div className="notif-meta">
                          {n.processus} · Échéance : {fmtDate(n.echeance)} ·{' '}
                          <strong style={{ color: ringCol }}>{jLabel}</strong>
                        </div>
                        <div className="notif-actions">
                          <button
                            className="notif-action na-p"
                            onClick={() => showToast('success', `Révision planifiée pour ${n.document}`)}
                          >
                            📅 Planifier la révision
                          </button>
                          <button
                            className="notif-action na-g"
                            onClick={() => showToast('success', 'Email envoyé au rédacteur ✓')}
                          >
                            📧 Notifier
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Notifications;