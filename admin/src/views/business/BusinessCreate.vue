<template>
  <div class="business-create-page">
    <el-card v-loading="pageLoading">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-button :icon="ArrowLeft" @click="$router.back()" text>返回</el-button>
            <span class="page-title">{{ isEdit ? '编辑商机' : '新增商机' }}</span>
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
              <el-form-item label="商机标题" prop="title">
                <el-input v-model="form.title" placeholder="请输入商机标题" maxlength="50" show-word-limit />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="商机分类" prop="categoryId">
                <el-select v-model="form.categoryId" placeholder="请选择商机分类" style="width: 100%" :loading="catLoading">
                  <el-option
                    v-for="cat in categories"
                    :key="cat.id"
                    :label="cat.name"
                    :value="cat.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 联系人信息 -->
        <div class="form-section">
          <div class="section-title">
            <span class="title-bar"></span>
            联系人信息
          </div>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="联系人" prop="contactName">
                <el-input v-model="form.contactName" placeholder="请输入联系人姓名" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="联系电话" prop="contactPhone">
                <el-input v-model="form.contactPhone" placeholder="请输入联系电话" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="微信号" prop="contactWechat">
                <el-input v-model="form.contactWechat" placeholder="请输入微信号" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 解锁设置 -->
        <div class="form-section">
          <div class="section-title">
            <span class="title-bar"></span>
            解锁设置
          </div>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="解锁费用" prop="unlockFee">
                <el-input-number v-model="form.unlockFee" :min="0" :precision="2" :step="1" style="width: 100%">
                  <template #prepend>¥</template>
                </el-input-number>
                <span class="form-hint">0 表示免费查看</span>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="最大解锁数" prop="maxUnlocks">
                <el-input-number v-model="form.maxUnlocks" :min="1" :step="1" style="width: 100%" />
                <span class="form-hint">可被解锁的次数上限</span>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 封面图 -->
        <div class="form-section">
          <div class="section-title">
            <span class="title-bar"></span>
            封面图
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
        </div>

        <!-- 商机详情（富文本） -->
        <div class="form-section">
          <div class="section-title">
            <span class="title-bar"></span>
            商机详情
          </div>
          <el-form-item label="商机描述" prop="description" label-width="0">
            <div class="rich-editor-wrapper">
              <RichTextEditor
                v-model="form.description"
                height="500px"
                placeholder="请输入商机详情内容，支持富文本格式、图片插入等..."
              />
            </div>
          </el-form-item>
        </div>

        <!-- 操作按钮 -->
        <div class="form-actions">
          <el-button @click="$router.back()">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">{{ isEdit ? '保存修改' : '发布商机' }}</el-button>
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

const router = useRouter()
const route = useRoute()
const formRef = ref<FormInstance>()
const submitting = ref(false)
const pageLoading = ref(false)
const catLoading = ref(false)
const categories = ref<any[]>([])

const editingId = computed(() => route.query.id ? Number(route.query.id) : null)
const isEdit = computed(() => !!editingId.value)

const form = reactive({
  title: '',
  coverImage: '',
  description: '',
  categoryId: undefined as number | undefined,
  contactName: '',
  contactPhone: '',
  contactWechat: '',
  unlockFee: 0,
  maxUnlocks: 3,
})

const rules = {
  title: [{ required: true, message: '请输入商机标题', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择商机分类', trigger: 'change' }],
  contactName: [{ required: true, message: '请输入联系人姓名', trigger: 'blur' }],
  coverImage: [{ required: true, message: '请上传封面图', trigger: 'change' }],
  description: [{ required: true, message: '请输入商机详情', trigger: 'change' }],
}

// 加载商机分类
async function loadCategories() {
  catLoading.value = true
  try {
    const res: any = await request.get('/admin/business-categories')
    categories.value = Array.isArray(res) ? res : (res?.list || [])
  } catch (err: any) {
    ElMessage.error(err.message || '加载分类失败')
  } finally {
    catLoading.value = false
  }
}

// 上传封面图
async function uploadCover(options: UploadRequestOptions) {
  const formData = new FormData()
  formData.append('file', options.file)
  try {
    const res: any = await request.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    form.coverImage = res.url.startsWith('http') ? res.url : '/api' + res.url
    ElMessage.success('封面上传成功')
    formRef.value?.validateField('coverImage')
  } catch (err: any) {
    ElMessage.error(err.message || '上传失败')
  }
}

// 加载商机详情（编辑模式）
async function loadDetail() {
  if (!editingId.value) return
  pageLoading.value = true
  try {
    const data: any = await request.get(`/admin/businesses/${editingId.value}`)
    Object.assign(form, {
      title: data.title || '',
      coverImage: data.coverImage || '',
      description: data.description || '',
      categoryId: data.categoryId || undefined,
      contactName: data.contactName || '',
      contactPhone: data.contactPhone || '',
      contactWechat: data.contactWechat || '',
      unlockFee: data.unlockFee ?? 0,
      maxUnlocks: data.maxUnlocks || 3,
    })
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
    submitting.value = true
    try {
      const payload = {
        title: form.title,
        coverImage: form.coverImage,
        description: form.description,
        categoryId: form.categoryId,
        contactName: form.contactName,
        contactPhone: form.contactPhone,
        contactWechat: form.contactWechat,
        unlockFee: form.unlockFee,
        maxUnlocks: form.maxUnlocks,
      }
      if (isEdit.value) {
        await request.put(`/admin/businesses/${editingId.value}`, payload)
        ElMessage.success('商机更新成功')
      } else {
        await request.post('/admin/businesses', payload)
        ElMessage.success('商机发布成功')
      }
      router.push('/businesses')
    } catch (err: any) {
      ElMessage.error(err.message || (isEdit.value ? '更新失败' : '发布失败'))
    } finally {
      submitting.value = false
    }
  })
}

onMounted(() => {
  loadCategories()
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
