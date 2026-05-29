"use client"

import { Suspense, useRef, useState, useEffect } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { 
  Float, 
  Sparkles, 
  Cloud,
  Html,
  RoundedBox,
  Sphere,
  AdaptiveDpr,
} from "@react-three/drei"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js"
import type { PetModelTransform } from "@/lib/pets/model-manifest"
import type { PetSceneAction } from "@/lib/pets/model-manifest"

interface Pet3DSceneProps {
  mood: "happy" | "excited" | "sleepy" | "hungry"
  rarity: "common" | "rare" | "epic" | "legendary"
  isTapped: boolean
  showLove: boolean
  petType?: "corgi" | "cat" | "rabbit" | "hamster" | "shiba" | "bird" | "pig"
  lifeStage?: "幼崽" | "成年" | "壮年"
  colorVariant?: "cream" | "brown" | "white" | "gray" | "black" | "gold"
  modelCandidates?: string[]
  modelTransform?: PetModelTransform
  modelAnimationMap?: Partial<Record<PetSceneAction, string>>
  interaction?: "idle" | "tap" | "feed" | "play" | "sleep" | "train" | "levelUp"
  interactionTick?: number
  unlockHint?: string | null
}

interface LoadedPetModelProps extends Pet3DSceneProps {
  modelCandidates: string[]
  onLoadStateChange?: (state: "loading" | "ready" | "failed") => void
}

function pickIdleClip(animations: THREE.AnimationClip[]) {
  if (!animations.length) return null
  const idle = animations.find((clip) => clip.name.toLowerCase().includes("idle"))
  return idle ?? animations[0]
}

function findClipByName(animations: THREE.AnimationClip[], targetName?: string) {
  if (!targetName) return null
  const exact = animations.find((clip) => clip.name === targetName)
  if (exact) return exact
  const normalized = targetName.toLowerCase()
  const caseInsensitive = animations.find((clip) => clip.name.toLowerCase() === normalized)
  if (caseInsensitive) return caseInsensitive
  return animations.find((clip) => clip.name.toLowerCase().includes(normalized)) ?? null
}

function resolveActionClip(
  animations: THREE.AnimationClip[],
  action: PetSceneAction,
  animationMap?: Partial<Record<PetSceneAction, string>>,
) {
  const mapped = findClipByName(animations, animationMap?.[action])
  if (mapped) return mapped
  if (action === "idle") return pickIdleClip(animations)

  const keywordMap: Record<PetSceneAction, string[]> = {
    idle: ["idle", "stand", "breath"],
    tap: ["tap", "hit", "touch"],
    feed: ["eat", "feed", "drink"],
    play: ["play", "jump", "happy"],
    sleep: ["sleep", "rest", "sit"],
    train: ["run", "attack", "skill", "train"],
    levelUp: ["celebrate", "level", "win", "victory"],
  }
  const keywords = keywordMap[action]
  for (const keyword of keywords) {
    const clip = animations.find((item) => item.name.toLowerCase().includes(keyword))
    if (clip) return clip
  }
  return null
}

