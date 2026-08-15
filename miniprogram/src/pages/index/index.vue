<template>
  <view :style="sbStyle" class="phone-frame index-root">
    <!-- Banner 轮播 -->
    <view class="banner-section">
      <view class="banner-track" :style="{ transform: `translateX(-${bannerIndex * 100}%)` }">
        <view class="banner-slide" v-for="(b) in banners" :key="b.id" @click="onBannerClick(b)">
          <image v-if="b.imageUrl && !b.imgError" :src="b.imageUrl" class="banner-img" mode="aspectFill" @error="b.imgError = true" />
          <view v-else class="banner-img banner-fallback" :style="b.fallbackStyle">
            <text class="banner-fallback-emoji">{{ b.emoji }}</text>
          </view>
          <view class="banner-overlay">
            <text class="banner-title">{{ b.title }}</text>
            <text class="banner-sub" v-if="b.content">{{ b.content }}</text>
          </view>
        </view>
      </view>
      <view class="top-overlay">
        <view class="search-bar">
          <image class="ic-search-white" :src="iconSearchWhite" mode="aspectFit" />
          <input
            type="text"
            v-model="searchKeyword"
            placeholder="搜索活动、商机、商品"
            confirm-type="search"
            @focus="openSearch"
            @confirm="handleSearch"
          />
          <text class="search-btn" @click="handleSearch">搜索</text>
        </view>
      </view>
      <view class="banner-dots" v-if="banners.length > 1">
        <view
          v-for="(b, i) in banners"
          :key="'d' + b.id"
          class="dot"
          :class="{ active: i === bannerIndex }"
          @click="bannerIndex = i"
        ></view>
      </view>
    </view>

    <view class="main-scroll">
      <!-- Quick Entry -->
      <view class="quick-entry">
        <view class="entry-item" @click="$router.push('/activity/list')">
          <view class="entry-icon">
            <image :src="iconEntryCalendar" mode="aspectFit" />
          </view>
          <text class="entry-label">活动报名</text>
        </view>
        <view class="entry-item" @click="goAbout">
          <view class="entry-icon">
            <image :src="iconEntryChart" mode="aspectFit" />
          </view>
          <text class="entry-label">关于我们</text>
        </view>
        <view class="entry-item" @click="$router.push('/mall/index')">
          <view class="entry-icon">
            <image :src="iconEntryBag" mode="aspectFit" />
          </view>
          <text class="entry-label">会员商城</text>
        </view>
        <view class="entry-item" @click="$router.push('/card/index')">
          <view class="entry-icon">
            <image :src="iconEntryCard" mode="aspectFit" />
          </view>
          <text class="entry-label">我的名片</text>
        </view>
      </view>

      <!-- Announcement -->
      <view class="announcement-bar" :class="{ 'has-warning': hasWarningAnn }" @click="goAnnouncement">
        <text class="ann-tag" :class="tagClass">{{ tagText }}</text>
        <view class="ann-scroll">
          <text class="ann-text" v-if="annList.length">
            <template v-for="(a, i) in annList" :key="i">
              <text class="ann-type-icon" v-if="annTypeIcon(a)">{{ annTypeIcon(a) }}</text>{{ a.content }}<text class="ann-sep" v-if="i < annList.length - 1">　·　</text>
            </template>
          </text>
          <text class="ann-text" v-else>欢迎加入聚格软件，连接优质资源，成就商业梦想！</text>
        </view>
        <image class="ann-arrow" :src="iconAnnArrow" mode="aspectFit" />
      </view>

      <!-- 大咖人脉入口（与个人中心交换位置） -->
      <view class="dajia-module" @click="handleDajiaClick">
        <view class="dajia-module-left">
          <view class="dajia-logo">
            <image :src="iconDajiaUsers" mode="aspectFit" />
          </view>
          <view class="dajia-module-info">
            <view class="dajia-module-title">大咖人脉</view>
            <view class="dajia-module-sub" v-if="dajiaVipOk">结识行业大咖 · 交换联系方式</view>
            <view class="dajia-module-sub" v-else>开通 VIP{{ dajiaMinVipLevel }} 解锁更多精彩</view>
          </view>
        </view>
        <view class="dajia-module-right">
          <view class="dajia-vip-tag" v-if="dajiaVipOk"><text>已开通</text></view>
          <view class="dajia-vip-tag locked" v-else>
            <image :src="iconDajiaLock" mode="aspectFit" />
            <text>VIP专属</text>
          </view>
          <image :src="iconDajiaChevron" mode="aspectFit" />
        </view>
      </view>

      <!-- Hot Activities -->
      <view class="section-header">
        <text class="section-title">热门活动</text>
        <text class="section-more" @click="$router.push('/activity/list')">查看全部 ›</text>
      </view>
      <view class="activities-scroll">
        <view class="activity-card" v-for="a in activities" :key="a.id" @click="$router.push('/activity/detail/' + a.id)">
          <view class="activity-card-img">
            <!-- 封面渲染策略：优先加载真实封面图（aspectFill 裁剪），失败时回退到带 emoji 的渐变占位 -->
            <image
              v-if="a.coverImage && !a.coverError"
              class="activity-card-cover-img"
              :src="a.coverImage"
              mode="aspectFill"
              @error="a.coverError = true"
            />
            <view v-else class="activity-card-cover-fallback" :style="a.coverFallbackStyle">
              <text class="emoji">{{ a.emoji }}</text>
            </view>
            <text class="status" :class="{ free: a.isFree }">{{ a.statusText }}</text>
          </view>
          <view class="activity-card-body">
            <text class="activity-card-title">{{ a.title }}</text>
            <view class="activity-card-meta">
              <image :src="iconMetaCalendar" mode="aspectFit" />
              <text>{{ a.date }}</text>
            </view>
            <view class="activity-card-meta">
              <image :src="iconMetaPin" mode="aspectFit" />
              <text>{{ a.location }}</text>
            </view>
            <view class="activity-card-footer">
              <view class="activity-price" :class="{ free: a.isFree }" v-html="a.priceHtml"></view>
              <text class="activity-signup">{{ a.signupCount }}人已报名</text>
            </view>
          </view>
        </view>
      </view>

      <!-- Latest Business -->
      <view class="section-header">
        <text class="section-title">最新商机</text>
        <text class="section-more" @click="$router.push('/opportunity/list')">更多 ›</text>
      </view>
      <view class="business-list" v-if="businesses.length">
        <view class="business-item" v-for="b in businesses" :key="b.id" @click="$router.push('/business/detail/' + b.id)">
          <view class="biz-top">
            <text class="biz-tag" :class="b.tagClass">{{ b.tag }}</text>
            <view class="biz-price" :class="{ free: b.isFree }" v-html="b.priceHtml"></view>
          </view>
          <view class="biz-title">{{ b.title }}</view>
          <view class="biz-desc">{{ b.desc }}</view>
          <view class="biz-footer">
            <view class="biz-publisher">
              <view class="biz-avatar" :class="b.avatarClass">
                <image v-if="b.avatarUrl && !b.avatarError" :src="b.avatarUrl" class="biz-avatar-img" mode="aspectFill" @error="b.avatarError = true" />
                <text v-else>{{ b.publisher.charAt(0) }}</text>
              </view>
              <text class="biz-name">{{ b.publisher }}</text>
            </view>
            <view class="biz-footer-right">
              <view class="biz-progress">
                <text>对接</text>
                <view class="bar"><view class="fill" :style="{ width: b.progress + '%' }"></view></view>
                <text>{{ b.progressText }}</text>
              </view>
              <view class="biz-views">
                <image :src="iconBizEye" mode="aspectFit" />
                <text>{{ b.views }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
      <view class="business-empty" v-else>
        <text>暂无最新商机</text>
      </view>
    </view>

    <!-- Search Overlay -->
    <view class="search-overlay" v-if="searchActive">
      <view class="search-overlay-header">
        <view class="search-back" @click="closeSearch">
          <image :src="iconSearchBack" mode="aspectFit" />
        </view>
        <view class="search-overlay-input">
          <image class="ic-search-gray" :src="iconSearchGray" mode="aspectFit" />
          <input
            v-model="searchKeyword"
            confirm-type="search"
            @confirm="handleSearch"
            placeholder="搜索活动、商机、商品"
          />
          <text v-if="searchKeyword" class="search-clear" @click="clearSearch">✕</text>
        </view>
        <text class="search-action" @click="handleSearch">搜索</text>
      </view>

      <view class="search-overlay-body">
        <view v-if="searchLoading" class="search-state">搜索中...</view>

        <template v-else-if="searchDone">
          <view v-if="hasResults" class="search-results">
            <view class="search-section" v-if="searchResults.activities?.length">
              <view class="search-section-title">活动</view>
              <view class="search-item" v-for="a in searchResults.activities" :key="'a' + a.id" @click="goActivity(a.id)">
                <image v-if="normalizeImageUrl(a.coverImage)" :src="normalizeImageUrl(a.coverImage)" class="search-item-img" mode="aspectFill" />
                <view v-else class="search-item-img search-item-img-fallback">🎉</view>
                <view class="search-item-info">
                  <view class="search-item-title">{{ a.title }}</view>
                  <view class="search-item-meta" v-if="a.location">{{ a.location }}</view>
                  <view class="search-item-price" :class="{ free: a.price === 0 }">{{ a.price === 0 ? '免费' : '¥' + a.price }}</view>
                </view>
              </view>
            </view>

            <view class="search-section" v-if="searchResults.businesses?.length">
              <view class="search-section-title">商机</view>
              <view class="search-item" v-for="b in searchResults.businesses" :key="'b' + b.id" @click="goBusiness(b.id)">
                <view class="search-item-info">
                  <view class="search-item-title">{{ b.title }}</view>
                  <view class="search-item-meta" v-if="b.description">{{ stripHtml(b.description) }}</view>
                  <view class="search-item-price" :class="{ free: b.unlockFee === 0 }">{{ b.unlockFee === 0 ? '免费解锁' : '¥' + b.unlockFee }}</view>
                </view>
              </view>
            </view>

            <view class="search-section" v-if="searchResults.products?.length">
              <view class="search-section-title">商品</view>
              <view class="search-item" v-for="p in searchResults.products" :key="'p' + p.id" @click="goProduct(p.id)">
                <image v-if="normalizeImageUrl(p.coverImage)" :src="normalizeImageUrl(p.coverImage)" class="search-item-img" mode="aspectFill" />
                <view v-else class="search-item-img search-item-img-fallback">🛍️</view>
                <view class="search-item-info">
                  <view class="search-item-title">{{ p.name }}</view>
                  <view class="search-item-price" :class="{ free: p.price === 0 }">{{ p.price === 0 ? '免费' : '¥' + p.price }}</view>
                </view>
              </view>
            </view>
          </view>
          <view v-else class="search-state">未找到相关结果</view>
        </template>

        <view v-else class="search-state">输入关键词，搜索活动、商机与商品</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { sbStyle } from '@/utils/sb'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { getHomepageData, getAnnouncements, globalSearch, getCurrentUser, getDajiaConfig, getSystemConfig } from '@/api/index'
import { setCache, getCache } from '@/utils/cache'
import { stripHtml } from '@/utils/sanitize'
import { normalizeImageUrl } from '@/utils/image'
import { svgUri } from '@/utils/svg'
import { copyText } from '@/utils/share'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()
const CACHE_KEY = 'homepage_data'

// ===== 内联 SVG 图标（小程序不支持模板内联 svg 标签，统一转为 data URI） =====
const iconSearchWhite = svgUri('<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>', { color: '#ffffff' })
const iconSearchGray = svgUri('<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>', { color: '#9ca3af' })
const iconEntryCalendar = svgUri(
  '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
  { color: '#6366f1', strokeWidth: '1.8' }
)
const iconEntryChart = svgUri('<path d="M3 21h18M6 21V11h5v10M13 21V8h5v13"/>', { color: '#6366f1', strokeWidth: '1.8' })
const iconEntryBag = svgUri(
  '<path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 01-8 0"/>',
  { color: '#6366f1', strokeWidth: '1.8' }
)
const iconEntryCard = svgUri(
  '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><circle cx="7" cy="14.5" r="1.5"/>',
  { color: '#6366f1', strokeWidth: '1.8' }
)
const iconAnnArrow = svgUri('<path d="M9 18l6-6-6-6"/>', { color: '#9ca3af' })
const iconDajiaUsers = svgUri(
  '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>',
  { color: '#ffffff' }
)
const iconDajiaLock = svgUri('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>', { color: '#f59e0b' })
const iconDajiaChevron = svgUri('<path d="M9 18l6-6-6-6"/>', { color: '#8b5cf6' })
const iconMetaCalendar = svgUri('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>', { color: '#9ca3af' })
const iconMetaPin = svgUri('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>', { color: '#9ca3af' })
const iconBizEye = svgUri('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>', { color: '#9ca3af' })
const iconSearchBack = svgUri('<path d="M19 12H5M12 19l-7-7 7-7"/>', { color: '#1e1b4b' })

// 小程序无法直接打开外链：复制链接后提示用户到浏览器打开
async function openExternal(url: string) {
  const ok = await copyText(url)
  uni.showToast({ title: ok ? '链接已复制，请在浏览器打开' : '复制失败，请重试', icon: 'none' })
}

// ===== 大咖人脉（从个人中心交换至首页） =====
const userInfo = ref<any>(userStore.userInfo || null)
const dajiaMinVipLevel = ref(1)
const dajiaVipOk = computed(() => {
  const u = userInfo.value
  if (!u) return false
  if ((u.vipLevel || 0) < dajiaMinVipLevel.value) return false
  if (u.vipExpireAt && new Date(u.vipExpireAt).getTime() < Date.now()) return false
  return true
})
function handleDajiaClick() {
  if (dajiaVipOk.value) {
    router.push('/dajia/index')
  } else {
    router.push('/vip/index')
  }
}
async function loadDajiaConfig() {
  try {
    const config = await getDajiaConfig()
    dajiaMinVipLevel.value = config?.minVipLevel || 1
  } catch {
    // 忽略，使用默认级别
  }
}

// ===== 关于我们入口：管理端可配置跳转链接（优先于富文本内容页面） =====
const aboutUsLink = ref('')
async function loadAboutUsLink() {
  try {
    const res: any = await getSystemConfig('about_us_link')
    aboutUsLink.value = (res?.value || '').trim()
  } catch {
    // 忽略：读取失败时按未配置处理，走默认富文本页面
  }
}
function goAbout() {
  let link = aboutUsLink.value
  if (!link) {
    router.push('/about/index')
    return
  }
  // 容错：未带协议的裸域名（如 www.jugekeji.com）自动补 https://
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(link) && !link.startsWith('/') && /^[^/?#\s]+\.[a-z]{2,}/i.test(link)) {
    link = 'https://' + link
  }
  // 外部链接：小程序不能直接打开，复制链接提示用户在浏览器打开
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(link)) {
    openExternal(link)
    return
  }
  // 站内路径走 SPA 路由
  router.push(link)
}
async function loadUserInfo() {
  // 未登录直接跳过，避免 401 触发无谓的登录跳转与提示
  if (!userStore.isLoggedIn) return
  try {
    const u = await getCurrentUser()
    if (u) {
      userInfo.value = u
      userStore.setUserInfo(u)
    }
  } catch {
    // 静默失败
  }
}

