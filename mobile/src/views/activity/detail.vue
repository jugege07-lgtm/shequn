<template>
  <div class="phone-frame">
    <div class="header">
      <div class="header-left">
        <div class="back-btn" @click="goBack">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m15 18-6-6 6-6"/></svg>
        </div>
        <span class="header-title">活动详情</span>
      </div>
      <div class="header-right">
        <div class="header-icon" @click="shareActivity">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
        </div>
      </div>
    </div>
    <div class="main-scroll">
      <!-- 主图 Hero：宽度100%撑满、高度按原比例自适应、无左右边距、加载占位 + 懒加载 -->
      <div class="activity-cover-hero" :style="coverRatioStyle">
        <!-- 占位骨架屏（图片加载前，防止布局跳动） -->
        <div v-show="!coverLoaded" class="cover-placeholder">
          <div class="cover-skeleton"></div>
        </div>
        <!-- 主图 -->
        <img
          v-if="coverSrc && !coverError"
          ref="coverImgEl"
          :src="coverSrc"
          class="cover-main-img"
          :style="{ opacity: coverLoaded ? 1 : 0 }"
          :alt="activity.title"
          loading="lazy"
          decoding="async"
          @load="onCoverLoad"
          @error="onCoverError"
        />
        <!-- 无图 / 加载失败兜底 -->
        <div v-else-if="!coverSrc || coverError" class="cover-fallback"></div>
        <span class="cover-status" :class="{ free: activity.isFree }">{{ activity.statusText }}</span>
      </div>
      <!-- Info -->
      <div class="info-card">
        <h1 class="activity-name">{{ activity.title }}</h1>
        <div class="info-row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          <span>{{ activity.date }}</span>
        </div>
        <div class="info-row" @click="openMap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span>{{ activity.location }}</span>
        </div>
        <div class="info-row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          <span>{{ activity.capacity }}</span>
        </div>
        <div class="info-row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span>发布者：{{ activity.publisher }}</span>
        </div>
      </div>
      <!-- Stats -->
      <div class="info-card stats-card">
        <div class="stat-box">
          <div class="stat-num">{{ activity.participants }}</div>
          <div class="stat-txt">已报名</div>
        </div>
        <div class="stat-box">
          <div class="stat-num">{{ activity.views }}</div>
          <div class="stat-txt">浏览量</div>
        </div>
        <div class="stat-box">
          <div class="stat-num">{{ activity.signups }}</div>
          <div class="stat-txt">收藏</div>
        </div>
      </div>
      <!-- Map placeholder -->
      <div class="info-card">
        <h3 class="section-label">活动地点</h3>
        <div class="map-placeholder" @click="openMap">
          <div class="map-pin">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <div class="map-info">
            <span class="map-addr">{{ activity.location }}</span>
            <span class="map-hint">点击打开地图导航 »</span>
          </div>
          <svg class="map-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </div>
      </div>
      <!-- Description -->
      <div class="info-card">
        <h3 class="section-label">活动介绍</h3>
        <div class="desc-text" v-html="activity.sanitizedDesc"></div>
      </div>
    </div>
    <!-- Bottom Action -->
    <div class="bottom-action">
      <div class="price-section">
        <span class="price-value" :class="{ free: activity.isFree }" v-html="activity.priceHtml"></span>
        <span v-if="signupStatus.status === 'pending_payment'" class="price-tip">待支付</span>
      </div>
      <button class="signup-btn" :disabled="activity.full || signupStatus.isSignedUp || submitting" @click="handleSignup">
        {{ signupBtnText }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getActivityDetail, signupActivity, getActivitySignupStatus } from '@/api'
import { sanitizeRichHtml } from '@/utils/sanitize'
import { normalizeImageUrl } from '@/utils/image'

const route = useRoute()
const router = useRouter()

// ===== 主图自适应 =====
const coverImgEl = ref<HTMLImageElement | null>(null)
const coverLoaded = ref(false)
const coverError = ref(false)
// 图片原始宽高比（如 '1920 / 1080'），加载后按原比例自适应高度
const coverAspect = ref<string | null>(null)

