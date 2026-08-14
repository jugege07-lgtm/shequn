<template>
  <div class="page">
    <div class="page-header">
      <h2>优惠券管理</h2>
      <el-button type="primary" @click="openCreate">创建优惠券</el-button>
    </div>

    <!-- Table -->
    <el-table :data="list" stripe style="width:100%" v-loading="loading">
      <el-table-column prop="name" label="名称" min-width="120" />
      <el-table-column label="类型" width="80">
        <template #default="{ row }">
          <el-tag size="small" :type="row.type === 'percent' ? 'warning' : 'primary'">
            {{ row.type === 'percent' ? '折扣' : '金额' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="面值/折扣" width="120">
        <template #default="{ row }">
          <template v-if="row.type === 'percent'">
            {{ formatPercent(row.value) }} 折
            <div v-if="row.discountCap" class="meta-line">最高减 ¥{{ row.discountCap }}</div>
          </template>
          <template v-else>¥{{ row.value }}</template>
        </template>
      </el-table-column>
      <el-table-column prop="minAmount" label="门槛" width="80">
        <template #default="{ row }">
          <span v-if="row.minAmount > 0">满 ¥{{ row.minAmount }}</span>
          <span v-else class="text-muted">无门槛</span>
        </template>
      </el-table-column>
      <el-table-column label="发行/领取" width="180">
        <template #default="{ row }">
          <el-progress
            :percentage="totalQtyPercent(row)"
            :stroke-width="8"
            :format="() => `${row.claimedQty}/${row.totalQty}`"
          />
          <div class="meta-line">剩 {{ Math.max(0, row.totalQty - row.claimedQty) }} 张</div>
        </template>
      </el-table-column>
      <el-table-column prop="perUserLimit" label="每人限领" width="90" />
      <el-table-column label="活动期" width="180">
        <template #default="{ row }">
          <template v-if="row.validFrom || row.validTo">
            <div>{{ formatDate(row.validFrom) || '不限' }} ~</div>
            <div>{{ formatDate(row.validTo) || '不限' }}</div>
          </template>
          <span v-else class="text-muted">长期</span>
        </template>
      </el-table-column>
      <el-table-column prop="validDays" label="有效期(天)" width="100" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row)" size="small">
            {{ statusText(row) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="deleteCoupon(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page"
      :page-size="size"
      :total="total"
      layout="prev, pager, next"
      style="margin-top:16px;justify-content:center;display:flex"
      @current-change="loadList"
    />

    <!-- Dialog -->
    <el-dialog
      v-model="showDialog"
      :title="editingId ? '编辑优惠券' : '创建优惠券'"
      width="560px"
      @closed="onDialogClosed"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="如：新人专享 8 折券" maxlength="40" show-word-limit />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" maxlength="120" show-word-limit />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="form.type" @change="onTypeChange">
            <el-radio value="fixed">固定金额（元）</el-radio>
            <el-radio value="percent">折扣（0-1）</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 固定金额：面额 -->
        <el-form-item
          v-if="form.type === 'fixed'"
          label="面额（元）"
          prop="value"
        >
          <el-input-number v-model="form.value" :min="0.01" :step="1" :precision="2" style="width:200px" />
          <span class="form-tip">实际抵扣金额</span>
        </el-form-item>

        <!-- 折扣：折扣率 + 最高优惠 -->
        <el-form-item
          v-else
          label="折扣比例"
          prop="value"
        >
          <el-input-number
            v-model="form.value"
            :min="0.01"
            :max="1"
            :step="0.05"
            :precision="2"
            style="width:200px"
          />
          <span class="form-tip">{{ formatPercent(form.value) }} 折（如 0.8 = 8 折）</span>
        </el-form-item>
        <el-form-item v-if="form.type === 'percent'" label="最高优惠">
          <el-input-number
            v-model="form.discountCap"
            :min="0"
            :step="5"
            :precision="2"
            placeholder="不限制则留空"
            style="width:200px"
          />
          <span class="form-tip">留空 = 不限制；如 100 = 最多减 ¥100</span>
        </el-form-item>

        <el-form-item label="使用门槛">
          <el-input-number v-model="form.minAmount" :min="0" :step="10" style="width:200px" />
          <span class="form-tip">订单满多少元可用，0 = 无门槛</span>
        </el-form-item>

        <el-form-item label="发行总量" prop="totalQty">
          <el-input-number v-model="form.totalQty" :min="1" :step="10" style="width:200px" />
          <span class="form-tip">发完自动停止</span>
        </el-form-item>

        <el-form-item label="每人限领" prop="perUserLimit">
          <el-input-number v-model="form.perUserLimit" :min="1" :step="1" style="width:200px" />
          <span class="form-tip">同一用户最多领多少张</span>
        </el-form-item>

        <el-form-item label="活动开始">
          <el-date-picker
            v-model="form.validFrom"
            type="datetime"
            placeholder="留空 = 立即开始"
            value-format="YYYY-MM-DDTHH:mm:ss[Z]"
            style="width:240px"
          />
        </el-form-item>
        <el-form-item label="活动结束">
          <el-date-picker
            v-model="form.validTo"
            type="datetime"
            placeholder="留空 = 长期"
            value-format="YYYY-MM-DDTHH:mm:ss[Z]"
            style="width:240px"
          />
        </el-form-item>

        <el-form-item label="领取后有效">
          <el-input-number v-model="form.validDays" :min="1" :step="1" style="width:200px" />
          <span class="form-tip">用户领取后多少天内可用</span>
        </el-form-item>

        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" style="width:200px" />
          <span class="form-tip">数值大的优先展示</span>
        </el-form-item>

        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">上架</el-radio>
            <el-radio :value="0">下架</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="saveCoupon" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import request from '@/api/request'

const list = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const size = ref(20)
const total = ref(0)
const showDialog = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)
const formRef = ref<FormInstance>()

const blankForm = () => ({
  name: '',
  description: '',
  type: 'fixed',
  value: 10,
  minAmount: 0,
  discountCap: null as number | null,
  totalQty: 100,
  perUserLimit: 1,
  validDays: 7,
  validFrom: null as string | null,
  validTo: null as string | null,
  status: 1,
  sortOrder: 0,
})

const form = reactive<any>(blankForm())

// 折扣率必须是 (0,1]
const rules: FormRules = {
  name: [{ required: true, message: '请输入券名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  value: [
    {
      validator(_rule, value, cb) {
        if (form.type === 'percent') {
          const v = Number(value)
          if (!(v > 0 && v <= 1)) cb(new Error('折扣比例必须在 (0, 1] 之间'))
          else cb()
        } else {
          const v = Number(value)
          if (!(v > 0)) cb(new Error('面额必须大于 0'))
          else cb()
        }
      },
      trigger: 'blur',
    },
  ],
  totalQty: [{ required: true, message: '请输入发行总量', trigger: 'blur' }],
  perUserLimit: [{ required: true, message: '请输入每人限领数', trigger: 'blur' }],
}

function formatPercent(v: number) {
  if (v == null) return '-'
  // 数据库存 0.8，UI 显示 8.0
  const n = Number(v)
  if (Number.isNaN(n)) return '-'
  return (n * 10).toFixed(1).replace(/\.0$/, '')
}

function formatDate(d?: string | null) {
  if (!d) return ''
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return ''
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`
}

function totalQtyPercent(row: any) {
  const total = Number(row.totalQty) || 0
  const claimed = Number(row.claimedQty) || 0
  if (total <= 0) return 0
  return Math.min(100, Math.round((claimed / total) * 100))
}

function statusText(row: any): string {
  if (row.status !== 1) return '下架'
  const now = Date.now()
  if (row.validFrom && new Date(row.validFrom).getTime() > now) return '未开始'
  if (row.validTo && new Date(row.validTo).getTime() < now) return '已结束'
  if (row.totalQty > 0 && row.claimedQty >= row.totalQty) return '已抢光'
  return '进行中'
}

function statusTagType(row: any): 'success' | 'info' | 'warning' | 'danger' {
  const t = statusText(row)
  if (t === '进行中') return 'success'
  if (t === '未开始') return 'info'
  if (t === '已结束') return 'warning'
  return 'danger'
}

async function loadList() {
  loading.value = true
  try {
    const res: any = await request.get('/admin/coupons', { params: { page: page.value, size: size.value } })
    if (res) {
      list.value = res.list || []
      total.value = res.total || 0
    }
  } catch (err: any) {
    ElMessage.error(err.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  Object.assign(form, blankForm())
  showDialog.value = true
}

function openEdit(row: any) {
  editingId.value = row.id
  Object.assign(form, blankForm(), {
    ...row,
    // 后端返回的 null 在前端保留为 null（用于清空折扣上限）
    discountCap: row.discountCap ?? null,
    validFrom: row.validFrom ? toLocalDateTime(row.validFrom) : null,
    validTo: row.validTo ? toLocalDateTime(row.validTo) : null,
  })
  showDialog.value = true
}

// 后端返回 ISO，把 Z 后缀去掉让 el-date-picker 能解析
function toLocalDateTime(iso: string) {
  if (!iso) return null
  return iso.replace('Z', '')
}

function onTypeChange() {
  // 切换类型时给 value 一个合理默认值，避免校验不通过
  if (form.type === 'percent') form.value = 0.8
  else form.value = 10
}

function onDialogClosed() {
  editingId.value = null
  Object.assign(form, blankForm())
}

async function saveCoupon() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  saving.value = true
  try {
    const payload = {
      ...form,
      // null / '' 一律转 null，避免后端存空字符串
      discountCap: form.discountCap === '' || form.discountCap === undefined ? null : Number(form.discountCap),
      validFrom: form.validFrom || null,
      validTo: form.validTo || null,
    }
    if (editingId.value) {
      await request.put(`/admin/coupons/${editingId.value}`, payload)
      ElMessage.success('更新成功')
    } else {
      await request.post('/admin/coupons', payload)
      ElMessage.success('创建成功')
    }
    showDialog.value = false
    loadList()
  } catch (err: any) {
    ElMessage.error(err.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function deleteCoupon(id: number) {
  try {
    await ElMessageBox.confirm('确定删除该优惠券？已领取记录也会被一并删除。', '提示', {
      type: 'warning',
    })
  } catch {
    return
  }
  try {
    await request.delete(`/admin/coupons/${id}`)
    ElMessage.success('删除成功')
    loadList()
  } catch (err: any) {
    ElMessage.error(err.message || '删除失败')
  }
}

onMounted(loadList)
</script>

<style scoped>
.page { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h2 { font-size: 20px; font-weight: 700; color: #303133; }
.meta-line { font-size: 11px; color: #909399; margin-top: 2px; }
.text-muted { color: #c0c4cc; font-size: 12px; }
.form-tip {
  margin-left: 12px;
  font-size: 12px;
  color: #909399;
}
</style>