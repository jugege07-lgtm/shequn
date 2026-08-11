<template>
  <div class="phone-frame setting-page">
    <!-- Header -->
    <div class="setting-header">
      <div class="header-title-row">
        <div class="back-btn" @click="$router.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </div>
        <div class="header-title">设置</div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-scroll">
      <div class="setting-group">
        <div class="setting-item" @click="$router.push('/card/edit')">
          <span class="setting-label">编辑资料</span>
          <svg class="setting-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </div>
        <div class="setting-item" @click="$router.push('/setting/pay-password')">
          <span class="setting-label">支付密码</span>
          <div class="setting-right">
            <span class="setting-tag">{{ payStatusText }}</span>
            <svg class="setting-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </div>
        </div>
        <div class="setting-item" @click="$router.push('/vip/index')">
          <span class="setting-label">会员中心</span>
          <svg class="setting-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </div>
      </div>

      <div class="setting-group">
        <div class="setting-item" @click="showLogoutConfirm">
          <span class="setting-label logout-label">退出登录</span>
          <svg class="setting-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { getCurrentUser } from '@/api'

const router = useRouter()
const userStore = useUserStore()
const hasPayPassword = ref(false)

const payStatusText = computed(() => hasPayPassword.value ? '已设置' : '未设置')

onMounted(() => {
  getCurrentUser().then((data: any) => {
    if (data) hasPayPassword.value = !!data.hasPayPassword
  }).catch(() => {})
})

function showLogoutConfirm() {
  if (!confirm('确定要退出登录吗？')) return
  userStore.logout()
  router.replace('/login')
}
</script>

<style scoped>
@import '@/styles/global.css';

.setting-page { background: #f5f6fa; }

.setting-header {
  background: #ffffff;
  padding: 12px 16px 0;
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
  cursor: pointer;
  color: #1e1b4b;
  transition: background 0.2s ease;
}
.back-btn:active { background: rgba(0,0,0,0.05); }
.back-btn svg { width: 22px; height: 22px; }

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
  cursor: pointer;
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
  color: #9ca3af;
}
</style>
