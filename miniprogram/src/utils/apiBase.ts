/**
 * API 基础地址工具（小程序版）
 * 小程序无同源代理（Caddy 只服务于 H5），必须直连后端绝对地址。
 * - 生产：https://www.jugekeji.com（与 H5 同域名，需加入小程序 request 合法域名）
 * - 本地开发：可在微信开发者工具勾选「不校验合法域名」后连 localhost
 */
export function getApiBase(): string {
  return (import.meta.env.VITE_API_BASE_URL as string) || 'https://www.jugekeji.com'
}

/** 小程序环境恒为 false（保留与移动端一致的调用签名） */
export function isNativeApp(): boolean {
  return false
}

/** 当前是否微信小程序环境 */
export function isMiniProgram(): boolean {
  return true
}
