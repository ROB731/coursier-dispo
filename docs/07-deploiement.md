# Déploiement en production

## Deux options pour `apps/api`

`apps/web` (Next.js) va toujours sur Vercel — c'est son cas d'usage natif. Pour `apps/api` (Express), deux options coexistent :

| | Tout sur Vercel (recommandé pour démarrer) | Render |
|---|---|---|
| Coût | Gratuit (Hobby) | Payant dès qu'un disque persistant est nécessaire |
| Photos coursiers/employés | Vercel Blob (objet externe, vraiment persistant) | Disque persistant Render |
| Clôture automatique | Déclenchée au login + route `/api/cron/cloture` (Vercel Cron 1×/jour) | `node-cron` interne, toutes les 5 min |
| Démarrage à froid | Rapide (quelques centaines de ms) | Lent après 15 min d'inactivité (30-60s) sur le plan gratuit |
| Gestion | Un seul fournisseur, un seul tableau de bord | Deux fournisseurs séparés |

À l'origine, trois obstacles empêchaient `apps/api` de tourner sur Vercel tel quel — tous résolus :

1. **Clôture automatique** (`src/jobs/clotureAutomatique.ts`) : ne dépend plus d'être appelée pile à la bonne minute — elle rattrape tout retard en comparant, pour chaque coursier resté en "ENTREE", l'heure de fermeture de son jour à maintenant. Elle est déclenchée à trois endroits complémentaires et idempotents (jamais de doublon) : à chaque connexion (`auth.routes.ts`), via la route protégée `GET /api/cron/cloture` (appelée par Vercel Cron), et par le `node-cron` interne pour les environnements à process persistant (Render/local).
2. **Photos** : `uploads.routes.ts` bascule automatiquement vers **Vercel Blob** dès que `BLOB_READ_WRITE_TOKEN` est présent — sinon il garde le stockage disque local (Render/local).
3. **Déploiement Express sur Vercel** : `apps/api/api/index.ts` exporte l'app Express telle quelle comme point d'entrée unique, `apps/api/vercel.json` route toutes les requêtes vers cette fonction.

---

## Option A — Tout sur Vercel (gratuit)

`apps/api` devient un **second projet Vercel**, dans le même dépôt GitHub.

1. **New Project → Import** le même dépôt une deuxième fois.
2. **Root Directory** : `apps/api`.
3. **Storage → Create Database → Blob** sur ce projet — Vercel y attache automatiquement la variable `BLOB_READ_WRITE_TOKEN` (rien à copier manuellement).
4. Variables d'environnement à ajouter dans les réglages de ce projet :

   | Variable | Valeur |
   |---|---|
   | `DATABASE_URL` | La chaîne de connexion Prisma Postgres |
   | `JWT_SECRET` | Un secret neuf généré pour la production (`openssl rand -base64 48`), jamais celui du `.env` local |
   | `FRONTEND_ORIGIN` | L'URL Vercel du frontend, ex. `https://coursier-dispo.vercel.app` |
   | `SEED_SUPER_ADMIN_IDENTIFIANT` / `SEED_SUPER_ADMIN_MOT_DE_PASSE` | Identifiants du premier compte Super Admin |
   | `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | `npx web-push generate-vapid-keys` |
   | `CRON_SECRET` | Une valeur aléatoire (`openssl rand -hex 32`) — Vercel l'envoie automatiquement en en-tête `Authorization` quand il appelle `/api/cron/cloture`, il suffit qu'elle existe |

5. Déployer. `postinstall` (`prisma generate`) tourne automatiquement après `npm install`.
6. Vérifier : `curl https://<projet-api>.vercel.app/health` doit répondre `{"status":"ok"}`.
7. Sur le projet **frontend**, mettre `NEXT_PUBLIC_API_URL` = l'URL de ce projet API, puis redéployer.

**Limite à connaître** : le cron Vercel Hobby ne se déclenche qu'1×/jour (`vercel.json`, 23h). Ce n'est pas gênant — c'est un filet de sécurité, pas le mécanisme principal : la clôture se rattrape aussi automatiquement à la première connexion de chaque utilisateur après l'heure de fermeture.

---

