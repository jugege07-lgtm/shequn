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
          <div class="msg-actions" v-if="m.type === 'connection_request' && m.canRespond">
            <button class="act-btn accept" @click.stop="handleRespond(m, true)">同意</button>
            <button class="act-btn reject" @click.stop="handleRespond(m, false)">拒绝</button>
          </div>
          <div class="msg-responded" v-else-if="m.type === 'connection_request'">{{ m.respondText }}</div>
        </div>
        <div class="msg-dot" v-if="!m.isRead"></div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getMessages, markMessageRead, respondConnection } from '@/api'

const messages = ref<any[]>([])

function iconClassOf(type: string) {
  if (type === 'activity') return 'green'
  if (type === 'order') return 'orange'
  if (type === 'connection_request') return 'purple'
  return 'blue'
}

function parseData(jsonStr: string) {
  try {
    return JSON.parse(jsonStr || '{}')
  } catch {
    return {}
  }
}

onMounted(async () => {
  try {
    const res = await getMessages({ page: 1, size: 20 })
    messages.value = (res.list || []).map((m: any) => {
      const payload = parseData(m.data)
      const isRequest = m.type === 'connection_request'
      return {
        id: m.id,
        title: m.title,
        desc: m.content,
        time: m.createdAt,
        iconClass: iconClassOf(m.type),
        isRead: m.isRead,
        type: m.type,
        connectionId: payload.connectionId ?? null,
        canRespond: isRequest && !payload._responded,
        respondText: payload._respondText || '',
      }
    })
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

const handleRespond = async (m: any, accept: boolean) => {
  if (!m.connectionId) return
  try {
    await respondConnection(m.connectionId, accept)
    m.canRespond = false
    m.respondText = accept ? '已同意该申请' : '已拒绝该申请'
    showToast(accept ? '已同意，对方可查看你的联系方式' : '已拒绝')
  } catch (err: any) {
    const msg = err?.userMessage || err?.message || '操作失败'
    // 申请已被处理等情况，隐藏按钮
    if (/已处理|不存在/.test(msg)) {
      m.canRespond = false
      m.respondText = '该申请已处理'
    }
  }
}

function showToast(msg: string) {
  const existing = document.querySelector('.mobile-toast')
  if (existing) existing.remove()
  const el = document.createElement('div')
  el.className = 'mobile-toast'
  el.textContent = msg
  el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.78);color:#fff;padding:12px 28px;border-radius:12px;font-size:14px;z-index:9999;white-space:nowrap;animation:fadeInOut 2s ease forwards'
  document.body.appendChild(el)
  if (!document.getElementById('mobile-toast-style')) {
    const style = document.createElement('style')
    style.id = 'mobile-toast-style'
    style.textContent = '@keyframes fadeInOut{0%{opacity:0}15%{opacity:1}85%{opacity:1}100%{opacity:0}}'
    document.head.appendChild(style)
  }
  setTimeout(() => el.remove(), 2000)
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
.msg-icon.purple { background: rgba(139,92,246,0.1); color: #8b5cf6; }
.msg-content { flex: 1; min-width: 0; }
.msg-title { font-size: 14px; font-weight: 600; color: var(--color-text-primary); margin-bottom: 2px; }
.msg-desc { font-size: 12px; color: var(--color-text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.msg-time { font-size: 11px; color: var(--color-text-tertiary); margin-top: 2px; }
.msg-actions { display: flex; gap: 10px; margin-top: 8px; }
.act-btn {
  padding: 5px 20px; border-radius: 99px; font-size: 12px; font-weight: 600; cursor: pointer; border: none;
  transition: transform 0.15s, opacity 0.15s;
}
.act-btn:active { transform: scale(0.95); }
.act-btn.accept { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; }
.act-btn.reject { background: #f3f4f6; color: #6b7280; }
.msg-responded { font-size: 12px; color: #9ca3af; margin-top: 6px; }
.msg-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--color-danger); flex-shrink: 0; }
</style>
