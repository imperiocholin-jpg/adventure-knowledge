# 运营后台开发计划表

> 对齐方案：[`运营后台 CMS 建设`](../../.cursor/plans/运营后台_cms_建设_bdf76b6e.plan.md)（Cursor Plan）  
> 部署与迁移：[`DEPLOYMENT.md`](./DEPLOYMENT.md) · 玩家端验收：[`V1_LAUNCH_CHECKLIST.md`](./V1_LAUNCH_CHECKLIST.md)

**版本**：v1.1 · **更新**：2026-05-28  
**形态**：集成在 `v0-app` 内，`/admin` 路由 + `/api/admin/*`  
**人力假设**：1 名全职开发；使用 Cursor 辅助时可按「乐观工期」估算

---

## 0. 小范围试用版（200 账号 · 第一期必做）

> **目标**：下周试用期间，运营能在后台**查看每个用户的使用情况**，并在客服场景下**调整关键数值**。  
> **工期**：**2～3 天（乐观）/ 3～4 天（标准）** — 比完整档位 A 少做「宝藏配置 CRUD、独立宠物列表页」等非试用刚需。

### 0.1 第一期要做（In Scope）

| 模块 | 页面/API | 用途 |
|------|----------|------|
| **Admin 鉴权** | `users.role` + `requireAdmin` + 你的账号设 admin | 仅运营可进 `/admin` |
| **总览 Dashboard** | `/admin` | 注册总数、今日活跃（有 `last_active_date` 或今日阅读）、今日挑战次数、死亡宠物数 |
| **用户列表** | `/admin/users` | 分页；按邮箱/昵称搜索；列：注册时间、连续天、coins、冒险等级、最近活跃 |
| **用户详情（核心）** | `/admin/users/[id]` | 单页看清「这个人在怎么用产品」 |
| **数值调整** | `PATCH /api/admin/users/[id]`、`PATCH /api/admin/pets/[id]` | 客服改数（见下表） |
| **操作审计** | `admin_audit_log` | 谁改了谁的 coins/三维，留痕 |

**用户详情页应展示的使用情况（只读）：**

| 区块 | 数据字段 | 来源 |
|------|----------|------|
| 账号 | 邮箱、昵称、注册时间、是否完成资料/选宠 | `users` |
| 活跃 | 连续天 `daily_streak`、最近活跃日 `last_active_date` | `users` |
| 经济/等级 | coins、主人经验/等级 | `users` |
| 对战 | 累计胜场 `battle_wins`（若有） | `users` |
| 冒险进度 | 累计星星、世界进度 %（由阅读记录汇总） | `reading_records` → 复用 `server-progress` |
| 阅读记录 | 最近 20 条：书目、星星、读后/直闯、时间 | `reading_records` |
| 每日任务 | 当日任务：标题、进度、是否已领 | `daily_tasks` |
| 宠物 | 名字、品种、等级/阶段、饱食/精神/亲密、是否死亡、背包摘要 | `pets` |
| 宝藏 | 已解锁件数 + 列表（只读） | `user_treasures` + 定义表 |

**第一期允许运营调整的数值：**

| 对象 | 可改字段 | 典型试用场景 |
|------|----------|--------------|
| 用户 | `coins` | 补发积分、测试商城 |
| 用户 | `daily_streak` / `last_active_date` | 纠正连续天展示 |
| 用户 | `experience` / `level`（可选） | 测试等级称号 |
| 宠物 | `hunger` / `spirit` / `bond` | 用户卡门槛（对战/互动） |
| 宠物 | `pet_exp` / `pet_level` / `life_stage` | 测试升级与阶段 |
| 宠物 | `is_dead` → 复活 | 误死亡客服处理（或引导走 readopt） |
| 宠物 | `pet_inventory`（可选，JSON 编辑器） | 补发道具；**可二期再加** |

### 0.2 第一期不做（试用可延后）

| 不做项 | 原因 |
|--------|------|
| 神秘宝藏**定义** CRUD | 试用只需看用户解锁；奖池改代码/SQL 即可 |
| 独立 `/admin/pets` 全站列表 | 200 人可从用户详情进宠物；省 0.5 天 |
| 书架/故事/区域 **内容 CMS** | 试用不改内容，属档位 B |
| 宠物商店/品种/任务模板配置 | 属档位 C |
| 批量导入用户、邮件通知 | 非本周刚需 |

