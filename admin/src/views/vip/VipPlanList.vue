<template>
  <div class="vip-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>VIP 套餐管理</span>
          <el-button type="primary" size="small" @click="openDialog()">新增套餐</el-button>
        </div>
      </template>

      <el-table :data="plans" stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="套餐名称" width="150" />
        <el-table-column prop="level" label="等级" width="80" />
        <el-table-column label="价格" width="150">
          <template #default="{ row }">
            <span style="color: #E64340; font-weight: bold;">¥{{ row.currentPrice }}</span>
            <span v-if="row.originalPrice > row.currentPrice" style="text-decoration: line-through; color: #ccc; margin-left: 8px;">¥{{ row.originalPrice }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="durationDays" label="有效期" width="100">
          <template #default="{ row }">{{ row.durationDays }}天</template>
        </el-table-column>
        <el-table-column label="折扣" width="100">
          <template #default="{ row }">{{ (Number(row.discountRate) * 100).toFixed(0) }}折</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch :model-value="row.status === 1" @change="toggleStatus(row)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openDialog(row)">编辑</el-button>
            <el-popconfirm title="确定删除？" @confirm="deletePlan(row.id)">
              <template #reference><el-button size="small" type="danger">删除</el-button></template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editingPlan ? '编辑套餐' : '新增套餐'" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="套餐名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="等级"><el-input-number v-model="form.level" :min="1" /></el-form-item>
        <el-form-item label="原价"><el-input-number v-model="form.originalPrice" :min="0" :precision="2" /></el-form-item>
        <el-form-item label="现价"><el-input-number v-model="form.currentPrice" :min="0" :precision="2" /></el-form-item>
        <el-form-item label="有效期(天)"><el-input-number v-model="form.durationDays" :min="1" /></el-form-item>
        <el-form-item label="折扣率"><el-input-number v-model="form.discountRate" :min="0" :max="1" :step="0.1" :precision="1" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePlan" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/api/request'

const plans = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const editingPlan = ref<any>(null)
const form = reactive({ name: '', level: 1, originalPrice: 0, currentPrice: 0, durationDays: 30, discountRate: 1, description: '', status: 1 })

async function fetchPlans() {
  loading.value = true
  try {
    const data: any = await request.get('/admin/vip-plans')
    plans.value = data?.list || []
  } catch (err: any) { ElMessage.error(err.message || '加载失败') }
  finally { loading.value = false }
}

function openDialog(row?: any) {
  if (row) {
    editingPlan.value = row
    Object.assign(form, { name: row.name, level: row.level, originalPrice: row.originalPrice, currentPrice: row.currentPrice, durationDays: row.durationDays, discountRate: row.discountRate, description: row.description, status: row.status })
  } else {
    editingPlan.value = null
    Object.assign(form, { name: '', level: 1, originalPrice: 0, currentPrice: 0, durationDays: 30, discountRate: 1, description: '', status: 1 })
  }
  dialogVisible.value = true
}

async function savePlan() {
  saving.value = true
  try {
    if (editingPlan.value) {
      await request.put(`/admin/vip-plans/${editingPlan.value.id}`, form)
    } else {
      await request.post('/admin/vip-plans', form)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    fetchPlans()
  } catch (err: any) { ElMessage.error(err.message || '保存失败') }
  finally { saving.value = false }
}

async function toggleStatus(row: any) {
  const newStatus = row.status === 1 ? 0 : 1
  try {
    await request.put(`/admin/vip-plans/${row.id}/status`, { status: newStatus })
    ElMessage.success(newStatus === 1 ? '已启用' : '已禁用')
    fetchPlans()
  } catch (err: any) { ElMessage.error(err.message || '操作失败') }
}

async function deletePlan(id: number) {
  try {
    await request.delete(`/admin/vip-plans/${id}`)
    ElMessage.success('已删除')
    fetchPlans()
  } catch (err: any) { ElMessage.error(err.message || '删除失败') }
}

fetchPlans()
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>