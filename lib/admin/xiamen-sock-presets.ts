/** 厦门小学马甲预设（运营批量创建用） */

export const XIAMEN_ELEMENTARY_SCHOOLS = [
  "厦门市实验小学",
  "厦门滨北小学",
  "厦门梧村小学",
  "厦门园南小学",
  "厦门槟榔小学",
  "厦门松柏小学",
  "厦门湖滨小学",
  "厦门文安小学",
  "厦门鹭江小学",
  "厦门大同小学",
] as const

const NICKNAMES = [
  "小珊珊",
  "陈子轩",
  "林雨桐",
  "王浩然",
  "张梓涵",
  "刘思远",
  "黄嘉怡",
  "吴俊杰",
  "郑欣妍",
  "许博文",
] as const

const GRADES = [
  "一年级1班",
  "二年级3班",
  "三年级2班",
  "三年级5班",
  "四年级1班",
  "四年级4班",
  "五年级2班",
  "五年级6班",
  "六年级1班",
  "六年级3班",
] as const

const AGES = [7, 8, 9, 10, 11, 12, 8, 9, 10, 11] as const

const AVATAR_IDS = [
  "girl-01",
  "boy-02",
  "girl-03",
  "boy-04",
  "girl-05",
  "boy-01",
  "girl-02",
  "boy-03",
  "girl-04",
  "boy-05",
] as const

export interface XiamenSockPreset {
  email: string
  password: string
  nickname: string
  schoolName: string
  gradeClass: string
  age: number
  avatarId: string
}

export function buildXiamenSockPresets(count = 10, password = "Test123456"): XiamenSockPreset[] {
  const n = Math.min(count, XIAMEN_ELEMENTARY_SCHOOLS.length)
  const stamp = Date.now().toString(36)

  return Array.from({ length: n }, (_, index) => ({
    email: `xm.sock${String(index + 1).padStart(2, "0")}.${stamp}@adventure.test`,
    password,
    nickname: NICKNAMES[index],
    schoolName: XIAMEN_ELEMENTARY_SCHOOLS[index],
    gradeClass: GRADES[index],
    age: AGES[index],
    avatarId: AVATAR_IDS[index],
  }))
}
