import { Suspense } from "react"

import { PlayerPageLoading } from "@/components/layout/player-page-shell"

export default function AdventureLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PlayerPageLoading message="加载冒险地图..." />}>
      {children}
    </Suspense>
  )
}
