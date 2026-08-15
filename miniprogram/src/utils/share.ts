/**
 * 分享工具（小程序版）
 * - buildShareUrl：生成 H5 落地页链接（海报二维码/复制链接用）
 * - copyText：uni.setClipboardData
 * - 海报绘制与相册保存在 ShareSheet 组件内用 canvas 2d 实现
 */
import { getApiBase } from './apiBase'

export type ShareType = 'activity' | 'business' | 'product'

export interface ShareContent {
  type: ShareType
  title: string
  desc?: string
  meta?: string[]
  image?: string
  price?: string
  /** H5 页面路由路径，如 /activity/detail/3 */
  path: string
}

export const TYPE_META: Record<ShareType, { label: string; emoji: string; accent: [string, string] }> = {
  activity: { label: '热门活动', emoji: '🎉', accent: ['#6366f1', '#a78bfa'] },
  business: { label: '优质商机', emoji: '💼', accent: ['#0fb5e9', '#6366f1'] },
  product: { label: '精选好物', emoji: '📦', accent: ['#f0a04b', '#ef6a5a'] },
}

/**
 * H5 落地页链接：小程序分享出去的二维码/链接最终落在 H5（history 路由）。
 */
export function buildShareUrl(path: string, referrerId?: number | null): string {
  const base = `${getApiBase()}/h5`.replace(/\/+$/, '')
  const sep = path.includes('?') ? '&' : '?'
  return referrerId ? `${base}${path}${sep}referrer=${referrerId}` : `${base}${path}`
}

/** 小程序内跳转路径（分享给微信好友 onShareAppMessage 用） */
export function buildMiniPath(path: string, referrerId?: number | null): string {
  const sep = path.includes('?') ? '&' : '?'
  return referrerId ? `${path}${sep}referrer=${referrerId}` : path
}

/** 复制文本到剪贴板 */
export function copyText(text: string): Promise<boolean> {
  return new Promise((resolve) => {
    uni.setClipboardData({
      data: text,
      success: () => resolve(true),
      fail: () => resolve(false),
    })
  })
}

/**
 * 小程序内无系统分享面板；转发通过页面 onShareAppMessage /
 * button open-type="share" 触发。此函数恒返回 'unsupported'，
 * 调用方（ShareSheet）会退化为「转发给好友」按钮 + 复制链接。
 */
export async function nativeShare(_payload: { title: string; text: string; url?: string }): Promise<'shared' | 'cancel' | 'unsupported'> {
  return 'unsupported'
}

/** 相册保存授权被拒后的引导 */
export function ensureAlbumPermission(): Promise<boolean> {
  return new Promise((resolve) => {
    uni.getSetting({
      success(res) {
        const auth = res.authSetting['scope.writePhotosAlbum']
        if (auth === undefined) {
          uni.authorize({
            scope: 'scope.writePhotosAlbum',
            success: () => resolve(true),
            fail: () => resolve(false),
          })
        } else if (auth === false) {
          uni.showModal({
            title: '提示',
            content: '需要相册权限保存海报，请在设置中开启',
            confirmText: '去设置',
            success(r) {
              if (r.confirm) {
                uni.openSetting({
                  success(s) {
                    resolve(!!s.authSetting['scope.writePhotosAlbum'])
                  },
                  fail: () => resolve(false),
                })
              } else {
                resolve(false)
              }
            },
          })
        } else {
          resolve(true)
        }
      },
      fail: () => resolve(false),
    })
  })
}

/** canvas 2d 节点 → 临时文件 → 保存相册 */
export function saveCanvasNodeToAlbum(canvas: any): Promise<boolean> {
  return new Promise((resolve, reject) => {
    uni.canvasToTempFilePath({
      canvas,
      success: async (res) => {
        const ok = await ensureAlbumPermission()
        if (!ok) {
          resolve(false)
          return
        }
        uni.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => resolve(true),
          fail: (err) => {
            console.error('保存相册失败', err)
            reject(err)
          },
        })
      },
      fail: (err) => reject(err),
    } as any)
  })
}
