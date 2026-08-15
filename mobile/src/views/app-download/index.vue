<template>
  <div class="dl-page">
    <!-- ===== Navbar (desktop only) ===== -->
    <nav class="dl-navbar">
      <div class="nav-inner">
        <div class="nav-brand">
          <div class="nav-logo">
            <img :src="logoSrc" alt="社群 App" />
          </div>
          <span class="nav-name">社群</span>
        </div>
        <div class="nav-links">
          <a href="#hero" class="nav-link active">首页</a>
          <a href="#features" class="nav-link">核心功能</a>
          <a href="#about" class="nav-link">关于我们</a>
        </div>
        <a class="nav-dl-btn" @click.prevent="handleDownload">下载 App</a>
      </div>
    </nav>

    <div class="dl-body">
      <!-- ===== Hero ===== -->
      <section id="hero" class="dl-hero">
        <div class="hero-shapes">
          <div class="shape s1"></div>
          <div class="shape s2"></div>
          <div class="shape s3"></div>
        </div>
        <div class="hero-inner">
          <div class="hero-content">
            <div class="hero-app-icon">
              <img :src="logoSrc" alt="社群 App" />
            </div>
            <div class="hero-tag">社群 App · 一站式社群运营平台</div>
            <h1 class="hero-title">连接优质资源<br />成就创业梦想</h1>
            <p class="hero-desc">
              发布活动 · 对接商机 · 交换名片 · 大咖人脉
            </p>
            <div class="hero-actions">
              <a class="btn-link-h5" @click.prevent="goH5Home">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                <span>H5 体验入口</span>
              </a>
              <a class="btn-primary" @click.prevent="handleDownload">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span>下载 Android 版</span>
              </a>
              <a class="btn-ghost" @click.prevent="handleIosGuide">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 18h6"/><path d="M12 14V8"/><path d="M9 11l3-3 3 3"/></svg>
                <span>iPhone · 免安装</span>
              </a>
            </div>
            <div class="hero-version">当前版本 v{{ appVersion }} · 支持 Android / iOS</div>
            <a class="hero-share" @click.prevent="handleShare">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              <span>生成分享海报</span>
            </a>
          </div>
          <div class="hero-mockup">
            <div class="mockup-body">
              <div class="mockup-notch"></div>
              <div class="mockup-screen">
                <div class="ms-header">
                  <span class="ms-time">9:41</span>
                  <svg viewBox="0 0 24 12" width="18" height="9" fill="currentColor"><path d="M22 1a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V2a1 1 0 011-1h1V0h2v1h14V0h2v1h1z"/></svg>
                </div>
                <div class="ms-body">
                  <div class="ms-brand">
                    <div class="ms-logo">
                      <img :src="logoSrc" alt="社群" />
                    </div>
                    <span class="ms-name">社群</span>
                  </div>
                  <div class="ms-search">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                    <span>搜索活动、商机、人脉</span>
                  </div>
                  <div class="ms-grid">
                    <div class="ms-cell" v-for="item in mockupItems" :key="item.label">
                      <div class="ms-cell-icon" :style="{ background: item.bg, color: item.color }">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path :d="item.icon"/></svg>
                      </div>
                      <span class="ms-cell-label">{{ item.label }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== Features ===== -->
      <section id="features" class="dl-features">
        <div class="sec-inner">
          <div class="sec-tag">核心功能</div>
          <h2 class="sec-title">为什么选择社群</h2>
          <p class="sec-sub">四大能力，覆盖社群经营全场景</p>
          <div class="feat-grid">
            <div class="feat-card" v-for="(f, i) in features" :key="f.title">
              <div class="feat-icon" :style="{ background: f.bg, color: f.color }">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path :d="f.icon"/></svg>
              </div>
              <div>
                <h3 class="feat-title">{{ f.title }}</h3>
                <p class="feat-desc">{{ f.desc }}</p>
              </div>
              <a class="feat-link" href="javascript:;">了解详情 →</a>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== Stats & Details ===== -->
      <section id="about" class="dl-stats">
        <div class="sec-inner stats-inner">
          <div class="stats-left">
            <div class="sec-tag">随时随地 掌控商机</div>
            <h2 class="sec-title">一部手机 · 整个社群</h2>
            <p class="stats-text">
              一部手机就能发布活动、对接商机、交换名片，实时掌握社群动态与商业机会。
            </p>
            <ul class="stats-list">
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                实时通讯，活动/商机/名片即时通知
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                一键发布与管理，活动日程不再遗漏
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                智能匹配算法，商机人脉主动找上门
              </li>
            </ul>
          </div>
          <div class="stats-right">
            <div class="stat-card">
              <span class="stat-num">12,800+</span>
              <span class="stat-label">已举办活动</span>
            </div>
            <div class="stat-card">
              <span class="stat-num">5.6万+</span>
              <span class="stat-label">商机匹配次数</span>
            </div>
            <div class="stat-card">
              <span class="stat-num">100,000+</span>
              <span class="stat-label">电子名片交换</span>
            </div>
            <div class="stat-card">
              <span class="stat-num accent">98.5%</span>
              <span class="stat-label">用户满意度</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== CTA ===== -->
      <section class="dl-cta">
        <div class="cta-card">
          <div class="cta-tag">立即开始</div>
          <h2 class="cta-title">下载 App</h2>
          <p class="cta-desc">Android 客户端，安装后即可添加到桌面，随时随地使用。</p>
          <div class="cta-actions">
            <a class="btn-primary" @click.prevent="handleDownload">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>下载 Android 版</span>
            </a>
            <a class="btn-ghost cta-ghost" @click.prevent="copyShareLink">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
              <span>复制链接</span>
            </a>
          </div>
          <div class="cta-ios-guide">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 18h6"/><path d="M12 14V8"/><path d="M9 11l3-3 3 3"/></svg>
            <div>
              <span class="guide-title">iPhone / 免安装</span>
              <span class="guide-text">使用浏览器打开本页，点击「分享」→「添加到主屏幕」即可像 App 一样使用</span>
            </div>
          </div>
          <div class="cta-version">当前版本 v{{ appVersion }} · 兼容 Android 7.0+ / iOS 12+</div>
        </div>
      </section>

      <!-- ===== Footer ===== -->
      <footer class="dl-footer">
        <div class="footer-inner">
          <div class="footer-brand">
            <div class="footer-logo">
              <img :src="logoSrc" alt="社群 App" />
            </div>
            <span>社群 App</span>
          </div>
          <div class="footer-copy">2026 社群 App · 让资源流动更简单</div>
        </div>
      </footer>
    </div>

    <!-- ===== Share Poster Modal (保留原有功能) ===== -->
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
import { useRouter } from 'vue-router'
import { ref, onMounted, nextTick } from 'vue'
import QRCode from 'qrcode'
import { getApiBase } from '@/utils/apiBase'

const router = useRouter()
function goH5Home() {
  router.push('/')
}
const BASE = import.meta.env.BASE_URL || '/h5/'
const apkUrl = `${BASE}app/shequn.apk`
const appVersion = '1.1.0'
const logoSrc = `${BASE}logo.jpg`

const features = [
  { title: '发布活动', desc: '创建社群活动，快速召集同好伙伴，沉淀私域流量。', icon: 'M3 4h18v13H3z M8 21h8M12 17v4 M16 2v4M8 2v4M3 10h18', bg: '#ede9fe', color: '#7c3aed' },
  { title: '对接商机', desc: '海量商业机会一键锁定，精准匹配同频创业者。', icon: 'M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5', bg: '#dbeafe', color: '#2563eb' },
  { title: '交换名片', desc: '电子名片扫码分享，人脉轻松沉淀到私域。', icon: 'M2 5h20v14H2z M2 10h20', bg: '#fef3c7', color: '#d97706' },
  { title: '大咖人脉', desc: '对接行业精英，结识大咖 · 交换联系方式。', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 7a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75', bg: '#d1fae5', color: '#10b981' },
]

const mockupItems = [
  { label: '发布活动', icon: 'M3 4h18v13H3z M8 21h8M12 17v4 M16 2v4M8 2v4M3 10h18', bg: '#ede9fe', color: '#7c3aed' },
  { label: '对接商机', icon: 'M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5', bg: '#dbeafe', color: '#2563eb' },
  { label: '交换名片', icon: 'M2 5h20v14H2z M2 10h20', bg: '#fef3c7', color: '#d97706' },
  { label: '大咖人脉', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 7a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75', bg: '#d1fae5', color: '#10b981' },
]

const posterOpen = ref(false)
const posterLoading = ref(false)
const posterCanvas = ref<HTMLCanvasElement | null>(null)

function buildShareUrl() {
  const apiBase = getApiBase()
  let base: string
  if (apiBase) {
    base = `${apiBase}/h5`.replace(/\/+$/, '')
  } else {
    base = `${window.location.origin}${import.meta.env.BASE_URL || ''}`.replace(/\/+$/, '')
  }
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
  const w = 600, h = 860
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 品牌渐变背景
  const grad = ctx.createLinearGradient(0, 0, w, h)
  grad.addColorStop(0, '#8b5cf6')
  grad.addColorStop(0.55, '#7c3aed')
  grad.addColorStop(1, '#6d28d9')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  // 装饰圆
  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  ctx.beginPath(); ctx.arc(w - 50, 70, 150, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(50, h - 80, 170, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(w * 0.5, h * 0.45, 90, 0, Math.PI * 2); ctx.fill()

  // Logo（圆角方形，白底）
  try {
    const logo = await loadImage(logoSrc)
    const lsize = 128, lx = (w - lsize) / 2, ly = 84
    ctx.save()
    // 圆角方形裁剪
    const r = 28
    ctx.beginPath()
    ctx.moveTo(lx + r, ly)
    ctx.lineTo(lx + lsize - r, ly)
    ctx.quadraticCurveTo(lx + lsize, ly, lx + lsize, ly + r)
    ctx.lineTo(lx + lsize, ly + lsize - r)
    ctx.quadraticCurveTo(lx + lsize, ly + lsize, lx + lsize - r, ly + lsize)
    ctx.lineTo(lx + r, ly + lsize)
    ctx.quadraticCurveTo(lx, ly + lsize, lx, ly + lsize - r)
    ctx.lineTo(lx, ly + r)
    ctx.quadraticCurveTo(lx, ly, lx + r, ly)
    ctx.closePath()
    ctx.clip()
    ctx.fillStyle = '#fff'
    ctx.fillRect(lx, ly, lsize, lsize)
    ctx.drawImage(logo, lx + 10, ly + 10, lsize - 20, lsize - 20)
    ctx.restore()
  } catch { /* ignore */ }

  // 品牌名
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.font = 'bold 58px "PingFang SC","Microsoft YaHei",sans-serif'
  ctx.fillText('社群 App', w / 2, 268)

  // 标语
  ctx.font = '26px "PingFang SC","Microsoft YaHei",sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  ctx.fillText('连接优质资源 · 成就创业梦想', w / 2, 322)

  // 功能标签行
  ctx.font = '22px "PingFang SC","Microsoft YaHei",sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.95)'
  const tags = ['发布活动', '对接商机', '交换名片', '大咖人脉']
  const tagGap = 18
  const tagW = 108
  const totalW = tags.length * tagW + (tags.length - 1) * tagGap
  let tx = (w - totalW) / 2
  const ty = 366
  tags.forEach((t) => {
    // 标签底
    ctx.fillStyle = 'rgba(255,255,255,0.16)'
    ctx.beginPath()
    ctx.roundRect(tx, ty, tagW, 44, 22)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = '21px "PingFang SC","Microsoft YaHei",sans-serif'
    ctx.fillText(t, tx + tagW / 2, ty + 30)
    tx += tagW + tagGap
  })

  // 二维码
  try {
    const qr = await QRCode.toDataURL(buildShareUrl(), { width: 280, margin: 0 })
    const qrImg = await loadImage(qr)
    const qrSize = 236, qx = (w - qrSize) / 2, qy = 460
    // 白色圆角卡片承载二维码
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.roundRect(qx - 14, qy - 14, qrSize + 28, qrSize + 28, 18)
    ctx.fill()
    ctx.drawImage(qrImg, qx, qy, qrSize, qrSize)
    ctx.fillStyle = '#7c3aed'
    ctx.font = '24px "PingFang SC","Microsoft YaHei",sans-serif'
    ctx.fillText('扫码下载 社群 App', w / 2, qy + qrSize + 52)
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
  showToast('开始下载，请稍候...')
  window.location.href = apkUrl
}

function handleIosGuide() {
  showToast('请在 Safari 中打开本页，点击「分享」→「添加到主屏幕」')
}

async function copyShareLink() {
  const url = buildShareUrl()
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url)
      showToast('链接已复制')
    } else {
      showToast('暂不支持复制')
    }
  } catch {
    showToast('复制失败')
  }
}

function handleSavePoster() {
  const canvas = posterCanvas.value
  if (!canvas) return
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '社群App_海报.png'
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
      await navigator.share({ title: '社群 App', text: '下载社群 App，连接优质资源，成就创业梦想', url })
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url)
      showToast('链接已复制')
    } else {
      showToast('暂不支持分享')
    }
  } catch { /* user cancelled */ }
}

