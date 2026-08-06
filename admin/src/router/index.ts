import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

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
    meta: { title: '数据大屏', requiresAuth: true, fullscreen: true },
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
        meta: { title: '数据看板', icon: 'DataAnalysis' },
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/users/UserList.vue'),
        meta: { title: '用户管理', icon: 'User' },
      },
      {
        path: 'activities',
        name: 'Activities',
        component: () => import('@/views/activities/ActivityList.vue'),
        meta: { title: '活动管理', icon: 'Calendar' },
      },
      {
        path: 'activities/detail/:id',
        name: 'ActivityDetail',
        component: () => import('@/views/activities/ActivityDetail.vue'),
        meta: { title: '活动详情', hidden: true, activeMenu: '/activities' },
      },
      {
        path: 'activities/create',
        name: 'ActivityCreate',
        component: () => import('@/views/activities/ActivityCreate.vue'),
        meta: { title: '新增活动', icon: 'Calendar', hidden: true, activeMenu: '/activities' },
      },
      {
        path: 'businesses',
        name: 'Businesses',
        component: () => import('@/views/business/BusinessList.vue'),
        meta: { title: '商机管理', icon: 'Connection' },
      },
      {
        path: 'businesses/detail/:id',
        name: 'BusinessDetail',
        component: () => import('@/views/business/BusinessDetail.vue'),
        meta: { title: '商机详情', hidden: true, activeMenu: '/businesses' },
      },
      {
        path: 'businesses/create',
        name: 'BusinessCreate',
        component: () => import('@/views/business/BusinessCreate.vue'),
        meta: { title: '新增商机', icon: 'Connection', hidden: true, activeMenu: '/businesses' },
      },
      {
        path: 'products',
        name: 'Products',
        component: () => import('@/views/mall/ProductList.vue'),
        meta: { title: '商品管理', icon: 'Goods' },
      },
      {
        path: 'products/create',
        name: 'ProductCreate',
        component: () => import('@/views/mall/ProductCreate.vue'),
        meta: { title: '新增商品', icon: 'Goods', hidden: true, activeMenu: '/products' },
      },
      {
        path: 'products/edit/:id',
        name: 'ProductEdit',
        component: () => import('@/views/mall/ProductCreate.vue'),
        meta: { title: '编辑商品', icon: 'Goods', hidden: true, activeMenu: '/products' },
      },
      {
        path: 'category-management',
        name: 'CategoryManagement',
        component: () => import('@/views/mall/CategoryManagement.vue'),
        meta: { title: '分类管理', icon: 'Notebook' },
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/orders/OrderList.vue'),
        meta: { title: '订单管理', icon: 'List' },
      },
      {
        path: 'vip',
        name: 'VIP',
        component: () => import('@/views/vip/VipPlanList.vue'),
        meta: { title: 'VIP管理', icon: 'VIP' },
      },
      {
        path: 'notifications',
        name: 'Notifications',
        component: () => import('@/views/notifications/Index.vue'),
        meta: { title: '消息管理', icon: 'Bell' },
      },
      {
        path: 'banners',
        name: 'Banners',
        component: () => import('@/views/banners/Index.vue'),
        meta: { title: 'Banner管理', icon: 'Picture' },
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/settings/Index.vue'),
        meta: { title: '系统设置', icon: 'Setting' },
      },
      {
        path: 'coupons',
        name: 'Coupons',
        component: () => import('@/views/coupons/Index.vue'),
        meta: { title: '优惠券管理', icon: 'Ticket' },
      },
      {
        path: 'points/rules',
        name: 'PointRules',
        component: () => import('@/views/points/Index.vue'),
        meta: { title: '积分规则', icon: 'Coin' },
      },
      {
        path: 'points/logs',
        name: 'PointLogs',
        component: () => import('@/views/points/Logs.vue'),
        meta: { title: '积分明细', icon: 'Document' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 导航守卫
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('admin_token')
  
  // 如果访问登录页且有 token，跳转到首页
  if (to.path === '/login' && token) {
    next('/')
    return
  }
  
  // 如果需要认证但没有 token，跳转到登录页
  if (to.meta.requiresAuth !== false && !token) {
    next('/login')
    return
  }
  
  next()
})

export default router
