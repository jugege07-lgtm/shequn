<template>
  <div class="phone-frame appdl-page">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <div class="back-btn" @click="$router.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </div>
        <span class="header-title">下载 App</span>
      </div>
      <div class="header-right">
        <div class="header-icon" @click="handleShare">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
        </div>
      </div>
    </div>

    <div class="main-scroll">
      <!-- Hero -->
      <div class="hero">
        <div class="hero-shapes">
          <div class="hero-shape hs1"></div>
          <div class="hero-shape hs2"></div>
          <div class="hero-shape hs3"></div>
        </div>
        <div class="hero-logo">
          <img :src="logoSrc" alt="社群名片" class="hero-logo-img" />
        </div>
        <h1 class="hero-name">社群名片</h1>
        <p class="hero-tag">连接优质资源 · 成就商业梦想</p>
        <div class="hero-badges">
          <span class="hero-badge">资源对接</span>
          <span class="hero-badge">人脉拓展</span>
          <span class="hero-badge">商业机会</span>
        </div>
      </div>

      <!-- Feature section -->
      <div class="feat-section">
        <div class="feat-card" v-for="f in features" :key="f.title">
          <div class="feat-icon" :style="{ background: f.bg, color: f.color }">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path :d="f.icon"/></svg>
          </div>
          <div class="feat-wrap">
            <div class="feat-title">{{ f.title }}</div>
            <div class="feat-desc">{{ f.desc }}</div>
          </div>
        </div>
      </div>

      <!-- Intro image block -->
      <div class="intro-block">
        <div class="intro-title">随时随地，掌控商机</div>
        <p class="intro-text">
          在手机上发布活动、对接商机、交换名片，实时掌握社群动态与商业机会，让资源流动更简单。
        </p>
        <div class="intro-visual">
          <img :src="logoSrc" alt="社群名片 App" class="intro-img" />
          <div class="intro-glow"></div>
        </div>
      </div>

      <!-- Download -->
      <div class="download-card">
        <div class="download-title">下载 App</div>
        <p class="download-sub">Android 客户端 · 安装后即可添加到桌面，随时随地使用</p>
        <a class="download-btn" @click.prevent="handleDownload">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span>下载 Android 版</span>
        </a>
        <div class="download-tip">或复制链接到浏览器安装</div>
        <div class="download-version">当前版本：v{{ appVersion }}</div>
      </div>

      <!-- PWA tips -->
      <div class="pwa-card">
        <div class="pwa-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
        </div>
        <div class="pwa-wrap">
          <div class="pwa-title">iPhone / 免安装</div>
          <div class="pwa-desc">使用浏览器打开本页，点击"分享"→"添加到主屏幕"即可像 App 一样使用</div>
        </div>
      </div>

      <div class="footer-space"></div>
    </div>

    <!-- Share / Poster Modal -->
    <transition name="poster-fade">
      <div v-if="posterOpen" class="poster-mask" @click="posterOpen = false">
        <div class="poster-wrap" @click.stop>
          <div class="poster-title">分享给好友</div>
          <div class="poster-canvas">
            <canvas ref="posterCanvas" class="poster-img"></canvas>
            <div v-if="posterLoading" class="poster-loading">生成海报中...</div>
          </div>
          <div class="poster-actions">
            <button class="poster-btn ghost" @click="handleSavePoster">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>保存海报</span>
            </button>
            <button class="poster-btn primary" @click="handleShareLink">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              <span>分享链接</span>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import QRCode from 'qrcode'

const BASE = import.meta.env.BASE_URL || '/h5/'
const apkUrl = `${BASE}app/shequn.apk`
const appVersion = '1.0.7'
const logoSrc = `${BASE}logo.jpg`

const features = [
  { title: '发布活动', desc: '创建社群活动，快速召集同频伙伴', icon: 'M3 4h18v13H3z M8 21h8M12 17v4', bg: '#eef2ff', color: '#6366f1' },
  { title: '对接商机', desc: '海量商业机会，一键解锁联系', icon: 'M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5', bg: '#dbeafe', color: '#3b82f6' },
  { title: '交换名片', desc: '电子名片扫码分享，人脉轻松沉淀', icon: 'M2 5h20v14H2z M2 10h20', bg: '#fce7f3', color: '#db2777' },
  { title: '商城兑换', desc: '积分抵扣，优惠券福利随时领', icon: 'M4 2h16l-2 12H6L4 2z M6 20a2 2 0 100 4 2 2 0 000-4z', bg: '#fef3c7', color: '#f59e0b' },
]

const posterOpen = ref(false)
const posterLoading = ref(false)
const posterCanvas = ref<HTMLCanvasElement | null>(null)

