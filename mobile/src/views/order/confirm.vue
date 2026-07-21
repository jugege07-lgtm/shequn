<template>
  <div class="phone-frame">
    <div class="header">
      <div class="header-left">
        <div class="back-btn" @click="$router.back()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m15 18-6-6 6-6"/></svg></div>
        <span class="header-title">确认订单</span>
      </div>
    </div>

    <div class="main-scroll" v-loading="loading">
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
        <svg class="address-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
      </div>

      <!-- Goods -->
      <div class="goods-card">
        <div class="goods-title">商品信息</div>
        <div class="goods-list">
          <div class="goods-item" v-for="(item, idx) in goodsList" :key="idx">
            <img class="goods-img" :src="normalizeImageUrl(item.coverImage || item.product?.coverImage)" />
            <div class="goods-info">
              <div class="goods-name">{{ item.name || item.product?.name }}</div>
              <div class="goods-price-row">
                <span class="goods-price"><span>¥</span>{{ item.price || item.product?.price }}</span>
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
        <div class="summary-row">
          <span>运费</span>
          <span>免运费</span>
        </div>
        <div class="summary-row total">
          <span>应付总额</span>
          <span class="total-amount"><span>¥</span>{{ totalPrice }}</span>
        </div>
      </div>
    </div>

    <div class="bottom-bar">
      <div class="total-wrap">
        <span class="total-label">应付：</span>
        <span class="total-price"><span>¥</span>{{ totalPrice }}</span>
      </div>
      <button class="submit-btn" :disabled="submitting" @click="handleSubmit">
        {{ submitting ? '提交中...' : '提交订单' }}
      </button>
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
              <svg v-if="selectedAddress?.id === addr.id" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
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
  createOrder, createOrderFromCart,
} from '@/api'

const route = useRoute()
const router = useRouter()

const productId = computed(() => Number(route.query.productId) || 0)
const quantity = computed(() => Number(route.query.quantity) || 1)
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
    showToast(err.message || '加载地址失败')
  }
}

async function loadGoods() {
  loading.value = true
  try {
    if (isCartMode.value) {
      const data = await getCart()
      const list = Array.isArray(data) ? data : data?.list || []
      goodsList.value = list.filter((item: any) => cartItemIds.value.includes(item.id))
    } else if (productId.value) {
      const product = await getProduct(productId.value)
      goodsList.value = [{
        name: product.name,
        coverImage: product.coverImage,
        price: product.price,
        quantity: quantity.value,
      }]
    }
  } catch (err: any) {
    showToast(err.message || '加载商品失败')
  } finally {
    loading.value = false
  }
}

const totalPrice = computed(() => {
  return goodsList.value
    .reduce((sum, item) => sum + (item.price || item.product?.price || 0) * (item.quantity || 1), 0)
    .toFixed(2)
})

function selectAddress(addr: any) {
  selectedAddress.value = addr
  showAddressPicker.value = false
}

async function handleSubmit() {
  if (!selectedAddress.value) {
    showToast('请选择收货地址')
    return
  }
  submitting.value = true
  try {
    let order: any
    if (isCartMode.value) {
      order = await createOrderFromCart({ cartItemIds: cartItemIds.value, addressId: selectedAddress.value.id, remark: remark.value })
    } else {
      order = await createOrder({
        productId: productId.value,
        quantity: quantity.value,
        addressId: selectedAddress.value.id,
        remark: remark.value,
      })
    }
    const orderId = order?.id || order?.data?.id
    router.push(`/order/pay/${orderId}`)
  } catch (err: any) {
    showToast(err.message || '提交失败')
  } finally {
    submitting.value = false
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
  document.title = '确认订单'
  loadAddresses()
  loadGoods()
})
</script>

<style scoped>
@import '@/styles/global.css';
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
.address-arrow { width: 18px; height: 18px; color: var(--color-text-tertiary); }
.goods-card {
  margin: 0 16px 12px; padding: 16px; border-radius: var(--radius-xl);
  background: rgba(255,255,255,0.75); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.5);
  box-shadow: var(--glass-shadow);
}
.goods-title { font-size: 15px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 12px; }
.goods-list { display: flex; flex-direction: column; gap: 12px; }
.goods-item { display: flex; gap: 12px; }
.goods-img { width: 80px; height: 80px; border-radius: 8px; object-fit: cover; background: #f5f5f5; }
.goods-info { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
.goods-name { font-size: 14px; font-weight: 600; color: var(--color-text-primary); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.goods-price-row { display: flex; justify-content: space-between; align-items: center; }
.goods-price { font-size: 15px; font-weight: 700; color: var(--color-primary); }
.goods-price span { font-size: 12px; font-weight: 400; }
.goods-quantity { font-size: 13px; color: var(--color-text-secondary); }
.remark-row { display: flex; align-items: center; gap: 12px; margin-top: 16px; padding-top: 14px; border-top: 1px solid rgba(0,0,0,0.05); }
.remark-row span { font-size: 14px; color: var(--color-text-secondary); flex-shrink: 0; }
.remark-row input { flex: 1; border: none; background: transparent; font-size: 14px; color: var(--color-text-primary); outline: none; }
.summary-card {
  margin: 0 16px 12px; padding: 16px; border-radius: var(--radius-xl);
  background: rgba(255,255,255,0.75); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.5);
  box-shadow: var(--glass-shadow);
}
.summary-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 14px; color: var(--color-text-secondary); }
.summary-row.total { margin-bottom: 0; padding-top: 12px; border-top: 1px solid rgba(0,0,0,0.05); }
.total-amount { font-size: 18px; font-weight: 700; color: var(--color-primary); }
.total-amount span { font-size: 12px; font-weight: 400; }
.bottom-bar {
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 430px;
  padding: 10px 16px env(safe-area-inset-bottom, 10px); background: rgba(255,255,255,0.95); backdrop-filter: blur(20px);
  border-top: 0.5px solid rgba(60,60,67,0.1); z-index: 200;
  display: flex; align-items: center; gap: 12px;
}
.total-wrap { flex: 1; text-align: right; }
.total-label { font-size: 13px; color: var(--color-text-secondary); }
.total-price { font-size: 20px; font-weight: 700; color: var(--color-primary); }
.total-price span { font-size: 12px; font-weight: 400; }
.submit-btn { padding: 12px 24px; border: none; border-radius: 99px; background: var(--color-primary); color: #fff; font-size: 15px; font-weight: 600; }
.submit-btn:disabled { opacity: 0.6; }
.picker-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 300; display: flex; align-items: flex-end; }
.picker-panel { width: 100%; max-width: 430px; margin: 0 auto; background: #fff; border-radius: 20px 20px 0 0; padding: 16px 16px env(safe-area-inset-bottom, 16px); }
.picker-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; font-size: 16px; font-weight: 700; }
.picker-close { font-size: 14px; color: var(--color-text-secondary); }
.address-list { max-height: 60vh; overflow-y: auto; }
.picker-address { display: flex; gap: 10px; padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
.picker-radio { width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--color-text-tertiary); display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
.picker-radio.checked { background: var(--color-primary); border-color: var(--color-primary); }
.picker-radio svg { width: 12px; height: 12px; }
.picker-info { flex: 1; }
.picker-top { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; font-size: 14px; color: var(--color-text-primary); }
.picker-detail { font-size: 13px; color: var(--color-text-secondary); line-height: 1.5; }
.add-address { text-align: center; padding: 16px 0; font-size: 15px; color: var(--color-primary); font-weight: 600; }
</style>
