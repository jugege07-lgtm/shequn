import QRCode from 'qrcode'
import { normalizeImageUrl } from './image'

export type ShareType = 'activity' | 'business' | 'product'

/**
 * 三种页面类型的分享内容统一结构。
 * 由各详情页在点击分享时组装，交给 ShareSheet 渲染海报与分享链接。
 */
export interface ShareContent {
  type: ShareType
  title: string
  desc?: string
  meta?: string[]
  image?: string
  price?: string
  /** 页面路由路径，如 /activity/detail/3 */
  path: string
}

const TYPE_META: Record<ShareType, { label: string; emoji: string; accent: [string, string] }> = {
  activity: { label: '热门活动', emoji: '🎉', accent: ['#6366f1', '#a78bfa'] },
  business: { label: '优质商机', emoji: '💼', accent: ['#0fb5e9', '#6366f1'] },
  product: { label: '精选好物', emoji: '📦', accent: ['#f0a04b', '#ef6a5a'] },
}

/**
 * 生成分享链接：携带当前转发人（referrer）信息。
 * referrer 为当前登录用户 ID，明文相对安全（仅用于新人注册识别推荐人）。
 */
export function buildShareUrl(path: string, referrerId?: number | null): string {
  const base = `${window.location.origin}${import.meta.env.BASE_URL || ''}`.replace(/\/+$/, '')
  const sep = path.includes('?') ? '&' : '?'
  return referrerId ? `${base}${path}${sep}referrer=${referrerId}` : `${base}${path}`
}

/** 生成二维码 data URL（本地 Canvas 绘制，无需后端依赖） */
export async function generateQrDataUrl(text: string, size = 460): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: size,
      margin: 1,
      color: { dark: '#1e1b4b', light: '#ffffff' },
    })
  } catch (err) {
    console.error('二维码生成失败:', err)
    return ''
  }
}

/** 复制文本到剪贴板 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0;pointer-events:none'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

/** 调用系统原生分享面板（覆盖微信/QQ 等已安装 App） */
export async function nativeShare(payload: { title: string; text: string; url?: string }): Promise<'shared' | 'cancel' | 'unsupported'> {
  if (!navigator.share) return 'unsupported'
  try {
    await navigator.share(payload)
    return 'shared'
  } catch {
    return 'cancel'
  }
}

/** 将 Canvas 保存为本地图片（移动端浏览器会打开图片供长按保存，桌面端直接下载） */
export function saveCanvasToAlbum(canvas: HTMLCanvasElement, filename: string): void {
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 'image/png')
}

// ==================== 海报绘制 ====================

function loadImageResolved(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const chars = Array.from(text.replace(/\s+/g, ' '))
  const lines: string[] = []
  let line = ''
  for (const ch of chars) {
    const test = line + ch
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = ch
      if (lines.length >= maxLines) break
    } else {
      line = test
    }
  }
  if (line && lines.length < maxLines) lines.push(line)
  return lines
}

/**
 * 生成分享海报（竖版 375x620 逻辑尺寸，2x 渲染）。
 * 布局：封面图 → 类型徽标 → 标题 → 价格 → 信息行 → 底部品牌 + 二维码。
 */
