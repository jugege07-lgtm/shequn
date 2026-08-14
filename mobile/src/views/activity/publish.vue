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
          <div class="cover-upload" @click="triggerCoverUpload">
            <img v-if="form.coverImage" :src="form.coverImage" class="cover-preview" />
            <template v-else>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
              <span>点击上传</span>
            </template>
          </div>
          <input ref="coverInput" type="file" accept="image/*" class="cover-file-input" @change="onCoverChange" />
        </div>
        <div class="form-group">
          <label class="form-label">活动类型</label>
          <select v-model="form.type" class="form-select">
            <option value="">请选择类型</option>
            <option v-for="t in activityTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
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
          <!-- 富文本编辑器：支持文字 + 图片，大图自动压缩 -->
          <div class="rich-editor">
            <div class="rich-toolbar">
              <button type="button" class="rt-btn" :class="{ active: uploadingDesc }" @click="triggerDescImageUpload" :disabled="uploadingDesc">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                <span>{{ uploadingDesc ? '上传中...' : '插入图片' }}</span>
              </button>
            </div>
            <div
              ref="descEditor"
              class="rich-content"
              contenteditable="true"
              data-placeholder="请输入活动详细介绍，可插入图片"
              @input="onDescInput"
            ></div>
          </div>
          <input ref="descImageInput" type="file" accept="image/*" class="cover-file-input" @change="onDescImageChange" />
        </div>
      </div>
    </div>
    <div class="bottom-action">
      <button class="submit-btn" :disabled="submitting" @click="handleSubmit">{{ submitting ? '发布中...' : '发布活动' }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { createActivity, getActivityTypes, uploadFile } from '@/api'
import { showToast } from '@/utils/toast'

const router = useRouter()
const form = ref({
  title: '', type: '', startTime: '', location: '', maxPeople: '', price: '0', desc: '', coverImage: '',
})
const submitting = ref(false)
const activityTypes = ref<{ value: string; label: string }[]>([])
const coverInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

// 富文本编辑器引用
const descEditor = ref<HTMLElement | null>(null)
const descImageInput = ref<HTMLInputElement | null>(null)
const uploadingDesc = ref(false)

// ==================== 图片压缩（与 admin 端策略一致） ====================
const MAX_EDGE = 1920 // 最长边像素阈值
const MAX_BYTES = 1 * 1024 * 1024 // 体积阈值 1MB
const INITIAL_QUALITY = 0.82
const MIN_QUALITY = 0.5

function loadImageEl(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片解析失败'))
    img.src = url
  })
}

function drawToCanvas(img: HTMLImageElement, w: number, h: number, fillWhite: boolean): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  if (fillWhite) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
  }
  ctx.drawImage(img, 0, 0, w, h)
  return canvas
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

/** 压缩图片：最长边 > 1920px 或体积 > 1MB 时触发，逐步降质量至 0.5 */
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  const isPng = file.type === 'image/png'
  const isWebp = file.type === 'image/webp'
  const img = await loadImageEl(file)
  const edge = Math.max(img.naturalWidth, img.naturalHeight)
  if (edge <= MAX_EDGE && file.size <= MAX_BYTES) return file

  const scale = Math.min(1, MAX_EDGE / edge)
  const targetW = Math.max(1, Math.round(img.naturalWidth * scale))
  const targetH = Math.max(1, Math.round(img.naturalHeight * scale))
  const mimeType = isPng || isWebp ? 'image/jpeg' : file.type
  const fillWhite = isPng || isWebp

  let quality = INITIAL_QUALITY
  let output: Blob | null = null
  for (;;) {
    const canvas = drawToCanvas(img, targetW, targetH, fillWhite)
    output = await canvasToBlob(canvas, mimeType, quality)
    if (!output) break
    if (output.size <= MAX_BYTES || quality <= MIN_QUALITY) break
    quality -= 0.1
  }
  if (!output || output.size >= file.size) return file

  const ext = mimeType === 'image/jpeg' ? 'jpg' : mimeType.split('/')[1]
  const name = file.name.replace(/\.[^.]+$/, '') + '.' + ext
  return new File([output], name, { type: mimeType })
}

// ==================== 封面上传 ====================
function triggerCoverUpload() {
  if (uploading.value) return
  coverInput.value?.click()
}

async function onCoverChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    showToast('请选择图片文件')
    input.value = ''
    return
  }
  uploading.value = true
  try {
    // 封面也压缩大图
    const compressed = await compressImage(file)
    const res: any = await uploadFile(compressed)
    const url = (res?.url || res?.path || '').startsWith('/uploads/')
      ? '/api' + (res?.url || res?.path)
      : (res?.url || res?.path || '')
    form.value.coverImage = url
  } catch (err: any) {
    showToast(err?.message || '封面上传失败')
  } finally {
    uploading.value = false
    input.value = ''
  }
}

// ==================== 富文本编辑器 ====================
function onDescInput() {
  if (descEditor.value) {
    form.value.desc = descEditor.value.innerHTML
  }
}

function triggerDescImageUpload() {
  if (uploadingDesc.value) return
  descImageInput.value?.click()
}

