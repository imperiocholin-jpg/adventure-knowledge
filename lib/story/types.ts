export interface StorySection {
  id: string
  text: string
}

export interface StoryChoice {
  id: string
  label: string
  nextChapterId: string
}

export interface StoryChapter {
  chapterId: string
  title: string
  theme?: string
  targetAge?: string
  estimatedMinutes?: number
  sections: StorySection[]
  sourceBookTitle?: string
  sourceChapterLabel?: string
  challenge?: {
    prompt: string
    options: string[]
    answerIndex: number
    successResponse: string
    retryResponse?: string
    sourceBookTitle?: string
    sourceChapterLabel?: string
  }
  aiCompanionLine: string
  petFeedback: {
    emotion: string
    animation?: string
    text: string
  }
  reward: {
    type: string
    id: string
    name: string
    amount: number
    text: string
  }
  lightChoices: StoryChoice[]
  nextButtonText?: string
}
