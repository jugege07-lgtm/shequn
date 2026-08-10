<template>
  <div class="phone-frame profile-page">
    <!-- Decorative background elements -->
    <div class="profile-decorations">
      <div class="deco-spot spot-1"></div>
      <div class="deco-spot spot-2"></div>
      <div class="deco-spot spot-3"></div>
      <div class="deco-line"></div>
    </div>

    <!-- Main Scroll -->
    <div class="main-scroll" v-loading="loading">
      <!-- Member Card -->
      <div class="member-card">
        <div class="mc-mesh mc-mesh-1"></div>
        <div class="mc-mesh mc-mesh-2"></div>
        <div class="mc-glow"></div>

        <div class="mc-top">
          <div class="mc-avatar" :style="{ background: avatarBg }">
            <img v-if="displayAvatar && !avatarError" :src="displayAvatar" class="avatar-img" alt="头像" @error="avatarError = true" />
            <span v-else>{{ displayName.charAt(0) }}</span>
          </div>
          <div class="mc-meta">
            <div class="mc-name">{{ displayName }}</div>
            <div class="mc-badges">
              <span class="mc-vip" v-if="userInfo?.vipLevel">👑 VIP{{ userInfo.vipLevel }}</span>
              <span class="mc-tag">社群成员</span>
            </div>
          </div>
          <div class="mc-top-right">
            <div class="mc-menu-btn" @click="toggleSettingsMenu">
              <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
            </div>
            <div class="mc-brand">SHEQUN</div>
          </div>
        </div>

        <div class="mc-divider"></div>

        <div class="mc-bottom">
          <div class="mc-bottom-label">会员ID</div>
          <div class="mc-id">{{ memberId }}</div>
        </div>
      </div>

      <!-- Data Cards -->
      <div class="data-card">
        <div class="data-item" v-for="s in statsList" :key="s.label" @click="s.path && $router.push(s.path)">
          <div class="data-icon" :style="{ background: s.bg, color: s.color }">
            <component :is="s.icon" />
          </div>
          <div class="data-value">{{ s.value }}</div>
          <div class="data-label">{{ s.label }}</div>
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
              <span v-if="action.badge && unreadCount > 0" class="action-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
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
          <span>暂无最新动态</span>
        </div>
      </div>

    </div>

    <!-- Settings Menu -->
    <transition name="menu-fade">
      <div v-if="settingsMenuOpen" class="settings-mask" @click="settingsMenuOpen = false">
        <div class="settings-menu" @click.stop>
          <div class="settings-menu-title">设置</div>
          <div class="settings-menu-item" @click="goTo('/setting/index')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
            <span>个人设置</span>
          </div>
          <div class="settings-menu-item" @click="goTo('/card/index')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            <span>我的名片</span>
          </div>
          <div class="settings-menu-item" @click="goTo('/message/index')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            <span>消息中心</span>
          </div>
          <div class="settings-menu-item" @click="goTo('/points/index')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            <span>我的积分</span>
          </div>
        </div>
      </div>
    </transition>

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
import { getCurrentUser, getMyCard, getMyActivities, getMyBusinesses, getDajiaConfig, getUnreadMessageCount } from '@/api'
import { useUserStore } from '@/store/user'
import { normalizeImageUrl } from '@/utils/image'

const router = useRouter()
const userStore = useUserStore()

const userInfo = ref<any>(userStore.userInfo || null)
const card = ref<any>({})
const loading = ref(false)
const activities = ref<any[]>([])
const avatarError = ref(false)
const dajiaMinVipLevel = ref(1)
const unreadCount = ref(0)
const settingsMenuOpen = ref(false)

function toggleSettingsMenu() {
  settingsMenuOpen.value = !settingsMenuOpen.value
}

function goTo(path: string) {
  settingsMenuOpen.value = false
  router.push(path)
}

async function loadUnreadCount() {
  try {
    const res: any = await getUnreadMessageCount()
    unreadCount.value = Number(res?.count) || 0
  } catch {
    unreadCount.value = 0
  }
}

const dajiaVipOk = computed(() => {
  const u = userInfo.value
  if (!u) return false
  if ((u.vipLevel || 0) < dajiaMinVipLevel.value) return false
  if (u.vipExpireAt && new Date(u.vipExpireAt).getTime() < Date.now()) return false
  return true
})

const displayName = computed(() => userInfo.value?.nickname || userInfo.value?.realName || '用户')
const displayAvatar = computed(() => normalizeImageUrl(card.value.avatarUrl || userInfo.value?.avatarUrl))
watch(displayAvatar, () => { avatarError.value = false })

