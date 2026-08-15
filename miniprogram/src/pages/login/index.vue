<template>
  <view class="login-page">
    <view class="login-bg-shapes">
      <view class="shape s1" />
      <view class="shape s2" />
      <view class="shape s3" />
    </view>
    <view class="login-content">
      <!-- Logo -->
      <view class="login-logo">
        <image class="logo-circle" :src="logoUrl" mode="aspectFill" />
        <text class="login-title">聚格软件</text>
        <text class="login-subtitle">连接人脉 · 共享商机 · 共同成长</text>
      </view>

      <!-- Tab Switcher -->
      <view class="tab-switcher">
        <view class="tab-item" :class="{ active: mode === 'login' }" @click="mode = 'login'">登录</view>
        <view class="tab-item" :class="{ active: mode === 'register' }" @click="mode = 'register'">注册</view>
      </view>

      <view class="login-card">
        <!-- ========== 登录表单 ========== -->
        <view v-if="mode === 'login'" class="form-section">
          <view class="form-group">
            <text class="form-label">手机号</text>
            <input v-model="loginForm.phone" class="form-input" type="number" placeholder="请输入手机号" :maxlength="11" @input="onPhoneInput" />
            <text v-if="loginErrors.phone" class="field-error">{{ loginErrors.phone }}</text>
          </view>
          <view class="form-group">
            <text class="form-label">密码</text>
            <view class="password-input-wrapper">
              <input v-model="loginForm.password" class="form-input" :password="!showPassword" placeholder="请输入密码" confirm-type="done" @confirm="handleLogin" />
              <text class="eye-btn" @click="showPassword = !showPassword">{{ showPassword ? '👁️' : '👁️‍🗨️' }}</text>
            </view>
            <text v-if="loginErrors.password" class="field-error">{{ loginErrors.password }}</text>
          </view>
          <view class="login-actions">
            <button class="submit-btn" :class="{ loading: loginLoading }" @click="handleLogin">登 录</button>
            <text class="forgot-password" @click="$router.push('/forgot-password')">忘记密码?</text>
          </view>
          <view class="divider"><text class="divider-text">其他登录方式</text></view>
          <view class="login-methods">
            <view class="method-item" @click="handleWechatLogin">
              <view class="method-avatar wechat-avatar">
                <text class="method-glyph">💬</text>
              </view>
              <text class="method-label">微信登录</text>
            </view>
            <view class="method-item" @click="handleOneClickLogin">
              <view class="method-avatar phone-avatar">
                <image class="method-svg" :src="iconPhone" mode="aspectFit" />
              </view>
              <text class="method-label">手机一键登录</text>
            </view>
          </view>
        </view>

        <!-- ========== 注册表单 ========== -->
        <view v-else class="form-section">
          <view class="form-group">
            <text class="form-label">手机号</text>
            <input v-model="regForm.phone" class="form-input" type="number" placeholder="请输入手机号" :maxlength="11" @input="onRegPhoneInput" />
            <text v-if="regErrors.phone" class="field-error">{{ regErrors.phone }}</text>
          </view>
          <view class="form-group">
            <text class="form-label">验证码</text>
            <view class="code-row">
              <input v-model="regForm.code" class="form-input code-input" type="number" placeholder="请输入验证码" :maxlength="6" />
              <button class="code-btn" :disabled="regCountdown > 0 || regSending" @click="sendRegCode">
                {{ regCountdown > 0 ? `${regCountdown}s` : regSending ? '发送中...' : '获取验证码' }}
              </button>
            </view>
            <text v-if="regErrors.code" class="field-error">{{ regErrors.code }}</text>
          </view>
          <view class="form-group">
            <text class="form-label">密码</text>
            <view class="password-input-wrapper">
              <input v-model="regForm.password" class="form-input" :password="!showRegPassword" placeholder="请设置密码（至少6位）" />
              <text class="eye-btn" @click="showRegPassword = !showRegPassword">{{ showRegPassword ? '👁️' : '👁️‍🗨️' }}</text>
            </view>
            <view class="pwd-strength" v-if="regForm.password">
              <view class="strength-bars">
                <view class="bar" :class="{ filled: strength >= 1 }" />
                <view class="bar" :class="{ filled: strength >= 2 }" />
                <view class="bar" :class="{ filled: strength >= 3 }" />
              </view>
              <text class="strength-text" :class="strengthClass">{{ strengthText }}</text>
            </view>
            <text v-if="regErrors.password" class="field-error">{{ regErrors.password }}</text>
          </view>
          <view class="form-group">
            <text class="form-label">确认密码</text>
            <view class="password-input-wrapper">
              <input v-model="regForm.confirmPassword" class="form-input" :password="!showRegConfirmPassword" placeholder="请再次输入密码" />
              <text class="eye-btn" @click="showRegConfirmPassword = !showRegConfirmPassword">{{ showRegConfirmPassword ? '👁️' : '👁️‍🗨️' }}</text>
            </view>
            <text v-if="regErrors.confirmPassword" class="field-error">{{ regErrors.confirmPassword }}</text>
          </view>
          <view class="form-group">
            <text class="form-label">真实姓名</text>
            <input v-model="regForm.realName" class="form-input" placeholder="请输入真实姓名" />
            <text v-if="regErrors.realName" class="field-error">{{ regErrors.realName }}</text>
          </view>
          <view class="form-group">
            <text class="form-label">昵称 <text class="optional">(选填)</text></text>
            <input v-model="regForm.nickname" class="form-input" placeholder="请输入昵称" />
          </view>
          <view class="form-group">
            <text class="form-label">公司名称 <text class="optional">(选填)</text></text>
            <input v-model="regForm.company" class="form-input" placeholder="请输入公司名称" />
          </view>
          <view class="form-group">
            <text class="form-label">职位 <text class="optional">(选填)</text></text>
            <input v-model="regForm.position" class="form-input" placeholder="请输入职位" />
          </view>
          <view class="agreement">
            <view class="agree-label" @click="agreeTerms = !agreeTerms">
              <view class="mp-checkbox" :class="{ checked: agreeTerms }">
                <text v-if="agreeTerms" class="mp-checkbox-mark">✓</text>
              </view>
              <text>我已阅读并同意</text>
              <text class="link" @click.stop="showAgreementModal = true">《用户协议》</text>
              <text>和</text>
              <text class="link" @click.stop="showPrivacyModal = true">《隐私政策》</text>
            </view>
            <text v-if="regErrors.agree" class="field-error">{{ regErrors.agree }}</text>
          </view>
          <button class="submit-btn" :class="{ loading: regLoading }" @click="handleRegister">注 册</button>
        </view>
      </view>
    </view>

    <!-- Agreement Modal -->
    <view class="modal-mask" v-if="showAgreementModal" @click="showAgreementModal = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">用户协议</text>
          <text class="modal-close" @click="showAgreementModal = false">✕</text>
        </view>
        <scroll-view class="modal-body" scroll-y>
          <text class="modal-p">欢迎使用聚格软件平台。使用本平台即表示您同意以下条款：</text>
          <text class="modal-li">1. 您应提供真实、准确的个人信息。</text>
          <text class="modal-li">2. 您不得利用本平台从事违法、违规活动。</text>
          <text class="modal-li">3. 您发布的商品信息应真实有效，不得虚假宣传。</text>
          <text class="modal-li">4. 我们有权对违反协议的用户采取警告、封禁等措施。</text>
        </scroll-view>
      </view>
    </view>

    <!-- Privacy Modal -->
    <view class="modal-mask" v-if="showPrivacyModal" @click="showPrivacyModal = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">隐私政策</text>
          <text class="modal-close" @click="showPrivacyModal = false">✕</text>
        </view>
        <scroll-view class="modal-body" scroll-y>
          <text class="modal-p">我们重视您的隐私保护。以下是我们的隐私政策：</text>
          <text class="modal-li">1. 我们收集的信息包括手机号、昵称、头像等个人资料。</text>
          <text class="modal-li">2. 我们使用您的信息进行身份验证、提供服务及改进用户体验。</text>
          <text class="modal-li">3. 未经您的同意，我们不会向第三方出售您的个人信息。</text>
          <text class="modal-li">4. 您可以随时在设置中修改或删除您的个人信息。</text>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { wechatLogin, register, login, sendCode } from '@/api'
