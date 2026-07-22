# Product Discovery — DISPO-COURSIER

**Statut** : Validé
**Client** : IVOIRRAPID
**Phase suivante** : PRD (Product Requirements Document)

---

## 1. Problème métier

Les coursiers d'IVOIRRAPID effectuent des tournées de factures puis reviennent au siège. La gérante des courses n'a aujourd'hui **aucune visibilité fiable** sur qui est physiquement présent au siège à un instant donné :

- certains coursiers restent dans les bureaux sans que la gérante le sache ;
- certains repartent sans que personne ne s'en rende compte ;
- lorsqu'une nouvelle course arrive, la gérante ignore parfois quels coursiers sont réellement disponibles.

**Conséquences** : mauvaise répartition des courses, perte de temps, baisse de réactivité opérationnelle.

Le produit ne doit **pas** suivre les livraisons, les tournées ou les missions. Il répond à une seule question :

> **Le coursier est-il actuellement présent au siège ?**

---

## 2. Vision du produit

Un système extrêmement simple donnant en temps réel l'état de présence physique des coursiers au siège (ou à un site, en cas de multi-site futur), pour améliorer l'organisation opérationnelle — **pas** un outil de surveillance des employés, **pas** un logiciel RH, **pas** un système de pointage, **pas** un tracking GPS.

---

## 3. Utilisateurs et rôles

| Rôle | Type d'accès | Responsabilités |
|---|---|---|
| **Super Administrateur** | Compte (identifiant + mot de passe) | Gestion des utilisateurs, rôles, coursiers, paramètres de l'application |
| **Directeur** | Compte (identifiant + mot de passe) | Consultation du dashboard, statistiques, historiques, notifications. Pilote le paramètre multi-site. **Lecture seule** — aucune action d'entrée/sortie. Pas d'écran dédié différent de la Gérante au MVP. |
| **Gérante des courses** | Compte (identifiant + mot de passe) | Utilisatrice principale. Consulte la disponibilité en temps réel pour attribuer les courses. Consulte l'historique et reçoit les notifications. |
| **Borne (mode Borne)** | Pas de compte utilisateur — identité liée au terminal (device) | Tablette à l'accueil du site. Le **gardien** valide physiquement chaque entrée/sortie après avoir visuellement vérifié la présence du coursier. |

---

## 4. Règles métier

### 4.1 États
Le système possède **uniquement deux états**, aucun autre :
- 🟢 **Disponible** — dernière activité = Entrée
- 🔴 **Non disponible** — dernière activité = Sortie

### 4.2 Pas de gestion des pauses
Toute sortie du siège, même brève, est une **Sortie**. Le système ne cherche jamais à connaître le motif. Pas d'état intermédiaire.

### 4.3 Validation par le gardien
Le gardien (aucun compte requis) valide chaque entrée/sortie sur la tablette après vérification visuelle du coursier. Ce témoin humain physique remplace tout mécanisme de preuve numérique (photo, PIN) — décision retenue pour préserver un parcours à moins de 3 secondes tout en éliminant le risque qu'un coursier badge à la place d'un autre à distance.

### 4.4 Fiabilité de l'affichage (garde-fou architectural)
L'affichage de l'état ne doit **jamais dépendre uniquement** de l'exécution réussie du job de clôture automatique. En dehors des horaires de surveillance, ou si le dernier événement date de plus d'un jour, l'état par défaut affiché est **Non disponible**, indépendamment de l'historique brut. Le job de clôture reste responsable d'écrire l'événement de clôture dans l'historique à des fins de traçabilité, mais la fiabilité de l'affichage ne doit pas en dépendre.

### 4.5 Horaires de surveillance — profils réutilisables
Les horaires sont paramétrables. Plutôt qu'un horaire libre par coursier (complexité inutile), le Super Administrateur définit des **profils horaires réutilisables** (ex. : "Journée complète 8h–17h30", "Demi-journée matin", "Reprise soir", "Samedi") assignés ensuite à chaque coursier. Par défaut : 08h00–17h30. La clôture automatique de fin de journée clôture chaque coursier selon **son** profil assigné.

