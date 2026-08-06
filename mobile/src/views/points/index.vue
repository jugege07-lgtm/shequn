<template>
  <div class="phone-frame">
    <div class="header">
      <div class="header-left">
        <div class="back-btn" @click="$router.push('/profile/index')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </div>
        <span class="header-title">我的积分</span>
      </div>
    </div>

    <!-- Points Balance Card -->
    <div class="points-hero">
      <div class="points-total">{{ points }}</div>
      <div class="points-label">我的积分</div>
      <div class="points-actions">
        <div class="action-item" @click="$router.push('/coupon/claim')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          <span>领券中心</span>
        </div>
        <div class="action-item" @click="$router.push('/coupon/index')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 12V8H6a2 2 0 01-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 100-4 2 2 0 000 4z"/></svg>
          <span>我的优惠券</span>
        </div>
      </div>
    </div>

    <!-- How to Earn -->
    <div class="section">
      <div class="section-title">如何赚取积分</div>
      <div class="earn-grid">
        <div class="earn-item" v-for="r in rules" :key="r.action">
          <div class="earn-icon">🎯</div>
          <div class="earn-name">{{ r.name }}</div>
          <div class="earn-points">+{{ r.points }}分</div>
        </div>
      </div>
    </div>

    <!-- Point Logs -->
    <div class="section">
      <div class="section-title">积分明细</div>
      <div class="log-list" v-loading="loading">
        <div v-if="logs.length === 0" class="empty-tip">暂无记录</div>
        <div class="log-item" v-for="log in logs" :key="log.id">
          <div class="log-info">
            <div class="log-action">{{ log.action }}</div>
            <div class="log-remark">{{ log.remark }}</div>
          </div>
          <div class="log-points" :class="log.points > 0 ? 'plus' : 'minus'">
            {{ log.points > 0 ? '+' : '' }}{{ log.points }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getMyPoints, getMyPointLogs, getPointRules } from '@/api'

const points = ref(0)
const loading = ref(false)
const logs = ref<any[]>([])
const rules = ref<any[]>([])

async function loadPoints() {
  try {
    const data = await getMyPoints()
    if (data) points.value = data.points ?? 0
  } catch {}
}

async function loadLogs() {
  loading.value = true
  try {
    const data = await getMyPointLogs({ page: 1, size: 50 })
    if (data?.list) logs.value = data.list
  } catch { logs.value = [] }
  finally { loading.value = false }
}

async function loadRules() {
  try {
    const data = await getPointRules({ page: 1, size: 20 })
    if (data?.list) rules.value = data.list
  } catch {}
}

onMounted(() => { loadPoints(); loadLogs(); loadRules() })
</script>

<style scoped>
@import '@/styles/global.css';

.header { position: sticky; top: 0; z-index: 100; background: #fff; border-bottom: 0.5px solid #eee; padding: 10px 16px; display: flex; align-items: center; }
.header-left { display: flex; align-items: center; gap: 12px; }
.back-btn { width: 32px; height: 32px; border-radius: 50%; background: #f5f5f5; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.back-btn svg { width: 18px; height: 18px; color: #333; }
.header-title { font-size: 18px; font-weight: 700; color: #1e1b4b; }

.points-hero {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  padding: 32px 24px 24px; color: #fff; text-align: center;
}
.points-total { font-size: 48px; font-weight: 800; line-height: 1; }
.points-label { font-size: 14px; opacity: 0.8; margin-top: 4px; }
.points-actions { display: flex; gap: 16px; justify-content: center; margin-top: 20px; }
.action-item { display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 12px; cursor: pointer; }
.action-item svg { width: 24px; height: 24px; opacity: 0.9; }

.section { padding: 16px; }
.section-title { font-size: 15px; font-weight: 700; color: #1e1b4b; margin-bottom: 12px; }

.earn-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.earn-item { background: #fff; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; align-items: center; gap: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
.earn-icon { font-size: 24px; }
.earn-name { font-size: 12px; color: #666; }
.earn-points { font-size: 14px; font-weight: 700; color: #6366f1; }

.log-list { display: flex; flex-direction: column; gap: 8px; }
.empty-tip { text-align: center; padding: 40px 0; color: #999; font-size: 14px; }

.log-item { display: flex; align-items: center; justify-content: space-between; background: #fff; border-radius: 10px; padding: 12px 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
.log-action { font-size: 13px; font-weight: 600; color: #333; }
.log-remark { font-size: 11px; color: #999; margin-top: 2px; }
.log-points { font-size: 16px; font-weight: 700; }
.log-points.plus { color: #6366f1; }
.log-points.minus { color: #ef4444; }
</style>