function LoadedPetModel({
  mood,
  interaction = "idle",
  interactionTick = 0,
  modelCandidates,
  modelTransform,
  modelAnimationMap,
  onLoadStateChange,
}: LoadedPetModelProps) {
  const groupRef = useRef<THREE.Group>(null)
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const clipsRef = useRef<THREE.AnimationClip[]>([])
  const currentActionRef = useRef<THREE.AnimationAction | null>(null)
  const [modelRoot, setModelRoot] = useState<THREE.Object3D | null>(null)
  const [activeInteraction, setActiveInteraction] = useState<Pet3DSceneProps["interaction"]>("idle")
  const [interactionExpiresAt, setInteractionExpiresAt] = useState(0)

  const playActionClip = (actionName: PetSceneAction) => {
    const mixer = mixerRef.current
    if (!mixer || !clipsRef.current.length) return false
    const clip = resolveActionClip(clipsRef.current, actionName, modelAnimationMap)
    if (!clip) return false

    const nextAction = mixer.clipAction(clip)
    const isLoop = actionName === "idle" || actionName === "sleep"
    nextAction.reset()
    nextAction.enabled = true
    nextAction.setLoop(isLoop ? THREE.LoopRepeat : THREE.LoopOnce, isLoop ? Infinity : 1)
    nextAction.clampWhenFinished = !isLoop
    nextAction.fadeIn(0.14)
    currentActionRef.current?.fadeOut(0.12)
    nextAction.play()
    currentActionRef.current = nextAction
    return true
  }

  useEffect(() => {
    const candidates = modelCandidates.filter(Boolean)
    if (!candidates.length) {
      onLoadStateChange?.("failed")
      return
    }

    let cancelled = false
    const loader = new GLTFLoader()
    onLoadStateChange?.("loading")

    const tryLoad = (index: number) => {
      if (cancelled) return
      if (index >= candidates.length) {
        setModelRoot(null)
        mixerRef.current?.stopAllAction()
        mixerRef.current = null
        onLoadStateChange?.("failed")
        return
      }
      loader.load(
        candidates[index],
        (gltf) => {
          if (cancelled) return
          const cloned = clone(gltf.scene)
          cloned.traverse((node: THREE.Object3D) => {
            const mesh = node as THREE.Mesh
            if (!mesh.isMesh) return
            mesh.castShadow = false
            mesh.receiveShadow = false
          })
          setModelRoot(cloned)
          clipsRef.current = gltf.animations
          if (gltf.animations.length > 0) {
            const mixer = new THREE.AnimationMixer(cloned)
            mixerRef.current = mixer
            const started = playActionClip("idle")
            if (!started) {
              const idleClip = pickIdleClip(gltf.animations)
              if (idleClip) {
                const action = mixer.clipAction(idleClip)
                action.play()
                currentActionRef.current = action
              }
            }
          } else {
            mixerRef.current = null
            clipsRef.current = []
          }
          onLoadStateChange?.("ready")
        },
        undefined,
        () => {
          console.warn("[Pet3DScene] model candidate load failed:", candidates[index])
          tryLoad(index + 1)
        },
      )
    }

    tryLoad(0)

    return () => {
      cancelled = true
      currentActionRef.current = null
      clipsRef.current = []
      mixerRef.current?.stopAllAction()
      mixerRef.current = null
      setModelRoot(null)
    }
  }, [modelCandidates, onLoadStateChange])

  useEffect(() => {
    if (interactionTick <= 0 || !interaction || interaction === "idle") return
    const now = Date.now()
    setActiveInteraction(interaction)
    setInteractionExpiresAt(now + (interaction === "levelUp" ? 2200 : 900))
    playActionClip(interaction)
  }, [interactionTick, interaction])

  useEffect(() => {
    if (!modelRoot) return
    playActionClip("idle")
  }, [modelAnimationMap, modelRoot])

  useFrame((state, delta) => {
    if (!groupRef.current) return

    const time = state.clock.getElapsedTime()
    mixerRef.current?.update(delta)

    const breatheScale = mood === "sleepy" ? 1 + Math.sin(time * 1.1) * 0.008 : 1 + Math.sin(time * 1.8) * 0.012
    const baseScale = modelTransform?.scale ?? 0.9
    const [baseX, baseY, baseZ] = modelTransform?.position ?? [0, -0.55, 0]
    const [baseRotX, baseRotY, baseRotZ] = modelTransform?.rotation ?? [0, 0, 0]

    groupRef.current.scale.set(baseScale * breatheScale, baseScale * breatheScale, baseScale * breatheScale)
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, baseX, 0.1)
    groupRef.current.position.y = baseY + Math.sin(time * 1.8) * 0.03
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, baseZ, 0.1)
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, baseRotX, 0.12)
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, baseRotY, 0.12)
    groupRef.current.rotation.z = baseRotZ + Math.sin(time * 1.2) * 0.02

    const now = Date.now()
    if (interactionExpiresAt && now > interactionExpiresAt && activeInteraction !== "idle") {
      setActiveInteraction("idle")
      playActionClip("idle")
    }

    if (activeInteraction === "tap" || activeInteraction === "play" || activeInteraction === "train") {
      groupRef.current.position.y += Math.max(0, Math.sin(time * 13)) * 0.16
    }
    if (activeInteraction === "feed") {
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, 1.1, 0.08)
    } else {
      const baseX = modelTransform?.position?.[0] ?? 0
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, baseX, 0.1)
    }
  })

  if (!modelRoot) return null

  return (
    <group ref={groupRef} position={modelTransform?.position ?? [0, -0.55, 0]}>
      <primitive object={modelRoot} />
    </group>
  )
}

