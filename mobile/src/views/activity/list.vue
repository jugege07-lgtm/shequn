<template>
  <div class="phone-frame">
    <div class="main-scroll">
      <!-- Filter Bar -->
      <div class="filter-bar">
        <div class="filter-tab" v-for="(tab, i) in filters" :key="i" :class="{ active: activeTab === i }" @click="activeTab = i">{{ tab }}</div>
      </div>

      <!-- Activity List -->
      <div class="activity-list" v-loading="loading">
        <div v-if="activities.length === 0" class="empty-tip">暂无活动</div>
        <div class="activity-item" v-for="a in activities" :key="a.id" @click="$router.push('/activity/detail/' + a.id)">
          <div class="activity-cover">
            <img v-if="a.coverImage && !a.coverError" class="activity-cover-img" :src="a.coverImage" :alt="a.title" loading="lazy" @error="() => (a.coverError = true)" />
            <div v-else class="activity-cover-bg" :style="{background: a.cover}"></div>
            <span class="status-tag" :class="a.statusClass">{{ a.statusText }}</span>
          </div>
          <div class="activity-content">
            <div class="activity-title">{{ a.title }}</div>
            <div class="activity-meta">
              <div class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                {{ a.date }}
              </div>
              <div class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {{ a.location }}
              </div>
              <div class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                {{ a.capacity }}
              </div>
            </div>
            <div class="activity-footer">
              <span class="activity-price" :class="{ free: a.isFree }" v-html="formatPriceHtml(a.price, a.isFree)"></span>
              <div class="activity-stats">
                <div class="stat-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  {{ a.participants }}
                </div>
                <div class="stat-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  {{ a.views }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TabBar -->
    <div class="tabbar">
      <div class="tab" @click="$router.push('/')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></svg>
        <span>首页</span>
      </div>
      <div class="tab active">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg>
        <span>活动</span>
      </div>
      <div class="tab" @click="$router.push('/opportunity/list')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        <span>商机</span>
      </div>
      <div class="tab" @click="$router.push('/mall/index')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2h16l-2 12H6L4 2zm0 0l-1 6M6 20a2 2 0 100 4 2 2 0 000-4zm12 0a2 2 0 100 4 2 2 0 000-4z"/></svg>
        <span>商城</span>
      </div>
      <div class="tab" @click="$router.push('/profile/index')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span>我的</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { formatPriceHtml } from '@/utils/sanitize'
import { normalizeImageUrl } from '@/utils/image'
import { getActivities, getMyActivities, getSignedActivities } from '@/api'

const filters = ['全部', '免费', '付费', '我发布的', '已报名', '即将开始', '已结束']
const activeTab = ref(0)
const activities = ref<any[]>([])
const loading = ref(false)

const publicFilters: Record<number, string> = { 0: 'all', 1: 'free', 2: 'paid', 5: 'upcoming', 6: 'ended' }

function mapActivity(item: any) {
  return {
    id: item.id,
    title: item.title,
    coverImage: normalizeImageUrl(item.coverImage),
    coverError: false,
    cover: item.coverImage ? `url(${normalizeImageUrl(item.coverImage)})` : 'linear-gradient(135deg,#818cf8,#6366f1)',
    statusText: item.status === 'approved' ? '报名中' : item.status === 'pending' ? '待审核' : '已结束',
    statusClass: item.status === 'approved' ? '' : item.status === 'pending' ? '' : 'full',
    date: formatActivityDate(item.startTime),
    location: item.location || '待定',
    capacity: item.maxParticipants ? `限${item.maxParticipants}人` : '不限人数',
    price: item.price ?? 0,
    isFree: (item.price ?? 0) === 0,
    participants: `${item.signupCount || 0}人`,
    views: formatViews(item.viewCount || 0),
  }
}

function formatActivityDate(input: string | number | Date | null | undefined): string {
  if (!input) return '待定'
  const d = new Date(input)
  if (isNaN(d.getTime())) return '待定'
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function formatViews(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + 'w'
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(n)
}

async function loadActivities() {
  loading.value = true
  activities.value = []
  try {
    const tab = activeTab.value
    let data: any = null

    if (tab === 3) {
      data = await getMyActivities()
    } else if (tab === 4) {
      data = await getSignedActivities()
    } else {
      const filter = publicFilters[tab] || 'all'
      data = await getActivities({ filter })
    }

    const list = Array.isArray(data) ? data : data?.list || []
    activities.value = list.map(mapActivity)
  } catch (err: any) {
    console.error('加载活动失败:', err)
    activities.value = []
  } finally {
    loading.value = false
  }
}

watch(activeTab, loadActivities)

onMounted(loadActivities)
</script>

<style scoped>
@import '@/styles/global.css';

.activity-list { padding: 16px 16px 0; display: flex; flex-direction: column; gap: 12px; }
.activity-item {
  border-radius: var(--radius-xl);
  background: rgba(255,255,255,0.65);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.5);
  box-shadow: var(--glass-shadow);
  overflow: hidden; cursor: pointer;
  transition: transform 0.15s ease;
}
.activity-item:active { transform: scale(0.98); }
.activity-cover { width: 100%; position: relative; overflow: hidden; background: #f0f0f5; }
.activity-cover-img { display: block; width: 100%; height: auto; }
.activity-cover-bg {
  width: 100%; aspect-ratio: 16 / 9;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
.status-tag {
  position: absolute; top: 10px; left: 10px;
  font-size: 10px; font-weight: 700; color: #fff;
  background: rgba(99,102,241,0.85); padding: 3px 10px; border-radius: 99px;
}
.status-tag.free { background: rgba(16,185,129,0.85); }
.status-tag.full { background: rgba(239,68,68,0.85); }
.activity-content { padding: 14px 16px; }
.activity-title {
  font-size: 15px; font-weight: 700; color: var(--color-text-primary);
  line-height: 1.4; margin-bottom: 6px;
  display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
}
.activity-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
.meta-item { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--color-text-tertiary); }
.meta-item svg { width: 14px; height: 14px; color: var(--color-text-tertiary); }
.activity-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding-top: 10px; border-top: 1px solid rgba(0,0,0,0.05);
}
.activity-price { font-size: 16px; font-weight: 700; color: var(--color-primary); }
.activity-price.free { color: #10b981; font-size: 14px; font-weight: 600; }
.activity-price span { font-size: 12px; font-weight: 400; }
.activity-stats { display: flex; align-items: center; gap: 8px; }
.stat-item { display: flex; align-items: center; gap: 3px; font-size: 11px; color: var(--color-text-tertiary); }
.stat-item svg { width: 12px; height: 12px; color: var(--color-text-tertiary); }
</style>
