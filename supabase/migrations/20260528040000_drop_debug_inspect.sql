-- Remove the debug RPC now that the insert flow is verified.
drop function if exists public.debug_inspect_sessions();
