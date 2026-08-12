<template>
  <div class="phone-frame">
    <div class="header">
      <div class="header-left">
        <div class="back-btn" @click="$router.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </div>
        <span class="header-title">领券中心</span>
      </div>
    </div>

    <div class="coupon-grid" v-loading="loading">
      <div v-if="coupons.length === 0 && !loading" class="empty-tip">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        <p>暂无可领优惠券</p>
        <span>敬请期待后续活动</span>
      </div>

      <div
        class="coupon-item"
        v-for="c in coupons"
        :key="c.id"
        :class="['state-' + claimState(c).code]"
        @click="handleClaim(c)"
      >
        <div class="coupon-item-left">
          <div class="coupon-item-value">
            <template v-if="c.type === 'percent'">
              <span class="value-num">{{ formatPercent(c.value) }}</span><span class="value-unit">折</span>
            </template>
            <template v-else>
              <span class="value-unit">¥</span><span class="value-num">{{ c.value }}</span>
            </template>
          </div>
          <div class="coupon-item-condition">
            {{ c.minAmount > 0 ? '满¥' + c.minAmount + '可用' : '无门槛' }}
          </div>
          <div v-if="c.type === 'percent' && c.discountCap" class="coupon-item-cap">
            最高减 ¥{{ c.discountCap }}
          </div>
        </div>
        <div class="coupon-item-divider"></div>
        <div class="coupon-item-right">
          <div class="coupon-item-name">{{ c.name }}</div>
          <div class="coupon-item-desc" v-if="c.description">{{ c.description }}</div>
          <div class="coupon-item-bottom">
            <div class="coupon-item-info">
              <span v-if="c.validFrom || c.validTo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                {{ formatRange(c) }}
              </span>
              <span v-else>领后 {{ c.validDays }} 天有效</span>
              <span class="remaining">剩 {{ c.remaining }} 张</span>
            </div>
            <button
              class="claim-btn"
              :class="['btn-' + claimState(c).code]"
              :disabled="claimState(c).disabled || claimingId === c.id"
              @click.stop="handleClaim(c)"
            >
              <span v-if="claimingId === c.id">领取中...</span>
              <span v-else>{{ claimState(c).label }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCoupons, claimCoupon } from '@/api'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const claimingId = ref<number | null>(null)
const coupons = ref<any[]>([])

/** 折扣率转 UI 显示 (0.8 → 8) */
function formatPercent(v: number) {
  const n = Number(v)
  if (Number.isNaN(n)) return '-'
  return (n * 10).toFixed(1).replace(/\.0$/, '')
}

function pad(n: number) { return n.toString().padStart(2, '0') }

function formatDate(d: string) {
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return ''
  return `${dt.getMonth() + 1}/${dt.getDate()} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`
}

function formatRange(c: any) {
  if (c.validFrom && c.validTo) {
    return `${formatDate(c.validFrom)} ~ ${formatDate(c.validTo)}`
  }
  if (c.validFrom) return `${formatDate(c.validFrom)} 起`
  if (c.validTo) return `至 ${formatDate(c.validTo)}`
  return ''
}

type ClaimStateCode = 'available' | 'claimed' | 'soldout' | 'notstarted' | 'ended' | 'offline'
interface ClaimState { code: ClaimStateCode; label: string; disabled: boolean }

/**
 * 综合计算单个券对当前用户的状态
 *   available  - 可领取（正常）
 *   claimed    - 已领取（达到每人限领）
 *   soldout    - 已抢光（总量 - 已领 ≤ 0）
 *   notstarted - 未开始（validFrom 在未来）
 *   ended      - 已结束（validTo 在过去）
 *   offline    - 已下架
 */
function claimState(c: any): ClaimState {
  if (c.status !== 1) return { code: 'offline', label: '已下架', disabled: true }
  const now = Date.now()
  if (c.validFrom && new Date(c.validFrom).getTime() > now) {
    return { code: 'notstarted', label: '即将开始', disabled: true }
  }
  if (c.validTo && new Date(c.validTo).getTime() < now) {
    return { code: 'ended', label: '已结束', disabled: true }
  }
  if ((c.remaining ?? 0) <= 0) {
    return { code: 'soldout', label: '已抢光', disabled: true }
  }
  if (c.userClaimed) {
    return { code: 'claimed', label: '已领取', disabled: true }
  }
  return { code: 'available', label: '立即领取', disabled: false }
}

async function loadCoupons() {
  loading.value = true
  try {
    const data: any = await getCoupons({ page: 1, size: 50 })
    if (data?.list) coupons.value = data.list
  } catch {
    coupons.value = []
  } finally {
    loading.value = false
  }
}

async function handleClaim(c: any) {
  const state = claimState(c)
  if (state.disabled || claimingId.value !== null) return
  // 未登录：提示并跳转登录页
  if (!userStore.isLoggedIn) {
    showToast('请先登录')
    setTimeout(() => router.push({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } }), 600)
    return
  }
  claimingId.value = c.id
  try {
    await claimCoupon(c.id)
    showToast('领取成功！')
    // 刷新列表让服务端把 userClaimCount / remaining 重算
    await loadCoupons()
  } catch (err: any) {
    // err.message 是后端 BadRequestException 返回的 message（如「优惠券已抢光」）
    showToast(err?.message || '领取失败')
  } finally {
    claimingId.value = null
  }
}

