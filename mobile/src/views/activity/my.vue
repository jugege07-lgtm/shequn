<template>
  <div class="phone-frame">
    <div class="header">
      <div class="header-left">
        <div class="back-btn" @click="$router.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m15 18-6-6 6-6"/></svg>
        </div>
        <span class="header-title">我的报名</span>
      </div>
    </div>
    <div class="main-scroll">
      <div class="tab-bar">
        <div class="tab-item active" v-for="t in tabs" :key="t">{{ t }}</div>
      </div>
      <div class="list-card" v-if="signups.length > 0">
        <div class="signup-item" v-for="s in signups" :key="s.id">
          <div class="signup-cover" :style="{background: s.cover}">{{ s.emoji }}</div>
          <div class="signup-info">
            <div class="signup-title">{{ s.title }}</div>
            <div class="signup-meta">{{ s.date }} · {{ s.location }}</div>
            <div class="signup-status" :class="s.statusClass">{{ s.statusText }}</div>
          </div>
        </div>
      </div>
      <div class="empty-state" v-else>
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        </div>
        <div class="empty-title">暂无报名记录</div>
        <div class="empty-desc">快去浏览精彩活动吧！</div>
        <div class="empty-btn" @click="$router.push('/activity/list')">浏览活动</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const tabs = ['全部', '即将开始', '进行中', '已结束']
const signups = ref([
  { id: 1, title: '2026 社群创业沙龙', cover: 'linear-gradient(135deg,#818cf8,#6366f1)', emoji: '🏙️', date: '7月15日 14:00', location: '深圳南山', statusText: '已确认', statusClass: 'confirmed' },
])
</script>

<style scoped>
@import '@/styles/global.css';
.tab-bar { display: flex; padding: 12px 16px; gap: 8px; }
.tab-item { padding: 6px 16px; border-radius: 99px; background: rgba(255,255,255,0.7); font-size: 13px; color: var(--color-text-secondary); }
.tab-item.active { background: var(--color-primary); color: #fff; }
.list-card { padding: 0 16px 16px; }
.signup-item { display: flex; gap: 12px; padding: 12px; border-radius: var(--radius-lg); background: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.5); margin-bottom: 10px; }
.signup-cover { width: 72px; height: 72px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 32px; flex-shrink: 0; }
.signup-info { flex: 1; min-width: 0; }
.signup-title { font-size: 14px; font-weight: 600; color: var(--color-text-primary); margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.signup-meta { font-size: 12px; color: var(--color-text-tertiary); margin-bottom: 4px; }
.signup-status { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 99px; display: inline-block; }
.signup-status.confirmed { background: rgba(16,185,129,0.1); color: #10b981; }

.empty-state { padding: 60px 20px; text-align: center; }
.empty-icon { width: 80px; height: 80px; margin: 0 auto 16px; border-radius: var(--radius-xl); background: rgba(255,255,255,0.7); display: flex; align-items: center; justify-content: center; }
.empty-icon svg { width: 40px; height: 40px; color: var(--color-text-tertiary); }
.empty-title { font-size: 16px; font-weight: 600; color: var(--color-text-primary); margin-bottom: 4px; }
.empty-desc { font-size: 13px; color: var(--color-text-secondary); margin-bottom: 20px; }
.empty-btn { display: inline-block; padding: 10px 24px; border-radius: 99px; background: var(--color-primary); color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; }
</style>
