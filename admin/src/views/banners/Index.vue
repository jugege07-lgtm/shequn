<template>
  <div class="banners-page">
    <el-card style="margin-bottom: 20px;">
      <template #header>
        <div class="card-header">
          <span>轮播设置</span>
        </div>
      </template>
      <el-form label-width="220px" style="max-width: 560px;">
        <el-form-item label="轮播切换间隔（秒）">
          <el-input-number v-model="bannerInterval" :min="1" :max="60" style="width: 200px;" />
          <span class="form-tip">移动端首页 Banner 自动切换间隔，单位：秒</span>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveInterval" :loading="intervalSaving">保存轮播设置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>首页轮播图管理（最多 5 张）</span>
          <el-button type="primary" size="small" :disabled="banners.length >= 5" @click="openDialog()">
            新增Banner
          </el-button>
        </div>
      </template>
      <el-alert v-if="banners.length >= 5" type="warning" :closable="false" style="margin-bottom: 16px;">
        <template #title>已达最大数量（5 张），请先删除后再新增。</template>
      </el-alert>

      <el-table :data="banners" stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="图片" width="150">
          <template #default="{ row }">
            <el-image v-if="row.imageUrl" :src="row.imageUrl" style="width: 120px; height: 60px;" fit="cover" />
            <span v-else style="color: #999;">无图片</span>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" width="180" show-overflow-tooltip />
        <el-table-column prop="content" label="内容" width="220" show-overflow-tooltip />
        <el-table-column label="链接" width="130">
          <template #default="{ row }">{{ row.linkType || '-' }} {{ row.linkUrl || '' }}</template>
        </el-table-column>
        <el-table-column prop="sortOrder" label="排序" width="80" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="230" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="moveUp(row)">上移</el-button>
            <el-button size="small" @click="moveDown(row)">下移</el-button>
            <el-button size="small" @click="openDialog(row)">编辑</el-button>
            <el-popconfirm title="确定删除？" @confirm="deleteBanner(row.id)">
              <template #reference><el-button size="small" type="danger">删除</el-button></template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Banner 编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editing ? '编辑Banner' : '新增Banner'" width="560px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" maxlength="20" show-word-limit placeholder="20字以内" />
        </el-form-item>
        <el-form-item label="内容" required>
          <el-input v-model="form.content" maxlength="35" show-word-limit placeholder="35字以内" />
        </el-form-item>
        <el-form-item label="图片" required>
          <div class="img-upload-row">
            <el-input v-model="form.imageUrl" placeholder="图片URL" style="flex: 1; margin-right: 12px;" />
            <el-upload
              :show-file-list="false"
              accept="image/*"
              :http-request="uploadBannerImage"
              :before-upload="beforeBannerUpload"
            >
              <el-button size="small" type="primary" plain>上传图片</el-button>
            </el-upload>
          </div>
          <div class="upload-tip">建议尺寸 750×300（比例 2.5:1），支持 JPG/PNG，单个文件不超过 5MB</div>
          <el-image v-if="form.imageUrl" :src="form.imageUrl" style="width: 100%; height: 140px; margin-top: 8px; display: block; border-radius: 6px;" fit="cover" />
        </el-form-item>
        <el-form-item label="链接地址"><el-input v-model="form.linkUrl" /></el-form-item>
        <el-form-item label="链接类型">
          <el-select v-model="form.linkType" style="width: 100%;">
            <el-option label="无跳转" value="" />
            <el-option label="活动" value="activity" />
            <el-option label="商机" value="business" />
            <el-option label="商城" value="mall" />
            <el-option label="VIP" value="vip" />
            <el-option label="自定义链接" value="url" />
          </el-select>
        </el-form-item>
        <el-form-item label="位置">
          <el-select v-model="form.position" style="width: 100%;"><el-option label="首页" value="home" /></el-select>
        </el-form-item>
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
import { ElMessage, type UploadRequestOptions } from 'element-plus'
import request from '@/api/request'