const activities = ref<any[]>([])
const businesses = ref<any[]>([])
const announcements = ref<{ title: string; content: string; type?: string }[]>([])
// 公告内容走横向缓慢滚动（marquee），内容超长时才滚动
const annList = computed(() => announcements.value)

// 按公告类型动态计算标签文本与样式
const annTypeMap: Record<string, { text: string; cls: string }> = {
  warning: { text: '警告', cls: 'tag-warning' },
  notice: { text: '通知', cls: 'tag-notice' },
  announcement: { text: '公告', cls: 'tag-announcement' },
}
const hasWarningAnn = computed(() => annList.value.some((a) => a.type === 'warning'))
const tagText = computed(() => {
  const first = annList.value[0]
  return (first && annTypeMap[first.type]) ? annTypeMap[first.type].text : '公告'
})
const tagClass = computed(() => {
  const first = annList.value[0]
  return (first && annTypeMap[first.type]) ? annTypeMap[first.type].cls : 'tag-announcement'
})
// 每条公告的类型图标（通知沿用公告栏标签区分，警告用警示图标）
function annTypeIcon(a: any) {
  if (a.type === 'warning') return '⚠'
  return ''
}

const bannerText = ref('2026 社群商业资源峰会')
const bannerSubtitle = ref('7月15日 · 深圳国际会展中心 · 限额500人')
const banners = ref<any[]>([])
const bannerIndex = ref(0)
const bannerIntervalVal = ref(4) // 秒
let bannerTimer: ReturnType<typeof setInterval> | null = null
let annRefreshTimer: ReturnType<typeof setInterval> | null = null
const loading = ref(false)

