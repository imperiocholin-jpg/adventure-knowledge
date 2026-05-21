"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { BookOpen, Clock, Sparkles, CheckCircle, XCircle } from "lucide-react"

interface QuestionPanelProps {
  question: string
  options: string[]
  correctIndex: number
  timeLimit: number
  onAnswer: (isCorrect: boolean, timeBonus: number) => void
  disabled?: boolean
}

export function QuestionPanel({
  question,
  options,
  correctIndex,
  timeLimit,
  onAnswer,
  disabled = false,
}: QuestionPanelProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(timeLimit)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  // Timer countdown
  useEffect(() => {
    if (disabled || showResult) return
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          handleTimeout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [disabled, showResult])

  const handleTimeout = () => {
    setShowResult(true)
    setIsCorrect(false)
    onAnswer(false, 0)
  }

  const handleSelect = (index: number) => {
    if (disabled || showResult) return
    
    setSelectedIndex(index)
    const correct = index === correctIndex
    setIsCorrect(correct)
    setShowResult(true)
    
    // Calculate time bonus (more time left = more bonus)
    const timeBonus = correct ? Math.floor((timeLeft / timeLimit) * 50) : 0
    
    setTimeout(() => {
      onAnswer(correct, timeBonus)
    }, 1200)
  }

  const getOptionStyle = (index: number) => {
    if (!showResult) {
      return selectedIndex === index
        ? "border-primary bg-primary/5"
        : "border-border/50 bg-white/80 hover:border-primary/50 hover:bg-primary/5"
    }
    
    if (index === correctIndex) {
      return "border-emerald-400 bg-emerald-50"
    }
    
    if (selectedIndex === index && index !== correctIndex) {
      return "border-rose-400 bg-rose-50"
    }
    
    return "border-border/30 bg-muted/30 opacity-60"
  }

  const timerColor = timeLeft > timeLimit * 0.5 
    ? "text-emerald-500" 
    : timeLeft > timeLimit * 0.25 
    ? "text-amber-500" 
    : "text-rose-500"

  return (
    <div className="rounded-2xl bg-white/90 backdrop-blur-sm border border-white/50 shadow-lg p-4">
      {/* Header with timer */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-md">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-foreground">知识问答</span>
        </div>
        
        {/* Timer */}
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1 rounded-full font-bold transition-colors",
          timerColor,
          timeLeft <= timeLimit * 0.25 && "animate-pulse"
        )}>
          <Clock className="w-4 h-4" />
          <span className="text-lg tabular-nums">{timeLeft}</span>
          <span className="text-xs">秒</span>
        </div>
      </div>

      {/* Question */}
      <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
        <p className="text-sm font-medium text-foreground leading-relaxed">{question}</p>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(index)}
            disabled={disabled || showResult}
            className={cn(
              "w-full p-3 rounded-xl border-2 text-left transition-all duration-300",
              "flex items-center gap-3",
              getOptionStyle(index),
              !disabled && !showResult && "active:scale-[0.98]"
            )}
          >
            {/* Option letter */}
            <div className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold transition-colors",
              showResult && index === correctIndex
                ? "bg-emerald-400 text-white"
                : showResult && selectedIndex === index && index !== correctIndex
                ? "bg-rose-400 text-white"
                : "bg-muted text-muted-foreground"
            )}>
              {String.fromCharCode(65 + index)}
            </div>
            
            {/* Option text */}
            <span className="flex-1 text-sm font-medium text-foreground">{option}</span>
            
            {/* Result icon */}
            {showResult && index === correctIndex && (
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            )}
            {showResult && selectedIndex === index && index !== correctIndex && (
              <XCircle className="w-5 h-5 text-rose-500" />
            )}
          </button>
        ))}
      </div>

      {/* Result feedback */}
      {showResult && (
        <div className={cn(
          "mt-4 p-3 rounded-xl flex items-center justify-center gap-2 animate-in fade-in-0 zoom-in-95 duration-300",
          isCorrect 
            ? "bg-gradient-to-r from-emerald-100 to-green-100 border border-emerald-200" 
            : "bg-gradient-to-r from-rose-100 to-pink-100 border border-rose-200"
        )}>
          {isCorrect ? (
            <>
              <Sparkles className="w-5 h-5 text-emerald-500" />
              <span className="font-bold text-emerald-600">回答正确! 宠物发动技能!</span>
            </>
          ) : (
            <>
              <span className="text-2xl">😅</span>
              <span className="font-bold text-rose-600">答错啦~ 下次加油!</span>
            </>
          )}
        </div>
      )}
    </div>
  )
}
