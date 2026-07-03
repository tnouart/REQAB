// src/components/DocumentForm.tsx
import { useState, useEffect } from 'react';
import {
  createDocument,
  updateDocument,
  fetchDocumentById,
  fetchTypeDocuments,
  fetchProcessus,
  fetchNiveauxConfidentialite,
  fetchLieux,
  fetchMethodesClassement,
  fetchFonctionsResponsable,
} from '../services/api';
import type { Document, ReferenceItem, DocumentFormData } from '../services/api';

interface DocumentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  document?: Document | null;
  mode?: 'create' | 'edit';
}

interface FormErrors {
  codification?: string;
  type_document_id?: string;
  processus_id?: string;
  niveau_confidentialite_id?: string;
  lieu_classement_id?: string;
  methode_classement_id?: string;
  duree_classement?: string;
  lieu_archivage_id?: string;
  duree_archivage?: string;
  responsable_destruction_id?: string;
  numero_ordre?: string;
  motif_modification?: string;
}

const emptyForm: DocumentFormData = {
  numero_ordre: null,
  type_document_id: 0,
  processus_id: 0,
  codification: '',
  niveau_confidentialite_id: null,
  lieu_classement_id: null,
  methode_classement_id: null,
  duree_classement: null,
  lieu_archivage_id: null,
  duree_archivage: null,
  responsable_destruction_id: null,
  est_externe: false,
  actif: true,
  motif_modification: '',
};

const validate = (data: DocumentFormData, mode: 'create' | 'edit'): FormErrors => {
  const errors: FormErrors = {};
  if (!data.codification.trim()) errors.codification = 'Ce champ est obligatoire';
  if (data.type_document_id === 0) errors.type_document_id = 'Veuillez sélectionner un type';
  if (data.processus_id === 0) errors.processus_id = 'Veuillez sélectionner un processus';
  if (data.niveau_confidentialite_id === null) errors.niveau_confidentialite_id = 'Veuillez sélectionner un niveau';
  if (data.lieu_classement_id === null) errors.lieu_classement_id = 'Veuillez sélectionner un lieu';
  if (data.methode_classement_id === null) errors.methode_classement_id = 'Veuillez sélectionner une méthode';
  if (!data.duree_classement?.trim()) errors.duree_classement = 'Ce champ est obligatoire';
  if (data.lieu_archivage_id === null) errors.lieu_archivage_id = 'Veuillez sélectionner un lieu';
  if (!data.duree_archivage?.trim()) errors.duree_archivage = 'Ce champ est obligatoire';
  if (data.responsable_destruction_id === null) errors.responsable_destruction_id = 'Veuillez sélectionner un responsable';
  if (data.numero_ordre === null || data.numero_ordre === undefined) errors.numero_ordre = 'Ce champ est obligatoire';
  else if (data.numero_ordre < 1) errors.numero_ordre = 'La valeur doit être supérieure à 0';
  if (mode === 'edit' && !data.motif_modification?.trim()) {
    errors.motif_modification = 'Le motif de modification est obligatoire pour une mise à jour';
  }
  return errors;
};