import { useUserStore } from '@/store/user'
import { refreshUserAfterLogin } from '@/utils/auth'
import { svgUri } from '@/utils/svg'

const router = useRouter()
const route = useRoute()
const logoUrl = '/static/logo.jpg'
const userStore = useUserStore()

const iconPhone = svgUri(
  '<path d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.24.2 2.45.57 3.57a1 1 0 0 1-.24 1.02l-2.21 2.2z"/>',
  { fill: '#ffffff', color: 'none' }
)

// 登录/注册成功后统一跳转：优先回跳 redirect，否则进主界面
function redirectAfterAuth() {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
  router.replace(redirect && redirect.startsWith('/') ? redirect : '/')
}

const mode = ref<'login' | 'register'>('login')

function showToast(msg: string) {
  uni.showToast({ title: msg, icon: 'none' })
}

// ===== Login form =====
const loginForm = reactive({ phone: '', password: '' })
const loginErrors = reactive<Record<string, string>>({})
const loginLoading = ref(false)
const showPassword = ref(false)

function onPhoneInput(e: any) {
  const v = String(e?.detail?.value ?? '').replace(/\D/g, '').slice(0, 11)
  loginForm.phone = v
  return v
}
function onRegPhoneInput(e: any) {
  const v = String(e?.detail?.value ?? '').replace(/\D/g, '').slice(0, 11)
  regForm.phone = v
  return v
}

