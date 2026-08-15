<template>
  <div class="phone-frame">
    <div class="main-scroll">
      <!-- Banner -->
      <div class="mall-banner">
        <div class="banner-container">
          <div class="banner-bg"></div>
          <div class="banner-content">
            <div class="banner-title">会员专享 限时特惠</div>
            <div class="banner-desc">全场商品 8 折起，积分最高可抵 50%</div>
          </div>
          <div class="banner-icon">🛍️</div>
        </div>
      </div>

      <!-- Points & Coupon -->
      <div class="points-coupon">
        <div class="points-card" @click="$router.push('/points/index')">
          <div class="card-title">
            <image class="card-title-icon" :src="iconPoints" mode="aspectFit" />
            我的积分
          </div>
          <div class="card-value">{{ points }} <span>积分</span></div>
        </div>
        <div class="coupon-card" @click="$router.push('/coupon/index')">
          <div class="card-title">
            <image class="card-title-icon" :src="iconCoupon" mode="aspectFit" />
            优惠券
          </div>
          <div class="card-value">{{ couponCount }} <span>张可用</span></div>
        </div>
      </div>

      <!-- Category Tabs -->
      <div class="category-tabs">
        <div
          class="category-tab"
          v-for="cat in categories"
          :key="cat.id"
          :class="{ active: activeCat === cat.id }"
          @click="activeCat = cat.id"
        >{{ cat.name }}</div>
      </div>

      <!-- Product Grid -->
      <div class="product-grid">
        <div v-if="products.length === 0" class="empty-tip">暂无商品</div>
        <div class="product-item" v-for="p in products" :key="p.id" @click="$router.push('/mall/detail/' + p.id)">
          <div class="product-image" :style="!p.coverImage ? { background: p.gradient } : {}">
            <image
              v-if="p.coverImage"
              :src="p.coverImage"
              class="product-cover-img"
              mode="aspectFill"
              @error="onImgError($event, p)"
            />
            <template v-else>{{ p.emoji }}</template>
          </div>
          <div v-if="p.badge" class="product-tag" :class="p.badgeType">{{ p.badge }}</div>
          <div class="product-content">
            <div class="product-title">{{ p.title }}</div>
            <div class="product-desc">{{ p.desc }}</div>
            <div class="product-footer">
              <div>
                <div class="product-price"><span>¥</span>{{ p.price }}</div>
                <div class="product-original">¥{{ p.originalPrice }}</div>
              </div>
              <div class="product-sold">已售 {{ p.sold }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating Cart -->
    <FloatingCart />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import FloatingCart from '@/components/FloatingCart.vue'
import { getProducts, getProductCategories, getMyPoints, getUserCoupons } from '@/api'
import { stripHtml } from '@/utils/sanitize'
import { normalizeImageUrl } from '@/utils/image'
import { svgUri } from '@/utils/svg'

const iconPoints = svgUri(
  '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  { color: '#9ca3af' }
)
const iconCoupon = svgUri(
  '<path d="M20 12V8H6a2 2 0 01-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 100-4 2 2 0 000 4z"/>',
  { color: '#9ca3af' }
)

const categories = ref<any[]>([{ id: 0, name: '全部' }])
const activeCat = ref(0)
const products = ref<any[]>([])
const loading = ref(false)
const points = ref(0)
const couponCount = ref(0)

async function loadCategories() {
  try {
    const data = await getProductCategories()
    const list = Array.isArray(data) ? data : data?.list || []
    categories.value = [{ id: 0, name: '全部' }, ...list]
  } catch (err: any) {
    console.error('加载分类失败:', err)
  }
}

async function loadProducts(categoryId?: number) {
  loading.value = true
  try {
    const params: any = { page: 1, size: 20 }
    if (categoryId) params.category = categoryId
    const data = await getProducts(params)
    if (data?.list) {
      products.value = data.list.map((item: any) => ({
        id: item.id,
        title: item.name || item.title,
        desc: stripHtml(item.description || ''),
        price: item.price,
        originalPrice: item.vipPrice || Math.round(item.price * 1.5),
        sold: item.salesCount || '0',
        coverImage: normalizeImageUrl(item.coverImage),
        gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        emoji: '📦',
        badge: item.status === 1 ? '' : '下架',
        badgeType: item.status === 1 ? '' : 'limited',
      }))
    }
  } catch (err: any) {
    console.error('加载商品失败:', err)
    products.value = getMockProducts()
  } finally {
    loading.value = false
  }
}

watch(activeCat, (id) => {
  loadProducts(id || undefined)
})

// 加载积分(失败不阻塞页面,如未登录)
async function loadPoints() {
  try {
    const data: any = await getMyPoints()
    if (data) points.value = data.points ?? 0
  } catch {}
}

// 加载可用优惠券数量
async function loadCoupons() {
  try {
    const data: any = await getUserCoupons({ page: 1, size: 100, status: 'unused' })
    if (data?.list) couponCount.value = data.list.length
    else if (Array.isArray(data)) couponCount.value = data.length
  } catch {}
}

// 图片加载失败时回退到 emoji 占位
function onImgError(_e: any, p: any) {
  if (p) p.coverImage = ''
}

function getMockProducts() {
  return [
    { id: 1, title: '社群运营实战手册 · 电子版', desc: '从0到1搭建高活跃社群', price: '99', originalPrice: '199', sold: '1680', coverImage: '', gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)', emoji: '📚' },
    { id: 2, title: '私域流量变现课程', desc: '12节视频课，系统学习', price: '299', originalPrice: '599', sold: '342', coverImage: '', gradient: 'linear-gradient(135deg,#34d399,#10b981)', emoji: '🎓' },
    { id: 3, title: '品牌联名帆布袋', desc: '高品质帆布，限量发售', price: '79', originalPrice: '129', sold: '56', coverImage: '', gradient: 'linear-gradient(135deg,#fb923c,#f97316)', emoji: '💼' },
    { id: 4, title: '社群数据分析工具 · 月卡', desc: '用户画像分析、活跃度监控', price: '299', originalPrice: '499', sold: '342', coverImage: '', gradient: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', emoji: '📊' },
    { id: 5, title: '年度会员权益卡', desc: '全年活动优先报名', price: '999', originalPrice: '1999', sold: '89', coverImage: '', gradient: 'linear-gradient(135deg,#0ea5e9,#0284c7)', emoji: '🎫', badge: '限时', badgeType: '' },
  ]
}

onMounted(() => {
  loadCategories()
  loadProducts()
  loadPoints()
  loadCoupons()
})
</script>

<style scoped>
.mall-banner { padding: 12px 16px 0; }
.banner-container {
  position: relative; border-radius: var(--radius-xl); overflow: hidden;
  height: 120px; background: linear-gradient(135deg, #818cf8, #6366f1, #4f46e5);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 24px; color: #fff;
}
.banner-bg {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: radial-gradient(circle at 80% 50%, rgba(255,255,255,0.1), transparent 60%);
}
.banner-content { z-index: 2; }
.banner-title { font-size: 20px; font-weight: 800; margin-bottom: 4px; }
.banner-desc { font-size: 13px; opacity: 0.9; max-width: 180px; }
.banner-icon { font-size: 64px; opacity: 0.2; z-index: 1; }

.points-coupon { padding: 12px 16px 0; display: flex; gap: 12px; }
.points-card, .coupon-card {
  flex: 1; border-radius: var(--radius-lg);
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.5);
  padding: 14px 12px; cursor: pointer; transition: transform 0.15s ease;
}
.points-card:active, .coupon-card:active { transform: scale(0.95); }
.card-title {
  font-size: 12px; color: var(--color-text-secondary); margin-bottom: 6px;
  display: flex; align-items: center; gap: 4px;
}
.card-title-icon { width: 14px; height: 14px; }
.card-value {
  font-size: 20px; font-weight: 800; color: var(--color-primary);
  display: flex; align-items: baseline; gap: 2px;
}
.card-value text { font-size: 12px; font-weight: 400; }
.coupon-card .card-value { color: #f59e0b; }

.category-tabs {
  padding: 12px 16px 0; display: flex; align-items: center; gap: 8px;
  overflow-x: auto; scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}
.category-tabs::-webkit-scrollbar { display: none; }
.category-tab {
  flex-shrink: 0; scroll-snap-align: start;
  padding: 8px 16px; border-radius: var(--radius-full);
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.5);
  font-size: 13px; color: var(--color-text-secondary); font-weight: 500;
  cursor: pointer; transition: all 0.2s ease; white-space: nowrap;
}
.category-tab.active {
  background: var(--color-primary); color: #fff; font-weight: 600;
  border-color: var(--color-primary);
}
.category-tab:active { transform: scale(0.95); }

.product-grid {
  padding: 16px 16px 0;
  display: grid; grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.product-item {
  border-radius: var(--radius-lg);
  background: rgba(255,255,255,0.65);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.5);
  box-shadow: var(--glass-shadow);
  overflow: hidden; cursor: pointer;
  transition: transform 0.15s ease; position: relative;
}
.product-item:active { transform: scale(0.98); }
.product-image {
  height: 120px; position: relative; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  font-size: 48px; color: #fff;
  background: linear-gradient(135deg,#6366f1,#8b5cf6);
}
.product-cover-img {
  width: 100%; height: 100%;
  display: block;
  background: #f5f5f5;
}
.product-tag {
  position: absolute; top: 8px; left: 8px;
  font-size: 10px; font-weight: 700; color: #fff;
  padding: 3px 8px; border-radius: 4px; z-index: 2;
}
.product-tag.hot { background: rgba(245,158,11,0.85); }
.product-tag.new { background: rgba(16,185,129,0.85); }
.product-tag:not(.hot):not(.new) { background: rgba(239,68,68,0.85); }
.product-content { padding: 10px 12px; }
.product-title {
  font-size: 13px; font-weight: 600; color: var(--color-text-primary);
  line-height: 1.4; margin-bottom: 4px;
  display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
}
.product-desc {
  font-size: 11px; color: var(--color-text-tertiary); line-height: 1.4;
  margin-bottom: 8px;
  display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
}
.product-footer { display: flex; align-items: center; justify-content: space-between; }
.product-price { font-size: 16px; font-weight: 700; color: var(--color-primary); }
.product-price text { font-size: 12px; font-weight: 400; }
.product-original { font-size: 11px; color: var(--color-text-tertiary); text-decoration: line-through; }
.product-sold { font-size: 11px; color: var(--color-text-tertiary); }
</style>
