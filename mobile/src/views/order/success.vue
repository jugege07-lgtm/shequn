<template>
  <div class="phone-frame success-page">
    <div class="main-scroll">
      <div class="success-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div class="success-title">{{ titleText }}</div>
      <div class="success-amount" v-if="points > 0" style="color:#d97706">
        <span class="points-big">{{ points }}</span><span class="points-unit"> 积分</span>
      </div>
      <div class="success-amount" v-else><span>¥</span>{{ amount }}</div>
      <div class="success-desc">{{ descText }}</div>

      <div class="order-info-card" v-if="orderId">
        <div class="info-row">
          <span>订单编号</span>
          <span>{{ orderId }}</span>
        </div>
        <div class="info-row">
          <span>支付时间</span>
          <span>{{ payTime }}</span>
        </div>
      </div>
    </div>

    <div class="bottom-bar">
      <button class="btn-outline" @click="$router.replace('/order/list')">{{ secondaryBtnText }}</button>
      <button class="btn-primary" @click="goBackOrHome">{{ primaryBtnText }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const orderId = Number(route.query.orderId) || 0
const amount = Number(route.query.amount || 0).toFixed(2)
const points = Number(route.query.points || 0)
const payTime = ref('')
const redirect = ref(route.query.redirect as string || '')

const titleText = computed(() => (points > 0 ? '兑换成功' : '支付成功'))
const descText = computed(() =>
  points > 0 ? `已从您的账户扣除 ${points} 积分，商家将尽快为您发货` : '感谢您的购买，商家将尽快为您发货'
)

const primaryBtnText = computed(() => redirect.value ? '返回' : '继续购物')
const secondaryBtnText = computed(() => '查看订单')

function goBackOrHome() {
  if (redirect.value) {
    router.replace(redirect.value)
    return
  }
  router.replace('/mall/index')
}

onMounted(() => {
  document.title = '支付成功'
  payTime.value = new Date().toLocaleString()
})
</script>

<style scoped>
@import '@/styles/global.css';
.success-page { background: #f5f6fa; }
.main-scroll { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 60px 24px 24px; text-align: center; }
.success-icon {
  width: 72px; height: 72px; border-radius: 50%;
  background: var(--color-success); display: flex; align-items: center; justify-content: center;
  margin-bottom: 20px; box-shadow: 0 8px 24px rgba(16,185,129,0.3);
}
.success-icon svg { width: 36px; height: 36px; }
.success-title { font-size: 22px; font-weight: 800; color: var(--color-text-primary); margin-bottom: 12px; }
.success-amount { font-size: 36px; font-weight: 800; color: var(--color-primary); margin-bottom: 10px; }
.success-amount span { font-size: 18px; }
.points-big { font-size: 44px; font-weight: 800; }
.points-unit { font-size: 16px; font-weight: 600; }
.success-desc { font-size: 14px; color: var(--color-text-secondary); margin-bottom: 32px; }
.order-info-card {
  width: 100%; padding: 16px; border-radius: var(--radius-xl);
  background: #fff; box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  text-align: left;
}
.info-row { display: flex; justify-content: space-between; align-items: center; font-size: 14px; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
.info-row:last-child { border-bottom: none; }
.info-row span:first-child { color: var(--color-text-secondary); }
.info-row span:last-child { color: var(--color-text-primary); font-weight: 500; }
.bottom-bar {
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 430px;
  padding: 12px 16px env(safe-area-inset-bottom, 12px); background: #fff;
  border-top: 0.5px solid rgba(60,60,67,0.1); z-index: 200;
  display: flex; gap: 12px;
}
.btn-outline { flex: 1; padding: 14px; border: 1px solid var(--color-primary); border-radius: 12px; background: #fff; color: var(--color-primary); font-size: 15px; font-weight: 600; }
.btn-primary { flex: 1; padding: 14px; border: none; border-radius: 12px; background: var(--color-primary); color: #fff; font-size: 15px; font-weight: 600; }
</style>
