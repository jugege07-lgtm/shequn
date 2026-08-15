<template>
  <div class="phone-frame">
    <div class="header">
      <div class="header-left">
        <div class="back-btn" @click="$router.back()">
          <image :src="iconBack" />
        </div>
        <span class="header-title">活动核销</span>
      </div>
    </div>

    <div class="main-scroll">
      <div class="empty-loading" v-if="loading">核销中...</div>
      <div class="result-card" v-else>
        <div class="status-icon" :class="resultClass">
          <image v-if="resultType === 'success'" :src="iconSuccess" />
          <image v-else-if="resultType === 'warning'" :src="iconWarning" />
          <image v-else :src="iconError" />
        </div>
        <h2 class="status-title">{{ resultTitle }}</h2>
        <p class="status-desc">{{ resultMessage }}</p>

        <div v-if="activityTitle" class="info-block">
          <div class="info-label">活动名称</div>
          <div class="info-value">{{ activityTitle }}</div>
        </div>
        <div v-if="checkedInAt" class="info-block">
          <div class="info-label">核销时间</div>
          <div class="info-value">{{ formatDate(checkedInAt) }}</div>
        </div>

        <div class="action-wrap">
          <button v-if="resultType === 'success'" class="btn btn-primary btn-full" @click="$router.replace('/activity/list')">返回活动列表</button>
          <button v-else-if="resultType === 'warning' && code === 'ALREADY_CHECKED_IN'" class="btn btn-primary btn-full" @click="$router.replace('/activity/list')">返回活动列表</button>
          <button v-else class="btn btn-outline btn-full" @click="$router.replace('/activity/list')">去报名</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { verifySignup } from '@/api'
import { svgUri } from '@/utils/svg'

const route = useRoute()

// 图标（内联 svg → data URI；原 stroke="#fff" 保持白色，线宽 3）
const iconBack = svgUri('<path d="m15 18-6-6 6-6"/>', { color: '#1e1b4b' })
const iconSuccess = svgUri('<polyline points="20 6 9 17 4 12"/>', { color: '#ffffff', strokeWidth: '3' })
const iconWarning = svgUri('<path d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>', { color: '#ffffff', strokeWidth: '3' })
const iconError = svgUri('<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>', { color: '#ffffff', strokeWidth: '3' })

const loading = ref(true)
const resultType = ref<'success' | 'warning' | 'error'>('error')
const resultTitle = ref('核销失败')
const resultMessage = ref('二维码无效或活动不存在')
const code = ref('')
const activityTitle = ref('')
const checkedInAt = ref('')

const resultClass = computed(() => ({
  success: resultType.value === 'success',
  warning: resultType.value === 'warning',
  error: resultType.value === 'error',
}))

// toLocaleString 在小程序 iOS 上表现不稳定，手动格式化
function formatDate(d: string) {
  if (!d) return '-'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return d
  const p = (n: number) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())} ${p(dt.getHours())}:${p(dt.getMinutes())}:${p(dt.getSeconds())}`
}

onMounted(async () => {
  const id = Number(route.query.id)
  const token = String(route.query.t || '')
  if (!id || !token) {
    resultType.value = 'error'
    resultTitle.value = '参数错误'
    resultMessage.value = '二维码链接缺少活动信息，请重新扫描'
    loading.value = false
    return
  }

  try {
    const res: any = await verifySignup(id, token)
    if (res?.success) {
      resultType.value = 'success'
      resultTitle.value = '核销成功'
      resultMessage.value = res.message || '您已成功完成活动核销'
      activityTitle.value = res.activityTitle || ''
      checkedInAt.value = res.checkedInAt || ''
    } else {
      code.value = res?.code || ''
      activityTitle.value = res?.activityTitle || ''
      if (res?.code === 'ALREADY_CHECKED_IN') {
        resultType.value = 'warning'
        resultTitle.value = '已核销'
        resultMessage.value = res.message || '您已完成核销，无需重复核销'
        checkedInAt.value = res.checkedInAt || ''
      } else if (res?.code === 'NOT_SIGNED_UP') {
        resultType.value = 'error'
        resultTitle.value = '未报名'
        resultMessage.value = res.message || '您尚未报名该活动，无法核销'
      } else {
        resultType.value = 'error'
        resultTitle.value = '核销失败'
        resultMessage.value = res?.message || '核销失败，请重试'
      }
    }
  } catch (err: any) {
    resultType.value = 'error'
    resultTitle.value = '核销失败'
    resultMessage.value = err.message || '网络异常，请稍后重试'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.empty-loading { padding: 80px 0; text-align: center; font-size: 14px; color: var(--color-text-tertiary); }

.result-card {
  margin: 24px 16px;
  padding: 32px 20px;
  border-radius: var(--radius-xl);
  background: rgba(255,255,255,0.75);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.5);
  box-shadow: var(--glass-shadow);
  text-align: center;
}

.status-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}
.status-icon.success { background: var(--color-success); }
.status-icon.warning { background: var(--color-warning); }
.status-icon.error { background: var(--color-danger); }
.status-icon image { width: 36px; height: 36px; }

.status-title {
  font-size: 20px;
  font-weight: 800;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}
.status-desc {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin-bottom: 24px;
}

.info-block {
  text-align: left;
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255,255,255,0.5);
}
.info-label {
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin-bottom: 4px;
}
.info-value {
  font-size: 14px;
  color: var(--color-text-primary);
  font-weight: 600;
  word-break: break-word;
}

.action-wrap {
  margin-top: 24px;
}
</style>
