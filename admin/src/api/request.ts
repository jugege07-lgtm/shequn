import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

// 管理后台：业务代码里所有接口都不带 /api 前缀（如 /admin/dashboard、/auth/admin-login），
// 必须由 baseURL 统一补上 /api，让 Vite proxy / Caddy 转发到后端 3000。
// 用 || 而非 ??：.env.production 中 VITE_API_BASE_URL 为空字符串时要回退到 /api，
// 否则 baseURL 为空会把 /admin/dashboard 打到静态站点而非后端，导致 404。
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

// 防止重复错误提示
let lastErrorTime = 0
function showErrorOnce(msg: string, minInterval = 2000) {
  const now = Date.now()
  if (now - lastErrorTime > minInterval) {
    lastErrorTime = now
    ElMessage.error(msg)
  }
}

axios.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (config.url && config.url.includes('admin-login')) {
      return config
    }

    const token = localStorage.getItem('admin_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

axios.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data as any
    // 响应体为空或非 JSON（Vite proxy 偶发 / 网络中断 / 304 Not Modified），
    // 不要让 .code 访问炸出 TypeError 导致 ElMessage.error 误显示技术栈信息
    if (res === undefined || res === null || typeof res !== 'object') {
      console.error('[admin request] unexpected response:', response.status, res)
      showErrorOnce('网络异常，请稍后重试')
      return Promise.reject(new Error('Empty or non-JSON response'))
    }
    if (res.code === 0 || res.code === undefined) {
      // 统一解包：有 data 字段返回 data，否则返回整个 res
      return 'data' in res ? res.data : res
    }
    showErrorOnce(res.message || '请求失败')
    return Promise.reject(new Error(res.message))
  },
  (error: any) => {
    console.error('Admin request error:', error.response?.data || error.message)
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_refreshToken')
      if (error.config && !error.config.url?.includes('admin-login')) {
        router.push('/login')
      }
      showErrorOnce('登录已过期，请重新登录')
    } else if (error.response?.status === 403) {
      showErrorOnce('没有权限访问')
    } else if (error.response?.status === 500) {
      const msg = error.response?.data?.message || '服务器内部错误'
      showErrorOnce(msg)
    } else {
      const msg = error.response?.data?.message || error.message || '网络错误'
      showErrorOnce(msg)
    }
    return Promise.reject(error)
  }
)

export default axios
