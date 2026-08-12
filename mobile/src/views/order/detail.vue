<template>
  <div class="phone-frame">
    <div class="header">
      <div class="header-left">
        <div class="back-btn" @click="$router.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m15 18-6-6 6-6"/></svg>
        </div>
        <span class="header-title">订单详情</span>
      </div>
    </div>

    <div class="main-scroll" v-loading="loading">
      <template v-if="order.id">
        <!-- 状态卡片 -->
        <div class="status-card" :class="order.status">
          <div class="status-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path v-if="order.status === 'pending_payment'" d="M12 1a3 3 0 013 3 3 3 0 013 3 3 3 0 013 3c0 2-1 3-3 3H9c-2 0-3-2-3-4a3 3 0 013-3"/><path v-if="order.status === 'pending_payment'" d="M12 1v4M12 16v5"/>
              <polyline v-else points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div class="status-text">{{ statusText(order.status) }}</div>
          <div class="status-hint">{{ statusHint }}</div>
        </div>

        <!-- 金额 -->
        <div class="amount-card">
          <div class="amount-label">实付金额</div>
          <div class="amount-value"><span>¥</span>{{ order.payAmount?.toFixed(2) }}</div>
          <div class="amount-no">订单编号：{{ order.orderNo }}</div>
        </div>

        <!-- 商品/业务信息 -->
        <div class="section-card">
          <div class="section-title">{{ orderTypeText(order.orderType) }}</div>
          <div class="info-list" v-if="order.items && order.items.length">
            <div class="goods-item" v-for="(item, idx) in order.items" :key="idx">
              <img class="goods-img" :src="normalizeImageUrl(item.productImage || item.product?.coverImage)" />
              <div class="goods-info">
                <div class="goods-name">{{ item.productName || item.product?.name }}</div>
                <div class="goods-price-row">
                  <span class="goods-price"><span>¥</span>{{ item.price }} <span class="goods-quantity">x{{ item.quantity }}</span></span>
                </div>
              </div>
            </div>
          </div>
          <div class="info-list" v-else>
            <div class="info-row">
              <span>订单内容</span>
              <span>{{ order.remark || orderTypeText(order.orderType) }}</span>
            </div>
          </div>
        </div>

        <!-- 积分抵扣 -->
        <div class="section-card" v-if="order.pointsUsed > 0">
          <div class="section-title">积分抵扣</div>
          <div class="info-row">
            <span>消耗积分</span>
            <span class="points-val">-{{ order.pointsUsed }} 积分</span>
          </div>
          <div class="info-row" v-if="order.pointsDeduct > 0">
            <span>抵扣现金</span>
            <span class="points-val">-¥{{ order.pointsDeduct }}</span>
          </div>
        </div>

        <!-- 订单信息 -->
        <div class="section-card">
          <div class="section-title">订单信息</div>
          <div class="info-row">
            <span>订单编号</span>
            <span>{{ order.orderNo }}</span>
          </div>
          <div class="info-row">
            <span>下单时间</span>
            <span>{{ formatTime(order.createdAt) }}</span>
          </div>
          <div class="info-row" v-if="order.paidAt">
            <span>支付时间</span>
            <span>{{ formatTime(order.paidAt) }}</span>
          </div>
          <div class="info-row" v-if="order.orderType === 'product'">
            <span>收货地址</span>
            <span>{{ order.address ? order.address.receiver + ' ' + order.address.phone : '—' }}</span>
          </div>
        </div>
      </template>
    </div>

    <div class="bottom-bar" v-if="order.id">
      <button v-if="order.status === 'pending_payment'" class="pay-btn" @click="goPay(order.id)">立即支付</button>
      <button v-else-if="order.status === 'shipped' && order.orderType === 'product'" class="pay-btn" @click="confirmReceive(order.id)">确认收货</button>
      <button class="view-btn" @click="$router.push('/order/list')">返回订单列表</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOrder, confirmOrder } from '@/api'

const route = useRoute()
const router = useRouter()
const orderId = Number(route.params.id)
const order = ref<any>({})
const loading = ref(false)

const statusMap: Record<string, string> = {
  pending_payment: '待付款',
  paid: '已付款',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消',
}

const statusHintMap: Record<string, string> = {
  pending_payment: '订单尚未支付，请尽快完成支付',
  paid: '订单已支付，等待商家发货',
  shipped: '商家已发货，请留意物流信息',
  completed: '订单已完成，感谢您的购买',
  cancelled: '订单已取消',
}

const orderTypeMap: Record<string, string> = {
  product: '商品订单',
  recharge: '余额充值',
  business_unlock: '商机解锁',
  activity_signup: '活动报名',
  vip: 'VIP会员开通',
}

const statusText = (status: string) => statusMap[status] || status
const statusHint = computed(() => statusHintMap[order.value.status] || '')
const orderTypeText = (type: string) => orderTypeMap[type] || '订单'

