<template>
  <div class="phone-frame">
    <div class="header">
      <div class="header-left">
        <div class="back-btn" @click="goBack"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m15 18-6-6 6-6"/></svg></div>
        <span class="header-title">商品详情</span>
      </div>
      <div class="header-right">
        <div class="header-icon" @click="openShare">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
        </div>
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

        <!-- 积分购买信息区 -->
        <div v-if="Number(product.pointsEnabled) > 0" class="points-panel">
          <!-- 纯积分兑换 -->
          <div v-if="Number(product.pointsEnabled) === 1" class="points-mode points-pure">
            <div class="points-mode-head">
              <span class="points-badge">纯积分兑换</span>
              <span class="points-price">{{ pointsPerUnit }} 积分<span class="points-per">/件</span></span>
            </div>
            <div class="points-mode-desc">无需支付现金，兑换成功自动扣减 {{ pointsPerUnit }} 积分并同步扣减库存</div>
          </div>
          <!-- 积分+现金组合 -->
          <div v-else-if="Number(product.pointsEnabled) === 2" class="points-mode points-combo">
            <div class="points-mode-head">
              <span class="points-badge points-badge-combo">积分 + 现金</span>
              <span class="points-save">最高可抵 ¥{{ maxDeductCash }}</span>
            </div>
            <div class="combo-detail">
              <div class="combo-row">
                <span>兑换汇率</span>
                <span>{{ pointsRate }} 积分 = 1 元</span>
              </div>
              <div class="combo-row">
                <span>抵扣规则</span>
                <span>{{ pointsRuleText }}</span>
              </div>
              <div class="combo-row" v-if="Number(product.pointsMinLimit) > 0">
                <span>使用门槛</span>
                <span>至少使用 {{ product.pointsMinLimit }} 积分</span>
              </div>
            </div>
          </div>
        </div>

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
    <div class="bottom-action" :class="bottomActionClass">
      <button v-if="Number(product.pointsEnabled) !== 1" class="cart-btn" :disabled="adding" @click="handleAddToCart">
        {{ adding ? '加入中...' : '加入购物车' }}
      </button>
      <!-- 纯积分兑换入口 -->
      <button v-if="Number(product.pointsEnabled) === 1" class="points-buy-btn" :disabled="pointsBuying" @click="handlePointsBuy">
        {{ pointsBuying ? '兑换中...' : `${pointsPerUnit} 积分兑换` }}
      </button>
      <!-- 组合支付入口 -->
      <button v-else-if="Number(product.pointsEnabled) === 2" class="combo-buy-btn" @click="handleComboBuy">
        积分+现金购买
      </button>
      <!-- 普通购买入口（非纯积分时显示） -->
      <button v-else class="buy-btn" @click="handleBuy">立即购买</button>
    </div>

    <!-- 分享面板 -->
    <ShareSheet
      v-model="shareOpen"
      :share="shareContent"
      :referrer-id="userStore.userInfo?.id"
      :referrer-name="userStore.userInfo?.nickname || userStore.userInfo?.realName"
    />
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProduct, addToCart } from '@/api'
import { useCartStore } from '@/store/cart'
import { useUserStore } from '@/store/user'
import { recordBrowse } from '@/utils/browseHistory'
import ShareSheet from '@/components/ShareSheet.vue'
import type { ShareContent } from '@/utils/share'
import { normalizeImageUrl } from '@/utils/image'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()
const product = ref<any>({})
const loading = ref(true)
const adding = ref(false)
const pointsBuying = ref(false)
const quantity = ref(1)

// 返回兜底：经分享海报冷启动进入时历史栈为空，router.back() 无处可退 → 回首页
function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.replace('/')
  }
}

// ===== 分享 =====
const shareOpen = ref(false)
const shareContent = ref<ShareContent | null>(null)
function openShare() {
  const p = product.value
  if (!p?.name) return
  const price = Number(p.price) || 0
  shareContent.value = {
    type: 'product',
    title: p.name || '',
    desc: '精选好物推荐，快来抢购吧！',
    image: p.coverImage,
    meta: [],
    price: price === 0 ? '免费' : `¥${price}`,
    path: `/mall/detail/${p.id}`,
  }
  shareOpen.value = true
}

// ===== 积分购买配置派生 =====
/** 每件所需积分（纯积分模式） */
const pointsPerUnit = computed(() => {
  const p = Number(product.value?.pointsPrice) || 0
  return p * quantity.value
})

/** 汇率 N 积分 = 1 元 */
const pointsRate = computed(() => Number(product.value?.pointsRate) || 100)

/** 单件最高可抵现金（组合支付） */
const maxDeductCash = computed(() => {
  const price = Number(product.value?.price) || 0
  let max = price
  if (product.value?.pointsDeductMode === 'ratio') {
    const pct = Number(product.value?.pointsRatioPercent) || 0
    max = Math.min(max, (price * pct) / 100)
  }
  const cap = Number(product.value?.pointsMaxDeduct) || 0
  if (cap > 0) max = Math.min(max, cap)
  return max.toFixed(2)
})