// ===== 搜索 =====
const searchActive = ref(false)
const searchKeyword = ref('')
const searchResults = ref<{ activities: any[]; businesses: any[]; products: any[] }>({ activities: [], businesses: [], products: [] })
const searchLoading = ref(false)
const searchDone = ref(false)
const hasResults = computed(() =>
  searchResults.value.activities?.length ||
  searchResults.value.businesses?.length ||
  searchResults.value.products?.length
)

function openSearch() {
  searchActive.value = true
  searchDone.value = false
  searchResults.value = { activities: [], businesses: [], products: [] }
}

function closeSearch() {
  searchActive.value = false
  searchKeyword.value = ''
  searchDone.value = false
  searchResults.value = { activities: [], businesses: [], products: [] }
}

function clearSearch() {
  searchKeyword.value = ''
  searchDone.value = false
  searchResults.value = { activities: [], businesses: [], products: [] }
}

async function handleSearch() {
  const kw = (searchKeyword.value || '').trim()
  if (!kw) {
    if (!searchActive.value) openSearch()
    return
  }
  // 从顶部搜索框触发时，先打开结果浮层，再携带关键词立即搜索
  if (!searchActive.value) openSearch()
  searchLoading.value = true
  searchDone.value = false
  try {
    const data = await globalSearch(kw)
    searchResults.value = {
      activities: data?.activities || [],
      businesses: data?.businesses || [],
      products: data?.products || [],
    }
    searchDone.value = true
  } catch (err: any) {
    console.error('搜索失败:', err)
    searchResults.value = { activities: [], businesses: [], products: [] }
    searchDone.value = true
  } finally {
    searchLoading.value = false
  }
}

