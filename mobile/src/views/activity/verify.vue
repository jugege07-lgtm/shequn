<template>
  <div class="phone-frame">
    <div class="header">
      <div class="header-left">
        <div class="back-btn" @click="$router.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m15 18-6-6 6-6"/></svg>
        </div>
        <span class="header-title">活动核销</span>
      </div>
    </div>

    <div class="main-scroll" v-loading="loading">
      <div class="result-card">
        <div class="status-icon" :class="resultClass">
          <svg v-if="resultType === 'success'" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <svg v-else-if="resultType === 'warning'" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
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
import { useRoute, useRouter } from 'vue-router'
import { verifySignup } from '@/api'

const route = useRoute()
const router = useRouter()

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

function formatDate(d: string) {
  return d ? new Date(d).toLocaleString('zh-CN') : '-'
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
@import '@/styles/global.css';

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
.status-icon svg { width: 36px; height: 36px; }

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
