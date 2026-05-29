# 冒险知识 v0-app 部署指南（v2 规则）

本文档配合根目录 [`产品规则定稿表.md`](../产品规则定稿表.md) 使用。按顺序执行即可上线 v2 宠物/对战/经济规则。

---

## 一、部署前检查

| 项 | 要求 |
|----|------|
| Node.js | 建议 18+ |
| 包管理 | 项目使用 `pnpm` |
| Supabase 项目 | 已创建，且与 `.env.local` 一致 |
| 环境变量 | 见下文「环境变量」 |

### 环境变量（`.env.local`）

```env
NEXT_PUBLIC_SUPABASE_URL=https://你的项目.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # 仅服务端，勿提交 Git
```

可选（开发重算等级）：

```env
ALLOW_DEV_RECALC=1
```

可选（运营后台 bootstrap，迁移前临时放行）：

```env
BOOTSTRAP_ADMIN_EMAIL=你的运营邮箱@example.com
```

---

## 二、本地验证（推荐先做）

在 `v0-app` 目录：

```powershell
cd "c:\Nick\AI\Adventure Knowledge\v0-app"
pnpm install
pnpm exec tsc --noEmit
pnpm build
pnpm dev
```

浏览器验证要点：

1. 登录后首页 → 自动每日衰减（饱食 -20、亲密 -10，每日一次）
2. 宠物页 → 四项状态为饱食度/亲密/精神/等级；互动多道具时出现选择器
3. 对战胜场 → 结算后 `users.coins` 增加 12（Supabase Table Editor 查看）
4. 饱食度 ≤0 → 死亡弹窗 + 心情「离世」
5. 重新领养 → `/auth/pet-setup?readopt=1`

---

## 三、数据库迁移（必做）

当前环境未检测到 Supabase CLI 时，请在 **Supabase Dashboard → SQL Editor** 中**按顺序**执行以下文件全文：

1. `supabase/migrations/20260527160000_add_pet_shop_fields.sql`（若早已执行可跳过）
2. `supabase/migrations/20260530120000_pet_vitals_and_daily_decay.sql`
3. `supabase/migrations/20260530130000_pet_level_functions_and_task_coins.sql`

也可一次性执行合并脚本（内容与上述相同）：

- `supabase/scripts/apply-v2-migrations-bundle.sql`

### 迁移后确认

在 SQL Editor 运行：

```sql
select column_name, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'pets'
  and column_name in ('hunger', 'spirit', 'bond', 'last_daily_decay_date', 'pet_exp', 'pet_level', 'life_stage');
```

应能看到 `hunger` 默认 80、`last_daily_decay_date` 等字段。

### 已有用户数据重算等级（可选但建议）

**方式 A – 脚本（需 service role）：**

```powershell
cd "c:\Nick\AI\Adventure Knowledge\v0-app"
pnpm pets:recalc-levels
```

**方式 B – 迁移已含批量 UPDATE**  
执行 `20260530130000_...sql` 时会自动按 `pet_exp` 重算 `pet_level` / `life_stage`。

**方式 C – 开发 API（本地登录后）：**

```http
POST http://localhost:3000/api/dev/recalc-pet-levels
```

（生产环境默认关闭，需 `ALLOW_DEV_RECALC=1`）

---

## 四、RLS 与安全

若尚未应用行级策略，在 SQL Editor 执行：

- `supabase/rls_policies.sql`

确保 `users`、`pets`、`daily_tasks` 仅能访问当前登录用户数据。

---

## 五、生产部署（Vercel 示例）

1. 将 `v0-app` 作为 Root Directory（或整仓部署并指定子目录）
2. Build Command：`pnpm build`
3. Install：`pnpm install`
4. 在 Vercel 环境变量中配置与 `.env.local` 相同的 Supabase 三项
5. 部署完成后访问生产 URL，重复「第二节」验证

其他平台（Docker / 自建 Node）：执行 `pnpm build` + `pnpm start`，并注入相同环境变量。

---

## 六、新用户与任务奖励

- 新注册用户：`lib/auth/bootstrap.ts` 会创建宠物（三维 80）及 4 条每日任务（coins **15 / 25 / 35**）
- **老用户**已有任务：迁移 SQL 仅更新**未领取**任务的 `coin_reward`；已领取记录不变

---

## 七、常见问题

| 现象 | 处理 |
|------|------|
| 每日衰减不生效 | 确认 `pets.last_daily_decay_date` 列存在；看 Network 是否 `POST /api/pets/daily-decay` 200 |
| 对战胜场无 coins | 确认 `users.coins` 列存在；看 `POST /api/battle/settle` 返回 `coinsAfter` |
| 等级与经验不一致 | 执行 `pnpm pets:recalc-levels` 或迁移 3 |
| 购买/互动 422 | 查看返回 `error.message`；死亡态禁止购买与互动 |
| 创建宠物 RLS 报错 | 重启 `pnpm dev` 后重试；或在 SQL Editor 执行 `supabase/scripts/fix-pets-rls.sql` |
| 排行榜/好友不可用 | SQL Editor 执行 `supabase/scripts/apply-social-migration.sql` 与 `apply-battle-wins-migration.sql` |
| 微信小程序 / 微信登录规划 | 见 [`docs/WECHAT_AUTH_AND_MINIPROGRAM.md`](./WECHAT_AUTH_AND_MINIPROGRAM.md) |

### 微信相关（可选，接入前执行）

- `supabase/scripts/apply-user-auth-identities.sql` — 多登录方式绑定表

---

## 八、规则单源代码索引

| 规则 | 代码位置 |
|------|----------|
| 三维状态 / 门槛 / 衰减 | `lib/pets/state.ts` |
| 等级方案 A | `lib/pets/level-progress.ts` |
| 玩法奖励 | `lib/economy/reward-policy.ts` |
| 每日任务 seed | `lib/economy/daily-task-templates.ts` |
| 对战 ATK/HP | `lib/battle/rules.ts` |
| 产品说明 | `产品规则定稿表.md` |
| 运营后台计划 | `docs/ADMIN_DEVELOPMENT_PLAN.md` |

---

## 七、运营后台（试用版）

1. 在 Supabase SQL Editor 执行：`supabase/migrations/20260601000000_admin_role_and_audit.sql`（或 `fix-all-v2-columns.sql` 第六节）
2. 将你的账号设为管理员：

```sql
update public.users set role = 'admin' where email = '你的邮箱';
```

3. 登录 App 后访问 `/admin`
4. 验收：用户列表、用户详情（阅读/任务/宠物/宝藏）、修改 coins 与宠物三维

---

*文档版本：v2 · 2026-05-28*
