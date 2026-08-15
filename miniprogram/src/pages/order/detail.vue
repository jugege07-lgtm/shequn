<template>
  <view :style="sbStyle" class="phone-frame">
    <view class="header">
      <view class="header-left">
        <view class="back-btn" @click="$router.back()">
          <image :src="iconBack" mode="aspectFit" />
        </view>
        <text class="header-title">订单详情</text>
      </view>
    </view>

    <view class="main-scroll">
      <template v-if="order.id">
        <!-- 状态卡片 -->
        <view class="status-card" :class="order.status">
          <view class="status-icon">
            <image v-if="order.status === 'pending_payment'" :src="iconStatusPending" mode="aspectFit" />
            <image v-else :src="iconStatusOk" mode="aspectFit" />
          </view>
          <view class="status-text">{{ statusText(order.status) }}</view>
          <view class="status-hint">{{ statusHint }}</view>
        </view>

        <!-- 金额 -->
        <view class="amount-card">
          <view class="amount-label">实付金额</view>
          <view class="amount-value"><text>¥</text>{{ order.payAmount?.toFixed(2) }}</view>
          <view class="amount-no">订单编号：{{ order.orderNo }}</view>
        </view>

        <!-- 商品/业务信息 -->
        <view class="section-card">
          <view class="section-title">{{ orderTypeText(order.orderType) }}</view>
          <view class="info-list" v-if="order.items && order.items.length">
            <view class="goods-item" v-for="(item, idx) in order.items" :key="idx">
              <image class="goods-img" :src="normalizeImageUrl(item.productImage || item.product?.coverImage)" mode="aspectFill" />
              <view class="goods-info">
                <view class="goods-name">{{ item.productName || item.product?.name }}</view>
                <view class="goods-price-row">
                  <text class="goods-price"><text>¥</text>{{ item.price }} <text class="goods-quantity">x{{ item.quantity }}</text></text>
                </view>
              </view>
            </view>
          </view>
          <view class="info-list" v-else>
            <view class="info-row">
              <text>订单内容</text>
              <text>{{ order.remark || orderTypeText(order.orderType) }}</text>
            </view>
          </view>
        </view>

        <!-- 积分抵扣 -->
        <view class="section-card" v-if="order.pointsUsed > 0">
          <view class="section-title">积分抵扣</view>
          <view class="info-row">
            <text>消耗积分</text>
            <text class="points-val">-{{ order.pointsUsed }} 积分</text>
          </view>
          <view class="info-row" v-if="order.pointsDeduct > 0">
            <text>抵扣现金</text>
            <text class="points-val">-¥{{ order.pointsDeduct }}</text>
          </view>
        </view>

        <!-- 订单信息 -->
        <view class="section-card">
          <view class="section-title">订单信息</view>
          <view class="info-row">
            <text>订单编号</text>
            <text>{{ order.orderNo }}</text>
          </view>
          <view class="info-row">
            <text>下单时间</text>
            <text>{{ formatTime(order.createdAt) }}</text>
          </view>
          <view class="info-row" v-if="order.paidAt">
            <text>支付时间</text>
            <text>{{ formatTime(order.paidAt) }}</text>
          </view>
          <view class="info-row" v-if="order.orderType === 'product'">
            <text>收货地址</text>
            <text>{{ order.address ? order.address.receiver + ' ' + order.address.phone : '—' }}</text>
          </view>
        </view>
      </template>
    </view>

    <view class="bottom-bar" v-if="order.id">
      <button v-if="order.status === 'pending_payment'" class="pay-btn" @click="goPay(order.id)">立即支付</button>
      <button v-else-if="order.status === 'shipped' && order.orderType === 'product'" class="pay-btn" @click="confirmReceive(order.id)">确认收货</button>
      <button class="view-btn" @click="$router.push('/order/list')">返回订单列表</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { sbStyle } from '@/utils/sb'
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { onLoad } from '@dcloudio/uni-app'
import { getOrder, confirmOrder } from '@/api'
import { svgUri } from '@/utils/svg'