function normalizeImageUrl(url: string | undefined): string {
  if (!url) return ''
  if (url.startsWith('http') || url.startsWith('//')) return url
  if (url.startsWith('/api/')) return url
  if (url.startsWith('/uploads/')) return '/api' + url
  return url
}

function formatTime(dateStr: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

async function loadOrder() {
  if (!orderId) return
  loading.value = true
  try {
    order.value = (await getOrder(orderId)) || {}
  } catch (err: any) {
    showToast(err.userMessage || err.message || '加载订单失败')
  } finally {
    loading.value = false
  }
}

function goPay(id: number) {
  router.push(`/order/pay/${id}`)
}

async function confirmReceive(id: number) {
  if (!confirm('确认已收到该订单商品？')) return
  try {
    await confirmOrder(id)
    showToast('确认收货成功')
    loadOrder()
  } catch (err: any) {
    showToast(err.userMessage || err.message || '确认失败')
  }
}

function showToast(msg: string) {
  if (typeof uni !== 'undefined' && uni.showToast) {
    uni.showToast({ title: msg, icon: 'none' })
    return
  }
  const existing = document.querySelector('.mobile-toast')
  if (existing) existing.remove()
  const el = document.createElement('div')
  el.className = 'mobile-toast'
  el.textContent = msg
  el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.78);color:#fff;padding:12px 28px;border-radius:12px;font-size:14px;z-index:9999;white-space:nowrap'
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 2000)
}

onMounted(() => {
  document.title = '订单详情'
  loadOrder()
})
</script>

<style scoped>
@import '@/styles/global.css';
.main-scroll { padding-bottom: 80px; }
.status-card {
  margin: 12px 16px; padding: 22px 16px; border-radius: var(--radius-xl);
  display: flex; flex-direction: column; align-items: center;
  background: linear-gradient(135deg, #2563eb, #4f46e5); color: #fff;
}
.status-card.paid { background: linear-gradient(135deg, #10b981, #059669); }
.status-card.shipped { background: linear-gradient(135deg, #f59e0b, #d97706); }
.status-card.completed { background: linear-gradient(135deg, #6b7280, #4b5563); }
.status-card.cancelled { background: linear-gradient(135deg, #ef4444, #dc2626); }
.status-icon {
  width: 52px; height: 52px; border-radius: 50%;
  background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center;
  margin-bottom: 10px;
}
.status-icon svg { width: 26px; height: 26px; }
.status-text { font-size: 18px; font-weight: 700; }
.status-hint { font-size: 12px; opacity: 0.85; margin-top: 4px; }
.amount-card {
  margin: 0 16px 12px; padding: 18px 16px; border-radius: var(--radius-xl);
  background: rgba(255,255,255,0.75); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.5);
  box-shadow: var(--glass-shadow);
}
.amount-label { font-size: 13px; color: var(--color-text-secondary); }
.amount-value { font-size: 32px; font-weight: 800; color: var(--color-primary); margin: 4px 0; }
.amount-value span { font-size: 16px; font-weight: 400; }
.amount-no { font-size: 12px; color: var(--color-text-tertiary); }
.section-card {
  margin: 0 16px 12px; padding: 16px; border-radius: var(--radius-xl);
  background: rgba(255,255,255,0.75); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.5);
  box-shadow: var(--glass-shadow);
}
.section-title { font-size: 15px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 12px; }
.info-list { display: flex; flex-direction: column; gap: 10px; }
.goods-item { display: flex; gap: 10px; }
.goods-img { width: 64px; height: 64px; border-radius: 8px; object-fit: cover; background: #f5f5f5; }
.goods-info { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
.goods-name { font-size: 13px; font-weight: 600; color: var(--color-text-primary); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.goods-price-row { display: flex; justify-content: space-between; align-items: center; }
.goods-price { font-size: 13px; font-weight: 700; color: var(--color-primary); }
.goods-price span { font-size: 10px; font-weight: 400; }
.goods-quantity { font-size: 12px; color: var(--color-text-secondary); }
.info-row { display: flex; justify-content: space-between; align-items: flex-start; font-size: 13px; padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.04); }
.info-row:last-child { border-bottom: none; }
.info-row span:first-child { color: var(--color-text-secondary); flex-shrink: 0; margin-right: 16px; }
.info-row span:last-child { color: var(--color-text-primary); text-align: right; word-break: break-all; }
.points-val { color: #d97706; font-weight: 600; }
.bottom-bar {
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 430px;
  padding: 10px 16px var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 10px)); background: rgba(255,255,255,0.95); backdrop-filter: blur(20px);
  border-top: 0.5px solid rgba(60,60,67,0.1); z-index: 200;
  display: flex; gap: 10px;
}
.pay-btn { flex: 1; padding: 12px; border: none; border-radius: 99px; background: var(--color-primary); color: #fff; font-size: 15px; font-weight: 600; }
.view-btn { flex: 1; padding: 12px; border: 1px solid var(--color-primary); border-radius: 99px; background: #fff; color: var(--color-primary); font-size: 15px; font-weight: 600; }
</style>