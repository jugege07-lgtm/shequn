/**
 * vue-router 兼容 shim（微信小程序）
 * - useRouter()/router.push/replace/back/currentRoute 与移动端语义一致
 * - H5 路径（/activity/list、/activity/detail/3）自动映射为小程序页面路径与 query
 * - 动态段 /xxx/:id 会被转成 ?id=，并在 useRoute() 中同时挂到 query 与 params
 * - tabBar 页面自动走 uni.switchTab（query 会被丢弃，小程序限制）
 */
interface RouteDef {
  path: string
  page: string
  keys?: string[]
}

const ROUTES: RouteDef[] = [
  { path: '/', page: '/pages/index/index' },
  { path: '/login', page: '/pages/login/index' },
  { path: '/register', page: '/pages/register/index' },
  { path: '/forgot-password', page: '/pages/forgot-password/index' },
  { path: '/activity/list', page: '/pages/activity/list' },
  { path: '/activity/detail/:id', page: '/pages/activity/detail', keys: ['id'] },
  { path: '/activity/publish', page: '/pages/activity/publish' },
  { path: '/activity/my', page: '/pages/activity/my' },
  { path: '/activity/verify', page: '/pages/activity/verify' },
  { path: '/business/list', page: '/pages/business/list' },
  { path: '/business/detail/:id', page: '/pages/business/detail', keys: ['id'] },
  { path: '/business/publish', page: '/pages/business/publish' },
  { path: '/business/my', page: '/pages/business/my' },
  { path: '/profile/index', page: '/pages/profile/index' },
  { path: '/card/index', page: '/pages/card/index' },
  { path: '/card/edit', page: '/pages/card/edit' },
  { path: '/card/share', page: '/pages/card/share' },
  { path: '/card/share/:id', page: '/pages/card/share', keys: ['id'] },
  { path: '/card/friend/:userId', page: '/pages/card/friend', keys: ['userId'] },
  { path: '/about/index', page: '/pages/about/index' },
  { path: '/mall/index', page: '/pages/mall/index' },
  { path: '/mall/detail/:id', page: '/pages/mall/detail', keys: ['id'] },
  { path: '/cart/index', page: '/pages/cart/index' },
  { path: '/order/confirm', page: '/pages/order/confirm' },
  { path: '/order/pay/:id', page: '/pages/order/pay', keys: ['id'] },
  { path: '/order/success', page: '/pages/order/success' },
  { path: '/order/detail/:id', page: '/pages/order/detail', keys: ['id'] },
  { path: '/order/list', page: '/pages/order/list' },
  { path: '/address/edit', page: '/pages/address/edit' },
  { path: '/opportunity/list', page: '/pages/opportunity/list' },
  { path: '/vip/index', page: '/pages/vip/index' },
  { path: '/vip/pay', page: '/pages/vip/pay' },
  { path: '/message/index', page: '/pages/message/index' },
  { path: '/dajia/index', page: '/pages/dajia/index' },
  { path: '/coupon/index', page: '/pages/coupon/index' },
  { path: '/coupon/claim', page: '/pages/coupon/claim' },
  { path: '/points/index', page: '/pages/points/index' },
  { path: '/balance/index', page: '/pages/balance/index' },
  { path: '/history/index', page: '/pages/history/index' },
  { path: '/setting/index', page: '/pages/setting/index' },
  { path: '/setting/pay-password', page: '/pages/setting/pay-password' },
]

// 短路径兼容（与 mobile router 中的 redirect 对齐）
const SHORT_PATHS: Record<string, string> = {
  '/mall': '/mall/index',
  '/message': '/message/index',
  '/about': '/about/index',
  '/order': '/order/list',
  '/activity/create': '/activity/publish',
  '/coupon/my': '/coupon/index',
  '/profile': '/profile/index',
  '/card': '/card/index',
  '/cart': '/cart/index',
  '/coupon': '/coupon/index',
  '/dajia': '/dajia/index',
  '/vip': '/vip/index',
  '/points': '/points/index',
  '/balance': '/balance/index',
  '/history': '/history/index',
  '/setting': '/setting/index',
}

const TAB_PAGES = [
  '/pages/index/index',
  '/pages/activity/list',
  '/pages/opportunity/list',
  '/pages/mall/index',
  '/pages/profile/index',
]

function decode(v: string): string {
  try {
    return decodeURIComponent(v)
  } catch {
    return v
  }
}

function parseQuery(qs: string): Record<string, string> {
  const out: Record<string, string> = {}
  if (!qs) return out
  for (const pair of qs.split('&')) {
    if (!pair) continue
    const idx = pair.indexOf('=')
    const k = idx >= 0 ? pair.slice(0, idx) : pair
    const v = idx >= 0 ? pair.slice(idx + 1) : ''
    if (k) out[k] = decode(v)
  }
  return out
}

