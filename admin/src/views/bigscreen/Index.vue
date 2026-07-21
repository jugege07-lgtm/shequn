<template>
  <div class="big-screen-root" ref="rootRef">
    <!-- 粒子背景层 -->
    <canvas ref="particleCanvas" class="particle-bg"></canvas>

    <!-- 缩放容器（基于 1920x1080 设计稿） -->
    <div class="screen-container" :style="containerStyle">
      <!-- 顶部标题栏 -->
      <header class="screen-header">
        <div class="header-left">
          <div class="status-dot"></div>
          <span class="header-text">系统运行正常</span>
        </div>
        <div class="header-center">
          <div class="title-decoration left"></div>
          <h1 class="screen-title">聚格软件 · 数据决策大屏</h1>
          <div class="title-decoration right"></div>
        </div>
        <div class="header-right">
          <button class="fullscreen-btn" @click="toggleFullscreen" :title="isFullscreen ? '退出全屏 (ESC)' : '进入全屏'">
            <svg v-if="!isFullscreen" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3"/>
            </svg>
            <span class="fullscreen-text">{{ isFullscreen ? '退出' : '全屏' }}</span>
          </button>
          <div class="clock-box">
            <span class="clock-time">{{ currentTime.time }}</span>
            <span class="clock-date">{{ currentTime.date }} {{ currentTime.weekday }}</span>
          </div>
        </div>
      </header>

      <!-- 主体三栏布局 -->
      <main class="screen-main">
        <!-- 左栏 -->
        <section class="col col-left">
          <!-- 用户增长趋势 -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">用户增长趋势</span>
              <span class="panel-badge">14天</span>
            </div>
            <div class="panel-body">
              <div ref="userGrowthChartRef" class="chart-box"></div>
            </div>
          </div>

          <!-- 用户来源分布 -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">用户来源分布</span>
              <span class="panel-badge">环形图</span>
            </div>
            <div class="panel-body">
              <div ref="userSourceChartRef" class="chart-box"></div>
            </div>
          </div>

          <!-- 用户活跃度 -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">用户活跃度统计</span>
              <span class="panel-badge">柱状图</span>
            </div>
            <div class="panel-body">
              <div ref="userActivityChartRef" class="chart-box"></div>
            </div>
          </div>
        </section>

        <!-- 中栏（核心区） -->
        <section class="col col-center">
          <!-- 核心指标卡 -->
          <div class="kpi-row">
            <div class="kpi-card" v-for="(kpi, i) in kpiList" :key="kpi.label" :class="`kpi-${i}`" v-memo="[kpi.value]">
              <div class="kpi-icon">
                <component :is="kpi.icon" />
              </div>
              <div class="kpi-info">
                <div class="kpi-value">
                  <span class="num">{{ animateValue(kpi.value, i) }}</span>
                  <span class="unit">{{ kpi.unit }}</span>
                </div>
                <div class="kpi-label">{{ kpi.label }}</div>
              </div>
              <div class="kpi-glow"></div>
            </div>
          </div>

          <!-- 中国地图 -->
          <div class="panel map-panel">
            <div class="panel-header">
              <span class="panel-title">全国用户分布地图</span>
              <div class="panel-actions">
                <span class="panel-badge">省份级</span>
                <button v-if="currentProvince" class="back-btn" @click="backToChina">返回全国</button>
              </div>
            </div>
            <div class="panel-body">
              <div ref="mapChartRef" class="chart-box map-chart"></div>
              <div class="map-legend">
                <div class="legend-item" v-for="lv in mapLegend" :key="lv.label">
                  <span class="legend-color" :style="{ background: lv.color }"></span>
                  <span class="legend-label">{{ lv.label }}</span>
                </div>
              </div>
              <div v-if="currentProvince" class="province-detail">
                <h3>{{ currentProvince }}</h3>
                <div class="detail-stats">
                  <div class="stat-item">
                    <span class="stat-label">用户数</span>
                    <span class="stat-value">{{ currentProvinceData.users }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">占比</span>
                    <span class="stat-value">{{ currentProvinceData.percent }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 轮播面板 -->
          <div class="panel carousel-panel">
            <div class="panel-header">
              <span class="panel-title">{{ carouselPanels[activeCarousel].title }}</span>
              <div class="carousel-dots">
                <span
                  v-for="(p, i) in carouselPanels"
                  :key="i"
                  class="dot"
                  :class="{ active: i === activeCarousel }"
                  @click="switchCarousel(i)"
                ></span>
              </div>
            </div>
            <div class="panel-body">
              <div ref="carouselChartRef" class="chart-box"></div>
            </div>
          </div>
        </section>

        <!-- 右栏 -->
        <section class="col col-right">
          <!-- 订单营收趋势 -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">订单营收趋势</span>
              <span class="panel-badge">14天</span>
            </div>
            <div class="panel-body">
              <div ref="revenueChartRef" class="chart-box"></div>
            </div>
          </div>

          <!-- VIP 等级分布 -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">VIP 等级分布</span>
              <span class="panel-badge">饼图</span>
            </div>
            <div class="panel-body">
              <div ref="vipChartRef" class="chart-box"></div>
            </div>
          </div>

          <!-- 活动类型分布 -->
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">活动类型分布</span>
              <span class="panel-badge">玫瑰图</span>
            </div>
            <div class="panel-body">
              <div ref="activityTypeChartRef" class="chart-box"></div>
            </div>
          </div>
        </section>
      </main>

      <!-- 底部状态栏 -->
      <footer class="screen-footer">
        <div class="footer-section">
          <span class="footer-label">数据刷新频率：</span>
          <select v-model.number="refreshInterval" class="footer-select" @change="resetRefreshTimer">
            <option :value="10">10秒</option>
            <option :value="30">30秒</option>
            <option :value="60">60秒</option>
            <option :value="300">5分钟</option>
          </select>
        </div>
        <div class="footer-section">
          <span class="footer-label">轮播间隔：</span>
          <select v-model.number="carouselInterval" class="footer-select" @change="resetCarouselTimer">
            <option :value="5">5秒</option>
            <option :value="10">10秒</option>
            <option :value="15">15秒</option>
            <option :value="30">30秒</option>
          </select>
        </div>
        <div class="footer-section">
          <span class="footer-label">上次刷新：</span>
          <span class="footer-value">{{ lastRefreshTime }}</span>
        </div>
        <div class="footer-section">
          <span class="footer-label">下次刷新：</span>
          <span class="footer-value">{{ nextRefreshCountdown }}s</span>
        </div>
        <div class="footer-section footer-status">
          <span class="status-dot"></span>
          <span>数据同步中</span>
        </div>
        <div class="footer-section footer-version">v1.0.0 · Powered by 聚格软件</div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, shallowRef, onMounted, onUnmounted, nextTick, computed, triggerRef } from 'vue'
import * as echarts from 'echarts'
import request from '@/api/request'

// ============ 响应式缩放 ============
const rootRef = ref<HTMLElement | null>(null)
const scale = ref(1)
const isFullscreen = ref(false)
const containerStyle = computed(() => ({
  transform: `scale(${scale.value})`,
  transformOrigin: 'top left',
  width: '1920px',
  height: '1080px',
}))

function updateScale() {
  if (!rootRef.value) return
  const w = window.innerWidth
  const h = window.innerHeight
  const sx = w / 1920
  const sy = h / 1080
  scale.value = Math.min(sx, sy)
}

// ============ 全屏模式 ============
async function toggleFullscreen() {
  if (!rootRef.value) return
  try {
    if (!document.fullscreenElement) {
      await rootRef.value.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  } catch (err) {
    console.warn('全屏切换失败:', err)
  }
}

function handleFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
  // 全屏切换后重新计算缩放并重排所有图表
  nextTick(() => {
    updateScale()
    // 使用 requestAnimationFrame 代替 setTimeout，在浏览器准备好渲染时再 resize
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        userGrowthChart?.resize()
        userSourceChart?.resize()
        userActivityChart?.resize()
        revenueChart?.resize()
        vipChart?.resize()
        activityTypeChart?.resize()
        mapChart?.resize()
        carouselChart?.resize()
      })
    })
  })
}

