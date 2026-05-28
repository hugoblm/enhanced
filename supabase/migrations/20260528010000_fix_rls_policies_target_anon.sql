-- Fix: policies created without an explicit `TO` clause default to `public`
-- but the Supabase REST client connects as `anon` (or `authenticated`).
-- We drop and recreate every policy with explicit `TO anon, authenticated`
-- so anonymous form submissions (and later, authenticated calls) can
-- actually insert/select/update through the REST API.

drop policy if exists "allow_insert_sessions" on public.sessions;
drop policy if exists "select_own_sessions" on public.sessions;
drop policy if exists "update_own_sessions" on public.sessions;

drop policy if exists "allow_insert_prds" on public.prds;
drop policy if exists "select_own_prds" on public.prds;
drop policy if exists "update_own_prds" on public.prds;

-- sessions
create policy "allow_insert_sessions" on public.sessions
  for insert to anon, authenticated
  with check (true);

create policy "select_own_sessions" on public.sessions
  for select to anon, authenticated
  using (
    user_id = auth.uid()
    or anonymous_id::text = coalesce(
      current_setting('request.jwt.claims', true)::json ->> 'sub',
      ''
    )
  );

create policy "update_own_sessions" on public.sessions
  for update to anon, authenticated
  using (
    user_id = auth.uid()
    or anonymous_id::text = coalesce(
      current_setting('request.jwt.claims', true)::json ->> 'sub',
      ''
    )
  );

-- prds
create policy "allow_insert_prds" on public.prds
  for insert to anon, authenticated
  with check (true);

create policy "select_own_prds" on public.prds
  for select to anon, authenticated
  using (
    session_id in (
      select id from public.sessions
      where user_id = auth.uid()
        or anonymous_id::text = coalesce(
          current_setting('request.jwt.claims', true)::json ->> 'sub',
          ''
        )
    )
  );

create policy "update_own_prds" on public.prds
  for update to anon, authenticated
  using (
    session_id in (
      select id from public.sessions
      where user_id = auth.uid()
        or anonymous_id::text = coalesce(
          current_setting('request.jwt.claims', true)::json ->> 'sub',
          ''
        )
    )
  );