// 封面图 URL（统一规范化：绝对 /uploads/ 地址转成 /api/uploads/ 相对路径，避免手机端 localhost 失败）
const coverSrc = computed(() => normalizeImageUrl(rawActivity.value?.coverImage))

// 主图容器宽高比样式：宽度撑满屏幕，高度按比例计算，无左右边距不变形
const coverRatioStyle = computed(() => ({
  aspectRatio: coverAspect.value || '3 / 2',
}))

// 图片加载完成：按自然尺寸计算真实宽高比，避免布局跳动与变形
function onCoverLoad(e: Event) {
  const el = e.target as HTMLImageElement
  if (el && el.naturalWidth > 0 && el.naturalHeight > 0) {
    coverAspect.value = `${el.naturalWidth} / ${el.naturalHeight}`
  }
  coverLoaded.value = true
  coverError.value = false
}

// 图片加载失败：回退到渐变占位
function onCoverError() {
  coverError.value = true
  coverLoaded.value = false
}

// 横竖屏切换 / 屏幕尺寸变化时，按图片原始尺寸重新计算宽高比
function handleResize() {
  const el = coverImgEl.value
  if (el && el.naturalWidth > 0 && el.naturalHeight > 0) {
    coverAspect.value = `${el.naturalWidth} / ${el.naturalHeight}`
  }
}

interface ActivityInfo {
  id: number
  title: string
  coverImage: string
  description: string
  type: string
  price: number
  location: string
  latitude: number | null
  longitude: number | null
  startTime: string
  endTime: string
  maxParticipants: number | null
  signupCount: number
  status: string
  publisherName: string
}

const rawActivity = ref<ActivityInfo | null>(null)
const loading = ref(true)
const submitting = ref(false)

// 封面地址变化时重置加载状态与占位比例（rawActivity 已初始化后再 watch，避免 TDZ 报错）
watch(coverSrc, () => {
  coverLoaded.value = false
  coverError.value = false
  coverAspect.value = null
})
const signupStatus = ref<{ isSignedUp: boolean; status: string | null; orderNo: string | null }>({
  isSignedUp: false,
  status: null,
  orderNo: null,
})

