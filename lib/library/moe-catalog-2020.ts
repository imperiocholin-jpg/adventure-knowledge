import type { AdventureRegionId } from "@/lib/library/adventure-regions"

export type GradeBand = "1-2" | "3-4" | "5-6"
export type MoeCategory = "humanities" | "literature" | "science" | "art"
export type ContentPhase = "p0" | "p1" | "p2" | "p3"

export interface MoeCatalogEntry {
  catalogSeq: number
  id: string
  title: string
  author: string
  gradeBand: GradeBand
  category: MoeCategory
  primaryRegionId: AdventureRegionId
  contentPhase: ContentPhase
  coverEmoji: string
  legacyReaderBookId?: string
  challengeChapterId?: string
}

/** 教育部《中小学生阅读指导目录（2020年版）》小学段，共 110 种 */
export const MOE_CATALOG_2020: MoeCatalogEntry[] = [
  {
    "catalogSeq": 1,
    "id": "moe-001",
    "title": "五星红旗",
    "author": "华琪，杨汝戬，马堪岱 主编",
    "gradeBand": "1-2",
    "category": "humanities",
    "primaryRegionId": "ancient-desert",
    "contentPhase": "p1",
    "coverEmoji": "🏛️"
  },
  {
    "catalogSeq": 2,
    "id": "moe-002",
    "title": "读图识中国",
    "author": "人民教育出版社地图编辑室 编",
    "gradeBand": "1-2",
    "category": "humanities",
    "primaryRegionId": "ancient-desert",
    "contentPhase": "p1",
    "coverEmoji": "🏛️"
  },
  {
    "catalogSeq": 3,
    "id": "moe-003",
    "title": "中华人物故事汇·中华先锋人物故事汇",
    "author": "徐鲁等 著",
    "gradeBand": "1-2",
    "category": "humanities",
    "primaryRegionId": "ancient-desert",
    "contentPhase": "p1",
    "coverEmoji": "🏛️"
  },
  {
    "catalogSeq": 4,
    "id": "moe-004",
    "title": "萝卜回来了",
    "author": "方轶群 文/严个凡 画",
    "gradeBand": "1-2",
    "category": "literature",
    "primaryRegionId": "magic-forest",
    "contentPhase": "p1",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 5,
    "id": "moe-005",
    "title": "没头脑和不高兴",
    "author": "任溶溶 著",
    "gradeBand": "1-2",
    "category": "literature",
    "primaryRegionId": "magic-forest",
    "contentPhase": "p1",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 6,
    "id": "moe-006",
    "title": "儿歌 300 首",
    "author": "金波，郑春华等 著",
    "gradeBand": "1-2",
    "category": "literature",
    "primaryRegionId": "magic-forest",
    "contentPhase": "p1",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 7,
    "id": "moe-007",
    "title": "小巴掌童话",
    "author": "张秋生 著",
    "gradeBand": "1-2",
    "category": "literature",
    "primaryRegionId": "magic-forest",
    "contentPhase": "p1",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 8,
    "id": "moe-008",
    "title": "小马过河",
    "author": "彭文席 著",
    "gradeBand": "1-2",
    "category": "literature",
    "primaryRegionId": "magic-forest",
    "contentPhase": "p1",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 9,
    "id": "moe-009",
    "title": "吃黑夜的大象",
    "author": "白冰 著/沈苑苑 绘",
    "gradeBand": "1-2",
    "category": "literature",
    "primaryRegionId": "magic-forest",
    "contentPhase": "p1",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 10,
    "id": "moe-010",
    "title": "大头儿子和小头爸爸",
    "author": "郑春华 著",
    "gradeBand": "1-2",
    "category": "literature",
    "primaryRegionId": "magic-forest",
    "contentPhase": "p1",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 11,
    "id": "moe-011",
    "title": "我有友情要出租",
    "author": "方素珍 著/郝洛玟 绘",
    "gradeBand": "1-2",
    "category": "literature",
    "primaryRegionId": "magic-forest",
    "contentPhase": "p1",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 12,
    "id": "moe-012",
    "title": "一园青菜成了精",
    "author": "编自北方童谣/周翔 绘",
    "gradeBand": "1-2",
    "category": "literature",
    "primaryRegionId": "magic-forest",
    "contentPhase": "p1",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 13,
    "id": "moe-013",
    "title": "团圆",
    "author": "余丽琼 文/朱成梁 图",
    "gradeBand": "1-2",
    "category": "literature",
    "primaryRegionId": "magic-forest",
    "contentPhase": "p1",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 14,
    "id": "moe-014",
    "title": "格林童话",
    "author": "[德]格林兄弟 著/杨武能 译",
    "gradeBand": "1-2",
    "category": "literature",
    "primaryRegionId": "sky-kingdom",
    "contentPhase": "p3",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 15,
    "id": "moe-015",
    "title": "弗朗兹的故事",
    "author": "[奥]克里斯蒂娜·涅斯特林格 著/湘雪 译",
    "gradeBand": "1-2",
    "category": "literature",
    "primaryRegionId": "sky-kingdom",
    "contentPhase": "p3",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 16,
    "id": "moe-016",
    "title": "小彗星旅行记",
    "author": "徐刚 著/绘",
    "gradeBand": "1-2",
    "category": "science",
    "primaryRegionId": "ocean-ruins",
    "contentPhase": "p2",
    "coverEmoji": "🔬"
  },
  {
    "catalogSeq": 17,
    "id": "moe-017",
    "title": "嫦娥探月立体书",
    "author": "马莉等 文/王晓旭 图",
    "gradeBand": "1-2",
    "category": "science",
    "primaryRegionId": "ocean-ruins",
    "contentPhase": "p2",
    "coverEmoji": "🔬"
  },
  {
    "catalogSeq": 18,
    "id": "moe-018",
    "title": "趣味数学百科图典",
    "author": "田翔仁 编著",
    "gradeBand": "1-2",
    "category": "science",
    "primaryRegionId": "ocean-ruins",
    "contentPhase": "p2",
    "coverEmoji": "🔬"
  },
  {
    "catalogSeq": 19,
    "id": "moe-019",
    "title": "来喝水吧",
    "author": "[澳]葛瑞米·贝斯 文/图",
    "gradeBand": "1-2",
    "category": "science",
    "primaryRegionId": "ocean-ruins",
    "contentPhase": "p2",
    "coverEmoji": "🔬"
  },
  {
    "catalogSeq": 20,
    "id": "moe-020",
    "title": "爸爸的画·沙坪小屋",
    "author": "丰子恺 绘/丰陈宝，丰一吟 著",
    "gradeBand": "1-2",
    "category": "art",
    "primaryRegionId": "dream-tower",
    "contentPhase": "p3",
    "coverEmoji": "🎨"
  },
  {
    "catalogSeq": 21,
    "id": "moe-021",
    "title": "京剧脸谱",
    "author": "傅学斌 著",
    "gradeBand": "1-2",
    "category": "art",
    "primaryRegionId": "dream-tower",
    "contentPhase": "p3",
    "coverEmoji": "🎨"
  },
  {
    "catalogSeq": 22,
    "id": "moe-022",
    "title": "周恩来寄语：青少年版",
    "author": "周恩来思想生平研究会 编",
    "gradeBand": "3-4",
    "category": "humanities",
    "primaryRegionId": "ancient-desert",
    "contentPhase": "p1",
    "coverEmoji": "🏛️"
  },
  {
    "catalogSeq": 23,
    "id": "moe-023",
    "title": "雷锋的故事",
    "author": "陈广生，崔家骏 著",
    "gradeBand": "3-4",
    "category": "humanities",
    "primaryRegionId": "ancient-desert",
    "contentPhase": "p1",
    "coverEmoji": "🏛️"
  },
  {
    "catalogSeq": 24,
    "id": "moe-024",
    "title": "林汉达中国历史故事集",
    "author": "林汉达，雪岗 编著",
    "gradeBand": "3-4",
    "category": "humanities",
    "primaryRegionId": "ancient-desert",
    "contentPhase": "p1",
    "coverEmoji": "🏛️"
  },
  {
    "catalogSeq": 25,
    "id": "moe-025",
    "title": "刘兴诗爷爷给孩子讲中国地理",
    "author": "刘兴诗 著",
    "gradeBand": "3-4",
    "category": "humanities",
    "primaryRegionId": "ancient-desert",
    "contentPhase": "p1",
    "coverEmoji": "🏛️"
  },
  {
    "catalogSeq": 26,
    "id": "moe-026",
    "title": "居里夫人的故事",
    "author": "[英]埃列娜·杜尔利 著",
    "gradeBand": "3-4",
    "category": "humanities",
    "primaryRegionId": "ancient-desert",
    "contentPhase": "p1",
    "coverEmoji": "🏛️"
  },
  {
    "catalogSeq": 27,
    "id": "moe-027",
    "title": "儿童哲学智慧书",
    "author": "[法]柏尼菲 著/[法]卢里耶等 绘",
    "gradeBand": "3-4",
    "category": "humanities",
    "primaryRegionId": "ancient-desert",
    "contentPhase": "p1",
    "coverEmoji": "🏛️"
  },
  {
    "catalogSeq": 28,
    "id": "moe-028",
    "title": "哲学鸟飞罗系列",
    "author": "[法]拉贝 著/[法]加斯特 绘",
    "gradeBand": "3-4",
    "category": "humanities",
    "primaryRegionId": "ancient-desert",
    "contentPhase": "p1",
    "coverEmoji": "🏛️"
  },
  {
    "catalogSeq": 29,
    "id": "moe-029",
    "title": "成语故事",
    "author": "——",
    "gradeBand": "3-4",
    "category": "literature",
    "primaryRegionId": "magic-forest",
    "contentPhase": "p1",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 30,
    "id": "moe-030",
    "title": "中国古今寓言",
    "author": "——",
    "gradeBand": "3-4",
    "category": "literature",
    "primaryRegionId": "magic-forest",
    "contentPhase": "p1",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 31,
    "id": "moe-031",
    "title": "中国神话故事集",
    "author": "袁珂 著",
    "gradeBand": "3-4",
    "category": "literature",
    "primaryRegionId": "magic-forest",
    "contentPhase": "p1",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 32,
    "id": "moe-032",
    "title": "稻草人",
    "author": "叶圣陶 著",
    "gradeBand": "3-4",
    "category": "literature",
    "primaryRegionId": "ice-mountain",
    "contentPhase": "p1",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 33,
    "id": "moe-033",
    "title": "宝葫芦的秘密",
    "author": "张天翼 著",
    "gradeBand": "3-4",
    "category": "literature",
    "primaryRegionId": "ice-mountain",
    "contentPhase": "p1",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 34,
    "id": "moe-034",
    "title": "三毛流浪记",
    "author": "张乐平 著",
    "gradeBand": "3-4",
    "category": "literature",
    "primaryRegionId": "ice-mountain",
    "contentPhase": "p1",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 35,
    "id": "moe-035",
    "title": "“下次开船”港",
    "author": "严文井 著",
    "gradeBand": "3-4",
    "category": "literature",
    "primaryRegionId": "ice-mountain",
    "contentPhase": "p1",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 36,
    "id": "moe-036",
    "title": "孙悟空在我们村里",
    "author": "郭风 著",
    "gradeBand": "3-4",
    "category": "literature",
    "primaryRegionId": "magic-forest",
    "contentPhase": "p1",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 37,
    "id": "moe-037",
    "title": "小英雄雨来",
    "author": "管桦 著",
    "gradeBand": "3-4",
    "category": "literature",
    "primaryRegionId": "ice-mountain",
    "contentPhase": "p1",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 38,
    "id": "moe-038",
    "title": "帽子的秘密",
    "author": "柯岩 文",
    "gradeBand": "3-4",
    "category": "literature",
    "primaryRegionId": "ice-mountain",
    "contentPhase": "p1",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 39,
    "id": "moe-039",
    "title": "小布头奇遇记",
    "author": "孙幼军 著",
    "gradeBand": "3-4",
    "category": "literature",
    "primaryRegionId": "ice-mountain",
    "contentPhase": "p1",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 40,
    "id": "moe-040",
    "title": "推开窗子看见你",
    "author": "金波 著",
    "gradeBand": "3-4",
    "category": "literature",
    "primaryRegionId": "ice-mountain",
    "contentPhase": "p1",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 41,
    "id": "moe-041",
    "title": "笨狼的故事",
    "author": "汤素兰 著",
    "gradeBand": "3-4",
    "category": "literature",
    "primaryRegionId": "magic-forest",
    "contentPhase": "p1",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 42,
    "id": "moe-042",
    "title": "盘中餐",
    "author": "于虹呈 著",
    "gradeBand": "3-4",
    "category": "literature",
    "primaryRegionId": "ice-mountain",
    "contentPhase": "p1",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 43,
    "id": "moe-043",
    "title": "爱的教育",
    "author": "[意]阿米琪斯 著/王干卿 译",
    "gradeBand": "3-4",
    "category": "literature",
    "primaryRegionId": "sky-kingdom",
    "contentPhase": "p3",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 44,
    "id": "moe-044",
    "title": "夏洛的网",
    "author": "[美]E.B.怀特 著/任溶溶 译",
    "gradeBand": "3-4",
    "category": "literature",
    "primaryRegionId": "sky-kingdom",
    "contentPhase": "p1",
    "coverEmoji": "📖",
    "legacyReaderBookId": "2",
    "challengeChapterId": "chapter_2"
  },
  {
    "catalogSeq": 45,
    "id": "moe-045",
    "title": "窗边的小豆豆",
    "author": "[日]黑柳彻子 著/赵玉皎 译",
    "gradeBand": "3-4",
    "category": "literature",
    "primaryRegionId": "sky-kingdom",
    "contentPhase": "p3",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 46,
    "id": "moe-046",
    "title": "少儿科普三字经",
    "author": "亚子 著/金平 绘",
    "gradeBand": "3-4",
    "category": "science",
    "primaryRegionId": "ocean-ruins",
    "contentPhase": "p2",
    "coverEmoji": "🔬"
  },
  {
    "catalogSeq": 47,
    "id": "moe-047",
    "title": "中国国家博物馆儿童历史百科绘本",
    "author": "中国国家博物馆 著",
    "gradeBand": "3-4",
    "category": "science",
    "primaryRegionId": "ocean-ruins",
    "contentPhase": "p2",
    "coverEmoji": "🔬"
  },
  {
    "catalogSeq": 48,
    "id": "moe-048",
    "title": "昆虫漫话",
    "author": "陶秉珍 著",
    "gradeBand": "3-4",
    "category": "science",
    "primaryRegionId": "ocean-ruins",
    "contentPhase": "p2",
    "coverEmoji": "🔬"
  },
  {
    "catalogSeq": 49,
    "id": "moe-049",
    "title": "中国儿童视听百科·飞向太空",
    "author": "《飞向太空》编委会 编著",
    "gradeBand": "3-4",
    "category": "science",
    "primaryRegionId": "ocean-ruins",
    "contentPhase": "p2",
    "coverEmoji": "🔬"
  },
  {
    "catalogSeq": 50,
    "id": "moe-050",
    "title": "异想天开的科学游戏",
    "author": "高云峰 著",
    "gradeBand": "3-4",
    "category": "science",
    "primaryRegionId": "ocean-ruins",
    "contentPhase": "p2",
    "coverEmoji": "🔬"
  },
  {
    "catalogSeq": 51,
    "id": "moe-051",
    "title": "万物简史：少儿彩绘版",
    "author": "[英]布莱森 著",
    "gradeBand": "3-4",
    "category": "science",
    "primaryRegionId": "ocean-ruins",
    "contentPhase": "p2",
    "coverEmoji": "🔬"
  },
  {
    "catalogSeq": 52,
    "id": "moe-052",
    "title": "蜡烛的故事",
    "author": "[英]法拉第 著",
    "gradeBand": "3-4",
    "category": "science",
    "primaryRegionId": "ocean-ruins",
    "contentPhase": "p2",
    "coverEmoji": "🔬"
  },
  {
    "catalogSeq": 53,
    "id": "moe-053",
    "title": "地球的红飘带",
    "author": "魏巍 原著/王素 改编/沈尧伊 绘画",
    "gradeBand": "3-4",
    "category": "art",
    "primaryRegionId": "dream-tower",
    "contentPhase": "p3",
    "coverEmoji": "🎨"
  },
  {
    "catalogSeq": 54,
    "id": "moe-054",
    "title": "人民音乐家：冼星海",
    "author": "郭冰茹 著",
    "gradeBand": "3-4",
    "category": "art",
    "primaryRegionId": "dream-tower",
    "contentPhase": "p3",
    "coverEmoji": "🎨"
  },
  {
    "catalogSeq": 55,
    "id": "moe-055",
    "title": "父与子",
    "author": "[德]埃·奥·卜劳恩 著",
    "gradeBand": "3-4",
    "category": "art",
    "primaryRegionId": "dream-tower",
    "contentPhase": "p3",
    "coverEmoji": "🎨"
  },
  {
    "catalogSeq": 56,
    "id": "moe-056",
    "title": "毛泽东箴言",
    "author": "中国中共文献研究会 编订",
    "gradeBand": "5-6",
    "category": "humanities",
    "primaryRegionId": "ancient-desert",
    "contentPhase": "p1",
    "coverEmoji": "🏛️"
  },
  {
    "catalogSeq": 57,
    "id": "moe-057",
    "title": "习近平讲故事：少年版",
    "author": "人民日报评论部 著",
    "gradeBand": "5-6",
    "category": "humanities",
    "primaryRegionId": "ancient-desert",
    "contentPhase": "p1",
    "coverEmoji": "🏛️"
  },
  {
    "catalogSeq": 58,
    "id": "moe-058",
    "title": "马克思画传：马克思诞辰 200 周年纪念版",
    "author": "中共中央马克思恩格斯列宁斯大林著作编译局 编",
    "gradeBand": "5-6",
    "category": "humanities",
    "primaryRegionId": "ancient-desert",
    "contentPhase": "p1",
    "coverEmoji": "🏛️"
  },
  {
    "catalogSeq": 59,
    "id": "moe-059",
    "title": "中华人民共和国未成年人保护法",
    "author": "全国人大常委会办公厅 供稿",
    "gradeBand": "5-6",
    "category": "humanities",
    "primaryRegionId": "ancient-desert",
    "contentPhase": "p1",
    "coverEmoji": "🏛️"
  },
  {
    "catalogSeq": 60,
    "id": "moe-060",
    "title": "中华人物故事汇·中华先烈人物故事汇",
    "author": "张树军等 主编/编著",
    "gradeBand": "5-6",
    "category": "humanities",
    "primaryRegionId": "ancient-desert",
    "contentPhase": "p1",
    "coverEmoji": "🏛️"
  },
  {
    "catalogSeq": 61,
    "id": "moe-061",
    "title": "我们走在大路上：1949-2019",
    "author": "大型文献专题片《我们走在大路上》创作组 著",
    "gradeBand": "5-6",
    "category": "humanities",
    "primaryRegionId": "ancient-desert",
    "contentPhase": "p1",
    "coverEmoji": "🏛️"
  },
  {
    "catalogSeq": 62,
    "id": "moe-062",
    "title": "“抵御外侮——中华英豪传奇”丛书",
    "author": "张海鹏 主编",
    "gradeBand": "5-6",
    "category": "humanities",
    "primaryRegionId": "ancient-desert",
    "contentPhase": "p1",
    "coverEmoji": "🏛️"
  },
  {
    "catalogSeq": 63,
    "id": "moe-063",
    "title": "重读先烈诗章",
    "author": "中共中央宣传部宣传教育局 编",
    "gradeBand": "5-6",
    "category": "humanities",
    "primaryRegionId": "ancient-desert",
    "contentPhase": "p1",
    "coverEmoji": "🏛️"
  },
  {
    "catalogSeq": 64,
    "id": "moe-064",
    "title": "梦圆大地：袁隆平传",
    "author": "姚昆仑 著",
    "gradeBand": "5-6",
    "category": "humanities",
    "primaryRegionId": "ancient-desert",
    "contentPhase": "p1",
    "coverEmoji": "🏛️"
  },
  {
    "catalogSeq": 65,
    "id": "moe-065",
    "title": "思考世界的孩子",
    "author": "[法]阿内-索菲·希拉尔等 著/[法]帕斯卡尔·勒梅特尔 绘",
    "gradeBand": "5-6",
    "category": "humanities",
    "primaryRegionId": "ancient-desert",
    "contentPhase": "p1",
    "coverEmoji": "🏛️"
  },
  {
    "catalogSeq": 66,
    "id": "moe-066",
    "title": "写给孩子的哲学启蒙书",
    "author": "[法]拉贝，[法]毕奇 著",
    "gradeBand": "5-6",
    "category": "humanities",
    "primaryRegionId": "ancient-desert",
    "contentPhase": "p1",
    "coverEmoji": "🏛️"
  },
  {
    "catalogSeq": 67,
    "id": "moe-067",
    "title": "声律启蒙",
    "author": "(清)车万育 著",
    "gradeBand": "5-6",
    "category": "literature",
    "primaryRegionId": "dream-tower",
    "contentPhase": "p3",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 68,
    "id": "moe-068",
    "title": "千家诗",
    "author": "(宋)谢枋得，(明)王相 选编",
    "gradeBand": "5-6",
    "category": "literature",
    "primaryRegionId": "dream-tower",
    "contentPhase": "p3",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 69,
    "id": "moe-069",
    "title": "可爱的中国（单行本）",
    "author": "方志敏 著",
    "gradeBand": "5-6",
    "category": "literature",
    "primaryRegionId": "ancient-desert",
    "contentPhase": "p1",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 70,
    "id": "moe-070",
    "title": "寄小读者",
    "author": "冰心 著",
    "gradeBand": "5-6",
    "category": "literature",
    "primaryRegionId": "dream-tower",
    "contentPhase": "p3",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 71,
    "id": "moe-071",
    "title": "大林和小林",
    "author": "张天翼 著",
    "gradeBand": "5-6",
    "category": "literature",
    "primaryRegionId": "ice-mountain",
    "contentPhase": "p1",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 72,
    "id": "moe-072",
    "title": "呼兰河传",
    "author": "萧红 著",
    "gradeBand": "5-6",
    "category": "literature",
    "primaryRegionId": "dream-tower",
    "contentPhase": "p3",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 73,
    "id": "moe-073",
    "title": "狐狸打猎人",
    "author": "金近 著",
    "gradeBand": "5-6",
    "category": "literature",
    "primaryRegionId": "magic-forest",
    "contentPhase": "p1",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 74,
    "id": "moe-074",
    "title": "城南旧事",
    "author": "林海音 著",
    "gradeBand": "5-6",
    "category": "literature",
    "primaryRegionId": "dream-tower",
    "contentPhase": "p3",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 75,
    "id": "moe-075",
    "title": "小兵张嘎",
    "author": "徐光耀 著",
    "gradeBand": "5-6",
    "category": "literature",
    "primaryRegionId": "ice-mountain",
    "contentPhase": "p1",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 76,
    "id": "moe-076",
    "title": "闪闪的红星",
    "author": "李心田 著",
    "gradeBand": "5-6",
    "category": "literature",
    "primaryRegionId": "ice-mountain",
    "contentPhase": "p1",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 77,
    "id": "moe-077",
    "title": "我们的母亲叫中国",
    "author": "苏叔阳 著",
    "gradeBand": "5-6",
    "category": "literature",
    "primaryRegionId": "ancient-desert",
    "contentPhase": "p1",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 78,
    "id": "moe-078",
    "title": "美丽的西沙群岛",
    "author": "刘先平 著",
    "gradeBand": "5-6",
    "category": "literature",
    "primaryRegionId": "ice-mountain",
    "contentPhase": "p1",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 79,
    "id": "moe-079",
    "title": "非法智慧",
    "author": "张之路 著",
    "gradeBand": "5-6",
    "category": "literature",
    "primaryRegionId": "ice-mountain",
    "contentPhase": "p1",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 80,
    "id": "moe-080",
    "title": "一百个孩子的中国梦",
    "author": "董宏猷 著",
    "gradeBand": "5-6",
    "category": "literature",
    "primaryRegionId": "dream-tower",
    "contentPhase": "p3",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 81,
    "id": "moe-081",
    "title": "童年河",
    "author": "赵丽宏 著",
    "gradeBand": "5-6",
    "category": "literature",
    "primaryRegionId": "ice-mountain",
    "contentPhase": "p1",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 82,
    "id": "moe-082",
    "title": "草房子",
    "author": "曹文轩 著",
    "gradeBand": "5-6",
    "category": "literature",
    "primaryRegionId": "dream-tower",
    "contentPhase": "p3",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 83,
    "id": "moe-083",
    "title": "男生贾里全传",
    "author": "秦文君 著",
    "gradeBand": "5-6",
    "category": "literature",
    "primaryRegionId": "ice-mountain",
    "contentPhase": "p1",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 84,
    "id": "moe-084",
    "title": "今天我是升旗手",
    "author": "黄蓓佳 著",
    "gradeBand": "5-6",
    "category": "literature",
    "primaryRegionId": "ice-mountain",
    "contentPhase": "p1",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 85,
    "id": "moe-085",
    "title": "芝麻开门",
    "author": "祁智 著",
    "gradeBand": "5-6",
    "category": "literature",
    "primaryRegionId": "ice-mountain",
    "contentPhase": "p1",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 86,
    "id": "moe-086",
    "title": "你是我的妹",
    "author": "彭学军 著",
    "gradeBand": "5-6",
    "category": "literature",
    "primaryRegionId": "ice-mountain",
    "contentPhase": "p1",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 87,
    "id": "moe-087",
    "title": "黑焰",
    "author": "格日勒其木格·黑鹤 著",
    "gradeBand": "5-6",
    "category": "literature",
    "primaryRegionId": "ice-mountain",
    "contentPhase": "p1",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 88,
    "id": "moe-088",
    "title": "安徒生童话",
    "author": "[丹麦]安徒生 著/叶君健 译",
    "gradeBand": "5-6",
    "category": "literature",
    "primaryRegionId": "sky-kingdom",
    "contentPhase": "p3",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 89,
    "id": "moe-089",
    "title": "汤姆·索亚历险记",
    "author": "[美]马克·吐温 著/张友松 译",
    "gradeBand": "5-6",
    "category": "literature",
    "primaryRegionId": "sky-kingdom",
    "contentPhase": "p3",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 90,
    "id": "moe-090",
    "title": "假如给我三天光明",
    "author": "[美]海伦·凯勒 著/李汉昭 译",
    "gradeBand": "5-6",
    "category": "literature",
    "primaryRegionId": "sky-kingdom",
    "contentPhase": "p3",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 91,
    "id": "moe-091",
    "title": "小王子",
    "author": "[法]圣·埃克苏佩里 著/柳鸣九 译",
    "gradeBand": "5-6",
    "category": "literature",
    "primaryRegionId": "sky-kingdom",
    "contentPhase": "p1",
    "coverEmoji": "📖",
    "legacyReaderBookId": "1",
    "challengeChapterId": "chapter_1"
  },
  {
    "catalogSeq": 92,
    "id": "moe-092",
    "title": "永远讲不完的故事",
    "author": "[德]米切尔·恩德 著/李士勋 译",
    "gradeBand": "5-6",
    "category": "literature",
    "primaryRegionId": "sky-kingdom",
    "contentPhase": "p3",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 93,
    "id": "moe-093",
    "title": "哈利波特与魔法石",
    "author": "[英]J.K.罗琳 著/苏农 译",
    "gradeBand": "5-6",
    "category": "literature",
    "primaryRegionId": "sky-kingdom",
    "contentPhase": "p3",
    "coverEmoji": "📖"
  },
  {
    "catalogSeq": 94,
    "id": "moe-094",
    "title": "国家版图知识读本",
    "author": "《国家版图知识读本》编撰委员会 编著",
    "gradeBand": "5-6",
    "category": "science",
    "primaryRegionId": "ocean-ruins",
    "contentPhase": "p2",
    "coverEmoji": "🔬"
  },
  {
    "catalogSeq": 95,
    "id": "moe-095",
    "title": "大国重器：图说当代中国重大科技成果",
    "author": "贲德 主编",
    "gradeBand": "5-6",
    "category": "science",
    "primaryRegionId": "ocean-ruins",
    "contentPhase": "p2",
    "coverEmoji": "🔬"
  },
  {
    "catalogSeq": 96,
    "id": "moe-096",
    "title": "中国历史上的科学发明：插图本",
    "author": "钱伟长 著",
    "gradeBand": "5-6",
    "category": "science",
    "primaryRegionId": "ocean-ruins",
    "contentPhase": "p2",
    "coverEmoji": "🔬"
  },
  {
    "catalogSeq": 97,
    "id": "moe-097",
    "title": "中国儿童地图百科全书·世界遗产",
    "author": "《世界遗产》编委会 编著",
    "gradeBand": "5-6",
    "category": "science",
    "primaryRegionId": "ocean-ruins",
    "contentPhase": "p2",
    "coverEmoji": "🔬"
  },
  {
    "catalogSeq": 98,
    "id": "moe-098",
    "title": "小学生食品安全知识读本",
    "author": "刘烈刚，杨雪锋 主编",
    "gradeBand": "5-6",
    "category": "science",
    "primaryRegionId": "ocean-ruins",
    "contentPhase": "p2",
    "coverEmoji": "🔬"
  },
  {
    "catalogSeq": 99,
    "id": "moe-099",
    "title": "海错图笔记",
    "author": "张辰亮 著",
    "gradeBand": "5-6",
    "category": "science",
    "primaryRegionId": "ocean-ruins",
    "contentPhase": "p2",
    "coverEmoji": "🔬"
  },
  {
    "catalogSeq": 100,
    "id": "moe-100",
    "title": "每月之星",
    "author": "陶宏 著",
    "gradeBand": "5-6",
    "category": "science",
    "primaryRegionId": "ocean-ruins",
    "contentPhase": "p2",
    "coverEmoji": "🔬"
  },
  {
    "catalogSeq": 101,
    "id": "moe-101",
    "title": "寂静的春天",
    "author": "[美]蕾切尔·卡森 著",
    "gradeBand": "5-6",
    "category": "science",
    "primaryRegionId": "ocean-ruins",
    "contentPhase": "p2",
    "coverEmoji": "🔬"
  },
  {
    "catalogSeq": 102,
    "id": "moe-102",
    "title": "空间简史",
    "author": "[意]托马斯·马卡卡罗等 著",
    "gradeBand": "5-6",
    "category": "science",
    "primaryRegionId": "ocean-ruins",
    "contentPhase": "p2",
    "coverEmoji": "🔬"
  },
  {
    "catalogSeq": 103,
    "id": "moe-103",
    "title": "BBC 科普三部曲",
    "author": "[英]伊恩·斯图尔特等 著",
    "gradeBand": "5-6",
    "category": "science",
    "primaryRegionId": "ocean-ruins",
    "contentPhase": "p2",
    "coverEmoji": "🔬"
  },
  {
    "catalogSeq": 104,
    "id": "moe-104",
    "title": "昆虫记",
    "author": "[法]让-亨利·法布尔 著",
    "gradeBand": "5-6",
    "category": "science",
    "primaryRegionId": "ocean-ruins",
    "contentPhase": "p2",
    "coverEmoji": "🔬"
  },
  {
    "catalogSeq": 105,
    "id": "moe-105",
    "title": "启功给你讲书法",
    "author": "启功 著",
    "gradeBand": "5-6",
    "category": "art",
    "primaryRegionId": "dream-tower",
    "contentPhase": "p3",
    "coverEmoji": "🎨"
  },
  {
    "catalogSeq": 106,
    "id": "moe-106",
    "title": "京剧常识手册",
    "author": "涂沛，苏移等 著",
    "gradeBand": "5-6",
    "category": "art",
    "primaryRegionId": "dream-tower",
    "contentPhase": "p3",
    "coverEmoji": "🎨"
  },
  {
    "catalogSeq": 107,
    "id": "moe-107",
    "title": "中国戏曲：连环画",
    "author": "(明)汤显祖等 原著/良士等 改编/赵宏本等 绘画",
    "gradeBand": "5-6",
    "category": "art",
    "primaryRegionId": "dream-tower",
    "contentPhase": "p3",
    "coverEmoji": "🎨"
  },
  {
    "catalogSeq": 108,
    "id": "moe-108",
    "title": "戏曲进校园",
    "author": "郑传寅，黄蓓 编著",
    "gradeBand": "5-6",
    "category": "art",
    "primaryRegionId": "dream-tower",
    "contentPhase": "p3",
    "coverEmoji": "🎨"
  },
  {
    "catalogSeq": 109,
    "id": "moe-109",
    "title": "中国民歌欣赏",
    "author": "周青青 著",
    "gradeBand": "5-6",
    "category": "art",
    "primaryRegionId": "dream-tower",
    "contentPhase": "p3",
    "coverEmoji": "🎨"
  },
  {
    "catalogSeq": 110,
    "id": "moe-110",
    "title": "建筑艺术的语言",
    "author": "刘先觉 著",
    "gradeBand": "5-6",
    "category": "art",
    "primaryRegionId": "dream-tower",
    "contentPhase": "p3",
    "coverEmoji": "🎨"
  }
] as MoeCatalogEntry[]

