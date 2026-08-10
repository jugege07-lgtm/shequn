import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { hasAnyRole, clearAdminUser } from '@/utils/permission'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { title: '登录', requiresAuth: false },
  },
  {
    path: '/bigscreen',
    name: 'BigScreen',
    component: () => import('@/views/bigscreen/Index.vue'),
    meta: { title: '数据大屏', requiresAuth: true, fullscreen: true, roles: ['admin', 'editor', 'moderator', 'operator'] },
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/layouts/DefaultLayout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/Overview.vue'),
        meta: { title: '数据看板', icon: 'DataAnalysis', roles: ['admin', 'editor', 'moderator', 'operator'] },
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/users/UserList.vue'),
        meta: { title: '用户管理', icon: 'User', roles: ['admin'] },
      },
      {
        path: 'activities',
        name: 'Activities',
        component: () => import('@/views/activities/ActivityList.vue'),
        meta: { title: '活动管理', icon: 'Calendar', roles: ['admin', 'editor', 'moderator', 'operator'] },
      },
      {
        path: 'activities/detail/:id',
        name: 'ActivityDetail',
        component: () => import('@/views/activities/ActivityDetail.vue'),
        meta: { title: '活动详情', hidden: true, activeMenu: '/activities', roles: ['admin', 'editor', 'moderator', 'operator'] },
      },
      {
        path: 'activities/create',
        name: 'ActivityCreate',
        component: () => import('@/views/activities/ActivityCreate.vue'),
        meta: { title: '新增活动', icon: 'Calendar', hidden: true, activeMenu: '/activities', roles: ['admin', 'editor'] },
      },
      {
        path: 'businesses',
        name: 'Businesses',
        component: () => import('@/views/business/BusinessList.vue'),
        meta: { title: '商机管理', icon: 'Connection', roles: ['admin', 'editor', 'moderator', 'operator'] },
      },
      {
        path: 'businesses/detail/:id',
        name: 'BusinessDetail',
        component: () => import('@/views/business/BusinessDetail.vue'),
        meta: { title: '商机详情', hidden: true, activeMenu: '/businesses', roles: ['admin', 'editor', 'moderator', 'operator'] },
      },
      {
        path: 'businesses/create',
        name: 'BusinessCreate',
        component: () => import('@/views/business/BusinessCreate.vue'),
        meta: { title: '新增商机', icon: 'Connection', hidden: true, activeMenu: '/businesses', roles: ['admin', 'editor'] },
      },
      {
        path: 'products',
        name: 'Products',
        component: () => import('@/views/mall/ProductList.vue'),
        meta: { title: '商品管理', icon: 'Goods', roles: ['admin', 'editor'] },
      },
      {
        path: 'products/create',
        name: 'ProductCreate',
        component: () => import('@/views/mall/ProductCreate.vue'),
        meta: { title: '新增商品', icon: 'Goods', hidden: true, activeMenu: '/products', roles: ['admin', 'editor'] },
      },
      {
        path: 'products/edit/:id',
        name: 'ProductEdit',
        component: () => import('@/views/mall/ProductCreate.vue'),
        meta: { title: '编辑商品', icon: 'Goods', hidden: true, activeMenu: '/products', roles: ['admin', 'editor'] },
      },
      {
        path: 'category-management',
        name: 'CategoryManagement',
        component: () => import('@/views/mall/BusinessCategoryManagement.vue'),
        meta: { title: '商机分类', icon: 'Notebook', activeMenu: '/category-management', roles: ['admin', 'editor'] },
      },
      {
        path: 'product-category-management',
        name: 'ProductCategoryManagement',
        component: () => import('@/views/mall/ProductCategoryManagement.vue'),
        meta: { title: '商品分类', icon: 'GoodsFilled', activeMenu: '/category-management', roles: ['admin', 'editor'] },
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/orders/OrderList.vue'),
        meta: { title: '订单管理', icon: 'List', roles: ['admin', 'operator'] },
      },
      {
        path: 'vip',
        name: 'VIP',
        component: () => import('@/views/vip/VipPlanList.vue'),
        meta: { title: 'VIP管理', icon: 'VIP', roles: ['admin', 'operator'] },
      },
      {
        path: 'notifications',
        name: 'Notifications',
        component: () => import('@/views/notifications/Index.vue'),
        meta: { title: '消息管理', icon: 'Bell', roles: ['admin', 'operator'] },
      },
      {
        path: 'banners',
        name: 'Banners',
        component: () => import('@/views/banners/Index.vue'),
        meta: { title: 'Banner管理', icon: 'Picture', roles: ['admin', 'operator'] },
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/settings/Index.vue'),
        meta: { title: '系统设置', icon: 'Setting', roles: ['admin'] },
      },
      {
        path: 'coupons',
        name: 'Coupons',
        component: () => import('@/views/coupons/Index.vue'),
        meta: { title: '优惠券管理', icon: 'Ticket', roles: ['admin', 'operator'] },
      },
      {
        path: 'points/rules',
        name: 'PointRules',
        component: () => import('@/views/points/Index.vue'),
        meta: { title: '积分规则', icon: 'Coin', roles: ['admin', 'operator'] },
      },
      {
        path: 'points/logs',
        name: 'PointLogs',
        component: () => import('@/views/points/Logs.vue'),
        meta: { title: '积分明细', icon: 'Document', roles: ['admin', 'operator'] },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory('/admin/'),
  routes,
})

// 导航守卫
const STAFF_ROLES = ['admin', 'editor', 'moderator', 'operator']
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('admin_token')

  // 访问登录页：有有效角色才回首页，否则停留在登录页（清理无效会话）
  if (to.path === '/login') {
    if (token && hasAnyRole(STAFF_ROLES)) {
      next('/')
      return
    }
    next()
    return
  }

  // 需要认证但没有 token，跳转到登录页
  if (to.meta.requiresAuth !== false && !token) {
    next('/login')
    return
  }

  // 有 token 但无有效后台角色（旧版本遗留 token / 被降权）→ 清理会话回登录页，避免看板死循环
  if (token && !hasAnyRole(STAFF_ROLES)) {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_refreshToken')
    clearAdminUser()
    next('/login')
    return
  }

  // 角色权限校验：页面声明了允许角色且当前用户不满足时，跳到数据看板
  const allowed = (to.meta.roles as string[]) || []
  if (token && allowed.length > 0 && !hasAnyRole(allowed)) {
    // 已在看板仍无权（不应发生）→ 回登录页，防止自身重定向死循环
    if (to.path === '/dashboard') {
      next('/login')
      return
    }
    next('/dashboard')
    return
  }

  next()
})

export default router
