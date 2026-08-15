<template>
  <div class="phone-frame card-page">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <div class="back-btn" @click="$router.push('/profile/index')">
          <image :src="iconBack" mode="aspectFit" />
        </div>
        <span class="header-title">我的名片</span>
      </div>
      <div class="header-right">
        <div class="header-icon" @click="$router.push('/card/edit')">
          <image :src="iconEdit" mode="aspectFit" />
        </div>
      </div>
    </div>

    <!-- Main Scroll -->
    <div class="main-scroll">
      <!-- Business Card -->
      <div class="card-section">
        <div class="business-card">
          <!-- Decorative geometric lines（svg 转 data URI 图片） -->
          <image class="card-decoration" :src="iconCardDecoration" mode="scaleToFill" />

          <div class="card-content">
            <!-- Top row: name/position + avatar -->
            <div class="card-top-row">
              <div class="card-text">
                <div class="card-name">{{ displayName }}</div>
                <div class="card-position">{{ displayPosition }}</div>
              </div>
              <div class="card-avatar-wrap">
                <image v-if="displayAvatar && !avatarError" :src="displayAvatar" class="card-avatar" mode="aspectFill" @error="avatarError = true" />
                <div v-else class="card-avatar-placeholder">{{ displayName.charAt(0) }}</div>
              </div>
            </div>

            <!-- Bottom row: phone/email/company -->
            <div class="card-bottom-row">
              <div class="card-contact">
                <div class="card-phone">{{ displayPhone }}</div>
                <div class="card-email">{{ displayEmail }}</div>
                <div class="card-company">{{ displayCompany }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Card Actions -->
        <div class="card-actions">
          <button class="card-action-btn primary" @click="$router.push('/card/share')">
            <image class="btn-icon" :src="iconShareWhite" mode="aspectFit" />
            转发名片
          </button>
          <button class="card-action-btn secondary" @click="$router.push('/card/edit')">
            <image class="btn-icon" :src="iconEditDark" mode="aspectFit" />
            编辑名片
          </button>
        </div>
      </div>

      <!-- My QR Code -->
      <div class="qrcode-section" v-if="qrcodeUrl">
        <div class="qrcode-title">我的名片二维码</div>
        <image class="qrcode-img" :src="qrcodeUrl" mode="aspectFit" show-menu-by-longpress />
        <div class="qrcode-tip">长按识别二维码或保存图片</div>
      </div>

      <!-- My Connections -->
      <div class="connections-section">
        <div class="connections-header">
          <div class="connections-title">我的人脉</div>
          <div class="connections-count">{{ connections.length }} 位</div>
        </div>
        <div class="connections-list" v-if="connections.length">
          <div class="connection-row" v-for="(conn, index) in connections" :key="index">
            <div class="connection-avatar" :style="{ background: getAvatarColor(conn.realName || conn.nickname || '人脉') }">
              <image v-if="connAvatarUrl(conn) && !avatarErrors.has(index)" :src="connAvatarUrl(conn)" class="avatar-img" mode="aspectFill" @error="onAvatarError(index)" />
              <span v-else>{{ (conn.realName || conn.nickname || '人脉').charAt(0) }}</span>
            </div>
            <div class="connection-info">
              <div class="connection-name">{{ conn.realName || conn.nickname || '人脉' }}</div>
              <div class="connection-title">{{ [conn.position, conn.company].filter(Boolean).join(' · ') || '行业人脉' }}</div>
            </div>
            <button class="connection-btn" @click="handleConnect(conn)">查看</button>
          </div>
        </div>
        <div class="empty-state" v-else>
          <image class="empty-state-icon" :src="iconFriends" mode="aspectFit" />
          <span>暂无人脉，快去大咖人脉拓展好友吧</span>
        </div>
        <button class="add-connection-btn" @click="handleAddConnection">
          <image class="add-icon" :src="iconPlusPrimary" mode="aspectFit" />
          增加人脉
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getMyCard, getCurrentUser, getMyConnections, getDajiaConfig, getMyCardQrcode } from '@/api'
import { useUserStore } from '@/store/user'
import { normalizeImageUrl } from '@/utils/image'
import { svgUri } from '@/utils/svg'

const router = useRouter()
const userStore = useUserStore()

const card = ref<any>({})
const userInfo = ref<any>(null)
const loading = ref(false)
const connections = ref<any[]>([])
const avatarError = ref(false)
const avatarErrors = ref<Set<number>>(new Set())
const dajiaMinVipLevel = ref(1)
// 我的名片二维码（后端生成，normalizeImageUrl 补全为绝对地址）
const qrcodeUrl = ref('')

