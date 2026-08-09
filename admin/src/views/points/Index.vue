<template>
  <div class="page">
    <div class="page-header">
      <h2>积分规则管理</h2>
      <el-button type="primary" @click="openCreate">
        <el-icon><Plus /></el-icon> 新建规则
      </el-button>
    </div>

    <!-- 分组筛选 -->
    <div class="filter-bar">
      <el-radio-group v-model="activeGroup" @change="fetchList">
        <el-radio-button value="all">全部</el-radio-button>
        <el-radio-button value="default">默认规则</el-radio-button>
        <el-radio-button value="custom">自定义规则</el-radio-button>
      </el-radio-group>
      <el-radio-group v-model="activeEnabled" @change="fetchList">
        <el-radio-button value="all">全部状态</el-radio-button>
        <el-radio-button :value="1">启用</el-radio-button>
        <el-radio-button :value="0">停用</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 列表 -->
    <el-table :data="list" stripe style="width:100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="name" label="规则名称" min-width="140" />
      <el-table-column prop="action" label="动作标识" width="160">
        <template #default="{ row }">
          <el-tag size="small" effect="plain">{{ actionLabels[row.action] || row.action }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="ruleGroup" label="分组" width="100">
        <template #default="{ row }">
          <el-tag :type="row.ruleGroup === 'default' ? 'info' : 'warning'" size="small">
            {{ row.ruleGroup === 'default' ? '默认' : '自定义' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="priority" label="优先级" width="90" align="center" sortable />
      <el-table-column prop="points" label="积分值" width="90" align="center" />
      <el-table-column prop="maxPerDay" label="每日上限" width="90" align="center" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.enabled === 1 ? 'success' : 'info'" size="small">
            {{ row.enabled === 1 ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="180" />
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" @click="toggleEnable(row)">
            {{ row.enabled === 1 ? '停用' : '启用' }}
          </el-button>
          <el-popconfirm title="确定删除该规则？" @confirm="handleDelete(row.id)">
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
      @current-change="fetchList"
    />

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="showDialog" :title="editingId ? '编辑规则' : '新建规则'" width="560px" top="6vh">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" label-position="right">
        <el-form-item label="规则名称" prop="name">
          <el-input v-model="form.name" placeholder="例如：注册奖励、发布商机积分" maxlength="50" show-word-limit />
        </el-form-item>

        <el-form-item label="动作标识" prop="action">
          <el-select v-model="form.action" placeholder="选择触发动作" style="width: 100%">
            <el-option v-for="opt in actionOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="规则分组" prop="ruleGroup">
          <el-radio-group v-model="form.ruleGroup">
            <el-radio value="default">默认规则</el-radio>
            <el-radio value="custom">自定义规则</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="优先级" prop="priority">
          <el-input-number v-model="form.priority" :min="-999" :max="999" style="width: 160px" />
          <span class="form-tip">数值越大越先执行，支持负数</span>
        </el-form-item>

        <el-form-item label="积分值" prop="points">
          <el-input-number v-model="form.points" :min="0" style="width: 160px" />
          <span class="form-tip">每次触发获得的积分数</span>
        </el-form-item>

        <el-form-item label="每日上限" prop="maxPerDay">
          <el-input-number v-model="form.maxPerDay" :min="1" :max="999" style="width: 160px" />
          <span class="form-tip">同一用户每日最多触发次数</span>
        </el-form-item>

        <el-form-item label="排序权重" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" :min="0" :max="999" style="width: 160px" />
          <span class="form-tip">同优先级内排序</span>
        </el-form-item>

        <el-form-item label="状态" prop="enabled">
          <el-switch v-model="form.enabled" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="停用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="saveRule" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'
import request from '@/api/request'

const loading = ref(false)
const saving = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const showDialog = ref(false)
const editingId = ref<number | null>(null)
const activeGroup = ref('all')
const activeEnabled = ref<number | string>('all')
const formRef = ref<FormInstance>()

const form = reactive({
  name: '',
  action: '',
  ruleGroup: 'default',
  priority: 0,
  points: 0,
  maxPerDay: 1,
  sortOrder: 0,
  enabled: 1,
})

const actionOptions = [
  { label: '注册', value: 'register' },
  { label: '邀请好友', value: 'invite' },
  { label: '扫码名片注册', value: 'referral_register' },
  { label: '开通VIP', value: 'vip' },
  { label: '购买商品', value: 'purchase' },
  { label: '活动报名', value: 'activity_signup' },
  { label: '活动签到', value: 'checkin' },
  { label: '发布商机', value: 'publish_business' },
  { label: '解锁商机', value: 'unlock_business' },
  { label: '名片被关注', value: 'card_view' },
]

const actionLabels: Record<string, string> = {
  register: '注册',
  invite: '邀请好友',
  referral_register: '扫码名片注册',
  vip: '开通VIP',
  purchase: '购买商品',
  activity_signup: '活动报名',
  checkin: '活动签到',
  publish_business: '发布商机',
  unlock_business: '解锁商机',
  card_view: '名片被关注',
}

const rules = {
  name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  action: [{ required: true, message: '请选择动作标识', trigger: 'change' }],
  ruleGroup: [{ required: true, message: '请选择规则分组', trigger: 'change' }],
  points: [{ required: true, message: '请输入积分值', trigger: 'blur' }],
  maxPerDay: [{ required: true, message: '请输入每日上限', trigger: 'blur' }],
  enabled: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

async function fetchList() {
  loading.value = true
  try {
    const params: any = { page: page.value, size: pageSize.value }
    if (activeGroup.value !== 'all') params.ruleGroup = activeGroup.value
    if (activeEnabled.value !== 'all') params.enabled = Number(activeEnabled.value)
    const data: any = await request.get('/admin/point-rules', { params })
    list.value = data?.list || []
    total.value = data?.total || 0
  } catch (err: any) {
    ElMessage.error(err.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  Object.assign(form, {
    name: '', action: '', ruleGroup: 'default', priority: 0,
    points: 0, maxPerDay: 1, sortOrder: 0, enabled: 1,
  })
  showDialog.value = true
}

function openEdit(row: any) {
  editingId.value = row.id
  Object.assign(form, {
    name: row.name || '',
    action: row.action || '',
    ruleGroup: row.ruleGroup || 'default',
    priority: row.priority ?? 0,
    points: row.points ?? 0,
    maxPerDay: row.maxPerDay ?? 1,
    sortOrder: row.sortOrder ?? 0,
    enabled: row.enabled ?? 1,
  })
  showDialog.value = true
}

async function saveRule() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    saving.value = true
    try {
      const payload = { ...form }
      if (editingId.value) {
        await request.put(`/admin/point-rules/${editingId.value}`, payload)
        ElMessage.success('更新成功')
      } else {
        await request.post('/admin/point-rules', payload)
        ElMessage.success('创建成功')
      }
      showDialog.value = false
      fetchList()
    } catch (err: any) {
      ElMessage.error(err.message || '保存失败')
    } finally {
      saving.value = false
    }
  })
}

async function toggleEnable(row: any) {
  const newStatus = row.enabled === 1 ? 0 : 1
  try {
    await request.put(`/admin/point-rules/${row.id}`, { enabled: newStatus })
    ElMessage.success(newStatus === 1 ? '已启用' : '已停用')
    fetchList()
  } catch (err: any) {
    ElMessage.error(err.message || '操作失败')
  }
}

async function handleDelete(id: number) {
  try {
    await request.delete(`/admin/point-rules/${id}`)
    ElMessage.success('已删除')
    fetchList()
  } catch (err: any) {
    ElMessage.error(err.message || '删除失败')
  }
}

onMounted(fetchList)
</script>

<style scoped>
.page { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h2 { font-size: 20px; font-weight: 700; color: #303133; }

.filter-bar {
  display: flex; gap: 20px; margin-bottom: 16px; flex-wrap: wrap;
}

.form-tip {
  margin-left: 12px; font-size: 12px; color: #9ca3af;
}
</style>
