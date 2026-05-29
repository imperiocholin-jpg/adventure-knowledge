import fs from "node:fs"
import path from "node:path"

const rows = [
  [1, "1-2", "humanities", "五星红旗", "华琪，杨汝戬，马堪岱 主编", "ancient-desert"],
  [2, "1-2", "humanities", "读图识中国", "人民教育出版社地图编辑室 编", "ancient-desert"],
  [3, "1-2", "humanities", "中华人物故事汇·中华先锋人物故事汇", "徐鲁等 著", "ancient-desert"],
  [4, "1-2", "literature", "萝卜回来了", "方轶群 文/严个凡 画", "magic-forest"],
  [5, "1-2", "literature", "没头脑和不高兴", "任溶溶 著", "magic-forest"],
  [6, "1-2", "literature", "儿歌 300 首", "金波，郑春华等 著", "magic-forest"],
  [7, "1-2", "literature", "小巴掌童话", "张秋生 著", "magic-forest"],
  [8, "1-2", "literature", "小马过河", "彭文席 著", "magic-forest"],
  [9, "1-2", "literature", "吃黑夜的大象", "白冰 著/沈苑苑 绘", "magic-forest"],
  [10, "1-2", "literature", "大头儿子和小头爸爸", "郑春华 著", "magic-forest"],
  [11, "1-2", "literature", "我有友情要出租", "方素珍 著/郝洛玟 绘", "magic-forest"],
  [12, "1-2", "literature", "一园青菜成了精", "编自北方童谣/周翔 绘", "magic-forest"],
  [13, "1-2", "literature", "团圆", "余丽琼 文/朱成梁 图", "magic-forest"],
  [14, "1-2", "literature", "格林童话", "[德]格林兄弟 著/杨武能 译", "sky-kingdom"],
  [15, "1-2", "literature", "弗朗兹的故事", "[奥]克里斯蒂娜·涅斯特林格 著/湘雪 译", "sky-kingdom"],
  [16, "1-2", "science", "小彗星旅行记", "徐刚 著/绘", "ocean-ruins"],
  [17, "1-2", "science", "嫦娥探月立体书", "马莉等 文/王晓旭 图", "ocean-ruins"],
  [18, "1-2", "science", "趣味数学百科图典", "田翔仁 编著", "ocean-ruins"],
  [19, "1-2", "science", "来喝水吧", "[澳]葛瑞米·贝斯 文/图", "ocean-ruins"],
  [20, "1-2", "art", "爸爸的画·沙坪小屋", "丰子恺 绘/丰陈宝，丰一吟 著", "dream-tower"],
  [21, "1-2", "art", "京剧脸谱", "傅学斌 著", "dream-tower"],
  [22, "3-4", "humanities", "周恩来寄语：青少年版", "周恩来思想生平研究会 编", "ancient-desert"],
  [23, "3-4", "humanities", "雷锋的故事", "陈广生，崔家骏 著", "ancient-desert"],
  [24, "3-4", "humanities", "林汉达中国历史故事集", "林汉达，雪岗 编著", "ancient-desert"],
  [25, "3-4", "humanities", "刘兴诗爷爷给孩子讲中国地理", "刘兴诗 著", "ancient-desert"],
  [26, "3-4", "humanities", "居里夫人的故事", "[英]埃列娜·杜尔利 著", "ancient-desert"],
  [27, "3-4", "humanities", "儿童哲学智慧书", "[法]柏尼菲 著/[法]卢里耶等 绘", "ancient-desert"],
  [28, "3-4", "humanities", "哲学鸟飞罗系列", "[法]拉贝 著/[法]加斯特 绘", "ancient-desert"],
  [29, "3-4", "literature", "成语故事", "——", "magic-forest"],
  [30, "3-4", "literature", "中国古今寓言", "——", "magic-forest"],
  [31, "3-4", "literature", "中国神话故事集", "袁珂 著", "magic-forest"],
  [32, "3-4", "literature", "稻草人", "叶圣陶 著", "ice-mountain"],
  [33, "3-4", "literature", "宝葫芦的秘密", "张天翼 著", "ice-mountain"],
  [34, "3-4", "literature", "三毛流浪记", "张乐平 著", "ice-mountain"],
  [35, "3-4", "literature", "“下次开船”港", "严文井 著", "ice-mountain"],
  [36, "3-4", "literature", "孙悟空在我们村里", "郭风 著", "magic-forest"],
  [37, "3-4", "literature", "小英雄雨来", "管桦 著", "ice-mountain"],
  [38, "3-4", "literature", "帽子的秘密", "柯岩 文", "ice-mountain"],
  [39, "3-4", "literature", "小布头奇遇记", "孙幼军 著", "ice-mountain"],
  [40, "3-4", "literature", "推开窗子看见你", "金波 著", "ice-mountain"],
  [41, "3-4", "literature", "笨狼的故事", "汤素兰 著", "magic-forest"],
  [42, "3-4", "literature", "盘中餐", "于虹呈 著", "ice-mountain"],
  [43, "3-4", "literature", "爱的教育", "[意]阿米琪斯 著/王干卿 译", "sky-kingdom"],
  [44, "3-4", "literature", "夏洛的网", "[美]E.B.怀特 著/任溶溶 译", "sky-kingdom"],
  [45, "3-4", "literature", "窗边的小豆豆", "[日]黑柳彻子 著/赵玉皎 译", "sky-kingdom"],
  [46, "3-4", "science", "少儿科普三字经", "亚子 著/金平 绘", "ocean-ruins"],
  [47, "3-4", "science", "中国国家博物馆儿童历史百科绘本", "中国国家博物馆 著", "ocean-ruins"],
  [48, "3-4", "science", "昆虫漫话", "陶秉珍 著", "ocean-ruins"],
  [49, "3-4", "science", "中国儿童视听百科·飞向太空", "《飞向太空》编委会 编著", "ocean-ruins"],
  [50, "3-4", "science", "异想天开的科学游戏", "高云峰 著", "ocean-ruins"],
  [51, "3-4", "science", "万物简史：少儿彩绘版", "[英]布莱森 著", "ocean-ruins"],
  [52, "3-4", "science", "蜡烛的故事", "[英]法拉第 著", "ocean-ruins"],
  [53, "3-4", "art", "地球的红飘带", "魏巍 原著/王素 改编/沈尧伊 绘画", "dream-tower"],
  [54, "3-4", "art", "人民音乐家：冼星海", "郭冰茹 著", "dream-tower"],
  [55, "3-4", "art", "父与子", "[德]埃·奥·卜劳恩 著", "dream-tower"],
  [56, "5-6", "humanities", "毛泽东箴言", "中国中共文献研究会 编订", "ancient-desert"],
  [57, "5-6", "humanities", "习近平讲故事：少年版", "人民日报评论部 著", "ancient-desert"],
  [58, "5-6", "humanities", "马克思画传：马克思诞辰 200 周年纪念版", "中共中央马克思恩格斯列宁斯大林著作编译局 编", "ancient-desert"],
  [59, "5-6", "humanities", "中华人民共和国未成年人保护法", "全国人大常委会办公厅 供稿", "ancient-desert"],
  [60, "5-6", "humanities", "中华人物故事汇·中华先烈人物故事汇", "张树军等 主编/编著", "ancient-desert"],
  [61, "5-6", "humanities", "我们走在大路上：1949-2019", "大型文献专题片《我们走在大路上》创作组 著", "ancient-desert"],
  [62, "5-6", "humanities", "“抵御外侮——中华英豪传奇”丛书", "张海鹏 主编", "ancient-desert"],
  [63, "5-6", "humanities", "重读先烈诗章", "中共中央宣传部宣传教育局 编", "ancient-desert"],
  [64, "5-6", "humanities", "梦圆大地：袁隆平传", "姚昆仑 著", "ancient-desert"],
  [65, "5-6", "humanities", "思考世界的孩子", "[法]阿内-索菲·希拉尔等 著/[法]帕斯卡尔·勒梅特尔 绘", "ancient-desert"],
  [66, "5-6", "humanities", "写给孩子的哲学启蒙书", "[法]拉贝，[法]毕奇 著", "ancient-desert"],
  [67, "5-6", "literature", "声律启蒙", "(清)车万育 著", "dream-tower"],
  [68, "5-6", "literature", "千家诗", "(宋)谢枋得，(明)王相 选编", "dream-tower"],
  [69, "5-6", "literature", "可爱的中国（单行本）", "方志敏 著", "ancient-desert"],
  [70, "5-6", "literature", "寄小读者", "冰心 著", "dream-tower"],
  [71, "5-6", "literature", "大林和小林", "张天翼 著", "ice-mountain"],
  [72, "5-6", "literature", "呼兰河传", "萧红 著", "dream-tower"],
  [73, "5-6", "literature", "狐狸打猎人", "金近 著", "magic-forest"],
  [74, "5-6", "literature", "城南旧事", "林海音 著", "dream-tower"],
  [75, "5-6", "literature", "小兵张嘎", "徐光耀 著", "ice-mountain"],
  [76, "5-6", "literature", "闪闪的红星", "李心田 著", "ice-mountain"],
  [77, "5-6", "literature", "我们的母亲叫中国", "苏叔阳 著", "ancient-desert"],
  [78, "5-6", "literature", "美丽的西沙群岛", "刘先平 著", "ice-mountain"],
  [79, "5-6", "literature", "非法智慧", "张之路 著", "ice-mountain"],
  [80, "5-6", "literature", "一百个孩子的中国梦", "董宏猷 著", "dream-tower"],
  [81, "5-6", "literature", "童年河", "赵丽宏 著", "ice-mountain"],
  [82, "5-6", "literature", "草房子", "曹文轩 著", "dream-tower"],
  [83, "5-6", "literature", "男生贾里全传", "秦文君 著", "ice-mountain"],
  [84, "5-6", "literature", "今天我是升旗手", "黄蓓佳 著", "ice-mountain"],
  [85, "5-6", "literature", "芝麻开门", "祁智 著", "ice-mountain"],
  [86, "5-6", "literature", "你是我的妹", "彭学军 著", "ice-mountain"],
  [87, "5-6", "literature", "黑焰", "格日勒其木格·黑鹤 著", "ice-mountain"],
  [88, "5-6", "literature", "安徒生童话", "[丹麦]安徒生 著/叶君健 译", "sky-kingdom"],
  [89, "5-6", "literature", "汤姆·索亚历险记", "[美]马克·吐温 著/张友松 译", "sky-kingdom"],
  [90, "5-6", "literature", "假如给我三天光明", "[美]海伦·凯勒 著/李汉昭 译", "sky-kingdom"],
  [91, "5-6", "literature", "小王子", "[法]圣·埃克苏佩里 著/柳鸣九 译", "sky-kingdom"],
  [92, "5-6", "literature", "永远讲不完的故事", "[德]米切尔·恩德 著/李士勋 译", "sky-kingdom"],
  [93, "5-6", "literature", "哈利波特与魔法石", "[英]J.K.罗琳 著/苏农 译", "sky-kingdom"],
  [94, "5-6", "science", "国家版图知识读本", "《国家版图知识读本》编撰委员会 编著", "ocean-ruins"],
  [95, "5-6", "science", "大国重器：图说当代中国重大科技成果", "贲德 主编", "ocean-ruins"],
  [96, "5-6", "science", "中国历史上的科学发明：插图本", "钱伟长 著", "ocean-ruins"],
  [97, "5-6", "science", "中国儿童地图百科全书·世界遗产", "《世界遗产》编委会 编著", "ocean-ruins"],
  [98, "5-6", "science", "小学生食品安全知识读本", "刘烈刚，杨雪锋 主编", "ocean-ruins"],
  [99, "5-6", "science", "海错图笔记", "张辰亮 著", "ocean-ruins"],
  [100, "5-6", "science", "每月之星", "陶宏 著", "ocean-ruins"],
  [101, "5-6", "science", "寂静的春天", "[美]蕾切尔·卡森 著", "ocean-ruins"],
  [102, "5-6", "science", "空间简史", "[意]托马斯·马卡卡罗等 著", "ocean-ruins"],
  [103, "5-6", "science", "BBC 科普三部曲", "[英]伊恩·斯图尔特等 著", "ocean-ruins"],
  [104, "5-6", "science", "昆虫记", "[法]让-亨利·法布尔 著", "ocean-ruins"],
  [105, "5-6", "art", "启功给你讲书法", "启功 著", "dream-tower"],
  [106, "5-6", "art", "京剧常识手册", "涂沛，苏移等 著", "dream-tower"],
  [107, "5-6", "art", "中国戏曲：连环画", "(明)汤显祖等 原著/良士等 改编/赵宏本等 绘画", "dream-tower"],
  [108, "5-6", "art", "戏曲进校园", "郑传寅，黄蓓 编著", "dream-tower"],
  [109, "5-6", "art", "中国民歌欣赏", "周青青 著", "dream-tower"],
  [110, "5-6", "art", "建筑艺术的语言", "刘先觉 著", "dream-tower"],
]

