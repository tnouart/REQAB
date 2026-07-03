// src/services/api.ts
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const normalizeStatut = (s: string | null | undefined): string => {
  if (!s) return 'brouillon';
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
};

export const toStatutCode = (s: string | null | undefined): string => {
  const n = (s || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_');
  if (['BROUILLON', 'EN_REVUE', 'APPROUVE', 'APPLICABLE', 'OBSOLETE', 'ARCHIVE'].includes(n)) return n;
  return 'BROUILLON';
};

export interface AuditLog {
  id: number;
  table_name: string;
  record_id: number;
  action: string;
  old_values: any;
  new_values: any;
  user_email: string;
  ip_address: string;
  created_at: string;
}

export interface Signature {
  id: number;
  document_id: number;
  revision_id: number | null;
  signer_email: string;
  signer_name: string;
  signature_data: string | null;
  signed_at: string;
}

export interface DestructionRecord {
  id: number;
  document_id: number;
  revision_id: number | null;
  destroyed_by: string;
  destruction_date: string;
  method: string | null;
  witness: string | null;
  created_at: string;
  document_titre: string;
  document_codification: string;
}

export interface Document {
  id: number;
  numero_ordre: number | null;
  type_document_id: number | null;
  processus_id: number | null;
  codification: string | null;
  niveau_confidentialite_id: number | null;
  lieu_classement_id: number | null;
  methode_classement_id: number | null;
  duree_classement: string | null;
  lieu_archivage_id: number | null;
  duree_archivage: string | null;
  responsable_destruction_id: number | null;
  est_externe: boolean | null;
  actif: boolean | null;
  date_creation: string | null;
  date_maj: string | null;
  titre: string | null;
  processus: string | null;
  "N° de révision": number | null;
  "Date d'application": string | null;
  'niveau de confidentialité': number | null;
  'type de document': string | null;
  statut: string | null;
  'lieu de classement': string | null;
  'méthode de classement': string | null;
  'durée de classement': string | null;
  "lieu d'archivage": string | null;
  "durée d'archivage": string | null;
  'responsable de destruction': string | null;
  date_prochaine_revision: string | null;
  fichier_nom: string | null;
  motif: string | null;
  redacteur: string | null;
  revu: string | null;
  approuve: string | null;
}

export interface Revision {
  id: number;
  document_id: number;
  numero_revision: number;
  titre: string;
  motif_modification: string | null;
  statut: string;
  date_redaction: string | null;
  date_revue: string | null;
  date_approbation: string | null;
  date_application: string | null;
  date_fin_application: string | null;
  date_prochaine_revision: string | null;
  date_enregistrement: string;
  fichier_nom: string | null;
  fichier_original: string | null;
}

export const fetchDocuments = async (): Promise<Document[]> => {
  try {
    const response = await fetch(`${API_BASE}/documents`);
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Erreur lors de la récupération des documents:', error);
    return [];
  }
};

export interface ReferenceItem {
  id: number;
  label: string;
}

export interface DocumentFormData {
  numero_ordre: number | null;
  type_document_id: number;
  processus_id: number;
  codification: string;
  niveau_confidentialite_id: number | null;
  lieu_classement_id: number | null;
  methode_classement_id: number | null;
  duree_classement: string | null;
  lieu_archivage_id: number | null;
  duree_archivage: string | null;
  responsable_destruction_id: number | null;
  est_externe: boolean;
  actif: boolean;
  titre?: string | null;
  motif_modification?: string | null;
  fichier_nom?: string | null;
  fichier_original?: string | null;
}

const fetchRef = async (path: string): Promise<ReferenceItem[]> => {
  try {
    const response = await fetch(`${API_BASE}/${path}`);
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    return response.json();
  } catch (error) {
    console.error(`Erreur lors de la récupération de ${path}:`, error);
    return [];
  }
};

export const fetchTypeDocuments = () => fetchRef('references/type-document');
export const fetchProcessus = () => fetchRef('references/processus');
export const fetchNiveauxConfidentialite = () => fetchRef('references/niveau-confidentialite');
export const fetchLieux = () => fetchRef('references/lieu');
export const fetchMethodesClassement = () => fetchRef('references/methode-classement');
export const fetchFonctionsResponsable = () => fetchRef('references/fonction-responsable');

export const createDocument = async (documentData: Partial<DocumentFormData>): Promise<Document | null> => {
  try {
    const response = await fetch(`${API_BASE}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(documentData),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Erreur lors de la création du document:', error);
    return null;
  }
};

export const uploadDocumentFile = async (file: File): Promise<{ filename: string; originalName: string } | null> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    return response.json();
  } catch (error) {
    console.error('Erreur lors de l\'upload du fichier:', error);
    return null;
  }
};

export const fetchDocumentById = async (id: number): Promise<Document | null> => {
  try {
    const response = await fetch(`${API_BASE}/documents/${id}`);
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    return response.json();
  } catch (error) {
    console.error('Erreur lors de la récupération du document:', error);
    return null;
  }
};

export const fetchDocumentRevisions = async (id: string | number): Promise<Revision[]> => {
  try {
    const response = await fetch(`${API_BASE}/documents/${id}/revisions`);
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    return response.json();
  } catch (error) {
    console.error('Erreur lors de la récupération des révisions:', error);
    return [];
  }
};

export const updateDocument = async (id: number, documentData: Partial<DocumentFormData>): Promise<Document | null> => {
  try {
    const response = await fetch(`${API_BASE}/documents/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(documentData),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Erreur lors de la mise à jour du document:', error);
    return null;
  }
};

export const deleteDocument = async (id: number): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/documents/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression du document:', error);
    return false;
  }
};

