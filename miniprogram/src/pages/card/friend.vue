<template>
  <div :style="sbStyle" class="phone-frame friend-page">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <div class="back-btn" @click="$router.back()">
          <image :src="iconBack" mode="aspectFit" />
        </div>
        <span class="header-title">好友名片</span>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-tip">加载中...</div>

    <!-- Card Preview -->
    <div v-else class="preview-area">
      <div class="business-card">
        <!-- 装饰性几何线条（svg 转 data URI 图片） -->
        <image class="card-decoration" :src="iconCardDecoration" mode="scaleToFill" />

        <div class="card-content">
          <div class="card-top-row">
            <div class="card-text">
              <div class="card-name">{{ displayName }}</div>
              <div class="card-position">{{ displayPosition }}</div>
            </div>
            <div class="card-avatar-wrap">
              <image v-if="displayAvatarSrc && !avatarError" :src="displayAvatarSrc" class="card-avatar" mode="aspectFill" @error="onAvatarError" />
              <div v-else class="card-avatar-placeholder">{{ displayName.charAt(0) }}</div>
            </div>
          </div>

          <div class="card-bottom-row">
            <div class="card-contact">
              <div class="card-phone">{{ displayPhone }}</div>
              <div class="card-company">{{ displayCompany }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="share-tip">点击按钮拨打电话或复制名片信息</div>
    </div>

    <!-- Actions -->
    <div class="actions-bar">
      <button class="action-btn" @click="handleCallPhone">
        <image :src="iconPhone" mode="aspectFit" />
        <span>拨打电话</span>
      </button>
      <button class="action-btn primary" @click="handleCopyContact">
        <image :src="iconUserPlusWhite" mode="aspectFit" />
        <span>复制名片信息</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { sbStyle } from '@/utils/sb'
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { onLoad } from '@dcloudio/uni-app'
import { getFriendCard } from '@/api'
import { normalizeImageUrl } from '@/utils/image'
import { copyText } from '@/utils/share'
import { svgUri } from '@/utils/svg'

const route = useRoute()
// 页面参数：onLoad(options) 由小程序运行时直接传入（setup/onMounted 时页面尚未入栈，
// getCurrentPages() 取不到参数，computed 无响应式依赖还会永久缓存空值）
const pageOptions = ref<Record<string, string>>({})
const friendUserId = computed(() => Number(pageOptions.value.userId) || Number(route.params.userId) || 0)
const loading = ref(true)
const cardData = ref<any>({})
const avatarError = ref(false)
const avatarRetry = ref(0)

// 内联 svg 图标转 data URI（小程序不支持模板内联 svg 标签）
const iconBack = svgUri('<path d="M19 12H5M12 19l-7-7 7-7"/>', { color: '#1e1b4b' })
const iconPhone = svgUri('<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>', { color: '#6366f1' })
const iconUserPlusWhite = svgUri('<path d="M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/>', { color: '#ffffff' })
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

const displayName = computed(() => cardData.value.realName || cardData.value.nickname || '好友')
const displayPosition = computed(() => cardData.value.position || '')
const displayPhone = computed(() => cardData.value.phone || '')
const displayCompany = computed(() => cardData.value.company || '')

// 头像：规范化后端返回的 /uploads/xxx 路径为可访问地址
const displayAvatar = computed(() => normalizeImageUrl(cardData.value.avatarUrl))
// 头像重试机制：加载失败时带时间戳参数强制刷新，最多重试 3 次后回退占位图
const displayAvatarSrc = computed(() => {
  if (!displayAvatar.value) return ''
  if (avatarRetry.value > 0) {
    const t = Date.now() + avatarRetry.value * 1000
    return displayAvatar.value + (displayAvatar.value.includes('?') ? '&' : '?') + 'retry=' + t
  }
  return displayAvatar.value
})
function onAvatarError() {
  if (avatarRetry.value < 3) {
    avatarRetry.value++
  } else {
    avatarError.value = true
  }
}

async function loadCard() {
  loading.value = true
  try {
    const userId = friendUserId.value
    if (!userId) throw new Error('缺少好友ID')
    const res: any = await getFriendCard(userId)
    cardData.value = res || {}
  } catch (err: any) {
    console.error('加载好友名片失败:', err)
  } finally {
    loading.value = false
  }
}

/** 拨打电话（替代 H5 的 tel: 外链） */
function handleCallPhone() {
  const phone = displayPhone.value
  if (!phone) {
    showToast('暂无联系电话')
    return
  }
  uni.makePhoneCall({
    phoneNumber: phone,
    fail: () => { /* 用户取消拨号 */ },
  })
}

/** 复制名片文本信息（替代 H5 的 vCard 文件下载，便于粘贴到通讯录） */
async function handleCopyContact() {
  const name = displayName.value || ''
  const phone = displayPhone.value || ''
  const company = displayCompany.value || ''
  const position = displayPosition.value || ''
  const email = cardData.value.email || ''

  if (!name && !phone) {
    showToast('暂无可保存的联系信息')
    return
  }

  const lines = [
    `姓名：${name}`,
    position ? `职位：${position}` : '',
    company ? `公司：${company}` : '',
    phone ? `电话：${phone}` : '',
    email ? `邮箱：${email}` : '',
  ].filter(Boolean)

  const ok = await copyText(lines.join('\n'))
  showToast(ok ? '名片信息已复制' : '复制失败，请重试')
}

function showToast(msg: string) {
  uni.showToast({ title: msg, icon: 'none' })
}

// 页面加载：onLoad 时机参数已就绪
onLoad((options: any) => {
  pageOptions.value = options || {}
  loadCard()
})
</script>

<style scoped>
.friend-page { background: #f5f6fa; }

.header {
  position: sticky; top: var(--sbh, 0px); z-index: 100;
  background: #ffffff;
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-bottom: 0.5px solid rgba(60,60,67,0.1);
  padding: 10px 16px;
  display: flex; align-items: center; justify-content: space-between;
}
.header-left { display: flex; align-items: center; gap: 12px; }
.back-btn {
  width: 32px; height: 32px; border-radius: 50%;
  background: rgba(0,0,0,0.05); display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background 0.2s ease;
}
.back-btn:active { background: rgba(0,0,0,0.1); }
.back-btn image { width: 20px; height: 20px; }
.header-title { font-size: 18px; font-weight: 700; color: #1e1b4b; }

.loading-tip { text-align: center; padding: 60px 0; color: #999; font-size: 14px; }

.preview-area {
  flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
  padding: 24px 16px 100px;
  display: flex; flex-direction: column; align-items: center;
}

.business-card {
  position: relative;
  width: 100%; max-width: 375px;
  background: #ffffff;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0,0,0,0.1);
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
  background: linear-gradient(135deg, #c084fc 0%, #a855f7 100%);
  padding: 4px; flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(168,85,247,0.25);
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
  letter-spacing: 1px; margin-bottom: 6px;
}
.card-company {
  font-size: 14px; color: #6b7280; font-weight: 500;
}

.share-tip {
  margin-top: 16px;
  font-size: 13px; color: #9ca3af;
}

.actions-bar {
  position: fixed; bottom: 0; left: 0; right: 0;
  max-width: 430px; margin: 0 auto;
  display: flex; gap: 12px; padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px));
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-top: 0.5px solid rgba(60,60,67,0.1);
  z-index: 100;
}
.action-btn {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 14px; border-radius: 12px;
  border: 1px solid rgba(99,102,241,0.3); background: #fff;
  color: #6366f1; font-size: 15px; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
}
.action-btn::after { border: none; }
.action-btn:active { transform: scale(0.97); }
.action-btn.primary {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; border-color: transparent;
}
.action-btn image { width: 18px; height: 18px; }
</style>
