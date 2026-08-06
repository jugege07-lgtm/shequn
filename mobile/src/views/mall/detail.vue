<template>
  <div class="phone-frame">
    <div class="header">
      <div class="header-left">
        <div class="back-btn" @click="$router.back()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m15 18-6-6 6-6"/></svg></div>
        <span class="header-title">商品详情</span>
      </div>
    </div>
    <div class="main-scroll" v-loading="loading">
      <div class="product-cover" v-if="product.coverImage">
        <img
          :src="product.coverImage"
          class="cover-img"
          loading="lazy"
          decoding="async"
          alt="商品首图"
        />
      </div>
      <div class="product-cover" v-else :style="{background: 'linear-gradient(135deg,#6366f1,#8b5cf6)'}">
        <span class="product-emoji">📦</span>
      </div>
      <div class="info-card">
        <div class="price-row">
          <span class="price-main"><span>¥</span>{{ product.price }}</span>
          <span class="price-original" v-if="product.vipPrice && product.vipPrice < product.price">VIP ¥{{ product.vipPrice }}</span>
        </div>
        <h1 class="product-title">{{ product.name }}</h1>
        <div class="quantity-row">
          <span class="quantity-label">数量</span>
          <div class="quantity-stepper">
            <button class="stepper-btn" :disabled="quantity <= 1" @click="quantity--">-</button>
            <span class="stepper-value">{{ quantity }}</span>
            <button class="stepper-btn" @click="quantity++">+</button>
          </div>
        </div>
      </div>
      <div class="info-card">
        <h3 class="section-label">商品详情</h3>
        <div
          v-if="product.description"
          class="rich-content"
          v-html="safeDescription"
        ></div>
        <p v-else class="detail-text">暂无详情</p>
      </div>
    </div>
    <div class="bottom-action dual-action">
      <button class="cart-btn" :disabled="adding" @click="handleAddToCart">
        {{ adding ? '加入中...' : '加入购物车' }}
      </button>
      <button class="buy-btn" @click="handleBuy">立即购买</button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProduct, addToCart } from '@/api'
import { useCartStore } from '@/store/cart'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const product = ref<any>({})
const loading = ref(true)
const adding = ref(false)
const quantity = ref(1)

function normalizeImageUrl(url: string | undefined): string {
  if (!url) return ''
  if (url.startsWith('http') || url.startsWith('//')) return url
  if (url.startsWith('/api/')) return url
  if (url.startsWith('/uploads/')) return '/api' + url
  return url
}

onMounted(async () => {
  try {
    const id = Number(route.query.id || route.params.id)
    if (id) {
      const res = await getProduct(id)
      if (res) {
        res.coverImage = normalizeImageUrl(res.coverImage)
      }
      product.value = res
    }
  } catch (err: any) {
    console.error('加载商品失败', err)
  } finally {
    loading.value = false
  }
})

// 处理富文本 HTML：
// 1. 给所有 <img> 添加 loading="lazy" 实现懒加载（未设置 loading 属性的才添加）
// 2. 移除固定像素宽度和高度，由 CSS max-width: 100% 控制响应式缩放
// 3. 添加 data-role 便于全局 CSS 选择器匹配
const safeDescription = computed(() => {
  const html = product.value?.description || ''
  if (!html) return ''
  let result = html
  // 给没有 loading 属性的 img 标签添加 loading="lazy"
  result = result.replace(/<img(?![^>]*\sloading=)/gi, '<img loading="lazy" decoding="async"')
  // 移除固定像素宽度和高度（防止移动端溢出）
  result = result.replace(/\s+width\s*=\s*["']?\d+px["']?/gi, '')
  result = result.replace(/\s+height\s*=\s*["']?\d+px["']?/gi, '')
  result = result.replace(/\s+width\s*=\s*["']?\d{4,}["']?/gi, '')
  result = result.replace(/\s+height\s*=\s*["']?\d{4,}["']?/gi, '')
  // 添加 data-role 便于 CSS 匹配
  if (!result.includes('data-role=')) {
    result = result.replace('<img', '<img data-role="rich-image"')
  }
  return result
})

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

const handleAddToCart = async () => {
  if (adding.value || !product.value?.id) return
  adding.value = true
  try {
    await addToCart({ productId: product.value.id, quantity: quantity.value })
    showToast('已加入购物车')
    // 同步购物车状态，确保 FloatingCart 角标和购物车页实时更新
    await cartStore.fetchCart()
  } catch (err: any) {
    showToast(err.message || '加入失败')
  } finally {
    adding.value = false
  }
}

const handleBuy = () => {
  if (!product.value?.id) return
  router.push(`/order/confirm?productId=${product.value.id}&quantity=${quantity.value}`)
}
</script>
<style scoped>
@import '@/styles/global.css';
.product-cover { width: 100%; }
.cover-img {
  width: 100%;
  height: auto;
  max-height: 420px;
  object-fit: cover;
  display: block;
  background: #f5f5f5;
}
.product-emoji { font-size: 80px; }
.info-card { margin: 12px 16px; border-radius: var(--radius-xl); background: rgba(255,255,255,0.75); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.5); box-shadow: var(--glass-shadow); padding: 16px; }
.price-row { display: flex; align-items: baseline; gap: 12px; margin-bottom: 8px; }
.price-main { font-size: 28px; font-weight: 800; color: var(--color-primary); }
.price-main span { font-size: 16px; }
.price-original { font-size: 14px; color: var(--color-text-tertiary); text-decoration: line-through; }
.product-title { font-size: 18px; font-weight: 800; color: var(--color-text-primary); line-height: 1.4; margin-bottom: 8px; }
.section-label { font-size: 15px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 10px; }
.detail-text { font-size: 14px; color: var(--color-text-secondary); line-height: 1.8; }
.quantity-row { display: flex; align-items: center; justify-content: space-between; margin-top: 14px; padding-top: 14px; border-top: 1px solid rgba(0,0,0,0.05); }
.quantity-label { font-size: 14px; color: var(--color-text-secondary); }
.quantity-stepper { display: flex; align-items: center; border: 1px solid rgba(0,0,0,0.08); border-radius: 8px; overflow: hidden; }
.stepper-btn { width: 32px; height: 32px; background: #f9fafb; border: none; font-size: 16px; color: var(--color-text-primary); cursor: pointer; }
.stepper-btn:disabled { color: #d1d5db; cursor: not-allowed; }
.stepper-value { min-width: 44px; text-align: center; font-size: 14px; font-weight: 600; color: var(--color-text-primary); }
.bottom-action { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 430px; padding: 12px 16px env(safe-area-inset-bottom, 12px); background: rgba(255,255,255,0.95); backdrop-filter: blur(20px); border-top: 0.5px solid rgba(60,60,67,0.1); z-index: 200; }
.bottom-action.dual-action { display: flex; gap: 12px; }
.cart-btn { flex: 1; padding: 14px; border: 1px solid var(--color-primary); border-radius: 12px; background: #fff; color: var(--color-primary); font-size: 16px; font-weight: 600; cursor: pointer; }
.cart-btn:active { transform: scale(0.98); background: rgba(99,102,241,0.06); }
.cart-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.buy-btn { flex: 1; padding: 14px; border: none; border-radius: 12px; background: var(--color-primary); color: #fff; font-size: 16px; font-weight: 600; cursor: pointer; }
.buy-btn:active { transform: scale(0.98); background: var(--color-primary-dark); }
.buy-btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
