<template>
  <div class="page">
    <!-- Sticky Header -->
    <div class="header-bar">
      <div class="hero-card">
        <div class="hero-title-row">
          <h2>商机大厅</h2>
          <span class="hero-sub">发现优质商机 · 对接资源</span>
        </div>
        <div class="search-box">
          <input v-model="searchKeyword" type="search" placeholder="搜索商机..." @input="debounceSearch" />
        </div>
      </div>
      <div class="filter-row">
        <span class="filter-chip" :class="{ active: activeCat === '' }" @click="activeCat = ''">全部</span>
        <span class="filter-chip" v-for="c in categories" :key="c.id" :class="{ active: activeCat === String(c.id) }" @click="activeCat = String(c.id)">{{ c.name }}</span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && businesses.length === 0" class="loading-state">
      <div class="spinner"></div>
      <span>加载中...</span>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredBusinesses.length === 0 && !loading" class="empty-tip">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      <p>{{ emptyText }}</p>
      <span v-if="searchKeyword">试试其他关键词</span>
    </div>

    <!-- Business List -->
    <div class="list" v-else>
      <div class="item" v-for="b in filteredBusinesses" :key="b.id" @click="goDetail(b.id)">
        <div class="item-cover" :style="{ background: b.coverBg }">
          <img v-if="b.coverImage" :src="b.coverImageUrl" class="cover-img" loading="lazy" />
          <span class="cover-tag" :class="b.tagClass">{{ b.categoryName }}</span>
        </div>
        <div class="item-body">
          <div class="item-title">{{ b.title }}</div>
          <div class="item-desc">{{ b.sanitizedDesc }}</div>
          <div class="item-meta">
            <span class="meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              {{ b.publisher || '未知' }}
            </span>
            <span class="fee-tag" :class="{ free: b.isFree }">
              {{ b.isFree ? '免费' : '¥' + b.unlockFee }}
            </span>
          </div>
          <div class="item-footer">
            <span class="unlock-info">🔓 {{ b.currentUnlocks }}/{{ b.maxUnlocks }}</span>
            <span class="time-info">{{ b.timeAgo }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Pull to Refresh Hint -->
    <div v-if="hasMore && !loading" class="load-more">
      <button class="load-more-btn" @click="loadMore" :disabled="loading">
        {{ loading ? '加载中...' : '加载更多' }}
      </button>
    </div>

    <!-- Floating Publish Button -->
    <div class="fab" @click="goPublish">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getBusinesses, getBusinessCategories } from '@/api'

const router = useRouter()
const businesses = ref<any[]>([])
const categories = ref<any[]>([])
const loading = ref(false)
const searchKeyword = ref('')
const activeCat = ref('')
const page = ref(1)
const hasMore = ref(true)
const totalPages = ref(1)
let searchTimer: ReturnType<typeof setTimeout> | null = null
// 请求序号：用于丢弃过期的分类切换响应，避免并发竞态导致列表错乱
let reqSeq = 0

// 搜索去抖
function debounceSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    hasMore.value = true
    loadBusinesses()
  }, 300)
}

// 过滤后的列表（分类由后端过滤，此处仅做搜索过滤）
const filteredBusinesses = computed(() => {
  let list = [...businesses.value]
  // 搜索过滤
  if (searchKeyword.value.trim()) {
    const kw = searchKeyword.value.toLowerCase()
    list = list.filter(b =>
      b.title.toLowerCase().includes(kw) ||
      (b.description || '').toLowerCase().includes(kw) ||
      (b.publisher || '').toLowerCase().includes(kw)
    )
  }
  return list
})

// 当前选中分类名称
const activeCatName = computed(() => categories.value.find(c => String(c.id) === activeCat.value)?.name || '')

// 空状态提示文案（区分搜索无结果 / 该分类无商机 / 全局无商机）
const emptyText = computed(() => {
  if (searchKeyword.value.trim()) return '未找到相关商机'
  if (activeCat.value) return activeCatName.value ? `「${activeCatName.value}」分类暂无商机` : '该分类暂无商机'
  return '暂无商机'
})