const activity = computed(() => {
  const a = rawActivity.value
  if (!a) {
    return {
      title: '加载中...', cover: '', emoji: '', statusText: '', isFree: false,
      date: '', location: '', capacity: '', priceHtml: '', publisher: '',
      desc: '', participants: '0', views: '0', signups: '0', full: false,
    }
  }
  const isFree = a.price === 0
  const maxP = a.maxParticipants ?? 0
  const full = maxP > 0 && a.signupCount >= maxP
  const statusMap: Record<string, string> = {
    pending: '审核中', approved: '报名中', rejected: '已拒绝', closed: '已结束',
  }

  const startDate = new Date(a.startTime)
  const endDate = new Date(a.endTime)
  const dateStr = `${startDate.getMonth() + 1}月${startDate.getDate()}日 ${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`
  const endStr = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`

  return {
    title: a.title,
    cover: a.coverImage ? `url(${a.coverImage}) center/cover no-repeat` : 'linear-gradient(135deg,#818cf8,#6366f1)',
    emoji: '',
    statusText: statusMap[a.status] || a.status,
    isFree,
    date: `${dateStr} - ${endStr}`,
    location: a.location,
    capacity: maxP > 0 ? `限${maxP}人` : '不限人数',
    priceHtml: isFree ? '免费' : `<span>¥</span>${a.price}`,
    publisher: a.publisherName,
    desc: a.description,
    sanitizedDesc: sanitizeRichHtml(a.description),
    participants: String(a.signupCount),
    views: '0',
    signups: '0',
    full,
  }
})

const signupBtnText = computed(() => {
  if (signupStatus.value.isSignedUp) return '已报名'
  if (signupStatus.value.status === 'pending_payment') return '去支付'
  if (activity.value.full) return '已满员'
  return '立即报名'
})

async function loadActivity() {
  try {
    const id = Number(route.params.id)
    const data = await getActivityDetail(id)
    rawActivity.value = {
      id: data.id,
      title: data.title,
      coverImage: data.coverImage || '',
      description: data.description || '',
      type: data.type || '',
      price: data.price ?? 0,
      location: data.location || '',
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      startTime: data.startTime,
      endTime: data.endTime,
      maxParticipants: data.maxParticipants ?? null,
      signupCount: data.signupCount ?? 0,
      status: data.status || '',
      publisherName: data.publisher?.name || data.publisherName || '',
    }
  } catch (err: any) {
    console.error('获取活动详情失败:', err)
    showToast(err.message || '加载失败')
  }
}

async function loadSignupStatus() {
  try {
    const id = Number(route.params.id)
    const data = await getActivitySignupStatus(id)
    signupStatus.value = {
      isSignedUp: data?.isSignedUp || false,
      status: data?.status || null,
      orderNo: data?.orderNo || null,
    }
  } catch (err: any) {
    console.error('获取报名状态失败:', err)
  }
}

onMounted(async () => {
  await loadActivity()
  await loadSignupStatus()
  loading.value = false

  // 监听屏幕尺寸变化 / 横竖屏切换，重新适配主图宽高比
  window.addEventListener('resize', handleResize)
  window.addEventListener('orientationchange', handleResize)

  // 从支付成功页返回时刷新状态
  if (route.query.paid === '1') {
    showToast('支付成功，报名已确认')
    await loadSignupStatus()
    await loadActivity()
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('orientationchange', handleResize)
})

const handleSignup = async () => {
  if (!rawActivity.value || submitting.value) return
  if (signupStatus.value.isSignedUp) {
    showToast('您已报名该活动')
    return
  }

  submitting.value = true
  try {
    const result = await signupActivity(rawActivity.value.id)
    if (result?.needPay && result?.order?.id) {
      router.push(`/order/pay/${result.order.id}?type=activity&redirect=${encodeURIComponent(`/activity/detail/${rawActivity.value.id}`)}`)
      return
    }
    showToast('报名成功！')
    signupStatus.value = { isSignedUp: true, status: 'confirmed', orderNo: result?.signup?.orderNo || null }
    if (rawActivity.value) rawActivity.value.signupCount++
  } catch (err: any) {
    showToast(err.message || '报名失败')
  } finally {
    submitting.value = false
  }
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.replace('/activity/list')
  }
}

function shareActivity() {
  showToast('分享功能开发中')
}

// 打开系统地图并定位到活动地点（兼容 iOS / Android 双平台）
function openMap() {
  const a = rawActivity.value
  if (!a || !a.location) {
    showToast('暂无地点信息')
    return
  }
  const lat = a.latitude
  const lng = a.longitude
  const query = encodeURIComponent(a.location)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isAndroid = /Android/i.test(navigator.userAgent)

  let url: string
  // 有精确坐标 → 直接定位到坐标点
  if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
    if (isIOS) {
      url = `maps://maps.apple.com/?q=${lat},${lng}&ll=${lat},${lng}&z=16`
    } else if (isAndroid) {
      url = `geo:${lat},${lng}?q=${lat},${lng}(${query})`
    } else {
      // PC 兜底：打开高德地图网页
      url = `https://uri.amap.com/marker?position=${lng},${lat}&name=${query}`
    }
  } else {
    // 无坐标 → 用地址文本搜索
    if (isIOS) {
      url = `maps://maps.apple.com/?q=${query}`
    } else if (isAndroid) {
      url = `geo:0,0?q=${query}`
    } else {
      url = `https://uri.amap.com/search?keyword=${query}`
    }
  }

  window.location.href = url
}

function showToast(msg: string) {
  const el = document.createElement('div')
  el.textContent = msg
  el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,.75);color:#fff;padding:12px 24px;border-radius:8px;font-size:14px;z-index:9999;white-space:nowrap'
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 2000)
}
</script>