### 0.3 试用版任务清单与工期

| 序号 | 任务 | 估时 |
|------|------|------|
| T1 | migration：`role` + `admin_audit_log` | 0.5d |
| T2 | `requireAdmin` + 首个 admin | 0.25d |
| T3 | Admin layout + Dashboard 4 指标 | 0.5d |
| T4 | 用户列表 API + 页 | 0.5d |
| T5 | 用户详情 API（聚合 pets/reading/tasks/treasures/进度） | 0.75d |
| T6 | 用户详情页 + PATCH 用户字段 | 0.5d |
| T7 | PATCH 宠物字段（三维/等级/死亡） | 0.5d |
| T8 | 审计日志 + 部署说明 | 0.25d |

**合计：约 2.5～3.5 天** → 下周试用前可交付。

### 0.4 试用验收（运营自检）

- [ ] 用你的 admin 账号打开 `/admin`，非 admin 无法进入  
- [ ] 列表能搜到试用账号，200 条分页正常  
- [ ] 点进某用户能看到：连续天、阅读记录、任务、宠物三维、星星/世界进度  
- [ ] 改 coins 或饱食度后，用户刷新 App 数值一致  
- [ ] 审计表能查到刚才的修改  

---

## 1. 工期总览（分档）

| 交付档位 | 包含范围 | 标准工期 | 乐观工期（AI 辅助） | 首次可用 |
|----------|----------|----------|---------------------|----------|
| **A. 最小可用** | Admin 鉴权 + 用户/宠物运营 + 宝藏 CRUD + Dashboard + 审计 | **3～5 天** | **2～3 天** | 第 3～5 天可登录 `/admin` |
| **B. 内容 CMS** | A + 书目/阅读正文/故事章节/区域配置 + DB 导入 + 玩家端 loader | **+1～2 周** | **+5～8 天** | A 上线后约 1～2 周 |
| **C. 宠物与媒体** | B + 商店/品种/任务模板 + Storage 上传（头像、宠物图/视频） | **+3～5 天** | **+2～3 天** | B 完成后约 1 周 |
| **D. 一次性全包** | A + B + C + 全链路回归 | **3～5 周** | **2～3.5 周** | 全部完成后统一验收 |

**说明**

- **标准工期**：含自测、与 Supabase 联调、基础文档更新。  
- **乐观工期**：表单/列表复用 shadcn、迁移脚本一次跑通；不含大规模 UI 定制。  
- **3～5 周** 指的是 **D 全包**；**不是**「随便做个列表也要 3 周」。  
- 推荐路径：**A 先上线（约 1 周内）→ B → C**，运营不空等。

---

## 2. 模块开发计划表

### 2.1 基础与鉴权（档位 A · 约 1 天）

| 序号 | 任务 | 产出 | 估时 | 依赖 |
|------|------|------|------|------|
| A1 | `users.role` + `admin_audit_log` migration | SQL 迁移文件 | 0.5d | — |
| A2 | `lib/auth/require-admin.ts` | 403 守卫 | 0.5d | A1 |
| A3 | 首个 admin bootstrap（SQL 或 `BOOTSTRAP_ADMIN_EMAIL`） | 部署说明 | 0.25d | A1 |
| A4 | `/admin` layout + 侧边栏 + Dashboard 占位 | 页面骨架 | 0.5d | A2 |
| A5 | `middleware` / 页面层 admin 校验策略 | 文档约定 | 0.25d | A2 |

### 2.2 用户运营（档位 A · 约 1～1.5 天）

| 序号 | 任务 | 产出 | 估时 | 依赖 |
|------|------|------|------|------|
| A6 | `GET /api/admin/users` 分页/搜索 | API | 0.5d | A2 |
| A7 | `GET/PATCH /api/admin/users/[id]` | 详情、改 coins/streak/level | 0.5d | A6 |
| A8 | `PATCH /api/admin/users/[id]/role` | 设/撤 admin | 0.25d | A7 |
| A9 | `/admin/users` + `/admin/users/[id]` | 列表 + 详情 Tab（宠物/阅读/宝藏/任务） | 1d | A6～A8 |

### 2.3 宠物运营（档位 A · 约 0.5～1 天）