function validateLoginForm(): boolean {
  Object.keys(loginErrors).forEach((k) => delete loginErrors[k])
  let ok = true
  if (!/^1[3-9]\d{9}$/.test(loginForm.phone)) {
    loginErrors.phone = '请输入正确的手机号'
    ok = false
  }
  if (!loginForm.password) {
    loginErrors.password = '请输入密码'
    ok = false
  }
  return ok
}

async function handleLogin() {
  if (!validateLoginForm()) return
  loginLoading.value = true
  try {
    const res: any = await login({ phone: loginForm.phone, password: loginForm.password })
    userStore.setToken(res.accessToken, res.refreshToken)
    await refreshUserAfterLogin(res.user)
    showToast('登录成功')
    redirectAfterAuth()
  } catch (err: any) {
    showToast(err.message || '登录失败，请检查账号密码')
  } finally {
    loginLoading.value = false
  }
}

// ===== Register form =====
const regForm = reactive({
  phone: '', code: '', password: '', confirmPassword: '',
  realName: '', nickname: '', company: '', position: '',
})
const regErrors = reactive<Record<string, string>>({})
const regLoading = ref(false)
const regCountdown = ref(0)
const regSending = ref(false)
const agreeTerms = ref(false)
const showRegPassword = ref(false)
const showRegConfirmPassword = ref(false)
let regTimer: ReturnType<typeof setInterval> | null = null

const strength = computed(() => {
  const pwd = regForm.password
  if (!pwd) return 0
  let s = 0
  if (pwd.length >= 6) s++
  if (/\d/.test(pwd) && /[a-zA-Z]/.test(pwd)) s++
  if (/[^a-zA-Z0-9]/.test(pwd)) s++
  return s
})
const strengthText = computed(() => ['弱', '中', '强'][strength.value - 1] || '')
const strengthClass = computed(() => ['', 'weak', 'medium', 'strong'][strength.value] || '')

function validateRegForm(): boolean {
  Object.keys(regErrors).forEach((k) => delete regErrors[k])
  let ok = true
  if (!/^1[3-9]\d{9}$/.test(regForm.phone)) {
    regErrors.phone = '请输入正确的手机号'
    ok = false
  }
  if (!regForm.code) {
    regErrors.code = '请输入验证码'
    ok = false
  }
  if (!regForm.password || regForm.password.length < 6) {
    regErrors.password = '密码至少6位'
    ok = false
  }
  if (regForm.password !== regForm.confirmPassword) {
    regErrors.confirmPassword = '两次密码不一致'
    ok = false
  }
  if (!regForm.realName) {
    regErrors.realName = '请输入真实姓名'
    ok = false
  }
  if (!agreeTerms.value) {
    regErrors.agree = '请先阅读并同意用户协议和隐私政策'
    ok = false
  }
  return ok
}

