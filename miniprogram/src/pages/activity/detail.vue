<template>
  <div :style="sbStyle" class="phone-frame">
    <div class="header">
      <div class="header-left">
        <div class="back-btn" @click="goBack">
          <image :src="iconBack" />
        </div>
        <span class="header-title">活动详情</span>
      </div>
      <div class="header-right">
        <div class="header-icon" :class="{ 'favorited': favorited }" @click="handleFavorite">
          <image v-if="favorited" :src="iconFavOn" />
          <image v-else :src="iconFavOff" />
        </div>
        <div class="header-icon" @click="shareActivity">
          <image :src="iconShare" />
        </div>
        <div class="header-icon" @click="goHome">
          <image :src="iconHome" />
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
        <image
          v-if="coverSrc && !coverError"
          :src="coverSrc"
          class="cover-main-img"
          mode="aspectFill"
          :style="{ opacity: coverLoaded ? 1 : 0 }"
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
          <image :src="iconDate" />
          <span>{{ activity.date }}</span>
        </div>
        <div class="info-row" @click="openMap">
          <image :src="iconLocation" />
          <span>{{ activity.location }}</span>
        </div>
        <div class="info-row">
          <image :src="iconUsers" />
          <span>{{ activity.capacity }}</span>
        </div>
        <div class="info-row">
          <image :src="iconUser" />
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
      <!-- 已报名成员头像（折叠/展开） -->
      <div class="info-card participants-card" v-if="signupUsers.length">
        <div class="participants-head">
          <h3 class="section-label">已报名成员</h3>
          <span class="participants-count">{{ activity.participants }} 人</span>
        </div>
        <div class="participants-list" :class="{ collapsed: signupsCollapsed }">
          <div class="participant" v-for="(u, i) in displaySignups" :key="u.userId">
            <div class="participant-avatar" :style="{ background: avatarColor(i) }">
              <image
                v-if="u.avatar"
                :src="u.avatar"
                class="participant-img"
                mode="aspectFill"
                @error="onAvatarError(u)"
              />
              <span v-else>{{ (u.nickname || '成员').charAt(0) }}</span>
            </div>
            <div class="participant-name">{{ u.nickname || '成员' }}</div>
          </div>
        </div>
        <div class="participants-toggle" v-if="signupUsers.length > 5" @click="signupsCollapsed = !signupsCollapsed">
          <span>{{ signupsCollapsed ? '展开全部' : '收起' }}</span>
          <image :class="{ expanded: !signupsCollapsed }" :src="iconChevron" />
        </div>
      </div>
      <!-- Map placeholder -->
      <div class="info-card">
        <h3 class="section-label">活动地点</h3>
        <div class="map-placeholder" @click="openMap">
          <div class="map-pin">
            <image :src="iconMapPin" />
          </div>
          <div class="map-info">
            <span class="map-addr">{{ activity.location }}</span>
            <span class="map-hint">点击打开地图导航 »</span>
          </div>
          <image class="map-arrow" :src="iconMapArrow" />
        </div>
      </div>
      <!-- Description（活动介绍卡片：全宽，内部图片铺满屏幕宽度，其他卡片宽度不变） -->
      <div class="info-card desc-card">
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

    <!-- 分享面板 -->
    <ShareSheet
      v-model="shareOpen"
      :share="shareContent"
      :referrer-id="userStore.userInfo?.id"
      :referrer-name="userStore.userInfo?.nickname || userStore.userInfo?.realName"
    />
  </div>
</template>

<script setup lang="ts">
import { sbStyle } from '@/utils/sb'
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app'
import { getActivityDetail, signupActivity, getActivitySignupStatus, recordActivityView, getActivityFavoriteStatus, toggleActivityFavorite } from '@/api'
import { sanitizeRichHtml } from '@/utils/sanitize'
import { normalizeImageUrl } from '@/utils/image'
import { recordBrowse } from '@/utils/browseHistory'
import { useUserStore } from '@/store/user'
import { svgUri } from '@/utils/svg'
import { copyText } from '@/utils/share'
import ShareSheet from '@/components/ShareSheet.vue'
import type { ShareContent } from '@/utils/share'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 页面参数：onLoad(options) 由小程序运行时直接传入（setup/onMounted 时页面尚未入栈，
// getCurrentPages() 取不到参数，computed 无响应式依赖还会永久缓存空值）
const pageOptions = ref<Record<string, string>>({})
const activityId = computed(() => Number(pageOptions.value.id) || Number(route.params.id) || 0)

// ===== 图标（内联 svg → data URI；原 currentColor 按设计令牌取具体色值） =====
const iconBack = svgUri('<path d="m15 18-6-6 6-6"/>', { color: '#1e1b4b' })
const iconFavOn = svgUri('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>', { color: '#f59e0b', fill: '#f59e0b', strokeWidth: '1.5' })
const iconFavOff = svgUri('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>', { color: '#6366f1' })
const iconShare = svgUri('<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>', { color: '#6366f1' })
const iconHome = svgUri('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>', { color: '#6366f1' })
const iconDate = svgUri('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>', { color: '#9ca3af' })
const iconLocation = svgUri('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>', { color: '#9ca3af' })
const iconUsers = svgUri('<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>', { color: '#9ca3af' })
const iconUser = svgUri('<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>', { color: '#9ca3af' })
const iconChevron = svgUri('<polyline points="6 9 12 15 18 9"/>', { color: '#6366f1' })
const iconMapPin = svgUri('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>', { color: '#6366f1', strokeWidth: '1.5' })
const iconMapArrow = svgUri('<path d="m9 18 6-6-6-6"/>', { color: '#9ca3af' })

