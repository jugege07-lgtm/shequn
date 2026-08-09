<template>
  <div class="phone-frame profile-page">
    <!-- Header -->
    <div class="profile-header">
      <div class="header-title-row">
        <div class="header-title">个人中心</div>
        <div class="header-setting" @click="$router.push('/setting/index')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
        </div>
      </div>
    </div>

    <!-- Decorative background elements -->
    <div class="profile-decorations">
      <div class="deco-spot spot-1"></div>
      <div class="deco-spot spot-2"></div>
      <div class="deco-spot spot-3"></div>
      <div class="deco-line"></div>
    </div>

    <!-- Main Scroll -->
    <div class="main-scroll" v-loading="loading">
      <!-- User Info Card -->
      <div class="user-info-card">
        <div class="user-avatar" :style="{ background: avatarBg }">
          <img v-if="displayAvatar && !avatarError" :src="displayAvatar" class="avatar-img" alt="头像" @error="avatarError = true" />
          <span v-else>{{ displayName.charAt(0) }}</span>
        </div>
        <div class="user-meta">
          <div class="user-name">{{ displayName }}</div>
          <div class="user-level" v-if="userInfo?.vipLevel">👑 VIP{{ userInfo.vipLevel }}</div>
          <div class="member-id-row">
            <span class="member-id">会员ID: {{ userInfo?.id ?? '-' }}</span>
            <span class="copy-btn" @click="copyMemberId">复制</span>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-card">
        <div class="stat-item" v-for="s in statsList" :key="s.label" @click="s.path && $router.push(s.path)">
          <div class="stat-value">{{ s.value }}</div>
          <div class="stat-label">{{ s.label }}</div>
        </div>
      </div>

      <!-- Dajia Connections Entry -->
      <div class="dajia-module" @click="handleDajiaClick">
        <div class="dajia-module-left">
          <div class="dajia-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          </div>
          <div class="dajia-module-info">
            <div class="dajia-module-title">大咖人脉</div>
            <div class="dajia-module-sub" v-if="dajiaVipOk">结识行业大咖 · 交换联系方式</div>
            <div class="dajia-module-sub" v-else>开通 VIP{{ dajiaMinVipLevel }} 解锁更多精彩</div>
          </div>
        </div>
        <div class="dajia-module-right">
          <span class="dajia-vip-tag" v-if="dajiaVipOk">已开通</span>
          <span class="dajia-vip-tag locked" v-else>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            VIP专属
          </span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="section-card">
        <div class="section-title">快捷操作</div>
        <div class="actions-grid">
          <div
            class="action-item"
            :class="{ disabled: action.disabled }"
            v-for="action in quickActions"
            :key="action.label"
            @click="action.disabled ? showNoPermission(action.disabledTip) : action.onClick()"
          >
            <div class="action-icon" :style="{ background: action.bg, color: action.color, opacity: action.disabled ? 0.5 : 1 }">
              <component :is="action.icon" />
            </div>
            <div class="action-label" :class="{ disabled: action.disabled }">{{ action.label }}</div>
          </div>
        </div>
      </div>

      <!-- Recent Activities -->
      <div class="section-card">
        <div class="section-header-row">
          <div class="section-title">最近动态</div>
          <div class="section-more" @click="$router.push('/activity/my')">查看更多</div>
        </div>
        <div class="activities-list" v-if="activities.length">
          <div class="activity-item" v-for="(activity, index) in activities" :key="index" @click="handleActivityClick(activity)">
            <div class="activity-dot" :class="activity.type"></div>
            <div class="activity-content">
              <div class="activity-title">{{ activity.title }}</div>
              <div class="activity-desc">{{ activity.desc }}</div>
            </div>
            <div class="activity-time">{{ activity.time }}</div>
          </div>
        </div>
        <div class="empty-state" v-else>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
          <span>暂无动态</span>
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
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        <span>活动</span>
      </div>
      <div class="tab" @click="$router.push('/opportunity/list')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/></svg>
        <span>商机</span>
      </div>
      <div class="tab" @click="$router.push('/mall/index')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2h16l-2 12H6L4 2zm0 0l-1 6M6 20a2 2 0 100 4 2 2 0 000-4zm12 0a2 2 0 100 4 2 2 0 000-4z"/></svg>
        <span>商城</span>
      </div>
      <div class="tab active">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span>我的</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getCurrentUser, getMyActivities, getMyBusinesses, getDajiaConfig } from '@/api'
