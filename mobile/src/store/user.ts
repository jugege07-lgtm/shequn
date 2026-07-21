import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 持久化存储 Key
const TOKEN_KEY = 'token'
const REFRESH_TOKEN_KEY = 'refreshToken'
const USER_INFO_KEY = 'user_info'
const LOGIN_TIME_KEY = 'login_time'

// 本地 token 最长保留时间（30 天），超过则视为过期需重新登录
// 后端 401 会触发无感刷新；此时间仅作为兜底清理
const TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || '')
  const refreshToken = ref(localStorage.getItem(REFRESH_TOKEN_KEY) || '')
  const userInfo = ref<any>(JSON.parse(localStorage.getItem(USER_INFO_KEY) || 'null'))
  const loginTime = ref<number>(Number(localStorage.getItem(LOGIN_TIME_KEY)) || 0)

  // 是否已登录：有 token 且未超过本地最长保留期
  const isLoggedIn = computed(() => {
    if (!token.value) return false
    if (loginTime.value && Date.now() - loginTime.value >= TOKEN_MAX_AGE_MS) {
      return false
    }
    return true
  })

  // 写入 token（同时记录登录时间，便于本地过期判断）
  function setToken(t: string, rt?: string) {
    token.value = t
    localStorage.setItem(TOKEN_KEY, t)
    if (rt) {
      refreshToken.value = rt
      localStorage.setItem(REFRESH_TOKEN_KEY, rt)
    }
    // 仅在首次登录（loginTime 为空）时记录登录时间，避免刷新 token 时重置
    if (!loginTime.value) {
      loginTime.value = Date.now()
      localStorage.setItem(LOGIN_TIME_KEY, String(loginTime.value))
    }
  }

  function setUserInfo(info: any) {
    userInfo.value = info
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(info))
  }

  // 主动退出登录：清空所有凭证
  function logout() {
    token.value = ''
    refreshToken.value = ''
    userInfo.value = null
    loginTime.value = 0
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_INFO_KEY)
    localStorage.removeItem(LOGIN_TIME_KEY)
  }

  // 应用启动时从 localStorage 恢复会话；若本地已过期则清理
  function restoreSession(): boolean {
    token.value = localStorage.getItem(TOKEN_KEY) || ''
    refreshToken.value = localStorage.getItem(REFRESH_TOKEN_KEY) || ''
    userInfo.value = JSON.parse(localStorage.getItem(USER_INFO_KEY) || 'null')
    loginTime.value = Number(localStorage.getItem(LOGIN_TIME_KEY)) || 0

    if (token.value && loginTime.value && Date.now() - loginTime.value >= TOKEN_MAX_AGE_MS) {
      logout()
      return false
    }
    return isLoggedIn.value
  }

  return {
    token,
    refreshToken,
    userInfo,
    loginTime,
    isLoggedIn,
    setToken,
    setUserInfo,
    logout,
    restoreSession,
  }
})