function goActivity(id: number) { closeSearch(); router.push(`/activity/detail/${id}`) }
function goBusiness(id: number) { closeSearch(); router.push(`/business/detail/${id}`) }
function goProduct(id: number) { closeSearch(); router.push(`/mall/detail/${id}`) }

function goAnnouncement() {
  if (!announcements.value.length) {
    router.push('/message/index')
    return
  }
  const first = announcements.value[0]
  if (first?.url) openExternal(first.url)
  else router.push('/message/index')
}

// ===== 公告 =====
async function loadAnnouncements() {
  try {
    const data = await getAnnouncements()
    if (Array.isArray(data) && data.length) {
      announcements.value = data
    }
  } catch (err) {
    console.error('公告加载失败:', err)
  }
}

// ===== Banner 轮播 =====
function startBannerTicker() {
  stopBannerTicker()
  if (banners.value.length <= 1) return
  const ms = Math.max(1000, bannerIntervalVal.value * 1000)
  bannerTimer = setInterval(() => {
    bannerIndex.value = (bannerIndex.value + 1) % banners.value.length
  }, ms)
}

function stopBannerTicker() {
  if (bannerTimer) { clearInterval(bannerTimer); bannerTimer = null }
}

function onBannerClick(b: any) {
  if (!b.linkType || !b.linkUrl) return
  if (b.linkType === 'url') { openExternal(b.linkUrl); return }
  const routes: Record<string, string> = {
    activity: `/activity/detail/${b.linkUrl}`,
    business: `/business/detail/${b.linkUrl}`,
    mall: `/mall/detail/${b.linkUrl}`,
    vip: `/vip/index`,
  }
  if (b.linkType === 'vip') { router.push(routes.vip); return }
  if (routes[b.linkType]) router.push(routes[b.linkType])
}

