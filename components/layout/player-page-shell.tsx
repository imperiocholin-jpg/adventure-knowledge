import { cn } from "@/lib/utils"

/** 玩家端统一内容区最大宽度（与 BottomNavigation 一致，约 448px） */
export const PLAYER_SHELL_MAX_CLASS = "max-w-md"

/** 玩家端水平内边距 */
export const PLAYER_SHELL_GUTTER_CLASS = "px-4"

/** 为底部导航预留空间 */
export const PLAYER_SHELL_BOTTOM_PAD = "pb-24"

export const playerShellContainerClass = cn("mx-auto w-full", PLAYER_SHELL_MAX_CLASS)

export const playerShellContentClass = cn(playerShellContainerClass, PLAYER_SHELL_GUTTER_CLASS)

interface PlayerPageShellProps {
  children: React.ReactNode
  /** 页面根节点额外 class（背景、渐变等） */
  className?: string
  /** 底部留白：nav=标准导航，nav-md=首页，nav-lg=宠物页，compact=设置子页，reader=阅读页，none=不留白 */
  bottomPad?: "nav" | "nav-md" | "nav-lg" | "compact" | "reader" | "none"
  /** 内容区是否自带 px-4；子组件已有 px-4 时设为 false */
  withGutter?: boolean
}

const BOTTOM_PAD_CLASS = {
  nav: PLAYER_SHELL_BOTTOM_PAD,
  "nav-md": "pb-28",
  "nav-lg": "pb-40",
  compact: "pb-8",
  reader: "pb-12",
  none: "",
} as const

/**
 * 玩家端页面统一壳层：限制最大宽度并居中，保证各 Tab 页在宽屏/不同手机上视觉一致。
 */
export function PlayerPageShell({
  children,
  className,
  bottomPad = "nav",
  withGutter = false,
}: PlayerPageShellProps) {
  return (
    <div
      className={cn(
        "min-h-screen min-h-[100dvh] w-full",
        BOTTOM_PAD_CLASS[bottomPad],
        className,
      )}
    >
      <div className={cn(playerShellContainerClass, withGutter && PLAYER_SHELL_GUTTER_CLASS)}>
        {children}
      </div>
    </div>
  )
}

interface PlayerStickyHeaderProps {
  children: React.ReactNode
  className?: string
}

/** 玩家端 sticky 顶栏：宽度跟随 shell，不铺满整个浏览器 */
export function PlayerStickyHeader({ children, className }: PlayerStickyHeaderProps) {
  return (
    <header className={cn("sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/30", className)}>
      {children}
    </header>
  )
}

/** 玩家端全屏 loading / 空状态占位 */
export function PlayerPageLoading({
  message = "加载中…",
  className,
}: {
  message?: string
  className?: string
}) {
  return (
    <PlayerPageShell bottomPad="none" className={cn("flex items-center justify-center bg-background", className)}>
      <p className="text-sm text-muted-foreground">{message}</p>
    </PlayerPageShell>
  )
}
