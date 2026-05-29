# Enhanced

> Pitche ton idée produit. Enhanced la transforme en **draft PRD structuré et challengé par la data**.

Enhanced est un wizard conversationnel qui guide les équipes produit à travers la **validation
d'hypothèses avant de construire** : il reformule une idée en problème utilisateur, sépare ce qui
est *prouvé* de ce qui est *supposé*, et explicite ce qu'il faudra démontrer avant d'écrire la
première ligne de code.

Principes directeurs : **rigueur plutôt que vitesse**, **preuve plutôt qu'opinion**, **simplicité**.

> ⚠️ **Statut : démo V1.** Le dépôt est public le temps de la démo. La persistance est locale au
> navigateur (IndexedDB) et il n'y a pas d'authentification — voir [Déviations V1](#déviations-v1-démo).

---

## Démarrage rapide

Prérequis : **Node 22+**.

```bash
npm install        # installer les dépendances
npm run dev        # serveur de dev → http://localhost:3000
npm run build      # build de production
npm run lint       # ESLint
npm run test       # tests (Vitest)
```

Variable d'environnement requise (fichier `.env.local`) :

```bash
OPENROUTER_API_KEY=...        # clé OpenRouter (appels au modèle)
OPENROUTER_MODEL=...          # ex. anthropic/claude-sonnet-4.6 
```

---

## Stack

| Domaine | Techno |
|---|---|
| Framework | Next.js 16 (App Router), TypeScript strict |
| UI | shadcn/ui + Tailwind CSS v4, police Geist |
| IA | Vercel AI SDK + OpenRouter |
| Persistance (V1 démo) | Dexie (IndexedDB), navigateur |
| Validation | Zod + React Hook Form |
| État | Zustand |
| Déploiement | Vercel |

---

## Comment on construit le produit (documentation-first)

Rien n'est codé avant que le besoin soit qualifié et écrit. Le flux est un entonnoir où chaque
étape conditionne la suivante :

```
1. DISCOVERY      2. GATE       3. INITIATIVE              4. FEATURES            5. DELIVERY
   "devrait-on ?" Go/No-Go      PRD: besoin → features     une par capacité       specs + tests
```

1. **Discovery** — challenge et vérifie le besoin (framework FOCUSED), se termine par un
   **Go / No-Go / Pivot**.
2. **Gate** — seul un *Go* débloque la suite (un *No-Go* est une discovery réussie : il évite de
   construire la mauvaise chose).
3. **Initiative** — sur Go, un **PRD** découpe le besoin en features priorisées.
4. **Features** — chaque feature a ses docs de delivery (stories, Gherkin, tests, UX, spec tech).
5. **Delivery** — les specs techniques détaillent le *comment*.

---

## 🗺️ Carte de la documentation

Deux systèmes de docs cohabitent — ne pas les confondre :

| Système | Répond à | Où |
|---|---|---|
| **`docs/`** | *Pourquoi* construit-on ça ? Quelle est la spec ? | discovery / initiative / template |
| **`.ai-context/`** | Quel est l'**état actuel du code** à respecter ? | racine `.ai-context/` |

### Point d'entrée
- **[`CLAUDE.md`](CLAUDE.md)** — guide pour tout contributeur (humain ou agent IA) : conventions,
  workflow Git, architecture des docs. **À lire en premier.**

### `docs/` — intention & spec
- **Discovery** : [`docs/discovery_wizard/enhanced-wizard-v1.md`](docs/discovery_wizard/enhanced-wizard-v1.md) — qualification du besoin (FOCUSED).
- **Initiative** : [`docs/initiative_wizard/`](docs/initiative_wizard/)
  - [`README.md`](docs/initiative_wizard/README.md) — vue d'ensemble de l'initiative
  - [`prd.md`](docs/initiative_wizard/prd.md) — PRD (besoin → features)
  - [`architecture.md`](docs/initiative_wizard/architecture.md) — architecture
  - [`decisions.md`](docs/initiative_wizard/decisions.md) — journal de décisions (incl. déviations V1)
  - [`executive-summary.md`](docs/initiative_wizard/executive-summary.md) — résumé exécutif
  - [`security-overview.md`](docs/initiative_wizard/security-overview.md) — vue sécurité
  - [`features/`](docs/initiative_wizard/features/) — docs de delivery par feature
- **Templates** : [`docs/template/`](docs/template/) — modèles réutilisables (discovery, PRD, règles, stories).
- **Design** : [`docs/enhanced_design_wizard/`](docs/enhanced_design_wizard/) — références de design.

### `.ai-context/` — état réel du code (pour développer)
- **[`.ai-context/README.md`](.ai-context/README.md)** — carte de navigation + invariants transverses.
- [`stack.md`](.ai-context/stack.md) — stack et configuration.
- [`conversation-engine.md`](.ai-context/conversation-engine.md) — moteur de conversation du wizard (chat, tools, étapes).
- [`prd-live-builder.md`](.ai-context/prd-live-builder.md) — construction live du PRD.
- [`design-system.md`](.ai-context/design-system.md) — tokens & design system.
- [`refine.md`](.ai-context/refine.md) — raffinement de bloc PRD.

> Règle d'or : quand le code et `.ai-context/` divergent, **le code a raison** — on corrige la doc.

---

## Structure du dépôt

```
enhanced/
├── CLAUDE.md            # point d'entrée contributeurs/agents
├── .ai-context/         # état actuel du code (pour développer)
├── src/
│   ├── app/             # routes Next.js (App Router) + API (/api/chat, /api/refine)
│   ├── components/      # UI : wizard, chat, cards, prd, ui (shadcn)
│   ├── lib/             # ai (prompts/tools), db (Dexie), schemas (Zod), utils
│   └── stores/          # état Zustand du wizard
└── docs/                # discovery / initiative / templates / design
```

---

## Déviations V1 (démo)

Pour livrer la démo rapidement, la V1 s'écarte de la cible long terme sur deux points :

- **Persistance** : Dexie (IndexedDB) côté navigateur — pas de base serveur. Une session ouverte
  sur un autre appareil/navigateur ne retrouve pas les données.
- **Auth** : aucune. Le partage public et l'export PDF sont prévus mais désactivés.

La cible long terme (Supabase + magic link, RLS) sera réintroduite après la démo. Détails dans
[`docs/initiative_wizard/decisions.md`](docs/initiative_wizard/decisions.md).
