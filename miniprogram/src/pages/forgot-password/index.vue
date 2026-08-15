<template>
  <view class="fp-page">
    <view class="fp-bg-shapes">
      <view class="shape s1"></view>
      <view class="shape s2"></view>
      <view class="shape s3"></view>
    </view>
    <view class="fp-content">
      <!-- Logo -->
      <view class="fp-logo">
        <image class="logo-circle" :src="logoUrl" mode="aspectFill" />
        <text class="fp-title">重置密码</text>
        <text class="fp-subtitle">通过手机号 + 验证码验证身份，重新设置登录密码</text>
      </view>

      <!-- Form Card -->
      <view class="fp-card">
        <view class="form-group">
          <text class="form-label">手机号</text>
          <input v-model="form.phone" class="form-input" type="number" placeholder="请输入手机号" :maxlength="11" @input="onPhoneInput" />
          <text v-if="errors.phone" class="field-error">{{ errors.phone }}</text>
        </view>

        <view class="form-group">
          <text class="form-label">验证码</text>
          <view class="code-row">
            <input v-model="form.code" class="form-input code-input" type="number" placeholder="请输入验证码" :maxlength="6" />
            <button class="code-btn" :disabled="countdown > 0 || sending" @click="sendVerificationCode">
              {{ countdown > 0 ? `${countdown}s` : sending ? '发送中...' : '获取验证码' }}
            </button>
          </view>
          <text v-if="errors.code" class="field-error">{{ errors.code }}</text>
        </view>

        <view class="form-group">
          <text class="form-label">新密码</text>
          <view class="password-input-wrapper">
            <input v-model="form.password" class="form-input" :password="!showPassword" placeholder="请设置新密码（至少6位）" />
            <text class="eye-btn" @click="showPassword = !showPassword">{{ showPassword ? '👁️' : '👁️‍🗨️' }}</text>
          </view>
          <text v-if="errors.password" class="field-error">{{ errors.password }}</text>
        </view>

        <view class="form-group">
          <text class="form-label">确认密码</text>
          <view class="password-input-wrapper">
            <input v-model="form.confirmPassword" class="form-input" :password="!showConfirmPassword" placeholder="请再次输入新密码" />
            <text class="eye-btn" @click="showConfirmPassword = !showConfirmPassword">{{ showConfirmPassword ? '👁️' : '👁️‍🗨️' }}</text>
          </view>
          <text v-if="errors.confirmPassword" class="field-error">{{ errors.confirmPassword }}</text>
        </view>

        <button class="submit-btn" :class="{ loading: submitting }" @click="handleReset">确认重置</button>
        <view class="back-login" @click="$router.replace('/login')">返回登录</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { sendCode, resetPassword } from '@/api'

const router = useRouter()
const logoUrl = '/static/logo.jpg'

const form = reactive({ phone: '', code: '', password: '', confirmPassword: '' })
const errors = reactive<Record<string, string>>({})
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const countdown = ref(0)
const sending = ref(false)
const submitting = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

function showToast(msg: string) {
  uni.showToast({ title: msg, icon: 'none' })
}

// 手机号输入过滤：仅数字，最长 11 位
function onPhoneInput(e: any) {
  const v = String(e?.detail?.value ?? '').replace(/\D/g, '').slice(0, 11)
  form.phone = v
  return v
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
</script>

<style scoped>
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
.fp-bg-shapes { position: absolute; left: 0; right: 0; top: 0; bottom: 0; overflow: hidden; }
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
  border: 2px solid rgba(255,255,255,0.3);
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  margin: 0 auto 12px;
  display: block;
}
.fp-title { display: block; font-size: 24px; font-weight: 800; color: #fff; margin-bottom: 6px; letter-spacing: 2px; }
.fp-subtitle { display: block; font-size: 12px; color: rgba(255,255,255,0.8); letter-spacing: 1px; }

.fp-card {
  width: 100%;
  background: rgba(255,255,255,0.95);
  border-radius: 24px;
  border: 1px solid rgba(255,255,255,0.5);
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  padding: 24px;
  display: flex; flex-direction: column; gap: 16px;
  box-sizing: border-box;
}

.form-group { display: flex; flex-direction: column; gap: 4px; }
.form-label { font-size: 13px; font-weight: 600; color: var(--color-text-primary); }
.form-input {
  width: 100%; padding: 12px 14px;
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: var(--radius-md); font-size: 14px;
  background: rgba(0,0,0,0.02);
  color: var(--color-text-primary);
  box-sizing: border-box;
}
.form-input::placeholder { color: var(--color-text-tertiary); }

.password-input-wrapper { position: relative; }
.password-input-wrapper .form-input { padding-right: 40px; }
.eye-btn {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  font-size: 16px;
}

.code-row { display: flex; gap: 10px; }
.code-input { flex: 1; }
.code-btn {
  flex-shrink: 0; padding: 0 16px; height: 44px;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md); background: #fff;
  color: var(--color-primary); font-size: 13px; font-weight: 500;
  white-space: nowrap;
}
.code-btn:active { background: var(--color-primary-50); }
.code-btn:disabled { opacity: 0.5; }

.field-error { font-size: 11px; color: var(--color-danger); margin-top: 2px; }

.submit-btn {
  width: 100%; padding: 14px;
  background: var(--color-primary); color: #fff;
  border: none; border-radius: 12px;
  font-size: 16px; font-weight: 600;
  margin-top: 4px;
}
.submit-btn:active { transform: scale(0.98); background: var(--color-primary-dark); }
.submit-btn.loading { opacity: 0.7; pointer-events: none; }

.back-login {
  text-align: center; font-size: 13px; color: var(--color-primary);
  padding: 6px 0;
}
</style>