async function sendRegCode() {
  if (!/^1[3-9]\d{9}$/.test(regForm.phone)) {
    regErrors.phone = '请输入正确的手机号'
    return
  }
  if (regCountdown.value > 0 || regSending.value) return
  regSending.value = true
  try {
    await sendCode(regForm.phone)
    regCountdown.value = 60
    regTimer = setInterval(() => {
      regCountdown.value--
      if (regCountdown.value <= 0) {
        clearInterval(regTimer!)
        regTimer = null
      }
    }, 1000)
    showToast('验证码已发送')
  } catch (err: any) {
    showToast(err.message || '发送失败')
  } finally {
    regSending.value = false
  }
}

function extractReferrerId(): number | undefined {
  const read = (raw: unknown): number | undefined => {
    if (typeof raw !== 'string') return undefined
    const n = Number(raw)
    return Number.isInteger(n) && n > 0 ? n : undefined
  }
  const direct = read(route.query.referrer)
  if (direct) return direct
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
  const m = redirect.match(/[?&]referrer=(\d+)/)
  return m ? read(m[1]) : undefined
}

async function handleRegister() {
  if (!validateRegForm()) return
  regLoading.value = true
  try {
    const res: any = await register({
      phone: regForm.phone,
      code: regForm.code,
      realName: regForm.realName,
      nickname: regForm.nickname,
      company: regForm.company,
      position: regForm.position,
      referrerId: extractReferrerId(),
    })
    userStore.setToken(res.accessToken, res.refreshToken)
    await refreshUserAfterLogin(res.user)
    showToast('注册成功')
    redirectAfterAuth()
  } catch (err: any) {
    showToast(err.message || '注册失败')
  } finally {
    regLoading.value = false
  }
}

// ===== WeChat login（小程序：uni.login 取 code 换 token） =====
function getWxCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: (res) => resolve(res.code || ''),
      fail: (err) => reject(err),
    })
  })
}

async function handleWechatLogin() {
  try {
    const code = await getWxCode()
    const res: any = await wechatLogin(code)
    userStore.setToken(res.accessToken, res.refreshToken || '')
    await refreshUserAfterLogin(res.user || {})
    showToast('微信登录成功')
    redirectAfterAuth()
  } catch (err: any) {
    showToast(err.message || '微信登录失败')
  }
}

function handleOneClickLogin() {
  showToast('手机一键登录功能开发中，敬请期待')
}

// ===== Modals =====
const showAgreementModal = ref(false)
const showPrivacyModal = ref(false)
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: env(safe-area-inset-top, 0px) 0 env(safe-area-inset-bottom, 0px);
}
.login-bg-shapes { position: absolute; left: 0; right: 0; top: 0; bottom: 0; overflow: hidden; }
.login-bg-shapes .shape {
  position: absolute; border-radius: 50%; opacity: 0.1; background: #fff;
}
.login-bg-shapes .shape.s1 { width: 200px; height: 200px; top: -60px; right: -40px; }
.login-bg-shapes .shape.s2 { width: 140px; height: 140px; bottom: -30px; left: -20px; }
.login-bg-shapes .shape.s3 { width: 80px; height: 80px; top: 40px; left: 80px; }

.login-content {
  position: relative; z-index: 10;
  width: 100%;
  display: flex; flex-direction: column; align-items: center;
  padding: 40px 20px 20px;
}

.login-logo { display: flex; flex-direction: column; align-items: center; margin-bottom: 32px; }
.logo-circle {
  width: 64px; height: 64px; border-radius: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  margin-bottom: 12px;
}
.login-title {
  font-size: 24px; font-weight: 800; color: #fff;
  margin-bottom: 6px; letter-spacing: 2px;
}
.login-subtitle {
  font-size: 12px; color: rgba(255,255,255,0.8);
  letter-spacing: 1px;
}

.tab-switcher {
  display: flex; margin-bottom: 20px;
  background: rgba(255,255,255,0.15); border-radius: 10px; padding: 3px;
}
.tab-item {
  padding: 8px 28px; border-radius: 8px;
  font-size: 15px; font-weight: 600; color: rgba(255,255,255,0.7);
}
.tab-item.active {
  background: #fff; color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.login-card {
  width: 100%;
  background: rgba(255,255,255,0.96);
  border-radius: 24px;
  border: 1px solid rgba(255,255,255,0.5);
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  padding: 24px;
}

