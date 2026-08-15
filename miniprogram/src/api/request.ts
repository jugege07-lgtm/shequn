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

const BASE_URL = getApiBase()

// 认证类公开接口：401 为业务失败（密码错误等），不触发刷新
const PUBLIC_AUTH_PATHS = ['/api/auth/']

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
    if (!config._noToast) showToast('网络异常，请稍后重试')
    throw new Error(err?.errMsg || '网络异常')
  }

  const status = (res as any).statusCode || 200
  const body: any = res.data

  // HTTP 401：token 过期 → 尝试刷新后重放
  if (status === 401) {
    if (isPublic) {
      const msg = extractMessage(body)
      if (!config._noToast) showToast(msg)
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
    const msg = extractMessage(body) || `请求失败(${status})`
    if (!config._noToast) showToast(msg)
    const err: any = new Error(msg)
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
