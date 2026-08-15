<template>
  <view :style="sbStyle" class="phone-frame balance-page">
    <!-- Header -->
    <view class="header">
      <view class="back-btn" @click="$router.push('/profile/index')">
        <image :src="iconBack" mode="aspectFit" />
      </view>
      <text class="header-title">我的余额</text>
    </view>

    <view class="main-scroll">
      <!-- Balance Hero -->
      <view class="balance-hero">
        <view class="bh-mesh"></view>
        <view class="bh-glow"></view>
        <view class="bh-label">我的余额（元）</view>
        <view class="bh-amount">¥{{ balance.toFixed(2) }}</view>
        <button class="bh-recharge-btn" @click="openRecharge">
          <image :src="iconPlus" mode="aspectFit" />
          充值
        </button>
        <view class="bh-tip">商机成交收益的 70% 将自动到账</view>
      </view>

      <!-- Filter Tabs -->
      <view class="filter-tabs">
        <view
          class="filter-tab"
          :class="{ active: activeType === t.value }"
          v-for="t in typeTabs"
          :key="t.value"
          @click="switchType(t.value)"
        >
          {{ t.label }}
        </view>
      </view>

      <!-- Transaction List -->
      <view class="log-list">
        <view v-if="!loading && logs.length === 0" class="empty-tip">
          <image :src="iconEmpty" mode="aspectFit" />
          <text>暂无记录</text>
        </view>

        <view class="log-item" v-for="log in logs" :key="log.id">
          <view class="log-icon" :class="log.type">
            <image :src="logIcon(log.type)" mode="aspectFit" />
          </view>
          <view class="log-info">
            <view class="log-title-row">
              <text class="log-title">{{ log.remark || typeLabel(log.type) }}</text>
              <text class="log-type-tag" :class="log.type">{{ typeLabel(log.type) }}</text>
            </view>
            <view class="log-sub">{{ formatTime(log.createdAt) }}</view>
            <view class="log-detail" v-if="log.type === 'income' && log.businessTitle">
              商机「{{ log.businessTitle }}」成交 ¥{{ Number(log.dealAmount || 0).toFixed(2) }} · 分成 {{ Math.round(Number(log.ratio || 0.7) * 100) }}%
            </view>
          </view>
          <view class="log-amount" :class="log.type">
            {{ formatAmount(log) }}
          </view>
        </view>

        <view v-if="logs.length >= size" class="load-more" @click="loadMore">
          {{ loadingMore ? '加载中...' : '加载更多' }}
        </view>
      </view>
    </view>

    <!-- Recharge Modal -->
    <view v-if="rechargeOpen" class="sheet-mask" @click="rechargeOpen = false">
      <view class="recharge-sheet" @click.stop>
        <view class="sheet-handle"></view>
        <view class="sheet-title">余额充值</view>
        <view class="sheet-sub">选择充值金额</view>

        <view class="amount-grid">
          <view
            class="amount-option"
            :class="{ active: selectedAmount === a }"
            v-for="a in presets"
            :key="a"
            @click="selectedAmount = a"
          >
            <text class="amount-opt-label">¥</text>{{ a }}
          </view>
        </view>

        <view class="custom-amount">
          <text class="custom-label">自定义金额</text>
          <view class="custom-input-wrap">
            <text class="custom-currency">¥</text>
            <input
              v-model="customAmount"
              type="digit"
              placeholder="请输入金额"
              @input="onCustomInput"
            />
          </view>
        </view>

        <button class="recharge-confirm" :disabled="!validAmount || paying" @click="doRecharge">
          {{ paying ? '正在发起支付...' : `立即充值 ¥${finalAmount.toFixed(2)}` }}
        </button>
        <view class="sheet-tip">将通过微信支付完成充值，支付成功后余额即时到账</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { sbStyle } from '@/utils/sb'
