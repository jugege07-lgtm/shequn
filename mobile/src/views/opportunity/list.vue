<template>
  <div class="phone-frame">
    <div class="main-scroll">
      <!-- Hero Card (title + search) -->
      <div class="hero-card">
        <div class="hero-title-row">
          <h2>商机大厅</h2>
          <span class="hero-sub">发现优质商机 · 对接资源</span>
        </div>
        <div class="search-box">
          <input
            v-model="searchKeyword"
            type="search"
            placeholder="搜索商机、项目、合作方..."
            @input="debounceSearch"
          />
        </div>
      </div>

      <!-- Quick Filter：分类来自后端，与管理端商机分类管理完全同步 -->
      <div class="quick-filter">
        <div
          class="filter-chip"
          :class="{ active: activeCat === '' }"
          @click="switchCategory('')"
        >全部</div>
        <div
          class="filter-chip"
          v-for="c in categories"
          :key="c.id"
          :class="{ active: activeCat === String(c.id) }"
          @click="switchCategory(String(c.id))"
        >{{ c.name }}</div>
      </div>

      <!-- Opportunity List -->
      <div class="opportunity-list" v-loading="loading">
        <!-- 初次加载时显示骨架 -->
        <div v-if="loading && filteredOpportunities.length === 0" class="loading-tip">
          <span class="loading-spinner"></span>
          <span>正在加载商机...</span>
        </div>
        <!-- 无数据时按场景给出不同提示 -->
        <div v-else-if="filteredOpportunities.length === 0" class="empty-tip">
          <p>{{ emptyText }}</p>
          <span v-if="searchKeyword.trim()" class="empty-sub">试试其他关键词</span>
        </div>
        <div class="opportunity-item" v-for="o in filteredOpportunities" :key="o.id" @click="$router.push('/business/detail/' + o.id)">
          <div class="opportunity-header">
            <div>
              <div class="opportunity-title">{{ o.title }}</div>
              <div class="opportunity-tag" :class="o.urgencyClass">{{ o.urgency }}</div>
            </div>
          </div>
          <div class="opportunity-content">
            <div class="opportunity-desc" v-html="o.sanitizedDesc"></div>
            <div class="opportunity-meta">
              <div class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                {{ o.location }}
              </div>
              <div class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                {{ o.date }}
              </div>
              <div class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                {{ o.validity }}
              </div>
            </div>
            <div class="opportunity-footer">
              <span class="opportunity-price" v-html="formatPriceHtml(o.price, o.isFree)"></span>
              <div class="opportunity-stats">
                <div class="stat-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  {{ o.connects }}
                </div>
                <div class="stat-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  {{ o.views }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 加载更多 / 加载完毕提示 -->
        <div v-if="hasMore && filteredOpportunities.length > 0 && !searchKeyword.trim()" class="load-more">
          <button class="load-more-btn" :disabled="loading" @click="loadMore">
            {{ loading ? '加载中...' : '加载更多' }}
          </button>
        </div>
        <div v-else-if="!hasMore && filteredOpportunities.length > 0 && !searchKeyword.trim()" class="load-end">已经到底了～</div>
      </div>
    </div>

    <!-- Floating Publish Button -->
    <div class="fab" @click="$router.push('/business/publish')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
    </div>

    <!-- TabBar -->
    <div class="tabbar">
      <div class="tab" @click="$router.push('/')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></svg>
        <span>首页</span>
      </div>
      <div class="tab" @click="$router.push('/activity/list')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg>
        <span>活动</span>
      </div>
      <div class="tab active">
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { formatPriceHtml, stripHtml } from '@/utils/sanitize'
import { getBusinesses, getBusinessCategories } from '@/api'

// 商机分类（来自后端 /api/public/business-categories，与管理端商机分类管理共享同一张表）
const categories = ref<any[]>([])
// 当前选中的分类 id：'' 表示「全部」，其余为后端返回的分类 id（字符串便于与 activeCat 绑定做严格相等比较）
const activeCat = ref('')
const opportunities = ref<any[]>([])
const loading = ref(false)
const searchKeyword = ref('')

// 分页
const page = ref(1)
const hasMore = ref(true)
const totalPages = ref(1)

// 请求序号：用于丢弃过期响应，避免快速切换分类时并发竞态导致列表错乱
let reqSeq = 0

// 当前分类中文名（用于"该分类暂无商机"等空态文案）
const activeCatName = computed(
  () => categories.value.find(c => String(c.id) === activeCat.value)?.name || ''
)

