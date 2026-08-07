<template>
  <div class="big-screen-root" ref="rootRef">
    <canvas ref="particleCanvas" class="particle-bg" />
    <div class="screen-container" :style="containerStyle">
      <!-- Header -->
      <header class="screen-header">
        <div class="header-left">
          <div class="status-dot"></div>
          <span class="header-text">系统运行正常</span>
        </div>
        <div class="header-center">
          <div class="title-decoration left" />
          <h1 class="screen-title">聚格软件 · 数据决策大屏</h1>
          <div class="title-decoration right" />
        </div>
        <div class="header-right">
          <button class="fullscreen-btn" @click="toggleFullscreen">
            <svg v-if="!isFullscreen" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 3H5a2 2 0 00-2 2v3M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3M16 21h3a2 2 0 002-2v-3"/></svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 3v3a2 2 0 01-2 2H3M21 8h-3a2 2 0 01-2-2V3M3 16h3a2 2 0 012 2v3M16 21v-3a2 2 0 012-2h3"/></svg>
            <span>{{ isFullscreen ? '退出' : '全屏' }}</span>
          </button>
          <div class="clock-box">
            <span class="clock-time">{{ clockTime }}</span>
            <span class="clock-date">{{ clockDate }}</span>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="screen-main">
        <!-- Left Column -->
        <section class="col col-left">
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">用户增长趋势</span>
              <span class="panel-badge">14天</span>
            </div>
            <div class="panel-body"><div ref="userGrowthRef" class="chart-box" /></div>
          </div>
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">用户来源分布</span>
              <span class="panel-badge">环形图</span>
            </div>
            <div class="panel-body"><div ref="userSourceRef" class="chart-box" /></div>
          </div>
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">用户活跃度</span>
              <span class="panel-badge">柱状图</span>
            </div>
            <div class="panel-body"><div ref="userActivityRef" class="chart-box" /></div>
          </div>
        </section>

        <!-- Center Column -->
        <section class="col col-center">
          <div class="kpi-row">
            <div class="kpi-card" v-for="kpi in kpis" :key="kpi.label">
              <div class="kpi-icon"><component :is="kpi.icon" /></div>
              <div class="kpi-info">
                <div class="kpi-value"><span class="num">{{ kpi.displayValue }}</span><span class="unit">{{ kpi.unit }}</span></div>
                <div class="kpi-label">{{ kpi.label }}</div>
              </div>
              <div class="kpi-glow" />
            </div>
          </div>
          <div class="panel map-panel">
            <div class="panel-header">
              <span class="panel-title">全国用户分布</span>
              <div class="panel-actions">
                <span class="panel-badge">省份级</span>
                <button v-if="currentProvince" class="back-btn" @click="backToChina">返回全国</button>
              </div>
            </div>
            <div class="panel-body">
              <div ref="mapRef" class="chart-box map-chart" />
              <div class="map-legend">
                <div class="legend-item" v-for="lv in mapLegends" :key="lv.label">
                  <span class="legend-color" :style="{ background: lv.color }" />
                  <span class="legend-label">{{ lv.label }}</span>
                </div>
              </div>
              <div v-if="currentProvince" class="province-detail">
                <h3>{{ currentProvince }}</h3>
                <div class="detail-stats">
                  <div class="stat-item"><span class="stat-label">用户数</span><span class="stat-value">{{ provinceData.users }}</span></div>
                  <div class="stat-item"><span class="stat-label">占比</span><span class="stat-value">{{ provinceData.percent }}%</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Right Column -->
        <section class="col col-right">
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">营收与订单趋势</span>
              <span class="panel-badge">14天</span>
            </div>
            <div class="panel-body"><div ref="revenueRef" class="chart-box" /></div>
          </div>
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">VIP 会员分布</span>
              <span class="panel-badge">饼图</span>
            </div>
            <div class="panel-body"><div ref="vipRef" class="chart-box" /></div>
          </div>
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">热门活动类型</span>
              <span class="panel-badge">玫瑰图</span>
            </div>
            <div class="panel-body"><div ref="activityRef" class="chart-box" /></div>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick, shallowRef } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import {
  DataAnalysis, User, Calendar, Connection, ShoppingCart, TrophyBase, Bell, Picture,
  List, Goods, Setting, Ticket, Coin, Document,
} from '@element-plus/icons-vue'
import request from '@/api/request'

