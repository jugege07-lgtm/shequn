<template>
  <transition name="pp-fade">
    <div v-if="visible" class="pp-mask" @click.self="handleClose">
      <div class="pp-panel">
        <div class="pp-title">
          {{ hasPassword ? '余额支付' : '尚未设置支付密码' }}
          <div class="pp-close" @click="handleClose">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </div>
        </div>

        <!-- 已设置支付密码：输入密码 -->
        <template v-if="hasPassword">
          <div class="pp-amount">¥{{ amountText }}</div>
          <div class="pp-label">请输入支付密码</div>
          <div class="pp-input-row">
            <input
              class="pp-input"
              type="password"
              :value="password"
              @input="onInput"
              placeholder="请输入支付密码"
              maxlength="20"
              autocomplete="off"
              @keydown.enter="doVerify"
            />
          </div>
          <div v-if="error" class="pp-error">{{ error }}</div>
          <button class="pp-btn" :disabled="verifying || !password" @click="doVerify">
            {{ verifying ? '校验中...' : '确认支付' }}
          </button>
        </template>

        <!-- 未设置支付密码：引导去设置 -->
        <template v-else>
          <div class="pp-tip">为保障资金安全，请先前往「个人中心 - 设置」完成支付密码设置，设置成功后可返回继续支付。</div>
          <button class="pp-btn" @click="goSet">去设置支付密码</button>
        </template>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { verifyPayPassword } from '@/api'

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

function onInput(e: Event) {
  password.value = (e.target as HTMLInputElement).value
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
  position: fixed; inset: 0; z-index: 1000;
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
  color: #9ca3af; cursor: pointer;
}
.pp-close:active { background: rgba(0,0,0,0.05); }
.pp-close svg { width: 16px; height: 16px; }
.pp-amount {
  text-align: center; font-size: 30px; font-weight: 800; color: #1e1b4b;
  margin-bottom: 8px;
}
.pp-label { font-size: 13px; color: #6b7280; margin-bottom: 10px; }
.pp-input-row { margin-bottom: 12px; }
.pp-input {
  width: 100%; box-sizing: border-box;
  padding: 12px 14px; border: 1.5px solid #e5e7eb; border-radius: 12px;
  font-size: 16px; color: #1e1b4b; outline: none;
  transition: border-color 0.2s;
}
.pp-input:focus { border-color: #6366f1; }
.pp-error { font-size: 12px; color: #ef4444; margin-bottom: 10px; }
.pp-tip {
  font-size: 14px; color: #6b7280; line-height: 1.7;
  text-align: left; margin-bottom: 18px;
}
.pp-btn {
  width: 100%; padding: 13px; border: none; border-radius: 12px;
  background: #6366f1; color: #fff; font-size: 16px; font-weight: 600;
  cursor: pointer;
}
.pp-btn:disabled { opacity: 0.6; }
.pp-fade-enter-active, .pp-fade-leave-active { transition: opacity 0.2s; }
.pp-fade-enter-from, .pp-fade-leave-to { opacity: 0; }
</style>