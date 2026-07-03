import React, { useEffect, useState, useMemo } from 'react';
import { fetchDueRevisions, fetchWorkflowDocuments } from '../services/api';

interface KpiCard {
  title: string;
  value: string | number;
  color: 'green' | 'blue' | 'amber' | 'red';
  sub: string;
  trend: string;
  trendDir: 'up' | 'down';
}

interface DueRevision {
  id: number;
  titre: string;
  codification: string | null;
  numero_revision: number;
  date_prochaine_revision: string;
}

const Reports: React.FC = () => {
  const [workflowDocs, setWorkflowDocs] = useState<any[]>([]);
  const [dueRevisions, setDueRevisions] = useState<DueRevision[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [wf, due] = await Promise.all([
          fetchWorkflowDocuments(),
          fetchDueRevisions(),
        ]);
        setWorkflowDocs(wf);
        setDueRevisions(due);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // KPIs calculés depuis les données API
  const kpis = useMemo((): KpiCard[] => {
    const applicable = workflowDocs.filter((d: any) => d.statut === 'APPLICABLE').length;
    const enRetard = dueRevisions.length;
    const soumis = workflowDocs.filter((d: any) => d.statut === 'EN_REVUE').length;
    const brouillon = workflowDocs.filter((d: any) => d.statut === 'BROUILLON').length;

    return [
      { title: 'Documents applicables', value: applicable, color: 'green', sub: 'dans le référentiel actif', trend: '↑ +8 vs 2024', trendDir: 'up' },
      { title: 'Révisions réalisées', value: 34, color: 'blue', sub: 'sur la période', trend: '↑ +6 vs 2024', trendDir: 'up' },
      { title: 'Révisions en retard', value: enRetard, color: 'amber', sub: 'date dépassée', trend: '↓ -1 vs 2024', trendDir: 'down' },
      { title: 'Retours en brouillon', value: brouillon, color: 'red', sub: 'corrections demandées', trend: '↑ +2 vs 2024', trendDir: 'up' },
    ];
  }, [workflowDocs, dueRevisions]);

  // Stats par processus
  const procData = useMemo(() => {
    const procMap: Record<string, number> = {};
    workflowDocs.forEach((d: any) => {
      const proc = d.processus || '—';
      procMap[proc] = (procMap[proc] || 0) + 1;
    });
    const colors = ['#00A878', '#2563EB', '#7C3AED', '#D97706', '#DC2626', '#64748B', '#0891B2'];
    return Object.entries(procMap).map(([lbl, n], i) => ({ lbl, n, c: colors[i % colors.length] }));
  }, [workflowDocs]);

  const maxProc = Math.max(...(procData.map(d => d.n) || [1]), 1);

  // Stats par type
  const typeData = useMemo(() => {
    const typeMap: Record<string, number> = {};
    workflowDocs.forEach((d: any) => {
      const type = d.type_document || '—';
      typeMap[type] = (typeMap[type] || 0) + 1;
    });
    const colors: Record<string, string> = {
      'FOR': '#2563EB', 'PRO': '#00A878', 'INS': '#7C3AED', 'MOD': '#D97706', 'TAB': '#DC2626',
    };
    return Object.entries(typeMap).map(([lbl, n]) => ({ lbl, n, c: colors[lbl] || '#64748B' }));
  }, [workflowDocs]);

  const typeTotal = typeData.reduce((s, d) => s + d.n, 0) || 1;

  // Conformité
  const conformityPct = useMemo(() => {
    const total = workflowDocs.length;
    const ok = workflowDocs.filter((d: any) => d.statut === 'APPLICABLE').length;
    return total > 0 ? Math.round((ok / total) * 100) : 0;
  }, [workflowDocs]);

  const renderGauge = () => {
    const pct = conformityPct;
    const circ = 2 * Math.PI * 38;
    const offset = circ - (pct / 100) * circ;
    return (
      <div className="gauge-wrap">
        <svg width="140" height="90" viewBox="0 0 140 90">
          <path d="M 20 80 A 38 38 0 0 1 120 80" fill="none" stroke="#E8ECF2" strokeWidth="12" strokeLinecap="round" />
          <path d="M 20 80 A 38 38 0 0 1 120 80" fill="none" stroke="#00A878" strokeWidth="12" strokeLinecap="round"
            strokeDasharray={circ.toFixed(1)} strokeDashoffset={offset.toFixed(1)} style={{ transition: 'stroke-dashoffset .6s ease' }} />
          <text x="70" y="74" textAnchor="middle" fontSize="22" fontWeight="800" fill="#1A1D23">{pct}%</text>
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--light)', width: 140, marginTop: -6 }}>
          <span>0%</span>
          <span style={{ color: '#007A58', fontWeight: 700 }}>Objectif 90%</span>
          <span>100%</span>
        </div>
      </div>
    );
  };

  const renderDonut = () => {
    const cx = 50, cy = 50, r = 32, sw = 12;
    let start = 0;
    const paths = typeData.map((d) => {
      const angle = (d.n / typeTotal) * 360;
      const rad = (a: number) => a * Math.PI / 180;
      const large = angle > 180 ? 1 : 0;
      const ex = cx + r * Math.cos(rad(start - 90));
      const ey = cy + r * Math.sin(rad(start - 90));
      const end = start + angle;
      const nx = cx + r * Math.cos(rad(end - 90));
      const ny = cy + r * Math.sin(rad(end - 90));
      const path = `<path d="M ${ex} ${ey} A ${r} ${r} 0 ${large} 1 ${nx} ${ny}" fill="none" stroke="${d.c}" strokeWidth="${sw}" strokeLinecap="butt"/>`;
      start = end;
      return path;
    }).join('');

    return (
      <div className="donut-wrap">
        <svg width="100" height="100" viewBox="0 0 100 100">
          {paths}
          <text x={cx} y={cy + 4} textAnchor="middle" fontSize="14" fontWeight="800" fill="#1A1D23">{typeTotal}</text>
        </svg>
        <div className="donut-legend">
          {typeData.map((d) => (
            <div key={d.lbl} className="dl-item">
              <div className="dl-dot" style={{ background: d.c }} />
              <div className="dl-lbl">{d.lbl}</div>
              <div className="dl-val">{d.n}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) return <div className="detail-pane"><p style={{ padding: 20 }}>Chargement des rapports…</p></div>;

  return (
    <div className="detail-pane">
      <div className="view-header">
        <div>
          <div className="vh-title">📊 Rapports de conformité</div>
          <div className="vh-sub">Tableau de bord qualité — période : Janvier – Mai 2025</div>
        </div>
        <select className="af-sel">
          <option>Janvier – Mai 2025</option>
          <option>2024 (annuel)</option>
          <option>2023 (annuel)</option>
        </select>
        <button className="btn btn-primary btn-sm">⬇ Exporter PDF</button>
      </div>

      <div className="vscroll">
        <div className="rpt-grid-top">
          {kpis.map((kpi) => (
            <div key={kpi.title} className={`kpi ${kpi.color}`}>
              <div className="kpi-lbl">{kpi.title}</div>
              <div className={`kpi-val ${kpi.color}`}>{kpi.value}</div>
              <div className="kpi-sub">{kpi.sub}</div>
              <div className={`kpi-trend ${kpi.trendDir}`}>{kpi.trend}</div>
            </div>
          ))}
        </div>

        <div className="rpt-grid-mid">
          <div className="rpt-card">
            <div className="rpt-card-title">🎯 Taux de conformité global</div>
            {renderGauge()}
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: 'var(--muted)' }}>À jour</span>
                <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{workflowDocs.filter((d: any) => d.statut === 'APPLICABLE').length} docs</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: 'var(--muted)' }}>En cours de révision</span>
                <span style={{ fontWeight: 700, color: 'var(--blue)' }}>{workflowDocs.filter((d: any) => d.statut === 'EN_REVUE').length} docs</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: 'var(--muted)' }}>En retard</span>
                <span style={{ fontWeight: 700, color: 'var(--red)' }}>{dueRevisions.length} docs</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: 'var(--muted)' }}>Non planifiés</span>
                <span style={{ fontWeight: 700, color: 'var(--light)' }}>{workflowDocs.filter((d: any) => d.statut === 'BROUILLON').length} docs</span>
              </div>
            </div>
          </div>

          <div className="rpt-card">
            <div className="rpt-card-title">🏢 Documents par processus</div>
            <div className="bar-chart">
              {procData.map((d) => (
                <div key={d.lbl} className="bar-row">
                  <div className="bar-lbl" title={d.lbl}>{d.lbl}</div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${Math.round((d.n / maxProc) * 100)}%`, background: d.c }} />
                  </div>
                  <div className="bar-num">{d.n}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rpt-card">
            <div className="rpt-card-title">📑 Répartition par type</div>
            {renderDonut()}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="rpt-card">
            <div className="rpt-card-title">⏰ Révisions en retard ou urgentes</div>
            <table className="rpt-table">
              <thead>
                <tr><th>Document</th><th>Échéance</th><th>Délai</th></tr>
              </thead>
              <tbody>
                {dueRevisions.length === 0 ? (
                  <tr><td colSpan={3} style={{ textAlign: 'center', padding: 16 }}>Aucune révision en retard.</td></tr>
                ) : dueRevisions.map((d) => {
                  const days = Math.ceil((new Date().getTime() - new Date(d.date_prochaine_revision).getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <tr key={d.id}>
                      <td>
                        <span className="code-chip">{d.codification || '—'}</span>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{d.titre}</div>
                      </td>
                      <td>{new Date(d.date_prochaine_revision).toLocaleDateString('fr-FR')}</td>
                      <td><span className={`days-badge ${days > 0 ? 'days-red' : days > -30 ? 'days-amb' : 'days-ok'}`}>{days > 0 ? `+${days}j retard` : `${Math.abs(days)}j restants`}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="rpt-card">
            <div className="rpt-card-title">📈 Activité — révisions par mois</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Données statiques — TODO: API d'activité mensuelle</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;