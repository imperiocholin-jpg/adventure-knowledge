-- 神秘宝藏：定义表 + 用户解锁记录

create table if not exists public.treasure_definitions (
  id text primary key,
  name text not null,
  icon text not null default '🎁',
  reward_type text not null,
  rarity text not null,
  description text not null default '',
  requirement_label text not null,
  condition_type text not null,
  target_value integer not null default 1,
  condition_payload jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_treasures (
  user_id text not null,
  treasure_id text not null references public.treasure_definitions (id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, treasure_id)
);

create index if not exists user_treasures_user_id_idx on public.user_treasures (user_id);

alter table public.treasure_definitions enable row level security;
alter table public.user_treasures enable row level security;

drop policy if exists treasure_definitions_read_all on public.treasure_definitions;
create policy treasure_definitions_read_all on public.treasure_definitions
  for select using (true);

drop policy if exists user_treasures_select_own on public.user_treasures;
create policy user_treasures_select_own on public.user_treasures
  for select using (
    user_id = auth.uid()::text
    or user_id in (select id::text from public.users where id = auth.uid())
  );

-- 初始宝藏池（与 lib/treasures/definitions.ts 保持一致）
insert into public.treasure_definitions (
  id, name, icon, reward_type, rarity, description, requirement_label,
  condition_type, target_value, condition_payload, sort_order
) values
  ('starry-elf', '星空精灵', '✨', 'pet', 'legendary', '来自遥远星球的神秘生物', '完成《小王子》', 'book_complete', 1, '{"bookId":"1"}'::jsonb, 10),
  ('magic-cloak', '魔法斗篷', '🧥', 'skin', 'epic', '隐身于黑夜的神奇披风', '收集30颗星星', 'stars_total', 30, '{}'::jsonb, 20),
  ('reading-master', '阅读达人', '🏅', 'title', 'rare', '展示你的阅读成就', '连续活跃7天', 'daily_streak', 7, '{}'::jsonb, 30),
  ('mystic-island', '神秘岛屿', '🏝️', 'area', 'legendary', '隐藏的冒险新大陆', '完成5次读后挑战', 'post_read_books_count', 5, '{}'::jsonb, 40),
  ('dragon-egg', '龙蛋', '🥚', 'item', 'epic', '沉睡的远古生命', '解锁3个区域', 'regions_unlocked', 3, '{}'::jsonb, 50),
  ('rainbow-wings', '彩虹翅膀', '🦋', 'skin', 'legendary', '七彩斑斓的飞行装备', '收集50颗星星', 'stars_total', 50, '{}'::jsonb, 60),
  ('forest-guardian', '森林守护者', '🌲', 'title', 'epic', '保护森林的勇士称号', '完成魔法森林', 'region_progress', 100, '{"regionId":"magic-forest"}'::jsonb, 70),
  ('crystal-ball', '水晶球', '🔮', 'item', 'rare', '预见未来的神秘物品', '阅读10本不同书目', 'books_read_count', 10, '{}'::jsonb, 80),
  ('mini-dragon', '小龙伙伴', '🐉', 'pet', 'legendary', '忠诚勇敢的小龙', '完成天空王国', 'region_progress', 100, '{"regionId":"sky-kingdom"}'::jsonb, 90),
  ('adventurer-badge', '冒险家徽章', '🎖️', 'badge', 'rare', '勇敢冒险者的证明', '解锁3个区域', 'regions_unlocked', 3, '{}'::jsonb, 100),
  ('magic-hat', '魔法帽', '🎩', 'skin', 'epic', '充满魔力的帽子', '连续活跃14天', 'daily_streak', 14, '{}'::jsonb, 110),
  ('ocean-heart', '海洋之心', '💎', 'item', 'legendary', '来自深海的珍贵宝石', '完成深海遗迹', 'region_progress', 100, '{"regionId":"ocean-ruins"}'::jsonb, 120)
on conflict (id) do update set
  name = excluded.name,
  requirement_label = excluded.requirement_label,
  condition_type = excluded.condition_type,
  target_value = excluded.target_value,
  condition_payload = excluded.condition_payload,
  sort_order = excluded.sort_order;