// 切换分类时重新加载对应分类下的商机
watch(activeCat, () => {
  page.value = 1
  hasMore.value = true
  businesses.value = []
  loadBusinesses()
})

// 加载分类
async function loadCategories() {
  try {
    const data = await getBusinessCategories()
    if (Array.isArray(data)) categories.value = data
  } catch {
    categories.value = []
  }
}

// 加载商机
async function loadBusinesses() {
  const seq = ++reqSeq
  loading.value = true
  try {
    const data = await getBusinesses({
      page: page.value,
      size: 20,
      status: 'approved',
      categoryId: activeCat.value || undefined,
    })
    if (seq !== reqSeq) return // 已有更新的请求，丢弃过期的响应
    if (data?.list) {
      const items = data.list.map((item: any) => normalizeItem(item))
      if (page.value === 1) {
        businesses.value = items
      } else {
        businesses.value = [...businesses.value, ...items]
      }
      totalPages.value = Math.ceil((data.total || 0) / 20)
      hasMore.value = page.value < totalPages.value
    }
  } catch {
    if (seq === reqSeq && page.value === 1) businesses.value = []
  } finally {
    if (seq === reqSeq) loading.value = false
  }
}

// 加载更多
function loadMore() {
  if (page.value < totalPages.value) {
    page.value++
    loadBusinesses()
  }
}

// 归一化数据
function normalizeItem(item: any): any {
  const isFree = (item.unlockFee || 0) === 0
  const coverUrl = normalizeCoverUrl(item.coverImage)
  const desc = stripHtml(item.description || '')
  const categoryName = item.category?.name || ''
  return {
    ...item,
    isFree,
    categoryName,
    coverBg: coverUrl ? 'transparent' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    coverImageUrl: coverUrl,
    sanitizedDesc: desc.length > 120 ? desc.slice(0, 120) + '...' : desc,
    publisher: item.publisher?.nickname || '未知',
    timeAgo: getTimeAgo(item.createdAt),
    tagClass: getTagClass(categoryName),
  }
}

function normalizeCoverUrl(url: string): string {
  if (!url) return ''
  if (url.startsWith('http')) return url
  if (url.startsWith('/api/')) return url
  return '/api' + url
}

function stripHtml(html: string): string {
  if (!html) return ''
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}

function getTagClass(name: string): string {
  if (!name) return ''
  const map: Record<string, string> = { '合作': 'coop', '需求': 'demand', '资源': 'resource' }
  return map[name] || ''
}

function getTimeAgo(dateStr: string): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  if (diff < 604800000) return Math.floor(diff / 86400000) + '天前'
  return new Date(dateStr).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

function goDetail(id: number) {
  router.push(`/business/detail/${id}`)
}

function goPublish() {
  router.push('/business/publish')
}

onMounted(() => {
  loadCategories()
  loadBusinesses()
})

onUnmounted(() => {
  if (searchTimer) clearTimeout(searchTimer)
})
</script>

<style scoped>
@import '@/styles/global.css';

.page {
  min-height: 100vh;
  background: var(--color-bg);
  padding-bottom: 20px;
}

/* ===== Header ===== */
.header-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 0.5px solid rgba(60,60,67,0.08);
  /* 顶部安全区并入 Header，背景向上延伸覆盖状态栏，内容避让 */
  padding: calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) + 10px) 16px 8px;
}

