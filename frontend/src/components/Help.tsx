import React from 'react';

const Help: React.FC = () => {
  return (
    <div style={{ fontFamily: 'var(--font-ui)', background: 'var(--white)', minHeight: '100vh' }}>
      {/* TOPBAR */}
      <div className="topbar">
        <a className="logo" href="#">
          <div className="logo-ic">❓</div>
          <div className="logo-tx">GED Qualité · ENSP</div>
        </a>
        <span className="topbar-sep">/</span>
        <span className="topbar-page"><strong>Support de Formation</strong></span>
      </div>

      {/* HERO */}
      <div className="hero">
        <div className="hero-watermark">AIDE</div>
        <div className="hero-inner">
          <div className="hero-eyebrow">
            <span>📚</span> Guide utilisateur complet · Version 1.0
          </div>
          <h1 className="hero-title">
            Support de Formation<br />
            <em>GED Qualité ISO 9001:2015</em>
          </h1>
          <p className="hero-desc">
            Ce guide décrit l'usage complet de l'application GED Qualité : authentification, gestion des utilisateurs, 
            workflow documentaire, interfaces, raccourcis clavier, et dépannage.
          </p>
          <div className="hero-metrics">
            <div className="hero-metric">
              <div className="hm-val green">9</div>
              <div className="hm-lbl">Sections<br /><strong>documentées</strong></div>
            </div>
            <div className="hero-metric">
              <div className="hm-val green">4</div>
              <div className="hm-lbl">Rôles<br /><strong>utilisateurs</strong></div>
            </div>
            <div className="hero-metric">
              <div className="hm-val green">4</div>
              <div className="hm-lbl">Étapes<br /><strong>workflow</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* NAVIGATION ANCRES */}
      <nav className="anchor-nav">
        <a className="anchor-link active" href="#vue"><span className="al-dot" style={{ background: '#00A878' }}></span>Vue d'ensemble</a>
        <a className="anchor-link" href="#auth"><span className="al-dot" style={{ background: '#D97706' }}></span>Authentification</a>
        <a className="anchor-link" href="#users"><span className="al-dot" style={{ background: '#DC2626' }}></span>Utilisateurs (ADMIN)</a>
        <a className="anchor-link" href="#docs"><span className="al-dot" style={{ background: '#2563EB' }}></span>Documents</a>
        <a className="anchor-link" href="#interfaces"><span className="al-dot" style={{ background: '#7C3AED' }}></span>Interfaces</a>
        <a className="anchor-link" href="#admin"><span className="al-dot" style={{ background: '#00A878' }}></span>Administration</a>
        <a className="anchor-link" href="#raccourcis"><span className="al-dot" style={{ background: '#F59E0B' }}></span>Raccourcis</a>
        <a className="anchor-link" href="#depannage"><span className="al-dot" style={{ background: '#DC2626' }}></span>Dépannage</a>
        <a className="anchor-link" href="#glossaire"><span className="al-dot" style={{ background: '#64748B' }}></span>Glossaire</a>
      </nav>

      {/* PAGE BODY */}
      <div className="page-body">
        {/* SECTION 1 - VUE D'ENSEMBLE */}
        <section className="conformite-section reveal" data-section-id="vue" id="vue">
          <div className="theme-header">
            <div className="theme-num">1</div>
            <div className="theme-title-block">
              <div className="theme-eyebrow">Vue d'ensemble de l'application</div>
              <h2 className="theme-title">Présentation générale</h2>
              <p className="theme-subtitle">GED Qualité est une application web de gestion électronique de documents conçue pour répondre aux exigences de la norme ISO 9001:2015.</p>
            </div>
          </div>
          
          <div className="impl-block">
            <div className="impl-header">
              <div className="impl-icon ii-green">📋</div>
              <div className="impl-header-title">Accès à l'application</div>
            </div>
            <div className="impl-body">
              <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Frontend : <em>http://localhost:5173</em></div></div>
              <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Backend : <em>http://localhost:5000</em></div></div>
              <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Gestion centralisée avec suivi des révisions et auditabilité complète</div></div>
            </div>
          </div>
        </section>

        {/* SECTION 2 - AUTHENTIFICATION */}
        <section className="conformite-section reveal" data-section-id="auth" id="auth">
          <div className="theme-header">
            <div className="theme-num">2</div>
            <div className="theme-title-block">
              <div className="theme-eyebrow">Connexion et gestion des comptes</div>
              <h2 className="theme-title">Authentification</h2>
              <p className="theme-subtitle">Décrit les identifiants, les comptes de démonstration et le processus de connexion.</p>
            </div>
          </div>
          
          <div className="compare-grid">
            <div className="norm-col">
              <div className="norm-block">
                <div className="norm-article">Identifiants</div>
                <div className="norm-block-title">Matricule et mot de passe</div>
                <div className="norm-quote">
                  <strong>Matricule</strong> : Identifiant unique de 5 caractères alphanumériques.<br />
                  Format : <em>0000A</em> (4 chiffres + 1 lettre) ou <em>00000</em> (5 chiffres).<br /><br />
                  <strong>Mot de passe</strong> : 6 caractères minimum requis.
                </div>
              </div>
              <div className="norm-block">
                <div className="norm-article">Processus de connexion</div>
                <div className="norm-block-title">Étapes de connexion</div>
                <div className="norm-quote">
                  1. Saisir le matricule<br />
                  2. Saisir le mot de passe<br />
                  3. Cliquer « Se connecter »<br /><br />
                  En cas d'erreur : vérifier l'orthographe ou contacter l'administrateur.
                </div>
              </div>
            </div>
            <div className="impl-col">
              <div className="impl-block">
                <div className="impl-header">
                  <div className="impl-icon ii-amber">👤</div>
                  <div className="impl-header-title">Comptes de démonstration</div>
                </div>
                <div className="impl-body">
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--bdr)' }}>
                        <th style={{ textAlign: 'left', padding: '8px 6px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)' }}>Matricule</th>
                        <th style={{ textAlign: 'left', padding: '8px 6px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)' }}>Rôle</th>
                        <th style={{ textAlign: 'left', padding: '8px 6px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)' }}>Nom</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid var(--surf2)' }}>
                        <td style={{ padding: '6px 4px', fontFamily: 'var(--font-code)' }}>0000A</td>
                        <td style={{ padding: '6px 4px' }}><span className="st-badge st-applicable">ADMIN</span></td>
                        <td style={{ padding: '6px 4px' }}>Karim Bouali</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--surf2)' }}>
                        <td style={{ padding: '6px 4px', fontFamily: 'var(--font-code)' }}>0001</td>
                        <td style={{ padding: '6px 4px' }}><span className="st-badge st-approuve">RESP. QUALITE</span></td>
                        <td style={{ padding: '6px 4px' }}>Nadia Amrani</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--surf2)' }}>
                        <td style={{ padding: '6px 4px', fontFamily: 'var(--font-code)' }}>0002A</td>
                        <td style={{ padding: '6px 4px' }}><span className="st-badge st-en-revue">REDACTEUR</span></td>
                        <td style={{ padding: '6px 4px' }}>Amina Ferhat</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 4px', fontFamily: 'var(--font-code)' }}>0003</td>
                        <td style={{ padding: '6px 4px' }}><span className="st-badge st-brouillon">LECTEUR</span></td>
                        <td style={{ padding: '6px 4px' }}>Sara Benali</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3 - UTILISATEURS */}
        <section className="conformite-section reveal" data-section-id="users" id="users">
          <div className="theme-header">
            <div className="theme-num">3</div>
            <div className="theme-title-block">
              <div className="theme-eyebrow">Module réservé ADMIN</div>
              <h2 className="theme-title">Gestion des Utilisateurs</h2>
              <p className="theme-subtitle">Création, modification, activation/désactivation et attribution des rôles.</p>
            </div>
          </div>
          
          <div className="compare-grid">
            <div className="norm-col">
              <div className="norm-block">
                <div className="norm-article">Créer un utilisateur</div>
                <div className="norm-block-title">Processus de création</div>
                <div className="norm-quote">
                  Menu « Utilisateurs » → Bouton « + Nouvel utilisateur »<br />
                  Champs requis : Prénom, Nom, Email, Matricule, Rôle<br />
                  Processus : DQHSE, DAL, DRH, DMI, DPE, DG
                </div>
              </div>
              <div className="norm-block">
                <div className="norm-article">Modifier un utilisateur</div>
                <div className="norm-block-title">Mise à jour des informations</div>
                <div className="norm-quote">
                  Sélectionner l'utilisateur → Bouton « ✏️ Modifier »<br />
                  Champs modifiables avec visibilité par l'œil 👁️<br />
                  Mot de passe : 6 caractères min + confirmation
                </div>
              </div>
            </div>
            <div className="impl-col">
              <div className="impl-block">
                <div className="impl-header">
                  <div className="impl-icon ii-red">🔑</div>
                  <div className="impl-header-title">Activer/Désactiver</div>
                </div>
                <div className="impl-body">
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Bouton : ⏸ Désactiver / ▶ Réactiver</div></div>
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Effet : l'utilisateur ne peut plus se connecter</div></div>
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Visuel : les inactifs sont grisés dans la liste</div></div>
                </div>
              </div>
              <div className="impl-block">
                <div className="impl-header">
                  <div className="impl-icon ii-blue">🎭</div>
                  <div className="impl-header-title">Rôles disponibles</div>
                </div>
                <div className="impl-body">
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">ADMIN : 🔑 Administrateur - toutes les permissions</div></div>
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">RESPONSABLE_QUALITE : ✅ Approbation et référentiels</div></div>
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">REDACTEUR : ✍️ Création et modification</div></div>
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">LECTEUR : 👁 Consultation uniquement</div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4 - DOCUMENTS */}
        <section className="conformite-section reveal" data-section-id="docs" id="docs">
          <div className="theme-header">
            <div className="theme-num">4</div>
            <div className="theme-title-block">
              <div className="theme-eyebrow">Création et workflow</div>
              <h2 className="theme-title">Gestion des Documents</h2>
              <p className="theme-subtitle">Création, workflow d'approbation, modification et signature électronique.</p>
            </div>
          </div>
          
          <div className="compare-grid">
            <div className="norm-col">
              <div className="norm-block">
                <div className="norm-article">Workflow documentaire</div>
                <div className="norm-block-title">Statuts et transitions</div>
                <div className="norm-quote">
                  <strong>Brouillon (Rév. 0)</strong> : En cours de rédaction<br />
                  <strong>En revue</strong> : En attente d'évaluation<br />
                  <strong>Approuvé</strong> : Révision validée<br />
                  <strong>Applicable</strong> : Document en vigueur
                </div>
              </div>
              <div className="norm-block">
                <div className="norm-article">Créer un document</div>
                <div className="norm-block-title">Étapes détaillées</div>
                <div className="norm-quote">
                  Étape 1 : Identification (Titre, Processus, Confidentialité)<br />
                  Étape 2 : Conservation (Classement, Archivage)<br />
                  Étape 3 : Révision initiale (Fichier, Motif, Responsables)
                </div>
              </div>
            </div>
            <div className="impl-col">
              <div className="impl-block">
                <div className="impl-header">
                  <div className="impl-icon ii-green">🔄</div>
                  <div className="impl-header-title">Actions par statut</div>
                </div>
                <div className="impl-body">
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Brouillon : 📤 Soumettre · ✏️ Modifier</div></div>
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">En revue : ✅ Approuver · ↩ Retourner · 💬 Demander infos</div></div>
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Approuvé : 📢 Rendre applicable · ↩ Retourner</div></div>
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Applicable : 🔄 Nouvelle révision · 📦 Archiver</div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5 - INTERFACES */}
        <section className="conformite-section reveal" data-section-id="interfaces" id="interfaces">
          <div className="theme-header">
            <div className="theme-num">5</div>
            <div className="theme-title-block">
              <div className="theme-eyebrow">Tableau de bord et listes</div>
              <h2 className="theme-title">Interfaces détaillées</h2>
              <p className="theme-subtitle">Description des principaux écrans de l'application.</p>
            </div>
          </div>
          
          <div className="compare-grid">
            <div className="norm-col">
              <div className="norm-block">
                <div className="norm-article">Tableau de bord</div>
                <div className="norm-block-title">Widgets disponibles</div>
                <div className="norm-quote">
                  Camembert : répartition Documents par statut<br />
                  Révisions à venir : liste planifiée<br />
                  Documents urgents : révisions en retard (&gt;30 jours)<br />
                  Documents récents : créations/soumissions
                </div>
              </div>
            </div>
            <div className="impl-col">
              <div className="impl-block">
                <div className="impl-header">
                  <div className="impl-icon ii-purple">📋</div>
                  <div className="impl-header-title">Filtres et colonnes</div>
                </div>
                <div className="impl-body">
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Filtres : Recherche, Processus, Statut, Assigné à</div></div>
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Colonnes : Codification, Titre, Processus, Statut (badge), Confidentialité, Responsables, Date révision</div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6 - ADMINISTRATION */}
        <section className="conformite-section reveal" data-section-id="admin" id="admin">
          <div className="theme-header">
            <div className="theme-num">6</div>
            <div className="theme-title-block">
              <div className="theme-eyebrow">Réglages système</div>
              <h2 className="theme-title">Administration</h2>
              <p className="theme-subtitle">Référentiels et paramètres configurables par l'administrateur.</p>
            </div>
          </div>
          
          <div className="compare-grid">
            <div className="norm-col">
              <div className="norm-block">
                <div className="norm-article">Référentiels</div>
                <div className="norm-block-title">Types et processus</div>
                <div className="norm-quote">
                  Types de documents : Procédure, Mode opératoire, Instruction,<br />
                  Enregistrement, Tableau, Manuel<br /><br />
                  Processus : DQHSE, DAL, DRH, DMI, DPE, DG
                </div>
              </div>
            </div>
            <div className="impl-col">
              <div className="impl-block">
                <div className="impl-header">
                  <div className="impl-icon ii-navy">⚙️</div>
                  <div className="impl-header-title">Paramètres système</div>
                </div>
                <div className="impl-body">
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Motif de modification obligatoire</div></div>
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Vérification checksum SHA256</div></div>
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Journal d'audit complet</div></div>
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Signature électronique</div></div>
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Vue comparative</div></div>
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Suivi de destruction</div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 7 - RACCOURCIS */}
        <section className="conformite-section reveal" data-section-id="raccourcis" id="raccourcis">
          <div className="theme-header">
            <div className="theme-num">7</div>
            <div className="theme-title-block">
              <div className="theme-eyebrow">Navigation clavier</div>
              <h2 className="theme-title">Raccourcis clavier</h2>
              <p className="theme-subtitle">Accélère votre travail avec ces raccourcis.</p>
            </div>
          </div>
          
          <div className="impl-block">
            <div className="impl-body">
              <table className="mapping-table" style={{ fontSize: '12.5px', marginTop: '12px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '160px' }}>Touche</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="art-cell"><code>Ctrl + F</code></td>
                    <td>Focus sur le champ de recherche</td>
                  </tr>
                  <tr>
                    <td className="art-cell"><code>Entrée</code></td>
                    <td>Valider/Soumettre formulaire</td>
                  </tr>
                  <tr>
                    <td className="art-cell"><code>Échap</code></td>
                    <td>Fermer les modals ouverts</td>
                  </tr>
                  <tr>
                    <td className="art-cell"><code>Tab</code></td>
                    <td>Navigation entre champs</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SECTION 8 - DÉPANNAGE */}
        <section className="conformite-section reveal" data-section-id="depannage" id="depannage">
          <div className="theme-header">
            <div className="theme-num">8</div>
            <div className="theme-title-block">
              <div className="theme-eyebrow">Résolution de problèmes</div>
              <h2 className="theme-title">Dépannage</h2>
              <p className="theme-subtitle">Solutions aux problèmes les plus courants.</p>
            </div>
          </div>
          
          <div className="compare-grid">
            <div className="norm-col">
              <div className="norm-block">
                <div className="norm-article">Erreur "Matricule inconnu"</div>
                <div className="norm-block-title">Diagnostic</div>
                <div className="norm-quote">
                  Vérifiez le format (5 caractères)<br />
                  Contactez l'administrateur pour créer votre compte
                </div>
              </div>
              <div className="norm-block">
                <div className="norm-article">Erreur "Accès refusé"</div>
                <div className="norm-block-title">Permissions</div>
                <div className="norm-quote">
                  Votre rôle ne permet pas cette action<br />
                  Demandez à un ADMIN de vérifier vos permissions
                </div>
              </div>
            </div>
            <div className="impl-col">
              <div className="impl-block">
                <div className="impl-header">
                  <div className="impl-icon ii-amber">🔧</div>
                  <div className="impl-header-title">Problèmes document</div>
                </div>
                <div className="impl-body">
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Document non modifiable : doit être en statut « Brouillon »</div></div>
                  <div className="impl-point"><div className="ip-check">✓</div><div className="ip-text">Mot de passe : 6 caractères min + correspondance avec confirmation</div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 9 - GLOSSAIRE */}
        <section className="conformite-section reveal" data-section-id="glossaire" id="glossaire">
          <div className="theme-header">
            <div className="theme-num">9</div>
            <div className="theme-title-block">
              <div className="theme-eyebrow">Terminologie</div>
              <h2 className="theme-title">Glossaire</h2>
              <p className="theme-subtitle">Définitions des termes techniques utilisés dans l'application.</p>
            </div>
          </div>
          
          <table className="mapping-table">
            <thead>
              <tr>
                <th style={{ width: '140px' }}>Terme</th>
                <th>Définition</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="art-cell">Brouillon</td>
                <td>Document en cours de rédaction, non soumis</td>
              </tr>
              <tr>
                <td className="art-cell">Révision</td>
                <td>Version itérative d'un document</td>
              </tr>
              <tr>
                <td className="art-cell">Codification</td>
                <td>Référence unique du document (ex: MOD.ENSP.GEN.001)</td>
              </tr>
              <tr>
                <td className="art-cell">Workflow</td>
                <td>Processus d'approbation séquentiel</td>
              </tr>
              <tr>
                <td className="art-cell">Audit trail</td>
                <td>Historique complet des actions sur un document</td>
              </tr>
              <tr>
                <td className="art-cell">Matricule</td>
                <td>Identifiant utilisateur unique (5 caractères)</td>
              </tr>
              <tr>
                <td className="art-cell">Processus</td>
                <td>Département ou service propriétaire du document</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* DIVIDER */}
        <div className="divider"></div>
        
        {/* FOOTER */}
        <div className="page-footer">
          <div className="footer-logo">
            <div className="logo-ic">❓</div>
            <div className="logo-tx">GED Qualité · Support</div>
          </div>
          <div className="footer-info">
            <p>Ce guide est mis à jour régulièrement pour suivre l'évolution de l'application.</p>
          </div>
          <div className="footer-meta">
            <span>GED Qualité</span>
            <span>Support v1.0</span>
            <span>Developed by <strong>9310L - NT</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;