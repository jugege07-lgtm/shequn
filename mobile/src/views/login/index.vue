<template>
  <div class="login-page">
    <div class="login-bg-shapes">
      <div class="shape s1"></div>
      <div class="shape s2"></div>
      <div class="shape s3"></div>
    </div>
    <div class="login-content">
      <!-- Logo -->
      <div class="login-logo">
        <img class="logo-circle" :src="logoUrl" alt="聚格软件" />
        <h1>聚格软件</h1>
        <p class="login-subtitle">连接人脉 · 共享商机 · 共同成长</p>
      </div>

      <!-- Tab Switcher -->
      <div class="tab-switcher">
        <div class="tab-item" :class="{ active: mode === 'login' }" @click="mode = 'login'">登录</div>
        <div class="tab-item" :class="{ active: mode === 'register' }" @click="mode = 'register'">注册</div>
      </div>

      <div class="login-card">
        <!-- ========== 登录表单 ========== -->
        <div v-if="mode === 'login'" class="form-section">
          <div class="form-group">
            <label class="form-label">手机号</label>
            <input v-model="loginForm.phone" class="form-input" type="tel" placeholder="请输入手机号" maxlength="11" @input="loginForm.phone = loginForm.phone.replace(/\D/g, '').slice(0, 11)" />
            <span v-if="loginErrors.phone" class="field-error">{{ loginErrors.phone }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">密码</label>
            <div class="password-input-wrapper">
              <input v-model="loginForm.password" class="form-input" :type="showPassword ? 'text' : 'password'" placeholder="请输入密码" @keyup.enter="handleLogin" />
              <span class="eye-btn" @click="showPassword = !showPassword">{{ showPassword ? '👁️' : '👁️‍🗨️' }}</span>
            </div>
            <span v-if="loginErrors.password" class="field-error">{{ loginErrors.password }}</span>
          </div>
          <div class="login-actions">
            <button class="submit-btn" :class="{ loading: loginLoading }" @click="handleLogin">登 录</button>
            <span class="forgot-password" @click="$router.push('/forgot-password')">忘记密码?</span>
          </div>
          <div class="divider"><span>其他登录方式</span></div>
          <div class="login-methods">
            <div class="method-item" @click="handleWechatLogin">
              <div class="method-avatar wechat-avatar">
                <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05a6.329 6.329 0 0 1-.235-1.665c0-3.627 3.272-6.566 7.31-6.566.524 0 1.03.063 1.523.173C16.842 4.599 13.074 2.188 8.691 2.188zm-2.6 4.177c.585 0 1.061.476 1.061 1.061s-.476 1.061-1.061 1.061S5.03 7.907 5.03 7.326s.476-1.061 1.061-1.061zm5.213 0c.585 0 1.061.476 1.061 1.061s-.476 1.061-1.061 1.061-1.061-.476-1.061-1.061.476-1.061 1.061-1.061zm4.58 3.848c-3.487 0-6.315 2.466-6.315 5.507 0 3.04 2.828 5.506 6.315 5.506a7.68 7.68 0 0 0 2.226-.33.724.724 0 0 1 .598.082l1.585.927a.27.27 0 0 0 .138.045c.133 0 .24-.11.24-.245 0-.06-.024-.118-.04-.176l-.325-1.233a.493.493 0 0 1 .176-.553C21.958 19.175 23 17.36 23 15.326c0-3.041-2.828-5.507-6.316-5.507h-.1z"/></svg>
              </div>
              <span class="method-label">微信登录</span>
            </div>
            <div class="method-item" @click="handleOneClickLogin">
              <div class="method-avatar phone-avatar">
                <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.24.2 2.45.57 3.57a1 1 0 0 1-.24 1.02l-2.21 2.2z"/></svg>
              </div>
              <span class="method-label">手机一键登录</span>
            </div>
          </div>
        </div>

        <!-- ========== 注册表单 ========== -->
        <div v-else class="form-section">
          <div class="form-group">
            <label class="form-label">手机号</label>
            <input v-model="regForm.phone" class="form-input" type="tel" placeholder="请输入手机号" maxlength="11" @input="regForm.phone = regForm.phone.replace(/\D/g, '').slice(0, 11)" />
            <span v-if="regErrors.phone" class="field-error">{{ regErrors.phone }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">验证码</label>
            <div class="code-row">
              <input v-model="regForm.code" class="form-input code-input" type="text" placeholder="请输入验证码" maxlength="6" />
              <button class="code-btn" :disabled="regCountdown > 0 || regSending" @click="sendRegCode">
                {{ regCountdown > 0 ? `${regCountdown}s` : regSending ? '发送中...' : '获取验证码' }}
              </button>
            </div>
            <span v-if="regErrors.code" class="field-error">{{ regErrors.code }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">密码</label>
            <div class="password-input-wrapper">
              <input v-model="regForm.password" class="form-input" :type="showRegPassword ? 'text' : 'password'" placeholder="请设置密码（至少6位）" />
              <span class="eye-btn" @click="showRegPassword = !showRegPassword">{{ showRegPassword ? '👁️' : '👁️‍🗨️' }}</span>
            </div>
            <div class="pwd-strength" v-if="regForm.password">
              <div class="strength-bars">
                <span class="bar" :class="{ filled: strength >= 1 }"></span>
                <span class="bar" :class="{ filled: strength >= 2 }"></span>
                <span class="bar" :class="{ filled: strength >= 3 }"></span>
              </div>
              <span class="strength-text" :class="strengthClass">{{ strengthText }}</span>
            </div>
            <span v-if="regErrors.password" class="field-error">{{ regErrors.password }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">确认密码</label>
            <div class="password-input-wrapper">
              <input v-model="regForm.confirmPassword" class="form-input" :type="showRegConfirmPassword ? 'text' : 'password'" placeholder="请再次输入密码" />
              <span class="eye-btn" @click="showRegConfirmPassword = !showRegConfirmPassword">{{ showRegConfirmPassword ? '👁️' : '👁️‍🗨️' }}</span>
            </div>
            <span v-if="regErrors.confirmPassword" class="field-error">{{ regErrors.confirmPassword }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">真实姓名</label>
            <input v-model="regForm.realName" class="form-input" placeholder="请输入真实姓名" />
            <span v-if="regErrors.realName" class="field-error">{{ regErrors.realName }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">昵称 <span class="optional">(选填)</span></label>
            <input v-model="regForm.nickname" class="form-input" placeholder="请输入昵称" />
          </div>
          <div class="form-group">
            <label class="form-label">公司名称 <span class="optional">(选填)</span></label>
            <input v-model="regForm.company" class="form-input" placeholder="请输入公司名称" />
          </div>
          <div class="form-group">
            <label class="form-label">职位 <span class="optional">(选填)</span></label>
            <input v-model="regForm.position" class="form-input" placeholder="请输入职位" />
          </div>
          <div class="agreement">
            <label class="agree-label">
              <input type="checkbox" v-model="agreeTerms" />
              <span>我已阅读并同意</span>
              <a class="link" @click.stop.prevent="showAgreementModal = true">《用户协议》</a>
              和<a class="link" @click.stop.prevent="showPrivacyModal = true">《隐私政策》</a>
            </label>
            <span v-if="regErrors.agree" class="field-error">{{ regErrors.agree }}</span>
          </div>
          <button class="submit-btn" :class="{ loading: regLoading }" @click="handleRegister">注 册</button>
        </div>
      </div>
    </div>

    <!-- Agreement Modal -->
    <div class="modal-mask" v-if="showAgreementModal" @click="showAgreementModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <span class="modal-title">用户协议</span>
          <span class="modal-close" @click="showAgreementModal = false">✕</span>
        </div>
        <div class="modal-body">
          <p>欢迎使用聚格软件平台。使用本平台即表示您同意以下条款：</p>
          <ol>
            <li>您应提供真实、准确的个人信息。</li>
            <li>您不得利用本平台从事违法、违规活动。</li>
            <li>您发布的商品信息应真实有效，不得虚假宣传。</li>
            <li>我们有权对违反协议的用户采取警告、封禁等措施。</li>
          </ol>
        </div>
      </div>
    </div>

    <!-- Privacy Modal -->
    <div class="modal-mask" v-if="showPrivacyModal" @click="showPrivacyModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <span class="modal-title">隐私政策</span>
          <span class="modal-close" @click="showPrivacyModal = false">✕</span>
        </div>
        <div class="modal-body">
          <p>我们重视您的隐私保护。以下是我们的隐私政策：</p>
          <ol>
            <li>我们收集的信息包括手机号、昵称、头像等个人资料。</li>
            <li>我们使用您的信息进行身份验证、提供服务及改进用户体验。</li>
            <li>未经您的同意，我们不会向第三方出售您的个人信息。</li>
            <li>您可以随时在设置中修改或删除您的个人信息。</li>
          </ol>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { wechatLogin, register, login, sendCode } from '@/api'
import { useUserStore } from '@/store/user'

const router = useRouter()
const route = useRoute()
const logoUrl = `${import.meta.env.BASE_URL}logo.jpg`
const userStore = useUserStore()

// 登录/注册成功后统一跳转：优先回跳到 redirect 查询参数指向的页面，否则进入主界面
function redirectAfterAuth() {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
  router.replace(redirect && redirect.startsWith('/') ? redirect : '/')
}

// ===== Mode: login / register =====
const mode = ref<'login' | 'register'>('login')

// ===== Toast utility =====
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

// ===== Login form =====
const loginForm = reactive({ phone: '', password: '' })
const loginErrors = reactive<Record<string, string>>({})
const loginLoading = ref(false)
const showPassword = ref(false)

function validateLoginForm(): boolean {
  Object.keys(loginErrors).forEach(k => delete loginErrors[k])
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
    // 通过 user store 统一管理凭证持久化（token + refreshToken + userInfo + loginTime）
    userStore.setToken(res.accessToken, res.refreshToken)
    userStore.setUserInfo(res.user)
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
  realName: '', nickname: '', company: '', position: ''
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
  Object.keys(regErrors).forEach(k => delete regErrors[k])
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
    // Demo: 发送验证码（后端 mock 接受 1234/123456）
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

// 提取推荐人 ID：优先取 route.query.referrer，其次从 redirect（如 /activity/detail/3?referrer=5）中解析
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
    // 通过 user store 统一管理凭证持久化
    userStore.setToken(res.accessToken, res.refreshToken)
    userStore.setUserInfo(res.user)
    showToast('注册成功')
    redirectAfterAuth()
  } catch (err: any) {
    showToast(err.message || '注册失败')
  } finally {
    regLoading.value = false
  }
}

// ===== WeChat login =====
async function handleWechatLogin() {
  try {
    const res: any = await wechatLogin('')
    // 通过 user store 统一管理凭证持久化
    userStore.setToken(res.accessToken, res.refreshToken || '')
    userStore.setUserInfo(res.user || {})
    showToast('微信登录成功')
    redirectAfterAuth()
  } catch (err: any) {
    showToast(err.message || '微信登录失败')
  }
}

// ===== 手机一键登录（预留，待后续配置启用） =====
function handleOneClickLogin() {
  showToast('手机一键登录功能开发中，敬请期待')
}

// ===== Modals =====
const showAgreementModal = ref(false)
const showPrivacyModal = ref(false)

</script>

<style scoped>
@import '@/styles/global.css';

.login-page {
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
.login-bg-shapes { position: absolute; inset: 0; overflow: hidden; }
.login-bg-shapes .shape {
  position: absolute; border-radius: 50%; opacity: 0.1; background: #fff;
}
.login-bg-shapes .shape.s1 { width: 200px; height: 200px; top: -60px; right: -40px; }
.login-bg-shapes .shape.s2 { width: 140px; height: 140px; bottom: -30px; left: -20px; }
.login-bg-shapes .shape.s3 { width: 80px; height: 80px; top: 40px; left: 80px; }

.login-content {
  position: relative; z-index: 10;
  width: 100%; max-width: 430px;
  display: flex; flex-direction: column; align-items: center;
  padding: 40px 20px 20px;
}

/* Logo */
.login-logo { text-align: center; margin-bottom: 32px; }
.logo-circle {
  width: 64px; height: 64px; border-radius: 16px;
  object-fit: cover;
  border: 2px solid rgba(255,255,255,0.3);
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  margin: 0 auto 12px;
}
.login-logo h1 {
  font-size: 24px; font-weight: 800; color: #fff;
  margin-bottom: 6px; letter-spacing: 2px;
}
.login-subtitle {
  font-size: 12px; color: rgba(255,255,255,0.8);
  letter-spacing: 1px;
}

/* Tab switcher */
.tab-switcher {
  display: flex; gap: 0; margin-bottom: 20px;
  background: rgba(255,255,255,0.15); border-radius: 10px; padding: 3px;
}
.tab-item {
  padding: 8px 28px; border-radius: 8px;
  font-size: 15px; font-weight: 600; color: rgba(255,255,255,0.7);
  cursor: pointer; transition: all 0.2s ease;
}
.tab-item.active {
  background: #fff; color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* Card */
.login-card {
  width: 100%;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255,255,255,0.5);
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  padding: 24px;
}

.form-section { display: flex; flex-direction: column; gap: 16px; }

/* Form groups */
.form-group { display: flex; flex-direction: column; gap: 4px; }
.form-label {
  font-size: 13px; font-weight: 600; color: var(--color-text-primary);
}
.optional { font-weight: 400; color: var(--color-text-tertiary); font-size: 12px; }
.form-input {
  width: 100%; padding: 12px 14px;
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: var(--radius-md); font-size: 14px;
  outline: none; transition: border-color 0.2s;
  background: rgba(0,0,0,0.02);
  color: var(--color-text-primary);
}
.form-input:focus {
  border-color: var(--color-primary);
  background: #fff;
}
.form-input::placeholder { color: var(--color-text-tertiary); }

/* Password wrapper */
.password-input-wrapper { position: relative; }
.password-input-wrapper .form-input { padding-right: 40px; }
.eye-btn {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  font-size: 16px; cursor: pointer; user-select: none;
}

/* Strength indicator */
.pwd-strength { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
.strength-bars { display: flex; gap: 3px; }
.strength-bars .bar {
  width: 24px; height: 4px; border-radius: 2px;
  background: #e5e7eb; transition: background 0.2s;
}
.strength-bars .bar.filled { background: var(--color-danger); }
.strength-bars .bar:nth-child(2).filled { background: var(--color-warning); }
.strength-bars .bar:nth-child(3).filled { background: var(--color-success); }
.strength-text { font-size: 11px; font-weight: 500; }
.strength-text.weak { color: var(--color-danger); }
.strength-text.medium { color: var(--color-warning); }
.strength-text.strong { color: var(--color-success); }

/* Code row */
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

/* Field error */
.field-error { font-size: 11px; color: var(--color-danger); margin-top: 2px; }

/* Submit button & actions */
.login-actions { display: flex; flex-direction: column; gap: 10px; }
.submit-btn {
  width: 100%; padding: 14px;
  background: var(--color-primary); color: #fff;
  border: none; border-radius: 12px;
  font-size: 16px; font-weight: 600;
  cursor: pointer; transition: all 0.2s ease;
}
.submit-btn:active { transform: scale(0.98); background: var(--color-primary-dark); }
.submit-btn.loading { opacity: 0.7; pointer-events: none; }
.forgot-password {
  align-self: flex-end;
  font-size: 12px; color: var(--color-text-secondary);
  cursor: pointer; padding: 2px 4px;
  transition: color 0.2s;
}
.forgot-password:active { color: var(--color-primary); }

/* Divider */
.divider {
  display: flex; align-items: center; justify-content: center; gap: 12px;
  color: var(--color-text-tertiary); font-size: 12px;
}
.divider::before, .divider::after {
  content: ''; width: 40px; height: 1px; background: rgba(0,0,0,0.08);
}

/* Login methods (avatar style) */
.login-methods {
  display: flex; align-items: flex-start; justify-content: center; gap: 36px;
  padding: 2px 0 4px;
}
.method-item {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  cursor: pointer; transition: transform 0.2s ease;
  -webkit-tap-highlight-color: transparent;
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
.method-label { font-size: 12px; color: var(--color-text-secondary); }

/* Agreement */
.agreement { display: flex; flex-direction: column; gap: 4px; }
.agree-label {
  display: flex; align-items: flex-start; gap: 6px;
  font-size: 12px; color: var(--color-text-secondary); line-height: 1.5;
}
.agree-label input[type="checkbox"] {
  margin-top: 2px; width: 16px; height: 16px; accent-color: var(--color-primary);
  flex-shrink: 0;
}
.link {
  color: var(--color-primary); text-decoration: underline; cursor: pointer;
}

/* Modal */
.modal-mask {
  position: fixed; inset: 0; z-index: 999;
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
.modal-close { font-size: 20px; color: var(--color-text-tertiary); cursor: pointer; }
.modal-body {
  padding: 20px; overflow-y: auto; font-size: 13px;
  color: var(--color-text-secondary); line-height: 1.8;
}
.modal-body ol { padding-left: 20px; }
.modal-body li { margin-bottom: 6px; }
</style>