async function onDescImageChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    showToast('请选择图片文件')
    input.value = ''
    return
  }
  uploadingDesc.value = true
  try {
    // 大图自动压缩
    const compressed = await compressImage(file)
    const res: any = await uploadFile(compressed)
    const url = (res?.url || res?.path || '').startsWith('/uploads/')
      ? '/api' + (res?.url || res?.path)
      : (res?.url || res?.path || '')
    if (!url) {
      showToast('图片上传失败')
      return
    }
    // 将图片插入到 contenteditable 编辑器中
    insertImageToEditor(url)
  } catch (err: any) {
    showToast(err?.message || '图片上传失败')
  } finally {
    uploadingDesc.value = false
    input.value = ''
  }
}

/** 在 contenteditable 编辑器光标位置插入图片 */
function insertImageToEditor(url: string) {
  const editor = descEditor.value
  if (!editor) return
  editor.focus()
  // 恢复光标位置（如果有保存的 range）
  const selection = window.getSelection()
  if (selection && savedRange) {
    selection.removeAllRanges()
    selection.addRange(savedRange)
  }
  // 插入 <img> 标签
  const img = document.createElement('img')
  img.src = url
  img.style.maxWidth = '100%'
  img.style.height = 'auto'
  img.style.borderRadius = '8px'
  img.style.margin = '8px 0'
  img.dataset.role = 'rich-image'
  // 在光标处插入
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0)
    range.deleteContents()
    range.insertNode(img)
    // 光标移到图片后面
    range.setStartAfter(img)
    range.collapse(true)
    selection.removeAllRanges()
    selection.addRange(range)
  } else {
    editor.appendChild(img)
  }
  // 插入后追加一个换行
  editor.appendChild(document.createElement('br'))
  // 更新 form.desc
  onDescInput()
}

// 保存编辑器内的选区（光标位置），避免点击按钮后光标丢失
let savedRange: Range | null = null
function saveSelection() {
  const selection = window.getSelection()
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0)
    // 仅当光标在编辑器内时保存
    if (descEditor.value && descEditor.value.contains(range.commonAncestorContainer)) {
      savedRange = range.cloneRange()
    }
  }
}

// ==================== 提交 ====================
const handleSubmit = async () => {
  if (!form.value.title) { showToast('请输入活动名称'); return }
  if (!form.value.type) { showToast('请选择活动类型'); return }
  if (!form.value.coverImage) { showToast('请上传活动封面'); return }
  if (!form.value.startTime) { showToast('请选择活动时间'); return }
  if (!form.value.location) { showToast('请输入活动地点'); return }
  // 提取纯文本判断是否为空（避免只有空标签）
  const descText = descEditor.value?.textContent?.trim() || ''
  if (!descText) { showToast('请输入活动介绍'); return }
  submitting.value = true
  try {
    const normalizeDt = (v: string) =>
      v && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v) ? `${v}:00` : v
    const startTime = normalizeDt(form.value.startTime)
    await createActivity({
      title: form.value.title,
      coverImage: form.value.coverImage,
      description: form.value.desc,
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
  // 编辑器失焦时保存选区，确保点击"插入图片"按钮后光标位置正确
  if (descEditor.value) {
    descEditor.value.addEventListener('blur', saveSelection)
    // 使用 mouseup + keyup 保存选区，确保光标位置实时更新
    descEditor.value.addEventListener('mouseup', saveSelection)
    descEditor.value.addEventListener('keyup', saveSelection)
  }
})
</script>

<style scoped>
@import '@/styles/global.css';

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

.cover-upload {
  height: 120px; border-radius: var(--radius-lg);
  background: var(--color-primary-50);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  cursor: pointer; border: 2px dashed rgba(99,102,241,0.3);
  overflow: hidden; position: relative;
}
.cover-upload svg { width: 32px; height: 32px; color: var(--color-primary); }
.cover-upload span { font-size: 13px; color: var(--color-primary); }
.cover-preview {
  width: 100%; height: 100%; object-fit: cover; display: block;
}
.cover-file-input { display: none; }

/* 富文本编辑器 */
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
  display: flex; align-items: center; gap: 4px;
  padding: 6px 12px; border-radius: 8px;
  border: 1px solid rgba(99,102,241,0.3);
  background: #fff; color: var(--color-primary);
  font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
}
.rt-btn:active { transform: scale(0.96); }
.rt-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.rt-btn svg { width: 16px; height: 16px; }
.rich-content {
  min-height: 120px; max-height: 400px; overflow-y: auto;
  padding: 12px 14px;
  font-size: 14px; line-height: 1.8; color: var(--color-text-primary);
  outline: none; -webkit-user-select: text; user-select: text;
  word-break: break-word;
}
.rich-content:empty::before {
  content: attr(data-placeholder);
  color: var(--color-text-tertiary);
  pointer-events: none;
}
.rich-content img {
  max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0;
  display: block;
}

.bottom-action {
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 430px; padding: 12px 16px var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 12px));
  background: rgba(255,255,255,0.95); backdrop-filter: blur(20px);
  border-top: 0.5px solid rgba(60,60,67,0.1); z-index: 200;
}
.submit-btn {
  width: 100%; padding: 14px; border: none; border-radius: 12px;
  background: var(--color-primary); color: #fff;
  font-size: 16px; font-weight: 600; cursor: pointer;
}
.submit-btn:active { transform: scale(0.98); background: var(--color-primary-dark); }
.submit-btn:disabled { opacity: 0.6; }
</style>
