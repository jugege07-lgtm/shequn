<template>
  <view class="phone-frame profile-page">
    <!-- Decorative background elements -->
    <view class="profile-decorations">
      <view class="deco-spot spot-1"></view>
      <view class="deco-spot spot-2"></view>
      <view class="deco-spot spot-3"></view>
      <view class="deco-line"></view>
    </view>

    <!-- Main Scroll -->
    <view class="main-scroll">
      <!-- Member Card -->
      <view class="member-card">
        <!-- 与首页 banner 一致的漂浮白色圆点 -->
        <view class="mc-shapes">
          <view class="mc-shape s1"></view>
          <view class="mc-shape s2"></view>
          <view class="mc-shape s3"></view>
        </view>

        <view class="mc-top">
          <view class="mc-avatar" :style="{ background: avatarBg }">
            <image v-if="displayAvatar && !avatarError" :src="displayAvatar" class="avatar-img" mode="aspectFill" @error="avatarError = true" />
            <text v-else>{{ displayName.charAt(0) }}</text>
          </view>
          <view class="mc-meta">
            <view class="mc-name">{{ displayName }}</view>
            <view class="mc-badges">
              <text class="mc-vip" v-if="userInfo?.vipLevel">👑 VIP{{ userInfo.vipLevel }}</text>
              <text class="mc-tag">社群成员</text>
            </view>
          </view>
          <view class="mc-top-right">
            <view class="mc-menu-btn" @click="toggleSettingsMenu">
              <image :src="iconMore" mode="aspectFit" />
            </view>
            <view class="mc-brand">聚格社群</view>
          </view>
        </view>

        <!-- 底部渐变遮罩——呼应首页 banner-overlay -->
        <view class="mc-overlay">
          <view class="mc-bottom">
            <view class="mc-bottom-label">会员ID</view>
            <view class="mc-id">{{ memberId }}</view>
          </view>
        </view>
      </view>

      <!-- Data Cards -->
      <view class="data-card">
        <view class="data-item" v-for="s in statsList" :key="s.label" @click="s.path && $router.push(s.path)">
          <view class="data-icon" :style="{ background: s.bg }">
            <image class="data-icon-img" :src="s.icon" mode="aspectFit" />
          </view>
          <view class="data-value">{{ s.value }}</view>
          <view class="data-label">{{ s.label }}</view>
        </view>
      </view>

      <!-- VIP Banner（从首页交换至个人中心） -->
      <view class="vip-banner" @click="$router.push('/vip/index')">
        <view class="vip-banner-left">
          <text class="vip-crown">👑</text>
          <view class="vip-banner-text">
            <text class="vip-banner-title">开通 VIP 会员</text>
            <text class="vip-banner-desc">解锁专属权益 · 享受更多折扣</text>
          </view>
        </view>
        <text class="vip-open-btn">立即开通</text>
      </view>

      <!-- Quick Actions -->
      <view class="section-card">
        <view class="section-title">快捷操作</view>
        <view class="actions-grid">
          <view
            class="action-item"
            :class="{ disabled: action.disabled }"
            v-for="action in quickActions"
            :key="action.label"
            @click="action.disabled ? showNoPermission(action.disabledTip) : action.onClick()"
          >
            <view class="action-icon" :style="{ background: action.bg, opacity: action.disabled ? 0.5 : 1 }">
              <image class="action-icon-img" :src="action.icon" mode="aspectFit" />
              <text v-if="action.badge && unreadCount > 0" class="action-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</text>
            </view>
            <view class="action-label" :class="{ disabled: action.disabled }">{{ action.label }}</view>
          </view>
        </view>
      </view>

      <!-- Browse History -->
      <view class="section-card">
        <view class="section-header-row">
          <view class="section-title">浏览历史</view>
          <view class="section-more" @click="$router.push('/history/index')">查看更多</view>
        </view>
        <view class="activities-list" v-if="browseHistory.length">
          <view class="activity-item" v-for="(item) in browseHistory" :key="item.type + '-' + item.id" @click="handleHistoryClick(item)">
            <view class="activity-dot" :class="item.type"></view>
            <view class="activity-content">
              <view class="activity-title">{{ item.title }}</view>
              <view class="activity-desc">{{ typeName(item.type) }}</view>
            </view>
            <view class="activity-time">{{ formatHistoryTime(item.time) }}</view>
          </view>
        </view>
        <view class="empty-state" v-else>
          <image class="empty-state-icon" :src="iconHistoryEmpty" mode="aspectFit" />
          <text>暂无浏览记录</text>
        </view>
      </view>

    </view>

    <!-- Settings Menu -->
    <view v-if="settingsMenuOpen" class="settings-mask" @click="settingsMenuOpen = false">
      <view class="settings-menu" @click.stop>
        <view class="settings-menu-title">设置</view>
        <view class="settings-menu-item" @click="goTo('/setting/index')">
          <image class="settings-menu-icon" :src="iconMenuSetting" mode="aspectFit" />
          <text>个人设置</text>
        </view>
        <view class="settings-menu-item" @click="goTo('/card/index')">
          <image class="settings-menu-icon" :src="iconMenuCard" mode="aspectFit" />
          <text>我的名片</text>
        </view>
        <view class="settings-menu-item" @click="goTo('/message/index')">
          <image class="settings-menu-icon" :src="iconMenuMessage" mode="aspectFit" />
          <text>消息中心</text>
        </view>
        <view class="settings-menu-item" @click="goTo('/points/index')">
          <image class="settings-menu-icon" :src="iconMenuPoints" mode="aspectFit" />
          <text>我的积分</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { onShow } from '@dcloudio/uni-app'
