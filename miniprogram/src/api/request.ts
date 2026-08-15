/**
 * 小程序请求层（等价移动端 axios 封装）
 * - uni.request 实现，接口签名与 axios 版一致：request.get/post/put/delete
 * - config.params → query；config._noToast → 失败不弹提示
 * - 业务 code===0 返回 data；业务 401 / HTTP 401 清理会话跳登录
 * - HTTP 401 携带 refreshToken 时无感刷新并重放请求
 */
import { showToast } from '@/utils/toast'
import { getApiBase } from '@/utils/apiBase'
import router, { currentRoute } from '@/shims/vue-router'

// 敏感词审核命中字段 → 中文标签（提示框展示用，与后端 @ContentModeration 字段名保持一致）
const MODERATION_FIELD_LABELS: Record<string, string> = {
  title: '标题',
  description: '详细描述',
  location: '活动地点',
  contactName: '联系人',
  contactWechat: '微信号',
  realName: '姓名',
  nickname: '昵称',
  company: '公司',
  position: '职位',
  wechat: '微信',
  intro: '个人简介',
  tags: '标签',
  socialLinks: '社交链接',
  receiver: '收货人',
  detail: '详细地址',
  remark: '订单备注',
}

/** 敏感词审核命中：弹明确提示框（模态），并给 err 打 moderation 标记供页面 catch 跳过重复 toast */
function handleModerationError(body: any, err: any) {
  const msg = Array.isArray(body?.message) ? body.message[0] : (body?.message || '内容包含违规词汇，请修改后重新发布')
  const fieldLabel = MODERATION_FIELD_LABELS[body?.field] || '内容'
  const kws: string[] = Array.isArray(body?.keywords) ? body.keywords : []
  uni.showModal({
    title: '内容包含违规词汇',
    content: `「${fieldLabel}」未通过内容审核${kws.length ? `，违规词：${kws.slice(0, 5).join('、')}` : ''}。请修改后重新提交。`,
    showCancel: false,
    confirmText: '我知道了',
  })
  err.message = msg
  err.userMessage = msg
  err.moderation = true
}

const BASE_URL = getApiBase()

// 认证类公开接口：401 为业务失败（密码错误等），不触发刷新。
// 必须精确列出端点——不能用 '/api/auth/' 宽前缀：/api/auth/me 需要登录态，
// 一旦被误判为公开接口就不带 token，恒 401，导致 userInfo/VIP 状态永远刷不到
const PUBLIC_AUTH_PATHS = [
  '/api/auth/wechat-login',
  '/api/auth/phone-login',
  '/api/auth/phone-password-login',
  '/api/auth/register',
  '/api/auth/admin-login',
  '/api/auth/staff-login',
  '/api/auth/refresh',
  '/api/auth/send-code',
  '/api/auth/reset-password',
]

let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

function isPublicAuth(url: string): boolean {
  return PUBLIC_AUTH_PATHS.some((p) => url.startsWith(p))
}

function buildUrl(url: string, params?: Record<string, any>): string {
  let full = BASE_URL + url
  if (params && Object.keys(params).length) {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&')
    if (qs) full += (full.includes('?') ? '&' : '?') + qs
  }
  return full
}

function rawRequest(options: UniApp.RequestOptions): Promise<UniApp.RequestSuccessCallbackResult> {
  return new Promise((resolve, reject) => {
    uni.request({ ...options, success: resolve, fail: reject })
  })
}

function logoutAndRedirect() {
  try {
    const token = uni.getStorageSync('token')
    if (token) {
      uni.removeStorageSync('token')
      uni.removeStorageSync('refreshToken')
      uni.removeStorageSync('user_info')
      uni.removeStorageSync('login_time')
    }
  } catch {
    /* ignore */
  }
  const cur = currentRoute().fullPath
  if (!cur.startsWith('/pages/login')) {
    router.replace({ path: '/login', query: cur !== '/pages/index/index' ? { redirect: cur } : undefined })
  }
  showToast('请先登录')
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = uni.getStorageSync('refreshToken')
  if (!refreshToken) return null
  try {
    const res = await rawRequest({
      url: `${BASE_URL}/api/auth/refresh`,
      method: 'POST',
      data: { refreshToken },
      timeout: 15000,
    })
    const body: any = res.data
    const payload = body?.data || body
    const newToken = payload?.accessToken || payload?.token
    if (newToken) {
      uni.setStorageSync('token', newToken)
      if (payload?.refreshToken) uni.setStorageSync('refreshToken', payload.refreshToken)
      return newToken
    }
    return null
  } catch {
    return null
  }
}

