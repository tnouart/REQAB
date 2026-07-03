import React, { useState } from 'react';
import type { UserRole } from '../services/api';

interface LoginProps {
  onLogin: (user: { email: string; prenom: string; nom: string; roles: UserRole[] }) => void;
}

const DEMO_USERS = [
  { matricule: '0000A', email: 'admin@qualite.com', prenom: 'Karim', nom: 'Bouali', roles: [{ id: 1, code: 'ADMIN', libelle: 'Administrateur', description: '' }] as UserRole[] },
  { matricule: '0001', email: 'qualite@qualite.com', prenom: 'Nadia', nom: 'Amrani', roles: [{ id: 2, code: 'RESPONSABLE_QUALITE', libelle: 'Responsable Qualité', description: '' }] as UserRole[] },
  { matricule: '0002A', email: 'user@qualite.com', prenom: 'Amina', nom: 'Ferhat', roles: [{ id: 3, code: 'REDACTEUR', libelle: 'Rédacteur', description: '' }] as UserRole[] },
  { matricule: '0003', email: 'viewer@qualite.com', prenom: 'Sara', nom: 'Benali', roles: [{ id: 4, code: 'LECTEUR', libelle: 'Lecteur', description: '' }] as UserRole[] },
];

const isValidMatricule = (matricule: string): boolean => {
  const m = matricule.trim().toUpperCase();
  return /^[0-9]{4}[A-Z]$/.test(m) || /^[0-9]{5}$/.test(m);
};

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [matricule, setMatricule] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMatricule = matricule.trim().toUpperCase();
    if (!isValidMatricule(cleanMatricule)) {
      setError('Le matricule doit comporter 5 caractères alphanumériques.');
      return;
    }
    const user = DEMO_USERS.find(u => u.matricule === cleanMatricule);
    if (user) {
      setError(null);
      onLogin(user);
    } else {
      setError('Matricule inconnu. Utilisez un compte démo ci-dessous.');
    }
  };

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-logo">
          <div className="login-logo-icon">📋</div>
          <div>
            <div className="login-logo-text">GED Qualité</div>
            <div className="login-logo-sub">ENSP — ISO 9001:2015</div>
          </div>
        </div>

        <div className="login-title">Connexion</div>
        <div className="login-sub">Utilisez votre matricule (5 caractères alphanumériques).</div>

        {error && <div className="login-error">{error}</div>}

        <div className="field-group">
          <label htmlFor="matricule">Matricule</label>
          <input
            id="matricule"
            type="text"
            value={matricule}
            onChange={(e) => setMatricule(e.target.value.toUpperCase())}
            placeholder="Ex: ADMIN1 ou 00000"
            autoComplete="username"
            required
          />
        </div>

        <div className="field-group">
          <label htmlFor="password">Mot de passe</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}>
          Se connecter
        </button>

        <div className="login-demo">
          <span className="login-demo-label">Comptes démo</span>
          <div className="login-demo-chips">
            {DEMO_USERS.map(u => (
              <button
                type="button"
                key={u.matricule}
                className="login-demo-chip"
                onClick={() => { setMatricule(u.matricule); setPassword('demo'); setError(null); }}
              >
                {u.matricule}
              </button>
            ))}
          </div>
        </div>

        <div className="login-footer">
          Developed by <strong>9310L - NT</strong>
        </div>
      </form>
    </div>
  );
};

export default Login;
