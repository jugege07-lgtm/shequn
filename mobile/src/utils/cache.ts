// 简易本地缓存工具
const CACHE_PREFIX = 'app_cache_'

export function getCache(key: string): any {
  try {
    const item = localStorage.getItem(CACHE_PREFIX + key)
    if (!item) return null
    const { data, expiry } = JSON.parse(item)
    if (expiry && Date.now() > expiry) {
      localStorage.removeItem(CACHE_PREFIX + key)
      return null
    }
    return data
  } catch {
    return null
  }
}

export function setCache(key: string, data: any, ttlMs = 5 * 60 * 1000) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
      data,
      expiry: Date.now() + ttlMs,
    }))
  } catch { /* ignore */ }
}

export function clearCache(key?: string) {
  if (key) {
    localStorage.removeItem(CACHE_PREFIX + key)
  } else {
    // 清除所有缓存
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX))
    keys.forEach(k => localStorage.removeItem(k))
  }
}