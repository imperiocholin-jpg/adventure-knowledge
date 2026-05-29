import { ADVENTURE_REGION_UNLOCK_ORDER } from "@/lib/library/adventure-regions"
import type { AdventureProgressSnapshot } from "@/lib/adventure/adventure-dashboard-client"

export interface ProfileBadge {
  id: string
  name: string
  icon: string
  rarity: "common" | "rare" | "epic" | "legendary"
  unlocked: boolean
}

export interface ProfileJournalEntry {
  id: string
  title: string
  icon: string
  date: string
  highlight?: boolean
}

interface BuildInsightsInput {
  dailyStreak: number
  totalStars: number
  worldsExplored: number
  completedBooks: number
  battleWins: number
  treasuresUnlocked: number
  petName: string
  petLevel: number
  currentWorld?: string
}

const ALL_BADGES: Array<Omit<ProfileBadge, "unlocked"> & { check: (input: BuildInsightsInput) => boolean }> = [
  { id: "first-read", name: "阅读启程", icon: "📖", rarity: "common", check: (i) => i.totalStars >= 1 || i.completedBooks >= 1 },
  { id: "streak-3", name: "三日坚持", icon: "🔥", rarity: "rare", check: (i) => i.dailyStreak >= 3 },
  { id: "streak-7", name: "一周达人", icon: "🌟", rarity: "epic", check: (i) => i.dailyStreak >= 7 },
  { id: "stars-10", name: "星星新手", icon: "⭐", rarity: "common", check: (i) => i.totalStars >= 10 },
  { id: "stars-50", name: "星光收集", icon: "✨", rarity: "rare", check: (i) => i.totalStars >= 50 },
  { id: "world-2", name: "世界旅人", icon: "🗺️", rarity: "rare", check: (i) => i.worldsExplored >= 2 },
  { id: "books-3", name: "小书虫", icon: "📚", rarity: "rare", check: (i) => i.completedBooks >= 3 },
  { id: "battle-5", name: "对战新星", icon: "⚔️", rarity: "epic", check: (i) => i.battleWins >= 5 },
  { id: "treasure-1", name: "宝藏猎人", icon: "💎", rarity: "legendary", check: (i) => i.treasuresUnlocked >= 1 },
  { id: "pet-5", name: "伙伴成长", icon: "🐾", rarity: "common", check: (i) => i.petLevel >= 5 },
  { id: "pet-10", name: "亲密搭档", icon: "💛", rarity: "epic", check: (i) => i.petLevel >= 10 },
  { id: "world-4", name: "传奇探险", icon: "🏆", rarity: "legendary", check: (i) => i.worldsExplored >= 4 },
]

export function buildProfileBadges(input: BuildInsightsInput) {
  const badges: ProfileBadge[] = ALL_BADGES.map((badge) => ({
    id: badge.id,
    name: badge.name,
    icon: badge.icon,
    rarity: badge.rarity,
    unlocked: badge.check(input),
  }))
  const unlocked = badges.filter((b) => b.unlocked)
  const featured = [...unlocked].reverse().slice(0, 3)
  while (featured.length < 3) {
    const locked = badges.find((b) => !b.unlocked && !featured.some((f) => f.id === b.id))
    if (!locked) break
    featured.push(locked)
  }
  return {
    featured,
    totalUnlocked: unlocked.length,
    totalBadges: badges.length,
  }
}

function formatRelativeDate(iso: string | null | undefined) {
  if (!iso) return "最近"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "最近"
  const diffMs = Date.now() - date.getTime()
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000))
  if (days <= 0) return "今天"
  if (days === 1) return "昨天"
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })
}

export function countExploredWorlds(progress: AdventureProgressSnapshot | null) {
  if (!progress) return 1
  return ADVENTURE_REGION_UNLOCK_ORDER.filter((id) => progress.regionProgress[id]?.unlocked).length
}

export function buildProfileJournal(input: {
  dailyStreak: number
  petName: string
  petLevel: number
  currentWorld?: string
  treasuresUnlocked: number
  petCreatedAt?: string | null
}): ProfileJournalEntry[] {
  const entries: ProfileJournalEntry[] = []

  if (input.dailyStreak >= 2) {
    entries.push({
      id: "streak",
      title: `连续阅读 ${input.dailyStreak} 天`,
      icon: "🔥",
      date: "今天",
      highlight: input.dailyStreak >= 7,
    })
  }

  if (input.petLevel > 1) {
    entries.push({
      id: "pet-level",
      title: `${input.petName} 升到 Lv.${input.petLevel}`,
      icon: "🐾",
      date: "最近",
    })
  }

  if (input.currentWorld) {
    entries.push({
      id: "world",
      title: `正在探索「${input.currentWorld}」`,
      icon: "🗺️",
      date: "进行中",
      highlight: true,
    })
  }

  if (input.treasuresUnlocked > 0) {
    entries.push({
      id: "treasure",
      title: `已解锁 ${input.treasuresUnlocked} 件神秘宝藏`,
      icon: "💎",
      date: "最近",
    })
  }

  if (input.petCreatedAt) {
    entries.push({
      id: "companion",
      title: `与 ${input.petName} 结为伙伴`,
      icon: "💛",
      date: formatRelativeDate(input.petCreatedAt),
    })
  }

  if (entries.length === 0) {
    entries.push({
      id: "welcome",
      title: "冒险刚刚开始，快去阅读吧！",
      icon: "✨",
      date: "今天",
      highlight: true,
    })
  }

  return entries.slice(0, 3)
}

export function companionDaysFromDate(createdAt: string | null | undefined) {
  if (!createdAt) return 1
  const start = new Date(createdAt)
  if (Number.isNaN(start.getTime())) return 1
  const diff = Date.now() - start.getTime()
  return Math.max(1, Math.ceil(diff / (24 * 60 * 60 * 1000)))
}