// Cute household pet component - corgi style
function CutePet({ 
  mood, 
  rarity, 
  isTapped, 
  showLove,
  petType = "corgi",
  lifeStage = "幼崽",
  colorVariant = "cream",
  interaction = "idle",
  interactionTick = 0,
  unlockHint = null,
}: Pet3DSceneProps) {
  const groupRef = useRef<THREE.Group>(null)
  const bodyRef = useRef<THREE.Group>(null)
  const tailRef = useRef<THREE.Mesh>(null)
  const [blinkState, setBlinkState] = useState(false)
  const [activeInteraction, setActiveInteraction] = useState<Pet3DSceneProps["interaction"]>("idle")
  const [interactionExpiresAt, setInteractionExpiresAt] = useState(0)
  const [interactionText, setInteractionText] = useState<string | null>(null)
  const [feedTargetX, setFeedTargetX] = useState(0)
  
  // Pet colors based on type
  const petColors = {
    corgi: { body: "#f5a623", belly: "#fff8e7", nose: "#2d2d2d" },
    cat: { body: "#8b8b8b", belly: "#f5f5f5", nose: "#ffb6c1" },
    rabbit: { body: "#ffffff", belly: "#fff5f5", nose: "#ffb6c1" },
    hamster: { body: "#d4a76a", belly: "#fff8e7", nose: "#2d2d2d" },
    shiba: { body: "#e8a857", belly: "#fff8e7", nose: "#2d2d2d" },
    bird: { body: "#f3cf73", belly: "#fff4c2", nose: "#2d2d2d" },
    pig: { body: "#f2b3c6", belly: "#ffd7e3", nose: "#2d2d2d" },
  }
  const paletteByColor = {
    cream: "#f4d8b0",
    brown: "#b97a57",
    white: "#f4f4f5",
    gray: "#a1a1aa",
    black: "#52525b",
    gold: "#eab308",
  } as const
  const colors = {
    ...petColors[petType],
    body: paletteByColor[colorVariant] ?? petColors[petType].body,
  }
  const stageScale = lifeStage === "幼崽" ? 0.92 : lifeStage === "成年" ? 1 : 1.08

  useEffect(() => {
    if (interactionTick <= 0 || !interaction || interaction === "idle") return
    const now = Date.now()
    setActiveInteraction(interaction)
    setInteractionExpiresAt(now + (interaction === "levelUp" ? 2200 : 900))
    if (interaction === "feed") {
      setInteractionText("吃到好吃的啦！")
      setFeedTargetX(1.15)
    } else if (interaction === "levelUp") {
      setInteractionText(unlockHint ?? "升级成功，动作表现增强！")
      setFeedTargetX(0)
    } else if (interaction === "tap") {
      setInteractionText("嘿嘿，摸摸好开心！")
      setFeedTargetX(0)
    } else if (interaction === "train") {
      setInteractionText("训练完成，变强了！")
      setFeedTargetX(0)
    } else if (interaction === "play") {
      setInteractionText("再来一起玩！")
      setFeedTargetX(0)
    } else if (interaction === "sleep") {
      setInteractionText("恢复精力中...")
      setFeedTargetX(0)
    }
  }, [interactionTick, interaction, unlockHint])
  
  // Breathing and idle animation
  useFrame((state) => {
    if (!groupRef.current || !bodyRef.current) return
    
    const time = state.clock.getElapsedTime()
    const now = Date.now()
    if (interactionExpiresAt && now > interactionExpiresAt && activeInteraction !== "idle") {
      setActiveInteraction("idle")
      setInteractionText(null)
      setFeedTargetX(0)
    }
    
    // Breathing animation
    const breatheScale = mood === "sleepy" 
      ? 1 + Math.sin(time * 1.2) * 0.015
      : 1 + Math.sin(time * 2) * 0.025
    bodyRef.current.scale.set(breatheScale, breatheScale, breatheScale)
    
    // Gentle bobbing
    const bobSpeed = mood === "excited" ? 4 : mood === "sleepy" ? 0.8 : 2
    const bobAmount = mood === "excited" ? 0.08 : mood === "sleepy" ? 0.02 : 0.04
    groupRef.current.position.y = -0.5 + Math.sin(time * bobSpeed) * bobAmount
    
    // Tail wagging
    if (tailRef.current && mood !== "sleepy") {
      const wagSpeed = mood === "excited" ? 8 : mood === "happy" ? 4 : 2
      tailRef.current.rotation.z = Math.sin(time * wagSpeed) * 0.4
    }
    
    // Subtle head tilt
    if (mood === "happy" || mood === "excited") {
      groupRef.current.rotation.z = Math.sin(time * 1.5) * 0.05
    }
    
    // Tap reaction - cute squish
    if (isTapped) {
      groupRef.current.scale.set(1.1, 0.85, 1.1)
    } else {
      groupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.15)
    }

    if (activeInteraction === "tap" || activeInteraction === "play" || activeInteraction === "train") {
      const jump = Math.max(0, Math.sin(time * 14)) * 0.18
      groupRef.current.position.y += jump
    }

    if (activeInteraction === "feed") {
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, feedTargetX, 0.08)
    } else {
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, 0, 0.08)
    }
  })
  
  // Blinking animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinkState(true)
      setTimeout(() => setBlinkState(false), 100)
    }, mood === "sleepy" ? 1500 : 3500)
    
    return () => clearInterval(blinkInterval)
  }, [mood])
  
  // Rarity glow color
  const rarityGlow = {
    common: "#94a3b8",
    rare: "#60a5fa",
    epic: "#c084fc",
    legendary: "#fbbf24"
  }
  
  return (
    <group ref={groupRef} position={[0, -0.5, 0]} scale={[stageScale, stageScale, stageScale]}>
      <group ref={bodyRef}>
        {/* Main body - rounded and fluffy */}
        <RoundedBox args={[1.2, 0.9, 1]} radius={0.35} smoothness={4} castShadow>
          <meshStandardMaterial color={colors.body} roughness={0.8} />
        </RoundedBox>
        
        {/* Belly */}
        <mesh position={[0, -0.1, 0.35]}>
          <sphereGeometry args={[0.4, 32, 32]} />
          <meshStandardMaterial color={colors.belly} roughness={0.9} />
        </mesh>
        
        {/* Head */}
        <group position={[0, 0.5, 0.3]}>
          <Sphere args={[0.5, 32, 32]} castShadow>
            <meshStandardMaterial color={colors.body} roughness={0.8} />
          </Sphere>
          
          {/* Face - lighter area */}
          <mesh position={[0, -0.1, 0.35]}>
            <sphereGeometry args={[0.3, 32, 32]} />
            <meshStandardMaterial color={colors.belly} roughness={0.9} />
          </mesh>
          
          {/* Eyes */}
          <group position={[0, 0.05, 0.4]}>
            {/* Left eye */}
            <mesh position={[-0.15, 0, 0]}>
              <sphereGeometry args={[0.1, 16, 16]} />
              <meshStandardMaterial color="#1a1a1a" />
            </mesh>
            <mesh position={[-0.15, 0.02, 0.05]} scale={blinkState || mood === "sleepy" ? [1, 0.1, 1] : 1}>
              <sphereGeometry args={[0.06, 16, 16]} />
              <meshStandardMaterial color="white" />
            </mesh>
            {!blinkState && mood !== "sleepy" && (
              <mesh position={[-0.13, 0.04, 0.08]}>
                <sphereGeometry args={[0.02, 8, 8]} />
                <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
              </mesh>
            )}
            
            {/* Right eye */}
            <mesh position={[0.15, 0, 0]}>
              <sphereGeometry args={[0.1, 16, 16]} />
              <meshStandardMaterial color="#1a1a1a" />
            </mesh>
            <mesh position={[0.15, 0.02, 0.05]} scale={blinkState || mood === "sleepy" ? [1, 0.1, 1] : 1}>
              <sphereGeometry args={[0.06, 16, 16]} />
              <meshStandardMaterial color="white" />
            </mesh>
            {!blinkState && mood !== "sleepy" && (
              <mesh position={[0.17, 0.04, 0.08]}>
                <sphereGeometry args={[0.02, 8, 8]} />
                <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
              </mesh>
            )}
          </group>
          
          {/* Nose */}
          <mesh position={[0, -0.12, 0.48]}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial color={colors.nose} roughness={0.3} />
          </mesh>
          
          {/* Happy cheeks */}
          {(mood === "happy" || mood === "excited") && (
            <>
              <mesh position={[-0.28, -0.05, 0.3]}>
                <sphereGeometry args={[0.08, 16, 16]} />
                <meshStandardMaterial color="#ffb6c1" transparent opacity={0.5} />
              </mesh>
              <mesh position={[0.28, -0.05, 0.3]}>
                <sphereGeometry args={[0.08, 16, 16]} />
                <meshStandardMaterial color="#ffb6c1" transparent opacity={0.5} />
              </mesh>
            </>
          )}
          
          {/* Mouth */}
          {mood === "happy" || mood === "excited" ? (
            <mesh position={[0, -0.2, 0.42]} rotation={[0.2, 0, 0]}>
              <torusGeometry args={[0.06, 0.015, 8, 16, Math.PI]} />
              <meshStandardMaterial color="#1a1a1a" />
            </mesh>
          ) : null}
          
          {/* Ears */}
          <mesh position={[-0.35, 0.35, 0]} rotation={[0, 0, -0.5]}>
            <coneGeometry args={[0.15, 0.3, 8]} />
            <meshStandardMaterial color={colors.body} roughness={0.8} />
          </mesh>
          <mesh position={[0.35, 0.35, 0]} rotation={[0, 0, 0.5]}>
            <coneGeometry args={[0.15, 0.3, 8]} />
            <meshStandardMaterial color={colors.body} roughness={0.8} />
          </mesh>
          {/* Inner ears */}
          <mesh position={[-0.32, 0.32, 0.02]} rotation={[0, 0, -0.5]}>
            <coneGeometry args={[0.08, 0.2, 8]} />
            <meshStandardMaterial color="#ffb6c1" roughness={0.8} />
          </mesh>
          <mesh position={[0.32, 0.32, 0.02]} rotation={[0, 0, 0.5]}>
            <coneGeometry args={[0.08, 0.2, 8]} />
            <meshStandardMaterial color="#ffb6c1" roughness={0.8} />
          </mesh>
        </group>
        
        {/* Legs */}
        {[[-0.35, -0.5, 0.25], [0.35, -0.5, 0.25], [-0.35, -0.5, -0.25], [0.35, -0.5, -0.25]].map((pos, i) => (
          <mesh key={i} position={pos as [number, number, number]}>
            <capsuleGeometry args={[0.12, 0.2, 8, 16]} />
            <meshStandardMaterial color={colors.body} roughness={0.8} />
          </mesh>
        ))}
        
        {/* Tail */}
        <mesh ref={tailRef} position={[0, 0, -0.6]} rotation={[0.5, 0, 0]}>
          <capsuleGeometry args={[0.1, 0.25, 8, 16]} />
          <meshStandardMaterial color={colors.body} roughness={0.8} />
        </mesh>
        
        {/* Magical accessory - glowing collar based on rarity */}
        <mesh position={[0, 0.2, 0.2]}>
          <torusGeometry args={[0.35, 0.03, 8, 32]} />
          <meshStandardMaterial 
            color={rarityGlow[rarity]} 
            emissive={rarityGlow[rarity]}
            emissiveIntensity={rarity === "legendary" ? 0.8 : 0.4}
          />
        </mesh>
        
        {/* Legendary sparkle effect */}
        {rarity === "legendary" && (
          <Float speed={3} rotationIntensity={0} floatIntensity={0.5}>
            <mesh position={[0, 1.2, 0]}>
              <octahedronGeometry args={[0.1, 0]} />
              <meshStandardMaterial 
                color="#fbbf24" 
                emissive="#fbbf24"
                emissiveIntensity={1}
              />
            </mesh>
          </Float>
        )}
      </group>
      
      {/* Love reaction */}
      {showLove && (
        <Html center position={[0, 1.5, 0]}>
          <div className="flex gap-1 animate-bounce">
            <span className="text-2xl">💕</span>
          </div>
        </Html>
      )}
      
      {/* Mood indicators */}
      {mood === "sleepy" && (
        <Html center position={[0.6, 1, 0]}>
          <div className="text-xl animate-pulse opacity-80">💤</div>
        </Html>
      )}
      {mood === "hungry" && (
        <Html center position={[0.5, 0.8, 0]}>
          <div className="text-lg animate-bounce">🍖</div>
        </Html>
      )}
      {mood === "excited" && (
        <Sparkles count={20} scale={2} size={3} speed={3} color="#fbbf24" />
      )}

      {activeInteraction === "levelUp" && (
        <>
          <Sparkles count={28} scale={2.8} size={4} speed={4.5} color="#fde047" />
          <pointLight position={[0, 1.5, 1.2]} intensity={1.2} color="#fef08a" />
        </>
      )}

      {interactionText && (
        <Html center position={[0, 2.05, 0]}>
          <div className="rounded-xl bg-white/90 px-3 py-1 text-[11px] font-semibold text-amber-700 shadow-md">
            {interactionText}
          </div>
        </Html>
      )}
    </group>
  )
}

