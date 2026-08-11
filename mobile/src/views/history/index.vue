<template>
  <div class="phone-frame">
    <div class="header">
      <div class="header-left">
        <div class="back-btn" @click="$router.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </div>
        <span class="header-title">浏览历史</span>
      </div>
      <div class="header-clear" @click="handleClear" v-if="history.length">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/></svg>
        清空
      </div>
    </div>

    <div class="main-scroll" v-loading="loading">
      <div class="history-list" v-if="history.length">
        <div class="history-item" v-for="item in history" :key="item.type + '-' + item.id" @click="goDetail(item)">
          <div class="history-icon" :class="item.type">
            <svg v-if="item.type === 'activity'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            <svg v-else-if="item.type === 'business'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2h16l-2 12H6L4 2zm0 0l-1 6M6 20a2 2 0 100 4 2 2 0 000-4zm12 0a2 2 0 100 4 2 2 0 000-4z"/></svg>
          </div>
          <div class="history-content">
            <div class="history-title">{{ item.title }}</div>
            <div class="history-meta">
              <span class="history-tag" :class="item.type">{{ typeName(item.type) }}</span>
              <span class="history-time">{{ formatTime(item.time) }}</span>
            </div>
          </div>
          <svg class="history-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </div>
      </div>

      <div class="empty-state" v-else>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/></svg>
        <p>暂无浏览记录</p>
        <div class="empty-hint">浏览活动、商机或商品后，这里会展示您的足迹</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getBrowseHistory, clearBrowseHistory, type BrowseRecord } from '@/utils/browseHistory'

const router = useRouter()
const loading = ref(false)
const history = ref<BrowseRecord[]>([])

const TYPE_NAMES: Record<string, string> = {
  activity: '活动',
  business: '商机',
  product: '商品',
}

function typeName(type: string) {
  return TYPE_NAMES[type] || '内容'
}

function formatTime(time: number) {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (days === 0) {
    if (hours === 0) {
      const mins = Math.floor(diff / (1000 * 60))
      return mins <= 1 ? '刚刚' : `${mins}分钟前`
    }
    return `${hours}小时前`
  }
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function goDetail(item: BrowseRecord) {
  if (item.type === 'activity') router.push(`/activity/detail/${item.id}`)
  else if (item.type === 'business') router.push(`/business/detail/${item.id}`)
  else router.push(`/mall/detail/${item.id}`)
}

function load() {
  loading.value = true
  history.value = getBrowseHistory()
  loading.value = false
}

function handleClear() {
  if (!confirm('确定清空全部浏览历史吗？')) return
  clearBrowseHistory()
  load()
}

onMounted(() => {
  document.title = '浏览历史'
  load()
})
</script>

<style scoped>
@import '@/styles/global.css';
.header-clear {
  display: flex; align-items: center; gap: 4px;
  font-size: 13px; color: var(--color-text-secondary);
  cursor: pointer; padding: 6px 8px;
}
.header-clear svg { width: 16px; height: 16px; }

.main-scroll { padding-bottom: 40px; }
.history-list { display: flex; flex-direction: column; gap: 12px; padding: 16px; }
.history-item {
  display: flex; align-items: center; gap: 14px;
  padding: 14px; border-radius: var(--radius-xl);
  background: rgba(255,255,255,0.75); backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.5); box-shadow: var(--glass-shadow);
  cursor: pointer; transition: transform 0.15s ease;
}
.history-item:active { transform: scale(0.98); }
.history-icon {
  width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.history-icon svg { width: 22px; height: 22px; }
.history-icon.activity { background: #ede9fe; color: #7c3aed; }
.history-icon.business { background: #dbeafe; color: #2563eb; }
.history-icon.product { background: #d1fae5; color: #10b981; }
.history-content { flex: 1; min-width: 0; }
.history-title {
  font-size: 15px; font-weight: 600; color: var(--color-text-primary);
  margin-bottom: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.history-meta { display: flex; align-items: center; gap: 8px; }
.history-tag {
  font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 99px; flex-shrink: 0;
}
.history-tag.activity { background: rgba(124,58,237,0.1); color: #7c3aed; }
.history-tag.business { background: rgba(37,99,235,0.1); color: #2563eb; }
.history-tag.product { background: rgba(16,185,129,0.1); color: #10b981; }
.history-time { font-size: 12px; color: var(--color-text-tertiary); }
.history-arrow { width: 16px; height: 16px; color: #c4c4c4; flex-shrink: 0; }

.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 80px 32px; color: #b0b0b0;
}
.empty-state svg { width: 56px; height: 56px; margin-bottom: 12px; }
.empty-state p { font-size: 15px; font-weight: 600; color: #6b7280; margin-bottom: 6px; }
.empty-hint { font-size: 13px; color: #9ca3af; }
</style>