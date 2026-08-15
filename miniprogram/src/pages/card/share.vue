<template>
  <div :style="sbStyle" class="phone-frame share-page">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <div class="back-btn" @click="goBack">
          <image :src="iconBack" mode="aspectFit" />
        </div>
        <span class="header-title">转发名片</span>
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
            <div class="card-qr">
              <image v-if="qrcodeUrl" :src="qrcodeUrl" class="qr-img" mode="aspectFit" />
              <div v-else class="qr-placeholder">二维码</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 大尺寸二维码：长按识别 / 保存 -->
      <div class="qrcode-section" v-if="qrcodeUrl">
        <div class="qrcode-title">名片二维码</div>
        <image class="qrcode-img" :src="qrcodeUrl" mode="aspectFit" show-menu-by-longpress />
        <div class="qrcode-tip">长按识别二维码或保存图片</div>
      </div>

      <div class="share-tip">复制链接发给好友，或点击「分享给好友」微信转发</div>
    </div>

    <!-- Actions -->
    <div class="actions-bar">
      <button class="action-btn" @click="handleCopyLink">
        <image :src="iconLink" mode="aspectFit" />
        <span>复制链接</span>
      </button>
      <button class="action-btn primary" open-type="share">
        <image :src="iconShareWhite" mode="aspectFit" />
        <span>分享给好友</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { sbStyle } from '@/utils/sb'
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app'
import { getMyCard, getCardShare, getMyCardQrcode } from '@/api'
import { normalizeImageUrl } from '@/utils/image'
import { buildShareUrl, copyText } from '@/utils/share'
import { svgUri } from '@/utils/svg'

const route = useRoute()
const router = useRouter()
// 页面参数：onLoad(options) 由小程序运行时直接传入（setup/onMounted 时页面尚未入栈，
// getCurrentPages() 取不到参数，computed 无响应式依赖还会永久缓存空值）
const pageOptions = ref<Record<string, string>>({})
const cardId = computed(() => Number(pageOptions.value.id) || Number(route.params.id) || 0)
const loading = ref(true)
const cardData = ref<any>({})
// 二维码图片地址（后端生成，normalizeImageUrl 补全为绝对地址）
const qrcodeUrl = ref('')
// 名片所有者用户 ID：作为二维码/链接推荐人参数
const ownerId = ref<number | null>(null)

// 内联 svg 图标转 data URI（小程序不支持模板内联 svg 标签）
const iconBack = svgUri('<path d="M19 12H5M12 19l-7-7 7-7"/>', { color: '#1e1b4b' })
const iconLink = svgUri('<path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>', { color: '#6366f1' })
const iconShareWhite = svgUri('<path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>', { color: '#ffffff' })
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

const displayName = computed(() => cardData.value.realName || '姓名')
const displayPosition = computed(() => cardData.value.position || '职位')
const displayPhone = computed(() => cardData.value.phone || '')
const displayCompany = computed(() => cardData.value.company || '')

// 头像：规范化后端返回的 /uploads/xxx 路径为可访问地址
const displayAvatar = computed(() => normalizeImageUrl(cardData.value.avatarUrl))
// 头像重试机制：加载失败时带时间戳参数强制刷新，最多重试 3 次后回退占位图
const avatarError = ref(false)
const avatarRetry = ref(0)
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

/** H5 落地页链接（复制链接用）：指向具体名片页 /card/share/:ownerId，并携带 referrer 推荐人参数 */
const shareLink = computed(() =>
  buildShareUrl(ownerId.value ? `/card/share/${ownerId.value}` : '/card/share', ownerId.value)
)

/** 返回按钮兜底：经分享冷启动进入时历史栈为空，router.back() 无处可退 → 回首页 */
function goBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    router.back()
  } else {
    router.replace('/')
  }
}

async function loadCard() {
  loading.value = true
  try {
    const id = cardId.value || null
    if (id) {
      // 查看他人名片：从后端获取完整数据（优先使用后端生成的二维码）
      const res: any = await getCardShare(id)
      if (res) {
        cardData.value = {
          realName: res.realName || '',
          position: res.position || '',
          company: res.company || '',
          phone: res.phone || '',
          avatarUrl: res.avatarUrl || '',
        }
        ownerId.value = res.user?.id || null
        const qr = res.qrcodeUrl || res.qrcode || res.url || ''
        qrcodeUrl.value = qr ? normalizeImageUrl(qr) : ''
      }
    } else {
      // 查看自己的名片：名片数据 + 后端生成的二维码
      const cardRes: any = await getMyCard().catch(() => null)
      if (cardRes) {
        cardData.value = {
          realName: cardRes.realName || '',
          position: cardRes.position || '',
          company: cardRes.company || '',
          phone: cardRes.phone || '',
          avatarUrl: cardRes.avatarUrl || '',
        }
        ownerId.value = cardRes.user?.id || null
      }
      await loadMyQrcode()
    }
  } catch (err: any) {
    console.error('加载名片失败:', err)
  } finally {
    loading.value = false
  }
}

// 我的名片二维码（后端生成）
async function loadMyQrcode() {
  try {
    const res: any = await getMyCardQrcode()
    const url = res?.qrcodeUrl || res?.qrcode || res?.url || ''
    qrcodeUrl.value = url ? normalizeImageUrl(url) : ''
  } catch {
    qrcodeUrl.value = ''
  }
}

async function handleCopyLink() {
  const ok = await copyText(shareLink.value)
  showToast(ok ? '链接已复制' : '复制失败，请重试')
}

function showToast(msg: string) {
  uni.showToast({ title: msg, icon: 'none' })
}

// 微信转发：分享名片小程序页（接收者打开后查看对应名片）
onShareAppMessage(() => {
  const id = ownerId.value || (cardId.value || null)
  return {
    title: `${displayName.value} 的名片`,
    path: id ? `/pages/card/share?id=${id}` : '/pages/card/share',
  }
})

// 页面加载：onLoad 时机参数已就绪
onLoad((options: any) => {
  pageOptions.value = options || {}
  loadCard()
})
</script>

<style scoped>
.share-page { background: #f5f6fa; }

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

.card-qr {
  width: 72px; height: 72px; border-radius: 12px;
  background: #ffffff; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  overflow: hidden;
}
.qr-img { width: 100%; height: 100%; }
.qr-placeholder {
  font-size: 12px; color: #9ca3af;
}

.qrcode-section {
  margin-top: 20px; width: 100%; max-width: 375px;
  padding: 16px;
  background: #ffffff; border-radius: 16px;
  display: flex; flex-direction: column; align-items: center;
}
.qrcode-title { font-size: 14px; font-weight: 700; color: #1e1b4b; margin-bottom: 12px; }
.qrcode-img { width: 180px; height: 180px; border-radius: 8px; background: #fff; }
.qrcode-tip { margin-top: 10px; font-size: 12px; color: #6b7280; }

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
