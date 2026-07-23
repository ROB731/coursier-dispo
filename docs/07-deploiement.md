# Déploiement en production

## Pourquoi deux services distincts

DISPO-COURSIER est un monorepo avec deux applications de nature différente : elles ne se déploient pas au même endroit.

| Application | Techno | Hébergeur recommandé | Pourquoi |
|---|---|---|---|
| `apps/web` | Next.js | Vercel | Frontend classique, c'est le cas d'usage natif de Vercel |
| `apps/api` | Express | Render (ou Railway) | Process qui doit tourner en continu — incompatible avec le serverless de Vercel |

Trois raisons empêchent `apps/api` de fonctionner correctement sur Vercel tel quel :

1. **Clôture automatique** (`src/jobs/clotureAutomatique.ts`) : un `cron.schedule("* * * * *", …)` qui tourne toutes les minutes. Les fonctions serverless Vercel s'éteignent entre les requêtes — un cron interne au process ne survit pas.
2. **Photos des coursiers** : stockées sur disque local (`apps/api/uploads/`) via `multer`, servies par `express.static`. Le système de fichiers de Vercel est jetable — les photos disparaîtraient au déploiement suivant.
3. Vercel ne sait pas déployer un serveur Express standalone dans un monorepo sans configuration spécifique qu'il ne devine pas automatiquement.

---

## 1. Déployer l'API sur Render

Un `render.yaml` est fourni à la racine du dépôt (Blueprint Render) — Render détecte automatiquement le service, le disque persistant pour `/uploads`, et le health check.

1. Sur [render.com](https://render.com), **New → Blueprint**, sélectionner ce dépôt GitHub.
2. Render lit `render.yaml` et propose de créer le service `dispo-coursier-api`. Valider.
3. Renseigner les variables marquées `sync: false` (Render les demande à la création) :

   | Variable | Valeur |
   |---|---|
   | `DATABASE_URL` | La même chaîne de connexion Prisma Postgres qu'en développement (ou une nouvelle base — voir §3) |
   | `JWT_SECRET` | **Un secret neuf, généré pour la production** — jamais celui du `.env` local. Générer avec `openssl rand -base64 48`, minimum 32 caractères |
   | `FRONTEND_ORIGIN` | L'URL Vercel définitive, ex. `https://dispo-coursier.vercel.app` (sans `/` final) |
   | `SEED_SUPER_ADMIN_IDENTIFIANT` / `SEED_SUPER_ADMIN_MOT_DE_PASSE` | Identifiants du premier compte Super Admin en production — à changer après la première connexion |
   | `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Générer avec `npx web-push generate-vapid-keys` si les notifications push sont utilisées |

4. Une fois déployé, noter l'URL Render (ex. `https://dispo-coursier-api.onrender.com`) — elle sert à configurer le frontend juste après.
5. Vérifier : `curl https://<url-render>/health` doit répondre `{"status":"ok"}`.

**Le disque persistant** (`uploads`, monté sur `apps/api/uploads`) est déclaré dans `render.yaml`. Sans lui, les photos uploadées seraient perdues à chaque redéploiement — c'est le point qui casse silencieusement si on saute cette étape.

---

## 2. Déployer le frontend sur Vercel

1. **New Project → Import** le dépôt GitHub.
2. **Root Directory** : `apps/web` (obligatoire — sans ça Vercel cherche un projet Next.js à la racine et ne le trouve pas).
3. Variable d'environnement à ajouter dans les réglages du projet Vercel :

   | Variable | Valeur |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | L'URL Render obtenue à l'étape précédente, ex. `https://dispo-coursier-api.onrender.com` |

4. Déployer. Vercel détecte automatiquement `next build`.

---

## 3. Avant de considérer que c'est « en production »

- **Base de données partagée avec le développement** : la base Prisma Postgres utilisée pendant toute la construction de l'app contient des données de test (entreprise "TestCorp", comptes `directeur`/`gerante` de démo, une photo de coursier générée par IA). Si `DATABASE_URL` de Render pointe vers cette même base, ces données de test seront visibles en production. Deux options :
  - Nettoyer les données de test dans la base actuelle avant l'ouverture aux vrais utilisateurs.
  - Provisionner une base Prisma Postgres neuve pour la production, y appliquer le schéma (`npx prisma db push` depuis `apps/api` avec le nouveau `DATABASE_URL`), et ne seeder que les vraies données IVOIRRAPID.
- **Mots de passe** : tout compte créé pendant le développement (`admin`, `directeur`, `gerante`, etc.) doit avoir un mot de passe changé ou être désactivé avant l'ouverture en production.
- **Secrets** : `JWT_SECRET` de production doit être différent de celui utilisé en local — ne jamais réutiliser une valeur qui a pu apparaître dans un `.env` local ou un historique de commandes.

## Résumé du flux de requêtes en production

```
Navigateur → https://dispo-coursier.vercel.app (Next.js, Vercel)
                    │  fetch(..., credentials: "include")
                    ▼
          https://dispo-coursier-api.onrender.com (Express, Render)
                    │
                    ▼
          Prisma Postgres (hébergé par Prisma)
```

Le cookie de session est `httpOnly`, `Secure`, `SameSite=None` en production (voir `apps/api/src/routes/auth.routes.ts`) — nécessaire puisque web et API sont sur deux domaines distincts.
