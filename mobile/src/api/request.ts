import axios from 'axios'
import router from '@/router'
import { useUserStore } from '@/store/user'

// 生产环境部署在子路径 /h5/ 下，所有 API 路径已显式以 /api 开头，
// 因此 baseURL 必须为空字符串，否则 axios 会拼成 /api/api/... 导致 404
const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

const request = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
})

// 防止并发刷新 token
let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb)
}

// 认证类公开接口：登录/注册/验证码/刷新等无需 token，这些接口返回 401 表示"业务认证失败"（如密码错误），
// 不应触发 token 刷新的逻辑
const PUBLIC_AUTH_PATHS = ['/api/auth/']

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const url = config.url || ''
    const isPublic = PUBLIC_AUTH_PATHS.some((p) => url.startsWith(p))
    // 标记是否为公开接口，供响应拦截器区分 401 场景
    ;(config as any)._public = isPublic
    if (!isPublic) {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const { code, data, message } = response.data
    if (code === 0) {
      return data
    }
    if (code === 401) {
      // 业务层 401：清理会话并跳转登录页（使用 router.replace 保持 history 模式一致）
      try { useUserStore().logout() } catch { /* store 尚未初始化时降级清理 */ localStorage.removeItem('token') }
      if (router.currentRoute.value.path !== '/login') {
        router.replace({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } })
      }
      showToast('请先登录', 'none')
      return Promise.reject(new Error('未登录'))
    }
    showToast(message || '请求失败', 'none')
    return Promise.reject(new Error(message))
  },
  async (error) => {
    const originalRequest = error.config

    // 认证类公开接口的 401（如"账号或密码错误"）不是 token 过期，直接透传错误信息，不触发刷新
    if (error.response?.status === 401 && originalRequest?._public) {
      const respData = error.response?.data
      let msg = respData?.message
      if (Array.isArray(msg)) msg = msg[0]
      msg = msg || '请求失败'
      error.message = msg
      error.userMessage = msg
      return Promise.reject(error)
    }

    // 401 时尝试无感刷新 token
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        if (isRefreshing) {
          // 已有刷新进行中，排队等待
          return new Promise((resolve) => {
            addRefreshSubscriber((newToken: string) => {
              originalRequest.headers.Authorization = `Bearer ${newToken}`
              resolve(request(originalRequest))
            })
          })
        }

        originalRequest._retry = true
        isRefreshing = true

        try {
          const res = await axios.post(`${BASE_URL}/api/auth/refresh`, { refreshToken })
          const newToken = res.data?.data?.accessToken || res.data?.accessToken
          if (newToken) {
            localStorage.setItem('token', newToken)
            if (res.data?.data?.refreshToken || res.data?.refreshToken) {
              localStorage.setItem('refreshToken', res.data?.data?.refreshToken || res.data?.refreshToken)
            }
            // 同步更新 user store 的 token（保留原 loginTime，不重置登录时间）
            try { useUserStore().setToken(newToken) } catch { /* ignore */ }
            onRefreshed(newToken)
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            return request(originalRequest)
          }
        } catch {
          // 刷新失败，清空 token 跳转登录
        }

        isRefreshing = false
        refreshSubscribers = []
      }

      // 清理会话并跳转登录页（使用 router.replace 保持 history 模式一致）
      try { useUserStore().logout() } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
      }
      if (router.currentRoute.value.path !== '/login') {
        router.replace({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } })
      }
      showToast('登录已过期，请重新登录', 'none')
      return Promise.reject(new Error('Token 刷新失败'))
    }

    console.error('Request error:', error.message)
    const status = error.response?.status
    const respData = error.response?.data
    let errorMsg = '网络错误，请检查连接'

    if (status === 400) {
      if (respData?.message) {
        if (Array.isArray(respData.message)) {
          errorMsg = respData.message[0] || '参数错误'
        } else {
          errorMsg = respData.message
        }
      } else {
        errorMsg = '参数错误，请检查输入'
      }
    } else if (status === 403) {
      errorMsg = respData?.message || '没有操作权限'
    } else if (status === 404) {
      errorMsg = '请求的资源不存在'
    } else if (status >= 500) {
      errorMsg = '服务器错误，请稍后重试'
    } else if (respData?.message) {
      errorMsg = respData.message
    }

    // 401 已在上方处理，其他状态码才显示 toast
    if (status !== 401) {
      showToast(errorMsg, 'none')
    }

    // 将错误消息挂载到 error 上，方便调用方读取
    error.userMessage = errorMsg
    return Promise.reject(error)
  }
)

// 轻量 Toast 工具
function showToast(msg: string, type: string = 'none') {
  if (typeof uni !== 'undefined' && uni.showToast) {
    uni.showToast({ title: msg, icon: type === 'success' ? 'success' : type === 'error' ? 'error' : 'none' })
    return
  }
  const existing = document.querySelector('.mobile-toast')
  if (existing) existing.remove()
  
  const toast = document.createElement('div')
  toast.className = 'mobile-toast'
  toast.textContent = msg
  toast.style.cssText = `
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    background: rgba(0,0,0,0.75); color: #fff; padding: 12px 24px;
    border-radius: 8px; font-size: 14px; z-index: 9999;
    animation: fadeInOut 2s ease forwards;
  `
  document.body.appendChild(toast)
  
  if (!document.getElementById('mobile-toast-style')) {
    const style = document.createElement('style')
    style.id = 'mobile-toast-style'
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; }
        15% { opacity: 1; }
        85% { opacity: 1; }
        100% { opacity: 0; }
      }
    `
    document.head.appendChild(style)
  }
  
  setTimeout(() => toast.remove(), 2000)
}

export default request
