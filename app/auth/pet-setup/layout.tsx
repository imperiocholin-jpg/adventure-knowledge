import { Suspense } from "react"

import { PlayerPageLoading } from "@/components/layout/player-page-shell"

export default function PetSetupLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PlayerPageLoading message="加载中..." />}>
      {children}
    </Suspense>
  )
}
