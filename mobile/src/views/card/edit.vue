<template>
  <div class="phone-frame">
    <div class="header">
      <div class="header-left">
        <div class="back-btn" @click="$router.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m15 18-6-6 6-6"/></svg>
        </div>
        <span class="header-title">编辑名片</span>
      </div>
    </div>
    <div class="main-scroll" v-loading="loading">
      <div class="form-card">
        <div class="avatar-upload" @click="triggerAvatar">
          <img v-if="form.avatarUrl" :src="normalizeImageUrl(form.avatarUrl)" class="avatar-circle avatar-img" alt="头像" />
          <div v-else class="avatar-circle">{{ (form.realName || ' ').charAt(0) }}</div>
          <span>点击更换头像</span>
          <input ref="avatarInput" type="file" accept="image/*" style="display:none" @change="onAvatarChange" />
        </div>

        <div class="form-group">
          <label class="form-label">真实姓名 <span class="required">*</span></label>
          <input v-model="form.realName" class="form-input" :class="{ 'error': validate.realName }" placeholder="请输入真实姓名" />
          <div v-if="validate.realName" class="error-text">姓名不能为空</div>
        </div>

        <div class="form-group">
          <label class="form-label">联系电话</label>
          <input v-model="form.phone" class="form-input" :class="{ 'error': validate.phone }" placeholder="请输入联系电话" maxlength="11" />
          <div v-if="validate.phone" class="error-text">请输入有效的手机号</div>
        </div>

        <div class="form-group">
          <label class="form-label">邮箱</label>
          <input v-model="form.email" class="form-input" :class="{ 'error': validate.email }" placeholder="请输入邮箱" />
          <div v-if="validate.email" class="error-text">请输入有效的邮箱地址</div>
        </div>

        <div class="form-group">
          <label class="form-label">公司名称</label>
          <input v-model="form.company" class="form-input" placeholder="请输入公司名称" />
        </div>

        <div class="form-group">
          <label class="form-label">职位</label>
          <input v-model="form.position" class="form-input" placeholder="请输入职位" />
        </div>

        <div class="form-group">
          <label class="form-label">微信号</label>
          <input v-model="form.wechat" class="form-input" placeholder="请输入微信号" />
        </div>

        <div class="form-group">
          <label class="form-label">个人简介</label>
          <textarea v-model="form.intro" class="form-textarea" placeholder="简短介绍一下自己" rows="3"></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">标签</label>
          <input v-model="form.tags" class="form-input" placeholder="用逗号分隔标签" />
        </div>
      </div>
    </div>
    <div class="bottom-action">
      <button class="submit-btn" :class="{ loading: saving }" :disabled="saving" @click="handleSubmit">{{ saving ? '保存中...' : '保存' }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMyCard, updateMyCard, uploadFile } from '@/api'
import { useUserStore } from '@/store/user'
import { normalizeImageUrl } from '@/utils/image'

const router = useRouter()
const userStore = useUserStore()

const avatarInput = ref<HTMLInputElement | null>(null)
const loading = ref(false)
const saving = ref(false)

const form = reactive({
  realName: '',
  phone: '',
  email: '',
  company: '',
  position: '',
  wechat: '',
  intro: '',
  tags: '',
  avatarUrl: ''
})

const validate = reactive({
  realName: false,
  phone: false,
  email: false
})

// 加载名片数据
onMounted(async () => {
  loading.value = true
  try {
    const data = await getMyCard()
    if (data) {
      form.realName = data.realName || ''
      form.phone = data.phone || ''
      form.email = data.email || ''
      form.company = data.company || ''
      form.position = data.position || ''
      form.wechat = data.wechat || ''
      form.intro = data.intro || ''
      form.avatarUrl = data.avatarUrl || ''

      const tagValue = data.tags
      if (Array.isArray(tagValue)) {
        form.tags = tagValue.join(',')
      } else if (typeof tagValue === 'string' && tagValue) {
        try {
          const parsed = JSON.parse(tagValue)
          // 兼容空对象/对象字符串（如 "{}"），仅当解析为数组时才展示逗号拼接
          form.tags = Array.isArray(parsed) ? parsed.join(',') : ''
        } catch {
          form.tags = tagValue
        }
      } else {
        form.tags = ''
      }
    }
  } catch (err: any) {
    showToast(err.userMessage || '加载名片失败')
  } finally {
    loading.value = false
  }
})

// 触发头像上传
const triggerAvatar = () => avatarInput.value?.click()

