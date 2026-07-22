# UX Research & UX/UI Design — DISPO-COURSIER

**Statut** : Proposition — en attente de validation client
**Basé sur** : [01-product-discovery.md](./01-product-discovery.md), [02-prd.md](./02-prd.md)
**Rôles mobilisés** : UX Researcher, UX/UI Designer

*Note méthodologique : le skill `ux-ui-designer` du projet n'a pas d'instructions propres définies (fichier vide). Cette phase est donc conduite directement à partir des principes UX Researcher / UX/UI Designer du CLAUDE.md, appliqués au PRD validé.*

---

## 1. Objectif de la phase

Traduire les règles métier et User Stories du PRD en parcours concrets et en écrans, en gardant deux contraintes non négociables issues du Discovery :

- **Le parcours Borne doit prendre moins de 3 secondes**, utilisé par un gardien qui n'a pas de formation informatique.
- **L'écran Gérante doit permettre de répondre en un coup d'œil** à "qui est disponible maintenant ?", sans lecture ni interprétation.

Tout ce qui n'aide pas directement ces deux objectifs est considéré comme du bruit visuel à éliminer.

---

## 2. Personas (synthèse opérationnelle)

| Persona | Contexte d'usage | Contrainte dominante |
|---|---|---|
| **Le gardien** | Debout à l'accueil, tablette fixée sur un support, usage répété toute la journée, pas de formation informatique | Vitesse + zéro ambiguïté. Aucune erreur de manipulation ne doit être coûteuse à corriger. |
| **La gérante** | Sur son poste ou son téléphone, souvent en train de gérer un appel en simultané | Lisibilité immédiate, aucune action requise pour "voir" l'info. |
| **Le directeur** | Consultation ponctuelle, pas quotidienne | Vue d'ensemble, pas de détail opérationnel. |
| **Le super administrateur** | Configuration ponctuelle (onboarding coursier, paramétrage) | Formulaires clairs, pas de risque d'erreur sur les champs obligatoires (code, photo). |

---

## 3. Parcours utilisateur (User Journeys)

### 3.1 Gardien — Enregistrer une entrée (parcours critique)

```
1. Le coursier se présente à l'accueil.
2. Le gardien regarde la tablette (déjà allumée, déjà sur l'écran principal — jamais de veille pendant les heures de surveillance).
3. Il tape sur la carte du coursier (photo + code visibles directement, pas de menu à ouvrir).
4. Une confirmation contextuelle apparaît : "Confirmer l'ENTRÉE de [Photo] Jean K. (CE120) ?"
   → Le système propose l'action cohérente avec l'état actuel (US-12/13 du PRD).
5. Le gardien tape "Confirmer".
6. Feedback visuel immédiat (carte → verte, toast de confirmation) puis retour automatique à la grille.
```
**Nombre de taps : 2. Temps cible : < 3 secondes.**

### 3.2 Gardien — Corriger une erreur

```
1. Le gardien réalise une erreur (mauvais coursier, mauvaise action) dans les secondes qui suivent.
2. Il retape sur la même carte.
3. Le système affiche l'historique immédiat : "Dernière action : Entrée à 14h32 (il y a 40s)" avec une option "Annuler cette action".
4. Confirmation de l'annulation → la carte revient à son état précédent.
   → Passé 2 minutes (règle PRD section 9), l'option "Annuler" disparaît de la borne ; message : "Contactez la Gérante pour corriger cette action."
```

### 3.3 Gérante — Attribuer une course

```
1. Une nouvelle course arrive (par téléphone, radio, etc. — hors périmètre de l'app).
2. La gérante ouvre l'app (déjà en onglet ouvert ou notification reçue).
3. Elle voit immédiatement les coursiers disponibles, triés en premier dans la liste.
4. Elle identifie un coursier disponible et l'attribue (verbalement / par un autre canal — l'attribution elle-même est hors périmètre).
5. Optionnel : elle reçoit une notification push si un coursier vient d'arriver pendant qu'elle avait l'app fermée.
```
**Aucune action d'écriture requise sur cet écran — lecture seule, priorité à la vitesse de lecture.**

### 3.4 Super Administrateur — Onboarder un nouveau coursier

```
1. Accède à "Coursiers" > "Ajouter".
2. Renseigne le code unique (validation en direct : "déjà utilisé" si conflit).
3. Prend/téléverse la photo (obligatoire — le formulaire ne peut pas être soumis sans).
4. Assigne un profil horaire (pré-rempli avec le profil par défaut).
5. Assigne un site (pré-rempli si mode mono-site).
6. Valide → le coursier apparaît immédiatement sur la borne du site concerné.
```

### 3.5 Directeur — Consulter les statistiques

```
1. Ouvre le dashboard (vue identique à la Gérante, lecture seule, cf. PRD US-06).
2. Filtre par période / par site si multi-site actif.
3. Consulte l'historique détaillé si besoin d'investiguer un cas précis.
```