const route = useRoute()
const router = useRouter()
// 页面参数：onLoad(options) 由小程序运行时直接传入（setup/onMounted 时页面尚未入栈，
// getCurrentPages() 取不到参数，computed 无响应式依赖还会永久缓存空值）
const pageOptions = ref<Record<string, string>>({})
const orderId = computed(() => Number(pageOptions.value.id) || Number(route.params.id) || 0)
const order = ref<any>({})
const loading = ref(false)

const iconBack = svgUri('<path d="m15 18-6-6 6-6"/>', { color: '#1e1b4b' })
const iconStatusPending = svgUri(
  '<path d="M12 1a3 3 0 013 3 3 3 0 013 3 3 3 0 013 3c0 2-1 3-3 3H9c-2 0-3-2-3-4a3 3 0 013-3"/><path d="M12 1v4M12 16v5"/>',
  { color: '#ffffff', strokeWidth: '2' }
)
const iconStatusOk = svgUri('<polyline points="20 6 9 17 4 12"/>', { color: '#ffffff', strokeWidth: '2' })

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

function showToast(msg: string) {
  uni.showToast({ title: msg, icon: 'none' })
}

async function loadOrder() {
  if (!orderId.value) return
  loading.value = true
  try {
    order.value = (await getOrder(orderId.value)) || {}
  } catch (err: any) {
    showToast(err.userMessage || err.message || '加载订单失败')
  } finally {
    loading.value = false
  }
}

function goPay(id: number) {
  router.push(`/order/pay/${id}`)
}

function confirmReceive(id: number) {
  uni.showModal({
    title: '提示',
    content: '确认已收到该订单商品？',
    success: (res) => {
      if (!res.confirm) return
      confirmOrder(id)
        .then(() => {
          showToast('确认收货成功')
          loadOrder()
        })
        .catch((err: any) => {
          showToast(err.userMessage || err.message || '确认失败')
        })
    },
  })
}

// 页面加载：onLoad 时机参数已就绪，立即拉取订单
onLoad((options: any) => {
  pageOptions.value = options || {}
  loadOrder()
})
</script>

<style scoped>
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
.status-icon image { width: 26px; height: 26px; }
.status-text { font-size: 18px; font-weight: 700; }
.status-hint { font-size: 12px; opacity: 0.85; margin-top: 4px; }
.amount-card {
  margin: 0 16px 12px; padding: 18px 16px; border-radius: var(--radius-xl);
  background: rgba(255,255,255,0.75); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.5);
  box-shadow: var(--glass-shadow);
}
.amount-label { font-size: 13px; color: var(--color-text-secondary); }
.amount-value { font-size: 32px; font-weight: 800; color: var(--color-primary); margin: 4px 0; }
.amount-value text { font-size: 16px; font-weight: 400; }
.amount-no { font-size: 12px; color: var(--color-text-tertiary); }
.section-card {
  margin: 0 16px 12px; padding: 16px; border-radius: var(--radius-xl);
  background: rgba(255,255,255,0.75); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.5);
  box-shadow: var(--glass-shadow);
}
.section-title { font-size: 15px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 12px; }
.info-list { display: flex; flex-direction: column; gap: 10px; }
.goods-item { display: flex; gap: 10px; }
.goods-img { width: 64px; height: 64px; border-radius: 8px; background: #f5f5f5; }
.goods-info { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
.goods-name { font-size: 13px; font-weight: 600; color: var(--color-text-primary); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.goods-price-row { display: flex; justify-content: space-between; align-items: center; }
.goods-price { font-size: 13px; font-weight: 700; color: var(--color-primary); }
.goods-price text { font-size: 10px; font-weight: 400; }
.goods-quantity { font-size: 12px; color: var(--color-text-secondary); }
.info-row { display: flex; justify-content: space-between; align-items: flex-start; font-size: 13px; padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.04); }
.info-row:last-child { border-bottom: none; }
.info-row text:first-child { color: var(--color-text-secondary); flex-shrink: 0; margin-right: 16px; }
.info-row text:last-child { color: var(--color-text-primary); text-align: right; word-break: break-all; }
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