import { useUserStore } from '@/store/user'
import { normalizeImageUrl } from '@/utils/image'

const router = useRouter()
const userStore = useUserStore()

const userInfo = ref<any>(userStore.userInfo || null)
const loading = ref(false)
const activities = ref<any[]>([])
const avatarError = ref(false)
const dajiaMinVipLevel = ref(1)

const dajiaVipOk = computed(() => {
  const u = userInfo.value
  if (!u) return false
  if ((u.vipLevel || 0) < dajiaMinVipLevel.value) return false
  if (u.vipExpireAt && new Date(u.vipExpireAt).getTime() < Date.now()) return false
  return true
})

const displayName = computed(() => userInfo.value?.nickname || userInfo.value?.realName || '用户')
const displayAvatar = computed(() => normalizeImageUrl(userInfo.value?.avatarUrl))
watch(displayAvatar, () => { avatarError.value = false })

const isAdmin = computed(() => {
  return userInfo.value?.role === 'admin' || userInfo.value?.adminLevel > 0
})

const avatarBg = computed(() => {
  const colors = ['#ede9fe', '#dbeafe', '#fef3c7', '#fce7f3', '#d1fae5']
  const c = displayName.value.charCodeAt(0)
  return colors[c % colors.length]
})

const statsList = computed(() => [
  { label: '我的活动', value: userInfo.value?.activityCount || 0, path: '/activity/my' },
  { label: '我的商机', value: userInfo.value?.businessCount || 0, path: '/business/my' },
  { label: '我的积分', value: userInfo.value?.points || 0, path: '/points/index' },
  { label: '优惠券', value: userInfo.value?.couponCount || 0, path: '/coupon/index' },
])

function copyMemberId() {
  const id = userInfo.value?.id
  if (!id) return
  if (navigator.clipboard) {
    navigator.clipboard.writeText(String(id)).then(() => showToast('会员ID已复制'))
  } else {
    const input = document.createElement('input')
    input.value = String(id)
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    showToast('会员ID已复制')
  }
}

function showToast(msg: string) {
  const existing = document.querySelector('.mobile-toast')
  if (existing) existing.remove()
  const el = document.createElement('div')
  el.className = 'mobile-toast'
  el.textContent = msg
  el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.78);color:#fff;padding:12px 28px;border-radius:12px;font-size:14px;z-index:9999;white-space:nowrap'
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 2000)
}

