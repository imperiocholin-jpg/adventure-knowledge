"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  ChevronLeft, Bell, Settings, Sparkles, Trophy, Users, 
  Swords, Star, Heart, Zap, Crown, Medal
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { BattleArena } from "@/components/battle/battle-arena"
import { QuestionPanel } from "@/components/battle/question-panel"
import { PetSkills } from "@/components/battle/pet-skills"
import { BattleRewards } from "@/components/battle/battle-rewards"
import { MatchModes } from "@/components/battle/match-modes"
import { BottomNavigation } from "@/components/game/bottom-navigation"

type GameState = "lobby" | "matching" | "battle" | "result"
type BattlePhase = "idle" | "question" | "skill" | "result"

// Sample questions for demo
const sampleQuestions = [
  {
    question: "《小王子》中,小王子来自哪颗星球?",
    options: ["B-612小行星", "月球", "火星", "土星"],
    correctIndex: 0,
  },
  {
    question: "《西游记》中,孙悟空的金箍棒原本是什么?",
    options: ["定海神针", "如意金箍棒", "天蓬元帅的武器", "太上老君的法宝"],
    correctIndex: 0,
  },
  {
    question: "哪位作家创作了《安徒生童话》?",
    options: ["格林兄弟", "安徒生", "伊索", "王尔德"],
    correctIndex: 1,
  },
]

