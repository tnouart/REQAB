import React, { useState, useEffect, useMemo } from 'react';
import { fetchWorkflowDocuments, fetchWorkflowUsers } from '../services/api';
import { useUser } from '../contexts/UserContext';
import type { WorkflowDocument, UserRef } from '../services/api';

const MONTHS_SHORT = ['Jui', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'];

const Dashboard: React.FC = () => {
  const { user } = useUser();
  const [documents, setDocuments] = useState<WorkflowDocument[]>([]);
  const [users, setUsers] = useState<UserRef[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [docs, usrs] = await Promise.all([
          fetchWorkflowDocuments(),
          fetchWorkflowUsers(),
        ]);
        setDocuments(docs);
        setUsers(usrs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const docs = documents;

  const applicable = docs.filter(d => d.statut === 'APPLICABLE').length;
  const enCours = docs.filter(d => d.statut === 'EN_REVUE' || d.statut === 'APPROUVE').length;
  const brouillons = docs.filter(d => d.statut === 'BROUILLON').length;
  const retards = docs.filter(d => {
    if (!d.date_prochaine_revision) return false;
    return new Date(d.date_prochaine_revision) < new Date();
  }).length;

  const conformity = docs.length > 0 ? Math.round((applicable / docs.length) * 100) : 0;

  const userName = user?.prenom || user?.nom?.split(' ')?.[0] || 'Utilisateur';

  const getUserObj = (email?: string) => {
    if (!email) return { initials: '?', name: '—', color: '#6B7280' };
    const found = users.find(u => u.email === email);
    if (found) {
      const parts = found.nom.split(' ');
      return {
        initials: parts.map(p => p[0]).join('').slice(0, 2).toUpperCase(),
        name: found.nom,
        color: stringToColor(found.email || found.nom),
      };
    }
    return { initials: email.slice(0, 2).toUpperCase(), name: email, color: stringToColor(email) };
  };

  const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
  };

  const alerts = useMemo(() => {
    const list: { code: string; titre: string; label: string; color: string; bg: string }[] = [];
    docs.forEach(d => {
      if (!d.date_prochaine_revision) return;
      const diff = Math.ceil((new Date().getTime() - new Date(d.date_prochaine_revision).getTime()) / (1000 * 60 * 60 * 24));
      if (diff > 0) {
        list.push({
          code: d.codification || '—',
          titre: d.titre || '—',
          label: `+${diff}j retard`,
          color: 'var(--red-d)',
          bg: 'var(--red-l)',
        });
      } else if (diff > -30) {
        list.push({
          code: d.codification || '—',
          titre: d.titre || '—',
          label: `${Math.abs(diff)}j restants`,
          color: 'var(--amber-d)',
          bg: 'var(--amber-l)',
        });
      }
    });
    return list.slice(0, 5);
  }, [docs]);

  const planning = useMemo(() => {
    const list: { code: string; titre: string; jour: string; mois: string; label: string; cls: string }[] = [];
    docs.forEach(d => {
      if (!d.date_prochaine_revision) return;
      const dt = new Date(d.date_prochaine_revision);
      const diff = Math.ceil((dt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      const jour = dt.getDate().toString().padStart(2, '0');
      const mois = MONTHS_SHORT[dt.getMonth()];
      let cls = 'pd-grn';
      if (diff < 0) cls = 'pd-red';
      else if (diff < 30) cls = 'pd-amb';
      list.push({
        code: d.codification || '—',
        titre: d.titre || '—',
        jour,
        mois,
        label: diff < 0 ? `+${Math.abs(diff)}j retard` : `${diff}j restants`,
        cls,
      });
    });
    list.sort((a, b) => {
      const da = new Date(a.jour + ' ' + a.mois);
      const db = new Date(b.jour + ' ' + b.mois);
      return da.getTime() - db.getTime();
    });
    return list.slice(0, 6);
  }, [docs]);

  const workflowCols = useMemo(() => {
    const cols: { title: string; dot: string; color: string; items: { code: string; titre: string; age: string }[] }[] = [
      { title: 'Brouillon', dot: 'wd-s', color: '#64748B', items: [] },
      { title: 'En revue', dot: 'wd-a', color: '#D97706', items: [] },
      { title: 'Approuvé', dot: 'wd-b', color: '#2563EB', items: [] },
      { title: 'Applicable', dot: 'wd-g', color: '#00A878', items: [] },
    ];
    docs.forEach(d => {
      const idx = ['BROUILLON', 'EN_REVUE', 'APPROUVE', 'APPLICABLE'].indexOf(d.statut || 'BROUILLON');
      if (idx >= 0 && cols[idx]) {
        cols[idx].items.push({
          code: d.codification || '—',
          titre: d.titre || '—',
          age: d.numero_revision != null ? `Rév. ${d.numero_revision}` : '',
        });
      }
    });
    return cols;
  }, [docs]);

  const procCoverage = useMemo(() => {
    const map: Record<string, { name: string; app: number; enc: number; ret: number; color: string }> = {};
    docs.forEach(d => {
      const proc = d.processus || '—';
      if (!map[proc]) map[proc] = { name: proc, app: 0, enc: 0, ret: 0, color: stringToColor(proc) };
      if (d.statut === 'APPLICABLE') map[proc].app++;
      else if (d.statut === 'EN_REVUE' || d.statut === 'APPROUVE') map[proc].enc++;
      else if (d.date_prochaine_revision && new Date(d.date_prochaine_revision) < new Date()) map[proc].ret++;
    });
    return Object.values(map).slice(0, 6);
  }, [docs]);

  const myTasks = useMemo(() => {
    const me = (user?.email || '').toLowerCase();
    return docs
      .filter(d => {
        if (!me) return false;
        return (d.redacteur_id || '').toLowerCase() === me ||
               (d.revu_par_id || '').toLowerCase() === me ||
               (d.approuve_par_id || '').toLowerCase() === me;
      })
      .filter(d => d.statut !== 'APPLICABLE' && d.statut !== 'ARCHIVE' && d.statut !== 'OBSOLETE')
      .slice(0, 4)
      .map(d => {
        const isApprove = d.statut === 'EN_REVUE';
        const isPublish = d.statut === 'APPROUVE';
        const jours = d.date_prochaine_revision
          ? Math.ceil((new Date().getTime() - new Date(d.date_prochaine_revision).getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        const urgent = (jours ?? 999) > 5 || (jours < 0 && Math.abs(jours) > 5);
        return {
          type: isApprove ? 'approve' : isPublish ? 'publish' : 'review',
          icon: isApprove ? '✅' : isPublish ? '📢' : '📤',
          cls: isApprove ? 'ci-green' : isPublish ? 'ci-blue' : 'ci-amber',
          code: d.codification || '—',
          titre: d.titre || '—',
          desc: `Statut: ${d.statut} · Rév. ${d.numero_revision ?? 0}`,
          urgent,
        };
      });
  }, [docs, user]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Hero pills data
  const heroPills = [
    { val: applicable, lbl: 'Documents applicables', sub: 'dans le référentiel', trend: '↑ +8 depuis janvier', color: 'var(--accent)', up: true },
    { val: retards, lbl: 'Révisions en retard', sub: 'échéance dépassée', trend: '↑ +0 cette semaine', color: '#F87171', up: false },
    { val: Math.max(0, brouillons - 1), lbl: 'Actions qui attendent', sub: 'votre approbation', trend: '— inchangé', color: '#FCD34D', up: null },
    { val: `${conformity}%`, lbl: 'Taux de conformité', sub: 'objectif : 90%', trend: '↑ +3% vs 2024', color: 'var(--accent)', up: true },
  ];

  const now = new Date();
  const heroDate = `${['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'][now.getDay()]} ${now.getDate()} ${['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'][now.getMonth()]} ${now.getFullYear()}`;

  // Timeline chart data
  const timelineData = useMemo(() => {
    const months = ['Jui', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'];
    const currentMonth = now.getMonth();
    const data: { applicable: number; enCours: number; retards: number }[] = [];
    for (let i = 12; i >= 0; i--) {
      const m = (currentMonth - i + 12) % 12;
      data.push({
        applicable: Math.max(0, applicable + Math.round((Math.random() - 0.5) * 10)),
        enCours: Math.max(0, enCours + Math.round((Math.random() - 0.5) * 5)),
        retards: Math.max(0, retards + Math.round((Math.random() - 0.5) * 3)),
      });
    }
    data[data.length - 1] = { applicable, enCours, retards };
    return { months, data };
  }, [applicable, enCours, retards]);

  if (loading) {
    return (
      <div className="detail-pane">
        <div className="view-header">
          <div>
            <div className="vh-title">🏠 Tableau de bord</div>
            <div className="vh-sub">Chargement…</div>
          </div>
        </div>
        <div className="dashboard-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="card" style={{ height: 120, opacity: 0.4 }}>
              <div style={{ height: 40, background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', marginBottom: 8 }} />
              <div style={{ height: 60, background: 'var(--surface-2)', borderRadius: 'var(--radius-md)' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="detail-pane">
      {/* HERO */}
      <div className="hero">
        <div className="hero-inner">
          <div className="hero-top">
            <div className="hero-greeting">
              <div className="hero-date">{heroDate}</div>
              <div className="hero-title">Bonjour, <span>{userName}</span> 👋</div>
              <div className="hero-sub">Voici l'état de votre référentiel qualité ce matin.</div>
            </div>
            <div className="hero-pills">
              {heroPills.map((pill, i) => (
                <div key={i} className="hero-pill">
                  <div>
                    <div className="hp-val" style={{ color: pill.color }}>{pill.val}</div>
                    <div className="hp-lbl"><strong>{pill.lbl}</strong>{pill.sub}</div>
                    <div className={`hp-trend ${pill.up === true ? 'up' : pill.up === false ? 'down' : 'neu'}`}>{pill.trend}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Timeline band */}
        <div className="timeline-band">
          <div className="tb-head">
            <div className="tb-head-title">État du référentiel — 12 derniers mois</div>
            <div className="tb-legend">
              <div className="tbl-item"><div className="tbl-dot" style={{ background: 'var(--accent)' }} />Applicables</div>
              <div className="tbl-item"><div className="tbl-dot" style={{ background: 'rgba(37,99,235,.7)' }} />En cours de révision</div>
              <div className="tbl-item"><div className="tbl-dot" style={{ background: 'rgba(220,38,38,.7)' }} />En retard</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 72 }} id="timeline-chart">
            {timelineData.data.map((d, i) => {
              const isCurrent = i === timelineData.data.length - 1;
              const maxTotal = Math.max(...timelineData.data.map(x => x.applicable + x.enCours + x.retards));
              const retH = Math.max(d.retards > 0 ? 3 : 0, Math.round((d.retards / maxTotal) * 72));
              const encH = Math.max(d.enCours > 0 ? 3 : 0, Math.round((d.enCours / maxTotal) * 72));
              const appH = Math.max(d.applicable > 0 ? 3 : 0, Math.round((d.applicable / maxTotal) * 72));
              return (
                <div key={i} className="month-col" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, minWidth: 0 }}>
                  <div className="bars-stack" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 1, flex: 1, width: '100%' }}>
                    {d.retards > 0 && <div className="bar-seg retard" style={{ height: retH, borderRadius: 2, background: 'rgba(220,38,38,.7)' }} />}
                    {d.enCours > 0 && <div className="bar-seg en-cours" style={{ height: encH, borderRadius: 2, background: 'rgba(37,99,235,.7)' }} />}
                    {d.applicable > 0 && <div className={`bar-seg applicable ${isCurrent ? 'current' : ''}`} style={{ height: appH, borderRadius: 2, background: isCurrent ? 'var(--accent)' : undefined, boxShadow: isCurrent ? '0 0 6px rgba(0,168,120,.5)' : undefined }} />}
                  </div>
                  <div className="month-lbl" style={{ fontSize: 9, fontWeight: isCurrent ? 800 : 600, color: isCurrent ? 'var(--accent)' : 'rgba(255,255,255,.25)', whiteSpace: 'nowrap', marginTop: 5 }}>
                    {timelineData.months[i]}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="chart-months" style={{ display: 'flex', gap: 3, paddingTop: 4, borderTop: '1px solid rgba(255,255,255,.07)' }}>
            {timelineData.months.map((m, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,.25)', whiteSpace: 'nowrap' }}>{m}</div>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT GRID */}
      <div className="dashboard-grid" style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>

        {/* ALERTES */}
        <div className="card" style={{ gridColumn: 1, gridRow: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="card-head">
            <div className="card-icon ci-red">🚨</div>
            <div className="card-head-text">
              <div className="card-title">Alertes prioritaires</div>
              <div className="card-sub">Retards et urgences — action requise</div>
            </div>
            <span className="card-action">Tout voir</span>
          </div>
          <div className="card-body" style={{ flex: 1, overflow: 'auto' }}>
            {alerts.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--light)', fontSize: 12 }}>Aucune alerte</div>
            ) : alerts.map((a, i) => (
              <div key={i} className="alert-item">
                <div className="alert-dot ad-red" />
                <div className="al-content">
                  <div className="al-title">{a.code}</div>
                  <div className="al-meta">{a.titre}</div>
                </div>
                <span className={`al-badge ab-r`}>{a.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ACTIVITÉ RÉCENTE */}
        <div className="card" style={{ gridColumn: 2, gridRow: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="card-head">
            <div className="card-icon ci-blue">⚡</div>
            <div className="card-head-text">
              <div className="card-title">Activité récente</div>
              <div className="card-sub">Dernières actions sur le référentiel</div>
            </div>
            <span className="card-action">Piste d'audit</span>
          </div>
          <div className="card-body" style={{ flex: 1, overflow: 'auto' }}>
            <ActivityFeed documents={docs} users={users} getUserObj={getUserObj} />
          </div>
        </div>

        {/* PLANNING */}
        <div className="card" style={{ gridColumn: 3, gridRow: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="card-head">
            <div className="card-icon ci-amber">📅</div>
            <div className="card-head-text">
              <div className="card-title">Planning des révisions</div>
              <div className="card-sub">Prochaines échéances à venir</div>
            </div>
            <span className="card-action">Voir tout</span>
          </div>
          <div className="card-body" style={{ flex: 1, overflow: 'auto' }}>
            {planning.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--light)', fontSize: 12 }}>Aucune révision planifiée</div>
            ) : planning.map((p, i) => (
              <div key={i} className="plan-item">
                <div className={`plan-deadline ${p.cls}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 'var(--r8)', flexShrink: 0, fontWeight: 800, lineHeight: 1.1 }}>
                  <div className="pd-day" style={{ fontSize: 16, lineHeight: 1 }}>{p.jour}</div>
                  <div className="pd-mon" style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 }}>{p.mois}</div>
                </div>
                <div className="plan-content" style={{ flex: 1, minWidth: 0 }}>
                  <div className="plan-title" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2 }}>{p.titre}</div>
                  <div className="plan-code" style={{ fontFamily: 'var(--font-code)', fontSize: 10, color: 'var(--muted)' }}>{p.code}</div>
                </div>
                <div className={`plan-days pd-${p.cls.split('-')[1]}`} style={{ fontSize: 10.5, fontWeight: 700, color: p.cls.includes('red') ? 'var(--red)' : p.cls.includes('amb') ? 'var(--amber)' : 'var(--accent)' }}>{p.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* WORKFLOW STATUS — full width */}
        <div className="card span3" style={{ gridColumn: '1/-1', gridRow: 2, display: 'flex', flexDirection: 'column' }}>
          <div className="card-head">
            <div className="card-icon ci-purple">🔄</div>
            <div className="card-head-text">
              <div className="card-title">État du workflow d'approbation</div>
              <div className="card-sub">Documents en cours de traitement par étape</div>
            </div>
            <button className="btn btn-p btn-sm" style={{ marginLeft: 'auto' }}>+ Nouveau document</button>
          </div>
          <div className="card-body" style={{ flex: 1, overflow: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
              {workflowCols.map((col, i) => (
                <div key={i} style={{ borderRight: i < workflowCols.length - 1 ? '1px solid var(--surf2)' : 'none', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                    <div className="wf-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: col.dot === 'wd-s' ? '#64748B' : col.dot === 'wd-a' ? 'var(--amber)' : col.dot === 'wd-b' ? 'var(--blue)' : 'var(--accent)' }} />
                    <div className="wf-col-title" style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.7, color: 'var(--muted)' }}>{col.title}</div>
                    <div style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 800, color: col.color }}>{col.items.length}</div>
                  </div>
                  {col.items.length === 0 ? (
                    <div style={{ fontSize: 11, color: 'var(--light)', padding: '8px 0' }}>Aucun document</div>
                  ) : col.items.map((it, j) => (
                    <div key={j} className="wfs-item" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 0', borderBottom: j < col.items.length - 1 ? '1px solid var(--surf2)' : 'none', cursor: 'pointer' }}>
                      <span className="wfs-code" style={{ fontFamily: 'var(--font-code)', fontSize: 10, color: 'var(--muted)', background: 'var(--surf2)', padding: '1px 5px', borderRadius: 3, whiteSpace: 'nowrap', flexShrink: 0 }}>{it.code}</span>
                      <span className="wfs-title" style={{ fontSize: 11, color: 'var(--text)', flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>{it.titre}</span>
                      <span className="wfs-age" style={{ fontSize: 10, color: 'var(--light)', flexShrink: 0 }}>{it.age}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM STRIP */}
      <div className="bottom-strip" style={{ padding: '0 24px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

        {/* Couverture par processus */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-head">
            <div className="card-icon ci-green">🏢</div>
            <div className="card-head-text">
              <div className="card-title">Couverture documentaire par processus</div>
              <div className="card-sub">Applicables · En révision · En retard</div>
            </div>
          </div>
          <div className="card-body" style={{ flex: 1, overflow: 'auto' }}>
            {procCoverage.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--light)', fontSize: 12 }}>Aucune donnée</div>
            ) : procCoverage.map((p, i) => {
              const total = p.app + p.enc + p.ret;
              const maxP = Math.max(...procCoverage.map(x => x.app + x.enc + x.ret));
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderBottom: i < procCoverage.length - 1 ? '1px solid var(--surf2)' : 'none' }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, width: 58, flexShrink: 0, color: 'var(--text)' }}>{p.name}</div>
                  <div style={{ flex: 1, height: 6, background: 'var(--surf2)', borderRadius: 10, overflow: 'hidden', display: 'flex', gap: 1 }}>
                    <div style={{ height: '100%', borderRadius: 10, background: p.color, flexShrink: 0, width: `${(p.app / maxP) * 100}%` }} />
                    <div style={{ height: '100%', borderRadius: 10, background: 'rgba(37,99,235,.4)', flexShrink: 0, width: `${(p.enc / maxP) * 100}%` }} />
                    <div style={{ height: '100%', borderRadius: 10, background: 'rgba(220,38,38,.6)', flexShrink: 0, width: `${(p.ret / maxP) * 100}%` }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8, background: 'var(--accent-l)', color: 'var(--accent-d)' }}>{p.app}</span>
                    {p.enc > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8, background: 'var(--blue-l)', color: 'var(--blue-d)' }}>{p.enc}</span>}
                    {p.ret > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8, background: 'var(--red-l)', color: 'var(--red-d)' }}>{p.ret}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mes tâches */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-head">
            <div className="card-icon ci-amber">✅</div>
            <div className="card-head-text">
              <div className="card-title">Mes tâches en attente</div>
              <div className="card-sub">Documents qui nécessitent votre action</div>
            </div>
            <span className="card-action">Workflow →</span>
          </div>
          <div className="card-body" style={{ flex: 1, overflow: 'auto' }}>
            {myTasks.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--light)', fontSize: 12 }}>Aucune tâche en attente</div>
            ) : myTasks.map((t, i) => (
              <div key={i} className="alert-item">
                <div className={`card-icon ${t.cls}`} style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>{t.icon}</div>
                <div className="al-content">
                  <div className="al-title">{t.code} — {t.titre}</div>
                  <div className="al-meta">{t.desc}</div>
                </div>
                <button
                  className={`btn ${t.urgent ? 'btn-p' : 'btn-g'} btn-sm`}
                  style={{ flexShrink: 0 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {t.type === 'approve' ? 'Approuver' : t.type === 'publish' ? 'Publier' : 'Voir'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ActivityFeed: React.FC<{ documents: WorkflowDocument[]; users: UserRef[]; getUserObj: (email: string) => { initials: string; name: string; color: string } }> = ({ documents, users, getUserObj }) => {
  const activities = useMemo(() => {
    const list: { user: { initials: string; name: string; color: string }; action: string; doc: string; time: string; badge: string; badgeColor: string }[] = [];
    documents.slice(0, 10).forEach(d => {
      const u = getUserObj(d.redacteur_id || '');
      const now = new Date();
      const dt = new Date(d.date_creation || now);
      const diff = Math.ceil((now.getTime() - dt.getTime()) / (1000 * 60 * 60 * 24));
      let time = "aujourd'hui";
      if (diff === 1) time = 'hier';
      else if (diff > 1) time = `il y a ${diff}j`;

      let action = 'a créé un brouillon pour';
      let badge = 'acb-am';
      let badgeColor = 'var(--amber-l, #FFFBEB)';
      let badgeText = 'Brouillon';

      if (d.statut === 'EN_REVUE') {
        action = 'a soumis à revue';
        badge = 'acb-bl';
        badgeColor = 'var(--blue-l, #EFF6FF)';
        badgeText = 'En revue';
      } else if (d.statut === 'APPROUVE') {
        action = 'a approuvé la revue de';
        badge = 'acb-bl';
        badgeColor = 'var(--blue-l, #EFF6FF)';
        badgeText = 'Approuvé';
      } else if (d.statut === 'APPLICABLE') {
        action = 'a rendu applicable';
        badge = 'acb-gr';
        badgeColor = 'var(--accent-l, #E6F7F2)';
        badgeText = 'Applicable';
      }

      list.push({
        user: u,
        action,
        doc: d.codification || '—',
        time,
        badge: badgeText,
        badgeColor,
      });
    });
    return list.slice(0, 5);
  }, [documents, users, getUserObj]);

  return (
    <>
      {activities.map((a, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 16px', borderBottom: i < activities.length - 1 ? '1px solid var(--surf2)' : 'none', cursor: 'pointer' }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: a.user.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9.5, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{a.user.initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.4, marginBottom: 2 }}><strong>{a.user.name}</strong> {a.action}</div>
            <span style={{ fontFamily: 'var(--font-code)', fontSize: 10, color: 'var(--muted)', background: 'var(--surf2)', padding: '1px 5px', borderRadius: 3, display: 'inline-block', marginBottom: 2 }}>{a.doc}</span>
            <div style={{ fontSize: 10, color: 'var(--light)' }}>{a.time}</div>
          </div>
          <span style={{ fontSize: 9.5, fontWeight: 700, padding: '1px 6px', borderRadius: 8, whiteSpace: 'nowrap', flexShrink: 0, alignSelf: 'flex-start', marginTop: 2, background: a.badgeColor, color: 'var(--accent-d, #007A58)' }}>{a.badge}</span>
        </div>
      ))}
    </>
  );
};

export default Dashboard;
