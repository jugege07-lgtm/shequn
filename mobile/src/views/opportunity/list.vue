<template>
  <div class="phone-frame">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <div class="back-btn" @click="$router.push('/')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </div>
        <span class="header-title">商机大厅</span>
      </div>
      <div class="header-right">
        <div class="header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        </div>
        <div class="header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
        </div>
      </div>
    </div>

    <div class="main-scroll">
      <!-- Search Bar -->
      <div class="search-bar">
        <div class="search-container">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input type="text" class="search-input" placeholder="搜索商机、项目、合作方..." />
        </div>
      </div>

      <!-- Quick Filter -->
      <div class="quick-filter">
        <div class="filter-chip active" v-for="(chip, i) in filters" :key="i" :class="{ active: activeFilter === i }" @click="activeFilter = i">{{ chip }}</div>
      </div>

      <!-- Opportunity List -->
      <div class="opportunity-list" v-loading="loading">
        <div v-if="opportunities.length === 0" class="empty-tip">暂无商机</div>
        <div class="opportunity-item" v-for="o in opportunities" :key="o.id" @click="$router.push('/business/detail/' + o.id)">
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
      </div>
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
import { ref, onMounted } from 'vue'
import { formatPriceHtml, stripHtml } from '@/utils/sanitize'
import { getBusinesses } from '@/api'

const filters = ['全部', '急寻合作', '项目对接', '资源置换', '投资需求', '技术合作', '供应链', '人才招聘']
const activeFilter = ref(0)
const opportunities = ref<any[]>([])
const loading = ref(false)

async function loadOpportunities() {
  loading.value = true
  try {
    const data = await getBusinesses({ page: 1, size: 20 })
    if (data?.list) {
      opportunities.value = data.list.map((item: any) => ({
        id: item.id,
        title: item.title,
        urgency: '中',
        urgencyClass: '',
        desc: item.description || '',
        sanitizedDesc: stripHtml(item.description || ''),
        location: '待定',
        date: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '待定',
        price: item.unlockFee || 0,
        isFree: item.unlockFee === 0,
        views: '0',
      }))
    }
  } catch (err: any) {
    console.error('加载商机失败:', err)
    opportunities.value = getMockOpportunities()
  } finally {
    loading.value = false
  }
}

function getMockOpportunities() {
  return [
    { id: 1, title: '急寻跨境电商供应链合作伙伴 · 月需求 10 万件', urgency: '急', urgencyClass: 'urgent', desc: '我们是一家跨境电商公司，主营家居用品和电子产品', sanitizedDesc: '我们是一家跨境电商公司，主营家居用品和电子产品', location: '深圳 · 跨境贸易', date: '7月15日发布', validity: '有效期 30天', priceHtml: '预算 <span>¥</span>50-100万', connects: '23人', views: '1.2k' },
    { id: 2, title: 'AI 智能客服系统技术合作 · 寻求算法工程师', urgency: '高', urgencyClass: 'high', desc: '我们是一家 SaaS 公司，正在开发新一代 AI 智能客服系统', sanitizedDesc: '我们是一家 SaaS 公司，正在开发新一代 AI 智能客服系统', location: '杭州 · 人工智能', date: '7月14日发布', validity: '长期有效', priceHtml: '预算 <span>¥</span>20-50万', connects: '18人', views: '856' },
  ]
}

onMounted(loadOpportunities)
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
</style>
