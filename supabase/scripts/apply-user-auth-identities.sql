-- 预留微信/多方式登录绑定表（与 migration 20260530180000 相同）

create table if not exists public.user_auth_identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null,
  provider_uid text not null,
  union_id text,
  created_at timestamptz not null default now(),
  constraint user_auth_identities_provider_uid_unique unique (provider, provider_uid)
);

create index if not exists user_auth_identities_user_id_idx on public.user_auth_identities (user_id);

alter table public.user_auth_identities enable row level security;

drop policy if exists user_auth_identities_select_own on public.user_auth_identities;
create policy user_auth_identities_select_own
on public.user_auth_identities for select to authenticated
using (auth.uid() = user_id);