// 展示列表：分类由后端过滤，搜索由前端在内存中过滤
const filteredOpportunities = computed(() => {
  const kw = searchKeyword.value.trim().toLowerCase()
  if (!kw) return opportunities.value
  return opportunities.value.filter(o =>
    (o.title || '').toLowerCase().includes(kw) ||
    (o.categoryName || '').toLowerCase().includes(kw) ||
    (o.sanitizedDesc || '').toLowerCase().includes(kw)
  )
})

// 区分搜索无结果 / 分类无商机 / 全局无商机，给出更友好的空态文案
const emptyText = computed(() => {
  if (searchKeyword.value.trim() && filteredOpportunities.value.length === 0) return '未找到相关商机'
  if (activeCat.value) return activeCatName.value ? `「${activeCatName.value}」分类暂无商机` : '该分类暂无商机'
  return '暂无商机'
})

// 点击分类：立即刷新（视觉上由 :class 绑定负责）
function switchCategory(id: string) {
  if (activeCat.value === id) return // 重复点击同一分类不再触发请求
  activeCat.value = id
}

// 切换分类时重新加载对应分类下的商机
watch(activeCat, () => {
  page.value = 1
  hasMore.value = true
  opportunities.value = []
  loadBusinesses()
})

// 搜索去抖：避免每次按键都触发请求
let searchTimer: ReturnType<typeof setTimeout> | null = null
function debounceSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    hasMore.value = true
    loadBusinesses()
  }, 300)
}

// 加载分类（数据源与管理端 BusinessCategoryManagement.vue 一致）
async function loadCategories() {
  try {
    const data = await getBusinessCategories()
    if (Array.isArray(data)) categories.value = data
  } catch {
    categories.value = []
  }
}

// 加载商机列表
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
    if (seq !== reqSeq) return // 有更新的请求，过期响应直接丢弃
    if (data?.list) {
      const items = data.list.map((item: any) => normalizeItem(item))
      if (page.value === 1) {
        opportunities.value = items
      } else {
        opportunities.value = [...opportunities.value, ...items]
      }
      totalPages.value = Math.ceil((data.total || 0) / 20)
      hasMore.value = page.value < totalPages.value
    }
  } catch (err: any) {
    // 出错时只清空当前结果，不再回退到假数据；空态文案会引导用户
    if (seq === reqSeq && page.value === 1) opportunities.value = []
  } finally {
    if (seq === reqSeq) loading.value = false
  }
}

// 归一化后端返回的商机字段，补全卡片需要的展示字段
function normalizeItem(item: any): any {
  const isFree = (item.unlockFee || 0) === 0
  const coverUrl = normalizeCoverUrl(item.coverImage)
  const desc = stripHtml(item.description || '')
  const categoryName = item.category?.name || ''
  return {
    ...item,
    isFree,
    price: item.unlockFee || 0,
    desc,
    sanitizedDesc: desc.length > 120 ? desc.slice(0, 120) + '...' : desc,
    categoryName,
    coverUrl,
    publisher: item.publisher?.nickname || '未知',
    date: item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-CN') : '待定',
    timeAgo: getTimeAgo(item.createdAt),
    urgency: '中',
    urgencyClass: '',
    location: '待定',
    validity: '长期有效',
    connects: String(item.currentUnlocks ?? 0),
    views: '0',
  }
}

function normalizeCoverUrl(url: string): string {
  if (!url) return ''
  if (url.startsWith('http')) return url
  if (url.startsWith('/api/')) return url
  return '/api' + url
}

function getTimeAgo(dateStr: string): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  if (diff < 604800000) return Math.floor(diff / 86400000) + '天前'
  return new Date(dateStr).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

// 加载更多
function loadMore() {
  if (loading.value) return
  if (page.value < totalPages.value) {
    page.value++
    loadBusinesses()
  }
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

.opportunity-list { padding: 16px 16px 0; display: flex; flex-direction: column; gap: 12px; }
.opportunity-item {
  border-radius: var(--radius-xl);
  background: rgba(255,255,255,0.65);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.5);
  box-shadow: var(--glass-shadow);
  overflow: hidden; cursor: pointer;
  transition: transform 0.15s ease;
}
.opportunity-item:active { transform: scale(0.98); }
.opportunity-header { padding: 14px 16px 0; display: flex; align-items: flex-start; justify-content: space-between; }
.opportunity-title {
  font-size: 15px; font-weight: 700; color: var(--color-text-primary);
  line-height: 1.4; margin-bottom: 4px;
  display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
}
.opportunity-tag {
  font-size: 10px; font-weight: 700; color: #fff;
  background: var(--color-primary); padding: 3px 8px; border-radius: 4px;
  white-space: nowrap; margin-left: 8px; display: inline-block;
}
.opportunity-tag.urgent { background: var(--color-danger); }
.opportunity-tag.high { background: var(--color-warning); }
.opportunity-tag.low { background: var(--color-success); }
.opportunity-content { padding: 0 16px 14px; }
.opportunity-desc {
  font-size: 13px; color: var(--color-text-secondary); line-height: 1.5;
  margin-bottom: 10px;
  display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
}
.opportunity-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
.meta-item { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--color-text-tertiary); }
.meta-item svg { width: 14px; height: 14px; color: var(--color-text-tertiary); }
.opportunity-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding-top: 10px; border-top: 1px solid rgba(0,0,0,0.05);
}
.opportunity-price { font-size: 16px; font-weight: 700; color: var(--color-primary); }
.opportunity-price span { font-size: 12px; font-weight: 400; }
.opportunity-stats { display: flex; align-items: center; gap: 8px; }
.stat-item { display: flex; align-items: center; gap: 3px; font-size: 11px; color: var(--color-text-tertiary); }
.stat-item svg { width: 12px; height: 12px; color: var(--color-text-tertiary); }

