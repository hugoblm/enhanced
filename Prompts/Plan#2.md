Plan — Documentation complète Enhanced V1

 Contexte

 Le brief produit d'Enhanced V1 est complet. Enhanced est un wizard conversationnel qui guide les PMs à travers une validation structurée de leurs hypothèses avant de
 builder. L'objectif est une V1 fonctionnelle pour une démo en webinaire devant des PMs.

 Ce plan couvre la rédaction de toute la documentation requise par le workflow documentation-first : Discovery (FOCUSED) → Gate → Initiative (PRD + executive summary) → 9
 features avec l'ensemble des documents de delivery (stories, Gherkin, manual tests, UX/a11y, tech specs complètes avec décisions d'architecture, release plan, test plan).

 Décisions confirmées :
 - 9 features — validé par le user
 - Specs techniques complètes avec décisions d'architecture (schéma DB, API routes, composants, prompts AI)
 - Pas besoin d'attendre le design UX — le brief est suffisamment détaillé

 ---
 Phase 1 — Discovery

 Fichier : docs/discovery/enhanced-wizard-v1.md

 Rédiger le document FOCUSED complet à partir du brief :
 - Scope : Lié à l'objectif de valider les hypothèses produit avant de builder
 - Immerse : Le problème (l'IA accélère le build, pas la validation), JTBD, First Use Case, signals
 - Pitch : La promesse en une phrase
 - Inspire : Benchmarks (Notion AI, Linear, ProductBoard, etc.)
 - Map : Le wizard 4 étapes + split-view
 - Craft : Pourquoi cette forme de solution
 - Test : Les 4 risques (valeur, utilisabilité, faisabilité, viabilité)
 - Follow : Métriques post-launch
 - Gate : Decision Go justifiée

 Discipline d'évidence :
 - Le brief EST la source d'évidence → [Evidence] pour les observations sourcées (le problème, le comportement des équipes)
 - [Assumption] pour les hypothèses non prouvées (taux de conversion, wow effect, comportement PM)
 - [To verify] pour les questions ouvertes
 - Challenge blocks remplis honnêtement

 ---
 Phase 2 — Initiative

 Dossier : docs/initiative/enhanced-wizard-v1/

 3 documents initiative-level :

 1. README.md — Vue d'ensemble, lien discovery, index des 9 features avec statuts
 2. executive-summary.md — TL;DR stakeholders (2 min de lecture), le besoin, la solution, la valeur, le scope
 3. prd.md — PRD complet :
   - Gate (lien discovery validée)
   - Introduction (JTBD, First Use Case, objectifs, vision)
   - Target audience (PM en startup/scale-up, profils producteur/consommateur du PRD)
   - Problems & solutions
   - Benchmark (Notion AI, Linear, ProductBoard, Coda AI, etc.)
   - Feature breakdown (la table des 9 features — le pont entre le besoin et ce qu'on build)
   - Requirements MoSCoW
   - Contraintes techniques (Next.js 16, Supabase, Vercel AI SDK, OpenRouter)
   - Success criteria (North Star : features non-buildées, OKRs, KPIs)
   - Risks & assumptions
   - MVP definition

 ---
 Phase 3 — Feature Breakdown (9 features)

 ┌─────┬─────────────────────┬─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┬──────────┬──────────┐
 │  #  │       Feature       │                                                     Valeur                                                      │ Priorité │ Séquence │
 ├─────┼─────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼──────────┼──────────┤
 │ 1   │ landing-page        │ Homepage minimaliste, textarea, entrée sans friction, pas de signup                                             │ MUST     │ 1        │
 ├─────┼─────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼──────────┼──────────┤
 │ 2   │ deferred-auth       │ Magic link en fin d'étape 1, transition anonyme→authentifié, préservation session                               │ MUST     │ 2        │
 ├─────┼─────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼──────────┼──────────┤
 │ 3   │ wizard-shell        │ Split-view desktop (conv gauche / PRD droite), navigation 4 étapes, responsive                                  │ MUST     │ 3        │
 ├─────┼─────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼──────────┼──────────┤
 │ 4   │ conversation-engine │ Conversation AI guidée via OpenRouter, tool ask_user (5 types de cartes), logique des 4 étapes, prompts système │ MUST     │ 4        │
 ├─────┼─────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼──────────┼──────────┤
 │ 5   │ prd-live-builder    │ Artefact PRD construit en temps réel via tool update_prd, section par section, evidence tags                    │ MUST     │ 5        │
 ├─────┼─────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼──────────┼──────────┤
 │ 6   │ block-refinement    │ Bouton ✨ Refine au hover, re-prompt en langage naturel, régénération par block                                 │ MUST     │ 6        │
 ├─────┼─────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼──────────┼──────────┤
 │ 7   │ prd-versioning      │ Version auto sur chaque génération/refine, historique consultable                                               │ COULD    │ 7        │
 ├─────┼─────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼──────────┼──────────┤
 │ 8   │ pdf-export          │ PDF branded Enhanced via @react-pdf/renderer, fonts Obra embarquées                                             │ MUST     │ 8        │
 ├─────┼─────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼──────────┼──────────┤
 │ 9   │ public-sharing      │ Lien enhanced.pm/p/[slug] nanoid, SSR, OG meta, lecture seule sans compte                                       │ MUST     │ 9        │
 └─────┴─────────────────────┴─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┴──────────┴──────────┘

 Logique du découpage :

 - Les 4 étapes du wizard restent dans une seule feature conversation-engine (même logique conversationnelle, même tool system)
 - Le PRD builder est séparé de la conversation (système de rendering distinct, tool update_prd distinct)
 - conversation-engine est la plus grosse feature — si elle s'avère trop complexe à l'implémentation, elle pourra être split en wizard-flow (logique AI/prompts) +
 interaction-cards (UI des 5 types de cartes)

 ---
 Phase 4 — Documents par feature

 Pour chaque feature, créer docs/initiative/enhanced-wizard-v1/features/<name>/ avec :

 <name>/
 ├── README.md
 ├── product/
 │   ├── user-stories-and-jtbd.md
 │   ├── gherkin-tests.md
 │   ├── manual-tests.md
 │   └── ux-accessibility.md
 └── tech/
     ├── technical-spec.md       (overview + index)
     ├── data-model.md           (si données persistées)
     ├── api.md                  (si API/interface)
     ├── security.md             (si auth/accès)
     ├── ai-integration.md       (si logique AI)
     ├── release-plan.md
     └── test-plan.md

 Sub-specs par feature :

 ┌─────────────────────┬───────────────────────────────────┬─────────────────────────────┬──────────────────────────────────┬────────────────────────────┐
 │       Feature       │            data-model             │             api             │             security             │       ai-integration       │
 ├─────────────────────┼───────────────────────────────────┼─────────────────────────────┼──────────────────────────────────┼────────────────────────────┤
 │ landing-page        │ —                                 │ —                           │ —                                │ —                          │
 ├─────────────────────┼───────────────────────────────────┼─────────────────────────────┼──────────────────────────────────┼────────────────────────────┤
 │ deferred-auth       │ profiles, sessions (anonymous_id) │ auth callback, claimSession │ RLS, magic link, httpOnly cookie │ —                          │
 ├─────────────────────┼───────────────────────────────────┼─────────────────────────────┼──────────────────────────────────┼────────────────────────────┤
 │ wizard-shell        │ —                                 │ —                           │ —                                │ —                          │
 ├─────────────────────┼───────────────────────────────────┼─────────────────────────────┼──────────────────────────────────┼────────────────────────────┤
 │ conversation-engine │ messages                          │ POST /api/chat (streaming)  │ —                                │ tools, prompts, step logic │
 ├─────────────────────┼───────────────────────────────────┼─────────────────────────────┼──────────────────────────────────┼────────────────────────────┤
 │ prd-live-builder    │ prds, prd_blocks                  │ —                           │ —                                │ tool update_prd            │
 ├─────────────────────┼───────────────────────────────────┼─────────────────────────────┼──────────────────────────────────┼────────────────────────────┤
 │ block-refinement    │ —                                 │ POST /api/refine            │ —                                │ re-prompt logic            │
 ├─────────────────────┼───────────────────────────────────┼─────────────────────────────┼──────────────────────────────────┼────────────────────────────┤
 │ prd-versioning      │ prd_versions                      │ GET /api/prd/[id]/versions  │ —                                │ —                          │
 ├─────────────────────┼───────────────────────────────────┼─────────────────────────────┼──────────────────────────────────┼────────────────────────────┤
 │ pdf-export          │ —                                 │ GET /api/export/[id]/pdf    │ —                                │ —                          │
 ├─────────────────────┼───────────────────────────────────┼─────────────────────────────┼──────────────────────────────────┼────────────────────────────┤
 │ public-sharing      │ —                                 │ page /p/[slug] (SSR)        │ accès public RLS                 │ —                          │
 └─────────────────────┴───────────────────────────────────┴─────────────────────────────┴──────────────────────────────────┴────────────────────────────┘

 ---
 Architecture technique (décisions prises)

 Schéma DB (Supabase Postgres)

 5 tables principales :
 - profiles — Miroir auth.users, RLS auth.uid() = id
 - sessions — Wizard sessions, user_id nullable (deferred auth), anonymous_id pour pré-auth, current_step 1-4, raw_idea
 - messages — Conversation, session_id FK, step, role, content, tool_calls JSONB, tool_results JSONB
 - prds — Document PRD, session_id FK, share_slug unique (nanoid), is_public, confidence_score, recommendation
 - prd_blocks — Sections du PRD, prd_id FK, block_type enum (12 types), content, evidence_tags JSONB, sort_order
 - prd_versions — Historique, prd_id FK, block_id FK nullable, version_number, content_snapshot, trigger

 API Routes

 - POST /api/chat — Conversation AI streaming (streamText + createUIMessageStreamResponse)
 - POST /api/refine — Block refinement streaming
 - GET /api/export/[prdId]/pdf — PDF generation
 - GET /api/prd/[prdId]/versions — Version history
 - Server Actions : createSession, claimSession, advanceStep

 Composants clés

 - src/components/wizard/wizard-shell.tsx — Split-view layout
 - src/components/chat/card-renderer.tsx → 5 card components
 - src/components/prd/prd-viewer.tsx + prd-block.tsx + refine-popover.tsx
 - src/lib/ai/tools.ts — ask_user (client-resolved, pas d'execute) + update_prd (server-resolved)
 - src/lib/ai/prompts/step-{1,2,3,4}.ts — System prompts par étape
 - src/stores/wizard-store.ts — Zustand (PRD blocks cache + UI state)

 Deferred auth flow

 1. Landing → createSession(rawIdea, anonymousId) → cookie httpOnly
 2. Wizard fonctionne via anonymous_id
 3. Fin étape 1 → modal magic link
 4. Auth callback → claimSession() → UPDATE sessions/prds SET user_id, anonymous_id = NULL

 ---
 Exécution — Stratégie d'agents parallèles

 Vague 1 : Discovery + Executive Summary

 - Agent 1 : Discovery FOCUSED (docs/discovery/enhanced-wizard-v1.md)
 - Agent 2 : Executive Summary (docs/initiative/enhanced-wizard-v1/executive-summary.md)

 Vague 2 : Initiative README + PRD

 - Agent 1 : PRD complet avec feature breakdown
 - Agent 2 : Initiative README avec index features

 Vague 3 : Features product docs (3 agents × 3 features)

 - Agent 1 : landing-page + wizard-shell + block-refinement (features plus simples)
 - Agent 2 : deferred-auth + prd-versioning + pdf-export
 - Agent 3 : conversation-engine + prd-live-builder + public-sharing (features plus complexes)

 Chaque agent produit pour ses features : README, user-stories, gherkin-tests, manual-tests, ux-accessibility

 Vague 4 : Features tech specs (3 agents × 3 features)

 - Même répartition, chaque agent produit : technical-spec, sub-specs (data-model, api, security, ai-integration), release-plan, test-plan

 ---
 Volume estimé

 ┌─────────────────────────────────────────────┬───────────────┐
 │                    Type                     │    Nombre     │
 ├─────────────────────────────────────────────┼───────────────┤
 │ Discovery                                   │ 1             │
 ├─────────────────────────────────────────────┼───────────────┤
 │ Initiative-level docs                       │ 3             │
 ├─────────────────────────────────────────────┼───────────────┤
 │ Feature READMEs                             │ 9             │
 ├─────────────────────────────────────────────┼───────────────┤
 │ Product docs (stories, gherkin, manual, UX) │ 36            │
 ├─────────────────────────────────────────────┼───────────────┤
 │ Tech specs (overview + sub-specs)           │ ~22           │
 ├─────────────────────────────────────────────┼───────────────┤
 │ Release plans                               │ 9             │
 ├─────────────────────────────────────────────┼───────────────┤
 │ Test plans                                  │ 9             │
 ├─────────────────────────────────────────────┼───────────────┤
 │ Total                                       │ ~89 documents │
 └─────────────────────────────────────────────┴───────────────┘

 ---
 Vérification

 Avant de marquer le travail comme terminé :

 1. Structure — Chaque document suit exactement son template source
 2. Evidence — Tous les claims taggés [Evidence], [Assumption], ou [To verify]
 3. Challenge blocks — Tous remplis honnêtement
 4. Traçabilité — US-id → Gherkin scenario → test plan (matrice complète)
 5. Cohérence — PRD feature breakdown = README initiative index = dossiers features/ créés
 6. Complétude — Chaque feature MUST a tous ses docs obligatoires
 7. Architecture — Les specs techniques sont cohérentes entre features (même schéma DB, mêmes conventions API)
 8. Pas de .ai-context à mettre à jour — Aucun code n'est modifié, uniquement des docs