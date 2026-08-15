<template>
  <view v-if="modelValue" class="share-mask" @tap="close" @touchmove.stop>
    <view class="share-sheet" @tap.stop>
      <!-- 头部 -->
      <view class="ss-header">
        <view class="ss-title">分享给好友</view>
        <view class="ss-close" @click="close">
          <image class="ss-close-icon" :src="iconClose" mode="aspectFit" />
        </view>
      </view>

      <view class="ss-body">
        <!-- 海报预览 -->
        <view class="ss-poster-wrap">
          <view class="ss-poster">
            <image v-if="posterPath" :src="posterPath" class="ss-poster-img" mode="widthFix" show-menu-by-longpress />
            <view v-else class="ss-poster-placeholder">{{ generating ? '海报生成中...' : '海报预览' }}</view>
          </view>
          <view class="ss-hint">点击「保存海报」存入手机相册</view>
        </view>

        <!-- 操作按钮 -->
        <view class="ss-actions">
          <button class="ss-btn primary" :loading="generating" @click="handleSavePoster">
            <text>保存海报</text>
          </button>
          <button class="ss-btn" @click="handleCopyLink">
            <text>复制链接</text>
          </button>
        </view>

        <!-- 社交渠道：微信转发走 open-type=share（页面需实现 onShareAppMessage） -->
        <view class="ss-channels">
          <button class="ss-channel-btn" open-type="share">
            <view class="ch-icon ch-wechat">
              <ShareIcon type="wechat" :size="26" color="#ffffff" />
            </view>
            <text class="ss-channel-label">微信好友</text>
          </button>
          <view class="ss-channel" @click="handleCopyLink">
            <view class="ch-icon ch-moments">
              <ShareIcon type="moments" :size="26" color="#ffffff" />
            </view>
            <text class="ss-channel-label">复制链接</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 海报绘制 canvas（置于屏幕外，不可 display:none，否则无法绘制） -->
    <canvas
      id="share-poster-canvas"
      type="2d"
      class="poster-canvas"
      :style="{ width: canvasW + 'px', height: canvasH + 'px' }"
    />
    <!-- 二维码绘制 canvas -->
    <canvas
      id="share-qr-canvas"
      type="2d"
      class="poster-canvas"
      :style="{ width: qrSize + 'px', height: qrSize + 'px' }"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { ShareContent } from '@/utils/share'
import ShareIcon from '@/components/ShareIcon.vue'
import {
  buildShareUrl,
  copyText,
  saveCanvasNodeToAlbum,
  TYPE_META,
} from '@/utils/share'
import { normalizeImageUrl } from '@/utils/image'
import { stripHtml } from '@/utils/sanitize'
import { svgUri } from '@/utils/svg'
import UQRCode from 'weapp-qrcode-canvas-2d'

const props = defineProps<{
  modelValue: boolean
  share: ShareContent | null
  referrerId?: number | null
  referrerName?: string
}>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const iconClose = svgUri('<path d="M18 6 6 18M6 6l12 12"/>', { color: '#9ca3af' })

const S = 2 // 2x 渲染
const canvasW = 375
const canvasH = 620
const qrSize = 200

const generating = ref(false)
const posterPath = ref('')
const link = ref('')

function toast(msg: string) {
  uni.showToast({ title: msg, icon: 'none' })
}

function close() {
  emit('update:modelValue', false)
}

function getCanvasNode(id: string): Promise<{ canvas: any; ctx: any; dpr: number }> {
  return new Promise((resolve, reject) => {
    uni.createSelectorQuery()
      .in(getCurrentInstanceProxy())
      .select(`#${id}`)
      .fields({ node: true, size: true })
      .exec((res: any) => {
        const info = res?.[0]
        if (!info?.node) {
          reject(new Error('canvas node not found: ' + id))
          return
        }
        const canvas = info.node
        const dpr = uni.getSystemInfoSync().pixelRatio || 2
        resolve({ canvas, ctx: canvas.getContext('2d'), dpr })
      })
  })
}

function getCurrentInstanceProxy(): any {
  // 当前页面实例（组件内查询 canvas 需要 .in(page)）
  const pages = getCurrentPages()
  return (pages[pages.length - 1] as any)?.$vm
}

