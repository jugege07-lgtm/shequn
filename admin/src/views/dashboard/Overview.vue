<template>
  <div class="dashboard" :class="{ 'dashboard--fullscreen': isFullscreen }" ref="dashboardRef">
    <!-- 顶部欢迎栏 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">数据看板</h2>
        <p class="page-subtitle">{{ todayStr }} · 社群名片运营总览</p>
      </div>
      <div class="header-right">
        <el-tooltip content="刷新数据" placement="top">
          <el-button :icon="Refresh" @click="loadDashboard(true)" :loading="loading" circle />
        </el-tooltip>
        <el-tooltip :content="isFullscreen ? '退出全屏 (ESC)' : '进入全屏'" placement="top">
          <el-button :icon="isFullscreen ? Aim : FullScreen" @click="toggleFullscreen" circle />
        </el-tooltip>
        <el-button class="bigscreen-btn" type="primary" :icon="DataLine" @click="$router.push('/bigscreen')">
          进入数据大屏
        </el-button>
      </div>
    </div>

    <!-- 核心 KPI 卡片 -->
    <div class="kpi-grid">
      <div
        v-for="(stat, i) in kpiCards"
        :key="i"
        class="kpi-card"
        :class="`kpi-${stat.theme}`"
      >
        <div class="kpi-icon-wrap">
          <el-icon :size="26"><component :is="stat.icon" /></el-icon>
        </div>
        <div class="kpi-body">
          <div class="kpi-value">{{ formatNumber(stat.value) }}</div>
          <div class="kpi-label">{{ stat.label }}</div>
          <div class="kpi-trend" v-if="stat.trend !== null && stat.trend !== undefined">
            <el-icon :size="12" :color="stat.trend >= 0 ? '#10b981' : '#ef4444'">
              <CaretTop v-if="stat.trend >= 0" /><CaretBottom v-else />
            </el-icon>
            <span :class="stat.trend >= 0 ? 'trend-up' : 'trend-down'">
              {{ stat.trend >= 0 ? '+' : '' }}{{ stat.trend }}%
            </span>
            <span class="trend-text">较昨日</span>
          </div>
        </div>
        <div class="kpi-decoration"></div>
      </div>
    </div>

    <!-- 次要指标 -->
    <div class="sub-stats">
      <div
        v-for="(item, i) in subStats"
        :key="i"
        class="sub-stat-card"
        @click="item.path && $router.push(item.path)"
      >
        <div class="sub-stat-icon" :style="{ background: item.bg, color: item.color }">
          <el-icon :size="18"><component :is="item.icon" /></el-icon>
        </div>
        <div class="sub-stat-info">
          <div class="sub-stat-value">{{ item.value }}</div>
          <div class="sub-stat-label">{{ item.label }}</div>
        </div>
      </div>
    </div>

    <!-- 图表区 -->
    <div class="chart-section">
      <div class="chart-card chart-main">
        <div class="card-header">
          <div class="card-title">
            <span class="title-bar"></span>
            近 7 天营收趋势
          </div>
          <div class="card-extra">
            <span class="legend-item">
              <span class="legend-dot" style="background:#3b82f6"></span>营收(元)
            </span>
            <span class="legend-item">
              <span class="legend-dot" style="background:#10b981"></span>订单数
            </span>
          </div>
        </div>
        <div class="card-body">
          <div ref="lineChartRef" class="chart" v-loading="loading"></div>
        </div>
      </div>

      <div class="chart-card chart-side">
        <div class="card-header">
          <div class="card-title">
            <span class="title-bar"></span>
            用户构成
          </div>
        </div>
        <div class="card-body">
          <div ref="pieChartRef" class="chart" v-loading="loading"></div>
        </div>
      </div>
    </div>

    <!-- 新增用户柱状图 + 待办 -->
    <div class="chart-section">
      <div class="chart-card chart-main">
        <div class="card-header">
          <div class="card-title">
            <span class="title-bar"></span>
            近 7 天新增用户
          </div>
          <el-tag size="small" type="info" effect="plain">单位：人</el-tag>
        </div>
        <div class="card-body">
          <div ref="barChartRef" class="chart" v-loading="loading"></div>
        </div>
      </div>

      <div class="chart-card chart-side">
        <div class="card-header">
          <div class="card-title">
            <span class="title-bar"></span>
            待办事项
          </div>
          <el-tag size="small" type="warning" round>{{ totalPending }} 项</el-tag>
        </div>
        <div class="card-body todo-body">
          <div class="todo-item" @click="$router.push('/activities')">
            <div class="todo-icon todo-icon-warning">
              <el-icon :size="20"><Calendar /></el-icon>
            </div>
            <div class="todo-info">
              <div class="todo-value">{{ dashboardData.pendingActivityCount || 0 }}</div>
              <div class="todo-label">待审核活动</div>
            </div>
            <el-icon class="todo-arrow"><ArrowRight /></el-icon>
          </div>
          <div class="todo-item" @click="$router.push('/businesses')">
            <div class="todo-icon todo-icon-danger">
              <el-icon :size="20"><Connection /></el-icon>
            </div>
            <div class="todo-info">
              <div class="todo-value">{{ dashboardData.pendingBusinessCount || 0 }}</div>
              <div class="todo-label">待审核商机</div>
            </div>
            <el-icon class="todo-arrow"><ArrowRight /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷入口 -->
    <div class="panel-card quick-panel">
      <div class="card-header">
        <div class="card-title">
          <span class="title-bar"></span>
          快捷入口
        </div>
      </div>
      <div class="card-body quick-body">
        <div
          v-for="item in quickLinks"
          :key="item.path"
          class="quick-item"
          @click="$router.push(item.path)"
        >
          <div class="quick-icon" :style="{ background: item.bg, color: item.color }">
            <el-icon :size="20"><component :is="item.icon" /></el-icon>
          </div>
          <div class="quick-label">{{ item.label }}</div>
        </div>
      </div>
    </div>

    <!-- 系统概览 -->
    <div class="panel-card overview-panel">
      <div class="card-header">
        <div class="card-title">
          <span class="title-bar"></span>
          系统概览
        </div>
      </div>
      <div class="card-body" v-loading="loading">
        <div class="overview-grid">
          <div class="overview-item" v-for="item in overviewItems" :key="item.label">
            <div class="overview-label">{{ item.label }}</div>
            <div class="overview-value" :style="{ color: item.color }">{{ item.value }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, shallowRef, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  DataLine, User, ShoppingCart, Calendar, Connection,
  ArrowRight, CaretTop, CaretBottom, Trophy, Goods, List, Money, Setting,
  Refresh, FullScreen, Aim,
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import request from '@/api/request'

const dashboardRef = ref<HTMLElement | null>(null)
const lineChartRef = ref<HTMLDivElement | null>(null)
const pieChartRef = ref<HTMLDivElement | null>(null)
const barChartRef = ref<HTMLDivElement | null>(null)

// 使用 shallowRef 持有图表实例，避免深层响应式造成的不必要重渲染
const lineChartInst = shallowRef<echarts.ECharts | null>(null)
const pieChartInst = shallowRef<echarts.ECharts | null>(null)
const barChartInst = shallowRef<echarts.ECharts | null>(null)

const loading = ref(false)
const isFullscreen = ref(false)
let pollTimer: ReturnType<typeof setInterval> | null = null
const POLL_INTERVAL = 60000

const dashboardData = reactive<any>({
  userCount: 0, vipCount: 0, nonVipCount: 0, activityCount: 0,
  businessCount: 0, productCount: 0, orderCount: 0,
  todayOrders: 0, todayRevenue: 0, pendingActivityCount: 0, pendingBusinessCount: 0,
  // 增长率（%）— 后端按"今日 vs 昨日同期"计算；为 null 时前端不显示
  userTrend: null as number | null,
  todayOrderTrend: null as number | null,
  activityTrend: null as number | null,
  businessTrend: null as number | null,
  last7Days: [] as { date: string; revenue: number; orders: number }[],
  last7DaysUsers: [] as { date: string; count: number }[],
})

const todayStr = computed(() => {
  const d = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${weekdays[d.getDay()]}`
})

// 核心 KPI 卡片：trend 全部来自后端真实计算（今日 vs 昨日同期增长率）
const kpiCards = computed(() => [
  { label: '总用户数', value: dashboardData.userCount || 0, icon: User, theme: 'blue', trend: dashboardData.userTrend },
  { label: '今日订单', value: dashboardData.todayOrders || 0, icon: ShoppingCart, theme: 'green', trend: dashboardData.todayOrderTrend },
  { label: '活动数量', value: dashboardData.activityCount || 0, icon: Calendar, theme: 'amber', trend: dashboardData.activityTrend },
  { label: '商机数量', value: dashboardData.businessCount || 0, icon: Connection, theme: 'purple', trend: dashboardData.businessTrend },
])

// 次要指标
const subStats = computed(() => [
  { label: 'VIP 用户', value: dashboardData.vipCount || 0, icon: Trophy, color: '#f59e0b', bg: '#fef3c7', path: '/vip' },
  { label: '商品数量', value: dashboardData.productCount || 0, icon: Goods, color: '#06b6d4', bg: '#cffafe', path: '/products' },
  { label: '订单总数', value: dashboardData.orderCount || 0, icon: List, color: '#8b5cf6', bg: '#ede9fe', path: '/orders' },
  { label: '今日营收', value: `¥${dashboardData.todayRevenue || 0}`, icon: Money, color: '#10b981', bg: '#d1fae5', path: '/orders' },
  { label: '普通用户', value: dashboardData.nonVipCount || 0, icon: User, color: '#3b82f6', bg: '#dbeafe', path: '/users' },
  { label: '待审核', value: (dashboardData.pendingActivityCount || 0) + (dashboardData.pendingBusinessCount || 0), icon: Calendar, color: '#ef4444', bg: '#fee2e2', path: '/activities' },
])

const totalPending = computed(() =>
  (dashboardData.pendingActivityCount || 0) + (dashboardData.pendingBusinessCount || 0)
)

const quickLinks = [
  { label: '用户管理', path: '/users', icon: User, color: '#3b82f6', bg: '#dbeafe' },
  { label: '活动管理', path: '/activities', icon: Calendar, color: '#10b981', bg: '#d1fae5' },
  { label: '商机管理', path: '/businesses', icon: Connection, color: '#8b5cf6', bg: '#ede9fe' },
  { label: '商品管理', path: '/products', icon: Goods, color: '#06b6d4', bg: '#cffafe' },
  { label: '订单管理', path: '/orders', icon: List, color: '#f59e0b', bg: '#fef3c7' },
  { label: '系统设置', path: '/settings', icon: Setting, color: '#64748b', bg: '#f1f5f9' },
]

const overviewItems = computed(() => [
  { label: '总用户数', value: dashboardData.userCount || 0, color: '#3b82f6' },
  { label: 'VIP用户', value: dashboardData.vipCount || 0, color: '#f59e0b' },
  { label: '活动数量', value: dashboardData.activityCount || 0, color: '#10b981' },
  { label: '商机数量', value: dashboardData.businessCount || 0, color: '#8b5cf6' },
  { label: '商品数量', value: dashboardData.productCount || 0, color: '#06b6d4' },
  { label: '订单总数', value: dashboardData.orderCount || 0, color: '#ec4899' },
  { label: '今日订单', value: dashboardData.todayOrders || 0, color: '#14b8a6' },
  { label: '今日营收', value: `¥${dashboardData.todayRevenue || 0}`, color: '#ef4444' },
])

function formatNumber(n: number): string {
  if (n === null || n === undefined) return '0'
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  return String(n)
}

// ========== 数据加载 ==========
async function loadDashboard(showLoading = false) {
  if (showLoading) loading.value = true
  try {
    const data: any = await request.get('/admin/dashboard')
    if (data) {
      Object.keys(data).forEach((key) => {
        dashboardData[key] = data[key]
      })
      updateCharts()
    }
  } catch (err: any) {
    if (showLoading) ElMessage.error(err.message || '操作失败')
  } finally {
    loading.value = false
  }
}

// ========== 图表初始化（仅一次） ==========
function initCharts() {
  if (lineChartRef.value && !lineChartInst.value) {
    lineChartInst.value = echarts.init(lineChartRef.value)
  }
  if (pieChartRef.value && !pieChartInst.value) {
    pieChartInst.value = echarts.init(pieChartRef.value)
  }
  if (barChartRef.value && !barChartInst.value) {
    barChartInst.value = echarts.init(barChartRef.value)
  }
}

// ========== 图表更新（增量 setOption，不 dispose） ==========
function updateCharts() {
  const last7Days = dashboardData.last7Days || []
  const last7DaysUsers = dashboardData.last7DaysUsers || []

  // 折线图：营收趋势
  if (lineChartInst.value) {
    lineChartInst.value.setOption({
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.98)',
        borderColor: '#e5e7eb',
        textStyle: { color: '#1f2937', fontSize: 12 },
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(59,130,246,0.06)' } },
      },
      legend: { data: ['营收', '订单数'], top: 0, right: 10, textStyle: { fontSize: 12, color: '#6b7280' } },
      grid: { left: '3%', right: '4%', bottom: '3%', top: 40, containLabel: true },
      xAxis: {
        type: 'category',
        data: last7Days.map((d: any) => d.date),
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280', fontSize: 11 },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: 'value', name: '营收(元)',
          nameTextStyle: { color: '#9ca3af', fontSize: 11 },
          axisLine: { show: false },
          axisLabel: { color: '#6b7280', fontSize: 11 },
          splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } },
          axisTick: { show: false },
        },
        {
          type: 'value', name: '订单数',
          nameTextStyle: { color: '#9ca3af', fontSize: 11 },
          axisLine: { show: false },
          axisLabel: { color: '#6b7280', fontSize: 11 },
          splitLine: { show: false },
          axisTick: { show: false },
        },
      ],
      series: [
        {
          name: '营收',
          type: 'line',
          smooth: true,
          yAxisIndex: 0,
          symbol: 'circle',
          symbolSize: 7,
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(59,130,246,0.35)' },
              { offset: 1, color: 'rgba(59,130,246,0.02)' },
            ]),
          },
          itemStyle: { color: '#3b82f6', borderColor: '#fff', borderWidth: 2 },
          lineStyle: { width: 3 },
          data: last7Days.map((d: any) => d.revenue || 0),
        },
        {
          name: '订单数',
          type: 'line',
          smooth: true,
          yAxisIndex: 1,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: { color: '#10b981', borderColor: '#fff', borderWidth: 2 },
          lineStyle: { width: 2, type: 'dashed' },
          data: last7Days.map((d: any) => d.orders || 0),
        },
      ],
    }, false)
    lineChartInst.value.resize()
  }

  // 饼图：用户构成
  if (pieChartInst.value) {
    pieChartInst.value.setOption({
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
        backgroundColor: 'rgba(255,255,255,0.98)',
        borderColor: '#e5e7eb',
        textStyle: { color: '#1f2937', fontSize: 12 },
      },
      legend: {
        bottom: 10,
        textStyle: { color: '#6b7280', fontSize: 12 },
        itemWidth: 10, itemHeight: 10,
        icon: 'circle',
      },
      series: [{
        type: 'pie',
        radius: ['45%', '72%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 3 },
        label: { show: false },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            formatter: '{b}\n{c}人',
            color: '#1f2937',
          },
          scaleSize: 8,
        },
        data: [
          { value: dashboardData.vipCount || 0, name: 'VIP用户', itemStyle: { color: '#f59e0b' } },
          { value: dashboardData.nonVipCount || 0, name: '普通用户', itemStyle: { color: '#3b82f6' } },
        ],
      }],
    }, false)
    pieChartInst.value.resize()
  }

  // 柱状图：新增用户
  if (barChartInst.value) {
    barChartInst.value.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(255,255,255,0.98)',
        borderColor: '#e5e7eb',
        textStyle: { color: '#1f2937', fontSize: 12 },
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: 30, containLabel: true },
      xAxis: {
        type: 'category',
        data: last7DaysUsers.map((d: any) => d.date),
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280', fontSize: 11 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        axisLine: { show: false },
        axisLabel: { color: '#6b7280', fontSize: 11 },
        splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } },
        axisTick: { show: false },
      },
      series: [{
        name: '新增用户',
        type: 'bar',
        barWidth: '45%',
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#6366f1' },
            { offset: 1, color: '#a5b4fc' },
          ]),
        },
        data: last7DaysUsers.map((d: any) => d.count || 0),
      }],
    }, false)
    barChartInst.value.resize()
  }
}

// ========== 全屏模式 ==========
async function toggleFullscreen() {
  if (!dashboardRef.value) return
  const wasFullscreen = !!document.fullscreenElement || isFullscreen.value
  try {
    if (!wasFullscreen) {
      isFullscreen.value = true
      if (dashboardRef.value.requestFullscreen) {
        await dashboardRef.value.requestFullscreen()
      }
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen()
      }
      isFullscreen.value = false
    }
  } catch (err) {
    console.warn('原生全屏不可用，使用 CSS 全屏模式:', err)
  }
  nextTick(() => {
    setTimeout(() => {
      lineChartInst.value?.resize()
      pieChartInst.value?.resize()
      barChartInst.value?.resize()
    }, 200)
  })
}

function handleFullscreenChange() {
  const fs = !!document.fullscreenElement
  isFullscreen.value = fs
  nextTick(() => {
    setTimeout(() => {
      lineChartInst.value?.resize()
      pieChartInst.value?.resize()
      barChartInst.value?.resize()
    }, 200)
  })
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isFullscreen.value && !document.fullscreenElement) {
    isFullscreen.value = false
    nextTick(() => {
      setTimeout(() => {
        lineChartInst.value?.resize()
        pieChartInst.value?.resize()
        barChartInst.value?.resize()
      }, 200)
    })
  }
}

function handleResize() {
  lineChartInst.value?.resize()
  pieChartInst.value?.resize()
  barChartInst.value?.resize()
}

watch(isFullscreen, () => {
  nextTick(() => {
    setTimeout(() => {
      lineChartInst.value?.resize()
      pieChartInst.value?.resize()
      barChartInst.value?.resize()
    }, 200)
  })
})

onMounted(async () => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('keydown', handleKeydown)
  window.addEventListener('resize', handleResize)

  await loadDashboard(true)
  await nextTick()
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      initCharts()
      updateCharts()
    })
  })

  pollTimer = setInterval(() => loadDashboard(false), POLL_INTERVAL)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', handleResize)
  if (pollTimer) clearInterval(pollTimer)
  lineChartInst.value?.dispose()
  pieChartInst.value?.dispose()
  barChartInst.value?.dispose()
})
</script>

<style scoped>
.dashboard {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100%;
  box-sizing: border-box;
}

/* 全屏模式 */
.dashboard--fullscreen {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 9999;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  padding: 32px 40px;
  width: 100vw;
  height: 100vh;
  overflow: auto;
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.page-title {
  font-size: 22px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
}
.dashboard--fullscreen .page-title { color: #f1f5f9; }
.page-subtitle {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
}
.dashboard--fullscreen .page-subtitle { color: #94a3b8; }
.header-right {
  display: flex;
  gap: 10px;
  align-items: center;
}
.bigscreen-btn {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}
.bigscreen-btn:hover {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
}

/* 核心 KPI 网格 */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}
.kpi-card {
  position: relative;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f0f0;
  overflow: hidden;
  transition: all 0.3s ease;
  min-width: 0;
}
.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}
.dashboard--fullscreen .kpi-card {
  background: rgba(30, 41, 59, 0.85);
  border-color: rgba(148, 163, 184, 0.15);
}
.kpi-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.kpi-body {
  flex: 1;
  min-width: 0;
}
.kpi-value {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.2;
  font-family: 'DIN Alternate', 'Helvetica Neue', sans-serif;
}
.dashboard--fullscreen .kpi-value { color: #f1f5f9; }
.kpi-label {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}
.dashboard--fullscreen .kpi-label { color: #94a3b8; }
.kpi-trend {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-top: 6px;
  font-size: 12px;
}
.trend-up { color: #10b981; font-weight: 600; }
.trend-down { color: #ef4444; font-weight: 600; }
.trend-text { color: #9ca3af; margin-left: 4px; }
.kpi-decoration {
  position: absolute;
  top: -30px;
  right: -30px;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  opacity: 0.08;
}

/* KPI 主题色 */
.kpi-blue .kpi-icon-wrap { background: #dbeafe; color: #3b82f6; }
.kpi-blue .kpi-decoration { background: #3b82f6; }
.kpi-green .kpi-icon-wrap { background: #d1fae5; color: #10b981; }
.kpi-green .kpi-decoration { background: #10b981; }
.kpi-amber .kpi-icon-wrap { background: #fef3c7; color: #f59e0b; }
.kpi-amber .kpi-decoration { background: #f59e0b; }
.kpi-purple .kpi-icon-wrap { background: #ede9fe; color: #8b5cf6; }
.kpi-purple .kpi-decoration { background: #8b5cf6; }

/* 次要指标 */
.sub-stats {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}
.sub-stat-card {
  background: #fff;
  border-radius: 10px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  border: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 0;
}
.sub-stat-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  border-color: #d1d5db;
}
.dashboard--fullscreen .sub-stat-card {
  background: rgba(30, 41, 59, 0.85);
  border-color: rgba(148, 163, 184, 0.15);
}
.sub-stat-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.sub-stat-info {
  min-width: 0;
}
.sub-stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.2;
}
.dashboard--fullscreen .sub-stat-value { color: #f1f5f9; }
.sub-stat-label {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}
.dashboard--fullscreen .sub-stat-label { color: #94a3b8; }

/* 图表区 */
.chart-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}
.chart-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f0f0;
  overflow: hidden;
  min-width: 0;
}
.dashboard--fullscreen .chart-card {
  background: rgba(30, 41, 59, 0.85);
  border-color: rgba(148, 163, 184, 0.15);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f3f4f6;
}
.dashboard--fullscreen .card-header { border-bottom-color: rgba(148, 163, 184, 0.15); }
.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}
.dashboard--fullscreen .card-title { color: #f1f5f9; }
.title-bar {
  width: 3px;
  height: 14px;
  background: linear-gradient(180deg, #3b82f6 0%, #8b5cf6 100%);
  border-radius: 2px;
}
.card-extra {
  display: flex;
  gap: 16px;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
}
.dashboard--fullscreen .legend-item { color: #cbd5e1; }
.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.card-body {
  padding: 12px 16px 16px;
}
.chart {
  width: 100%;
  height: 300px;
}

/* 待办列表 */
.todo-body {
  padding: 12px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.todo-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: #f9fafb;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}
.todo-item:hover {
  background: #f3f4f6;
  border-color: #e5e7eb;
  transform: translateX(2px);
}
.dashboard--fullscreen .todo-item {
  background: rgba(51, 65, 85, 0.6);
  border-color: transparent;
}
.dashboard--fullscreen .todo-item:hover {
  background: rgba(51, 65, 85, 0.9);
}
.todo-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.todo-icon-warning { background: #fef3c7; color: #f59e0b; }
.todo-icon-danger { background: #fee2e2; color: #ef4444; }
.todo-info {
  flex: 1;
}
.todo-value {
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.2;
}
.dashboard--fullscreen .todo-value { color: #f1f5f9; }
.todo-label {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}
.dashboard--fullscreen .todo-label { color: #94a3b8; }
.todo-arrow {
  color: #d1d5db;
  transition: transform 0.2s ease;
}
.todo-item:hover .todo-arrow {
  color: #6b7280;
  transform: translateX(3px);
}

/* 快捷入口面板 */
.panel-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f0f0;
  overflow: hidden;
  min-width: 0;
  margin-bottom: 16px;
}
.dashboard--fullscreen .panel-card {
  background: rgba(30, 41, 59, 0.85);
  border-color: rgba(148, 163, 184, 0.15);
}
.quick-body {
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}
.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  background: #f9fafb;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}
.quick-item:hover {
  background: #fff;
  border-color: #e5e7eb;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}
.dashboard--fullscreen .quick-item {
  background: rgba(51, 65, 85, 0.6);
}
.dashboard--fullscreen .quick-item:hover {
  background: rgba(51, 65, 85, 0.9);
}
.quick-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}
.quick-item:hover .quick-icon {
  transform: scale(1.08);
}
.quick-label {
  font-size: 13px;
  color: #374151;
  font-weight: 500;
}
.dashboard--fullscreen .quick-label { color: #cbd5e1; }

/* 系统概览 */
.overview-panel {
  margin-bottom: 0;
}
.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 4px 0;
}
.overview-item {
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-radius: 10px;
  padding: 16px;
  text-align: center;
  transition: all 0.2s ease;
}
.dashboard--fullscreen .overview-item {
  background: linear-gradient(135deg, rgba(51, 65, 85, 0.6) 0%, rgba(30, 41, 59, 0.6) 100%);
}
.overview-item:hover {
  background: linear-gradient(135deg, #fff 0%, #f9fafb 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.dashboard--fullscreen .overview-item:hover {
  background: linear-gradient(135deg, rgba(51, 65, 85, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%);
}
.overview-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 6px;
}
.dashboard--fullscreen .overview-label { color: #94a3b8; }
.overview-value {
  font-size: 22px;
  font-weight: 700;
  font-family: 'DIN Alternate', 'Helvetica Neue', sans-serif;
}

/* 响应式适配 */
@media (max-width: 1400px) {
  .sub-stats { grid-template-columns: repeat(3, 1fr); }
  .quick-body { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 1200px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .chart-section { grid-template-columns: 1fr; }
  .overview-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