function buildShareUrl() {
  const base = `${window.location.origin}${import.meta.env.BASE_URL || ''}`.replace(/\/+$/, '')
  return `${base}/app-download`
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

async function drawPoster() {
  const canvas = posterCanvas.value
  if (!canvas) return
  const w = 600, h = 800
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 背景渐变
  const grad = ctx.createLinearGradient(0, 0, w, h)
  grad.addColorStop(0, '#6366f1')
  grad.addColorStop(0.55, '#8b5cf6')
  grad.addColorStop(1, '#a78bfa')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  // 装饰圆
  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  ctx.beginPath(); ctx.arc(w - 40, 60, 130, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(40, h - 60, 150, 0, Math.PI * 2); ctx.fill()

  // Logo
  try {
    const logo = await loadImage(logoSrc)
    const lsize = 120, lx = (w - lsize) / 2, ly = 90
    ctx.save()
    ctx.beginPath(); ctx.arc(lx + lsize / 2, ly + lsize / 2, lsize / 2, 0, Math.PI * 2); ctx.clip()
    ctx.fillStyle = '#fff'
    ctx.fillRect(lx, ly, lsize, lsize)
    ctx.drawImage(logo, lx + 8, ly + 8, lsize - 16, lsize - 16)
    ctx.restore()
  } catch { /* ignore */ }

  // 标题
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.font = 'bold 56px "PingFang SC","Microsoft YaHei",sans-serif'
  ctx.fillText('社群名片', w / 2, 280)

  ctx.font = '26px "PingFang SC","Microsoft YaHei",sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.fillText('连接优质资源 · 成就商业梦想', w / 2, 336)

  // 特性
  ctx.font = '24px "PingFang SC","Microsoft YaHei",sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.95)'
  const lines = ['发布活动 · 对接商机', '交换名片 · 商城福利']
  lines.forEach((t, i) => ctx.fillText(t, w / 2, 396 + i * 40))

  // 二维码
  try {
    const qr = await QRCode.toDataURL(buildShareUrl(), { width: 260, margin: 0 })
    const qrImg = await loadImage(qr)
    const qrSize = 240, qx = (w - qrSize) / 2, qy = 480
    ctx.fillStyle = '#fff'
    ctx.beginPath(); ctx.arc(qx + qrSize / 2, qy + qrSize / 2, qrSize / 2 + 12, 0, Math.PI * 2); ctx.fill()
    ctx.drawImage(qrImg, qx, qy, qrSize, qrSize)
    ctx.fillStyle = '#4f46e5'
    ctx.font = '22px "PingFang SC","Microsoft YaHei",sans-serif'
    ctx.fillText('扫码下载 社群名片', w / 2, qy + qrSize + 44)
  } catch { /* ignore */ }
}

async function handleShare() {
  posterOpen.value = true
  posterLoading.value = true
  await nextTick()
  try {
    await drawPoster()
  } finally {
    posterLoading.value = false
  }
}

function handleDownload() {
  // 跳转到稳定的最新安装包地址，触发浏览器下载
  showToast('开始下载，请稍候...')
  window.location.href = apkUrl
}

function handleSavePoster() {
  const canvas = posterCanvas.value
  if (!canvas) return
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '社群名片_海报.png'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast('海报已保存')
  }, 'image/png')
}

async function handleShareLink() {
  const url = buildShareUrl()
  try {
    if (navigator.share) {
      await navigator.share({ title: '社群名片 App', text: '下载社群名片，连接优质资源，成就商业梦想', url })
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url)
      showToast('链接已复制')
    } else {
      showToast('暂不支持分享')
    }
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  document.title = '下载 App'
})
</script>

<style scoped>
@import '@/styles/global.css';

