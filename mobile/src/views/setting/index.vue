<template>
  <div class="phone-frame setting-page">
    <!-- Header -->
    <div class="setting-header">
      <div class="status-bar">
        <span>9:41</span>
        <div class="status-icons">
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none"><rect x="0" y="8" width="3" height="4" rx="0.5" fill="#1e1b4b"/><rect x="4.5" y="5" width="3" height="7" rx="0.5" fill="#1e1b4b"/><rect x="9" y="2" width="3" height="10" rx="0.5" fill="#1e1b4b"/><rect x="13.5" y="0" width="2.5" height="12" rx="0.5" fill="#1e1b4b"/></svg>
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none"><path d="M8 10.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" fill="#1e1b4b" transform="translate(0,-2)"/><path d="M4.5 8.5C5.5 7.2 6.7 6.5 8 6.5s2.5.7 3.5 2" stroke="#1e1b4b" stroke-width="1.2" stroke-linecap="round" fill="none"/></svg>
        </div>
      </div>
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
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

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
.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 14px;
}
.status-icons { display: flex; gap: 6px; }

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
.setting-arrow {
  width: 18px; height: 18px;
  color: #9ca3af;
}
</style>
