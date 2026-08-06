<template>
  <div class="phone-frame">
    <div class="header"><div class="header-left"><div class="back-btn" @click="$router.back()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m15 18-6-6 6-6"/></svg></div><span class="header-title">消息通知</span></div></div>
    <div class="main-scroll">
      <div class="msg-item" v-for="m in messages" :key="m.id" @click="handleRead(m)">
        <div class="msg-icon" :class="m.iconClass">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
        <div class="msg-content">
          <div class="msg-title">{{ m.title }}</div>
          <div class="msg-desc">{{ m.desc }}</div>
          <div class="msg-time">{{ m.time }}</div>
        </div>
        <div class="msg-dot" v-if="!m.isRead"></div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getMessages, markMessageRead } from '@/api'

const messages = ref<any[]>([])

function iconClassOf(type: string) {
  if (type === 'activity') return 'green'
  if (type === 'order') return 'orange'
  return 'blue'
}

onMounted(async () => {
  try {
    const res = await getMessages({ page: 1, size: 20 })
    messages.value = (res.list || []).map((m: any) => ({
      id: m.id,
      title: m.title,
      desc: m.content,
      time: m.createdAt,
      iconClass: iconClassOf(m.type),
      isRead: m.isRead,
    }))
  } catch (err: any) {
    console.error('加载消息失败', err)
  }
})

const handleRead = async (m: any) => {
  if (m.isRead) return
  try {
    await markMessageRead(m.id)
    m.isRead = 1
  } catch (err: any) {
    console.error('标记已读失败', err)
  }
}
</script>
<style scoped>
@import '@/styles/global.css';
.msg-item { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-bottom: 1px solid rgba(0,0,0,0.05); cursor: pointer; }
.msg-item:active { background: rgba(99,102,241,0.05); }
.msg-icon { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.msg-icon svg { width: 20px; height: 20px; }
.msg-icon.green { background: rgba(16,185,129,0.1); color: #10b981; }
.msg-icon.blue { background: var(--color-primary-50); color: var(--color-primary); }
.msg-icon.orange { background: rgba(245,158,11,0.1); color: #f59e0b; }
.msg-content { flex: 1; min-width: 0; }
.msg-title { font-size: 14px; font-weight: 600; color: var(--color-text-primary); margin-bottom: 2px; }
.msg-desc { font-size: 12px; color: var(--color-text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.msg-time { font-size: 11px; color: var(--color-text-tertiary); margin-top: 2px; }
.msg-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--color-danger); flex-shrink: 0; }
</style>
