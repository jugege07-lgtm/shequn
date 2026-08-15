<template>
  <view class="phone-frame">
    <view class="header"><view class="header-left"><view class="back-btn" @click="$router.back()"><image :src="iconBack" mode="aspectFit" /></view><text class="header-title">支付</text></view></view>
    <view class="main-scroll">
      <view class="order-summary" style="margin:16px;">
        <view class="section-label">订单摘要</view>
        <view class="order-plan">{{ plan.name }}</view>
        <view class="order-price">¥{{ plan.currentPrice }}</view>
      </view>
      <view class="pay-methods">
        <view class="section-label">支付方式</view>
        <view class="pay-item" :class="{ active: selectedPay === 1 }" @click="selectedPay = 1">
          <image class="pay-item-icon" :src="iconWechat" mode="aspectFit" />
          <text>微信支付</text>
          <view class="radio-dot" :class="{ active: selectedPay === 1 }"></view>
        </view>
        <view class="pay-item" :class="{ active: selectedPay === 2 }" @click="selectedPay = 2">
          <image class="pay-item-icon" :src="iconBalance" mode="aspectFit" />
          <text>余额支付<text class="pay-bal-sub">（当前余额 ¥{{ balance.toFixed(2) }}）</text></text>
          <view class="radio-dot" :class="{ active: selectedPay === 2 }"></view>
        </view>
      </view>
    </view>
    <view class="bottom-action">
      <button class="confirm-btn" @click="handlePay">确认支付 ¥{{ plan.currentPrice }}</button>
    </view>

    <PayPasswordPopup
      v-model="payPopupVisible"
      :has-password="hasPayPassword"
      :amount-text="'¥' + (plan.currentPrice || 0)"
      @success="confirmBalancePay"
      @go-set="goSetPayPassword"
    />
  </view>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getVipPlans, subscribeVip, payWithBalance, getMyBalance, getCurrentUser } from '@/api'
import PayPasswordPopup from '@/components/PayPasswordPopup.vue'
import { svgUri } from '@/utils/svg'

const route = useRoute()
const router = useRouter()
const selectedPay = ref(1)
const balance = ref(0)
const hasPayPassword = ref(false)
const payPopupVisible = ref(false)
const pendingOrderId = ref(0)

const iconBack = svgUri('<path d="m15 18-6-6 6-6"/>', { color: '#1e1b4b' })
const iconWechat = svgUri('<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>', { color: '#6366f1' })
const iconBalance = svgUri('<circle cx="12" cy="12" r="10"/><path d="M12 6v12M8 9h6a2 2 0 0 1 0 4H9a2 2 0 0 0 0 4h6"/>', { color: '#6366f1' })

interface PlanInfo {
  id: number
  name: string
  currentPrice: number
  description: string
  features: string[]
}

const plan = ref<PlanInfo>({ id: 0, name: '加载中...', currentPrice: 0, description: '', features: [] })

function showToast(msg: string) {
  uni.showToast({ title: msg, icon: 'none' })
}

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

  getCurrentUser().then((data: any) => {
    if (data) hasPayPassword.value = !!data.hasPayPassword
  }).catch(() => {})
})

const handlePay = async () => {
  if (!plan.value.id) return
  try {
    const result = await subscribeVip(plan.value.id)
    const orderId = result?.order?.id
    if (!orderId) throw new Error('订单创建失败')
    if (selectedPay.value === 2) {
      // 余额支付：先弹出支付密码输入框
      pendingOrderId.value = orderId
      payPopupVisible.value = true
      return
    }
    // 微信支付：走统一支付页
    router.replace(`/order/pay/${orderId}?type=vip`)
  } catch (err: any) {
    showToast(err.message || '支付失败')
  }
}

// 支付密码校验通过后，执行余额支付
async function confirmBalancePay(payPassword: string) {
  try {
    if (!pendingOrderId.value) throw new Error('订单创建失败')
    await payWithBalance(pendingOrderId.value, payPassword)
    showToast('支付成功！')
    router.push('/vip/index')
  } catch (err: any) {
    showToast(err.message || '支付失败')
  }
}

// 未设置支付密码 → 跳转设置页
function goSetPayPassword() {
  router.push('/setting/index?from=pay')
}
</script>
<style scoped>
.order-summary { margin: 16px; border-radius: var(--radius-xl); background: rgba(255,255,255,0.75); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.5); box-shadow: var(--glass-shadow); padding: 16px; text-align: center; }
.section-label { font-size: 16px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 12px; }
.order-plan { font-size: 18px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 4px; }
.order-price { font-size: 32px; font-weight: 800; color: var(--color-primary); }
.pay-methods { margin: 16px; }
.pay-item { display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: var(--radius-md); background: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.5); margin-bottom: 8px; }
.pay-item-icon { width: 24px; height: 24px; }
.pay-item text { flex: 1; font-size: 14px; color: var(--color-text-primary); }
.pay-bal-sub { font-size: 12px; color: var(--color-text-secondary); }
.radio-dot { width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--color-primary-100); }
.radio-dot.active { background: var(--color-primary); border-color: var(--color-primary); }
.bottom-action { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 430px; padding: 12px 16px var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 12px)); background: rgba(255,255,255,0.95); backdrop-filter: blur(20px); border-top: 0.5px solid rgba(60,60,67,0.1); z-index: 200; }
.confirm-btn { width: 100%; padding: 14px; border: none; border-radius: 12px; background: var(--color-primary); color: #fff; font-size: 16px; font-weight: 600; }
</style>
