<template>
  <view :style="sbStyle" class="register-page">
    <!-- Background -->
    <view class="bg-layer">
      <view class="shape s1"></view>
      <view class="shape s2"></view>
      <view class="shape s3"></view>
    </view>

    <!-- Header -->
    <view class="page-header">
      <view class="back-btn" @click="$router.back()">
        <image :src="iconBack" mode="aspectFit" />
      </view>
      <text class="page-title">会员注册</text>
      <view class="spacer"></view>
    </view>

    <!-- Scrollable Content -->
    <view class="scroll-area">
      <!-- Logo -->
      <view class="reg-logo">
        <image class="logo-circle" :src="logoUrl" mode="aspectFill" />
        <text class="reg-title">加入聚格软件</text>
        <text class="reg-subtitle">连接人脉 · 共享商机 · 共同成长</text>
      </view>

      <!-- 推荐人提示：由名片二维码扫码进入注册 -->
      <view class="referral-banner" v-if="fromReferral">
        <image :src="iconReferralUser" mode="aspectFit" />
        <text>好友推荐注册 · 完成注册可获新人积分奖励</text>
      </view>

      <!-- Registration Card -->
      <view class="reg-card">
        <!-- Step 1: Phone + Code -->
        <view class="step" :class="{ active: step === 1, done: step > 1 }">
          <view class="step-header">
            <text class="step-num" :class="{ done: step > 1 }">1</text>
            <text class="step-title">验证手机号</text>
          </view>
          <view class="step-body">
            <view class="form-group">
              <input v-model="form.phone" class="form-input" type="number" placeholder="请输入手机号" :maxlength="11" @input="onPhoneInput" />
              <text v-if="errors.phone" class="field-error">{{ errors.phone }}</text>
            </view>
            <view class="code-row">
              <input v-model="form.code" class="form-input code-input" type="number" placeholder="请输入验证码" :maxlength="6" />
              <button class="code-btn" :disabled="countdown > 0 || sending" @click="sendCodeHandler">
                {{ countdown > 0 ? `${countdown}s` : sending ? '发送中...' : '获取验证码' }}
              </button>
            </view>
            <text v-if="errors.code" class="field-error">{{ errors.code }}</text>
          </view>
        </view>

        <!-- Step 2: Basic Info -->
        <view class="step" :class="{ active: step === 2, done: step > 2 }">
          <view class="step-header">
            <text class="step-num" :class="{ done: step > 2 }">2</text>
            <text class="step-title">完善基本信息</text>
          </view>
          <view class="step-body">
            <view class="form-group">
              <input v-model="form.realName" class="form-input" type="text" placeholder="真实姓名 *" :maxlength="20" />
              <text v-if="errors.realName" class="field-error">{{ errors.realName }}</text>
            </view>
            <view class="form-group">
              <input v-model="form.nickname" class="form-input" type="text" placeholder="昵称（选填）" :maxlength="30" />
            </view>
            <view class="form-group">
              <input v-model="form.company" class="form-input" type="text" placeholder="公司名称（选填）" :maxlength="50" />
            </view>
            <view class="form-group">
              <input v-model="form.position" class="form-input" type="text" placeholder="职位（选填）" :maxlength="30" />
            </view>
            <view class="form-group">
              <view class="password-row">
                <input v-model="form.password" class="form-input" :password="!showPwd" placeholder="设置密码（至少6位）*" />
                <text class="eye-btn" @click="showPwd = !showPwd">{{ showPwd ? '👁️' : '👁️‍🗨️' }}</text>
              </view>
              <view class="strength-bar" v-if="form.password">
                <view class="bars">
                  <view class="bar" :class="{ filled: str >= 1 }"></view>
                  <view class="bar" :class="{ filled: str >= 2 }"></view>
                  <view class="bar" :class="{ filled: str >= 3 }"></view>
                </view>
                <text class="str-text" :class="strClass">{{ strText }}</text>
              </view>
              <text v-if="errors.password" class="field-error">{{ errors.password }}</text>
            </view>
          </view>
        </view>

        <!-- Step 3: Agreement -->
        <view class="step" :class="{ active: step === 3 }">
          <view class="step-header">
            <text class="step-num">3</text>
            <text class="step-title">阅读协议</text>
          </view>
          <view class="step-body">
            <view class="agree-check" @click="agreed = !agreed">
              <view class="mp-checkbox" :class="{ checked: agreed }">
                <text v-if="agreed" class="mp-checkbox-mark">✓</text>
              </view>
              <text class="agree-text">我已阅读并同意</text>
              <text class="link" @click.stop="showAgreement = true">《用户协议》</text>
              <text class="agree-text">和</text>
              <text class="link" @click.stop="showPrivacy = true">《隐私政策》</text>
            </view>
            <text v-if="errors.agree" class="field-error">{{ errors.agree }}</text>
          </view>
        </view>
      </view>

      <!-- Spacer for bottom button -->
      <view class="bottom-spacer"></view>
    </view>

    <!-- Bottom Action -->
    <view class="bottom-bar">
      <button v-if="step < 3" class="next-btn" @click="nextStep">下一步</button>
      <button v-else class="submit-btn" :class="{ loading: submitting }" @click="handleRegister">完成注册</button>
    </view>

    <!-- Agreement Modal -->
    <view class="modal-mask" v-if="showAgreement" @click="showAgreement = false">
      <view class="modal-box" @click.stop>
        <view class="modal-head">
          <text class="modal-title">用户协议</text>
          <text class="modal-x" @click="showAgreement = false">✕</text>
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
    <view class="modal-mask" v-if="showPrivacy" @click="showPrivacy = false">
      <view class="modal-box" @click.stop>
        <view class="modal-head">
          <text class="modal-title">隐私政策</text>
          <text class="modal-x" @click="showPrivacy = false">✕</text>
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
import { sbStyle } from '@/utils/sb'
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { register, sendCode } from '@/api'
import { useUserStore } from '@/store/user'
import { refreshUserAfterLogin } from '@/utils/auth'
import { svgUri } from '@/utils/svg'

