-- Sessions: one per wizard run, initially anonymous
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  anonymous_id uuid not null,
  user_id uuid references auth.users(id),
  raw_idea text not null,
  current_step smallint not null default 1,
  status text not null default 'active'
    check (status in ('active', 'completed', 'abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- PRDs: one per session, grows as the wizard progresses
create table public.prds (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid references auth.users(id),
  title text not null default '',
  is_public boolean not null default false,
  share_slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index sessions_anonymous_id_idx on public.sessions (anonymous_id);
create index sessions_user_id_idx on public.sessions (user_id) where user_id is not null;
create index prds_session_id_idx on public.prds (session_id);
create index prds_share_slug_idx on public.prds (share_slug) where share_slug is not null;

-- RLS
alter table public.sessions enable row level security;
alter table public.prds enable row level security;

-- Insert: permissive — the server action validates input via Zod
create policy "allow_insert_sessions" on public.sessions
  for insert with check (true);

create policy "allow_insert_prds" on public.prds
  for insert with check (true);

-- Select: restrict to own sessions (by anonymous_id or user_id)
create policy "select_own_sessions" on public.sessions
  for select using (
    user_id = auth.uid()
    or anonymous_id::text = coalesce(
      current_setting('request.jwt.claims', true)::json ->> 'sub',
      ''
    )
  );

create policy "select_own_prds" on public.prds
  for select using (
    session_id in (
      select id from public.sessions
      where user_id = auth.uid()
        or anonymous_id::text = coalesce(
          current_setting('request.jwt.claims', true)::json ->> 'sub',
          ''
        )
    )
  );

-- Update: own sessions only
create policy "update_own_sessions" on public.sessions
  for update using (
    user_id = auth.uid()
    or anonymous_id::text = coalesce(
      current_setting('request.jwt.claims', true)::json ->> 'sub',
      ''
    )
  );

create policy "update_own_prds" on public.prds
  for update using (
    session_id in (
      select id from public.sessions
      where user_id = auth.uid()
        or anonymous_id::text = coalesce(
          current_setting('request.jwt.claims', true)::json ->> 'sub',
          ''
        )
    )
  );
