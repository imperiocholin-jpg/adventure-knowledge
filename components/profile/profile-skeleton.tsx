"use client"

export function ProfileHeroSkeleton() {
  return (
    <div className="w-full px-4 pt-3">
      <div className="animate-pulse rounded-2xl border border-border/50 bg-card p-3.5">
        <div className="flex items-start gap-3">
          <div className="h-[3.75rem] w-[3.75rem] shrink-0 rounded-full bg-muted" />
          <div className="min-w-0 flex-1 space-y-2 pt-1">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="flex gap-2">
              <div className="h-5 w-20 rounded-full bg-muted" />
              <div className="h-5 w-16 rounded-full bg-muted" />
            </div>
            <div className="h-3 w-40 rounded bg-muted" />
            <div className="h-3 w-28 rounded bg-muted" />
          </div>
        </div>
        <div className="mt-3 flex gap-4 border-t border-border/40 pt-3">
          <div className="h-4 w-12 rounded bg-muted" />
          <div className="h-4 w-12 rounded bg-muted" />
          <div className="h-4 w-16 rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}

export function UserHomeSkeleton() {
  return (
    <div className="pb-10">
      <ProfileHeroSkeleton />
      <div className="space-y-4 px-4 pt-3">
        <div className="animate-pulse rounded-2xl border border-border/50 bg-card p-4">
          <div className="mb-3 h-4 w-24 rounded bg-muted" />
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-20 rounded bg-muted" />
              <div className="h-3 w-32 rounded bg-muted" />
              <div className="h-2 w-full rounded-full bg-muted" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
