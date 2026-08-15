<template>
  <div class="phone-frame">
    <div class="header">
      <div class="header-left">
        <div class="back-btn" @click="$router.back()"><image class="back-icon" :src="iconBack" mode="aspectFit" /></div>
        <span class="header-title">确认订单</span>
      </div>
    </div>

    <div class="main-scroll">
      <!-- Address -->
      <div class="address-card" @click="showAddressPicker = true">
        <div v-if="selectedAddress" class="address-content">
          <div class="address-top">
            <span class="address-name">{{ selectedAddress.receiver }}</span>
            <span class="address-phone">{{ selectedAddress.phone }}</span>
            <span v-if="selectedAddress.isDefault" class="default-tag">默认</span>
          </div>
          <div class="address-detail">{{ selectedAddress.province }}{{ selectedAddress.city }}{{ selectedAddress.district }}{{ selectedAddress.detail }}</div>
        </div>
        <div v-else class="address-empty">+ 请选择收货地址</div>
        <image class="address-arrow" :src="iconChevron" mode="aspectFit" />
      </div>

      <!-- Goods -->
      <div class="goods-card">
        <div class="goods-title">商品信息</div>
        <div class="goods-list">
          <div class="goods-item" v-for="(item, idx) in goodsList" :key="idx">
            <image class="goods-img" :src="normalizeImageUrl(item.coverImage || item.product?.coverImage)" mode="aspectFill" />
            <div class="goods-info">
              <div class="goods-name">{{ item.name || item.product?.name }}</div>
              <div class="goods-price-row">
                <span class="goods-price"><span>¥</span>{{ item.effectivePrice ?? item.price ?? item.product?.price }}</span>
                <span class="goods-quantity">x{{ item.quantity }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="remark-row">
          <span>订单备注</span>
          <input v-model="remark" placeholder="选填，请输入备注" />
        </div>
      </div>

      <!-- Summary -->
      <div class="summary-card">
        <div class="summary-row">
          <span>商品总价</span>
          <span>¥{{ totalPrice }}</span>
        </div>
        <!-- 优惠券入口 -->
        <div class="summary-row coupon-row" v-if="payType !== 'points'" @click="openCouponPicker">
          <span>优惠券</span>
          <span class="coupon-value" :class="{ active: couponInfo }">
            <template v-if="couponInfo">-¥{{ couponDeduct }}（{{ couponInfo.coupon?.name }}）</template>
            <template v-else>{{ usableCoupons.length ? `${usableCoupons.length} 张可用` : '暂无可用' }}</template>
          </span>
          <image class="coupon-arrow" :src="iconChevron" mode="aspectFit" />
        </div>
        <!-- 积分抵扣明细 -->
        <template v-if="payType === 'points'">
          <div class="summary-row points-used">
            <span>积分抵扣</span>
            <span class="points-total">{{ pointsPlan.pointsUsed }} 积分（全额）</span>
          </div>
        </template>
        <template v-else-if="payType === 'points_cash'">
          <div class="summary-row points-used">
            <span>积分抵扣现金</span>
            <span>-¥{{ pointsPlan.cashDeduct }}</span>
          </div>
          <div class="summary-row">
            <span>消耗积分</span>
            <span class="points-total">{{ pointsPlan.pointsUsed }} 积分</span>
          </div>
          <div class="points-input-row" v-if="pointsPlan.maxPoints > pointsPlan.minLimit">
            <span>使用积分</span>
            <div class="points-input-wrap">
              <input
                type="number"
                class="points-input"
                :value="pointsUsed"
                @change="onPointsInput"
              />
              <span class="points-max">最多 {{ pointsPlan.maxPoints }}</span>
            </div>
          </div>
        </template>
        <div class="summary-row">
          <span>运费</span>
          <span>免运费</span>
        </div>
        <div class="summary-row total">
          <span>应付总额</span>
          <span class="total-amount">
            <template v-if="payType === 'points'">
              <span class="points-amount">{{ pointsPlan.pointsUsed }} 积分</span>
            </template>
            <template v-else>
              <span>¥</span>{{ totalPayAmount }}
            </template>
          </span>
        </div>
      </div>
    </div>

    <div class="bottom-bar">
      <div class="total-wrap">
        <span class="total-label">应付：</span>
        <span class="total-price">
          <template v-if="payType === 'points'">
            <span class="points-amount">{{ pointsPlan.pointsUsed }} 积分</span>
          </template>
          <template v-else>
            <span>¥</span>{{ totalPayAmount }}
          </template>
        </span>
      </div>
      <button class="submit-btn" :disabled="submitting" @click="handleSubmit">
        {{ submitting ? '提交中...' : payType === 'points' ? '积分兑换' : '提交订单' }}
      </button>
    </div>

    <!-- Coupon Picker -->
    <div class="picker-mask" v-if="showCouponPicker" @click="showCouponPicker = false">
      <div class="picker-panel" @click.stop>
        <div class="picker-header">
          <span>选择优惠券</span>
          <span class="picker-close" @click="showCouponPicker = false">关闭</span>
        </div>
        <div class="coupon-picker-list">
          <div class="coupon-picker-item" :class="{ disabled: !c.usable }" v-for="c in usableCoupons" :key="c.id" @click="selectCoupon(c)">
            <div class="coupon-picker-radio" :class="{ checked: selectedCouponId === c.id }">
              <text v-if="selectedCouponId === c.id" class="radio-mark">✓</text>
            </div>
            <div class="coupon-picker-preview">
              <div class="coupon-picker-value">
                <template v-if="c.coupon.type === 'percent'">
                  <span class="cp-num">{{ formatPercent(c.coupon.value) }}</span>折
                </template>
                <template v-else>
                  <span class="cp-unit">¥</span><span class="cp-num">{{ c.coupon.value }}</span>
                </template>
              </div>
              <div class="coupon-picker-name">{{ c.coupon.name }}</div>
              <div class="coupon-picker-cond">{{ c.coupon.minAmount > 0 ? '满¥' + c.coupon.minAmount + '可用' : '无门槛' }}<span v-if="c.coupon.type === 'percent' && c.coupon.discountCap"> · 最高减¥{{ c.coupon.discountCap }}</span></div>
            </div>
            <div class="coupon-picker-save" :class="{ active: selectedCouponId === c.id }">-¥{{ c.deduct }}</div>
          </div>
          <div class="coupon-picker-item" @click="selectCoupon(null)" v-if="usableCoupons.length && selectedCouponId">
            <div class="coupon-picker-radio"></div>
            <div class="coupon-picker-preview">
              <div class="coupon-picker-name">不使用优惠券</div>
            </div>
          </div>
          <div class="coupon-picker-empty" v-if="!usableCoupons.length">暂无可用优惠券</div>
        </div>
      </div>
    </div>

    <!-- Address Picker -->
    <div class="picker-mask" v-if="showAddressPicker" @click="showAddressPicker = false">
      <div class="picker-panel" @click.stop>
        <div class="picker-header">
          <span>选择收货地址</span>
          <span class="picker-close" @click="showAddressPicker = false">关闭</span>
        </div>
        <div class="address-list">
          <div class="picker-address" v-for="addr in addresses" :key="addr.id" @click="selectAddress(addr)">
            <div class="picker-radio" :class="{ checked: selectedAddress?.id === addr.id }">
              <text v-if="selectedAddress?.id === addr.id" class="radio-mark">✓</text>
            </div>
            <div class="picker-info">
              <div class="picker-top">
                <span>{{ addr.receiver }}</span>
                <span>{{ addr.phone }}</span>
                <span v-if="addr.isDefault" class="default-tag">默认</span>
              </div>
              <div class="picker-detail">{{ addr.province }}{{ addr.city }}{{ addr.district }}{{ addr.detail }}</div>
            </div>
          </div>
          <div class="add-address" @click="$router.push('/address/edit')">+ 新增收货地址</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getAddresses, getProduct, getCart,
  createOrder, createOrderFromCart, getUserCoupons,
} from '@/api'
import { useUserStore } from '@/store/user'
import { showToast } from '@/utils/toast'
import { svgUri } from '@/utils/svg'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const iconBack = svgUri('<path d="m15 18-6-6 6-6"/>', { color: '#1e1b4b' })
const iconChevron = svgUri('<path d="M9 18l6-6-6-6"/>', { color: '#9ca3af' })

