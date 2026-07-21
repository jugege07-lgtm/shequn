<template>
  <div class="page">
    <div class="page-header">
      <h2>优惠券管理</h2>
      <el-button type="primary" @click="showDialog = true">创建优惠券</el-button>
    </div>

    <!-- Table -->
    <el-table :data="list" stripe style="width:100%">
      <el-table-column prop="name" label="名称" min-width="120" />
      <el-table-column label="类型" width="80">
        <template #default="{row}">{{ row.type === 'percent' ? '折扣' : '金额' }}</template>
      </el-table-column>
      <el-table-column prop="value" label="面值" width="80" />
      <el-table-column prop="minAmount" label="门槛" width="80" />
      <el-table-column label="发行/领取" width="120">
        <template #default="{row}">{{ row.totalQty }} / {{ row.claimedQty }}</template>
      </el-table-column>
      <el-table-column prop="validDays" label="有效期(天)" width="100" />
      <el-table-column label="状态" width="80">
        <template #default="{row}">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
            {{ row.status === 1 ? '上架' : '下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160">
        <template #default="{row}">
          <el-button size="small" @click="editCoupon(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="deleteCoupon(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Pagination -->
    <el-pagination
      v-model:current-page="page"
      :page-size="size"
      :total="total"
      layout="prev, pager, next"
      style="margin-top:16px;justify-content:center;display:flex"
      @current-change="loadList"
    />

    <!-- Dialog -->
    <el-dialog v-model="showDialog" :title="editingId ? '编辑优惠券' : '创建优惠券'" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" /></el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="form.type">
            <el-radio value="fixed">固定金额</el-radio>
            <el-radio value="percent">折扣(%)</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="面值"><el-input-number v-model="form.value" :min="0" /></el-form-item>
        <el-form-item label="门槛"><el-input-number v-model="form.minAmount" :min="0" /></el-form-item>
        <el-form-item label="数量"><el-input-number v-model="form.totalQty" :min="0" /></el-form-item>
        <el-form-item label="有效期"><el-input-number v-model="form.validDays" :min="1" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sortOrder" :min="0" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="saveCoupon">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/api/request'

const list = ref<any[]>([])
const page = ref(1)
const size = ref(20)
const total = ref(0)
const showDialog = ref(false)
const editingId = ref<number | null>(null)
const form = ref<any>({ name: '', description: '', type: 'fixed', value: 0, minAmount: 0, totalQty: 0, validDays: 7, sortOrder: 0 })

async function loadList() {
  const res: any = await request.get('/admin/coupons', { params: { page: page.value, size: size.value } })
  if (res) { list.value = res.list || []; total.value = res.total || 0 }
}

async function saveCoupon() {
  if (editingId.value) {
    await request.put(`/admin/coupons/${editingId.value}`, form.value)
    ElMessage.success('更新成功')
  } else {
    await request.post('/admin/coupons', form.value)
    ElMessage.success('创建成功')
  }
  showDialog.value = false
  loadList()
}

function editCoupon(row: any) {
  editingId.value = row.id
  form.value = { ...row }
  showDialog.value = true
}

async function deleteCoupon(id: number) {
  await ElMessageBox.confirm('确定删除？', '提示')
  await request.delete(`/admin/coupons/${id}`)
  ElMessage.success('删除成功')
  loadList()
}

onMounted(loadList)
</script>

<style scoped>
.page { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h2 { font-size: 20px; font-weight: 700; color: #303133; }
</style>