// ===== 分享 =====
const shareOpen = ref(false)
const shareContent = ref<ShareContent | null>(null)
function shareActivity() {
  const a = rawActivity.value
  if (!a) return
  shareContent.value = {
    type: 'activity',
    title: a.title || '',
    desc: '优质活动推荐，快来看看吧！',
    image: a.coverImage,
    meta: [activity.value.date, activity.value.location].filter(Boolean),
    price: activity.value.priceHtml,
    path: `/activity/detail/${a.id}`,
  }
  shareOpen.value = true
}

// ===== 主图自适应 =====
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

// 图片加载完成：按自然尺寸计算真实宽高比，避免布局跳动与变形（小程序 image @load 返回 e.detail.width/height）
function onCoverLoad(e: any) {
  const w = e?.detail?.width
  const h = e?.detail?.height
  if (w > 0 && h > 0) {
    coverAspect.value = `${w} / ${h}`
  }
  coverLoaded.value = true
  coverError.value = false
}

// 图片加载失败：回退到渐变占位
function onCoverError() {
  coverError.value = true
  coverLoaded.value = false
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
  viewCount: number
  favoriteCount: number
  signupUsers?: { userId: number; nickname: string; avatarUrl: string }[]
  status: string
  publisherName: string
}

const rawActivity = ref<ActivityInfo | null>(null)
const loading = ref(true)
const submitting = ref(false)

// ===== 收藏 =====
const favorited = ref(false)
const favoriteLoading = ref(false)

// ===== 已报名成员头像 =====
const signupUsers = ref<{ userId: number; nickname: string; avatar: string }[]>([])
const signupsCollapsed = ref(true)

const displaySignups = computed(() => {
  if (signupUsers.value.length > 5 && signupsCollapsed.value) {
    return signupUsers.value.slice(0, 5)
  }
  return signupUsers.value
})

const AVATAR_COLORS = ['#ede9fe', '#dbeafe', '#fef3c7', '#fce7f3', '#d1fae5', '#e0e7ff', '#f5f3ff']
function avatarColor(i: number) {
  return AVATAR_COLORS[i % AVATAR_COLORS.length]
}
function onAvatarError(u: { avatar: string }) {
  // 头像加载失败：清空地址，回落到首字昵称占位
  u.avatar = ''
}

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
    // text 加内联字号：rich-text 内页面样式不可穿透
    priceHtml: isFree ? '免费' : `<span style="font-size:14px">¥</span>${a.price}`,
    publisher: a.publisherName,
    desc: a.description,
    sanitizedDesc: sanitizeRichHtml(a.description),
    participants: String(a.signupCount),
    views: String(a.viewCount ?? 0),
    signups: String(a.favoriteCount ?? 0),
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
    const id = activityId.value
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
      viewCount: data.viewCount ?? 0,
      favoriteCount: data.favoriteCount ?? 0,
      signupUsers: data.signupUsers || [],
      status: data.status || '',
      publisherName: data.publisher?.nickname || data.publisher?.name || data.publisherName || '',
    }
    // 已报名成员头像（规范化图片地址）
    signupUsers.value = (data.signupUsers || [])
      .map((u: any) => ({
        userId: u.userId,
        nickname: u.nickname || '',
        avatar: normalizeImageUrl(u.avatarUrl),
      }))
      .filter((u: any) => u.avatar)
    // 记录浏览历史
    recordBrowse('activity', data.id, data.title || '')
  } catch (err: any) {
    console.error('获取活动详情失败:', err)
    showToast(err.message || '加载失败')
  }
}