const banners = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)
const intervalSaving = ref(false)
const dialogVisible = ref(false)
const editing = ref(false)
const editingId = ref(0)
const bannerInterval = ref(4)
const form = reactive({ title: '', content: '', imageUrl: '', linkUrl: '', linkType: '', position: 'home', sortOrder: 0, status: 1 })

// 上传前校验：尺寸与大小
function beforeBannerUpload(file: File) {
  const allowTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowTypes.includes(file.type)) {
    ElMessage.error('仅支持 JPG/PNG/WebP/GIF 图片')
    return false
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }
  return true
}

// 自定义上传：经 axios 统一处理被包装的响应，正确回填图片 URL
async function uploadBannerImage(options: UploadRequestOptions) {
  const formData = new FormData()
  formData.append('file', options.file)
  try {
    const res: any = await request.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    form.imageUrl = res.url.startsWith('http') ? res.url : '/api' + res.url
    ElMessage.success('图片上传成功')
  } catch (err: any) {
    ElMessage.error(err.message || '上传失败')
  }
}

async function fetchBanners() {
  loading.value = true
  try {
    banners.value = (await request.get('/admin/banners')) || []
  } catch (err: any) { ElMessage.error(err.message || '操作失败') }
  finally { loading.value = false }
}

async function fetchInterval() {
  try {
    const data: any = await request.get('/admin/banner-settings')
    if (data?.bannerInterval) bannerInterval.value = data.bannerInterval
  } catch (err: any) { console.error(err?.message || '获取轮播设置失败') }
}

async function saveInterval() {
  intervalSaving.value = true
  try {
    await request.put('/admin/banner-settings', { bannerInterval: bannerInterval.value })
    ElMessage.success('轮播设置已保存')
  } catch (err: any) { ElMessage.error(err.message || '保存失败') }
  finally { intervalSaving.value = false }
}

function openDialog(row?: any) {
  if (row) {
    editing.value = true
    editingId.value = row.id
    Object.assign(form, { title: row.title, content: row.content || '', imageUrl: row.imageUrl, linkUrl: row.linkUrl, linkType: row.linkType, position: row.position, sortOrder: row.sortOrder, status: row.status })
  } else {
    editing.value = false
    editingId.value = 0
    Object.assign(form, { title: '', content: '', imageUrl: '', linkUrl: '', linkType: '', position: 'home', sortOrder: banners.value.length ? Math.max(...banners.value.map((b) => b.sortOrder || 0)) + 1 : 0, status: 1 })
  }
  dialogVisible.value = true
}

async function saveBanner() {
  if (!form.title.trim()) { ElMessage.warning('请输入标题'); return }
  if (!form.content.trim()) { ElMessage.warning('请输入内容'); return }
  if (!form.imageUrl.trim()) { ElMessage.warning('请上传图片'); return }
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

async function moveUp(row: any) {
  const i = banners.value.findIndex((b) => b.id === row.id)
  if (i <= 0) return
  const prev = banners.value[i - 1]
  await swapSort(row, prev)
}

async function moveDown(row: any) {
  const i = banners.value.findIndex((b) => b.id === row.id)
  if (i < 0 || i >= banners.value.length - 1) return
  const next = banners.value[i + 1]
  await swapSort(row, next)
}

async function swapSort(a: any, b: any) {
  const sa = a.sortOrder || 0, sb = b.sortOrder || 0
  try {
    await Promise.all([
      request.put(`/admin/banners/${a.id}`, { sortOrder: sb }),
      request.put(`/admin/banners/${b.id}`, { sortOrder: sa }),
    ])
    fetchBanners()
  } catch (err: any) { ElMessage.error(err.message || '排序失败') }
}

fetchBanners()
fetchInterval()
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
.form-tip { margin-left: 12px; color: #909399; font-size: 12px; }
.img-upload-row { display: flex; align-items: center; width: 100%; }
.upload-tip { margin-top: 6px; font-size: 12px; color: #909399; }
</style>