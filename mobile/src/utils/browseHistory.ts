/**
 * 浏览历史本地记录工具（前端 localStorage 方案）
 * - 记录用户浏览过的活动 / 商机 / 商品
 * - 相同类型 + 相同 id 去重：只保留最新一次浏览
 * - 按浏览时间倒序返回，最多保留 50 条
 */

export type BrowseType = 'activity' | 'business' | 'product'

export interface BrowseRecord {
  id: number
  type: BrowseType
  title: string
  /** 浏览时间戳（毫秒） */
  time: number
}

const STORAGE_KEY = 'shequn_browse_history'
const MAX_RECORDS = 50

/** 读取本地浏览历史（已按时间倒序） */
export function getBrowseHistory(limit?: number): BrowseRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const list = JSON.parse(raw) as BrowseRecord[]
    if (!Array.isArray(list)) return []
    const sorted = list
      .filter((r) => r && typeof r.id === 'number' && typeof r.time === 'number')
      .sort((a, b) => b.time - a.time)
    return typeof limit === 'number' && limit > 0 ? sorted.slice(0, limit) : sorted
  } catch {
    return []
  }
}

/**
 * 记录一次浏览（去重 + 倒序 + 上限裁剪）
 * @param type  内容类型
 * @param id    内容 id
 * @param title 内容标题
 */
export function recordBrowse(type: BrowseType, id: number, title: string) {
  if (!id || !title) return
  const list = getBrowseHistory()
  // 去掉同类型同 id 的旧记录，保留最新一次
  const filtered = list.filter((r) => !(r.type === type && r.id === id))
  filtered.push({ type, id, title, time: Date.now() })
  filtered.sort((a, b) => b.time - a.time)
  const trimmed = filtered.slice(0, MAX_RECORDS)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch {
    // localStorage 不可用或超出配额时静默降级
  }
}

/** 清空浏览历史 */
export function clearBrowseHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // 忽略
  }
}