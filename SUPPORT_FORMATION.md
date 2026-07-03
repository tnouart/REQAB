# Support de Formation - GED Qualité ISO 9001:2015

## 1. Vue d'ensemble de l'application

**GED Qualité** est une application web de gestion électronique de documents conçue pour répondre aux exigences de la norme ISO 9001:2015. Elle permet la gestion centralisée des documents qualité avec suivi des révisions, workflow d'approbation et auditabilité complète.

**Accès** : http://localhost:5173 (frontend) / http://localhost:5000 (backend)

---

## 2. Authentification et comptes

### 2.1 Identifiants
- **Matricule** : Identifiant unique de 5 caractères alphanumériques
  - Format accepté : `0000A` (4 chiffres + 1 lettre) ou `00000` (5 chiffres)
  - Exemples : `0000A`, `0001`, `0002A`, `0003`
- **Mot de passe** : 6 caractères minimum

### 2.2 Comptes de démonstration

| Matricule | Mot de passe | Rôle | Nom complet | Permissions |
|-----------|------------|------|-----------|-----------|
| 0000A | demo | ADMIN | Karim Bouali | Toutes les permissions, gestion des utilisateurs |
| 0001 | demo | RESPONSABLE_QUALITE | Nadia Amrani | Approuver les révisions, gestion des référentiels |
| 0002A | demo | REDACTEUR | Amina Ferhat | Créer des brouillons, soumettre à revue |
| 0003 | demo | LECTEUR | Sara Benali | Consultation uniquement |

### 2.3 Processus de connexion
1. Saisir le matricule dans le champ dédié
2. Saisir le mot de passe
3. Cliquer **Se connecter**
4. En cas d'erreur :
   - "Matricule inconnu" : Vérifiez l'orthographe
   - "Mot de passe incorrect" : Contactez l'administrateur

---

## 3. Gestion des Utilisateurs (Module ADMIN uniquement)

### 3.1 Créer un utilisateur

**Accès** : Menu "Utilisateurs" → Bouton "+ Nouvel utilisateur"

**Étapes détaillées** :
1. **Prénom** : Saisissez le prénom (ex: "Amina")
2. **Nom** : Saisissez le nom de famille (ex: "Ferhat")
3. **Matricule** : 
   - Format : 4 chiffres + 1 lettre majuscule (ex: `0024B`)
   - Ou : 5 chiffres (ex: `00123`)
   - Le système valide automatiquement le format
4. **Email professionnel** : Adresse email unique (ex: a.ferhat@entreprise.dz)
5. **Mot de passe** (optionnel) :
   - Laissez vide → mot de passe par défaut: `password123`
   - Ou saisissez un mot de passe personnalisé (6 caractères min)
6. **Processus / Direction** :
   - DQHSE (Direction Qualité, HSE)
   - DAL (Direction Administrative et Logistique)
   - DRH (Direction des Ressources Humaines)
   - DMI (Direction Maintenance Industrielle)
   - DPE (Direction des Procédés et Energie)
   - DG (Direction Générale)
7. **Rôle initial** :
   - LECTEUR : Consultation uniquement
   - REDACTEUR : Rédaction et modification
   - RESPONSABLE_QUALITE : Approbation et référentiels
   - ADMIN : Administration complète

**Validation** :
- Les champs Prénom, Nom, Email, Matricule et Rôle sont obligatoires
- Un message d'erreur apparaît si le format du matricule est invalide

### 3.2 Modifier un utilisateur

**Accès** : Sélectionner l'utilisateur → Bouton "✏️ Modifier"