function renderIcon(name: string) {
  const icons: Record<string, any> = {
    card: h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
      h('rect', { x: '2', y: '5', width: '20', height: '14', rx: '2' }),
      h('line', { x1: '2', y1: '10', x2: '22', y2: '10' }),
    ]),
    publishBusiness: h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
      h('path', { d: 'M12 2L2 7l10 5 10-5-10-5z' }),
      h('path', { d: 'M2 17l10 5 10-5' }),
      h('path', { d: 'M2 12l10 5 10-5' }),
    ]),
    publishActivity: h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
      h('rect', { x: '3', y: '4', width: '18', height: '18', rx: '2' }),
      h('path', { d: 'M16 2v4M8 2v4M3 10h18' }),
    ]),
    invite: h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
      h('path', { d: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2' }),
      h('circle', { cx: '12', cy: '7', r: '4' }),
    ]),
    message: h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
      h('path', { d: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z' }),
    ]),
    order: h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
      h('path', { d: 'M4 2h16l-2 12H6L4 2zm0 0l-1 6M6 20a2 2 0 100 4 2 2 0 000-4zm12 0a2 2 0 100 4 2 2 0 000-4z' }),
    ]),
    points: h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
      h('circle', { cx: '12', cy: '12', r: '10' }),
      h('path', { d: 'M12 6v6l4 2' }),
    ]),
    coupon: h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
      h('path', { d: 'M20 12V8H6a2 2 0 01-2-2c0-1.1.9-2 2-2h12v4' }),
      h('path', { d: 'M4 6v12c0 1.1.9 2 2 2h14v-4' }),
      h('path', { d: 'M18 12a2 2 0 100-4 2 2 0 000 4z' }),
    ]),
    claim: h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
      h('path', { d: 'M12 2L2 7l10 5 10-5-10-5z' }),
      h('path', { d: 'M2 17l10 5 10-5' }),
      h('path', { d: 'M2 12l10 5 10-5' }),
    ]),
  }
  return icons[name]
}

const quickActions = computed(() => [
  { label: '我的名片', icon: renderIcon('card'), bg: '#ede9fe', color: '#6366f1', onClick: () => router.push('/card/index') },
  { label: '发布商机', icon: renderIcon('publishBusiness'), bg: '#dbeafe', color: '#3b82f6', onClick: () => router.push('/business/publish') },
  { label: '创建活动', icon: renderIcon('publishActivity'), bg: '#fef3c7', color: '#f59e0b', onClick: () => router.push('/activity/publish'), disabled: !isAdmin.value, disabledTip: '请联系管理员获取创建权限' },
  { label: '邀请好友', icon: renderIcon('invite'), bg: '#fce7f3', color: '#db2777', onClick: () => router.push('/card/index') },
  { label: '消息', icon: renderIcon('message'), bg: '#d1fae5', color: '#10b981', onClick: () => router.push('/message/index') },
  { label: '订单', icon: renderIcon('order'), bg: '#ede9fe', color: '#6366f1', onClick: () => router.push('/order/list') },
  { label: '积分', icon: renderIcon('points'), bg: '#dbeafe', color: '#3b82f6', onClick: () => router.push('/points/index') },
  { label: '优惠券', icon: renderIcon('coupon'), bg: '#fef3c7', color: '#f59e0b', onClick: () => router.push('/coupon/index') },
])

function showNoPermission(tip?: string) {
  const msg = tip || '暂无权限，请联系管理员'
  const existing = document.querySelector('.profile-toast')
  if (existing) existing.remove()
  const el = document.createElement('div')
  el.className = 'profile-toast'
  el.textContent = msg
  el.style.cssText = 'position:fixed;top:42%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,.78);color:#fff;padding:12px 28px;border-radius:12px;font-size:14px;z-index:9999;white-space:nowrap;animation:fadeInOut 2s ease forwards'
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 2200)
}

async function loadUser() {
  loading.value = true
  try {
    const data = await getCurrentUser().catch(() => null)
    if (data) {
      userInfo.value = data
      userStore.setUserInfo(data)
    }
  } finally {
    loading.value = false
  }
}

function handleDajiaClick() {
  if (dajiaVipOk.value) {
    router.push('/dajia/index')
  } else {
    showNoPermission(`大咖人脉为 VIP${dajiaMinVipLevel.value} 及以上会员专属，请先开通`)
  }
}

async function loadDajiaConfig() {
  try {
    const config = await getDajiaConfig()
    dajiaMinVipLevel.value = config?.minVipLevel || 1
  } catch {
    // 忽略，使用默认级别
  }
}