// 内联 svg 图标转 data URI（小程序不支持模板内联 <svg>）
const iconBack = svgUri('<path d="M19 12H5M12 19l-7-7 7-7"/>', { color: '#1e1b4b' })
const iconEdit = svgUri('<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>', { color: '#6366f1' })
const iconEditDark = svgUri('<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>', { color: '#374151' })
const iconShareWhite = svgUri('<path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>', { color: '#ffffff' })
const iconFriends = svgUri(
  '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>',
  { color: '#9ca3af', strokeWidth: '1.5' }
)
const iconPlusPrimary = svgUri('<path d="M12 5v14M5 12h14"/>', { color: '#6366f1' })
// 名片装饰性几何线条（原内联 svg 整体转 data URI）
const iconCardDecoration = svgUri(
  '<path d="M0 180 L120 180 L140 200 L220 200 L240 180 L375 180" stroke="#e5e7eb" stroke-width="1"/>' +
  '<path d="M0 200 L100 200 L120 220 L260 220 L280 200 L375 200" stroke="#e5e7eb" stroke-width="1"/>' +
  '<path d="M0 220 L80 220 L100 240 L280 240 L300 220 L375 220" stroke="#e5e7eb" stroke-width="1"/>' +
  '<path d="M160 0 L160 80 L200 120 L200 240" stroke="#e5e7eb" stroke-width="1"/>' +
  '<path d="M180 0 L180 70 L220 110 L220 240" stroke="#e5e7eb" stroke-width="1"/>' +
  '<path d="M200 0 L200 60 L240 100 L240 240" stroke="#e5e7eb" stroke-width="1"/>' +
  '<path d="M260 0 L260 40 L320 40 L320 240" stroke="#e5e7eb" stroke-width="1"/>' +
  '<path d="M280 0 L280 30 L340 30 L340 240" stroke="#e5e7eb" stroke-width="1"/>' +
  '<circle cx="320" cy="50" r="60" stroke="#f3e8ff" stroke-width="1" fill="none"/>' +
  '<circle cx="320" cy="50" r="80" stroke="#f3e8ff" stroke-width="1" fill="none"/>',
  { color: 'none', fill: 'none', viewBox: '0 0 375 240' }
)

const dajiaVipOk = computed(() => {
  const u = userInfo.value
  if (!u) return false
  if ((u.vipLevel || 0) < dajiaMinVipLevel.value) return false
  if (u.vipExpireAt && new Date(u.vipExpireAt).getTime() < Date.now()) return false
  return true
})

const displayName = computed(() => card.value.realName || userInfo.value?.nickname || userInfo.value?.realName || '姓名')
const displayPosition = computed(() => card.value.position || '职位')
const displayPhone = computed(() => card.value.phone || userInfo.value?.phone || '')
const displayEmail = computed(() => card.value.email || '')
const displayCompany = computed(() => card.value.company || '')
const displayAvatar = computed(() => normalizeImageUrl(card.value.avatarUrl || userInfo.value?.avatarUrl))
watch(displayAvatar, () => { avatarError.value = false })

function getAvatarColor(name: string) {
  const colors = ['#ede9fe', '#dbeafe', '#fef3c7', '#fce7f3', '#d1fae5']
  const index = name.charCodeAt(0) % colors.length
  return colors[index]
}

function handleConnect(conn: any) {
  if (!conn.userId) {
    showToast('暂无可查看的名片')
    return
  }
  router.push(`/card/friend/${conn.userId}`)
}

function onAvatarError(index: number) {
  avatarErrors.value = new Set(avatarErrors.value).add(index)
}

async function loadData() {
  loading.value = true
  try {
    const [cardData, userData] = await Promise.all([
      getMyCard().catch(() => null),
      getCurrentUser().catch(() => null),
    ])
    if (cardData) card.value = cardData
    if (userData) {
      userInfo.value = userData
      userStore.setUserInfo(userData)
    }
    await loadConnections()
  } catch (err: any) {
    console.error('加载数据失败:', err)
  } finally {
    loading.value = false
  }
}

// 加载我的名片二维码（后端生成）
async function loadQrcode() {
  try {
    const res: any = await getMyCardQrcode()
    const url = res?.qrcodeUrl || res?.qrcode || res?.url || ''
    qrcodeUrl.value = url ? normalizeImageUrl(url) : ''
  } catch {
    qrcodeUrl.value = ''
  }
}