const productId = computed(() => Number(route.query.productId) || 0)
const quantity = computed(() => Number(route.query.quantity) || 1)
const payType = computed(() => (route.query.payType as string) || 'cash')
const cartItemIds = computed(() => {
  const raw = route.query.cartItemIds as string
  return raw ? raw.split(',').map(Number).filter(Boolean) : []
})
const isCartMode = computed(() => cartItemIds.value.length > 0)

const addresses = ref<any[]>([])
const selectedAddress = ref<any>(null)
const goodsList = ref<any[]>([])
const remark = ref('')
const loading = ref(false)
const submitting = ref(false)
const showAddressPicker = ref(false)

// 当前商品（积分下单需要读取商品配置）
const currentProduct = ref<any>(null)
// 组合支付时用户实际使用的积分
const pointsUsed = ref(0)

// ===== 优惠券 =====
const showCouponPicker = ref(false)
const allCoupons = ref<any[]>([])
const selectedCouponId = ref<number | null>(null)

/** 用户可用（未使用、未过期）且满足门槛的优惠券，附带计算好的抵扣金额 */
const usableCoupons = computed(() => {
  const base = payType.value === 'cash' ? totalPrice.value : pointsPlan.value.totalAmount
  const orderAmount = Number(base) || 0
  return allCoupons.value
    .filter((c) => c && c.coupon && c.status === 'unused')
    .map((c) => {
      const coupon = c.coupon
      const expired = c.expiresAt && new Date(c.expiresAt).getTime() < Date.now()
      const meetMin = Number(coupon.minAmount) <= orderAmount
      let deduct = 0
      if (coupon.type === 'percent') {
        // 折扣为十进制小数，如 9.5 折 ==> value = 0.95，优惠 = 总额 × (1 - value)
        deduct = Math.round(orderAmount * (1 - Number(coupon.value)) * 100) / 100
        if (coupon.discountCap && Number(coupon.discountCap) > 0) {
          deduct = Math.min(deduct, Number(coupon.discountCap))
        }
      } else {
        deduct = Math.min(Number(coupon.value), orderAmount)
      }
      deduct = Math.round(deduct * 100) / 100
      return { ...c, usable: !expired && meetMin, expired, deduct }
    })
    .sort((a, b) => (a.usable === b.usable ? 0 : a.usable ? -1 : 1))
})

