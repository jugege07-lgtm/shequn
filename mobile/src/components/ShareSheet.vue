<template>
  <transition name="share-fade">
    <div v-if="modelValue" class="share-mask" @click.self="close">
      <div class="share-sheet">
        <!-- 头部 -->
        <div class="ss-header">
          <div class="ss-title">分享给好友</div>
          <div class="ss-close" @click="close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </div>
        </div>

        <div class="ss-body" v-loading="generating">
          <!-- 海报预览 -->
          <div class="ss-poster-wrap">
            <div class="ss-poster">
              <canvas v-if="posterCanvas" ref="posterRef" class="ss-poster-canvas"></canvas>
              <div v-else class="ss-poster-placeholder">海报生成中...</div>
            </div>
            <div class="ss-hint">长按海报图片即可保存到相册</div>
          </div>

          <!-- 操作按钮 -->
          <div class="ss-actions">
            <button class="ss-btn primary" @click="handleSavePoster">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>保存海报</span>
            </button>
            <button class="ss-btn" @click="handleCopyLink">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              <span>复制链接</span>
            </button>
          </div>

          <!-- 社交渠道 -->
          <div class="ss-channels">
            <div class="ss-channel" @click="shareTo('微信')">
              <div class="ch-icon ch-wechat">
                <ShareIcon type="wechat" :size="26" color="#ffffff" />
              </div>
              <span>微信</span>
            </div>
            <div class="ss-channel" @click="shareTo('朋友圈')">
              <div class="ch-icon ch-moments">
                <ShareIcon type="moments" :size="26" color="#ffffff" />
              </div>
              <span>朋友圈</span>
            </div>
            <div class="ss-channel" @click="shareTo('QQ')">
              <div class="ch-icon ch-qq">
                <ShareIcon type="qq" :size="26" color="#ffffff" />
              </div>
              <span>QQ</span>
            </div>
            <div class="ss-channel" @click="useNativeShare">
              <div class="ch-icon ch-more">
                <ShareIcon type="system" :size="26" color="#ffffff" />
              </div>
              <span>系统分享</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { ShareContent } from '@/utils/share'
import ShareIcon from '@/components/ShareIcon.vue'
import {
  buildShareUrl,
  generateQrDataUrl,
  createSharePoster,
  saveCanvasToAlbum,
  copyText,
  nativeShare,
} from '@/utils/share'

const props = defineProps<{
  modelValue: boolean
  share: ShareContent | null
  referrerId?: number | null
  referrerName?: string
}>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const generating = ref(false)
const posterCanvas = ref<HTMLCanvasElement | null>(null)
const posterRef = ref<HTMLCanvasElement | null>(null)
const link = ref('')

function showToast(msg: string) {
  const existing = document.querySelector('.share-toast')
  if (existing) existing.remove()
  const el = document.createElement('div')
  el.className = 'share-toast'
  el.textContent = msg
  el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.78);color:#fff;padding:12px 28px;border-radius:12px;font-size:14px;z-index:99999;white-space:nowrap'
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 2000)
}

function close() {
  emit('update:modelValue', false)
}

async function build() {
  const s = props.share
  if (!s) return
  generating.value = true
  try {
    link.value = buildShareUrl(s.path, props.referrerId)
    const qr = await generateQrDataUrl(link.value)
    const canvas = await createSharePoster(s, qr, props.referrerName || '')
    posterCanvas.value = canvas
    await nextTick()
    if (posterRef.value) {
      posterRef.value.width = canvas.width
      posterRef.value.height = canvas.height
      const ctx = posterRef.value.getContext('2d')
      ctx?.drawImage(canvas, 0, 0)
    }
  } finally {
    generating.value = false
  }
}

function handleSavePoster() {
  if (!posterCanvas.value) return
  const s = props.share
  const typeName = s?.type === 'activity' ? '活动' : s?.type === 'business' ? '商机' : '商品'
  saveCanvasToAlbum(posterCanvas.value, `${typeName}_分享海报.png`)
  showToast('已保存，可在相册查看')
}

async function handleCopyLink() {
  const ok = await copyText(link.value)
  showToast(ok ? '链接已复制' : '复制失败')
}

function shareTo(channel: string) {
  copyText(link.value).then((ok) => {
    showToast(ok ? `链接已复制，去${channel}粘贴即可` : '复制失败')
  })
}

async function useNativeShare() {
  const s = props.share
  const typeName = s?.type === 'activity' ? '活动' : s?.type === 'business' ? '商机' : '商品'
  const res = await nativeShare({
    title: `${typeName}：${s?.title || ''}`,
    text: `${s?.desc || ''}`,
    url: link.value,
  })
  if (res === 'unsupported') {
    const ok = await copyText(link.value)
    showToast(ok ? '已复制链接' : '暂不支持系统分享，请复制链接')
  }
}

// 打开时生成内容
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
@import '@/styles/global.css';

.share-mask {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: flex-end; justify-content: center;
}
.share-sheet {
  width: 100%; max-width: 430px;
  background: #fff;
  border-radius: 20px 20px 0 0;
  padding: 20px 20px calc(20px + var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)));
  max-height: 86vh;
  display: flex; flex-direction: column;
}
.ss-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px;
}
.ss-title { font-size: 18px; font-weight: 700; color: #1e1b4b; }
.ss-close {
  width: 30px; height: 30px; border-radius: 50%;
  background: rgba(0,0,0,0.05);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #555;
}
.ss-close svg { width: 16px; height: 16px; }
.ss-body { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; }

.ss-poster-wrap { text-align: center; }
.ss-poster {
  width: 100%; max-width: 300px; margin: 0 auto;
  border-radius: 14px; overflow: hidden;
  border: 1px solid #eef0f6;
  box-shadow: 0 8px 28px rgba(60,60,80,0.12);
}
.ss-poster-canvas { width: 100%; height: auto; display: block; }
.ss-poster-placeholder { height: 380px; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 14px; }
.ss-hint { margin-top: 10px; font-size: 12px; color: #9ca3af; }

.ss-actions { display: flex; gap: 12px; margin-top: 16px; }
.ss-btn {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 13px; border-radius: 12px;
  border: 1px solid rgba(99,102,241,0.3); background: #fff;
  color: #6366f1; font-size: 15px; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
}
.ss-btn:active { transform: scale(0.97); }
.ss-btn.primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; border-color: transparent; }
.ss-btn svg { width: 18px; height: 18px; }

.ss-channels {
  display: flex; justify-content: space-around; margin-top: 22px;
  padding-top: 16px; border-top: 1px solid #f1f2f6;
}
.ss-channel {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  cursor: pointer; font-size: 12px; color: #555;
}
.ch-icon {
  width: 48px; height: 48px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
}
.ch-wechat { background: #07c160; }
.ch-moments { background: #2fae60; }
.ch-qq { background: #12b7f5; }
.ch-more { background: linear-gradient(135deg, #6366f1, #8b5cf6); }

.share-fade-enter-active, .share-fade-leave-active { transition: opacity 0.22s ease; }
.share-fade-enter-active .share-sheet, .share-fade-leave-active .share-sheet {
  transition: transform 0.26s ease;
}
.share-fade-enter-from, .share-fade-leave-to { opacity: 0; }
.share-fade-enter-from .share-sheet, .share-fade-leave-to .share-sheet { transform: translateY(100%); }
</style>