function loadImage(canvas: any, src: string): Promise<any> {
  return new Promise((resolve) => {
    const img = canvas.createImage()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function roundRect(ctx: any, x: number, y: number, w: number, h: number, r: number) {
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

function wrapText(ctx: any, text: string, maxWidth: number, maxLines: number): string[] {
  const chars = Array.from(text.replace(/\s+/g, ' '))
  const lines: string[] = []
  let line = ''
  for (const ch of chars) {
    const test = line + ch
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = ch
      if (lines.length >= maxLines) break
    } else {
      line = test
    }
  }
  if (line && lines.length < maxLines) lines.push(line)
  return lines
}

async function drawQr(canvas: any, text: string): Promise<void> {
  const qr = new UQRCode()
  qr.data = text
  qr.size = qrSize * S
  qr.margin = 1
  qr.make()
  const ctx = canvas.getContext('2d')
  canvas.width = qrSize * S
  canvas.height = qrSize * S
  qr.canvasContext = ctx
  await qr.drawCanvas()
}

async function build() {
  const s = props.share
  if (!s) return
  generating.value = true
  posterPath.value = ''
  try {
    await nextTick()
    link.value = buildShareUrl(s.path, props.referrerId)

    // 1. 二维码 canvas
    const qrNode = await getCanvasNode('share-qr-canvas')
    await drawQr(qrNode.canvas, link.value)

    // 2. 海报 canvas
    const { canvas, ctx } = await getCanvasNode('share-poster-canvas')
    canvas.width = canvasW * S
    canvas.height = canvasH * S
    ctx.scale(S, S)

    const meta = TYPE_META[s.type]
    const cleanTitle = stripHtml(s.title || '')
    const cleanPrice = s.price ? stripHtml(s.price) : ''
    const cleanMeta = (s.meta || []).map((m) => stripHtml(m)).filter(Boolean)
    const cleanReferrer = stripHtml(props.referrerName || '')

    const W = canvasW
    // 背景
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, canvasH)

    // 封面
    const coverH = 268
    const norm = s.image ? normalizeImageUrl(s.image) : ''
    const coverImg = norm ? await loadImage(canvas, norm) : null
    if (coverImg) {
      const ratio = W / coverH
      const sw = Math.min(coverImg.width, coverImg.height * ratio)
      const sh = sw / ratio
      const sx = (coverImg.width - sw) / 2
      const sy = (coverImg.height - sh) / 2
      ctx.save()
      roundRect(ctx, 0, 0, W, coverH, 0)
      ctx.clip()
      ctx.drawImage(coverImg, sx, sy, sw, sh, 0, 0, W, coverH)
      ctx.restore()
    } else {
      const grad = ctx.createLinearGradient(0, 0, W, coverH)
      grad.addColorStop(0, meta.accent[0])
      grad.addColorStop(1, meta.accent[1])
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, W, coverH)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = '72px serif'
      ctx.fillText(meta.emoji, W / 2, coverH / 2 - 20)
      ctx.font = 'bold 22px sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.92)'
      ctx.fillText(`${meta.label} · 扫码查看详情`, W / 2, coverH / 2 + 60)
    }

    // 类型徽标
    const badgeW = 96
    const badgeH = 40
    ctx.save()
    ctx.fillStyle = 'rgba(255,255,255,0.92)'
    roundRect(ctx, 16, 16, badgeW, badgeH, 20)
    ctx.fill()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = 'bold 18px sans-serif'
    ctx.fillStyle = '#4338ca'
    ctx.fillText(meta.label, 16 + badgeW / 2, 16 + badgeH / 2)
    ctx.restore()

    // 正文
    const bodyX = 20
    const bodyW = W - bodyX * 2
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'

    ctx.font = 'bold 26px sans-serif'
    ctx.fillStyle = '#1e1b4b'
    const titleLines = wrapText(ctx, cleanTitle, bodyW, 2)
    let y = coverH + 26
    titleLines.forEach((ln) => {
      ctx.fillText(ln, bodyX, y)
      y += 36
    })

    if (cleanPrice) {
      y += 6
      ctx.font = 'bold 22px sans-serif'
      ctx.fillStyle = '#e11d48'
      ctx.fillText(cleanPrice, bodyX, y)
      y += 34
    }

    if (cleanMeta.length) {
      y += 2
      ctx.font = '15px sans-serif'
      ctx.fillStyle = '#7c7c8a'
      cleanMeta.forEach((m) => {
        const line = wrapText(ctx, m, bodyW, 1)[0]
        if (!line) return
        ctx.fillText(line, bodyX, y)
        y += 26
      })
    }

    // 分隔线
    y = Math.max(y + 8, 470)
    ctx.strokeStyle = '#eef0f6'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(bodyX, y)
    ctx.lineTo(bodyX + bodyW, y)
    ctx.stroke()

    // 底部品牌 + 二维码
    const bottomY = y + 22
    const qrDrawSize = 96
    const qrX = W - 20 - qrDrawSize
    const qrY = bottomY

    ctx.fillStyle = '#6366f1'
    ctx.beginPath()
    ctx.arc(bodyX + 20, qrY + 20, 20, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = 'bold 20px sans-serif'
    ctx.fillText('群', bodyX + 20, qrY + 20)
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.font = 'bold 17px sans-serif'
    ctx.fillStyle = '#1e1b4b'
    ctx.fillText('聚格软件', bodyX + 50, qrY)
    ctx.font = '13px sans-serif'
    ctx.fillStyle = '#8a8a99'
    ctx.fillText('连接人脉 · 共享商机 · 共同成长', bodyX + 50, qrY + 26)
    ctx.fillText(cleanReferrer ? `分享自：${cleanReferrer}` : '长按识别二维码', bodyX + 50, qrY + 52)

    // 二维码（从专用 canvas 绘制到海报）
    ctx.fillStyle = '#ffffff'
    roundRect(ctx, qrX - 6, qrY - 6, qrDrawSize + 12, qrDrawSize + 12, 10)
    ctx.fill()
    ctx.drawImage(qrNode.canvas, qrX, qrY, qrDrawSize, qrDrawSize)

    // 3. 导出预览
    posterPath.value = await new Promise<string>((resolve) => {
      uni.canvasToTempFilePath({
        canvas,
        success: (res: any) => resolve(res.tempFilePath),
        fail: () => resolve(''),
      } as any)
    })
  } catch (err) {
    console.error('海报生成失败', err)
    toast('海报生成失败')
  } finally {
    generating.value = false
  }
}

async function handleSavePoster() {
  if (generating.value) return
  const { canvas } = await getCanvasNode('share-poster-canvas')
  try {
    const ok = await saveCanvasNodeToAlbum(canvas)
    toast(ok ? '已保存到相册' : '未保存（可在设置中开启相册权限）')
  } catch {
    toast('保存失败，请重试')
  }
}

async function handleCopyLink() {
  const ok = await copyText(link.value)
  toast(ok ? '链接已复制' : '复制失败')
}

watch(
  () => [props.modelValue, props.share],
  () => {
    if (props.modelValue && props.share) {
      build()
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.share-mask {
  position: fixed; left: 0; right: 0; top: 0; bottom: 0; z-index: 9999;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: flex-end; justify-content: center;
}
.share-sheet {
  width: 100%;
  background: #fff;
  border-radius: 20px 20px 0 0;
  padding: 20px 20px calc(20px + env(safe-area-inset-bottom, 0px));
  max-height: 86vh;
  display: flex; flex-direction: column;
  position: relative;
  z-index: 2;
}
.ss-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 14px;
}
.ss-title { font-size: 17px; font-weight: 700; color: #1e1b4b; }
.ss-close {
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}
.ss-close-icon { width: 16px; height: 16px; }
.ss-poster-wrap { display: flex; flex-direction: column; align-items: center; }
.ss-poster {
  width: 240px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0,0,0,0.12);
  background: #f5f6fa;
  min-height: 300px;
  display: flex; align-items: center; justify-content: center;
}
.ss-poster-img { width: 100%; }
.ss-poster-placeholder { color: #9ca3af; font-size: 13px; padding: 40px 0; }
.ss-hint { font-size: 12px; color: #9ca3af; margin-top: 10px; }
.ss-actions {
  display: flex; gap: 12px; margin-top: 16px;
}
.ss-btn {
  flex: 1; display: flex; align-items: center; justify-content: center;
  padding: 12px 0; border-radius: 12px;
  background: #f3f4f6; color: #1e1b4b;
  font-size: 14px; font-weight: 600;
  border: none;
}
.ss-btn.primary { background: #6366f1; color: #fff; }
.ss-btn::after { border: none; }
.ss-channels {
  display: flex; gap: 24px; justify-content: center;
  margin-top: 18px; padding-bottom: 4px;
}
.ss-channel, .ss-channel-btn {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  background: transparent; border: none; padding: 0; margin: 0;
  line-height: inherit;
}
.ss-channel-btn::after, .ss-channel::after { border: none; }
.ch-icon {
  width: 46px; height: 46px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}
.ch-wechat { background: #07c160; }
.ch-moments { background: #6366f1; }
.ss-channel-label { font-size: 11px; color: #6b7280; }
.poster-canvas {
  position: fixed;
  left: -2000px;
  top: 0;
}
</style>
