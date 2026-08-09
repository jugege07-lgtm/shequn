<template>
  <div class="phone-frame share-page">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <div class="back-btn" @click="$router.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </div>
        <span class="header-title">转发名片</span>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-tip">加载中...</div>

    <!-- Card Preview -->
    <div v-else class="preview-area">
      <div class="business-card">
        <svg class="card-decoration" viewBox="0 0 375 240" preserveAspectRatio="none" fill="none">
          <path d="M0 180 L120 180 L140 200 L220 200 L240 180 L375 180" stroke="#e5e7eb" stroke-width="1"/>
          <path d="M0 200 L100 200 L120 220 L260 220 L280 200 L375 200" stroke="#e5e7eb" stroke-width="1"/>
          <path d="M0 220 L80 220 L100 240 L280 240 L300 220 L375 220" stroke="#e5e7eb" stroke-width="1"/>
          <path d="M160 0 L160 80 L200 120 L200 240" stroke="#e5e7eb" stroke-width="1"/>
          <path d="M180 0 L180 70 L220 110 L220 240" stroke="#e5e7eb" stroke-width="1"/>
          <path d="M200 0 L200 60 L240 100 L240 240" stroke="#e5e7eb" stroke-width="1"/>
          <path d="M260 0 L260 40 L320 40 L320 240" stroke="#e5e7eb" stroke-width="1"/>
          <path d="M280 0 L280 30 L340 30 L340 240" stroke="#e5e7eb" stroke-width="1"/>
          <circle cx="320" cy="50" r="60" stroke="#f3e8ff" stroke-width="1" fill="none"/>
          <circle cx="320" cy="50" r="80" stroke="#f3e8ff" stroke-width="1" fill="none"/>
        </svg>

        <div class="card-content">
          <div class="card-top-row">
            <div class="card-text">
              <div class="card-name">{{ displayName }}</div>
              <div class="card-position">{{ displayPosition }}</div>
            </div>
            <div class="card-avatar-wrap">
              <img v-if="displayAvatarSrc && !avatarError" :src="displayAvatarSrc" class="card-avatar" alt="头像" @error="onAvatarError" />
              <div v-else class="card-avatar-placeholder">{{ displayName.charAt(0) }}</div>
            </div>
          </div>

          <div class="card-bottom-row">
            <div class="card-contact">
              <div class="card-phone">{{ displayPhone }}</div>
              <div class="card-company">{{ displayCompany }}</div>
            </div>
            <div class="card-qr">
              <img v-if="qrcodeBase64" :src="qrcodeBase64" class="qr-img" alt="二维码" />
              <div v-else class="qr-placeholder">二维码</div>
            </div>
          </div>
        </div>
      </div>

      <div class="share-tip">长按图片保存或点击按钮分享</div>
    </div>

    <!-- Actions -->
    <div class="actions-bar">
      <button class="action-btn" @click="handleSave">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <span>保存图片</span>
      </button>
      <button class="action-btn primary" @click="handleShare">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
        <span>分享给好友</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getMyCard, getCardShare } from '@/api'
import { normalizeImageUrl } from '@/utils/image'
import QRCode from 'qrcode'

const route = useRoute()
const loading = ref(true)
const cardData = ref<any>({})
const qrcodeBase64 = ref('')
// 名片所有者用户 ID：作为二维码推荐人参数
const ownerId = ref<number | null>(null)

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

/** 生成带推荐人参数的注册页 URL（用户扫码后进入注册，注册时自动关联推荐人） */
function buildRegisterShareUrl() {
  const base = `${window.location.origin}${import.meta.env.BASE_URL || ''}`.replace(/\/+$/, '')
  return `${base}/register` + (ownerId.value ? `?referrer=${ownerId.value}` : '')
}

async function loadCard() {
  loading.value = true
  try {
    const id = route.params.id ? Number(route.params.id) : null
    if (id) {
      // 查看他人名片：从后端获取完整数据（含后端生成的二维码）
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
        // 二维码始终指向带推荐人参数的注册页（扫码跳转注册并自动关联推荐人）
        await generateLocalQr(buildRegisterShareUrl())
      }
    } else {
      // 查看自己的名片：只取名片数据，二维码前端本地生成
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
        await generateLocalQr(buildRegisterShareUrl())
      }
    }
  } catch (err: any) {
    console.error('加载名片失败:', err)
  } finally {
    loading.value = false
  }
}

