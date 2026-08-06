<template>
  <div class="product-list-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>商品管理</span>
          <el-button type="primary" size="small" @click="$router.push('/products/create')">新增商品</el-button>
        </div>
      </template>

      <el-table :data="products" stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="商品" min-width="200">
          <template #default="{ row }">
            <el-avatar :size="50" :src="normalizeImageUrl(row.coverImage)" shape="square" style="margin-right: 12px;" />
            <span>{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="价格" width="150">
          <template #default="{ row }">
            <span style="color: #E64340; font-weight: bold;">¥{{ row.price }}</span>
            <span v-if="row.vipPrice > 0" style="color: #67C23A; margin-left: 8px;">VIP ¥{{ row.vipPrice }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="100" />
        <el-table-column prop="salesCount" label="销量" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '上架' : '下架' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="$router.push(`/products/edit/${row.id}`)">编辑</el-button>
            <el-button size="small" :type="row.status === 1 ? 'warning' : 'success'" @click="toggleStatus(row)">
              {{ row.status === 1 ? '下架' : '上架' }}
            </el-button>
            <el-popconfirm title="确定删除？" @confirm="deleteProduct(row.id)">
              <template #reference><el-button size="small" type="danger">删除</el-button></template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        style="margin-top: 20px; justify-content: center;"
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="fetchProducts"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/api/request'

function normalizeImageUrl(url: string): string {
  if (!url) return ''
  if (url.startsWith('http')) return url
  // 将 /uploads/xxx 转换为 /api/uploads/xxx 以通过 Vite 代理访问
  if (url.startsWith('/uploads')) return '/api' + url
  return url
}

const products = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

async function fetchProducts() {
  loading.value = true
  try {
    const data: any = await request.get('/admin/products', { params: { page: page.value, size: pageSize.value } })
    products.value = data?.list || []
    total.value = data?.total || 0
  } catch (err: any) {
    ElMessage.error(err.message || '操作失败')
  } finally {
    loading.value = false
  }
}

async function toggleStatus(row: any) {
  const newStatus = row.status === 1 ? 0 : 1
  try {
    await request.put(`/admin/products/${row.id}/status`, { status: newStatus })
    ElMessage.success(newStatus === 1 ? '已上架' : '已下架')
    fetchProducts()
  } catch (err: any) {
    ElMessage.error(err.message || '操作失败')
  }
}

async function deleteProduct(id: number) {
  try {
    await request.delete(`/admin/products/${id}`)
    ElMessage.success('已删除')
    fetchProducts()
  } catch (err: any) {
    ElMessage.error(err.message || '删除失败')
  }
}

onMounted(() => {
  fetchProducts()
})
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>
