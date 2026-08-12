<template>
  <div class="category-management-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>商品分类管理</span>
          <el-button type="primary" size="small" @click="openCreate">
            <el-icon><Plus /></el-icon> 新增分类
          </el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索分类名称"
          style="width: 300px"
          clearable
          @clear="fetchCategories"
          @keyup.enter="fetchCategories"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-button type="primary" size="small" @click="fetchCategories">搜索</el-button>
        <el-button size="small" @click="resetSearch">重置</el-button>
      </div>

      <!-- 列表 -->
      <el-table :data="categories" stripe v-loading="loading" style="margin-top: 16px">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="name" label="分类名称" min-width="160" />
        <el-table-column prop="icon" label="图标" width="80" align="center">
          <template #default="{ row }">
            <span v-if="row.icon" class="icon-display">{{ row.icon }}</span>
            <span v-else class="icon-empty">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="sortOrder" label="排序" width="80" align="center" sortable />
        <el-table-column prop="productCount" label="关联商品" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.productCount > 0" type="warning" size="small">
              {{ row.productCount }} 个
            </el-tag>
            <span v-else class="muted">0</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="openEdit(row)">编辑</el-button>
            <el-popconfirm
              v-if="row.productCount === 0"
              title="确定删除该分类？"
              @confirm="handleDelete(row.id)"
            >
              <template #reference>
                <el-button size="small" type="danger">删除</el-button>
              </template>
            </el-popconfirm>
            <el-button v-else size="small" disabled type="danger" style="opacity: 0.5">
              有数据
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑商品分类' : '新增商品分类'"
      width="520px"
      top="8vh"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="90px"
        label-position="right"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" maxlength="30" show-word-limit />
        </el-form-item>
        <el-form-item label="图标 Emoji">
          <el-input v-model="form.icon" placeholder="输入 Emoji 图标，如 🛍️" maxlength="4" style="width: 200px" />
        </el-form-item>
        <el-form-item label="排序权重" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" :min="0" :max="999" style="width: 200px" />
          <div class="form-tip">数值越小越靠前</div>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'
import request from '@/api/request'
import { formatDateTime } from '@/utils/datetime'

const searchKeyword = ref('')
const categories = ref<any[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)
const formRef = ref<FormInstance>()

const form = reactive({
  name: '',
  icon: '',
  sortOrder: 0,
  status: 1,
})

const rules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 1, max: 30, message: '长度在 1 到 30 个字符', trigger: 'blur' },
  ],
  sortOrder: [
    { required: true, message: '请输入排序权重', trigger: 'blur' },
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' },
  ],
}

async function fetchCategories() {
  loading.value = true
  try {
    const data: any = await request.get('/admin/product-categories', {
      params: { keyword: searchKeyword.value || undefined },
    })
    const list = Array.isArray(data) ? data : []
    // 统计每个分类下的商品数（用 product 服务公开接口，code=0 已解包）
    // 为了不增加请求量，仅在详情需要时获取；此处后端未直接返回 _count，前端不阻塞渲染
    categories.value = list.map((item: any) => ({
      ...item,
      // 后端接口未直接返回 _count，暂时用 0 占位；
      // 仍允许"有数据"提示基于业务侧（这里依赖详情接口后端扩展）
      productCount: item._count?.products ?? 0,
    }))
  } catch (err: any) {
    ElMessage.error(err.message || '加载商品分类失败')
  } finally {
    loading.value = false
  }
}

function resetSearch() {
  searchKeyword.value = ''
  fetchCategories()
}

function openCreate() {
  isEdit.value = false
  editingId.value = null
  form.name = ''
  form.icon = ''
  form.sortOrder = 0
  form.status = 1
  dialogVisible.value = true
}

function openEdit(row: any) {
  isEdit.value = true
  editingId.value = row.id
  form.name = row.name || ''
  form.icon = row.icon || ''
  form.sortOrder = row.sortOrder ?? 0
  form.status = row.status ?? 1
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    saving.value = true
    try {
      const payload = {
        name: form.name.trim(),
        icon: form.icon.trim(),
        sortOrder: Number(form.sortOrder),
        status: Number(form.status),
      }
      if (isEdit.value && editingId.value) {
        await request.put(`/admin/product-categories/${editingId.value}`, payload)
        ElMessage.success('商品分类更新成功')
      } else {
        await request.post('/admin/product-categories', payload)
        ElMessage.success('商品分类创建成功')
      }
      dialogVisible.value = false
      fetchCategories()
    } catch (err: any) {
      ElMessage.error(err.message || '保存失败')
    } finally {
      saving.value = false
    }
  })
}

async function handleDelete(id: number) {
  try {
    await request.delete(`/admin/product-categories/${id}`)
    ElMessage.success('商品分类已删除')
    fetchCategories()
  } catch (err: any) {
    ElMessage.error(err.message || '删除失败')
  }
}

onMounted(fetchCategories)
</script>

<style scoped>
.category-management-page {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon-display {
  font-size: 18px;
}

.icon-empty {
  color: #c0c4cc;
  font-size: 13px;
}

.muted {
  color: #9ca3af;
  font-size: 13px;
}

.form-tip {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
  line-height: 1.5;
}
</style>
