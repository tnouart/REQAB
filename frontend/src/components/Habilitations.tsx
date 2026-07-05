import React, { useEffect, useState } from 'react';
import {
  fetchHabilitations, fetchHabilitationStats, createHabilitation, updateHabilitation, deleteHabilitation, type HabilitationRecord
} from '../services/api';
import { useToast } from '../contexts/ToastContext';

const EXP_CLS: Record<string, string> = {
  ok: 'exp-ok',
  soon: 'exp-soon',
  late: 'exp-late',
};

const EXP_LBL: Record<string, string> = {
  ok: '✓ Valide',
  soon: '⏰ Bientôt',
  late: '✕ Expirée',
};

interface ExtendedCompetence {
  label: string;
  exp: string;
  statut: string;
}

interface ExtendedHabilitation {
  id: number;
  reference: string;
  nom: string;
  prenom: string;
  competences: ExtendedCompetence[];
  date_expiration: string;
  statut: string;
  checks?: { label: string; ok: boolean }[];
  created_at: string;
  updated_at: string;
}

const Habilitations: React.FC = () => {
  const { showToast } = useToast();
  const [habilitations, setHabilitations] = useState<ExtendedHabilitation[]>([]);
  const [stats, setStats] = useState({ valides: 0, aRenouveler: 0, expirees: 0, agents: 0 });
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [formNom, setFormNom] = useState('');
  const [formPrenom, setFormPrenom] = useState('');
  const [formCompetences, setFormCompetences] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [habData, statsData] = await Promise.all([fetchHabilitations(), fetchHabilitationStats()]);
    const normalized = habData.map((h: any) => ({
      ...h,
      competences: Array.isArray(h.competences)
        ? h.competences
        : (() => { try { return JSON.parse(h.competences || '[]'); } catch { return []; } })(),
    }));
    setHabilitations(normalized);
    setStats(statsData);
    setLoading(false);
  };

  const fmtDate = (s: string) => {
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
  };

  const getExpirationStatus = (exp: string): 'ok' | 'soon' | 'late' => {
    const expDate = new Date(exp);
    const now = new Date();
    const days = (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (days < 0) return 'late';
    if (days < 60) return 'soon';
    return 'ok';
  };

  const handleCreate = async () => {
    if (!formNom || !formPrenom) {
      showToast('warning', 'Nom et prénom sont obligatoires.');
      return;
    }
    const competences = formCompetences.split('\n').filter(Boolean).map(label => ({
      label,
      exp: new Date().toISOString().split('T')[0],
      statut: 'ok',
    }));
    const payload: any = {
      nom: formNom,
      prenom: formPrenom,
      competences,
    };
    const result = await createHabilitation(payload);
    if (result) {
      showToast('success', `Habilitation ${result.nom} ${result.prenom} créée ✓`);
      setShowForm(false);
      setFormNom('');
      setFormPrenom('');
      setFormCompetences('');
      loadData();
    }
  };

  const renewalAlerts = () => {
    const alerts: { nom: string; init: string; label: string; exp: string; statut: string }[] = [];
    habilitations.forEach(h => {
      const init = `${h.prenom?.[0] || ''}${h.nom?.[0] || ''}`.toUpperCase();
      h.competences.forEach(c => {
        const status = getExpirationStatus(c.exp);
        if (status !== 'ok') {
          alerts.push({ nom: `${h.nom || ''} ${h.prenom || ''}`, init, label: c.label, exp: c.exp, statut: status });
        }
      });
    });
    alerts.sort((a, b) => new Date(a.exp).getTime() - new Date(b.exp).getTime());

    return alerts.map((a, i) => (
      <div key={i} className="hab-alert-item">
        <div className="hab-alert-badge" style={{ background: a.statut === 'late' ? 'var(--red-l)' : 'var(--yellow-l)' }}>
          {a.statut === 'late' ? '🔴' : '🟡'}
        </div>
        <div className="hab-alert-content">
          <div className="hab-alert-name">{a.nom} — {a.label}</div>
          <div className="hab-alert-comp">
            {a.statut === 'late' ? 'Expirée depuis le' : 'Expire le'} {fmtDate(a.exp)}
          </div>
        </div>
        <button className="btn btn-p btn-sm" onClick={() => showToast('success', `Renouvellement planifié pour ${a.nom} ✓`)}>📅 Planifier</button>
      </div>
    ));
  };

  if (loading) return <div className="detail-pane"><p>Chargement…</p></div>;

  return (
    <div className="detail-pane" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="page-header">
        <div className="ph-icon" style={{ background: '#FFF3EE' }}>🎓</div>
        <div>
          <div className="ph-title">Habilitations et compétences SST</div>
          <div className="ph-sub">ISO 45001:2018 §7.2 — Compétences, formation et sensibilisation</div>
        </div>
        <button className="btn btn-ghost btn-sm">⬇ Exporter</button>
        <button className="btn btn-p btn-sm" onClick={() => setShowForm(true)}>+ Enregistrer une habilitation</button>
      </div>

      <div className="scroll-body">
        <div className="hab-stats">
          <div className="hab-stat">
            <div className="hab-stat-val" style={{ color: 'var(--teal-d)' }}>{stats.valides}</div>
            <div className="hab-stat-lbl">Habilitations valides</div>
          </div>
          <div className="hab-stat">
            <div className="hab-stat-val" style={{ color: 'var(--yellow-d)' }}>{stats.aRenouveler}</div>
            <div className="hab-stat-lbl">À renouveler (&lt;60j)</div>
          </div>
          <div className="hab-stat">
            <div className="hab-stat-val" style={{ color: 'var(--red-d)' }}>{stats.expirees}</div>
            <div className="hab-stat-lbl">Expirées</div>
          </div>
          <div className="hab-stat">
            <div className="hab-stat-val" style={{ color: 'var(--ink)' }}>{stats.agents}</div>
            <div className="hab-stat-lbl">Agents habilités</div>
          </div>
        </div>

        <div className="hab-grid">
          {habilitations.length === 0 ? (
            <div style={{ padding: 24, color: 'var(--light)', textAlign: 'center', fontSize: 12, gridColumn: '1/-1' }}>
              Aucun agent habilité enregistré
            </div>
          ) : habilitations.map(h => {
            const init = `${h.prenom?.[0] || ''}${h.nom?.[0] || ''}`.toUpperCase();
            return (
              <div key={h.id} className="hab-card">
                <div className="hab-card-top">
                  <div className="hab-avatar">{init}</div>
                  <div>
                    <div className="hab-name">{h.prenom} {h.nom}</div>
                    <div className="hab-role">{h.statut}</div>
                  </div>
                </div>
                <div className="hab-card-body">
                  {h.competences?.map((c, i) => {
                    const status = getExpirationStatus(c.exp);
                    return (
                      <div key={i} className="hab-comp-row">
                        <div className="hab-comp-name">{c.label}</div>
                        <div className={`hab-comp-exp ${EXP_CLS[status]}`}>{EXP_LBL[status]}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="hab-alert-card">
          <div className="hab-alert-head">
            <span style={{ fontSize: 14 }}>⏰</span>
            <div className="hab-alert-title">Habilitations à renouveler prioritairement</div>
          </div>
          {renewalAlerts()}
        </div>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: 'var(--white)', borderRadius: 14, padding: 24, width: 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--sh3)' }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Nouvelle habilitation</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 18 }}>Enregistrer les compétences d'un agent.</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-field">
                <label>Nom <span style={{ color: 'var(--danger)' }}>•</span></label>
                <input value={formNom} onChange={e => setFormNom(e.target.value)} placeholder="Nom de famille" />
              </div>
              <div className="form-field">
                <label>Prénom <span style={{ color: 'var(--danger)' }}>•</span></label>
                <input value={formPrenom} onChange={e => setFormPrenom(e.target.value)} placeholder="Prénom" />
              </div>
              <div className="form-field" style={{ gridColumn: '1/-1' }}>
                <label>Compétences (1 par ligne)</label>
                <textarea rows={4} value={formCompetences} onChange={e => setFormCompetences(e.target.value)} placeholder="ex: Travail en hauteur, Espace confiné..." />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Annuler</button>
              <button className="btn btn-p btn-sm" onClick={handleCreate}>+ Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Habilitations;