// ============ 实时时钟 ============
const currentTime = reactive({ time: '', date: '', weekday: '' })
const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
let clockTimer: ReturnType<typeof setInterval> | null = null

function updateClock() {
  const d = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  currentTime.time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  currentTime.date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  currentTime.weekday = weekdays[d.getDay()]
}

// ============ 粒子动画背景 ============
const particleCanvas = ref<HTMLCanvasElement | null>(null)
let particleCtx: CanvasRenderingContext2D | null = null
let particles: Particle[] = []
let particleAnimId: number | null = null

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  alpha: number
  color: string
}

const particleColors = ['#00d4ff', '#00ffd4', '#4d8bff', '#7c5cff', '#a0ffe6']

function initParticles() {
  if (!particleCanvas.value) return
  const canvas = particleCanvas.value
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  particleCtx = canvas.getContext('2d')
  particles = []
  const count = Math.min(80, Math.floor((canvas.width * canvas.height) / 25000))
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 0.8,
      alpha: Math.random() * 0.6 + 0.2,
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
    })
  }
}

function animateParticles() {
  if (!particleCtx || !particleCanvas.value) return
  const ctx = particleCtx
  const canvas = particleCanvas.value
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 绘制粒子
  particles.forEach((p) => {
    p.x += p.vx
    p.y += p.vy
    if (p.x < 0 || p.x > canvas.width) p.vx *= -1
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fillStyle = p.color
    ctx.globalAlpha = p.alpha
    ctx.fill()
  })

  // 绘制连线
  ctx.globalAlpha = 1
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x
      const dy = particles[i].y - particles[j].y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 130) {
        ctx.beginPath()
        ctx.moveTo(particles[i].x, particles[i].y)
        ctx.lineTo(particles[j].x, particles[j].y)
        ctx.strokeStyle = `rgba(0, 212, 255, ${0.15 * (1 - dist / 130)})`
        ctx.lineWidth = 0.6
        ctx.stroke()
      }
    }
  }

  particleAnimId = requestAnimationFrame(animateParticles)
}

// ============ 数据 & KPI ============
const statsData = ref<any>({})
const refreshInterval = ref(30)
const carouselInterval = ref(10)
const lastRefreshTime = ref('--:--:--')
const nextRefreshCountdown = ref(30)
let refreshTimer: ReturnType<typeof setInterval> | null = null
let countdownTimer: ReturnType<typeof setInterval> | null = null

const kpiList = computed(() => {
  const o = statsData.value.overview || {}
  return [
    { label: '总用户数', value: o.userCount || 0, unit: '人', icon: 'User' },
    { label: 'VIP 用户', value: o.vipCount || 0, unit: '人', icon: 'TrophyBase' },
    { label: '今日订单', value: o.todayOrders || 0, unit: '单', icon: 'ShoppingCart' },
    { label: '今日营收', value: o.todayRevenue || 0, unit: '元', icon: 'Money' },
    { label: '活动总数', value: o.activityCount || 0, unit: '个', icon: 'Calendar' },
    { label: '商机总数', value: o.businessCount || 0, unit: '条', icon: 'Connection' },
  ]
})

// KPI 数字滚动动画
// 使用 shallowRef 避免对数组内部元素进行深度响应式追踪，减少每帧的响应式开销
// 配合 triggerRef 手动触发更新，让动画期间每帧仅触发一次 kpi-row 的重渲染
const animatedValues = shallowRef<number[]>([0, 0, 0, 0, 0, 0])
const isFirstLoad = ref(true)
let kpiAnimRafId: number | null = null

function animateValue(_target: number, idx: number) {
  return animatedValues.value[idx] || 0
}

function animateKpi() {
  // 取消上一轮 RAF，防止多轮动画叠加
  if (kpiAnimRafId !== null) {
    cancelAnimationFrame(kpiAnimRafId)
    kpiAnimRafId = null
  }

  const targets = kpiList.value.map((k) => k.value)
  const starts = [...animatedValues.value]
  const diffs = targets.map((t, i) => t - starts[i])
  // 所有 KPI 值均未变化则跳过
  if (diffs.every((d) => Math.abs(d) < 1)) return

  const steps = isFirstLoad.value ? 30 : 15
  const tickInterval = isFirstLoad.value ? 25 : 16
  let tickCount = 0

  // 使用单个 requestAnimationFrame 递归循环，每 tickInterval ms 推进一步
  // 所有 KPI 在同一步内批量更新 → Vue 每步仅触发一次重渲染
  // 直接 mutate 数组元素（shallowRef 不追踪内部变化），最后用 triggerRef 通知 Vue
  let lastTickTime = 0
  function loop(now: number) {
    if (tickCount >= steps) {
      // 动画结束，写入最终值
      targets.forEach((t, i) => { animatedValues.value[i] = t })
      triggerRef(animatedValues)
      kpiAnimRafId = null
      return
    }
    if (now - lastTickTime >= tickInterval || tickCount === 0) {
      lastTickTime = now
      tickCount++
      const progress = tickCount / steps
      targets.forEach((t, i) => {
        if (Math.abs(diffs[i]) < 1) animatedValues.value[i] = t
        else animatedValues.value[i] = Math.round(starts[i] + diffs[i] * progress)
      })
      triggerRef(animatedValues)
    }
    kpiAnimRafId = requestAnimationFrame(loop)
  }

  kpiAnimRafId = requestAnimationFrame(loop)
  isFirstLoad.value = false
}

// ============ 地图相关 ============
const mapChartRef = ref<HTMLDivElement | null>(null)
let mapChart: echarts.ECharts | null = null
const currentProvince = ref('')
const currentProvinceData = reactive({ users: 0, percent: 0 })
const mapLegend = [
  { label: '0-5人', color: '#0a2e52' },
  { label: '5-10人', color: '#1565c0' },
  { label: '10-50人', color: '#00bcd4' },
  { label: '50-100人', color: '#00e5ff' },
  { label: '100+', color: '#ffeb3b' },
]