interface RequestConfig {
  params?: Record<string, any>
  _noToast?: boolean
  _public?: boolean
  headers?: Record<string, string>
}

async function dispatch<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  url: string,
  data?: any,
  config: RequestConfig = {},
): Promise<T> {
  const isPublic = config._public ?? isPublicAuth(url)
  const token = uni.getStorageSync('token')
  const header: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(config.headers || {}),
  }
  if (token && !isPublic) header.Authorization = `Bearer ${token}`

  let res: UniApp.RequestSuccessCallbackResult
  try {
    res = await rawRequest({
      url: buildUrl(url, config.params),
      method,
      data,
      header,
      timeout: 15000,
    })
  } catch (err: any) {
    // 透出真实错误（uni.request fail 的 errMsg）：真机排查关键信息，
    // 如 "url not in domain list"（白名单未生效）、"timeout"、"ssl hand shake error"
    const errMsg = err?.errMsg || '网络异常'
    console.error('[request:fail]', method, buildUrl(url, config.params), errMsg)
    if (!config._noToast) showToast(`网络异常：${String(errMsg).slice(0, 50)}`)
    throw new Error(errMsg)
  }

  const status = (res as any).statusCode || 200
  const body: any = res.data

  // HTTP 401：token 过期 → 尝试刷新后重放
  if (status === 401) {
    if (isPublic) {
      // 认证类公开接口 401 = 业务失败（如密码错误），透传错误信息，不弹全局 toast（对齐移动端）
      const msg = extractMessage(body)
      const err: any = new Error(msg)
      err.userMessage = msg
      throw err
    }
    const rt = uni.getStorageSync('refreshToken')
    if (rt && !isRefreshing) {
      isRefreshing = true
      const newToken = await refreshAccessToken()
      isRefreshing = false
      if (newToken) {
        onRefreshed(newToken)
        return dispatch<T>(method, url, data, config)
      }
      logoutAndRedirect()
      throw new Error('登录已过期')
    }
    if (isRefreshing) {
      // 已有刷新进行中，排队等待后重放
      return new Promise<T>((resolve, reject) => {
        refreshSubscribers.push((t: string) => {
          dispatch<T>(method, url, data, config).then(resolve).catch(reject)
        })
      })
    }
    logoutAndRedirect()
    throw new Error('未登录')
  }

  if (status >= 400) {
    const err: any = new Error('')
    // 敏感词审核命中：弹明确提示框（模态），不走普通 toast
    if (body?.moderation === true) {
      handleModerationError(body, err)
      throw err
    }
    const msg = extractMessage(body) || `请求失败(${status})`
    if (!config._noToast) showToast(msg)
    err.message = msg
    err.userMessage = msg
    throw err
  }

  // 业务响应 { code, data, message }
  if (body && typeof body === 'object' && 'code' in body) {
    if (body.code === 0) return body.data as T
    if (body.code === 401) {
      logoutAndRedirect()
      throw new Error('未登录')
    }
    const msg = body.message || '请求失败'
    if (!config._noToast) showToast(Array.isArray(msg) ? msg[0] : msg)
    throw new Error(Array.isArray(msg) ? msg[0] : String(msg))
  }

  return body as T
}

function extractMessage(body: any): string {
  let msg = body?.message
  if (Array.isArray(msg)) msg = msg[0]
  return msg || '请求失败'
}

const request = {
  get<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return dispatch<T>('GET', url, undefined, config)
  },
  post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return dispatch<T>('POST', url, data, config)
  },
  put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return dispatch<T>('PUT', url, data, config)
  },
  delete<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return dispatch<T>('DELETE', url, undefined, config)
  },
  patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return dispatch<T>('PATCH', url, data, config)
  },
}

export default request
