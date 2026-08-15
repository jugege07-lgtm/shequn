<template>
  <div class="phone-frame">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <div class="back-btn" @click="$router.push('/profile/index')">
          <image class="back-icon" :src="iconBack" mode="aspectFit" />
        </div>
        <span class="header-title">优惠券</span>
      </div>
    </div>

    <!-- Tab Bar -->
    <div class="tabs">
      <div class="tab" :class="{ active: activeTab === 'available' }" @click="activeTab = 'available'">可用</div>
      <div class="tab" :class="{ active: activeTab === 'used' }" @click="activeTab = 'used'">已使用</div>
      <div class="tab" :class="{ active: activeTab === 'expired' }" @click="activeTab = 'expired'">已过期</div>
    </div>

    <!-- Coupon List -->
    <div class="coupon-list">
      <div v-if="coupons.length === 0" class="empty-tip">暂无优惠券</div>
      <div class="coupon-card" v-for="c in coupons" :key="c.id" :class="'state-' + c.status">
        <div class="coupon-left">
          <div class="coupon-value">
            <template v-if="c.coupon.type === 'percent'">
              <span class="value-num">{{ formatPercent(c.coupon.value) }}</span><span class="value-unit">折</span>
            </template>
            <template v-else>
              <span class="value-unit">¥</span><span class="value-num">{{ c.coupon.value }}</span>
            </template>
          </div>
          <div class="coupon-condition">{{ c.coupon.minAmount > 0 ? '满¥' + c.coupon.minAmount + '可用' : '无门槛' }}</div>
          <div v-if="c.coupon.type === 'percent' && c.coupon.discountCap" class="coupon-cap">
            最高减 ¥{{ c.coupon.discountCap }}
          </div>
        </div>
        <div class="coupon-divider"></div>
        <div class="coupon-right">
          <div class="coupon-name">{{ c.coupon.name }}</div>
          <div class="coupon-desc">{{ c.coupon.description || '' }}</div>
          <div class="coupon-time">有效期至 {{ formatDate(c.expiresAt) }}</div>
          <div class="coupon-status" :class="c.status">{{ statusText(c.status) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { getUserCoupons } from '@/api'
import { svgUri } from '@/utils/svg'

const iconBack = svgUri('<path d="M19 12H5M12 19l-7-7 7-7"/>', { color: '#333' })

const activeTab = ref('available')
const loading = ref(false)
const coupons = ref<any[]>([])

const tabToStatus: Record<string, string> = { available: 'unused', used: 'used', expired: 'expired' }

async function loadCoupons() {
  loading.value = true
  try {
    const status = tabToStatus[activeTab.value]
    const data = await getUserCoupons({ status, page: 1, size: 50 })
    if (data?.list) coupons.value = data.list
  } catch {
    coupons.value = []
  } finally {
    loading.value = false
  }
}

function formatDate(d: string) {
  if (!d) return ''
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return ''
  return `${dt.getFullYear()}-${(dt.getMonth() + 1).toString().padStart(2, '0')}-${dt.getDate().toString().padStart(2, '0')}`
}

function formatPercent(v: number) {
  const n = Number(v)
  if (Number.isNaN(n)) return '-'
  return (n * 10).toFixed(1).replace(/\.0$/, '')
}

function statusText(s: string) {
  return { unused: '可用', used: '已使用', expired: '已过期' }[s] || s
}

onMounted(loadCoupons)
watch(activeTab, loadCoupons)
</script>

<style scoped>
.header { position: sticky; top: 0; z-index: 100; background: #fff; border-bottom: 0.5px solid #eee; padding: calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) + 10px) 16px 10px; display: flex; align-items: center; }
.header-left { display: flex; align-items: center; gap: 12px; }
.back-btn { width: 32px; height: 32px; border-radius: 50%; background: #f5f5f5; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.back-icon { width: 18px; height: 18px; }
.header-title { font-size: 18px; font-weight: 700; color: #1e1b4b; }

.tabs { display: flex; background: #fff; border-bottom: 1px solid #eee; padding: 0 16px; }
.tab { flex: 1; text-align: center; padding: 12px 0; font-size: 14px; color: #666; cursor: pointer; position: relative; transition: color 0.2s; }
.tab.active { color: #6366f1; font-weight: 600; }
.tab.active::after { content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 24px; height: 3px; background: #6366f1; border-radius: 2px; }

.coupon-list { padding: 12px 16px; display: flex; flex-direction: column; gap: 12px; }
.empty-tip { text-align: center; padding: 60px 0; color: #999; font-size: 14px; }

.coupon-card {
  display: flex; background: #fff; border-radius: 12px; overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px dashed #e0d4f5;
}
.coupon-left {
  width: 110px; min-height: 110px;
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 16px 8px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; position: relative;
}
.coupon-left::after {
  content: ''; position: absolute; right: -8px; top: 50%;
  transform: translateY(-50%);
  width: 16px; height: 16px; border-radius: 50%; background: #f0f2f8;
}
.coupon-value { display: flex; align-items: baseline; gap: 2px; line-height: 1; }
.coupon-value .value-num { font-size: 30px; font-weight: 800; }
.coupon-value .value-unit { font-size: 13px; font-weight: 600; }
.coupon-condition { font-size: 11px; margin-top: 8px; opacity: 0.85; }
.coupon-cap { font-size: 10px; margin-top: 4px; opacity: 0.75; }
.coupon-card.state-used .coupon-left,
.coupon-card.state-expired .coupon-left { background: linear-gradient(135deg, #94a3b8, #64748b); }
.coupon-card.state-used,
.coupon-card.state-expired { opacity: 0.7; }

.coupon-divider { width: 1px; background: repeating-linear-gradient(180deg, #ccc 0, #ccc 4px, transparent 4px, transparent 8px); margin-top: 16px; }

.coupon-right { flex: 1; padding: 14px 16px; display: flex; flex-direction: column; justify-content: space-between; }
.coupon-name { font-size: 14px; font-weight: 600; color: #1e1b4b; margin-bottom: 4px; }
.coupon-desc { font-size: 11px; color: #999; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.coupon-time { font-size: 11px; color: #999; }
.coupon-status { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 10px; width: fit-content; margin-top: 4px; }
.coupon-status.unused { color: #6366f1; background: #eef2ff; }
.coupon-status.used { color: #999; background: #f5f5f5; }
.coupon-status.expired { color: #ccc; background: #f9f9f9; }
</style>
