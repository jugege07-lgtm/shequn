<template>
  <div class="phone-frame about-page">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <div class="back-btn" @click="$router.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </div>
        <span class="header-title">关于我们</span>
      </div>
    </div>

    <!-- Content -->
    <div class="content-wrap" v-loading="loading">
      <div v-if="!loading && !contentHtml" class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4M12 8h.01"/>
        </svg>
        <span>暂无内容，敬请期待</span>
      </div>
      <div v-else class="rich-content" v-html="contentHtml"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getSystemConfig } from '@/api/index'

const loading = ref(true)
const contentHtml = ref('')

/**
 * 将富文本内容中的图片地址规范化为同域名可访问的相对路径：
 * - /uploads/xxx              → /api/uploads/xxx（生产环境经 Caddy 转发到后端静态服务）
 * - http://localhost:3000/... → /api/...（清洗历史脏数据）
 * - 完整 https/http 域名地址保持原样
 */
function normalizeImageUrls(html: string): string {
  if (!html) return ''
  return html
    .replace(/(src=["'])(\/uploads\/[^"']+)(["'])/g, (_, p, path, s) => `${p}/api${path}${s}`)
    .replace(/(src=["'])http:\/\/localhost:\d+(\/[^"']+)(["'])/g, (_, p, path, s) => `${p}${path}${s}`)
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

onMounted(() => {
  document.title = '关于我们'
  loadAboutUs()
})
</script>

<style scoped>
@import '@/styles/global.css';

.about-page { background: #f5f6fa; display: flex; flex-direction: column; }

.header {
  position: sticky; top: 0; z-index: 100;
  background: #ffffff;
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-bottom: 0.5px solid rgba(60,60,67,0.1);
  margin-top: calc(env(safe-area-inset-top, 0px) * -1);
  padding: calc(env(safe-area-inset-top, 0px) + 10px) 16px 10px;
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

/* 覆盖富文本中可能存在的样式 */
.rich-content :deep(h1) { font-size: 22px; font-weight: 700; margin: 16px 0 10px; color: #1f2937; }
.rich-content :deep(h2) { font-size: 19px; font-weight: 700; margin: 14px 0 8px; color: #1f2937; }
.rich-content :deep(h3) { font-size: 17px; font-weight: 700; margin: 12px 0 6px; color: #1f2937; }
.rich-content :deep(p) { margin: 8px 0; }
.rich-content :deep(img) { max-width: 100%; border-radius: 10px; margin: 10px 0; display: block; }
.rich-content :deep(ul), .rich-content :deep(ol) { padding-left: 22px; margin: 8px 0; }
.rich-content :deep(li) { margin: 4px 0; }
.rich-content :deep(a) { color: #6366f1; text-decoration: none; }
.rich-content :deep(blockquote) {
  border-left: 3px solid #6366f1;
  padding-left: 12px;
  margin: 10px 0;
  color: #6b7280;
  background: #f9fafb;
  padding: 10px 12px;
  border-radius: 0 8px 8px 0;
}

.empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 80px 20px; color: #9ca3af;
}
.empty-state svg { width: 48px; height: 48px; margin-bottom: 12px; }
.empty-state span { font-size: 14px; }
</style>