import { ref, computed, onMounted } from 'vue'
import { getMyBalance, getMyBalanceLogs, rechargeBalance, createUnifiedOrder } from '@/api'
import { requestPayment } from '@/utils/pay'
import { svgUri } from '@/utils/svg'

const balance = ref(0)
const loading = ref(false)
const loadingMore = ref(false)
const logs = ref<any[]>([])
const activeType = ref('all')
const page = ref(1)
const size = 20
const total = ref(0)

const rechargeOpen = ref(false)
const presets = [50, 100, 200, 500, 1000]
const selectedAmount = ref<number | null>(null)
const customAmount = ref('')
const paying = ref(false)

const iconBack = svgUri('<path d="M19 12H5M12 19l-7-7 7-7"/>', { color: '#5a4632' })
const iconPlus = svgUri('<path d="M12 5v14M5 12h14"/>', { color: '#3a2f1a' })
const iconEmpty = svgUri('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>', { color: '#b0a89a', strokeWidth: '1.5' })

// 流水图标（按类型着色）
const LOG_ICON_PATHS: Record<string, string> = {
  payment: '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  adjust: '<path d="M3 12h18M12 3v18"/>',
  income: '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>',
  default: '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>',
}
const LOG_ICON_COLORS: Record<string, string> = {
  payment: '#d97777',
  adjust: '#4a7bd4',
  income: '#6b5b9e',
  recharge: '#d4a34a',
}
function logIcon(type: string): string {
  return svgUri(LOG_ICON_PATHS[type] || LOG_ICON_PATHS.default, { color: LOG_ICON_COLORS[type] || '#d4a34a' })
}

const typeTabs = [
  { label: '全部', value: 'all' },
  { label: '充值', value: 'recharge' },
  { label: '收益', value: 'income' },
  { label: '支付', value: 'payment' },
  { label: '调整', value: 'adjust' },
]

const finalAmount = computed(() => {
  if (selectedAmount.value) return selectedAmount.value
  const custom = parseFloat(customAmount.value)
  return isNaN(custom) ? 0 : custom
})

const validAmount = computed(() => finalAmount.value > 0)

const TYPE_LABELS: Record<string, string> = {
  recharge: '充值',
  income: '收益',
  payment: '支付',
  adjust: '调整',
}

function typeLabel(type: string) {
  return TYPE_LABELS[type] || '充值'
}

function formatAmount(log: any) {
  const v = Number(log.amount) || 0
  const sign = v >= 0 ? '+' : ''
  return sign + v.toFixed(2)
}

function showToast(msg: string) {
  uni.showToast({ title: msg, icon: 'none' })
}

function openRecharge() {
  selectedAmount.value = presets[1]
  customAmount.value = ''
  rechargeOpen.value = true
}

function onCustomInput() {
  selectedAmount.value = null
}

async function loadBalance() {
  try {
    const data = await getMyBalance()
    if (data) balance.value = Number(data.balance) || 0
  } catch {}
}

