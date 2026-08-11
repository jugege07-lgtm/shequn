<template>
  <div class="phone-frame">
    <!-- Banner 轮播 -->
    <div class="banner-section">
      <div class="banner-track" :style="{ transform: `translateX(-${bannerIndex * 100}%)` }">
        <div class="banner-slide" v-for="(b, i) in banners" :key="b.id" @click="onBannerClick(b)">
          <img v-if="b.imageUrl && !b.imgError" :src="b.imageUrl" class="banner-img" :alt="b.title" loading="lazy" @error="b.imgError = true" />
          <div v-else class="banner-img banner-fallback" :style="b.fallbackStyle">
            <span class="banner-fallback-emoji">{{ b.emoji }}</span>
          </div>
          <div class="banner-overlay">
            <h3>{{ b.title }}</h3>
            <p v-if="b.content">{{ b.content }}</p>
          </div>
        </div>
      </div>
      <div class="top-overlay">
        <div class="search-bar" @click="openSearch">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="搜索活动、商机、商品" readonly />
          <span class="search-btn">搜索</span>
        </div>
      </div>
      <div class="banner-dots" v-if="banners.length > 1">
        <span
          v-for="(b, i) in banners"
          :key="'d' + b.id"
          class="dot"
          :class="{ active: i === bannerIndex }"
          @click="bannerIndex = i"
        ></span>
      </div>
    </div>

    <div class="main-scroll">
      <!-- Quick Entry -->
      <div class="quick-entry">
        <div class="entry-item" @click="$router.push('/activity/list')">
          <div class="entry-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <path d="M16 2v4M8 2v4M3 10h18"/>
              <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
            </svg>
          </div>
          <span class="entry-label">活动报名</span>
        </div>
        <div class="entry-item" @click="$router.push('/about/index')">
          <div class="entry-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 21h18M6 21V11h5v10M13 21V8h5v13"/>
            </svg>
          </div>
          <span class="entry-label">关于我们</span>
        </div>
        <div class="entry-item" @click="$router.push('/mall/index')">
          <div class="entry-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <path d="M3 6h18"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
          </div>
          <span class="entry-label">会员商城</span>
        </div>
        <div class="entry-item" @click="$router.push('/card/index')">
          <div class="entry-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
              <rect x="2" y="5" width="20" height="14" rx="2"/>
              <path d="M2 10h20"/>
              <circle cx="7" cy="14.5" r="1.5"/>
            </svg>
          </div>
          <span class="entry-label">我的名片</span>
        </div>
      </div>

      <!-- Announcement -->
      <div class="announcement-bar" :class="{ 'has-warning': hasWarningAnn }" @click="goAnnouncement">
        <span class="ann-tag" :class="tagClass">{{ tagText }}</span>
        <div class="ann-scroll" ref="annScrollRef">
          <div class="ann-marquee" v-if="annList.length" :class="{ animating: annLong }">
            <span ref="annInnerRef" class="ann-inner">
              <span
                class="ann-text"
                v-for="(a, i) in annList"
                :key="i"
                :class="annTextClass(a)"
              ><span class="ann-type-icon" v-if="annTypeIcon(a)">{{ annTypeIcon(a) }}</span>{{ a.content }}<span class="ann-sep" v-if="i < annList.length - 1">　　</span></span>
            </span>
            <span class="ann-inner" v-if="annLong" aria-hidden="true">
              <span
                class="ann-text"
                v-for="(a, i) in annList"
                :key="'d' + i"
                :class="annTextClass(a)"
              ><span class="ann-type-icon" v-if="annTypeIcon(a)">{{ annTypeIcon(a) }}</span>{{ a.content }}<span class="ann-sep" v-if="i < annList.length - 1">　　</span></span>
            </span>
          </div>
          <span class="ann-text" v-else>欢迎加入聚格软件，连接优质资源，成就商业梦想！</span>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </div>

      <!-- VIP Banner -->
      <div class="vip-banner" @click="$router.push('/vip/index')">
        <div class="vip-banner-left">
          <span class="vip-crown">👑</span>
          <div class="vip-banner-text">
            <h4>开通 VIP 会员</h4>
            <p>解锁专属权益 · 享受更多折扣</p>
          </div>
        </div>
        <span class="vip-open-btn">立即开通</span>
      </div>

      <!-- Hot Activities -->
      <div class="section-header">
        <span class="section-title">热门活动</span>
        <span class="section-more" @click="$router.push('/activity/list')">查看全部 ›</span>
      </div>
      <div class="activities-scroll">
        <div class="activity-card" v-for="a in activities" :key="a.id" @click="$router.push('/activity/detail/' + a.id)">
          <div class="activity-card-img">
            <!--
              封面渲染策略（与 activity/list.vue 对齐）：
              1) 优先用 <img> 加载真实封面图，失败时回退到带 emoji 的渐变占位
              2) loading="lazy" 避免首屏一次性加载所有图
              3) 使用 background-image 叠加（不是 background 简写），避免层被覆盖
            -->
            <img
              v-if="a.coverImage && !a.coverError"
              class="activity-card-cover-img"
              :src="a.coverImage"
              :alt="a.title"
              loading="lazy"
              @error="a.coverError = true"
            />
            <div v-else class="activity-card-cover-fallback" :style="a.coverFallbackStyle">
              <span class="emoji">{{ a.emoji }}</span>
            </div>
            <span class="status" :class="{ free: a.isFree }">{{ a.statusText }}</span>
          </div>
          <div class="activity-card-body">
            <h4>{{ a.title }}</h4>
            <div class="activity-card-meta">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
              {{ a.date }}
            </div>
            <div class="activity-card-meta">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {{ a.location }}
            </div>
            <div class="activity-card-footer">
              <span class="activity-price" :class="{ free: a.isFree }" v-html="a.priceHtml"></span>
              <span class="activity-signup">{{ a.signupCount }}人已报名</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Latest Business -->
      <div class="section-header">
        <span class="section-title">最新商机</span>
        <span class="section-more" @click="$router.push('/opportunity/list')">更多 ›</span>
      </div>
      <div class="business-list" v-if="businesses.length">
        <div class="business-item" v-for="b in businesses" :key="b.id" @click="$router.push('/business/detail/' + b.id)">
          <div class="biz-top">
            <span class="biz-tag" :class="b.tagClass">{{ b.tag }}</span>
            <span class="biz-price" :class="{ free: b.isFree }" v-html="b.priceHtml"></span>
          </div>
          <div class="biz-title">{{ b.title }}</div>
          <div class="biz-desc">{{ b.desc }}</div>
          <div class="biz-footer">
            <div class="biz-publisher">
              <div class="biz-avatar" :class="b.avatarClass">
                <img v-if="b.avatarUrl && !b.avatarError" :src="b.avatarUrl" class="biz-avatar-img" alt="头像" @error="b.avatarError = true" />
                <span v-else>{{ b.publisher.charAt(0) }}</span>
              </div>
              <span class="biz-name">{{ b.publisher }}</span>
            </div>
            <div style="display:flex;align-items:center;gap:12px;">
              <div class="biz-progress">
                对接
                <div class="bar"><div class="fill" :style="{width: b.progress + '%'}"></div></div>
                {{ b.progressText }}
              </div>
              <div class="biz-views">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                {{ b.views }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="business-empty" v-else>
        <span>暂无最新商机</span>
      </div>
    </div>

    <!-- Search Overlay -->
    <div class="search-overlay" v-if="searchActive">
      <div class="search-overlay-header">
        <span class="search-back" @click="closeSearch">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </span>
        <div class="search-overlay-input">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            ref="searchInputRef"
            v-model="searchKeyword"
            @keyup.enter="handleSearch"
            placeholder="搜索活动、商机、商品"
          />
          <span v-if="searchKeyword" class="search-clear" @click="clearSearch">✕</span>
        </div>
        <span class="search-action" @click="handleSearch">搜索</span>
      </div>

      <div class="search-overlay-body">
        <div v-if="searchLoading" class="search-state">搜索中...</div>

        <template v-else-if="searchDone">
          <div v-if="hasResults" class="search-results">
            <div class="search-section" v-if="searchResults.activities?.length">
              <div class="search-section-title">活动</div>
              <div class="search-item" v-for="a in searchResults.activities" :key="'a' + a.id" @click="goActivity(a.id)">
                <img v-if="normalizeImageUrl(a.coverImage)" :src="normalizeImageUrl(a.coverImage)" class="search-item-img" alt=""/>
                <div v-else class="search-item-img search-item-img-fallback">🎉</div>
                <div class="search-item-info">
                  <div class="search-item-title">{{ a.title }}</div>
                  <div class="search-item-meta" v-if="a.location">{{ a.location }}</div>
                  <div class="search-item-price" :class="{ free: a.price === 0 }">{{ a.price === 0 ? '免费' : '¥' + a.price }}</div>
                </div>
              </div>
            </div>

            <div class="search-section" v-if="searchResults.businesses?.length">
              <div class="search-section-title">商机</div>
              <div class="search-item" v-for="b in searchResults.businesses" :key="'b' + b.id" @click="goBusiness(b.id)">
                <div class="search-item-info">
                  <div class="search-item-title">{{ b.title }}</div>
                  <div class="search-item-meta" v-if="b.description">{{ stripHtml(b.description) }}</div>
                  <div class="search-item-price" :class="{ free: b.unlockFee === 0 }">{{ b.unlockFee === 0 ? '免费解锁' : '¥' + b.unlockFee }}</div>
                </div>
              </div>
            </div>

            <div class="search-section" v-if="searchResults.products?.length">
              <div class="search-section-title">商品</div>
              <div class="search-item" v-for="p in searchResults.products" :key="'p' + p.id" @click="goProduct(p.id)">
                <img v-if="normalizeImageUrl(p.coverImage)" :src="normalizeImageUrl(p.coverImage)" class="search-item-img" alt=""/>
                <div v-else class="search-item-img search-item-img-fallback">🛍️</div>
                <div class="search-item-info">
                  <div class="search-item-title">{{ p.name }}</div>
                  <div class="search-item-price" :class="{ free: p.price === 0 }">{{ p.price === 0 ? '免费' : '¥' + p.price }}</div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="search-state">未找到相关结果</div>
        </template>

        <div v-else class="search-state">输入关键词，搜索活动、商机与商品</div>
      </div>
    </div>

    <!-- TabBar -->
    <div class="tabbar">
      <div class="tab active">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/>
        </svg>
        <span>首页</span>
      </div>
      <div class="tab" @click="$router.push('/activity/list')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
        </svg>
        <span>活动</span>
      </div>
      <div class="tab" @click="$router.push('/opportunity/list')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
        </svg>
        <span>商机</span>
      </div>
      <div class="tab" @click="$router.push('/mall/index')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 2h16l-2 12H6L4 2zm0 0l-1 6M6 20a2 2 0 100 4 2 2 0 000-4zm12 0a2 2 0 100 4 2 2 0 000-4z"/>
        </svg>
        <span>商城</span>
      </div>
      <div class="tab" @click="$router.push('/profile/index')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
        <span>我的</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { getHomepageData, checkAppVersion, getAnnouncements, globalSearch } from '@/api/index'
import { setCache, getCache } from '@/utils/cache'
import { stripHtml } from '@/utils/sanitize'
import { normalizeImageUrl } from '@/utils/image'

const router = useRouter()
const CACHE_KEY = 'homepage_data'

const activities = ref<any[]>([])
const businesses = ref<any[]>([])
const announcements = ref<{ title: string; content: string; type?: string }[]>([])
// 公告内容走横向缓慢滚动（marquee），内容超长时才滚动
const annList = computed(() => announcements.value)
const annLong = ref(false)
const annScrollRef = ref<HTMLElement | null>(null)
const annInnerRef = ref<HTMLElement | null>(null)

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
// 每条公告的类型样式 class
function annTextClass(a: any) {
  if (a.type === 'warning') return 'ann-warning'
  if (a.type === 'notice') return 'ann-notice'
  return ''
}
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
const searchInputRef = ref<HTMLInputElement | null>(null)
const hasResults = computed(() =>
  searchResults.value.activities?.length ||
  searchResults.value.businesses?.length ||
  searchResults.value.products?.length
)

function openSearch() {
  searchActive.value = true
  searchDone.value = false
  searchResults.value = { activities: [], businesses: [], products: [] }
  nextTick(() => searchInputRef.value?.focus())
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
  searchInputRef.value?.focus()
}

async function handleSearch() {
  const kw = (searchKeyword.value || '').trim()
  if (!kw) return
  if (!searchActive.value) {
    openSearch()
    return
  }
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
  if (!announcements.value.length) return
  const first = announcements.value[0]
  if (first?.url) window.open(first.url, '_blank')
}

// ===== 公告 =====
async function loadAnnouncements() {
  try {
    const data = await getAnnouncements()
    if (Array.isArray(data) && data.length) {
      announcements.value = data
      nextTick(() => updateAnnLong())
    }
  } catch (err) {
    console.error('公告加载失败:', err)
  }
}

// 判断公告内容是否超出容器宽度，超出则开启缓慢滚动
function updateAnnLong() {
  const inner = annInnerRef.value
  const container = annScrollRef.value
  if (!inner || !container) { annLong.value = false; return }
  annLong.value = inner.offsetWidth > container.clientWidth + 4
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
  if (b.linkType === 'url') { window.open(b.linkUrl, '_blank'); return }
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
      // 封面图：保留原值用于 <img>，并预生成回退占位（纯色 + emoji）
      // 关键：用 backgroundImage（叠加层）+ 纯色 baseColor，而不是 background 简写被 url 覆盖
      const baseColor = `hsl(${(a.id * 47) % 360}, 60%, 65%)`
      const emojiList = ['🎉', '🎯', '🚀', '💡', '🔥', '🌟']
      return {
        id: a.id,
        title: a.title,
        coverImage: a.coverImage || '',
        coverError: false,  // <img> 加载失败时翻为 true，触发回退渲染
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

async function checkVersion() {
  try {
    const currentVersion = 1 // 当前版本编码
    const result = await checkAppVersion('mobile', currentVersion)
    if (result?.hasUpdate) {
      const msg = `${result.version.title}\n${result.version.content}`
      if (result.forceUpdate) {
        alert(`发现新版本，请更新！\n${msg}`)
      } else {
        // 非强制更新，仅提示
        console.log('新版本可用:', msg)
      }
    }
  } catch (err: any) { console.error(err) }
}

onMounted(() => {
  loadHomepage()
  checkVersion()
  loadAnnouncements()
  // 定时拉取公告（每 60 秒），保持最新
  annRefreshTimer = setInterval(loadAnnouncements, 60 * 1000)
})

onBeforeUnmount(() => {
  stopBannerTicker()
  if (annRefreshTimer) { clearInterval(annRefreshTimer); annRefreshTimer = null }
})
</script>

<style scoped>
/* ===== Banner ===== */
.banner-section {
  position: relative;
  height: 200px;
  overflow: hidden;
}
.banner-track {
  display: flex;
  height: 100%;
  transition: transform 0.45s ease;
}
.banner-slide {
  position: relative;
  flex: 0 0 100%;
  height: 100%;
  overflow: hidden;
  cursor: pointer;
}
.banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
.banner-overlay h3 { font-size: 18px; font-weight: 700; margin-bottom: 4px; letter-spacing: -0.3px; }
.banner-overlay p { font-size: 12px; opacity: 0.9; }
.banner-dots {
  position: absolute; bottom: 12px; right: 16px;
  display: flex; gap: 6px; z-index: 12;
}
.banner-dots .dot {
  width: 6px; height: 6px; border-radius: 99px;
  background: rgba(255,255,255,0.5);
  transition: all 0.25s ease; cursor: pointer;
}
.banner-dots .dot.active {
  width: 16px; background: #fff;
}

.top-overlay { position: absolute; top: 0; left: 0; right: 0; z-index: 10; }
.search-bar {
  margin: 14px 16px 0;
  background: rgba(0,0,0,0.25);
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  border-radius: 10px; display: flex; align-items: center;
  padding: 10px 14px; gap: 8px;
  border: 1px solid rgba(255,255,255,0.3);
  cursor: pointer;
}
.search-bar input {
  border: none; outline: none; background: transparent;
  font-size: 14px; color: #fff; width: 100%; font-family: var(--font);
}
.search-bar input::placeholder { color: rgba(255,255,255,0.7); }
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
  cursor: pointer; transition: transform 0.15s ease;
}
.entry-item:active { transform: scale(0.95); }
.entry-icon {
  width: 52px; height: 52px; border-radius: var(--radius-lg);
  background: var(--glass-bg); backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: var(--glass-border); box-shadow: var(--glass-shadow);
  display: flex; align-items: center; justify-content: center;
}
.entry-icon svg { width: 26px; height: 26px; color: var(--color-primary); }
.entry-label { font-size: 12px; color: var(--color-text-primary); font-weight: 500; }

/* ===== Announcement ===== */
.announcement-bar {
  margin: 0 16px 16px; background: rgba(255,255,255,0.7);
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
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
.ann-scroll { flex: 1; overflow: hidden; height: 20px; position: relative; }
.ann-marquee {
  display: inline-flex; align-items: center; height: 100%;
  white-space: nowrap; will-change: transform;
}
.ann-marquee.animating {
  animation: annMarquee 18s linear infinite;
}
.ann-inner { display: inline-flex; flex-shrink: 0; white-space: nowrap; }
.ann-text {
  flex-shrink: 0; height: 20px; line-height: 20px;
  font-size: 13px; color: var(--color-text-secondary);
  white-space: nowrap;
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
@keyframes annMarquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

/* ===== VIP Banner ===== */
.vip-banner {
  margin: 0 16px 16px; padding: 14px 16px;
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: #fff; cursor: pointer;
  display: flex; align-items: center; justify-content: space-between;
  box-shadow: 0 8px 24px rgba(79,70,229,0.25);
  transition: transform 0.15s ease;
}
.vip-banner:active { transform: scale(0.98); }
.vip-banner-left { display: flex; align-items: center; gap: 10px; }
.vip-crown { font-size: 28px; }
.vip-banner-text h4 { font-size: 14px; font-weight: 700; margin-bottom: 2px; }
.vip-banner-text p { font-size: 11px; opacity: 0.8; }
.vip-open-btn {
  font-size: 12px; font-weight: 600; color: #4f46e5;
  background: #fff; padding: 5px 14px; border-radius: 99px;
}

/* ===== Section Header ===== */
.section-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 10px; padding: 0 16px;
}
.section-title { font-size: 18px; font-weight: 700; color: var(--color-text-primary); }
.section-more { font-size: 13px; color: var(--color-primary); font-weight: 500; cursor: pointer; }

/* ===== Activities Scroll ===== */
.activities-scroll {
  display: flex; gap: 10px; padding: 0 16px 18px;
  overflow-x: auto; scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}
.activities-scroll::-webkit-scrollbar { display: none; }
.activity-card {
  min-width: 220px; flex-shrink: 0;
  border-radius: var(--radius-xl);
  background: rgba(255,255,255,0.65);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.5);
  box-shadow: var(--glass-shadow);
  overflow: hidden; scroll-snap-align: start;
  cursor: pointer; transition: transform 0.15s ease;
}
.activity-card:active { transform: scale(0.97); }
.activity-card-img { height: 110px; position: relative; overflow: hidden; background: #f0f0f5; }
/* 真实封面图：object-fit: cover 保持比例并裁剪，宽度铺满 */
.activity-card-cover-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
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
.activity-card-body h4 {
  font-size: 13px; font-weight: 600; color: var(--color-text-primary);
  line-height: 1.4; margin-bottom: 6px;
  display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
}
.activity-card-meta {
  display: flex; align-items: center; gap: 4px;
  font-size: 11px; color: var(--color-text-tertiary);
}
.activity-card-meta svg { width: 12px; height: 12px; color: var(--color-text-tertiary); }
.activity-card-footer {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(0,0,0,0.05);
}
.activity-price { font-size: 15px; font-weight: 700; color: var(--color-primary); }
.activity-price span { font-size: 10px; font-weight: 400; }
.activity-price.free { color: #10b981; font-size: 12px; font-weight: 600; }
.activity-signup { font-size: 10px; color: var(--color-text-tertiary); }

/* ===== Business List ===== */
.business-list { padding: 0 16px 18px; display: flex; flex-direction: column; gap: 10px; }
.business-item {
  border-radius: var(--radius-xl);
  background: rgba(255,255,255,0.65);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.5);
  box-shadow: var(--glass-shadow);
  padding: 14px; cursor: pointer;
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
.biz-avatar-img { width: 100%; height: 100%; object-fit: cover; background: transparent; }
.biz-avatar.c2 {
  background: linear-gradient(135deg, #274a6f, #1a2f4e);
  color: #f5f7fa;
}
.biz-avatar.c3 { background: #f59e0b; }
.biz-name { font-size: 12px; color: var(--color-text-tertiary); }
.biz-views { display: flex; align-items: center; gap: 3px; font-size: 11px; color: var(--color-text-tertiary); }
.biz-views svg { width: 12px; height: 12px; }
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

/* ===== TabBar ===== */
.tabbar {
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 430px;
  display: flex; background: rgba(255,255,255,0.92);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-top: 0.5px solid rgba(60,60,67,0.1);
  padding: 6px 0 env(safe-area-inset-bottom, 6px); z-index: 200;
}
.tab {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  padding: 4px 0; cursor: pointer; transition: all 0.2s ease;
}
.tab svg { width: 24px; height: 24px; color: var(--color-text-tertiary); transition: color 0.2s; }
.tab span { font-size: 10px; color: var(--color-text-tertiary); margin-top: 2px; transition: color 0.2s; }
.tab.active svg { color: var(--color-primary); }
.tab.active span { color: var(--color-primary); font-weight: 600; }

/* ===== Search Overlay ===== */
.search-overlay {
  position: fixed; top: 0; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 430px; z-index: 300;
  background: #f7f7fb; display: flex; flex-direction: column;
}
.search-overlay-header {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 14px; background: #fff;
  border-bottom: 0.5px solid rgba(60,60,67,0.1);
}
.search-back {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; color: var(--color-text-primary); cursor: pointer;
}
.search-overlay-input {
  flex: 1; display: flex; align-items: center; gap: 8px;
  background: #f2f3f7; border-radius: 10px; padding: 8px 12px;
}
.search-overlay-input input {
  flex: 1; border: none; outline: none; background: transparent;
  font-size: 14px; color: var(--color-text-primary); font-family: var(--font);
}
.search-clear {
  width: 18px; height: 18px; border-radius: 50%; background: #d1d5db;
  color: #fff; font-size: 11px; display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0;
}
.search-action {
  font-size: 14px; font-weight: 600; color: var(--color-primary); cursor: pointer;
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
  box-shadow: 0 1px 4px rgba(0,0,0,0.04); cursor: pointer;
}
.search-item-img {
  width: 56px; height: 56px; border-radius: 8px; object-fit: cover;
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
  font-size: 14px; font-weight: 700; color: var(--color-primary); align-self: flex-start;
}
.search-item-price.free { color: #10b981; font-size: 12px; font-weight: 600; }
</style>
