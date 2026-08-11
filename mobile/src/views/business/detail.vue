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
        <div class="header-icon" @click="openShare">
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
            <a class="contact-value contact-phone" :href="`tel:${business.phone}`">{{ business.phone }}</a>
            <button class="contact-copy-btn" @click="copyPhone" aria-label="复制手机号">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              <span>复制</span>
            </button>
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
          <!-- 免费解锁次数提示（仅免费商机显示） -->
          <div v-if="isFreeBiz && freeUnlock" class="free-unlock-tip">
            <span class="tip-icon">🎁</span>
            <span class="tip-text">
              本月免费解锁剩余 <strong>{{ freeUnlock.remaining }}</strong> / {{ freeUnlock.total }} 次
            </span>
            <router-link v-if="freeUnlock.remaining <= 0" to="/vip/index" class="upgrade-link">升级VIP</router-link>
          </div>
          <!-- 免费次数耗尽，提示升级VIP -->
          <div v-if="isFreeBiz && freeUnlock && freeUnlock.remaining <= 0" class="vip-upgrade-banner">
            <span>本月免费解锁次数已用完</span>
            <router-link to="/vip/index" class="upgrade-btn">立即升级VIP</router-link>
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
      <div v-if="isFreeBiz && freeUnlock && freeUnlock.remaining > 0" class="price-info-free">
        <span class="free-label">免费解锁</span>
        <span class="free-sub">本月剩余 {{ freeUnlock.remaining }} 次</span>
      </div>
      <div v-else-if="isFreeBiz && freeUnlock && freeUnlock.remaining <= 0" class="price-info-exhausted">
        <span class="exhausted-label">免费次数已用完</span>
        <router-link to="/vip" class="exhausted-upgrade">升级VIP解锁更多</router-link>
      </div>
      <div v-else-if="!isFreeBiz" class="price-info-paid">
        <span class="paid-price" v-html="business.priceHtml"></span>
        <span class="paid-label">解锁费用</span>
      </div>
      <button
        class="unlock-btn"
        :class="{ 'btn-free': isFreeBiz && freeUnlock && freeUnlock.remaining > 0, 'btn-exhausted': isFreeBiz && freeUnlock && freeUnlock.remaining <= 0 }"
        :disabled="unlocking || (isFreeBiz && freeUnlock && freeUnlock.remaining <= 0)"
        @click="handleUnlock"
      >
        <svg v-if="!unlocking" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <span>{{ unlockBtnText }}</span>
      </button>
    </div>

    <!-- 分享面板 -->
    <ShareSheet
      v-model="shareOpen"
      :share="shareContent"
      :referrer-id="userStore.userInfo?.id"
      :referrer-name="userStore.userInfo?.nickname || userStore.userInfo?.realName"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getBusinessDetail, unlockBusiness, getBusinessUnlockStatus, getFreeUnlockStats } from '@/api'
import { sanitizeRichHtml } from '@/utils/sanitize'
import { normalizeImageUrl } from '@/utils/image'
import { recordBrowse } from '@/utils/browseHistory'
import { useUserStore } from '@/store/user'
import ShareSheet from '@/components/ShareSheet.vue'
import type { ShareContent } from '@/utils/share'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// ===== 分享 =====
const shareOpen = ref(false)
const shareContent = ref<ShareContent | null>(null)
function openShare() {
  const b = rawBusiness.value
  if (!b) return
  shareContent.value = {
    type: 'business',
    title: b.title || '',
    desc: '优质商机分享，把握商机从现在开始！',
    image: b.coverImage,
    meta: [business.value.publisher, business.value.date].filter(Boolean),
    price: business.value.priceHtml,
    path: `/business/detail/${b.id}`,
  }
  shareOpen.value = true
}

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
const unlockStatus = ref<{ isUnlocked: boolean; feePaid: number; orderNo: string | null; freeUnlock?: any }>({
  isUnlocked: false,
  feePaid: 0,
  orderNo: null,
})
// 免费解锁月度统计
const freeUnlock = ref<{ total: number; used: number; remaining: number; isVip: boolean; vipLevel: number } | null>(null)

// 封面图 URL（统一规范化：绝对 /uploads/ 地址转成 /api/uploads/ 相对路径，避免手机端 localhost 失败）
const coverImageUrl = computed(() => normalizeImageUrl(rawBusiness.value?.coverImage))

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
  // 已解锁次数达到上限（所有人可见）
  if (b.maxUnlocks > 0 && b.currentUnlocks >= b.maxUnlocks) return true
  return false
})

// 是否为免费商机
const isFreeBiz = computed(() => {
  const b = rawBusiness.value
  return !!b && b.unlockFee === 0
})

