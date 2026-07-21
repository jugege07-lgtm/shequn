<template>
  <div class="business-detail-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <el-button :icon="ArrowLeft" @click="$router.back()">返回</el-button>
          <span class="page-title">商机详情</span>
          <el-button type="primary" @click="showEditDialog = true">编辑商机</el-button>
        </div>
      </template>

      <div v-loading="loading" class="detail-content">
        <div v-if="business" class="detail-info">
          <div class="info-row">
            <span class="label">商机标题</span>
            <span class="value">{{ business.title }}</span>
          </div>
          <div class="info-row">
            <span class="label">发布者</span>
            <span class="value">{{ business.publisher?.nickname || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">联系人</span>
            <span class="value">{{ business.contactName || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">电话</span>
            <span class="value">{{ business.contactPhone || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">微信</span>
            <span class="value">{{ business.contactWechat || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">解锁费用</span>
            <span class="value">¥{{ business.unlockFee || 0 }}</span>
          </div>
          <div class="info-row">
            <span class="label">已解锁</span>
            <span class="value">{{ business.currentUnlocks }} / {{ business.maxUnlocks }}</span>
          </div>
          <div class="info-row">
            <span class="label">状态</span>
            <span class="value">
              <el-tag :type="getStatusType(business.status)" size="small">{{ getStatusText(business.status) }}</el-tag>
            </span>
          </div>
          <div class="info-row" v-if="business.rejectReason">
            <span class="label">拒绝原因</span>
            <span class="value" style="color: #f56c6c;">{{ business.rejectReason }}</span>
          </div>
          <div class="info-row">
            <span class="label">商机描述</span>
            <span class="value description-rich" v-html="business.description"></span>
          </div>
          <div class="info-row">
            <span class="label">封面图</span>
            <span class="value">
              <img v-if="business.coverImage" :src="normalizeUrl(business.coverImage)" class="cover-img" @click="previewImage(normalizeUrl(business.coverImage))" />
            </span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- Edit Dialog -->
    <el-dialog v-model="showEditDialog" :title="editingId ? '编辑商机' : '新增商机'" width="700px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="标题"><el-input v-model="editForm.title" /></el-form-item>
        <el-form-item label="描述"><RichTextEditor v-model="editForm.description" height="300px" /></el-form-item>
        <el-form-item label="分类ID"><el-input-number v-model="editForm.categoryId" :min="0" /></el-form-item>
        <el-form-item label="联系人"><el-input v-model="editForm.contactName" /></el-form-item>
        <el-form-item label="电话"><el-input v-model="editForm.contactPhone" /></el-form-item>
        <el-form-item label="微信"><el-input v-model="editForm.contactWechat" /></el-form-item>
        <el-form-item label="解锁费"><el-input-number v-model="editForm.unlockFee" :min="0" /></el-form-item>
        <el-form-item label="最大解锁"><el-input-number v-model="editForm.maxUnlocks" :min="1" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="saveBusiness">保存</el-button>
      </template>
    </el-dialog>

    <!-- Image Preview -->
    <el-dialog v-model="previewVisible" width="800px">
      <img :src="previewSrc" style="width: 100%;" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import request from '@/api/request'
import RichTextEditor from '@/components/RichTextEditor.vue'

const route = useRoute()
const loading = ref(false)
const business = ref<any>(null)
const showEditDialog = ref(false)
const editingId = ref<number | null>(null)
const previewVisible = ref(false)
const previewSrc = ref('')

const editForm = ref({
  title: '', description: '', categoryId: 0,
  contactName: '', contactPhone: '', contactWechat: '',
  unlockFee: 0, maxUnlocks: 3,
})

const getStatusType = (s: string) => ({ pending: 'warning', approved: 'success', rejected: 'danger', offline: 'info' }[s] || 'info')
const getStatusText = (s: string) => ({ pending: '待审核', approved: '已通过', rejected: '已拒绝', offline: '已下架' }[s] || s)

function normalizeUrl(url: string): string {
  if (!url) return ''
  if (url.startsWith('http')) return url
  if (url.startsWith('/api')) return url
  return '/api' + url
}

async function loadDetail() {
  const id = Number(route.params.id)
  if (!id) return
  loading.value = true
  try {
    const data: any = await request.get(`/admin/businesses/${id}`)
    business.value = data
    editingId.value = id
    editForm.value = {
      title: data.title || '',
      description: data.description || '',
      categoryId: data.categoryId || 0,
      contactName: data.contactName || '',
      contactPhone: data.contactPhone || '',
      contactWechat: data.contactWechat || '',
      unlockFee: data.unlockFee || 0,
      maxUnlocks: data.maxUnlocks || 3,
    }
  } catch (err: any) {
    ElMessage.error(err.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function saveBusiness() {
  try {
    const payload = { ...editForm.value }
    await request.put(`/admin/businesses/${editingId.value}`, payload)
    ElMessage.success('更新成功')
    showEditDialog.value = false
    loadDetail()
  } catch (err: any) {
    ElMessage.error(err.message || '保存失败')
  }
}

function previewImage(src: string) {
  previewSrc.value = src
  previewVisible.value = true
}

onMounted(loadDetail)
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
.page-title { font-size: 16px; font-weight: 600; color: #1f2937; margin: 0 16px; }
.detail-content { padding: 20px; }
.detail-info { max-width: 800px; }
.info-row {
  display: flex; padding: 12px 0; border-bottom: 1px solid #f0f0f0;
  align-items: flex-start;
}
.info-row:last-child { border-bottom: none; }
.label { width: 100px; flex-shrink: 0; font-weight: 600; color: #6b7280; font-size: 14px; }
.value { flex: 1; font-size: 14px; color: #1f2937; word-break: break-all; }
.description-rich { line-height: 1.8; }
.description-rich :deep(img) { max-width: 100%; height: auto; border-radius: 4px; margin: 4px 0; cursor: pointer; }
.cover-img { width: 300px; height: 200px; object-fit: cover; border-radius: 8px; cursor: pointer; }
</style>
