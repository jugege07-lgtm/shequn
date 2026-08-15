<template>
  <view class="floating-cart" @click="goCart">
    <view class="cart-icon">
      <image class="cart-svg" :src="iconCart" mode="aspectFit" />
      <text v-if="totalCount > 0" class="badge">{{ totalCount > 99 ? '99+' : totalCount }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCartStore } from '@/store/cart'
import { svgUri } from '@/utils/svg'
import router from '@/shims/vue-router'

const cartStore = useCartStore()
const totalCount = computed(() => cartStore.totalCount)

const iconCart = svgUri(
  '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>',
  { color: '#ffffff' }
)

function goCart() {
  router.push('/cart/index')
}
</script>

<style scoped>
.floating-cart {
  position: fixed;
  bottom: 80px;
  right: 16px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4), 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}
.floating-cart:active {
  transform: scale(0.92);
}
.cart-icon {
  position: relative;
  width: 28px;
  height: 28px;
}
.cart-svg {
  width: 100%;
  height: 100%;
}
.badge {
  position: absolute;
  top: -6px;
  right: -8px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 9px;
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  border: 2px solid #fff;
}
</style>