| 序号 | 任务 | 产出 | 估时 | 依赖 |
|------|------|------|------|------|
| A10 | `GET /api/admin/pets` | 全站宠物列表 | 0.25d | A2 |
| A11 | `GET/PATCH /api/admin/pets/[id]` | 三维/等级/死亡/背包修正 | 0.5d | A10 |
| A12 | `/admin/pets` + `/admin/pets/[id]` | 页面 | 0.5d | A10～A11 |

### 2.4 神秘宝藏（档位 A · 约 0.5～1 天）

| 序号 | 任务 | 产出 | 估时 | 依赖 |
|------|------|------|------|------|
| A13 | 宝藏定义 CRUD API | `treasure_definitions` | 0.5d | A2 |
| A14 | `/admin/treasures` 编辑页 | 条件类型、payload 表单 | 0.5d | A13 |
| A15 | 用户详情「已解锁宝藏」Tab | 只读 | 0.25d | A9, A13 |

### 2.5 安全与收尾（档位 A · 约 0.5 天）

| 序号 | 任务 | 产出 | 估时 | 依赖 |
|------|------|------|------|------|
| A16 | 写操作写入 `admin_audit_log` | 审计 | 0.25d | A2 |
| A17 | 加固 dev seed/recalc 需 admin | 安全 | 0.25d | A2 |
| A18 | Dashboard 统计（用户数/宠物数/今日阅读） | 概览 | 0.5d | A6, A10 |
| A19 | 更新 DEPLOYMENT + Admin 验收项 | 文档 | 0.25d | A1～A18 |

**档位 A 合计：约 3～5 天（标准） / 2～3 天（乐观）**

---

### 2.6 书架内容 CMS（档位 B · 约 4～6 天）

| 序号 | 任务 | 产出 | 估时 | 依赖 |
|------|------|------|------|------|
| B1 | `content_books` + `content_book_chapters` migration | 表结构 | 0.5d | A 完成 |
| B2 | 从 `moe-catalog` + `book-catalog` import 脚本 | 种子数据 | 1d | B1 |
| B3 | `lib/content/content-loader` 书架/正文 DB 优先 | 读取层 | 1d | B1, B2 |
| B4 | Admin 书目列表 + 元数据编辑 | `/admin/library/books` | 1d | B1 |
| B5 | Admin 阅读分章 CRUD | `/admin/library/books/[id]/chapters` | 1～1.5d | B1, B4 |
| B6 | 改造 `library-books` / 阅读页读 loader | 玩家端 | 0.5～1d | B3 |

### 2.7 冒险世界 CMS（档位 B · 约 3～5 天）

| 序号 | 任务 | 产出 | 估时 | 依赖 |
|------|------|------|------|------|
| B7 | `content_regions` + `content_story_chapters` migration | 表结构 | 0.5d | A 完成 |
| B8 | 从 `adventure-regions` + `story/chapters/*.json` import | 种子 | 1d | B7 |
| B9 | Admin 区域编辑 | `/admin/adventure/regions` | 0.5d | B7 |
| B10 | Admin 故事章节（JSON + zod 校验） | `/admin/adventure/story-chapters` | 1.5～2d | B7, B8 |
| B11 | 阅读记录只读排查 | `/admin/adventure/reading-records` | 0.5d | A6 |
| B12 | 改造 `load-chapter` / `adventure/config` | 玩家端 | 1d | B7, B8 |

**档位 B 合计（含 B1～B12）：约 +1～2 周（标准） / +5～8 天（乐观）**

---

### 2.8 宠物配置与媒体（档位 C · 约 3～5 天）

| 序号 | 任务 | 产出 | 估时 | 依赖 |
|------|------|------|------|------|
| C1 | `content_pet_shop_items` + `content_pet_breeds` + 任务模板表 | migration | 0.5d | B 建议完成 |
| C2 | import 自 `shop.ts` / `catalog.ts` / `daily-task-templates` | 种子 | 0.5d | C1 |
| C3 | Admin 商城 / 品种 / 任务模板页 | `/admin/pets/shop` 等 | 1.5d | C1 |
| C4 | Supabase Storage + 头像/宠物媒体上传 | `/admin/pets/media` 等 | 1.5～2d | C1 |
| C5 | 改造 `shop.ts` / `avatar-registry` DB 优先 | 玩家端 | 1d | C1, C2 |

**档位 C 合计：约 +3～5 天（标准） / +2～3 天（乐观）**

---

## 3. 里程碑与验收

