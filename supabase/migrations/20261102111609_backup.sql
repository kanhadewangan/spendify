-- Spendify backup & sync.
-- Stores parsed expenses and synced settings per user. Raw notification text is never uploaded.
-- Every table is locked to its owner with row-level security; the anon key alone can read nothing.
-- Safe to re-run: every statement is idempotent.

create table if not exists public.expenses (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  -- The expense as the app stores it; null once deleted (the row stays as a tombstone).
  data jsonb,
  -- Client edit time in ms. Last write wins.
  updated_at bigint not null,
  deleted boolean not null default false,
  -- Server time of the last accepted change. Devices pull everything newer than their cursor.
  synced_at timestamptz not null default now(),
  -- The captured alert this expense came from, if any. Lifted out of `data` so it can be unique.
  notification_key text generated always as (data ->> 'notificationKey') stored,
  -- One row per expense per user.
  constraint expenses_pkey primary key (user_id, id),
  constraint expenses_id_present check (length(id) between 1 and 64),
  constraint expenses_updated_at_valid check (updated_at >= 0),
  -- Live rows carry their data; only tombstones may drop it.
  constraint expenses_live_has_data check (deleted or data is not null)
);

-- Pull query: "this user's rows changed since my cursor".
create index if not exists expenses_user_synced on public.expenses (user_id, synced_at);

-- A payment alert becomes at most one live expense per user, even if two phones capture it.
create unique index if not exists expenses_user_notification_key
  on public.expenses (user_id, notification_key)
  where notification_key is not null and not deleted;

create table if not exists public.user_settings (
  -- One settings row per user.
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at bigint not null check (updated_at >= 0),
  synced_at timestamptz not null default now()
);

alter table public.expenses enable row level security;
alter table public.user_settings enable row level security;

drop policy if exists "Owners manage their expenses" on public.expenses;
create policy "Owners manage their expenses" on public.expenses
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Owners manage their settings" on public.user_settings;
create policy "Owners manage their settings" on public.user_settings
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Upload a batch of changes. A row only replaces the stored one if it is strictly newer, so
-- retries and echoes are no-ops and an older device can never overwrite a newer edit. A new
-- expense for a notification that is already stored under another id is skipped, not an error.
create or replace function public.push_changes(expenses jsonb, settings jsonb default null)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
begin
  insert into public.expenses as e (user_id, id, data, updated_at, deleted)
  select me, r.id, r.data, r.updated_at, r.deleted
  from jsonb_to_recordset(coalesce(expenses, '[]'::jsonb))
    as r (id text, data jsonb, updated_at bigint, deleted boolean)
  where r.deleted
    or r.data ->> 'notificationKey' is null
    or not exists (
      select 1 from public.expenses x
      where x.user_id = me
        and x.notification_key = r.data ->> 'notificationKey'
        and not x.deleted
        and x.id <> r.id
    )
  on conflict (user_id, id) do update
    set data = excluded.data,
        updated_at = excluded.updated_at,
        deleted = excluded.deleted,
        synced_at = now()
    where excluded.updated_at > e.updated_at;

  if settings is not null then
    insert into public.user_settings as s (user_id, data, updated_at)
    values (me, settings -> 'data', (settings ->> 'updated_at')::bigint)
    on conflict (user_id) do update
      set data = excluded.data,
          updated_at = excluded.updated_at,
          synced_at = now()
      where excluded.updated_at > s.updated_at;
  end if;
end;
$$;

-- Permanently removes the signed-in user; their rows go with them (on delete cascade).
create or replace function public.delete_my_account()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = (select auth.uid());
$$;

revoke all on function public.push_changes(jsonb, jsonb) from public, anon;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.push_changes(jsonb, jsonb) to authenticated;
grant execute on function public.delete_my_account() to authenticated;

-- Make the new tables and functions visible to the API immediately.
notify pgrst, 'reload schema';
