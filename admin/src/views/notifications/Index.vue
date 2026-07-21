<template>
  <div class="notifications-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>消息管理</span>
          <el-button type="primary" size="small" @click="showDialog = true">发送消息</el-button>
        </div>
      </template>

      <el-table :data="messages" stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="用户" width="120">
          <template #default="{ row }">{{ row.user?.nickname || '-' }}</template>
        </el-table-column>
        <el-table-column prop="title" label="标题" width="200" />
        <el-table-column prop="content" label="内容" min-width="250" show-overflow-tooltip />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 'system' ? 'info' : 'warning'">{{ row.type === 'system' ? '系统通知' : '营销' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="已读" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isRead ? 'success' : 'warning'">{{ row.isRead ? '已读' : '未读' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="发送时间" width="180" />
      </el-table>

      <el-pagination
        style="margin-top: 20px; justify-content: center;"
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="fetchMessages"
      />
    </el-card>

    <!-- 发送消息弹窗 -->
    <el-dialog v-model="showDialog" title="发送消息" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="用户ID"><el-input-number v-model="form.userId" :min="1" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.type"><el-option label="系统通知" value="system" /><el-option label="营销消息" value="marketing" /></el-select>
        </el-form-item>
        <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="内容"><el-input v-model="form.content" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="sendMessage" :loading="sending">发送</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/api/request'

const messages = ref<any[]>([])
const loading = ref(false)
const sending = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const showDialog = ref(false)
const form = reactive({ userId: 1, title: '', content: '', type: 'system' })

async function fetchMessages() {
  loading.value = true
  try {
    const data: any = await request.get('/admin/notifications', { params: { page: page.value, size: pageSize.value } })
    messages.value = data?.list || []
    total.value = data?.total || 0
  } catch (err: any) { ElMessage.error(err.message || '操作失败') }
  finally { loading.value = false }
}

async function sendMessage() {
  sending.value = true
  try {
    await request.post('/admin/notifications', form)
    ElMessage.success('发送成功')
    showDialog.value = false
    fetchMessages()
  } catch (err: any) { ElMessage.error(err.message || '发送失败') }
  finally { sending.value = false }
}

fetchMessages()
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>