<template>
  <div class="activity-list-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>活动管理</span>
          <div class="header-actions">
            <el-popconfirm title="确定清空所有活动报名数据？报名记录将被删除，活动仍保留。" @confirm="clearAllSignups">
              <template #reference>
                <el-button type="danger" size="small">清空报名</el-button>
              </template>
            </el-popconfirm>
            <el-button type="primary" @click="$router.push('/activities/create')">新增活动</el-button>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab" @tab-change="() => { page = 1; fetchActivities(); }">
        <el-tab-pane label="全部" name="" />
        <el-tab-pane label="待审核" name="pending" />
        <el-tab-pane label="已发布" name="approved" />
        <el-tab-pane label="已拒绝" name="rejected" />
        <el-tab-pane label="已结束" name="ended" />
      </el-tabs>

      <el-table :data="activities" stripe v-loading="loading" empty-text="暂无活动数据">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="title" label="活动标题" min-width="200" show-overflow-tooltip />
        <el-table-column label="发布者" width="100">
          <template #default="{ row }">
            <span :title="row.publisher?.id ? `用户ID:${row.publisher.id}` : ''">
              {{ (row.publisher?.nickname && !row.publisher.nickname.includes('?')) ? row.publisher.nickname : (row.publisher?.id ? `用户${row.publisher.id}` : '-') }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="费用" width="70">
          <template #default="{ row }">
            <el-tag :type="(row.price || 0) > 0 ? 'warning' : 'success'" size="small">
              {{ (row.price || 0) > 0 ? '付费' : '免费' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="地点" width="140" show-overflow-tooltip />
        <el-table-column label="时间" width="180">
          <template #default="{ row }">{{ formatDate(row.startTime) }}</template>
        </el-table-column>
        <el-table-column label="报名" width="90">
          <template #default="{ row }">
            {{ row.signupCount || 0 }}/{{ row.maxParticipants || '∞' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="420" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="success" v-if="row.status === 'pending'" @click="approve(row.id)">通过</el-button>
            <el-button size="small" type="danger" v-if="row.status === 'pending'" @click="showRejectDialog(row)">拒绝</el-button>
            <el-button size="small" @click="viewDetail(row.id)">详情</el-button>
            <el-button size="small" type="primary" @click="$router.push(`/activities/create?id=${row.id}`)">编辑</el-button>
            <el-button size="small" type="info" @click="toggleStatus(row)">
              {{ row.status === 'approved' ? '下架' : '上架' }}
            </el-button>
            <el-button size="small" type="warning" @click="clearSingleSignup(row.id)">清报名</el-button>
            <el-button size="small" @click="exportSignups(row.id, row.title)">导出报名</el-button>
            <el-button size="small" type="success" plain @click="showQrCode(row)">核销码</el-button>
            <el-button size="small" type="danger" @click="deleteActivity(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        style="margin-top: 20px; justify-content: center; display: flex;"
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="fetchActivities"
      />
    </el-card>

    <!-- Reject Dialog -->
    <el-dialog v-model="rejectVisible" title="拒绝活动" width="400px">
      <el-input v-model="rejectReason" type="textarea" :rows="3" placeholder="请输入拒绝原因" />
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" @click="doReject">确认拒绝</el-button>
      </template>
    </el-dialog>

    <!-- QR Code Dialog -->
    <el-dialog v-model="qrVisible" title="活动核销二维码" width="360px" align-center>
      <div style="text-align: center;">
        <img v-if="qrDataUrl" :src="qrDataUrl" style="width: 280px; height: 280px;" />
        <p style="color: #909399; font-size: 12px; margin-top: 8px;">扫码即可完成活动核销</p>
      </div>
      <template #footer>
        <el-button @click="qrVisible = false">关闭</el-button>
        <el-button type="primary" @click="downloadQr">下载二维码</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/api/request'

const router = useRouter()
const activeTab = ref('')
const activities = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const rejectVisible = ref(false)
const rejectReason = ref('')
const rejectId = ref(0)
const qrVisible = ref(false)
const qrDataUrl = ref('')
const qrFilename = ref('核销二维码.png')

const getStatusType = (s: string) => ({ pending: 'warning', approved: 'success', rejected: 'danger', offline: 'info', ended: 'info' }[s] || 'info')
const getStatusText = (s: string) => ({ pending: '待审核', approved: '已发布', rejected: '已拒绝', offline: '已下架', ended: '已结束' }[s] || s)
const formatDate = (d: string) => d ? new Date(d).toLocaleString('zh-CN') : '-'

async function fetchActivities() {
  loading.value = true
  try {
    const data: any = await request.get('/admin/activities', {
      params: { page: page.value, size: pageSize.value, status: activeTab.value }
    })
    activities.value = data?.list || []
    total.value = data?.total || 0
  } catch (err: any) {
    ElMessage.error(err.message || '加载失败')
    activities.value = []
  } finally {
    loading.value = false
  }
}

async function approve(id: number) {
  try {
    await request.put(`/admin/activities/${id}/approve`)
    ElMessage.success('已通过')
    fetchActivities()
  } catch (err: any) {
    ElMessage.error(err.message || '操作失败')
  }
}

function showRejectDialog(row: any) {
  rejectId.value = row.id
  rejectReason.value = ''
  rejectVisible.value = true
}

async function doReject() {
  try {
    await request.put(`/admin/activities/${rejectId.value}/reject`, { reason: rejectReason.value })
    ElMessage.success('已拒绝')
    rejectVisible.value = false
    fetchActivities()
  } catch (err: any) {
    ElMessage.error(err.message || '操作失败')
  }
}

function viewDetail(id: number) {
  router.push(`/activities/detail/${id}`)
}

async function toggleStatus(row: any) {
  const newStatus = row.status === 'approved' ? 'offline' : 'approved'
  try {
    await ElMessageBox.confirm(`确定${newStatus === 'offline' ? '下架' : '上架'}该活动？`, '提示', { type: 'warning' })
    if (newStatus === 'offline') {
      await request.put(`/admin/activities/${row.id}/reject`, { reason: '手动下架' })
    } else {
      await request.put(`/admin/activities/${row.id}/approve`)
    }
    ElMessage.success('操作成功')
    fetchActivities()
  } catch {}
}

async function clearSingleSignup(id: number) {
  try {
    await ElMessageBox.confirm('确定清空该活动的所有报名数据？', '提示', { type: 'warning' })
    // 删除该活动的所有报名记录
    await request.delete(`/admin/activities/${id}/signups`)
    // 重置 signupCount
    await request.put(`/admin/activities/${id}`, { signupCount: 0 })
    ElMessage.success('报名数据已清空')
    fetchActivities()
  } catch {}
}

async function deleteActivity(id: number) {
  try {
    await ElMessageBox.confirm('确定删除该活动及其所有报名数据？此操作不可恢复。', '提示', { type: 'warning' })
    await request.delete(`/admin/activities/${id}`)
    ElMessage.success('已删除')
    fetchActivities()
  } catch {}
}

async function clearAllSignups() {
  try {
    await ElMessageBox.confirm('确定清空所有活动的报名数据？所有报名记录将被永久删除。', '警告', { type: 'error' })
    await request.post('/admin/activities/clear-signups')
    ElMessage.success('所有报名数据已清空')
    fetchActivities()
  } catch {}
}

async function exportSignups(id: number, title: string) {
  try {
    const res: any = await request.get(`/admin/activities/${id}/signups/export`)
    const content = res?.content || ''
    const filename = res?.filename || `${title}_报名人员.csv`
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
    ElMessage.success('导出成功')
  } catch (err: any) {
    ElMessage.error(err.message || '导出失败')
  }
}

async function showQrCode(row: any) {
  try {
    const res: any = await request.get(`/admin/activities/${row.id}/qrcode`)
    qrDataUrl.value = res?.qrDataUrl || ''
    qrFilename.value = res?.filename || `${row.title}_核销二维码.png`
    qrVisible.value = true
  } catch (err: any) {
    ElMessage.error(err.message || '二维码生成失败')
  }
}

function downloadQr() {
  if (!qrDataUrl.value) return
  const link = document.createElement('a')
  link.href = qrDataUrl.value
  link.download = qrFilename.value
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  ElMessage.success('二维码已下载')
}

onMounted(fetchActivities)
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
.header-actions { display: flex; gap: 8px; }
</style>
