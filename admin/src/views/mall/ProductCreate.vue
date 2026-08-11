<template>
  <div class="product-create-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-button :icon="ArrowLeft" @click="$router.back()" text>返回</el-button>
            <span class="page-title">{{ pageTitle }}</span>
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
        v-loading="pageLoading || submitting"
      >
        <!-- 基本信息 -->
        <div class="form-section">
          <div class="section-title">
            <span class="title-bar"></span>
            基本信息
          </div>
          <el-form-item label="商品名称" prop="name">
            <el-input v-model="form.name" placeholder="请输入商品名称" maxlength="50" show-word-limit />
          </el-form-item>

          <el-form-item label="商品分类" prop="categoryId">
            <el-select v-model="form.categoryId" placeholder="请选择商品分类" style="width: 100%" clearable>
              <el-option
                v-for="cat in categories"
                :key="cat.id"
                :label="cat.name"
                :value="cat.id"
              />
            </el-select>
          </el-form-item>

          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="价格" prop="price">
                <el-input-number v-model="form.price" :min="0" :precision="2" :step="1" style="width: 100%">
                  <template #prepend>¥</template>
                </el-input-number>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="VIP价格">
                <el-input-number v-model="form.vipPrice" :min="0" :precision="2" :step="1" style="width: 100%">
                  <template #prepend>¥</template>
                </el-input-number>
                <span class="form-hint">0 表示无 VIP 价</span>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="库存" prop="stock">
                <el-input-number v-model="form.stock" :min="0" :step="1" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 商品首图 -->
        <div class="form-section">
          <div class="section-title">
            <span class="title-bar"></span>
            商品首图
          </div>
          <el-form-item label="首图" prop="coverImage">
            <div class="cover-upload-box">
              <el-upload
                class="cover-uploader"
                :show-file-list="false"
                :before-upload="beforeCoverUpload"
                :http-request="uploadCover"
                accept="image/jpg,image/jpeg,image/png,image/webp"
              >
                <img v-if="form.coverImage" :src="form.coverImage" class="cover-preview" />
                <div v-else class="cover-placeholder">
                  <el-icon :size="28"><Plus /></el-icon>
                  <span>点击上传首图</span>
                </div>
              </el-upload>
              <div class="upload-tip">
                <div>支持 JPG / PNG / WebP 格式</div>
                <div>大小不超过 {{ maxSizeMB }}MB,建议尺寸 800×800</div>
              </div>
            </div>
          </el-form-item>
        </div>

        <!-- 积分购买配置 -->
        <div class="form-section">
          <div class="section-title">
            <span class="title-bar"></span>
            积分购买配置
          </div>

          <!-- 纯积分兑换 -->
          <div class="points-block">
            <div class="block-header">
              <el-switch
                v-model="form.pointsEnabled"
                :active-value="1"
                :inactive-value="0"
                @change="onPointsModeChange"
              />
              <span class="block-label">纯积分兑换</span>
              <span class="form-hint">开启后，用户可用积分直接兑换该商品，无需现金</span>
            </div>
            <template v-if="form.pointsEnabled === 1">
              <el-row :gutter="20" class="block-body">
                <el-col :span="8">
                  <el-form-item label="兑换积分" :prop="'pointsPrice'" label-width="90px">
                    <el-input-number v-model="form.pointsPrice" :min="1" :step="10" style="width: 100%" />
                    <span class="form-hint block-hint">每件所需积分</span>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="单笔上限" label-width="90px">
                    <el-input-number v-model="form.pointsMaxLimit" :min="0" :step="100" style="width: 100%" />
                    <span class="form-hint block-hint">0 = 不限（单笔最多使用积分）</span>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <div class="stock-note">
                    <el-icon :size="14" color="#f59e0b"><Warning /></el-icon>
                    <span>库存联动：兑换成功会同步扣减商品库存，库存不足自动拦截</span>
                  </div>
                </el-col>
              </el-row>
            </template>
          </div>

          <!-- 积分+现金组合支付 -->
          <div class="points-block">
            <div class="block-header">
              <el-switch
                :model-value="form.pointsEnabled === 2"
                @change="(v: boolean) => onComboSwitch(v)"
              />
              <span class="block-label">积分 + 现金组合支付</span>
              <span class="form-hint">开启后，用户可用积分抵扣部分现金</span>
            </div>
            <template v-if="form.pointsEnabled === 2">
              <el-form-item label="抵扣模式" label-width="120px">
                <el-radio-group v-model="form.pointsDeductMode">
                  <el-radio value="fixed">固定金额抵扣</el-radio>
                  <el-radio value="ratio">按比例抵扣</el-radio>
                </el-radio-group>
                <span class="form-hint">
                  {{ form.pointsDeductMode === 'fixed' ? '如每 100 积分抵 1 元' : '积分可抵商品价格的一定比例' }}
                </span>
              </el-form-item>

              <el-row :gutter="20">
                <el-col :span="8">
                  <el-form-item label="兑换汇率" label-width="110px">
                    <el-input-number v-model="form.pointsRate" :min="1" :step="50" style="width: 100%" />
                    <span class="form-hint block-hint">N 积分抵 1 元（默认 100）</span>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="最低使用积分" label-width="110px">
                    <el-input-number v-model="form.pointsMinLimit" :min="0" :step="50" style="width: 100%" />
                    <span class="form-hint block-hint">用户至少使用多少积分</span>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="单笔最高抵扣" label-width="110px">
                    <el-input-number v-model="form.pointsMaxLimit" :min="0" :step="100" style="width: 100%" />
                    <span class="form-hint block-hint">0 = 不限（单笔最多使用积分）</span>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row v-if="form.pointsDeductMode === 'ratio'" :gutter="20">
                <el-col :span="8">
                  <el-form-item label="可抵价格比例" label-width="110px">
                    <el-input-number
                      v-model="form.pointsRatioPercent"
                      :min="0"
                      :max="100"
                      :step="5"
                      style="width: 100%"
                    />
                    <span class="form-hint block-hint">可抵商品价格的 X%（0-100）</span>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="最高抵扣金额" label-width="110px">
                    <el-input-number
                      v-model="form.pointsMaxDeduct"
                      :min="0"
                      :step="10"
                      :precision="2"
                      style="width: 100%"
                    />
                    <span class="form-hint block-hint">0 = 不限（单笔最高抵扣现金）</span>
                  </el-form-item>
                </el-col>
              </el-row>
            </template>
          </div>
        </div>

        <!-- 商品详情（富文本） -->
        <div class="form-section">
          <div class="section-title">
            <span class="title-bar"></span>
            商品详情
          </div>
          <el-form-item label="详情描述" prop="description" label-width="0">
            <div class="rich-editor-wrapper">
              <RichTextEditor
                v-model="form.description"
                height="500px"
                placeholder="请输入商品详情内容,支持文字排版、图片插入、加粗、斜体、链接、列表等富文本操作..."
              />
            </div>
          </el-form-item>
        </div>

        <!-- 上架设置 -->
        <div class="form-section">
          <div class="section-title">
            <span class="title-bar"></span>
            上架设置
          </div>
          <el-form-item label="上架状态">
            <el-switch
              v-model="form.status"
              :active-value="1"
              :inactive-value="0"
              active-text="立即上架"
              inactive-text="暂不上架"
            />
          </el-form-item>
        </div>

        <!-- 操作按钮 -->
        <div class="form-actions">
          <el-button @click="$router.back()">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            {{ isEdit ? '保存修改' : '保存商品' }}
          </el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type UploadRequestOptions } from 'element-plus'
