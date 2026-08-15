<template>
  <div class="phone-frame">
    <div class="header">
      <div class="header-left">
        <div class="back-btn" @click="$router.back()">
          <image :src="iconBack" />
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
          <div class="cover-upload" @click="chooseCover">
            <image v-if="form.coverImage" :src="coverPreview" class="cover-preview" mode="aspectFill" />
            <template v-else>
              <image :src="iconUpload" />
              <span class="cover-upload-text">{{ uploadingCover ? '上传中...' : '点击上传' }}</span>
            </template>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">活动类型</label>
          <picker mode="selector" :range="typeLabels" @change="onTypeChange">
            <view class="form-select" :class="{ placeholder: !form.type }">{{ selectedTypeLabel || '请选择类型' }}</view>
          </picker>
        </div>
        <div class="form-group">
          <label class="form-label">活动时间</label>
          <div class="datetime-row">
            <picker class="dt-picker" mode="date" :value="datePart" @change="onDateChange">
              <view class="form-select" :class="{ placeholder: !datePart }">{{ datePart || '选择日期' }}</view>
            </picker>
            <picker class="dt-picker" mode="time" :value="timePart" @change="onTimeChange">
              <view class="form-select" :class="{ placeholder: !timePart }">{{ timePart || '选择时间' }}</view>
            </picker>
          </div>
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
          <input v-model="form.price" class="form-input" type="digit" placeholder="免费请输入0" />
        </div>
        <div class="form-group">
          <label class="form-label">活动介绍</label>
          <!-- 小程序无富文本编辑器：textarea 文字 + 多图上传，提交时拼 HTML -->
          <div class="rich-editor">
            <div class="rich-toolbar">
              <button type="default" class="rt-btn" :class="{ active: uploadingDesc }" :disabled="uploadingDesc" @click="addDescImage">
                <image :src="iconInsert" />
                <span>{{ uploadingDesc ? '上传中...' : '插入图片' }}</span>
              </button>
            </div>
            <textarea
              v-model="descText"
              class="rich-content"
              placeholder="请输入活动详细介绍，可插入图片"
              :maxlength="-1"
            />
            <div class="desc-images" v-if="descImages.length">
              <div class="desc-img-item" v-for="(img, i) in descImages" :key="img + '_' + i">
                <image class="desc-img" :src="previewUrl(img)" mode="aspectFill" @click="previewDescImage(i)" />
                <div class="desc-img-del" @click.stop="removeDescImage(i)">×</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="bottom-action">
      <button class="submit-btn" :disabled="submitting" @click="handleSubmit">{{ submitting ? '发布中...' : '发布活动' }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { createActivity, getActivityTypes } from '@/api'
import { showToast } from '@/utils/toast'
import { normalizeImageUrl } from '@/utils/image'
import { escapeHtml } from '@/utils/sanitize'
import { chooseAndUploadImages } from '@/utils/upload'
import { svgUri } from '@/utils/svg'

const router = useRouter()

// ===== 图标（内联 svg → data URI） =====
const iconBack = svgUri('<path d="m15 18-6-6 6-6"/>', { color: '#1e1b4b' })
const iconUpload = svgUri('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>', { color: '#6366f1', strokeWidth: '1.5' })
const iconInsert = svgUri('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>', { color: '#6366f1' })

const form = ref({
  title: '', type: '', location: '', maxPeople: '', price: '0', coverImage: '',
})
const submitting = ref(false)
const activityTypes = ref<{ value: string; label: string }[]>([])

// 活动时间：date picker + time picker 组合（原 datetime-local 小程序不支持）
const datePart = ref('')
const timePart = ref('')
const startTimeStr = computed(() => (datePart.value && timePart.value ? `${datePart.value}T${timePart.value}` : ''))

// ===== 活动类型 picker =====
const typeLabels = computed(() => activityTypes.value.map((t) => t.label))
const selectedTypeLabel = computed(() => activityTypes.value.find((t) => t.value === form.value.type)?.label || '')
function onTypeChange(e: any) {
  const idx = Number(e?.detail?.value)
  form.value.type = activityTypes.value[idx]?.value || ''
}
function onDateChange(e: any) {
  datePart.value = e?.detail?.value || ''
}
function onTimeChange(e: any) {
  timePart.value = e?.detail?.value || ''
}

// ===== 封面上传 =====
const uploadingCover = ref(false)
// 预览地址补全为绝对地址；提交后端时统一保存原始相对路径
const coverPreview = computed(() => normalizeImageUrl(form.value.coverImage))

async function chooseCover() {
  if (uploadingCover.value) return
  uploadingCover.value = true
  try {
    const urls = await chooseAndUploadImages(1)
    if (urls[0]) form.value.coverImage = urls[0]
  } catch (err: any) {
    showToast(err?.message || '封面上传失败')
  } finally {
    uploadingCover.value = false
  }
}

// ===== 介绍：文字 + 多图（小程序无富文本编辑器） =====
const descText = ref('')
const descImages = ref<string[]>([]) // 后端相对路径（提交数据只用相对路径）
const uploadingDesc = ref(false)
const MAX_DESC_IMAGES = 9

function previewUrl(img: string) {
  return normalizeImageUrl(img)
}

async function addDescImage() {
  if (uploadingDesc.value) return
  const remain = MAX_DESC_IMAGES - descImages.value.length
  if (remain <= 0) {
    showToast(`最多上传${MAX_DESC_IMAGES}张图片`)
    return
  }
  uploadingDesc.value = true
  try {
    const urls = await chooseAndUploadImages(remain)
    descImages.value.push(...urls.filter(Boolean))
  } catch (err: any) {
    showToast(err?.message || '图片上传失败')
  } finally {
    uploadingDesc.value = false
  }
}

function removeDescImage(i: number) {
  descImages.value.splice(i, 1)
}

function previewDescImage(i: number) {
  uni.previewImage({
    current: normalizeImageUrl(descImages.value[i]),
    urls: descImages.value.map((p) => normalizeImageUrl(p)),
  })
}

// 提交时拼 HTML：文字段落包 <p>，图片 <img src="/uploads/xxx">（相对路径，与后端字段格式一致）
function buildDescription(): string {
  const parts: string[] = []
  const text = descText.value.trim()
  if (text) {
    text.split(/\n+/).forEach((seg) => {
      const line = seg.trim()
      if (line) parts.push(`<p>${escapeHtml(line)}</p>`)
    })
  }
  descImages.value.forEach((src) => {
    parts.push(`<p><img src="${src}" style="max-width:100%;height:auto;border-radius:8px;margin:8px 0;display:block"/></p>`)
  })
  return parts.join('')
}

// ==================== 提交 ====================
const handleSubmit = async () => {
  if (!form.value.title) { showToast('请输入活动名称'); return }
  if (!form.value.type) { showToast('请选择活动类型'); return }
  if (!form.value.coverImage) { showToast('请上传活动封面'); return }
  if (!startTimeStr.value) { showToast('请选择活动时间'); return }
  if (!form.value.location) { showToast('请输入活动地点'); return }
  if (!descText.value.trim()) { showToast('请输入活动介绍'); return }
  submitting.value = true
  try {
    const v = startTimeStr.value
    const startTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v) ? `${v}:00` : v
    await createActivity({
      title: form.value.title,
      coverImage: form.value.coverImage,
      description: buildDescription(),
      type: form.value.type,
      price: Number(form.value.price) || 0,
      location: form.value.location,
      startTime,
      endTime: startTime,
      maxParticipants: Number(form.value.maxPeople) || undefined,
    })
    showToast('发布成功')
    setTimeout(() => router.back(), 600)
  } catch (err: any) {
    showToast(err.userMessage || err.message || '发布失败')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    activityTypes.value = (await getActivityTypes()) as any
  } catch {
    activityTypes.value = []
  }
})
</script>

