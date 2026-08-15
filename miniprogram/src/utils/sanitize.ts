/**
 * 富文本/纯文本处理工具（小程序版）
 * 移动端版本依赖 DOM（document.createElement），这里改为纯正则实现。
 * sanitizeRichHtml 的输出用于 <rich-text :nodes="html"> 渲染。
 */
import { normalizeImageUrl } from './image'

/** HTML 实体/标签转义 */
export function escapeHtml(str: string): string {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** 将富文本 HTML 转换为纯文本（列表摘要/Canvas 绘制用） */
export function stripHtml(html: string): string {
  if (!html) return ''
  let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
  cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n')
  cleaned = cleaned.replace(/<\/?(p|div|h[1-6]|li|tr)[^>]*>/gi, '\n')
  cleaned = cleaned.replace(/<[^>]+>/g, '')
  cleaned = cleaned.replace(/&nbsp;/g, ' ')
  cleaned = cleaned.replace(/&lt;/g, '<')
  cleaned = cleaned.replace(/&gt;/g, '>')
  cleaned = cleaned.replace(/&amp;/g, '&')
  cleaned = cleaned.replace(/&quot;/g, '"')
  cleaned = cleaned.replace(/&#39;/g, "'")
  return cleaned.replace(/\n{3,}/g, '\n').trim()
}

/**
 * 安全净化富文本（白名单标签/属性，移除脚本与事件处理器），
 * 并将 img src 重写为绝对地址（小程序 rich-text 不走 Caddy 代理）。
 */
export function sanitizeRichHtml(html: string, maxLength?: number): string {
  if (!html) return ''

  let cleaned = html
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '')
  cleaned = cleaned.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  cleaned = cleaned.replace(/href\s*=\s*(?:["'])javascript:[^"']*["']/gi, 'href=""')
  cleaned = cleaned.replace(/src\s*=\s*(?:["'])javascript:[^"']*["']/gi, 'src=""')
  cleaned = cleaned.replace(/href\s*=\s*(?:["'])data:[^"']*["']/gi, 'href=""')

  const allowedTags = [
    'p', 'br', 'hr', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
    'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'pre', 'code', 'img', 'a',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
    'span', 'div', 'figure', 'figcaption',
  ]
  const allowedAttrs = [
    'src', 'alt', 'title', 'href', 'class', 'width', 'height',
    'colspan', 'rowspan', 'border', 'align', 'valign', 'style',
  ]

  cleaned = cleaned.replace(/<([^>]+)>/g, (_, tagContent: string) => {
    const tagMatch = tagContent.match(/^\/?\s*(\w+)/)
    if (!tagMatch) return ''
    const isClosing = /^\//.test(tagContent.trim())
    const tagName = tagMatch[1].toLowerCase()
    if (!allowedTags.includes(tagName)) return ''
    if (isClosing) return `</${tagName}>`
    let safeTag = `<${tagName}`
    const attrRegex = /([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/g
    let attrMatch: RegExpExecArray | null
    while ((attrMatch = attrRegex.exec(tagContent)) !== null) {
      const attrName = attrMatch[1].toLowerCase()
      const attrValue = attrMatch[2] || attrMatch[3] || attrMatch[4] || ''
      if (allowedAttrs.includes(attrName)) {
        safeTag += ` ${attrName}="${attrValue}"`
      }
    }
    safeTag += '>'
    return safeTag
  })

  // img：移除固定像素宽高（防溢出），src 补全绝对地址，注入内联样式（rich-text 无法被页面 CSS 穿透）
  cleaned = cleaned.replace(/<img(\s[^>]*)?>/gi, (match) => {
    let fixed = match
    fixed = fixed.replace(/\s+width\s*=\s*["']?\d+px["']?/gi, '')
    fixed = fixed.replace(/\s+height\s*=\s*["']?\d+px["']?/gi, '')
    fixed = fixed.replace(/\s+width\s*=\s*["']?\d{4,}["']?/gi, '')
    fixed = fixed.replace(/\s+height\s*=\s*["']?\d{4,}["']?/gi, '')
    fixed = fixed.replace(/style\s*=\s*(?:"[^"]*"|'[^']*')/gi, '')
    fixed = fixed.replace(/src\s*=\s*(?:"([^"]*)"|'([^']*)')/gi, (_m: string, dq?: string, sq?: string) => {
      const v = dq ?? sq ?? ''
      return `src="${normalizeImageUrl(v)}"`
    })
    if (!/style\s*=/i.test(fixed)) {
      fixed = fixed.replace(/\/?>$/, ' style="max-width:100%;height:auto;display:block;border-radius:8px;margin:8px 0;" />')
    }
    return fixed
  })

  // 常规块级标签注入轻量排版内联样式（仅当无 style 时）
  const INLINE_STYLES: Record<string, string> = {
    p: 'margin:8px 0;',
    h1: 'font-size:20px;font-weight:700;margin:16px 0 8px;',
    h2: 'font-size:18px;font-weight:700;margin:14px 0 6px;',
    h3: 'font-size:16px;font-weight:700;margin:12px 0 6px;',
    ul: 'padding-left:20px;margin:8px 0;',
    ol: 'padding-left:20px;margin:8px 0;',
    li: 'margin:4px 0;',
    a: 'color:#6366f1;',
    blockquote: 'border-left:3px solid #6366f1;margin:10px 0;padding:8px 12px;color:#6b7280;background:#f9fafb;',
  }
  cleaned = cleaned.replace(/<(p|h[1-6]|ul|ol|li|a|blockquote)(\s[^>]*)?>/gi, (match, tagName: string, attrs: string = '') => {
    if (/style\s*=/i.test(attrs)) return match
    return `<${tagName}${attrs} style="${INLINE_STYLES[tagName.toLowerCase()] || ''}">`
  })

  if (maxLength && cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength)
    const openTags: string[] = []
    const tagRegex = /<(\/?)(\w+)[^>]*>/g
    let tagMatch: RegExpExecArray | null
    while ((tagMatch = tagRegex.exec(cleaned)) !== null) {
      const [, closing, name] = tagMatch
      const selfClosing = ['br', 'hr', 'img']
      if (selfClosing.includes(name)) continue
      if (closing) openTags.pop()
      else openTags.push(name)
    }
    for (let i = openTags.length - 1; i >= 0; i--) {
      cleaned += `</${openTags[i]}>`
    }
  }

  return cleaned
}

export function generateSafePriceHtml(price: number | string): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  if (isNaN(numPrice as number)) return '¥0'
  return `¥${Number(numPrice).toFixed(2)}`
}