const router = useRouter()
const logoUrl = '/static/logo.jpg'
const route = useRoute()
const userStore = useUserStore()
let timer: ReturnType<typeof setInterval> | null = null

const iconBack = svgUri('<path d="M19 12H5M12 19l-7-7 7-7"/>', { color: '#ffffff', strokeWidth: '2.5' })
const iconReferralUser = svgUri('<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>', { color: '#ffffff' })

onUnmounted(() => { if (timer) clearInterval(timer) })

// ===== Toast =====
function toast(msg: string) {
  uni.showToast({ title: msg, icon: 'none' })
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

// 手机号输入过滤：仅数字，最长 11 位
function onPhoneInput(e: any) {
  const v = String(e?.detail?.value ?? '').replace(/\D/g, '').slice(0, 11)
  form.phone = v
  return v
}

// 推荐人用户 ID：由名片二维码跳转时携带（?referrer=xxx）
const referrerId = ref<number | null>(null)
const fromReferral = computed(() => !!referrerId.value)

onMounted(() => {
  const raw = typeof route.query.referrer === 'string' ? route.query.referrer : ''
  const n = raw ? Number(raw) : NaN
  if (!Number.isNaN(n) && n > 0) {
    referrerId.value = n
  }
})

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

async function sendCodeHandler() {
  if (!/^1[3-9]\d{9}$/.test(form.phone)) { errors.phone = '请输入正确的手机号'; return }
  if (countdown.value > 0 || sending.value) return
  sending.value = true
  try {
    await sendCode(form.phone)
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
      referrerId: referrerId.value || undefined,
    })
    // 通过 user store 统一管理凭证持久化
    userStore.setToken(res.accessToken, res.refreshToken)
    // 刷新完整用户信息（含 vipLevel）
    await refreshUserAfterLogin(res.user)
    toast('注册成功')
    // 注册成功后回跳到 redirect 或主界面
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
    setTimeout(() => router.replace(redirect && redirect.startsWith('/') ? redirect : '/'), 800)
  } catch (err: any) {
    // 敏感词命中已由 request 层弹提示框，跳过重复 toast
    if (err?.moderation) return
    toast(err.message || '注册失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
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
.bg-layer { position: absolute; left: 0; right: 0; top: 0; bottom: 0; overflow: hidden; }
.bg-layer .shape {
  position: absolute; border-radius: 50%; opacity: 0.1; background: #fff;
}
.bg-layer .shape.s1 { width: 200px; height: 200px; top: -60px; right: -40px; }
.bg-layer .shape.s2 { width: 140px; height: 140px; bottom: -30px; left: -20px; }
.bg-layer .shape.s3 { width: 80px; height: 80px; top: 40px; left: 80px; }

/* ===== Header ===== */
.page-header {
  display: flex; align-items: center; justify-content: space-between;
  /* 状态栏避让由页面根元素 sbStyle 统一下推 */
  padding: 12px 16px 12px; flex-shrink: 0;
}
.back-btn {
  width: 36px; height: 36px; border-radius: 50%;
  background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center;
}
.back-btn:active { background: rgba(255,255,255,0.35); }
.back-btn image { width: 20px; height: 20px; }
.page-title { font-size: 18px; font-weight: 700; color: #fff; letter-spacing: 1px; }
.spacer { width: 36px; }

/* ===== Scroll Area ===== */
.scroll-area {
  flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
  padding: 0 0 80px;
}

/* ===== Logo ===== */
.reg-logo {
  text-align: center; padding: 24px 20px 16px;
}
.logo-circle {
  width: 56px; height: 56px; border-radius: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  margin: 0 auto 10px;
  display: block;
}
.reg-title {
  display: block;
  font-size: 22px; font-weight: 800; color: #fff;
  margin-bottom: 4px; letter-spacing: 1px;
}
.reg-subtitle {
  display: block;
  font-size: 12px; color: rgba(255,255,255,0.8);
  letter-spacing: 0.5px;
}

/* ===== Referral Banner ===== */
.referral-banner {
  margin: 0 24px 14px;
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px; border-radius: 12px;
  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(255,255,255,0.3);
  color: #fff; font-size: 13px; font-weight: 500;
}
.referral-banner image { width: 18px; height: 18px; flex-shrink: 0; }

/* ===== Registration Card ===== */
.reg-card {
  margin: 0 16px;
  background: rgba(255,255,255,0.95);
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
  /* 小程序原生 input：固定高度 + line-height 垂直居中（垂直 padding 会裁半 placeholder） */
  width: 100%; height: 47px; line-height: 45px; padding: 0 14px; box-sizing: border-box;
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 12px; font-size: 15px;
  background: rgba(0,0,0,0.02);
  color: var(--color-text-primary);
  -webkit-appearance: none;
  box-sizing: border-box;
}
.form-input::placeholder { color: var(--color-text-tertiary); }

/* Password Row */
.password-row { position: relative; }
.password-row .form-input { padding-right: 42px; }
.eye-btn {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  font-size: 16px;
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
  white-space: nowrap;
}
.code-btn:active { background: var(--color-primary-50); }
.code-btn:disabled { opacity: 0.5; }

/* Field Error */
.field-error { font-size: 11px; color: var(--color-danger); margin-top: 2px; }

/* Agreement Checkbox（小程序无原生 checkbox 样式，用自定义方块） */
.agree-check {
  display: flex; align-items: flex-start; gap: 8px;
  font-size: 13px; color: var(--color-text-secondary); line-height: 1.6;
}
.mp-checkbox {
  margin-top: 3px; width: 18px; height: 18px; flex-shrink: 0;
  border: 1.5px solid #d1d5db; border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  background: #fff;
}
.mp-checkbox.checked { background: var(--color-primary); border-color: var(--color-primary); }
.mp-checkbox-mark { color: #fff; font-size: 12px; line-height: 1; }
.agree-text { font-size: 13px; color: var(--color-text-secondary); line-height: 1.6; }
.link {
  color: var(--color-primary); text-decoration: underline;
  font-weight: 500;
}

/* ===== Bottom Bar ===== */
.bottom-spacer { height: 20px; }
.bottom-bar {
  position: fixed; bottom: 0; left: 0; right: 0;
  width: 100%;
  padding: 12px 16px env(safe-area-inset-bottom, 12px);
  background: rgba(255,255,255,0.92);
  border-top: 0.5px solid rgba(60,60,67,0.1);
  display: flex; gap: 10px; z-index: 100;
}
.next-btn, .submit-btn {
  flex: 1; padding: 14px; border: none; border-radius: 12px;
  font-size: 16px; font-weight: 600;
  transition: all 0.2s ease; color: #fff;
}
.next-btn { background: var(--color-primary); }
.next-btn:active { transform: scale(0.98); background: var(--color-primary-dark); }
.submit-btn { background: var(--color-primary); }
.submit-btn:active { transform: scale(0.98); background: var(--color-primary-dark); }
.submit-btn.loading { opacity: 0.7; pointer-events: none; }

/* ===== Modal ===== */
.modal-mask {
  position: fixed; left: 0; right: 0; top: 0; bottom: 0; z-index: 999;
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
.modal-x { font-size: 20px; color: var(--color-text-tertiary); }
.modal-body {
  padding: 18px; font-size: 13px;
  color: var(--color-text-secondary); line-height: 1.8;
  max-height: 50vh;
}
.modal-p { display: block; margin-bottom: 8px; }
.modal-li { display: block; margin-bottom: 6px; }
</style>
