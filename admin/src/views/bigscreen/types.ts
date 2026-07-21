/**
 * 数据大屏 - 类型定义
 *
 * 与后端 GET /admin/big-screen 返回结构保持一致
 * 后端实参：backend/src/modules/system/system.service.ts -> getBigScreenStats()
 */

export interface NameValuePair {
  name: string
  value: number
}

export interface UserGrowthPoint {
  date: string
  count: number
  total: number
}

export interface OrderRevenuePoint {
  date: string
  orders: number
  revenue: number
}

export interface OverviewStats {
  userCount: number
  vipCount: number
  activityCount: number
  businessCount: number
  productCount: number
  orderCount: number
  todayOrders: number
  todayRevenue: number
}

export interface BigScreenData {
  overview: OverviewStats
  userGrowthTrend: UserGrowthPoint[]
  userSource: NameValuePair[]
  userActivity: NameValuePair[]
  orderRevenueTrend: OrderRevenuePoint[]
  vipDistribution: NameValuePair[]
  activityTypeDistribution: NameValuePair[]
  provinceDistribution: NameValuePair[]
  productCategoryDistribution: NameValuePair[]
}