// ============ 图表 refs ============
const userGrowthChartRef = ref<HTMLDivElement | null>(null)
const userSourceChartRef = ref<HTMLDivElement | null>(null)
const userActivityChartRef = ref<HTMLDivElement | null>(null)
const revenueChartRef = ref<HTMLDivElement | null>(null)
const vipChartRef = ref<HTMLDivElement | null>(null)
const activityTypeChartRef = ref<HTMLDivElement | null>(null)
const carouselChartRef = ref<HTMLDivElement | null>(null)

let userGrowthChart: echarts.ECharts | null = null
let userSourceChart: echarts.ECharts | null = null
let userActivityChart: echarts.ECharts | null = null
let revenueChart: echarts.ECharts | null = null
let vipChart: echarts.ECharts | null = null
let activityTypeChart: echarts.ECharts | null = null
let carouselChart: echarts.ECharts | null = null

// ============ 轮播 ============
const activeCarousel = ref(0)
const carouselPanels = [
  { title: '商品分类分布', type: 'productCategory' },
  { title: '活动类型占比', type: 'activityType' },
  { title: '用户来源对比', type: 'userSourceBar' },
]
let carouselTimer: ReturnType<typeof setInterval> | null = null

function switchCarousel(i: number) {
  activeCarousel.value = i
  renderCarouselChart()
  resetCarouselTimer()
}

function resetCarouselTimer() {
  if (carouselTimer) clearInterval(carouselTimer)
  carouselTimer = setInterval(() => {
    activeCarousel.value = (activeCarousel.value + 1) % carouselPanels.length
    renderCarouselChart()
  }, carouselInterval.value * 1000)
}

// ============ 数据加载 ============
// 用于数据对比，避免数据未变化时重绘图表导致闪烁
let lastDataSignature = ''
// 各图表独立数据签名，实现细粒度更新
let chartSignatures: Record<string, string> = {}
let isFirstRender = true

function getDataSignature(data: any): string {
  if (!data) return ''
  try {
    return JSON.stringify({
      o: data.overview,
      ugt: data.userGrowthTrend,
      us: data.userSource,
      ua: data.userActivity,
      ort: data.orderRevenueTrend,
      vd: data.vipDistribution,
      atd: data.activityTypeDistribution,
      pd: data.provinceDistribution,
      pcd: data.productCategoryDistribution,
    })
  } catch {
    return ''
  }
}

// 获取单个图表对应的数据切片签名
function getChartSignature(data: any, key: string): string {
  if (!data) return ''
  try {
    const slice: any = {}
    if (key === 'userGrowth') slice.data = data.userGrowthTrend
    else if (key === 'userSource') slice.data = data.userSource
    else if (key === 'userActivity') slice.data = data.userActivity
    else if (key === 'revenue') slice.data = data.orderRevenueTrend
    else if (key === 'vip') slice.data = data.vipDistribution
    else if (key === 'activityType') slice.data = data.activityTypeDistribution
    else if (key === 'map') slice.data = data.provinceDistribution
    else if (key === 'carousel') slice.data = [data.productCategoryDistribution, data.activityTypeDistribution, data.userSource]
    return JSON.stringify(slice)
  } catch {
    return ''
  }
}

async function loadStats() {
  try {
    const data: any = await request.get('/admin/big-screen')
    const newSig = getDataSignature(data)
    const dataChanged = newSig !== lastDataSignature
    lastDataSignature = newSig

    // 仅更新刷新时间（轻量级 ref，不影响 statsData 依赖链）
    lastRefreshTime.value = currentTime.time
    nextRefreshCountdown.value = refreshInterval.value

    // 关键优化：数据变化时使用 Object.assign 就地更新现有对象
    // 避免替换整个 statsData.value 引用——保留对象身份，Vue 仅对变化的属性触发更新，
    // 而非整个 statsData 依赖树（kpiList computed、模板 VNode 等）全部重算
    if (dataChanged) {
      if (isFirstRender) {
        statsData.value = data || {}
      } else {
        // 先清空旧属性，再写入新属性，避免残留旧 key
        Object.keys(statsData.value).forEach(k => delete statsData.value[k])
        Object.assign(statsData.value, data || {})
      }
      animateKpi()
    }

    await nextTick()

    if (isFirstRender) {
      // 首次渲染：初始化所有图表
      await renderAllCharts()
      isFirstRender = false
    } else if (dataChanged) {
      // 数据变化时：仅更新数据，不重建图表结构（使用合并模式）
      updateChartData()
    }
    // 数据未变化时：完全跳过图表更新，避免任何重绘
  } catch (err) {
    console.error('大屏数据加载失败:', err)
  }
}

