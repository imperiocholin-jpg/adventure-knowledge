export type LeaderboardScope = "global" | "friends"

export interface SocialUserCard {
  userId: string
  username: string
  avatarId: string
  avatarSrc: string
  score: number
  rank: number
  isSelf?: boolean
  isFollowing?: boolean
}

export interface SocialStats {
  followingCount: number
  followerCount: number
  myRank: number | null
  /** 历史累计胜场 */
  myBattleWins: number
}

export interface PublicPetSummary {
  name: string
  species: string
  breed: string
  level: number
  lifeStage: string
  emoji: string
  avatarSrc: string | null
  bond: number
}

export interface PublicUserProfile {
  userId: string
  username: string
  avatarId: string
  avatarSrc: string
  adventureLevel: number
  adventureTitle: string
  battleWins: number
  dailyStreak: number
  schoolName: string | null
  gradeClass: string | null
  age: number | null
  followingCount: number
  followerCount: number
  isSelf: boolean
  isFollowing: boolean
  pet: PublicPetSummary | null
}
