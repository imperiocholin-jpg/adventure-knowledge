"use client"

import Link from "next/link"
import { Home, BookOpen, Compass, PawPrint, User, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

type NavItem = "home" | "library" | "adventure" | "pets" | "profile"

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
  activeItem = "home",
  onNavigate,
}: BottomNavigationProps) {
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md">
      {/* Floating navigation container */}
      <nav className="relative flex items-center justify-around rounded-2xl bg-white border border-border/30 shadow-lg px-2 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeItem === item.id
          const isAdventure = item.id === "adventure"

          // Special rendering for Adventure button
          if (isAdventure) {
            return (
              <Link
                key={item.id}
                href={item.href}
                prefetch={true}
                onClick={() => onNavigate?.(item.id)}
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
              </Link>
            )
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              prefetch={true}
              onClick={() => onNavigate?.(item.id)}
              className={cn(
                "relative flex flex-col items-center gap-0.5 rounded-xl px-4 py-2 transition-colors",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
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
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
