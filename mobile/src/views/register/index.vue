<template>
  <div class="register-page">
    <!-- Background -->
    <div class="bg-layer">
      <div class="shape s1"></div>
      <div class="shape s2"></div>
      <div class="shape s3"></div>
    </div>

    <!-- Header -->
    <div class="page-header">
      <div class="back-btn" @click="$router.back()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      </div>
      <span class="page-title">会员注册</span>
      <div class="spacer"></div>
    </div>

    <!-- Scrollable Content -->
    <div class="scroll-area">
      <!-- Logo -->
      <div class="reg-logo">
        <div class="logo-circle">群</div>
        <h1>加入聚格软件</h1>
        <p>连接人脉 · 共享商机 · 共同成长</p>
      </div>

      <!-- Registration Card -->
      <div class="reg-card">
        <!-- Step 1: Phone + Code -->
        <div class="step" :class="{ active: step === 1, done: step > 1 }">
          <div class="step-header">
            <span class="step-num" :class="{ done: step > 1 }">1</span>
            <span class="step-title">验证手机号</span>
          </div>
          <div class="step-body">
            <div class="form-group">
              <input v-model="form.phone" class="form-input" type="tel" placeholder="请输入手机号" maxlength="11" inputmode="numeric" @input="form.phone = form.phone.replace(/\D/g, '').slice(0, 11)" />
              <span v-if="errors.phone" class="field-error">{{ errors.phone }}</span>
            </div>
            <div class="code-row">
              <input v-model="form.code" class="form-input code-input" type="text" placeholder="请输入验证码" maxlength="6" inputmode="numeric" />
              <button class="code-btn" :disabled="countdown > 0 || sending" @click="sendCode">
                {{ countdown > 0 ? `${countdown}s` : sending ? '发送中...' : '获取验证码' }}
              </button>
            </div>
            <span v-if="errors.code" class="field-error">{{ errors.code }}</span>
          </div>
        </div>

        <!-- Step 2: Basic Info -->
        <div class="step" :class="{ active: step === 2, done: step > 2 }">
          <div class="step-header">
            <span class="step-num" :class="{ done: step > 2 }">2</span>
            <span class="step-title">完善基本信息</span>
          </div>
          <div class="step-body">
            <div class="form-group">
              <input v-model="form.realName" class="form-input" type="text" placeholder="真实姓名 *" maxlength="20" />
              <span v-if="errors.realName" class="field-error">{{ errors.realName }}</span>
            </div>
            <div class="form-group">
              <input v-model="form.nickname" class="form-input" type="text" placeholder="昵称（选填）" maxlength="30" />
            </div>
            <div class="form-group">
              <input v-model="form.company" class="form-input" type="text" placeholder="公司名称（选填）" maxlength="50" />
            </div>
            <div class="form-group">
              <input v-model="form.position" class="form-input" type="text" placeholder="职位（选填）" maxlength="30" />
            </div>
            <div class="form-group">
              <div class="password-row">
                <input v-model="form.password" class="form-input" :type="showPwd ? 'text' : 'password'" placeholder="设置密码（至少6位）*" />
                <span class="eye-btn" @click="showPwd = !showPwd">{{ showPwd ? '👁️' : '👁️‍🗨️' }}</span>
              </div>
              <div class="strength-bar" v-if="form.password">
                <div class="bars">
                  <span class="bar" :class="{ filled: str >= 1 }"></span>
                  <span class="bar" :class="{ filled: str >= 2 }"></span>
                  <span class="bar" :class="{ filled: str >= 3 }"></span>
                </div>
                <span class="str-text" :class="strClass">{{ strText }}</span>
              </div>
              <span v-if="errors.password" class="field-error">{{ errors.password }}</span>
            </div>
          </div>
        </div>

        <!-- Step 3: Agreement -->
        <div class="step" :class="{ active: step === 3 }">
          <div class="step-header">
            <span class="step-num">3</span>
            <span class="step-title">阅读协议</span>
          </div>
          <div class="step-body">
            <label class="agree-check">
              <input type="checkbox" v-model="agreed" />
              <span>我已阅读并同意</span>
              <a class="link" @click.stop.prevent="showAgreement = true">《用户协议》</a>
              和<a class="link" @click.stop.prevent="showPrivacy = true">《隐私政策》</a>
            </label>
            <span v-if="errors.agree" class="field-error">{{ errors.agree }}</span>
          </div>
        </div>
      </div>

      <!-- Spacer for bottom button -->
      <div class="bottom-spacer"></div>
    </div>

    <!-- Bottom Action -->
    <div class="bottom-bar">
      <button v-if="step < 3" class="next-btn" @click="nextStep">下一步</button>
      <button v-else class="submit-btn" :loading="submitting" @click="handleRegister">完成注册</button>
    </div>

    <!-- Agreement Modal -->
    <div class="modal-mask" v-if="showAgreement" @click="showAgreement = false">
      <div class="modal-box" @click.stop>
        <div class="modal-head">
          <span class="modal-title">用户协议</span>
          <span class="modal-x" @click="showAgreement = false">✕</span>
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
    <div class="modal-mask" v-if="showPrivacy" @click="showPrivacy = false">
      <div class="modal-box" @click.stop>
        <div class="modal-head">
          <span class="modal-title">隐私政策</span>
          <span class="modal-x" @click="showPrivacy = false">✕</span>
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
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { register, sendCode } from '@/api'
import { useUserStore } from '@/store/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
let timer: ReturnType<typeof setInterval> | null = null

