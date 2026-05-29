-- Supabase RLS + Policy baseline for Adventure Knowledge
-- Apply in Supabase SQL Editor after backing up production data.

-- 1) Enable RLS
alter table if exists public.users enable row level security;
alter table if exists public.pets enable row level security;
alter table if exists public.daily_tasks enable row level security;
alter table if exists public.reading_records enable row level security;
alter table if exists public.books enable row level security;

-- 2) USERS: auth.uid() = user_id
drop policy if exists users_select_own on public.users;
create policy users_select_own
on public.users
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists users_insert_own on public.users;
create policy users_insert_own
on public.users
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists users_update_own on public.users;
create policy users_update_own
on public.users
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 3) PETS: auth.uid() = user_id
drop policy if exists pets_select_own on public.pets;
create policy pets_select_own
on public.pets
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists pets_insert_own on public.pets;
create policy pets_insert_own
on public.pets
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists pets_update_own on public.pets;
create policy pets_update_own
on public.pets
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 4) DAILY_TASKS: auth.uid() = user_id
drop policy if exists daily_tasks_select_own on public.daily_tasks;
create policy daily_tasks_select_own
on public.daily_tasks
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists daily_tasks_insert_own on public.daily_tasks;
create policy daily_tasks_insert_own
on public.daily_tasks
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists daily_tasks_update_own on public.daily_tasks;
create policy daily_tasks_update_own
on public.daily_tasks
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 5) READING_RECORDS: auth.uid() = user_id
drop policy if exists reading_records_select_own on public.reading_records;
create policy reading_records_select_own
on public.reading_records
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists reading_records_insert_own on public.reading_records;
create policy reading_records_insert_own
on public.reading_records
for insert
to authenticated
with check (auth.uid() = user_id);

-- Usually reading_records should be immutable after insert.
drop policy if exists reading_records_update_own on public.reading_records;
create policy reading_records_update_own
on public.reading_records
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 6) BOOKS: shared content table (read-only for authenticated users)
drop policy if exists books_select_authenticated on public.books;
create policy books_select_authenticated
on public.books
for select
to authenticated
using (true);

-- No insert/update/delete policy for authenticated users on books by default.