### 4.6 Historisation et annulation
- Toutes les activités importantes sont historisées, sans exception.
- **Aucune suppression** d'activité, y compris en cas d'erreur.
- Une annulation ne supprime jamais un événement : elle crée un **nouvel événement** indiquant que le précédent a été annulé. Traçabilité totale préservée.

### 4.7 Gestion des coursiers (CRUD)
Le Super Administrateur peut créer, modifier et désactiver un coursier. La suppression définitive reste **exceptionnelle** afin de préserver l'historique. Chaque coursier possède obligatoirement un **code unique** (ex. CE120) et une **photo** ; les autres informations sont facultatives.

### 4.8 Multi-site (évolutif)
- **Aujourd'hui** : chaque coursier est rattaché à un seul site actif ; mode "site unique" par défaut.
- **Demain** : un coursier pourra être rattaché à plusieurs sites. Ce comportement sera un **paramètre activable par le Directeur**.
- **Décision d'architecture** : la relation coursier ↔ site sera modélisée en base de données comme une relation **many-to-many** dès le départ, même si la règle métier actuelle la limite à un seul site. Objectif : que l'évolution future soit un changement de règle métier / paramètre, pas une migration de schéma.

### 4.9 Notifications
Canaux conservés : Web Push (PWA + navigateur) en priorité par défaut, autres canaux (email, SMS…) disponibles en option. Règles précises de déclenchement (ex. : coursier arrivé, aucun coursier disponible) à définir en détail durant le PRD.

### 4.10 Authentification
Comptes (Super Admin, Directeur, Gérante) : **identifiant + mot de passe** classique. La borne n'a pas de compte — son identité est celle du terminal (device).

---

## 5. Hors périmètre (explicitement exclu)

- Suivi des livraisons, tournées, missions.
- Tracking GPS ou géolocalisation précise.
- Gestion des pauses ou motifs de sortie.
- Mode offline sur la borne (**prévu en évolution future** — non traité au MVP, mais l'architecture ne doit pas fermer la porte à son ajout ultérieur).
- Écran dédié différencié pour le rôle Directeur (accès lecture seule suffisant au MVP).

---

## 6. Risques et points de vigilance identifiés

| Risque | Mitigation retenue |
|---|---|
| Un coursier pourrait badger à la place d'un autre si le processus est 100% déclaratif | Validation humaine par le gardien après vérification visuelle |
| L'état "Disponible" pourrait rester affiché à tort si la clôture automatique échoue (panne, jour férié non anticipé) | Règle d'affichage indépendante du succès du job de clôture (cf. 4.4) |
| Authentification par identifiant seul (sans secret) envisagée initialement | Écartée — identifiant + mot de passe retenu pour tous les comptes |
| Ajout du multi-site après coup coûteux si mal anticipé | Relation coursier↔site modélisée en many-to-many dès la base, même si contrainte à 1 aujourd'hui |
| Tablette en libre accès physique à l'accueil | Recommandation pour la phase Architecture/Design : prévoir un accès "mode maintenance" verrouillé (PIN caché), hors du flux public Entrée/Sortie |

---

## 7. Questions ouvertes pour les phases suivantes

- Faut-il distinguer l'identité du gardien (rotation matin/soir) dans l'historique, ou l'identifiant du terminal (Borne) suffit-il ? *(non bloquant, à trancher en Architecture)*
- Règles précises de déclenchement des notifications (PRD).
- Détail du modèle multi-site : un coursier peut-il être simultanément "Disponible" sur deux sites, ou l'état est-il par-site ? *(PRD/Architecture)*

---

## 8. Décision de passage de phase

Product Discovery validé par le client le 2026-07-22. Passage à la phase **PRD**, portée par le rôle Product Manager.