async function loadHomepage() {
  // 优先使用缓存
  const cached = getCache(CACHE_KEY)
  if (cached) {
    applyData(cached)
  }

  loading.value = true
  try {
    const data = await getHomepageData()
    if (data) {
      setCache(CACHE_KEY, data, 5 * 60 * 1000) // 5分钟缓存
      applyData(data)
    }
  } catch (err: any) {
    console.error('首页数据加载失败:', err)
    // 加载失败时尝试使用缓存兜底
    const cached = getCache(CACHE_KEY)
    if (cached) {
      applyData(cached)
    }
  } finally {
    loading.value = false
  }
}

function applyData(data: any) {
  if (!data) return

  // 公告
  if (data.announcements?.length) {
    announcements.value = data.announcements
  }

  // Banner
  if (data.banners?.length) {
    const emojiList = ['🎉', '🎯', '🚀', '💡', '🔥', '🌟']
    banners.value = data.banners.map((b: any, idx: number) => ({
      id: b.id || idx,
      title: b.title || '',
      content: b.content || '',
      imageUrl: b.imageUrl ? normalizeImageUrl(b.imageUrl) : '',
      imgError: false,
      linkUrl: b.linkUrl || '',
      linkType: b.linkType || '',
      fallbackStyle: { background: `hsl(${(idx * 60 + 230) % 360}, 65%, 60%)` },
      emoji: emojiList[idx % emojiList.length],
    }))
    bannerIndex.value = 0
  } else if (!banners.value.length) {
    // 无 Banner 时的默认占位，避免首页出现空白
    banners.value = [{
      id: 0,
      title: bannerText.value,
      content: bannerSubtitle.value,
      imageUrl: '',
      imgError: false,
      linkUrl: '',
      linkType: '',
      fallbackStyle: { background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)' },
      emoji: '🎉',
    }]
    bannerIndex.value = 0
  }
  if (data.bannerInterval && data.bannerInterval > 0) {
    bannerIntervalVal.value = data.bannerInterval
  }
  startBannerTicker()

  // 转换活动数据
  if (data.activities?.length) {
    activities.value = data.activities.map((a: any) => {
      // 封面图：保留原值用于 <image>，并预生成回退占位（纯色 + emoji）
      const baseColor = `hsl(${(a.id * 47) % 360}, 60%, 65%)`
      const emojiList = ['🎉', '🎯', '🚀', '💡', '🔥', '🌟']
      return {
        id: a.id,
        title: a.title,
        // 封面图必须规范化：补全为绝对 API 地址，否则图片加载失败
        coverImage: a.coverImage ? normalizeImageUrl(a.coverImage) : '',
        coverError: false,  // <image> 加载失败时翻为 true，触发回退渲染
        coverFallbackStyle: { background: baseColor },
        emoji: emojiList[a.id % emojiList.length],
        isFree: a.price === 0,
        statusText: a.status === 'approved' ? '报名中' : a.status,
        date: formatDateStr(a.startTime),
        location: a.location || '待定',
        priceHtml: a.price === 0 ? '免费' : `<span>¥</span>${a.price}`,
        signupCount: a.signupCount || 0,
      }
    })
  }

  // 转换商机数据
  if (data.businesses?.length) {
    const tagClasses = ['', 'coop', 'demand', 'pink']
    businesses.value = data.businesses.map((b: any) => {
      // 兼容多种分类数据结构：category.name / categoryName / categoryId
      const catName = b.category?.name || b.categoryName || '商机'
      const catId = b.categoryId || 0
      return {
        id: b.id,
        title: b.title,
        desc: stripHtml(b.description || ''),
        tag: catName,
        tagClass: tagClasses[catId % tagClasses.length],
        isFree: b.unlockFee === 0,
        priceHtml: b.unlockFee === 0 ? '免费' : `¥${b.unlockFee}`,
        publisher: b.publisher?.nickname || '匿名',
        avatarUrl: b.publisher?.avatarUrl ? normalizeImageUrl(b.publisher.avatarUrl) : '',
        avatarError: false,
        avatarClass: ['', 'c2', 'c3'][b.publisherId % 3],
        progress: b.maxUnlocks > 0 ? Math.round((b.currentUnlocks / b.maxUnlocks) * 100) : 0,
        progressText: `${b.currentUnlocks || 0}/${b.maxUnlocks || 0}`,
        views: 0,
      }
    })
  }
}

