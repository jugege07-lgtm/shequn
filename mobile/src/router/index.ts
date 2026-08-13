import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'
import { setStatusBarStyle } from '@/utils/statusbar'

const routes = [
  // 默认起始路由：未登录会被守卫重定向到 /login；已登录访问 /login 会被重定向到 /
  { path: '/', name: 'Index', component: () => import('@/views/index/index.vue'), meta: { requiresAuth: true, statusBar: 'dark' } },
  { path: '/login', name: 'Login', component: () => import('@/views/login/index.vue'), meta: { guestOnly: true, statusBar: 'dark' } },
  { path: '/register', name: 'Register', component: () => import('@/views/register/index.vue'), meta: { guestOnly: true, statusBar: 'dark' } },
  { path: '/forgot-password', name: 'ForgotPassword', component: () => import('@/views/forgot-password/index.vue'), meta: { guestOnly: true, statusBar: 'dark' } },
  { path: '/app-download', name: 'AppDownload', component: () => import('@/views/app-download/index.vue') },
  { path: '/activity/list', name: 'ActivityList', component: () => import('@/views/activity/list.vue'), meta: { requiresAuth: true } },
  { path: '/activity/detail/:id', name: 'ActivityDetail', component: () => import('@/views/activity/detail.vue'), meta: { requiresAuth: true } },
  { path: '/activity/publish', name: 'ActivityPublish', component: () => import('@/views/activity/publish.vue'), meta: { requiresAuth: true } },
  { path: '/activity/my', name: 'ActivityMy', component: () => import('@/views/activity/my.vue'), meta: { requiresAuth: true } },
  { path: '/activity/verify', name: 'ActivityVerify', component: () => import('@/views/activity/verify.vue'), meta: { requiresAuth: true } },
  { path: '/business/list', name: 'BusinessList', component: () => import('@/views/business/list.vue'), meta: { requiresAuth: true } },
  { path: '/business/detail/:id', name: 'BusinessDetail', component: () => import('@/views/business/detail.vue'), meta: { requiresAuth: true } },
  { path: '/business/publish', name: 'BusinessPublish', component: () => import('@/views/business/publish.vue'), meta: { requiresAuth: true } },
  { path: '/business/my', name: 'BusinessMy', component: () => import('@/views/business/my.vue'), meta: { requiresAuth: true } },
  { path: '/profile/index', name: 'ProfileIndex', component: () => import('@/views/profile/index.vue'), meta: { requiresAuth: true } },
  { path: '/card/index', name: 'CardIndex', component: () => import('@/views/card/index.vue'), meta: { requiresAuth: true } },
  { path: '/card/edit', name: 'CardEdit', component: () => import('@/views/card/edit.vue'), meta: { requiresAuth: true } },
  { path: '/card/share', name: 'CardShare', component: () => import('@/views/card/share.vue'), meta: { requiresAuth: true } },
  { path: '/card/share/:id', name: 'CardShareById', component: () => import('@/views/card/share.vue'), meta: { requiresAuth: true } },
  { path: '/card/friend/:userId', name: 'CardFriend', component: () => import('@/views/card/friend.vue'), meta: { requiresAuth: true } },
  { path: '/about/index', name: 'AboutIndex', component: () => import('@/views/about/index.vue'), meta: { requiresAuth: true } },

  { path: '/mall/index', name: 'MallIndex', component: () => import('@/views/mall/index.vue'), meta: { requiresAuth: true } },
  { path: '/mall/detail/:id', name: 'MallDetail', component: () => import('@/views/mall/detail.vue'), meta: { requiresAuth: true } },
  { path: '/cart/index', name: 'CartIndex', component: () => import('@/views/cart/index.vue'), meta: { requiresAuth: true } },
  { path: '/order/confirm', name: 'OrderConfirm', component: () => import('@/views/order/confirm.vue'), meta: { requiresAuth: true } },
  { path: '/order/pay/:id', name: 'OrderPay', component: () => import('@/views/order/pay.vue'), meta: { requiresAuth: true } },
  { path: '/order/success', name: 'OrderSuccess', component: () => import('@/views/order/success.vue'), meta: { requiresAuth: true } },
  { path: '/order/detail/:id', name: 'OrderDetail', component: () => import('@/views/order/detail.vue'), meta: { requiresAuth: true } },
  { path: '/order/list', name: 'OrderList', component: () => import('@/views/order/list.vue'), meta: { requiresAuth: true } },
  { path: '/address/edit', name: 'AddressEdit', component: () => import('@/views/address/edit.vue'), meta: { requiresAuth: true } },
  { path: '/opportunity/list', name: 'OpportunityList', component: () => import('@/views/opportunity/list.vue'), meta: { requiresAuth: true } },
  { path: '/vip/index', name: 'VipIndex', component: () => import('@/views/vip/index.vue'), meta: { requiresAuth: true } },
  { path: '/vip/pay', name: 'VipPay', component: () => import('@/views/vip/pay.vue'), meta: { requiresAuth: true } },
  { path: '/message/index', name: 'MessageIndex', component: () => import('@/views/message/index.vue'), meta: { requiresAuth: true } },
  { path: '/dajia/index', name: 'DajiaRecommend', component: () => import('@/views/dajia/index.vue'), meta: { requiresAuth: true } },
  { path: '/coupon/index', name: 'CouponIndex', component: () => import('@/views/coupon/index.vue'), meta: { requiresAuth: true } },
  { path: '/coupon/claim', name: 'CouponClaim', component: () => import('@/views/coupon/claim.vue'), meta: { requiresAuth: true } },
  { path: '/points/index', name: 'PointsIndex', component: () => import('@/views/points/index.vue'), meta: { requiresAuth: true } },
  { path: '/balance/index', name: 'BalanceIndex', component: () => import('@/views/balance/index.vue'), meta: { requiresAuth: true } },
  { path: '/history/index', name: 'HistoryIndex', component: () => import('@/views/history/index.vue'), meta: { requiresAuth: true } },
  { path: '/cart/index', name: 'CartIndex', component: () => import('@/views/cart/index.vue'), meta: { requiresAuth: true } },
  { path: '/setting/index', name: 'SettingIndex', component: () => import('@/views/setting/index.vue'), meta: { requiresAuth: true } },
  { path: '/setting/pay-password', name: 'SettingPayPassword', component: () => import('@/views/setting/pay-password.vue'), meta: { requiresAuth: true } },

  // ===== 兼容短路径直达：避免直接访问白屏 =====
  { path: '/mall', redirect: '/mall/index' },
  { path: '/message', redirect: '/message/index' },
  { path: '/about', redirect: '/about/index' },
  { path: '/order', redirect: '/order/list' },
  { path: '/activity/create', redirect: '/activity/publish' },
  { path: '/coupon/my', redirect: '/coupon/index' },
  { path: '/profile', redirect: '/profile/index' },
  { path: '/card', redirect: '/card/index' },
  { path: '/cart', redirect: '/cart/index' },
  { path: '/coupon', redirect: '/coupon/index' },
  { path: '/dajia', redirect: '/dajia/index' },
  { path: '/vip', redirect: '/vip/index' },
  { path: '/points', redirect: '/points/index' },
  { path: '/balance', redirect: '/balance/index' },
  { path: '/history', redirect: '/history/index' },
  { path: '/setting', redirect: '/setting/index' },
  // 兜底：未匹配路径一律回首页，杜绝白屏
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

// 部署在子路径 /h5/ 下，history 模式必须显式指定 base，否则刷新或 push 会跳到根域导致 404
const router = createRouter({ history: createWebHistory(import.meta.env.BASE_URL || '/h5/'), routes })

// 全局前置守卫：实现持久化登录与自动跳转
// - 未登录访问受保护页 → 跳转到 /login（保留 redirect 查询参数，便于登录后回跳）
// - 已登录访问 /login 或 /register → 直接跳转到主界面 /
router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()
  const loggedIn = userStore.isLoggedIn

  // 已登录用户访问登录/注册页：自动跳过到主界面
  if (to.meta.guestOnly && loggedIn) {
    return next({ path: '/' })
  }

  // 未登录用户访问受保护页：跳转登录页并记录回跳目标
  if (to.meta.requiresAuth && !loggedIn) {
    return next({ path: '/login', query: to.fullPath !== '/' ? { redirect: to.fullPath } : undefined })
  }

  next()
})

// 全局后置守卫：每次路由切换后，按页面顶部背景动态切换状态栏图标明暗。
// - 深/彩色背景首屏（首页 banner、登录/注册/忘记密码紫渐变）→ 浅色图标（dark）
// - 其余白底 header 页面 → 深色图标（light，默认）
// 原生透明状态栏下，图标颜色必须匹配页面顶部背景，否则会看不清或在白条上残留印记。
router.afterEach((to) => {
  const style = to.meta.statusBar === 'dark' ? 'dark' : 'light'
  setStatusBarStyle(style)
})

export default router
