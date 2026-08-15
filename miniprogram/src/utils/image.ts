/**
 * 规范化图片 URL（小程序版）
 * 小程序无同源代理与相对路径概念，/uploads/ 一律补全为绝对 API 地址：
 * https://www.jugekeji.com/api/uploads/xxx（域名需加入 downloadFile 合法域名）
 */
import { getApiBase } from './apiBase'

export function normalizeImageUrl(url: string | undefined | null): string {
  if (!url) return ''
  const base = getApiBase()
  if (/^https?:\/\/[^/]+(\/(api\/)?)?uploads\//i.test(url)) {
    const idx = url.indexOf('/uploads/')
    return base + '/api' + url.substring(idx)
  }
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('/uploads/')) return base + url.replace('/uploads/', '/api/uploads/')
  if (url.startsWith('//')) return 'https:' + url
  return base + url
}
