"use client"

import { cn } from "@/lib/utils"
import {
  ChevronRight,
  LogOut,
  Settings,
  Shield,
} from "lucide-react"

export interface ProfileMenuItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  description?: string
  onClick?: () => void
  href?: string
  highlight?: boolean
  danger?: boolean
  disabled?: boolean
}

interface ProfileMenuListProps {
  items: ProfileMenuItem[]
  onNavigate: (href: string) => void
}

export function ProfileMenuList({ items, onNavigate }: ProfileMenuListProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
      {items.map((item, index) => {
        const Icon = item.icon
        return (
          <button
            key={item.label}
            type="button"
            disabled={item.disabled}
            onClick={() => {
              if (item.disabled) return
              if (item.onClick) item.onClick()
              else if (item.href) onNavigate(item.href)
            }}
            className={cn(
              "flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors",
              index > 0 && "border-t border-border/40",
              item.disabled ? "opacity-50" : "hover:bg-muted/40 active:bg-muted/60",
              item.danger && "text-rose-600",
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl",
                  item.danger ? "bg-rose-50" : item.highlight ? "bg-primary/10" : "bg-muted",
                )}
              >
                <Icon className={cn("h-4 w-4", item.danger ? "text-rose-500" : "text-muted-foreground")} />
              </div>
              <div>
                <p className={cn("text-sm", item.danger ? "font-medium text-rose-600" : "font-medium text-foreground")}>
                  {item.label}
                </p>
                {item.description ? (
                  <p className="text-[10px] text-muted-foreground">{item.description}</p>
                ) : null}
              </div>
            </div>
            {!item.danger && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </button>
        )
      })}
    </div>
  )
}

export function buildDefaultProfileMenuItems(options: {
  onLogout: () => void
}): ProfileMenuItem[] {
  return [
    { icon: Settings, label: "账号与安全", description: "登录邮箱与退出", href: "/profile/account" },
    {
      icon: Shield,
      label: "家长专区",
      description: "即将上线",
      disabled: true,
    },
    { icon: LogOut, label: "退出登录", onClick: options.onLogout, danger: true },
  ]
}
