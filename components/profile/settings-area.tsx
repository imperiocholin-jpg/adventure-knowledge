"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { 
  MoreHorizontal, X, Bell, User, Shield, HelpCircle, ChevronRight
} from "lucide-react"

interface SettingsAreaProps {
  onSettings?: () => void
  onFeedback?: () => void
  onParentArea?: () => void
  onAccount?: () => void
}

export function SettingsArea({
  onSettings,
  onFeedback,
  onParentArea,
  onAccount,
}: SettingsAreaProps) {
  const [isOpen, setIsOpen] = useState(false)

  const menuItems = [
    { icon: Bell, label: "消息通知", onClick: onSettings },
    { icon: User, label: "账号管理", onClick: onAccount },
    { icon: Shield, label: "家长专区", onClick: onParentArea, highlight: true },
    { icon: HelpCircle, label: "帮助反馈", onClick: onFeedback },
  ]

  return (
    <>
      {/* Compact "More" button */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 text-muted-foreground hover:text-foreground transition-colors"
      >
        <MoreHorizontal className="h-5 w-5" />
        <span className="text-sm">更多设置</span>
      </button>
      
      {/* Floating drawer overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          {/* Drawer */}
          <div 
            className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl p-5 pb-8 animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full bg-muted" />
            </div>
            
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
            
            {/* Menu items */}
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      item.onClick?.()
                      setIsOpen(false)
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl transition-all",
                      "hover:bg-muted/50 active:scale-[0.98]",
                      item.highlight && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center",
                        item.highlight ? "bg-primary/10" : "bg-muted"
                      )}>
                        <Icon className={cn(
                          "h-5 w-5",
                          item.highlight ? "text-primary" : "text-muted-foreground"
                        )} />
                      </div>
                      <span className={cn(
                        "text-sm",
                        item.highlight ? "font-medium text-foreground" : "text-foreground"
                      )}>
                        {item.label}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
