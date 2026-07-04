import React, { useState } from 'react';
import type { UserRole } from '../services/api';
import { login, fetchUsers } from '../services/api';

interface LoginProps {
  onLogin: (user: { id: number; email: string; prenom: string; nom: string; roles: UserRole[] }) => void;
}

const isValidMatricule = (matricule: string): boolean => {
  const m = matricule.trim().toUpperCase();
  return /^[0-9]{4}[A-Z]$/.test(m) || /^[0-9]{5}$/.test(m);
};

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [matricule, setMatricule] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [demoUsers, setDemoUsers] = useState<Array<{ matricule: string; email: string; prenom: string; nom: string }>>([]);

  React.useEffect(() => {
    fetchUsers().then(users => {
      setDemoUsers(users.map(u => ({ matricule: u.matricule, email: u.email, prenom: u.prenom, nom: u.nom })));
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMatricule = matricule.trim().toUpperCase();
    if (!isValidMatricule(cleanMatricule)) {
      setError('Le matricule doit comporter 5 caractères alphanumériques.');
      return;
    }
    const result = await login(cleanMatricule, password);
    if (result) {
      setError(null);
      onLogin({ id: result.user.id, email: result.user.email, prenom: result.user.prenom, nom: result.user.nom, roles: result.user.roles });
    } else {
      setError('Matricule inconnu ou mot de passe incorrect.');
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
            placeholder="Ex: 9310L ou 00000"
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
          <span className="login-demo-label">Comptes disponibles</span>
          <div className="login-demo-chips">
            {demoUsers.map(u => (
              <button
                type="button"
                key={u.matricule}
                className="login-demo-chip"
                onClick={() => { setMatricule(u.matricule); setPassword('demo'); setError(null); }}
                title={`${u.prenom} ${u.nom}`}
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
