<template>
  <div class="phone-frame dajia-page">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <div class="back-btn" @click="$router.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </div>
        <span class="header-title">大咖人脉</span>
      </div>
      <div class="header-vip-badge" v-if="isVip">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        VIP{{ minVipLevel }}
      </div>
    </div>

    <!-- Main Scroll -->
    <div class="main-scroll" v-loading="loading">
      <!-- VIP 未开通 / 等级不足 -->
      <div class="vip-guard" v-if="!isVip">
        <div class="guard-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div class="guard-title">专属大咖人脉</div>
        <div class="guard-desc">开通 VIP{{ minVipLevel }} 及以上会员，解锁大咖推荐、一键联系、人脉拓展等权益</div>
        <button class="guard-btn" @click="$router.push('/vip/index')">立即开通 VIP</button>
      </div>

      <!-- 已开通 VIP：推荐列表 -->
      <template v-else>
        <div class="intro-banner">
          <div class="intro-title">结识行业大咖，拓展优质人脉</div>
          <div class="intro-sub">点击「联系他」发起申请，对方同意后即可查看完整联系方式</div>
        </div>

        <div class="dajia-list" v-if="list.length">
          <div class="dajia-card" v-for="item in list" :key="item.id">
            <div class="dajia-head">
              <div class="dajia-avatar" :style="{ background: getAvatarColor(item.nickname || item.realName) }">
                <img v-if="avatarUrl(item.avatarUrl)" :src="avatarUrl(item.avatarUrl)" class="avatar-img" alt="头像" />
                <span v-else>{{ (item.nickname || item.realName || '大咖').charAt(0) }}</span>
              </div>
              <div class="dajia-meta">
                <div class="dajia-name">
                  {{ item.nickname || item.realName || '大咖' }}
                  <span class="vip-tag" v-if="item.vipLevel"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>VIP{{ item.vipLevel }}</span>
                </div>
                <div class="dajia-title">{{ item.position || '行业精英' }}<span v-if="item.company"> · {{ item.company }}</span></div>
              </div>
            </div>

            <div class="dajia-intro" v-if="item.intro">{{ item.intro }}</div>

            <div class="dajia-phone" v-if="item.phone">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.12.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.58 2.81.7A2 2 0 0122 16.92z"/></svg>
              <span :class="{ unlocked: item.status === 'accepted' }">{{ item.phone }}</span>
              <span class="phone-tip" v-if="item.status !== 'accepted'">(加人脉后可见)</span>
            </div>

            <div class="dajia-actions">
              <button
                v-if="item.status === 'none'"
                class="connect-btn primary"
                @click="handleRequest(item)"
                :disabled="requesting"
              >
                联系他
              </button>
              <button v-else-if="item.status === 'requested'" class="connect-btn requested" disabled>
                等待对方确认
              </button>
              <button v-else-if="item.status === 'accepted'" class="connect-btn accepted" disabled>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                已添加
              </button>
              <button v-else-if="item.status === 'rejected'" class="connect-btn primary-rejected" @click="handleRequest(item)" :disabled="requesting">
                重新申请
              </button>
            </div>
          </div>
        </div>
        <div class="empty-state" v-else>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          <span>暂无大咖推荐，敬请期待</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getDajiaConfig, getDajiaRecommendations, requestConnection } from '@/api'
import { useUserStore } from '@/store/user'
import { normalizeImageUrl } from '@/utils/image'

const userStore = useUserStore()

const loading = ref(false)
const requesting = ref(false)
const list = ref<any[]>([])
const minVipLevel = ref(1)

const isVip = computed(() => {
  const u = userStore.userInfo
  if (!u) return false
  if ((u.vipLevel || 0) < minVipLevel.value) return false
  if (u.vipExpireAt && new Date(u.vipExpireAt).getTime() < Date.now()) return false
  return true
})

function avatarUrl(url: string) {
  return url ? normalizeImageUrl(url) : ''
}

function getAvatarColor(name: string) {
  const colors = ['#ede9fe', '#dbeafe', '#fef3c7', '#fce7f3', '#d1fae5']
  const index = (name || '大咖').charCodeAt(0) % colors.length
  return colors[index]
}

async function handleRequest(item: any) {
  if (requesting.value) return
  requesting.value = true
  try {
    await requestConnection(item.id)
    item.status = 'requested'
    showToast('联系申请已发送，请等待对方确认')
  } catch (err: any) {
    showToast(err?.message || '发送失败，请稍后重试')
  } finally {
    requesting.value = false
  }
}

