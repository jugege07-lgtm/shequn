<template>
  <view class="phone-frame">
    <view class="header">
      <view class="header-left">
        <view class="back-btn" @click="$router.push('/profile/index')">
          <image :src="iconBack" mode="aspectFit" />
        </view>
        <text class="header-title">我的积分</text>
      </view>
    </view>

    <!-- Points Balance Card -->
    <view class="points-hero">
      <view class="points-total">{{ points }}</view>
      <view class="points-label">我的积分</view>
      <view class="points-actions">
        <view class="action-item" @click="$router.push('/coupon/claim')">
          <image :src="iconClaim" mode="aspectFit" />
          <text>领券中心</text>
        </view>
        <view class="action-item" @click="$router.push('/coupon/index')">
          <image :src="iconCoupon" mode="aspectFit" />
          <text>我的优惠券</text>
        </view>
      </view>
    </view>

    <!-- How to Earn -->
    <view class="section">
      <view class="section-title">如何赚取积分</view>
      <view class="earn-grid">
        <view class="earn-item" v-for="r in rules" :key="r.action">
          <view class="earn-icon">🎯</view>
          <view class="earn-name">{{ r.name }}</view>
          <view class="earn-points">+{{ r.points }}分</view>
        </view>
      </view>
    </view>

    <!-- Point Logs -->
    <view class="section">
      <view class="section-title">积分明细</view>
      <view class="log-list">
        <view v-if="logs.length === 0" class="empty-tip">暂无记录</view>
        <view class="log-item" v-for="log in logs" :key="log.id">
          <view class="log-info">
            <view class="log-action">{{ logActionName(log) }}</view>
            <view class="log-remark" v-if="log.remark && log.remark !== logActionName(log) && !isEnglishCode(log.remark)">{{ log.remark }}</view>
          </view>
          <view class="log-points" :class="log.points > 0 ? 'plus' : 'minus'">
            {{ log.points > 0 ? '+' : '' }}{{ log.points }}
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getMyPoints, getMyPointLogs, getPointRules } from '@/api'
import { svgUri } from '@/utils/svg'

const points = ref(0)
const loading = ref(false)
const logs = ref<any[]>([])
const rules = ref<any[]>([])

const iconBack = svgUri('<path d="M19 12H5M12 19l-7-7 7-7"/>', { color: '#333333' })
const iconClaim = svgUri(
  '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>',
  { color: '#ffffff' }
)
const iconCoupon = svgUri(
  '<path d="M20 12V8H6a2 2 0 01-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 100-4 2 2 0 000 4z"/>',
  { color: '#ffffff' }
)

// 积分日志 action 英文代码 → 中文名称映射（明细只展示中文）
const POINT_ACTION_NAMES: Record<string, string> = {
  register: '注册奖励',
  referral_register: '扫码名片注册奖励',
  invite: '成功邀请好友奖励',
  activity_signup: '活动报名',
  publish_business: '发布商机',
  unlock_business: '解锁商机',
  adjust: '管理员调整',
  product_exchange: '积分兑换',
}

// 判断是否为纯英文代码（如 activity_signup）
function isEnglishCode(text: string): boolean {
  return /^[A-Za-z_]+$/.test(text)
}

// 获取积分明细的中文展示名称
function logActionName(log: any): string {
  const mapped = POINT_ACTION_NAMES[log.action]
  if (mapped) return mapped
  // 无映射时优先用中文 remark，否则回退到 action
  if (log.remark && !isEnglishCode(log.remark)) return log.remark
  return log.action
}

async function loadPoints() {
  try {
    const data = await getMyPoints()
    if (data) points.value = data.points ?? 0
  } catch {}
}

async function loadLogs() {
  loading.value = true
  try {
    const data = await getMyPointLogs({ page: 1, size: 50 })
    if (data?.list) logs.value = data.list
  } catch { logs.value = [] }
  finally { loading.value = false }
}

async function loadRules() {
  try {
    const data = await getPointRules({ page: 1, size: 20 })
    if (data?.list) rules.value = data.list
  } catch {}
}

onMounted(() => { loadPoints(); loadLogs(); loadRules() })
</script>

<style scoped>

.header { position: sticky; top: 0; z-index: 100; background: #fff; border-bottom: 0.5px solid #eee; padding: calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) + 10px) 16px 10px; display: flex; align-items: center; }
.header-left { display: flex; align-items: center; gap: 12px; }
.back-btn { width: 32px; height: 32px; border-radius: 50%; background: #f5f5f5; display: flex; align-items: center; justify-content: center; }
.back-btn image { width: 18px; height: 18px; }
.header-title { font-size: 18px; font-weight: 700; color: #1e1b4b; }

.points-hero {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  padding: 32px 24px 24px; color: #fff; text-align: center;
}
.points-total { font-size: 48px; font-weight: 800; line-height: 1; }
.points-label { font-size: 14px; opacity: 0.8; margin-top: 4px; }
.points-actions { display: flex; gap: 16px; justify-content: center; margin-top: 20px; }
.action-item { display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 12px; }
.action-item image { width: 24px; height: 24px; opacity: 0.9; }

.section { padding: 16px; }
.section-title { font-size: 15px; font-weight: 700; color: #1e1b4b; margin-bottom: 12px; }

.earn-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.earn-item { background: #fff; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; align-items: center; gap: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
.earn-icon { font-size: 24px; }
.earn-name { font-size: 12px; color: #666; }
.earn-points { font-size: 14px; font-weight: 700; color: #6366f1; }

.log-list { display: flex; flex-direction: column; gap: 8px; }
.empty-tip { text-align: center; padding: 40px 0; color: #999; font-size: 14px; }

.log-item { display: flex; align-items: center; justify-content: space-between; background: #fff; border-radius: 10px; padding: 12px 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
.log-action { font-size: 13px; font-weight: 600; color: #333; }
.log-remark { font-size: 11px; color: #999; margin-top: 2px; }
.log-points { font-size: 16px; font-weight: 700; }
.log-points.plus { color: #6366f1; }
.log-points.minus { color: #ef4444; }
</style>