## Option B — Déployer l'API sur Render

Un `render.yaml` est fourni à la racine du dépôt (Blueprint Render) — Render détecte automatiquement le service, le disque persistant pour `/uploads`, et le health check.

1. Sur [render.com](https://render.com), **New → Blueprint**, sélectionner ce dépôt GitHub.
2. Render lit `render.yaml` et propose de créer le service `dispo-coursier-api`. Valider.
3. Renseigner les variables marquées `sync: false` (Render les demande à la création) :

   | Variable | Valeur |
   |---|---|
   | `DATABASE_URL` | La même chaîne de connexion Prisma Postgres qu'en développement (ou une nouvelle base — voir "Avant de considérer que c'est « en production »" ci-dessous) |
   | `JWT_SECRET` | **Un secret neuf, généré pour la production** — jamais celui du `.env` local. Générer avec `openssl rand -base64 48`, minimum 32 caractères |
   | `FRONTEND_ORIGIN` | L'URL Vercel définitive, ex. `https://dispo-coursier.vercel.app` (sans `/` final) |
   | `SEED_SUPER_ADMIN_IDENTIFIANT` / `SEED_SUPER_ADMIN_MOT_DE_PASSE` | Identifiants du premier compte Super Admin en production — à changer après la première connexion |
   | `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Générer avec `npx web-push generate-vapid-keys` si les notifications push sont utilisées |

4. Une fois déployé, noter l'URL Render (ex. `https://dispo-coursier-api.onrender.com`) — elle sert à configurer le frontend juste après.
5. Vérifier : `curl https://<url-render>/health` doit répondre `{"status":"ok"}`.

**Le disque persistant** (`uploads`, monté sur `apps/api/uploads`) est déclaré dans `render.yaml`. Sans lui, les photos uploadées seraient perdues à chaque redéploiement — c'est le point qui casse silencieusement si on saute cette étape.

---

## Déployer le frontend sur Vercel (commun aux deux options)

1. **New Project → Import** le dépôt GitHub.
2. **Root Directory** : `apps/web` (obligatoire — sans ça Vercel cherche un projet Next.js à la racine et ne le trouve pas).
3. Variable d'environnement à ajouter dans les réglages du projet Vercel :

   | Variable | Valeur |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | L'URL Render obtenue à l'étape précédente, ex. `https://dispo-coursier-api.onrender.com` |

4. Déployer. Vercel détecte automatiquement `next build`.

---

## Avant de considérer que c'est « en production »

- **Base de données partagée avec le développement** : la base Prisma Postgres utilisée pendant toute la construction de l'app contient des données de test (entreprise "TestCorp", comptes `directeur`/`gerante` de démo, une photo de coursier générée par IA). Si `DATABASE_URL` de Render pointe vers cette même base, ces données de test seront visibles en production. Deux options :
  - Nettoyer les données de test dans la base actuelle avant l'ouverture aux vrais utilisateurs.
  - Provisionner une base Prisma Postgres neuve pour la production, y appliquer le schéma (`npx prisma db push` depuis `apps/api` avec le nouveau `DATABASE_URL`), et ne seeder que les vraies données IVOIRRAPID.
- **Mots de passe** : tout compte créé pendant le développement (`admin`, `directeur`, `gerante`, etc.) doit avoir un mot de passe changé ou être désactivé avant l'ouverture en production.
- **Secrets** : `JWT_SECRET` de production doit être différent de celui utilisé en local — ne jamais réutiliser une valeur qui a pu apparaître dans un `.env` local ou un historique de commandes.

## Résumé du flux de requêtes en production

```
Navigateur → https://coursier-dispo.vercel.app (Next.js, Vercel)
                    │  fetch(..., credentials: "include")
                    ▼
     https://<projet-api>.vercel.app  OU  https://dispo-coursier-api.onrender.com
                    │        (Express — Option A : Vercel  /  Option B : Render)
                    ▼
          Prisma Postgres (hébergé par Prisma)
```

Le cookie de session est `httpOnly`, `Secure`, `SameSite=None` en production (voir `apps/api/src/routes/auth.routes.ts`) — nécessaire puisque web et API sont sur deux domaines distincts.
