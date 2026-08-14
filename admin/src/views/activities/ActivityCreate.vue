<template>
  <div class="activity-create-page">
    <el-card v-loading="pageLoading">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-button :icon="ArrowLeft" @click="$router.back()" text>返回</el-button>
            <span class="page-title">{{ isEdit ? '编辑活动' : '新增活动' }}</span>
          </div>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        label-position="right"
        class="create-form"
        v-loading="submitting"
      >
        <!-- 基本信息 -->
        <div class="form-section">
          <div class="section-title">
            <span class="title-bar"></span>
            基本信息
          </div>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="活动标题" prop="title">
                <el-input v-model="form.title" placeholder="请输入活动标题" maxlength="50" show-word-limit />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="活动类型" prop="type">
                <el-select v-model="form.type" placeholder="请选择活动类型" style="width: 100%">
                  <el-option v-for="t in activityTypes" :key="t.value" :label="t.label" :value="t.value" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="活动地点" prop="location">
                <el-input v-model="form.location" placeholder="请输入活动地点" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="活动价格" prop="price">
                <el-input-number v-model="form.price" :min="0" :precision="2" :step="10" style="width: 100%">
                  <template #prepend>¥</template>
                </el-input-number>
                <span class="form-hint">0 表示免费</span>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="开始时间" prop="startTime">
                <el-date-picker
                  v-model="form.startTime"
                  type="datetime"
                  placeholder="选择开始时间"
                  value-format="YYYY-MM-DDTHH:mm:ss"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="结束时间" prop="endTime">
                <el-date-picker
                  v-model="form.endTime"
                  type="datetime"
                  placeholder="选择结束时间"
                  value-format="YYYY-MM-DDTHH:mm:ss"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="最大人数" prop="maxParticipants">
            <el-input-number v-model="form.maxParticipants" :min="1" :step="10" style="width: 200px" />
            <span class="form-hint">参与人数上限</span>
          </el-form-item>
        </div>

        <!-- 封面与图片 -->
        <div class="form-section">
          <div class="section-title">
            <span class="title-bar"></span>
            封面与图片
          </div>
          <el-form-item label="封面图" prop="coverImage">
            <div class="cover-upload-box">
              <el-upload
                class="cover-uploader"
                :show-file-list="false"
                :http-request="uploadCover"
                accept="image/*"
              >
                <img v-if="form.coverImage" :src="form.coverImage" class="cover-preview" />
                <div v-else class="cover-placeholder">
                  <el-icon :size="28"><Plus /></el-icon>
                  <span>点击上传封面</span>
                </div>
              </el-upload>
              <div class="upload-tip">建议尺寸 750×420，支持 JPG/PNG，大小不超过 5MB</div>
            </div>
          </el-form-item>

          <el-form-item label="活动图片">
            <el-upload
              class="images-uploader"
              :http-request="uploadImage"
              :file-list="imageFileList"
              list-type="picture-card"
              accept="image/*"
              :on-remove="removeImage"
              multiple
            >
              <div class="image-upload-placeholder">
                <el-icon :size="20"><Plus /></el-icon>
              </div>
            </el-upload>
            <div class="upload-tip">最多上传 9 张活动图片</div>
          </el-form-item>
        </div>

        <!-- 活动详情（富文本） -->
        <div class="form-section">
          <div class="section-title">
            <span class="title-bar"></span>
            活动详情
          </div>
          <el-form-item label="活动描述" prop="description" label-width="0">
            <div class="rich-editor-wrapper">
              <RichTextEditor
                v-model="form.description"
                height="500px"
                placeholder="请输入活动详情内容，支持富文本格式、图片插入等..."
              />
            </div>
          </el-form-item>
        </div>

        <!-- 操作按钮 -->
        <div class="form-actions">
          <el-button @click="$router.back()">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">{{ isEdit ? '保存修改' : '发布活动' }}</el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type UploadRequestOptions } from 'element-plus'
import { ArrowLeft, Plus } from '@element-plus/icons-vue'
import request from '@/api/request'
import RichTextEditor from '@/components/RichTextEditor.vue'
import { compressImage } from '@/utils/imageCompress'

const router = useRouter()
const route = useRoute()
const formRef = ref<FormInstance>()
const submitting = ref(false)
const pageLoading = ref(false)
const imageFileList = ref<any[]>([])
const activityTypes = ref<{ value: string; label: string }[]>([])

const editingId = computed(() => route.query.id ? Number(route.query.id) : null)
const isEdit = computed(() => !!editingId.value)

const form = reactive({
  title: '',
  coverImage: '',
  description: '',
  type: '',
  price: 0,
  location: '',
  startTime: '',
  endTime: '',
  maxParticipants: 50,
  images: [] as string[],
})