async function loadRecommendations() {
  loading.value = true
  try {
    const config = await getDajiaConfig().catch(() => ({ minVipLevel: 1 }))
    minVipLevel.value = config?.minVipLevel || 1
    if (isVip.value) {
      const res = await getDajiaRecommendations()
      list.value = res?.list || []
    }
  } catch (err: any) {
    // 优先使用拦截器解析后的友好提示（如"该功能需要 VIP1 及以上会员权限"），避免暴露原始英文错误
    showToast(err?.userMessage || err?.message || '加载失败')
  } finally {
    loading.value = false
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

onMounted(() => {
  document.title = '大咖人脉'
  loadRecommendations()
})
</script>

<style scoped>
@import '@/styles/global.css';

.dajia-page { background: #f5f6fa; }

/* Header */
.header {
  position: sticky; top: 0; z-index: 100;
  background: #ffffff;
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-bottom: 0.5px solid rgba(60,60,67,0.1);
  margin-top: calc(env(safe-area-inset-top, 0px) * -1);
  padding: calc(env(safe-area-inset-top, 0px) + 10px) 16px 10px;
  display: flex; align-items: center; justify-content: space-between;
}
.header-left { display: flex; align-items: center; gap: 12px; }
.back-btn {
  width: 32px; height: 32px; border-radius: 50%;
  background: rgba(0,0,0,0.05); display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background 0.2s ease;
}
.back-btn:active { background: rgba(0,0,0,0.1); }
.back-btn svg { width: 20px; height: 20px; color: #1e1b4b; }
.header-title { font-size: 18px; font-weight: 700; color: #1e1b4b; }
.header-vip-badge {
  display: flex; align-items: center; gap: 4px;
  padding: 5px 12px; border-radius: 99px;
  background: linear-gradient(135deg, #fde68a, #f59e0b);
  color: #78350f; font-size: 12px; font-weight: 700;
}
.header-vip-badge svg { width: 13px; height: 13px; }

.main-scroll { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; padding: 16px 16px 40px; }

/* VIP Guard */
.vip-guard {
  margin-top: 40px; padding: 48px 24px;
  background: #fff; border-radius: 20px;
  display: flex; flex-direction: column; align-items: center; text-align: center;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
}
.guard-icon {
  width: 84px; height: 84px; border-radius: 50%;
  background: linear-gradient(135deg, rgba(245,158,11,0.12), rgba(251,191,36,0.05));
  display: flex; align-items: center; justify-content: center;
  color: #f59e0b; margin-bottom: 20px;
}
.guard-icon svg { width: 40px; height: 40px; }
.guard-title { font-size: 20px; font-weight: 800; color: #1e1b4b; margin-bottom: 10px; }
.guard-desc { font-size: 14px; color: #6b7280; line-height: 1.6; margin-bottom: 24px; }
.guard-btn {
  padding: 12px 40px; border: none; border-radius: 99px;
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  color: #fff; font-size: 15px; font-weight: 700; cursor: pointer;
  transition: transform 0.15s, opacity 0.15s;
}
.guard-btn:active { transform: scale(0.96); opacity: 0.9; }

/* Intro Banner */
.intro-banner {
  padding: 18px 16px; border-radius: 16px; margin-bottom: 16px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #fff;
}
.intro-title { font-size: 16px; font-weight: 700; margin-bottom: 6px; }
.intro-sub { font-size: 12px; opacity: 0.9; line-height: 1.5; }

/* Dajia List */
.dajia-list { display: flex; flex-direction: column; gap: 14px; }
.dajia-card {
  background: #fff; border-radius: 16px; padding: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}
.dajia-head { display: flex; align-items: center; gap: 12px; }
.dajia-avatar {
  width: 48px; height: 48px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; font-weight: 700; color: #6366f1; flex-shrink: 0; overflow: hidden;
}
.avatar-img { width: 100%; height: 100%; object-fit: cover; }
.dajia-meta { flex: 1; min-width: 0; }
.dajia-name { font-size: 16px; font-weight: 700; color: #1e1b4b; margin-bottom: 3px; display: flex; align-items: center; gap: 6px; }
.vip-tag {
  display: inline-flex; align-items: center; gap: 2px;
  font-size: 10px; font-weight: 700; color: #f59e0b;
  background: rgba(245,158,11,0.1); padding: 2px 6px; border-radius: 6px;
}
.vip-tag svg { width: 10px; height: 10px; }
.dajia-title { font-size: 13px; color: #6b7280; }
.dajia-intro {
  font-size: 13px; color: #4b5563; line-height: 1.6;
  margin: 12px 0; padding: 10px 12px; background: #f9fafb; border-radius: 10px;
}
.dajia-phone {
  display: flex; align-items: center; gap: 6px;
  font-size: 14px; color: #374151; margin-bottom: 14px;
}
.dajia-phone svg { width: 16px; height: 16px; color: #6366f1; flex-shrink: 0; }
.dajia-phone span.unlocked { font-weight: 700; letter-spacing: 1px; color: #1e1b4b; }
.phone-tip { font-size: 12px; color: #9ca3af; }
.dajia-actions { display: flex; justify-content: flex-end; }
.connect-btn {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 8px 22px; border-radius: 99px; font-size: 13px; font-weight: 600; cursor: pointer; border: none;
  transition: transform 0.15s, opacity 0.15s;
}
.connect-btn svg { width: 14px; height: 14px; }
.connect-btn:active { transform: scale(0.96); }
.connect-btn.primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; }
.connect-btn.primary-rejected { background: #6366f1; color: #fff; }
.connect-btn.requested { background: #f3f4f6; color: #6b7280; cursor: not-allowed; }
.connect-btn.accepted { background: rgba(16,185,129,0.1); color: #10b981; cursor: default; }
.connect-btn:disabled { opacity: 0.7; }

.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px; color: #9ca3af; }
.empty-state svg { width: 44px; height: 44px; margin-bottom: 10px; }
.empty-state span { font-size: 13px; }
</style>