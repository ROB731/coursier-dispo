# Base de données — DISPO-COURSIER

**Statut** : Proposition — en attente de validation client
**Basé sur** : [04-architecture.md](./04-architecture.md)
**Fichier associé** : [prisma/schema.prisma](../prisma/schema.prisma)

---

## 1. Décisions de contrainte référentielle (`onDelete`)

Ces choix ne sont pas de détail technique : ils **implémentent au niveau base de données** des règles métier validées en Discovery et PRD, plutôt que de compter uniquement sur la discipline applicative.

| Relation | Stratégie | Raison métier |
|---|---|---|
| `Evenement → Coursier` | `Restrict` | Un coursier ayant un historique **ne peut pas être supprimé physiquement** — la base l'interdit. Seule la désactivation (`statutActif = false`) est possible. Implémente directement la règle Discovery §4.7 : "la suppression définitive doit être exceptionnelle." |
| `Evenement → Site` | `Restrict` | Idem : un site ayant de l'historique ne peut pas être supprimé sans intervention explicite. |
| `Evenement → Terminal` | `SetNull` | La suppression d'une borne matérielle ne doit pas invalider l'historique passé ; seule la référence au terminal est perdue. |
| `Evenement → Utilisateur` (créateur d'une annulation) | `SetNull` | Un compte supprimé ne doit pas bloquer ni effacer l'historique des annulations qu'il a effectuées. |
| `CoursierSite → Coursier` | `Cascade` | Le rattachement site est une donnée dérivée du coursier — si un coursier est un jour supprimé (cas exceptionnel autorisé après purge de son historique), ses rattachements site n'ont plus de sens. |
| `CoursierSite → Site` | `Restrict` | Un site avec des coursiers actifs rattachés ne peut pas être supprimé par erreur. |
| `Coursier → ProfilHoraire` | `Restrict` | Empêche de supprimer un profil horaire tant qu'un coursier l'utilise (éviter un coursier sans horaire de surveillance valide). |

**Conséquence pratique** : dans l'interface Super Admin, le bouton "Supprimer" un coursier échouera avec une erreur métier claire tant que son historique existe — ce qui, en pratique, signifie qu'il échouera **toujours** en usage normal. C'est voulu : la suppression physique reste une opération de maintenance exceptionnelle (ex. RGPD, doublon de saisie), pas une action de gestion courante, qui elle passe par la désactivation.

---

## 2. Stratégie d'index

| Index | Usage principal |
|---|---|
| `Coursier(statutActif)` | Filtrer rapidement les coursiers actifs sur l'écran Borne et les listes d'administration |
| `Coursier(profilHoraireId)` | Retrouver tous les coursiers d'un profil horaire (job de clôture automatique) |
| `Evenement(coursierId, horodatage)` | Requête la plus fréquente du système : "dernier événement d'un coursier" (calcul de statut, cf. Architecture §3) |
| `Evenement(siteId, horodatage)` | Écran Gérante : liste des statuts d'un site, triée par fraîcheur |
| `Evenement(type)` | Filtrage rapide (ex. lister toutes les annulations pour audit) |
| `Notification(utilisateurId, lu)` | Compteur de notifications non lues, affiché en permanence dans l'UI |

---

## 3. Table de paramètres — contrainte de ligne unique

`ParametresApplication` est conçue comme une table à **une seule ligne**. Prisma ne permet pas de contraindre ça nativement dans le schéma ; c'est donc géré applicativement :
- Le script de seed crée exactement une ligne à l'installation.
- La couche service expose uniquement `getParametres()` / `updateParametres()` opérant toujours sur cette ligne unique (jamais de `create` exposé après le seed initial).

---

## 4. Plan de seed (données d'amorçage)

Nécessaires pour qu'un environnement fraîchement installé soit utilisable immédiatement :

1. **Un site principal** : `estSitePrincipal = true`, nom "Siège" (renommable par le Super Admin).
2. **Un profil horaire par défaut** : "Journée complète", 08:00–17:30, jours Lundi à Samedi, `estParDefaut = true` — cohérent avec la mention du client que certains coursiers travaillent le samedi.
3. **Une ligne `ParametresApplication`** avec les valeurs par défaut du schéma (`modeMultiSite = false`, `fenetreAnnulationBorneMinutes = 2`, `intervallePollingSecondes = 7`, `clotureAutoActive = true`).
4. **Un compte Super Administrateur initial**, créé via variables d'environnement au premier démarrage (jamais de mot de passe par défaut codé en dur dans le seed).

---

## 5. Migrations

Toute évolution de schéma passe par `prisma migrate dev` (développement) / `prisma migrate deploy` (production) — jamais de modification manuelle de la structure en production. Les migrations prévues par la roadmap produit (PRD §8) sans changement de schéma nécessaire :
- Activation réelle du multi-site : `CoursierSite` et `multiSiteActive` existent déjà — c'est un changement de règle applicative, pas de schéma.
- Distinction d'identité des gardiens : nécessiterait une nouvelle table `Gardien` légère (sans mot de passe) et un champ sur `Evenement` — migration additive, non bloquante.

---

## 6. Validation

Ce schéma doit être validé par le client avant le passage à la phase **Développement**.