// 仅更新图表数据（合并模式，逐图签名比对，仅更新变化的图表避免闪烁）
// 关键：不使用 animation:false（全局动画开关会与 renderXxxChart 的 animation:true 冲突，
// 导致 setOption 时立即重绘整个 series 而非增量更新）。只用 animationDurationUpdate:0
// 让数据更新无过渡动画，但仍走 ECharts 增量更新管线，避免整图重绘。
function updateChartData() {
  const updateOpt = { animationDurationUpdate: 0, animationEasingUpdate: 'linear' as const }
  const data = statsData.value

  if (getChartSignature(data, 'userGrowth') !== chartSignatures.userGrowth) {
    chartSignatures.userGrowth = getChartSignature(data, 'userGrowth')
    const trend = data.userGrowthTrend || []
    userGrowthChart?.setOption({
      ...updateOpt,
      xAxis: { data: trend.map((d: any) => d.date) },
      series: [
        { data: trend.map((d: any) => d.count) },
        { data: trend.map((d: any) => d.total) },
      ],
    })
  }

  if (getChartSignature(data, 'userSource') !== chartSignatures.userSource) {
    chartSignatures.userSource = getChartSignature(data, 'userSource')
    const usData = data.userSource || []
    userSourceChart?.setOption({
      ...updateOpt,
      series: [{
        data: usData.map((d: any, i: number) => ({
          ...d,
          itemStyle: {
            color: ['#00d4ff', '#7c5cff', '#ffeb3b', '#00e5ff'][i % 4],
          },
        })),
      }],
    })
  }

  if (getChartSignature(data, 'userActivity') !== chartSignatures.userActivity) {
    chartSignatures.userActivity = getChartSignature(data, 'userActivity')
    const uaData = data.userActivity || []
    userActivityChart?.setOption({
      ...updateOpt,
      yAxis: { data: uaData.map((d: any) => d.name) },
      series: [{ data: uaData.map((d: any) => d.value) }],
    })
  }

  if (getChartSignature(data, 'revenue') !== chartSignatures.revenue) {
    chartSignatures.revenue = getChartSignature(data, 'revenue')
    const revTrend = data.orderRevenueTrend || []
    revenueChart?.setOption({
      ...updateOpt,
      xAxis: { data: revTrend.map((d: any) => d.date) },
      series: [
        { data: revTrend.map((d: any) => d.orders) },
        { data: revTrend.map((d: any) => d.revenue) },
      ],
    })
  }

  if (getChartSignature(data, 'vip') !== chartSignatures.vip) {
    chartSignatures.vip = getChartSignature(data, 'vip')
    const vipData = data.vipDistribution || []
    vipChart?.setOption({
      ...updateOpt,
      series: [{
        data: vipData.map((d: any, i: number) => ({
          ...d,
          itemStyle: {
            color: ['#1565c0', '#00d4ff', '#00e5ff', '#ffeb3b', '#ff9800'][i % 5],
          },
        })),
      }],
    })
  }

  if (getChartSignature(data, 'activityType') !== chartSignatures.activityType) {
    chartSignatures.activityType = getChartSignature(data, 'activityType')
    const atData = data.activityTypeDistribution || []
    activityTypeChart?.setOption({
      ...updateOpt,
      series: [{
        data: atData.map((d: any, i: number) => ({
          ...d,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: ['#00d4ff', '#7c5cff', '#ffeb3b', '#00e5ff', '#ff9800', '#a0ffe6'][i % 6] },
              { offset: 1, color: ['#1565c0', '#3d2cb5', '#b59a00', '#0099b5', '#b36800', '#5cb59a'][i % 6] },
            ]),
          },
        })),
      }],
    })
  }

  if (getChartSignature(data, 'map') !== chartSignatures.map) {
    chartSignatures.map = getChartSignature(data, 'map')
    const provinceData = data.provinceDistribution || []
    const maxVal = Math.max(...provinceData.map((p: any) => p.value), 1)
    // 仅更新 series[0].data 和 visualMap.max，不传 series[1]（effectScatter 本就为空）
    // 避免 merge 模式下重复设置空数组触发 series 重新合并
    mapChart?.setOption({
      ...updateOpt,
      visualMap: { max: maxVal },
      series: [{ data: provinceData.map((p: any) => ({ name: p.name, value: p.value })) }],
    })
  }

  if (getChartSignature(data, 'carousel') !== chartSignatures.carousel) {
    chartSignatures.carousel = getChartSignature(data, 'carousel')
    updateCarouselData()
  }
}

// 仅更新轮播图表数据（不切换面板类型，使用合并模式避免闪烁）
function updateCarouselData() {
  if (!carouselChart) return
  // 仅禁止数据变更动画，不覆盖 animation 全局开关（防止与 renderCarouselChart 的 animation:true 来回切换导致撕裂）
  const updateOpt = { animationDurationUpdate: 0, animationEasingUpdate: 'linear' as const }
  const panel = carouselPanels[activeCarousel.value]
  if (panel.type === 'productCategory') {
    const data = statsData.value.productCategoryDistribution || []
    carouselChart.setOption({
      ...updateOpt,
      xAxis: { data: data.map((d: any) => d.name) },
      series: [{ data: data.map((d: any) => d.value) }],
    })
  } else if (panel.type === 'activityType') {
    const data = statsData.value.activityTypeDistribution || []
    carouselChart.setOption({
      ...updateOpt,
      series: [{
        data: data.map((d: any, i: number) => ({
          ...d,
          itemStyle: {
            color: ['#00d4ff', '#7c5cff', '#ffeb3b', '#00e5ff', '#ff9800', '#a0ffe6'][i % 6],
          },
        })),
      }],
    })
  } else if (panel.type === 'userSourceBar') {
    const data = statsData.value.userSource || []
    carouselChart.setOption({
      ...updateOpt,
      yAxis: { data: data.map((d: any) => d.name) },
      series: [{ data: data.map((d: any) => d.value) }],
    })
  }
}

function resetRefreshTimer() {
  if (refreshTimer) clearInterval(refreshTimer)
  if (countdownTimer) clearInterval(countdownTimer)
  nextRefreshCountdown.value = refreshInterval.value
  refreshTimer = setInterval(loadStats, refreshInterval.value * 1000)
  countdownTimer = setInterval(() => {
    if (nextRefreshCountdown.value > 0) nextRefreshCountdown.value--
  }, 1000)
}

// 等待 DOM 容器有真实尺寸
async function ensureChartContainer(el: HTMLElement | null): Promise<boolean> {
  if (!el) return false
  for (let i = 0; i < 10; i++) {
    const rect = el.getBoundingClientRect()
    if (rect.width > 10 && rect.height > 10) return true
    await new Promise((r) => setTimeout(r, 50))
  }
  return false
}

// ============ 图表渲染 ============
async function renderAllCharts() {
  await Promise.all([
    ensureChartContainer(userGrowthChartRef.value),
    ensureChartContainer(userSourceChartRef.value),
    ensureChartContainer(userActivityChartRef.value),
    ensureChartContainer(revenueChartRef.value),
    ensureChartContainer(vipChartRef.value),
    ensureChartContainer(activityTypeChartRef.value),
    ensureChartContainer(mapChartRef.value),
    ensureChartContainer(carouselChartRef.value),
  ])
  renderUserGrowthChart()
  renderUserSourceChart()
  renderUserActivityChart()
  renderRevenueChart()
  renderVipChart()
  renderActivityTypeChart()
  renderMapChart()
  renderCarouselChart()
}

// 科技风通用配置
const techGrid = {
  top: 30, left: 40, right: 20, bottom: 30,
}
const techAxisLine = { lineStyle: { color: 'rgba(0, 212, 255, 0.3)' } }
const techSplitLine = { lineStyle: { color: 'rgba(0, 212, 255, 0.08)', type: 'dashed' as const } }
const techTextColor = '#8fb8d8'
const techTooltip = {
  trigger: 'axis',
  backgroundColor: 'rgba(7, 30, 58, 0.9)',
  borderColor: '#00d4ff',
  borderWidth: 1,
  textStyle: { color: '#fff', fontSize: 12 },
}
// 动画配置：首次渲染有动画，数据更新时无动画（彻底消除刷新闪烁）
const techAnimation = {
  animation: true,
  animationDuration: 800,
  animationDurationUpdate: 0,  // 数据更新时动画时长为 0，即立即更新，无过渡动画
  animationEasing: 'cubicOut' as const,
  animationEasingUpdate: 'linear' as const,
}

