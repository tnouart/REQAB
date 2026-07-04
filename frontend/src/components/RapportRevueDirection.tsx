import React, { useEffect, useState } from 'react';
import { useToast } from '../contexts/ToastContext';

interface Section {
  key: string;
  label: string;
  ref: string;
  on: boolean;
}

const RapportRevueDirection: React.FC = () => {
  const { showToast } = useToast();
  const [sections, setSections] = useState<Section[]>([
    { key: 'perf', label: 'Indicateurs de performance qualité', ref: '§9.1', on: true },
    { key: 'doc', label: 'État du référentiel documentaire', ref: '§7.5', on: true },
    { key: 'nc', label: 'Non-conformités et actions correctives', ref: '§10.2', on: true },
    { key: 'audit', label: 'Résultats des audits internes', ref: '§9.2', on: true },
    { key: 'risques', label: 'Risques et opportunités', ref: '§6.1', on: true },
    { key: 'objectifs', label: 'Suivi des objectifs qualité', ref: '§6.2', on: false },
  ]);
  const [period, setPeriod] = useState('Janvier – Juin 2025 (S1)');

  const toggleSection = (idx: number) => {
    const newSections = [...sections];
    newSections[idx].on = !newSections[idx].on;
    setSections(newSections);
  };

  const updateReport = () => {
    // Trigger re-render by updating state
  };

  const cnt = sections.filter(s => s.on).length;

  const renderRapport = () => {
    return (
      <div dangerouslySetInnerHTML={{ __html: generateRapportHTML() }} />
    );
  };

  const generateRapportHTML = () => {
    const s = sections;
    return `
      <div class="r-header">
        <div class="r-logo">
          <div class="r-logo-icon">📋</div>
          <div>
            <div class="r-logo-text">GED Qualité · ENSP</div>
            <div class="r-logo-sub">Entreprise Nationale de Services aux Puits</div>
          </div>
        </div>
        <div class="r-meta">
          <div class="r-meta-ref">RRD-2025-S1 · Version 1.0</div>
          <div class="r-meta-title">Rapport de revue de direction</div>
          <div class="r-meta-period">Période : ${period}</div>
        </div>
      </div>

      <div class="r-title-block">
        <div class="r-title">Revue de direction du Système de Management de la Qualité</div>
        <div class="r-subtitle">Conformément à l'article 9.3 de la norme ISO 9001:2015</div>
        <div class="r-iso-ref">ISO 9001:2015 §9.3</div>
      </div>

      ${s.find(x => x.key === 'perf' && x.on) ? `
      <div class="r-section">
        <div class="r-section-num">Section 1</div>
        <div class="r-section-title">Indicateurs de performance qualité</div>
        <div class="r-section-text">Sur la période ${period}, le référentiel qualité compte <strong>127 documents applicables</strong> sur un total de 151, soit un taux de conformité de <strong>84%</strong>. Cet indicateur est en progression de +3 points.</div>
        <table class="r-table">
          <thead><tr><th>Indicateur</th><th>S1 2025</th><th>S1 2024</th><th>Objectif</th><th>Tendance</th></tr></thead>
          <tbody>
            <tr><td>Taux de conformité documentaire</td><td><span class="r-kpi-val amber">84%</span></td><td>81%</td><td>90%</td><td><span class="r-trend up">↑ +3pts</span></td></tr>
            <tr><td>Documents applicables</td><td><span class="r-kpi-val green">127</span></td><td>119</td><td>—</td><td><span class="r-trend up">↑ +8</span></td></tr>
            <tr><td>Révisions réalisées</td><td><span class="r-kpi-val">34</span></td><td>28</td><td>—</td><td><span class="r-trend up">↑ +6</span></td></tr>
            <tr><td>Révisions en retard</td><td><span class="r-kpi-val red">2</span></td><td>3</td><td>0</td><td><span class="r-trend up">↓ -1</span></td></tr>
          </tbody>
        </table>
      </div>`: ''}

${s.find(x => x.key === 'doc' && x.on) ? `
       <div class="r-section">
         <div class="r-section-num">Section 2</div>
         <div class="r-section-title">État du référentiel documentaire par processus</div>
         <div class="r-section-text">La couverture documentaire reste inégale selon les processus.</div>
         <div class="r-bar-chart">
           ${[['DQHSE', 52, 100], ['DAL', 24, 95], ['DRH', 18, 78]].map(([proc, n, pct]) => {
             const pctNum = Number(pct);
             const color = pctNum >= 90 ? '#00A878' : pctNum >= 80 ? '#D97706' : '#DC2626';
             return `<div class="r-bar-row">
               <div class="r-bar-lbl">${proc}</div>
               <div class="r-bar-track"><div class="r-bar-fill" style="width:${pctNum}%;background:${color}"></div></div>
               <div class="r-bar-num">${n}</div>
             </div>`;
           }).join('')}
         </div>
       </div>`: ''}

      ${s.find(x => x.key === 'nc' && x.on) ? `
      <div class="r-section">
        <div class="r-section-num">Section 3</div>
        <div class="r-section-title">Non-conformités et actions correctives</div>
        <div class="r-section-text">Sur la période, <strong>7 non-conformités documentaires</strong> ont été déclarées, dont 1 critique et 2 majeures. Le taux de traitement dans les délais est de 78%.</div>
      </div>`: ''}

      <div class="r-decision">
        <div class="r-decision-title">Décisions de la revue de direction</div>
        <div class="r-decision-item">Traitement immédiat des NC critiques avant le 30/06/2025.</div>
        <div class="r-decision-item">Déploiement du module de notifications automatiques en priorité.</div>
        <div class="r-decision-item">Révision de l'objectif de taux de conformité à 88% pour S2 2025.</div>
      </div>

      <div class="r-signatures">
        <div class="r-sig-block"><div class="r-sig-role">Rédigé par</div><div class="r-sig-line"></div><div class="r-sig-name">K. Bouali<br><span style="font-size:10px;color:var(--muted)">Responsable Qualité</span></div></div>
        <div class="r-sig-block"><div class="r-sig-role">Vérifié par</div><div class="r-sig-line"></div><div class="r-sig-name">—<br><span style="font-size:10px;color:var(--muted)">Directeur QHSE</span></div></div>
        <div class="r-sig-block"><div class="r-sig-role">Approuvé par</div><div class="r-sig-line"></div><div class="r-sig-name">—<br><span style="font-size:10px;color:var(--muted)">Directeur Général</span></div></div>
      </div>
    `;
  };

  const exportPDF = () => {
    showToast('success', 'Génération du PDF en cours...');
  };

  const onFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPeriod(e.target.value);
  };

  return (
    <div className="vscroll">
      <div className="page-header">
        <div className="ph-icon" style={{ background: '#EDE9FE' }}>📑</div>
        <div>
          <div className="ph-title">Rapport de revue de direction</div>
          <div className="ph-sub">Génération automatique — Conformité ISO 9001:2015 §9.3</div>
        </div>
      </div>

      <div className="scroll-body">
        <div className="rrd-layout">
          {/* Panneau de génération */}
          <div>
            <div className="rrd-gen-card">
              <div className="rrd-gen-head">
                <div className="rrd-gen-head-title">📑 Générer le rapport §9.3</div>
                <div className="rrd-gen-head-sub">L'aperçu se met à jour en temps réel</div>
              </div>
              <div className="rrd-gen-body">
                <div className="rrd-gen-field">
                  <div className="rrd-gen-label">Période couverte</div>
                  <select className="rrd-gen-select" value={period} onChange={onFilterChange}>
                    <option>Janvier – Juin 2025 (S1)</option>
                    <option>Janvier – Décembre 2024 (Annuel)</option>
                    <option>Juillet – Décembre 2024 (S2)</option>
                  </select>
                </div>
                <div className="rrd-gen-field">
                  <div className="rrd-gen-label">Organisé par</div>
                  <select className="rrd-gen-select" onChange={onFilterChange}>
                    <option>Direction (DG)</option>
                    <option>Responsable Qualité</option>
                  </select>
                </div>
                <div className="rrd-gen-field">
                  <div className="rrd-gen-label">Sections à inclure</div>
                  <div id="sections-list">
                    {sections.map((s, i) => (
                      <div className="section-checkbox" key={s.key} onClick={() => { toggleSection(i); updateReport(); }}>
                        <div className={`sc-check ${s.on ? 'on' : ''}`}>{s.on ? '✓' : ''}</div>
                        <div className="sc-label">{s.label}</div>
                        <div className="sc-ref">{s.ref}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rrd-progress">
                  <div className="rrd-progress-fill" style={{ width: `${Math.round(cnt / sections.length * 100)}%` }}></div>
                </div>
                <div className="rrd-progress-label">{cnt} sur {sections.length} sections sélectionnées</div>

                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button className="btn btn-p" style={{ width: '100%' }} onClick={exportPDF}>⬇ Exporter en PDF</button>
                  <button className="btn btn-g" style={{ width: '100%' }} onClick={() => showToast('success', 'Impression lancée')}>🖨 Imprimer</button>
                  <button className="btn btn-g" style={{ width: '100%' }} onClick={() => showToast('success', 'Email envoyé ✓')}>📧 Envoyer par email</button>
                </div>
              </div>
            </div>
          </div>

          {/* Aperçu du rapport */}
          <div className="rrd-preview">
            <div className="rrd-preview-bar">
              <span className="rrd-preview-bar-title">📄 Aperçu — Rapport de revue de direction · {period}</span>
              <div className="rrd-preview-actions">
                <button className="rrd-preview-btn rpb-print" onClick={() => showToast('success', 'Impression...')}>🖨 Imprimer</button>
                <button className="rrd-preview-btn rpb-pdf" onClick={exportPDF}>⬇ PDF</button>
              </div>
            </div>
            <div className="rrd-preview-body">
              <div className="rapport-doc" id="rapport-doc" dangerouslySetInnerHTML={{ __html: generateRapportHTML() }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RapportRevueDirection;