<template>
  <div class="phone-frame">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <div class="back-btn" @click="goBack">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </div>
        <span class="header-title">购物车</span>
      </div>
      <div v-if="items.length > 0" class="header-edit" @click="toggleEdit">
        {{ isEdit ? '完成' : '编辑' }}
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="items.length === 0" class="empty-state">
      <div class="empty-icon">🛒</div>
      <p class="empty-text">购物车空空如也</p>
      <p class="empty-hint">快去挑选心仪的商品吧</p>
      <button class="go-shop-btn" @click="$router.push('/mall/index')">去逛逛</button>
    </div>

    <!-- Cart Items -->
    <div v-else class="cart-list">
      <div class="cart-item" v-for="item in items" :key="item.id">
        <!-- Checkbox -->
        <div class="checkbox" @click.stop="toggleSelect(item.id)">
          <div class="check-circle" :class="{ checked: isSelected(item.id) }">
            <svg v-if="isSelected(item.id)" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
        </div>

        <!-- Product Image -->
        <div class="item-image" @click="$router.push('/mall/detail/' + item.productId)">
          <img v-if="item.coverImage" :src="item.coverImage" class="cover-img" />
          <div v-else class="emoji-placeholder" :style="{ background: item.gradient || 'linear-gradient(135deg,#6366f1,#8b5cf6)' }">
            {{ item.emoji || '📦' }}
          </div>
        </div>

        <!-- Product Info -->
        <div class="item-info">
          <div class="item-title">{{ item.name }}</div>
          <div class="item-price">¥{{ item.price.toFixed(2) }}</div>
          <div v-if="item.originalPrice && item.originalPrice > item.price" class="item-original">
            原价 ¥{{ item.originalPrice.toFixed(2) }}
          </div>

          <!-- Quantity Controls -->
          <div class="qty-control">
            <button class="qty-btn" @click.stop="decreaseQty(item)">−</button>
            <span class="qty-num">{{ item.quantity }}</span>
            <button class="qty-btn" @click.stop="increaseQty(item)">+</button>
          </div>
        </div>

        <!-- Delete (edit mode) -->
        <button class="delete-btn" v-if="isEdit" @click.stop="removeItem(item.id)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
        </button>
      </div>
    </div>

    <!-- Bottom Bar -->
    <div v-if="items.length > 0" class="bottom-bar">
      <div class="select-all" @click="toggleSelectAll">
        <div class="check-circle" :class="{ checked: isAllSelected }">
          <svg v-if="isAllSelected" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <span>全选</span>
      </div>

      <!-- Settlement Mode Summary -->
      <div v-if="!isEdit" class="summary">
        <div class="total">
          <span class="label">合计：</span>
          <span class="amount">¥{{ selectedTotal.toFixed(2) }}</span>
        </div>
        <button class="checkout-btn" :disabled="selectedCount === 0" @click="handleCheckout">
          结算({{ selectedCount }})
        </button>
      </div>

      <!-- Edit Mode Delete -->
      <div v-else class="summary">
        <button class="delete-batch-btn" :disabled="deleteSelectedCount === 0" @click="removeSelected">
          删除({{ deleteSelectedCount }})
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore, type CartItem } from '@/store/cart'
import { createOrderFromCart } from '@/api'

const router = useRouter()
const cartStore = useCartStore()

const isEdit = ref(false)
// 结算模式下的选中购物车项 ID
const selectedIds = ref<Set<number>>(new Set())
// 编辑模式下的待删除购物车项 ID（与结算模式隔离，互不干扰）
const deleteSelectedIds = ref<Set<number>>(new Set())

const items = computed<CartItem[]>(() => cartStore.items)

const activeSelectedIds = computed<Set<number>>(() => isEdit.value ? deleteSelectedIds.value : selectedIds.value)

const selectedItems = computed(() => items.value.filter(i => selectedIds.value.has(i.id)))
const deleteSelectedItems = computed(() => items.value.filter(i => deleteSelectedIds.value.has(i.id)))

const selectedCount = computed(() => selectedItems.value.reduce((sum, i) => sum + i.quantity, 0))
const deleteSelectedCount = computed(() => deleteSelectedItems.value.length)
const selectedTotal = computed(() => selectedItems.value.reduce((sum, i) => sum + i.price * i.quantity, 0))

const isAllSelected = computed(() => {
  if (items.value.length === 0) return false
  const set = activeSelectedIds.value
  return items.value.every(i => set.has(i.id))
})

function isSelected(id: number) {
  return activeSelectedIds.value.has(id)
}

function toggleEdit() {
  isEdit.value = !isEdit.value
}

function toggleSelect(id: number) {
  const set = activeSelectedIds.value
  const next = new Set(set)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  if (isEdit.value) {
    deleteSelectedIds.value = next
  } else {
    selectedIds.value = next
  }
}

function toggleSelectAll() {
  const allSelected = isAllSelected.value
  const next = new Set<number>()
  if (!allSelected) {
    items.value.forEach(i => next.add(i.id))
  }
  if (isEdit.value) {
    deleteSelectedIds.value = next
  } else {
    selectedIds.value = next
  }
}

function increaseQty(item: CartItem) {
  cartStore.updateQuantity(item.id, item.quantity + 1)
}

function decreaseQty(item: CartItem) {
  if (item.quantity <= 1) return
  cartStore.updateQuantity(item.id, item.quantity - 1)
}

async function removeItem(id: number) {
  await cartStore.removeFromCart(id)
  // 移除后同步清理两个集合中的残留 ID
  selectedIds.value.delete(id)
  deleteSelectedIds.value.delete(id)
}

