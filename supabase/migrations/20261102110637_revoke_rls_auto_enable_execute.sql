-- rls_auto_enable() only runs as the ensure_rls event trigger; it was never meant to be an API call.
-- Event triggers fire without an EXECUTE check, so auto-RLS keeps working.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
