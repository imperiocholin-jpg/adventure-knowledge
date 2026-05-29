# 消息通知规则 v1

> 版本：v1.0  
> 更新日期：2026-06-03  
> 适用范围：`v0-app` 玩家端消息中心（`/notifications`）

---

## 1. 目标与原则

消息系统用于把**冒险、书库、宠物、任务**等关键动态集中展示在顶栏铃铛与消息列表中，帮助小冒险家及时回到对应页面行动。

设计原则：

1. **事件驱动**：消息由服务端业务逻辑写入，不依赖前端 mock。
2. **幂等去重**：同类提醒通过 `dedupe_key` 避免重复刷屏。
3. **可跳转**：每条消息尽量带 `href`，点击直达相关页面。
4. **失败不阻断**：写消息失败只打日志，不影响阅读/对战/领任务等主流程。
5. **表不存在时降级**：若 `user_notifications` 表未迁移，服务端静默跳过，前端显示空列表。

---

## 2. 数据模型

### 2.1 表结构

迁移文件：`supabase/migrations/20260603000000_user_notifications.sql`

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | uuid | 主键 |
| `user_id` | text | 用户 ID |
| `category` | text | `adventure` / `library` / `pet` / `system` |
| `rule_key` | text | 规则键，见第 3 节 |
| `dedupe_key` | text | 去重键，可为空；同一用户下唯一 |
| `title` | text | 标题 |
| `body` | text | 正文 |
| `href` | text | 跳转路径 |
| `payload` | jsonb | 扩展数据（宝藏 ID、区域 ID 等） |
| `read_at` | timestamptz | 已读时间，空=未读 |
| `created_at` | timestamptz | 创建时间 |

### 2.2 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/notifications` | 返回 `{ items, unreadCount }` |
| PATCH | `/api/notifications` | `{ id }` 单条已读，或 `{ all: true }` 全部已读 |

### 2.3 代码入口

| 模块 | 路径 |
|------|------|
| 规则常量 | `lib/notifications/rules.ts` |
| 写入/查询 | `lib/notifications/server.ts` |
| 业务触发 | `lib/notifications/emitters.ts` |
| 客户端 | `lib/notifications/notifications-client.ts` |
| React Hook | `hooks/use-notifications.ts` |
| 消息页 | `app/notifications/page.tsx` |
| 顶栏角标 | `components/layout/player-page-header.tsx` |

---

## 3. 规则清单

### 3.1 冒险类（`adventure`）

| rule_key | 标题 | 触发条件 | 去重键 | 跳转 |
|----------|------|----------|--------|------|
| `welcome` | 欢迎来到阅读大陆 | 完成资料设置（`POST /api/users/profile-setup`） | `welcome` | `/adventure/magic-forest` |
| `region_unlock` | 新区域解锁 | 冒险进度变化后，某区域从「未解锁→已解锁」 | `region_unlock:{regionId}` | `/adventure/{regionId}` |
| `region_progress` | 区域进度提醒 | 某已解锁区域进度 ≥ **80%** | `region_progress:{regionId}` | `/adventure/{regionId}` |
| `boss_victory` | 守护者已击败 | BOSS 挑战胜利结算（`POST /api/adventure/boss/complete`） | `boss_victory:{regionId}` | `/adventure/{regionId}` |
| `streak_milestone` | 连续活跃里程碑 | 连续活跃天数达到 **7 / 14 / 30** | `streak:{days}` | `/profile` |

**区域解锁判定**：对比活动前后的 `fetchUserAdventureProgress()` 快照，逻辑与 `lib/adventure/server-progress.ts` 一致（前一区域进度达标则解锁下一区域）。

**区域进度阈值**：`REGION_PROGRESS_REMINDER_THRESHOLD = 80`（见 `lib/notifications/rules.ts`）。

---

### 3.2 书库类（`library`）

| rule_key | 标题 | 触发条件 | 去重键 | 跳转 |
|----------|------|----------|--------|------|
| `treasure_unlock` | 宝藏图鉴更新 | `syncUserTreasures` 新解锁宝藏 | `treasure:{treasureId}` | `/library/treasures` |
| `reading_reward` | 阅读奖励到账 | 阅读完成（`POST /api/reading/complete`） | `reading_reward:{YYYY-MM-DD}` | `/library` |
| `book_recommend` | 新书推荐 | 当日**首次**记录活跃，且存在未完成书目 | `book_recommend:{YYYY-Www}` | `/library` |

**宝藏解锁**：在 `lib/treasures/server.ts` 的 `syncUserTreasures` 内，每当 `newlyUnlocked` 写入成功后触发。

**新书推荐**：统计 `reading_records` 中 `progress < 100` 且未 completed 的书目数；每周最多 1 条（ISO 周）。

---

### 3.3 宠物类（`pet`）

