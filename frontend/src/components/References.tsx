import React, { useState, useEffect } from 'react';
import {
  fetchTypeDocuments,
  fetchProcessus,
  fetchLieux,
  fetchMethodesClassement,
  fetchNiveauxConfidentialite,
  fetchFonctionsResponsable,
} from '../services/api';
import type { ReferenceItem } from '../services/api';

type RefTab = 'types' | 'processus' | 'lieux' | 'workflow' | 'conf';

const References: React.FC = () => {
  const [activeTab, setActiveTab] = useState<RefTab>('types');
  const [types, setTypes] = useState<ReferenceItem[]>([]);
  const [processus, setProcessus] = useState<ReferenceItem[]>([]);
  const [lieux, setLieux] = useState<ReferenceItem[]>([]);
  const [methodes, setMethodes] = useState<ReferenceItem[]>([]);
  const [niveaux, setNiveaux] = useState<ReferenceItem[]>([]);
  const [responsables, setResponsables] = useState<ReferenceItem[]>([]);

  useEffect(() => {
    const loadRefs = async () => {
      const [t, p, l, m, n, r] = await Promise.all([
        fetchTypeDocuments(),
        fetchProcessus(),
        fetchLieux(),
        fetchMethodesClassement(),
        fetchNiveauxConfidentialite(),
        fetchFonctionsResponsable(),
      ]);
      setTypes(t);
      setProcessus(p);
      setLieux(l);
      setMethodes(m);
      setNiveaux(n);
      setResponsables(r);
    };
    loadRefs();
  }, []);

  const renderTypes = () => (
    <div className="ref-section">
      <div className="ref-sec-head">
        <div className="ref-sec-title">Types de document</div>
        <div className="ref-sec-count">{types.length} types enregistrés</div>
      </div>
      <table className="ref-table">
        <thead>
          <tr><th>Libellé</th><th>Code</th><th>Description</th><th>Statut</th><th></th></tr>
        </thead>
        <tbody>
          {types.map((t, i) => (
            <tr key={t.id}>
              <td><div className="ed-cell"><span className="ed-val" contentEditable suppressContentEditableWarning onBlur={(e) => { /* TODO: save */ }}>{t.label}</span></div></td>
              <td><span className="code-chip">{t.label.substring(0, 3).toUpperCase()}</span></td>
              <td style={{ color: 'var(--muted)' }}>—</td>
              <td><span className="status-toggle st-active">✅ Actif</span></td>
              <td><button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)', borderColor: '#FECACA' }} title="Supprimer">🗑</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="ref-add-row">
        <div className="add-row-form">
          <input className="add-inp" placeholder="Libellé (ex: Plan)" />
          <input className="add-inp" placeholder="Code (ex: PLN)" maxLength={5} style={{ maxWidth: 100, textTransform: 'uppercase' }} />
          <input className="add-inp" placeholder="Description courte" />
          <button className="btn btn-primary btn-sm">+ Ajouter</button>
        </div>
      </div>
    </div>
  );

  const renderProcessus = () => (
    <div className="ref-section">
      <div className="ref-sec-head">
        <div className="ref-sec-title">Processus / Directions</div>
        <div className="ref-sec-count">{processus.length} processus enregistrés</div>
      </div>
      <table className="ref-table">
        <thead>
          <tr><th>Code</th><th>Libellé</th><th>Responsable</th><th>Documents</th><th>Statut</th><th></th></tr>
        </thead>
        <tbody>
          {processus.map((p, i) => (
            <tr key={p.id}>
              <td><span className="code-chip">{p.label}</span></td>
              <td><div className="ed-cell"><span className="ed-val" contentEditable suppressContentEditableWarning>{p.label}</span></div></td>
              <td><div className="ed-cell"><span className="ed-val" contentEditable suppressContentEditableWarning>—</span></div></td>
              <td style={{ color: 'var(--muted)', fontWeight: 600 }}>0</td>
              <td><span className="status-toggle st-active">✅ Actif</span></td>
              <td><button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)', borderColor: '#FECACA' }} title="Supprimer">🗑</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="ref-add-row">
        <div className="add-row-form">
          <input className="add-inp" placeholder="Code (ex: DFI)" maxLength={8} style={{ maxWidth: 110, textTransform: 'uppercase' }} />
          <input className="add-inp" placeholder="Libellé complet de la direction" />
          <input className="add-inp" placeholder="Responsable" />
          <button className="btn btn-primary btn-sm">+ Ajouter</button>
        </div>
      </div>
    </div>
  );

  const renderLieux = () => (
    <div className="ref-section">
      <div className="ref-sec-head">
        <div className="ref-sec-title">Lieux de classement et d'archivage</div>
        <div className="ref-sec-count">{lieux.length} lieux enregistrés</div>
      </div>
      <table className="ref-table">
        <thead>
          <tr><th>Libellé</th><th>Type</th><th>Capacité</th><th>Responsable</th><th>Statut</th><th></th></tr>
        </thead>
        <tbody>
          {lieux.map((l, i) => (
            <tr key={l.id}>
              <td><div className="ed-cell"><span className="ed-val" contentEditable suppressContentEditableWarning>{l.label}</span></div></td>
              <td>
                <select className="add-inp" style={{ maxWidth: 150 }}>
                  <option>Classement</option>
                  <option>Archivage</option>
                  <option>Les deux</option>
                </select>
              </td>
              <td style={{ color: 'var(--muted)' }}>—</td>
              <td><div className="ed-cell"><span className="ed-val" contentEditable suppressContentEditableWarning>—</span></div></td>
              <td><span className="status-toggle st-active">✅ Actif</span></td>
              <td><button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)', borderColor: '#FECACA' }} title="Supprimer">🗑</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="ref-add-row">
        <div className="add-row-form">
          <input className="add-inp" placeholder="Libellé du lieu" />
          <select className="add-inp" style={{ maxWidth: 160 }}>
            <option value="classement">Classement</option>
            <option value="archivage">Archivage</option>
            <option value="les deux">Les deux</option>
          </select>
          <input className="add-inp" placeholder="Responsable" />
          <button className="btn btn-primary btn-sm">+ Ajouter</button>
        </div>
      </div>
    </div>
  );

  const renderWorkflow = () => (
    <div className="ref-section">
      <div className="ref-sec-head">
        <div className="ref-sec-title">Machine à états du workflow ISO 9001</div>
        <div className="ref-sec-count" style={{ color: 'var(--amber)' }}>⚠️ Lecture seule — modifiable uniquement par l'administrateur</div>
      </div>
      <div className="wf-diagram">
        {[
          { lbl: 'Brouillon', cls: 'nb-BROUILLON', desc: 'Rédaction' },
          { arrow: 'Soumise' },
          { lbl: 'En revue', cls: 'nb-EN_REVUE', desc: 'Vérification' },
          { arrow: 'Approuvée / Retour' },
          { lbl: 'Approuvé', cls: 'nb-APPROUVE', desc: 'Validation' },
          { arrow: 'Publiée / Retour' },
          { lbl: 'Applicable', cls: 'nb-APPLICABLE', desc: 'En vigueur' },
          { arrow: 'Obsolète' },
          { lbl: 'Obsolète', cls: 'nb-OBSOLETE', desc: 'Remplacé' },
        ].map((node, i) => {
          if (node.arrow) {
            return (
              <div key={`arr-${i}`} className="wf-arrow">
                <div className="wf-arrow-line" />
                <div className="wf-arrow-lbl">{node.arrow}</div>
              </div>
            );
          }
          return (
            <div key={node.lbl} className="wf-node">
              <div className={`wf-node-box ${node.cls}`}>{node.lbl}</div>
              <div className="wf-node-desc">{node.desc}</div>
            </div>
          );
        })}
      </div>
      <div style={{ padding: 14, borderTop: '1px solid var(--surf2)' }}>
        <table className="ref-table">
          <thead><tr><th>Transition</th><th>De</th><th>Vers</th><th>Permission requise</th><th>Automatique</th></tr></thead>
          <tbody>
            {[
              { from: 'BROUILLON', to: 'EN_REVUE', perm: 'Rédacteur', auto: 'Non' },
              { from: 'EN_REVUE', to: 'APPROUVE', perm: 'Responsable Qualité', auto: 'Non' },
              { from: 'EN_REVUE', to: 'BROUILLON', perm: 'Responsable Qualité', auto: 'Non' },
              { from: 'APPROUVE', to: 'APPLICABLE', perm: 'Responsable Qualité', auto: 'Non' },
              { from: 'APPLICABLE', to: 'OBSOLETE', perm: 'Système', auto: 'Oui' },
              { from: 'OBSOLETE', to: 'ARCHIVE', perm: 'Système', auto: 'Oui' },
            ].map((tr, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{tr.from} → {tr.to}</td>
                <td><span className={`st-badge st-${tr.from}`}>{tr.from}</span></td>
                <td><span className={`st-badge st-${tr.to}`}>{tr.to}</span></td>
                <td>{tr.perm}</td>
                <td>{tr.auto === 'Oui' ? '✅' : 'Non'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderConf = () => (
    <div className="ref-section">
      <div className="ref-sec-head">
        <div className="ref-sec-title">Niveaux de confidentialité</div>
        <div className="ref-sec-count">{niveaux.length} niveaux définis</div>
      </div>
      <table className="ref-table">
        <thead>
          <tr><th>Niveau</th><th>Libellé</th><th>Description</th><th>Permissions d'accès</th><th></th></tr>
        </thead>
        <tbody>
          {niveaux.map((n, i) => (
            <tr key={n.id}>
              <td><span className="code-chip">N{n.id}</span></td>
              <td><div className="ed-cell"><span className="ed-val" contentEditable suppressContentEditableWarning>{n.label}</span></div></td>
              <td style={{ color: 'var(--muted)' }}>—</td>
              <td>{n.id === 1 ? 'Tous' : n.id === 2 ? 'Personnel interne' : 'Direction uniquement'}</td>
              <td><button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)', borderColor: '#FECACA' }} title="Supprimer">🗑</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="detail-pane">
      <div className="view-header">
        <div>
          <div className="vh-title">⚙️ Référentiels</div>
          <div className="vh-sub">Tables de valeurs du système — modification directe inline</div>
        </div>
      </div>

      <div className="ref-tabs">
        {[
          { id: 'types', label: 'Types de document' },
          { id: 'processus', label: 'Processus' },
          { id: 'lieux', label: 'Lieux' },
          { id: 'workflow', label: 'Workflow d\'approbation' },
          { id: 'conf', label: 'Confidentialité' },
        ].map((tab) => (
          <div key={tab.id} className={`ref-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id as RefTab)}>
            {tab.label}
          </div>
        ))}
      </div>

      <div className="ref-view" style={{ display: activeTab === 'types' ? 'block' : 'none' }}>
        {renderTypes()}
      </div>
      <div className="ref-view" style={{ display: activeTab === 'processus' ? 'block' : 'none' }}>
        {renderProcessus()}
      </div>
      <div className="ref-view" style={{ display: activeTab === 'lieux' ? 'block' : 'none' }}>
        {renderLieux()}
      </div>
      <div className="ref-view" style={{ display: activeTab === 'workflow' ? 'block' : 'none' }}>
        {renderWorkflow()}
      </div>
      <div className="ref-view" style={{ display: activeTab === 'conf' ? 'block' : 'none' }}>
        {renderConf()}
      </div>
    </div>
  );
};

export default References;
