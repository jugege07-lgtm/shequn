/**
 * localStorage 兼容层（微信小程序）
 * 小程序模块作用域中裸标识符 localStorage 不可靠（undefined），
 * 因此各模块必须显式 `import { ls } from '@/shims/localStorage'` 使用，
 * 不依赖全局污染。
 */
export const ls = {
  getItem(key: string): string | null {
    try {
      const v = uni.getStorageSync(key)
      return v === '' || v === null || v === undefined ? null : String(v)
    } catch {
      return null
    }
  },
  setItem(key: string, value: string) {
    try {
      uni.setStorageSync(key, String(value))
    } catch {
      /* 存储满等异常静默 */
    }
  },
  removeItem(key: string) {
    try {
      uni.removeStorageSync(key)
    } catch {
      /* ignore */
    }
  },
  clear() {
    try {
      uni.clearStorageSync()
    } catch {
      /* ignore */
    }
  },
  key(index: number): string | null {
    try {
      return uni.getStorageInfoSync().keys[index] ?? null
    } catch {
      return null
    }
  },
  get length(): number {
    try {
      return uni.getStorageInfoSync().keys.length
    } catch {
      return 0
    }
  },
}

export default ls
