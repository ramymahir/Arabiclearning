const CACHE_NAME = 'noor-tts-v1'
let _cacheHandle: Cache | null = null

function cacheKey(text: string): string {
  return `https://noor-tts/${encodeURIComponent(text)}`
}

async function getCache(): Promise<Cache | null> {
  if (!('caches' in window)) return null
  if (_cacheHandle) return _cacheHandle
  try {
    _cacheHandle = await caches.open(CACHE_NAME)
    return _cacheHandle
  } catch {
    return null
  }
}

export async function getCachedAudio(text: string): Promise<ArrayBuffer | null> {
  const cache = await getCache()
  if (!cache) return null
  try {
    const match = await cache.match(cacheKey(text))
    if (!match) return null
    return match.arrayBuffer()
  } catch {
    return null
  }
}

export async function setCachedAudio(text: string, buffer: ArrayBuffer): Promise<void> {
  const cache = await getCache()
  if (!cache) return
  try {
    await cache.put(
      cacheKey(text),
      new Response(buffer, { headers: { 'Content-Type': 'audio/mpeg' } })
    )
  } catch {
    // silently fail (e.g. private browsing mode)
  }
}
