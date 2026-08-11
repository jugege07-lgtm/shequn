<template>
  <div class="phone-frame pp-setup-page">
    <!-- Header -->
    <div class="pp-header">
      <div class="header-title-row">
        <div class="back-btn" @click="$router.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </div>
        <div class="header-title">{{ hasPassword ? '修改支付密码' : '设置支付密码' }}</div>
      </div>
    </div>

    <div class="main-scroll" v-loading="loading">
      <!-- 状态提示 -->
      <div class="status-card">
        <div class="status-icon" :class="{ set: hasPassword }">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
        </div>
        <div class="status-text">
          <div class="status-title">{{ hasPassword ? '已设置' : '未设置' }}</div>
          <div class="status-desc">{{ hasPassword ? '修改支付密码需短信验证码验证' : '首次设置支付密码，无需验证码' }}</div>
        </div>
      </div>

      <!-- 表单 -->
      <div class="form-card">
        <template v-if="hasPassword">
          <div class="form-item">
            <label class="form-label">短信验证码</label>
            <div class="code-row">
              <input class="form-input" type="text" placeholder="请输入短信验证码" v-model="code" maxlength="6" />
              <button class="code-btn" :disabled="countdown > 0 || sending" @click="sendCode">
                {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
              </button>
            </div>
          </div>
        </template>

        <div class="form-item">
          <label class="form-label">{{ hasPassword ? '新支付密码' : '支付密码' }}</label>
          <input class="form-input" type="password" placeholder="请输入6-20位支付密码" v-model="password" maxlength="20" autocomplete="new-password" />
        </div>

        <div class="form-item">
          <label class="form-label">确认{{ hasPassword ? '新' : '' }}支付密码</label>
          <input class="form-input" type="password" placeholder="请再次输入支付密码" v-model="confirmPassword" maxlength="20" autocomplete="new-password" />
        </div>

        <div class="form-tip">支付密码用于余额支付，请勿与登录密码相同，请妥善保管。</div>
      </div>
    </div>

    <div class="bottom-action">
      <button class="confirm-btn" :disabled="submitting" @click="submit">
        {{ submitting ? '提交中...' : (hasPassword ? '确认修改' : '确认设置') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCurrentUser, setPayPassword, sendPayPasswordCode } from '@/api'

const router = useRouter()
const loading = ref(false)
const submitting = ref(false)
const hasPassword = ref(false)
const password = ref('')
const confirmPassword = ref('')
const code = ref('')
const countdown = ref(0)
const sending = ref(false)
let timer: any = null

onMounted(() => {
  document.title = '支付密码'
  loadStatus()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

async function loadStatus() {
  loading.value = true
  try {
    const data = await getCurrentUser()
    hasPassword.value = !!data?.hasPayPassword
  } catch {
    // 忽略
  } finally {
    loading.value = false
  }
}

async function sendCode() {
  if (countdown.value > 0 || sending.value) return
  sending.value = true
  try {
    await sendPayPasswordCode()
    showToast('验证码已发送')
    countdown.value = 60
    timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0 && timer) {
        clearInterval(timer)
        timer = null
      }
    }, 1000)
  } catch (err: any) {
    showToast(err?.userMessage || err?.message || '验证码发送失败')
  } finally {
    sending.value = false
  }
}

function validate(): string {
  if (!password.value || password.value.length < 6 || password.value.length > 20) {
    return '支付密码需为6-20位'
  }
  if (password.value !== confirmPassword.value) {
    return '两次输入的支付密码不一致'
  }
  if (hasPassword.value && !code.value) {
    return '请输入短信验证码'
  }
  return ''
}

async function submit() {
  const errMsg = validate()
  if (errMsg) {
    showToast(errMsg)
    return
  }
  submitting.value = true
  try {
    await setPayPassword({
      payPassword: password.value,
      ...(hasPassword.value ? { code: code.value } : {}),
    })
    showToast(hasPassword.value ? '支付密码修改成功' : '支付密码设置成功')
    setTimeout(() => router.back(), 800)
  } catch (err: any) {
    showToast(err?.userMessage || err?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

function showToast(msg: string) {
  const existing = document.querySelector('.mobile-toast')
  if (existing) existing.remove()
  const el = document.createElement('div')
  el.textContent = msg
  el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,.78);color:#fff;padding:12px 24px;border-radius:12px;font-size:14px;z-index:9999;white-space:nowrap;animation:fadeInOut 2s ease forwards'
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 2000)
}
</script>

<style scoped>
@import '@/styles/global.css';
.pp-setup-page { background: #f5f6fa; }
.pp-header {
  background: #ffffff; color: #1e1b4b;
  /* 顶部安全区并入白色 Header，背景向上延伸覆盖状态栏，内容避让 */
  padding: calc(env(safe-area-inset-top, 0px) + 12px) 16px 0;
}
.header-title-row {
  position: relative; display: flex; align-items: center; justify-content: center;
  height: 44px; margin-bottom: 8px;
}
.header-title { font-size: 18px; font-weight: 700; }
.back-btn {
  position: absolute; left: -4px; width: 40px; height: 40px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; cursor: pointer; color: #1e1b4b;
}
.back-btn:active { background: rgba(0,0,0,0.05); }
.back-btn svg { width: 22px; height: 22px; }
.main-scroll {
  flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; padding: 16px;
}
.status-card {
  display: flex; align-items: center; gap: 14px;
  background: #fff; border-radius: 16px; padding: 18px;
  margin-bottom: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}
.status-icon {
  width: 48px; height: 48px; border-radius: 14px; flex-shrink: 0;
  background: #fef3c7; color: #f59e0b;
  display: flex; align-items: center; justify-content: center;
}
.status-icon.set { background: #d1fae5; color: #10b981; }
.status-icon svg { width: 24px; height: 24px; }
.status-title { font-size: 16px; font-weight: 700; color: #1e1b4b; }
.status-desc { font-size: 12px; color: #6b7280; margin-top: 2px; }
.form-card {
  background: #fff; border-radius: 16px; padding: 18px;
  margin-bottom: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}
.form-item { margin-bottom: 16px; }
.form-label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 8px; }
.form-input {
  width: 100%; box-sizing: border-box;
  padding: 12px 14px; border: 1.5px solid #e5e7eb; border-radius: 12px;
  font-size: 15px; color: #1e1b4b; outline: none; background: #fafafa;
  transition: border-color 0.2s, background 0.2s;
}
.form-input:focus { border-color: #6366f1; background: #fff; }
.code-row { display: flex; gap: 10px; }
.code-row .form-input { flex: 1; }
.code-btn {
  flex-shrink: 0; padding: 0 16px; border: none; border-radius: 12px;
  background: #6366f1; color: #fff; font-size: 14px; font-weight: 600; cursor: pointer;
}
.code-btn:disabled { opacity: 0.6; }
.form-tip { font-size: 12px; color: #9ca3af; line-height: 1.6; }
.bottom-action {
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 430px; padding: 12px 16px env(safe-area-inset-bottom, 12px);
  background: rgba(255,255,255,0.95); backdrop-filter: blur(20px);
  border-top: 0.5px solid rgba(60,60,67,0.1); z-index: 200;
}
.confirm-btn {
  width: 100%; padding: 14px; border: none; border-radius: 12px;
  background: #6366f1; color: #fff; font-size: 16px; font-weight: 600; cursor: pointer;
}
.confirm-btn:disabled { opacity: 0.6; }
</style>