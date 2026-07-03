// src/contexts/FeatureFlagsContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';

export interface FeatureFlag {
  cle: string;
  valeur: boolean;
  description: string;
}

interface FeatureFlagsContextType {
  flags: FeatureFlag[];
  loading: boolean;
  refresh: () => void;
  updateFlag: (cle: string, valeur: boolean) => Promise<void>;
  isEnabled: (cle: string) => boolean;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType>({
  flags: [],
  loading: true,
  refresh: () => {},
  updateFlag: async () => {},
  isEnabled: () => false,
});

export const useFeatureFlags = () => useContext(FeatureFlagsContext);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const FeatureFlagsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFlags = async () => {
    try {
      const res = await fetch(`${API_BASE}/settings`);
      if (res.ok) {
        const data = await res.json();
        const entries = Object.entries(data).map(([cle, info]: [string, any]) => ({
          cle,
          valeur: info.valeur,
          description: info.description,
        }));
        setFlags(entries);
      }
    } catch (err) {
      console.error('Erreur chargement feature flags:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFlags(); }, []);

  const refresh = () => loadFlags();

  const updateFlag = async (cle: string, valeur: boolean): Promise<void> => {
    const res = await fetch(`${API_BASE}/settings/${cle}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valeur }),
    });
    if (res.ok) {
      setFlags((prev) => prev.map((f) => f.cle === cle ? { ...f, valeur } : f));
    }
    return;
  };

  const isEnabled = (cle: string) => flags.some((f) => f.cle === cle && f.valeur);

  return (
    <FeatureFlagsContext.Provider value={{ flags, loading, refresh, updateFlag, isEnabled }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};
