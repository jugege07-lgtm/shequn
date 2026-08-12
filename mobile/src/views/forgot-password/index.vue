<template>
  <div class="fp-page">
    <div class="fp-bg-shapes">
      <div class="shape s1"></div>
      <div class="shape s2"></div>
      <div class="shape s3"></div>
    </div>
    <div class="fp-content">
      <!-- Logo -->
      <div class="fp-logo">
        <img class="logo-circle" :src="logoUrl" alt="聚格软件" />
        <h1>重置密码</h1>
        <p class="fp-subtitle">通过手机号 + 验证码验证身份，重新设置登录密码</p>
      </div>

      <!-- Form Card -->
      <div class="fp-card">
        <div class="form-group">
          <label class="form-label">手机号</label>
          <input v-model="form.phone" class="form-input" type="tel" placeholder="请输入手机号" maxlength="11" @input="form.phone = form.phone.replace(/\D/g, '').slice(0, 11)" />
          <span v-if="errors.phone" class="field-error">{{ errors.phone }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">验证码</label>
          <div class="code-row">
            <input v-model="form.code" class="form-input code-input" type="text" placeholder="请输入验证码" maxlength="6" />
            <button class="code-btn" :disabled="countdown > 0 || sending" @click="sendVerificationCode">
              {{ countdown > 0 ? `${countdown}s` : sending ? '发送中...' : '获取验证码' }}
            </button>
          </div>
          <span v-if="errors.code" class="field-error">{{ errors.code }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">新密码</label>
          <div class="password-input-wrapper">
            <input v-model="form.password" class="form-input" :type="showPassword ? 'text' : 'password'" placeholder="请设置新密码（至少6位）" />
            <span class="eye-btn" @click="showPassword = !showPassword">{{ showPassword ? '👁️' : '👁️‍🗨️' }}</span>
          </div>
          <span v-if="errors.password" class="field-error">{{ errors.password }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">确认密码</label>
          <div class="password-input-wrapper">
            <input v-model="form.confirmPassword" class="form-input" :type="showConfirmPassword ? 'text' : 'password'" placeholder="请再次输入新密码" />
            <span class="eye-btn" @click="showConfirmPassword = !showConfirmPassword">{{ showConfirmPassword ? '👁️' : '👁️‍🗨️' }}</span>
          </div>
          <span v-if="errors.confirmPassword" class="field-error">{{ errors.confirmPassword }}</span>
        </div>

        <button class="submit-btn" :class="{ loading: submitting }" @click="handleReset">确认重置</button>
        <div class="back-login" @click="$router.replace('/login')">返回登录</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { sendCode, resetPassword } from '@/api'

const router = useRouter()
const logoUrl = `${import.meta.env.BASE_URL}logo.jpg`

const form = reactive({ phone: '', code: '', password: '', confirmPassword: '' })
const errors = reactive<Record<string, string>>({})
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const countdown = ref(0)
const sending = ref(false)
const submitting = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

function showToast(msg: string) {
  const existing = document.querySelector('.toast-msg')
  if (existing) existing.remove()
  const el = document.createElement('div')
  el.className = 'toast-msg'
  el.textContent = msg
  el.style.cssText = 'position:fixed;top:40%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,.78);color:#fff;padding:12px 28px;border-radius:12px;font-size:14px;z-index:9999;white-space:nowrap;animation:fadeInOut 2s ease forwards'
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 2200)
}

async function sendVerificationCode() {
  if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    errors.phone = '请输入正确的手机号'
    return
  }
  if (countdown.value > 0 || sending.value) return
  sending.value = true
  try {
    await sendCode(form.phone)
    countdown.value = 60
    timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer!)
        timer = null
      }
    }, 1000)
    showToast('验证码已发送')
  } catch (err: any) {
    showToast(err.userMessage || err.message || '发送失败')
  } finally {
    sending.value = false
  }
}

function validate(): boolean {
  Object.keys(errors).forEach(k => delete errors[k])
  let ok = true
  if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    errors.phone = '请输入正确的手机号'; ok = false
  }
  if (!form.code) {
    errors.code = '请输入验证码'; ok = false
  }
  if (!form.password || form.password.length < 6) {
    errors.password = '新密码至少6位'; ok = false
  }
  if (!form.confirmPassword) {
    errors.confirmPassword = '请再次输入确认密码'; ok = false
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = '两次密码不一致'; ok = false
  }
  return ok
}