const isAdmin = computed(() => {
  return userInfo.value?.role === 'admin' || userInfo.value?.adminLevel > 0
})

const memberId = computed(() => {
  const id = userInfo.value?.id
  if (!id) return '--------'
  return String(id).padStart(8, '0')
})

const avatarBg = computed(() => {
  const colors = ['#ede9fe', '#dbeafe', '#fef3c7', '#fce7f3', '#d1fae5']
  const c = displayName.value.charCodeAt(0)
  return colors[c % colors.length]
})

const statsList = computed(() => [
  { label: '我的活动', value: userInfo.value?.activityCount || 0, path: '/activity/my', icon: renderIcon('activity'), bg: '#ede9fe', color: '#7c3aed' },
  { label: '我的商机', value: userInfo.value?.businessCount || 0, path: '/business/my', icon: renderIcon('business'), bg: '#dbeafe', color: '#2563eb' },
  { label: '我的余额', value: (Number(userInfo.value?.balance) || 0).toFixed(2), path: '/balance/index', icon: renderIcon('balance'), bg: '#fef3c7', color: '#d97706' },
  { label: '优惠券', value: userInfo.value?.couponCount || 0, path: '/coupon/index', icon: renderIcon('coupon'), bg: '#fce7f3', color: '#db2777' },
])

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
    activity: h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
      h('rect', { x: '3', y: '4', width: '18', height: '18', rx: '2' }),
      h('path', { d: 'M16 2v4M8 2v4M3 10h18' }),
    ]),
    business: h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
      h('path', { d: 'M12 2L2 7l10 5 10-5-10-5z' }),
      h('path', { d: 'M2 17l10 5 10-5' }),
      h('path', { d: 'M2 12l10 5 10-5' }),
    ]),
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
    balance: h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
      h('rect', { x: '2', y: '5', width: '20', height: '14', rx: '2' }),
      h('line', { x1: '2', y1: '10', x2: '22', y2: '10' }),
      h('path', { d: 'M6 15h1' }),
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
  { label: '消息', icon: renderIcon('message'), bg: '#d1fae5', color: '#10b981', onClick: () => router.push('/message/index'), badge: true },
  { label: '订单', icon: renderIcon('order'), bg: '#ede9fe', color: '#6366f1', onClick: () => router.push('/order/list') },
  { label: '积分', icon: renderIcon('points'), bg: '#dbeafe', color: '#3b82f6', onClick: () => router.push('/points/index') },
  { label: '领券中心', icon: renderIcon('coupon'), bg: '#fef3c7', color: '#f59e0b', onClick: () => router.push('/coupon/claim') },
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
    const [userData, cardData] = await Promise.all([
      getCurrentUser().catch(() => null),
      getMyCard().catch(() => null),
    ])
    if (userData) {
      userInfo.value = userData
      userStore.setUserInfo(userData)
    }
    if (cardData) card.value = cardData
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
  loadUnreadCount()
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

/* Main Scroll */
.main-scroll {
  flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
  padding: 16px 16px 24px;
  position: relative;
  z-index: 1;
}

