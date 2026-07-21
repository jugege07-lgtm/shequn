<template>
  <div class="business-list-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span>商机管理</span>
            <el-select v-model="statusFilter" placeholder="状态筛选" clearable style="width: 150px" @change="fetchBusinesses">
              <el-option label="待审核" value="pending" />
              <el-option label="已通过" value="approved" />
              <el-option label="已拒绝" value="rejected" />
              <el-option label="已下架" value="offline" />
            </el-select>
          </div>
          <el-button type="primary" @click="$router.push('/businesses/create')">新增商机</el-button>
        </div>
      </template>

      <el-table :data="businesses" stripe v-loading="loading" empty-text="暂无商机数据">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="title" label="商机标题" min-width="200" show-overflow-tooltip />
        <el-table-column label="发布者" width="100">
          <template #default="{ row }">{{ row.publisher?.nickname || '-' }}</template>
        </el-table-column>
        <el-table-column prop="contactName" label="联系人" width="100" />
        <el-table-column label="解锁" width="80">
          <template #default="{ row }">{{ row.currentUnlocks }}/{{ row.maxUnlocks }}</template>
        </el-table-column>
        <el-table-column label="费用" width="80">
          <template #default="{ row }">¥{{ row.unlockFee }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="success" v-if="row.status === 'pending'" @click="approve(row.id)">通过</el-button>
            <el-button size="small" type="danger" v-if="row.status === 'pending'" @click="showRejectDialog(row)">拒绝</el-button>
            <el-button size="small" @click="viewDetail(row.id)">详情</el-button>
            <el-button size="small" type="info" @click="toggleStatus(row)">
              {{ row.status === 'approved' ? '下架' : '上架' }}
            </el-button>
            <el-button size="small" type="primary" @click="editBusiness(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteBusiness(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        style="margin-top: 20px; justify-content: center; display: flex;"
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="fetchBusinesses"
      />
    </el-card>

    <!-- Reject Dialog -->
    <el-dialog v-model="rejectVisible" title="拒绝商机" width="400px">
      <el-input v-model="rejectReason" type="textarea" :rows="3" placeholder="请输入拒绝原因" />
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" @click="doReject">确认拒绝</el-button>
      </template>
    </el-dialog>

    <!-- Detail Dialog -->
    <el-dialog v-model="detailVisible" title="商机详情" width="600px">
      <div v-if="detailData">
        <p><strong>标题：</strong>{{ detailData.title }}</p>
        <p><strong>描述：</strong>{{ detailData.description }}</p>
        <p><strong>联系人：</strong>{{ detailData.contactName }}</p>
        <p><strong>电话：</strong>{{ detailData.contactPhone || '-' }}</p>
        <p><strong>微信：</strong>{{ detailData.contactWechat || '-' }}</p>
        <p><strong>解锁费：</strong>¥{{ detailData.unlockFee }}</p>
        <p><strong>状态：</strong>{{ getStatusText(detailData.status) }}</p>
        <p v-if="detailData.rejectReason"><strong>拒绝原因：</strong>{{ detailData.rejectReason }}</p>
        <p><strong>发布者：</strong>{{ detailData.publisher?.nickname || '-' }}</p>
      </div>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/api/request'

const router = useRouter()

const statusFilter = ref('')
const businesses = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const rejectVisible = ref(false)
const rejectReason = ref('')
const rejectId = ref(0)
const detailVisible = ref(false)
const detailData = ref<any>(null)

const getStatusType = (s: string) => ({ pending: 'warning', approved: 'success', rejected: 'danger', offline: 'info' }[s] || 'info')
const getStatusText = (s: string) => ({ pending: '待审核', approved: '已通过', rejected: '已拒绝', offline: '已下架' }[s] || s)

async function fetchBusinesses() {
  loading.value = true
  try {
    const data: any = await request.get('/admin/businesses', {
      params: { page: page.value, size: pageSize.value, status: statusFilter.value || undefined }
    })
    businesses.value = data?.list || []
    total.value = data?.total || 0
  } catch (err: any) {
    ElMessage.error(err.message || '加载失败')
    businesses.value = []
  } finally {
    loading.value = false
  }
}

async function approve(id: number) {
  try {
    await request.put(`/admin/businesses/${id}/approve`)
    ElMessage.success('已通过')
    fetchBusinesses()
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
    await request.put(`/admin/businesses/${rejectId.value}/reject`, { reason: rejectReason.value })
    ElMessage.success('已拒绝')
    rejectVisible.value = false
    fetchBusinesses()
  } catch (err: any) {
    ElMessage.error(err.message || '操作失败')
  }
}

async function toggleStatus(row: any) {
  const newStatus = row.status === 'approved' ? 'offline' : 'approved'
  try {
    await ElMessageBox.confirm(`确定${newStatus === 'offline' ? '下架' : '上架'}该商机？`, '提示', { type: 'warning' })
    if (newStatus === 'offline') {
      await request.put(`/admin/businesses/${row.id}/reject`, { reason: '手动下架' })
    } else {
      await request.put(`/admin/businesses/${row.id}/approve`)
    }
    ElMessage.success('操作成功')
    fetchBusinesses()
  } catch {}
}

async function deleteBusiness(id: number) {
  try {
    await ElMessageBox.confirm('确定删除该商机？此操作不可恢复。', '提示', { type: 'warning' })
    await request.delete(`/admin/businesses/${id}`)
    ElMessage.success('已删除')
    fetchBusinesses()
  } catch {}
}

function viewDetail(id: number) {
  router.push(`/businesses/detail/${id}`)
}

function editBusiness(row: any) {
  router.push(`/businesses/create?id=${row.id}`)
}

onMounted(fetchBusinesses)
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
.header-left { display: flex; align-items: center; gap: 16px; }
</style>