// Cozy room environment
function CozyRoomEnvironment({ rarity }: { rarity: string }) {
  return (
    <>
      {/* Soft ambient particles */}
      <Sparkles 
        count={30} 
        scale={6} 
        size={1.5} 
        speed={0.3} 
        color="#fef3c7" 
        opacity={0.4}
      />
      
      {/* Fluffy clouds in background */}
      <Cloud position={[-3, 2, -4]} speed={0.1} opacity={0.15} />
      <Cloud position={[3, 1.5, -3]} speed={0.15} opacity={0.1} />
      
      {/* Soft circular platform/bed */}
      <mesh position={[0, -1.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.8, 64]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.9} />
      </mesh>
      
      {/* Platform cushion edge */}
      <mesh position={[0, -1.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.7, 0.15, 16, 64]} />
        <meshStandardMaterial color="#fed7aa" roughness={0.8} />
      </mesh>
      
      {/* Toy ball */}
      <Float speed={1} rotationIntensity={0.5} floatIntensity={0.2}>
        <mesh position={[-1.2, -0.8, 0.8]} castShadow>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial color="#f472b6" roughness={0.3} />
        </mesh>
      </Float>
      
      {/* Food bowl */}
      <group position={[1.3, -0.95, 0.5]}>
        <mesh>
          <cylinderGeometry args={[0.2, 0.15, 0.1, 16]} />
          <meshStandardMaterial color="#fda4af" roughness={0.4} />
        </mesh>
      </group>
      
      {/* Small decorative plant */}
      <group position={[-1.5, -0.7, -0.8]}>
        <mesh>
          <cylinderGeometry args={[0.12, 0.1, 0.2, 16]} />
          <meshStandardMaterial color="#d4a76a" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial color="#86efac" roughness={0.8} />
        </mesh>
      </group>
      
      {/* Magical glow based on rarity */}
      {(rarity === "epic" || rarity === "legendary") && (
        <pointLight 
          position={[0, 0, 2]} 
          intensity={0.3} 
          color={rarity === "legendary" ? "#fbbf24" : "#c084fc"} 
        />
      )}
    </>
  )
}

