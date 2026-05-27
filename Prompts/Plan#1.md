 Enhanced — Stack & Architecture Design

 Context

 Enhanced est un wizard conversationnel structuré qui guide les équipes produit à travers une validation d'hypothèses avant de builder. Le produit est construit entièrement
  par IA (Claude Code). Ce document définit la stack technique et l'architecture pour le MVP.

 Le problème qu'on résout : l'IA permet de builder 10x plus vite, mais les équipes ne valident pas mieux ce qu'elles décident de builder. Enhanced force la rigueur via un
 framework FOCUSED en 4 étapes.

 ---
 Stack technique validée

 ┌───────────────────┬────────────────────────────────────────┬──────────────────────────────────────────────┐
 │      Domaine      │                 Choix                  │                   Package                    │
 ├───────────────────┼────────────────────────────────────────┼──────────────────────────────────────────────┤
 │ Framework         │ Next.js 15 (App Router)                │ next                                         │
 ├───────────────────┼────────────────────────────────────────┼──────────────────────────────────────────────┤
 │ Langage           │ TypeScript strict                      │ typescript                                   │
 ├───────────────────┼────────────────────────────────────────┼──────────────────────────────────────────────┤
 │ UI                │ shadcn/ui + Tailwind CSS v4            │ tailwindcss, composants copy-paste           │
 ├───────────────────┼────────────────────────────────────────┼──────────────────────────────────────────────┤
 │ BDD + Auth        │ Supabase (Magic Link only) + RLS       │ @supabase/supabase-js, @supabase/ssr         │
 ├───────────────────┼────────────────────────────────────────┼──────────────────────────────────────────────┤
 │ AI orchestration  │ Vercel AI SDK + OpenRouter             │ ai, @ai-sdk/mcp, @openrouter/ai-sdk-provider │
 ├───────────────────┼────────────────────────────────────────┼──────────────────────────────────────────────┤
 │ MCP analytics     │ @ai-sdk/mcp avec DCR OAuth             │ PostHog, Mixpanel, Amplitude                 │
 ├───────────────────┼────────────────────────────────────────┼──────────────────────────────────────────────┤
 │ Validation        │ Zod + React Hook Form                  │ zod, react-hook-form, @hookform/resolvers    │
 ├───────────────────┼────────────────────────────────────────┼──────────────────────────────────────────────┤
 │ State wizard      │ Zustand (session) + Supabase (persist) │ zustand                                      │
 ├───────────────────┼────────────────────────────────────────┼──────────────────────────────────────────────┤
 │ Markdown PRD      │ react-markdown + remark-gfm            │ react-markdown, remark-gfm, rehype-sanitize  │
 ├───────────────────┼────────────────────────────────────────┼──────────────────────────────────────────────┤
 │ Typography        │ Tailwind Typography                    │ @tailwindcss/typography                      │
 ├───────────────────┼────────────────────────────────────────┼──────────────────────────────────────────────┤
 │ SEO               │ Next.js metadata API + next/og         │ natif                                        │
 ├───────────────────┼────────────────────────────────────────┼──────────────────────────────────────────────┤
 │ Testing           │ Vitest + Playwright                    │ vitest, @playwright/test                     │
 ├───────────────────┼────────────────────────────────────────┼──────────────────────────────────────────────┤
 │ Linting           │ ESLint + Prettier                      │ eslint, prettier                             │
 ├───────────────────┼────────────────────────────────────────┼──────────────────────────────────────────────┤
 │ Analytics propres │ PostHog                                │ posthog-js, posthog-node                     │
 ├───────────────────┼────────────────────────────────────────┼──────────────────────────────────────────────┤
 │ Slugs partage     │ nanoid                                 │ nanoid                                       │
 ├───────────────────┼────────────────────────────────────────┼──────────────────────────────────────────────┤
 │ Deploy            │ Vercel                                 │ —                                            │
 ├───────────────────┼────────────────────────────────────────┼──────────────────────────────────────────────┤
 │ CI/CD             │ GitHub Actions                         │ —                                            │
 └───────────────────┴────────────────────────────────────────┴──────────────────────────────────────────────┘

 ---
 Architecture

  BROWSER                          VERCEL (Next.js)                    EXTERNAL
  ───────                          ────────────────                    ────────
  ┌─────────────┐                 ┌──────────────────┐
  │ Wizard UI    │ ──fetch/SSE──► │ API Routes        │
  │ (React +     │                │ /api/wizard/[step]│──► OpenRouter (LLM)
  │  shadcn +    │                │                    │
  │  Zustand)    │                │ /api/mcp/connect   │──► MCP Servers (OAuth DCR)
  │              │                │ /api/mcp/callback  │    ├─ PostHog
  │ Supabase Auth│◄─cookies──────►│                    │    ├─ Mixpanel
  │ (Magic Link) │                │ Middleware          │    └─ Amplitude
  └─────────────┘                │ (auth guard)       │
                                  └────────┬───────────┘
                                           │
                                  ┌────────▼───────────┐
                                  │ Supabase             │
                                  │ ├─ Auth (Magic Link) │
                                  │ ├─ Postgres + RLS    │
                                  │ └─ (Storage future)  │
                                  └─────────────────────┘

 Flux d'une étape wizard (ex: Step 2 — Validation data)

 1. L'utilisateur est sur l'étape 2, clique "Valider avec la data"
 2. Le client POST /api/wizard/2 avec le contexte de la discovery
 3. Le route handler authentifie via supabase.auth.getUser()
 4. Charge les tokens MCP de l'utilisateur depuis mcp_connections
 5. Crée un MCP client via createMCPClient() avec le token de l'utilisateur
 6. Appelle streamText() avec le modèle OpenRouter + les tools MCP
 7. L'IA raisonne, appelle les tools PostHog (trends, funnels, cohorts...)
 8. Le SDK gère la boucle tool calling automatiquement (maxSteps: 5)
 9. Résultat streamé au client → affiché progressivement
 10. À la fin : step data sauvée en Supabase

 ---
 Data model

 Tables principales

 profiles — Miroir de auth.users
 - id (UUID, PK, ref auth.users)
 - email, display_name, avatar_url
 - created_at, updated_at

 discoveries — Session wizard (entité principale)
 - id (UUID, PK)
 - user_id (ref auth.users)
 - title, status (draft → in_progress → completed → archived)
 - current_step (1-4)
 - raw_idea (texte libre de l'utilisateur)
 - problem_frame (JSONB — First Use Case structuré)
 - data_signals (JSONB — signaux analytics trouvés)
 - risk_assessment (JSONB — 4 risques + scores)
 - prd_content (TEXT — markdown du PRD généré)
 - prd_metadata (JSONB — score confiance, kill criteria)
 - share_slug (unique, nullable), is_public (boolean)

 discovery_steps — Historique conversation par étape
 - id (UUID, PK)
 - discovery_id (ref discoveries)
 - step_number (1-4)
 - messages (JSONB — array de {role, content, tool_calls, tool_results})
 - status (pending → in_progress → completed)
 - Contrainte UNIQUE (discovery_id, step_number)

 mcp_connections — Connexions analytics OAuth
 - id (UUID, PK)
 - user_id (ref auth.users)
 - provider (posthog | mixpanel | amplitude)
 - access_token (chiffré AES-256-GCM), refresh_token (chiffré)
 - token_expires_at
 - server_url, scopes, client_id, client_secret
 - status (active | expired | revoked)
 - Contrainte UNIQUE (user_id, provider)

 RLS Policies

 - profiles : CRUD uniquement sur son propre profil (auth.uid() = id)
 - discoveries : CRUD propres + SELECT public si is_public = true AND share_slug IS NOT NULL
 - discovery_steps : accès via ownership du parent discovery + lecture publique pour discoveries partagées
 - mcp_connections : strictement privé, owner only

 ---
 MCP — Flux de connexion (DCR OAuth)

 Connexion initiale (une fois par provider)

 1. User clique "Connecter PostHog" dans /settings/connections
 2. POST /api/mcp/connect → génère PKCE (code_verifier + code_challenge)
 3. Stocke le code_verifier en cookie HTTP-only chiffré
 4. Redirige vers l'authorization endpoint du MCP server PostHog
 5. User s'authentifie chez PostHog
 6. Callback sur /api/mcp/callback?code=...&state=...
 7. Échange le code contre des tokens (access + refresh)
 8. Chiffre les tokens (AES-256-GCM) et stocke dans mcp_connections
 9. Redirige vers le wizard avec un status de succès

 Utilisation pendant le wizard

 1. Charge les tokens depuis mcp_connections
 2. Si token_expires_at < now + 5min → refresh automatique
 3. Crée createMCPClient({ transport: { type: 'http', url, headers: { Authorization } } })
 4. mcpClient.tools() → injecté dans streamText()
 5. Fermeture du client après chaque requête

 Fallback sans MCP

 Si aucune connexion : l'IA adapte son prompt. Elle guide le PM sur quelles données chercher manuellement, quelles métriques regarder, et comment les interpréter. Toutes
 les assertions data sont marquées [To verify].

 ---
 Sécurité

 ┌───────────────┬──────────────────────────────────────────────────────────────────────────────────┐
 │    Mesure     │                                      Détail                                      │
 ├───────────────┼──────────────────────────────────────────────────────────────────────────────────┤
 │ Auth          │ Magic Link uniquement, expiry 10min (durci vs défaut 1h), rate limit 1/email/60s │
 ├───────────────┼──────────────────────────────────────────────────────────────────────────────────┤
 │ Session       │ HTTP-only cookies via @supabase/ssr, refresh en middleware                       │
 ├───────────────┼──────────────────────────────────────────────────────────────────────────────────┤
 │ API guard     │ supabase.auth.getUser() (pas getSession()) dans chaque route handler             │
 ├───────────────┼──────────────────────────────────────────────────────────────────────────────────┤
 │ RLS           │ Defense-in-depth sur toutes les tables, même si le code est correct              │
 ├───────────────┼──────────────────────────────────────────────────────────────────────────────────┤
 │ Tokens MCP    │ AES-256-GCM via Node.js crypto, clé en env var (MCP_TOKEN_ENCRYPTION_KEY)        │
 ├───────────────┼──────────────────────────────────────────────────────────────────────────────────┤
 │ PKCE          │ Code challenge S256 pour le flow OAuth MCP                                       │
 ├───────────────┼──────────────────────────────────────────────────────────────────────────────────┤
 │ Rate limiting │ ~20 requêtes AI/heure/user, 5 connexions MCP/heure/user                          │
 ├───────────────┼──────────────────────────────────────────────────────────────────────────────────┤
 │ XSS PRD       │ rehype-sanitize sur le markdown rendu                                            │
 └───────────────┴──────────────────────────────────────────────────────────────────────────────────┘

 ---
 Structure fichiers

 enhanced/
 ├── src/
 │   ├── app/
 │   │   ├── (auth)/
 │   │   │   ├── login/page.tsx              # Login magic link
 │   │   │   └── auth/confirm/route.ts       # Callback magic link
 │   │   ├── (dashboard)/
 │   │   │   ├── layout.tsx                  # Layout authentifié
 │   │   │   ├── page.tsx                    # Liste des discoveries
 │   │   │   ├── discovery/
 │   │   │   │   ├── new/page.tsx            # Nouvelle discovery
 │   │   │   │   └── [id]/
 │   │   │   │       ├── page.tsx            # Wizard (4 étapes)
 │   │   │   │       └── prd/page.tsx        # PRD généré
 │   │   │   └── settings/
 │   │   │       └── connections/page.tsx    # Connexions MCP
 │   │   ├── share/
 │   │   │   └── [slug]/page.tsx             # PRD public (SSR + SEO)
 │   │   ├── api/
 │   │   │   ├── wizard/
 │   │   │   │   └── [step]/route.ts         # AI par étape
 │   │   │   ├── mcp/
 │   │   │   │   ├── connect/route.ts        # Init OAuth MCP
 │   │   │   │   └── callback/route.ts       # Callback OAuth
 │   │   │   └── share/
 │   │   │       └── [slug]/route.ts         # API PRD public
 │   │   ├── layout.tsx                      # Root layout
 │   │   └── page.tsx                        # Landing page
 │   ├── components/
 │   │   ├── ui/                             # shadcn/ui
 │   │   ├── wizard/
 │   │   │   ├── wizard-shell.tsx            # Navigation étapes + progress
 │   │   │   ├── step-1-problem.tsx
 │   │   │   ├── step-2-data.tsx
 │   │   │   ├── step-3-risks.tsx
 │   │   │   ├── step-4-prd.tsx
 │   │   │   └── ai-response.tsx             # Affichage réponse IA
 │   │   ├── prd/
 │   │   │   └── prd-viewer.tsx              # Rendu markdown PRD
 │   │   └── connections/
 │   │       └── mcp-connection-card.tsx
 │   ├── lib/
 │   │   ├── supabase/
 │   │   │   ├── client.ts                   # Client navigateur
 │   │   │   ├── server.ts                   # Client serveur
 │   │   │   ├── middleware.ts               # Refresh session
 │   │   │   └── types.ts                    # Types générés (supabase gen types)
 │   │   ├── ai/
 │   │   │   ├── openrouter.ts               # Config provider
 │   │   │   ├── prompts/
 │   │   │   │   ├── step-1.ts               # System prompt cadrage problème
 │   │   │   │   ├── step-2.ts               # System prompt validation data
 │   │   │   │   ├── step-3.ts               # System prompt risques
 │   │   │   │   └── step-4.ts               # System prompt PRD + template
 │   │   │   └── steps.ts                    # Config par étape (model, tools, maxSteps)
 │   │   ├── mcp/
 │   │   │   ├── client.ts                   # Wrapper createMCPClient
 │   │   │   ├── tokens.ts                   # Refresh + récupération tokens
 │   │   │   └── providers.ts                # URLs et configs providers
 │   │   ├── crypto.ts                       # Chiffrement/déchiffrement tokens
 │   │   └── utils.ts
 │   ├── stores/
 │   │   └── wizard-store.ts                 # Zustand
 │   └── middleware.ts                       # Auth guard Next.js
 ├── supabase/
 │   ├── migrations/                         # Migrations SQL
 │   └── config.toml
 ├── tests/
 │   ├── unit/                               # Vitest
 │   └── e2e/                                # Playwright
 └── (config files: next.config, tailwind, tsconfig, etc.)

 ---
 Risques identifiés

 ┌─────────────────────────────────────┬─────────────────────┬─────────────────────────────────────────────────────────────────────────────────┐
 │               Risque                │       Impact        │                                   Mitigation                                    │
 ├─────────────────────────────────────┼─────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
 │ MCP servers instables (APIs jeunes) │ Step 2 dégradé      │ Fallback gracieux : wizard fonctionne sans MCP, IA guide la collecte manuelle   │
 ├─────────────────────────────────────┼─────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
 │ Tokens MCP expirés/révoqués         │ Connexion cassée    │ Refresh auto + détection + re-auth one-click                                    │
 ├─────────────────────────────────────┼─────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
 │ Hallucination IA (fausses données)  │ Crédibilité produit │ Discipline [Evidence]/[Assumption]/[To verify] + citation des tool call results │
 ├─────────────────────────────────────┼─────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
 │ Coûts LLM incontrôlés               │ Budget              │ Rate limiting par user + Sonnet (pas Opus) + tracking tokens                    │
 ├─────────────────────────────────────┼─────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
 │ Streaming + tool calling complexe   │ Bugs UX             │ Vercel AI SDK gère la boucle, maxSteps conservateur, timeout 60s                │
 └─────────────────────────────────────┴─────────────────────┴─────────────────────────────────────────────────────────────────────────────────┘

 ---
 Vérification

 Pour valider que le scaffolding fonctionne end-to-end :

 1. Auth : créer un compte via Magic Link, vérifier le cookie HTTP-only, tester l'accès aux routes protégées
 2. Wizard Step 1 : soumettre une idée → recevoir une reformulation IA en streaming
 3. MCP : connecter un compte PostHog de test via OAuth → vérifier le token stocké chiffré
 4. Wizard Step 2 : déclencher une analyse data → vérifier que l'IA appelle les tools PostHog et reçoit des résultats
 5. Step 3-4 : vérifier le scoring des risques et la génération du PRD markdown
 6. Partage : générer un lien public → vérifier le rendu SSR avec meta tags OG
 7. Sécurité : tester RLS (un user ne voit pas les discoveries d'un autre), vérifier le chiffrement des tokens MCP
 8. Tests : vitest run pour les unit tests, playwright test pour le flow wizard E2E