export const fetchTables = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${API_BASE}/excel/tables`);
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    return response.json();
  } catch (error) {
    console.error('Erreur lors de la récupération des tables:', error);
    return [];
  }
};

export const exportTable = async (tableName: string): Promise<void> => {
  const url = `${API_BASE}/excel/export${tableName && tableName !== 'all' ? `?table=${encodeURIComponent(tableName)}` : ''}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition');
  let fileName = tableName && tableName !== 'all'
    ? `export_${tableName}_${new Date().toISOString().split('T')[0]}.xlsx`
    : `export_complet_${new Date().toISOString().split('T')[0]}.xlsx`;

  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename\*?=(?:UTF-8'')?([^;]+)/);
    if (match) fileName = match[1].replace(/['"]/g, '').trim();
  }

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

export const importTable = async (file: File, tableName: string): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('table', tableName);

  const response = await fetch(`${API_BASE}/excel/import`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erreur HTTP: ${response.status} - ${text}`);
  }

  return response.json();
};

export const fetchAuditLogs = async (table?: string, recordId?: number): Promise<AuditLog[]> => {
  try {
    let url = `${API_BASE}/audit`;
    const params = new URLSearchParams();
    if (table) params.append('table_name', table);
    if (recordId) params.append('record_id', recordId.toString());
    if (params.toString()) url += `?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    return response.json();
  } catch (error) {
    console.error('Erreur lors de la récupération des logs d\'audit:', error);
    return [];
  }
};

export const fetchSignatures = async (documentId: number): Promise<Signature[]> => {
  try {
    const response = await fetch(`${API_BASE}/signatures/document/${documentId}`);
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    return response.json();
  } catch (error) {
    console.error('Erreur lors de la récupération des signatures:', error);
    return [];
  }
};

export const addSignature = async (signatureData: {
  document_id: number;
  revision_id?: number | null;
  signer_email: string;
  signer_name: string;
  signature_data?: string;
}): Promise<Signature | null> => {
  try {
    const response = await fetch(`${API_BASE}/signatures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signatureData),
    });
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    return response.json();
  } catch (error) {
    console.error('Erreur lors de l\'ajout de signature:', error);
    return null;
  }
};

export const fetchDestructions = async (): Promise<DestructionRecord[]> => {
  try {
    const response = await fetch(`${API_BASE}/destructions`);
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    return response.json();
  } catch (error) {
    console.error('Erreur lors de la récupération des destructions:', error);
    return [];
  }
};

export const recordDestruction = async (destructionData: {
  document_id: number;
  revision_id?: number | null;
  destroyed_by: string;
  method?: string;
  witness?: string;
}): Promise<DestructionRecord | null> => {
  try {
    const response = await fetch(`${API_BASE}/destructions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(destructionData),
    });
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    return response.json();
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement destruction:', error);
    return null;
  }
};

export interface DueRevision {
  id: number;
  titre: string;
  codification: string | null;
  numero_revision: number;
  date_prochaine_revision: string;
  processus?: string;
}

export const fetchDueRevisions = async (): Promise<DueRevision[]> => {
  try {
    const response = await fetch(`${API_BASE}/documents/due-revision`);
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    return response.json();
  } catch (error) {
    console.error('Erreur lors de la récupération des révisions dues:', error);
    return [];
  }
};

export interface UserRef {
  id: number;
  email: string;
  nom: string;
  role: string;
}

export interface WorkflowDocument {
  document_id: number;
  codification: string | null;
  processus_id: number | null;
  processus: string | null;
  type_document_id: string | null;
  type_document: string | null;
  niveau_confidentialite_id: string | null;
  niveau_confidentialite: string | null;
  niveau_confidentialite_libelle: string | null;
  statut: string | null;
  lieu_classement_id: string | null;
  lieu_classement: string | null;
  methode_classement_id: string | null;
  methode_classement: string | null;
  methode_classement_libelle: string | null;
  duree_classement: string | null;
  lieu_archivage_id: string | null;
  lieu_archivage: string | null;
  duree_archivage: string | null;
  responsable_destruction_id: string | null;
  est_externe: boolean | null;
  actif: boolean | null;
  date_creation: string | null;
  date_maj: string | null;
  revision_id: number | null;
  titre: string | null;
  motif_modification: string | null;
  numero_revision: number | null;
  date_redaction: string | null;
  date_revue: string | null;
  date_approbation: string | null;
  date_application: string | null;
  date_prochaine_revision: string | null;
  date_fin_application: string | null;
  date_enregistrement: string | null;
  fichier_nom: string | null;
  fichier_original: string | null;
  redacteur_id: string | null;
  revu_par_id: string | null;
  approuve_par_id: string | null;
}

