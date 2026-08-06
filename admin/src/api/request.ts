import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

axios.defaults.baseURL = '/api'

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
    if (res.code === 0) {
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
