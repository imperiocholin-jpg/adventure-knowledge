"use client"

import { usePathname, useRouter } from "next/navigation"
import { Home, BookOpen, Compass, PawPrint, User, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { PLAYER_SHELL_MAX_CLASS } from "@/components/layout/player-page-shell"

type NavItem = "home" | "library" | "adventure" | "pets" | "profile"

export function resolveActiveNavItem(pathname: string): NavItem {
  if (pathname === "/") return "home"
  if (pathname.startsWith("/library")) return "library"
  if (pathname.startsWith("/adventure")) return "adventure"
  if (
    pathname.startsWith("/pets") ||
    pathname.startsWith("/battle") ||
    pathname.startsWith("/leaderboard")
  ) {
    return "pets"
  }
  if (pathname.startsWith("/profile")) return "profile"
  return "home"
}

interface BottomNavigationProps {
  activeItem?: NavItem
  onNavigate?: (item: NavItem) => void
}

const navItems: { id: NavItem; label: string; icon: typeof Home; href: string }[] = [
  { id: "home", label: "首页", icon: Home, href: "/" },
  { id: "library", label: "书架", icon: BookOpen, href: "/library" },
  { id: "adventure", label: "冒险", icon: Compass, href: "/adventure" },
  { id: "pets", label: "宠物", icon: PawPrint, href: "/pets" },
  { id: "profile", label: "我的", icon: User, href: "/profile" },
]

export function BottomNavigation({
  activeItem,
  onNavigate,
}: BottomNavigationProps) {
  const pathname = usePathname()
  const router = useRouter()
  const resolvedActiveItem = activeItem ?? resolveActiveNavItem(pathname)

  const handleNavClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    id: NavItem,
  ) => {
    onNavigate?.(id)
    if (pathname === href) {
      event.preventDefault()
      return
    }
    // 优先客户端路由；若未生效则回退整页跳转（避免生产环境 hydration 异常时点击无反应）
    event.preventDefault()
    router.push(href)
    window.setTimeout(() => {
      const targetPath = href.split("?")[0]
      if (window.location.pathname !== targetPath) {
        window.location.assign(href)
      }
    }, 400)
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <nav
        className={cn(
          "pointer-events-auto relative mx-auto flex w-full items-center justify-around rounded-2xl border border-border/30 bg-white px-2 py-1.5 shadow-lg",
          PLAYER_SHELL_MAX_CLASS,
        )}
      >
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = resolvedActiveItem === item.id
          const isAdventure = item.id === "adventure"

          // Special rendering for Adventure button
          if (isAdventure) {
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={(event) => handleNavClick(event, item.href, item.id)}
                className="relative flex flex-col items-center -mt-5"
              >
                {/* Floating circle button */}
                <div className={cn(
                  "relative flex items-center justify-center w-14 h-14 rounded-full transition-colors",
                  isActive 
                    ? "bg-gradient-to-br from-primary to-emerald-600 shadow-lg" 
                    : "bg-gradient-to-br from-primary/90 to-emerald-600/90 shadow-md"
                )}>
                  <Icon 
                    className="h-7 w-7 text-white" 
                    strokeWidth={2}
                  />
                  {/* Sparkle */}
                  <Sparkles className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 text-amber-300" />
                </div>
                {/* Label below the circle */}
                <span className="text-[10px] font-semibold text-primary mt-1">
                  {item.label}
                </span>
              </a>
            )
          }

          return (
            <a
              key={item.id}
              href={item.href}
              onClick={(event) => handleNavClick(event, item.href, item.id)}
              className={cn(
                "relative flex flex-col items-center gap-0.5 rounded-xl px-4 py-2 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {/* Active background */}
              {isActive && (
                <div className="absolute inset-0 rounded-xl bg-primary/10" />
              )}
              
              {/* Icon */}
              <Icon 
                className={cn(
                  "h-5 w-5",
                  isActive && "scale-110"
                )} 
                fill={isActive ? "currentColor" : "none"}
                strokeWidth={isActive ? 1.5 : 2}
              />
              
              {/* Label */}
              <span className={cn(
                "text-[10px] font-medium relative",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
            </a>
          )
        })}
      </nav>
    </div>
  )
}
