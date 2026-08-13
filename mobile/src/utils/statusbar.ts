import { Capacitor } from '@capacitor/core'
import { SystemBars, SystemBarsStyle } from '@capacitor/core'

// 状态栏图标明暗切换工具。
// 原生层已把状态栏设为透明（edge-to-edge），状态栏背景由 H5 页面顶部背景铺满。
// 因此状态栏图标颜色必须与"页面顶部背景"匹配：
//   - 深色/彩色背景（登录/注册/忘记密码紫渐变、首页 banner 深紫）→ 用浅色图标 DARK
//   - 白色/浅色背景（绝大多数带白色 header 的页面）→ 用深色图标 LIGHT
// 仅在 Capacitor 原生运行时生效；浏览器预览时静默跳过。

let cachedStyle: SystemBarsStyle | null = null

export type StatusBarStyle = 'dark' | 'light'

const STYLE_MAP: Record<StatusBarStyle, SystemBarsStyle> = {
  dark: SystemBarsStyle.Dark,
  light: SystemBarsStyle.Light,
}

/**
 * 设置状态栏图标明暗。
 * @param style 'dark' = 深背景浅图标（如紫渐变登录页）；'light' = 浅背景深图标（白头页面）
 */
export function setStatusBarStyle(style: StatusBarStyle): void {
  if (!Capacitor.isNativePlatform()) return
  const target = STYLE_MAP[style]
  // 避免重复调用触发无谓的原生交互
  if (cachedStyle === target) return
  cachedStyle = target
  try {
    SystemBars.setStyle({ style: target }).catch(() => {
      /* 浏览器/不支持时忽略 */
    })
  } catch {
    /* 忽略异常 */
  }
}