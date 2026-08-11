/**
 * API 基础地址工具
 * - H5 环境（部署在 /h5/ 子路径）：VITE_API_BASE_URL 为空，所有请求走相对路径 /api/...，由同源 Caddy 代理到后端
 * - 原生 App（Capacitor 打包）：VITE_API_BASE_URL 设为绝对地址（如 https://www.jugekeji.com），
 *   使 API 与图片地址在 file/capacitor 协议下也能正确访问后端
 */
export function getApiBase(): string {
  return (import.meta.env.VITE_API_BASE_URL as string) || ''
}

/** 判断是否在原生 App（Capacitor WebView）环境 */
export function isNativeApp(): boolean {
  return typeof window !== 'undefined' && !!(window as any)?.Capacitor?.isNativePlatform?.()
}