---

## 4. Écrans clés

### 4.1 Écran Borne — Grille principale (tablette, paysage recommandé)

```
┌──────────────────────────────────────────────────────────────┐
│  DISPO-COURSIER · Siège Abidjan          🔍 [Rechercher...]   │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│   ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐          │
│   │ [Photo]│   │ [Photo]│   │ [Photo]│   │ [Photo]│          │
│   │  🟢    │   │  🔴    │   │  🔴    │   │  🟢    │          │
│   │ CE120  │   │ CE104  │   │ CE118  │   │ CE099  │          │
│   └────────┘   └────────┘   └────────┘   └────────┘          │
│                                                                │
│   ┌────────┐   ┌────────┐                                    │
│   │ [Photo]│   │ [Photo]│                                    │
│   │  🔴    │   │  🟢    │                                    │
│   │ CE087  │   │ CE142  │                                    │
│   └────────┘   └────────┘                                    │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

**Principes de conception :**
- Carte = photo (dominante visuellement) + code + pastille d'état. Le nom est optionnel (paramètre Super Admin — utile si le gardien reconnaît mieux par nom que par code).
- **L'état n'est jamais codé uniquement par la couleur** (contrainte d'accessibilité, cf. section 6) : la pastille combine couleur ET forme/icône (● vert plein vs ○ rouge avec un contour distinct, ou icône ✓/✕).
- Grille responsive en `CSS grid`, taille de carte fixe minimale (~140×160px), le nombre de colonnes s'adapte automatiquement à la largeur — fonctionne aussi bien avec 6 coursiers qu'avec 60.
- Tri par défaut : par code croissant (ordre stable, mémorisable par le gardien — pas de tri "disponibles en premier" ici, car le gardien cherche une personne précise, pas une vue d'ensemble).
- Barre de recherche toujours présente mais discrète (petite, en haut) : à 6 coursiers elle est invisible dans l'usage, à 50+ elle devient indispensable — aucun changement d'écran nécessaire en grandissant.
- Écran jamais en veille pendant les horaires de surveillance (paramètre technique, cf. Architecture).

### 4.2 Écran Borne — Confirmation contextuelle

```
┌──────────────────────────────────────┐
│                                        │
│            [Photo grande]             │
│                                        │
│           Jean K. — CE120             │
│                                        │
│   ┌──────────────────────────────┐   │
│   │      Confirmer la SORTIE      │   │   ← action suggérée (grande, primaire)
│   └──────────────────────────────┘   │
│                                        │
│      Ce n'est pas ça → Entrée         │   ← lien secondaire, petit, discret
│                                        │
│              Annuler                  │
└──────────────────────────────────────┘
```

**Principes :**
- Une seule action primaire mise en avant (celle cohérente avec le dernier état connu) → réduit le parcours normal à 2 taps.
- Correction toujours possible en 1 tap supplémentaire, sans pénaliser le cas nominal.
- Bouton verrouillé (spinner + désactivation) pendant l'envoi, pour empêcher un double-tap de créer un doublon d'événement.

### 4.3 Écran Borne — Feedback post-action

```
┌──────────────────────────────────────┐
│   ✓  Sortie enregistrée               │
│      Jean K. — 14:32                  │
└──────────────────────────────────────┘
   (toast, disparaît après 1,5s,
   retour automatique à la grille)
```

### 4.4 Écran Gérante — Vue disponibilité (mobile & desktop)

```
Mobile (portrait, prioritaire) :
┌───────────────────────┐
│ DISPO-COURSIER    🔔3 │
│ Siège Abidjan ▾        │
├───────────────────────┤
│ ⚠ 4 coursiers          │
│   disponibles          │
├───────────────────────┤
│ 🟢 Jean K.    CE120    │
│    Disponible depuis   │
│    14:32                │
├───────────────────────┤
│ 🟢 Awa D.     CE099    │
│    Disponible depuis   │
│    13:50                │
├───────────────────────┤
│ 🔴 Koffi A.   CE104    │
│    Absent depuis       │
│    11:15                │
└───────────────────────┘
```

**Principes :**
- **Tri par défaut : disponibles en premier** (contrairement à la borne) — c'est la question à laquelle cet écran répond en priorité.
- Bandeau d'alerte visible en haut ("X disponibles" ou "Aucun coursier disponible" en rouge si zéro — cf. règle de notification PRD US-10).
- Horodatage du dernier changement d'état, utile pour juger si une "disponibilité" est fraîche ou vieille de plusieurs heures.
- Sélecteur de site en haut si multi-site actif ; invisible en mode mono-site (pas de complexité inutile affichée).
- Desktop : même contenu, disposition en grille de cartes plus large plutôt qu'en liste verticale, mais **aucune information supplémentaire** — la parité mobile/desktop est totale (Mobile First strict, desktop = confort d'affichage, pas de fonctionnalité exclusive).

### 4.5 Écran de connexion (comptes)

```
┌───────────────────────┐
│     DISPO-COURSIER     │
│                         │
│  Identifiant            │
│  [______________]       │
│                         │
│  Mot de passe            │
│  [______________]       │
│                         │
│  ☐ Se souvenir de moi   │
│                         │
│  [   Se connecter   ]   │
└───────────────────────┘
```
Formulaire minimal, pas de "mot de passe oublié" en libre-service au MVP (petite équipe → réinitialisation gérée par le Super Admin ; à réévaluer si le nombre de comptes grandit).

---

## 5. Système visuel — Hiérarchie des états

| État | Couleur | Icône | Usage |
|---|---|---|---|
| Disponible | Vert (`#2E7D32` ou équivalent validé accessibilité — palette finale en phase Architecture/Design system) | ● plein / ✓ | Pastille, bordure de carte, bandeau |
| Non disponible | Rouge/gris foncé (`#C62828` ou équivalent) | ○ contour / ✕ | Pastille, bordure de carte |