| rule_key | 标题 | 触发条件 | 去重键 | 跳转 |
|----------|------|----------|--------|------|
| `pet_low_satiety` | 伙伴需要照顾 | 饱食度 < **50** | `pet_satiety:{YYYY-MM-DD}` | `/pets` |
| `pet_low_spirit` | 伙伴需要休息 | 精神值 < **50** | `pet_spirit:{YYYY-MM-DD}` | `/pets` |
| `pet_low_bond` | 伙伴想你了 | 亲密值 < **50** | `pet_bond:{YYYY-MM-DD}` | `/pets` |
| `pet_death` | 伙伴离开了 | 饱食度降至 0，宠物进入离世状态 | `pet_death:{petId}` | `/pets` |

**阈值**：与首页心情判定一致，`PET_CARE_THRESHOLD = 50`（对应 `lib/pets/state.ts` 中 `HOME_MOOD_THRESHOLD`）。

**触发入口**：

- `POST /api/pets/daily-decay` — 每日衰减后
- `POST /api/pets/interact` — 互动后（含饿死）
- `POST /api/battle/enter` — 入场扣减状态后
- `POST /api/battle/settle` — 结算扣减状态后（若入场已扣减则 skip）

同一自然日、同一维度（饱食/精神/亲密）最多 1 条提醒。

---

### 3.4 系统类（`system`）

| rule_key | 标题 | 触发条件 | 去重键 | 跳转 |
|----------|------|----------|--------|------|
| `task_reward` | 任务奖励领取 | 领取每日任务奖励（`POST /api/tasks/claim`） | `task_reward:{taskId}:{YYYY-MM-DD}` | `/` |

---

## 4. 触发链路总览

```
资料设置完成 ──────────────────────────► welcome
每日活跃（首页/我的） ─────────────────► welcome + streak_milestone + book_recommend
                                              └─► syncUserTreasures ─► treasure_unlock

阅读完成 ──────────────────────────────► reading_reward
         │                                region_unlock / region_progress
         │                                streak_milestone（若 streak 变化）
         └─► syncUserTreasures ─────────► treasure_unlock

领取任务 ──────────────────────────────► task_reward + streak + treasure_unlock

BOSS 胜利 ─────────────────────────────► boss_victory + region_* + treasure_unlock

宠物每日衰减 / 互动 / 对战入场·结算 ──► pet_low_* / pet_death
```

---

## 5. 前端行为

### 5.1 未读角标

- `PlayerPageHeader` 内使用 `useNotifications()` 拉取 `/api/notifications`。
- 未读数 > 99 显示 `99+`。
- 窗口重新聚焦时自动刷新。

### 5.2 消息列表

- 未读：浅主色底 + 红点。
- 点击单条：标记已读并跳转（若有 `href`）。
- 「全部已读」：PATCH `{ all: true }`。
- 时间展示：刚刚 / N 分钟前 / 今天 HH:mm / 昨天 / N 天前 / M 月 D 日。

### 5.3 跨页同步

- 标记已读后派发 `notifications-updated` 事件，顶栏角标与列表保持一致。

---

## 6. 运维与扩展

### 6.1 部署前检查

1. 在 Supabase 执行迁移 `20260603000000_user_notifications.sql`。
2. 确认 RLS 策略允许用户读取/更新自己的消息。
3. 登录后完成一次阅读或每日活跃，检查 `/api/notifications` 是否有数据。

### 6.2 保留策略

- 列表默认返回最近 **100** 条（`MAX_NOTIFICATIONS_LIST`）。
- 文档约定保留 **90** 天；清理 cron 可后续在 Supabase Edge Function 或管理端实现。

### 6.3 后续可扩展

| 方向 | 说明 |
|------|------|
| 推送 | Web Push / 小程序订阅消息 |
| 管理端 | 运营广播、系统维护通知 |
| 已读同步 | 多设备 WebSocket |
| 消息偏好 | 用户关闭某类提醒 |
| 清理任务 | 按 `NOTIFICATION_RETENTION_DAYS` 自动归档 |

---

## 7. 新增规则 Checklist

新增一种消息时，请按顺序完成：

1. 在 `lib/notifications/rules.ts` 增加 `NOTIFICATION_RULE_KEYS` 常量。
2. 在 `lib/notifications/emitters.ts` 增加 `emitXxxNotification()`。
3. 在对应 API Route 或 `*-server.ts` 成功分支调用 emitter。
4. 定义明确的 `dedupe_key` 规则并更新本文档第 3 节表格。
5. 本地验证：触发业务 → GET `/api/notifications` → 消息页与角标正确。

---

## 8. 与旧 Mock 的关系

原 `lib/notifications/mock-notifications.ts` 中的静态示例数据**已废弃**。  
消息数据以数据库为准；表不可用时前端显示「暂无新消息」，角标为 0。
