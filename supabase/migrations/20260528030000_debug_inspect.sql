-- Debug-only: expose policies + current role via RPC so we can inspect
-- what's actually applied. Will be dropped in the next migration.

create or replace function public.debug_inspect_sessions()
returns jsonb
language sql
security invoker
as $$
  select jsonb_build_object(
    'current_user', current_user,
    'current_role', current_setting('role'),
    'session_user', session_user,
    'policies', (
      select jsonb_agg(jsonb_build_object(
        'name', polname,
        'cmd', polcmd,
        'roles', (select array_agg(rolname) from pg_roles where oid = any(polroles)),
        'qual', pg_get_expr(polqual, polrelid),
        'with_check', pg_get_expr(polwithcheck, polrelid),
        'permissive', polpermissive
      ))
      from pg_policy
      where polrelid = 'public.sessions'::regclass
    ),
    'table_grants', (
      select jsonb_agg(jsonb_build_object(
        'grantee', grantee,
        'privilege', privilege_type
      ))
      from information_schema.role_table_grants
      where table_schema = 'public' and table_name = 'sessions'
    ),
    'rls_enabled', (
      select relrowsecurity from pg_class where oid = 'public.sessions'::regclass
    )
  );
$$;

grant execute on function public.debug_inspect_sessions to anon, authenticated;
