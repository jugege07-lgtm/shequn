<template>
  <div class="phone-frame">
    <div class="header">
      <div class="header-left">
        <div class="back-btn" @click="$router.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m15 18-6-6 6-6"/></svg>
        </div>
        <span class="header-title">商机详情</span>
      </div>
      <div class="header-right">
        <div class="header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
        </div>
      </div>
    </div>
    <div class="main-scroll">
      <!-- 封面图 Hero -->
      <div class="biz-cover-hero" :style="{ background: coverBg }">
        <img
          v-if="rawBusiness?.coverImage"
          :src="coverImageUrl"
          class="cover-img"
          loading="lazy"
          decoding="async"
          alt="商机封面"
          @error="onCoverError"
        />
        <span v-if="business.tag" class="cover-overlay-tag" :class="business.tagClass">{{ business.tag }}</span>
      </div>

      <!-- 1. 对接进度 -->
      <div class="info-card">
        <h3 class="section-label">对接进度</h3>
        <div class="progress-section">
          <div class="progress-info">
            <span class="progress-label">已解锁</span>
            <span class="progress-value">{{ business.progressText }}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{width: business.progress + '%'}"></div>
          </div>
          <span class="progress-percent">{{ business.progress }}%</span>
        </div>
      </div>

      <!-- 3. 联系方式（脱敏/解锁） -->
      <div class="info-card contact-card">
        <div class="contact-header">
          <h3 class="section-label" style="margin-bottom:0">联系方式</h3>
          <span class="contact-hint" v-if="!isUnlocked">需解锁后查看</span>
          <span class="contact-hint unlocked" v-else>已解锁</span>
        </div>
        <template v-if="isUnlocked">
          <div class="contact-item" v-if="business.contactName">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span class="contact-label">联系人</span>
            <span class="contact-value">{{ business.contactName }}</span>
          </div>
          <div class="contact-item" v-if="business.phone">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72"/></svg>
            <span class="contact-label">电话</span>
            <span class="contact-value">{{ business.phone }}</span>
          </div>
          <div class="contact-item" v-if="business.wechat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            <span class="contact-label">微信</span>
            <span class="contact-value">{{ business.wechat }}</span>
          </div>
        </template>
        <template v-else>
          <div class="contact-masked">
            <div class="mask-item">
              <span class="mask-label">联系人</span>
              <span class="mask-value">{{ maskedName }}</span>
            </div>
            <div class="mask-item">
              <span class="mask-label">电话</span>
              <span class="mask-value">{{ maskedPhone }}</span>
            </div>
            <div class="mask-item">
              <span class="mask-label">微信</span>
              <span class="mask-value">{{ maskedWechat }}</span>
            </div>
          </div>
          <div class="unlock-prompt">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span>解锁后可查看完整联系方式</span>
          </div>
        </template>
      </div>

      <!-- 4. 商机详情（需求详情） -->
      <div class="info-card">
        <h3 class="section-label">商机详情</h3>
        <div class="detail-text" v-html="business.sanitizedDetail"></div>
      </div>
    </div>

    <!-- 底部解锁按钮 -->
    <div class="bottom-action" v-if="!isUnlocked">
      <button class="unlock-btn" :disabled="unlocking" @click="handleUnlock">
        <svg v-if="!unlocking" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <span>{{ unlocking ? '解锁中...' : '解锁联系方式' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getBusinessDetail, unlockBusiness, getBusinessUnlockStatus } from '@/api'
import { sanitizeRichHtml } from '@/utils/sanitize'

const route = useRoute()
const router = useRouter()

interface BusinessInfo {
  id: number
  title: string
  coverImage: string
  description: string
  categoryName: string
  contactName: string
  contactPhone: string
  contactWechat: string
  unlockFee: number
  maxUnlocks: number
  currentUnlocks: number
  status: string
  publisherName: string
  createdAt: string
}

const rawBusiness = ref<BusinessInfo | null>(null)
const unlocking = ref(false)
const unlockStatus = ref<{ isUnlocked: boolean; feePaid: number; orderNo: string | null }>({
  isUnlocked: false,
  feePaid: 0,
  orderNo: null,
})

// 封面图 URL（拼接 /api 前缀）
const coverImageUrl = computed(() => {
  const url = rawBusiness.value?.coverImage || ''
  if (!url) return ''
  if (url.startsWith('http')) return url
  if (url.startsWith('/api/')) return url
  return '/api' + url
})

// 封面图背景（有图片时用图片，无图片时用渐变色占位）
const coverBg = computed(() => {
  const url = coverImageUrl.value
  if (url) return `url(${url}) center/cover no-repeat`
  return 'linear-gradient(135deg, #6366f1, #8b5cf6)'
})

// 封面图加载失败时回退到渐变色
function onCoverError(e: Event) {
  const img = e.target as HTMLImageElement
  if (img) img.style.display = 'none'
}

// 判断当前用户是否已解锁
const isUnlocked = computed(() => {
  const b = rawBusiness.value
  if (!b) return false
  // 后端已确认解锁
  if (unlockStatus.value.isUnlocked) return true
  // 免费商机视为已解锁
  if (b.unlockFee === 0) return true
  // 已解锁次数达到上限
  if (b.maxUnlocks > 0 && b.currentUnlocks >= b.maxUnlocks) return true
  return false
})

const tagClassMap: Record<string, string> = {
  '资源对接': '', '合作': 'coop', '需求': 'demand',
}

const business = computed(() => {
  const b = rawBusiness.value
  if (!b) {
    return {
      tag: '', tagClass: '', priceHtml: '', isFree: true,
      title: '加载中...',
      publisher: '', date: '',
      progress: 0, progressText: '0/0',
      contactName: '', phone: '', wechat: '',
      sanitizedDesc: '', sanitizedDetail: '',
    }
  }
  const isFree = b.unlockFee === 0
  const progress = b.maxUnlocks > 0 ? Math.round((b.currentUnlocks / b.maxUnlocks) * 100) : 0
  const date = b.createdAt ? new Date(b.createdAt).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }) + '日' : ''

  return {
    tag: b.categoryName && b.categoryName !== '其他' ? b.categoryName : '',
    tagClass: tagClassMap[b.categoryName] || '',
    priceHtml: isFree ? '免费' : `<span>¥</span>${b.unlockFee}`,
    isFree,
    title: b.title,
    publisher: b.publisherName || b.contactName,
    date,
    progress,
    progressText: `${b.currentUnlocks}/${b.maxUnlocks}`,
    contactName: b.contactName || '',
    phone: b.contactPhone || '',
    wechat: b.contactWechat || '',
    sanitizedDesc: sanitizeRichHtml(b.description, 200),
    sanitizedDetail: sanitizeRichHtml(b.description),
  }
})

