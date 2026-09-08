create table public.demo_workspaces (
  owner_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.demo_workspaces enable row level security;

create policy "workspace owners can read their state"
on public.demo_workspaces for select
to authenticated
using ((select auth.uid()) = owner_id);

create policy "workspace owners can create their state"
on public.demo_workspaces for insert
to authenticated
with check ((select auth.uid()) = owner_id);

create policy "workspace owners can update their state"
on public.demo_workspaces for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

grant select, insert, update on public.demo_workspaces to authenticated;