/* Member Card */
.member-card {
  position: relative;
  overflow: hidden;
  height: 200px;
  margin-bottom: 16px;
  padding: 22px 20px 18px;
  border-radius: 20px;
  background: linear-gradient(150deg, #f6f1ec 0%, #faf7f2 45%, #f3ece4 100%);
  box-shadow: 0 10px 30px rgba(90, 60, 30, 0.10), inset 0 1px 0 rgba(255,255,255,0.7);
  border: 1px solid rgba(212,175,122,0.22);
  display: flex; flex-direction: column; justify-content: space-between;
}
.mc-mesh {
  position: absolute; border-radius: 50%;
  filter: blur(1px);
}
.mc-mesh-1 {
  width: 220px; height: 220px; top: -90px; right: -60px;
  background: radial-gradient(circle, rgba(212,175,122,0.28) 0%, rgba(212,175,122,0) 70%);
}
.mc-mesh-2 {
  width: 160px; height: 160px; bottom: -70px; left: -50px;
  background: radial-gradient(circle, rgba(139,92,246,0.12) 0%, rgba(139,92,246,0) 70%);
}
.mc-glow {
  position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, transparent, #d4af7a, transparent);
  opacity: 0.8;
}
.mc-top {
  position: relative; z-index: 1;
  display: flex; align-items: center; gap: 14px;
}
.mc-avatar {
  width: 64px; height: 64px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; font-weight: 700; color: #8a6d3b;
  border: 2px solid rgba(212,175,122,0.6); overflow: hidden;
  background: #ede9fe; flex-shrink: 0;
}
.avatar-img { width: 100%; height: 100%; object-fit: cover; }
.mc-meta { flex: 1; min-width: 0; }
.mc-name { font-size: 21px; font-weight: 800; color: #2b2320; letter-spacing: -0.3px; margin-bottom: 8px; }
.mc-badges { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.mc-vip {
  font-size: 11px; font-weight: 700; color: #8a6d3b;
  padding: 3px 10px; border-radius: 99px;
  background: linear-gradient(135deg, #f0e2c8, #e7d3ac);
  border: 1px solid rgba(212,175,122,0.5);
}
.mc-tag {
  font-size: 11px; font-weight: 600; color: #6b7280;
  padding: 3px 10px; border-radius: 99px;
  background: rgba(255,255,255,0.6);
  border: 1px solid rgba(120,90,40,0.12);
}
.mc-top-right {
  display: flex; flex-direction: column; align-items: center;
  gap: 10px; flex-shrink: 0; align-self: flex-start;
}
.mc-menu-btn {
  width: 30px; height: 30px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #8a6d3b; cursor: pointer;
  background: rgba(255,255,255,0.6);
  border: 1px solid rgba(212,175,122,0.35);
  transition: all 0.2s ease;
}
.mc-menu-btn:active {
  background: rgba(212,175,122,0.25);
  transform: scale(0.92);
}
.mc-menu-btn svg { width: 16px; height: 16px; }
.mc-brand {
  font-size: 11px; font-weight: 700; letter-spacing: 2px;
  color: rgba(139,92,246,0.5); writing-mode: vertical-rl;
  text-transform: uppercase; display: flex; align-items: center;
}
.mc-divider {
  position: relative; z-index: 1;
  height: 1px; margin: 4px 0;
  background: linear-gradient(90deg, rgba(212,175,122,0.4), rgba(255,255,255,0));
}
.mc-bottom {
  position: relative; z-index: 1;
  display: flex; align-items: baseline; gap: 12px;
}
.mc-bottom-label { font-size: 12px; color: #8a6d3b; font-weight: 600; letter-spacing: 1px; }
.mc-id {
  font-family: 'Courier New', monospace;
  font-size: 18px; font-weight: 600; letter-spacing: 1px;
  color: #9ca3af;
}

/* Data Cards */
.data-card {
  margin-bottom: 16px;
  padding: 18px 6px;
  background: linear-gradient(160deg, #ffffff 0%, #faf7f2 100%);
  border-radius: 20px;
  border: 1px solid rgba(212,175,122,0.2);
  box-shadow: 0 6px 20px rgba(90, 60, 30, 0.06);
  display: flex;
  align-items: flex-start;
}
.data-item {
  flex: 1;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  cursor: pointer; transition: opacity 0.15s;
}
.data-item:active { opacity: 0.7; }
.data-icon {
  width: 40px; height: 40px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 2px;
}
.data-icon svg { width: 21px; height: 21px; }
.data-value { font-size: 20px; font-weight: 800; color: #2b2320; line-height: 1; }
.data-label { font-size: 12px; color: #8a8578; }

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
  position: relative;
  width: 48px; height: 48px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
}
.action-icon svg { width: 24px; height: 24px; }
.action-badge {
  position: absolute; top: -6px; right: -10px;
  min-width: 18px; height: 18px; padding: 0 5px;
  border-radius: 99px; box-sizing: border-box;
  background: #ef4444; color: #fff;
  font-size: 11px; font-weight: 700; line-height: 18px;
  text-align: center; white-space: nowrap;
  box-shadow: 0 0 0 2px #fff;
}
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

/* Settings Menu */
.settings-mask {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex; align-items: flex-start; justify-content: flex-end;
  z-index: 500;
}
.settings-menu {
  width: 200px;
  margin: 110px 16px 0 0;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0,0,0,0.18);
}
.settings-menu-title {
  font-size: 13px; font-weight: 600; color: #9ca3af;
  padding: 14px 16px 8px;
  border-bottom: 1px solid #f3f4f6;
}
.settings-menu-item {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px;
  font-size: 15px; color: #1e1b4b; font-weight: 500;
  cursor: pointer; transition: background 0.15s;
}
.settings-menu-item:active { background: #f5f5f7; }
.settings-menu-item svg { width: 20px; height: 20px; color: #6366f1; flex-shrink: 0; }
.menu-fade-enter-active, .menu-fade-leave-active { transition: opacity 0.2s ease; }
.menu-fade-enter-from, .menu-fade-leave-to { opacity: 0; }

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
