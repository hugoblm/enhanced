-- RLS in Postgres has two layers:
--   1. The role needs explicit GRANT on the table/operation
--   2. The RLS policy then filters which rows the operation can touch
-- Tables created via migration do NOT automatically grant access to
-- the anon/authenticated roles — only Supabase-managed default tables
-- get those grants. We grant the operations the form needs.

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.sessions to anon, authenticated;
grant select, insert, update on public.prds to anon, authenticated;