/* ===== Hero Card (title + search) ===== */
.hero-card {
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-radius: 18px;
  padding: 18px 16px 14px;
  margin-bottom: 12px;
  border: 1px solid rgba(255,255,255,0.85);
  box-shadow: 0 6px 24px rgba(99,102,241,0.10), 0 1px 4px rgba(0,0,0,0.04);
  position: relative;
  overflow: hidden;
}
.hero-card::before {
  content: '';
  position: absolute;
  top: -60px; right: -40px;
  width: 150px; height: 150px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(99,102,241,0.10), transparent 70%);
}
.hero-title-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 14px;
  position: relative; z-index: 1;
}
.hero-title-row h2 {
  font-size: 21px;
  font-weight: 800;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.hero-sub {
  font-size: 12px;
  color: var(--color-text-tertiary);
  font-weight: 500;
}
.search-box {
  background: rgba(99,102,241,0.06);
  border-radius: 12px;
  padding: 10px 14px;
  position: relative; z-index: 1;
  border: 1px solid rgba(99,102,241,0.12);
  transition: border-color 0.2s, background 0.2s;
}
.search-box:focus-within {
  border-color: rgba(99,102,241,0.35);
  background: rgba(99,102,241,0.08);
}
.search-box input {
  width: 100%;
  border: none;
  background: transparent;
  font-size: 14px;
  color: var(--color-text-primary);
  outline: none;
}
.search-box input::placeholder {
  color: var(--color-text-tertiary);
}
.search-box input::-webkit-search-cancel-button {
  -webkit-appearance: none;
}

/* ===== Filter Chips ===== */
.filter-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-bottom: 2px;
}
.filter-row::-webkit-scrollbar { display: none; }
.filter-chip {
  flex-shrink: 0;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  color: var(--color-text-secondary);
  background: rgba(0,0,0,0.04);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.filter-chip:active { transform: scale(0.95); }
.filter-chip.active {
  background: var(--color-primary);
  color: #fff;
  font-weight: 600;
}

/* ===== Loading / Empty ===== */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  gap: 12px;
  color: var(--color-text-tertiary);
  font-size: 14px;
}
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-primary-50);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.empty-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 12px;
  color: var(--color-text-tertiary);
}
.empty-tip svg { width: 64px; height: 64px; opacity: 0.3; }
.empty-tip p { font-size: 16px; font-weight: 500; }
.empty-tip span { font-size: 13px; }

/* ===== Business List ===== */
.list {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.item:active {
  transform: scale(0.98);
  box-shadow: 0 1px 6px rgba(0,0,0,0.08);
}

.item-cover {
  height: 140px;
  position: relative;
  overflow: hidden;
}
.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cover-tag {
  position: absolute;
  top: 10px;
  left: 10px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  padding: 4px 12px;
  border-radius: 99px;
  background: rgba(99,102,241,0.85);
  backdrop-filter: blur(8px);
}
.cover-tag.coop { background: rgba(16,185,129,0.85); }
.cover-tag.demand { background: rgba(245,158,11,0.85); }

.item-body { padding: 14px 16px; }
.item-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 6px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.item-desc {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 10px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.item-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-text-tertiary);
}
.meta-item svg { width: 14px; height: 14px; }
.fee-tag {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-warning);
}
.fee-tag.free { color: var(--color-success); }

.item-footer {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--color-text-tertiary);
  padding-top: 8px;
  border-top: 1px solid rgba(0,0,0,0.04);
}
.unlock-info { display: flex; align-items: center; gap: 2px; }

/* ===== Load More ===== */
.load-more {
  display: flex;
  justify-content: center;
  padding: 16px;
}
.load-more-btn {
  padding: 10px 32px;
  border-radius: 24px;
  border: 1px solid var(--color-primary);
  background: #fff;
  color: var(--color-primary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.load-more-btn:active:not(:disabled) {
  background: var(--color-primary);
  color: #fff;
}
.load-more-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ===== Floating Action Button ===== */
.fab {
  position: fixed;
  right: 20px;
  bottom: calc(28px + var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)));
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(99,102,241,0.45), 0 2px 6px rgba(0,0,0,0.12);
  cursor: pointer;
  z-index: 200;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.fab svg {
  width: 26px;
  height: 26px;
}
.fab:active {
  transform: scale(0.92);
  box-shadow: 0 4px 12px rgba(99,102,241,0.35);
}
</style>