function renderUserGrowthChart() {
  if (!userGrowthChartRef.value) return
  if (!userGrowthChart) userGrowthChart = echarts.init(userGrowthChartRef.value)
  const trend = statsData.value.userGrowthTrend || []
  userGrowthChart.setOption({
    ...techAnimation,
    tooltip: techTooltip,
    legend: {
      data: ['新增用户', '累计用户'],
      textStyle: { color: techTextColor, fontSize: 11 },
      right: 10, top: 0,
    },
    grid: techGrid,
    xAxis: {
      type: 'category',
      data: trend.map((d: any) => d.date),
      axisLine: techAxisLine,
      axisLabel: { color: techTextColor, fontSize: 10 },
    },
    yAxis: [
      { type: 'value', name: '新增', axisLine: techAxisLine, axisLabel: { color: techTextColor, fontSize: 10 }, splitLine: techSplitLine },
      { type: 'value', name: '累计', axisLine: techAxisLine, axisLabel: { color: techTextColor, fontSize: 10 }, splitLine: { show: false } },
    ],
    series: [
      {
        name: '新增用户',
        type: 'bar',
        data: trend.map((d: any) => d.count),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#00d4ff' },
            { offset: 1, color: '#1565c0' },
          ]),
          borderRadius: [4, 4, 0, 0],
        },
        barWidth: '40%',
      },
      {
        name: '累计用户',
        type: 'line',
        yAxisIndex: 1,
        data: trend.map((d: any) => d.total),
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#ffeb3b', width: 2 },
        itemStyle: { color: '#ffeb3b' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(255, 235, 59, 0.3)' },
            { offset: 1, color: 'rgba(255, 235, 59, 0.02)' },
          ]),
        },
      },
    ],
  })
}

function renderUserSourceChart() {
  if (!userSourceChartRef.value) return
  if (!userSourceChart) userSourceChart = echarts.init(userSourceChartRef.value)
  const data = statsData.value.userSource || []
  userSourceChart.setOption({
    ...techAnimation,
    tooltip: { trigger: 'item', backgroundColor: 'rgba(7, 30, 58, 0.9)', borderColor: '#00d4ff', textStyle: { color: '#fff' } },
    legend: {
      bottom: 5,
      textStyle: { color: techTextColor, fontSize: 11 },
      itemWidth: 10, itemHeight: 10,
    },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderColor: '#0a1e3a',
        borderWidth: 2,
      },
      label: {
        show: true,
        color: techTextColor,
        formatter: '{b}\n{c}人 ({d}%)',
        fontSize: 11,
      },
      labelLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.5)' } },
      data: data.map((d: any, i: number) => ({
        ...d,
        itemStyle: {
          color: ['#00d4ff', '#7c5cff', '#ffeb3b', '#00e5ff'][i % 4],
        },
      })),
    }],
  })
}

function renderUserActivityChart() {
  if (!userActivityChartRef.value) return
  if (!userActivityChart) userActivityChart = echarts.init(userActivityChartRef.value)
  const data = statsData.value.userActivity || []
  userActivityChart.setOption({
    ...techAnimation,
    tooltip: techTooltip,
    grid: { ...techGrid, left: 80 },
    xAxis: { type: 'value', axisLine: techAxisLine, axisLabel: { color: techTextColor, fontSize: 10 }, splitLine: techSplitLine },
    yAxis: {
      type: 'category',
      data: data.map((d: any) => d.name),
      axisLine: techAxisLine,
      axisLabel: { color: techTextColor, fontSize: 11 },
    },
    series: [{
      type: 'bar',
      data: data.map((d: any) => d.value),
      barWidth: '50%',
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#1565c0' },
          { offset: 1, color: '#00e5ff' },
        ]),
        borderRadius: [0, 4, 4, 0],
      },
      label: {
        show: true,
        position: 'right',
        color: '#00e5ff',
        fontSize: 11,
        formatter: '{c}',
      },
    }],
  })
}

function renderRevenueChart() {
  if (!revenueChartRef.value) return
  if (!revenueChart) revenueChart = echarts.init(revenueChartRef.value)
  const trend = statsData.value.orderRevenueTrend || []
  revenueChart.setOption({
    ...techAnimation,
    tooltip: techTooltip,
    legend: {
      data: ['订单数', '营收(元)'],
      textStyle: { color: techTextColor, fontSize: 11 },
      right: 10, top: 0,
    },
    grid: techGrid,
    xAxis: {
      type: 'category',
      data: trend.map((d: any) => d.date),
      axisLine: techAxisLine,
      axisLabel: { color: techTextColor, fontSize: 10 },
    },
    yAxis: [
      { type: 'value', name: '订单', axisLine: techAxisLine, axisLabel: { color: techTextColor, fontSize: 10 }, splitLine: techSplitLine },
      { type: 'value', name: '营收', axisLine: techAxisLine, axisLabel: { color: techTextColor, fontSize: 10 }, splitLine: { show: false } },
    ],
    series: [
      {
        name: '订单数',
        type: 'bar',
        data: trend.map((d: any) => d.orders),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#7c5cff' },
            { offset: 1, color: '#3d2cb5' },
          ]),
          borderRadius: [4, 4, 0, 0],
        },
        barWidth: '40%',
      },
      {
        name: '营收(元)',
        type: 'line',
        yAxisIndex: 1,
        data: trend.map((d: any) => d.revenue),
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#00ffd4', width: 2 },
        itemStyle: { color: '#00ffd4' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0, 255, 212, 0.3)' },
            { offset: 1, color: 'rgba(0, 255, 212, 0.02)' },
          ]),
        },
      },
    ],
  })
}

function renderVipChart() {
  if (!vipChartRef.value) return
  if (!vipChart) vipChart = echarts.init(vipChartRef.value)
  const data = statsData.value.vipDistribution || []
  vipChart.setOption({
    ...techAnimation,
    tooltip: { trigger: 'item', backgroundColor: 'rgba(7, 30, 58, 0.9)', borderColor: '#00d4ff', textStyle: { color: '#fff' } },
    legend: {
      bottom: 5,
      textStyle: { color: techTextColor, fontSize: 11 },
      itemWidth: 10, itemHeight: 10,
    },
    series: [{
      type: 'pie',
      radius: '65%',
      center: ['50%', '45%'],
      itemStyle: {
        borderColor: '#0a1e3a',
        borderWidth: 2,
      },
      label: { color: techTextColor, fontSize: 11, formatter: '{b}: {c} ({d}%)' },
      data: data.map((d: any, i: number) => ({
        ...d,
        itemStyle: {
          color: ['#1565c0', '#00d4ff', '#00e5ff', '#ffeb3b', '#ff9800'][i % 5],
        },
      })),
    }],
  })
}

function renderActivityTypeChart() {
  if (!activityTypeChartRef.value) return
  if (!activityTypeChart) activityTypeChart = echarts.init(activityTypeChartRef.value)
  const data = statsData.value.activityTypeDistribution || []
  activityTypeChart.setOption({
    ...techAnimation,
    tooltip: { trigger: 'item', backgroundColor: 'rgba(7, 30, 58, 0.9)', borderColor: '#00d4ff', textStyle: { color: '#fff' } },
    legend: {
      bottom: 5,
      textStyle: { color: techTextColor, fontSize: 11 },
      itemWidth: 10, itemHeight: 10,
    },
    series: [{
      type: 'pie',
      radius: ['20%', '70%'],
      center: ['50%', '45%'],
      roseType: 'area',
      itemStyle: {
        borderColor: '#0a1e3a',
        borderWidth: 2,
      },
      label: { color: techTextColor, fontSize: 11, formatter: '{b}: {c}' },
      data: data.map((d: any, i: number) => ({
        ...d,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: ['#00d4ff', '#7c5cff', '#ffeb3b', '#00e5ff', '#ff9800', '#a0ffe6'][i % 6] },
            { offset: 1, color: ['#1565c0', '#3d2cb5', '#b59a00', '#0099b5', '#b36800', '#5cb59a'][i % 6] },
          ]),
        },
      })),
    }],
  })
}