function matchRoute(pathname: string): { page: string; params: Record<string, string> } {
  // 1. 短路径兼容
  if (SHORT_PATHS[pathname]) pathname = SHORT_PATHS[pathname]
  // 2. 已是小程序页面路径（如 redirect 回跳传回的 fullPath）
  if (pathname.startsWith('/pages/')) return { page: pathname, params: {} }
  // 3. 精确匹配
  const exact = ROUTES.find((r) => r.path === pathname)
  if (exact) return { page: exact.page, params: {} }
  // 4. 动态段匹配
  for (const def of ROUTES) {
    if (!def.keys || !def.keys.length) continue
    const pattern = '^' + def.path.replace(/:[^/]+/g, '([^/]+)') + '$'
    const m = pathname.match(new RegExp(pattern))
    if (m) {
      const params: Record<string, string> = {}
      def.keys.forEach((k, i) => (params[k] = decode(m[i + 1] || '')))
      return { page: def.page, params }
    }
  }
  // 5. 兜底回首页，杜绝白屏
  return { page: '/pages/index/index', params: {} }
}

function normalizeTarget(to: any): { url: string; isTab: boolean } {
  let pathname = ''
  let query: Record<string, any> = {}
  if (typeof to === 'string') {
    const qIdx = to.indexOf('?')
    pathname = qIdx >= 0 ? to.slice(0, qIdx) : to
    query = parseQuery(qIdx >= 0 ? to.slice(qIdx + 1) : '')
  } else if (to && typeof to === 'object') {
    if (to.fullPath && !to.path) {
      const qIdx = to.fullPath.indexOf('?')
      pathname = qIdx >= 0 ? to.fullPath.slice(0, qIdx) : to.fullPath
      query = parseQuery(qIdx >= 0 ? to.fullPath.slice(qIdx + 1) : '')
    } else {
      pathname = to.path || ''
      query = { ...(to.query || {}) }
    }
  }
  const { page, params } = matchRoute(pathname)
  const merged: Record<string, any> = { ...query, ...params }
  const entries = Object.entries(merged).filter(([, v]) => v !== undefined && v !== null && v !== '')
  const qs = entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&')
  return { url: page + (qs ? '?' + qs : ''), isTab: TAB_PAGES.includes(page) }
}

function go(to: any, replace: boolean) {
  const { url, isTab } = normalizeTarget(to)
  if (isTab) {
    uni.switchTab({ url: url.split('?')[0] })
    return
  }
  if (replace) {
    uni.redirectTo({ url, fail: () => uni.reLaunch({ url }) })
  } else if (getCurrentPages().length >= 10) {
    uni.reLaunch({ url })
  } else {
    uni.navigateTo({ url, fail: () => uni.reLaunch({ url }) })
  }
}

/** 构造当前路由对象（query/params 同源；动态段同时挂 params） */
function buildRoute() {
  const pages = getCurrentPages()
  const cur: any = pages[pages.length - 1] || {}
  const rawOpts: Record<string, any> = cur.options || cur.$page?.options || {}
  const opts: Record<string, string> = {}
  for (const [k, v] of Object.entries(rawOpts)) opts[k] = decode(String(v ?? ''))
  const route = '/' + String(cur.route || cur.$page?.path || '').replace(/^\/?/, '')
  const qs = Object.entries(opts)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&')
  const routeObj: any = {
    path: route.replace(/\?.*$/, ''),
    fullPath: qs ? `${route}?${qs}` : route,
    query: { ...opts },
    params: { ...opts },
    name: '',
    meta: {},
    matched: [],
    hash: '',
    redirectedFrom: undefined,
  }
  // 兼容移动端 `router.currentRoute.value.path` 写法：value 自引用
  routeObj.value = routeObj
  return routeObj
}

export const router = {
  push(to: any) {
    go(to, false)
  },
  replace(to: any) {
    go(to, true)
  },
  back(delta?: number) {
    if (typeof delta === 'number' && delta > 1) {
      uni.navigateBack({ delta })
    } else {
      uni.navigateBack({ fail: () => uni.switchTab({ url: '/pages/index/index' }) })
    }
  },
  forward() {
    /* 小程序无前进历史 */
  },
  goSync: go,
  get currentRoute() {
    return buildRoute()
  },
  get route() {
    return buildRoute()
  },
  install(app: any) {
    app.config.globalProperties.$router = router
    app.provide('router', router)
  },
}

export function useRouter() {
  return router
}

export function useRoute() {
  const routeObj = buildRoute()
  // uni-app vue3 小程序：setup 执行时页面尚未入栈，快照取到的是上一页（params 为空）。
  // 注册 onLoad 回调，页面装载后用真实 options 回填（原地变异，保证页面闭包引用有效）。
  try {
    onLoad((_opts: Record<string, any> = {}) => {
      const fresh = buildRoute()
      routeObj.path = fresh.path
      routeObj.fullPath = fresh.fullPath
      routeObj.query = fresh.query
      routeObj.params = fresh.params
      routeObj.value = routeObj
    })
  } catch {
    /* 非 setup 上下文调用忽略 */
  }
  return routeObj
}

// 供 request.ts 等模块直接引入
export function currentRoute() {
  return buildRoute()
}

export function isTabBarPage(pagePath: string): boolean {
  return TAB_PAGES.includes(pagePath)
}

export default router
