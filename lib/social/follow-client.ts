export async function toggleFollowUser(userId: string, isFollowing: boolean) {
  const response = isFollowing
    ? await fetch(`/api/social/follow?userId=${encodeURIComponent(userId)}`, { method: "DELETE" })
    : await fetch("/api/social/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok || payload?.ok === false) {
    const message =
      (payload?.error?.message as string | undefined) ??
      (isFollowing ? "取消关注失败" : "关注失败，请稍后重试")
    throw new Error(message)
  }
  return payload
}