// 处理头像上传
const onAvatarChange = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  try {
    loading.value = true
    const res = await uploadFile(file)
    form.avatarUrl = res.url || ''
    showToast('头像上传成功')
  } catch (err: any) {
    showToast(err.userMessage || '头像上传失败')
  } finally {
    loading.value = false
    target.value = ''
  }
}

// 表单验证
const validateForm = (): boolean => {
  validate.realName = !form.realName.trim()
  validate.phone = form.phone ? !/^1[3-9]\d{9}$/.test(form.phone) : false
  validate.email = form.email ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) : false

  return !validate.realName && !validate.phone && !validate.email
}

// 提交表单
const handleSubmit = async () => {
  if (!validateForm()) return

  saving.value = true
  try {
    const payload: Record<string, any> = {
      realName: form.realName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      company: form.company.trim(),
      position: form.position.trim(),
      wechat: form.wechat.trim(),
      intro: form.intro.trim(),
      avatarUrl: form.avatarUrl
    }

    const tagsArr = form.tags
      .split(/[,，]/)
      .map(t => t.trim())
      .filter(Boolean)
    // 始终提交 tags（为空时提交空数组），确保后端清掉历史遗留的 "{}" 占位值
    payload.tags = tagsArr

    await updateMyCard(payload)

    // 同步更新本地用户信息缓存
    userStore.setUserInfo({
      ...(userStore.userInfo || {}),
      avatarUrl: form.avatarUrl,
      nickname: form.realName.trim(),
      phone: form.phone.trim()
    })

    showToast('保存成功')
    router.replace('/card/index')
  } catch (err: any) {
    // 敏感词命中已由 request 层弹提示框，跳过重复 toast
    if (err?.moderation) return
    showToast(err.userMessage || '保存失败')
  } finally {
    saving.value = false
  }
}

// 提示框
function showToast(msg: string) {
  const existing = document.querySelector('.mobile-toast')
  if (existing) existing.remove()

  const el = document.createElement('div')
  el.className = 'mobile-toast'
  el.textContent = msg
  el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.75);color:#fff;padding:12px 24px;border-radius:8px;font-size:14px;z-index:9999;animation:fadeInOut 2s ease forwards'
  document.body.appendChild(el)

  if (!document.getElementById('mobile-toast-style')) {
    const style = document.createElement('style')
    style.id = 'mobile-toast-style'
    style.textContent = '@keyframes fadeInOut{0%{opacity:0}15%{opacity:1}85%{opacity:1}100%{opacity:0}}'
    document.head.appendChild(style)
  }

  setTimeout(() => el.remove(), 2000)
}
</script>

<style scoped>
@import '@/styles/global.css';
.form-card { padding: 16px; }
.avatar-upload { display: flex; flex-direction: column; align-items: center; gap: 8px; margin-bottom: 20px; cursor: pointer; }
.avatar-circle { width: 80px; height: 80px; border-radius: 50%; background: var(--color-primary-50); display: flex; align-items: center; justify-content: center; font-size: 36px; color: var(--color-primary); object-fit: cover; }
.avatar-upload span { font-size: 12px; color: var(--color-primary); }
.form-group { margin-bottom: 16px; }
.form-label { font-size: 14px; font-weight: 600; color: var(--color-text-primary); margin-bottom: 8px; display: block; }
.required { color: #ef4444; font-weight: normal; }
.form-input, .form-textarea { width: 100%; padding: 12px 14px; border-radius: var(--radius-md); border: 1px solid rgba(0,0,0,0.08); background: rgba(255,255,255,0.7); font-size: 14px; color: var(--color-text-primary); outline: none; font-family: var(--font); transition: border-color 0.2s, background 0.2s; }
.form-input:focus, .form-textarea:focus { border-color: var(--color-primary); background: #fff; }
.form-input.error, .form-textarea.error { border-color: #ef4444; background: #fef2f2; }
.error-text { font-size: 12px; color: #ef4444; margin-top: 6px; }
.form-textarea { resize: vertical; }
.bottom-action { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 430px; padding: 12px 16px var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 12px)); background: rgba(255,255,255,0.95); backdrop-filter: blur(20px); border-top: 0.5px solid rgba(60,60,67,0.1); z-index: 200; }
.submit-btn { width: 100%; padding: 14px; border: none; border-radius: 12px; background: var(--color-primary); color: #fff; font-size: 16px; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
.submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }
</style>
