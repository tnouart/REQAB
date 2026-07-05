import React, { useEffect, useState } from 'react';
import {
  fetchIndicateursEnv, createIndicateurEnv, type IndicateurEnvRecord
} from '../services/api';
import { useToast } from '../contexts/ToastContext';

const MONTHS_12 = ['Jui', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'];

interface ChartData {
  mois: string;
  eau: number;
  energie: number;
  dechets: number;
  co2: number;
}

const IndicateursEnv: React.FC = () => {
  const { showToast } = useToast();
  const [indicateurs, setIndicateurs] = useState<IndicateurEnvRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartData[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchIndicateursEnv();
    setIndicateurs(data);

    const parsed: ChartData[] = MONTHS_12.map((mois, i) => {
      const eau = data.find(d => d.mois === mois && d.type === 'eau');
      const energie = data.find(d => d.mois === mois && d.type === 'energie');
      const dechets = data.find(d => d.mois === mois && d.type === 'dechets');
      const co2 = data.find(d => d.mois === mois && d.type === 'co2');
      return {
        mois,
        eau: eau?.valeur || 0,
        energie: energie?.valeur || 0,
        dechets: dechets?.valeur || 0,
        co2: co2?.valeur || 0,
      };
    });
    setChartData(parsed);
    setLoading(false);
  };

  const renderAreaChart = (seriesA: number[], seriesB: number[], colorA: string, colorB: string, maxA: number, maxB: number) => {
    const w = 900;
    const h = 220;
    const pad = { l: 10, r: 10, t: 20, b: 24 };
    const chartW = w - pad.l - pad.r;
    const chartH = h - pad.t - pad.b;
    const n = seriesA.length;
    const stepX = chartW / (n - 1 || 1);

    const pathFor = (series: number[], max: number) => {
      const pts = series.map((v, i) => {
        const x = pad.l + i * stepX;
        const y = pad.t + chartH - (v / max * chartH);
        return [x, y];
      });
      const d = `M ${pts[0][0]} ${pad.t + chartH} L ` + pts.map(p => `${p[0]} ${p[1]}`).join(' L ') + ` L ${pts[n - 1]?.[0]} ${pad.t + chartH} Z`;
      return d;
    };

    const lineFor = (series: number[], max: number) => {
      const pts = series.map((v, i) => {
        const x = pad.l + i * stepX;
        const y = pad.t + chartH - (v / max * chartH);
        return `${x} ${y}`;
      });
      return 'M ' + pts.join(' L ');
    };

    return (
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`}>
        <line x1={pad.l} y1={pad.t + chartH} x2={w - pad.r} y2={pad.t + chartH} stroke="var(--surf2)" strokeWidth="1" />
        <path d={pathFor(seriesA, maxA)} fill={colorA} opacity="0.15" />
        <path d={lineFor(seriesA, maxA)} fill="none" stroke={colorA} strokeWidth="2.5" />
        <path d={pathFor(seriesB, maxB)} fill={colorB} opacity="0.12" />
        <path d={lineFor(seriesB, maxB)} fill="none" stroke={colorB} strokeWidth="2.5" strokeDasharray="5,3" />
        {seriesA.map((v, i) => {
          const x = pad.l + i * stepX;
          const y = pad.t + chartH - (v / maxA * chartH);
          return <circle key={i} cx={x} cy={y} r="3" fill={colorA} />;
        })}
      </svg>
    );
  };

  const renderBarChart = () => {
    const procData = [
      { label: 'Forage', value: 42, color: 'var(--blue-sst)' },
      { label: 'Production', value: 68, color: 'var(--orange)' },
      { label: 'Maintenance', value: 24, color: 'var(--yellow-d)' },
      { label: 'Transport', value: 15, color: 'var(--purple)' },
    ];

    return procData.map(p => (
      <div key={p.label} className="bar-row" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div className="bar-row__label" style={{ width: 70, fontSize: 11.5 }}>{p.label}</div>
        <div className="bar-row__track" style={{ flex: 1, height: 6, background: 'var(--surf2)', borderRadius: 10, overflow: 'hidden' }}>
          <div className="bar-row__fill" style={{ width: `${p.value}%`, height: '100%', background: p.color }}></div>
        </div>
        <div className="bar-row__num" style={{ fontSize: 11, fontWeight: 700, width: 32 }}>{p.value}%</div>
      </div>
    ));
  };

  if (loading) return <div className="detail-pane"><p>Chargement…</p></div>;

  return (
    <div className="detail-pane" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="page-header">
        <div className="ph-icon" style={{ background: 'var(--green-haut-l)' }}>📊</div>
        <div>
          <div className="ph-title">Indicateurs de performance environnementale</div>
          <div className="ph-sub">ISO 14001:2015 §9.1 — Surveillance, mesure, analyse et évaluation</div>
        </div>
        <select style={{ fontSize: 11.5, background: 'var(--surf)', border: '1px solid var(--bdr)', borderRadius: 8, padding: '6px 10px', outline: 'none' }}>
          <option>12 derniers mois</option>
          <option>Année 2024</option>
          <option>Année 2025</option>
        </select>
        <button className="btn btn-ghost btn-sm">⬇ Exporter</button>
      </div>

      <div className="scroll-body">
        <div className="ienv-layout">
          <div className="ienv-chart-card">
            <div className="ienv-chart-head">
              <span style={{ fontSize: 14 }}>💧⚡</span>
              <div className="ienv-chart-title">Évolution des consommations — Eau & Énergie (12 mois)</div>
            </div>
            <div className="ienv-chart-body">
              {renderAreaChart(
                chartData.map(d => d.eau),
                chartData.map(d => d.energie),
                'var(--blue-sst)',
                'var(--yellow-d)',
                1000,
                2400
              )}
              <div className="area-chart-legend">
                <div className="acl-item"><div className="acl-dot" style={{ background: 'var(--blue-sst)' }}></div>Consommation eau (m³)</div>
                <div className="acl-item"><div className="acl-dot" style={{ background: 'var(--yellow-d)' }}></div>Consommation énergie (MWh)</div>
              </div>
            </div>
          </div>

          <div className="ienv-chart-card">
            <div className="ienv-chart-head">
              <span style={{ fontSize: 14 }}>♻️💨</span>
              <div className="ienv-chart-title">Déchets produits & émissions CO₂eq (12 mois)</div>
            </div>
            <div className="ienv-chart-body">
              {renderAreaChart(
                chartData.map(d => d.dechets),
                chartData.map(d => d.co2),
                'var(--orange)',
                'var(--muted)',
                60,
                1300
              )}
              <div className="area-chart-legend">
                <div className="acl-item"><div className="acl-dot" style={{ background: 'var(--orange)' }}></div>Déchets (tonnes)</div>
                <div className="acl-item"><div className="acl-dot" style={{ background: 'var(--muted)' }}></div>Émissions CO₂eq (t)</div>
              </div>
            </div>
          </div>

          <div className="ienv-grid-small">
            <div className="ienv-chart-card">
              <div className="ienv-chart-head"><span style={{ fontSize: 13 }}>🏭</span><div className="ienv-chart-title">Intensité par processus</div></div>
              <div className="ienv-chart-body" style={{ padding: '12px 16px' }}>
                {renderBarChart()}
              </div>
            </div>
            <div className="ienv-chart-card">
              <div className="ienv-chart-head"><span style={{ fontSize: 13 }}>🎯</span><div className="ienv-chart-title">Objectifs 2025</div></div>
              <div className="ienv-chart-body" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>Réduction eau -10%</span>
                    <span style={{ color: 'var(--teal-d)', fontWeight: 700 }}>80%</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--surf2)', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ width: '80%', height: '100%', background: 'var(--teal)' }}></div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>Réduction CO₂ -5%</span>
                    <span style={{ color: 'var(--orange-d)', fontWeight: 700 }}>35%</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--surf2)', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ width: '35%', height: '100%', background: 'var(--orange)' }}></div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>Valorisation déchets 60%</span>
                    <span style={{ color: 'var(--teal-d)', fontWeight: 700 }}>92%</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--surf2)', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ width: '92%', height: '100%', background: 'var(--teal)' }}></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="ienv-chart-card">
              <div className="ienv-chart-head"><span style={{ fontSize: 13 }}>📈</span><div className="ienv-chart-title">Synthèse annuelle</div></div>
              <div className="ienv-chart-body" style={{ padding: '12px 16px', fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.6 }}>
                La consommation d'eau diminue de <strong style={{ color: 'var(--teal-d)' }}>8%</strong> grâce au recyclage des eaux de forage. Les émissions CO₂eq augmentent légèrement (<strong style={{ color: 'var(--red-d)' }}>+1%</strong>) en raison de l'activité accrue sur le puits P-14.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndicateursEnv;