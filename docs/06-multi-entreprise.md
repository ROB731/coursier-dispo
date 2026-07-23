# Évolution — Plateforme multi-entreprises

**Statut** : Implémenté (2026-07-23)
**Contexte** : DISPO-COURSIER passe d'un outil interne à une seule entreprise (IVOIRRAPID) à une plateforme pouvant servir plusieurs entreprises clientes, chacune avec ses données totalement isolées.

---

## 1. Hiérarchie validée avec le client

- **Super Administrateur** : accès plateforme, gère les Entreprises (création/désactivation) et tous les comptes.
- **Directeur** : géré par le Super Admin. Rattaché à une ou plusieurs Entreprises (relation multiple). Peut gérer (créer/modifier, pas seulement consulter) les coursiers, sites, profils horaires, bornes et comptes Gérant(e) de ses entreprises.
- **Gérant(e)** : rattaché(e) soit directement à une Entreprise, soit à un Directeur (dont il/elle hérite alors le périmètre). Consultation de la disponibilité, historique, notifications — pas de gestion.

## 2. Décision d'architecture : isolation stricte par périmètre

Chaque requête authentifiée calcule le "périmètre" de l'utilisateur (`perimetreService.getEntreprisesAccessibles`) :
- `null` = Super Admin, accès à tout.
- Directeur : liste des entreprises via la table de jointure `DirecteurEntreprise`.
- Gérant(e) : son `entrepriseId` direct, ou celles de son `directeurId` si rattaché via un directeur.

Toutes les routes de lecture/écriture (coursiers, sites, profils horaires, bornes, statuts, historique, notifications, paramètres) filtrent par ce périmètre côté serveur — jamais côté client uniquement. C'est la garantie qu'un Directeur ou Gérant d'une entreprise ne peut jamais voir ou modifier les données d'une autre entreprise, même en modifiant les requêtes réseau.

## 3. Ce qui devient rattaché à une Entreprise

- **Site**, **ProfilHoraire**, **ParametresApplication** (un jeu de paramètres par entreprise, plus de singleton global).
- Les **Coursiers**, **Bornes** et **Historique** restent rattachés à un Site, donc scopés indirectement via l'entreprise du site.

## 4. Migration des données existantes

Toutes les données déjà en base (site "Siège", profil "Journée complète", paramètres) ont été rattachées à une entreprise "IVOIRRAPID" créée pour l'occasion — rien n'a été perdu. La migration a été faite en deux temps (colonnes `entrepriseId` nullable, backfill applicatif, puis colonnes rendues obligatoires) pour être sans risque sur une base contenant déjà des données réelles.

## 5. Limites connues / fast-follow

- **Journal d'activité** : pas encore systématiquement rattaché à une entreprise sur chaque action (`entrepriseId` optionnel, peu peuplé pour l'instant). En conséquence, l'écran est réservé au Super Admin pour l'instant — un Directeur ne peut pas encore le consulter sans risque de voir de l'activité d'une autre entreprise.
- **Directeur → gestion élargie** : interprétation du "gère son département" comme un vrai droit de gestion (créer/modifier coursiers, sites, profils, bornes, comptes Gérant) au sein de ses entreprises — à confirmer avec le client si ce n'était pas l'intention (auquel cas on repasse le Directeur en lecture seule).
- **Site par défaut d'un compte** : pas encore validé comme appartenant à une entreprise accessible à la création/modification (validation applicative à ajouter si besoin).
