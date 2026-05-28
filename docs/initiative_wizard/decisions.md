# Decision Log — Initiative Wizard

> **Journal chronologique** des décisions structurantes de l'initiative wizard.
> Chaque entrée tient sur 1 écran : contexte court, décision claire, conséquences,
> plan de retour si réversible, liens vers les docs impactées.
>
> **Comment utiliser ce doc :**
> - Avant de lire une spec de feature (`features/<name>/`), vérifie ici si une décision en cours
>   modifie son scope ou son implémentation pour la livraison actuelle.
> - Les specs (`prd.md`, `architecture.md`, `features/<name>/tech/*`) décrivent la **cible long terme**.
>   Ce journal documente les **écarts assumés** entre cette cible et ce qu'on livre vraiment.
> - Quand une décision est revue ou annulée, on **n'efface pas** l'entrée : on en ajoute une nouvelle
>   (`Statut: Superseded by 2026-XX-XX`) et on linke.

---

## Format d'une entrée

```
## YYYY-MM-DD — <Titre court et explicite>

**Statut :** Proposé | Accepté | Superseded by <date>
**Auteur :** <nom>
**Décideur(s) :** <nom>

### Contexte
2-3 lignes : qu'est-ce qui a déclenché cette décision ? quel problème elle adresse ?

### Décision
2-4 lignes : ce qu'on fait, concrètement.

### Conséquences
- **Positives :** …
- **Négatives / coûts :** …

### Plan de retour (si réversible)
Étapes concrètes pour annuler la décision plus tard.

### Docs impactées
- [lien relatif](./path/to/doc.md) — nature de l'impact
```

---

## 2026-05-28 — Skip de la Feature 2 « Deferred Auth » pour la V1 démo

**Statut :** Accepté
**Auteur :** Hugo
**Décideur(s) :** Hugo

### Contexte
La V1 sera montrée en démo publique quelques heures, avec un crédit OpenRouter volontairement bas
qui coupe l'accès une fois consommé. Mettre en place l'auth magic link (modal, OTP, callback,
`claimSession` server action, RLS adaptées) n'apporte aucun bénéfice produit dans ce cadre.

### Décision
La feature `deferred-auth` (PRD §5, ligne 643+) **est reportée intégralement** au-delà de la V1 démo.
Toutes ses sous-tâches (AuthGate modal, magic link, `/auth/confirm` route, `claimSession`) sont
gelées. La V1 reste anonyme du début à la fin de la session.

### Conséquences
- **Positives :**
  - -8 commits estimés pour la V1
  - Plus de modale auth intrusive pendant la démo
  - Suppression d'un mode (anonyme→authentifié) qui complique les tests
- **Négatives / coûts :**
  - Pas de persistance multi-device : un user qui ferme l'onglet et revient sur un autre device
    perd sa session
  - Pas de tracking d'utilisateurs identifiés post-démo
  - Pas de migration vers utilisateurs réels — feature à refaire entièrement quand on relancera

### Plan de retour
1. Désarchiver `features/deferred-auth/` (la spec est complète).
2. Réintroduire `@supabase/ssr` côté Next (ou un Supabase Auth client équivalent).
3. Suivre `features/deferred-auth/tech/release-plan.md` tel quel.
4. Mettre à jour `decisions.md` avec une entrée « Réintroduction Deferred Auth ».

### Docs impactées
- [`features/deferred-auth/README.md`](./features/deferred-auth/README.md) — DEFERRED post-démo
- [`prd.md`](./prd.md) §5 Feature breakdown — la Feature 2 est gelée
- [`executive-summary.md`](./executive-summary.md) — mention "deferred magic-link" à comprendre comme post-démo

---

## 2026-05-28 — Drop complet de Supabase, persistance Dexie pour la V1 démo

**Statut :** Accepté
**Auteur :** Hugo
**Décideur(s) :** Hugo

### Contexte
Conséquence directe de la décision précédente. Sans auth, la table `sessions` n'est plus relue
après son INSERT : la RLS SELECT compare `anonymous_id` à un claim `sub` JWT qui n'existe pas pour
les anon clients. Tester `/session/[id]` après le redirect renvoie `notFound()` parce que le SELECT
côté `page.tsx` est vide. Le wizard a besoin de persistance, mais pas de serveur : un IndexedDB
local via Dexie fait le job (refresh ok, offline ok, zéro migration à pousser).