async function loadActivities() {
  try {
    const [activityData, businessData] = await Promise.all([
      getMyActivities({ page: 1, size: 3 }).catch(() => null),
      getMyBusinesses({ page: 1, size: 3 }).catch(() => null),
    ])

    const temp: any[] = []
    if (activityData?.list) {
      activityData.list.forEach((item: any) => {
        temp.push({ type: 'activity', title: '报名了活动', desc: item.title || '活动', time: formatTime(item.createdAt), id: item.id })
      })
    }
    if (businessData?.list) {
      businessData.list.forEach((item: any) => {
        temp.push({ type: 'business', title: '发布了商机', desc: item.title || '商机', time: formatTime(item.createdAt), id: item.id })
      })
    }

    temp.sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime())
    activities.value = temp.slice(0, 3)
  } catch {
    activities.value = []
  }
}

function formatTime(dateStr: string) {
  if (!dateStr) return '未知'
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (days === 0) return hours === 0 ? '刚刚' : `${hours}小时前`
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString()
}

function handleActivityClick(activity: any) {
  if (activity.type === 'activity') router.push(`/activity/detail/${activity.id}`)
  else if (activity.type === 'business') router.push(`/business/detail/${activity.id}`)
}

onMounted(() => {
  document.title = '个人中心'
  loadUser()
  loadActivities()
  loadDajiaConfig()
})
</script>

<style scoped>
@import '@/styles/global.css';

.profile-page { background: #f5f6fa; position: relative; }

/* Decorative background */
.profile-decorations {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 340px;
  overflow: hidden;
  z-index: 0;
  pointer-events: none;
}
.deco-spot {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(139,92,246,0.14) 0%, rgba(139,92,246,0) 72%);
}
.spot-1 { width: 180px; height: 180px; top: -50px; right: -50px; }
.spot-2 { width: 140px; height: 140px; top: 120px; left: -40px; }
.spot-3 { width: 90px; height: 90px; top: 220px; right: 30px; }
.deco-line {
  position: absolute;
  width: 140px; height: 3px;
  background: linear-gradient(90deg, transparent, rgba(139,92,246,0.2), transparent);
  top: 160px; right: 8%; transform: rotate(-12deg);
  border-radius: 2px;
}

/* Header */
.profile-header {
  background: transparent;
  padding: 12px 16px 0;
  color: #1e1b4b;
  position: relative;
  z-index: 1;
}
.header-title-row {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
}
.header-title {
  font-size: 18px;
  font-weight: 700;
}
.header-setting {
  position: absolute;
  right: -4px;
  width: 40px; height: 40px; border-radius: 50%;
  background: rgba(99,102,241,0.1); display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease;
  z-index: 10; color: #6366f1;
}
.header-setting:active { background: rgba(99,102,241,0.18); }
.header-setting svg { width: 22px; height: 22px; }

/* Main Scroll */
.main-scroll {
  flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
  padding: 16px 16px 24px;
  position: relative;
  z-index: 1;
}

