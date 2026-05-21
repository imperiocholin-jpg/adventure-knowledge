"use client"

import { cn } from "@/lib/utils"
import { Coins, Star, Heart, Gift, Sparkles, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Reward {
  type: "coins" | "exp" | "friendship" | "item"
  amount: number
  label: string
}

interface BattleRewardsProps {
  isWinner: boolean
  rewards: Reward[]
  onClose: () => void
}

export function BattleRewards({
  isWinner,
  rewards,
  onClose,
}: BattleRewardsProps) {
  const getRewardIcon = (type: string) => {
    switch (type) {
      case "coins": return <Coins className="w-6 h-6 text-amber-500" />
      case "exp": return <Star className="w-6 h-6 text-purple-500" />
      case "friendship": return <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
      case "item": return <Gift className="w-6 h-6 text-emerald-500" />
      default: return <Sparkles className="w-6 h-6 text-amber-500" />
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in-0 duration-300">
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl border border-white/50 overflow-hidden animate-in zoom-in-95 duration-500">
        {/* Header */}
        <div className={cn(
          "relative py-6 px-4 text-center overflow-hidden",
          isWinner 
            ? "bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-400" 
            : "bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400"
        )}>
          {/* Confetti particles */}
          {isWinner && [...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-sm animate-confetti"
              style={{
                backgroundColor: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F"][i % 6],
                left: `${5 + (i * 5)}%`,
                top: `-10px`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
          
          {/* Trophy icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/30 backdrop-blur-sm mb-3 animate-bounce-slow">
            {isWinner ? (
              <Trophy className="w-8 h-8 text-white" />
            ) : (
              <span className="text-3xl">🎉</span>
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-1">
            {isWinner ? "挑战成功!" : "比赛结束!"}
          </h2>
          <p className="text-sm text-white/80">
            {isWinner ? "太棒了! 你赢得了奖励!" : "没关系,下次继续努力!"}
          </p>
        </div>

        {/* Rewards section */}
        <div className="p-4">
          <div className="text-center mb-3">
            <span className="text-sm font-semibold text-muted-foreground">获得奖励</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            {rewards.map((reward, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/30 animate-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-10 h-10 rounded-xl bg-white shadow-md flex items-center justify-center">
                  {getRewardIcon(reward.type)}
                </div>
                <div>
                  <div className="text-lg font-bold text-foreground">+{reward.amount}</div>
                  <div className="text-[10px] text-muted-foreground">{reward.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Close button */}
          <Button
            onClick={onClose}
            className="w-full rounded-2xl py-6 text-base font-bold bg-gradient-to-r from-primary to-emerald-500 hover:opacity-90 shadow-lg"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            太棒了!
          </Button>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(300px) rotate(720deg); opacity: 0; }
        }
        .animate-confetti {
          animation: confetti 3s ease-out forwards;
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