// 中国地图 GeoJSON 缓存（避免每次刷新都重新 fetch）
let chinaMapLoaded = false
let chinaMapLoading: Promise<boolean> | null = null

async function ensureChinaMap(): Promise<boolean> {
  if (chinaMapLoaded) return true
  if (chinaMapLoading) return chinaMapLoading
  chinaMapLoading = (async () => {
    try {
      const resp = await fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
      const json = await resp.json()
      // 移除南海诸岛，主图不再展示南海区域（右下角已有方形标注框）
      if (json.features) {
        json.features = json.features.filter((f: any) => {
          const name = f.properties?.name || ''
          return name !== '南海诸岛'
        })
      }
      echarts.registerMap('china', json)
      chinaMapLoaded = true
      return true
    } catch {
      console.warn('无法加载中国地图 GeoJSON，地图展示为空')
      return false
    } finally {
      chinaMapLoading = null
    }
  })()
  return chinaMapLoading
}

async function renderMapChart() {
  if (!mapChartRef.value) return
  if (!mapChart) {
    mapChart = echarts.init(mapChartRef.value)
    mapChart.on('click', handleMapClick)
  }

  // 仅首次加载时获取地图 GeoJSON，后续刷新直接使用缓存
  const ok = await ensureChinaMap()
  if (!ok) return

  const provinceData = statsData.value.provinceDistribution || []
  const maxVal = Math.max(...provinceData.map((p: any) => p.value), 1)

  const data = provinceData.map((p: any) => ({ name: p.name, value: p.value }))

  // 使用合并模式更新（notMerge: false），仅更新 series.data 和 visualMap，避免整图重绘闪烁
  mapChart.setOption({
    ...techAnimation,
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(7, 30, 58, 0.95)',
      borderColor: '#00d4ff',
      borderWidth: 1,
      textStyle: { color: '#fff', fontSize: 12 },
      formatter: (params: any) => {
        if (!params.data) return `${params.name}<br/>暂无数据`
        return `${params.name}<br/>用户数: ${params.value} 人`
      },
    },
    visualMap: {
      type: 'continuous',
      min: 0,
      max: maxVal,
      left: 20,
      bottom: 20,
      text: ['多', '少'],
      textStyle: { color: techTextColor, fontSize: 11 },
      inRange: {
        color: ['#0a2e52', '#1565c0', '#00bcd4', '#00e5ff', '#ffeb3b'],
      },
      calculable: true,
    },
    geo: {
      map: 'china',
      roam: false,
      zoom: 1.15,
      // 地图向下移动（layoutCenter Y 值增大），确保地图上方标题/KPI 卡片完整可见
      // 同时降低 aspectScale 压扁地图，让中国版图在容器内纵向更紧凑
      layoutCenter: ['50%', '66%'],
      layoutSize: '115%',
      aspectScale: 0.80,
      scaleLimit: { min: 1, max: 5 },
      label: { show: false },
      itemStyle: {
        areaColor: 'rgba(10, 46, 82, 0.6)',
        borderColor: 'rgba(0, 212, 255, 0.4)',
        borderWidth: 1,
      },
      emphasis: {
        itemStyle: {
          areaColor: 'rgba(0, 212, 255, 0.3)',
          borderColor: '#00d4ff',
          borderWidth: 2,
        },
        label: { color: '#fff', fontSize: 11 },
      },
    },
    series: [{
      type: 'map',
      map: 'china',
      geoIndex: 0,
      data,
    }],
  })
}

function handleMapClick(params: any) {
  if (params.name) {
    const province = statsData.value.provinceDistribution?.find((p: any) => p.name === params.name)
    if (province) {
      currentProvince.value = params.name
      currentProvinceData.users = province.value
      const total = statsData.value.overview?.userCount || 1
      currentProvinceData.percent = Number(((province.value / total) * 100).toFixed(2))
    }
  }
}

function backToChina() {
  currentProvince.value = ''
}

// 记录上一次轮播类型，决定是否需要 notMerge
let lastCarouselType = ''

function renderCarouselChart() {
  if (!carouselChartRef.value) return
  if (!carouselChart) carouselChart = echarts.init(carouselChartRef.value)
  const panel = carouselPanels[activeCarousel.value]

  // 类型切换时使用 chart.clear() 清空内容后重新 setOption，避免 notMerge:true
  // 导致 ECharts 销毁旧 canvas 并创建新 DOM 节点——这是"面板消失后重新渲染"的直接原因
  if (lastCarouselType !== panel.type) {
    carouselChart.clear()
  }
  lastCarouselType = panel.type

  if (panel.type === 'productCategory') {
    const data = statsData.value.productCategoryDistribution || []
    carouselChart.setOption({
      ...techAnimation,
      tooltip: techTooltip,
      grid: techGrid,
      xAxis: {
        type: 'category',
        data: data.map((d: any) => d.name),
        axisLine: techAxisLine,
        axisLabel: { color: techTextColor, fontSize: 10, rotate: 20 },
      },
      yAxis: { type: 'value', axisLine: techAxisLine, axisLabel: { color: techTextColor, fontSize: 10 }, splitLine: techSplitLine },
      series: [{
        type: 'bar',
        data: data.map((d: any) => d.value),
        barWidth: '50%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#00ffd4' },
            { offset: 1, color: '#0099b5' },
          ]),
          borderRadius: [6, 6, 0, 0],
        },
        label: { show: true, position: 'top', color: '#00ffd4', fontSize: 11 },
      }],
    })
  } else if (panel.type === 'activityType') {
    const data = statsData.value.activityTypeDistribution || []
    carouselChart.setOption({
      ...techAnimation,
      tooltip: { trigger: 'item', backgroundColor: 'rgba(7, 30, 58, 0.9)', borderColor: '#00d4ff', textStyle: { color: '#fff' } },
      legend: { bottom: 5, textStyle: { color: techTextColor, fontSize: 11 }, itemWidth: 10, itemHeight: 10 },
      series: [{
        type: 'pie',
        radius: ['35%', '65%'],
        center: ['50%', '45%'],
        itemStyle: { borderColor: '#0a1e3a', borderWidth: 2 },
        label: { color: techTextColor, fontSize: 11, formatter: '{b}: {c} ({d}%)' },
        data: data.map((d: any, i: number) => ({
          ...d,
          itemStyle: {
            color: ['#00d4ff', '#7c5cff', '#ffeb3b', '#00e5ff', '#ff9800', '#a0ffe6'][i % 6],
          },
        })),
      }],
    })
  } else if (panel.type === 'userSourceBar') {
    const data = statsData.value.userSource || []
    carouselChart.setOption({
      ...techAnimation,
      tooltip: techTooltip,
      grid: { ...techGrid, left: 90 },
      xAxis: { type: 'value', axisLine: techAxisLine, axisLabel: { color: techTextColor, fontSize: 10 }, splitLine: techSplitLine },
      yAxis: {
        type: 'category',
        data: data.map((d: any) => d.name),
        axisLine: techAxisLine,
        axisLabel: { color: techTextColor, fontSize: 11 },
      },
      series: [{
        type: 'bar',
        data: data.map((d: any) => d.value),
        barWidth: '50%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#7c5cff' },
            { offset: 1, color: '#00d4ff' },
          ]),
          borderRadius: [0, 6, 6, 0],
        },
        label: { show: true, position: 'right', color: '#00d4ff', fontSize: 11 },
      }],
    })
  }
}