/** 在浏览器端使用 Canvas 本地生成二维码（无需后端 canvas 依赖） */
async function generateLocalQr(text: string) {
  if (!text) return
  try {
    // 浏览器环境原生支持 Canvas，QRCode.toDataURL 可直接使用
    qrcodeBase64.value = await QRCode.toDataURL(text, {
      width: 300,
      margin: 1,
      color: { dark: '#1e1b4b', light: '#ffffff' },
    })
  } catch (err) {
    console.error('二维码生成失败:', err)
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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

async function drawCardToCanvas(scale = 2): Promise<HTMLCanvasElement> {
  const w = 375 * scale
  const h = 240 * scale
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas context not available')

  // White card background
  ctx.fillStyle = '#ffffff'
  drawRoundRect(ctx, 0, 0, w, h, 20 * scale)
  ctx.fill()

  // Decorative lines
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 1 * scale
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const drawLine = (path: string) => {
    ctx.beginPath()
    const parts = path.split(' ')
    let cmd = ''
    let vals: number[] = []
    for (const p of parts) {
      if (['M','L'].includes(p)) {
        if (cmd && vals.length === 2) {
          if (cmd === 'M') ctx.moveTo(vals[0] * scale, vals[1] * scale)
          else ctx.lineTo(vals[0] * scale, vals[1] * scale)
        }
        cmd = p
        vals = []
      } else {
        vals.push(Number(p))
      }
    }
    if (cmd && vals.length === 2) ctx.lineTo(vals[0] * scale, vals[1] * scale)
    ctx.stroke()
  }

  drawLine('M 0 180 L 120 180 L 140 200 L 220 200 L 240 180 L 375 180')
  drawLine('M 0 200 L 100 200 L 120 220 L 260 220 L 280 200 L 375 200')
  drawLine('M 0 220 L 80 220 L 100 240 L 280 240 L 300 220 L 375 220')
  drawLine('M 160 0 L 160 80 L 200 120 L 200 240')
  drawLine('M 180 0 L 180 70 L 220 110 L 220 240')
  drawLine('M 200 0 L 200 60 L 240 100 L 240 240')
  drawLine('M 260 0 L 260 40 L 320 40 L 320 240')
  drawLine('M 280 0 L 280 30 L 340 30 L 340 240')

  // Decorative circles
  ctx.strokeStyle = '#f3e8ff'
  ctx.lineWidth = 1 * scale
  ctx.beginPath()
  ctx.arc(320 * scale, 50 * scale, 60 * scale, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(320 * scale, 50 * scale, 80 * scale, 0, Math.PI * 2)
  ctx.stroke()

  // Avatar
  const avatarX = 280 * scale
  const avatarY = 24 * scale
  const avatarR = 42 * scale
  const grad = ctx.createLinearGradient(avatarX, avatarY, avatarX + avatarR * 2, avatarY + avatarR * 2)
  grad.addColorStop(0, '#c084fc')
  grad.addColorStop(1, '#a855f7')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(avatarX + avatarR, avatarY + avatarR, avatarR, 0, Math.PI * 2)
  ctx.fill()

  if (displayAvatar.value) {
    try {
      const img = await loadImage(displayAvatar.value)
      ctx.save()
      ctx.beginPath()
      ctx.arc(avatarX + avatarR, avatarY + avatarR, avatarR - 2 * scale, 0, Math.PI * 2)
      ctx.clip()
      ctx.drawImage(img, avatarX + 2 * scale, avatarY + 2 * scale, avatarR * 2 - 4 * scale, avatarR * 2 - 4 * scale)
      ctx.restore()
    } catch { /* ignore */ }
  } else {
    ctx.fillStyle = '#ffffff'
    ctx.font = `bold ${28 * scale}px "PingFang SC", "Microsoft YaHei", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(displayName.value.charAt(0), avatarX + avatarR, avatarY + avatarR)
  }

  // Name
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillStyle = '#111827'
  ctx.font = `bold ${28 * scale}px "PingFang SC", "Microsoft YaHei", sans-serif`
  ctx.fillText(displayName.value, 24 * scale, 28 * scale)

  // Position
  ctx.fillStyle = '#6b7280'
  ctx.font = `${14 * scale}px "PingFang SC", "Microsoft YaHei", sans-serif`
  ctx.fillText(displayPosition.value, 24 * scale, (28 + 36) * scale)

  // Phone
  ctx.fillStyle = '#111827'
  ctx.font = `bold ${22 * scale}px "PingFang SC", "Microsoft YaHei", sans-serif`
  ctx.fillText(displayPhone.value, 24 * scale, 154 * scale)

  // Company
  ctx.fillStyle = '#6b7280'
  ctx.font = `${14 * scale}px "PingFang SC", "Microsoft YaHei", sans-serif`
  ctx.fillText(displayCompany.value, 24 * scale, 186 * scale)

  // QR code
  if (qrcodeBase64.value) {
    try {
      const qrImg = await loadImage(qrcodeBase64.value)
      const qrSize = 64 * scale
      const qrX = 280 * scale
      const qrY = 146 * scale
      ctx.fillStyle = '#ffffff'
      drawRoundRect(ctx, qrX - 4 * scale, qrY - 4 * scale, qrSize + 8 * scale, qrSize + 8 * scale, 8 * scale)
      ctx.fill()
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)
    } catch { /* ignore */ }
  }

  return canvas
}

async function handleSave() {
  try {
    const canvas = await drawCardToCanvas(3)
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `名片_${displayName.value}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showToast('图片已保存')
    }, 'image/png')
  } catch (err: any) {
    console.error('保存失败:', err)
    showToast('保存失败')
  }
}

async function handleShare() {
  const shareUrl = buildRegisterShareUrl()
  try {
    if (navigator.share) {
      await navigator.share({
        title: `${displayName.value} 的名片`,
        text: `点击注册加入 ${displayName.value} 的推荐，领取新人积分`,
        url: shareUrl,
      })
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl)
      showToast('链接已复制')
    } else {
      showToast('暂不支持分享')
    }
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  document.title = '转发名片'
  loadCard()
})
</script>

<style scoped>
@import '@/styles/global.css';

.share-page { background: #f5f6fa; }

.header {
  position: sticky; top: 0; z-index: 100;
  background: rgba(255,255,255,0.95);
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
.back-btn svg { width: 20px; height: 20px; color: #1e1b4b; }
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
  object-fit: cover; display: block;
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
.qr-img { width: 100%; height: 100%; object-fit: contain; }
.qr-placeholder {
  font-size: 12px; color: #9ca3af;
}

.share-tip {
  margin-top: 16px;
  font-size: 13px; color: #9ca3af;
}

.actions-bar {
  position: fixed; bottom: 0; left: 0; right: 0;
  max-width: 430px; margin: 0 auto;
  display: flex; gap: 12px; padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
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
.action-btn:active { transform: scale(0.97); }
.action-btn.primary {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; border-color: transparent;
}
.action-btn svg { width: 18px; height: 18px; }
</style>
