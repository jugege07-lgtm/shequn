<template>
  <div class="phone-frame">
    <div class="header">
      <div class="header-left">
        <div class="back-btn" @click="$router.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m15 18-6-6 6-6"/></svg>
        </div>
        <span class="header-title">我的报名</span>
      </div>
    </div>
    <div class="main-scroll">
      <div class="tab-bar">
        <div
          class="tab-item"
          :class="{ active: activeTab === i }"
          v-for="(t, i) in tabs"
          :key="t"
          @click="activeTab = i"
        >{{ t }}</div>
      </div>
      <div class="list-card" v-loading="loading" v-if="filtered.length > 0">
        <div class="signup-item" v-for="s in filtered" :key="s.id" @click="$router.push('/activity/detail/' + s.id)">
          <div class="signup-cover" :style="{ background: s.cover }">
            <img v-if="s.coverImage && !s.coverError" class="signup-cover-img" :src="s.coverImage" :alt="s.title" loading="lazy" @error="() => (s.coverError = true)" />
          </div>
          <div class="signup-info">
            <div class="signup-title">{{ s.title }}</div>
            <div class="signup-meta">{{ s.date }} · {{ s.location }}</div>
            <div class="signup-status" :class="s.statusClass">{{ s.statusText }}</div>
          </div>
        </div>
      </div>
      <div class="empty-state" v-else>
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        </div>
        <div class="empty-title">暂无最新动态</div>
        <div class="empty-desc">还没有报名记录，快去浏览精彩活动吧！</div>
        <div class="empty-btn" @click="$router.push('/activity/list')">浏览活动</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { getSignedActivities } from '@/api'
import { normalizeImageUrl } from '@/utils/image'

const tabs = ['全部', '即将开始', '进行中', '已结束']
const activeTab = ref(0)
const loading = ref(false)
const signups = ref<any[]>([])

function mapActivity(item: any) {
  const now = new Date()
  const start = item.startTime ? new Date(item.startTime) : null
  const end = item.endTime ? new Date(item.endTime) : null
  let statusText = '已报名'
  let statusClass = 'confirmed'
  if (end && end.getTime() < now.getTime()) {
    statusText = '已结束'
    statusClass = 'ended'
  } else if (start && start.getTime() > now.getTime()) {
    statusText = '即将开始'
    statusClass = 'upcoming'
  } else if (start && start.getTime() <= now.getTime()) {
    statusText = '进行中'
    statusClass = 'ongoing'
  }
  return {
    id: item.id,
    title: item.title || '未知活动',
    coverImage: normalizeImageUrl(item.coverImage),
    coverError: false,
    cover: item.coverImage
      ? `url(${normalizeImageUrl(item.coverImage)})`
      : 'linear-gradient(135deg,#818cf8,#6366f1)',
    date: item.startTime ? new Date(item.startTime).toLocaleDateString('zh-CN') : '待定',
    location: item.location || '待定',
    statusText,
    statusClass,
    startTime: item.startTime,
    endTime: item.endTime,
  }
}

async function loadSignups() {
  loading.value = true
  try {
    const data = await getSignedActivities({ page: 1, size: 100 })
    const list = (Array.isArray(data) ? data : data?.list) || []
    signups.value = list.map(mapActivity)
  } catch (err: any) {
    console.error('加载报名记录失败:', err)
    signups.value = []
  } finally {
    loading.value = false
  }
}

const filtered = computed(() => {
  const now = Date.now()
  const all = signups.value
  const tab = activeTab.value
  if (tab === 0) return all
  if (tab === 1) return all.filter((s) => s.startTime && new Date(s.startTime).getTime() > now)
  if (tab === 2) {
    return all.filter(
      (s) =>
        s.startTime &&
        new Date(s.startTime).getTime() <= now &&
        (!s.endTime || new Date(s.endTime).getTime() >= now),
    )
  }
  // tab === 3 已结束
  return all.filter((s) => s.endTime && new Date(s.endTime).getTime() < now)
})

watch(activeTab, () => {}, { flush: 'sync' })

onMounted(loadSignups)
</script>

<style scoped>
@import '@/styles/global.css';
.tab-bar { display: flex; padding: 12px 16px; gap: 8px; }
.tab-item { padding: 6px 16px; border-radius: 99px; background: rgba(255,255,255,0.7); font-size: 13px; color: var(--color-text-secondary); cursor: pointer; }
.tab-item.active { background: var(--color-primary); color: #fff; }
.list-card { padding: 0 16px 16px; }
.signup-item { display: flex; gap: 12px; padding: 12px; border-radius: var(--radius-lg); background: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.5); margin-bottom: 10px; cursor: pointer; }
.signup-cover { width: 72px; height: 72px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0; background-size: cover; background-position: center; overflow: hidden; }
.signup-cover-img { width: 100%; height: 100%; object-fit: cover; }
.signup-info { flex: 1; min-width: 0; }
.signup-title { font-size: 14px; font-weight: 600; color: var(--color-text-primary); margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.signup-meta { font-size: 12px; color: var(--color-text-tertiary); margin-bottom: 4px; }
.signup-status { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 99px; display: inline-block; }
.signup-status.confirmed { background: rgba(16,185,129,0.1); color: #10b981; }
.signup-status.upcoming { background: rgba(99,102,241,0.1); color: #6366f1; }
.signup-status.ongoing { background: rgba(245,158,11,0.1); color: #f59e0b; }
.signup-status.ended { background: rgba(107,114,128,0.1); color: #9ca3af; }

.empty-state { padding: 60px 20px; text-align: center; }
.empty-icon { width: 80px; height: 80px; margin: 0 auto 16px; border-radius: var(--radius-xl); background: rgba(255,255,255,0.7); display: flex; align-items: center; justify-content: center; }
.empty-icon svg { width: 40px; height: 40px; color: var(--color-text-tertiary); }
.empty-title { font-size: 16px; font-weight: 600; color: var(--color-text-primary); margin-bottom: 4px; }
.empty-desc { font-size: 13px; color: var(--color-text-secondary); margin-bottom: 20px; }
.empty-btn { display: inline-block; padding: 10px 24px; border-radius: 99px; background: var(--color-primary); color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; }
</style>