async function removeSelected() {
  if (deleteSelectedCount.value === 0) return
  const ids = Array.from(deleteSelectedIds.value)
  for (const id of ids) {
    await cartStore.removeFromCart(id)
  }
  deleteSelectedIds.value.clear()
  ids.forEach(id => selectedIds.value.delete(id))
}

async function handleCheckout() {
  if (selectedCount.value === 0) return
  try {
    const cartItemIds = Array.from(selectedIds.value)
    const res: any = await createOrderFromCart({ cartItemIds })
    const orderId = res?.id || res?.data?.id
    if (orderId) {
      router.push(`/order/pay?orderId=${orderId}`)
    } else {
      throw new Error('创建订单失败')
    }
  } catch (err: any) {
    alert(err.message || '结算失败')
  }
}

// 智能返回：有历史记录则返回上一页，否则回到商城浏览页
function goBack() {
  const back = router.options.history.state?.back as string | undefined
  if (back) {
    router.back()
  } else {
    router.push('/mall/index')
  }
}

onMounted(() => {
  cartStore.fetchCart()
})
</script>

<style scoped>
@import '@/styles/global.css';

.header {
  position: sticky; top: 0; z-index: 100;
  background: #ffffff;
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-bottom: 0.5px solid rgba(60,60,67,0.1);
  margin-top: calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) * -1);
  padding: calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) + 10px) 16px 10px; display: flex; align-items: center; justify-content: space-between;
}
.header-left { display: flex; align-items: center; gap: 12px; }
.back-btn {
  width: 32px; height: 32px; border-radius: 50%;
  background: rgba(0,0,0,0.05); display: flex; align-items: center; justify-content: center;
}
.back-btn svg { width: 18px; height: 18px; color: #333; }
.header-title { font-size: 18px; font-weight: 700; color: #1e1b4b; }
.header-edit { font-size: 14px; color: var(--color-primary); font-weight: 600; }

/* Empty State */
.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 100px 20px; text-align: center;
}
.empty-icon { font-size: 72px; margin-bottom: 16px; opacity: 0.6; }
.empty-text { font-size: 18px; font-weight: 600; color: #333; margin-bottom: 6px; }
.empty-hint { font-size: 14px; color: #999; margin-bottom: 24px; }
.go-shop-btn {
  padding: 12px 32px; border-radius: 24px; border: none;
  background: var(--color-primary); color: #fff; font-size: 15px; font-weight: 600;
  cursor: pointer; transition: transform 0.15s;
}
.go-shop-btn:active { transform: scale(0.95); }

/* Cart List */
.cart-list { padding: 12px 16px; display: flex; flex-direction: column; gap: 12px; padding-bottom: 100px; }

.cart-item {
  display: flex; align-items: center; gap: 12px;
  background: #fff; border-radius: 12px; padding: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.checkbox { cursor: pointer; flex-shrink: 0; padding-top: 16px; }
.check-circle {
  width: 22px; height: 22px; border-radius: 50%;
  border: 2px solid #d1d5db; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.check-circle.checked { border-color: var(--color-primary); background: var(--color-primary); }
.check-circle svg { width: 14px; height: 14px; }

.item-image {
  width: 80px; height: 80px; border-radius: 8px; overflow: hidden;
  flex-shrink: 0; cursor: pointer;
}
.cover-img { width: 100%; height: 100%; object-fit: cover; }
.emoji-placeholder {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  font-size: 36px;
}

.item-info { flex: 1; min-width: 0; }
.item-title {
  font-size: 14px; font-weight: 600; color: #1e1b4b; margin-bottom: 4px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.item-price { font-size: 16px; font-weight: 700; color: var(--color-primary); }
.item-original { font-size: 11px; color: #999; text-decoration: line-through; margin-top: 2px; }

.qty-control {
  display: flex; align-items: center; gap: 10px; margin-top: 8px;
}
.qty-btn {
  width: 26px; height: 26px; border-radius: 50%; border: 1px solid #d1d5db;
  background: #fff; font-size: 16px; color: #666; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.qty-btn:active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
.qty-num { font-size: 14px; font-weight: 600; color: #333; min-width: 20px; text-align: center; }

.delete-btn {
  width: 32px; height: 32px; border: none; background: transparent;
  color: #ef4444; cursor: pointer; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
}
.delete-btn svg { width: 18px; height: 18px; }

/* Bottom Bar */
.bottom-bar {
  position: fixed; bottom: 0; left: 0; right: 0;
  height: 64px; background: rgba(255,255,255,0.95);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-top: 0.5px solid rgba(60,60,67,0.1);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 16px; z-index: 100;
  padding-bottom: var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0));
}
.select-all { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #666; cursor: pointer; }
.summary { display: flex; align-items: center; gap: 12px; }
.total { display: flex; align-items: baseline; gap: 2px; }
.total .label { font-size: 13px; color: #666; }
.total .amount { font-size: 18px; font-weight: 700; color: #ef4444; }
.checkout-btn {
  padding: 10px 24px; border-radius: 24px; border: none;
  background: var(--color-primary); color: #fff;
  font-size: 14px; font-weight: 600; cursor: pointer;
  transition: transform 0.15s;
}
.checkout-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.checkout-btn:not(:disabled):active { transform: scale(0.95); }

.delete-batch-btn {
  padding: 10px 24px; border-radius: 24px; border: none;
  background: #ef4444; color: #fff;
  font-size: 14px; font-weight: 600; cursor: pointer;
  transition: transform 0.15s;
}
.delete-batch-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.delete-batch-btn:not(:disabled):active { transform: scale(0.95); }
</style>
