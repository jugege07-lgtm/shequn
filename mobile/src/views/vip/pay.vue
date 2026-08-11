<template>
  <div class="phone-frame">
    <div class="header"><div class="header-left"><div class="back-btn" @click="$router.back()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m15 18-6-6 6-6"/></svg></div><span class="header-title">支付</span></div></div>
    <div class="main-scroll">
      <div class="order-summary" style="margin:16px;">
        <h3 class="section-label">订单摘要</h3>
        <div class="order-plan">{{ plan.name }}</div>
        <div class="order-price">¥{{ plan.currentPrice }}</div>
      </div>
      <div class="pay-methods">
        <h3 class="section-label">支付方式</h3>
        <div class="pay-item" :class="{ active: selectedPay === 1 }" @click="selectedPay = 1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          <span>微信支付</span>
          <div class="radio-dot" :class="{ active: selectedPay === 1 }"></div>
        </div>
        <div class="pay-item" :class="{ active: selectedPay === 2 }" @click="selectedPay = 2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M8 9h6a2 2 0 0 1 0 4H9a2 2 0 0 0 0 4h6"/></svg>
          <span>余额支付<span class="pay-bal-sub">（当前余额 ¥{{ balance.toFixed(2) }}）</span></span>
          <div class="radio-dot" :class="{ active: selectedPay === 2 }"></div>
        </div>
      </div>
    </div>
    <div class="bottom-action">
      <button class="confirm-btn" @click="handlePay">确认支付 ¥{{ plan.currentPrice }}</button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getVipPlans, subscribeVip, payWithBalance, getMyBalance } from '@/api'

const route = useRoute()
const router = useRouter()
const selectedPay = ref(1)
const balance = ref(0)

interface PlanInfo {
  id: number
  name: string
  currentPrice: number
  description: string
  features: string[]
}

const plan = ref<PlanInfo>({ id: 0, name: '加载中...', currentPrice: 0, description: '', features: [] })

onMounted(async () => {
  try {
    const planId = Number(route.params.planId || route.query.planId)
    const plans = await getVipPlans()
    const found = plans.find((p: any) => p.id === planId)
    if (found) {
      plan.value = {
        id: found.id,
        name: found.name,
        currentPrice: found.currentPrice ?? 0,
        description: found.description || '',
        features: typeof found.features === 'string' ? JSON.parse(found.features) : (found.features || []),
      }
    } else if (plans.length > 0) {
      const first = plans[0]
      plan.value = {
        id: first.id,
        name: first.name,
        currentPrice: first.currentPrice ?? 0,
        description: first.description || '',
        features: typeof first.features === 'string' ? JSON.parse(first.features) : (first.features || []),
      }
    }
  } catch (err: any) {
    console.error('获取套餐信息失败:', err)
  }

  getMyBalance().then((data: any) => {
    if (data) balance.value = Number(data.balance) || 0
  }).catch(() => {})
})

const handlePay = async () => {
  if (!plan.value.id) return
  try {
    const result = await subscribeVip(plan.value.id)
    const orderId = result?.order?.id
    if (!orderId) throw new Error('订单创建失败')
    if (selectedPay.value === 2) {
      // 余额支付
      await payWithBalance(orderId)
      showToast('支付成功！')
      router.push('/vip/index')
      return
    }
    // 微信支付：走统一支付页
    router.replace(`/order/pay/${orderId}?type=vip`)
  } catch (err: any) {
    showToast(err.message || '支付失败')
  }
}

function showToast(msg: string) {
  const el = document.createElement('div')
  el.textContent = msg
  el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,.75);color:#fff;padding:12px 24px;border-radius:8px;font-size:14px;z-index:9999;white-space:nowrap'
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 2000)
}
</script>
<style scoped>
@import '@/styles/global.css';
.order-summary { margin: 16px; border-radius: var(--radius-xl); background: rgba(255,255,255,0.75); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.5); box-shadow: var(--glass-shadow); padding: 16px; text-align: center; }
.section-label { font-size: 16px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 12px; }
.order-plan { font-size: 18px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 4px; }
.order-price { font-size: 32px; font-weight: 800; color: var(--color-primary); }
.pay-methods { margin: 16px; }
.pay-item { display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: var(--radius-md); background: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.5); margin-bottom: 8px; cursor: pointer; }
.pay-item svg { width: 24px; height: 24px; color: var(--color-primary); }
.pay-item span { flex: 1; font-size: 14px; color: var(--color-text-primary); }
.pay-bal-sub { font-size: 12px; color: var(--color-text-secondary); }
.radio-dot { width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--color-primary-100); }
.radio-dot.active { background: var(--color-primary); border-color: var(--color-primary); }
.bottom-action { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 430px; padding: 12px 16px env(safe-area-inset-bottom, 12px); background: rgba(255,255,255,0.95); backdrop-filter: blur(20px); border-top: 0.5px solid rgba(60,60,67,0.1); z-index: 200; }
.confirm-btn { width: 100%; padding: 14px; border: none; border-radius: 12px; background: var(--color-primary); color: #fff; font-size: 16px; font-weight: 600; cursor: pointer; }
</style>