import { ArrowLeft, Plus, Warning } from '@element-plus/icons-vue'
import request from '@/api/request'
import RichTextEditor from '@/components/RichTextEditor.vue'
import { compressImage } from '@/utils/imageCompress'

const route = useRoute()
const router = useRouter()

// 判断是否为编辑模式
const isEdit = computed(() => !!route.params.id)
const productId = computed(() => Number(route.params.id))

// 页面标题
const pageTitle = computed(() => {
  return isEdit.value ? `编辑商品（ID: ${productId.value}）` : '新增商品'
})

const formRef = ref<FormInstance>()
const pageLoading = ref(false)
const submitting = ref(false)
const maxSizeMB = 5
const categories = ref<any[]>([])

const form = reactive({
  name: '',
  coverImage: '',
  description: '',
  categoryId: undefined as number | undefined,
  price: 0,
  vipPrice: 0,
  stock: 0,
  status: 1,
  // ===== 积分购买配置 =====
  pointsEnabled: 0 as 0 | 1 | 2, // 0=关闭 1=纯积分 2=组合
  pointsPrice: 100,
  pointsMinLimit: 0,
  pointsMaxLimit: 0,
  pointsDeductMode: 'fixed',
  pointsRate: 100,
  pointsRatioPercent: 50,
  pointsMaxDeduct: 0,
})

// 纯积分开关：切换时互斥组合支付
function onPointsModeChange(v: 0 | 1 | 2) {
  if (v === 1) {
    // 打开纯积分时关闭组合
    // pointsEnabled 已由 v-model 设为 1
  }
}

// 组合支付开关（独立于纯积分）
function onComboSwitch(on: boolean) {
  form.pointsEnabled = on ? 2 : 0
}

const rules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择商品分类', trigger: 'change' }],
  price: [{ required: true, message: '请输入商品价格', trigger: 'blur' }],
  stock: [{ required: true, message: '请输入商品库存', trigger: 'blur' }],
  coverImage: [{ required: true, message: '请上传商品首图', trigger: 'change' }],
  description: [{ required: true, message: '请输入商品详情', trigger: 'change' }],
}

// 加载分类
async function loadCategories() {
  try {
    const data: any = await request.get('/admin/product-categories')
    categories.value = data || []
  } catch (err: any) {
    ElMessage.error(err.message || '加载分类失败')
  }
}