/** 组合支付抵扣规则文案 */
const pointsRuleText = computed(() => {
  const parts: string[] = []
  if (product.value?.pointsDeductMode === 'ratio') {
    const pct = Number(product.value?.pointsRatioPercent) || 0
    parts.push(`可抵商品价格 ${pct}%`)
  } else {
    parts.push(`每 ${pointsRate.value} 积分抵 1 元`)
  }
  const maxLimit = Number(product.value?.pointsMaxLimit) || 0
  if (maxLimit > 0) parts.push(`单笔最多 ${maxLimit} 积分`)
  return parts.join('，')
})

/** 底部操作栏样式 */
const bottomActionClass = computed(() => {
  const en = Number(product.value?.pointsEnabled) || 0
  if (en === 1) return 'points-only'
  return 'dual-action'
})

// normalizeImageUrl 已改用集中式 @/utils/image（含 getApiBase，原生 App 下补全绝对地址）

onMounted(async () => {
  try {
    const id = Number(route.query.id || route.params.id)
    if (id) {
      const res = await getProduct(id)
      if (res) {
        res.coverImage = normalizeImageUrl(res.coverImage)
      }
      product.value = res
      // 记录浏览历史
      recordBrowse('product', res.id, res.name || '')
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
  // 重写 img src 为绝对地址：原生 App 下相对 /uploads/ 会解析失败（origin=https://localhost 无 Caddy 代理）
  result = result.replace(/src\s*=\s*(?:"([^"]*)"|'([^']*)')/gi, (m, dq, sq) => {
    const v = dq ?? sq ?? ''
    return `src="${normalizeImageUrl(v)}"`
  })
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

/** 纯积分兑换：跳转确认页（纯积分模式） */
const handlePointsBuy = () => {
  if (!product.value?.id || pointsBuying.value) return
  router.push(`/order/confirm?productId=${product.value.id}&quantity=${quantity.value}&payType=points`)
}

/** 积分+现金：跳转确认页（组合支付模式） */
const handleComboBuy = () => {
  if (!product.value?.id) return
  router.push(`/order/confirm?productId=${product.value.id}&quantity=${quantity.value}&payType=points_cash`)
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
.bottom-action { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 430px; padding: 12px 16px var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 12px)); background: rgba(255,255,255,0.95); backdrop-filter: blur(20px); border-top: 0.5px solid rgba(60,60,67,0.1); z-index: 200; }
.bottom-action.dual-action,
.bottom-action.points-only { display: flex; gap: 12px; }
.cart-btn { flex: 1; padding: 14px; border: 1px solid var(--color-primary); border-radius: 12px; background: #fff; color: var(--color-primary); font-size: 16px; font-weight: 600; cursor: pointer; }
.cart-btn:active { transform: scale(0.98); background: rgba(99,102,241,0.06); }
.cart-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.buy-btn { flex: 1; padding: 14px; border: none; border-radius: 12px; background: var(--color-primary); color: #fff; font-size: 16px; font-weight: 600; cursor: pointer; }
.buy-btn:active { transform: scale(0.98); background: var(--color-primary-dark); }
.buy-btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* 积分购买按钮 */
.points-buy-btn {
  flex: 1; padding: 14px; border: none; border-radius: 12px;
  background: linear-gradient(135deg, #f59e0b, #f97316); color: #fff;
  font-size: 16px; font-weight: 700; cursor: pointer;
}
.points-buy-btn:active { transform: scale(0.98); }
.points-buy-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.combo-buy-btn {
  flex: 1; padding: 14px; border: none; border-radius: 12px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff;
  font-size: 16px; font-weight: 600; cursor: pointer;
}
.combo-buy-btn:active { transform: scale(0.98); }

/* ===== 积分购买信息面板 ===== */
.points-panel {
  border-radius: 12px;
  background: rgba(99,102,241,0.05);
  border: 1px solid rgba(99,102,241,0.2);
  padding: 12px 14px;
  margin-bottom: 4px;
}
.points-mode-head {
  display: flex; align-items: center; justify-content: space-between;
  gap: 8px; margin-bottom: 8px;
}
.points-badge {
  font-size: 11px; font-weight: 700; color: #b45309;
  background: #fef3c7; padding: 3px 8px; border-radius: 99px;
}
.points-badge-combo {
  color: var(--color-primary); background: rgba(99,102,241,0.12);
}
.points-price { font-size: 18px; font-weight: 800; color: #d97706; }
.points-price .points-per { font-size: 11px; font-weight: 400; color: var(--color-text-tertiary); }
.points-mode-desc { font-size: 12px; color: var(--color-text-secondary); line-height: 1.5; }
.points-save { font-size: 13px; font-weight: 700; color: #d97706; }
.combo-detail { display: flex; flex-direction: column; gap: 6px; }
.combo-row {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 12px; color: var(--color-text-secondary);
}
.combo-row span:last-child { color: var(--color-text-primary); font-weight: 500; }
</style>