import { getCurrentUser, getMyCard, getUnreadMessageCount } from '@/api'
import { useUserStore } from '@/store/user'
import { normalizeImageUrl } from '@/utils/image'
import { getBrowseHistory, type BrowseRecord } from '@/utils/browseHistory'
import { svgUri } from '@/utils/svg'

const router = useRouter()
const userStore = useUserStore()

const userInfo = ref<any>(userStore.userInfo || null)
const card = ref<any>({})
const loading = ref(false)
const browseHistory = ref<BrowseRecord[]>([])
const avatarError = ref(false)
const unreadCount = ref(0)
const settingsMenuOpen = ref(false)

// ===== 小图标（内联 svg → data URI） =====
const iconMore = svgUri(
  '<circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>',
  { fill: '#ffffff', color: 'none' }
)
const iconHistoryEmpty = svgUri('<path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/>', { color: '#9ca3af', strokeWidth: '1.5' })
const iconMenuSetting = svgUri(
  '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>',
  { color: '#6366f1' }
)
const iconMenuCard = svgUri(
  '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>',
  { color: '#6366f1' }
)
const iconMenuMessage = svgUri('<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>', { color: '#6366f1' })
const iconMenuPoints = svgUri('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>', { color: '#6366f1' })

// 渲染函数图标 → data URI（小程序不支持运行时 h('svg')）
const ICON_PATHS: Record<string, string> = {
  activity: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  business: '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>',
  invite: '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  message: '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>',
  order: '<path d="M4 2h16l-2 12H6L4 2zm0 0l-1 6M6 20a2 2 0 100 4 2 2 0 000-4zm12 0a2 2 0 100 4 2 2 0 000-4z"/>',
  points: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  balance: '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><path d="M6 15h1"/>',
  coupon: '<path d="M20 12V8H6a2 2 0 01-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 100-4 2 2 0 000 4z"/>',
}
function renderIcon(name: string, color: string): string {
  return svgUri(ICON_PATHS[name] || '', { color })
}

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
  { label: '我的活动', value: userInfo.value?.activityCount || 0, path: '/activity/my', icon: renderIcon('activity', '#7c3aed'), bg: '#ede9fe' },
  { label: '我的商机', value: userInfo.value?.businessCount || 0, path: '/business/my', icon: renderIcon('business', '#2563eb'), bg: '#dbeafe' },
  { label: '我的余额', value: '¥' + (Number(userInfo.value?.balance) || 0).toFixed(2), path: '/balance/index', icon: renderIcon('balance', '#d97706'), bg: '#fef3c7' },
  { label: '积分', value: userInfo.value?.points || 0, path: '/points/index', icon: renderIcon('points', '#3b82f6'), bg: '#dbeafe' },
])

