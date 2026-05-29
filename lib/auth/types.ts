/** 登录渠道（后期微信小程序走 wechat_mp） */
export type AuthProvider = "email" | "wechat_mp" | "wechat_open"

export interface AuthSessionPayload {
  user: {
    id: string
    email: string | null
  }
  /** 小程序端无法依赖 Cookie 时返回 */
  session?: {
    accessToken: string
    refreshToken: string
    expiresAt?: number
  }
  provider: AuthProvider
}