async function loadConnections() {
  try {
    const res: any = await getMyConnections()
    connections.value = Array.isArray(res) ? res : res?.list || []
  } catch {
    connections.value = []
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

function connAvatarUrl(conn: any) {
  return conn.avatarUrl ? normalizeImageUrl(conn.avatarUrl) : ''
}

function handleAddConnection() {
  if (dajiaVipOk.value) {
    router.push('/dajia/index')
  } else {
    showToast(`增加人脉为 VIP${dajiaMinVipLevel.value} 及以上会员专属，请先开通`)
  }
}

function showToast(msg: string) {
  uni.showToast({ title: msg, icon: 'none' })
}

onMounted(() => {
  loadData()
  loadDajiaConfig()
  loadQrcode()
})
</script>

<style scoped>
.card-page { background: #ffffff; }

/* Main */
.main-scroll { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; padding: 24px 16px 40px; }

/* Card Section */
.card-section { margin-bottom: 24px; }

.business-card {
  position: relative;
  background: #ffffff;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0,0,0,0.08);
  aspect-ratio: 375 / 240;
}

.card-decoration {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  opacity: 0.7;
}

.card-content {
  position: relative; z-index: 1;
  height: 100%;
  padding: 28px 24px 24px;
  display: flex; flex-direction: column; justify-content: space-between;
}

.card-top-row {
  display: flex; justify-content: space-between; align-items: flex-start;
}

.card-text { flex: 1; min-width: 0; padding-right: 16px; }
.card-name {
  font-size: 28px; font-weight: 800; color: #111827;
  line-height: 1.2; margin-bottom: 8px;
}
.card-position {
  font-size: 14px; color: #6b7280; font-weight: 500;
}

.card-avatar-wrap {
  width: 84px; height: 84px; border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
}
.card-avatar {
  width: 100%; height: 100%; border-radius: 50%;
  display: block;
  background: #ffffff;
}
.card-avatar-placeholder {
  width: 100%; height: 100%; border-radius: 50%;
  background: #ffffff;
  display: flex; align-items: center; justify-content: center;
  font-size: 32px; font-weight: 700; color: #a855f7;
}

.card-bottom-row {
  display: flex; justify-content: space-between; align-items: flex-end;
}

.card-contact { flex: 1; min-width: 0; }
.card-phone {
  font-size: 22px; font-weight: 700; color: #111827;
  letter-spacing: 1px; margin-bottom: 4px;
}
.card-email {
  font-size: 13px; color: #4b5563; font-weight: 500;
  margin-bottom: 6px; word-break: break-all;
}
.card-company {
  font-size: 14px; color: #6b7280; font-weight: 500;
}

/* Card Actions */
.card-actions {
  display: flex; gap: 12px; margin-top: 20px;
}
.card-action-btn {
  flex: 1; padding: 14px 0; border-radius: 12px; font-size: 15px; font-weight: 600;
  display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; border: none;
  transition: transform 0.15s, opacity 0.15s;
  margin: 0;
}
.card-action-btn::after { border: none; }
.card-action-btn:active { transform: scale(0.97); }
.card-action-btn .btn-icon { width: 18px; height: 18px; }
.card-action-btn.primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; }
.card-action-btn.secondary { background: #f3f4f6; color: #374151; }

/* QR Code */
.qrcode-section {
  margin-bottom: 24px; padding: 16px;
  background: #f9fafb; border-radius: 16px;
  display: flex; flex-direction: column; align-items: center;
}
.qrcode-title { font-size: 14px; font-weight: 700; color: #1e1b4b; margin-bottom: 12px; }
.qrcode-img { width: 180px; height: 180px; border-radius: 8px; background: #fff; }
.qrcode-tip { margin-top: 10px; font-size: 12px; color: #6b7280; }

/* Connections */
.connections-section {
  background: #f9fafb; border-radius: 16px;
  padding: 16px;
}
.connections-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.connections-title { font-size: 16px; font-weight: 700; color: #1e1b4b; }
.connections-count { font-size: 12px; color: #6366f1; font-weight: 500; }
.connections-list { display: flex; flex-direction: column; gap: 12px; }
.connection-row { display: flex; align-items: center; gap: 12px; }
.connection-avatar { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; color: #6366f1; flex-shrink: 0; overflow: hidden; }
.connection-info { flex: 1; }
.connection-name { font-size: 14px; font-weight: 600; color: #1e1b4b; margin-bottom: 2px; }
.connection-title { font-size: 12px; color: #6b7280; }
.connection-btn { padding: 5px 14px; border-radius: 99px; border: 1px solid rgba(99,102,241,0.3); background: transparent; color: #6366f1; font-size: 12px; font-weight: 500; cursor: pointer; margin: 0; line-height: 1.6; }
.connection-btn::after { border: none; }
.connection-btn:active { background: rgba(99,102,241,0.08); }
.connection-avatar .avatar-img { width: 100%; height: 100%; }

.add-connection-btn {
  width: 100%; margin-top: 16px;
  padding: 12px 0; border-radius: 12px;
  border: 1px dashed rgba(99,102,241,0.4); background: #fff;
  color: #6366f1; font-size: 14px; font-weight: 600;
  display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.add-connection-btn::after { border: none; }
.add-connection-btn:active { background: rgba(99,102,241,0.06); border-color: #6366f1; }
.add-connection-btn .add-icon { width: 16px; height: 16px; }

.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px; color: #9ca3af; }
.empty-state .empty-state-icon { width: 40px; height: 40px; margin-bottom: 8px; }
.empty-state text { font-size: 13px; text-align: center; }
</style>
