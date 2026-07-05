import React, { useEffect, useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import { fetchDueRevisions, fetchWorkflowDocuments } from '../services/api';

interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  badge?: string;
  danger?: boolean;
}

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  const { user, logout } = useUser();
  const { theme, toggle } = useTheme();
  const [dueCount, setDueCount] = useState(0);
  const [workflowCount, setWorkflowCount] = useState(0);

  const getName = () => {
    if (!user) return 'Utilisateur';
    if (user.prenom && user.nom) return `${user.prenom} ${user.nom}`;
    return user.nom || 'Utilisateur';
  };

  const getRole = () => {
    if (!user) return '';
    if (user.roles && user.roles.length > 0) {
      return user.roles[0].libelle || user.roles[0].code || '';
    }
    return '';
  };

  const getInitials = () => {
    const name = getName();
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  useEffect(() => {
    const loadCounts = async () => {
      try {
        const dueItems = await fetchDueRevisions();
        setDueCount(dueItems.length);
        const workflowItems = await fetchWorkflowDocuments();
        setWorkflowCount(workflowItems.length);
      } catch (err) {
        console.error(err);
      }
    };
    loadCounts();
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: '🏠' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'workflow', label: 'Workflow', icon: '🔄', badge: String(workflowCount) },
  ];

  const superviseItems = [
    { id: 'revisions', label: 'Révisions à planifier', icon: '⏰', badge: String(dueCount), danger: dueCount > 0 },
    { id: 'audit', label: 'Piste d\'audit', icon: '📋' },
    { id: 'rapports', label: 'Rapports', icon: '📊' },
  ];

  const extensionItems = [
    { id: 'non-conformites', label: 'Non-conformités', icon: '⚠️' },
    { id: 'ptw', label: 'Permis de travail', icon: '🔶' },
    { id: 'hira', label: 'Dangers / HIRA', icon: '⚠️' },
    { id: 'aei', label: 'Aspects / Impacts', icon: '🌿' },
    { id: 'incidents', label: 'Incidents / AT', icon: '🚑' },
    { id: 'habilitations', label: 'Habilitations SST', icon: '🎓' },
    { id: 'indicateurs-env', label: 'Indicateurs env.', icon: '📊' },
    { id: 'conformite-legale', label: 'Conformité légale', icon: '⚖️' },
  ];

  const rapportItems = [
    { id: 'rapport', label: 'Rapport Revue', icon: '📑' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
  ];

  const adminItems = [
    { id: 'utilisateurs', label: 'Utilisateurs', icon: '👥' },
    { id: 'referentiels', label: 'Référentiels', icon: '⚙️' },
    { id: 'aide', label: 'Aide', icon: '❓' },
    { id: 'about', label: 'ISO 9001', icon: '📋' },
    { id: 'iso14001', label: 'ISO 14001', icon: '🌱' },
    { id: 'iso45001', label: 'ISO 45001', icon: '🛡️' },
  ];

  const renderNavItem = (item: SidebarItem) => (
    <div
      key={item.id}
      onClick={() => onViewChange(item.id)}
      className={`nav-item ${activeView === item.id ? 'active' : ''}`}
    >
      <span className="nav-icon">{item.icon}</span>
      <span>{item.label}</span>
      {item.badge && <span className={`nav-badge ${item.danger ? 'danger' : ''}`}>{item.badge}</span>}
    </div>
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">
          <div className="logo-icon">📋</div>
          <div>
            <div className="logo-text">GED Qualité · ENSP spa</div>
            <div className="logo-sub">Entreprise Nationale de Services aux Puits</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {navItems.map(renderNavItem)}

        <div className="nav-section-label" style={{ marginTop: '8px' }}>Supervision</div>
        {superviseItems.map(renderNavItem)}

        <div className="nav-section-label" style={{ marginTop: '8px' }}>Extensions</div>
        {extensionItems.map(renderNavItem)}

        <div className="nav-section-label" style={{ marginTop: '8px' }}>Rapport</div>
        {rapportItems.map(renderNavItem)}

        <div className="nav-section-label" style={{ marginTop: '8px' }}>Administration</div>
        {adminItems.map(renderNavItem)}
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          className="theme-toggle"
          onClick={toggle}
          title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
        >
          <span className="tt-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span className="tt-label">{theme === 'dark' ? 'Mode clair' : 'Mode sombre'}</span>
        </button>
        {user ? (
          <div className="user-card" onClick={logout}>
            <div className="user-avatar">{getInitials()}</div>
            <div>
              <div className="user-name">{getName()}</div>
              <div className="user-role">{getRole()}</div>
            </div>
          </div>
        ) : (
          <div className="user-card">
            <div className="user-avatar">?</div>
            <div>
              <div className="user-name">Non connecté</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;