// 脱敏处理：联系人姓名
const maskedName = computed(() => {
  const name = rawBusiness.value?.contactName || ''
  if (!name) return '---'
  if (name.length <= 1) return name
  return name[0] + '*'.repeat(name.length - 1)
})

// 脱敏处理：手机号（保留前3后4）
const maskedPhone = computed(() => {
  const phone = rawBusiness.value?.contactPhone || ''
  if (!phone) return '---'
  if (phone.length < 7) return '***'
  return phone.slice(0, 3) + '****' + phone.slice(-4)
})

// 脱敏处理：微信号（保留前2后2）
const maskedWechat = computed(() => {
  const wx = rawBusiness.value?.contactWechat || ''
  if (!wx) return '---'
  if (wx.length <= 2) return '***'
  if (wx.length <= 4) return wx.slice(0, 2) + '**'
  return wx.slice(0, 2) + '****' + wx.slice(-2)
})

async function loadBusiness() {
  try {
    const id = Number(route.params.id)
    const data = await getBusinessDetail(id)
    rawBusiness.value = {
      id: data.id,
      title: data.title,
      coverImage: data.coverImage || '',
      description: data.description || '',
      categoryName: data.category?.name || data.categoryName || '',
      contactName: data.contactName || '',
      contactPhone: data.contactPhone || '',
      contactWechat: data.contactWechat || '',
      unlockFee: data.unlockFee ?? 0,
      maxUnlocks: data.maxUnlocks ?? 0,
      currentUnlocks: data.currentUnlocks ?? 0,
      status: data.status || '',
      publisherName: data.publisher?.name || data.publisherName || '',
      createdAt: data.createdAt || '',
    }
  } catch (err: any) {
    console.error('获取商机详情失败:', err)
    showToast(err?.message || '加载失败')
  }
}

async function loadUnlockStatus() {
  try {
    const id = Number(route.params.id)
    const data = await getBusinessUnlockStatus(id)
    unlockStatus.value = {
      isUnlocked: data?.isUnlocked || false,
      feePaid: data?.feePaid ?? 0,
      orderNo: data?.orderNo || null,
    }
  } catch (err: any) {
    console.error('获取解锁状态失败:', err)
  }
}

onMounted(async () => {
  await loadBusiness()
  await loadUnlockStatus()

  // 从支付成功页返回时刷新状态
  if (route.query.paid === '1') {
    showToast('支付成功，商机已解锁')
    await loadUnlockStatus()
    await loadBusiness()
  }
})

const handleUnlock = async () => {
  if (!rawBusiness.value || unlocking.value || isUnlocked.value) return
  unlocking.value = true
  try {
    const result = await unlockBusiness(rawBusiness.value.id)
    if (result?.needPay && result?.order?.id) {
      router.push(`/order/pay/${result.order.id}?type=business&redirect=${encodeURIComponent(`/business/detail/${rawBusiness.value.id}`)}`)
      return
    }
    // 免费商机直接解锁成功
    unlockStatus.value = { isUnlocked: true, feePaid: 0, orderNo: result?.unlock?.orderNo || null }
    if (rawBusiness.value) {
      rawBusiness.value.currentUnlocks++
    }
    showToast('解锁成功！')
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || '解锁失败，请重试'
    showToast(msg)
  } finally {
    unlocking.value = false
  }
}