// Loading fallback
function LoadingFallback() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-amber-600">正在召唤伙伴...</span>
      </div>
    </Html>
  )
}

export function Pet3DScene({ 
  mood = "happy", 
  rarity = "epic",
  isTapped = false,
  showLove = false,
  petType = "corgi",
  lifeStage = "幼崽",
  colorVariant = "cream",
  modelCandidates = [],
  modelTransform,
  modelAnimationMap,
  interaction = "idle",
  interactionTick = 0,
  unlockHint = null,
}: Pet3DSceneProps) {
  const [modelLoadState, setModelLoadState] = useState<"loading" | "ready" | "failed">(
    modelCandidates.length ? "loading" : "failed",
  )

  useEffect(() => {
    setModelLoadState(modelCandidates.length ? "loading" : "failed")
  }, [modelCandidates])

  const hasRealModelTrack = modelCandidates.length > 0
  const shouldRenderFallback = !hasRealModelTrack || modelLoadState !== "ready"

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden">
      {/* Warm gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-50 via-orange-50/80 to-rose-50/60 z-0" />
      
      {/* Soft radial light effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(254,243,199,0.6)_0%,transparent_70%)] z-0" />
      
      <Canvas
        shadows={false}
        camera={{ position: [0, 0.8, 4.5], fov: 40 }}
        dpr={[1, 1.25]}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        className="z-10"
      >
        <Suspense fallback={<LoadingFallback />}>
          <AdaptiveDpr pixelated />
          {/* Warm lighting */}
          <ambientLight intensity={0.7} color="#fff7ed" />
          <hemisphereLight
            args={["#fff7ed", "#fed7aa", 0.35]}
            position={[0, 2, 0]}
          />
          <directionalLight 
            position={[3, 5, 3]} 
            intensity={0.8} 
            castShadow
            shadow-mapSize={[1024, 1024]}
            color="#fef3c7"
          />
          <pointLight position={[-2, 2, 2]} intensity={0.4} color="#fecaca" />
          <pointLight position={[2, 1, 3]} intensity={0.3} color="#fef3c7" />
          
          {/* HDR-free fallback: keep warm look with stable lights only */}
          <CozyRoomEnvironment rarity={rarity} />
          
          {/* Pet */}
          {hasRealModelTrack && (
            <LoadedPetModel
              mood={mood}
              rarity={rarity}
              isTapped={isTapped}
              showLove={showLove}
              petType={petType}
              lifeStage={lifeStage}
              colorVariant={colorVariant}
              modelCandidates={modelCandidates}
              modelTransform={modelTransform}
              modelAnimationMap={modelAnimationMap}
              interaction={interaction}
              interactionTick={interactionTick}
              unlockHint={unlockHint}
              onLoadStateChange={setModelLoadState}
            />
          )}
          {shouldRenderFallback && (
            <CutePet 
              mood={mood} 
              rarity={rarity} 
              isTapped={isTapped} 
              showLove={showLove}
              petType={petType}
              lifeStage={lifeStage}
              colorVariant={colorVariant}
              interaction={interaction}
              interactionTick={interactionTick}
              unlockHint={unlockHint}
            />
          )}
        </Suspense>
      </Canvas>
      
      {/* Soft vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(254,215,170,0.2)_100%)] z-20" />

      {hasRealModelTrack && modelLoadState === "loading" && (
        <div className="pointer-events-none absolute right-3 top-3 z-30 rounded-full bg-white/80 px-2 py-1 text-[10px] font-medium text-amber-700 shadow-sm">
          模型加载中...
        </div>
      )}
      {hasRealModelTrack && modelLoadState === "failed" && (
        <>
          <div className="pointer-events-none absolute right-3 top-3 z-30 rounded-full bg-amber-100/90 px-2 py-1 text-[10px] font-medium text-amber-700 shadow-sm">
            已切换兜底模型
          </div>
          <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-30 rounded-xl bg-black/45 px-3 py-2 text-[10px] text-white backdrop-blur-sm">
            <p className="font-semibold text-amber-200">模型健康提示：真实模型加载失败</p>
            <p className="mt-1 truncate">尝试路径1：{modelCandidates[0] ?? "-"}</p>
            <p className="truncate">尝试路径2：{modelCandidates[1] ?? "-"}</p>
          </div>
        </>
      )}
    </div>
  )
}