// ===== 基础引用 =====
const rootRef = ref<HTMLElement | null>(null)
const particleCanvas = ref<HTMLCanvasElement | null>(null)
const containerStyle = reactive({ transform: 'scale(1)', transformOrigin: 'center center' })

// ===== 图表实例（shallowRef 避免深度响应式开销）=====
const charts: Record<string, echarts.ECharts | null> = {
  userGrowth: null, userSource: null, userActivity: null,
  revenue: null, vip: null, activity: null, map: null,
}
const chartRefs: Record<string, any> = {
  userGrowth: shallowRef(null), userSource: shallowRef(null), userActivity: shallowRef(null),
  revenue: shallowRef(null), vip: shallowRef(null), activity: shallowRef(null), map: shallowRef(null),
}

// ===== 时钟 =====
const clockTime = ref('00:00:00')
const clockDate = ref('')
let clockTimer: ReturnType<typeof setInterval> | null = null

function updateClock() {
  const now = new Date()
  clockTime.value = now.toLocaleTimeString('zh-CN', { hour12: false })
  clockDate.value = now.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
    + ' ' + ['周日','周一','周二','周三','周四','周五','周六'][now.getDay()]
}

// ===== 粒子动画 =====
const particles: { x: number; y: number; vx: number; vy: number; r: number; o: number }[] = []
let particleAnimId: number | null = null
let particleCtx: CanvasRenderingContext2D | null = null

function initParticles() {
  const canvas = particleCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  particleCtx = ctx
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  for (let i = 0; i < 60; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r: Math.random() * 1.5 + 0.5,
      o: Math.random() * 0.4 + 0.1,
    })
  }
  animateParticles()
}