| 里程碑 | 目标日期（示例） | 验收标准 |
|--------|------------------|----------|
| **M1 · Admin 可登录** | D+3～5 | admin 账号可进 `/admin`；非 admin 403 |
| **M2 · 运营闭环** | D+5～7 | 搜用户、改 coins、看阅读记录、改宠物三维、编辑宝藏 |
| **M3 · 书架 CMS** | M2 + 7～14d | 后台改书目/分章；书架与阅读页读 DB |
| **M4 · 冒险 CMS** | M3 + 3～7d | 后台改区域与 story JSON；闯关不回归 |
| **M5 · 宠物配置** | M4 + 3～5d | 后台改商店/品种/任务；媒体可上传 |
| **M6 · 全量回归** | 按所选档位 | [`V1_LAUNCH_CHECKLIST`](./V1_LAUNCH_CHECKLIST.md) + Admin 专项清单 |

---

## 4. 推荐排期（两种路径）

### 路径 1：分步交付（推荐）

```text
第 1 周    │ A1～A19  最小可用后台（用户/宠物/宝藏）
第 2～3 周 │ B1～B12  书架 + 冒险内容 CMS
第 4 周    │ C1～C5   宠物配置 + 媒体（可选并行部分 B）
```

**优点**：约 1 周内可运营；风险分散。  
**总时长**：约 **3～4 周** 到全功能（标准）。

### 路径 2：一次性全包

```text
第 1 周    │ A + B 表结构与 import + 部分 Admin 页
第 2～3 周 │ 全部 Admin 页 + content-loader + 玩家端改造
第 4～5 周 │ C 媒体 + 全链路回归 + 文档
```

**优点**：无中间态「部分能后台改、部分改代码」。  
**总时长**：约 **3～5 周**（标准） / **2～3.5 周**（乐观）。

---

## 5. 功能 ↔ 页面 ↔ 工期速查

| 业务 | Admin 页面 | 档位 | 估时 |
|------|------------|------|------|
| Dashboard | `/admin` | A | 0.5d |
| 用户列表/详情 | `/admin/users` | A | 1.5d |
| 宠物列表/详情 | `/admin/pets` | A | 1d |
| 神秘宝藏 | `/admin/treasures` | A | 1d |
| 书目目录 | `/admin/library/books` | B | 1d |
| 阅读正文分章 | `/admin/library/books/[id]/chapters` | B | 1～1.5d |
| 冒险区域 | `/admin/adventure/regions` | B | 0.5d |
| 故事闯关 JSON | `/admin/adventure/story-chapters` | B | 1.5～2d |
| 阅读记录排查 | `/admin/adventure/reading-records` | B | 0.5d |
| 宠物商城 | `/admin/pets/shop` | C | 0.5d |
| 物种品种 | `/admin/pets/catalog` | C | 0.5d |
| 每日任务模板 | `/admin/tasks/templates` | C | 0.5d |
| 头像/宠物媒体 | `/admin/pets/media` 等 | C | 1.5～2d |

---

## 6. 风险与缓冲

| 风险 | 影响 | 缓冲建议 |
|------|------|----------|
| 内容双写（DB + TS）不同步 | 玩家看到旧内容 | import 脚本 + 以 DB `updated_at` 为准；+0.5d |
| story JSON 编辑出错 | 闯关白屏 | zod 校验 + 预览；+0.5d |
| `reading_records` / `users` 列名兼容 | API 502 | 复用 `schema-compat`；已计入 A 模块 |
| Storage 权限与路径 | 媒体 404 | 单独 0.5d 联调 |
| 全包回归 | 延期 | 预留 **3～5 天** 回归（含在 D 档位上限） |

---

## 7. 部署一次性操作（Admin）

1. 执行 `20260601000000_admin_role.sql`（计划内 migration 名）  
2. `update public.users set role = 'admin' where email = '你的邮箱';`  
3. （档位 B）执行 content 表 migration + `pnpm run import:content`（计划内脚本）  
4. （档位 C）配置 Supabase Storage bucket 与策略  

---

## 8. 修订记录

| 日期 | 说明 |
|------|------|
| 2026-05-28 | v1.1：新增 §0 小范围试用版（200 账号）第一期范围与 2.5～3.5 天工期 |
| 2026-05-28 | v1.0：分档工期（A/B/C/D）、模块计划表、里程碑、推荐排期 |
