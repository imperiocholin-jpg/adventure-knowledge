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
} from "@react-three/drei"
import * as THREE from "three"

interface Pet3DSceneProps {
  mood: "happy" | "excited" | "sleepy" | "hungry"
  rarity: "common" | "rare" | "epic" | "legendary"
  isTapped: boolean
  showLove: boolean
  petType?: "corgi" | "cat" | "rabbit" | "hamster" | "shiba"
}

// Cute household pet component - corgi style
function CutePet({ 
  mood, 
  rarity, 
  isTapped, 
  showLove,
  petType = "corgi" 
}: Pet3DSceneProps) {
  const groupRef = useRef<THREE.Group>(null)
  const bodyRef = useRef<THREE.Group>(null)
  const tailRef = useRef<THREE.Mesh>(null)
  const [blinkState, setBlinkState] = useState(false)
  
  // Pet colors based on type
  const petColors = {
    corgi: { body: "#f5a623", belly: "#fff8e7", nose: "#2d2d2d" },
    cat: { body: "#8b8b8b", belly: "#f5f5f5", nose: "#ffb6c1" },
    rabbit: { body: "#ffffff", belly: "#fff5f5", nose: "#ffb6c1" },
    hamster: { body: "#d4a76a", belly: "#fff8e7", nose: "#2d2d2d" },
    shiba: { body: "#e8a857", belly: "#fff8e7", nose: "#2d2d2d" },
  }
  
  const colors = petColors[petType]
  
  // Breathing and idle animation
  useFrame((state) => {
    if (!groupRef.current || !bodyRef.current) return
    
    const time = state.clock.getElapsedTime()
    
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
    <group ref={groupRef} position={[0, -0.5, 0]}>
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
  petType = "corgi"
}: Pet3DSceneProps) {
  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden">
      {/* Warm gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-50 via-orange-50/80 to-rose-50/60 z-0" />
      
      {/* Soft radial light effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(254,243,199,0.6)_0%,transparent_70%)] z-0" />
      
      <Canvas
        shadows
        camera={{ position: [0, 0.8, 4.5], fov: 40 }}
        dpr={[1, 1.5]}
        className="z-10"
      >
        <Suspense fallback={<LoadingFallback />}>
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
          <CutePet 
            mood={mood} 
            rarity={rarity} 
            isTapped={isTapped} 
            showLove={showLove}
            petType={petType}
          />
        </Suspense>
      </Canvas>
      
      {/* Soft vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(254,215,170,0.2)_100%)] z-20" />
    </div>
  )
}
