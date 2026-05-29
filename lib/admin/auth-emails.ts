/** 从 Supabase Auth 批量解析用户邮箱（users 表无 email 列时的兜底） */
export async function fetchAuthEmailsByUserIds(
  serviceClient: any,
  userIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  const uniqueIds = [...new Set(userIds.filter(Boolean))]
  if (uniqueIds.length === 0) return map

  await Promise.all(
    uniqueIds.map(async (userId) => {
      try {
        const result = await serviceClient.auth.admin.getUserById(userId)
        const email = result.data?.user?.email
        if (email) map.set(userId, email)
      } catch {
        // 单用户失败不阻塞列表
      }
    }),
  )

  return map
}
