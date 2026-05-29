import { NextRequest, NextResponse } from "next/server"

/**
 * 微信小程序登录占位接口（尚未启用）
 *
 * 启用后流程：
 * 1. 小程序 wx.login() 取得 code
 * 2. POST { code } 到本接口
 * 3. 服务端 code2Session → openid/unionid
 * 4. 查/建 Supabase 用户 + user_auth_identities(provider=wechat_mp)
 * 5. 签发 Supabase Session，exposeTokensInBody: true 供小程序存本地
 *
 * 详见 docs/WECHAT_AUTH_AND_MINIPROGRAM.md
 */
export const dynamic = "force-dynamic"

interface WechatMiniProgramPayload {
  code?: string
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as WechatMiniProgramPayload
  if (!body.code?.trim()) {
    return NextResponse.json({ ok: false, error: { message: "缺少微信登录 code。" } }, { status: 400 })
  }

  const appId = process.env.WECHAT_MP_APP_ID
  const appSecret = process.env.WECHAT_MP_APP_SECRET
  if (!appId || !appSecret) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          message: "微信小程序登录尚未配置。请在服务端设置 WECHAT_MP_APP_ID / WECHAT_MP_APP_SECRET。",
          code: "WECHAT_MP_NOT_CONFIGURED",
        },
      },
      { status: 501 },
    )
  }

  return NextResponse.json(
    {
      ok: false,
      error: {
        message: "微信小程序登录接口已预留，业务逻辑待接入。请先使用邮箱注册/登录。",
        code: "WECHAT_MP_NOT_IMPLEMENTED",
      },
    },
    { status: 501 },
  )
}