// 解锁按钮文案
const unlockBtnText = computed(() => {
  if (unlocking.value) return '解锁中...'
  if (!userStore.isLoggedIn) return '登录后查看联系方式'
  if (isFreeBiz.value && freeUnlock.value) {
    if (freeUnlock.value.remaining > 0) return '免费解锁'
    return '升级VIP解锁更多'
  }
  return '立即解锁'
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
    // 记录浏览历史
    recordBrowse('business', data.id, data.title || '')
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
    if (data?.freeUnlock) {
      freeUnlock.value = data.freeUnlock
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
  // 未登录时跳转登录页
  if (!userStore.isLoggedIn) {
    router.push(`/login?redirect=${encodeURIComponent(route.fullPath)}`)
    return
  }
  // 免费次数耗尽时，点击跳转到VIP页
  if (isFreeBiz.value && freeUnlock.value && freeUnlock.value.remaining <= 0) {
    router.push('/vip/index')
    return
  }
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
    // 刷新免费解锁统计并提示剩余次数
    if (isFreeBiz.value) {
      await loadUnlockStatus()
      const remaining = freeUnlock.value?.remaining ?? 0
      showToast(`解锁成功！本月剩余免费解锁 ${remaining} 次`)
    } else {
      showToast('解锁成功！')
    }
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

// 复制手机号到剪贴板，并给出成功/失败反馈
async function copyPhone() {
  const phone = business.value?.phone || ''
  if (!phone) return
  try {
    await navigator.clipboard.writeText(phone)
    showToast('手机号已复制')
  } catch (err) {
    // 降级方案：兼容不支持 Clipboard API 的浏览器/WebView
    try {
      const ta = document.createElement('textarea')
      ta.value = phone
      ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0'
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      showToast(ok ? '手机号已复制' : '复制失败，请长按手动复制')
    } catch {
      showToast('复制失败，请长按手动复制')
    }
  }
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

/* 手机号点击拨号 */
.contact-phone {
  color: var(--color-primary);
  font-weight: 600;
  text-decoration: none;
  margin-right: auto;
}
.contact-phone:active { opacity: 0.7; }

/* 复制按钮 */
.contact-copy-btn {
  display: flex; align-items: center; gap: 4px;
  flex-shrink: 0;
  padding: 5px 10px;
  border: 1px solid rgba(99,102,241,0.35);
  border-radius: 8px;
  background: rgba(99,102,241,0.06);
  color: var(--color-primary);
  font-size: 12px; font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  -webkit-tap-highlight-color: transparent;
}
.contact-copy-btn svg { width: 14px; height: 14px; color: var(--color-primary); }
.contact-copy-btn:active { background: rgba(99,102,241,0.15); transform: scale(0.96); }

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
.unlock-btn.btn-free { background: #10b981; }
.unlock-btn.btn-free:active:not(:disabled) { background: #059669; }
.unlock-btn.btn-exhausted { background: #9ca3af; }

/* 价格信息区 */
.price-info-free,
.price-info-exhausted,
.price-info-paid {
  display: flex; align-items: baseline; justify-content: space-between;
  margin-bottom: 10px;
}
.free-label {
  font-size: 20px; font-weight: 700; color: #10b981;
}
.free-sub {
  font-size: 13px; color: #6b7280;
}
.exhausted-label {
  font-size: 14px; color: #6b7280;
}
.exhausted-upgrade {
  font-size: 13px; color: var(--color-primary); font-weight: 600;
  text-decoration: none;
}
.paid-price {
  font-size: 22px; font-weight: 700; color: #ef4444;
}
.paid-label {
  font-size: 13px; color: #6b7280;
}

/* 免费解锁提示 */
.free-unlock-tip {
  display: flex; align-items: center; gap: 8px;
  margin-top: 12px; padding: 10px 14px;
  background: #ecfdf5; border-radius: 8px;
  font-size: 13px; color: #065f46;
}
.free-unlock-tip .tip-icon { font-size: 16px; }
.free-unlock-tip .tip-text strong { color: #059669; font-weight: 700; }
.free-unlock-tip .upgrade-link {
  margin-left: auto;
  color: #059669; font-weight: 600; text-decoration: none;
  padding: 4px 10px; border: 1px solid #059669; border-radius: 12px;
  font-size: 12px;
}

/* VIP升级横幅 */
.vip-upgrade-banner {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 12px; padding: 12px 14px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 8px;
  font-size: 13px; color: #92400e;
  font-weight: 600;
}
.vip-upgrade-banner .upgrade-btn {
  padding: 6px 14px;
  background: #d97706; color: #fff;
  border-radius: 16px; font-size: 12px;
  text-decoration: none;
}
</style>
