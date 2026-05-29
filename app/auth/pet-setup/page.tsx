"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import {
  PET_SPECIES_LABEL,
  resolvePetEmoji,
  type PetSpecies,
} from "@/lib/pets/catalog"
import { resolvePetAvatarSrc, resolvePetVideoAssets } from "@/lib/pets/avatar-registry"
import { PlayerPageShell } from "@/components/layout/player-page-shell"
import { useOnboardingPageGuard } from "@/hooks/use-onboarding-page-guard"

interface EnabledSpeciesOption {
  id: PetSpecies
  label: string
  emoji: string
  breeds: string[]
}

export default function PetSetupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isReadopt = searchParams.get("readopt") === "1"
  useOnboardingPageGuard("pet-setup", { skip: isReadopt })

  const [enabledSpecies, setEnabledSpecies] = useState<EnabledSpeciesOption[]>([])
  const [isLoadingTypes, setIsLoadingTypes] = useState(true)
  const [petName, setPetName] = useState("毛毛")
  const [species, setSpecies] = useState<PetSpecies>("dog")
  const [breed, setBreed] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function loadEnabledTypes() {
      setIsLoadingTypes(true)
      try {
        const response = await fetch("/api/pets/types", { cache: "no-store" })
        const payload = await response.json()
        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error?.message ?? "无法加载可选宠物")
        }
        const nextSpecies = Array.isArray(payload.species) ? (payload.species as EnabledSpeciesOption[]) : []
        if (!cancelled) {
          setEnabledSpecies(nextSpecies)
          if (nextSpecies.length > 0) {
            const first = nextSpecies[0]
            setSpecies(first.id)
            setBreed(first.breeds[0] ?? "")
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "无法加载可选宠物")
        }
      } finally {
        if (!cancelled) setIsLoadingTypes(false)
      }
    }
    void loadEnabledTypes()
    return () => {
      cancelled = true
    }
  }, [])

  const currentBreeds = useMemo(() => {
    return enabledSpecies.find((item) => item.id === species)?.breeds ?? []
  }, [enabledSpecies, species])

  const speciesList = useMemo(() => enabledSpecies, [enabledSpecies])

  const cubAvatarSrc = useMemo(
    () => resolvePetAvatarSrc({ species, breed, lifeStage: "幼崽" }),
    [species, breed],
  )

  const cubHappyVideoSrc = useMemo(() => {
    const videos = resolvePetVideoAssets({ species, breed, lifeStage: "幼崽" })
    return videos.byAction.happy ?? videos.base
  }, [species, breed])

  const handleSelectSpecies = (nextSpecies: PetSpecies) => {
    setSpecies(nextSpecies)
    const nextBreeds = enabledSpecies.find((item) => item.id === nextSpecies)?.breeds ?? []
    setBreed(nextBreeds[0] ?? "")
  }

  const submitSetup = async () => {
    try {
      setIsSubmitting(true)
      setError(null)

      const endpoint = isReadopt ? "/api/pets/readopt" : "/api/pets/setup"
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          petName,
          species,
          breed,
        }),
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? (isReadopt ? "重新领养失败，请重试" : "宠物创建失败，请重试"))
      }
      router.push("/pets")
      router.refresh()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : isReadopt
            ? "重新领养失败，请重试"
            : "宠物创建失败，请重试",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PlayerPageShell bottomPad="none" withGutter className="bg-background py-6">
      <div className="rounded-3xl border border-border/40 bg-card p-5 shadow-sm">
        <p className="text-xs text-muted-foreground">
          {isReadopt ? "上一只伙伴已离世，欢迎重新领养" : "第 2 步 / 共 2 步 · 选择你的冒险伙伴"}
        </p>
        <h1 className="mt-1 text-xl font-bold">{isReadopt ? "重新领养宠物" : "创建你的宠物"}</h1>

        <div className="mt-4 space-y-4">
          <div>
            <p className="mb-2 text-xs text-muted-foreground">宠物名字</p>
            <input
              value={petName}
              onChange={(event) => setPetName(event.target.value.slice(0, 12))}
              className="w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="给宠物起个名字"
            />
          </div>

          <div>
            <p className="mb-2 text-xs text-muted-foreground">大类</p>
            {isLoadingTypes ? (
              <p className="text-xs text-muted-foreground">加载可选宠物中...</p>
            ) : speciesList.length === 0 ? (
              <p className="text-xs text-rose-600">暂无可选宠物，请联系管理员。</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {speciesList.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectSpecies(item.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs ${
                      species === item.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border/60"
                    }`}
                  >
                    {item.emoji} {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs text-muted-foreground">子品种</p>
            <div className="flex flex-wrap gap-2">
              {currentBreeds.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setBreed(item)}
                  className={`rounded-full border px-3 py-1.5 text-xs ${
                    breed === item ? "bg-emerald-500 text-white border-emerald-500" : "bg-background border-border/60"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border/40 bg-gradient-to-b from-amber-50/50 to-orange-50/30 px-3 pt-2.5 pb-3">
            <p className="text-center text-xs leading-tight text-muted-foreground">
              幼崽预览 · {PET_SPECIES_LABEL[species]} · {breed}
            </p>
            <div
              key={`${species}-${breed}-${cubHappyVideoSrc ?? cubAvatarSrc ?? "emoji"}`}
              className="relative mx-auto mt-1 w-full max-w-[280px] aspect-square animate-in fade-in duration-300"
            >
              {cubHappyVideoSrc ? (
                <video
                  src={cubHappyVideoSrc}
                  className="absolute inset-0 h-full w-full object-contain object-top drop-shadow-md"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-label={`${petName || "宠物"}幼崽开心`}
                />
              ) : cubAvatarSrc ? (
                <Image
                  src={cubAvatarSrc}
                  alt={`${petName || "宠物"}幼崽`}
                  fill
                  priority
                  sizes="280px"
                  className="object-contain object-top drop-shadow-sm"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-8xl leading-none">
                  {resolvePetEmoji(species)}
                </div>
              )}
            </div>
          </div>
        </div>

        {error && <p className="mt-3 text-xs text-rose-600">{error}</p>}

        <button
          type="button"
          className="mt-5 w-full rounded-xl bg-gradient-to-r from-primary to-emerald-500 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          onClick={submitSetup}
          disabled={isSubmitting || isLoadingTypes || speciesList.length === 0 || !breed}
        >
          {isSubmitting ? "保存中..." : isReadopt ? "重新领养宠物" : "开始冒险"}
        </button>
      </div>
    </PlayerPageShell>
  )
}