async function loadSignupStatus() {
  try {
    const id = activityId.value
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

// 每次进入详情页计入一次浏览量
async function recordView() {
  try {
    const id = activityId.value
    const data = await recordActivityView(id)
    if (data && typeof data.viewCount === 'number' && rawActivity.value) {
      rawActivity.value.viewCount = data.viewCount
    }
  } catch (err: any) {
    console.error('记录浏览量失败:', err)
  }
}

async function loadFavoriteStatus() {
  try {
    const id = activityId.value
    const data = await getActivityFavoriteStatus(id)
    favorited.value = data?.favorited || false
    if (data && typeof data.favoriteCount === 'number' && rawActivity.value) {
      rawActivity.value.favoriteCount = data.favoriteCount
    }
  } catch (err: any) {
    console.error('获取收藏状态失败:', err)
  }
}

async function handleFavorite() {
  if (favoriteLoading.value || !rawActivity.value) return
  favoriteLoading.value = true
  try {
    const id = activityId.value
    const data = await toggleActivityFavorite(id)
    favorited.value = data?.favorited || false
    if (data && typeof data.favoriteCount === 'number' && rawActivity.value) {
      rawActivity.value.favoriteCount = data.favoriteCount
    }
    showToast(favorited.value ? '已收藏' : '已取消收藏')
  } catch (err: any) {
    showToast(err.message || '操作失败')
  } finally {
    favoriteLoading.value = false
  }
}

// 页面加载：onLoad 时机参数已就绪（setup/onMounted 时页面尚未入栈，getCurrentPages() 取不到参数）
onLoad(async (options: any) => {
  pageOptions.value = options || {}
  await loadActivity()
  await loadSignupStatus()
  loading.value = false

  // 每次打开详情页自动计入一次浏览
  recordView()
  // 恢复收藏状态
  loadFavoriteStatus()

  // 从支付成功页返回时刷新状态
  if (pageOptions.value.paid === '1' || route.query.paid === '1') {
    showToast('支付成功，报名已确认')
    await loadSignupStatus()
    await loadActivity()
  }
})

// ===== 微信转发 =====
onShareAppMessage(() => {
  const a = rawActivity.value
  return {
    title: a?.title || '活动详情',
    path: '/pages/activity/detail?id=' + (a?.id ?? activityId.value),
    imageUrl: a?.coverImage ? normalizeImageUrl(a.coverImage) : undefined,
  }
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
  router.back()
}

// 一键返回主页
function goHome() {
  router.push('/')
}

// 打开地图并定位到活动地点（小程序：有坐标用 uni.openLocation，无坐标复制地址）
function openMap() {
  const a = rawActivity.value
  if (!a || !a.location) {
    showToast('暂无地点信息')
    return
  }
  const lat = a.latitude
  const lng = a.longitude
  const hasCoord = typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)

  if (hasCoord) {
    uni.openLocation({
      latitude: lat as number,
      longitude: lng as number,
      name: a.location,
      address: a.location,
    })
  } else {
    copyText(a.location).then(() => showToast('地址已复制'))
  }
}

function showToast(msg: string) {
  uni.showToast({ title: msg, icon: 'none' })
}
</script>

<style scoped>
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
.info-row image { width: 16px; height: 16px; flex-shrink: 0; }
.section-label {
  font-size: 15px; font-weight: 700; color: var(--color-text-primary);
  margin-bottom: 10px;
}
.desc-text {
  font-size: 14px; color: var(--color-text-secondary); line-height: 1.8;
}

/* 活动介绍卡片：宽度自适应为手机屏幕宽度（去掉左右边距，仅此卡片全宽，其他卡片不变） */
.desc-card {
  margin: 12px 0;
  border-radius: 0;
  border-left: none;
  border-right: none;
}

.stats-card {
  display: flex; justify-content: space-around; padding: 20px 16px;
}
.stat-box { display: flex; flex-direction: column; align-items: center; }
.stat-num { font-size: 22px; font-weight: 800; color: var(--color-primary); }
.stat-txt { font-size: 12px; color: var(--color-text-tertiary); margin-top: 4px; }

/* 收藏按钮高亮 */
.header-icon.favorited { background: rgba(245,158,11,0.15); }

/* 已报名成员 */
.participants-head {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;
}
.participants-head .section-label { margin-bottom: 0; }
.participants-count { font-size: 12px; color: var(--color-text-tertiary); }
.participants-list {
  display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px 8px;
}
.participants-list.collapsed {
  max-height: 92px; overflow: hidden;
}
.participant {
  display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 0;
}
.participant-avatar {
  width: 40px; height: 40px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; font-weight: 700; color: #4f46e5;
  overflow: hidden; flex-shrink: 0;
}
.participant-img { width: 100%; height: 100%; }
.participant-name {
  width: 100%; font-size: 11px; color: var(--color-text-secondary);
  text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.participants-toggle {
  display: flex; align-items: center; justify-content: center; gap: 4px;
  margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(0,0,0,0.05);
  font-size: 13px; color: var(--color-primary); cursor: pointer;
}
.participants-toggle image { width: 15px; height: 15px; transition: transform 0.2s; }
.participants-toggle image.expanded { transform: rotate(180deg); }

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
.map-pin image { width: 22px; height: 22px; }
.map-info { flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.map-addr { font-size: 14px; color: var(--color-text-primary); font-weight: 600; line-height: 1.4; word-break: break-all; }
.map-hint { font-size: 12px; color: var(--color-primary); }
.map-arrow { width: 18px; height: 18px; flex-shrink: 0; }

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
.price-value.free { color: #10b981; font-size: 18px; }
.price-tip { font-size: 11px; color: #f59e0b; }
.signup-btn {
  padding: 10px 32px; border-radius: 22px; border: none;
  background: var(--color-primary); color: #fff;
  font-size: 15px; font-weight: 600; cursor: pointer;
  transition: all 0.2s;
  line-height: 1.5;
}
.signup-btn::after { border: none; }
.signup-btn:active { transform: scale(0.96); }
.signup-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
