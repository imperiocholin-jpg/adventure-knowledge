-- 修复「已注册用户每次登录仍走 profile-setup / pet-setup」
-- 在 Supabase SQL Editor 中执行（兼容不同 users/pets 表结构）

-- 用户资料完成标记
alter table if exists public.users
  add column if not exists profile_setup_completed boolean not null default false;

-- 宠物领养完成标记 + 类型字段（若尚未添加）
alter table if exists public.pets
  add column if not exists pet_species text null,
  add column if not exists pet_breed text null,
  add column if not exists pet_setup_completed boolean not null default false;

-- 兼容旧列名
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'pets' and column_name = 'species'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'pets' and column_name = 'pet_species'
  ) then
    update public.pets set pet_species = species where pet_species is null and species is not null;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'pets' and column_name = 'breed'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'pets' and column_name = 'pet_breed'
  ) then
    update public.pets set pet_breed = breed where pet_breed is null and breed is not null;
  end if;
end $$;

-- 老用户回填：根据实际存在的列动态生成 UPDATE
do $$
declare
  name_parts text[] := array[]::text[];
  avatar_parts text[] := array[]::text[];
  sql text;
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'nickname') then
    name_parts := array_append(name_parts, 'nullif(trim(nickname), '''')');
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'username') then
    name_parts := array_append(name_parts, 'nullif(trim(username), '''')');
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'name') then
    name_parts := array_append(name_parts, 'nullif(trim(name), '''')');
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'avatar_id') then
    avatar_parts := array_append(avatar_parts, 'nullif(trim(avatar_id), '''')');
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'user_avatar_id') then
    avatar_parts := array_append(avatar_parts, 'nullif(trim(user_avatar_id), '''')');
  end if;

  if array_length(name_parts, 1) is null then
    raise notice 'users 表无 nickname/username/name 列，跳过 profile_setup_completed 回填';
    return;
  end if;

  sql := format(
    'update public.users set profile_setup_completed = true where profile_setup_completed = false and coalesce(%s, '''') <> ''''',
    array_to_string(name_parts, ', ')
  );

  if array_length(avatar_parts, 1) is not null
     and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'school_name')
     and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'grade_class') then
    sql := sql || format(
      ' and (coalesce(%s, '''') <> '''' or (coalesce(nullif(trim(school_name), ''''), '''') <> '''' and coalesce(nullif(trim(grade_class), ''''), '''') <> ''''))',
      array_to_string(avatar_parts, ', ')
    );
  elsif array_length(avatar_parts, 1) is not null then
    sql := sql || format(
      ' and coalesce(%s, '''') <> ''''',
      array_to_string(avatar_parts, ', ')
    );
  elsif exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'school_name')
     and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'grade_class') then
    sql := sql || ' and coalesce(nullif(trim(school_name), ''''), '''') <> '''' and coalesce(nullif(trim(grade_class), ''''), '''') <> ''''';
  end if;

  execute sql;
  raise notice 'profile_setup_completed 回填完成';
end $$;

do $$
declare
  conditions text[] := array[]::text[];
  sql text;
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'pets' and column_name = 'name') then
    conditions := array_append(conditions, 'coalesce(nullif(trim(name), ''''), '''') <> '''' and coalesce(nullif(trim(name), ''''), ''毛毛'') <> ''毛毛''');
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'pets' and column_name = 'pet_name') then
    conditions := array_append(conditions, 'coalesce(nullif(trim(pet_name), ''''), '''') <> '''' and coalesce(nullif(trim(pet_name), ''''), ''毛毛'') <> ''毛毛''');
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'pets' and column_name = 'pet_species') then
    conditions := array_append(conditions, 'coalesce(nullif(trim(pet_species), ''''), '''') <> ''''');
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'pets' and column_name = 'species') then
    conditions := array_append(conditions, 'coalesce(nullif(trim(species), ''''), '''') <> ''''');
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'pets' and column_name = 'pet_breed') then
    conditions := array_append(conditions, 'coalesce(nullif(trim(pet_breed), ''''), '''') <> ''''');
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'pets' and column_name = 'breed') then
    conditions := array_append(conditions, 'coalesce(nullif(trim(breed), ''''), '''') <> ''''');
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'pets' and column_name = 'pet_exp') then
    conditions := array_append(conditions, 'coalesce(pet_exp, 0) > 0');
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'pets' and column_name = 'pet_level') then
    conditions := array_append(conditions, 'coalesce(pet_level, 1) > 1');
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'pets' and column_name = 'updated_at')
     and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'pets' and column_name = 'created_at') then
    conditions := array_append(conditions, 'updated_at is not null and created_at is not null and updated_at > created_at + interval ''1 minute''');
  end if;

  if array_length(conditions, 1) is null then
    raise notice 'pets 表缺少可判断字段，跳过 pet_setup_completed 回填';
    return;
  end if;

  sql := format(
    'update public.pets set pet_setup_completed = true where pet_setup_completed = false and (%s)',
    array_to_string(conditions, ' or ')
  );
  execute sql;
  raise notice 'pet_setup_completed 回填完成';
end $$;