const quickActions = computed(() => [
  { label: '我的名片', icon: renderIcon('card', '#6366f1'), bg: '#ede9fe', onClick: () => router.push('/card/index') },
  { label: '发布商机', icon: renderIcon('business', '#3b82f6'), bg: '#dbeafe', onClick: () => router.push('/business/publish') },
  { label: '创建活动', icon: renderIcon('activity', '#f59e0b'), bg: '#fef3c7', onClick: () => router.push('/activity/publish'), disabled: !isAdmin.value, disabledTip: '请联系管理员获取创建权限' },
  { label: '邀请好友', icon: renderIcon('invite', '#db2777'), bg: '#fce7f3', onClick: () => router.push('/card/share') },
  { label: '消息', icon: renderIcon('message', '#10b981'), bg: '#d1fae5', onClick: () => router.push('/message/index'), badge: true },
  { label: '订单', icon: renderIcon('order', '#6366f1'), bg: '#ede9fe', onClick: () => router.push('/order/list') },
  { label: '优惠券', icon: renderIcon('coupon', '#db2777'), bg: '#fce7f3', onClick: () => router.push('/coupon/index') },
  { label: '领券中心', icon: renderIcon('coupon', '#f59e0b'), bg: '#fef3c7', onClick: () => router.push('/coupon/claim') },
])

function showNoPermission(tip?: string) {
  uni.showToast({ title: tip || '暂无权限，请联系管理员', icon: 'none' })
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

// 读取浏览历史（默认展示最近 5 条）
const TYPE_NAMES: Record<string, string> = {
  activity: '活动',
  business: '商机',
  product: '商品',
}

function typeName(type: string) {
  return TYPE_NAMES[type] || '内容'
}

async function loadBrowseHistory() {
  browseHistory.value = getBrowseHistory(5)
}

function formatHistoryTime(time: number) {
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
  return date.toLocaleDateString()
}

function handleHistoryClick(item: BrowseRecord) {
  if (item.type === 'activity') router.push(`/activity/detail/${item.id}`)
  else if (item.type === 'business') router.push(`/business/detail/${item.id}`)
  else router.push(`/mall/detail/${item.id}`)
}

// tabBar 页：onShow 时刷新数据（小程序切换 tab 不会重新挂载）
onShow(() => {
  loadUser()
  loadBrowseHistory()
  loadUnreadCount()
})
</script>

<style scoped>

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
  padding: calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) + 16px) 16px 24px;
  position: relative;
  z-index: 1;
}

