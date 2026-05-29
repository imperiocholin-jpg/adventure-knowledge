-- 多登录方式绑定（邮箱 / 微信小程序 openid 等）

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

comment on table public.user_auth_identities is '同一用户多种登录方式：email、wechat_mp 等';
comment on column public.user_auth_identities.provider is 'email | wechat_mp | wechat_open';
comment on column public.user_auth_identities.provider_uid is '邮箱或微信 openid';
comment on column public.user_auth_identities.union_id is '微信 unionid（可选，用于多端统一账号）';

alter table public.user_auth_identities enable row level security;

drop policy if exists user_auth_identities_select_own on public.user_auth_identities;
create policy user_auth_identities_select_own
on public.user_auth_identities
for select
to authenticated
using (auth.uid() = user_id);
