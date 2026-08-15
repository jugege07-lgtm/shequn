<template>
  <div class="phone-frame">
    <div class="header">
      <div class="header-left">
        <div class="back-btn" @click="$router.back()">
          <image class="back-icon" :src="iconBack" mode="aspectFit" />
        </div>
        <span class="header-title">立即支付</span>
      </div>
    </div>

    <div class="main-scroll">
      <div class="amount-card">
        <div class="amount-label">支付金额</div>
        <div class="amount-value"><span>¥</span>{{ order.payAmount?.toFixed(2) }}</div>
        <div class="amount-order">订单编号：{{ order.orderNo }}</div>
      </div>

      <div class="goods-card">
        <div class="goods-title">商品信息</div>
        <div class="goods-list" v-if="order.items && order.items.length">
          <div class="goods-item" v-for="(item, idx) in order.items" :key="idx">
            <image class="goods-img" :src="normalizeImageUrl(item.productImage || item.product?.coverImage)" mode="aspectFill" />
            <div class="goods-info">
              <div class="goods-name">{{ item.productName || item.product?.name }}</div>
              <div class="goods-price-row">
                <span class="goods-price"><span>¥</span>{{ item.price }}</span>
                <span class="goods-quantity">x{{ item.quantity }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="goods-list" v-else>
          <div class="goods-item">
            <div class="goods-info">
              <div class="goods-name">{{ order.remark || orderTitle }}</div>
              <div class="goods-price-row">
                <span class="goods-price"><span>¥</span>{{ order.payAmount }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 积分抵扣明细 -->
      <div class="goods-card" v-if="order.pointsUsed > 0">
        <div class="goods-title">积分抵扣</div>
        <div class="points-detail">
          <div class="points-row">
            <span>消耗积分</span>
            <span class="points-val">-{{ order.pointsUsed }} 积分</span>
          </div>
          <div class="points-row" v-if="order.pointsDeduct > 0">
            <span>抵扣现金</span>
            <span class="points-val">-¥{{ order.pointsDeduct }}</span>
          </div>
          <div class="points-tip">支付成功后自动从您的账户扣除积分</div>
        </div>
      </div>

      <div class="pay-method-card">
        <div class="pay-title">支付方式</div>
        <div class="pay-option" :class="{ active: payMethod === 'wechat' }" @click="payMethod = 'wechat'">
          <div class="pay-icon" style="background:#22c55e">微</div>
          <div class="pay-name">微信支付</div>
          <div class="pay-radio" :class="{ checked: payMethod === 'wechat' }">
            <text v-if="payMethod === 'wechat'" class="radio-mark">✓</text>
          </div>
        </div>
        <div class="pay-option" :class="{ active: payMethod === 'balance' }" @click="payMethod = 'balance'">
          <div class="pay-icon" style="background:#d4af7a">余</div>
          <div class="pay-name">
            余额支付
            <div class="pay-balance-tip">当前余额：¥{{ balance.toFixed(2) }}</div>
          </div>
          <div class="pay-radio" :class="{ checked: payMethod === 'balance' }">
            <text v-if="payMethod === 'balance'" class="radio-mark">✓</text>
          </div>
        </div>
      </div>

      <div class="tip-card">
        <div class="tip-text" v-if="payMethod === 'wechat'">点击“确认支付”后将调起微信支付；支付结果由微信支付回调异步更新订单状态，支付成功后自动{{ orderType === 'product' ? '为您发货' : '确认您的业务权益' }}。</div>
        <div class="tip-text" v-else>使用账户余额支付，支付成功后将从“我的余额”中扣除并自动{{ orderType === 'product' ? '为您发货' : '确认您的业务权益' }}。</div>
      </div>
    </div>

    <div class="bottom-bar">
      <div class="total-wrap">
        <span class="total-label">应付：</span>
        <span class="total-price"><span>¥</span>{{ order.payAmount?.toFixed(2) }}</span>
      </div>
      <button class="pay-btn" :disabled="paying || order.status !== 'pending_payment'" @click="handlePay">
        {{ paying ? '支付中...' : '确认支付' }}
      </button>
    </div>

    <PayPasswordPopup
      v-model="payPopupVisible"
      :has-password="hasPayPassword"
      :amount-text="'¥' + (order.payAmount || 0).toFixed(2)"
      @success="confirmBalancePay"
      @go-set="goSetPayPassword"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOrder, createUnifiedOrder, payWithBalance, getMyBalance, getCurrentUser } from '@/api'
import { requestPayment } from '@/utils/pay'
import PayPasswordPopup from '@/components/PayPasswordPopup.vue'
import { showToast } from '@/utils/toast'
import { svgUri } from '@/utils/svg'

const route = useRoute()
const router = useRouter()
const iconBack = svgUri('<path d="m15 18-6-6 6-6"/>', { color: '#1e1b4b' })
const orderId = Number(route.params.id) || Number(route.query.orderId) || 0
const order = ref<any>({})
const loading = ref(false)
const paying = ref(false)
const payMethod = ref('wechat')
const balance = ref(0)
const orderType = ref(route.query.type as string || 'product')
const redirect = ref(route.query.redirect as string || '')
const hasPayPassword = ref(false)
const payPopupVisible = ref(false)

const orderTitle = computed(() => {
  const titles: Record<string, string> = {
    activity_signup: '活动报名',
    business_unlock: '商机解锁',
    product: '商品购买',
    vip: 'VIP会员开通',
  }
  return titles[orderType.value] || '商品购买'
})

function normalizeImageUrl(url: string | undefined): string {
  if (!url) return ''
  if (url.startsWith('http') || url.startsWith('//')) return url
  if (url.startsWith('/api/')) return url
  if (url.startsWith('/uploads/')) return '/api' + url
  return url
}

async function loadOrder() {
  if (!orderId) return
  loading.value = true
  try {
    const data = await getOrder(orderId)
    order.value = data || {}
    if (data?.status === 'paid' && data?.payAmount === 0) {
      // 纯积分订单：无需支付，直接展示成功状态
      router.replace(`/order/success?orderId=${orderId}&amount=0&points=${data.pointsUsed || 0}`)
      return
    }
    if (data?.status !== 'pending_payment') {
      showToast('该订单无需支付')
    }
  } catch (err: any) {
    showToast(err.userMessage || err.message || '加载订单失败')
  } finally {
    loading.value = false
  }
}

async function handlePay() {
  if (paying.value || order.value.status !== 'pending_payment') return
  // 余额支付：先弹出支付密码输入框
  if (payMethod.value === 'balance') {
    payPopupVisible.value = true
    return
  }

  paying.value = true
  try {
    // 1. 获取后端统一支付参数
    const payParams = await createUnifiedOrder(orderId)
    if (!payParams || !payParams.appId) {
      throw new Error('未获取到有效支付参数')
    }

    // 2. 调起微信支付（小程序环境）
    await requestPayment(payParams)

    // 3. 支付成功后跳转回业务页面或通用结果页（实际订单状态由微信支付回调更新）
    if (redirect.value) {
      const sep = redirect.value.includes('?') ? '&' : '?'
      router.replace(`${redirect.value}${sep}paid=1`)
      return
    }
    router.replace(`/order/success?orderId=${orderId}&amount=${order.value.payAmount}`)
  } catch (err: any) {
    console.error('支付失败', err)
    showToast(err.userMessage || err.message || '支付失败')
  } finally {
    paying.value = false
  }
}

// 支付密码校验通过后，执行余额支付
async function confirmBalancePay(payPassword: string) {
  if (paying.value) return
  paying.value = true
  try {
    await payWithBalance(orderId, payPassword)
    if (redirect.value) {
      const sep = redirect.value.includes('?') ? '&' : '?'
      router.replace(`${redirect.value}${sep}paid=1`)
      return
    }
    router.replace(`/order/success?orderId=${orderId}&amount=${order.value.payAmount}`)
  } catch (err: any) {
    showToast(err.userMessage || err.message || '支付失败')
  } finally {
    paying.value = false
  }
}

// 未设置支付密码 → 跳转设置页
function goSetPayPassword() {
  router.push('/setting/index?from=pay')
}

onMounted(() => {
  loadOrder()
  getMyBalance().then((data: any) => {
    if (data) balance.value = Number(data.balance) || 0
  }).catch(() => {})
  getCurrentUser().then((data: any) => {
    if (data) hasPayPassword.value = !!data.hasPayPassword
  }).catch(() => {})
})
</script>

<style scoped>
.amount-card {
  margin: 12px 16px; padding: 24px 16px; border-radius: var(--radius-xl);
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: #fff; text-align: center; box-shadow: var(--glass-shadow);
}
.amount-label { font-size: 14px; opacity: 0.9; margin-bottom: 8px; }
.amount-value { font-size: 36px; font-weight: 800; }
.amount-value text { font-size: 18px; }
.amount-order { font-size: 12px; opacity: 0.85; margin-top: 10px; }
.goods-card {
  margin: 0 16px 12px; padding: 16px; border-radius: var(--radius-xl);
  background: rgba(255,255,255,0.75); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.5);
  box-shadow: var(--glass-shadow);
}
.goods-title { font-size: 15px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 12px; }
.goods-list { display: flex; flex-direction: column; gap: 12px; }
.goods-item { display: flex; gap: 12px; }
.goods-img { width: 70px; height: 70px; border-radius: 8px; background: #f5f5f5; }
.goods-info { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
.goods-name { font-size: 14px; font-weight: 600; color: var(--color-text-primary); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

/* 积分抵扣明细 */
.points-detail { display: flex; flex-direction: column; gap: 8px; }
.points-row { display: flex; justify-content: space-between; align-items: center; font-size: 14px; color: var(--color-text-secondary); }
.points-val { font-weight: 700; color: #d97706; }
.points-tip { font-size: 12px; color: var(--color-text-tertiary); background: #fef3c7; border-radius: 6px; padding: 6px 10px; }
.goods-price-row { display: flex; justify-content: space-between; align-items: center; }
.goods-price { font-size: 14px; font-weight: 700; color: var(--color-primary); }
.goods-price text { font-size: 11px; font-weight: 400; }
.goods-quantity { font-size: 13px; color: var(--color-text-secondary); }
.pay-method-card {
  margin: 0 16px 12px; padding: 16px; border-radius: var(--radius-xl);
  background: rgba(255,255,255,0.75); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.5);
  box-shadow: var(--glass-shadow);
}
.pay-title { font-size: 15px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 12px; }
.pay-option { display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: var(--radius-md); border: 1.5px solid transparent; margin-bottom: 10px; background: rgba(255,255,255,0.5); }
.pay-option.active { border-color: var(--color-primary); background: rgba(99,102,241,0.06); }
.pay-icon { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px; font-weight: 700; }
.pay-name { flex: 1; font-size: 15px; font-weight: 600; color: var(--color-text-primary); }
.pay-balance-tip { font-size: 12px; font-weight: 400; color: var(--color-text-tertiary); margin-top: 2px; }
.pay-radio { width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--color-text-tertiary); display: flex; align-items: center; justify-content: center; }
.pay-radio.checked { background: var(--color-primary); border-color: var(--color-primary); }
.radio-mark { color: #fff; font-size: 12px; font-weight: 700; line-height: 1; }
.tip-card { margin: 0 16px 12px; }
.tip-text { font-size: 12px; color: var(--color-text-tertiary); line-height: 1.6; }
.back-icon { width: 20px; height: 20px; }
.bottom-bar {
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 430px;
  padding: 10px 16px var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 10px)); background: rgba(255,255,255,0.95); backdrop-filter: blur(20px);
  border-top: 0.5px solid rgba(60,60,67,0.1); z-index: 200;
  display: flex; align-items: center; gap: 12px;
}
.total-wrap { flex: 1; text-align: right; }
.total-label { font-size: 13px; color: var(--color-text-secondary); }
.total-price { font-size: 20px; font-weight: 700; color: var(--color-primary); }
.total-price text { font-size: 12px; font-weight: 400; }
.pay-btn { padding: 12px 28px; border: none; border-radius: 99px; background: var(--color-primary); color: #fff; font-size: 15px; font-weight: 600; }
.pay-btn:disabled { opacity: 0.6; }
</style>