/* Member Card — 上部分与首页 banner 呼应，右下角过渡到香槟金 */
.member-card {
  position: relative;
  overflow: hidden;
  height: 200px;
  margin-bottom: 16px;
  padding: 22px 20px 16px;
  border-radius: 20px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 32%, #a78bfa 52%, #e8e4f6 78%, #ffffff 100%);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.18);
  border: 1px solid rgba(255,255,255,0.25);
  display: flex; flex-direction: column; justify-content: space-between;
}
/* 与首页 banner 一致的漂浮白色圆点 */
.mc-shapes { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
.mc-shape { position: absolute; border-radius: 50%; background: #fff; }
.mc-shape.s1 { width: 200px; height: 200px; top: -60px; right: -40px; opacity: 0.15; }
.mc-shape.s2 { width: 140px; height: 140px; bottom: -30px; left: -20px; opacity: 0.15; }
.mc-shape.s3 { width: 80px; height: 80px; top: 44px; left: 92px; opacity: 0.15; }
.mc-top {
  position: relative; z-index: 1;
  display: flex; align-items: center; gap: 14px;
}
.mc-avatar {
  width: 64px; height: 64px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; font-weight: 700; color: #7c3aed;
  border: 2px solid rgba(255,255,255,0.6); overflow: hidden;
  background: #ffffff; flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
}
.avatar-img { width: 100%; height: 100%; }
.mc-meta { flex: 1; min-width: 0; }
.mc-name { font-size: 21px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px; margin-bottom: 8px; }
.mc-badges { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.mc-vip {
  font-size: 11px; font-weight: 700; color: #4f46e5;
  padding: 3px 10px; border-radius: 99px;
  background: #ffffff;
  border: 1px solid rgba(255,255,255,0.7);
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.2);
}
.mc-tag {
  font-size: 11px; font-weight: 600; color: #ffffff;
  padding: 3px 10px; border-radius: 99px;
  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(255,255,255,0.3);
}
.mc-top-right {
  display: flex; flex-direction: column; align-items: center;
  gap: 10px; flex-shrink: 0; align-self: flex-start;
}
.mc-menu-btn {
  width: 30px; height: 30px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #ffffff;
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.3);
  transition: all 0.2s ease;
}
.mc-menu-btn:active {
  background: rgba(255,255,255,0.35);
  transform: scale(0.92);
}
.mc-menu-btn image { width: 16px; height: 16px; }
.mc-brand {
  font-size: 11px; font-weight: 700; letter-spacing: 2px;
  color: rgba(255,255,255,0.75); writing-mode: vertical-rl;
  text-transform: uppercase; display: flex; align-items: center;
}
/* 底部渐变遮罩——呼应首页 banner-overlay（弱化，贴合白色右下角） */
.mc-overlay {
  position: absolute; left: 0; right: 0; bottom: 0;
  padding: 30px 20px 16px;
  border-radius: 0 0 20px 20px;
  background: linear-gradient(to top, rgba(99,102,241,0.1) 0%, transparent 100%);
}
.mc-bottom {
  position: relative; z-index: 1;
  display: flex; align-items: baseline; gap: 12px;
}
.mc-bottom-label { font-size: 12px; color: rgba(79,70,229,0.75); font-weight: 600; letter-spacing: 1px; }
.mc-id {
  font-family: 'Courier New', monospace;
  font-size: 18px; font-weight: 600; letter-spacing: 1px;
  color: #4338ca;
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
  transition: opacity 0.15s;
}
.data-item:active { opacity: 0.7; }
.data-icon {
  width: 40px; height: 40px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 2px;
}
.data-icon-img { width: 21px; height: 21px; }
.data-value { font-size: 20px; font-weight: 800; color: #2b2320; line-height: 1; }
.data-label { font-size: 12px; color: #8a8578; }

/* VIP Banner（从首页交换至个人中心） */
.vip-banner {
  margin-bottom: 16px; padding: 14px 16px;
  border-radius: 18px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: #fff;
  display: flex; align-items: center; justify-content: space-between;
  box-shadow: 0 8px 24px rgba(79, 70, 229, 0.25);
  transition: transform 0.15s ease;
}
.vip-banner:active { transform: scale(0.98); }
.vip-banner-left { display: flex; align-items: center; gap: 10px; }
.vip-crown { font-size: 28px; }
.vip-banner-text { display: flex; flex-direction: column; gap: 2px; }
.vip-banner-title { font-size: 15px; font-weight: 700; }
.vip-banner-desc { font-size: 12px; opacity: 0.8; }
.vip-open-btn {
  font-size: 12px; font-weight: 600; color: #4f46e5;
  background: #fff; padding: 5px 14px; border-radius: 99px;
}

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
.section-more { font-size: 13px; color: #6366f1; font-weight: 500; }

/* Actions Grid */
.actions-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px 10px; }
.action-item { display: flex; flex-direction: column; align-items: center; gap: 8px; transition: transform 0.15s; }
.action-item:active { transform: scale(0.95); }
.action-icon {
  position: relative;
  width: 48px; height: 48px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
}
.action-icon-img { width: 24px; height: 24px; }
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
.activity-item { display: flex; align-items: center; gap: 12px; }
.activity-dot {
  width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
  background: #9ca3af;
}
.activity-dot.activity { background: #3b82f6; }
.activity-dot.business { background: #6366f1; }
.activity-dot.product { background: #10b981; }
.activity-content { flex: 1; }
.activity-title { font-size: 14px; font-weight: 600; color: #1e1b4b; margin-bottom: 2px; }
.activity-desc { font-size: 12px; color: #6b7280; }
.activity-time { font-size: 11px; color: #9ca3af; flex-shrink: 0; }

/* Empty State */
.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 32px; color: #9ca3af;
}
.empty-state-icon { width: 40px; height: 40px; margin-bottom: 8px; }
.empty-state text { font-size: 13px; }

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
  transition: background 0.15s;
}
.settings-menu-item:active { background: #f5f5f7; }
.settings-menu-icon { width: 20px; height: 20px; flex-shrink: 0; }
</style>