// 加载商品详情（编辑模式）
async function loadProductDetail() {
  if (!isEdit.value) return
  pageLoading.value = true
  try {
    const data: any = await request.get(`/admin/products/${productId.value}`)
    if (data) {
      form.name = data.name || ''
      form.coverImage = data.coverImage || ''
      form.description = data.description || ''
      form.categoryId = data.categoryId
      form.price = data.price ?? 0
      form.vipPrice = data.vipPrice ?? 0
      form.stock = data.stock ?? 0
      form.status = data.status ?? 1
      // 积分购买配置回填
      form.pointsEnabled = data.pointsEnabled ?? 0
      form.pointsPrice = data.pointsPrice ?? 100
      form.pointsMinLimit = data.pointsMinLimit ?? 0
      form.pointsMaxLimit = data.pointsMaxLimit ?? 0
      form.pointsDeductMode = data.pointsDeductMode ?? 'fixed'
      form.pointsRate = data.pointsRate ?? 100
      form.pointsRatioPercent = data.pointsRatioPercent ?? 50
      form.pointsMaxDeduct = data.pointsMaxDeduct ?? 0
    }
  } catch (err: any) {
    ElMessage.error(err.message || '加载商品详情失败')
    router.replace('/products')
  } finally {
    pageLoading.value = false
  }
}

// 首图上传前校验：格式 + 大小
function beforeCoverUpload(file: File): boolean {
  const allowedTypes = ['image/jpg', 'image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    ElMessage.error('首图仅支持 JPG / PNG / WebP 格式')
    return false
  }
  const maxBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxBytes) {
    ElMessage.error(`首图大小不能超过 ${maxSizeMB}MB`)
    return false
  }
  return true
}

// 上传首图（大图自动压缩，减小体积）
async function uploadCover(options: UploadRequestOptions) {
  let file: File = options.file
  if (file.type.startsWith('image/')) {
    try {
      const compressed = await compressImage(file)
      if (compressed !== file) {
        console.log(`[Product] 首图已压缩: ${(file.size / 1024).toFixed(0)}KB → ${(compressed.size / 1024).toFixed(0)}KB`)
        file = compressed
      }
    } catch (e) {
      console.warn('[Product] 首图压缩失败，使用原图:', e)
    }
  }
  const formData = new FormData()
  formData.append('file', file)
  try {
    const res: any = await request.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    // 确保 URL 格式正确：/uploads/xxx → /api/uploads/xxx
    let imgUrl = res.url
    if (imgUrl && !imgUrl.startsWith('http') && !imgUrl.startsWith('/api')) {
      imgUrl = '/api' + imgUrl
    }
    form.coverImage = imgUrl
    ElMessage.success('首图上传成功')
    formRef.value?.validateField('coverImage')
  } catch (err: any) {
    ElMessage.error(err.message || '上传失败')
  }
}

// 提交表单
async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      const payload: any = {
        name: form.name,
        coverImage: form.coverImage,
        description: form.description,
        categoryId: Number(form.categoryId),
        price: Number(form.price),
        vipPrice: Number(form.vipPrice),
        stock: Number(form.stock),
        status: form.status,
        // 积分购买配置
        pointsEnabled: form.pointsEnabled,
        pointsPrice: form.pointsEnabled === 1 ? Number(form.pointsPrice) || 0 : 0,
        pointsMinLimit: form.pointsEnabled === 2 ? Number(form.pointsMinLimit) || 0 : 0,
        pointsMaxLimit: Number(form.pointsMaxLimit) || 0,
        pointsDeductMode: form.pointsDeductMode,
        pointsRate: form.pointsEnabled === 2 ? Number(form.pointsRate) || 100 : 100,
        pointsRatioPercent: form.pointsEnabled === 2 && form.pointsDeductMode === 'ratio'
          ? Number(form.pointsRatioPercent) || 0
          : 0,
        pointsMaxDeduct: form.pointsEnabled === 2 && form.pointsDeductMode === 'ratio'
          ? Number(form.pointsMaxDeduct) || 0
          : 0,
      }
      if (isEdit.value) {
        await request.put(`/admin/products/${productId.value}`, payload)
        ElMessage.success('商品更新成功')
      } else {
        await request.post('/admin/products', payload)
        ElMessage.success('商品创建成功')
      }
      router.push('/products')
    } catch (err: any) {
      ElMessage.error(err.message || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}

onMounted(() => {
  loadCategories()
  loadProductDetail()
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

/* 积分购买配置 */
.points-block {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 16px;
  background: #fafbfc;
}
.block-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}
.block-label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}
.block-body {
  margin-top: 12px;
}
.block-hint {
  margin-left: 0;
  display: block;
  margin-top: 4px;
}
.stock-note {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #b45309;
  background: #fef3c7;
  border-radius: 6px;
  padding: 8px 10px;
  height: fit-content;
  margin-top: 2px;
}

/* 首图上传 */
.cover-upload-box { display: flex; align-items: flex-start; gap: 16px; }
.cover-uploader {
  width: 200px;
  height: 200px;
  border: 1px dashed #dcdfe6;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s;
  flex-shrink: 0;
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
  line-height: 1.8;
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