/** 当前选中的优惠券 */
const couponInfo = computed(() => {
  if (!selectedCouponId.value) return null
  return usableCoupons.value.find((c) => c.id === selectedCouponId.value && c.usable) || null
})

/** 优惠券抵扣金额 */
const couponDeduct = computed(() => {
  const c = couponInfo.value
  if (!c) return '0.00'
  return Number(c.deduct || 0).toFixed(2)
})

function formatPercent(v: number) {
  const n = Number(v)
  if (Number.isNaN(n)) return '-'
  return (n * 10).toFixed(1).replace(/\.0$/, '')
}

function openCouponPicker() {
  showCouponPicker.value = true
}

function selectCoupon(c: any) {
  if (c && !c.usable) return
  selectedCouponId.value = c ? c.id : null
  showCouponPicker.value = false
}

async function loadCoupons() {
  try {
    const data = await getUserCoupons({ status: 'unused', page: 1, size: 50 })
    allCoupons.value = data?.list || []
    // 若已选券在重新加载后不再可用，则取消选中
    if (selectedCouponId.value && !couponInfo.value) {
      selectedCouponId.value = null
    }
  } catch {
    allCoupons.value = []
  }
}

/** 积分支付方案（与后端 computePointsPlan 逻辑保持一致，仅用于展示） */
const pointsPlan = computed(() => {
  const p = currentProduct.value || {}
  // VIP 用户使用 vipPrice 作为计算基数（与后端一致）
  const price = getEffectivePrice(p)
  const qty = quantity.value
  const totalAmount = price * qty
  const enabled = Number(p.pointsEnabled) || 0

  if (payType.value === 'points' && enabled === 1) {
    const required = (Number(p.pointsPrice) || 0) * qty
    // 纯积分同样受单笔最高积分限制（与后端一致）
    const maxPointsLimit = Number(p.pointsMaxLimit) || 0
    const usable = maxPointsLimit > 0 ? Math.min(required, maxPointsLimit) : required
    return {
      mode: 'points',
      pointsUsed: required,
      cashDeduct: totalAmount.toFixed(2),
      payAmount: 0,
      totalAmount: totalAmount.toFixed(2),
      maxPoints: usable,
      maxPointsLimit,
      minLimit: 0,
    }
  }

  if (payType.value === 'points_cash' && enabled === 2) {
    const rate = Number(p.pointsRate) || 100
    let maxCash = totalAmount
    if (p.pointsDeductMode === 'ratio') {
      const pct = Number(p.pointsRatioPercent) || 0
      maxCash = Math.min(maxCash, (totalAmount * pct) / 100)
    }
    const cap = Number(p.pointsMaxDeduct) || 0
    if (cap > 0) maxCash = Math.min(maxCash, cap)
    maxCash = Math.min(maxCash, Math.max(0, totalAmount - 0.01))

    const minLimit = Number(p.pointsMinLimit) || 0
    // 单笔最高可抵扣现金对应的积分上限（积分上限优先于现金上限折算）
    const maxPointsLimit = Number(p.pointsMaxLimit) || 0
    let maxPoints = Math.ceil(maxCash * rate)
    if (maxPointsLimit > 0) maxPoints = Math.min(maxPoints, maxPointsLimit)

    // 用户输入的积分（未输入则默认用满）
    // 与后端 computePointsPlan 保持一致：先按积分上限截断，再夹取到 [minLimit, maxPoints]
    let want = Number(pointsUsed.value) || 0
    if (want <= 0) want = maxPoints
    want = Math.min(Math.max(want, minLimit), maxPoints)

    const rawCash = want / rate
    const cashDeduct = Math.min(rawCash, maxCash)
    const used = Math.ceil(cashDeduct * rate)
    const payAmount = Math.max(0, Math.round((totalAmount - cashDeduct) * 100) / 100)

    return {
      mode: 'points_cash',
      pointsUsed: used,
      cashDeduct: (Math.round(cashDeduct * 100) / 100).toFixed(2),
      payAmount: payAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      maxPoints,
      maxPointsLimit,
      minLimit,
    }
  }

  return {
    mode: 'cash',
    pointsUsed: 0,
    cashDeduct: 0,
    payAmount: totalAmount.toFixed(2),
    totalAmount: totalAmount.toFixed(2),
    maxPoints: 0,
    minLimit: 0,
  }
})