export async function createSharePoster(
  content: ShareContent,
  qrDataUrl: string,
  referrerName: string,
): Promise<HTMLCanvasElement> {
  const S = 2
  const W = 375 * S
  const H = 620 * S
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas context not available')
  const meta = TYPE_META[content.type]

  // 背景
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)

  // 封面
  const coverH = 268 * S
  const coverTop = 0
  const norm = content.image ? normalizeImageUrl(content.image) : ''
  const coverImg = norm ? await loadImageResolved(norm) : null
  if (coverImg) {
    const ratio = W / coverH
    const sw = Math.min(coverImg.width, coverImg.height * ratio)
    const sh = sw / ratio
    const sx = (coverImg.width - sw) / 2
    const sy = (coverImg.height - sh) / 2
    ctx.save()
    roundRect(ctx, 0, 0, W, coverH, 0)
    ctx.clip()
    ctx.drawImage(coverImg, sx, sy, sw, sh, 0, coverTop, W, coverH)
    ctx.restore()
  } else {
    const grad = ctx.createLinearGradient(0, coverTop, W, coverTop + coverH)
    grad.addColorStop(0, meta.accent[0])
    grad.addColorStop(1, meta.accent[1])
    ctx.fillStyle = grad
    ctx.fillRect(0, coverTop, W, coverH)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `${72 * S}px serif`
    ctx.fillText(meta.emoji, W / 2, coverTop + coverH / 2 - 20 * S)
    ctx.font = `bold ${22 * S}px "PingFang SC","Microsoft YaHei",sans-serif`
    ctx.fillStyle = 'rgba(255,255,255,0.92)'
    ctx.fillText(`${meta.label} · 扫码查看详情`, W / 2, coverTop + coverH / 2 + 60 * S)
  }

  // 类型徽标（叠在封面左上角）
  const badgeW = 96 * S
  const badgeH = 40 * S
  ctx.save()
  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  roundRect(ctx, 16 * S, 16 * S, badgeW, badgeH, 20 * S)
  ctx.fill()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `bold ${18 * S}px "PingFang SC","Microsoft YaHei",sans-serif`
  ctx.fillStyle = '#4338ca'
  ctx.fillText(meta.label, 16 * S + badgeW / 2, 16 * S + badgeH / 2)
  ctx.restore()

  // 正文区
  const bodyX = 20 * S
  const bodyW = W - bodyX * 2
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'

  // 标题（最多 2 行）
  ctx.font = `bold ${26 * S}px "PingFang SC","Microsoft YaHei",sans-serif`
  ctx.fillStyle = '#1e1b4b'
  const titleLines = wrapText(ctx, content.title || '', bodyW, 2)
  let y = coverH + 26 * S
  titleLines.forEach((ln) => {
    ctx.fillText(ln, bodyX, y)
    y += 36 * S
  })

  // 价格
  if (content.price) {
    y += 6 * S
    ctx.font = `bold ${22 * S}px "PingFang SC","Microsoft YaHei",sans-serif`
    ctx.fillStyle = '#e11d48'
    ctx.fillText(content.price, bodyX, y)
    y += 34 * S
  }

  // 信息行
  if (content.meta && content.meta.length) {
    y += 2 * S
    ctx.font = `${15 * S}px "PingFang SC","Microsoft YaHei",sans-serif`
    ctx.fillStyle = '#7c7c8a'
    content.meta.forEach((m) => {
      const line = wrapText(ctx, m, bodyW, 1)[0]
      if (!line) return
      ctx.fillText(line, bodyX, y)
      y += 26 * S
    })
  }

  // 分隔线
  y = Math.max(y + 8 * S, 470 * S)
  ctx.strokeStyle = '#eef0f6'
  ctx.lineWidth = 1 * S
  ctx.beginPath()
  ctx.moveTo(bodyX, y)
  ctx.lineTo(bodyX + bodyW, y)
  ctx.stroke()

  // 底部：品牌 + 二维码
  const bottomY = y + 22 * S
  const qrSize = 96 * S
  const qrX = W - 20 * S - qrSize
  const qrY = bottomY

  // 品牌
  ctx.textAlign = 'left'
  const brandCircleR = 20 * S
  const grad = ctx.createLinearGradient(0, 0, brandCircleR * 2, brandCircleR * 2)
  grad.addColorStop(0, '#6366f1')
  grad.addColorStop(1, '#8b5cf6')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(bodyX + brandCircleR, qrY + brandCircleR, brandCircleR, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `bold ${20 * S}px "PingFang SC","Microsoft YaHei",sans-serif`
  ctx.fillText('群', bodyX + brandCircleR, qrY + brandCircleR)
  ctx.textAlign = 'left'
  ctx.font = `bold ${17 * S}px "PingFang SC","Microsoft YaHei",sans-serif`
  ctx.fillStyle = '#1e1b4b'
  ctx.fillText('聚格软件', bodyX + brandCircleR * 2 + 10 * S, qrY)
  ctx.font = `${13 * S}px "PingFang SC","Microsoft YaHei",sans-serif`
  ctx.fillStyle = '#8a8a99'
  ctx.fillText('连接人脉 · 共享商机 · 共同成长', bodyX + brandCircleR * 2 + 10 * S, qrY + 26 * S)

  // 分享人
  ctx.font = `${13 * S}px "PingFang SC","Microsoft YaHei",sans-serif`
  ctx.fillStyle = '#8a8a99'
  ctx.fillText(referrerName ? `分享自：${referrerName}` : '长按识别二维码', bodyX + brandCircleR * 2 + 10 * S, qrY + 52 * S)

  // 二维码
  if (qrDataUrl) {
    const qrImg = await loadImageResolved(qrDataUrl)
    if (qrImg) {
      ctx.fillStyle = '#ffffff'
      roundRect(ctx, qrX - 6 * S, qrY - 6 * S, qrSize + 12 * S, qrSize + 12 * S, 10 * S)
      ctx.fill()
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)
    }
  }

  return canvas
}