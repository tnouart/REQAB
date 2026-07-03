import React, { useState, useEffect, useMemo } from 'react';
import { fetchUsers, createUser, updateUserRoles, toggleUserActive, updateUser, updateUserPassword, fetchRoles, fetchProcessusList, type UserData as ApiUser, type UserRole } from '../services/api';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';

interface UserData {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  processus_id: number | null;
  processus: string | null;
  fonction_responsable_id: number | null;
  fonction_responsable: string | null;
  actif: boolean;
  derniere_connexion: string | null;
  date_creation: string | null;
  roles: UserRole[];
  color: string;
  docs: number;
  online: boolean;
}

const PERMS_DEF = [
  { cat: 'Documents', perms: [
    { key: 'DOCUMENT_CREER', label: 'Créer un document' },
    { key: 'DOCUMENT_LIRE', label: 'Consulter les documents' },
    { key: 'DOCUMENT_MODIFIER_METADONNEES', label: 'Modifier les métadonnées' },
    { key: 'DOCUMENT_ARCHIVER', label: 'Archiver un document' },
    { key: 'REVISION_LIRE_CONFIDENTIEL', label: 'Accéder aux documents confidentiels' },
  ]},
  { cat: "Workflow d'approbation", perms: [
    { key: 'REVISION_REDIGER', label: 'Rédiger un brouillon' },
    { key: 'REVISION_SOUMETTRE_REVUE', label: 'Soumettre à revue' },
    { key: 'REVISION_REVOIR', label: 'Évaluer et approuver la revue' },
    { key: 'REVISION_APPROUVER', label: 'Rendre un document applicable' },
  ]},
  { cat: 'Administration', perms: [
    { key: 'UTILISATEUR_GERER', label: 'Gérer les utilisateurs' },
    { key: 'ROLE_GERER', label: 'Gérer les rôles et permissions' },
  ]},
];

const ROLES: Record<string, { label: string; cls: string; icon: string; emoji: string; color: string; desc: string }> = {
  ADMIN: { label: 'Administrateur', cls: 'rb-admin', icon: 'ri-admin', emoji: '🔑', color: '#DC2626', desc: 'Accès total — gestion des utilisateurs, référentiels et toutes les actions documentaires.' },
  RESPONSABLE_QUALITE: { label: 'Resp. Qualité', cls: 'rb-rq', icon: 'ri-rq', emoji: '✅', color: '#1D4ED8', desc: 'Peut approuver les révisions, rendre les documents applicables et gérer les référentiels.' },
  REDACTEUR: { label: 'Rédacteur', cls: 'rb-red', icon: 'ri-red', emoji: '✍️', color: '#059669', desc: 'Peut créer des brouillons et soumettre des documents à la revue.' },
  LECTEUR: { label: 'Lecteur', cls: 'rb-lec', icon: 'ri-lec', emoji: '👁', color: '#64748B', desc: 'Accès en lecture seule aux documents applicables non confidentiels.' },
};

const ROLE_PERMS: Record<string, string[]> = {
  ADMIN: ['DOCUMENT_CREER','DOCUMENT_LIRE','DOCUMENT_MODIFIER_METADONNEES','DOCUMENT_ARCHIVER',
          'REVISION_LIRE_CONFIDENTIEL','REVISION_REDIGER','REVISION_SOUMETTRE_REVUE',
          'REVISION_REVOIR','REVISION_APPROUVER','UTILISATEUR_GERER','ROLE_GERER'],
  RESPONSABLE_QUALITE: ['DOCUMENT_CREER','DOCUMENT_LIRE','DOCUMENT_MODIFIER_METADONNEES','DOCUMENT_ARCHIVER',
          'REVISION_LIRE_CONFIDENTIEL','REVISION_REDIGER','REVISION_SOUMETTRE_REVUE',
          'REVISION_REVOIR','REVISION_APPROUVER'],
  REDACTEUR: ['DOCUMENT_CREER','DOCUMENT_LIRE','REVISION_REDIGER','REVISION_SOUMETTRE_REVUE'],
  LECTEUR: ['DOCUMENT_LIRE'],
};