/* ===== 加载状态 / 加载更多 ===== */
.loading-tip {
  display: flex; align-items: center; justify-content: center;
  gap: 8px; padding: 40px 0; color: var(--color-text-tertiary); font-size: 13px;
}
.loading-spinner {
  display: inline-block; width: 16px; height: 16px; border-radius: 50%;
  border: 2px solid var(--color-primary-50);
  border-top-color: var(--color-primary);
  animation: opportunity-spin 0.8s linear infinite;
}
@keyframes opportunity-spin { to { transform: rotate(360deg); } }

.empty-sub {
  display: block; margin-top: 6px; font-size: 12px; color: var(--color-text-tertiary);
}
.empty-tip p { font-size: 14px; color: var(--color-text-secondary); }

.load-more {
  display: flex; justify-content: center; padding: 16px 0 8px;
}
.load-more-btn {
  padding: 9px 28px; border-radius: 999px;
  border: 1px solid var(--color-primary); background: #fff;
  color: var(--color-primary); font-size: 13px; font-weight: 500;
  cursor: pointer; transition: all 0.2s ease;
}
.load-more-btn:active:not(:disabled) { background: var(--color-primary); color: #fff; }
.load-more-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.load-end {
  text-align: center; padding: 16px 0 8px;
  font-size: 12px; color: var(--color-text-tertiary);
}

/* 给筛选芯片在列表重载时一个轻微渐变，避免一闪而过 */
.quick-filter .filter-chip { transition: transform 0.2s ease, background 0.2s ease, color 0.2s ease; }
.quick-filter .filter-chip:active { transform: scale(0.94); }
.quick-filter .filter-chip.active { animation: chip-pulse 0.25s ease-out; }
@keyframes chip-pulse {
  0% { transform: scale(0.96); }
  100% { transform: scale(1); }
}

/* ===== Hero Card (title + search) ===== */
.hero-card {
  background: linear-gradient(135deg, #6d7cf6 0%, #8b5cf6 55%, #a78bfa 100%);
  border-radius: 18px;
  padding: 18px 16px 14px;
  margin: 12px 16px 0;
  box-shadow: 0 10px 28px rgba(99,102,241,0.32), 0 2px 6px rgba(0,0,0,0.06);
  position: relative;
  overflow: hidden;
}
.hero-card::before {
  content: '';
  position: absolute;
  top: -60px; right: -40px;
  width: 150px; height: 150px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,0.22), transparent 70%);
}
.hero-card::after {
  content: '';
  position: absolute;
  bottom: -38px; left: -20px;
  width: 100px; height: 100px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,0.14), transparent 70%);
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
  color: #fff;
}
.hero-sub {
  font-size: 12px;
  color: rgba(255,255,255,0.85);
  font-weight: 500;
}
.search-box {
  background: rgba(255,255,255,0.18);
  border-radius: 12px;
  padding: 10px 14px;
  position: relative; z-index: 1;
  border: 1px solid rgba(255,255,255,0.28);
  backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
  transition: background 0.2s, border-color 0.2s;
}
.search-box:focus-within {
  background: rgba(255,255,255,0.26);
  border-color: rgba(255,255,255,0.45);
}
.search-box input {
  width: 100%;
  border: none;
  background: transparent;
  font-size: 14px;
  color: #fff;
  outline: none;
}
.search-box input::placeholder {
  color: rgba(255,255,255,0.75);
}

/* ===== Floating Action Button ===== */
.fab {
  position: fixed;
  right: 20px;
  bottom: calc(84px + env(safe-area-inset-bottom, 0px));
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
  z-index: 210;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.fab svg { width: 26px; height: 26px; }
.fab:active {
  transform: scale(0.92);
  box-shadow: 0 4px 12px rgba(99,102,241,0.35);
}
</style>