<style scoped>
@import '@/styles/global.css';

.activity-cover-hero {
  width: 100%;
  position: relative;
  overflow: hidden;
  background-color: #f0f0f5;
  line-height: 0; /* 消除内联元素底部间隙 */
}
.cover-main-img {
  width: 100%;
  height: 100%;
  object-fit: cover; /* 容器比例与图片一致，故不裁剪不变形 */
  display: block;
  position: absolute;
  inset: 0;
  transition: opacity 0.3s ease;
}
.cover-placeholder {
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, #ececf1 25%, #f7f7fa 37%, #ececf1 63%);
  background-size: 400% 100%;
  animation: cover-shimmer 1.4s ease infinite;
}
.cover-skeleton { position: absolute; inset: 0; }
@keyframes cover-shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}
.cover-fallback {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #818cf8, #6366f1);
}
.cover-status {
  position: absolute; top: 16px; left: 16px;
  font-size: 12px; font-weight: 700; color: #fff;
  background: rgba(99,102,241,0.85); padding: 4px 12px; border-radius: 99px;
}
.cover-status.free { background: rgba(16,185,129,0.85); }

.info-card {
  margin: 12px 16px; border-radius: var(--radius-xl);
  background: rgba(255,255,255,0.75);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.5);
  box-shadow: var(--glass-shadow);
  padding: 16px;
}
.activity-name {
  font-size: 18px; font-weight: 800; color: var(--color-text-primary);
  line-height: 1.4; margin-bottom: 12px;
}
.info-row {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: var(--color-text-secondary); margin-bottom: 8px;
}
.info-row svg { width: 16px; height: 16px; color: var(--color-text-tertiary); flex-shrink: 0; }
.section-label {
  font-size: 15px; font-weight: 700; color: var(--color-text-primary);
  margin-bottom: 10px;
}
.desc-text {
  font-size: 14px; color: var(--color-text-secondary); line-height: 1.8;
}

.stats-card {
  display: flex; justify-content: space-around; padding: 20px 16px;
}
.stat-box { display: flex; flex-direction: column; align-items: center; }
.stat-num { font-size: 22px; font-weight: 800; color: var(--color-primary); }
.stat-txt { font-size: 12px; color: var(--color-text-tertiary); margin-top: 4px; }

.map-placeholder {
  min-height: 72px; border-radius: var(--radius-md);
  background: var(--color-primary-50);
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px;
  cursor: pointer;
  transition: background 0.2s;
}
.map-placeholder:active { background: var(--color-primary-100); }
.map-pin {
  width: 40px; height: 40px; border-radius: 50%;
  background: rgba(255,255,255,0.8);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.map-pin svg { width: 22px; height: 22px; color: var(--color-primary); }
.map-info { flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.map-addr { font-size: 14px; color: var(--color-text-primary); font-weight: 600; line-height: 1.4; word-break: break-all; }
.map-hint { font-size: 12px; color: var(--color-primary); }
.map-arrow { width: 18px; height: 18px; color: var(--color-text-tertiary); flex-shrink: 0; }

.bottom-action {
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 430px;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-top: 0.5px solid rgba(60,60,67,0.1);
  padding: 12px 16px env(safe-area-inset-bottom, 12px);
  display: flex; align-items: center; justify-content: space-between; z-index: 200;
}
.price-section { display: flex; flex-direction: column; gap: 2px; }
.price-value { font-size: 22px; font-weight: 800; color: var(--color-primary); }
.price-value span { font-size: 14px; }
.price-value.free { color: #10b981; font-size: 18px; }
.price-tip { font-size: 11px; color: #f59e0b; }
.signup-btn {
  padding: 10px 32px; border-radius: 22px; border: none;
  background: var(--color-primary); color: #fff;
  font-size: 15px; font-weight: 600; cursor: pointer;
  transition: all 0.2s;
}
.signup-btn:active { transform: scale(0.96); }
.signup-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