const COLORS = ['#1D4ED8','#059669','#7C3AED','#D97706','#DC2626','#0891B2','#64748B'];

const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};

const isValidMatricule = (matricule: string): boolean => {
  const m = matricule.trim().toUpperCase();
  return /^[0-9]{4}[A-Z]$/.test(m) || /^[0-9]{5}$/.test(m);
};

const Users: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [filterRole, setFilterRole] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [matrixOpen, setMatrixOpen] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editPrenom, setEditPrenom] = useState('');
  const [editNom, setEditNom] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editProcessus, setEditProcessus] = useState('');
  const [editMatricule, setEditMatricule] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editPasswordConfirm, setEditPasswordConfirm] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const { hasPermission } = useUser();
  const { showToast } = useToast();

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      const data = await fetchUsers();
      const mapped: UserData[] = data.map((u: ApiUser) => ({
        ...u,
        id: typeof u.id === 'string' ? parseInt(u.id) : u.id,
        roles: u.roles || [],
        color: stringToColor(u.email || u.nom),
        docs: 0,
        online: false,
      }));
      setUsers(mapped);
      if (mapped.length > 0 && !selectedUser) {
        setSelectedUser(mapped[0]);
      }
      setLoading(false);
    };
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = searchQ.toLowerCase();
      const matchQ = !q || u.nom.toLowerCase().includes(q) || u.prenom.toLowerCase().includes(q)
                     || u.email.toLowerCase().includes(q) || (u.processus || '').toLowerCase().includes(q);
      const matchR = !filterRole || u.roles.some(r => r.code === filterRole);
      return matchQ && matchR;
    });
  }, [users, searchQ, filterRole]);

  const userPerms = (u: UserData) => {
    const set = new Set<string>();
    u.roles.forEach(r => (ROLE_PERMS[r.code] || []).forEach(p => set.add(p)));
    return set;
  };

  const mainRole = (u: UserData) => ROLES[u.roles[0]?.code] || ROLES.LECTEUR;

  const initials = (u: UserData) => (u.prenom[0] + u.nom[0]).toUpperCase();

  const handleToggleRole = async (uid: number, roleCode: string) => {
    const u = users.find(x => x.id === uid);
    if (!u) return;
    const hasRole = u.roles.some(r => r.code === roleCode);
    const newRoles = hasRole
      ? u.roles.filter(r => r.code !== roleCode)
      : [...u.roles, { id: 0, code: roleCode, libelle: ROLES[roleCode]?.label || roleCode, description: '' }];
    
    const roleIds = newRoles.map(r => {
      const role = ROLES[r.code];
      return Object.keys(ROLES).findIndex(k => k === r.code) + 1;
    }).filter(Boolean);

    const success = await updateUserRoles(uid, roleIds);
    if (success) {
      setUsers(users.map(x => x.id === uid ? { ...x, roles: newRoles } : x));
      if (selectedUser?.id === uid) {
        setSelectedUser({ ...u, roles: newRoles });
      }
    }
  };

  const handleToggleActive = async (uid: number) => {
    const u = users.find(x => x.id === uid);
    if (!u) return;
    const newActive = !u.actif;
    const success = await toggleUserActive(uid, newActive);
    if (success) {
      const updated = users.map(x => x.id === uid ? { ...x, actif: newActive } : x);
      setUsers(updated);
      if (selectedUser?.id === uid) {
        setSelectedUser({ ...u, actif: newActive });
      }
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    if (!isValidMatricule(editMatricule)) {
      setEditError('Le matricule doit comporter 5 caractères alphanumériques (ex: 0000A ou 00000).');
      return;
    }
    if (editPassword && editPassword.length < 6) {
      setEditError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (editPassword !== editPasswordConfirm) {
      setEditError('Les mots de passe ne correspondent pas.');
      return;
    }
    setEditError(null);
    const success = await updateUser(selectedUser.id, {
      prenom: editPrenom,
      nom: editNom,
      email: editEmail,
      matricule: editMatricule,
      processus: editProcessus || selectedUser.processus
    });
    if (success) {
      // Si un nouveau mot de passe est fourni, le mettre à jour séparément
      if (editPassword) {
        const pwSuccess = await updateUserPassword(selectedUser.id, editPassword);
        if (!pwSuccess) {
          setEditError('Erreur lors de la mise à jour du mot de passe.');
          return;
        }
      }
      const updated = users.map(x => x.id === selectedUser.id ? { ...x, prenom: editPrenom, nom: editNom, email: editEmail, matricule: editMatricule, processus: editProcessus || selectedUser.processus } : x);
      setUsers(updated);
      setSelectedUser({ ...selectedUser, prenom: editPrenom, nom: editNom, email: editEmail, matricule: editMatricule, processus: editProcessus || selectedUser.processus });
      setEditPassword('');
      setEditPasswordConfirm('');
      setShowEditModal(false);
      showToast('success', 'Utilisateur modifié ✓');
    }
  };

  const openEditModal = (u: UserData) => {
    setEditPrenom(u.prenom);
    setEditNom(u.nom);
    setEditEmail(u.email);
    setEditProcessus(u.processus || '');
    setEditMatricule(u.matricule || '');
    setShowEditModal(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const prenom = (form.querySelector('#m-prenom') as HTMLInputElement).value.trim();
    const nom = (form.querySelector('#m-nom') as HTMLInputElement).value.trim();
    const email = (form.querySelector('#m-email') as HTMLInputElement).value.trim();
    const matricule = (form.querySelector('#m-matricule') as HTMLInputElement).value.trim();
    const mot_de_passe = (form.querySelector('#m-password') as HTMLInputElement).value;
    const proc = (form.querySelector('#m-proc') as HTMLSelectElement).value;
    const role = (form.querySelector('#m-role') as HTMLSelectElement).value;
    
    if (!prenom || !nom || !email || !matricule || !role) {
      setCreateError('Tous les champs obligatoires doivent être remplis.');
      return;
    }
    
    if (!isValidMatricule(matricule)) {
      setCreateError('Le matricule doit comporter 5 caractères alphanumériques (ex: 0000A ou 00000).');
      return;
    }

    setCreateError(null);
    
    const processus = await fetchProcessusList();
    const procId = processus.find(p => p.code === proc)?.id;
    const roleId = Object.keys(ROLES).findIndex(k => k === role) + 1;

    const newUser = await createUser({
      prenom,
      nom,
      email,
      matricule,
      mot_de_passe: mot_de_passe || undefined,
      processus_id: procId || undefined,
      roles: roleId ? [roleId] : [],
    });

    if (newUser) {
      const mapped: UserData = {
        ...newUser,
        id: typeof newUser.id === 'string' ? parseInt(newUser.id) : newUser.id,
        roles: newUser.roles || [],
        color: stringToColor(newUser.email || newUser.nom),
        docs: 0,
        online: false,
      };
      setUsers([...users, mapped]);
      setSelectedUser(mapped);
      setShowModal(false);
      form.reset();
    }
  };

  const allPerms = PERMS_DEF.flatMap(c => c.perms);

  return (
    <div className="detail-pane">
      {/* Page bar */}
      <div className="page-bar">
        <div className="page-title">👥 Utilisateurs <span className="page-sub">{users.length} comptes · {users.filter(u => !u.actif).length} inactifs</span></div>
        <div className="search-box">
          <span style={{ color: 'var(--light)', fontSize: 13 }}>🔍</span>
          <input type="text" placeholder="Nom, email, processus…" value={searchQ} onChange={e => setSearchQ(e.target.value)} />
        </div>
<button className="btn btn-g btn-sm" disabled={!hasPermission('admin')}>⬇ Exporter</button>
         <button className="btn btn-p btn-sm" onClick={() => setShowModal(true)} disabled={!hasPermission('admin')}>+ Nouvel utilisateur</button>
      </div>

      <div className="content-split">
        {/* USER LIST */}
        <div className="user-list-pane">
          <div className="list-header">
            <div className={`filter-chip ${filterRole === '' ? 'active' : ''}`} onClick={() => setFilterRole('')}>Tous</div>
            <div className={`filter-chip ${filterRole === 'ADMIN' ? 'active' : ''}`} onClick={() => setFilterRole('ADMIN')}>Admin</div>
            <div className={`filter-chip ${filterRole === 'RESPONSABLE_QUALITE' ? 'active' : ''}`} onClick={() => setFilterRole('RESPONSABLE_QUALITE')}>Resp. Q.</div>
            <div className={`filter-chip ${filterRole === 'REDACTEUR' ? 'active' : ''}`} onClick={() => setFilterRole('REDACTEUR')}>Rédacteurs</div>
            <div className={`filter-chip ${filterRole === 'LECTEUR' ? 'active' : ''}`} onClick={() => setFilterRole('LECTEUR')}>Lecteurs</div>
            <div className="list-count">{filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''}</div>
          </div>
          <div className="user-list">
            {filteredUsers.map(u => {
              const r = mainRole(u);
              return (
                <div key={u.id}
                     className={`user-row ${!u.actif ? 'inactive' : ''} ${selectedUser?.id === u.id ? 'selected' : ''}`}
                     onClick={() => setSelectedUser(u)}>
                  <div className={`user-av ${u.online ? 'av-online' : 'av-offline'}`} style={{ background: u.color }}>
                    {initials(u)}
                  </div>
                  <div className="user-info">
                    <div className="user-name">{u.prenom} {u.nom}</div>
                    <div className="user-email">{u.email}</div>
                    <div className="user-matricule">Mat: {u.matricule}</div>
                    <div className="user-meta">
                      {u.roles.map((rid) => (
                        <span key={rid.id} className={`role-badge ${ROLES[rid.code]?.cls || 'rb-lec'}`}>
                          {ROLES[rid.code]?.emoji} {ROLES[rid.code]?.label || rid.code}
                        </span>
                      ))}
                      <span className="proc-tag">{u.processus}</span>
                    </div>
                  </div>
                  <div className="user-last">
                    <div style={{ fontSize: 10, color: 'var(--light)' }}>{u.actif ? (u.derniere_connexion || 'récemment') : 'Inactif'}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2, textAlign: 'right' }}>{u.docs} docs</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* DETAIL + MATRIX */}
        <div className="detail-pane">
          {selectedUser && (() => {
            const u = selectedUser;
            const r = mainRole(u);
            const perms = userPerms(u);

            return (
              <>
                {/* Profil header */}
                <div className="profile-header">
                  <div className="profile-av-lg" style={{ background: u.color }}>{initials(u)}</div>
                  <div className="profile-info">
                    <div className="profile-name">{u.prenom} {u.nom}</div>
                    <div className="profile-email">{u.email}</div>
                    <div className="profile-tags">
                      {u.roles.map(rid => (
                        <span key={rid.code} className={`role-badge ${ROLES[rid.code]?.cls}`} style={{ fontSize: 11, padding: '2px 8px' }}>
                          {ROLES[rid.code]?.emoji} {ROLES[rid.code]?.label}
                        </span>
                      ))}
                      <span className="role-badge rb-lec" style={{ fontSize: 11, padding: '2px 8px' }}>📁 {u.processus}</span>
                      <span className="role-badge" style={{ fontSize: 11, padding: '2px 8px', background: u.actif ? 'var(--accent-l)' : 'var(--red-l)', color: u.actif ? 'var(--accent-d)' : 'var(--red-d)' }}>
                        {u.actif ? '● Actif' : '● Inactif'}
                      </span>
                    </div>
                  </div>
<div className="profile-actions">
                     <button className="btn btn-g btn-sm" onClick={() => openEditModal(u)} disabled={!hasPermission('admin')}>✏️ Modifier</button>
                     <button className={`btn ${u.actif ? 'btn-d' : 'btn-g'} btn-sm`} onClick={() => handleToggleActive(u.id)} disabled={!hasPermission('admin')}>
                       {u.actif ? '⏸ Désactiver' : '▶ Réactiver'}
                     </button>
                   </div>
                </div>

                {/* Detail body */}
                <div className="detail-body">
                  {/* Rôles attribués */}
                  <div className="dc">
                    <div className="dc-head">
                      <div className="dc-icon dci-p">🎭</div>
                      <div><div className="dc-title">Rôles attribués</div><div className="dc-sub">Modifiez les droits en activant/désactivant les rôles</div></div>
                    </div>
                    {Object.entries(ROLES).map(([rid, r]) => (
                      <div key={rid} className="role-row">
                        <div className={`role-icon ${r.icon}`}>{r.emoji}</div>
                        <div className="role-info">
                          <div className="role-name">{r.label}</div>
                          <div className="role-desc">{r.desc.slice(0, 60)}…</div>
                        </div>
<div className="role-toggle">
                           <button className={`toggle ${u.roles.some(r => r.code === rid) ? 'on' : 'off'}`} onClick={() => handleToggleRole(u.id, rid)} disabled={!hasPermission('admin')}>
                             <div className="toggle-knob" />
                           </button>
                         </div>
                      </div>
                    ))}
                  </div>

                  {/* Permissions effectives */}
                  <div className="dc">
                    <div className="dc-head">
                      <div className="dc-icon dci-g">🔐</div>
                      <div><div className="dc-title">Permissions effectives</div><div className="dc-sub">{perms.size} permission{perms.size > 1 ? 's' : ''} active{perms.size > 1 ? 's' : ''} · issues des rôles attribués</div></div>
                    </div>
                    <div className="perm-grid-wrap">
                      {PERMS_DEF.map(cat => (
                        <div key={cat.cat} className="perm-category">
                          <div className="perm-cat-title">{cat.cat}</div>
                          <div className="perm-rows">
                            {cat.perms.map(p => {
                              const has = perms.has(p.key);
                              const sources = u.roles.filter(r => (ROLE_PERMS[r.code] || []).includes(p.key)).map(r => ROLES[r.code]?.label);
                              return (
                                <div key={p.key} className="perm-row">
                                  <div className={`perm-dot ${has ? 'pd-on' : 'pd-off'}`} />
                                  <div className="perm-name" style={{ color: has ? undefined : 'var(--light)' }}>{p.label}</div>
                                  <div className="perm-source">{sources.length ? 'via ' + sources.join(', ') : ''}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Infos compte */}
                  <div className="dc">
                    <div className="dc-head">
                      <div className="dc-icon dci-b">ℹ️</div>
                      <div><div className="dc-title">Informations du compte</div></div>
                    </div>
                    <div className="info-r"><span className="ir-k">Processus</span><span className="ir-v">{u.processus}</span></div>
                    <div className="info-r"><span className="ir-k">Documents gérés</span><span className="ir-v">{u.docs} documents</span></div>
                    <div className="info-r"><span className="ir-k">Dernière connexion</span><span className="ir-v">{u.derniere_connexion || 'Jamais'}</span></div>
                    <div className="info-r"><span className="ir-k">Statut</span><span className="ir-v" style={{ color: u.actif ? 'var(--accent-d)' : 'var(--red)' }}>{u.actif ? 'Actif' : 'Inactif'}</span></div>
                    <div className="info-r"><span className="ir-k">Email</span><span className="ir-v">{u.email}</span></div>
                  </div>

                  {/* Activité récente */}
                  <div className="dc">
                    <div className="dc-head">
                      <div className="dc-icon dci-a">⚡</div>
                      <div><div className="dc-title">Activité récente</div></div>
                    </div>
                    {[
                      { text: `A rendu applicable <strong>MOD.ENSP.GEN.007</strong>`, time: 'il y a 2h' },
                      { text: `A approuvé la revue de <strong>MOD.ENSP.GEN.007</strong>`, time: 'hier 16h20' },
                      { text: `A retourné en brouillon <strong>INS.QHSE.ENV.006</strong>`, time: 'il y a 3j' },
                      { text: `A rendu applicable <strong>INS.QHSE.HSE.001</strong>`, time: 'il y a 5j' },
                    ].slice(0, u.actif ? 4 : 2).map((a, i) => (
                      <div key={i} className="act-mini">
                        <div className="am-dot" />
                        <div className="am-content">
                          <div className="am-text" dangerouslySetInnerHTML={{ __html: a.text }} />
                          <div className="am-time">{a.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* MATRICE GLOBALE */}
                <div className="matrix-section">
                  <div className="matrix-head">
                    <div>
                      <div className="matrix-title">🔐 Matrice des permissions — vue globale</div>
                      <div className="matrix-sub">Toutes les permissions de tous les utilisateurs en un coup d'œil</div>
                    </div>
                    <div className="matrix-toggle-btn" onClick={() => setMatrixOpen(!matrixOpen)}>
                      {matrixOpen ? '▲ Réduire' : '▼ Matrice des permissions'}
                    </div>
                  </div>
                  {matrixOpen && (
                    <div className="matrix-body">
                      <table className="matrix">
                        <thead>
                          <tr>
                            <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 10, fontWeight: 800, color: 'var(--muted)' }}>Utilisateur</th>
                            {allPerms.map(p => (
                              <th key={p.key}><div className="col-header-lbl" title={p.label}>{p.label}</div></th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {users.filter(u => u.actif).map(u => {
                            const perms = userPerms(u);
                            const r = mainRole(u);
                            return (
                              <tr key={u.id}>
                                <td>
                                  <div className="matrix-user">
                                    <div className="av-xs" style={{ background: u.color }}>{initials(u)}</div>
                                    <div>
                                      <div style={{ fontSize: 11.5, fontWeight: 700 }}>{u.prenom} {u.nom}</div>
                                      <div style={{ fontSize: 9.5, color: 'var(--light)' }}>{r.emoji} {r.label}</div>
                                    </div>
                                  </div>
                                </td>
                                {allPerms.map(p => {
                                  const has = perms.has(p.key);
                                  return (
                                    <td key={p.key} title={has ? '✅ ' + p.label : '✗ ' + p.label}>
                                      <div className={has ? 'm-perm-on' : 'm-perm-off'}>{has ? '✓' : '·'}</div>
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* MODAL NOUVEL UTILISATEUR */}
      {showModal && (
        <div className="modal-overlay open" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Créer un nouvel utilisateur</div>
            <div className="modal-sub">L'utilisateur recevra un email d'activation pour définir son mot de passe.</div>
            {createError && <div className="login-error" style={{ marginBottom: 12 }}>{createError}</div>}
            <form onSubmit={handleCreateUser}>
              <div className="form-row">
                <div className="form-field"><label>Prénom <span style={{ color: 'var(--red)' }}>•</span></label><input type="text" id="m-prenom" placeholder="Amina" required /></div>
                <div className="form-field"><label>Nom <span style={{ color: 'var(--red)' }}>•</span></label><input type="text" id="m-nom" placeholder="Ferhat" required /></div>
              </div>
              <div className="form-field"><label>Matricule <span style={{ color: 'var(--red)' }}>•</span></label><input type="text" id="m-matricule" placeholder="ex: 00000" required /></div>
              <div className="form-field"><label>Email professionnel <span style={{ color: 'var(--red)' }}>•</span></label><input type="email" id="m-email" placeholder="a.ferhat@ensp.dz" required /></div>
              <div className="form-field"><label>Mot de passe (optionnel)</label>
                <div style={{ position: 'relative' }}>
                  <input type={showCreatePassword ? 'text' : 'password'} id="m-password" placeholder="Laisser vide pour mot de passe par défaut" style={{ width: '100%', paddingRight: 36 }} />
                  <span onClick={() => setShowCreatePassword(!showCreatePassword)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: 14, color: 'var(--text-muted)' }}>
                    {showCreatePassword ? '👁️' : '👁️'}
                  </span>
                </div>
              </div>
              <div className="form-row">
                <div className="form-field"><label>Processus / Direction</label>
                  <select id="m-proc">
                    <option value="">— Sélectionner —</option>
                    <option>DQHSE</option><option>DAL</option><option>DRH</option>
                    <option>DMI</option><option>DPE</option><option>DG</option>
                  </select>
                </div>
                <div className="form-field"><label>Rôle initial <span style={{ color: 'var(--red)' }}>•</span></label>
                  <select id="m-role" required>
                    <option value="">— Sélectionner —</option>
                    <option value="LECTEUR">Lecteur</option>
                    <option value="REDACTEUR">Rédacteur</option>
                    <option value="RESPONSABLE_QUALITE">Responsable Qualité</option>
                    <option value="ADMIN">Administrateur</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-g" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-p">Créer le compte et envoyer l'invitation →</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT UTILISATEUR */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay open" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Modifier l'utilisateur</div>
            <div className="modal-sub">Mettre à jour les informations du compte.</div>
            {editError && <div className="login-error" style={{ marginBottom: 12 }}>{editError}</div>}
            <div className="form-fields">
              <div className="form-row">
                <div className="form-field"><label>Prénom</label><input type="text" value={editPrenom} onChange={e => setEditPrenom(e.target.value)} /></div>
                <div className="form-field"><label>Nom</label><input type="text" value={editNom} onChange={e => setEditNom(e.target.value)} /></div>
              </div>
              <div className="form-field"><label>Email</label><input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} /></div>
              <div className="form-field"><label>Matricule</label><input type="text" value={editMatricule} onChange={e => setEditMatricule(e.target.value)} placeholder="ex: 00000" /></div>
              <div className="form-field"><label>Nouveau mot de passe</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} value={editPassword} onChange={e => setEditPassword(e.target.value)} placeholder="Laisser vide pour ne pas changer" style={{ width: '100%', paddingRight: 36 }} />
                  <span onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: 14, color: 'var(--text-muted)' }}>
                    {showPassword ? '👁️' : '👁️'}
                  </span>
                </div>
              </div>
              <div className="form-field"><label>Confirmer le mot de passe</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} value={editPasswordConfirm} onChange={e => setEditPasswordConfirm(e.target.value)} placeholder="Confirmer le nouveau mot de passe" style={{ width: '100%', paddingRight: 36 }} />
                  <span onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: 14, color: 'var(--text-muted)' }}>
                    {showPassword ? '👁️' : '👁️'}
                  </span>
                </div>
              </div>
              <div className="form-row">
                <div className="form-field"><label>Processus / Direction</label>
                  <select value={editProcessus} onChange={e => setEditProcessus(e.target.value)}>
                    <option value="">— Sélectionner —</option>
                    <option value="DQHSE">DQHSE</option>
                    <option value="DAL">DAL</option>
                    <option value="DRH">DRH</option>
                    <option value="DMI">DMI</option>
                    <option value="DPE">DPE</option>
                    <option value="DG">DG</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-g" onClick={() => setShowEditModal(false)}>Annuler</button>
              <button className="btn btn-p" onClick={handleEditUser}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
