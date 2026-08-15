<template>
  <div class="phone-frame">
    <div class="header">
      <div class="header-left">
        <div class="back-btn" @click="$router.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m15 18-6-6 6-6"/></svg>
        </div>
        <span class="header-title">新增收货地址</span>
      </div>
    </div>

    <div class="main-scroll">
      <div class="form-card">
        <div class="form-item">
          <span class="form-label">收货人</span>
          <input v-model="form.receiver" placeholder="请输入收货人姓名" />
        </div>
        <div class="form-item">
          <span class="form-label">手机号</span>
          <input v-model="form.phone" placeholder="请输入手机号" maxlength="11" />
        </div>
        <div class="form-item">
          <span class="form-label">省份</span>
          <input v-model="form.province" placeholder="请输入省份" />
        </div>
        <div class="form-item">
          <span class="form-label">城市</span>
          <input v-model="form.city" placeholder="请输入城市" />
        </div>
        <div class="form-item">
          <span class="form-label">区县</span>
          <input v-model="form.district" placeholder="请输入区县" />
        </div>
        <div class="form-item">
          <span class="form-label">详细地址</span>
          <input v-model="form.detail" placeholder="请输入街道、门牌号等" />
        </div>
        <div class="form-item switch-item">
          <span class="form-label">设为默认地址</span>
          <div class="switch" :class="{ active: form.isDefault }" @click="form.isDefault = form.isDefault ? 0 : 1">
            <div class="switch-thumb"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="bottom-bar">
      <button class="save-btn" :disabled="saving" @click="handleSave">
        {{ saving ? '保存中...' : '保存地址' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { createAddress } from '@/api'

const router = useRouter()
const saving = ref(false)
const form = ref<any>({
  receiver: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  isDefault: 0,
})

function validate(): string | null {
  if (!form.value.receiver) return '请输入收货人姓名'
  if (!form.value.phone) return '请输入手机号'
  if (!/^1\d{10}$/.test(form.value.phone)) return '手机号格式不正确'
  if (!form.value.province || !form.value.city || !form.value.district) return '请完善省市区信息'
  if (!form.value.detail) return '请输入详细地址'
  return null
}

async function handleSave() {
  const err = validate()
  if (err) {
    showToast(err)
    return
  }
  saving.value = true
  try {
    await createAddress(form.value)
    showToast('保存成功')
    router.back()
  } catch (e: any) {
    // 敏感词命中已由 request 层弹提示框，跳过重复 toast
    if (e?.moderation) return
    showToast(e.message || '保存失败')
  } finally {
    saving.value = false
  }
}

function showToast(msg: string) {
  if (typeof uni !== 'undefined' && uni.showToast) {
    uni.showToast({ title: msg, icon: 'none' })
    return
  }
  const existing = document.querySelector('.mobile-toast')
  if (existing) existing.remove()
  const el = document.createElement('div')
  el.className = 'mobile-toast'
  el.textContent = msg
  el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.78);color:#fff;padding:12px 28px;border-radius:12px;font-size:14px;z-index:9999;white-space:nowrap'
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 2000)
}

onMounted(() => {
  document.title = '新增收货地址'
})
</script>

<style scoped>
@import '@/styles/global.css';
.form-card {
  margin: 12px 16px; padding: 0 16px; border-radius: var(--radius-xl);
  background: rgba(255,255,255,0.75); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.5);
  box-shadow: var(--glass-shadow);
}
.form-item { display: flex; align-items: center; gap: 12px; padding: 14px 0; border-bottom: 1px solid rgba(0,0,0,0.05); }
.form-item:last-child { border-bottom: none; }
.form-label { width: 90px; flex-shrink: 0; font-size: 14px; color: var(--color-text-primary); font-weight: 600; }
.form-item input { flex: 1; border: none; background: transparent; font-size: 14px; color: var(--color-text-primary); outline: none; }
.switch-item { justify-content: space-between; }
.switch { width: 48px; height: 26px; border-radius: 13px; background: #e5e7eb; position: relative; transition: background 0.2s; }
.switch.active { background: var(--color-primary); }
.switch-thumb { width: 22px; height: 22px; border-radius: 50%; background: #fff; position: absolute; top: 2px; left: 2px; transition: transform 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
.switch.active .switch-thumb { transform: translateX(22px); }
.bottom-bar {
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 430px;
  padding: 12px 16px var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 12px)); background: rgba(255,255,255,0.95); backdrop-filter: blur(20px);
  border-top: 0.5px solid rgba(60,60,67,0.1); z-index: 200;
}
.save-btn { width: 100%; padding: 14px; border: none; border-radius: 12px; background: var(--color-primary); color: #fff; font-size: 16px; font-weight: 600; }
.save-btn:disabled { opacity: 0.6; }
</style>
