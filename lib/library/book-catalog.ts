import type { AdventureRegionId } from "@/lib/library/adventure-regions"
import { MOE_CATALOG_BY_SEQ } from "@/lib/library/moe-catalog-2020"
import type { GradeBand, MoeCategory } from "@/lib/library/moe-catalog-2020"

export interface ReaderBook {
  id: string
  /** 教育部目录序号 */
  catalogSeq?: number
  moeId?: string
  title: string
  author: string
  cover: string
  chapters: string[]
  gradeBand?: GradeBand
  category?: MoeCategory
  primaryRegionId?: AdventureRegionId
  challengeChapterId?: string
}

/** 已接入电子阅读正文的图书（其余目录书在书架显示「即将上架」） */
export const READER_BOOKS: ReaderBook[] = [
  {
    id: "1",
    catalogSeq: 91,
    moeId: "moe-091",
    title: "小王子",
    author: "圣埃克苏佩里",
    cover: "🌟",
    gradeBand: "5-6",
    category: "literature",
    primaryRegionId: "sky-kingdom",
    challengeChapterId: "chapter_1",
    chapters: [
      "在很远很远的星空里，有一颗只比房子大一点点的小星球。小王子每天都会给玫瑰浇水，还会把小火山擦得亮亮的。一天，他决定离开星球去旅行，看看更大的世界。他带着好奇心，坐上一只会唱歌的小鸟，飞向第一站。",
      "小王子来到一片沙漠，遇见了一个飞行员。飞行员正在修理坏掉的飞机，小王子蹲在旁边，认真地问：请你给我画一只羊。飞行员先画了几次，小王子都摇头。最后飞行员画了一个小箱子，说羊就在里面。小王子开心地笑了。",
      "傍晚时，他们一起看日落。小王子说，难过的时候就想多看几次落日。飞行员点点头，把水分给小王子。风轻轻吹过，沙丘像金色海浪。小王子忽然明白，真正重要的东西，不是眼睛看到的，而是心里感受到的。",
    ],
  },
  {
    id: "2",
    catalogSeq: 44,
    moeId: "moe-044",
    title: "夏洛的网",
    author: "E.B.怀特",
    cover: "🕷️",
    gradeBand: "3-4",
    category: "literature",
    primaryRegionId: "sky-kingdom",
    challengeChapterId: "chapter_2",
    chapters: [
      "农场里住着一只小猪叫威尔伯。它很怕孤单，常常趴在围栏边看远处。一天晚上，仓库角落里传来轻轻的声音：你不会孤单，我是夏洛。原来那是一只聪明又温柔的蜘蛛。",
      "夏洛在网上织出了字：了不起。第二天大家都围过来看，农场一下热闹起来。威尔伯又惊又喜，原来朋友真的会为你做很难很难的事。它悄悄对夏洛说：谢谢你，我会一直记得。",
      "天气转凉时，夏洛把小蜘蛛卵袋托付给威尔伯。威尔伯小心翼翼守着卵袋，像守着最宝贵的礼物。它终于懂得，真正的友情不是一直在身边，而是你心里永远有对方。",
    ],
  },
  {
    id: "3",
    title: "绿野仙踪",
    author: "鲍姆",
    cover: "🌈",
    gradeBand: "3-4",
    category: "literature",
    primaryRegionId: "sky-kingdom",
    challengeChapterId: "chapter_4",
    chapters: [
      "多萝西和小狗托托被龙卷风吹到了陌生的地方。这里有会说话的稻草人、有铁皮人，还有爱吼却胆小的狮子。大家决定一起去找奥兹，请他帮忙实现愿望。",
      "他们走过金砖路，经过会唱歌的树林和会发光的桥。路上每个人都帮了彼此：稻草人出主意，铁皮人懂温柔，狮子鼓起勇气。多萝西发现，原来队友在一起就不怕难题。",
      "到了翡翠城后，他们才知道，愿望的答案很多时候就在自己身上。多萝西拍拍鞋子，终于找到了回家的路。她回头挥手，记住了这段一起冒险的日子。",
    ],
  },
]

export function getReaderBookById(bookId: string) {
  return READER_BOOKS.find((book) => book.id === bookId || book.moeId === bookId) ?? null
}

export function getReaderBookByMoeId(moeId: string) {
  const entry = MOE_CATALOG_BY_SEQ[Number(moeId.replace("moe-", ""))]
  if (!entry?.legacyReaderBookId) return null
  return getReaderBookById(entry.legacyReaderBookId)
}
