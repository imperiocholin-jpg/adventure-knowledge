"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/admin", label: "总览", exact: true },
  {
    href: "/admin/users",
    label: "用户管理",
    description: "查看用户并调整数值",
    exact: false,
  },
  {
    href: "/admin/pets",
    label: "宠物管理",
    description: "管理宠物类型与素材",
    exact: false,
  },
  {
    href: "/admin/books",
    label: "书架管理",
    description: "管理书籍相关数据",
    exact: false,
  },
  {
    href: "/admin/questions",
    label: "题库审核",
    description: "审核阅读冒险题目",
    exact: false,
  },
  {
    href: "/admin/shop",
    label: "商城管理",
    description: "管理商城物品",
    exact: false,
  },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs text-slate-500">冒险知识 · 运营后台</p>
            <h1 className="text-lg font-semibold">试用版控制台</h1>
          </div>
          <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">
            返回 App
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
        <aside className="w-52 shrink-0">
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block rounded-lg px-3 py-2 transition-colors",
                    active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100",
                  )}
                >
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.description ? (
                    <span
                      className={cn(
                        "mt-0.5 block text-[11px] leading-snug",
                        active ? "text-slate-300" : "text-slate-400",
                      )}
                    >
                      {item.description}
                    </span>
                  ) : null}
                </Link>
              )
            })}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
