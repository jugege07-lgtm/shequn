<template>
  <div class="phone-frame">
    <div class="header"><div class="header-left"><div class="back-btn" @click="$router.back()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m15 18-6-6 6-6"/></svg></div><span class="header-title">我的商机</span></div></div>
    <div class="main-scroll">
      <div class="list-card" v-if="items.length > 0">
        <div class="item" v-for="it in items" :key="it.id">
          <div class="item-tag" :class="it.tagClass">{{ it.tag }}</div>
          <div class="item-title">{{ it.title }}</div>
          <div class="item-meta">{{ it.date }} · {{ it.status }}</div>
        </div>
      </div>
      <div class="empty-state" v-else>
        <div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div>
        <div class="empty-title">暂无商机</div>
        <div class="empty-desc">去发布一条商机吧</div>
        <div class="empty-btn" @click="$router.push('/business/publish')">发布商机</div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
const items = ref([{ id: 1, tag: '资源对接', tagClass: '', title: '寻找短视频MCN机构合作', date: '7月15日', status: '对接中' }])
</script>
<style scoped>
@import '@/styles/global.css';
.list-card { padding: 0 16px 16px; }
.item { display: flex; align-items: center; gap: 10px; padding: 14px; border-radius: var(--radius-lg); background: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.5); margin-bottom: 10px; }
.item-tag { font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 99px; background: var(--color-primary-50); color: var(--color-primary); }
.item-title { flex: 1; font-size: 14px; font-weight: 600; color: var(--color-text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.item-meta { font-size: 12px; color: var(--color-text-tertiary); }
.empty-state { padding: 60px 20px; text-align: center; }
.empty-icon { width: 80px; height: 80px; margin: 0 auto 16px; border-radius: var(--radius-xl); background: rgba(255,255,255,0.7); display: flex; align-items: center; justify-content: center; }
.empty-icon svg { width: 40px; height: 40px; color: var(--color-text-tertiary); }
.empty-title { font-size: 16px; font-weight: 600; color: var(--color-text-primary); margin-bottom: 4px; }
.empty-desc { font-size: 13px; color: var(--color-text-secondary); margin-bottom: 20px; }
.empty-btn { display: inline-block; padding: 10px 24px; border-radius: 99px; background: var(--color-primary); color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; }
</style>
