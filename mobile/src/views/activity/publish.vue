<template>
  <div class="phone-frame">
    <div class="header">
      <div class="header-left">
        <div class="back-btn" @click="$router.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m15 18-6-6 6-6"/></svg>
        </div>
        <span class="header-title">发布活动</span>
      </div>
    </div>
    <div class="main-scroll">
      <div class="form-card">
        <div class="form-group">
          <label class="form-label">活动名称</label>
          <input v-model="form.title" class="form-input" placeholder="请输入活动名称" />
        </div>
        <div class="form-group">
          <label class="form-label">活动封面</label>
          <div class="cover-upload">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            <span>点击上传</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">活动类型</label>
          <select v-model="form.type" class="form-select">
            <option value="">请选择类型</option>
            <option value="salon">沙龙</option>
            <option value="workshop">工作坊</option>
            <option value="conference">会议</option>
            <option value="online">线上活动</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">活动时间</label>
          <input v-model="form.startTime" class="form-input" type="datetime-local" />
        </div>
        <div class="form-group">
          <label class="form-label">活动地点</label>
          <input v-model="form.location" class="form-input" placeholder="请输入活动地点" />
        </div>
        <div class="form-group">
          <label class="form-label">人数限制</label>
          <input v-model="form.maxPeople" class="form-input" type="number" placeholder="请输入人数上限" />
        </div>
        <div class="form-group">
          <label class="form-label">活动价格</label>
          <input v-model="form.price" class="form-input" type="number" placeholder="免费请输入0" />
        </div>
        <div class="form-group">
          <label class="form-label">活动介绍</label>
          <textarea v-model="form.desc" class="form-textarea" placeholder="请输入活动详细介绍" rows="5"></textarea>
        </div>
      </div>
    </div>
    <div class="bottom-action">
      <button class="submit-btn" @click="handleSubmit">发布活动</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { createActivity } from '@/api'

const router = useRouter()
const form = ref({
  title: '', type: '', startTime: '', location: '', maxPeople: '', price: '0', desc: '',
})
const submitting = ref(false)

const handleSubmit = async () => {
  if (!form.value.title) { alert('请输入活动名称'); return }
  if (!form.value.type) { alert('请选择活动类型'); return }
  if (!form.value.startTime) { alert('请选择活动时间'); return }
  if (!form.value.location) { alert('请输入活动地点'); return }
  submitting.value = true
  try {
    await createActivity({
      title: form.value.title,
      coverImage: '',
      description: form.value.desc,
      type: form.value.type,
      price: Number(form.value.price) || 0,
      location: form.value.location,
      startTime: form.value.startTime,
      endTime: form.value.startTime,
      maxParticipants: Number(form.value.maxPeople) || undefined,
    })
    alert('发布成功')
    router.back()
  } catch (err: any) {
    alert(err.message || '发布失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
@import '@/styles/global.css';

.form-card { padding: 16px; }
.form-group { margin-bottom: 16px; }
.form-label { font-size: 14px; font-weight: 600; color: var(--color-text-primary); margin-bottom: 8px; display: block; }
.form-input, .form-select, .form-textarea {
  width: 100%; padding: 12px 14px; border-radius: var(--radius-md);
  border: 1px solid rgba(0,0,0,0.08); background: rgba(255,255,255,0.7);
  font-size: 14px; color: var(--color-text-primary); outline: none;
  transition: border-color 0.2s; font-family: var(--font);
}
.form-input:focus, .form-select:focus, .form-textarea:focus { border-color: var(--color-primary); background: #fff; }
.form-input::placeholder, .form-textarea::placeholder { color: var(--color-text-tertiary); }
.form-textarea { resize: vertical; }

.cover-upload {
  height: 120px; border-radius: var(--radius-lg);
  background: var(--color-primary-50);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  cursor: pointer; border: 2px dashed rgba(99,102,241,0.3);
}
.cover-upload svg { width: 32px; height: 32px; color: var(--color-primary); }
.cover-upload span { font-size: 13px; color: var(--color-primary); }

.bottom-action {
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 430px; padding: 12px 16px env(safe-area-inset-bottom, 12px);
  background: rgba(255,255,255,0.95); backdrop-filter: blur(20px);
  border-top: 0.5px solid rgba(60,60,67,0.1); z-index: 200;
}
.submit-btn {
  width: 100%; padding: 14px; border: none; border-radius: 12px;
  background: var(--color-primary); color: #fff;
  font-size: 16px; font-weight: 600; cursor: pointer;
}
.submit-btn:active { transform: scale(0.98); background: var(--color-primary-dark); }
</style>
