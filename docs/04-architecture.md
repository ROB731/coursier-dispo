# Architecture technique — DISPO-COURSIER

**Statut** : Proposition — en attente de validation client
**Basé sur** : [01-product-discovery.md](./01-product-discovery.md), [02-prd.md](./02-prd.md), [03-ux-design.md](./03-ux-design.md)
**Rôle mobilisé** : Software Architect

*Note méthodologique : le skill `software-architect` du projet n'a pas d'instructions propres définies (fichier vide). Cette phase est conduite directement à partir du rôle Software Architect du CLAUDE.md. Conformément à la consigne reçue, chaque entité de données est détaillée avec un jeu de champs complet et réaliste (posture d'expert métier), plutôt que des champs génériques.*

---

## 1. Vue d'ensemble

```
┌─────────────────────────────┐        ┌─────────────────────────────┐
│   Frontend — Next.js (PWA)   │  REST  │   Backend — Node.js/Express   │
│                               │◄──────►│                               │
│  /borne/[terminalId]          │        │  Routes → Contrôleurs         │
│  /app  (Gérante/Directeur)     │        │  → Services → Prisma          │
│  /admin (Super Admin)          │        │                               │
└─────────────────────────────┘        └───────────────┬───────────────┘
                                                          │
                                                          ▼
                                                ┌───────────────────┐
                                                │   PostgreSQL       │
                                                └───────────────────┘
```

**Deux applications déployables distinctes** (conforme à la stack imposée : Next.js séparé de Node/Express) :
- **Frontend Next.js** : une seule application avec 3 zones de routage par rôle (`/borne`, `/app`, `/admin`), chacune avec ses propres permissions côté client, mais un seul build/déploiement pour limiter la complexité opérationnelle d'une petite équipe.
- **Backend Express** : API REST unique, source de vérité, seule couche à parler à PostgreSQL via Prisma.

**Pourquoi une seule app Next.js plutôt que trois ?** Trois surfaces distinctes (borne/app/admin) sur un même produit partagent l'essentiel (design system, auth, appels API). Les séparer en plusieurs déploiements ajouterait de la charge d'exploitation (CI/CD, domaines, versions à synchroniser) sans bénéfice réel à l'échelle d'IVOIRRAPID. Si un jour la Borne doit devenir une app native distincte, le découpage par dossier de routes facilite l'extraction.

---

## 2. Modèle de données

*Chaque entité ci-dessous est pensée avec les champs qu'un cas réel exigerait, au-delà du strict minimum du PRD, pour éviter les allers-retours de migration plus tard. Les champs marqués (MVP) sont exploités dès la V1 ; les autres sont prévus dans le schéma mais pas nécessairement exposés dans l'UI immédiatement.*

### 2.1 `Coursier`

| Champ | Type | Détail |
|---|---|---|
| `id` | UUID | Clé primaire |
| `code` | string, unique | Ex. `CE120` — obligatoire (MVP) |
| `photoUrl` | string | Obligatoire (MVP) — cf. section 6 stockage |
| `prenom` | string | Obligatoire en pratique dès qu'on affiche un nom — recommandé de le rendre obligatoire même si le PRD le marque facultatif |
| `nom` | string | Idem |
| `telephone` | string, optionnel | Utile pour contacter directement un coursier absent sans passer par un tiers |
| `email` | string, optionnel | Rarement utilisé pour un coursier, mais champ prévu (ex. envoi de bulletin) |
| `dateNaissance` | date, optionnel | Utile pour dossier RH minimal, pas exploité dans le MVP fonctionnel |
| `adresse` | string, optionnel | |
| `typeContrat` | enum optionnel : `CDI`, `CDD`, `STAGIAIRE`, `PRESTATAIRE` | Utile pour les statistiques RH futures (hors périmètre notification) |
| `dateEmbauche` | date, optionnel | |
| `contactUrgenceNom` / `contactUrgenceTelephone` | string, optionnel | Bonne pratique pour tout personnel de terrain (livraison = risque routier) — je recommande de l'inclure dès le MVP même si non demandé explicitement, car son absence serait un manque professionnel pour ce type de métier |
| `statutActif` | boolean | Désactivation (US-02) |
| `profilHoraireId` | FK → `ProfilHoraire` | (MVP) |
| `multiSiteActive` | boolean, défaut `false` | Paramètre du Directeur (US-07) |
| `notes` | text, optionnel | Notes internes libres (Super Admin) |
| `createdAt` / `updatedAt` | timestamp | |

### 2.2 `Site`

| Champ | Type | Détail |
|---|---|---|
| `id` | UUID | |
| `nom` | string | Ex. "Siège Abidjan" |
| `adresse` | string, optionnel | |
| `ville` | string, optionnel | |
| `estSitePrincipal` | boolean | Un seul site marqué comme principal en mode mono-site |
| `actif` | boolean | |
| `createdAt` / `updatedAt` | timestamp | |

### 2.3 `CoursierSite` (relation many-to-many, cf. décision d'architecture Discovery §4.8)

| Champ | Type | Détail |
|---|---|---|
| `id` | UUID | |
| `coursierId` | FK → `Coursier` | |
| `siteId` | FK → `Site` | |
| `estSitePrincipal` | boolean | Contrainte applicative (pas base) : un seul `true` par coursier tant que `multiSiteActive = false` |
| `actif` | boolean | |

### 2.4 `ProfilHoraire`

| Champ | Type | Détail |
|---|---|---|
| `id` | UUID | |
| `nom` | string | Ex. "Journée complète", "Demi-journée matin" |
| `heureDebut` | time | |
| `heureFin` | time | |
| `joursApplicables` | tableau d'enum (`LUN`...`DIM`) | |
| `estParDefaut` | boolean | Un seul profil par défaut à l'installation |
| `actif` | boolean | |

### 2.5 `Terminal` (identité de la Borne)

| Champ | Type | Détail |
|---|---|---|
| `id` | UUID (généré et stocké localement sur la tablette, ex. `localStorage`) | Identité du terminal, pas d'utilisateur |
| `nom` | string | Ex. "Borne Accueil Abidjan" — utile si plusieurs bornes par site |
| `siteId` | FK → `Site` | |
| `derniereActiviteAt` | timestamp | Supervision technique (détecter une borne hors ligne) |
| `actif` | boolean | |

### 2.6 `Evenement` (cœur de l'historique — jamais modifié ni supprimé)

| Champ | Type | Détail |
|---|---|---|
| `id` | UUID | |
| `coursierId` | FK → `Coursier` | |
| `siteId` | FK → `Site` | Site où l'événement a eu lieu (important si multi-site actif) |
| `type` | enum : `ENTREE`, `SORTIE`, `ANNULATION`, `CLOTURE_AUTO` | `CLOTURE_AUTO` = événement généré par le job de fin de journée |
| `evenementAnnuleId` | FK optionnel → `Evenement` (self-reference) | Renseigné uniquement si `type = ANNULATION` |
| `source` | enum : `BORNE`, `COMPTE`, `SYSTEME` | `SYSTEME` pour les clôtures automatiques |
| `terminalId` | FK optionnel → `Terminal` | Renseigné si `source = BORNE` |
| `creeParUtilisateurId` | FK optionnel → `Utilisateur` | Renseigné si `source = COMPTE` (annulation par un Super Admin/Gérante) |
| `horodatage` | timestamp (heure serveur, jamais heure client) | |
| `createdAt` | timestamp | Distinct de `horodatage` si un événement est saisi rétroactivement (à ne pas permettre au MVP, mais champ prévu) |

**Règle d'intégrité** : cette table est **append-only** — aucune opération `UPDATE`/`DELETE` n'est autorisée au niveau applicatif (correction = nouvelle ligne `ANNULATION`).

### 2.7 `Utilisateur` (comptes Super Admin / Directeur / Gérante)

| Champ | Type | Détail |
|---|---|---|
| `id` | UUID | |
| `identifiant` | string, unique | Login (PRD section 9 : identifiant + mot de passe) |
| `motDePasseHash` | string | bcrypt, jamais le mot de passe en clair |
| `role` | enum : `SUPER_ADMIN`, `DIRECTEUR`, `GERANTE` | |
| `nomComplet` | string | |
| `telephone` | string, optionnel | Utile pour contact direct / réinitialisation manuelle du mot de passe par le Super Admin |
| `email` | string, optionnel | Prévu pour une future réinitialisation en libre-service (hors MVP, cf. UX §4.5) |
| `siteParDefautId` | FK optionnel → `Site` | Site affiché par défaut si multi-site |
| `actif` | boolean | |
| `derniereConnexionAt` | timestamp, optionnel | |
| `createdAt` / `updatedAt` | timestamp | |

### 2.8 `PushSubscription` (notifications Web Push)

| Champ | Type | Détail |
|---|---|---|
| `id` | UUID | |
| `utilisateurId` | FK → `Utilisateur` | |
| `endpoint` | string | |
| `p256dh` / `auth` | string | Clés de chiffrement de la souscription push (standard Web Push) |
| `createdAt` | timestamp | |

### 2.9 `Notification`

| Champ | Type | Détail |
|---|---|---|
| `id` | UUID | |
| `utilisateurId` | FK → `Utilisateur` | |
| `type` | enum : `COURSIER_ARRIVE`, `AUCUN_DISPONIBLE` | Extensible (roadmap PRD §8) |
| `coursierId` | FK optionnel → `Coursier` | |
| `message` | string | |
| `lu` | boolean, défaut `false` | |
| `envoyeAt` | timestamp | |

### 2.10 `ParametresApplication` (configuration globale, singleton)

| Champ | Type | Détail |
|---|---|---|
| `modeMultiSite` | boolean, défaut `false` | |
| `fenetreAnnulationBorneMinutes` | int, défaut `2` | Décision PRD §9 — configurable, jamais en dur dans le code |
| `intervallePollingSecondes` | int, défaut `7` | Décision PRD §9 |
| `clotureAutoActive` | boolean, défaut `true` | |

---

## 3. Logique métier centrale : calcul du statut

Le statut affiché n'est **jamais stocké tel quel** — il est dérivé à la lecture, pour garantir la règle de fiabilité définie au Discovery (§4.4).

```
FONCTION calculerStatut(coursierId, maintenant):
  dernierEvenement = dernier Evenement non annulé pour ce coursier, trié par horodatage desc

  SI dernierEvenement est vide:
    RETOURNER "NON_DISPONIBLE"

  SI dernierEvenement.type == SORTIE ou CLOTURE_AUTO:
    RETOURNER "NON_DISPONIBLE"

  SI dernierEvenement.type == ENTREE:
    profil = coursier.profilHoraire
    SI maintenant est en dehors de la plage [profil.heureDebut, profil.heureFin]
       OU dernierEvenement.horodatage n'est pas dans la journée courante:
      RETOURNER "NON_DISPONIBLE"   # garde-fou §4.4, indépendant du job de clôture
    SINON:
      RETOURNER "DISPONIBLE"
```

**Job planifié de clôture automatique** (`node-cron` ou équivalent, exécuté à `heureFin` de chaque profil horaire actif) :
- Pour chaque coursier dont le dernier événement est `ENTREE` et dont le profil horaire se termine à cette heure : créer un `Evenement` de type `CLOTURE_AUTO`, `source = SYSTEME`.
- Ce job **écrit l'historique** ; il n'est **jamais la seule garantie** de cohérence de l'affichage (cf. fonction ci-dessus).

---

## 4. API (contrat REST — synthèse)

| Domaine | Endpoints |
|---|---|
| Auth | `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` |
| Coursiers | `GET/POST /api/coursiers`, `PATCH /api/coursiers/:id`, `POST /api/coursiers/:id/desactiver` |
| Sites | `GET/POST/PATCH /api/sites` |
| Profils horaires | `GET/POST/PATCH /api/profils-horaires` |
| Borne | `GET /api/bornes/:terminalId/coursiers` (grille), `POST /api/evenements`, `POST /api/evenements/:id/annuler` |
| Statuts temps réel | `GET /api/sites/:siteId/statuts` (polling, cf. §5) |
| Historique | `GET /api/historique?coursierId=&siteId=&from=&to=` |
| Notifications | `GET /api/notifications`, `POST /api/notifications/subscribe`, `PATCH /api/notifications/:id/lu` |
| Paramètres | `GET/PATCH /api/parametres` (Super Admin uniquement) |

Toutes les routes hors `Auth` et `Borne` exigent un token de session valide + vérification de rôle (middleware RBAC). Les routes `Borne` n'exigent pas de compte utilisateur mais valident l'existence et l'activité du `terminalId`.

---

## 5. Temps réel : polling aujourd'hui, évolutif vers push

Décision UX/PRD : polling ~5-10s au MVP plutôt que WebSocket. Pour ne pas bloquer l'évolution :
- Le frontend consomme `GET /api/sites/:siteId/statuts` via un hook unique (`useStatutsCoursiers`), qui encapsule le polling.
- Le jour où un besoin de latence plus faible est confirmé, seul ce hook change (SSE ou WebSocket) — aucun composant d'affichage n'a besoin d'être réécrit.

---

## 6. Stockage des photos

Recommandation : ne **jamais** stocker les photos en base (BLOB) — stockage sur disque (volume persistant) ou service compatible S3, référencé par URL dans `Coursier.photoUrl`. Accès en lecture publique limité aux photos (pas de données sensibles au-delà du visage), servi via un chemin dédié non indexable.

---

## 7. Sécurité

- Mots de passe : hachés avec **bcrypt** (jamais en clair, jamais réversibles).
- Sessions : cookie **httpOnly, secure, sameSite=strict**, contenant un identifiant de session ou JWT court.
- Limitation de tentatives de connexion (`express-rate-limit`) pour contrer le brute-force sur `/api/auth/login`.
- Validation stricte des entrées API (ex. `zod`) à chaque endpoint — jamais de confiance aveugle dans le payload client.
- CORS restreint au domaine du frontend.
- HTTPS obligatoire en production (pas d'exception).
- RBAC appliqué en middleware, jamais uniquement côté frontend (le frontend cache les boutons, le backend seul fait autorité).

---

## 8. Déploiement et scalabilité

- Base de données unique (PostgreSQL), le multi-site est une dimension logique (`siteId` sur les entités concernées), pas une infrastructure séparée par site.
- Migrations gérées par Prisma Migrate — chaque évolution de schéma (ex. activation réelle du multi-site, mode offline) passe par une migration versionnée, jamais par une modification manuelle en production.
- Volume attendu : 6 coursiers aujourd'hui, conçu pour supporter plusieurs centaines sans changement d'architecture (le goulot d'étranglement serait organisationnel avant d'être technique à cette échelle).

---

## 9. Ce que cette architecture ne couvre pas (volontairement)

- Mode offline de la Borne (roadmap PRD §8) — le contrat d'API est conçu pour ne pas l'exclure (opérations idempotentes, horodatage serveur), mais son implémentation (file d'attente locale, résolution de conflits) est hors MVP.
- WebSocket/SSE — prévu en évolution, pas implémenté au MVP.

---

## 10. Validation

Cette architecture doit être validée par le client avant le passage à la phase **Base de données (schéma Prisma définitif) puis Développement**.
