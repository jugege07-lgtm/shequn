<template>
  <view :style="sbStyle" class="phone-frame history-page">
    <view class="header">
      <view class="header-left">
        <view class="back-btn" @click="$router.back()">
          <image :src="iconBack" mode="aspectFit" />
        </view>
        <text class="header-title">浏览历史</text>
      </view>
      <view class="header-clear" @click="handleClear" v-if="history.length">
        <image :src="iconTrash" mode="aspectFit" />
        <text>清空</text>
      </view>
    </view>

    <view class="main-scroll">
      <view class="history-list" v-if="history.length">
        <view class="history-item" v-for="item in history" :key="item.type + '-' + item.id" @click="goDetail(item)">
          <view class="history-icon" :class="item.type">
            <image v-if="item.type === 'activity'" :src="iconTypeActivity" mode="aspectFit" />
            <image v-else-if="item.type === 'business'" :src="iconTypeBusiness" mode="aspectFit" />
            <image v-else :src="iconTypeProduct" mode="aspectFit" />
          </view>
          <view class="history-content">
            <view class="history-title">{{ item.title }}</view>
            <view class="history-meta">
              <text class="history-tag" :class="item.type">{{ typeName(item.type) }}</text>
              <text class="history-time">{{ formatTime(item.time) }}</text>
            </view>
          </view>
          <image class="history-arrow" :src="iconArrowRight" mode="aspectFit" />
        </view>
      </view>

      <view class="empty-state" v-else>
        <image :src="iconEmptyClock" mode="aspectFit" />
        <text class="empty-title">暂无浏览记录</text>
        <view class="empty-hint">浏览活动、商机或商品后，这里会展示您的足迹</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { sbStyle } from '@/utils/sb'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getBrowseHistory, clearBrowseHistory, type BrowseRecord } from '@/utils/browseHistory'
import { svgUri } from '@/utils/svg'

const iconBack = svgUri('<path d="M19 12H5M12 19l-7-7 7-7"/>', { color: '#1e1b4b' })
const iconTrash = svgUri('<path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/>', { color: '#6b7280' })
const iconTypeActivity = svgUri('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>', { color: '#7c3aed' })
const iconTypeBusiness = svgUri('<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>', { color: '#2563eb' })
const iconTypeProduct = svgUri('<path d="M4 2h16l-2 12H6L4 2zm0 0l-1 6M6 20a2 2 0 100 4 2 2 0 000-4zm12 0a2 2 0 100 4 2 2 0 000-4z"/>', { color: '#10b981' })
const iconArrowRight = svgUri('<path d="M9 18l6-6-6-6"/>', { color: '#c4c4c4' })
const iconEmptyClock = svgUri('<path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/>', { color: '#b0b0b0', strokeWidth: '1.5' })

const router = useRouter()
const loading = ref(false)
const history = ref<BrowseRecord[]>([])

const TYPE_NAMES: Record<string, string> = {
  activity: '活动',
  business: '商机',
  product: '商品',
}

function typeName(type: string) {
  return TYPE_NAMES[type] || '内容'
}

function formatTime(time: number) {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (days === 0) {
    if (hours === 0) {
      const mins = Math.floor(diff / (1000 * 60))
      return mins <= 1 ? '刚刚' : `${mins}分钟前`
    }
    return `${hours}小时前`
  }
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function goDetail(item: BrowseRecord) {
  if (item.type === 'activity') router.push(`/activity/detail/${item.id}`)
  else if (item.type === 'business') router.push(`/business/detail/${item.id}`)
  else router.push(`/mall/detail/${item.id}`)
}

function load() {
  loading.value = true
  history.value = getBrowseHistory()
  loading.value = false
}

function handleClear() {
  uni.showModal({
    title: '提示',
    content: '确定清空全部浏览历史吗？',
    success: (res) => {
      if (!res.confirm) return
      clearBrowseHistory()
      load()
    },
  })
}

onMounted(() => {
  load()
})
</script>

<style scoped>
.history-page { background: #f5f6fa; min-height: 100vh; display: flex; flex-direction: column; }
.header {
  position: sticky; top: var(--sbh, 0px); z-index: 100;
  background: #ffffff;
  border-bottom: 0.5px solid rgba(60,60,67,0.1);
  padding: 10px 16px 10px;
  display: flex; align-items: center; justify-content: space-between;
}
.header-left { display: flex; align-items: center; gap: 12px; }
.back-btn {
  width: 32px; height: 32px; border-radius: 50%;
  background: rgba(0,0,0,0.05); display: flex; align-items: center; justify-content: center;
}
.back-btn:active { background: rgba(0,0,0,0.1); }
.back-btn image { width: 20px; height: 20px; }
.header-title { font-size: 18px; font-weight: 700; color: #1e1b4b; }
.header-clear {
  display: flex; align-items: center; gap: 4px;
  font-size: 13px; color: var(--color-text-secondary);
  padding: 6px 8px;
}
.header-clear image { width: 16px; height: 16px; }

.main-scroll { flex: 1; padding-bottom: 40px; }
.history-list { display: flex; flex-direction: column; gap: 12px; padding: 16px; }
.history-item {
  display: flex; align-items: center; gap: 14px;
  padding: 14px; border-radius: var(--radius-xl);
  background: rgba(255,255,255,0.75);
  border: 1px solid rgba(255,255,255,0.5); box-shadow: var(--glass-shadow);
  transition: transform 0.15s ease;
}
.history-item:active { transform: scale(0.98); }
.history-icon {
  width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.history-icon image { width: 22px; height: 22px; }
.history-icon.activity { background: #ede9fe; }
.history-icon.business { background: #dbeafe; }
.history-icon.product { background: #d1fae5; }
.history-content { flex: 1; min-width: 0; }
.history-title {
  font-size: 15px; font-weight: 600; color: var(--color-text-primary);
  margin-bottom: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.history-meta { display: flex; align-items: center; gap: 8px; }
.history-tag {
  font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 99px; flex-shrink: 0;
}
.history-tag.activity { background: rgba(124,58,237,0.1); color: #7c3aed; }
.history-tag.business { background: rgba(37,99,235,0.1); color: #2563eb; }
.history-tag.product { background: rgba(16,185,129,0.1); color: #10b981; }
.history-time { font-size: 12px; color: var(--color-text-tertiary); }
.history-arrow { width: 16px; height: 16px; flex-shrink: 0; }

.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 80px 32px; color: #b0b0b0;
}
.empty-state image { width: 56px; height: 56px; margin-bottom: 12px; }
.empty-title { font-size: 15px; font-weight: 600; color: #6b7280; margin-bottom: 6px; }
.empty-hint { font-size: 13px; color: #9ca3af; }
</style>
