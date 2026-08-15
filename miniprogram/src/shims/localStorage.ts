/**
 * localStorage 兼容层（微信小程序）
 * 移动端 store/utils 大量使用 localStorage API；
 * 小程序无 window/localStorage，这里用 uni 同步存储实现同构接口。
 * 必须在 main.ts 中作为首个 import 引入，早于任何 store 模块执行。
 */
const impl = {
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

const g = globalThis as any
if (!g.localStorage) {
  g.localStorage = impl
}

export default impl
