import { cn } from "@/lib/utils"

export function ProfileNameSkeleton({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-block h-4 animate-pulse rounded-md bg-muted", className ?? "w-20")}
      aria-hidden
    />
  )
}