.form-section { display: flex; flex-direction: column; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 4px; }
.form-label {
  font-size: 13px; font-weight: 600; color: var(--color-text-primary);
}
.optional { font-weight: 400; color: var(--color-text-tertiary); font-size: 12px; }
.form-input {
  width: 100%; padding: 12px 14px;
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: var(--radius-md); font-size: 14px;
  background: rgba(0,0,0,0.02);
  color: var(--color-text-primary);
}
.form-input-placeholder, .form-input::placeholder { color: var(--color-text-tertiary); }

.password-input-wrapper { position: relative; }
.password-input-wrapper .form-input { padding-right: 40px; }
.eye-btn {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  font-size: 16px;
}

.pwd-strength { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
.strength-bars { display: flex; gap: 3px; }
.strength-bars .bar {
  width: 24px; height: 4px; border-radius: 2px;
  background: #e5e7eb;
}
.strength-bars .bar.filled { background: var(--color-danger); }
.strength-text { font-size: 11px; font-weight: 500; }
.strength-text.weak { color: var(--color-danger); }
.strength-text.medium { color: var(--color-warning); }
.strength-text.strong { color: var(--color-success); }

.code-row { display: flex; gap: 10px; }
.code-input { flex: 1; }
.code-btn {
  flex-shrink: 0; padding: 0 16px; height: 44px; line-height: 44px;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md); background: #fff;
  color: var(--color-primary); font-size: 13px; font-weight: 500;
  white-space: nowrap; margin: 0;
}
.code-btn:active { background: var(--color-primary-50); }
.code-btn[disabled] { opacity: 0.5; }

.field-error { font-size: 11px; color: var(--color-danger); margin-top: 2px; }

.login-actions { display: flex; flex-direction: column; gap: 10px; }
.submit-btn {
  width: 100%; padding: 14px;
  background: var(--color-primary); color: #fff;
  border: none; border-radius: 12px;
  font-size: 16px; font-weight: 600;
}
.submit-btn:active { transform: scale(0.98); background: var(--color-primary-dark); }
.submit-btn.loading { opacity: 0.7; pointer-events: none; }
.forgot-password {
  align-self: flex-end;
  font-size: 12px; color: var(--color-text-secondary);
  padding: 2px 4px;
}

.divider {
  display: flex; align-items: center; justify-content: center;
}
.divider-text {
  color: var(--color-text-tertiary); font-size: 12px;
  padding: 0 12px;
}

.login-methods {
  display: flex; align-items: flex-start; justify-content: center; gap: 36px;
  padding: 2px 0 4px;
}
.method-item {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
}
.method-item:active { transform: scale(0.92); }
.method-avatar {
  width: 52px; height: 52px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.12);
}
.wechat-avatar { background: #07c160; }
.phone-avatar {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
}
.method-glyph { font-size: 26px; line-height: 1; }
.method-svg { width: 22px; height: 22px; }
.method-label { font-size: 12px; color: var(--color-text-secondary); }

.agreement { display: flex; flex-direction: column; gap: 4px; }
.agree-label {
  display: flex; align-items: flex-start; gap: 6px; flex-wrap: wrap;
  font-size: 12px; color: var(--color-text-secondary); line-height: 1.5;
}
.mp-checkbox {
  margin-top: 1px; width: 16px; height: 16px; flex-shrink: 0;
  border: 1.5px solid #d1d5db; border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  background: #fff;
}
.mp-checkbox.checked { background: var(--color-primary); border-color: var(--color-primary); }
.mp-checkbox-mark { color: #fff; font-size: 11px; line-height: 1; }
.link {
  color: var(--color-primary); text-decoration: underline;
}

.modal-mask {
  position: fixed; left: 0; right: 0; top: 0; bottom: 0; z-index: 999;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.modal-content {
  background: #fff; border-radius: 16px;
  width: 100%; max-width: 400px; max-height: 70vh;
  display: flex; flex-direction: column;
  overflow: hidden;
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid #eee;
}
.modal-title { font-size: 16px; font-weight: 700; color: var(--color-text-primary); }
.modal-close { font-size: 20px; color: var(--color-text-tertiary); }
.modal-body {
  padding: 20px; max-height: 50vh; font-size: 13px;
  color: var(--color-text-secondary); line-height: 1.8;
  display: flex; flex-direction: column; gap: 4px;
}
.modal-p { display: block; margin-bottom: 6px; }
.modal-li { display: block; }
</style>
