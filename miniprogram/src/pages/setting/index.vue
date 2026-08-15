<template>
  <view class="phone-frame setting-page">
    <!-- Header -->
    <view class="setting-header">
      <view class="header-title-row">
        <view class="back-btn" @click="$router.back()">
          <image :src="iconBack" mode="aspectFit" />
        </view>
        <view class="header-title">设置</view>
      </view>
    </view>

    <!-- Main Content -->
    <view class="main-scroll">
      <view class="setting-group">
        <view class="setting-item" @click="$router.push('/card/edit')">
          <text class="setting-label">编辑资料</text>
          <image class="setting-arrow" :src="iconArrow" mode="aspectFit" />
        </view>
        <view class="setting-item" @click="$router.push('/setting/pay-password')">
          <text class="setting-label">支付密码</text>
          <view class="setting-right">
            <text class="setting-tag">{{ payStatusText }}</text>
            <image class="setting-arrow" :src="iconArrow" mode="aspectFit" />
          </view>
        </view>
        <view class="setting-item" @click="$router.push('/vip/index')">
          <text class="setting-label">会员中心</text>
          <image class="setting-arrow" :src="iconArrow" mode="aspectFit" />
        </view>
      </view>

      <view class="setting-group">
        <view class="setting-item" @click="showLogoutConfirm">
          <text class="setting-label logout-label">退出登录</text>
          <image class="setting-arrow" :src="iconArrow" mode="aspectFit" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { getCurrentUser } from '@/api'
import { svgUri } from '@/utils/svg'

const router = useRouter()
const userStore = useUserStore()
const hasPayPassword = ref(false)

const iconBack = svgUri('<path d="m15 18-6-6 6-6"/>', { color: '#1e1b4b' })
const iconArrow = svgUri('<path d="M9 18l6-6-6-6"/>', { color: '#9ca3af' })

const payStatusText = computed(() => hasPayPassword.value ? '已设置' : '未设置')

onMounted(() => {
  getCurrentUser().then((data: any) => {
    if (data) hasPayPassword.value = !!data.hasPayPassword
  }).catch(() => {})
})

function showLogoutConfirm() {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (!res.confirm) return
      userStore.logout()
      router.replace('/login')
    },
  })
}
</script>

<style scoped>

.setting-page { background: #f5f6fa; }

.setting-header {
  background: #ffffff;
  /* 顶部安全区并入白色 Header，背景向上延伸覆盖状态栏，内容避让 */
  padding: calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) + 12px) 16px 0;
  color: #1e1b4b;
}

.header-title-row {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  margin-bottom: 8px;
}
.header-title {
  font-size: 18px;
  font-weight: 700;
}
.back-btn {
  position: absolute;
  left: -4px;
  width: 40px; height: 40px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #1e1b4b;
  transition: background 0.2s ease;
}
.back-btn:active { background: rgba(0,0,0,0.05); }
.back-btn image { width: 22px; height: 22px; }

.main-scroll {
  flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
  padding: 16px;
}

.setting-group {
  margin-bottom: 16px;
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}
.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  transition: background 0.15s;
}
.setting-item:active { background: rgba(0,0,0,0.03); }
.setting-item + .setting-item { border-top: 1px solid #f3f4f6; }
.setting-label {
  font-size: 15px;
  color: #1e1b4b;
  font-weight: 500;
}
.logout-label { color: #ef4444; }
.setting-right { display: flex; align-items: center; gap: 8px; }
.setting-tag { font-size: 12px; color: #9ca3af; }
.setting-arrow {
  width: 18px; height: 18px;
}
</style>
