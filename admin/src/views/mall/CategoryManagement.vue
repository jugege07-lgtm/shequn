<template>
  <div class="category-management-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>商机分类管理</span>
          <el-button type="primary" size="small" @click="openCreate">
            <el-icon><Plus /></el-icon> 新增分类
          </el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索分类名称 / 编码"
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
        <el-table-column prop="name" label="分类名称" min-width="140" />
        <el-table-column prop="code" label="分类编码" width="140" />
        <el-table-column prop="icon" label="图标" width="80" align="center">
          <template #default="{ row }">
            <span v-if="row.icon" class="icon-display">{{ row.icon }}</span>
            <span v-else class="icon-empty">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="sortOrder" label="排序" width="80" align="center" sortable />
        <el-table-column prop="businessCount" label="关联商机" width="100" align="center" />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="openEdit(row)">编辑</el-button>
            <el-popconfirm
              v-if="row.businessCount === 0"
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
      :title="isEdit ? '编辑分类' : '新增分类'"
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
        v-loading="formLoading"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" maxlength="30" show-word-limit />
        </el-form-item>
        <el-form-item label="分类编码" prop="code">
          <el-input v-model="form.code" placeholder="例如: resource_cooperation" maxlength="30" />
          <div class="form-tip">英文字母、数字和下划线，需全局唯一</div>
        </el-form-item>
        <el-form-item label="图标 Emoji">
          <el-input v-model="form.icon" placeholder="输入 Emoji 图标，如 🤝" maxlength="4" style="width: 200px" />
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

const searchKeyword = ref('')
const categories = ref<any[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)
const formLoading = ref(false)
const formRef = ref<FormInstance>()

const form = reactive({
  name: '',
  code: '',
  icon: '',
  sortOrder: 0,
  status: 1,
})

const rules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 2, max: 30, message: '长度在 2 到 30 个字符', trigger: 'blur' },
  ],
  code: [
    { required: true, message: '请输入分类编码', trigger: 'blur' },
    { min: 2, max: 30, message: '长度在 2 到 30 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '只能包含英文字母、数字和下划线', trigger: 'blur' },
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
    const data: any = await request.get('/admin/business-category-list', {
      params: { keyword: searchKeyword.value || undefined },
    })
    categories.value = (data || []).map((item: any) => ({
      ...item,
      businessCount: item._count?.businesses ?? 0,
    }))
  } catch (err: any) {
    ElMessage.error(err.message || '加载分类失败')
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
  form.code = ''
  form.icon = ''
  form.sortOrder = 0
  form.status = 1
  dialogVisible.value = true
}

async function openEdit(row: any) {
  isEdit.value = true
  editingId.value = row.id
  formLoading.value = true
  try {
    const data: any = await request.get(`/admin/business-category-list/${row.id}`)
    form.name = data.name || ''
    form.code = data.code || ''
    form.icon = data.icon || ''
    form.sortOrder = data.sortOrder ?? 0
    form.status = data.status ?? 1
    dialogVisible.value = true
  } catch (err: any) {
    ElMessage.error(err.message || '加载分类详情失败')
  } finally {
    formLoading.value = false
  }
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    saving.value = true
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        icon: form.icon.trim(),
        sortOrder: Number(form.sortOrder),
        status: Number(form.status),
      }
      if (isEdit.value && editingId.value) {
        await request.put(`/admin/business-category-list/${editingId.value}`, payload)
        ElMessage.success('分类更新成功')
      } else {
        await request.post('/admin/business-category-list', payload)
        ElMessage.success('分类创建成功')
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
    await request.delete(`/admin/business-category-list/${id}`)
    ElMessage.success('分类已删除')
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

.form-tip {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
  line-height: 1.5;
}
</style>