.appdl-page { background: #f0f2f8; }

.main-scroll { padding-bottom: 32px; }

/* Hero */
.hero {
  position: relative;
  padding: 40px 24px 32px;
  background: linear-gradient(150deg, #6366f1 0%, #8b5cf6 55%, #a78bfa 100%);
  border-radius: 0 0 28px 28px;
  overflow: hidden;
  text-align: center;
  color: #fff;
}
.hero-shapes { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
.hero-shape { position: absolute; border-radius: 50%; background: #fff; }
.hs1 { width: 220px; height: 220px; top: -70px; right: -60px; opacity: 0.15; }
.hs2 { width: 160px; height: 160px; bottom: -50px; left: -40px; opacity: 0.15; }
.hs3 { width: 90px; height: 90px; top: 40px; left: 18%; opacity: 0.12; }
.hero-logo {
  position: relative;
  width: 96px; height: 96px; margin: 0 auto 18px;
  border-radius: 26px;
  background: #fff;
  box-shadow: 0 12px 32px rgba(0,0,0,0.22);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
.hero-logo-img { width: 100%; height: 100%; object-fit: cover; }
.hero-name { position: relative; font-size: 30px; font-weight: 800; letter-spacing: 1px; }
.hero-tag { position: relative; margin-top: 8px; font-size: 15px; color: rgba(255,255,255,0.92); }
.hero-badges { position: relative; margin-top: 20px; display: flex; justify-content: center; gap: 10px; }
.hero-badge {
  padding: 6px 14px; border-radius: 99px;
  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(255,255,255,0.3);
  font-size: 12px; font-weight: 600;
}

/* Features */
.feat-section {
  margin: 20px 16px 0;
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
}
.feat-card {
  padding: 16px;
  background: #fff; border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}
.feat-icon {
  width: 40px; height: 40px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 10px;
}
.feat-icon svg { width: 22px; height: 22px; }
.feat-title { font-size: 15px; font-weight: 700; color: #1e1b4b; margin-bottom: 4px; }
.feat-desc { font-size: 12px; color: #6b7280; line-height: 1.5; }

/* Intro */
.intro-block {
  margin: 20px 16px 0;
  padding: 24px 20px;
  background: linear-gradient(160deg, #ffffff 0%, #eef2ff 100%);
  border-radius: 20px;
  border: 1px solid rgba(99,102,241,0.12);
  text-align: center;
}
.intro-title { font-size: 19px; font-weight: 800; color: #1e1b4b; }
.intro-text { margin: 10px auto 0; max-width: 290px; font-size: 13px; color: #6b7280; line-height: 1.7; }
.intro-visual { position: relative; margin: 22px auto 0; width: 120px; height: 120px; }
.intro-img {
  position: relative; width: 100%; height: 100%;
  border-radius: 28px; object-fit: cover;
  box-shadow: 0 16px 40px rgba(99,102,241,0.25);
}
.intro-glow {
  position: absolute; inset: -20px;
  background: radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%);
  z-index: 0;
}

/* Download */
.download-card {
  margin: 20px 16px 0;
  padding: 24px 20px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 20px;
  text-align: center;
  color: #fff;
  box-shadow: 0 12px 32px rgba(99,102,241,0.3);
}
.download-title { font-size: 20px; font-weight: 800; }
.download-sub { margin: 8px auto 18px; font-size: 12px; color: rgba(255,255,255,0.85); opacity: 0.9; }
.download-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 13px 28px; border-radius: 99px;
  background: #fff; color: #4f46e5;
  font-size: 15px; font-weight: 700;
  box-shadow: 0 8px 20px rgba(0,0,0,0.18);
  cursor: pointer; transition: transform 0.15s;
}
.download-btn:active { transform: scale(0.96); }
.download-btn svg { width: 20px; height: 20px; }
.download-tip { margin-top: 12px; font-size: 11px; color: rgba(255,255,255,0.75); }
.download-version { margin-top: 8px; font-size: 11px; color: rgba(255,255,255,0.85); font-weight: 600; }

/* PWA */
.pwa-card {
  margin: 16px 16px 0;
  padding: 16px;
  background: #fff; border-radius: 16px;
  display: flex; align-items: center; gap: 14px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}
.pwa-icon {
  width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
  background: #eef2ff; color: #6366f1;
  display: flex; align-items: center; justify-content: center;
}
.pwa-icon svg { width: 22px; height: 22px; }
.pwa-title { font-size: 15px; font-weight: 700; color: #1e1b4b; margin-bottom: 3px; }
.pwa-desc { font-size: 12px; color: #6b7280; line-height: 1.5; }

.footer-space { height: 24px; }

/* Poster Modal */
.poster-mask {
  position: fixed; inset: 0; z-index: 600;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}
.poster-wrap {
  width: 100%; max-width: 340px;
  background: #fff; border-radius: 20px;
  padding: 20px;
}
.poster-title { font-size: 16px; font-weight: 700; color: #1e1b4b; text-align: center; margin-bottom: 14px; }
.poster-canvas { position: relative; border-radius: 14px; overflow: hidden; }
.poster-img { width: 100%; height: auto; display: block; }
.poster-loading {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.85); color: #6366f1; font-size: 14px;
}
.poster-actions { display: flex; gap: 10px; margin-top: 16px; }
.poster-btn {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 12px; border-radius: 12px; font-size: 14px; font-weight: 600;
  border: none; cursor: pointer; transition: all 0.15s;
}
.poster-btn svg { width: 18px; height: 18px; }
.poster-btn:active { transform: scale(0.96); }
.poster-btn.ghost { background: #f3f4f6; color: #1e1b4b; }
.poster-btn.primary { background: #6366f1; color: #fff; }
.poster-fade-enter-active, .poster-fade-leave-active { transition: opacity 0.2s ease; }
.poster-fade-enter-from, .poster-fade-leave-to { opacity: 0; }
</style>