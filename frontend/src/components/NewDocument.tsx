import React, { useState, useEffect, useRef } from 'react';
import { createDocument, fetchTypeDocuments, fetchProcessus, fetchNiveauxConfidentialite, fetchLieux, fetchMethodesClassement, fetchFonctionsResponsable, uploadDocumentFile } from '../services/api';
import type { ReferenceItem } from '../services/api';

interface NewDocumentProps {
  onBack: () => void;
  onSuccess?: (docId?: number, codification?: string) => void;
}

const TYPE_CARDS = [
  { code: 'PRO', name: 'Procédure', icon: '📋', desc: 'Décrit un processus global', id: 1 },
  { code: 'MOD', name: 'Mode opératoire', icon: '🔧', desc: "Étapes d'exécution détaillées", id: 2 },
  { code: 'INS', name: 'Instruction', icon: '📌', desc: 'Consigne spécifique', id: 3 },
  { code: 'FOR', name: 'Enregistrement', icon: '📊', desc: 'Formulaire ou rapport', id: 4 },
  { code: 'TAB', name: 'Tableau', icon: '📈', desc: 'Données structurées', id: 5 },
  { code: 'MAN', name: 'Manuel', icon: '📖', desc: 'Document de référence', id: 6 },
];

const NewDocument: React.FC<NewDocumentProps> = ({ onBack, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<{code: string, name: string, id: number} | null>(null);
  const [processusId, setProcessusId] = useState('');
  const [processusCode, setProcessusCode] = useState('');
  const [domaine, setDomaine] = useState('');
  const [titre, setTitre] = useState('');
  const [niveauConf, setNiveauConf] = useState('');
  const [estExterne, setEstExterne] = useState('non');
  const [lieuClassement, setLieuClassement] = useState('');
  const [methode, setMethode] = useState('');
  const [dureeClass, setDureeClass] = useState('');
  const [lieuArch, setLieuArch] = useState('');
  const [dureeArch, setDureeArch] = useState('');
  const [respDest, setRespDest] = useState('');
  const [motif, setMotif] = useState('');
  const [redacteur, setRedacteur] = useState('');
  const [revu, setRevu] = useState('');
  const [approuve, setApprouve] = useState('');
  const [fichier, setFichier] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [codification, setCodification] = useState('');

  const [typeDocuments, setTypeDocuments] = useState<ReferenceItem[]>([]);
  const [processus, setProcessus] = useState<ReferenceItem[]>([]);
  const [niveaux, setNiveaux] = useState<ReferenceItem[]>([]);
  const [lieux, setLieux] = useState<ReferenceItem[]>([]);
  const [methodes, setMethodes] = useState<ReferenceItem[]>([]);
  const [responsables, setResponsables] = useState<ReferenceItem[]>([]);

  useEffect(() => {
    const loadRefs = async () => {
      const [td, pr, nc, lx, mc, fr] = await Promise.all([
        fetchTypeDocuments(),
        fetchProcessus(),
        fetchNiveauxConfidentialite(),
        fetchLieux(),
        fetchMethodesClassement(),
        fetchFonctionsResponsable(),
      ]);
      setTypeDocuments(td);
      setProcessus(pr);
      setNiveaux(nc);
      setLieux(lx);
      setMethodes(mc);
      setResponsables(fr);
    };
    loadRefs();
  }, []);

  const handleProcessusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setProcessusId(val);
    const selected = processus.find(p => p.id.toString() === val);
    setProcessusCode(selected?.label?.split(' — ')[0] || '');
  };

  const getProcessusLabel = () => {
    const selected = processus.find(p => p.id.toString() === processusId);
    return selected?.label?.split(' — ')[0] || '';
  };

  const getNiveauLabel = () => {
    const selected = niveaux.find(n => n.id.toString() === niveauConf);
    return selected?.label || '';
  };

  const getLieuClassementLabel = () => {
    const selected = lieux.find(l => l.id.toString() === lieuClassement);
    return selected?.label || '';
  };

  const getRedacteurLabel = () => {
    const selected = responsables.find(r => r.id.toString() === redacteur);
    return selected?.label || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !processusId || !domaine || !titre) return;
    if (!lieuClassement || !methode || !dureeClass || !lieuArch || !dureeArch || !respDest) return;

    setLoading(true);

    let fichierNom: string | null = null;
    let fichierOriginal: string | null = null;
    if (fichier) {
      const uploadResult = await uploadDocumentFile(fichier);
      if (uploadResult) {
        fichierNom = uploadResult.filename;
        fichierOriginal = uploadResult.originalName;
      }
    }

    const data = {
      numero_ordre: null,
      type_document_id: selectedType.id,
      processus_id: parseInt(processusId),
      codification: `${selectedType.code}.${processusCode || getProcessusLabel()}.${domaine}.${(Math.floor(Math.random()*15)+1).toString().padStart(3,'0')}`,
      niveau_confidentialite_id: parseInt(niveauConf) || null,
      lieu_classement_id: parseInt(lieuClassement) || null,
      methode_classement_id: parseInt(methode) || null,
      duree_classement: dureeClass || null,
      lieu_archivage_id: parseInt(lieuArch) || null,
      duree_archivage: dureeArch || null,
      responsable_destruction_id: parseInt(respDest) || null,
      est_externe: estExterne === 'oui',
      actif: true,
      titre,
      motif_modification: motif || null,
      fichier_nom: fichierNom,
      fichier_original: fichierOriginal,
      redacteur_id: redacteur ? parseInt(redacteur) : null,
      revu_par_id: revu ? parseInt(revu) : null,
      approuve_par_id: approuve ? parseInt(approuve) : null,
    };

    try {
      const result = await createDocument(data);
      if (result) {
        setCodification(result.codification || data.codification);
        setSuccess(true);
        onSuccess?.(result.id, result.codification || data.codification);
      }
    } catch (err) {
      console.error('Erreur:', err);
    }
    setLoading(false);
  };

  const prevStep = () => setStep(step - 1);

  const validateStep = (s: number) => {
    if (s === 1) {
      if (!selectedType) { alert('Veuillez sélectionner un type de document.'); return false; }
      if (!processusId) { alert('Veuillez sélectionner un processus.'); return false; }
      if (!domaine || domaine.length < 2) { alert('Domaine requis (3–5 lettres).'); return false; }
      if (!titre.trim()) { alert('Le titre est requis.'); return false; }
    }
    if (s === 2) {
      if (!lieuClassement || !methode || !dureeClass || !lieuArch || !dureeArch || !respDest) {
        alert('Veuillez compléter tous les champs de conservation.');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (!validateStep(step)) return;
    if (step === 3) {
      handleSubmit({ preventDefault: () => {} } as any);
      return;
    }
    setStep(step + 1);
  };

  const removeFile = () => {
    setFichier(null);
  };

  if (success) {
    return (
      <div className="success-overlay" style={{ display: 'flex' }}>
        <div className="success-modal">
          <div className="success-icon">🎉</div>
          <div className="success-title">Document créé !</div>
          <div className="success-code">{codification}</div>
          <div className="success-desc">
            Le document a été créé en <strong>Brouillon (Rév. 0)</strong>.<br />
            Le rédacteur peut maintenant le soumettre à la revue pour déclencher le workflow d'approbation.
          </div>
          <div className="success-actions">
            <button onClick={onBack} className="btn btn-ghost" type="button">Voir le registre</button>
            <button onClick={onBack} className="btn btn-primary" type="button">Ouvrir le document →</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      {/* TOPBAR */}
      <div className="topbar">
        <span className="topbar-back" onClick={onBack}>← Documents</span>
        <span className="topbar-sep">/</span>
        <span className="topbar-title">Nouveau document</span>
        <div className="topbar-logo">
          <div className="logo-icon">📋</div>
          <div className="logo-text">GED Qualité · ENSP</div>
        </div>
      </div>

      {/* PAGE */}
      <div className="page">

        {/* PROGRESS HEADER */}
        <div className="progress-header">
          <div className="progress-title">Créer un <span>nouveau document</span></div>
          <div className="steps-row">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`step-item ${step > s ? 'done' : step === s ? 'active' : ''}`}>
                <div className="step-num">{step > s ? '✓' : s}</div>
                <div className="step-info">
                  <div className="step-label">
                    {['Identification', 'Conservation', 'Révision initiale'][s - 1]}
                  </div>
                  <div className="step-sublabel">
                    {['Type, processus, titre', 'Classement, archivage', 'Fichier, responsables'][s - 1]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FORM AREA */}
        <div className="form-area">

          {/* ÉTAPE 1 : Identification */}
          <div className={`form-section ${step === 1 ? 'active' : ''}`}>
            <div className="section-head">
              <div className="section-icon">🏷️</div>
              <div>
                <div className="section-title">Identification du document</div>
                <div className="section-desc">Définit la nature et la place du document dans le référentiel qualité</div>
              </div>
            </div>

            {/* Type de document */}
            <div className="mt-lg">
              <div className="form-label-header">
                Type de document <span className="required-dot">•</span>
              </div>
              <div className="type-grid">
                {TYPE_CARDS.map((t) => (
                  <div
                    key={t.code}
                    className={`type-card ${selectedType?.code === t.code ? 'selected' : ''}`}
                    onClick={() => setSelectedType({code: t.code, name: t.name, id: t.id})}
                  >
                    <div className="type-card-icon">{t.icon}</div>
                    <div className="type-card-code">{t.code}</div>
                    <div className="type-card-name">{t.name}</div>
                    <div className="type-card-desc">{t.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label>Processus <span className="required-dot">•</span></label>
                <select value={processusId} onChange={handleProcessusChange}>
                  <option value="">— Sélectionner —</option>
                  {processus.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Domaine <span className="required-dot">•</span></label>
                <input
                  type="text"
                  className="code-input"
                  maxLength={5}
                  placeholder="ex: HSE, GEN, LOG…"
                  value={domaine}
                  onChange={(e) => setDomaine(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                />
                <span className="field-hint">3 à 5 lettres, identifie le sous-domaine</span>
              </div>
            </div>

            <div className="field-row single">
              <div className="field">
                <label>Titre complet du document <span className="required-dot">•</span></label>
                <input
                  type="text"
                  placeholder="ex: Procédure de gestion des non-conformités"
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                />
                <span className="field-hint">Formulez de manière précise et complète — ce titre figure dans le registre officiel</span>
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label>Niveau de confidentialité <span className="required-dot">•</span></label>
                <select value={niveauConf} onChange={(e) => setNiveauConf(e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  {niveaux.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Document externe ?</label>
                <select value={estExterne} onChange={(e) => setEstExterne(e.target.value)}>
                  <option value="non">Non — document interne</option>
                  <option value="oui">Oui — norme, certification…</option>
                </select>
              </div>
            </div>
          </div>

          {/* ÉTAPE 2 : Conservation */}
          <div className={`form-section ${step === 2 ? 'active' : ''}`}>
            <div className="section-head">
              <div className="section-icon">🗂️</div>
              <div>
                <div className="section-title">Conservation et archivage</div>
                <div className="section-desc">Définit où et combien de temps le document est conservé — exigé par ISO 9001 §7.5.3.2</div>
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label>Lieu de classement <span className="required-dot">•</span></label>
                <select value={lieuClassement} onChange={(e) => setLieuClassement(e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  {lieux.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Méthode de classement <span className="required-dot">•</span></label>
                <select value={methode} onChange={(e) => setMethode(e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  {methodes.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label>Durée de classement <span className="required-dot">•</span></label>
                <select value={dureeClass} onChange={(e) => setDureeClass(e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  <option value="1 an">1 an</option>
                  <option value="3 ans">3 ans</option>
                  <option value="5 ans">5 ans</option>
                  <option value="10 ans">10 ans</option>
                  <option value="Permanent">Permanent</option>
                </select>
              </div>
              <div className="field">
                <label>Lieu d'archivage <span className="required-dot">•</span></label>
                <select value={lieuArch} onChange={(e) => setLieuArch(e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  {lieux.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
                </select>
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label>Durée d'archivage <span className="required-dot">•</span></label>
                <select value={dureeArch} onChange={(e) => setDureeArch(e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  <option value="3 ans">3 ans</option>
                  <option value="5 ans">5 ans</option>
                  <option value="10 ans">10 ans</option>
                  <option value="Permanent">Permanent</option>
                </select>
              </div>
              <div className="field">
                <label>Responsable de destruction <span className="required-dot">•</span></label>
                <select value={respDest} onChange={(e) => setRespDest(e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  {responsables.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* ÉTAPE 3 : Révision initiale */}
          <div className={`form-section ${step === 3 ? 'active' : ''}`}>
            <div className="section-head">
              <div className="section-icon">✍️</div>
              <div>
                <div className="section-title">Révision initiale (Rév. 0)</div>
                <div className="section-desc">Le document démarre en brouillon — le workflow d'approbation ISO 9001 s'enclenche ensuite</div>
              </div>
            </div>

            {/* Fichier */}
            <div className="mt-md">
              <div className="form-label-header">
                Fichier du document (optionnel à cette étape)
              </div>
              {!fichier ? (
                <div
                  className={`upload-zone ${dragOver ? 'dragover' : ''}`}
                  onClick={() => document.getElementById('file-input-step3')?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const file = e.dataTransfer.files[0];
                    if (file) setFichier(file);
                  }}
                >
                  <div className="upload-icon">📎</div>
                  <div className="upload-title">Déposer le fichier ici</div>
                  <div className="upload-sub">ou <span>parcourir</span> vos fichiers</div>
                  <div className="upload-formats">PDF, DOCX, XLSX · Max 20 Mo</div>
                  <input
                    type="file"
                    id="file-input-step3"
                    accept=".pdf,.docx,.xlsx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setFichier(file);
                    }}
                  />
                </div>
              ) : (
                <div className="file-preview visible">
                  <span className="file-preview-icon">📄</span>
                  <span className="file-preview-name">{fichier.name}</span>
                  <span className="file-preview-size">{(fichier.size / 1024 / 1024).toFixed(1)} Mo</span>
                  <span className="file-preview-remove" onClick={removeFile}>✕</span>
                </div>
              )}
            </div>

            {/* Motif */}
            <div className="field-row single mt-md">
              <div className="field">
                <label>Motif de création</label>
                <textarea
                  placeholder="ex: Création initiale suite audit interne — référentiel §7.5 ISO 9001:2015"
                  rows={3}
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                />
              </div>
            </div>

            {/* Responsabilités */}
            <div className="form-label-header">
              Responsabilités <span className="required-dot">•</span>
            </div>

            <div className="signataire-row">
              <div className="signataire-avatar avatar-red">AF</div>
              <div className="signataire-info">
                <div className="signataire-role">✍️ Rédacteur</div>
                <select className="signataire-select" value={redacteur} onChange={(e) => setRedacteur(e.target.value)}>
                  <option value="">— Sélectionner le rédacteur —</option>
                  {responsables.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </div>
            </div>

            <div className="signataire-row">
              <div className="signataire-avatar avatar-blue">RV</div>
              <div className="signataire-info">
                <div className="signataire-role">🔍 Chargé de revue</div>
                <select className="signataire-select" value={revu} onChange={(e) => setRevu(e.target.value)}>
                  <option value="">— Sélectionner le relecteur —</option>
                  {responsables.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </div>
            </div>

            <div className="signataire-row">
              <div className="signataire-avatar avatar-gold">AP</div>
              <div className="signataire-info">
                <div className="signataire-role">✅ Approbateur</div>
                <select className="signataire-select" value={approuve} onChange={(e) => setApprouve(e.target.value)}>
                  <option value="">— Sélectionner l'approbateur —</option>
                  {responsables.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </div>
            </div>

            <div className="info-banner mt-lg">
              ℹ️ Le document sera créé en <strong>Brouillon (Rév. 0)</strong>. Le rédacteur peut ensuite le soumettre à la revue pour déclencher le workflow d'approbation ISO 9001.
            </div>
          </div>

        </div>

        {/* SIDEBAR PREVIEW */}
        <div className="preview-sidebar">

          {/* Codification live */}
          <div className="codification-preview">
            <div className="codif-label">Codification générée</div>
            <div className="codif-live">
              {selectedType ? (
                <span className="codif-type">{selectedType.code}</span>
              ) : (
                <span className="codif-pending">TYPE</span>
              )}
              <span className="codif-dot">.</span>
              {processusCode || getProcessusLabel() ? (
                <span className="codif-proc">{processusCode || getProcessusLabel()}</span>
              ) : (
                <span className="codif-pending">PROC</span>
              )}
              <span className="codif-dot">.</span>
              {domaine ? (
                <span className="codif-dom">{domaine}</span>
              ) : (
                <span className="codif-pending">DOM</span>
              )}
              <span className="codif-dot">.</span>
              <span className="codif-num">NNN</span>
            </div>
            <div className="codif-legend">
              <div className="codif-legend-item">
                <div className="legend-dot ld-type"></div>
                <span>Type de document</span>
              </div>
              <div className="codif-legend-item">
                <div className="legend-dot ld-proc"></div>
                <span>Processus propriétaire</span>
              </div>
              <div className="codif-legend-item">
                <div className="legend-dot ld-dom"></div>
                <span>Domaine / sous-processus</span>
              </div>
              <div className="codif-legend-item">
                <div className="legend-dot ld-num"></div>
                <span>Numéro séquentiel auto</span>
              </div>
            </div>
          </div>

          {/* Récapitulatif */}
          <div className="summary-card">
            <h4>📋 Récapitulatif</h4>
            <div className="summary-row">
              <span className="summary-key">Type</span>
              <span className={`summary-val code ${selectedType ? '' : 'empty'}`}>
                {selectedType ? `${selectedType.code} — ${selectedType.name}` : '—'}
              </span>
            </div>
            <div className="summary-row">
              <span className="summary-key">Processus</span>
              <span className={`summary-val ${processusCode || getProcessusLabel() ? '' : 'empty'}`}>
                {processusCode || getProcessusLabel() || '—'}
              </span>
            </div>
            <div className="summary-row">
              <span className="summary-key">Titre</span>
              <span className={`summary-val ${titre ? '' : 'empty'}`} style={{ maxWidth: 160, wordBreak: 'break-word' }}>
                {titre ? (titre.length > 40 ? titre.slice(0, 40) + '…' : titre) : '—'}
              </span>
            </div>
            <div className="summary-row">
              <span className="summary-key">Confidentialité</span>
              <span className={`summary-val ${getNiveauLabel() ? '' : 'empty'}`}>
                {getNiveauLabel() || '—'}
              </span>
            </div>
            <div className="summary-row">
              <span className="summary-key">Classement</span>
              <span className={`summary-val ${getLieuClassementLabel() ? '' : 'empty'}`}>
                {getLieuClassementLabel() || '—'}
              </span>
            </div>
            <div className="summary-row">
              <span className="summary-key">Rédacteur</span>
              <span className={`summary-val ${getRedacteurLabel() ? '' : 'empty'}`}>
                {getRedacteurLabel() || '—'}
              </span>
            </div>
          </div>

          {/* Tips ISO */}
          <div className="tips-card">
            <h4>💡 ISO 9001 §7.5</h4>
            <ul className="tips-list">
              <li>La codification est attribuée automatiquement après création</li>
              <li>Chaque révision doit être approuvée avant diffusion</li>
              <li>La version obsolète reste archivée à des fins de traçabilité</li>
            </ul>
          </div>

        </div>

        {/* FOOTER */}
        <div className="form-footer">
          <div className="footer-step-info">Étape <span>{step}</span> sur 3</div>
          <button className="btn btn-text" onClick={prevStep} style={{ display: step > 1 ? 'inline-flex' : 'none' }} type="button">← Retour</button>
          <div className="spacer"></div>
          <button className="btn btn-ghost" onClick={() => {}} type="button">💾 Enregistrer brouillon</button>
          <button className="btn btn-primary" onClick={nextStep} disabled={loading} type="button">
            {step === 3 ? '✓ Créer le document' : 'Étape suivante →'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default NewDocument;
