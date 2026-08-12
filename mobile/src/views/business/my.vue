<template>
  <div class="phone-frame">
    <div class="header">
      <div class="header-left">
        <div class="back-btn" @click="$router.back()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m15 18-6-6 6-6"/></svg></div>
        <span class="header-title">我的商机</span>
      </div>
    </div>

    <div class="main-scroll" v-loading="loading">
      <div class="list-card" v-if="items.length > 0">
        <div class="item" v-for="it in items" :key="it.id" @click="goDetail(it)">
          <div class="item-tag" :class="it.statusClass">{{ it.statusText }}</div>
          <div class="item-main">
            <div class="item-title">{{ it.title }}</div>
            <div class="item-meta">{{ it.date }}<span v-if="it.categoryName"> · {{ it.categoryName }}</span><span v-if="it.free"> · 免费</span></div>
          </div>
          <svg class="item-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </div>
      </div>
      <div class="empty-state" v-else>
        <div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div>
        <div class="empty-title">暂无商机</div>
        <div class="empty-desc">去发布一条商机吧</div>
        <div class="empty-btn" @click="$router.push('/business/publish')">发布商机</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMyBusinesses, getBusinessCategories } from '@/api'

const router = useRouter()
const items = ref<any[]>([])
const loading = ref(false)
const categories = ref<any[]>([])

const statusMap: Record<string, { text: string; cls: string }> = {
  pending: { text: '审核中', cls: 'pending' },
  approved: { text: '已通过', cls: 'approved' },
  rejected: { text: '已拒绝', cls: 'rejected' },
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function categoryName(id: number | string | null | undefined) {
  if (id == null) return ''
  return categories.value.find((c) => Number(c.id) === Number(id))?.name || ''
}

function goDetail(it: any) {
  router.push(`/business/detail/${it.id}`)
}

async function loadCategories() {
  try {
    const data = await getBusinessCategories()
    if (Array.isArray(data)) categories.value = data
  } catch {
    categories.value = []
  }
}

async function loadItems() {
  loading.value = true
  try {
    const data = await getMyBusinesses({ page: 1, size: 50 })
    const list = Array.isArray(data) ? data : data?.list || []
    items.value = list.map((b: any) => {
      const st = statusMap[b.status] || { text: b.status || '未知', cls: '' }
      return {
        id: b.id,
        title: b.title,
        status: b.status,
        statusText: st.text,
        statusClass: st.cls,
        date: formatDate(b.createdAt),
        categoryName: categoryName(b.categoryId),
        free: !b.unlockFee || Number(b.unlockFee) <= 0,
      }
    })
  } catch (err: any) {
    showToast(err.userMessage || err.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function showToast(msg: string) {
  if (typeof uni !== 'undefined' && uni.showToast) {
    uni.showToast({ title: msg, icon: 'none' })
    return
  }
  const existing = document.querySelector('.mobile-toast')
  if (existing) existing.remove()
  const el = document.createElement('div')
  el.className = 'mobile-toast'
  el.textContent = msg
  el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.78);color:#fff;padding:12px 28px;border-radius:12px;font-size:14px;z-index:9999;white-space:nowrap'
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 2000)
}

onMounted(() => {
  document.title = '我的商机'
  loadCategories()
  loadItems()
})
</script>

<style scoped>
@import '@/styles/global.css';
.main-scroll { padding-bottom: 40px; }
.list-card { padding: 12px 16px 16px; }
.item {
  display: flex; align-items: center; gap: 12px; padding: 14px;
  border-radius: var(--radius-lg); background: rgba(255,255,255,0.7);
  border: 1px solid rgba(255,255,255,0.5); box-shadow: var(--glass-shadow);
  margin-bottom: 10px; cursor: pointer;
}
.item-tag {
  font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 99px; flex-shrink: 0;
}
.item-tag.pending { background: #fef3c7; color: #d97706; }
.item-tag.approved { background: #d1fae5; color: #059669; }
.item-tag.rejected { background: #fee2e2; color: #dc2626; }
.item-main { flex: 1; min-width: 0; }
.item-title { flex: 1; font-size: 14px; font-weight: 600; color: var(--color-text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 4px; }
.item-meta { font-size: 12px; color: var(--color-text-tertiary); }
.item-arrow { width: 16px; height: 16px; color: #c4c4c4; flex-shrink: 0; }
.empty-state { padding: 60px 20px; text-align: center; }
.empty-icon { width: 80px; height: 80px; margin: 0 auto 16px; border-radius: var(--radius-xl); background: rgba(255,255,255,0.7); display: flex; align-items: center; justify-content: center; }
.empty-icon svg { width: 40px; height: 40px; color: var(--color-text-tertiary); }
.empty-title { font-size: 16px; font-weight: 600; color: var(--color-text-primary); margin-bottom: 4px; }
.empty-desc { font-size: 13px; color: var(--color-text-secondary); margin-bottom: 20px; }
.empty-btn { display: inline-block; padding: 10px 24px; border-radius: 99px; background: var(--color-primary); color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; }
</style>