import React, { useState, useEffect } from 'react';
import { updateDocument, fetchTypeDocuments, fetchProcessus, fetchNiveauxConfidentialite, fetchLieux, fetchMethodesClassement, fetchFonctionsResponsable } from '../services/api';
import type { WorkflowDocument, ReferenceItem } from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface EditDocumentProps {
  document: WorkflowDocument;
  onBack: () => void;
  onSaved: (updated: WorkflowDocument) => void;
}

const EditDocument: React.FC<EditDocumentProps> = ({ document, onBack, onSaved }) => {
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [titre, setTitre] = useState(document.titre || '');
  const [processusId, setProcessusId] = useState<string>(String(document.processus_id || ''));
  const [domaine, setDomaine] = useState('');
  const [niveauConf, setNiveauConf] = useState<string>(String(document.niveau_confidentialite_id ?? ''));
  const [estExterne, setEstExterne] = useState(document.est_externe ? 'oui' : 'non');
  const [lieuClassement, setLieuClassement] = useState(String(document.lieu_classement_id ? 1 : ''));
  const [methode, setMethode] = useState(String(document.methode_classement_id ?? ''));
  const [dureeClass, setDureeClass] = useState(document.duree_classement || '');
  const [lieuArch, setLieuArch] = useState(String(document.lieu_archivage_id ? 1 : ''));
  const [dureeArch, setDureeArch] = useState(document.duree_archivage || '');
  const [respDest, setRespDest] = useState(String(document.responsable_destruction_id ? 1 : ''));
  const [motif, setMotif] = useState(document.motif_modification || '');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    titre?: boolean; processusId?: boolean; niveauConf?: boolean;
    lieuClassement?: boolean; methode?: boolean; dureeClass?: boolean;
    lieuArch?: boolean; dureeArch?: boolean; respDest?: boolean; motif?: boolean;
  }>({});

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

  const validate = () => {
    const fe: typeof fieldErrors = {};
    if (!titre.trim()) fe.titre = true;
    if (!processusId) fe.processusId = true;
    if (!niveauConf) fe.niveauConf = true;
    if (!lieuClassement) fe.lieuClassement = true;
    if (!methode) fe.methode = true;
    if (!dureeClass) fe.dureeClass = true;
    if (!lieuArch) fe.lieuArch = true;
    if (!dureeArch) fe.dureeArch = true;
    if (!respDest) fe.respDest = true;
    if (!motif.trim()) fe.motif = true;
    return fe;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFieldErrors({});
    try {
      const fe = validate();
      const hasErrors = Object.values(fe).some(v => v);
      if (hasErrors) {
        setFieldErrors(fe);
        setLoading(false);
        return;
      }
      const updated = await updateDocument(document.document_id, {
        type_document_id: document.type_document_id ? parseInt(document.type_document_id) : undefined,
        processus_id: parseInt(processusId) || document.processus_id || undefined,
        codification: document.codification || undefined,
        niveau_confidentialite_id: parseInt(niveauConf) || undefined,
        lieu_classement_id: parseInt(lieuClassement) || undefined,
        methode_classement_id: parseInt(methode) || undefined,
        duree_classement: dureeClass || document.duree_classement || undefined,
        lieu_archivage_id: parseInt(lieuArch) || undefined,
        duree_archivage: dureeArch || document.duree_archivage || undefined,
        responsable_destruction_id: parseInt(respDest) || undefined,
        est_externe: estExterne === 'oui',
        actif: true,
        titre,
        motif_modification: motif || null,
      }) as WorkflowDocument | null;
      if (updated) {
        onSaved({ ...document, ...updated, type_document_id: String(updated.type_document_id ?? document.type_document_id ?? '') });
      } else {
        onSaved(document);
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Erreur lors de la mise à jour. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrap">
      <div className="topbar">
        <span className="topbar-back" onClick={onBack}>← Documents</span>
        <span className="topbar-sep">/</span>
        <span className="topbar-title">Modifier le document</span>
        <div className="topbar-logo">
          <div className="logo-icon">📋</div>
          <div className="logo-text">GED Qualité · ENSP</div>
        </div>
      </div>

      <div className="page">
        <form onSubmit={handleSave}>
          <div className="form-section active">
            <div className="section-head">
              <div className="section-icon">🏷️</div>
              <div>
                <div className="section-title">Identification du document</div>
                <div className="section-desc">Modifier les informations de base du document</div>
              </div>
            </div>

            <div className="field-row single">
              <div className={`field${fieldErrors.titre ? ' has-error' : ''}`}>
                <label>Titre du document <span className="required-dot">•</span></label>
                <input
                  type="text"
                  placeholder="Titre du document"
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                />
                {fieldErrors.titre && <span className="field-error">Le titre est obligatoire.</span>}
              </div>
            </div>

            <div className="field-row">
              <div className={`field${fieldErrors.processusId ? ' has-error' : ''}`}>
                <label>Processus <span className="required-dot">•</span></label>
                <select value={processusId} onChange={(e) => setProcessusId(e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  {processus.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
                {fieldErrors.processusId && <span className="field-error">Le processus est obligatoire.</span>}
              </div>
              <div className="field">
                <label>Niveau de confidentialité</label>
                <select value={niveauConf} onChange={(e) => setNiveauConf(e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  {niveaux.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
                </select>
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label>Lieu de classement</label>
                <select value={lieuClassement} onChange={(e) => setLieuClassement(e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  {lieux.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Méthode de classement</label>
                <select value={methode} onChange={(e) => setMethode(e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  {methodes.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label>Durée de classement</label>
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
                <label>Lieu d'archivage</label>
                <select value={lieuArch} onChange={(e) => setLieuArch(e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  {lieux.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
                </select>
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label>Durée d'archivage</label>
                <select value={dureeArch} onChange={(e) => setDureeArch(e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  <option value="3 ans">3 ans</option>
                  <option value="5 ans">5 ans</option>
                  <option value="10 ans">10 ans</option>
                  <option value="Permanent">Permanent</option>
                </select>
              </div>
              <div className="field">
                <label>Responsable de destruction</label>
                <select value={respDest} onChange={(e) => setRespDest(e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  {responsables.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </div>
            </div>

            <div className="field-row mt-sm">
              <div className="field">
                <label>Document externe ?</label>
                <select value={estExterne} onChange={(e) => setEstExterne(e.target.value)}>
                  <option value="non">Non — document interne</option>
                  <option value="oui">Oui — norme, certification…</option>
                </select>
              </div>
            </div>

            <div className="field-row single mt-sm">
              <div className="field">
                <label>Motif de modification</label>
                <textarea
                  placeholder="Motif de la modification (obligatoire selon la politique qualité)"
                  rows={3}
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="form-footer">
            <div className="footer-step-info">Modification du document</div>
            <button className="btn btn-text" onClick={onBack} type="button">← Annuler</button>
            <div className="spacer"></div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Enregistrement…' : '✓ Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDocument;
