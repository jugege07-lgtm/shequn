/**
 * 规范化图片 URL
 * - 空值直接返回空字符串
 * - 已以 http/https 开头的完整地址直接返回
 * - 后端上传接口返回的 /uploads/xxx 转换为 /api/uploads/xxx，以便通过 Vite 代理 / Caddy 转发到后端静态服务
 * - 以 // 开头的协议相对地址补全为 https:
 */
export function normalizeImageUrl(url: string | undefined | null): string {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('/uploads/')) return url.replace('/uploads/', '/api/uploads/')
  if (url.startsWith('//')) return 'https:' + url
  return url
}