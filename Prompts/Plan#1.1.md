Enhanced — V1 Scaffolding (squelette uniquement)

 Context

 Poser les fondations techniques d'Enhanced : un projet Next.js vide, connecté à Supabase et Vercel, avec toutes les librairies installées et configurées. Aucune
 fonctionnalité — juste un squelette qui tourne.

 L'architecture cible (wizard, MCP, AI) est documentée séparément. Ce plan ne couvre que le setup initial.

 ---
 Ce qu'on fait

 1. Scaffolding Next.js 15 (App Router, TypeScript strict, Tailwind CSS v4, ESLint)
 2. Setup Supabase (client SSR, middleware auth, types générés, projet Supabase linké)
 3. Install des librairies validées (shadcn/ui, Zod, React Hook Form, Zustand, Vercel AI SDK, etc.)
 4. Config Vercel (vérifier que le deploy fonctionne)
 5. Structure de base (dossiers src/app, src/lib, src/components, src/stores)
 6. Page d'accueil placeholder (une page qui affiche "Enhanced" — preuve que tout tourne)

 Ce qu'on ne fait PAS

 - Aucune feature (pas de wizard, pas d'auth flow, pas de MCP, pas d'AI)
 - Pas de data model (pas de migrations Supabase)
 - Pas de tests fonctionnels (juste vérifier que le build passe)

 ---
 Étapes

 1. Créer le projet Next.js

 - npx create-next-app@latest avec App Router, TypeScript, Tailwind, ESLint, src/ directory
 - Vérifier que npm run dev et npm run build passent

 2. Installer les librairies

 # UI
 npx shadcn@latest init (style: default, base color au choix, CSS variables: yes)

 # Validation
 npm install zod react-hook-form @hookform/resolvers

 # State
 npm install zustand

 # AI (installé mais pas configuré)
 npm install ai @ai-sdk/mcp @openrouter/ai-sdk-provider

 # Supabase
 npm install @supabase/supabase-js @supabase/ssr

 # Markdown (pour le futur rendu PRD)
 npm install react-markdown remark-gfm rehype-sanitize

 # Utilities
 npm install nanoid

 # Analytics (Enhanced propre)
 npm install posthog-js posthog-node

 3. Setup Supabase

 - Installer le CLI Supabase si pas déjà fait : npx supabase init
 - Créer les fichiers utilitaires Supabase :
   - src/lib/supabase/client.ts — client navigateur
   - src/lib/supabase/server.ts — client serveur (cookies)
   - src/lib/supabase/middleware.ts — refresh session
 - Créer src/middleware.ts — intégrer le middleware Supabase
 - Ajouter les variables d'env dans .env.local :
 NEXT_PUBLIC_SUPABASE_URL=
 NEXT_PUBLIC_SUPABASE_ANON_KEY=
 - Note : les vraies valeurs seront remplies quand le projet Supabase sera créé

 4. Structure de dossiers

 src/
 ├── app/
 │   ├── layout.tsx          # Root layout (fonts, metadata)
 │   ├── page.tsx            # Landing placeholder
 │   └── globals.css         # Tailwind imports
 ├── components/
 │   └── ui/                 # shadcn/ui (vide, rempli au fur et à mesure)
 ├── lib/
 │   ├── supabase/
 │   │   ├── client.ts
 │   │   ├── server.ts
 │   │   └── middleware.ts
 │   └── utils.ts            # cn() helper (créé par shadcn init)
 ├── stores/                 # Zustand (vide)
 └── middleware.ts            # Next.js middleware

 5. Page placeholder

 src/app/page.tsx : une page simple avec le nom "Enhanced" et un sous-titre. Preuve que Next.js + Tailwind + shadcn fonctionnent.

 6. Vérification

 - [ ] npm run dev → page visible sur localhost:3000
 - [ ] npm run build → build sans erreur
 - [ ] npm run lint → pas d'erreur
 - [ ] Les imports Supabase compilent (même sans vraies env vars)
 - [ ] shadcn/ui est initialisé (composants ajoutables via npx shadcn@latest add)

 7. Mettre à jour CLAUDE.md

 Remplir les sections TO BE FILLED du CLAUDE.md avec la stack réelle, les commandes, et la structure.