export const MOE_CATALOG_BY_ID: Record<string, MoeCatalogEntry> = Object.fromEntries(
  MOE_CATALOG_2020.map((entry) => [entry.id, entry]),
)

export const MOE_CATALOG_BY_SEQ: Record<number, MoeCatalogEntry> = Object.fromEntries(
  MOE_CATALOG_2020.map((entry) => [entry.catalogSeq, entry]),
)

export function getMoeCatalogByRegion(regionId: AdventureRegionId) {
  return MOE_CATALOG_2020.filter((entry) => entry.primaryRegionId === regionId)
}

export function getMoeCatalogByGradeBand(gradeBand: GradeBand | "") {
  if (!gradeBand) return MOE_CATALOG_2020
  return MOE_CATALOG_2020.filter((entry) => entry.gradeBand === gradeBand)
}

export function isCatalogContentAvailable(entry: MoeCatalogEntry) {
  return Boolean(entry.legacyReaderBookId)
}

export const GRADE_BAND_LABEL: Record<GradeBand, string> = {
  "1-2": "1～2 年级",
  "3-4": "3～4 年级",
  "5-6": "5～6 年级",
}

export const MOE_CATEGORY_LABEL: Record<MoeCategory, string> = {
  humanities: "人文社科",
  literature: "文学",
  science: "自然科学",
  art: "艺术",
}