<style scoped>
.form-card { padding: 16px; }
.form-group { margin-bottom: 16px; }
.form-label { font-size: 14px; font-weight: 600; color: var(--color-text-primary); margin-bottom: 8px; display: block; }
.form-input, .form-select {
  width: 100%; padding: 12px 14px; border-radius: var(--radius-md);
  border: 1px solid rgba(0,0,0,0.08); background: rgba(255,255,255,0.7);
  font-size: 14px; color: var(--color-text-primary); outline: none;
  transition: border-color 0.2s; font-family: var(--font);
  color-scheme: light;
}
.form-input:focus, .form-select:focus { border-color: var(--color-primary); background: #fff; }
.form-input::placeholder { color: var(--color-text-tertiary); }
.form-select.placeholder { color: var(--color-text-tertiary); }

.datetime-row { display: flex; gap: 10px; }
.dt-picker { flex: 1; }

.cover-upload {
  height: 120px; border-radius: var(--radius-lg);
  background: var(--color-primary-50);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  cursor: pointer; border: 2px dashed rgba(99,102,241,0.3);
  overflow: hidden; position: relative;
}
.cover-upload image { width: 32px; height: 32px; }
.cover-upload-text { font-size: 13px; color: var(--color-primary); }
.cover-preview {
  width: 100%; height: 100%; display: block;
}

/* 介绍编辑区（textarea + 图片列表） */
.rich-editor {
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: border-color 0.2s;
}
.rich-editor:focus-within { border-color: var(--color-primary); }
.rich-toolbar {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  background: rgba(99,102,241,0.03);
}
.rt-btn {
  display: flex; align-items: center; justify-content: center; gap: 4px;
  padding: 6px 12px; border-radius: 8px;
  border: 1px solid rgba(99,102,241,0.3);
  background: #fff; color: var(--color-primary);
  font-size: 13px; font-weight: 600;
  line-height: 1.4;
  cursor: pointer; transition: all 0.2s;
}
.rt-btn::after { border: none; }
.rt-btn:active { transform: scale(0.96); }
.rt-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.rt-btn image { width: 16px; height: 16px; }
.rich-content {
  width: 100%; min-height: 120px;
  padding: 12px 14px;
  font-size: 14px; line-height: 1.8; color: var(--color-text-primary);
  font-family: var(--font);
  word-break: break-word;
}
.desc-images {
  display: flex; flex-wrap: wrap; gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid rgba(0,0,0,0.05);
  background: rgba(99,102,241,0.02);
}
.desc-img-item { position: relative; width: 96px; height: 96px; }
.desc-img { width: 100%; height: 100%; border-radius: 8px; display: block; }
.desc-img-del {
  position: absolute; top: -6px; right: -6px;
  width: 20px; height: 20px; border-radius: 50%;
  background: rgba(0,0,0,0.6); color: #fff;
  font-size: 14px; line-height: 20px; text-align: center;
}

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
  line-height: 1.4;
}
.submit-btn::after { border: none; }
.submit-btn:active { transform: scale(0.98); background: var(--color-primary-dark); }
.submit-btn:disabled { opacity: 0.6; }
</style>