/**
 * 获取商品对当前用户的实际结算单价：
 * VIP 用户且商品配置了有效 vipPrice（>0 且 < price）时返回 vipPrice，否则返回 price
 */
function getEffectivePrice(product: any): number {
  if (!product) return 0
  const price = Number(product.price) || 0
  if (
    userStore.isVip &&
    Number(product.vipPrice) > 0 &&
    Number(product.vipPrice) < price
  ) {
    return Number(product.vipPrice)
  }
  return price
}

const totalPrice = computed(() => {
  return goodsList.value
    .reduce((sum, item) => {
      // 优先使用已计算的 effectivePrice，其次回退到 item.price / product.price
      const unitPrice = item.effectivePrice ?? item.price ?? item.product?.price ?? 0
      return sum + unitPrice * (item.quantity || 1)
    }, 0)
    .toFixed(2)
})

/** 应付现金（组合支付 = 商品价 - 积分抵扣；纯积分 = 0；均再扣优惠券） */
const totalPayAmount = computed(() => {
  let cash: number
  if (payType.value === 'points') return '0.00'
  if (payType.value === 'points_cash') cash = Number(pointsPlan.value.payAmount) || 0
  else cash = Number(totalPrice.value) || 0
  const ded = Number(couponDeduct.value) || 0
  return Math.max(0, Math.round((cash - ded) * 100) / 100).toFixed(2)
})