async function handleReset() {
  if (!validate()) return
  submitting.value = true
  try {
    await resetPassword({ phone: form.phone, code: form.code, password: form.password })
    showToast('密码重置成功')
    setTimeout(() => router.replace('/login'), 1200)
  } catch (err: any) {
    showToast(err.userMessage || err.message || '重置失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  document.title = '重置密码'
})
</script>

<style scoped>
@import '@/styles/global.css';

.fp-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  /* 状态栏/刘海安全区：渐变背景向上延伸覆盖状态栏，内容居中不受影响 */
  padding: env(safe-area-inset-top, 0px) 0 env(safe-area-inset-bottom, 0px);
}
.fp-bg-shapes { position: absolute; inset: 0; overflow: hidden; }
.fp-bg-shapes .shape { position: absolute; border-radius: 50%; opacity: 0.1; background: #fff; }
.fp-bg-shapes .shape.s1 { width: 200px; height: 200px; top: -60px; right: -40px; }
.fp-bg-shapes .shape.s2 { width: 140px; height: 140px; bottom: -30px; left: -20px; }
.fp-bg-shapes .shape.s3 { width: 80px; height: 80px; top: 40px; left: 80px; }

.fp-content {
  position: relative; z-index: 10;
  width: 100%; max-width: 430px;
  display: flex; flex-direction: column; align-items: center;
  padding: 40px 20px 20px;
}

.fp-logo { text-align: center; margin-bottom: 28px; }
.logo-circle {
  width: 64px; height: 64px; border-radius: 16px;
  object-fit: cover;
  border: 2px solid rgba(255,255,255,0.3);
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  margin: 0 auto 12px;
}
.fp-logo h1 { font-size: 24px; font-weight: 800; color: #fff; margin-bottom: 6px; letter-spacing: 2px; }
.fp-subtitle { font-size: 12px; color: rgba(255,255,255,0.8); letter-spacing: 1px; }

.fp-card {
  width: 100%;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255,255,255,0.5);
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  padding: 24px;
  display: flex; flex-direction: column; gap: 16px;
}

.form-group { display: flex; flex-direction: column; gap: 4px; }
.form-label { font-size: 13px; font-weight: 600; color: var(--color-text-primary); }
.form-input {
  width: 100%; padding: 12px 14px;
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: var(--radius-md); font-size: 14px;
  outline: none; transition: border-color 0.2s;
  background: rgba(0,0,0,0.02);
  color: var(--color-text-primary);
  box-sizing: border-box;
}
.form-input:focus { border-color: var(--color-primary); background: #fff; }
.form-input::placeholder { color: var(--color-text-tertiary); }

.password-input-wrapper { position: relative; }
.password-input-wrapper .form-input { padding-right: 40px; }
.eye-btn {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  font-size: 16px; cursor: pointer; user-select: none;
}

.code-row { display: flex; gap: 10px; }
.code-input { flex: 1; }
.code-btn {
  flex-shrink: 0; padding: 0 16px; height: 44px;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md); background: #fff;
  color: var(--color-primary); font-size: 13px; font-weight: 500;
  cursor: pointer; transition: all 0.2s; white-space: nowrap;
}
.code-btn:active { background: var(--color-primary-50); }
.code-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.field-error { font-size: 11px; color: var(--color-danger); margin-top: 2px; }

.submit-btn {
  width: 100%; padding: 14px;
  background: var(--color-primary); color: #fff;
  border: none; border-radius: 12px;
  font-size: 16px; font-weight: 600;
  cursor: pointer; transition: all 0.2s ease;
  margin-top: 4px;
}
.submit-btn:active { transform: scale(0.98); background: var(--color-primary-dark); }
.submit-btn.loading { opacity: 0.7; pointer-events: none; }

.back-login {
  text-align: center; font-size: 13px; color: var(--color-primary);
  cursor: pointer; padding: 6px 0;
}
</style>