/* User Info Card */
.user-info-card {
  margin-bottom: 14px;
  padding: 18px 16px;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  display: flex; align-items: center; gap: 14px;
}
.user-avatar {
  width: 64px; height: 64px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; font-weight: 700; color: #6366f1;
  border: 3px solid rgba(99,102,241,0.12); overflow: hidden;
  background: #ede9fe;
  flex-shrink: 0;
}
.avatar-img { width: 100%; height: 100%; object-fit: cover; }
.user-meta { flex: 1; min-width: 0; }
.user-name { font-size: 20px; font-weight: 800; color: #1e1b4b; margin-bottom: 4px; }
.user-level { font-size: 12px; font-weight: 600; color: #f59e0b; margin-bottom: 4px; }
.member-id-row { display: flex; align-items: center; gap: 8px; }
.member-id {
  display: inline-block; padding: 3px 10px; border-radius: 99px;
  background: #f3f4f6; color: #6b7280; font-size: 12px;
}
.copy-btn {
  font-size: 12px; color: #6366f1; font-weight: 600; cursor: pointer;
  padding: 3px 8px; border-radius: 6px; transition: background 0.15s;
}
.copy-btn:active { background: rgba(99,102,241,0.1); }

/* Stats */
.stats-card {
  margin-bottom: 16px;
  padding: 18px 0;
  background: #ffffff;
  border-radius: 18px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}
.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
  transition: opacity 0.15s;
}
.stat-item:active { opacity: 0.7; }
.stat-value { font-size: 22px; font-weight: 800; margin-bottom: 4px; color: #6366f1; }
.stat-label { font-size: 12px; color: #6b7280; }

/* Dajia Module */
.dajia-module {
  margin-bottom: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #faf5ff 0%, #ffffff 60%);
  border: 1px solid rgba(139,92,246,0.15);
  border-radius: 18px;
  box-shadow: 0 4px 16px rgba(139,92,246,0.06);
  display: flex; align-items: center; justify-content: space-between;
  cursor: pointer; transition: transform 0.15s ease;
}
.dajia-module:active { transform: scale(0.98); }
.dajia-module-left { display: flex; align-items: center; gap: 12px; }
.dajia-logo {
  width: 48px; height: 48px; border-radius: 14px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex; align-items: center; justify-content: center;
  color: #fff; flex-shrink: 0;
}
.dajia-logo svg { width: 26px; height: 26px; }
.dajia-module-info { min-width: 0; }
.dajia-module-title { font-size: 16px; font-weight: 700; color: #1e1b4b; margin-bottom: 4px; }
.dajia-module-sub { font-size: 12px; color: #6b7280; }
.dajia-module-right { display: flex; align-items: center; gap: 8px; color: #8b5cf6; }
.dajia-module-right > svg { width: 16px; height: 16px; flex-shrink: 0; }
.dajia-vip-tag {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 10px; border-radius: 99px;
  background: rgba(16,185,129,0.1); color: #10b981;
  font-size: 12px; font-weight: 600; white-space: nowrap;
}
.dajia-vip-tag.locked { background: rgba(245,158,11,0.1); color: #f59e0b; }
.dajia-vip-tag svg { width: 12px; height: 12px; }

/* Section Card */
.section-card {
  margin-bottom: 16px;
  padding: 16px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}
.section-title { font-size: 16px; font-weight: 700; color: #1e1b4b; margin-bottom: 14px; }
.section-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.section-title { margin-bottom: 0; }
.section-more { font-size: 13px; color: #6366f1; font-weight: 500; cursor: pointer; }

/* Actions Grid */
.actions-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px 10px; }
.action-item { display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; transition: transform 0.15s; }
.action-item:active { transform: scale(0.95); }
.action-icon {
  width: 48px; height: 48px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
}
.action-icon svg { width: 24px; height: 24px; }
.action-label { font-size: 12px; color: #4b5563; }
.action-item.disabled { cursor: not-allowed; }
.action-item.disabled:active { transform: none; }
.action-label.disabled { color: #9ca3af; }

/* Activities */
.activities-list { display: flex; flex-direction: column; gap: 12px; }
.activity-item { display: flex; align-items: center; gap: 12px; cursor: pointer; }
.activity-dot {
  width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
  background: #9ca3af;
}
.activity-dot.activity { background: #3b82f6; }
.activity-dot.business { background: #6366f1; }
.activity-dot.mall { background: #10b981; }
.activity-content { flex: 1; }
.activity-title { font-size: 14px; font-weight: 600; color: #1e1b4b; margin-bottom: 2px; }
.activity-desc { font-size: 12px; color: #6b7280; }
.activity-time { font-size: 11px; color: #9ca3af; flex-shrink: 0; }

/* Empty State */
.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 32px; color: #9ca3af;
}
.empty-state svg { width: 40px; height: 40px; margin-bottom: 8px; }
.empty-state span { font-size: 13px; }

/* TabBar */
.tabbar {
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 430px;
  display: flex; background: rgba(255,255,255,0.95);
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