function showToast(msg: string) {
  const existing = document.querySelector('.biz-toast')
  if (existing) existing.remove()
  const el = document.createElement('div')
  el.className = 'biz-toast'
  el.textContent = msg
  el.style.cssText = 'position:fixed;top:40%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,.78);color:#fff;padding:12px 28px;border-radius:12px;font-size:14px;z-index:9999;white-space:nowrap;animation:fadeInOut 2s ease forwards'
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 2200)
}
</script>

<style scoped>
@import '@/styles/global.css';

.info-card {
  margin: 12px 16px;
  border-radius: var(--radius-xl);
  background: rgba(255,255,255,0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.5);
  box-shadow: var(--glass-shadow);
  padding: 16px;
}

/* ===== 封面图 Hero ===== */
.biz-cover-hero {
  width: 100%;
  height: 220px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
}
.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  position: absolute;
  inset: 0;
}
.cover-overlay-tag {
  position: absolute;
  top: 12px;
  left: 12px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  padding: 4px 12px;
  border-radius: 99px;
  background: rgba(99,102,241,0.85);
  z-index: 2;
}
.cover-overlay-tag.coop { background: rgba(16,185,129,0.85); }
.cover-overlay-tag.demand { background: rgba(245,158,11,0.85); }

/* ===== 基本信息 ===== */
.biz-top-row { display: flex; align-items: center; justify-content: flex-end; margin-bottom: 10px; }
.biz-price { font-size: 15px; font-weight: 700; color: var(--color-primary); }
.biz-price.free { color: #10b981; font-size: 12px; }
.biz-title { font-size: 18px; font-weight: 800; color: var(--color-text-primary); line-height: 1.4; margin-bottom: 8px; }
.biz-desc { font-size: 14px; color: var(--color-text-secondary); line-height: 1.6; margin-bottom: 12px; }
.biz-meta { display: flex; gap: 16px; }
.meta-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--color-text-tertiary); }
.meta-item svg { width: 14px; height: 14px; }

/* ===== 对接进度 ===== */
.progress-section { display: flex; flex-direction: column; gap: 8px; }
.progress-info { display: flex; align-items: center; justify-content: space-between; }
.progress-label { font-size: 13px; color: var(--color-text-tertiary); }
.progress-value { font-size: 13px; color: var(--color-text-secondary); font-weight: 600; }
.progress-bar { flex: 1; height: 6px; border-radius: 3px; background: rgba(99,102,241,0.15); overflow: hidden; }
.progress-fill { height: 100%; border-radius: 3px; background: var(--color-primary); transition: width 0.3s; }
.progress-percent { font-size: 13px; color: var(--color-primary); font-weight: 700; white-space: nowrap; }

/* ===== 联系方式 ===== */
.contact-card { position: relative; }
.contact-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.contact-hint { font-size: 11px; color: var(--color-text-tertiary); background: rgba(0,0,0,0.04); padding: 3px 8px; border-radius: 99px; }
.contact-hint.unlocked { color: #10b981; background: rgba(16,185,129,0.1); }

.contact-item { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid rgba(0,0,0,0.05); }
.contact-item:last-child { border-bottom: none; }
.contact-item svg { width: 18px; height: 18px; color: var(--color-primary); flex-shrink: 0; }
.contact-label { font-size: 13px; color: var(--color-text-tertiary); min-width: 44px; }
.contact-value { font-size: 14px; color: var(--color-text-primary); font-weight: 500; }

/* 脱敏样式 */
.contact-masked { display: flex; flex-direction: column; gap: 0; }
.mask-item { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid rgba(0,0,0,0.05); }
.mask-item:last-child { border-bottom: none; }
.mask-label { font-size: 13px; color: var(--color-text-tertiary); min-width: 44px; }
.mask-value { font-size: 14px; color: var(--color-text-tertiary); font-weight: 500; letter-spacing: 1px; }

.unlock-prompt { display: flex; align-items: center; gap: 8px; margin-top: 14px; padding: 10px 12px; background: rgba(99,102,241,0.06); border-radius: 8px; }
.unlock-prompt svg { width: 16px; height: 16px; color: var(--color-primary); flex-shrink: 0; }
.unlock-prompt span { font-size: 12px; color: var(--color-text-tertiary); }

/* ===== 商机详情 ===== */
.section-label { font-size: 15px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 10px; }
.detail-text { font-size: 14px; color: var(--color-text-secondary); line-height: 1.8; }

/* ===== 底部解锁按钮 ===== */
.bottom-action {
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 430px;
  padding: 12px 16px env(safe-area-inset-bottom, 12px);
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-top: 0.5px solid rgba(60,60,67,0.1);
  z-index: 200;
}
.unlock-btn {
  width: 100%; padding: 14px; border: none; border-radius: 12px;
  background: var(--color-primary); color: #fff;
  font-size: 16px; font-weight: 600; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: all 0.2s;
}
.unlock-btn:active:not(:disabled) { transform: scale(0.98); background: var(--color-primary-dark); }
.unlock-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.unlock-btn svg { flex-shrink: 0; }
</style>