async function fetchLogs(reset = false) {
  if (reset) {
    page.value = 1
    logs.value = []
  }
  loading.value = reset
  try {
    const data = await getMyBalanceLogs({ page: page.value, size, type: activeType.value })
    if (data?.list) {
      logs.value = reset ? data.list : [...logs.value, ...data.list]
      total.value = data.total || 0
    }
  } catch {
    logs.value = []
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function switchType(type: string) {
  if (type === activeType.value) return
  activeType.value = type
  fetchLogs(true)
}

function loadMore() {
  if (logs.value.length >= total.value) return
  loadingMore.value = true
  page.value += 1
  fetchLogs(false)
}

async function doRecharge() {
  const amount = finalAmount.value
  if (!amount || amount <= 0) return
  paying.value = true
  try {
    // 1. 创建充值订单（待支付）
    const order: any = await rechargeBalance(amount)
    if (!order?.orderId) throw new Error('创建充值订单失败')
    // 2. 获取微信统一下单调起参数
    const payParams: any = await createUnifiedOrder(order.orderId)
    if (!payParams?.appId) throw new Error('未获取到有效支付参数')
    // 3. 调起微信支付（结果由微信回调异步更新余额）
    await requestPayment(payParams)
    rechargeOpen.value = false
    showToast('支付请求已发起，请完成支付')
  } catch (e: any) {
    showToast(e?.message || '充值失败')
  } finally {
    paying.value = false
    await loadBalance()
    await fetchLogs(true)
  }
}

function formatTime(dateStr: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

onMounted(() => {
  loadBalance()
  fetchLogs(true)
})
</script>

<style scoped>

.balance-page { background: #f6f4ef; position: relative; }

.header {
  position: sticky; top: var(--sbh, 0px); z-index: 100;
  background: #f6f4ef; padding: 12px 16px;
  display: flex; align-items: center; gap: 12px;
}
.back-btn {
  width: 32px; height: 32px; border-radius: 50%;
  background: #fff; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 1px 4px rgba(90,60,30,0.08);
}
.back-btn image { width: 18px; height: 18px; }
.header-title { font-size: 18px; font-weight: 700; color: #2b2320; }

.main-scroll { padding: 4px 16px 32px; }

/* Balance Hero */
.balance-hero {
  position: relative; overflow: hidden;
  border-radius: 20px; padding: 28px 24px 22px;
  background: linear-gradient(150deg, #433c6b 0%, #5a4f8a 55%, #6b5b9e 100%);
  color: #fff; box-shadow: 0 12px 30px rgba(70,60,110,0.25);
}
.bh-mesh {
  position: absolute; width: 220px; height: 220px;
  top: -90px; right: -70px; border-radius: 50%;
  background: radial-gradient(circle, rgba(212,175,122,0.35) 0%, rgba(212,175,122,0) 70%);
}
.bh-glow {
  position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, transparent, #d4af7a, transparent);
}
.bh-label { font-size: 13px; opacity: 0.75; letter-spacing: 1px; }
.bh-amount {
  font-size: 44px; font-weight: 800; margin: 10px 0 18px;
  font-variant-numeric: tabular-nums; letter-spacing: -1px;
}
.bh-recharge-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 28px; border: none; border-radius: 99px;
  background: linear-gradient(135deg, #e3c98f, #d4af7a);
  color: #3a2f1a; font-size: 15px; font-weight: 700;
  box-shadow: 0 6px 16px rgba(212,175,122,0.35);
  transition: transform 0.15s ease;
}
.bh-recharge-btn:active { transform: scale(0.96); }
.bh-recharge-btn image { width: 18px; height: 18px; }
.bh-tip { margin-top: 14px; font-size: 11px; opacity: 0.6; }

/* Filter Tabs */
.filter-tabs {
  display: flex; gap: 8px; margin: 18px 0 12px;
  background: #fff; border-radius: 99px; padding: 4px;
  box-shadow: 0 1px 4px rgba(90,60,30,0.06);
}
.filter-tab {
  flex: 1; text-align: center; padding: 8px 0;
  font-size: 13px; font-weight: 600; color: #8a7f6d;
  border-radius: 99px; transition: all 0.2s ease;
}
.filter-tab.active {
  background: linear-gradient(135deg, #5a4f8a, #6b5b9e);
  color: #fff; box-shadow: 0 3px 10px rgba(90,80,150,0.3);
}

/* Log List */
.log-list { display: flex; flex-direction: column; gap: 10px; }
.empty-tip {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 60px 0; color: #b0a89a; font-size: 14px;
}
.empty-tip image { width: 40px; height: 40px; opacity: 0.5; }

.log-item {
  display: flex; align-items: center; gap: 12px;
  background: #fff; border-radius: 14px; padding: 14px;
  box-shadow: 0 1px 4px rgba(90,60,30,0.06);
}
.log-icon {
  width: 42px; height: 42px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.log-icon image { width: 20px; height: 20px; }
.log-icon.income { background: #ede9fe; }
.log-icon.recharge { background: #fdf3e3; }
.log-icon.payment { background: #fdecec; }
.log-icon.adjust { background: #e8f0fe; }

.log-info { flex: 1; min-width: 0; }
.log-title-row { display: flex; align-items: center; gap: 8px; }
.log-title { font-size: 14px; font-weight: 600; color: #2b2320; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.log-type-tag {
  flex-shrink: 0; font-size: 10px; padding: 2px 8px; border-radius: 99px; font-weight: 600;
}
.log-type-tag.income { background: #ede9fe; color: #6b5b9e; }
.log-type-tag.recharge { background: #fdf3e3; color: #d4a34a; }
.log-type-tag.payment { background: #fdecec; color: #d97777; }
.log-type-tag.adjust { background: #e8f0fe; color: #4a7bd4; }
.log-sub { font-size: 11px; color: #b0a89a; margin-top: 3px; font-variant-numeric: tabular-nums; }
.log-detail { font-size: 11px; color: #8a7f6d; margin-top: 3px; }

.log-amount { font-size: 17px; font-weight: 800; flex-shrink: 0; font-variant-numeric: tabular-nums; }
.log-amount.income { color: #6b5b9e; }
.log-amount.recharge { color: #d4a34a; }
.log-amount.adjust { color: #4a7bd4; }
.log-amount.payment { color: #d97777; }

.load-more {
  text-align: center; padding: 14px 0; color: #8a7f6d;
  font-size: 13px;
}

/* Recharge Sheet */
.sheet-mask {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.45); z-index: 200;
  display: flex; align-items: flex-end; justify-content: center;
}
.recharge-sheet {
  width: 100%; max-width: 480px;
  background: #fff; border-radius: 20px 20px 0 0; padding: 16px 20px 28px;
  animation: slideUp 0.28s ease;
}
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.sheet-handle { width: 40px; height: 4px; border-radius: 2px; background: #e0dad0; margin: 0 auto 16px; }
.sheet-title { font-size: 18px; font-weight: 800; color: #2b2320; }
.sheet-sub { font-size: 13px; color: #8a7f6d; margin: 6px 0 18px; }

.amount-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.amount-option {
  padding: 14px 0; text-align: center;
  border: 1.5px solid #e6dfd3; border-radius: 12px;
  font-size: 18px; font-weight: 700; color: #2b2320;
  transition: all 0.15s ease; font-variant-numeric: tabular-nums;
}
.amount-opt-label { font-size: 13px; font-weight: 600; margin-right: 2px; }
.amount-option.active {
  border-color: #d4af7a; background: #fdf6e9; color: #8a5a1d;
  box-shadow: 0 0 0 1px #d4af7a inset;
}

.custom-amount {
  display: flex; align-items: center; gap: 12px; margin-top: 16px;
  padding: 12px 14px; background: #f7f4ee; border-radius: 12px;
}
.custom-label { font-size: 13px; color: #8a7f6d; white-space: nowrap; }
.custom-input-wrap { flex: 1; display: flex; align-items: center; background: #fff; border-radius: 10px; padding: 0 12px; }
.custom-currency { font-size: 16px; font-weight: 700; color: #8a7f6d; margin-right: 4px; }
.custom-input-wrap input {
  flex: 1; font-size: 16px; font-weight: 600; color: #2b2320; padding: 10px 0;
}
.custom-input-wrap input::placeholder { color: #c8c0b2; font-weight: 400; }

.recharge-confirm {
  width: 100%; margin-top: 20px; padding: 14px 0; border: none; border-radius: 12px;
  background: linear-gradient(135deg, #5a4f8a, #6b5b9e);
  color: #fff; font-size: 16px; font-weight: 700;
  transition: opacity 0.15s ease;
}
.recharge-confirm:disabled { opacity: 0.4; }
.sheet-tip { text-align: center; font-size: 11px; color: #b0a89a; margin-top: 12px; }
</style>
