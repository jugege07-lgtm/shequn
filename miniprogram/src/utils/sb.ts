// 真实状态栏高度（运行时获取）。
// 为什么不能用 CSS：uni-app 编译期注入的 --status-bar-height 固定 25px（刘海屏错误）；
// env(safe-area-inset-top) 在小程序非 fixed 元素里恒为 0。必须 JS 运行时取。
let cached = -1

export function getSbh(): number {
  if (cached < 0) {
    try {
      // 优先新 API getWindowInfo（基础库 2.20+），回退 getSystemInfoSync
      const wi: any = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : null
      const si: any = uni.getSystemInfoSync()
      cached = Number((wi && wi.statusBarHeight) ?? (si && si.statusBarHeight) ?? 0) || 0
    } catch {
      cached = 0
    }
  }
  return cached
}

// 所有页面根元素绑定 :style="sbStyle"（模板闭包引用，不走全局 mixin ctx 解析，真机可靠）：
// - paddingTop 把整页内容下推到状态栏之下（navigationStyle: custom 页面默认顶到屏幕最上方）
// - 注入 --sbh CSS 变量，供页内 sticky/fixed 头部使用 top/padding: var(--sbh, 0px)
export const sbStyle: Record<string, string> = {
  get paddingTop() {
    return `${getSbh()}px`
  },
  get '--sbh'() {
    return `${getSbh()}px`
  },
}
