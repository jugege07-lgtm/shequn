<template>
  <div class="phone-frame">
    <div class="header">
      <div class="header-left">
        <div class="back-btn" @click="$router.back()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m15 18-6-6 6-6"/></svg></div>
        <span class="header-title">发布商机</span>
      </div>
    </div>
    <div class="main-scroll" v-loading="loading">
      <div class="form-card">
        <div class="form-group">
          <label class="form-label"><span class="required">*</span>商机标题</label>
          <input v-model="form.title" class="form-input" placeholder="请输入商机标题" maxlength="50" />
          <span v-if="errors.title" class="field-error">{{ errors.title }}</span>
        </div>

        <div class="form-group">
          <label class="form-label"><span class="required">*</span>商机分类</label>
          <select v-model="form.categoryId" class="form-select">
            <option value="">请选择分类</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
          <span v-if="errors.categoryId" class="field-error">{{ errors.categoryId }}</span>
        </div>

        <div class="form-group">
          <label class="form-label"><span class="required">*</span>需求描述</label>
          <textarea v-model="form.description" class="form-textarea" placeholder="详细描述您的商机需求" rows="5" maxlength="500"></textarea>
          <span v-if="errors.description" class="field-error">{{ errors.description }}</span>
          <span class="word-count">{{ form.description.length }}/500</span>
        </div>

        <div class="form-group">
          <label class="form-label">解锁费用</label>
          <div class="fee-toggle">
            <div class="fee-option" :class="{ active: feeType === 'free' }" @click="feeType = 'free'; form.unlockFee = 0">
              <span class="fee-radio"><span v-if="feeType === 'free'" class="dot"></span></span>
              <span>免费</span>
            </div>
            <div class="fee-option" :class="{ active: feeType === 'charge' }" @click="feeType = 'charge'; form.unlockFee = form.unlockFee || 1">
              <span class="fee-radio"><span v-if="feeType === 'charge'" class="dot"></span></span>
              <span>收费</span>
            </div>
          </div>
          <div v-if="feeType === 'charge'" class="fee-input-row">
            <input v-model.number="form.unlockFee" type="number" min="0" step="0.01" class="form-input fee-input" placeholder="请输入解锁费用" />
            <span class="fee-unit">元/次</span>
          </div>
          <span v-if="errors.unlockFee" class="field-error">{{ errors.unlockFee }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">最大解锁次数</label>
          <div class="unlock-options">
            <div
              v-for="opt in unlockOptions"
              :key="opt.value"
              class="unlock-opt"
              :class="{ active: selectedUnlock === opt.value }"
              @click="selectUnlock(opt.value)"
            >
              {{ opt.label }}
            </div>
          </div>
          <div v-if="selectedUnlock === 'custom'" class="custom-unlock-row">
            <input v-model.number="customMaxUnlocks" type="number" min="1" max="100" class="form-input" placeholder="请输入解锁次数" />
            <span class="custom-unit">次</span>
          </div>
          <span class="form-hint">默认3次，最多100次</span>
          <span v-if="errors.maxUnlocks" class="field-error">{{ errors.maxUnlocks }}</span>
        </div>

        <div class="form-group">
          <label class="form-label"><span class="required">*</span>联系人</label>
          <input v-model="form.contactName" class="form-input" placeholder="请输入联系人姓名" maxlength="20" />
          <span v-if="errors.contactName" class="field-error">{{ errors.contactName }}</span>
        </div>

        <div class="form-group">
          <label class="form-label"><span class="required">*</span>联系电话</label>
          <input v-model="form.contactPhone" class="form-input" type="tel" placeholder="请输入联系电话" maxlength="11" />
          <span v-if="errors.contactPhone" class="field-error">{{ errors.contactPhone }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">联系微信</label>
          <input v-model="form.contactWechat" class="form-input" placeholder="微信号（选填）" />
        </div>
      </div>

      <div class="tip-card">
        <div class="tip-title">💡 温馨提示</div>
        <ul class="tip-list">
          <li>发布的商机需经审核后才会展示在列表中</li>
          <li>免费商机可被任意用户解锁查看联系方式</li>
          <li>收费商机解锁费用将由平台与您按比例分成</li>
        </ul>
      </div>
    </div>

    <div class="bottom-action">
      <button class="submit-btn" :class="{ loading: submitting, disabled: submitting }" @click="handleSubmit">
        <span v-if="submitting">发布中...</span>
        <span v-else>发布商机</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { createBusiness, getBusinessCategories } from '@/api'

const router = useRouter()
const loading = ref(false)
const submitting = ref(false)
const categories = ref<any[]>([])

const form = reactive({
  title: '',
  categoryId: '',
  description: '',
  unlockFee: 0,
  maxUnlocks: 3,
  contactName: '',
  contactPhone: '',
  contactWechat: '',
})

const errors = reactive<Record<string, string>>({})
const feeType = ref<'free' | 'charge'>('free')
const selectedUnlock = ref<number | 'custom'>(3)
const customMaxUnlocks = ref<number | null>(null)
const unlockOptions = [
  { label: '1次', value: 1 },
  { label: '3次', value: 3 },
  { label: '5次', value: 5 },
  { label: '10次', value: 10 },
  { label: '自定义', value: 'custom' },
]

const finalMaxUnlocks = computed(() => {
  if (selectedUnlock.value === 'custom') {
    return customMaxUnlocks.value || 3
  }
  return selectedUnlock.value
})

function selectUnlock(value: number | 'custom') {
  selectedUnlock.value = value
  if (value !== 'custom') {
    customMaxUnlocks.value = null
  }
}

function clearErrors() {
  Object.keys(errors).forEach(k => delete errors[k])
}

function validate(): boolean {
  clearErrors()
  let ok = true

  if (!form.title.trim()) {
    errors.title = '请输入商机标题'
    ok = false
  } else if (form.title.length < 2) {
    errors.title = '标题至少2个字符'
    ok = false
  }

  if (!form.categoryId) {
    errors.categoryId = '请选择商机分类'
    ok = false
  }

  if (!form.description.trim()) {
    errors.description = '请输入商机描述'
    ok = false
  } else if (form.description.length < 10) {
    errors.description = '描述至少10个字符'
    ok = false
  }

  if (feeType.value === 'charge' && (form.unlockFee === undefined || form.unlockFee === null || isNaN(Number(form.unlockFee)) || Number(form.unlockFee) <= 0)) {
    errors.unlockFee = '请输入有效的解锁费用'
    ok = false
  }

  if (selectedUnlock.value === 'custom') {
    const custom = Number(customMaxUnlocks.value)
    if (!customMaxUnlocks.value || isNaN(custom) || custom < 1 || custom > 100) {
      errors.maxUnlocks = '自定义次数需在1-100之间'
      ok = false
    }
  }

  if (!form.contactName.trim()) {
    errors.contactName = '请输入联系人姓名'
    ok = false
  }

  if (!form.contactPhone.trim()) {
    errors.contactPhone = '请输入联系电话'
    ok = false
  } else if (!/^1[3-9]\d{9}$/.test(form.contactPhone.trim())) {
    errors.contactPhone = '请输入有效的11位手机号'
    ok = false
  }

  return ok
}

function showToast(msg: string) {
  const existing = document.querySelector('.biz-toast')
  if (existing) existing.remove()
  const el = document.createElement('div')
  el.className = 'biz-toast'
  el.textContent = msg
  el.style.cssText = 'position:fixed;top:40%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,.78);color:#fff;padding:12px 28px;border-radius:12px;font-size:14px;z-index:9999;white-space:nowrap;animation:fadeInOut 2s ease forwards'
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 2200)
}

async function loadCategories() {
  loading.value = true
  try {
    const data = await getBusinessCategories()
    if (data && Array.isArray(data)) {
      categories.value = data
    }
  } catch (err: any) {
    console.error('加载分类失败:', err)
    categories.value = [
      { id: 1, name: '资源对接' },
      { id: 2, name: '渠道分销' },
      { id: 3, name: '技术合作' },
      { id: 4, name: '品牌营销' },
    ]
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  if (!validate()) return
  if (submitting.value) return

  submitting.value = true
  try {
    await createBusiness({
        title: form.title.trim(),
        description: form.description.trim(),
        categoryId: Number(form.categoryId),
        unlockFee: feeType.value === 'free' ? 0 : Number(form.unlockFee) || 0,
        maxUnlocks: Number(finalMaxUnlocks.value) || 3,
        contactName: form.contactName.trim(),
        contactPhone: form.contactPhone.trim(),
        contactWechat: form.contactWechat.trim() || '',
      })
    showToast('发布成功，等待审核')
    setTimeout(() => {
      router.replace('/business/my')
    }, 1200)
  } catch (err: any) {
    let msg = '发布失败，请稍后重试'
    if (err?.userMessage) msg = err.userMessage
    else if (err?.message) msg = err.message
    else if (err?.response?.data?.message) msg = err.response.data.message
    showToast(msg)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadCategories()
})
</script>

<style scoped>
@import '@/styles/global.css';

.form-card {
  padding: 16px;
}

.form-group {
  margin-bottom: 18px;
  position: relative;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
  display: block;
}

.required {
  color: #ef4444;
  margin-right: 2px;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  color: var(--color-text-primary);
  outline: none;
  font-family: var(--font);
  box-sizing: border-box;
  transition: border-color 0.2s, background 0.2s;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border-color: var(--color-primary);
  background: #fff;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
  line-height: 1.6;
}

.word-count {
  position: absolute;
  right: 4px;
  bottom: -2px;
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.field-error {
  display: block;
  font-size: 12px;
  color: #ef4444;
  margin-top: 6px;
}

.form-hint {
  display: block;
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin-top: 6px;
}

/* Fee Toggle */
.fee-toggle {
  display: flex;
  gap: 12px;
  margin-bottom: 10px;
}

.fee-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 0;
  border-radius: var(--radius-md);
  border: 1.5px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.fee-option:active {
  transform: scale(0.98);
}

.fee-option.active {
  border-color: var(--color-primary);
  background: rgba(99, 102, 241, 0.06);
  color: var(--color-primary);
  font-weight: 600;
}

.fee-radio {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.fee-option.active .fee-radio {
  border-color: var(--color-primary);
}

.fee-radio .dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--color-primary);
}

.fee-input-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.fee-input {
  flex: 1;
}

.fee-unit {
  font-size: 13px;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

/* Unlock Options */
.unlock-options {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.unlock-opt {
  flex: 1;
  min-width: 56px;
  text-align: center;
  padding: 10px 0;
  border-radius: var(--radius-md);
  border: 1.5px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.unlock-opt:active {
  transform: scale(0.95);
}

.unlock-opt.active {
  border-color: var(--color-primary);
  background: rgba(99, 102, 241, 0.06);
  color: var(--color-primary);
  font-weight: 600;
}

.custom-unlock-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
}

.custom-unit {
  font-size: 13px;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

/* Tip Card */
.tip-card {
  margin: 0 16px 20px;
  padding: 14px 16px;
  background: rgba(251, 191, 36, 0.08);
  border: 1px solid rgba(251, 191, 36, 0.2);
  border-radius: var(--radius-md);
}

.tip-title {
  font-size: 14px;
  font-weight: 600;
  color: #b45309;
  margin-bottom: 8px;
}

.tip-list {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  color: #92400e;
  line-height: 1.8;
}

/* Bottom Action */
.bottom-action {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  padding: 12px 16px env(safe-area-inset-bottom, 12px);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-top: 0.5px solid rgba(60, 60, 67, 0.1);
  z-index: 200;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 12px;
  background: var(--color-primary);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.submit-btn:active:not(.disabled) {
  transform: scale(0.98);
  background: var(--color-primary-dark);
}

.submit-btn.loading,
.submit-btn.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}
</style>