function animateParticles() {
  const canvas = particleCanvas.value
  const ctx = particleCtx
  if (!canvas || !ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  particles.forEach(p => {
    p.x += p.vx; p.y += p.vy
    if (p.x < 0 || p.x > canvas.width) p.vx *= -1
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(0, 212, 255, ${p.o})`
    ctx.fill()
  })
  // 连线
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x
      const dy = particles[i].y - particles[j].y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 120) {
        ctx.beginPath()
        ctx.moveTo(particles[i].x, particles[i].y)
        ctx.lineTo(particles[j].x, particles[j].y)
        ctx.strokeStyle = `rgba(0, 212, 255, ${0.15 * (1 - dist / 120)})`
        ctx.stroke()
      }
    }
  }
  particleAnimId = requestAnimationFrame(animateParticles)
}

// ===== 缩放 =====
function updateScale() {
  if (!rootRef.value) return
  const w = window.innerWidth
  const h = window.innerHeight
  const scaleX = w / 1920
  const scaleY = h / 1080
  const scale = Math.min(scaleX, scaleY)
  containerStyle.transform = `scale(${scale})`
}

// ===== 全屏 =====
const isFullscreen = ref(false)
async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) {
      await rootRef.value?.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  } catch {
    isFullscreen.value = !isFullscreen.value
  }
}
function handleFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
  setTimeout(() => {
    updateScale()
    Object.values(charts).forEach(c => c?.resize())
  }, 300)
}

// ===== 地图 =====
const currentProvince = ref('')
const provinceData = reactive({ users: 0, percent: 0 })
const mapLegends = [
  { label: '1000+', color: '#ffeb3b' },
  { label: '500-1000', color: '#00e5ff' },
  { label: '100-500', color: '#00bcd4' },
  { label: '10-100', color: '#1565c0' },
  { label: '0-10', color: '#0a2e52' },
]
let chinaMapLoaded = false
let geoJsonCache: any = null

async function ensureChinaMap() {
  if (chinaMapLoaded) return true
  if (geoJsonCache) {
    echarts.registerMap('china', geoJsonCache as any)
    chinaMapLoaded = true
    return true
  }
  try {
    const res = await fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
    if (!res.ok) return false
    geoJsonCache = await res.json()
    echarts.registerMap('china', geoJsonCache as any)
    chinaMapLoaded = true
    return true
  } catch {
    return false
  }
}

// ===== 数据加载 =====
const statsData = reactive({
  overview: { userCount: 0, vipCount: 0, nonVipCount: 0, activityCount: 0, businessCount: 0, productCount: 0, orderCount: 0, todayOrders: 0, todayRevenue: 0 },
  userGrowthTrend: [] as any[],     // 近 14 天用户增长（{date, count, total}）
  userSource: [] as any[],          // 用户来源分布
  userActivity: [] as any[],        // 用户活跃度（按 VIP 等级）
  orderRevenueTrend: [] as any[],   // 近 14 天订单/营收
  vipDistribution: [] as any[],     // VIP 等级分布
  activityTypeDistribution: [] as any[],  // 活动类型分布
  provinceDistribution: [] as any[],      // 省份用户分布
  productCategoryDistribution: [] as any[],
})

// KPI 显示值（避免每次数据刷新都触发动画）
const kpis = reactive([
  { label: '总用户数', value: 0, displayValue: '0', unit: '人', icon: User, color: '#409EFF' },
  { label: '今日订单', value: 0, displayValue: '0', unit: '单', icon: ShoppingCart, color: '#67C23A' },
  { label: '活动数量', value: 0, displayValue: '0', unit: '场', icon: Calendar, color: '#E6A23C' },
  { label: '商机数量', value: 0, displayValue: '0', unit: '个', icon: Connection, color: '#F56C6C' },
  { label: 'VIP 用户', value: 0, displayValue: '0', unit: '人', icon: TrophyBase, color: '#E6A23C' },
  { label: '普通用户', value: 0, displayValue: '0', unit: '人', icon: User, color: '#409EFF' },
])

function animateKPI(target: number, kpiIndex: number, duration = 800) {
  const start = performance.now()
  const from = Number(kpis[kpiIndex].displayValue) || 0
  function tick(now: number) {
    const elapsed = now - start
    const progress = Math.min(elapsed / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    kpis[kpiIndex].displayValue = Math.round(from + (target - from) * eased).toLocaleString()
    if (progress < 1) requestAnimationFrame(tick)
    else kpis[kpiIndex].displayValue = target.toLocaleString()
  }
  requestAnimationFrame(tick)
}

async function loadStats() {
  try {
    // 调大屏专用接口（返回 overview + userGrowthTrend + orderRevenueTrend + ... 完整结构）
    const data: any = await request.get('/admin/big-screen')
    if (!data) return

    // 嵌套结构：{ overview: {...}, userGrowthTrend: [...], ... }
    if (data.overview) Object.assign(statsData.overview, data.overview)
    statsData.userGrowthTrend = data.userGrowthTrend || []
    statsData.userSource = data.userSource || []
    statsData.userActivity = data.userActivity || []
    statsData.orderRevenueTrend = data.orderRevenueTrend || []
    statsData.vipDistribution = data.vipDistribution || []
    statsData.activityTypeDistribution = data.activityTypeDistribution || []
    statsData.provinceDistribution = data.provinceDistribution || []
    statsData.productCategoryDistribution = data.productCategoryDistribution || []

    // 更新 KPI
    const newKpis = [
      statsData.overview.userCount || 0,
      statsData.overview.todayOrders || 0,
      statsData.overview.activityCount || 0,
      statsData.overview.businessCount || 0,
      statsData.overview.vipCount || 0,
      statsData.overview.nonVipCount || 0,
    ]
    newKpis.forEach((v, i) => {
      kpis[i].value = v
      animateKPI(v, i)
    })

    // 渲染所有图表
    renderAllCharts()
  } catch (err: any) {
    ElMessage.error(err.message || '加载数据失败')
  }
}

// ===== 图表渲染（增量更新，不销毁重建）=====
const techTooltip = {
  backgroundColor: 'rgba(7, 30, 58, 0.9)', borderColor: '#00d4ff',
  textStyle: { color: '#fff' },
}
const techAxisLine = { lineStyle: { color: 'rgba(0, 212, 255, 0.2)' } }
const techSplitLine = { lineStyle: { color: 'rgba(0, 212, 255, 0.08)' } }
const techGrid = { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true }
const techTextColor = '#8fb8d8'

function getChart(refKey: string) {
  const el = chartRefs[refKey]?.value
  if (!el) return null
  if (!charts[refKey]) {
    charts[refKey] = echarts.init(el as HTMLElement)
  }
  return charts[refKey]
}

function renderAllCharts() {
  renderUserGrowth()
  renderUserSource()
  renderUserActivity()
  renderRevenue()
  renderVip()
  renderActivityType()
  renderMap()
}

function renderUserGrowth() {
  const chart = getChart('userGrowth')
  if (!chart) return
  const data: any[] = statsData.userGrowthTrend || []
  chart.setOption({
    tooltip: { ...techTooltip, trigger: 'axis' },
    legend: { data: ['新增用户', '累计用户'], textStyle: { color: techTextColor, fontSize: 11 }, top: 0, right: 10 },
    grid: { ...techGrid, top: 30 },
    xAxis: { type: 'category', data: data.map((d: any) => d.date), axisLine: techAxisLine, axisLabel: { color: techTextColor, fontSize: 10 } },
    yAxis: [
      { type: 'value', name: '新增', axisLine: techAxisLine, axisLabel: { color: techTextColor, fontSize: 10 }, splitLine: techSplitLine },
      { type: 'value', name: '累计', axisLine: techAxisLine, axisLabel: { color: techTextColor, fontSize: 10 } },
    ],
    series: [
      {
        name: '新增用户',
        type: 'bar',
        data: data.map((d: any) => d.count || 0),
        barWidth: '40%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#00d4ff' },
            { offset: 1, color: '#0066a8' },
          ]),
          borderRadius: [4, 4, 0, 0],
        },
      },
      {
        name: '累计用户',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: data.map((d: any) => d.total || 0),
        lineStyle: { color: '#00ffd4', width: 2 },
        itemStyle: { color: '#00ffd4' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0,255,212,0.3)' },
            { offset: 1, color: 'rgba(0,255,212,0.02)' },
          ]),
        },
      },
    ],
  }, true)
}

function renderUserSource() {
  const chart = getChart('userSource')
  if (!chart) return
  chart.setOption({
    tooltip: { ...techTooltip, trigger: 'item' },
    legend: { bottom: 5, textStyle: { color: techTextColor, fontSize: 11 }, itemWidth: 10, itemHeight: 10 },
    series: [{ type: 'pie', radius: ['45%', '70%'], center: ['50%', '45%'],
      label: { color: techTextColor, formatter: '{b}\n{c}人 ({d}%)', fontSize: 11 },
      data: (statsData.userSource || []).map((d: any, i: number) => ({ ...d, itemStyle: { color: ['#00d4ff', '#7c5cff', '#ffeb3b', '#00e5ff'][i % 4] } })),
    }],
  }, true)
}

function renderUserActivity() {
  const chart = getChart('userActivity')
  if (!chart) return
  chart.setOption({
    tooltip: techTooltip,
    grid: { ...techGrid, left: 80 },
    xAxis: { type: 'value', axisLine: techAxisLine, axisLabel: { color: techTextColor, fontSize: 10 }, splitLine: techSplitLine },
    yAxis: { type: 'category', data: (statsData.userActivity || []).map((d: any) => d.name), axisLine: techAxisLine, axisLabel: { color: techTextColor, fontSize: 11 } },
    series: [{ type: 'bar', data: (statsData.userActivity || []).map((d: any) => d.value), barWidth: '50%',
      itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#1565c0' }, { offset: 1, color: '#00e5ff' }]), borderRadius: [0, 4, 4, 0] },
      label: { show: true, position: 'right', color: '#00e5ff', fontSize: 11, formatter: '{c}' },
    }],
  }, true)
}

function renderRevenue() {
  const chart = getChart('revenue')
  if (!chart) return
  chart.setOption({
    tooltip: techTooltip,
    legend: { data: ['订单数', '营收(元)'], textStyle: { color: techTextColor, fontSize: 11 }, right: 10, top: 0 },
    grid: techGrid,
    xAxis: { type: 'category', data: statsData.orderRevenueTrend.map((d: any) => d.date), axisLine: techAxisLine, axisLabel: { color: techTextColor, fontSize: 10 } },
    yAxis: [
      { type: 'value', name: '订单', axisLine: techAxisLine, axisLabel: { color: techTextColor, fontSize: 10 }, splitLine: techSplitLine },
      { type: 'value', name: '营收', axisLine: techAxisLine, axisLabel: { color: techTextColor, fontSize: 10 }, splitLine: { show: false } },
    ],
    series: [
      { name: '订单数', type: 'bar', data: statsData.orderRevenueTrend.map((d: any) => d.orders), barWidth: '40%',
        itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#7c5cff' }, { offset: 1, color: '#3d2cb5' }]), borderRadius: [4, 4, 0, 0] } },
      { name: '营收(元)', type: 'line', yAxisIndex: 1, smooth: true, data: statsData.orderRevenueTrend.map((d: any) => d.revenue),
        lineStyle: { color: '#00ffd4', width: 2 }, itemStyle: { color: '#00ffd4' },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(0,255,212,0.3)' }, { offset: 1, color: 'rgba(0,255,212,0.02)' }]) },
    }],
  }, true)
}

function renderVip() {
  const chart = getChart('vip')
  if (!chart) return
  chart.setOption({
    tooltip: { ...techTooltip, trigger: 'item' },
    legend: { bottom: 5, textStyle: { color: techTextColor, fontSize: 11 }, itemWidth: 10, itemHeight: 10 },
    series: [{ type: 'pie', radius: '65%', center: ['50%', '45%'],
      label: { color: techTextColor, fontSize: 11, formatter: '{b}: {c} ({d}%)' },
      data: (statsData.vipDistribution || []).map((d: any, i: number) => ({ ...d, itemStyle: { color: ['#1565c0', '#00d4ff', '#00e5ff', '#ffeb3b', '#ff9800'][i % 5] } })),
    }],
  }, true)
}

function renderActivityType() {
  const chart = getChart('activity')
  if (!chart) return
  chart.setOption({
    tooltip: { ...techTooltip, trigger: 'item' },
    legend: { bottom: 5, textStyle: { color: techTextColor, fontSize: 11 }, itemWidth: 10, itemHeight: 10 },
    series: [{ type: 'pie', radius: ['20%', '70%'], center: ['50%', '45%'], roseType: 'area',
      label: { color: techTextColor, fontSize: 11, formatter: '{b}: {c}' },
      data: (statsData.activityTypeDistribution || []).map((d: any, i: number) => ({ ...d, itemStyle: { color: ['#00d4ff', '#7c5cff', '#ffeb3b', '#00e5ff', '#ff9800', '#a0ffe6'][i % 6] } })),
    }],
  }, true)
}

function renderMap() {
  const chart = getChart('map')
  if (!chart) return
  const provinceData = statsData.provinceDistribution || []
  const maxVal = Math.max(...provinceData.map((p: any) => p.value), 1)
  chart.setOption({
    tooltip: { ...techTooltip, trigger: 'item', formatter: (p: any) => p.data ? `${p.name}<br/>用户数: ${p.value} 人` : `${p.name}<br/>暂无数据` },
    visualMap: { type: 'continuous', min: 0, max: maxVal, left: 20, bottom: 20, text: ['多', '少'],
      textStyle: { color: techTextColor, fontSize: 11 },
      inRange: { color: ['#0a2e52', '#1565c0', '#00bcd4', '#00e5ff', '#ffeb3b'] }, calculable: true, },
    geo: { map: 'china', roam: false, zoom: 1.15, layoutCenter: ['50%', '66%'], layoutSize: '115%', aspectScale: 0.80,
      label: { show: false }, itemStyle: { areaColor: 'rgba(10,46,82,0.6)', borderColor: 'rgba(0,212,255,0.4)', borderWidth: 1 },
      emphasis: { itemStyle: { areaColor: 'rgba(0,212,255,0.3)', borderColor: '#00d4ff', borderWidth: 2 }, label: { color: '#fff', fontSize: 11 } }, },
    series: [{ type: 'map', map: 'china', geoIndex: 0, data: provinceData.map((p: any) => ({ name: p.name, value: p.value })) }],
  }, true)
}

// 地图点击
function handleMapClick(params: any) {
  if (!params.name) return
  const prov = statsData.provinceDistribution?.find((p: any) => p.name === params.name)
  if (prov) {
    currentProvince.value = params.name
    provinceData.users = prov.value
    provinceData.percent = Number((((prov.value / (statsData.overview.userCount || 1)) * 100)).toFixed(2))
  }
}
function backToChina() { currentProvince.value = '' }

// ===== 定时刷新 =====
let refreshTimer: ReturnType<typeof setInterval> | null = null
const POLL_INTERVAL = 60000

function startPolling() {
  refreshTimer = setInterval(() => loadStats(), POLL_INTERVAL)
}

// ===== 窗口缩放 =====
let resizeRafId: number | null = null
let lastResizeW = 0
let lastResizeH = 0
function handleResize() {
  if (resizeRafId) cancelAnimationFrame(resizeRafId)
  resizeRafId = requestAnimationFrame(() => {
    updateScale()
    // 只在视口真正变化时 resize 图表
    const vw = window.innerWidth, vh = window.innerHeight
    if (vw !== lastResizeW || vh !== lastResizeH) {
      lastResizeW = vw
      lastResizeH = vh
      Object.values(charts).forEach(c => c?.resize())
    }
  })
}

// ===== 生命周期 =====
onMounted(async () => {
  updateScale()
  updateClock()
  initParticles()
  clockTimer = setInterval(updateClock, 1000)
  window.addEventListener('resize', handleResize)
  document.addEventListener('fullscreenchange', handleFullscreenChange)

  await nextTick()
  await new Promise(r => setTimeout(r, 100))
  await loadStats()
  startPolling()
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
  if (refreshTimer) clearInterval(refreshTimer)
  if (particleAnimId) cancelAnimationFrame(particleAnimId)
  if (resizeRafId) cancelAnimationFrame(resizeRafId)
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
  Object.values(charts).forEach(c => c?.dispose())
})
</script>

<style scoped>
.big-screen-root { position: fixed; inset: 0; background: #050b1a; overflow: hidden; color: #fff; font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif; display: flex; align-items: center; justify-content: center; }
.particle-bg { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
.screen-container { position: relative; flex-shrink: 0; display: flex; flex-direction: column; z-index: 1; contain: layout style; width: 1920px; height: 1080px; }

.screen-header { height: 70px; background: linear-gradient(180deg, rgba(0,40,80,0.6), transparent); display: flex; align-items: center; justify-content: space-between; padding: 0 30px; border-bottom: 1px solid rgba(0,212,255,0.2); position: relative; }
.screen-header::after { content: ''; position: absolute; left: 50%; bottom: 0; width: 60%; height: 1px; background: linear-gradient(90deg, transparent, #00d4ff, transparent); transform: translateX(-50%); }
.header-left, .header-right { display: flex; align-items: center; gap: 12px; width: 280px; }
.header-right { justify-content: flex-end; }
.header-center { display: flex; align-items: center; gap: 20px; }
.header-text { color: #8fb8d8; font-size: 13px; }
.fullscreen-btn { display: flex; align-items: center; gap: 6px; padding: 6px 14px; background: rgba(0,212,255,0.1); border: 1px solid rgba(0,212,255,0.4); border-radius: 6px; color: #00d4ff; font-size: 12px; cursor: pointer; transition: border-color 0.2s, box-shadow 0.2s; font-family: inherit; }
.fullscreen-btn:hover { background: rgba(0,212,255,0.25); border-color: #00d4ff; box-shadow: 0 0 12px rgba(0,212,255,0.4); }
.fullscreen-btn svg { width: 14px; height: 14px; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; background: #00ff88; box-shadow: 0 0 8px #00ff88; animation: pulse 1.5s ease-in-out infinite; }
@keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.2); } }
.screen-title { font-size: 28px; font-weight: 800; letter-spacing: 4px; background: linear-gradient(180deg, #fff, #00d4ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.title-decoration { width: 80px; height: 2px; background: linear-gradient(90deg, transparent, #00d4ff); }
.title-decoration.right { background: linear-gradient(90deg, #00d4ff, transparent); }
.clock-box { display: flex; flex-direction: column; align-items: flex-end; }
.clock-time { font-size: 24px; font-weight: 700; color: #00d4ff; font-family: 'Consolas', monospace; text-shadow: 0 0 10px rgba(0,212,255,0.6); letter-spacing: 2px; }
.clock-date { font-size: 12px; color: #8fb8d8; }

.screen-main { flex: 1; display: grid; grid-template-columns: 380px 1fr 380px; gap: 15px; padding: 15px; min-height: 0; }
.col { display: flex; flex-direction: column; gap: 15px; min-height: 0; }

.panel { background: linear-gradient(135deg, rgba(10,30,58,0.85), rgba(5,15,35,0.95)); border: 1px solid rgba(0,212,255,0.2); border-radius: 4px; display: flex; flex-direction: column; position: relative; overflow: hidden; flex: 1; min-height: 0; }
.panel::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 1px; background: linear-gradient(90deg, transparent, #00d4ff 50%, transparent); }
.panel::after { content: ''; position: absolute; top: 0; left: 0; width: 12px; height: 12px; border-top: 2px solid #00d4ff; border-left: 2px solid #00d4ff; }
.panel-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 14px; border-bottom: 1px solid rgba(0,212,255,0.15); background: rgba(0,30,60,0.3); }
.panel-title { font-size: 14px; font-weight: 600; color: #fff; letter-spacing: 1px; position: relative; padding-left: 10px; }
.panel-title::before { content: ''; position: absolute; left: 0; top: 50%; width: 3px; height: 14px; background: #00d4ff; transform: translateY(-50%); box-shadow: 0 0 6px #00d4ff; }
.panel-badge { font-size: 10px; color: #00d4ff; padding: 2px 8px; border: 1px solid rgba(0,212,255,0.4); border-radius: 10px; background: rgba(0,212,255,0.1); }
.panel-actions { display: flex; align-items: center; gap: 8px; }
.back-btn { font-size: 11px; color: #00d4ff; background: none; border: 1px solid rgba(0,212,255,0.3); padding: 2px 8px; border-radius: 4px; cursor: pointer; }
.panel-body { flex: 1; position: relative; min-height: 0; padding: 4px; }
.chart-box { width: 100%; height: 100%; min-height: 150px; will-change: transform; }

.kpi-row { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; margin-bottom: 0; }
.kpi-card { background: linear-gradient(135deg, rgba(0,50,100,0.4), rgba(0,20,50,0.6)); border: 1px solid rgba(0,212,255,0.3); border-radius: 4px; padding: 12px 14px; display: flex; align-items: center; gap: 10px; position: relative; overflow: hidden; transition: border-color 0.3s, box-shadow 0.3s; }
.kpi-card:hover { border-color: #00d4ff; box-shadow: 0 0 20px rgba(0,212,255,0.3); }
.kpi-icon { width: 38px; height: 38px; border-radius: 6px; display: flex; align-items: center; justify-content: center; background: rgba(0,212,255,0.15); color: #00d4ff; font-size: 20px; }
.kpi-info { flex: 1; min-width: 0; }
.kpi-value { display: flex; align-items: baseline; gap: 3px; margin-bottom: 2px; }
.kpi-value .num { font-size: 22px; font-weight: 800; color: #00e5ff; font-family: 'Consolas', monospace; text-shadow: 0 0 8px rgba(0,229,255,0.5); }
.kpi-value .unit { font-size: 11px; color: #8fb8d8; }
.kpi-label { font-size: 12px; color: #8fb8d8; letter-spacing: 0.5px; }
.kpi-glow { position: absolute; top: -50%; right: -50%; width: 100%; height: 100%; background: radial-gradient(circle, rgba(0,212,255,0.15), transparent 70%); pointer-events: none; }

.map-panel { flex: 3; }
.map-chart { min-height: 320px; }
.map-legend { display: flex; flex-wrap: wrap; gap: 8px; padding: 4px 8px; }
.legend-item { display: flex; align-items: center; gap: 4px; font-size: 10px; color: #8fb8d8; }
.legend-color { width: 10px; height: 10px; border-radius: 2px; }
.province-detail { padding: 8px 14px; background: rgba(0,30,60,0.4); border-radius: 4px; margin: 4px; }
.province-detail h3 { font-size: 14px; color: #00d4ff; margin-bottom: 6px; }
.detail-stats { display: flex; gap: 20px; }
.stat-item { display: flex; gap: 6px; font-size: 12px; }
.stat-label { color: #8fb8d8; }
.stat-value { color: #00e5ff; font-weight: 700; }
</style>
