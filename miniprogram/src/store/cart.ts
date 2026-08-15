import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getCart, addToCart as apiAddToCart, updateCartItem, removeCartItem, clearCart as apiClearCart } from '@/api'
import { normalizeImageUrl } from '@/utils/image'
import { useUserStore } from '@/store/user'

export interface CartItem {
  id: number          // 购物车项ID
  productId: number   // 商品ID
  name: string
  price: number       // 实际结算单价（VIP用户为vipPrice，普通用户为price）
  originalPrice?: number // 原价（仅VIP用户有，用于划线展示）
  coverImage?: string
  gradient?: string
  emoji?: string
  quantity: number
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])

  // 商品总数
  const totalCount = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))

  // 总金额（基于实际结算价）
  const totalPrice = computed(() => items.value.reduce((sum, item) => sum + item.price * item.quantity, 0))

  // 从后端同步购物车数据
  async function fetchCart() {
    try {
      const res: any = await getCart()
      const list = Array.isArray(res) ? res : res?.list || res?.data || []
      const userStore = useUserStore()
      const isVip = userStore.isVip
      items.value = list.map((item: any) => {
        const product = item.product || {}
        const regularPrice = Number(product.price ?? item.price ?? 0)
        const vipPrice = Number(product.vipPrice) || 0
        // VIP 用户且商品有有效 vipPrice 时使用 vipPrice，否则用普通价
        const useVipPrice = isVip && vipPrice > 0 && vipPrice < regularPrice
        return {
          id: item.id,
          productId: item.productId || product.id || item.id,
          name: product.name || item.name || '商品',
          price: useVipPrice ? vipPrice : regularPrice,
          originalPrice: useVipPrice ? regularPrice : undefined,
          coverImage: normalizeImageUrl(product.coverImage || item.coverImage),
          gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          emoji: '📦',
          quantity: item.quantity || 1,
        }
      })
      saveToStorage()
    } catch (err: any) {
      console.error('同步购物车失败', err)
      // 后端同步失败时回退到本地存储，保证离线可用
      loadFromStorage()
    }
  }

  // 添加商品（同步到后端）
  async function addToCart(product: Partial<CartItem> & { id: number; quantity?: number }) {
    await apiAddToCart({ productId: product.id, quantity: product.quantity || 1 })
    await fetchCart()
  }

  // 移除商品（同步到后端）
  async function removeFromCart(cartItemId: number) {
    await removeCartItem(cartItemId)
    await fetchCart()
  }

  // 更新数量（同步到后端）
  async function updateQuantity(cartItemId: number, quantity: number) {
    if (quantity <= 0) {
      await removeFromCart(cartItemId)
    } else {
      await updateCartItem(cartItemId, quantity)
      await fetchCart()
    }
  }

  // 清空购物车（同步到后端）
  async function clearCart() {
    await apiClearCart()
    items.value = []
    saveToStorage()
  }

  // 本地持久化
  function saveToStorage() {
    try {
      localStorage.setItem('cart_items', JSON.stringify(items.value))
    } catch {}
  }

  // 从本地恢复
  function loadFromStorage() {
    try {
      const saved = localStorage.getItem('cart_items')
      if (saved) items.value = JSON.parse(saved)
    } catch {}
  }

  // 初始化：优先从后端同步，失败则回退本地
  fetchCart().catch(() => loadFromStorage())

  return { items, totalCount, totalPrice, addToCart, removeFromCart, updateQuantity, clearCart, fetchCart, loadFromStorage }
})
