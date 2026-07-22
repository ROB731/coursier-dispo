# DISPO-COURSIER

Outil interne IVOIRRAPID pour visualiser en temps réel quels coursiers sont présents au siège. Voir [docs/](./docs) pour l'historique complet des décisions produit (Discovery → PRD → UX → Architecture → Base de données).

## Structure du monorepo

```
apps/
  api/   Backend Node.js + Express + Prisma (PostgreSQL)
  web/   Frontend Next.js (PWA) — Borne, Gérante/Directeur, Admin
docs/    Documents de cadrage produit (une source de vérité par phase)
prisma/  → déplacé dans apps/api/prisma (le backend est seul à parler à la base)
```

## Prérequis

- Node.js 20+
- Une base PostgreSQL accessible (locale ou distante)

## 1. Configuration

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Renseigner au minimum dans `apps/api/.env` :
- `DATABASE_URL` — connexion PostgreSQL
- `JWT_SECRET` — chaîne aléatoire d'au moins 32 caractères
- `SEED_SUPER_ADMIN_IDENTIFIANT` / `SEED_SUPER_ADMIN_MOT_DE_PASSE` — compte créé au premier seed

Notifications Web Push (optionnel au démarrage, sinon désactivées silencieusement) :
```bash
npx web-push generate-vapid-keys
```
Copier la clé publique dans `VAPID_PUBLIC_KEY` (api) **et** `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (web), la clé privée dans `VAPID_PRIVATE_KEY` (api uniquement).

## 2. Installation et base de données

```bash
cd apps/api
npm install
npx prisma migrate dev --name init
npm run prisma:seed

cd ../web
npm install
```

Le seed crée : un site "Siège", un profil horaire par défaut (08h00–17h30, Lundi–Samedi), les paramètres globaux, et le compte Super Administrateur.

## 3. Lancer en développement

Deux terminaux :
```bash
npm run dev:api   # http://localhost:4000
npm run dev:web   # http://localhost:3000
```

Se connecter sur `http://localhost:3000/login` avec le compte Super Admin seedé, puis créer sites/profils/coursiers/comptes depuis `/admin`.

## 4. Accéder à la borne

Chaque tablette d'accueil doit être configurée une fois avec l'identifiant du `Terminal` créé en base (table `Terminal`, à créer manuellement ou via un futur écran d'admin — non couvert au MVP, cf. section Suivi). L'URL à ouvrir en plein écran sur la tablette est :

```
http://<domaine>/borne/<terminalId>
```

## État d'avancement / limites connues de cette V1

Cœur fonctionnel (P0/P1 du PRD) livré et vérifié (typecheck + build) : auth par rôle, CRUD coursiers, borne Entrée/Sortie avec annulation sous fenêtre configurable, calcul de statut avec le garde-fou anti-clôture-ratée, job de clôture automatique, écran Gérante/Directeur avec tri "disponibles en premier", notifications Web Push best-effort.

**Non couvert dans cette itération, à prioriser ensuite :**
- **Écran d'administration pour créer/gérer les `Terminal` (bornes) et les `Site`/`ProfilHoraire`** — les endpoints API existent (`/api/sites`, `/api/profils-horaires`), seule l'interface d'administration correspondante reste à construire (actuellement seul `/admin/coursiers` est implémenté).
- **Téléversement réel de photo** — le formulaire coursier accepte une URL de photo ; un vrai flux d'upload (stockage objet, cf. docs/04-architecture.md §6) reste à brancher.
- **Icônes PWA** (`public/icon-192.png`, `public/icon-512.png`) référencées dans le manifeste mais non fournies — à produire avec l'identité visuelle IVOIRRAPID.
- **Mode offline de la borne** — explicitement hors périmètre MVP (cf. docs/02-prd.md §5), le contrat d'API a été conçu pour ne pas l'exclure.
- Le correctif "annuler" côté borne n'est proposé que juste après l'action (toast de 5 s) ; la fenêtre de correction backend va jusqu'à 2 minutes (paramétrable) mais l'UI ne propose pas encore de rouvrir cette option passé le toast.

Ces points sont volontairement laissés de côté pour livrer un cœur de produit fonctionnel et testable rapidement plutôt qu'une couverture à 100 % non validée — à trancher avec vous pour la priorisation du prochain sprint.
