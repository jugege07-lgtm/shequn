<template>
  <div class="activity-detail-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <el-button :icon="ArrowLeft" @click="$router.back()">返回</el-button>
          <span class="page-title">活动详情</span>
          <el-button type="primary" @click="showEditDialog = true">编辑活动</el-button>
        </div>
      </template>

      <div v-loading="loading" class="detail-content">
        <div v-if="activity" class="detail-info">
          <div class="info-row">
            <span class="label">活动标题</span>
            <span class="value">{{ activity.title }}</span>
          </div>
          <div class="info-row">
            <span class="label">发布者</span>
            <span class="value">{{ activity.publisher?.nickname || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">类型</span>
            <span class="value">{{ activity.type || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">费用</span>
            <span class="value">
              <el-tag :type="(activity.price || 0) > 0 ? 'warning' : 'success'" size="small">
                {{ (activity.price || 0) > 0 ? '付费' : '免费' }}
              </el-tag>
            </span>
          </div>
          <div class="info-row">
            <span class="label">地点</span>
            <span class="value">{{ activity.location || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">时间</span>
            <span class="value">{{ formatDate(activity.startTime) }} ~ {{ formatDate(activity.endTime) }}</span>
          </div>
          <div class="info-row">
            <span class="label">报名人数</span>
            <span class="value">{{ activity.signupCount || 0 }} / {{ activity.maxParticipants || '不限' }}</span>
          </div>
          <div class="info-row">
            <span class="label">价格</span>
            <span class="value">{{ activity.price > 0 ? '¥' + activity.price : '免费' }}</span>
          </div>
          <div class="info-row">
            <span class="label">状态</span>
            <span class="value">
              <el-tag :type="getStatusType(activity.status)" size="small">{{ getStatusText(activity.status) }}</el-tag>
            </span>
          </div>
          <div class="info-row" v-if="activity.rejectReason">
            <span class="label">拒绝原因</span>
            <span class="value" style="color: #f56c6c;">{{ activity.rejectReason }}</span>
          </div>
          <div class="info-row">
            <span class="label">活动描述</span>
            <span class="value description-rich" v-html="activity.description"></span>
          </div>
          <div class="info-row">
            <span class="label">活动图片</span>
            <span class="value">
              <div class="image-grid">
                <img v-for="(img, i) in imageList" :key="i" :src="img" class="detail-img" @click="previewImage(img)" />
              </div>
            </span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- Edit Dialog -->
    <el-dialog v-model="showEditDialog" :title="editingId ? '编辑活动' : '新增活动'" width="700px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="标题"><el-input v-model="editForm.title" /></el-form-item>
        <el-form-item label="描述"><RichTextEditor v-model="editForm.description" height="300px" /></el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="editForm.type">
            <el-radio value="free">免费</el-radio>
            <el-radio value="paid">付费</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="价格"><el-input-number v-model="editForm.price" :min="0" :precision="2" /></el-form-item>
        <el-form-item label="地点"><el-input v-model="editForm.location" /></el-form-item>
        <el-form-item label="开始时间"><el-date-picker v-model="editForm.startTime" type="datetime" /></el-form-item>
        <el-form-item label="结束时间"><el-date-picker v-model="editForm.endTime" type="datetime" /></el-form-item>
        <el-form-item label="最大人数"><el-input-number v-model="editForm.maxParticipants" :min="0" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="saveActivity">保存</el-button>
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
const activity = ref<any>(null)
const showEditDialog = ref(false)
const editingId = ref<number | null>(null)
const previewVisible = ref(false)
const previewSrc = ref('')

const editForm = ref({
  title: '', description: '', type: 'free', price: 0,
  location: '', startTime: '', endTime: '', maxParticipants: 0,
})

const getStatusType = (s: string) => ({ pending: 'warning', approved: 'success', rejected: 'danger', offline: 'info', ended: 'info' }[s] || 'info')
const getStatusText = (s: string) => ({ pending: '待审核', approved: '已发布', rejected: '已拒绝', offline: '已下架', ended: '已结束' }[s] || s)
const formatDate = (d: string) => d ? new Date(d).toLocaleString('zh-CN') : '-'

const imageList = ref<string[]>([])

function parseImages(html: string): string[] {
  if (!html) return []
  const regex = /<img[^>]+src="([^"]+)"/gi
  const urls: string[] = []
  let match
  while ((match = regex.exec(html)) !== null) {
    urls.push(match[1])
  }
  return urls
}

async function loadDetail() {
  const id = Number(route.params.id)
  if (!id) return
  loading.value = true
  try {
    const data: any = await request.get(`/admin/activities/${id}`)
    activity.value = data
    editingId.value = id
    editForm.value = {
      title: data.title || '',
      description: data.description || '',
      type: data.type || 'free',
      price: data.price || 0,
      location: data.location || '',
      startTime: data.startTime || '',
      endTime: data.endTime || '',
      maxParticipants: data.maxParticipants || 0,
    }
    imageList.value = parseImages(data.description || '')
  } catch (err: any) {
    ElMessage.error(err.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function saveActivity() {
  try {
    const payload = { ...editForm.value }
    await request.put(`/admin/activities/${editingId.value}`, payload)
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
.image-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.detail-img { width: 120px; height: 120px; object-fit: cover; border-radius: 8px; cursor: pointer; transition: transform 0.2s; }
.detail-img:hover { transform: scale(1.05); }
</style>