onUnmounted(() => { if (timer) clearInterval(timer) })

// ===== Toast =====
function toast(msg: string) {
  const old = document.querySelector('.mob-toast')
  if (old) old.remove()
  const el = document.createElement('div')
  el.className = 'mob-toast'
  el.textContent = msg
  el.style.cssText = 'position:fixed;top:38%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,.8);color:#fff;padding:12px 24px;border-radius:10px;font-size:14px;z-index:9999;white-space:nowrap'
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 2000)
}

// ===== Step management =====
const step = ref(1)
const submitting = ref(false)

function nextStep() {
  if (step.value === 1) {
    if (!/^1[3-9]\d{9}$/.test(form.phone)) { errors.phone = '请输入正确的手机号'; return }
    if (!form.code) { errors.code = '请输入验证码'; return }
    step.value = 2
  } else if (step.value === 2) {
    if (!form.realName.trim()) { errors.realName = '请输入真实姓名'; return }
    if (!form.password || form.password.length < 6) { errors.password = '密码至少6位'; return }
    step.value = 3
  }
}

// ===== Form =====
const form = reactive({ phone: '', code: '', realName: '', nickname: '', company: '', position: '', password: '' })
const errors = reactive<Record<string, string>>({})
const agreed = ref(false)
const showPwd = ref(false)
const showAgreement = ref(false)
const showPrivacy = ref(false)
const countdown = ref(0)
const sending = ref(false)

const str = computed(() => {
  const p = form.password
  if (!p) return 0
  let s = 0
  if (p.length >= 6) s++
  if (/\d/.test(p) && /[a-zA-Z]/.test(p)) s++
  if (/[^a-zA-Z0-9]/.test(p)) s++
  return s
})
const strText = computed(() => ['', '弱', '中', '强'][str.value] || '')
const strClass = computed(() => ['', 'weak', 'medium', 'strong'][str.value] || '')

async function sendCode() {
  if (!/^1[3-9]\d{9}$/.test(form.phone)) { errors.phone = '请输入正确的手机号'; return }
  if (countdown.value > 0 || sending.value) return
  sending.value = true
  try {
    // 真实调用后端发送接口（注册场景）
    await sendCode(form.phone, 'register')
    countdown.value = 60
    timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) { clearInterval(timer!); timer = null }
    }, 1000)
    toast('验证码已发送')
  } catch (err: any) {
    toast(err?.message || '发送失败，请重试')
  } finally {
    sending.value = false
  }
}

