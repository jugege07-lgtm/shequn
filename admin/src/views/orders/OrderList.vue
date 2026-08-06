<template>
  <div class="order-list-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>订单管理</span>
          <el-radio-group v-model="statusFilter" size="small" @change="page=1;fetchOrders()">
            <el-radio-button label="">全部</el-radio-button>
            <el-radio-button label="pending_payment">待付款</el-radio-button>
            <el-radio-button label="paid">已付款</el-radio-button>
            <el-radio-button label="shipped">已发货</el-radio-button>
            <el-radio-button label="refunding">退款中</el-radio-button>
          </el-radio-group>
        </div>
      </template>

      <el-table :data="orders" stripe v-loading="loading">
        <el-table-column prop="orderNo" label="订单号" width="200" />
        <el-table-column label="用户" width="120">
          <template #default="{ row }">{{ row.user?.nickname || '-' }}</template>
        </el-table-column>
        <el-table-column label="商品" min-width="200">
          <template #default="{ row }">{{ row.items?.[0]?.productName || '-' }}</template>
        </el-table-column>
        <el-table-column label="金额" width="120">
          <template #default="{ row }">¥{{ row.payAmount }}</template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getOrderStatusType(row.status)">{{ getOrderStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="下单时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" v-if="row.status === 'paid'" type="primary" @click="shipOrder(row)">发货</el-button>
            <el-button size="small" v-if="row.status === 'refunding'" type="success" @click="approveRefund(row.id)">同意退款</el-button>
            <el-button size="small" v-if="row.status === 'refunding'" type="danger" @click="rejectRefund(row.id)">拒绝</el-button>
            <el-button size="small" @click="viewDetail(row.id)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        style="margin-top: 20px; justify-content: center;"
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="fetchOrders"
      />
    </el-card>

    <!-- 发货弹窗 -->
    <el-dialog v-model="shipDialogVisible" title="发货" width="400px">
      <el-form label-width="80px">
        <el-form-item label="快递公司"><el-input v-model="shipForm.shippingCompany" placeholder="顺丰/中通/圆通" /></el-form-item>
        <el-form-item label="快递单号"><el-input v-model="shipForm.shippingNo" placeholder="请输入快递单号" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shipDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmShip">确认发货</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/api/request'

const statusFilter = ref('')
const orders = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const shipDialogVisible = ref(false)
const currentShipId = ref(0)
const shipForm = reactive({ shippingCompany: '', shippingNo: '' })

const getOrderStatusType = (s: string): any => ({
  pending_payment: 'warning', paid: 'success', shipped: 'primary',
  completed: 'info', refunding: 'danger', refunded: 'danger', cancelled: 'info'
}[s] || 'info')

const getOrderStatusText = (s: string) => ({
  pending_payment: '待付款', paid: '已付款', shipped: '已发货',
  completed: '已完成', refunding: '退款中', refunded: '已退款', cancelled: '已取消'
}[s] || s)

async function fetchOrders() {
  loading.value = true
  try {
    const data: any = await request.get('/admin/orders', {
      params: { page: page.value, size: pageSize.value, status: statusFilter.value || undefined }
    })
    orders.value = data?.list || []
    total.value = data?.total || 0
  } catch (err: any) { ElMessage.error(err.message || '操作失败') }
  finally { loading.value = false }
}

function shipOrder(row: any) {
  currentShipId.value = row.id
  shipForm.shippingCompany = ''
  shipForm.shippingNo = ''
  shipDialogVisible.value = true
}

async function confirmShip() {
  try {
    await request.put(`/admin/orders/${currentShipId.value}/ship`, shipForm)
    ElMessage.success('发货成功')
    shipDialogVisible.value = false
    fetchOrders()
  } catch (err: any) { ElMessage.error(err.message || '发货失败') }
}

async function approveRefund(id: number) {
  try {
    await ElMessageBox.confirm('确定同意退款？', '确认', { type: 'warning' })
    await request.put(`/admin/orders/${id}/approve-refund`)
    ElMessage.success('退款已处理')
    fetchOrders()
  } catch { /* cancelled */ }
}

async function rejectRefund(id: number) {
  try {
    const { value } = await ElMessageBox.prompt('请输入拒绝原因', '拒绝退款', { type: 'warning' })
    await request.put(`/admin/orders/${id}/reject-refund`, { reason: value })
    ElMessage.success('已拒绝退款')
    fetchOrders()
  } catch { /* cancelled */ }
}

function viewDetail(id: number) {
  ElMessage.info('订单详情功能开发中')
}

fetchOrders()
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>