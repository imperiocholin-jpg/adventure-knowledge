/** 小尺寸展示用缩略图（由 scripts/generate-pet-thumbs.mjs 生成） */
export function resolvePetThumbSrc(src: string | null | undefined) {
  if (!src || !src.startsWith("/image/pets/")) return src ?? null
  if (src.includes("-thumb.webp")) return src
  return src.replace(/\.(png|jpe?g|webp)$/i, "-thumb.webp")
}
