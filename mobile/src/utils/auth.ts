import { getCurrentUser } from '@/api'
import { useUserStore } from '@/store/user'

/**
 * 登录成功后刷新完整用户信息。
 * 登录接口返回的 user 对象不含 vipLevel/vipExpireAt 等实时字段，
 * 需调用 /users/me 获取完整信息，否则 VIP 页/个人中心等依赖等级的页面会显示错误状态。
 * 返回刷新后的用户信息；失败时保留原 userInfo 并返回 null。
 */
export async function refreshUserAfterLogin(fallback: any): Promise<any> {
  const userStore = useUserStore()
  try {
    // 先写入登录接口返回的基础信息，保证有数据可展示
    if (fallback) userStore.setUserInfo(fallback)
    const me = await getCurrentUser()
    if (me && me.id) {
      userStore.setUserInfo(me)
      return me
    }
    return fallback
  } catch (err) {
    return fallback
  }
}