function onPointsInput(e: any) {
  const v = Number(e.detail.value) || 0
  const plan = pointsPlan.value
  if (v < plan.minLimit) {
    showToast(`至少使用 ${plan.minLimit} 积分`)
    pointsUsed.value = plan.minLimit
  } else if (v > plan.maxPoints) {
    showToast(`最多使用 ${plan.maxPoints} 积分`)
    pointsUsed.value = plan.maxPoints
  } else {
    pointsUsed.value = v
  }
}

function normalizeImageUrl(url: string | undefined): string {
  if (!url) return ''
  if (url.startsWith('http') || url.startsWith('//')) return url
  if (url.startsWith('/api/')) return url
  if (url.startsWith('/uploads/')) return '/api' + url
  return url
}

async function loadAddresses() {
  try {
    const data = await getAddresses()
    const list = Array.isArray(data) ? data : data?.list || []
    addresses.value = list
    selectedAddress.value = list.find((a: any) => a.isDefault) || list[0] || null
  } catch (err: any) {
    showToast(err.userMessage || err.message || '加载地址失败')
  }
}

async function loadGoods() {
  loading.value = true
  try {
    if (isCartMode.value) {
      const data = await getCart()
      const list = Array.isArray(data) ? data : data?.list || []
      // 为每个购物车商品计算 VIP 实际结算价
      goodsList.value = list
        .filter((item: any) => cartItemIds.value.includes(item.id))
        .map((item: any) => ({
          ...item,
          effectivePrice: getEffectivePrice(item.product),
        }))
    } else if (productId.value) {
      const product = await getProduct(productId.value)
      currentProduct.value = product
      const effPrice = getEffectivePrice(product)
      goodsList.value = [{
        name: product.name,
        coverImage: product.coverImage,
        price: effPrice,
        effectivePrice: effPrice,
        quantity: quantity.value,
      }]
      // 组合支付默认用满积分（基于实际结算价计算）
      if (payType.value === 'points_cash' && Number(product.pointsEnabled) === 2) {
        const rate = Number(product.pointsRate) || 100
        let maxCash = effPrice * quantity.value
        if (product.pointsDeductMode === 'ratio') {
          const pct = Number(product.pointsRatioPercent) || 0
          maxCash = Math.min(maxCash, (maxCash * pct) / 100)
        }
        const cap = Number(product.pointsMaxDeduct) || 0
        if (cap > 0) maxCash = Math.min(maxCash, cap)
        maxCash = Math.min(maxCash, Math.max(0, maxCash - 0.01))
        pointsUsed.value = Math.ceil(maxCash * rate)
      }
    }
  } catch (err: any) {
    showToast(err.userMessage || err.message || '加载商品失败')
  } finally {
    loading.value = false
  }
}

function selectAddress(addr: any) {
  selectedAddress.value = addr
  showAddressPicker.value = false
}