// ============ 窗口大小响应 ============
let resizeRafId: number | null = null
let isResizing = false
// 记录上次 resize 时的视口尺寸，用于判断图表容器实际布局是否变化
let lastViewportW = 0
let lastViewportH = 0

function handleResize() {
  // 使用 requestAnimationFrame 节流，避免高频 resize 事件导致反复重绘
  if (resizeRafId) cancelAnimationFrame(resizeRafId)
  resizeRafId = requestAnimationFrame(() => {
    if (isResizing) return
    isResizing = true
    updateScale()
    // 仅更新粒子画布尺寸，不重建粒子数组（避免视觉跳跃）
    resizeParticleCanvas()

    // 视口尺寸变化时才 resize ECharts（因为容器使用 transform:scale 缩放，
    // 图表容器的 layout rect 始终为 1920x1080，视口不变时 resize 是无效操作）
    const vw = window.innerWidth
    const vh = window.innerHeight
    if (vw !== lastViewportW || vh !== lastViewportH) {
      lastViewportW = vw
      lastViewportH = vh
      userGrowthChart?.resize()
      userSourceChart?.resize()
      userActivityChart?.resize()
      revenueChart?.resize()
      vipChart?.resize()
      activityTypeChart?.resize()
      mapChart?.resize()
      carouselChart?.resize()
    }
    isResizing = false
  })
}

// 仅更新粒子画布尺寸，保留现有粒子状态
function resizeParticleCanvas() {
  if (!particleCanvas.value || !particleCtx) return
  const canvas = particleCanvas.value
  // 设置 width/height 会清空画布，先保存旧尺寸用于粒子位置 clamp
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  // 粒子位置 clamp 到新画布范围内
  particles.forEach((p) => {
    p.x = Math.min(p.x, canvas.width)
    p.y = Math.min(p.y, canvas.height)
  })
}

// ============ 生命周期 ============
onMounted(async () => {
  updateScale()
  updateClock()
  initParticles()
  animateParticles()

  clockTimer = setInterval(updateClock, 1000)
  window.addEventListener('resize', handleResize)
  document.addEventListener('fullscreenchange', handleFullscreenChange)

  await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 100))
  await loadStats()
  resetRefreshTimer()
  resetCarouselTimer()
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
  if (refreshTimer) clearInterval(refreshTimer)
  if (countdownTimer) clearInterval(countdownTimer)
  if (carouselTimer) clearInterval(carouselTimer)
  if (particleAnimId) cancelAnimationFrame(particleAnimId)
  if (resizeRafId) cancelAnimationFrame(resizeRafId)
  // 清理 KPI 动画 RAF
  if (kpiAnimRafId) cancelAnimationFrame(kpiAnimRafId)
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
  userGrowthChart?.dispose()
  userSourceChart?.dispose()
  userActivityChart?.dispose()
  revenueChart?.dispose()
  vipChart?.dispose()
  activityTypeChart?.dispose()
  mapChart?.dispose()
  carouselChart?.dispose()
})
</script>

<style scoped>
.big-screen-root {
  position: fixed;
  inset: 0;
  background: #050b1a;
  overflow: hidden;
  color: #fff;
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
  /* 居中缩放容器，确保非 16:9 屏幕下大屏始终居中显示 */
  display: flex;
  align-items: center;
  justify-content: center;
}

.particle-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.screen-container {
  position: relative;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  z-index: 1;
  /* 仅保留 layout style 隔离；移除 paint containment
     paint containment 会创建新的 stacking context 并裁剪内容到 border-box，
     当与 transform:scale() 组合时，在 layout/paint 周期中可能短暂裁剪子元素，
     导致面板整体消失后重新出现 */
  contain: layout style;
}

