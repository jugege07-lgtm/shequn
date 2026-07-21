/**
 * 规范化图片 URL
 * - 空值直接返回空字符串
 * - 已以 http/https 开头的完整地址直接返回
 * - 后端上传接口返回的 /uploads/xxx 转换为 /api/uploads/xxx，以便在 dev server 代理到后端
 */
export function normalizeImageUrl(url: string | undefined | null): string {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('/uploads/')) return url.replace('/uploads/', '/api/uploads/')
  if (url.startsWith('//')) return 'https:' + url
  return url
}
