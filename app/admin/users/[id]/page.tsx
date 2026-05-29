"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

import { PET_TYPE_OPTIONS } from "@/lib/pets/pet-type-options"
import type { PetTypeId } from "@/lib/pets/pet-profile"
import { PetInventoryEditor } from "@/components/admin/pet-inventory-editor"
import { normalizeInventory, type PetInventoryMap } from "@/lib/pets/state"

interface UserDetailPayload {
  user: {
    id: string
    email: string
    nickname: string
    schoolName: string | null
    gradeClass: string | null
    age: number | null
    coins: number
    level: number
    experience: number
    dailyStreak: number
    lastActiveDate: string | null
    battleWins: number
    createdAt: string | null
    profileSetupCompleted: boolean
    followingCount: number
    followerCount: number
  }
  pets: Array<{
    id: string
    name: string
    species: string
    breed: string
    petType: PetTypeId
    speciesLabel: string
    hunger: number
    spirit: number
    bond: number
    petExp: number
    petLevel: number
    lifeStage: string
    isDead: boolean
    inventory: PetInventoryMap
  }>
  readingRecords: Array<{
    bookId: string
    stars: number
    entryMode: string
    createdAt: string | null
  }>
  dailyTasks: Array<{
    title: string
    taskType: string
    progress: number
    maxProgress: number
    claimed: boolean
  }>
  adventureProgress: {
    totalStars: number
    worldProgress: number
  }
  treasures: Array<{
    treasureId: string
    name: string
    unlockedAt: string | null
  }>
}

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const userId = params.id
  const [data, setData] = useState<UserDetailPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingUser, setIsSavingUser] = useState(false)
  const [isSavingPet, setIsSavingPet] = useState(false)

  const [coins, setCoins] = useState("")
  const [dailyStreak, setDailyStreak] = useState("")
  const [petHunger, setPetHunger] = useState("")
  const [petName, setPetName] = useState("")
  const [petSpirit, setPetSpirit] = useState("")
  const [petBond, setPetBond] = useState("")
  const [petLevel, setPetLevel] = useState("")
  const [petExp, setPetExp] = useState("")
  const [petType, setPetType] = useState<PetTypeId>("tusong")
  const [petRevive, setPetRevive] = useState(false)
  const [petInventory, setPetInventory] = useState<PetInventoryMap>({})
  const [isDeleting, setIsDeleting] = useState(false)

  const loadDetail = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, { cache: "no-store" })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error?.message ?? "加载用户详情失败")
      const detail = payload.data as UserDetailPayload
      setData(detail)
      setCoins(String(detail.user.coins))
      setDailyStreak(String(detail.user.dailyStreak))
      const pet = detail.pets[0]
      if (pet) {
        setPetName(pet.name)
        setPetHunger(String(pet.hunger))
        setPetSpirit(String(pet.spirit))
        setPetBond(String(pet.bond))
        setPetLevel(String(pet.petLevel))
        setPetExp(String(pet.petExp))
        setPetType(pet.petType)
        setPetRevive(pet.isDead)
        setPetInventory(normalizeInventory(pet.inventory))
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载用户详情失败")
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void loadDetail()
  }, [loadDetail])

  const saveUser = async () => {
    setIsSavingUser(true)
    setMessage(null)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coins: Number(coins),
          dailyStreak: Number(dailyStreak),
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error?.message ?? "保存失败")
      setMessage("用户数值已更新")
      await loadDetail()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存失败")
    } finally {
      setIsSavingUser(false)
    }
  }

  const savePet = async () => {
    const pet = data?.pets[0]
    if (!pet) return
    if (!petName.trim()) {
      setError("宠物名称不能为空")
      return
    }
    setIsSavingPet(true)
    setMessage(null)
    try {
      const response = await fetch(`/api/admin/pets/${pet.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: petName.trim(),
          hunger: Number(petHunger),
          spirit: Number(petSpirit),
          bond: Number(petBond),
          petLevel: Number(petLevel),
          petExp: Number(petExp),
          petType,
          isDead: petRevive,
          inventory: petInventory,
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error?.message ?? "保存宠物失败")
      setMessage("宠物与仓库已更新")
      await loadDetail()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存宠物失败")
    } finally {
      setIsSavingPet(false)
    }
  }

  const deleteUser = async () => {
    if (!data) return
    const label = data.user.email || data.user.nickname || data.user.id
    if (!window.confirm(`确定删除账号「${label}」？\n将同时删除其宠物、阅读记录等数据，且不可恢复。`)) {
      return
    }

    setIsDeleting(true)
    setError(null)
    setMessage(null)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error?.message ?? "删除失败")
      router.push("/admin/users")
      router.refresh()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "删除失败")
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return <p className="text-sm text-slate-500">加载中…</p>
  }

  if (!data) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-rose-600">{error ?? "用户不存在"}</p>
        <Link href="/admin/users" className="text-sm text-slate-600 hover:underline">
          返回列表
        </Link>
      </div>
    )
  }

  const pet = data.pets[0]
  const selectedPetType = PET_TYPE_OPTIONS.find((option) => option.id === petType)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/users" className="text-sm text-slate-500 hover:underline">
            ← 返回用户列表
          </Link>
          <h2 className="mt-1 text-xl font-semibold">{data.user.nickname}</h2>
          <p className="text-sm text-slate-500">{data.user.email || userId}</p>
        </div>
      </div>

      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      {message && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="font-medium">账号与活跃</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">邮箱</dt><dd className="max-w-[200px] truncate" title={data.user.email}>{data.user.email || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">就读学校</dt><dd>{data.user.schoolName || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">年级班级</dt><dd>{data.user.gradeClass || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">年龄</dt><dd>{data.user.age ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">注册时间</dt><dd>{data.user.createdAt?.slice(0, 19) ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">资料完成</dt><dd>{data.user.profileSetupCompleted ? "是" : "否"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">最近活跃</dt><dd>{data.user.lastActiveDate ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">累计胜场</dt><dd>{data.user.battleWins}</dd></div>
            <div className="flex justify-between items-center">
              <dt className="text-slate-500">关注</dt>
              <dd>
                <Link href={`/admin/users/${userId}/following`} className="font-medium text-slate-900 hover:underline">
                  {data.user.followingCount ?? 0} 人 →
                </Link>
              </dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-slate-500">粉丝</dt>
              <dd>
                <Link href={`/admin/users/${userId}/followers`} className="font-medium text-slate-900 hover:underline">
                  {data.user.followerCount ?? 0} 人 →
                </Link>
              </dd>
            </div>
            <div className="flex justify-between"><dt className="text-slate-500">经验</dt><dd>{data.user.experience}</dd></div>
          </dl>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="font-medium">冒险进度</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">累计星星</dt><dd>{data.adventureProgress.totalStars}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">世界进度</dt><dd>{data.adventureProgress.worldProgress}%</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">已解锁宝藏</dt><dd>{data.treasures.length} 件</dd></div>
          </dl>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="font-medium">调整用户数值</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="text-slate-500">金币 coins</span>
            <input value={coins} onChange={(e) => setCoins(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm">
            <span className="text-slate-500">连续天 daily_streak</span>
            <input value={dailyStreak} onChange={(e) => setDailyStreak(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
        </div>
        <button
          type="button"
          onClick={saveUser}
          disabled={isSavingUser}
          className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isSavingUser ? "保存中…" : "保存用户数值"}
        </button>
      </section>

      {pet && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="font-medium">宠物管理</h3>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <dt className="text-slate-500">当前类型</dt>
              <dd className="mt-0.5 font-medium">{selectedPetType?.label ?? pet.breed}</dd>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <dt className="text-slate-500">物种</dt>
              <dd className="mt-0.5 font-medium">{pet.speciesLabel || pet.species || "—"}</dd>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <dt className="text-slate-500">等级 / 阶段</dt>
              <dd className="mt-0.5 font-medium">
                Lv.{pet.petLevel} · {pet.lifeStage}
              </dd>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <dt className="text-slate-500">状态</dt>
              <dd className="mt-0.5 font-medium">{pet.isDead ? "已死亡" : "正常"}</dd>
            </div>
          </dl>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm sm:col-span-2 lg:col-span-3">
              <span className="text-slate-500">宠物名称</span>
              <input
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                maxLength={12}
                placeholder="最多 12 个字"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm sm:col-span-2 lg:col-span-3">
              <span className="text-slate-500">宠物类型</span>
              <select
                value={petType}
                onChange={(e) => setPetType(e.target.value as PetTypeId)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
              >
                {PET_TYPE_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.emoji} {option.label}（{option.speciesLabel}）
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="text-slate-500">等级 pet_level</span>
              <input
                value={petLevel}
                onChange={(e) => setPetLevel(e.target.value)}
                min={1}
                max={50}
                type="number"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="text-slate-500">经验 pet_exp</span>
              <input
                value={petExp}
                onChange={(e) => setPetExp(e.target.value)}
                min={0}
                type="number"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="text-slate-500">饱食度 hunger</span>
              <input value={petHunger} onChange={(e) => setPetHunger(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="text-sm">
              <span className="text-slate-500">精神值 spirit</span>
              <input value={petSpirit} onChange={(e) => setPetSpirit(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="text-sm">
              <span className="text-slate-500">亲密值 bond</span>
              <input value={petBond} onChange={(e) => setPetBond(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={petRevive} onChange={(e) => setPetRevive(e.target.checked)} />
            标记为死亡（勾选=死亡，取消=复活）
          </label>
          <p className="mt-2 text-xs text-slate-500">
            修改类型会同步更新 species / breed / emoji；修改等级会自动推算经验与成长阶段。请在下方仓库区一并保存。
          </p>
        </section>
      )}

      {pet && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="font-medium">宠物仓库</h3>
          <p className="mt-1 text-xs text-slate-500">数量为 0 表示从仓库移除；保存后玩家端刷新即可看到。</p>
          <div className="mt-4">
            <PetInventoryEditor inventory={petInventory} onChange={setPetInventory} />
          </div>
          <button
            type="button"
            onClick={savePet}
            disabled={isSavingPet}
            className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {isSavingPet ? "保存中…" : "保存宠物与仓库"}
          </button>
        </section>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="font-medium">最近阅读记录</h3>
        {data.readingRecords.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">暂无记录</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {data.readingRecords.map((record, index) => (
              <li key={`${record.bookId}-${index}`} className="flex justify-between border-b border-slate-100 pb-2">
                <span>书 {record.bookId || "—"} · {record.entryMode || "—"}</span>
                <span>{record.stars} 星 · {record.createdAt?.slice(0, 16) ?? "—"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="font-medium">每日任务</h3>
        {data.dailyTasks.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">暂无任务</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {data.dailyTasks.map((task, index) => (
              <li key={`${task.title}-${index}`} className="flex justify-between">
                <span>{task.title} ({task.taskType})</span>
                <span>{task.progress}/{task.maxProgress} · {task.claimed ? "已领" : "未领"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {data.treasures.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="font-medium">已解锁宝藏</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {data.treasures.map((t) => (
              <li key={t.treasureId}>{t.name} · {t.unlockedAt?.slice(0, 10) ?? "—"}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-xl border border-rose-200 bg-rose-50/50 p-4">
        <h3 className="font-medium text-rose-800">危险操作</h3>
        <p className="mt-1 text-sm text-rose-700">删除后将清除该账号的全部游戏数据，且无法恢复。</p>
        <button
          type="button"
          disabled={isDeleting}
          onClick={() => void deleteUser()}
          className="mt-3 rounded-lg border border-rose-300 bg-white px-4 py-2 text-sm font-medium text-rose-700 disabled:opacity-50"
        >
          {isDeleting ? "删除中…" : "删除此账号"}
        </button>
      </section>
    </div>
  )
}