async function handleRegister() {
  Object.keys(errors).forEach(k => delete errors[k])
  let ok = true
  if (!agreed.value) { errors.agree = '请先阅读并同意协议'; ok = false }
  if (!ok) return

  submitting.value = true
  try {
    const res: any = await register({
      phone: form.phone,
      code: form.code,
      realName: form.realName,
      nickname: form.nickname,
      company: form.company,
      position: form.position,
    })
    // 通过 user store 统一管理凭证持久化
    userStore.setToken(res.accessToken, res.refreshToken)
    userStore.setUserInfo(res.user)
    toast('注册成功')
    // 注册成功后回跳到 redirect 或主界面
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
    setTimeout(() => router.replace(redirect && redirect.startsWith('/') ? redirect : '/'), 800)
  } catch (err: any) {
    toast(err.message || '注册失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
@import '@/styles/global.css';

/* ===== Page Layout ===== */
.register-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Background shapes */
.bg-layer { position: absolute; inset: 0; overflow: hidden; }
.bg-layer .shape {
  position: absolute; border-radius: 50%; opacity: 0.1; background: #fff;
}
.bg-layer .shape.s1 { width: 200px; height: 200px; top: -60px; right: -40px; }
.bg-layer .shape.s2 { width: 140px; height: 140px; bottom: -30px; left: -20px; }
.bg-layer .shape.s3 { width: 80px; height: 80px; top: 40px; left: 80px; }

/* ===== Header ===== */
.page-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; flex-shrink: 0;
}
.back-btn {
  width: 36px; height: 36px; border-radius: 50%;
  background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background 0.2s;
}
.back-btn:active { background: rgba(255,255,255,0.35); }
.back-btn svg { width: 20px; height: 20px; color: #fff; }
.page-title { font-size: 18px; font-weight: 700; color: #fff; letter-spacing: 1px; }
.spacer { width: 36px; }

/* ===== Scroll Area ===== */
.scroll-area {
  flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
  padding: 0 0 80px;
}
.scroll-area::-webkit-scrollbar { display: none; }

/* ===== Logo ===== */
.reg-logo {
  text-align: center; padding: 24px 20px 16px;
}
.logo-circle {
  width: 56px; height: 56px; border-radius: 50%;
  background: rgba(255,255,255,0.2);
  backdrop-filter: blur(12px);
  border: 2px solid rgba(255,255,255,0.3);
  display: flex; align-items: center; justify-content: center;
  font-size: 26px; color: #fff; font-weight: 800;
  margin: 0 auto 10px;
}
.reg-logo h1 {
  font-size: 22px; font-weight: 800; color: #fff;
  margin-bottom: 4px; letter-spacing: 1px;
}
.reg-logo p {
  font-size: 12px; color: rgba(255,255,255,0.8);
  letter-spacing: 0.5px;
}

/* ===== Registration Card ===== */
.reg-card {
  margin: 0 16px;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.5);
  box-shadow: 0 16px 48px rgba(0,0,0,0.12);
  padding: 20px 18px;
}

/* Steps */
.step { display: none; }
.step.active { display: block; }
.step.done { opacity: 0.5; pointer-events: none; }

.step-header {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 18px; padding-bottom: 12px;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}
.step-num {
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--color-primary); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; flex-shrink: 0;
}
.step-num.done { background: var(--color-success); }
.step-title { font-size: 16px; font-weight: 700; color: var(--color-text-primary); }

.step-body { display: flex; flex-direction: column; gap: 14px; }

/* Form Groups */
.form-group { display: flex; flex-direction: column; gap: 4px; }

.form-input {
  width: 100%; padding: 13px 14px;
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 12px; font-size: 15px;
  outline: none; transition: border-color 0.2s;
  background: rgba(0,0,0,0.02);
  color: var(--color-text-primary);
  -webkit-appearance: none;
}
.form-input:focus {
  border-color: var(--color-primary);
  background: #fff;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
}
.form-input::placeholder { color: var(--color-text-tertiary); }

/* Password Row */
.password-row { position: relative; }
.password-row .form-input { padding-right: 42px; }
.eye-btn {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  font-size: 16px; cursor: pointer; user-select: none;
}

/* Strength Bar */
.strength-bar { display: flex; align-items: center; gap: 8px; margin-top: 2px; }
.strength-bar .bars { display: flex; gap: 3px; }
.strength-bar .bars .bar {
  width: 28px; height: 4px; border-radius: 2px;
  background: #e5e7eb; transition: background 0.2s;
}
.strength-bar .bars .bar.filled { background: var(--color-danger); }
.strength-bar .bars .bar:nth-child(2).filled { background: var(--color-warning); }
.strength-bar .bars .bar:nth-child(3).filled { background: var(--color-success); }
.str-text { font-size: 11px; font-weight: 500; }
.str-text.weak { color: var(--color-danger); }
.str-text.medium { color: var(--color-warning); }
.str-text.strong { color: var(--color-success); }

/* Code Row */
.code-row { display: flex; gap: 10px; }
.code-input { flex: 1; }
.code-btn {
  flex-shrink: 0; padding: 0 16px; height: 46px;
  border: 1px solid var(--color-primary);
  border-radius: 12px; background: #fff;
  color: var(--color-primary); font-size: 14px; font-weight: 500;
  cursor: pointer; transition: all 0.2s; white-space: nowrap;
}
.code-btn:active { background: var(--color-primary-50); }
.code-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* Field Error */
.field-error { font-size: 11px; color: var(--color-danger); margin-top: 2px; }

/* Agreement Checkbox */
.agree-check {
  display: flex; align-items: flex-start; gap: 8px;
  font-size: 13px; color: var(--color-text-secondary); line-height: 1.6;
}
.agree-check input[type="checkbox"] {
  margin-top: 3px; width: 18px; height: 18px; accent-color: var(--color-primary);
  flex-shrink: 0; cursor: pointer;
}
.link {
  color: var(--color-primary); text-decoration: underline; cursor: pointer;
  font-weight: 500;
}

/* ===== Bottom Bar ===== */
.bottom-spacer { height: 20px; }
.bottom-bar {
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 430px;
  padding: 12px 16px env(safe-area-inset-bottom, 12px);
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-top: 0.5px solid rgba(60,60,67,0.1);
  display: flex; gap: 10px; z-index: 100;
}
.next-btn, .submit-btn {
  flex: 1; padding: 14px; border: none; border-radius: 12px;
  font-size: 16px; font-weight: 600; cursor: pointer;
  transition: all 0.2s ease; color: #fff;
}
.next-btn { background: var(--color-primary); }
.next-btn:active { transform: scale(0.98); background: var(--color-primary-dark); }
.submit-btn { background: var(--color-primary); }
.submit-btn:active { transform: scale(0.98); background: var(--color-primary-dark); }
.submit-btn[loading] { opacity: 0.7; pointer-events: none; }

/* ===== Modal ===== */
.modal-mask {
  position: fixed; inset: 0; z-index: 999;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.modal-box {
  background: #fff; border-radius: 16px;
  width: 100%; max-width: 380px; max-height: 65vh;
  display: flex; flex-direction: column; overflow: hidden;
}
.modal-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; border-bottom: 1px solid #eee;
}
.modal-title { font-size: 16px; font-weight: 700; color: var(--color-text-primary); }
.modal-x { font-size: 20px; color: var(--color-text-tertiary); cursor: pointer; }
.modal-body {
  padding: 18px; overflow-y: auto; font-size: 13px;
  color: var(--color-text-secondary); line-height: 1.8;
}
.modal-body ol { padding-left: 20px; }
.modal-body li { margin-bottom: 6px; }
</style>
