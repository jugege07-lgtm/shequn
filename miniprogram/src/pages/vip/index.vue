<template>
  <view :style="sbStyle" class="phone-frame">
    <view class="header"><view class="header-left"><view class="back-btn" @click="$router.back()"><image :src="iconBack" mode="aspectFit" /></view><text class="header-title">会员中心</text></view></view>
    <view class="main-scroll">
      <view class="vip-hero">
        <view class="crown">👑</view>
        <text class="vip-hero-title">VIP 会员</text>
        <text class="vip-hero-desc">尊享专属权益，解锁更多可能</text>
      </view>
      <view class="benefits-card">
        <view class="section-label">会员权益</view>
        <view class="benefit-item" v-for="b in benefits" :key="b.id">
          <view class="benefit-icon">{{ b.icon }}</view>
          <view class="benefit-text"><text class="benefit-title">{{ b.title }}</text><text class="benefit-desc">{{ b.desc }}</text></view>
        </view>
      </view>
      <view class="plans-card">
        <view class="section-label">选择方案</view>
        <view class="plan-item" v-for="p in plans" :key="p.id" :class="{ active: selectedPlan === p.id }" @click="selectedPlan = p.id">
          <view class="plan-header">
            <text class="plan-name">{{ p.name }}</text>

          </view>
          <view class="plan-price"><text>¥</text>{{ p.price }}<text>/{{ p.unit }}</text></view>
          <view class="plan-features">
            <view class="plan-feature" v-for="f in p.features" :key="f">{{ f }}</view>
          </view>
        </view>
      </view>
    </view>
    <view class="bottom-action">
      <button class="subscribe-btn" @click="handleSubscribe">{{ subscribeBtnText }}</button>
    </view>
  </view>
</template>
<script setup lang="ts">
import { sbStyle } from '@/utils/sb'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getVipPlans, subscribeVip } from '@/api'
import { useUserStore } from '@/store/user'
import { svgUri } from '@/utils/svg'
const router = useRouter()
const userStore = useUserStore()
const selectedPlan = ref<number | null>(null)

const iconBack = svgUri('<path d="m15 18-6-6 6-6"/>', { color: '#1e1b4b' })

const benefits = ref([
  { id: 1, icon: '🎯', title: '优先报名', desc: '热门活动优先报名权' },
  { id: 2, icon: '💰', title: '专属折扣', desc: '商城商品享会员专属折扣' },
  { id: 3, icon: '🔍', title: '商机解锁', desc: '无限解锁商机联系方式' },
  { id: 4, icon: '📊', title: '数据看板', desc: '查看名片浏览数据分析' },
])
const plans = ref<any[]>([])

// 当前用户是否已开通 VIP（从数据库实时读取的 userInfo）
const isVipActive = computed(() => {
  const u = userStore.userInfo
  if (!u) return false
  if ((u.vipLevel || 0) < 1) return false
  if (u.vipExpireAt && new Date(u.vipExpireAt).getTime() < Date.now()) return false
  return true
})
const subscribeBtnText = computed(() => (isVipActive.value ? '续费' : '立即开通'))

function showToast(msg: string) {
  uni.showToast({ title: msg, icon: 'none' })
}

onMounted(async () => {
  try {
    const res = await getVipPlans()
    plans.value = (res.list || res || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      price: p.currentPrice,
      unit: p.durationDays ? p.durationDays + '天' : '月',
      features: (() => { try { return JSON.parse(p.features) } catch { return ['全部权益'] } })(),
    }))
    if (plans.value.length > 0) selectedPlan.value = plans.value[0].id
  } catch (err: any) {
    console.error('加载套餐失败', err)
  }
})

const handleSubscribe = async () => {
  if (!selectedPlan.value) return
  try {
    const result = await subscribeVip(selectedPlan.value)
    if (result?.needPay && result?.order?.id) {
      router.push(`/order/pay/${result.order.id}?type=vip`)
      return
    }
    uni.showModal({
      title: '提示',
      content: '开通成功',
      showCancel: false,
      success: () => {
        router.replace('/profile/index')
      },
    })
  } catch (err: any) {
    showToast(err.message || '开通失败')
  }
}
</script>
<style scoped>
.vip-hero { text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; }
.crown { font-size: 48px; margin-bottom: 12px; }
.vip-hero-title { display: block; font-size: 24px; font-weight: 800; margin-bottom: 4px; color: #fff; }
.vip-hero-desc { display: block; font-size: 14px; opacity: 0.8; }
.benefits-card, .plans-card { margin: 16px; border-radius: var(--radius-xl); background: rgba(255,255,255,0.75); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.5); box-shadow: var(--glass-shadow); padding: 16px; }
.section-label { font-size: 16px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 12px; }
.benefit-item { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid rgba(0,0,0,0.05); }
.benefit-item:last-child { border-bottom: none; }
.benefit-icon { font-size: 28px; }
.benefit-text { display: flex; flex-direction: column; gap: 2px; }
.benefit-title { font-size: 14px; color: var(--color-text-primary); font-weight: 600; }
.benefit-desc { font-size: 12px; color: var(--color-text-secondary); }
.plan-item { padding: 14px; border-radius: var(--radius-lg); border: 2px solid transparent; margin-bottom: 10px; transition: all 0.2s; background: rgba(99,102,241,0.03); }
.plan-item.active { border-color: var(--color-primary); background: var(--color-primary-50); }
.plan-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.plan-name { font-size: 15px; font-weight: 700; color: var(--color-text-primary); }
.plan-badge { font-size: 10px; padding: 2px 8px; border-radius: 99px; background: var(--color-danger); color: #fff; }
.plan-price { font-size: 24px; font-weight: 800; color: var(--color-primary); margin-bottom: 8px; }
.plan-price text:first-child { font-size: 14px; }
.plan-price text:last-child { font-size: 12px; font-weight: 400; }
.plan-features { padding: 0; margin: 0; }
.plan-feature { font-size: 12px; color: var(--color-text-secondary); padding: 3px 0; }
.plan-feature::before { content: '✓ '; color: var(--color-success); font-weight: 700; }
.bottom-action { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 430px; padding: 12px 16px var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 12px)); background: rgba(255,255,255,0.95); backdrop-filter: blur(20px); border-top: 0.5px solid rgba(60,60,67,0.1); z-index: 200; }
.subscribe-btn { width: 100%; padding: 14px; border: none; border-radius: 12px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; font-size: 16px; font-weight: 600; }
</style>
