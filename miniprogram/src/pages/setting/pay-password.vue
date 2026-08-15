<template>
  <view :style="sbStyle" class="phone-frame pp-setup-page">
    <!-- Header -->
    <view class="pp-header">
      <view class="header-title-row">
        <view class="back-btn" @click="$router.back()">
          <image :src="iconBack" mode="aspectFit" />
        </view>
        <view class="header-title">{{ hasPassword ? '修改支付密码' : '设置支付密码' }}</view>
      </view>
    </view>

    <view class="main-scroll">
      <!-- 状态提示 -->
      <view class="status-card">
        <view class="status-icon" :class="{ set: hasPassword }">
          <image :src="hasPassword ? iconLockSet : iconLock" mode="aspectFit" />
        </view>
        <view class="status-text">
          <view class="status-title">{{ hasPassword ? '已设置' : '未设置' }}</view>
          <view class="status-desc">{{ hasPassword ? '修改支付密码需短信验证码验证' : '首次设置支付密码，无需验证码' }}</view>
        </view>
      </view>

      <!-- 表单 -->
      <view class="form-card">
        <template v-if="hasPassword">
          <view class="form-item">
            <label class="form-label">短信验证码</label>
            <view class="code-row">
              <input class="form-input" type="text" placeholder="请输入短信验证码" v-model="code" maxlength="6" />
              <button class="code-btn" :disabled="countdown > 0 || sending" @click="sendCode">
                {{ countdown > 0 ? `${countdown}s` : sending ? '发送中...' : '获取验证码' }}
              </button>
            </view>
          </view>
        </template>

        <view class="form-item">
          <label class="form-label">{{ hasPassword ? '新支付密码' : '支付密码' }}</label>
          <input class="form-input" password placeholder="请输入6-20位支付密码" v-model="password" maxlength="20" />
        </view>

        <view class="form-item">
          <label class="form-label">确认{{ hasPassword ? '新' : '' }}支付密码</label>
          <input class="form-input" password placeholder="请再次输入支付密码" v-model="confirmPassword" maxlength="20" />
        </view>

        <view class="form-tip">支付密码用于余额支付，请勿与登录密码相同，请妥善保管。</view>
      </view>
    </view>

    <view class="bottom-action">
      <button class="confirm-btn" :disabled="submitting" @click="submit">
        {{ submitting ? '提交中...' : (hasPassword ? '确认修改' : '确认设置') }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { sbStyle } from '@/utils/sb'
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCurrentUser, setPayPassword, sendPayPasswordCode } from '@/api'
import { svgUri } from '@/utils/svg'

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

const iconBack = svgUri('<path d="m15 18-6-6 6-6"/>', { color: '#1e1b4b' })
const iconLock = svgUri('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>', { color: '#f59e0b' })
const iconLockSet = svgUri('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>', { color: '#10b981' })

onMounted(() => {
  loadStatus()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

function showToast(msg: string) {
  uni.showToast({ title: msg, icon: 'none' })
}

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
</script>

<style scoped>
.pp-setup-page { background: #f5f6fa; }
.pp-header {
  background: #ffffff; color: #1e1b4b;
  /* 状态栏避让由页面根元素 sbStyle 统一下推 */
  padding: 12px 16px 0;
}
.header-title-row {
  position: relative; display: flex; align-items: center; justify-content: center;
  height: 44px; margin-bottom: 8px;
}
.header-title { font-size: 18px; font-weight: 700; }
.back-btn {
  position: absolute; left: -4px; width: 40px; height: 40px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; color: #1e1b4b;
}
.back-btn:active { background: rgba(0,0,0,0.05); }
.back-btn image { width: 22px; height: 22px; }
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
  background: #fef3c7;
  display: flex; align-items: center; justify-content: center;
}
.status-icon.set { background: #d1fae5; }
.status-icon image { width: 24px; height: 24px; }
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
  /* 小程序原生 input：固定高度 + line-height 垂直居中（垂直 padding 会裁半 placeholder） */
  height: 46px; line-height: 43px; padding: 0 14px;
  border: 1.5px solid #e5e7eb; border-radius: 12px;
  font-size: 15px; color: #1e1b4b; background: #fafafa;
}
.code-row { display: flex; gap: 10px; }
.code-row .form-input { flex: 1; }
.code-btn {
  flex-shrink: 0; padding: 0 16px; border: none; border-radius: 12px;
  background: #6366f1; color: #fff; font-size: 14px; font-weight: 600;
}
.code-btn:disabled { opacity: 0.6; }
.form-tip { font-size: 12px; color: #9ca3af; line-height: 1.6; }
.bottom-action {
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 430px; padding: 12px 16px var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 12px));
  background: rgba(255,255,255,0.95); backdrop-filter: blur(20px);
  border-top: 0.5px solid rgba(60,60,67,0.1); z-index: 200;
}
.confirm-btn {
  width: 100%; padding: 14px; border: none; border-radius: 12px;
  background: #6366f1; color: #fff; font-size: 16px; font-weight: 600;
}
.confirm-btn:disabled { opacity: 0.6; }
</style>