const DocumentForm: React.FC<DocumentFormProps> = ({ onSuccess, onCancel, document, mode = 'create' }) => {
  const [formData, setFormData] = useState<DocumentFormData>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});

  const clearFieldError = (name: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[name as keyof FormErrors];
      return next;
    });
  };

  useEffect(() => {
    if (mode === 'edit' && document) {
      const loadDocument = async () => {
        try {
          const fullDoc = await fetchDocumentById(document.id);
          if (fullDoc) {
            setFormData({
              numero_ordre: fullDoc.numero_ordre,
              type_document_id: fullDoc.type_document_id || 0,
              processus_id: fullDoc.processus_id || 0,
              codification: fullDoc.codification || '',
              niveau_confidentialite_id: fullDoc.niveau_confidentialite_id || 0,
              lieu_classement_id: fullDoc.lieu_classement_id || 0,
              methode_classement_id: fullDoc.methode_classement_id || 0,
              duree_classement: fullDoc.duree_classement || '',
              lieu_archivage_id: fullDoc.lieu_archivage_id || 0,
              duree_archivage: fullDoc.duree_archivage || '',
              responsable_destruction_id: fullDoc.responsable_destruction_id || 0,
              est_externe: fullDoc.est_externe || false,
              actif: fullDoc.actif ?? true,
              motif_modification: '',
            });
          }
        } catch (err) {
          console.error('Erreur chargement document pour édition:', err);
        }
      };
      loadDocument();
    }
  }, [mode, document]);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target;
    const value = target.type === 'checkbox'
      ? (target as HTMLInputElement).checked
      : target.type === 'number'
        ? (target.value === '' ? null : Number(target.value))
        : target.value;

    const name = target.name as keyof DocumentFormData;
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearFieldError(name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const errors = validate(formData, mode);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setLoading(false);
      return;
    }

    let result;
    if (mode === 'edit' && document) {
      result = await updateDocument(document.id, formData);
    } else {
      result = await createDocument(formData);
    }

    if (result) {
      onSuccess();
    } else {
      setError("Échec de l'enregistrement du document.");
    }
    setLoading(false);
  };

  const inputClass = (hasError: boolean) =>
    `form-input${hasError ? ' input-error' : ''}`;

  const selectClass = (hasError: boolean) =>
    `form-select${hasError ? ' select-error' : ''}`;

  return (
    <div>
      <div className="page-title">
        <div>
          {mode === 'edit' ? 'Modifier le document' : 'Nouveau document'}
          <div className="page-title-secondary">
            {mode === 'edit'
              ? 'Modifiez les champs puis enregistrez les changements'
              : 'Remplissez les champs pour créer une entrée dans le registre'}
          </div>
        </div>
        <button onClick={onCancel} className="btn btn-ghost" type="button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Retour
        </button>
      </div>

      <form onSubmit={handleSubmit} className="form">
        {error && (
          <div className="alert alert-error" role="alert">
            <span>{error}</span>
          </div>
        )}

        <div className="form-section">
          <div className="form-section-header">Identification</div>
          <div className="form-section-body">
            <div className="form-row">
              <label className="form-label" htmlFor="numero_ordre">N° ordre *</label>
              <input
                id="numero_ordre"
                type="number"
                name="numero_ordre"
                value={formData.numero_ordre ?? ''}
                onChange={handleChange}
                className={inputClass(!!fieldErrors.numero_ordre)}
                placeholder="Ex: 1"
              />
              {fieldErrors.numero_ordre && <span className="field-error">{fieldErrors.numero_ordre}</span>}
            </div>

            <div className="form-row">
              <label className="form-label" htmlFor="codification">Codification *</label>
              <input
                id="codification"
                type="text"
                name="codification"
                value={formData.codification}
                onChange={handleChange}
                className={inputClass(!!fieldErrors.codification)}
                placeholder="Ex: PRO.QHSE.GEN.001"
              />
              {fieldErrors.codification && <span className="field-error">{fieldErrors.codification}</span>}
            </div>

            <div className="form-row">
              <label className="form-label" htmlFor="type_document_id">Type de document *</label>
              <select
                id="type_document_id"
                name="type_document_id"
                value={formData.type_document_id}
                onChange={handleChange}
                className={selectClass(!!fieldErrors.type_document_id)}
              >
                <option value="0">-- Sélectionner --</option>
                {typeDocuments.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
              {fieldErrors.type_document_id && <span className="field-error">{fieldErrors.type_document_id}</span>}
            </div>

            <div className="form-row">
              <label className="form-label" htmlFor="processus_id">Processus *</label>
              <select
                id="processus_id"
                name="processus_id"
                value={formData.processus_id}
                onChange={handleChange}
                className={selectClass(!!fieldErrors.processus_id)}
              >
                <option value="0">-- Sélectionner --</option>
                {processus.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
              {fieldErrors.processus_id && <span className="field-error">{fieldErrors.processus_id}</span>}
            </div>

            <div className="form-row">
              <label className="form-label" htmlFor="niveau_confidentialite_id">Niveau de confidentialité *</label>
              <select
                id="niveau_confidentialite_id"
                name="niveau_confidentialite_id"
                value={formData.niveau_confidentialite_id ?? ''}
                onChange={handleChange}
                className={selectClass(!!fieldErrors.niveau_confidentialite_id)}
              >
                <option value="0">-- Sélectionner --</option>
                {niveaux.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
              {fieldErrors.niveau_confidentialite_id && <span className="field-error">{fieldErrors.niveau_confidentialite_id}</span>}
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-header">Classement</div>
          <div className="form-section-body">
            <div className="form-row">
              <label className="form-label" htmlFor="methode_classement_id">Méthode de classement *</label>
              <select
                id="methode_classement_id"
                name="methode_classement_id"
                value={formData.methode_classement_id ?? ''}
                onChange={handleChange}
                className={selectClass(!!fieldErrors.methode_classement_id)}
              >
                <option value="0">-- Sélectionner --</option>
                {methodes.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
              {fieldErrors.methode_classement_id && <span className="field-error">{fieldErrors.methode_classement_id}</span>}
            </div>

            <div className="form-row">
              <label className="form-label" htmlFor="lieu_classement_id">Lieu de classement *</label>
              <select
                id="lieu_classement_id"
                name="lieu_classement_id"
                value={formData.lieu_classement_id ?? ''}
                onChange={handleChange}
                className={selectClass(!!fieldErrors.lieu_classement_id)}
              >
                <option value="0">-- Sélectionner --</option>
                {lieux.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
              {fieldErrors.lieu_classement_id && <span className="field-error">{fieldErrors.lieu_classement_id}</span>}
            </div>

            <div className="form-row">
              <label className="form-label" htmlFor="duree_classement">Durée de classement *</label>
              <input
                id="duree_classement"
                type="text"
                name="duree_classement"
                value={formData.duree_classement ?? ''}
                onChange={handleChange}
                className={inputClass(!!fieldErrors.duree_classement)}
                placeholder="Ex: 3 ans"
              />
              {fieldErrors.duree_classement && <span className="field-error">{fieldErrors.duree_classement}</span>}
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-header">Archivage et responsabilité</div>
          <div className="form-section-body">
            <div className="form-row">
              <label className="form-label" htmlFor="lieu_archivage_id">Lieu d'archivage *</label>
              <select
                id="lieu_archivage_id"
                name="lieu_archivage_id"
                value={formData.lieu_archivage_id ?? ''}
                onChange={handleChange}
                className={selectClass(!!fieldErrors.lieu_archivage_id)}
              >
                <option value="0">-- Sélectionner --</option>
                {lieux.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
              {fieldErrors.lieu_archivage_id && <span className="field-error">{fieldErrors.lieu_archivage_id}</span>}
            </div>

            <div className="form-row">
              <label className="form-label" htmlFor="duree_archivage">Durée d'archivage *</label>
              <input
                id="duree_archivage"
                type="text"
                name="duree_archivage"
                value={formData.duree_archivage ?? ''}
                onChange={handleChange}
                className={inputClass(!!fieldErrors.duree_archivage)}
                placeholder="Ex: 3 ans"
              />
              {fieldErrors.duree_archivage && <span className="field-error">{fieldErrors.duree_archivage}</span>}
            </div>

            <div className="form-row">
              <label className="form-label" htmlFor="responsable_destruction_id">Responsable destruction *</label>
              <select
                id="responsable_destruction_id"
                name="responsable_destruction_id"
                value={formData.responsable_destruction_id ?? ''}
                onChange={handleChange}
                className={selectClass(!!fieldErrors.responsable_destruction_id)}
              >
                <option value="0">-- Sélectionner --</option>
                {responsables.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
              {fieldErrors.responsable_destruction_id && <span className="field-error">{fieldErrors.responsable_destruction_id}</span>}
            </div>

            {mode === 'edit' && (
              <div className="form-row">
                <label className="form-label" htmlFor="motif_modification">Motif de modification *</label>
                <textarea
                  id="motif_modification"
                  name="motif_modification"
                  value={formData.motif_modification ?? ''}
                  onChange={(e) => {
                    const target = e.target;
                    const name = target.name as keyof DocumentFormData;
                    setFormData((prev) => ({ ...prev, [name]: target.value }));
                    clearFieldError('motif_modification');
                  }}
                  className="form-input"
                  placeholder="Ex: Mise à jour suite audit, correction erreur, ajout section..."
                  rows={3}
                  style={{ resize: 'vertical', minHeight: '2.5rem' }}
                />
                {fieldErrors.motif_modification && <span className="field-error">{fieldErrors.motif_modification}</span>}
              </div>
            )}

            <div className="checkbox-row">
              <input
                id="est_externe"
                type="checkbox"
                name="est_externe"
                checked={formData.est_externe}
                onChange={handleChange}
                className="checkbox"
              />
              <label htmlFor="est_externe" className="checkbox-label">Document externe</label>
            </div>

            <div className="checkbox-row">
              <input
                id="actif"
                type="checkbox"
                name="actif"
                checked={formData.actif}
                onChange={handleChange}
                className="checkbox"
              />
              <label htmlFor="actif" className="checkbox-label">Actif</label>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button onClick={onCancel} className="btn btn-ghost" type="button">
            Annuler
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <>
                <span className="skeleton" style={{ width: '4rem', height: '1rem', borderRadius: '999px' }} />
                Enregistrement...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Enregistrer
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DocumentForm;
