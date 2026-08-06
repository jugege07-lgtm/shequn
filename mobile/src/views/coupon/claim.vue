<template>
  <div class="phone-frame">
    <div class="header">
      <div class="header-left">
        <div class="back-btn" @click="$router.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </div>
        <span class="header-title">领券中心</span>
      </div>
    </div>

    <div class="coupon-grid" v-loading="loading">
      <div v-if="coupons.length === 0" class="empty-tip">暂无可领优惠券</div>
      <div class="coupon-item" v-for="c in coupons" :key="c.id" @click="handleClaim(c)">
        <div class="coupon-item-left">
          <div class="coupon-item-value">{{ c.value }}<span v-if="c.type === 'percent'">%</span></div>
          <div class="coupon-item-unit" v-if="c.type === 'fixed'">元</div>
          <div class="coupon-item-condition">{{ c.minAmount > 0 ? '满' + c.minAmount + '可用' : '无门槛' }}</div>
        </div>
        <div class="coupon-item-divider"></div>
        <div class="coupon-item-right">
          <div class="coupon-item-name">{{ c.name }}</div>
          <div class="coupon-item-desc">{{ c.description || '' }}</div>
          <div class="coupon-item-info">
            <span>剩{{ c.totalQty - c.claimedQty }}张</span>
            <span>领后{{ c.validDays }}天有效</span>
          </div>
          <button class="claim-btn" :disabled="claiming">立即领取</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getCoupons, claimCoupon } from '@/api'

const loading = ref(false)
const claiming = ref(false)
const coupons = ref<any[]>([])

async function loadCoupons() {
  loading.value = true
  try {
    const data = await getCoupons({ page: 1, size: 50 })
    if (data?.list) coupons.value = data.list
  } catch { coupons.value = [] }
  finally { loading.value = false }
}

async function handleClaim(c: any) {
  if (claiming.value) return
  claiming.value = true
  try {
    await claimCoupon(c.id)
    showToast('领取成功！')
    loadCoupons()
  } catch (err: any) {
    showToast(err.message || '领取失败')
  } finally {
    claiming.value = false
  }
}

function showToast(msg: string) {
  const el = document.createElement('div')
  el.textContent = msg
  el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,.78);color:#fff;padding:12px 28px;border-radius:12px;font-size:14px;z-index:9999;white-space:nowrap'
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 2000)
}

onMounted(loadCoupons)
</script>

<style scoped>
@import '@/styles/global.css';

.header { position: sticky; top: 0; z-index: 100; background: #fff; border-bottom: 0.5px solid #eee; padding: 10px 16px; display: flex; align-items: center; }
.header-left { display: flex; align-items: center; gap: 12px; }
.back-btn { width: 32px; height: 32px; border-radius: 50%; background: #f5f5f5; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.back-btn svg { width: 18px; height: 18px; color: #333; }
.header-title { font-size: 18px; font-weight: 700; color: #1e1b4b; }

.coupon-grid { padding: 12px 16px; display: flex; flex-direction: column; gap: 12px; }
.empty-tip { text-align: center; padding: 60px 0; color: #999; font-size: 14px; }

.coupon-item {
  display: flex; background: #fff; border-radius: 12px; overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px dashed #e0d4f5;
}
.coupon-item-left {
  width: 100px; display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 16px 8px; background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; position: relative;
}
.coupon-item-left::after {
  content: ''; position: absolute; right: -8px; top: 50%; transform: translateY(-50%);
  width: 16px; height: 16px; border-radius: 50%; background: #f0f2f8;
}
.coupon-item-value { font-size: 28px; font-weight: 800; line-height: 1; }
.coupon-item-unit { font-size: 12px; margin-top: 2px; }
.coupon-item-condition { font-size: 10px; margin-top: 8px; opacity: 0.8; }

.coupon-item-divider { width: 1px; background: repeating-linear-gradient(180deg, #ccc 0, #ccc 4px, transparent 4px, transparent 8px); margin-top: 16px; }

.coupon-item-right { flex: 1; padding: 14px 16px; display: flex; flex-direction: column; justify-content: space-between; }
.coupon-item-name { font-size: 14px; font-weight: 600; color: #1e1b4b; margin-bottom: 4px; }
.coupon-item-desc { font-size: 11px; color: #999; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.coupon-item-info { font-size: 10px; color: #bbb; display: flex; gap: 12px; }

.claim-btn {
  padding: 6px 20px; border-radius: 20px; border: none;
  background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff;
  font-size: 13px; font-weight: 600; cursor: pointer; align-self: flex-end;
  transition: opacity 0.2s;
}
.claim-btn:active { opacity: 0.8; }
.claim-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