Architecture cible mentionnée par l'utilisateur : *hybride Supabase (sessions) + Dexie (messages,
prd_blocks) + /api/chat stateless DB*. Évaluée puis écartée : sans auth, garder Supabase pour
1 INSERT jamais relu ajoute de la complexité (cookies, RLS, migrations, deux mondes de persistance)
sans bénéfice produit pour la démo.

### Décision
- **Persistance V1 démo : 100 % Dexie (IndexedDB)** côté client.
- Suppression complète du code Supabase : `src/lib/supabase/*`, `src/app/actions/session.ts`,
  `src/middleware.ts` (Supabase part), `supabase/migrations/*`, deps `@supabase/ssr` et
  `@supabase/supabase-js`, env vars `NEXT_PUBLIC_SUPABASE_*`.
- Schéma Dexie V1 : **une seule table** `sessions` (id, rawIdea, currentStep, status, createdAt,
  updatedAt). Les tables `messages` et `prd_blocks` arriveront avec les Features 4 et 5.
- `page.tsx` (Server Component) devient un simple validateur de format UUID ; l'hydratation Dexie
  se fait dans `wizard-client.tsx` (Client) via `useEffect`.

### Conséquences
- **Positives :**
  - Zéro migration SQL à pousser, zéro RLS dance, zéro cookie session, zéro service role
  - Démo fonctionne offline et survit aux refresh
  - Code wizard-shell drastiquement simplifié (un seul source de vérité côté client)
  - Pattern reproductible pour les Features 4 et 5 (mêmes outils, même DB)
- **Négatives / coûts :**
  - Pas de partage d'URL utile : Dexie est local au navigateur, partager `/session/{id}`
    avec quelqu'un d'autre lui renvoie un état "Session introuvable"
  - Pas de trace serveur d'usage (analytics passives perdues — PostHog couvrira plus tard)
  - Réintroduire Supabase post-démo demandera de re-écrire le contrat de persistance (mais
    les specs `features/*/tech/*` restent valides comme cible)

### Plan de retour
1. Réinstaller `@supabase/ssr` + `@supabase/supabase-js` (le projet distant `gzuhqxzvapnalztkoaca`
   est intact).
2. Re-créer `src/lib/supabase/{client,server,middleware}.ts` (les versions précédentes sont dans
   l'historique git).
3. Réappliquer les migrations existantes via `npx supabase db push` (les fichiers sont dans
   l'historique git).
4. Refactor `pitch-form.tsx` pour réutiliser une server action `createSession`.
5. Refactor `wizard-client.tsx` pour recevoir la session en props (au lieu de Dexie).
6. Ajouter une stratégie de migration Dexie → Supabase pour les sessions in-flight des users démo
   (probablement à jeter).

### Docs impactées
- [`prd.md`](./prd.md) — Tech Stack ; toutes les mentions Supabase à lire dans le contexte de la cible long terme
- [`architecture.md`](./architecture.md) §3 DB Schema — schéma Postgres = cible long terme, V1 = Dexie
- [`security-overview.md`](./security-overview.md) — toute la matrice RLS s'applique post-démo, pas en V1
- [`executive-summary.md`](./executive-summary.md) — ligne tech stack
- [`features/landing-page/README.md`](./features/landing-page/README.md) — `createSession` server action → write Dexie côté client
- [`features/wizard-shell/README.md`](./features/wizard-shell/README.md) — `page.tsx` simplifié, hydratation Dexie dans `wizard-client.tsx`
- [`features/conversation-engine/README.md`](./features/conversation-engine/README.md) — tools `ask_user` / `update_prd` deviennent client-resolved ; `/api/chat` stateless DB
- [`features/prd-live-builder/README.md`](./features/prd-live-builder/README.md) — writes Dexie au lieu de Supabase
- [`features/block-refinement/README.md`](./features/block-refinement/README.md) — opère sur Dexie en V1
- [`features/public-sharing/README.md`](./features/public-sharing/README.md) — feature reportée post-démo (Dexie local empêche le partage)
- [`features/prd-versioning/README.md`](./features/prd-versioning/README.md) — feature reportée post-démo (snapshots Dexie possibles mais hors scope V1)
- [`features/pdf-export/README.md`](./features/pdf-export/README.md) — lit Dexie en V1 (contrat de données stable)
- [`.ai-context/README.md`](../../.ai-context/README.md) — source de vérité de l'état réel du code
- [`CLAUDE.md`](../../CLAUDE.md) — Tech Stack table

---

<!-- Ajouter ici les futures décisions, ordre chronologique inversé (plus récente en haut, ou en bas — convention à figer si plusieurs auteurs). -->
