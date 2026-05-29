# 微信小程序 + 微信登录（架构预留）

本文说明如何在**不推翻现有注册流程**的前提下，后期接入微信小程序，并支持**微信一键登录**。

---

## 当前 Web 注册流程（保持不变）

```text
/auth 邮箱注册/登录
  → /auth/profile-setup（昵称 + 系统头像）
  → /auth/pet-setup（宠物名 + 品种）
  → /pets
```

微信登录用户**同样走 profile-setup → pet-setup**，仅「第 0 步认证方式」不同。

---

## 目标架构（推荐）

```text
                    ┌─────────────────┐
                    │  Supabase Auth  │
                    │  (统一 user_id)│
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   邮箱+密码            微信小程序 code          （未来）微信开放平台
   /api/auth/*          /api/auth/wechat/       OAuth H5
                        miniprogram
        │                    │                    │
        └────────────────────┴────────────────────┘
                             │
                    ensureUserBootstrap
                    （users / pets / tasks）
                             │
              未完成资料 → profile-setup → pet-setup
              已完成     → 首页 / 宠物页
```

**原则：**

1. **一个 Supabase `auth.users.id`** = 游戏内唯一用户（`users.id` / `pets.user_id`）。
2. **多种登录方式** 记在 `user_auth_identities`（`provider` + `provider_uid`）。
3. **业务 API 只认 Session**（Cookie 或 `Authorization: Bearer`），不关心渠道。

---

## 已做的代码预留

| 项 | 说明 |
|----|------|
| `lib/auth/finish-auth-session.ts` | 登录成功后统一：bootstrap + 写 Cookie + 可选返回 token |
| `lib/auth/server.ts` | API 支持 `Authorization: Bearer`（小程序用） |
| `user_auth_identities` 表 | 绑定 email / wechat_mp openid |
| `POST /api/auth/wechat/miniprogram` | 占位接口，配置 AppId 后接 code2Session |
| `lib/auth/resolve-post-auth-path.ts` | Web/小程序共用「资料是否完成」判断 |

---

## 微信小程序登录（待实现步骤）

### 1. 微信侧配置

- 注册[微信小程序](https://mp.weixin.qq.com/)，拿到 **AppID / AppSecret**。
- 服务器域名加入 request 合法域名（你的 API 域名）。
- 环境变量（Vercel / 自建 Node）：

```env
WECHAT_MP_APP_ID=wx...
WECHAT_MP_APP_SECRET=...
```

### 2. 小程序端

```javascript
// 伪代码
const { code } = await wx.login()
const res = await request({
  url: 'https://你的域名/api/auth/wechat/miniprogram',
  method: 'POST',
  data: { code },
})
// res.data.session.accessToken / refreshToken 存 wx.setStorageSync
// 之后请求带 header: Authorization: `Bearer ${accessToken}`
```

### 3. 服务端（在占位 route 内实现）

1. `GET https://api.weixin.qq.com/sns/jscode2session?appid&secret&js_code&grant_type=authorization_code`
2. 得到 `openid`（必须）、`unionid`（可选，需开放平台绑定）。
3. 查 `user_auth_identities` where `provider='wechat_mp' and provider_uid=openid`。
4. **新用户**：`auth.admin.createUser`（可无邮箱）→ 写入 identity → `ensureUserBootstrap`。
5. **老用户**：取已有 `user_id`，用 Admin API 创建 session（或 Supabase 自定义 JWT 方案）。
6. 调用 `finishAuthSession(user, session, { provider: 'wechat_mp', exposeTokensInBody: true })`。
7. 返回 `nextPath`（或让小程序自己调 `/api/users` + `/api/pets` 后走 `resolvePostAuthPath` 逻辑）。

### 4. 小程序内引导流程

与 Web 相同：

- 无 `profile_setup_completed` → 小程序页「设置昵称+头像」→ 调 `POST /api/users/profile-setup`。
- 无宠物档案 → 小程序页「创建宠物」→ 调 `POST /api/pets/setup`。

---

## 微信登录 vs 邮箱登录 账号合并（后期）

若用户先邮箱注册、后用微信登录同一微信，需要**显式绑定**（设置页「绑定微信」）：

- 已登录状态下再 `wx.login`，把 openid 写入 `user_auth_identities`，`user_id` 为当前用户。
- 避免两个 Supabase 账号。

---

## 与现有部署的关系

- 执行 SQL：`supabase/scripts/apply-user-auth-identities.sql`（或 migration `20260530180000`）。
- Web 端无需改用户可见流程，直到小程序上线并在 `/auth` 增加「微信登录」入口。

---

## 环境变量清单（汇总）

| 变量 | 用途 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 已有 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 已有 |
| `SUPABASE_SERVICE_ROLE_KEY` | 已有（微信建号/发 session 需要） |
| `WECHAT_MP_APP_ID` | 小程序 AppID（待配） |
| `WECHAT_MP_APP_SECRET` | 小程序 Secret（待配） |

---

*文档版本：2026-05 · 与当前 `v0-app` 代码对齐*
