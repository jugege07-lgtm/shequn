// 简易本地缓存工具（小程序版：uni 存储，键遍历用 getStorageInfoSync）
const CACHE_PREFIX = 'app_cache_'

function storageKeys(): string[] {
  try {
    return uni.getStorageInfoSync().keys || []
  } catch {
    return []
  }
}

export function getCache(key: string): any {
  try {
    const item = uni.getStorageSync(CACHE_PREFIX + key)
    if (!item) return null
    const { data, expiry } = JSON.parse(item)
    if (expiry && Date.now() > expiry) {
      uni.removeStorageSync(CACHE_PREFIX + key)
      return null
    }
    return data
  } catch {
    return null
  }
}

export function setCache(key: string, data: any, ttlMs = 5 * 60 * 1000) {
  try {
    uni.setStorageSync(CACHE_PREFIX + key, JSON.stringify({
      data,
      expiry: Date.now() + ttlMs,
    }))
  } catch { /* ignore */ }
}

export function clearCache(key?: string) {
  try {
    if (key) {
      uni.removeStorageSync(CACHE_PREFIX + key)
    } else {
      storageKeys()
        .filter((k) => k.startsWith(CACHE_PREFIX))
        .forEach((k) => uni.removeStorageSync(k))
    }
  } catch { /* ignore */ }
}
