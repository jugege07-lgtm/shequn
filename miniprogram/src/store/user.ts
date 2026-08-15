import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import request from '@/api/request'
import { ls } from '@/shims/localStorage'

// 持久化存储 Key
const TOKEN_KEY = 'token'
const REFRESH_TOKEN_KEY = 'refreshToken'
const USER_INFO_KEY = 'user_info'
const LOGIN_TIME_KEY = 'login_time'

// 本地 token 最长保留时间（30 天），超过则视为过期需重新登录
// 后端 401 会触发无感刷新；此时间仅作为兜底清理
const TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

export const useUserStore = defineStore('user', () => {
  const token = ref(ls.getItem(TOKEN_KEY) || '')
  const refreshToken = ref(ls.getItem(REFRESH_TOKEN_KEY) || '')
  const userInfo = ref<any>(JSON.parse(ls.getItem(USER_INFO_KEY) || 'null'))
  const loginTime = ref<number>(Number(ls.getItem(LOGIN_TIME_KEY)) || 0)

  // 是否已登录：有 token 且未超过本地最长保留期
  const isLoggedIn = computed(() => {
    if (!token.value) return false
    if (loginTime.value && Date.now() - loginTime.value >= TOKEN_MAX_AGE_MS) {
      return false
    }
    return true
  })

  // 是否为有效 VIP 会员：vipLevel > 0 且未过期
  // 后端创建订单时会再次查库校验，前端此值仅用于价格展示
  const isVip = computed(() => {
    const info = userInfo.value
    if (!info) return false
    const level = Number(info.vipLevel) || 0
    if (level <= 0) return false
    // vipExpireAt 存在且未过期
    if (info.vipExpireAt) {
      return new Date(info.vipExpireAt).getTime() > Date.now()
    }
    // vipExpireAt 为 null 但 vipLevel > 0，保守视为有效（后端会权威校验）
    return true
  })

  /** 从后端刷新用户信息（含VIP状态、积分等），用于VIP身份变更后同步前端 */
  async function fetchUserInfo() {
    if (!token.value) return
    try {
      const data = await request.get('/api/auth/me')
      if (data) {
        setUserInfo(data)
      }
    } catch {
      // 静默失败，不影响正常使用
    }
  }

  // 写入 token（同时记录登录时间，便于本地过期判断）
  function setToken(t: string, rt?: string) {
    token.value = t
    ls.setItem(TOKEN_KEY, t)
    if (rt) {
      refreshToken.value = rt
      ls.setItem(REFRESH_TOKEN_KEY, rt)
    }
    // 仅在首次登录（loginTime 为空）时记录登录时间，避免刷新 token 时重置
    if (!loginTime.value) {
      loginTime.value = Date.now()
      ls.setItem(LOGIN_TIME_KEY, String(loginTime.value))
    }
  }

  function setUserInfo(info: any) {
    userInfo.value = info
    ls.setItem(USER_INFO_KEY, JSON.stringify(info))
  }

  // 主动退出登录：清空所有凭证
  function logout() {
    token.value = ''
    refreshToken.value = ''
    userInfo.value = null
    loginTime.value = 0
    ls.removeItem(TOKEN_KEY)
    ls.removeItem(REFRESH_TOKEN_KEY)
    ls.removeItem(USER_INFO_KEY)
    ls.removeItem(LOGIN_TIME_KEY)
  }

  // 应用启动时从 localStorage 恢复会话；若本地已过期则清理
  function restoreSession(): boolean {
    token.value = ls.getItem(TOKEN_KEY) || ''
    refreshToken.value = ls.getItem(REFRESH_TOKEN_KEY) || ''
    userInfo.value = JSON.parse(ls.getItem(USER_INFO_KEY) || 'null')
    loginTime.value = Number(ls.getItem(LOGIN_TIME_KEY)) || 0

    if (token.value && loginTime.value && Date.now() - loginTime.value >= TOKEN_MAX_AGE_MS) {
      logout()
      return false
    }
    // 恢复会话后异步刷新用户信息（同步VIP状态等最新数据）
    if (isLoggedIn.value) {
      fetchUserInfo()
    }
    return isLoggedIn.value
  }

  return {
    token,
    refreshToken,
    userInfo,
    loginTime,
    isLoggedIn,
    isVip,
    setToken,
    setUserInfo,
    logout,
    restoreSession,
    fetchUserInfo,
  }
})
