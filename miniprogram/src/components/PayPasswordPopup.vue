<template>
  <view v-if="visible" class="pp-mask" @click.self="handleClose">
    <view class="pp-panel">
      <view class="pp-title">
        {{ hasPassword ? '余额支付' : '尚未设置支付密码' }}
        <view class="pp-close" @click="handleClose">
          <image class="pp-close-icon" :src="iconClose" mode="aspectFit" />
        </view>
      </view>

      <!-- 已设置支付密码：输入密码 -->
      <template v-if="hasPassword">
        <view class="pp-amount">{{ amountText }}</view>
        <view class="pp-label">请输入支付密码</view>
        <view class="pp-input-row">
          <input
            class="pp-input"
            :password="true"
            :value="password"
            @input="onInput"
            placeholder="请输入支付密码"
            :maxlength="20"
            confirm-type="done"
            @confirm="doVerify"
          />
        </view>
        <view v-if="error" class="pp-error">{{ error }}</view>
        <button class="pp-btn" :disabled="verifying || !password" @click="doVerify">
          {{ verifying ? '校验中...' : '确认支付' }}
        </button>
      </template>

      <!-- 未设置支付密码：引导去设置 -->
      <template v-else>
        <view class="pp-tip">为保障资金安全，请先前往「个人中心 - 设置」完成支付密码设置，设置成功后可返回继续支付。</view>
        <button class="pp-btn" @click="goSet">去设置支付密码</button>
      </template>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { verifyPayPassword } from '@/api'
import { svgUri } from '@/utils/svg'

const props = defineProps<{
  modelValue: boolean
  hasPassword: boolean
  amountText?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'success', payPassword: string): void
  (e: 'go-set'): void
}>()

const iconClose = svgUri('<path d="M18 6 6 18M6 6l12 12"/>', { color: '#9ca3af' })

const visible = ref(props.modelValue)
watch(() => props.modelValue, (v) => {
  visible.value = v
  if (v) {
    password.value = ''
    error.value = ''
    verifying.value = false
  }
})

const password = ref('')
const error = ref('')
const verifying = ref(false)

function onInput(e: any) {
  password.value = e?.detail?.value ?? e?.target?.value ?? ''
  error.value = ''
}

function handleClose() {
  emit('update:modelValue', false)
}

function goSet() {
  emit('update:modelValue', false)
  emit('go-set')
}

async function doVerify() {
  if (!password.value || verifying.value) return
  verifying.value = true
  error.value = ''
  try {
    await verifyPayPassword(password.value)
    emit('success', password.value)
    emit('update:modelValue', false)
  } catch (err: any) {
    error.value = err?.userMessage || err?.message || '支付密码错误'
  } finally {
    verifying.value = false
  }
}
</script>

<style scoped>
.pp-mask {
  position: fixed; left: 0; right: 0; top: 0; bottom: 0; z-index: 1000;
  background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center;
  padding: 32px;
}
.pp-panel {
  width: 100%; max-width: 340px;
  background: #fff; border-radius: 20px;
  padding: 24px 20px 20px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}
.pp-title {
  position: relative;
  text-align: center; font-size: 17px; font-weight: 700; color: #1e1b4b;
  margin-bottom: 16px;
}
.pp-close {
  position: absolute; right: 0; top: 50%; transform: translateY(-50%);
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}
.pp-close:active { background: rgba(0,0,0,0.05); }
.pp-close-icon { width: 16px; height: 16px; }
.pp-amount {
  text-align: center; font-size: 30px; font-weight: 800; color: #1e1b4b;
  margin-bottom: 8px;
}
.pp-label { font-size: 13px; color: #6b7280; margin-bottom: 10px; }
.pp-input-row { margin-bottom: 12px; }
.pp-input {
  width: 100%;
  padding: 12px 14px; border: 1.5px solid #e5e7eb; border-radius: 12px;
  font-size: 16px; color: #1e1b4b;
}
.pp-error { font-size: 12px; color: #ef4444; margin-bottom: 10px; }
.pp-tip {
  font-size: 14px; color: #6b7280; line-height: 1.7;
  text-align: left; margin-bottom: 18px;
}
.pp-btn {
  width: 100%; padding: 13px; border: none; border-radius: 12px;
  background: #6366f1; color: #fff; font-size: 16px; font-weight: 600;
}
.pp-btn[disabled] { opacity: 0.6; }
</style>