**Règle stricte** : jamais de couleur seule pour porter l'information. Chaque état est doublé d'un texte explicite ("Disponible" / "Non disponible") au moins une fois visible à l'écran, en plus de l'icône. Ceci couvre le daltonisme (~8% des hommes) sans complexifier le design.

---

## 6. Mobile First / Responsive / Accessibilité

- **Mobile First strict** : chaque écran est conçu pour le plus petit format d'abord (téléphone pour Gérante/Directeur, tablette pour la Borne), puis adapté vers le haut. Aucune fonctionnalité n'est réservée au desktop.
- **Cibles tactiles** : minimum 44×44px (norme WCAG), renforcé à 64×64px minimum sur l'écran Borne pour un usage rapide et sans précision extrême.
- **Contraste** : toutes les combinaisons texte/fond respectent WCAG AA minimum (ratio 4.5:1 pour le texte standard).
- **Pas de dépendance à la couleur seule** (cf. section 5).
- **Feedback système** : toute action a un retour visuel **et** un retour textuel (jamais une simple animation silencieuse) — utile en environnement bruyant (accueil avec passage, appels).
- **Tailles de police** : lisibles à distance sur la tablette Borne (le gardien peut ne pas être penché directement sur l'écran) — corps de texte 16px minimum, code coursier en 20px+.

---

## 7. Frictions et cas limites UX identifiés

| Cas limite | Risque | Solution retenue |
|---|---|---|
| Double-tap rapide sur une carte (Borne) | Événement dupliqué (entrée enregistrée deux fois) | Verrouillage du bouton de confirmation pendant l'envoi + désactivation de la carte source pendant ~1s après action |
| Aucun coursier enregistré (site nouvellement créé) | Écran vide, confusion du gardien | État vide explicite : "Aucun coursier enregistré sur ce site — contactez votre administrateur" |
| Beaucoup de coursiers (croissance au-delà de 6) | Grille encombrée, recherche du bon coursier plus longue | Barre de recherche déjà en place dès le MVP (cf. 4.1) — aucune refonte nécessaire en grandissant |
| Gérante consulte l'app hors horaires de surveillance | Confusion sur la fiabilité de l'info affichée | Bandeau contextuel "Hors horaires de surveillance — dernier état connu affiché à titre indicatif" quand l'heure actuelle sort du profil horaire applicable |
| Zéro coursier disponible | Risque de ne pas être vu à temps | Bandeau rouge non-discret en haut de l'écran Gérante + notification push (cf. PRD US-10) |
| Erreur de saisie après la fenêtre de correction de 2 minutes | Gardien bloqué, pas de solution à la borne | Message explicite renvoyant vers la Gérante/Super Admin, pas d'échec silencieux |
| Tablette Borne verrouillée / mise en veille par le système d'exploitation | Interruption du service | Recommandation technique pour l'Architecture : configuration tablette en mode kiosque, désactivation de la mise en veille pendant les horaires de surveillance |

---

## 8. Handoff pour la phase Architecture

Points à transmettre explicitement au Software Architect :

- Le polling ~5-10s (décision PRD section 9) doit rester compatible avec une évolution vers du push instantané sans changement de contrat d'API côté frontend (prévoir un endpoint qui pourrait être consommé aussi bien en polling qu'en souscription).
- La fenêtre d'annulation de 2 minutes à la Borne doit être une valeur de configuration, pas une constante en dur.
- Le mode kiosque de la tablette (pas de veille, pas de sortie d'app) est une contrainte de déploiement à documenter, pas seulement une contrainte logicielle.
- Palette de couleurs définitive et tokens de design à valider avec le skill `dataviz`/design system avant l'implémentation (les couleurs indiquées en section 5 sont indicatives, pas finales).

---

## 9. Validation

Cette phase doit être validée par le client avant le passage à la phase **Architecture (Software Architect)**.
