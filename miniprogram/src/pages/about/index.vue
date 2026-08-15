<template>
  <view :style="sbStyle" class="phone-frame about-page">
    <!-- Header -->
    <view class="header">
      <view class="header-left">
        <view class="back-btn" @click="$router.back()">
          <image :src="iconBack" mode="aspectFit" />
        </view>
        <text class="header-title">关于我们</text>
      </view>
    </view>

    <!-- Content -->
    <view class="content-wrap">
      <view v-if="loading" class="loading-state"><text>加载中...</text></view>

      <!-- 后台配置的是跳转链接：小程序无法直接打开外链，提供复制链接 -->
      <view v-else-if="linkUrl" class="link-card">
        <text class="link-label">官网链接</text>
        <text class="link-text">{{ linkUrl }}</text>
        <button class="copy-btn" @click="copyLink">复制链接</button>
        <text class="link-tip">链接已复制后，请在浏览器中打开</text>
      </view>

      <view v-else-if="!contentHtml" class="empty-state">
        <image :src="iconEmpty" mode="aspectFit" />
        <text>暂无内容，敬请期待</text>
      </view>
      <view v-else class="rich-content" v-html="contentHtml"></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { sbStyle } from '@/utils/sb'
import { ref, computed, onMounted } from 'vue'
import { getSystemConfig } from '@/api/index'
import { normalizeImageUrl } from '@/utils/image'
import { svgUri } from '@/utils/svg'
import { copyText } from '@/utils/share'

const iconBack = svgUri('<path d="M19 12H5M12 19l-7-7 7-7"/>', { color: '#1e1b4b' })
const iconEmpty = svgUri('<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>', { color: '#9ca3af', strokeWidth: '1.5' })

const loading = ref(true)
const contentHtml = ref('')

// 若后台直接配置了跳转链接（而非富文本），小程序不能打开外链，改为复制链接
const linkUrl = computed(() => {
  const v = (contentHtml.value || '').trim()
  return /^https?:\/\/[^\s<>"]+$/i.test(v) ? v : ''
})

/**
 * 将富文本内容中的资源地址（图片等 src）规范化：
 * - 相对路径 /uploads/xxx、/api/uploads/xxx → 由 normalizeImageUrl 补全为绝对地址
 * - http://localhost:3000/... 历史脏数据 → 一并规范化
 * - 完整外部 https/http 地址保持原样
 */
function normalizeImageUrls(html: string): string {
  if (!html) return ''
  return html.replace(/(src=["'])([^"']+)(["'])/gi, (_, p, url, s) => `${p}${normalizeImageUrl(url)}${s}`)
}

async function loadAboutUs() {
  loading.value = true
  try {
    const res: any = await getSystemConfig('about_us')
    contentHtml.value = normalizeImageUrls(res?.value || '')
  } catch (err: any) {
    console.error('加载关于我们失败:', err)
  } finally {
    loading.value = false
  }
}

async function copyLink() {
  const ok = await copyText(linkUrl.value)
  uni.showToast({ title: ok ? '链接已复制，请在浏览器打开' : '复制失败，请重试', icon: 'none' })
}

onMounted(() => {
  loadAboutUs()
})
</script>

<style scoped>
.about-page { background: #f5f6fa; display: flex; flex-direction: column; min-height: 100vh; }

.header {
  position: sticky; top: var(--sbh, 0px); z-index: 100;
  background: #ffffff;
  border-bottom: 0.5px solid rgba(60,60,67,0.1);
  padding: 10px 16px;
  display: flex; align-items: center; justify-content: space-between;
}
.header-left { display: flex; align-items: center; gap: 12px; }
.back-btn {
  width: 32px; height: 32px; border-radius: 50%;
  background: rgba(0,0,0,0.05); display: flex; align-items: center; justify-content: center;
}
.back-btn:active { background: rgba(0,0,0,0.1); }
.back-btn image { width: 20px; height: 20px; }
.header-title { font-size: 18px; font-weight: 700; color: #1e1b4b; }

.content-wrap {
  flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
  padding: 16px;
}

.rich-content {
  background: #ffffff;
  border-radius: 16px;
  padding: 20px 18px;
  min-height: 300px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  font-size: 15px;
  line-height: 1.8;
  color: #374151;
  word-break: break-word;
}

/* 富文本内部样式由 sanitizeRichHtml 内联处理（小程序 rich-text 不可被页面 CSS 穿透） */

.empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 80px 20px; color: #9ca3af;
}
.empty-state image { width: 48px; height: 48px; margin-bottom: 12px; }
.empty-state text { font-size: 14px; }

.loading-state {
  display: flex; align-items: center; justify-content: center;
  padding: 80px 20px; color: #9ca3af; font-size: 14px;
}

.link-card {
  background: #ffffff; border-radius: 16px; padding: 24px 20px;
  display: flex; flex-direction: column; align-items: center;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}
.link-label { font-size: 16px; font-weight: 700; color: #1e1b4b; margin-bottom: 10px; }
.link-text { font-size: 13px; color: #6366f1; word-break: break-all; text-align: center; margin-bottom: 16px; }
.copy-btn {
  padding: 10px 36px; border: none; border-radius: 99px;
  background: var(--color-primary); color: #fff;
  font-size: 14px; font-weight: 600;
}
.copy-btn:active { opacity: 0.9; }
.link-tip { font-size: 11px; color: #9ca3af; margin-top: 10px; }
</style>
