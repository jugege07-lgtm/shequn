/**
 * 规范化图片 URL
 * - 空值直接返回空字符串
 * - 绝对地址指向本服务 /uploads/ 或 /api/uploads/ 时
 *   （如 http://localhost:3000/uploads/xxx、https://jugekeji.com/api/uploads/xxx），
 *   提取为同源相对路径 /api/uploads/xxx，避免跨域导致图片加载失败（CORS）或 Canvas 被污染无法导出
 * - 其他 http/https 全地址（外部 CDN 等）原样返回
 * - 后端上传接口返回的 /uploads/xxx 转换为 /api/uploads/xxx，以便在 dev server 代理到后端
 * - 原生 App（Capacitor）环境下，相对路径会补上绝对 API 来源，确保 file/capacitor 协议下也能加载
 */
import { getApiBase } from './apiBase'

export function normalizeImageUrl(url: string | undefined | null): string {
  if (!url) return ''
  const base = getApiBase()
  // 绝对地址且路径含 /uploads/（含 /api/uploads/）→ 转相对路径并补 /api 前缀，再按环境补绝对来源
  if (/^https?:\/\/[^/]+(\/(api\/)?)?uploads\//i.test(url)) {
    const idx = url.indexOf('/uploads/')
    return base + '/api' + url.substring(idx)
  }
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('/uploads/')) return base + url.replace('/uploads/', '/api/uploads/')
  if (url.startsWith('//')) return 'https:' + url
  return base + url
}