/* 顶部标题栏 */
.screen-header {
  height: 70px;
  background: linear-gradient(180deg, rgba(0, 40, 80, 0.6) 0%, transparent 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
  border-bottom: 1px solid rgba(0, 212, 255, 0.2);
  position: relative;
}
.screen-header::after {
  content: '';
  position: absolute;
  left: 50%; bottom: 0;
  width: 60%;
  height: 1px;
  background: linear-gradient(90deg, transparent, #00d4ff, transparent);
  transform: translateX(-50%);
}
.header-left, .header-right { display: flex; align-items: center; gap: 12px; width: 280px; }
.header-right { justify-content: flex-end; }
.header-center { display: flex; align-items: center; gap: 20px; }
.header-text { color: #8fb8d8; font-size: 13px; }
.fullscreen-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.4);
  border-radius: 6px;
  color: #00d4ff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.fullscreen-btn:hover {
  background: rgba(0, 212, 255, 0.25);
  border-color: #00d4ff;
  box-shadow: 0 0 12px rgba(0, 212, 255, 0.4);
}
.fullscreen-btn svg {
  width: 14px;
  height: 14px;
}
.fullscreen-btn:active {
  transform: scale(0.95);
}
.status-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #00ff88;
  box-shadow: 0 0 8px #00ff88;
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}
.screen-title {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: 4px;
  background: linear-gradient(180deg, #fff 0%, #00d4ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
}
.title-decoration {
  width: 80px; height: 2px;
  background: linear-gradient(90deg, transparent, #00d4ff);
}
.title-decoration.right { background: linear-gradient(90deg, #00d4ff, transparent); }
.clock-box {
  display: flex; flex-direction: column; align-items: flex-end;
}
.clock-time {
  font-size: 24px; font-weight: 700; color: #00d4ff;
  font-family: 'Consolas', 'Monaco', monospace;
  text-shadow: 0 0 10px rgba(0, 212, 255, 0.6);
  letter-spacing: 2px;
}
.clock-date { font-size: 12px; color: #8fb8d8; }

/* 主体三栏 */
.screen-main {
  flex: 1;
  display: grid;
  grid-template-columns: 380px 1fr 380px;
  gap: 15px;
  padding: 15px;
  min-height: 0;
}
.col { display: flex; flex-direction: column; gap: 15px; min-height: 0; }
.col-left, .col-right { height: calc(100% - 0px); }
.col-center { height: 100%; }

/* 面板 */
.panel {
  background: linear-gradient(135deg, rgba(10, 30, 58, 0.85) 0%, rgba(5, 15, 35, 0.95) 100%);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  flex: 1;
  min-height: 0;
}
.panel::before {
  content: '';
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 1px;
  background: linear-gradient(90deg, transparent, #00d4ff 50%, transparent);
}
.panel::after {
  content: '';
  position: absolute;
  top: 0; left: 0;
  width: 12px; height: 12px;
  border-top: 2px solid #00d4ff;
  border-left: 2px solid #00d4ff;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  border-bottom: 1px solid rgba(0, 212, 255, 0.15);
  background: rgba(0, 30, 60, 0.3);
}
.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 1px;
  position: relative;
  padding-left: 10px;
}
.panel-title::before {
  content: '';
  position: absolute;
  left: 0; top: 50%;
  width: 3px; height: 14px;
  background: #00d4ff;
  transform: translateY(-50%);
  box-shadow: 0 0 6px #00d4ff;
}
.panel-badge {
  font-size: 10px;
  color: #00d4ff;
  padding: 2px 8px;
  border: 1px solid rgba(0, 212, 255, 0.4);
  border-radius: 10px;
  background: rgba(0, 212, 255, 0.1);
}
.panel-actions { display: flex; align-items: center; gap: 8px; }
.panel-body {
  flex: 1;
  position: relative;
  min-height: 0;
  padding: 4px;
}
.chart-box {
  width: 100%;
  height: 100%;
  min-height: 150px;
  /* 移除 transform:translateZ(0) + backface-visibility:hidden——
     每个 chart-box 创建一个独立的 GPU 合成层，8 个面板 = 8 个 GPU 层。
     当 setOption 更新数据时，浏览器在 compositing 阶段重排这些层，
     与父级 contain:layout style 的隔离边界交叉，产生"层闪烁"。
     改用 will-change:transform 作为轻量级 GPU 加速提示，不强制创建合成层 */
  will-change: transform;
}

/* KPI 卡片 */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  margin-bottom: 0;
}
.kpi-card {
  background: linear-gradient(135deg, rgba(0, 50, 100, 0.4) 0%, rgba(0, 20, 50, 0.6) 100%);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 4px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  overflow: hidden;
  /* 移除 transition:all 0.3s——每次数据刷新时 kpiList computed 重算
     导致所有 KPI 卡片同时触发 300ms 过渡动画，产生"重渲染闪烁"现象。
     仅保留 hover 相关的 border-color / box-shadow 过渡 */
  transition: border-color 0.3s, box-shadow 0.3s;
}
.kpi-card:hover {
  border-color: #00d4ff;
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
}
.kpi-icon {
  width: 38px; height: 38px;
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0, 212, 255, 0.15);
  color: #00d4ff;
  font-size: 20px;
}
.kpi-info { flex: 1; min-width: 0; }
.kpi-value {
  display: flex; align-items: baseline; gap: 3px;
  margin-bottom: 2px;
}
.kpi-value .num {
  font-size: 22px;
  font-weight: 800;
  color: #00e5ff;
  font-family: 'Consolas', 'Monaco', monospace;
  text-shadow: 0 0 8px rgba(0, 229, 255, 0.5);
}
.kpi-value .unit {
  font-size: 11px;
  color: #8fb8d8;
}
.kpi-label {
  font-size: 12px;
  color: #8fb8d8;
  letter-spacing: 0.5px;
}
.kpi-glow {
  position: absolute;
  top: -50%; right: -50%;
  width: 100%; height: 100%;
  background: radial-gradient(circle, rgba(0, 212, 255, 0.15) 0%, transparent 70%);
  pointer-events: none;
}

/* 地图面板 - 增大 flex 占比，让地图填满中间区域 */
.map-panel { flex: 3; }
.map-chart { min-height: 320px; }
.map-legend {
  position: absolute;
  right: 12px; top: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  background: rgba(7, 30, 58, 0.7);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 4px;
}
.legend-item { display: flex; align-items: center; gap: 6px; font-size: 10px; color: #8fb8d8; }
.legend-color { width: 16px; height: 8px; border-radius: 2px; }
.province-detail {
  position: absolute;
  left: 12px; top: 12px;
  background: rgba(7, 30, 58, 0.85);
  border: 1px solid #00d4ff;
  border-radius: 4px;
  padding: 10px 14px;
  min-width: 160px;
}
.province-detail h3 {
  font-size: 14px;
  color: #00d4ff;
  margin-bottom: 8px;
  letter-spacing: 1px;
}
.detail-stats { display: flex; gap: 14px; }
.stat-item { display: flex; flex-direction: column; gap: 2px; }
.stat-label { font-size: 10px; color: #8fb8d8; }
.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #ffeb3b;
  font-family: 'Consolas', monospace;
}
.back-btn {
  padding: 2px 10px;
  font-size: 11px;
  color: #fff;
  background: rgba(255, 99, 132, 0.2);
  border: 1px solid rgba(255, 99, 132, 0.5);
  border-radius: 10px;
  cursor: pointer;
}
.back-btn:hover { background: rgba(255, 99, 132, 0.4); }

/* 轮播面板 - 减小 flex 占比，让地图获得更多空间 */
.carousel-panel { flex: 1; }
.carousel-dots {
  display: flex;
  gap: 6px;
}
.dot {
  width: 18px; height: 4px;
  border-radius: 2px;
  background: rgba(0, 212, 255, 0.3);
  cursor: pointer;
  transition: all 0.3s;
}
.dot.active {
  background: #00d4ff;
  width: 28px;
  box-shadow: 0 0 6px #00d4ff;
}

/* 底部状态栏 */
.screen-footer {
  height: 40px;
  background: linear-gradient(0deg, rgba(0, 40, 80, 0.6) 0%, transparent 100%);
  border-top: 1px solid rgba(0, 212, 255, 0.2);
  display: flex;
  align-items: center;
  padding: 0 30px;
  gap: 30px;
  font-size: 12px;
  color: #8fb8d8;
}
.footer-section { display: flex; align-items: center; gap: 8px; }
.footer-label { color: #8fb8d8; }
.footer-value { color: #00d4ff; font-family: 'Consolas', monospace; }
.footer-select {
  background: rgba(0, 30, 60, 0.6);
  border: 1px solid rgba(0, 212, 255, 0.3);
  color: #00d4ff;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 11px;
  outline: none;
  cursor: pointer;
}
.footer-select option { background: #050b1a; color: #fff; }
.footer-status { color: #00ff88; }
.footer-version { margin-left: auto; color: rgba(143, 184, 216, 0.6); }

/* 各列面板高度分配 */
.col-left .panel:nth-child(1), .col-right .panel:nth-child(1) { flex: 1.1; }
.col-left .panel:nth-child(2), .col-right .panel:nth-child(2) { flex: 1; }
.col-left .panel:nth-child(3), .col-right .panel:nth-child(3) { flex: 1; }
</style>