export default function BattlePage() {
  const router = useRouter()
  const [gameState, setGameState] = useState<GameState>("lobby")
  const [battlePhase, setBattlePhase] = useState<BattlePhase>("idle")
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [playerHealth, setPlayerHealth] = useState(100)
  const [opponentHealth, setOpponentHealth] = useState(100)
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [showRewards, setShowRewards] = useState(false)
  const [lastSkillUsed, setLastSkillUsed] = useState<string>()
  const [skillTarget, setSkillTarget] = useState<"player" | "opponent">()
  const [score, setScore] = useState(0)
  const [matchingProgress, setMatchingProgress] = useState(0)

  // Player and opponent data
  const playerData = {
    name: "小冒险家",
    avatar: "👦",
    pet: {
      emoji: "🐕",
      name: "毛毛",
      level: 12,
      health: playerHealth,
      maxHealth: 100,
    },
  }

  const opponentData = {
    name: "小书虫",
    avatar: "👧",
    pet: {
      emoji: "🐱",
      name: "咪咪",
      level: 10,
      health: opponentHealth,
      maxHealth: 100,
    },
  }

  // Matching animation
  useEffect(() => {
    if (gameState === "matching") {
      const interval = setInterval(() => {
        setMatchingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            setTimeout(() => {
              setGameState("battle")
              setBattlePhase("question")
            }, 500)
            return 100
          }
          return prev + 5
        })
      }, 100)
      return () => clearInterval(interval)
    }
  }, [gameState])

  const handleSelectMode = (modeId: string) => {
    setMatchingProgress(0)
    setGameState("matching")
  }

  const handleAnswer = (isCorrect: boolean, timeBonus: number) => {
    if (isCorrect) {
      // Player answers correctly - attack opponent
      setBattlePhase("skill")
      setLastSkillUsed("彩虹冲击")
      setSkillTarget("opponent")
      setScore(prev => prev + 100 + timeBonus)
      
      setTimeout(() => {
        setOpponentHealth(prev => Math.max(0, prev - 25))
        setBattlePhase("idle")
        
        // Check for win
        if (opponentHealth - 25 <= 0) {
          setTimeout(() => {
            setGameState("result")
            setShowRewards(true)
          }, 500)
        } else {
          // Continue to next question
          setTimeout(() => {
            if (currentQuestionIndex < sampleQuestions.length - 1) {
              setCurrentQuestionIndex(prev => prev + 1)
              setBattlePhase("question")
            } else {
              // All questions answered - determine winner
              setGameState("result")
              setShowRewards(true)
            }
          }, 800)
        }
      }, 1500)
    } else {
      // Wrong answer - opponent attacks
      setBattlePhase("skill")
      setLastSkillUsed("星星跳跃")
      setSkillTarget("player")
      
      setTimeout(() => {
        setPlayerHealth(prev => Math.max(0, prev - 15))
        setBattlePhase("idle")
        
        // Check for loss
        if (playerHealth - 15 <= 0) {
          setTimeout(() => {
            setGameState("result")
            setShowRewards(true)
          }, 500)
        } else {
          // Continue to next question
          setTimeout(() => {
            if (currentQuestionIndex < sampleQuestions.length - 1) {
              setCurrentQuestionIndex(prev => prev + 1)
              setBattlePhase("question")
            } else {
              setGameState("result")
              setShowRewards(true)
            }
          }, 800)
        }
      }, 1500)
    }
  }

  const handleRewardsClose = () => {
    setShowRewards(false)
    // Reset game
    setGameState("lobby")
    setCurrentQuestionIndex(0)
    setPlayerHealth(100)
    setOpponentHealth(100)
    setScore(0)
    setBattlePhase("idle")
  }

  const handleNavigation = (item: string) => {
    if (item === "home") router.push("/")
    if (item === "library") router.push("/library")
    if (item === "adventure") router.push("/adventure")
    if (item === "pets") router.push("/pets")
  }

  const isWinner = playerHealth > opponentHealth

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-background pb-24 relative overflow-hidden">
      {/* Magical background particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-float-particle"
            style={{
              width: `${3 + (i % 3)}px`,
              height: `${3 + (i % 3)}px`,
              backgroundColor: i % 3 === 0 
                ? "rgba(236, 72, 153, 0.3)" 
                : i % 3 === 1 
                ? "rgba(147, 51, 234, 0.25)" 
                : "rgba(251, 191, 36, 0.3)",
              left: `${5 + (i * 8)}%`,
              top: `${10 + (i % 5) * 18}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${6 + (i % 3) * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-md px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => gameState === "lobby" ? router.back() : setGameState("lobby")}
            className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-rose-500" />
            <h1 className="text-lg font-bold text-foreground">宠物知识大赛</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="relative w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-white transition-colors">
              <Bell className="w-5 h-5 text-foreground" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-[10px] text-white font-bold flex items-center justify-center">2</span>
            </button>
          </div>
        </div>

        {/* Lobby State */}
        {gameState === "lobby" && (
          <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
            {/* Stats card */}
            <div className="rounded-2xl bg-white/90 backdrop-blur-sm border border-white/50 shadow-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <span className="text-4xl">{playerData.pet.emoji}</span>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-white">{playerData.pet.level}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">{playerData.pet.name}</div>
                    <div className="text-xs text-muted-foreground">和你一起战斗!</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span className="text-lg font-bold text-foreground">15</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">当前排名</span>
                </div>
              </div>
              
              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Crown className="w-3 h-3 text-amber-500" />
                    <span className="text-sm font-bold text-amber-600">12</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground">胜场</span>
                </div>
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Zap className="w-3 h-3 text-emerald-500" />
                    <span className="text-sm font-bold text-emerald-600">3</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground">连胜</span>
                </div>
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-3 h-3 text-purple-500" />
                    <span className="text-sm font-bold text-purple-600">2850</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground">积分</span>
                </div>
              </div>
            </div>

            {/* Match modes */}
            <MatchModes onSelectMode={handleSelectMode} />

            {/* Today's ranking preview */}
            <div className="rounded-2xl bg-white/90 backdrop-blur-sm border border-white/50 shadow-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-bold text-foreground">今日排行榜</span>
                </div>
                <button className="text-xs text-primary font-medium">查看全部</button>
              </div>
              
              <div className="space-y-2">
                {[
                  { rank: 1, name: "学霸小明", avatar: "🦁", score: 2850 },
                  { rank: 2, name: "阅读达人", avatar: "🐼", score: 2720 },
                  { rank: 3, name: "书虫小红", avatar: "🐰", score: 2680 },
                ].map((user) => (
                  <div 
                    key={user.rank}
                    className="flex items-center gap-3 p-2 rounded-xl bg-muted/30"
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white",
                      user.rank === 1 && "bg-gradient-to-br from-amber-400 to-yellow-500",
                      user.rank === 2 && "bg-gradient-to-br from-slate-300 to-slate-400",
                      user.rank === 3 && "bg-gradient-to-br from-amber-600 to-orange-600"
                    )}>
                      {user.rank}
                    </div>
                    <span className="text-lg">{user.avatar}</span>
                    <span className="flex-1 text-sm font-medium text-foreground">{user.name}</span>
                    <span className="text-sm font-bold text-amber-600">{user.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Matching State */}
        {gameState === "matching" && (
          <div className="flex flex-col items-center justify-center py-12 animate-in fade-in-0 zoom-in-95 duration-500">
            <div className="relative mb-6">
              {/* Rotating ring */}
              <div className="w-32 h-32 rounded-full border-4 border-dashed border-purple-300 animate-spin-slow" />
              
              {/* Pet in center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl animate-bounce-slow">{playerData.pet.emoji}</span>
              </div>
              
              {/* Sparkles */}
              {[...Array(6)].map((_, i) => (
                <Sparkles
                  key={i}
                  className="absolute w-4 h-4 text-amber-400 animate-twinkle"
                  style={{
                    top: `${10 + (i * 15)}%`,
                    left: i % 2 === 0 ? "-10%" : "90%",
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
            
            <h2 className="text-lg font-bold text-foreground mb-2">正在匹配对手...</h2>
            <p className="text-sm text-muted-foreground mb-4">寻找同样热爱阅读的小伙伴</p>
            
            {/* Progress bar */}
            <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-100"
                style={{ width: `${matchingProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Battle State */}
        {gameState === "battle" && (
          <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
            {/* Score display */}
            <div className="flex justify-center">
              <div className="px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-sm shadow-md border border-white/50">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-bold text-foreground">{score} 分</span>
                </div>
              </div>
            </div>

            {/* Battle Arena */}
            <BattleArena
              playerPet={playerData.pet}
              opponentPet={opponentData.pet}
              playerAvatar={playerData.avatar}
              opponentAvatar={opponentData.avatar}
              playerName={playerData.name}
              opponentName={opponentData.name}
              isPlayerTurn={isPlayerTurn}
              battlePhase={battlePhase}
              lastSkillUsed={lastSkillUsed}
              skillTarget={skillTarget}
            />

            {/* Pet Skills display */}
            <PetSkills disabled={battlePhase !== "idle"} />

            {/* Question Panel */}
            {battlePhase === "question" && (
              <QuestionPanel
                question={sampleQuestions[currentQuestionIndex].question}
                options={sampleQuestions[currentQuestionIndex].options}
                correctIndex={sampleQuestions[currentQuestionIndex].correctIndex}
                timeLimit={15}
                onAnswer={handleAnswer}
              />
            )}

            {/* Waiting message when not in question phase */}
            {battlePhase !== "question" && (
              <div className="rounded-2xl bg-white/90 backdrop-blur-sm border border-white/50 shadow-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {battlePhase === "skill" ? "技能发动中..." : "准备下一题..."}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Battle Rewards Modal */}
      {showRewards && (
        <BattleRewards
          isWinner={isWinner}
          rewards={[
            { type: "coins", amount: isWinner ? 50 : 20, label: "金币" },
            { type: "exp", amount: isWinner ? 100 : 40, label: "经验值" },
            { type: "friendship", amount: 5, label: "友谊点" },
          ]}
          onClose={handleRewardsClose}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNavigation
        activeItem="pets"
        onNavigate={handleNavigation}
      />

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes float-particle {
          0% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-20px) scale(1.2); opacity: 0.6; }
          100% { transform: translateY(-40px) scale(0.8); opacity: 0; }
        }
        .animate-float-particle {
          animation: float-particle ease-out infinite;
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 1.5s ease-in-out infinite;
        }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        .animate-twinkle {
          animation: twinkle 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
