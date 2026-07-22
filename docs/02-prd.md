# PRD — DISPO-COURSIER

**Statut** : Validé (2026-07-22)
**Basé sur** : [01-product-discovery.md](./01-product-discovery.md) (validé le 2026-07-22)
**Client** : IVOIRRAPID
**Auteur** : Product Manager (orchestration Lead Product Engineer)

---

## 1. Résumé exécutif

DISPO-COURSIER répond à une seule question métier : **quels coursiers sont physiquement présents au siège en ce moment ?** Le produit n'est ni un outil de suivi de livraison, ni un logiciel RH, ni un système de géolocalisation. C'est un outil de visibilité opérationnelle instantanée, alimenté par une borne tablette à l'accueil, consultée par la Gérante des courses pour attribuer les courses efficacement.

**Métrique de succès attendue** : réduction du délai entre l'arrivée d'une course et l'attribution à un coursier disponible. *(à quantifier avec le client — cf. section 9, questions ouvertes)*

---

## 2. Rôles et périmètre d'accès

| Rôle | Authentification | Peut faire |
|---|---|---|
| Super Administrateur | Identifiant + mot de passe | CRUD coursiers, gestion des comptes/rôles, gestion des profils horaires, gestion des sites, paramètres globaux |
| Directeur | Identifiant + mot de passe | Consultation dashboard, statistiques, historique, notifications. Paramètre multi-site (activation du rattachement d'un coursier à plusieurs sites). **Aucune action d'entrée/sortie.** |
| Gérante des courses | Identifiant + mot de passe | Consultation de la disponibilité temps réel, consultation de l'historique, réception des notifications. **Aucune action d'entrée/sortie** (ce n'est pas elle qui gère la borne). |
| Borne (gardien) | Aucun compte — identité = terminal (device) | Enregistrement Entrée / Sortie d'un coursier, après vérification visuelle |

---

## 3. User Stories & critères d'acceptation

### 3.1 Super Administrateur

**US-01 — Créer un coursier**
> En tant que Super Administrateur, je veux créer une fiche coursier avec un code unique et une photo, afin qu'il puisse être identifié sur la borne.

Critères d'acceptation :
- Le code coursier est obligatoire, unique dans le système, format libre validé à la création (ex. CE120).
- La photo est obligatoire à la création.
- Les autres champs (nom, téléphone, etc.) sont facultatifs.
- Un code déjà utilisé (y compris par un coursier désactivé) est rejeté avec message explicite.
- Le coursier créé est rattaché à un site (site par défaut si mode mono-site).

**US-02 — Modifier / désactiver un coursier**
> En tant que Super Administrateur, je veux modifier ou désactiver un coursier, afin de garder la base à jour sans perdre l'historique.

Critères d'acceptation :
- La désactivation masque le coursier de la borne mais conserve tout son historique.
- Un coursier désactivé n'apparaît plus dans les statistiques "temps réel" mais reste consultable dans l'historique.
- La suppression définitive n'est pas exposée dans le parcours standard (action distincte, restreinte, avec confirmation renforcée) — cf. règle métier 4.7 du Discovery.

**US-03 — Définir des profils horaires**
> En tant que Super Administrateur, je veux créer des profils horaires réutilisables (ex. "Journée complète", "Demi-journée matin", "Samedi"), afin de les assigner aux coursiers sans redéfinir un horaire à chaque fois.

Critères d'acceptation :
- Un profil horaire a : nom, heure de début, heure de fin, jours de la semaine applicables.
- Un profil par défaut "08h00–17h30, Lundi-Vendredi" existe à l'installation.
- Un coursier a toujours exactement un profil horaire actif à un instant donné.
- La modification d'un profil horaire s'applique à tous les coursiers qui y sont rattachés (pas de duplication silencieuse).

**US-04 — Gérer les comptes et rôles**
> En tant que Super Administrateur, je veux créer des comptes Directeur/Gérante/Super Admin, afin de contrôler les accès.

Critères d'acceptation :
- Chaque compte a un identifiant unique et un mot de passe (règles de robustesse minimales à définir en Architecture).
- Un rôle détermine les permissions ; un compte a exactement un rôle.
- Un compte désactivé ne peut plus se connecter mais son nom reste visible dans l'historique des actions passées.

**US-05 — Gérer les sites**
> En tant que Super Administrateur, je veux créer/paramétrer des sites, afin de préparer l'organisation multi-site.

Critères d'acceptation :
- Mode "site unique" actif par défaut à l'installation (un seul site pré-créé, non supprimable).
- Ajouter un site est possible même en mode mono-site (bascule vers multi-site).
- Chaque borne est rattachée à exactement un site.

---

### 3.2 Directeur

**US-06 — Consulter le dashboard**
> En tant que Directeur, je veux voir en un coup d'œil le nombre de coursiers disponibles / non disponibles, afin d'avoir une vision globale sans agir.

Critères d'acceptation :
- Vue lecture seule, aucun bouton d'action Entrée/Sortie.
- Si multi-site actif, vue globale tous sites + filtre par site.

**US-07 — Activer le rattachement multi-site d'un coursier**
> En tant que Directeur, je veux autoriser un coursier à être rattaché à plusieurs sites, afin de refléter une organisation plus flexible.

Critères d'acceptation :
- Paramètre au niveau du coursier (pas un interrupteur global uniquement) : "peut être rattaché à plusieurs sites : oui/non".
- Tant que le paramètre est désactivé, le comportement mono-site actuel s'applique sans changement.
- *(Portée : ce paramètre est livré au MVP, mais son usage réel — un coursier effectivement rattaché à 2+ sites — est une évolution post-MVP. Cf. section 8.)*

**US-08 — Consulter les statistiques et l'historique**
> En tant que Directeur, je veux consulter l'historique des présences sur une période donnée, afin d'analyser les tendances.

Critères d'acceptation :
- Filtrable par coursier, par site, par période.
- Inclut les événements annulés, marqués comme tels (jamais masqués).

---

### 3.3 Gérante des courses

**US-09 — Voir la disponibilité en temps réel**
> En tant que Gérante, je veux voir immédiatement quels coursiers sont disponibles, afin d'attribuer une course sans délai.

Critères d'acceptation :
- Écran principal = liste/grille des coursiers avec statut visuel clair (🟢/🔴), photo, code.
- Mise à jour en temps réel (ou quasi temps réel — délai acceptable à définir en Architecture) sans rechargement manuel.
- Si multi-site actif, filtrage par site avec un site par défaut (celui de la Gérante).

**US-10 — Recevoir une notification**
> En tant que Gérante, je veux être notifiée quand un coursier arrive ou quand plus aucun coursier n'est disponible, afin de réagir sans surveiller l'écran en continu.

Critères d'acceptation :
- Notification Web Push (PWA + navigateur) par défaut.
- Règles de déclenchement minimales au MVP : (a) un coursier passe à Disponible, (b) le nombre de coursiers disponibles passe à zéro. *(Règles additionnelles = évolution, cf. section 8.)*
- L'utilisateur peut désactiver les notifications dans ses préférences.

**US-11 — Consulter l'historique**
> En tant que Gérante, je veux consulter l'historique des présences d'un coursier, afin de comprendre un désaccord ou un comportement récurrent.

Critères d'acceptation : identiques à US-08, en lecture seule.

---

### 3.4 Borne (Gardien)

**US-12 — Enregistrer une entrée**
> En tant que gardien, je veux enregistrer l'entrée d'un coursier en moins de 3 secondes, après l'avoir vu physiquement arriver, afin que le système reflète la réalité.

Critères d'acceptation :
- Écran principal = grille de cartes (photo + code, nom optionnel selon paramètre) de tous les coursiers actifs du site.
- Recherche simple par code/nom disponible (utile dès que le nombre de coursiers grandit ; non bloquant à 6 coursiers).
- Un tap sur une carte ouvre une confirmation à deux choix : Entrée / Sortie.
- Le bouton affiché correspond à l'action cohérente avec l'état actuel (ex. si déjà "Disponible", proposer "Sortie" en premier) — sans empêcher de forcer l'autre action en cas de correction.
- Confirmation immédiate visuelle (ex. carte passe au vert) après validation.
- Aucune authentification requise ; l'identité de l'action est celle du terminal (device ID), horodatée.

**US-13 — Enregistrer une sortie**
> Symétrique de US-12.

**US-14 — Corriger une erreur de saisie**
> En tant que gardien (ou Super Administrateur), je veux annuler une entrée/sortie erronée, afin que le statut affiché reflète la réalité sans perdre l'historique.

Critères d'acceptation :
- L'annulation crée un nouvel événement "Annulation" référençant l'événement annulé — l'original n'est jamais supprimé ni modifié.
- Après annulation, l'état du coursier redevient celui d'avant l'événement annulé.
- Qui peut annuler depuis la borne vs uniquement depuis un compte (Super Admin) est **à trancher** — cf. section 9.

---

## 4. Règles métier consolidées

1. **Deux états uniquement** : Disponible / Non disponible, dérivés du dernier événement non annulé.
2. **Pas de pause gérée** : toute sortie, même brève, est un événement Sortie complet.
3. **Validation humaine par le gardien**, aucune preuve numérique additionnelle (photo/PIN) requise au MVP.
4. **Fiabilité de l'affichage indépendante de la clôture automatique** : en dehors des horaires de surveillance du profil du coursier, ou si le dernier événement date de plus d'un jour, l'état affiché par défaut est Non disponible, quel que soit l'état brut en base.
5. **Historisation intégrale, aucune suppression.** Les annulations sont des événements, pas des suppressions.
6. **Profils horaires réutilisables**, assignés par coursier, pilotant la clôture automatique de fin de journée.
7. **Coursier-Site modélisé many-to-many en base**, contraint fonctionnellement à un seul site actif tant que le Directeur n'active pas le multi-site pour ce coursier.
8. **Notifications** : Web Push prioritaire par défaut ; canaux additionnels configurables en évolution.
9. **CRUD coursier** : code unique + photo obligatoires ; suppression définitive exceptionnelle et distincte de la désactivation.

---

## 5. Hors périmètre MVP (confirmé)

- Suivi des livraisons, tournées, missions.
- Géolocalisation / GPS.
- Gestion des motifs de sortie ou des pauses.
- Mode offline sur la borne.
- Rattachement effectif d'un coursier à plusieurs sites simultanément (le *paramètre* d'activation existe au MVP — US-07 — mais l'usage réel est post-MVP).
- Distinction d'identité entre plusieurs gardiens (rotation matin/soir) — l'historique trace le terminal, pas la personne.
- Écran dashboard différencié pour le Directeur (US-06 réutilise la vue Gérante en lecture seule).

---

## 6. Priorisation (MVP)

| Priorité | User Stories | Justification |
|---|---|---|
| **P0 — Cœur du produit** | US-09, US-12, US-13, US-01 | Sans ça, le produit ne répond pas à la question centrale. |
| **P1 — Indispensable à l'exploitation quotidienne** | US-02, US-03, US-04, US-05 (mode mono-site), US-14 | Sans ça, le produit fonctionne un jour mais n'est pas gérable dans la durée. |
| **P2 — Valeur ajoutée immédiate** | US-10, US-11, US-08, US-06 | Améliore la réactivité et la confiance, mais le produit "marche" sans. |
| **P3 — Prévu dans le modèle, activé plus tard** | US-07 (activation réelle du multi-site) | Le paramètre existe, l'usage métier réel n'est pas encore requis. |

---

## 7. Contraintes non-fonctionnelles

- **Mobile First / Responsive** : la borne cible une tablette ; les vues Gérante/Directeur doivent être pleinement utilisables sur smartphone.
- **PWA** : installable, notifications Web Push natives.
- **Performance** : parcours borne < 3 secondes du tap initial à la confirmation.
- **Sécurité** : authentification par mot de passe pour tous les comptes ; aucune donnée de présence exposée sans authentification (hors borne, qui n'expose que photo + code, pas de données sensibles).
- **Évolutivité** : modèle de données conçu pour supporter le multi-site sans migration structurelle majeure (cf. règle métier 7).

---

## 8. Roadmap produit (au-delà du MVP)

1. Mode offline sur la borne avec synchronisation différée.
2. Activation réelle du multi-site par coursier (au-delà du paramètre).
3. Distinction d'identité des gardiens (rotation d'équipe) dans l'historique.
4. Règles de notification avancées (ex. seuils personnalisés, alertes par site).
5. Dashboard Directeur différencié (KPIs propres, au-delà de la vue Gérante).

---

## 9. Décisions par défaut (validées par absence d'objection, ajustables)

Le client a validé le PRD sans trancher individuellement les 4 questions ouvertes. En tant que Lead Product Engineer, je fixe donc les hypothèses suivantes, documentées pour rester ajustables sans coût de refonte majeur :

1. **Annulation depuis la borne** : autorisée, mais limitée à une **fenêtre de 2 minutes** après l'action initiale (correction d'une erreur immédiate, ex. mauvais coursier sélectionné). Passé ce délai, l'annulation n'est plus accessible depuis la borne et doit passer par un compte authentifié (Gérante ou Super Admin) depuis l'historique. *Rationale : évite qu'une action ancienne soit modifiée par une personne non identifiée sur la borne, tout en gardant le geste correctif immédiat sans friction.*

2. **Mise à jour "temps réel" de l'écran Gérante** : **rafraîchissement automatique périodique (polling, ~5-10 secondes)** au MVP, plutôt qu'un push instantané (WebSocket/SSE). *Rationale : le besoin métier tolère quelques secondes de délai (la gérante n'agit pas à la seconde près), et le polling est nettement plus simple à opérer et à héberger de façon fiable qu'une architecture temps réel. Évolution vers push instantané possible sans refonte du modèle de données si le besoin se confirme trop lent en usage réel.*

3. **Métrique de succès** : je n'invente pas de métrique chiffrée fictive ici — le "temps d'attribution d'une course" n'est **pas mesurable par ce système**, puisque le suivi des courses est explicitement hors périmètre (cf. section 5). Métrique retenue par défaut, mesurable dans le périmètre actuel : **fréquence et fraîcheur des consultations de l'écran par la Gérante**, combinée à une **validation qualitative** (retour d'expérience de la Gérante après quelques semaines d'usage : "sait-elle plus vite qui est disponible ?"). *Recommandation : ne pas chercher à instrumenter un KPI précis tant que le système de gestion des courses n'est pas intégré — ce serait une fausse précision.*

4. **Politique de mot de passe et session** : minimum 8 caractères, pas de règle de complexité excessive imposée (contexte : petite équipe, priorité à l'ergonomie plutôt qu'à une politique de sécurité d'entreprise). Session active glissante de **12h** avant déconnexion automatique, avec option "se souvenir de moi" sur les comptes Gérante/Directeur pour un usage quotidien fluide. *Rationale : proportionné au niveau de risque réel (outil interne, pas de données financières ou personnelles sensibles au-delà des photos des coursiers).*

Ces 4 points restent **modifiables sur simple demande**, sans impact structurant sur l'architecture déjà prévue.

---

## 10. Validation

✅ PRD validé par le client le 2026-07-22. Passage à la phase suivante : **UX Research & UX/UI Design**.