async function handleSubmit() {
  // 纯积分订单无需收货地址；组合支付/现金仍需要
  if (payType.value !== 'points' && !selectedAddress.value) {
    showToast('请选择收货地址')
    return
  }
  submitting.value = true
  try {
    let order: any
    if (isCartMode.value) {
      order = await createOrderFromCart({
        cartItemIds: cartItemIds.value,
        addressId: selectedAddress.value?.id,
        remark: remark.value,
        couponId: selectedCouponId.value || undefined,
      })
    } else {
      order = await createOrder({
        productId: productId.value,
        quantity: quantity.value,
        addressId: selectedAddress.value?.id,
        remark: remark.value,
        payType: payType.value === 'cash' ? undefined : payType.value,
        pointsUsed: payType.value === 'points_cash' ? pointsPlan.value.pointsUsed : undefined,
        couponId: selectedCouponId.value || undefined,
      })
    }
    const orderId = order?.id || order?.data?.id
    if (payType.value === 'points') {
      // 纯积分：下单即完成，直接跳成功页
      router.replace(`/order/success?orderId=${orderId}&amount=0&points=${pointsPlan.value.pointsUsed}`)
      return
    }
    router.push(`/order/pay/${orderId}`)
  } catch (err: any) {
    // 优先展示后端返回的中文业务错误（如"积分不足"），避免显示英文 axios 错误
    showToast(err.userMessage || err.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  // 先刷新用户信息（确保VIP状态最新），再加载商品（价格依赖VIP身份）
  await userStore.fetchUserInfo()
  loadAddresses()
  loadGoods()
  loadCoupons()
})
</script>

<style scoped>
.address-card {
  margin: 12px 16px; padding: 16px; border-radius: var(--radius-xl);
  background: rgba(255,255,255,0.75); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.5);
  box-shadow: var(--glass-shadow); display: flex; align-items: center; gap: 12px; position: relative;
}
.address-content { flex: 1; }
.address-top { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.address-name { font-size: 16px; font-weight: 700; color: var(--color-text-primary); }
.address-phone { font-size: 14px; color: var(--color-text-secondary); }
.default-tag { font-size: 10px; color: var(--color-primary); background: rgba(99,102,241,0.1); padding: 2px 6px; border-radius: 4px; }
.address-detail { font-size: 13px; color: var(--color-text-secondary); line-height: 1.5; }
.address-empty { flex: 1; font-size: 15px; color: var(--color-primary); font-weight: 600; }
.address-arrow { width: 18px; height: 18px; }
.back-icon { width: 20px; height: 20px; }
.goods-card {
  margin: 0 16px 12px; padding: 16px; border-radius: var(--radius-xl);
  background: rgba(255,255,255,0.75); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.5);
  box-shadow: var(--glass-shadow);
}
.goods-title { font-size: 15px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 12px; }
.goods-list { display: flex; flex-direction: column; gap: 12px; }
.goods-item { display: flex; gap: 12px; }
.goods-img { width: 80px; height: 80px; border-radius: 8px; background: #f5f5f5; }
.goods-info { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
.goods-name { font-size: 14px; font-weight: 600; color: var(--color-text-primary); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.goods-price-row { display: flex; justify-content: space-between; align-items: center; }
.goods-price { font-size: 15px; font-weight: 700; color: var(--color-primary); }
.goods-price text { font-size: 12px; font-weight: 400; }
.goods-quantity { font-size: 13px; color: var(--color-text-secondary); }
.remark-row { display: flex; align-items: center; gap: 12px; margin-top: 16px; padding-top: 14px; border-top: 1px solid rgba(0,0,0,0.05); }
.remark-row text { font-size: 14px; color: var(--color-text-secondary); flex-shrink: 0; }
.remark-row input { flex: 1; border: none; background: transparent; font-size: 14px; color: var(--color-text-primary); outline: none; }
.summary-card {
  margin: 0 16px 12px; padding: 16px; border-radius: var(--radius-xl);
  background: rgba(255,255,255,0.75); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.5);
  box-shadow: var(--glass-shadow);
}
.summary-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 14px; color: var(--color-text-secondary); }
.coupon-row { cursor: pointer; }
.coupon-value { color: var(--color-text-tertiary); font-size: 13px; }
.coupon-value.active { color: #f59e0b; font-weight: 600; }
.coupon-arrow { width: 16px; height: 16px; flex-shrink: 0; }
.coupon-picker-list { max-height: 60vh; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
.coupon-picker-item {
  display: flex; align-items: center; gap: 12px; padding: 12px;
  border: 1px solid #f3f4f6; border-radius: var(--radius-lg); cursor: pointer;
}
.coupon-picker-item.disabled { opacity: 0.5; }
.coupon-picker-radio {
  width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--color-text-tertiary);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.coupon-picker-radio.checked { background: var(--color-primary); border-color: var(--color-primary); }
.radio-mark { color: #fff; font-size: 12px; font-weight: 700; line-height: 1; }
.coupon-picker-preview { flex: 1; min-width: 0; }
.coupon-picker-value { font-size: 13px; color: var(--color-primary); font-weight: 700; margin-bottom: 2px; }
.cp-num { font-size: 18px; font-weight: 800; }
.cp-unit { font-size: 12px; }
.coupon-picker-name { font-size: 14px; font-weight: 600; color: var(--color-text-primary); margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.coupon-picker-cond { font-size: 12px; color: var(--color-text-tertiary); }
.coupon-picker-save { font-size: 14px; font-weight: 700; color: var(--color-text-tertiary); flex-shrink: 0; }
.coupon-picker-save.active { color: #f59e0b; }
.coupon-picker-empty { text-align: center; padding: 40px 0; color: var(--color-text-tertiary); font-size: 14px; }
.summary-row.total { margin-bottom: 0; padding-top: 12px; border-top: 1px solid rgba(0,0,0,0.05); }
.total-amount { font-size: 18px; font-weight: 700; color: var(--color-primary); }
.total-amount text { font-size: 12px; font-weight: 400; }
.points-used { color: #d97706; }
.points-total { font-weight: 700; color: #d97706; }
.points-amount { font-size: 18px; font-weight: 800; color: #d97706; }
.points-input-row {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 10px; font-size: 14px; color: var(--color-text-secondary);
}
.points-input-wrap { display: flex; align-items: center; gap: 8px; }
.points-input {
  width: 96px; padding: 6px 10px; border: 1px solid rgba(0,0,0,0.12);
  border-radius: 8px; font-size: 14px; color: var(--color-text-primary);
  text-align: right; outline: none;
}
.points-max { font-size: 12px; color: var(--color-text-tertiary); }
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
.submit-btn { padding: 12px 24px; border: none; border-radius: 99px; background: var(--color-primary); color: #fff; font-size: 15px; font-weight: 600; }
.submit-btn:disabled { opacity: 0.6; }
.picker-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 300; display: flex; align-items: flex-end; }
.picker-panel { width: 100%; max-width: 430px; margin: 0 auto; background: #fff; border-radius: 20px 20px 0 0; padding: 16px 16px var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 16px)); }
.picker-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; font-size: 16px; font-weight: 700; }
.picker-close { font-size: 14px; color: var(--color-text-secondary); }
.address-list { max-height: 60vh; overflow-y: auto; }
.picker-address { display: flex; gap: 10px; padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
.picker-radio { width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--color-text-tertiary); display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
.picker-radio.checked { background: var(--color-primary); border-color: var(--color-primary); }
.picker-info { flex: 1; }
.picker-top { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; font-size: 14px; color: var(--color-text-primary); }
.picker-detail { font-size: 13px; color: var(--color-text-secondary); line-height: 1.5; }
.add-address { text-align: center; padding: 16px 0; font-size: 15px; color: var(--color-primary); font-weight: 600; }
</style>
