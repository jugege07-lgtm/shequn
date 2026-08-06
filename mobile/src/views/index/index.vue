<template>
  <div class="phone-frame">
    <!-- Banner with Floating Overlay -->
    <div class="banner-section">
      <div class="banner-bg-shapes">
        <div class="shape s1"></div>
        <div class="shape s2"></div>
        <div class="shape s3"></div>
      </div>
      <div class="top-overlay">
        <div class="status-bar">
          <span>9:41</span>
          <div class="status-icons">
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <rect x="0" y="8" width="3" height="4" rx="0.5" fill="#fff"/>
              <rect x="4.5" y="5" width="3" height="7" rx="0.5" fill="#fff"/>
              <rect x="9" y="2" width="3" height="10" rx="0.5" fill="#fff"/>
              <rect x="13.5" y="0" width="2.5" height="12" rx="0.5" fill="#fff"/>
            </svg>
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <path d="M8 10.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" fill="#fff" transform="translate(0,-2)"/>
              <path d="M4.5 8.5C5.5 7.2 6.7 6.5 8 6.5s2.5.7 3.5 2" stroke="#fff" stroke-width="1.2" stroke-linecap="round" fill="none"/>
            </svg>
          </div>
        </div>
        <div class="search-bar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="搜索活动、商机、商品" readonly />
        </div>
      </div>
      <div class="banner-overlay">
        <h3>{{ bannerText }}</h3>
        <p v-if="bannerSubtitle">{{ bannerSubtitle }}</p>
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
      <div class="announcement-bar">
        <span class="ann-tag">公告</span>
        <div class="ann-scroll">
          <span class="ann-text" v-if="announcements.length">{{ announcements[0].title }}</span>
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
            <div class="cover" :style="{background: a.cover}">{{ a.emoji }}</div>
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
              <div class="biz-avatar" :class="b.avatarClass">{{ b.publisher }}</div>
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
import { ref, onMounted } from 'vue'
import { getHomepageData, checkAppVersion } from '@/api/index'
import { setCache, getCache } from '@/utils/cache'
import { stripHtml } from '@/utils/sanitize'

const CACHE_KEY = 'homepage_data'

const activities = ref<any[]>([])
const businesses = ref<any[]>([])
const announcements = ref<{ title: string; content: string }[]>([])
const bannerText = ref('2026 社群商业资源峰会')
const bannerSubtitle = ref('7月15日 · 深圳国际会展中心 · 限额500人')
const loading = ref(false)

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
    const firstBanner = data.banners[0]
    bannerText.value = firstBanner.title
    bannerSubtitle.value = ''
  }

  // 转换活动数据
  if (data.activities?.length) {
    activities.value = data.activities.map((a: any) => ({
      id: a.id,
      title: a.title,
      cover: a.coverImage
        ? `linear-gradient(135deg, #667eea 0%, #764ba2 100%), url(${a.coverImage})`
        : `hsl(${a.id * 47 % 360}, 60%, 65%)`,
      emoji: a.coverImage ? '' : ['🎉','🎯','🚀','💡','🔥','🌟'][a.id % 6],
      isFree: a.price === 0,
      statusText: a.status === 'approved' ? '报名中' : a.status,
      date: formatDateStr(a.startTime),
      location: a.location || '待定',
      priceHtml: a.price === 0 ? '免费' : `<span>¥</span>${a.price}`,
      signupCount: a.signupCount || 0,
    }))
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
})
</script>

<style scoped>
/* ===== Banner ===== */
.banner-section {
  position: relative;
  height: 200px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%);
  overflow: hidden;
}
.banner-bg-shapes { position: absolute; inset: 0; overflow: hidden; }
.banner-bg-shapes .shape {
  position: absolute; border-radius: 50%; opacity: 0.15; background: #fff;
}
.banner-bg-shapes .shape.s1 { width: 200px; height: 200px; top: -60px; right: -40px; }
.banner-bg-shapes .shape.s2 { width: 140px; height: 140px; bottom: -30px; left: -20px; }
.banner-bg-shapes .shape.s3 { width: 80px; height: 80px; top: 40px; left: 80px; }

.top-overlay { position: absolute; top: 0; left: 0; right: 0; z-index: 10; }
.status-bar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 20px 6px; font-size: 14px; font-weight: 600; color: #fff;
}
.status-icons { display: flex; align-items: center; gap: 6px; }
.search-bar {
  margin: 0 16px; background: rgba(255,255,255,0.2);
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  border-radius: 10px; display: flex; align-items: center;
  padding: 10px 14px; gap: 8px;
  border: 1px solid rgba(255,255,255,0.3);
}
.search-bar input {
  border: none; outline: none; background: transparent;
  font-size: 14px; color: #fff; width: 100%; font-family: var(--font);
}
.search-bar input::placeholder { color: rgba(255,255,255,0.7); }

.banner-overlay {
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: 20px 16px 14px;
  background: linear-gradient(to top, rgba(79,70,229,0.7) 0%, transparent 100%);
  color: #fff;
}
.banner-overlay h3 { font-size: 18px; font-weight: 700; margin-bottom: 4px; letter-spacing: -0.3px; }
.banner-overlay p { font-size: 12px; opacity: 0.85; }

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
.ann-tag {
  flex-shrink: 0; background: var(--color-primary); color: #fff;
  font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 99px;
}
.ann-scroll { flex: 1; overflow: hidden; }
.ann-text {
  display: inline-block; font-size: 13px; color: var(--color-text-secondary);
  white-space: nowrap;
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
.activity-card-img { height: 110px; position: relative; overflow: hidden; }
.activity-card-img .cover {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center; font-size: 48px;
}
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
.biz-tag.coop { background: #ecfdf5; color: #059669; }
.biz-tag.demand { background: #fffbeb; color: #d97706; }
.biz-tag.pink { background: #fce7f3; color: #db2777; }
.biz-price { font-size: 15px; font-weight: 700; color: var(--color-primary); }
.biz-price.free { color: #10b981; font-size: 12px; font-weight: 600; }
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
}
.biz-avatar.c2 { background: #10b981; }
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
</style>
