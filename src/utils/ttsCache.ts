const CACHE_NAME = 'noor-tts-v1'

function cacheKey(text: string): string {
  return `https://noor-tts/${encodeURIComponent(text)}`
}

export async function getCachedAudio(text: string): Promise<ArrayBuffer | null> {
  if (!('caches' in window)) return null
  try {
    const cache = await caches.open(CACHE_NAME)
    const match = await cache.match(cacheKey(text))
    if (!match) return null
    return match.arrayBuffer()
  } catch {
    return null
  }
}

export async function setCachedAudio(text: string, buffer: ArrayBuffer): Promise<void> {
  if (!('caches' in window)) return
  try {
    const cache = await caches.open(CACHE_NAME)
    await cache.put(
      cacheKey(text),
      new Response(buffer, { headers: { 'Content-Type': 'audio/mpeg' } })
    )
  } catch {
    // silently fail (e.g. private browsing mode)
  }
}
