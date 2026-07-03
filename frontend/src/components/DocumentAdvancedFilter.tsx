// src/components/DocumentAdvancedFilter.tsx
import React, { useState, useEffect } from 'react';
import {
  fetchTypeDocuments,
  fetchProcessus,
  fetchNiveauxConfidentialite,
  fetchLieux,
  fetchMethodesClassement,
  fetchFonctionsResponsable,
} from '../services/api';
import type { Document } from '../services/api';

interface SelectOption {
  id: number;
  label: string;
}

interface FilterState {
  [key: string]: { active: boolean; value: string };
}

const emptyFilter: FilterState = {
  'type de document': { active: false, value: '' },
  processus: { active: false, value: '' },
  'niveau de confidentialité': { active: false, value: '' },
  statut: { active: false, value: '' },
  'lieu de classement': { active: false, value: '' },
  'méthode de classement': { active: false, value: '' },
  "lieu d'archivage": { active: false, value: '' },
  'responsable de destruction': { active: false, value: '' },
};

interface DocumentAdvancedFilterProps {
  documents: Document[];
  onFilteredChange: (filtered: Document[]) => void;
}

const DocumentAdvancedFilter: React.FC<DocumentAdvancedFilterProps> = ({ documents, onFilteredChange }) => {
  const [expanded, setExpanded] = useState(false);
  const [filters, setFilters] = useState<FilterState>(emptyFilter);

  const [typeDocuments, setTypeDocuments] = useState<SelectOption[]>([]);
  const [processus, setProcessus] = useState<SelectOption[]>([]);
  const [niveaux, setNiveaux] = useState<SelectOption[]>([]);
  const [lieux, setLieux] = useState<SelectOption[]>([]);
  const [methodes, setMethodes] = useState<SelectOption[]>([]);
  const [responsables, setResponsables] = useState<SelectOption[]>([]);

  const optionsFor = (label: string): SelectOption[] => {
    switch (label) {
      case 'type de document':
        return typeDocuments;
      case 'processus':
        return processus;
      case 'niveau de confidentialité':
        return niveaux;
      case 'lieu de classement':
        return lieux;
      case 'méthode de classement':
        return methodes;
      case "lieu d'archivage":
        return lieux;
      case 'responsable de destruction':
        return responsables;
      default:
        return [];
    }
  };

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

  useEffect(() => {
    const filtered = documents.filter((doc) => {
      for (const [field, filter] of Object.entries(filters)) {
        if (!filter.active || !filter.value) continue;
        const docValue = doc[field as keyof Document];
        if (docValue === undefined || docValue === null) return false;
        if (String(docValue) !== String(filter.value)) return false;
      }
      return true;
    });
    onFilteredChange(filtered);
  }, [documents, filters, onFilteredChange]);

  const toggleFilter = (key: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: { ...prev[key], active: !prev[key].active },
    }));
  };

  const updateValue = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: { ...prev[key], value },
    }));
  };

  const activeCount = Object.values(filters).filter((f) => f.active).length;

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div className="card-header" style={{ cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
        <h2>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}>
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          Filtres avancés
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {activeCount > 0 && (
            <span className="badge badge-applicable" style={{ fontSize: '0.75rem' }}>
              {activeCount} filtre{activeCount > 1 ? 's' : ''} actif{activeCount > 1 ? 's' : ''}
            </span>
          )}
          <button
            className="btn btn-ghost btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              setFilters(emptyFilter);
            }}
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
            Effacer
          </button>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {Object.entries(filters).map(([label, filter]) => {
              const options = optionsFor(label);
              let control: React.ReactNode = null;

              if (filter.active) {
                if (label === 'statut') {
                  control = (
                    <select
                      value={filter.value}
                      onChange={(e) => updateValue(label, e.target.value)}
                      className="form-select"
                    >
                      <option value="">Sélectionner...</option>
                      <option value="BROUILLON">Brouillon</option>
                      <option value="EN_REVUE">En revue</option>
                      <option value="APPROUVE">Approuvé</option>
                      <option value="APPLICABLE">Applicable</option>
                      <option value="OBSOLETE">Obsolète</option>
                      <option value="ARCHIVE">Archivé</option>
                    </select>
                  );
                } else {
                  control = (
                    <select
                      value={filter.value}
                      onChange={(e) => updateValue(label, e.target.value)}
                      className="form-select"
                    >
                      <option value="">Sélectionner...</option>
                      {options.map((opt) => (
                        <option key={opt.id} value={opt.label}>{opt.label}</option>
                      ))}
                    </select>
                  );
                }
              }

              return (
                <FilterToggle
                  key={label}
                  label={label}
                  active={filter.active}
                  onToggle={() => toggleFilter(label)}
                  control={control}
                />
              );
            })}
          </div>

          {activeCount > 0 && (
            <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              <strong>Logique :</strong> AND — {activeCount} critère{activeCount > 1 ? 's' : ''} appliqué{activeCount > 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface FilterToggleProps {
  label: string;
  active: boolean;
  onToggle: () => void;
  control: React.ReactNode;
}

const FilterToggle: React.FC<FilterToggleProps> = ({ label, active, onToggle, control }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      padding: '0.75rem',
      borderRadius: 'var(--radius)',
      border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
      background: active ? 'var(--accent-soft)' : 'var(--surface)',
      transition: 'all 150ms',
      opacity: active ? 1 : 0.8,
    }}>
      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        cursor: 'pointer',
        fontWeight: 500,
        fontSize: '0.8125rem',
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
        userSelect: 'none',
      }}>
        <input
          type="checkbox"
          checked={active}
          onChange={onToggle}
          className="checkbox"
        />
        {label}
      </label>
      {control && <div style={{ marginTop: '0.25rem' }}>{control}</div>}
    </div>
  );
};

export default DocumentAdvancedFilter;