**Champs modifiables** :
- **Prénom** : Texte libre
- **Nom** : Texte libre
- **Email** : Adresse email (vérifiée pour unicité)
- **Matricule** : Format 5 caractères (le matricule est visible par l'œil 👁️)
- **Nouveau mot de passe** : 6 caractères minimum (visible par l'œil 👁️)
- **Confirmer le mot de passe** : Doit correspondre au nouveau mot de passe
- **Processus / Direction** : Liste déroulante

**Processus de modification** :
1. Changer les valeurs souhaitées
2. Pour changer le mot de passe :
   - Saisir le nouveau mot de passe (6 caractères min)
   - Confirmer le mot de passe
   - Les deux correspondent → modification autorisée
3. Cliquer **Enregistrer**
4. Message de confirmation : "Utilisateur modifié ✓"

### 3.3 Activer/Désactiver un utilisateur

- **Bouton** : ⏸ Désactiver / ▶ Réactiver
- **Effet** : L'utilisateur ne peut plus se connecter s'il est désactivé
- **Visuel** : Les utilisateurs inactifs sont grisés dans la liste

### 3.4 Attribution des rôles

**Méthode** : Toggles dans le panneau "Rôles attribués"

**Rôles disponibles** :
- ADMIN : 🔑 Administrateur
- RESPONSABLE_QUALITE : ✅ Resp. Qualité
- REDACTEUR : ✍️ Rédacteur
- LECTEUR : 👁 Lecteur

**Permissions associées** :
Chaque rôle octroie un ensemble de permissions détaillées dans le panneau "Permissions effectives"

---

## 4. Gestion des Documents

### 4.1 Créer un document

**Accès** : Menu "Documents" → Bouton "+ Nouveau document"

**Étape 1 - Identification** :
- **Titre du document** : Intitulé complet
- **Processus** : Processus propriétaire (obligatoire)
- **Niveau de confidentialité** :
  - Public : Tous les utilisateurs
  - Interne : Réservé aux salariés
  - Confidentiel : Accès restreint
- **Document externe** : (Oui/Non) - Norme, certification...

**Étape 2 - Conservation** :
- **Lieu de classement** : Support physique ou numérique
- **Méthode de classement** : Classement, numerotation...
- **Durée de classement** : 1 an, 3 ans, 5 ans, 10 ans, Permanent
- **Lieu d'archivage** : Emplacement d'archivage
- **Durée d'archivage** : Durée d'archivage après classement
- **Responsable de destruction** : Personne en charge du retrait

**Étape 3 - Révision initiale** :
- **Fichier du document** : Upload (PDF, DOCX, XLSX - max 20Mo)
- **Motif de création** : Raison de la création (ex: "Audit interne référentiel §7.5")
- **Responsables** :
  - Rédacteur : Créateur du document
  - Chargé de revue : Évaluer la pertinence
  - Approbateur : Validation finale

### 4.2 Workflow d'approbation

**Statuts du document** :
1. **Brouillon (Rév. 0)** : En cours de rédaction
2. **En revue** : En attente d'évaluation
3. **Approuvé** : Révision validée
4. **Applicable** : Document en vigueur

**Actions disponibles** :
- **Brouillon** :
  - 📤 Soumettre à revue (rédacteur)
  - ✏️ Modifier le brouillon (rédacteur)
- **En revue** :
  - ✅ Approuver (chargé de revue)
  - ↩ Retourner (chargé de revue)
  - 💬 Demander des infos (chargé de revue)
- **Approuvé** :
  - 📢 Rendre applicable (approbateur)
  - ↩ Retourner (approbateur)
- **Applicable** :
  - 🔄 Créer Rév. (nouvelle révision)
  - 📦 Archiver (archivage)

### 4.3 Modifier un document

**Prérequis** : Le document doit être en statut "Brouillon"

**Étapes** :
1. Ouvrir le document
2. Cliquer **✏️ Modifier le brouillon**
3. Modifier les champs souhaités
4. Ajouter un **motif de modification** (obligatoire selon la politique)
5. Cliquer **✓ Enregistrer les modifications**

### 4.4 Signature électronique

**Accès** : Via le bouton signature sur les documents applicables

**Processus** :
1. Le document doit être en statut "Applicable"
2. Cliquer sur "Signer"
3. Saisir le code de signature
4. La signature est horodatée et tracée dans l'audit

---

## 5. Interfaces détaillées

### 5.1 Tableau de bord (Dashboard)

**Widgets disponibles** :
- **Documents par statut** : Camembert avec répartition Brouillon/En revue/Approuvé/Applicable
- **Révisions à venir** : Liste des révisions planifiées
- **Documents urgents** : Révisions en retard (>30 jours)
- **Documents récents** : Dernières créations/soumissions

### 5.2 Liste des documents

**Filtres disponibles** :
- **Recherche** : Titre, codification, processus
- **Processus** : Filtre par processus propriétaire
- **Statut** : Brouillon, En revue, Approuvé, Applicable
- **Assigné à** : Filtre par responsable (rédacteur, relecteur, approbateur)

**Colonnes affichées** :
- Codification (ex: MOD.ENSP.GEN.001)
- Titre du document
- Processus
- Statut (badge coloré)
- Confidentialité (badge)
- Responsables (avatars)
- Date prochaine révision

### 5.3 Vue détaillée d'un document

**Sections** :
1. **Fichier** : Visualisation/prévisualisation du document
2. **Révisions** : Historique des révisions avec dates
3. **Responsabilités** : Rédacteur, relecteur, approbateur
4. **Informations** : Processus, dates, confidentialité
5. **Activité récente** : Historique des actions
6. **Piste d'audit** : Chronologie complète des modifications

---

## 6. Administration (ADMIN)

### 6.1 Référentiels

**Types de documents** :
- Procédure
- Mode opératoire
- Instruction
- Enregistrement
- Tableau
- Manuel

**Processus** :
- DQHSE
- DAL
- DRH
- DMI
- DPE
- DG

### 6.2 Paramètres système

**Fonctionnalités toggle** :
- **Motif de modification obligatoire** : Force la saisie d'un motif
- **Vérification checksum SHA256** : Intégrité des fichiers
- **Journal d'audit complet** : Traçabilité détaillée
- **Signature électronique** : Activation des signatures
- **Vue comparative** : Affichage des différences entre révisions
- **Suivi de destruction** : Gestion des destructions
- **Contrôle d'accès** : Permissions par rôles
- **Notifications toast** : Alertes visuelles

---

## 7. Raccourcis clavier

| Touche | Action |
|--------|--------|
| Ctrl + F | Focus sur le champ de recherche |
| Entrée | Valider/Soumettre formulaire |
| Échap | Fermer les modals ouverts |
| Tab | Navigation entre champs |

---

## 8. Dépannage

### Problèmes courants

**Erreur "Matricule inconnu"** :
- Vérifiez le format (5 caractères)
- Contactez l'administrateur pour créer votre compte

**Erreur "Accès refusé"** :
- Votre rôle ne permet pas cette action
- Demandez à un ADMIN de vérifier vos permissions

**Document ne peut pas être modifié** :
- Le document n'est pas en statut "Brouillon"
- Contactez le rédacteur ou l'approbateur

**Mot de passe non accepté** :
- Minimum 6 caractères requis
- Le nouveau mot de passe doit correspondre à la confirmation

---

## 9. Glossaire

| Terme | Définition |
|-------|-----------|
| Brouillon | Document en cours de rédaction, non soumis |
| Révision | Version itérative d'un document |
| Codification | Référence unique du document (ex: MOD.ENSP.GEN.001) |
| Workflow | Processus d'approbation séquentiel |
| Audit trail | Historique complet des actions sur un document |
| Matricule | Identifiant utilisateur unique (5 caractères) |
| Processus | Département ou service propriétaire du document |