function formatDateStr(dateStr: string): string {
  if (!dateStr) return '待定'
  const d = new Date(dateStr)
  const m = d.getMonth() + 1
  const day = d.getDate()
  const week = ['日','一','二','三','四','五','六'][d.getDay()]
  return `${m}月${day}日 周${week}`
}

onMounted(() => {
  loadHomepage()
  loadAnnouncements()
  loadUserInfo()
  loadDajiaConfig()
  loadAboutUsLink()
  // 定时拉取公告（每 60 秒），保持最新
  annRefreshTimer = setInterval(loadAnnouncements, 60 * 1000)
})

onBeforeUnmount(() => {
  stopBannerTicker()
  if (annRefreshTimer) { clearInterval(annRefreshTimer); annRefreshTimer = null }
})
</script>

<style scoped>
/* ===== 页面根 ===== */
.index-root { min-height: 100vh; background: var(--color-bg); }

/* ===== Banner ===== */
.banner-section {
  position: relative;
  /* 状态栏避让由页面根元素 sbStyle 统一下推（env() 在小程序非 fixed 元素恒为 0） */
  height: 200px;
  overflow: hidden;
  /* 兜底背景，覆盖状态栏区域，保证与 banner 配色连贯 */
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
}
.banner-track {
  position: absolute; left: 0; right: 0; top: 0; bottom: 0;
  display: flex;
  transition: transform 0.45s ease;
}
.banner-slide {
  position: relative;
  flex: 0 0 100%;
  height: 100%;
  overflow: hidden;
}
.banner-img {
  width: 100%;
  height: 100%;
  display: block;
}
.banner-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
}
.banner-fallback-emoji { font-size: 56px; color: rgba(255,255,255,0.9); }
.banner-overlay {
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: 20px 16px 14px;
  background: linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%);
  color: #fff;
  text-align: left;
  pointer-events: none;
}
.banner-title { display: block; font-size: 18px; font-weight: 700; margin-bottom: 4px; letter-spacing: -0.3px; color: #fff; }
.banner-sub { display: block; font-size: 12px; opacity: 0.9; color: #fff; }
.banner-dots {
  position: absolute; bottom: 12px; right: 16px;
  display: flex; gap: 6px; z-index: 12;
}
.banner-dots .dot {
  width: 6px; height: 6px; border-radius: 99px;
  background: rgba(255,255,255,0.5);
  transition: all 0.25s ease;
}
.banner-dots .dot.active {
  width: 16px; background: #fff;
}

/* top: 安全区高度——edge-to-edge 下搜索框避让状态栏。
   绝对定位不受 .banner-section 的 padding-top 影响，必须显式指定 top。 */
.top-overlay { position: absolute; top: 0; left: 0; right: 0; z-index: 10; }
.search-bar {
  margin: 14px 16px 0;
  background: rgba(0,0,0,0.25);
  border-radius: 10px; display: flex; align-items: center;
  padding: 10px 14px; gap: 8px;
  border: 1px solid rgba(255,255,255,0.3);
}
.search-bar .ic-search-white { width: 16px; height: 16px; flex-shrink: 0; }
.search-bar input {
  border: none; outline: none; background: transparent;
  font-size: 14px; color: #fff; width: 100%; font-family: var(--font);
}
.search-btn {
  flex-shrink: 0; font-size: 13px; font-weight: 600; color: #fff;
  background: rgba(255,255,255,0.25); padding: 4px 12px; border-radius: 99px;
}

/* ===== Quick Entry ===== */
.quick-entry {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
  margin: 16px 16px 14px;
}
.entry-item {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  transition: transform 0.15s ease;
}
.entry-item:active { transform: scale(0.95); }
.entry-icon {
  width: 52px; height: 52px; border-radius: var(--radius-lg);
  background: var(--glass-bg); backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: var(--glass-border); box-shadow: var(--glass-shadow);
  display: flex; align-items: center; justify-content: center;
}
.entry-icon image { width: 26px; height: 26px; }
.entry-label { font-size: 12px; color: var(--color-text-primary); font-weight: 500; }

/* ===== Announcement ===== */
.announcement-bar {
  margin: 0 16px 16px; background: rgba(255,255,255,0.7);
  border-radius: var(--radius-md); padding: 11px 14px;
  display: flex; align-items: center; gap: 8px;
  border: 1px solid rgba(255,255,255,0.5);
  box-shadow: 0 2px 8px rgba(99,102,241,0.06);
}
/* 存在警告时整条公告栏红色高亮 */
.announcement-bar.has-warning {
  background: rgba(255,245,245,0.9);
  border-color: rgba(239,68,68,0.35);
  box-shadow: 0 2px 10px rgba(239,68,68,0.12);
}
.ann-tag {
  flex-shrink: 0; background: var(--color-primary); color: #fff;
  font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 99px;
}
.ann-tag.tag-warning { background: #ef4444; }
.ann-tag.tag-notice { background: var(--color-primary); }
.ann-tag.tag-announcement { background: var(--color-primary); }
.ann-scroll { flex: 1; overflow: hidden; height: 20px; display: flex; align-items: center; min-width: 0; }
.ann-text {
  flex: 1; min-width: 0; height: 20px; line-height: 20px;
  font-size: 13px; color: var(--color-text-secondary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
/* 警告：红色文字醒目 */
.ann-text.ann-warning { color: #dc2626; font-weight: 600; }
/* 通知：深灰色文字区分 */
.ann-text.ann-notice { color: #4b5563; }
.ann-type-icon {
  display: inline-block; margin-right: 4px; font-size: 12px;
  font-weight: 700; vertical-align: -1px;
}
.ann-warning .ann-type-icon { color: #ef4444; }
.ann-sep { color: var(--color-text-tertiary); }
.ann-arrow { width: 14px; height: 14px; flex-shrink: 0; }

/* ===== 大咖人脉模块（从个人中心交换至首页） ===== */
.dajia-module {
  margin: 0 16px 16px; padding: 14px 16px;
  background: linear-gradient(135deg, #faf5ff 0%, #ffffff 60%);
  border: 1px solid rgba(139,92,246,0.15);
  border-radius: var(--radius-xl);
  box-shadow: 0 4px 16px rgba(139,92,246,0.06);
  display: flex; align-items: center; justify-content: space-between;
  transition: transform 0.15s ease;
}
.dajia-module:active { transform: scale(0.98); }
.dajia-module-left { display: flex; align-items: center; gap: 12px; }
.dajia-logo {
  width: 44px; height: 44px; border-radius: 12px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.dajia-logo image { width: 24px; height: 24px; }
.dajia-module-info { min-width: 0; }
.dajia-module-title { font-size: 15px; font-weight: 700; color: #1e1b4b; margin-bottom: 3px; }
.dajia-module-sub { font-size: 11px; color: #6b7280; }
.dajia-module-right { display: flex; align-items: center; gap: 8px; color: #8b5cf6; }
.dajia-module-right > image { width: 16px; height: 16px; flex-shrink: 0; }
.dajia-vip-tag {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 10px; border-radius: 99px;
  background: rgba(16,185,129,0.1); color: #10b981;
  font-size: 11px; font-weight: 600; white-space: nowrap;
}
.dajia-vip-tag.locked { background: rgba(245,158,11,0.1); color: #f59e0b; }
.dajia-vip-tag image { width: 12px; height: 12px; }

/* ===== Section Header ===== */
.section-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 10px; padding: 0 16px;
}
.section-title { font-size: 18px; font-weight: 700; color: var(--color-text-primary); }
.section-more { font-size: 13px; color: var(--color-primary); font-weight: 500; }

/* ===== Activities Scroll ===== */
.activities-scroll {
  display: flex; gap: 10px; padding: 0 16px 18px;
  overflow-x: auto; scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}
.activity-card {
  min-width: 220px; flex-shrink: 0;
  border-radius: var(--radius-xl);
  background: rgba(255,255,255,0.65);
  border: 1px solid rgba(255,255,255,0.5);
  box-shadow: var(--glass-shadow);
  overflow: hidden; scroll-snap-align: start;
  transition: transform 0.15s ease;
}
.activity-card:active { transform: scale(0.97); }
.activity-card-img { height: 110px; position: relative; overflow: hidden; background: #f0f0f5; }
/* 真实封面图：aspectFill 保持比例并裁剪，宽度铺满 */
.activity-card-cover-img {
  display: block;
  width: 100%;
  height: 100%;
}
/* 回退占位：纯色 + emoji 居中，与 list 页行为一致 */
.activity-card-cover-fallback {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  background-size: cover; background-position: center;
}
.activity-card-cover-fallback .emoji { font-size: 48px; line-height: 1; }
.activity-card-img .status {
  position: absolute; top: 8px; left: 8px;
  font-size: 10px; font-weight: 700; color: #fff;
  background: rgba(99,102,241,0.85); padding: 3px 10px; border-radius: 99px;
}
.activity-card-img .status.free { background: rgba(16,185,129,0.85); }
.activity-card-body { padding: 10px 12px 12px; }
.activity-card-title {
  font-size: 13px; font-weight: 600; color: var(--color-text-primary);
  line-height: 1.4; margin-bottom: 6px;
  display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
}
.activity-card-meta {
  display: flex; align-items: center; gap: 4px;
  font-size: 11px; color: var(--color-text-tertiary);
}
.activity-card-meta image { width: 12px; height: 12px; flex-shrink: 0; }
.activity-card-footer {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(0,0,0,0.05);
}
.activity-price { font-size: 15px; font-weight: 700; color: var(--color-primary); }
.activity-price text { font-size: 10px; font-weight: 400; }
.activity-price.free { color: #10b981; font-size: 12px; font-weight: 600; }
.activity-signup { font-size: 10px; color: var(--color-text-tertiary); }

/* ===== Business List ===== */
.business-list { padding: 0 16px 18px; display: flex; flex-direction: column; gap: 10px; }
.business-item {
  border-radius: var(--radius-xl);
  background: rgba(255,255,255,0.65);
  border: 1px solid rgba(255,255,255,0.5);
  box-shadow: var(--glass-shadow);
  padding: 14px;
  transition: transform 0.15s ease;
}
.business-item:active { transform: scale(0.98); }
.biz-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.biz-tag {
  font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 99px;
  background: var(--color-primary-50); color: var(--color-primary);
}
.biz-tag.coop { background: #e9eef5; color: #2c4a6e; }
.biz-tag.demand { background: #fffbeb; color: #d97706; }
.biz-tag.pink { background: #fce7f3; color: #db2777; }
.biz-price { font-size: 15px; font-weight: 700; color: var(--color-primary); }
.biz-price.free { color: #1a2f4e; font-size: 12px; font-weight: 600; }
.biz-title {
  font-size: 14px; font-weight: 600; color: var(--color-text-primary);
  margin-bottom: 4px; line-height: 1.4;
  display: -webkit-box; -webkit-line-clamp: 1;
  -webkit-box-orient: vertical; overflow: hidden;
}
.biz-desc {
  font-size: 12px; color: var(--color-text-secondary);
  line-height: 1.5; margin-bottom: 10px;
  display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
}
.biz-footer { display: flex; align-items: center; justify-content: space-between; }
.biz-publisher { display: flex; align-items: center; gap: 6px; }
.biz-avatar {
  width: 24px; height: 24px; border-radius: 50%;
  background: var(--color-primary);
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 10px; font-weight: 700;
  overflow: hidden; flex-shrink: 0;
}
.biz-avatar-img { width: 100%; height: 100%; }
.biz-avatar.c2 {
  background: linear-gradient(135deg, #274a6f, #1a2f4e);
  color: #f5f7fa;
}
.biz-avatar.c3 { background: #f59e0b; }
.biz-name { font-size: 12px; color: var(--color-text-tertiary); }
.biz-footer-right { display: flex; align-items: center; gap: 12px; }
.biz-views { display: flex; align-items: center; gap: 3px; font-size: 11px; color: var(--color-text-tertiary); }
.biz-views image { width: 12px; height: 12px; }
.biz-progress {
  display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--color-text-tertiary);
}
.biz-progress .bar { width: 40px; height: 4px; border-radius: 2px; background: rgba(99,102,241,0.15); overflow: hidden; }
.biz-progress .fill { height: 100%; border-radius: 2px; background: var(--color-primary); }

/* 空状态 */
.business-empty {
  padding: 20px 16px;
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: 13px;
}

/* ===== Search Overlay ===== */
.search-overlay {
  position: fixed; top: 0; bottom: 0; left: 0; right: 0;
  width: 100%;
  z-index: 300;
  background: #f7f7fb; display: flex; flex-direction: column;
}
.search-overlay-header {
  display: flex; align-items: center; gap: 8px;
  /* fixed 元素不吃页面根 padding，用 --sbh 变量（由根元素 sbStyle 注入）避让状态栏 */
  padding: calc(var(--sbh, 0px) + 12px) 14px 12px; background: #fff;
  border-bottom: 0.5px solid rgba(60,60,67,0.1);
}
.search-back {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px;
}
.search-back image { width: 20px; height: 20px; }
.search-overlay-input {
  flex: 1; display: flex; align-items: center; gap: 8px;
  background: #f2f3f7; border-radius: 10px; padding: 8px 12px;
}
.search-overlay-input .ic-search-gray { width: 16px; height: 16px; flex-shrink: 0; }
.search-overlay-input input {
  flex: 1; border: none; outline: none; background: transparent;
  font-size: 14px; color: var(--color-text-primary); font-family: var(--font);
}
.search-clear {
  width: 18px; height: 18px; border-radius: 50%; background: #d1d5db;
  color: #fff; font-size: 11px; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.search-action {
  font-size: 14px; font-weight: 600; color: var(--color-primary);
  padding: 0 4px;
}
.search-overlay-body { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; }
.search-state {
  padding: 60px 20px; text-align: center; color: var(--color-text-tertiary); font-size: 14px;
}
.search-results { padding: 4px 14px 24px; }
.search-section { margin-top: 16px; }
.search-section-title {
  font-size: 13px; font-weight: 700; color: var(--color-text-secondary);
  margin-bottom: 8px; padding-left: 2px;
}
.search-item {
  display: flex; align-items: center; gap: 12px;
  background: #fff; border-radius: 12px; padding: 12px; margin-bottom: 10px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.search-item-img {
  width: 56px; height: 56px; border-radius: 8px;
  background: #f0f0f5; flex-shrink: 0;
}
.search-item-img-fallback {
  display: flex; align-items: center; justify-content: center;
  font-size: 26px; color: #a1a1aa;
}
.search-item-info { flex: 1; min-width: 0; }
.search-item-title {
  font-size: 14px; font-weight: 600; color: var(--color-text-primary);
  line-height: 1.4; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.search-item-meta {
  font-size: 12px; color: var(--color-text-tertiary); line-height: 1.4;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.search-item-price {
  font-size: 14px; font-weight: 700; color: var(--color-primary);
}
.search-item-price.free { color: #10b981; font-size: 12px; font-weight: 600; }
</style>