const p1Available = new Set([44, 91])
const legacy = { 44: "2", 91: "1" }
const chapter = { 44: "chapter_2", 91: "chapter_1" }
const covers = { literature: "📖", humanities: "🏛️", science: "🔬", art: "🎨" }

function contentPhase(seq, region) {
  if (p1Available.has(seq)) return "p1"
  if (region === "ocean-ruins") return "p2"
  if (region === "sky-kingdom" || region === "dream-tower") return "p3"
  return "p1"
}

const entries = rows.map(([seq, gradeBand, category, title, author, primaryRegionId]) => {
  const entry = {
    catalogSeq: seq,
    id: `moe-${String(seq).padStart(3, "0")}`,
    title,
    author,
    gradeBand,
    category,
    primaryRegionId,
    contentPhase: contentPhase(seq, primaryRegionId),
    coverEmoji: covers[category],
  }
  if (legacy[seq]) {
    entry.legacyReaderBookId = legacy[seq]
    entry.challengeChapterId = chapter[seq]
  }
  return entry
})

const counts = {}
for (const entry of entries) {
  counts[entry.primaryRegionId] = (counts[entry.primaryRegionId] || 0) + 1
}

let md = `# 小学课外读物 × 冒险区域矩阵

来源：[教育部《中小学生阅读指导目录（2020年版）》](https://www.moe.gov.cn/jyb_xwfb/gzdt_gzdt/s5987/202004/t20200422_445605.html) 小学段，共 **110** 种。

设计原则：**区域按主题分池闯关**；**年级仅作推荐标签**（见 \`gradeBand\`），不作为区域解锁门槛。

| 序号 | 书名 | 学段 | 分类 | 主区域 | 内容阶段 |
|------|------|------|------|--------|----------|
`
for (const entry of entries) {
  md += `| ${entry.catalogSeq} | ${entry.title} | ${entry.gradeBand} | ${entry.category} | ${entry.primaryRegionId} | ${entry.contentPhase} |\n`
}
md += `\n## 各区域书目数量\n\n`
for (const [region, count] of Object.entries(counts).sort()) {
  md += `- \`${region}\`: ${count} 种\n`
}
md += `\n## 内容分期\n\n- **p1**：首三区可浏览；已接入电子版：夏洛的网、小王子（及演示书绿野仙踪）\n- **p2**：深海遗迹自然科学批次\n- **p3**：天空王国、梦境之塔文学与艺术批次\n`

const root = path.resolve(import.meta.dirname, "..")
fs.writeFileSync(path.join(root, "docs/READING_REGION_MATRIX.md"), md)

const ts = `import type { AdventureRegionId } from "@/lib/library/adventure-regions"

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
export const MOE_CATALOG_2020: MoeCatalogEntry[] = ${JSON.stringify(entries, null, 2)} as MoeCatalogEntry[]

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
`

fs.writeFileSync(path.join(root, "lib/library/moe-catalog-2020.ts"), ts)
console.log("Generated", entries.length, "catalog entries")
