<template>
  <div class="phone-frame">
    <div class="header"><div class="header-left"><div class="back-btn" @click="$router.back()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m15 18-6-6 6-6"/></svg></div><span class="header-title">会员中心</span></div></div>
    <div class="main-scroll">
      <div class="vip-hero">
        <div class="crown">👑</div>
        <h2>VIP 会员</h2>
        <p>尊享专属权益，解锁更多可能</p>
      </div>
      <div class="benefits-card">
        <h3 class="section-label">会员权益</h3>
        <div class="benefit-item" v-for="b in benefits" :key="b.id">
          <div class="benefit-icon">{{ b.icon }}</div>
          <div class="benefit-text"><strong>{{ b.title }}</strong><span>{{ b.desc }}</span></div>
        </div>
      </div>
      <div class="plans-card">
        <h3 class="section-label">选择方案</h3>
        <div class="plan-item" v-for="p in plans" :key="p.id" :class="{ active: selectedPlan === p.id }" @click="selectedPlan = p.id">
          <div class="plan-header">
            <span class="plan-name">{{ p.name }}</span>
  
          </div>
          <div class="plan-price"><span>¥</span>{{ p.price }}<span>/{{ p.unit }}</span></div>
          <ul class="plan-features">
            <li v-for="f in p.features" :key="f">{{ f }}</li>
          </ul>
        </div>
      </div>
    </div>
    <div class="bottom-action">
      <button class="subscribe-btn" @click="handleSubscribe">立即开通</button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getVipPlans, subscribeVip } from '@/api'
const router = useRouter()
const selectedPlan = ref<number | null>(null)
const benefits = ref([
  { id: 1, icon: '🎯', title: '优先报名', desc: '热门活动优先报名权' },
  { id: 2, icon: '💰', title: '专属折扣', desc: '商城商品享8折优惠' },
  { id: 3, icon: '🔍', title: '商机解锁', desc: '无限解锁商机联系方式' },
  { id: 4, icon: '📊', title: '数据看板', desc: '查看名片浏览数据分析' },
])
const plans = ref<any[]>([])

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
    await subscribeVip(selectedPlan.value)
    alert('开通成功')
    router.push('/vip/success')
  } catch (err: any) {
    alert(err.message || '开通失败')
  }
}
</script>
<style scoped>
@import '@/styles/global.css';
.vip-hero { text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; }
.crown { font-size: 48px; margin-bottom: 12px; }
.vip-hero h2 { font-size: 24px; font-weight: 800; margin-bottom: 4px; }
.vip-hero p { font-size: 14px; opacity: 0.8; }
.benefits-card, .plans-card { margin: 16px; border-radius: var(--radius-xl); background: rgba(255,255,255,0.75); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.5); box-shadow: var(--glass-shadow); padding: 16px; }
.section-label { font-size: 16px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 12px; }
.benefit-item { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid rgba(0,0,0,0.05); }
.benefit-item:last-child { border-bottom: none; }
.benefit-icon { font-size: 28px; }
.benefit-text { display: flex; flex-direction: column; gap: 2px; }
.benefit-text strong { font-size: 14px; color: var(--color-text-primary); }
.benefit-text span { font-size: 12px; color: var(--color-text-secondary); }
.plan-item { padding: 14px; border-radius: var(--radius-lg); border: 2px solid transparent; margin-bottom: 10px; cursor: pointer; transition: all 0.2s; background: rgba(99,102,241,0.03); }
.plan-item.active { border-color: var(--color-primary); background: var(--color-primary-50); }
.plan-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.plan-name { font-size: 15px; font-weight: 700; color: var(--color-text-primary); }
.plan-badge { font-size: 10px; padding: 2px 8px; border-radius: 99px; background: var(--color-danger); color: #fff; }
.plan-price { font-size: 24px; font-weight: 800; color: var(--color-primary); margin-bottom: 8px; }
.plan-price span:first-child { font-size: 14px; }
.plan-price span:last-child { font-size: 12px; font-weight: 400; }
.plan-features { list-style: none; padding: 0; margin: 0; }
.plan-features li { font-size: 12px; color: var(--color-text-secondary); padding: 3px 0; }
.plan-features li::before { content: '✓ '; color: var(--color-success); font-weight: 700; }
.bottom-action { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 430px; padding: 12px 16px env(safe-area-inset-bottom, 12px); background: rgba(255,255,255,0.95); backdrop-filter: blur(20px); border-top: 0.5px solid rgba(60,60,67,0.1); z-index: 200; }
.subscribe-btn { width: 100%; padding: 14px; border: none; border-radius: 12px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; font-size: 16px; font-weight: 600; cursor: pointer; }
</style>
