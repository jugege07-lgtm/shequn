<template>
  <div :style="sbStyle" class="phone-frame">
    <div class="header">
      <div class="header-left">
        <div class="back-btn" @click="$router.back()">
          <image class="back-icon" :src="iconBack" mode="aspectFit" />
        </div>
        <span class="header-title">新增收货地址</span>
      </div>
    </div>

    <div class="main-scroll">
      <div class="form-card">
        <div class="form-item">
          <span class="form-label">收货人</span>
          <input v-model="form.receiver" placeholder="请输入收货人姓名" />
        </div>
        <div class="form-item">
          <span class="form-label">手机号</span>
          <input v-model="form.phone" type="number" placeholder="请输入手机号" :maxlength="11" />
        </div>
        <div class="form-item">
          <span class="form-label">所在地区</span>
          <picker class="region-picker" mode="region" :value="regionValue" @change="onRegionChange">
            <view class="region-display">
              <text v-if="form.province" class="region-text">{{ form.province }} {{ form.city }} {{ form.district }}</text>
              <text v-else class="region-placeholder">请选择省 / 市 / 区</text>
            </view>
          </picker>
        </div>
        <div class="form-item">
          <span class="form-label">详细地址</span>
          <input v-model="form.detail" placeholder="请输入街道、门牌号等" />
        </div>
        <div class="form-item switch-item">
          <span class="form-label">设为默认地址</span>
          <div class="switch" :class="{ active: form.isDefault }" @click="form.isDefault = form.isDefault ? 0 : 1">
            <div class="switch-thumb"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="bottom-bar">
      <button class="save-btn" :disabled="saving" @click="handleSave">
        {{ saving ? '保存中...' : '保存地址' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { sbStyle } from '@/utils/sb'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { createAddress } from '@/api'
import { showToast } from '@/utils/toast'
import { svgUri } from '@/utils/svg'

const router = useRouter()
const iconBack = svgUri('<path d="m15 18-6-6 6-6"/>', { color: '#1e1b4b' })
const saving = ref(false)
const form = ref<any>({
  receiver: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  isDefault: 0,
})

const regionValue = computed(() => [form.value.province || '广东省', form.value.city || '广州市', form.value.district || '天河区'])

function onRegionChange(e: any) {
  const [province = '', city = '', district = ''] = e.detail.value || []
  form.value.province = province
  form.value.city = city
  form.value.district = district
}

function validate(): string | null {
  if (!form.value.receiver) return '请输入收货人姓名'
  if (!form.value.phone) return '请输入手机号'
  if (!/^1\d{10}$/.test(form.value.phone)) return '手机号格式不正确'
  if (!form.value.province || !form.value.city || !form.value.district) return '请完善省市区信息'
  if (!form.value.detail) return '请输入详细地址'
  return null
}

async function handleSave() {
  const err = validate()
  if (err) {
    showToast(err)
    return
  }
  saving.value = true
  try {
    await createAddress(form.value)
    showToast('保存成功')
    router.back()
  } catch (e: any) {
    // 敏感词命中已由 request 层弹提示框，跳过重复 toast
    if (e?.moderation) return
    showToast(e.message || '保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.form-card {
  margin: 12px 16px; padding: 0 16px; border-radius: var(--radius-xl);
  background: rgba(255,255,255,0.75); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.5);
  box-shadow: var(--glass-shadow);
}
.form-item { display: flex; align-items: center; gap: 12px; padding: 14px 0; border-bottom: 1px solid rgba(0,0,0,0.05); }
.form-item:last-child { border-bottom: none; }
.form-label { width: 90px; flex-shrink: 0; font-size: 14px; color: var(--color-text-primary); font-weight: 600; }
.form-item input { flex: 1; border: none; background: transparent; font-size: 14px; color: var(--color-text-primary); outline: none; }
.region-picker { flex: 1; }
.region-display { width: 100%; font-size: 14px; }
.region-text { color: var(--color-text-primary); }
.region-placeholder { color: var(--color-text-tertiary); }
.switch-item { justify-content: space-between; }
.switch { width: 48px; height: 26px; border-radius: 13px; background: #e5e7eb; position: relative; transition: background 0.2s; }
.switch.active { background: var(--color-primary); }
.switch-thumb { width: 22px; height: 22px; border-radius: 50%; background: #fff; position: absolute; top: 2px; left: 2px; transition: transform 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
.switch.active .switch-thumb { transform: translateX(22px); }
.back-icon { width: 20px; height: 20px; }
.bottom-bar {
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 430px;
  padding: 12px 16px var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 12px)); background: rgba(255,255,255,0.95); backdrop-filter: blur(20px);
  border-top: 0.5px solid rgba(60,60,67,0.1); z-index: 200;
}
.save-btn { width: 100%; padding: 14px; border: none; border-radius: 12px; background: var(--color-primary); color: #fff; font-size: 16px; font-weight: 600; }
.save-btn:disabled { opacity: 0.6; }
</style>
