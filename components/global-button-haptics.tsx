"use client"

import { useEffect, useRef } from "react"

const BUTTON_SELECTOR = [
  "button",
  "input[type='button']",
  "input[type='submit']",
  "[role='button']",
].join(",")

function triggerLightHaptic() {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(12)
    return
  }

  // WeChat WebView fallback when JS SDK is injected.
  const maybeWx = (globalThis as { wx?: { vibrateShort?: (params?: { type?: string }) => void } }).wx
  if (maybeWx?.vibrateShort) {
    try {
      maybeWx.vibrateShort({ type: "light" })
    } catch {
      // Ignore runtime/environment-specific failures.
    }
  }
}

export function GlobalButtonHaptics() {
  const lastTriggerAtRef = useRef(0)

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!event.isTrusted) return
      const target = event.target
      if (!(target instanceof Element)) return

      const clickable = target.closest(BUTTON_SELECTOR)
      if (!clickable) return
      if (clickable instanceof HTMLButtonElement && clickable.disabled) return
      if (clickable instanceof HTMLInputElement && clickable.disabled) return
      if (clickable.getAttribute("aria-disabled") === "true") return
      if (clickable.hasAttribute("data-no-haptic")) return

      const now = Date.now()
      if (now - lastTriggerAtRef.current < 80) return
      lastTriggerAtRef.current = now

      triggerLightHaptic()
    }

    document.addEventListener("click", onClick, true)
    return () => {
      document.removeEventListener("click", onClick, true)
    }
  }, [])

  return null
}