function showToast(msg: string) {
  const el = document.createElement('div')
  el.textContent = msg
  el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,.78);color:#fff;padding:12px 28px;border-radius:12px;font-size:14px;z-index:9999;white-space:nowrap;max-width:80%;text-align:center'
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 2000)
}

onMounted(loadCoupons)
</script>

<style scoped>
@import '@/styles/global.css';

.header {
  position: sticky; top: 0; z-index: 100;
  background: #ffffff;
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-bottom: 0.5px solid #eee;
  margin-top: calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) * -1);
  padding: calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) + 10px) 16px 10px;
  display: flex; align-items: center;
}
.header-left { display: flex; align-items: center; gap: 12px; }
.back-btn {
  width: 32px; height: 32px; border-radius: 50%;
  background: #f5f5f5; display: flex; align-items: center; justify-content: center;
  cursor: pointer;
}
.back-btn svg { width: 18px; height: 18px; color: #333; }
.header-title { font-size: 18px; font-weight: 700; color: #1e1b4b; }

.coupon-grid { padding: 12px 16px; display: flex; flex-direction: column; gap: 12px; }
.empty-tip {
  display: flex; flex-direction: column; align-items: center;
  padding: 80px 0; color: #999; gap: 8px;
}
.empty-tip svg { width: 56px; height: 56px; opacity: 0.3; }
.empty-tip p { font-size: 14px; color: #666; }
.empty-tip span { font-size: 12px; color: #aaa; }

/* ===== 卡片 ===== */
.coupon-item {
  display: flex; background: #fff; border-radius: 12px;
  overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border: 1px dashed #e0d4f5;
  cursor: pointer; transition: transform 0.15s ease, opacity 0.2s ease;
}
.coupon-item:active { transform: scale(0.99); }

/* 不可领取态：整张变灰 */
.coupon-item.state-claimed,
.coupon-item.state-soldout,
.coupon-item.state-ended,
.coupon-item.state-notstarted,
.coupon-item.state-offline {
  opacity: 0.55;
  cursor: not-allowed;
}
.coupon-item.state-claimed .coupon-item-left { background: linear-gradient(135deg, #94a3b8, #64748b); }

.coupon-item-left {
  width: 110px; min-height: 110px;
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 12px 8px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; position: relative;
}
.coupon-item-left::after {
  content: ''; position: absolute; right: -8px; top: 50%;
  transform: translateY(-50%);
  width: 16px; height: 16px; border-radius: 50%; background: #f0f2f8;
}
.coupon-item-value {
  display: flex; align-items: baseline; gap: 2px;
  line-height: 1;
}
.coupon-item-value .value-num { font-size: 30px; font-weight: 800; }
.coupon-item-value .value-unit { font-size: 13px; font-weight: 600; }
.coupon-item-condition { font-size: 11px; margin-top: 6px; opacity: 0.85; }
.coupon-item-cap { font-size: 10px; margin-top: 4px; opacity: 0.75; }

.coupon-item-divider {
  width: 1px;
  background: repeating-linear-gradient(180deg, #ccc 0, #ccc 4px, transparent 4px, transparent 8px);
  margin: 16px 0;
}

.coupon-item-right {
  flex: 1; padding: 12px 14px;
  display: flex; flex-direction: column; gap: 4px;
  position: relative;
}
.coupon-item-name { font-size: 14px; font-weight: 600; color: #1e1b4b; }
.coupon-item-desc {
  font-size: 11px; color: #999; line-height: 1.4;
  display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
}
.coupon-item-info {
  font-size: 11px; color: #999;
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  flex: 1; min-width: 0;
}
.coupon-item-info span { display: flex; align-items: center; gap: 3px; }
.coupon-item-info svg { width: 11px; height: 11px; flex-shrink: 0; }
.coupon-item-info .remaining { color: #ef4444; white-space: nowrap; }

/* ===== 底部条：信息 + 领取按钮（同行 flex 布局，避免小屏遮挡）===== */
.coupon-item-bottom {
  margin-top: auto; padding-top: 6px;
  display: flex; align-items: center; justify-content: space-between;
  gap: 8px;
}

/* ===== 领取按钮 ===== */
.claim-btn {
  flex-shrink: 0; white-space: nowrap;
  padding: 5px 16px; border-radius: 20px; border: none;
  background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff;
  font-size: 12px; font-weight: 600; cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
}
.claim-btn:active:not(:disabled) { transform: scale(0.96); }
.claim-btn:disabled { opacity: 0.7; cursor: not-allowed; }

.claim-btn.btn-claimed { background: linear-gradient(135deg, #94a3b8, #64748b); }
.claim-btn.btn-soldout { background: linear-gradient(135deg, #cbd5e1, #94a3b8); }
.claim-btn.btn-ended,
.claim-btn.btn-offline { background: linear-gradient(135deg, #cbd5e1, #94a3b8); }
.claim-btn.btn-notstarted {
  background: linear-gradient(135deg, #f59e0b, #f97316);
}
</style>