const rules = {
  title: [{ required: true, message: '请输入活动标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择活动类型', trigger: 'change' }],
  location: [{ required: true, message: '请输入活动地点', trigger: 'blur' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
  coverImage: [{ required: true, message: '请上传封面图', trigger: 'change' }],
  description: [{ required: true, message: '请输入活动详情', trigger: 'change' }],
}

// 上传封面图（大图自动压缩，减小体积）
async function uploadCover(options: UploadRequestOptions) {
  let file: File = options.file
  if (file.type.startsWith('image/')) {
    try {
      const compressed = await compressImage(file)
      if (compressed !== file) {
        file = compressed
      }
    } catch (e) {
      console.warn('[Activity] 封面压缩失败，使用原图:', e)
    }
  }
  const formData = new FormData()
  formData.append('file', file)
  try {
    const res: any = await request.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    form.coverImage = res.url.startsWith('http') ? res.url : '/api' + res.url
    ElMessage.success('封面上传成功')
    // 触发表单校验清除错误
    formRef.value?.validateField('coverImage')
  } catch (err: any) {
    ElMessage.error(err.message || '上传失败')
  }
}

// 上传活动图片（大图自动压缩，减小体积）
async function uploadImage(options: UploadRequestOptions) {
  let file: File = options.file
  if (file.type.startsWith('image/')) {
    try {
      const compressed = await compressImage(file)
      if (compressed !== file) {
        file = compressed
      }
    } catch (e) {
      console.warn('[Activity] 图片压缩失败，使用原图:', e)
    }
  }
  const formData = new FormData()
  formData.append('file', file)
  try {
    const res: any = await request.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    const fullUrl = res.url.startsWith('http') ? res.url : '/api' + res.url
    form.images.push(fullUrl)
    imageFileList.value.push({
      name: res.originalName || file.name,
      url: fullUrl,
    })
    ElMessage.success('图片上传成功')
  } catch (err: any) {
    ElMessage.error(err.message || '上传失败')
  }
}

// 移除活动图片
function removeImage(file: any) {
  const idx = imageFileList.value.findIndex((f) => f.url === file.url)
  if (idx >= 0) {
    imageFileList.value.splice(idx, 1)
    form.images.splice(idx, 1)
  }
}

// 加载活动详情（编辑模式）
async function loadDetail() {
  if (!editingId.value) return
  pageLoading.value = true
  try {
    const data: any = await request.get(`/admin/activities/${editingId.value}`)
    Object.assign(form, {
      title: data.title || '',
      coverImage: data.coverImage || '',
      description: data.description || '',
      type: data.type && !['free', 'paid'].includes(data.type) ? data.type : '',
      price: data.price ?? 0,
      location: data.location || '',
      startTime: data.startTime || '',
      endTime: data.endTime || '',
      maxParticipants: data.maxParticipants || 50,
      images: [],
    })
    if (data.images) {
      try {
        const arr = typeof data.images === 'string' ? JSON.parse(data.images) : data.images
        form.images = Array.isArray(arr) ? arr : []
      } catch { form.images = [] }
    }
    imageFileList.value = form.images.map((url: string, idx: number) => ({ name: `图片${idx + 1}`, url }))
  } catch (err: any) {
    ElMessage.error(err.message || '加载失败')
  } finally {
    pageLoading.value = false
  }
}

// 提交表单
async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    if (new Date(form.endTime).getTime() <= new Date(form.startTime).getTime()) {
      ElMessage.error('结束时间必须晚于开始时间')
      return
    }
    submitting.value = true
    try {
      const payload = {
        title: form.title,
        coverImage: form.coverImage,
        description: form.description,
        type: form.type,
        price: form.price,
        location: form.location,
        startTime: form.startTime,
        endTime: form.endTime,
        maxParticipants: form.maxParticipants,
        images: JSON.stringify(form.images),
      }
      if (isEdit.value) {
        await request.put(`/admin/activities/${editingId.value}`, payload)
        ElMessage.success('活动更新成功')
      } else {
        await request.post('/admin/activities', payload)
        ElMessage.success('活动发布成功')
      }
      router.push('/activities')
    } catch (err: any) {
      ElMessage.error(err.message || (isEdit.value ? '更新失败' : '发布失败'))
    } finally {
      submitting.value = false
    }
  })
}

onMounted(async () => {
  // 活动分类统一从后端获取，与移动端保持同一数据源
  try {
    const data: any = await request.get('/public/activity-types')
    activityTypes.value = Array.isArray(data) ? data : []
  } catch {
    activityTypes.value = []
  }
  loadDetail()
})
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
.header-left { display: flex; align-items: center; gap: 12px; }
.page-title { font-size: 16px; font-weight: 600; color: #1f2937; }

.create-form { padding: 8px 16px 16px; }

.form-section {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px dashed #e5e7eb;
}
.form-section:last-of-type { border-bottom: none; }

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 20px;
}
.title-bar {
  width: 3px;
  height: 14px;
  background: linear-gradient(180deg, #3b82f6 0%, #8b5cf6 100%);
  border-radius: 2px;
}

.form-hint {
  margin-left: 12px;
  font-size: 12px;
  color: #9ca3af;
}

/* 封面上传 */
.cover-upload-box { display: flex; align-items: flex-start; gap: 16px; }
.cover-uploader {
  width: 200px;
  height: 112px;
  border: 1px dashed #dcdfe6;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s;
}
.cover-uploader:hover { border-color: #409eff; }
.cover-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #9ca3af;
  font-size: 13px;
}
.upload-tip {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 8px;
}

/* 图片上传 */
.images-uploader :deep(.el-upload--picture-card) {
  width: 100px;
  height: 100px;
  border-radius: 8px;
}
.images-uploader :deep(.el-upload-list__item) {
  width: 100px;
  height: 100px;
  border-radius: 8px;
}
.image-upload-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
}

/* 富文本编辑器 */
.rich-editor-wrapper {
  width: 100%;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}
</style>
