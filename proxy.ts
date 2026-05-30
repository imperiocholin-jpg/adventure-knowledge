import { NextResponse, type NextRequest } from "next/server"

const ACCESS_TOKEN_COOKIE = "sb-access-token"
const REFRESH_TOKEN_COOKIE = "sb-refresh-token"

const PUBLIC_PATH_PREFIXES = ["/auth", "/api/auth", "/_next", "/favicon.ico"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  const hasAccess = Boolean(request.cookies.get(ACCESS_TOKEN_COOKIE)?.value)
  const hasRefresh = Boolean(request.cookies.get(REFRESH_TOKEN_COOKIE)?.value)

  if (!hasAccess && !hasRefresh) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/auth"
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"],
}
