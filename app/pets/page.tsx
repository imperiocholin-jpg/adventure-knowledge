"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  ChevronLeft, Bell, Settings, Heart, Sparkles, 
  BookOpen, Crown, Moon, Dumbbell, Swords, Trophy, ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { PetShowcase } from "@/components/pets/pet-showcase"
import { PetEquipment } from "@/components/pets/pet-equipment"
import { PetCollection } from "@/components/pets/pet-collection"
import { BottomNavigation } from "@/components/game/bottom-navigation"

export default function PetsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"home" | "equipment" | "collection">("home")
  const [showReward, setShowReward] = useState<{ type: string; amount: number } | null>(null)

  // Simulated pet data - now using household pets
  const petData = {
    emoji: "🐕",
    name: "毛毛",
    type: "corgi" as const,
    level: 12,
    rarity: "epic" as const,
    mood: "happy" as const,
    affectionLevel: 85,
    companionDays: 28,
  }

  const handleNavigation = (item: string) => {
    if (item === "home") router.push("/")
    if (item === "library") router.push("/library")
    if (item === "adventure") router.push("/adventure")
  }

  // Interaction handlers with reward feedback
  const handleFeed = () => {
    setShowReward({ type: "heart", amount: 5 })
    setTimeout(() => setShowReward(null), 1500)
  }

  const handlePlay = () => {
    setShowReward({ type: "joy", amount: 10 })
    setTimeout(() => setShowReward(null), 1500)
  }

  const handleSleep = () => {
    setShowReward({ type: "energy", amount: 20 })
    setTimeout(() => setShowReward(null), 1500)
  }

  const handleTrain = () => {
    setShowReward({ type: "exp", amount: 15 })
    setTimeout(() => setShowReward(null), 1500)
  }

  const handleDress = () => {
    // Navigate to equipment tab
    setActiveTab("equipment")
  }

  return (
    <div className="min-h-screen bg-background pb-40 relative overflow-hidden">
      {/* Header - clean and minimal */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center justify-between px-4 py-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
            onClick={() => router.push("/")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-foreground">我的伙伴</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="rounded-full relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative px-4 py-4 space-y-4 max-w-md mx-auto z-10">
        {/* Pet showcase - large and immersive */}
        <PetShowcase
          petEmoji={petData.emoji}
          petName={petData.name}
          level={petData.level}
          rarity={petData.rarity}
          mood={petData.mood}
          petType={petData.type}
          affectionLevel={petData.affectionLevel}
          companionDays={petData.companionDays}
          onPetTap={() => console.log("Pet tapped!")}
          onFeed={handleFeed}
          onPlay={handlePlay}
          onSleep={handleSleep}
          onTrain={handleTrain}
          onDress={handleDress}
        />

        {/* Reward popup */}
        {showReward && (
          <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 animate-in fade-in-0 zoom-in-95 duration-300">
            <div className="bg-white rounded-2xl px-6 py-4 shadow-2xl border border-amber-100 flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center",
                showReward.type === "heart" ? "bg-pink-100" :
                showReward.type === "joy" ? "bg-amber-100" :
                showReward.type === "energy" ? "bg-blue-100" : "bg-green-100"
              )}>
                {showReward.type === "heart" && <Heart className="h-6 w-6 text-pink-500 fill-pink-500" />}
                {showReward.type === "joy" && <Sparkles className="h-6 w-6 text-amber-500" />}
                {showReward.type === "energy" && <Moon className="h-6 w-6 text-blue-500" />}
                {showReward.type === "exp" && <Dumbbell className="h-6 w-6 text-green-500" />}
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  {showReward.type === "heart" && "亲密度 +5"}
                  {showReward.type === "joy" && "快乐值 +10"}
                  {showReward.type === "energy" && "精力 +20"}
                  {showReward.type === "exp" && "经验 +15"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {showReward.type === "heart" && "毛毛很开心~"}
                  {showReward.type === "joy" && "玩得真开心!"}
                  {showReward.type === "energy" && "休息好了~"}
                  {showReward.type === "exp" && "变强了!"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab navigation - simplified */}
        <div className="flex gap-2 bg-muted/50 rounded-2xl p-1.5">
          {[
            { id: "home", label: "主页", icon: Heart },
            { id: "equipment", label: "装备", icon: Crown },
            { id: "collection", label: "图鉴", icon: BookOpen },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  activeTab === tab.id 
                    ? "bg-white text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <div className="space-y-4">
          {activeTab === "home" && (
            <div className="space-y-4">
              {/* Pet Battle Entry - prominent CTA */}
              <button 
                onClick={() => router.push("/battle")}
                className="w-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 rounded-2xl p-4 text-left shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
              >
                {/* Background decoration */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(255,255,255,0.3),transparent_60%)]" />
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Swords className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                        宠物知识大赛
                        <Trophy className="h-4 w-4 text-amber-200" />
                      </h3>
                      <p className="text-xs text-white/80">和{petData.name}一起参加答题挑战!</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
                    <span className="text-xs font-medium text-white">开始挑战</span>
                    <ChevronRight className="h-4 w-4 text-white" />
                  </div>
                </div>
                
                {/* Stats preview */}
                <div className="relative mt-3 flex items-center gap-4 text-white/90">
                  <div className="flex items-center gap-1">
                    <span className="text-xs">今日剩余</span>
                    <span className="text-sm font-bold">3/5</span>
                  </div>
                  <div className="h-3 w-px bg-white/30" />
                  <div className="flex items-center gap-1">
                    <span className="text-xs">连胜</span>
                    <span className="text-sm font-bold text-amber-200">3场</span>
                  </div>
                  <div className="h-3 w-px bg-white/30" />
                  <div className="flex items-center gap-1">
                    <span className="text-xs">排名</span>
                    <span className="text-sm font-bold">#15</span>
                  </div>
                </div>
              </button>

              {/* Today's reading progress - emotional connection to reading */}
              <div className="bg-gradient-to-r from-primary/10 to-emerald-500/10 rounded-2xl p-4 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">今日阅读</p>
                      <p className="text-xs text-muted-foreground">和{petData.name}一起读书吧</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">3</p>
                    <p className="text-[10px] text-muted-foreground">篇文章</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-white/50 overflow-hidden">
                    <div className="h-full w-3/5 rounded-full bg-gradient-to-r from-primary to-emerald-500" />
                  </div>
                  <span className="text-xs text-muted-foreground">3/5</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">再读2篇，{petData.name}可以获得特别奖励!</p>
              </div>
            </div>
          )}

          {activeTab === "equipment" && (
            <PetEquipment
              onEquip={(id) => console.log("Equip:", id)}
              onUpgradeSkill={(id) => console.log("Upgrade skill:", id)}
            />
          )}

          {activeTab === "collection" && (
            <PetCollection
              onSelectPet={(id) => console.log("Select pet:", id)}
              onViewDetails={(id) => console.log("View details:", id)}
            />
          )}
        </div>
      </main>

      {/* Bottom navigation */}
      <BottomNavigation
        activeItem="pets"
        onNavigate={handleNavigation}
      />
    </div>
  )
}
