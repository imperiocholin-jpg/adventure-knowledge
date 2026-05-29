create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  local_content_id text unique,
  title text not null,
  author text,
  region_id text,
  grade_band text,
  category text,
  term text,
  reading_type text,
  content_status text not null default 'draft',
  chapter_count integer not null default 0,
  question_count integer not null default 0,
  source_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.books add column if not exists local_content_id text;
alter table public.books add column if not exists author text;
alter table public.books add column if not exists region_id text;
alter table public.books add column if not exists grade_band text;
alter table public.books add column if not exists category text;
alter table public.books add column if not exists term text;
alter table public.books add column if not exists reading_type text;
alter table public.books add column if not exists content_status text not null default 'draft';
alter table public.books add column if not exists chapter_count integer not null default 0;
alter table public.books add column if not exists question_count integer not null default 0;
alter table public.books add column if not exists source_path text;
alter table public.books add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.books add column if not exists created_at timestamptz not null default now();
alter table public.books add column if not exists updated_at timestamptz not null default now();
drop index if exists public.books_local_content_id_idx;
create unique index if not exists books_local_content_id_idx on public.books(local_content_id);

create table if not exists public.book_chapters (
  id text primary key,
  book_id text not null,
  chapter_no integer not null,
  title text not null,
  text text not null,
  summary text,
  char_count integer not null default 0,
  estimated_minutes integer not null default 0,
  source_start_page integer,
  split_method text,
  status text not null default 'draft',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists book_chapters_book_id_idx on public.book_chapters(book_id);
create unique index if not exists book_chapters_book_no_idx on public.book_chapters(book_id, chapter_no);

create table if not exists public.challenge_questions (
  id text primary key,
  book_id text not null,
  chapter_id text not null,
  region_id text,
  question_type text not null,
  prompt text not null,
  options jsonb not null default '[]'::jsonb,
  answer_index integer,
  answer_text text,
  answer_rubric jsonb not null default '[]'::jsonb,
  success_response text,
  retry_response text,
  source_label text,
  source_excerpt text,
  difficulty integer not null default 1,
  status text not null default 'draft',
  reviewer text,
  review_notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists challenge_questions_book_id_idx on public.challenge_questions(book_id);
create index if not exists challenge_questions_chapter_id_idx on public.challenge_questions(chapter_id);
create index if not exists challenge_questions_status_idx on public.challenge_questions(status);

alter table public.books enable row level security;
alter table public.book_chapters enable row level security;
alter table public.challenge_questions enable row level security;

drop policy if exists "books readable by everyone" on public.books;
create policy "books readable by everyone"
  on public.books for select
  using (true);

drop policy if exists "book chapters readable when published" on public.book_chapters;
create policy "book chapters readable when published"
  on public.book_chapters for select
  using (status in ('approved', 'published'));

drop policy if exists "challenge questions readable when published" on public.challenge_questions;
create policy "challenge questions readable when published"
  on public.challenge_questions for select
  using (status in ('approved', 'published'));