onMounted(() => {
  document.title = '下载 App'
})
</script>

<style scoped>
/* ===== Reset / Base ===== */
.dl-page {
  font-family: 'PingFang SC', -apple-system, 'Helvetica Neue', sans-serif;
  color: #1f2937;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}
.dl-body {
  padding-top: 0;
}

/* ===== Navbar (desktop only) ===== */
.dl-navbar {
  display: none;
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0,0,0,0.06);
}
.nav-inner {
  max-width: 1200px; margin: 0 auto;
  display: flex; align-items: center; justify-content: space-between;
  height: 64px; padding: 0 32px;
}
.nav-brand { display: flex; align-items: center; gap: 10px; }
.nav-logo {
  width: 36px; height: 36px; border-radius: 10px;
  background: #fff; overflow: hidden;
  box-shadow: 0 2px 8px rgba(139,92,246,0.2);
}
.nav-logo img { width: 100%; height: 100%; object-fit: cover; }
.nav-name { font-size: 18px; font-weight: 700; color: #1f2937; }
.nav-links { display: flex; gap: 32px; }
.nav-link {
  font-size: 15px; color: #6b7280; text-decoration: none;
  transition: color 0.2s; cursor: pointer;
}
.nav-link.active, .nav-link:hover { color: #8b5cf6; }
.nav-dl-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 24px; border-radius: 99px;
  background: #8b5cf6; color: #fff;
  font-size: 14px; font-weight: 600; text-decoration: none;
  cursor: pointer; transition: background 0.2s;
}
.nav-dl-btn:hover { background: #7c3aed; }

/* ===== Hero ===== */
.dl-hero {
  position: relative;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  overflow: hidden;
  color: #fff;
  padding: 60px 24px 48px;
}
.hero-shapes { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
.hero-shapes .shape { position: absolute; border-radius: 50%; background: #fff; }
.hero-shapes .s1 { width: 260px; height: 260px; top: -80px; right: -70px; opacity: 0.12; }
.hero-shapes .s2 { width: 180px; height: 180px; bottom: -60px; left: -50px; opacity: 0.12; }
.hero-shapes .s3 { width: 100px; height: 100px; top: 60px; left: 20%; opacity: 0.10; }
.hero-inner {
  max-width: 1200px; margin: 0 auto;
  display: flex; align-items: center; justify-content: space-between;
  gap: 48px;
}
.hero-content { position: relative; z-index: 1; flex: 1; max-width: 560px; text-align: center; margin: 0 auto; }
.hero-app-icon {
  display: block;
  width: 84px; height: 84px; margin: 0 auto 18px;
  border-radius: 22px; overflow: hidden;
  background: #fff; padding: 6px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.18);
}
.hero-app-icon img { width: 100%; height: 100%; object-fit: cover; border-radius: 16px; }
.hero-tag {
  display: inline-block; margin-bottom: 16px;
  padding: 6px 16px; border-radius: 99px;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.25);
  font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.92);
}
.hero-title { font-size: 36px; font-weight: 800; line-height: 1.3; letter-spacing: -0.5px; }
.hero-desc { margin-top: 12px; font-size: 15px; line-height: 1.7; color: rgba(255,255,255,0.85); }
.hero-actions { margin-top: 28px; display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; }
.hero-version { margin-top: 16px; font-size: 12px; color: rgba(255,255,255,0.7); }
.hero-share {
  display: inline-flex; align-items: center; gap: 6px;
  margin-top: 14px;
  padding: 8px 18px; border-radius: 99px;
  background: rgba(255,255,255,0.14);
  border: 1px solid rgba(255,255,255,0.3);
  color: #fff; font-size: 13px; font-weight: 600;
  text-decoration: none; cursor: pointer;
  transition: background 0.2s;
}
.hero-share:hover { background: rgba(255,255,255,0.24); }
.hero-share svg { width: 16px; height: 16px; }

/* Buttons */
.btn-primary {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 14px 32px; border-radius: 99px;
  background: #fff; color: #7c3aed;
  font-size: 15px; font-weight: 700; text-decoration: none;
  box-shadow: 0 6px 20px rgba(0,0,0,0.15);
  cursor: pointer; transition: transform 0.15s, box-shadow 0.2s;
}
.btn-primary:active { transform: scale(0.96); }
.btn-primary svg { width: 20px; height: 20px; }
.btn-link-h5 {
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  width: 100%; padding: 16px 24px; border-radius: 16px;
  font-size: 16px; font-weight: 700; color: #fff; text-decoration: none;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 10px 24px rgba(16,185,129,0.35);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}
.btn-link-h5 svg { width: 22px; height: 22px; }
.btn-link-h5:active { transform: translateY(1px) scale(0.99); box-shadow: 0 4px 12px rgba(16,185,129,0.28); }
.btn-ghost {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 14px 28px; border-radius: 99px;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.3);
  color: #fff; font-size: 15px; font-weight: 600; text-decoration: none;
  cursor: pointer; transition: background 0.2s;
}
.btn-ghost:hover { background: rgba(255,255,255,0.2); }
.btn-ghost svg { width: 20px; height: 20px; }

/* ===== Phone Mockup (desktop) ===== */
.hero-mockup { display: none; }
@media (min-width: 768px) {
  .hero-mockup {
    display: block; flex-shrink: 0;
    position: relative; z-index: 1;
  }
  .mockup-body {
    width: 280px; height: 520px;
    background: #1a1a2e; border-radius: 36px;
    padding: 10px; position: relative;
    box-shadow: 0 24px 60px rgba(0,0,0,0.3);
  }
  .mockup-notch {
    position: absolute; top: 14px; left: 50%; transform: translateX(-50%);
    width: 90px; height: 18px; background: #1a1a2e; border-radius: 0 0 12px 12px;
    z-index: 2;
  }
  .mockup-screen {
    width: 100%; height: 100%;
    background: #fff; border-radius: 28px;
    overflow: hidden; display: flex; flex-direction: column;
  }
  .ms-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 16px 4px; color: #1f2937;
  }
  .ms-time { font-size: 12px; font-weight: 700; }
  .ms-body { flex: 1; padding: 10px 14px 14px; }
  .ms-brand { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
  .ms-logo {
    width: 32px; height: 32px; border-radius: 8px; overflow: hidden;
    background: #ede9fe;
  }
  .ms-logo img { width: 100%; height: 100%; object-fit: cover; }
  .ms-name { font-size: 16px; font-weight: 700; color: #1f2937; }
  .ms-search {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 12px; border-radius: 99px;
    background: #f3f4f6; color: #9ca3af;
    font-size: 12px; margin-bottom: 14px;
  }
  .ms-search svg { width: 14px; height: 14px; }
  .ms-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
  }
  .ms-cell {
    padding: 8px; border-radius: 10px;
    background: #f9fafb; display: flex; flex-direction: column;
    align-items: center; gap: 4px; text-align: center;
  }
  .ms-cell-icon {
    width: 32px; height: 32px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
  }
  .ms-cell-icon svg { width: 16px; height: 16px; }
  .ms-cell-label { font-size: 10px; color: #6b7280; font-weight: 500; }
}

/* ===== Section Common ===== */
.sec-inner {
  max-width: 1200px; margin: 0 auto; padding: 60px 24px;
}
.sec-tag {
  display: inline-block; margin-bottom: 12px;
  padding: 5px 14px; border-radius: 99px;
  background: #ede9fe; color: #8b5cf6;
  font-size: 13px; font-weight: 600;
}
.sec-title {
  font-size: 24px; font-weight: 800; color: #1f2937;
  line-height: 1.3; margin-bottom: 8px;
}
.sec-sub { font-size: 14px; color: #6b7280; }

/* ===== Features ===== */
.dl-features { background: #f8fafc; }
.sec-inner { text-align: center; }
.feat-grid {
  margin-top: 32px;
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
  text-align: left;
}
.feat-card {
  padding: 20px;
  background: #fff; border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  transition: box-shadow 0.2s;
  display: flex; flex-direction: column;
}
.feat-icon {
  width: 48px; height: 48px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 14px;
}
.feat-icon svg { width: 24px; height: 24px; }
.feat-title { font-size: 17px; font-weight: 700; color: #1f2937; margin-bottom: 6px; }
.feat-desc { font-size: 13px; color: #6b7280; line-height: 1.6; }
.feat-link {
  display: inline-block; margin-top: auto; padding-top: 10px;
  font-size: 13px; color: #8b5cf6; font-weight: 600; text-decoration: none;
}

/* ===== Stats ===== */
.dl-stats { background: #fff; }
.stats-inner { display: flex; flex-direction: column; gap: 40px; text-align: left; }
.stats-left { flex: 1; }
.stats-text { margin-top: 12px; font-size: 14px; color: #6b7280; line-height: 1.8; }
.stats-list { margin-top: 20px; list-style: none; }
.stats-list li {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 12px; font-size: 14px; color: #374151;
}
.stats-list li svg { width: 18px; height: 18px; flex-shrink: 0; color: #8b5cf6; }
.stats-right {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
}
.stat-card {
  padding: 20px 16px; border-radius: 16px;
  background: #f8fafc; text-align: center;
  display: flex; flex-direction: column; gap: 6px;
}
.stat-num {
  font-size: 26px; font-weight: 800; color: #8b5cf6;
  letter-spacing: -0.5px;
}
.stat-num.accent { color: #34d399; }
.stat-label { font-size: 12px; color: #6b7280; }

/* ===== CTA ===== */
.dl-cta {
  padding: 0 24px 40px;
  background: #f8fafc;
}
.cta-card {
  max-width: 1200px; margin: 0 auto;
  padding: 48px 24px;
  background: linear-gradient(135deg, #6d28d9 0%, #5b21b6 100%);
  border-radius: 28px;
  text-align: center; color: #fff;
}
.cta-tag {
  display: inline-block; margin-bottom: 12px;
  padding: 5px 14px; border-radius: 99px;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.2);
  font-size: 13px; font-weight: 500;
}
.cta-title { font-size: 28px; font-weight: 800; }
.cta-desc { margin: 10px auto 24px; max-width: 500px; font-size: 14px; color: rgba(255,255,255,0.8); line-height: 1.7; }
.cta-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; }
.cta-ghost { background: rgba(255,255,255,0.1); }
.cta-ios-guide {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  margin: 18px auto 0; max-width: 460px;
  padding: 12px 18px; border-radius: 14px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.15);
  text-align: left;
}
.cta-ios-guide svg { width: 22px; height: 22px; flex-shrink: 0; opacity: 0.9; }
.cta-ios-guide div { display: flex; flex-direction: column; gap: 2px; }
.guide-title { font-size: 14px; font-weight: 700; color: #fff; }
.guide-text { font-size: 12px; color: rgba(255,255,255,0.75); line-height: 1.5; }
.cta-version { margin-top: 16px; font-size: 12px; color: rgba(255,255,255,0.65); }

/* ===== Footer ===== */
.dl-footer {
  background: #fff; border-top: 1px solid #f3f4f6;
}
.footer-inner {
  max-width: 1200px; margin: 0 auto;
  display: flex; flex-direction: column; align-items: center; gap: 16px;
  padding: 32px 24px; text-align: center;
}
.footer-brand { display: flex; align-items: center; gap: 8px; }
.footer-logo {
  width: 28px; height: 28px; border-radius: 7px; overflow: hidden;
  background: #ede9fe;
}
.footer-logo img { width: 100%; height: 100%; object-fit: cover; }
.footer-brand span { font-size: 15px; font-weight: 700; color: #1f2937; }
.footer-links { display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; }
.footer-links a {
  font-size: 13px; color: #6b7280; text-decoration: none;
  transition: color 0.2s; cursor: pointer;
}
.footer-links a:hover { color: #8b5cf6; }
.footer-copy { font-size: 12px; color: #9ca3af; }

/* ===== Poster Modal ===== */
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
  background: rgba(255,255,255,0.85); color: #8b5cf6; font-size: 14px;
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
.poster-btn.primary { background: #8b5cf6; color: #fff; }
.poster-fade-enter-active, .poster-fade-leave-active { transition: opacity 0.2s ease; }
.poster-fade-enter-from, .poster-fade-leave-to { opacity: 0; }

/* ===== Responsive ===== */

/* Tablet + */
@media (min-width: 640px) {
  .hero-title { font-size: 42px; }
  .feat-grid { grid-template-columns: 1fr 1fr; }
  .sec-title { font-size: 28px; }
  .cta-title { font-size: 32px; }
}
@media (min-width: 768px) {
  .hero-content { text-align: left; margin: 0; }
  .hero-app-icon { display: none; }
  .hero-actions { justify-content: flex-start; }
  .dl-hero { padding: 80px 32px 64px; }
  .hero-title { font-size: 48px; }
  .stats-inner { flex-direction: row; align-items: center; }
  .stats-right { min-width: 380px; }
  .stat-num { font-size: 30px; }
  .feat-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 1024px) {
  .dl-navbar { display: block; }
  .dl-body { padding-top: 64px; }
  .dl-hero { padding: 100px 32px 80px; }
  .hero-title { font-size: 52px; }
  .feat-grid { grid-template-columns: repeat(4, 1fr); }
  .sec-inner { padding: 80px 32px; }
  .dl-cta { padding: 0 32px 60px; }
  .cta-card { padding: 64px 32px; }
  .cta-title { font-size: 36px; }
}
</style>