<template>
  <div class="banners-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>Banner 管理</span>
          <el-button type="primary" size="small" @click="openDialog()">新增Banner</el-button>
        </div>
      </template>

      <el-table :data="banners" stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" width="200" />
        <el-table-column label="图片" width="150">
          <template #default="{ row }">
            <el-image v-if="row.imageUrl" :src="row.imageUrl" style="width: 120px; height: 60px;" fit="cover" />
            <span v-else style="color: #999;">无图片</span>
          </template>
        </el-table-column>
        <el-table-column prop="position" label="位置" width="100" />
        <el-table-column label="链接" width="120">
          <template #default="{ row }">{{ row.linkType }}: {{ row.linkUrl || '-' }}</template>
        </el-table-column>
        <el-table-column prop="sortOrder" label="排序" width="80" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openDialog(row)">编辑</el-button>
            <el-popconfirm title="确定删除？" @confirm="deleteBanner(row.id)">
              <template #reference><el-button size="small" type="danger">删除</el-button></template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Banner 编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editing ? '编辑Banner' : '新增Banner'" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="图片">
          <el-input v-model="form.imageUrl" placeholder="图片URL" style="width: 300px; margin-right: 12px;" />
          <el-upload
            action="/api/upload"
            :headers="uploadHeaders"
            :show-file-list="false"
            accept="image/*"
            :on-success="(res: any) => form.imageUrl = res.url"
          >
            <el-button size="small">上传</el-button>
          </el-upload>
          <el-image v-if="form.imageUrl" :src="form.imageUrl" style="width: 120px; height: 60px; margin-top: 8px; display: block;" fit="cover" />
        </el-form-item>
        <el-form-item label="链接地址"><el-input v-model="form.linkUrl" /></el-form-item>
        <el-form-item label="链接类型"><el-input v-model="form.linkType" placeholder="activity/vip/mall" /></el-form-item>
        <el-form-item label="位置">
          <el-select v-model="form.position"><el-option label="首页" value="home" /></el-select>
        </el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sortOrder" :min="0" /></el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveBanner" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/api/request'

const banners = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const editing = ref(false)
const editingId = ref(0)
const form = reactive({ title: '', imageUrl: '', linkUrl: '', linkType: '', position: 'home', sortOrder: 0, status: 1 })

const uploadHeaders = { Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}` }

async function fetchBanners() {
  loading.value = true
  try {
    banners.value = await request.get('/admin/banners') || []
  } catch (err: any) { ElMessage.error(err.message || '操作失败') }
  finally { loading.value = false }
}

function openDialog(row?: any) {
  if (row) {
    editing.value = true
    editingId.value = row.id
    Object.assign(form, { title: row.title, imageUrl: row.imageUrl, linkUrl: row.linkUrl, linkType: row.linkType, position: row.position, sortOrder: row.sortOrder, status: row.status })
  } else {
    editing.value = false
    editingId.value = 0
    Object.assign(form, { title: '', imageUrl: '', linkUrl: '', linkType: '', position: 'home', sortOrder: 0, status: 1 })
  }
  dialogVisible.value = true
}

async function saveBanner() {
  saving.value = true
  try {
    if (editing.value) {
      await request.put(`/admin/banners/${editingId.value}`, form)
    } else {
      await request.post('/admin/banners', form)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    fetchBanners()
  } catch (err: any) { ElMessage.error(err.message || '保存失败') }
  finally { saving.value = false }
}

async function deleteBanner(id: number) {
  try {
    await request.delete(`/admin/banners/${id}`)
    ElMessage.success('已删除')
    fetchBanners()
  } catch (err: any) { ElMessage.error(err.message || '删除失败') }
}

fetchBanners()
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>