export const fetchWorkflowDocuments = async (): Promise<WorkflowDocument[]> => {
  try {
    const response = await fetch(`${API_BASE}/workflow/documents`);
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    return response.json();
  } catch (error) {
    console.error('Erreur workflow documents:', error);
    return [];
  }
};

export const fetchWorkflowUsers = async (): Promise<UserRef[]> => {
  try {
    const response = await fetch(`${API_BASE}/workflow/users`);
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    return response.json();
  } catch (error) {
    console.error('Erreur users workflow:', error);
    return [];
  }
};

export const transitionWorkflow = async (documentId: string | number, statut: string, motif_modification?: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE}/workflow/transition/${documentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut, motif_modification }),
    });
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    return response.json();
  } catch (error) {
    console.error('Erreur transition workflow:', error);
    throw error;
  }
};

export const downloadDocumentFile = async (filename: string): Promise<void> => {
  window.open(`${API_BASE}/documents/files/${encodeURIComponent(filename)}`, '_blank');
};

export const createDocumentRevision = async (documentId: string | number, motif?: string): Promise<Revision> => {
  const response = await fetch(`${API_BASE}/documents/${documentId}/transition`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ statut: 'BROUILLON', motif_modification: motif || 'Nouvelle révision créée' }),
  });
  if (!response.ok) throw new Error('Erreur lors de la création de révision');
  return response.json() as Promise<Revision>;
};

export const generateChecksum = async (documentId: number): Promise<string | null> => {
  try {
    const response = await fetch(`${API_BASE}/documents/${documentId}/checksum`);
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    return (await response.json()).checksum;
  } catch (error) {
    console.error('Erreur lors de la génération du checksum:', error);
    return null;
  }
};

// ── USERS API ────────────────────────────────
export interface UserRole {
  id: number;
  code: string;
  libelle: string;
  description: string;
}

export interface UserData {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  matricule: string;
  processus_id: number | null;
  processus: string | null;
  fonction_responsable_id: number | null;
  fonction_responsable: string | null;
  actif: boolean;
  derniere_connexion: string | null;
  date_creation: string | null;
  roles: UserRole[];
}

export const fetchUsers = async (): Promise<UserData[]> => {
  try {
    const response = await fetch(`${API_BASE}/users`);
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    return response.json();
  } catch (error) {
    console.error('Erreur fetch users:', error);
    return [];
  }
};

export const fetchUserDetail = async (id: number): Promise<UserData | null> => {
  try {
    const response = await fetch(`${API_BASE}/users/${id}`);
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    return response.json();
  } catch (error) {
    console.error('Erreur fetch user detail:', error);
    return null;
  }
};

export const createUser = async (data: {
  prenom: string;
  nom: string;
  email: string;
  matricule: string;
  mot_de_passe?: string;
  processus_id?: number;
  fonction_responsable_id?: number;
  roles: number[];
}): Promise<UserData | null> => {
  try {
    const response = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Erreur création utilisateur');
    }
    return response.json();
  } catch (error) {
    console.error('Erreur create user:', error);
    return null;
  }
};

export const updateUserRoles = async (userId: number, roles: number[]): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/users/${userId}/roles`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roles }),
    });
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    return true;
  } catch (error) {
    console.error('Erreur update user roles:', error);
    return false;
  }
};

export const toggleUserActive = async (userId: number, actif: boolean): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/users/${userId}/active`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actif }),
    });
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    return true;
  } catch (error) {
    console.error('Erreur toggle user active:', error);
    return false;
  }
};

export const updateUser = async (userId: number, data: Partial<UserData>): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    return true;
  } catch (error) {
    console.error('Erreur update user:', error);
    return false;
  }
};

export const updateUserPassword = async (userId: number, nouveauMotDePasse: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/users/${userId}/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nouveau_mot_de_passe: nouveauMotDePasse }),
    });
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    return true;
  } catch (error) {
    console.error('Erreur update password:', error);
    return false;
  }
};

export const fetchRoles = async (): Promise<{ id: number; code: string; libelle: string; description: string }[]> => {
  try {
    const response = await fetch(`${API_BASE}/users/roles/list`);
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    return response.json();
  } catch (error) {
    console.error('Erreur fetch roles:', error);
    return [];
  }
};

export const fetchProcessusList = async (): Promise<{ id: number; code: string; libelle?: string }[]> => {
  try {
    const response = await fetch(`${API_BASE}/users/processus/list`);
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    return response.json();
  } catch (error) {
    console.error('Erreur fetch processus:', error);
    return [];
  }
};