<template>
  <div class="phone-frame">
    <div class="header">
      <div class="header-left">
        <div class="back-btn" @click="$router.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m15 18-6-6 6-6"/></svg>
        </div>
        <span class="header-title">我的订单</span>
      </div>
    </div>

    <div class="filter-bar">
      <div class="filter-tab" :class="{ active: activeTab === '' }" @click="switchTab('')">全部</div>
      <div class="filter-tab" :class="{ active: activeTab === 'pending_payment' }" @click="switchTab('pending_payment')">待付款</div>
      <div class="filter-tab" :class="{ active: activeTab === 'paid' }" @click="switchTab('paid')">已付款</div>
      <div class="filter-tab" :class="{ active: activeTab === 'shipped' }" @click="switchTab('shipped')">已发货</div>
      <div class="filter-tab" :class="{ active: activeTab === 'completed' }" @click="switchTab('completed')">已完成</div>
    </div>

    <div class="main-scroll" v-loading="loading">
      <div class="empty-tip" v-if="!orders.length">
        <div style="font-size: 48px; margin-bottom: 12px;">📦</div>
        <div>暂无订单</div>
      </div>

      <div class="order-list" v-else>
        <div class="order-card" v-for="order in orders" :key="order.id">
          <div class="order-header">
            <span class="order-no">订单号：{{ order.orderNo }}</span>
            <span class="order-status" :class="order.status">{{ statusText(order.status) }}</span>
          </div>
          <div class="order-time">{{ formatTime(order.createdAt) }}</div>

          <div class="goods-list">
            <div class="goods-item" v-for="(item, idx) in order.items" :key="idx">
              <img class="goods-img" :src="normalizeImageUrl(item.productImage || item.product?.coverImage)" />
              <div class="goods-info">
                <div class="goods-name">{{ item.productName || item.product?.name }}</div>
                <div class="goods-price-row">
                  <span class="goods-price"><span>¥</span>{{ item.price }}</span>
                  <span class="goods-quantity">x{{ item.quantity }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="order-footer">
            <span v-if="order.items?.length">{{ order.items.length }}件 实付：<span class="pay-amount"><span>¥</span>{{ order.payAmount?.toFixed(2) }}</span></span>
            <span v-else>{{ orderTypeText(order.orderType) }} 实付：<span class="pay-amount"><span>¥</span>{{ order.payAmount?.toFixed(2) }}</span></span>
          </div>

          <div class="order-actions">
            <button class="action-btn outline" v-if="order.status === 'pending_payment'" @click="goPay(order.id)">去支付</button>
            <button class="action-btn primary" v-if="order.status === 'shipped' && order.orderType === 'product'" @click="confirmReceive(order.id)">确认收货</button>
            <button class="action-btn outline" @click="viewDetail(order.id)">查看详情</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMyOrders, confirmOrder } from '@/api'

const router = useRouter()
const activeTab = ref('')
const orders = ref<any[]>([])
const loading = ref(false)

const statusMap: Record<string, string> = {
  pending_payment: '待付款',
  paid: '已付款',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消',
}

function statusText(status: string) {
  return statusMap[status] || status
}

const orderTypeMap: Record<string, string> = {
  product: '商品订单',
  recharge: '余额充值',
  business_unlock: '商机解锁',
  activity_signup: '活动报名',
  vip: 'VIP会员开通',
}

function orderTypeText(type: string) {
  return orderTypeMap[type] || '订单'
}

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

async function loadOrders() {
  loading.value = true
  try {
    const params: any = { page: 1, size: 50 }
    if (activeTab.value) params.status = activeTab.value
    const data = await getMyOrders(params)
    const list = Array.isArray(data) ? data : data?.list || []
    orders.value = list
  } catch (err: any) {
    showToast(err.userMessage || err.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function switchTab(status: string) {
  activeTab.value = status
  loadOrders()
}

function goPay(id: number) {
  router.push(`/order/pay/${id}`)
}

async function confirmReceive(id: number) {
  if (!confirm('确认已收到该订单商品？')) return
  try {
    await confirmOrder(id)
    showToast('确认收货成功')
    loadOrders()
  } catch (err: any) {
    showToast(err.userMessage || err.message || '确认失败')
  }
}

function viewDetail(id: number) {
  router.push(`/order/detail/${id}`)
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
  document.title = '我的订单'
  loadOrders()
})
</script>

<style scoped>
@import '@/styles/global.css';
.filter-bar { padding: 12px 16px 0; }
.order-list { padding: 12px 16px 80px; display: flex; flex-direction: column; gap: 12px; }
.order-card {
  padding: 14px; border-radius: var(--radius-xl);
  background: rgba(255,255,255,0.75); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.5);
  box-shadow: var(--glass-shadow);
}
.order-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.order-no { font-size: 13px; color: var(--color-text-secondary); }
.order-status { font-size: 13px; font-weight: 600; color: var(--color-primary); }
.order-status.paid { color: var(--color-success); }
.order-status.shipped { color: var(--color-warning); }
.order-status.completed { color: var(--color-text-tertiary); }
.order-status.cancelled { color: var(--color-danger); }
.order-time { font-size: 12px; color: var(--color-text-tertiary); margin-bottom: 12px; }
.goods-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; }
.goods-item { display: flex; gap: 10px; }
.goods-img { width: 64px; height: 64px; border-radius: 8px; object-fit: cover; background: #f5f5f5; }
.goods-info { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
.goods-name { font-size: 13px; font-weight: 600; color: var(--color-text-primary); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.goods-price-row { display: flex; justify-content: space-between; align-items: center; }
.goods-price { font-size: 13px; font-weight: 700; color: var(--color-primary); }
.goods-price span { font-size: 10px; font-weight: 400; }
.goods-quantity { font-size: 12px; color: var(--color-text-secondary); }
.order-footer { text-align: right; font-size: 13px; color: var(--color-text-secondary); margin-bottom: 12px; }
.pay-amount { font-size: 15px; font-weight: 700; color: var(--color-text-primary); }
.pay-amount span { font-size: 11px; font-weight: 400; }
.order-actions { display: flex; justify-content: flex-end; gap: 10px; }
.action-btn { padding: 7px 14px; border-radius: 99px; font-size: 13px; font-weight: 600; cursor: pointer; }
.action-btn.outline { border: 1px solid var(--color-primary); background: #fff; color: var(--color-primary); }
.action-btn.primary { border: none; background: var(--color-primary); color: #fff; }
.empty-tip { text-align: center; padding: 80px 16px; color: var(--color-text-tertiary); }
</style>
