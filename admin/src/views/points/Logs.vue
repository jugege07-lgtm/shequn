<template>
  <div class="page">
    <div class="page-header">
      <h2>积分明细</h2>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <el-input
        v-model="keyword"
        placeholder="搜索用户昵称 / 手机号"
        style="width: 220px"
        clearable
        @clear="loadList"
        @keyup.enter="handleSearch"
      />
      <el-select v-model="action" placeholder="动作类型" clearable style="width: 160px" @change="loadList">
        <el-option v-for="opt in actionOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
      </el-select>
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        style="width: 260px"
        @change="loadList"
      />
      <el-button type="primary" @click="handleSearch">搜索</el-button>
      <el-button @click="resetFilter">重置</el-button>
    </div>

    <el-table :data="list" stripe style="width:100%" v-loading="loading">
      <el-table-column label="用户" width="140">
        <template #default="{ row }">
          <div class="user-cell">
            <span class="nickname">{{ row.user?.nickname || '未知用户' }}</span>
            <span v-if="row.user?.phone" class="phone">{{ row.user.phone }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="动作" width="140">
        <template #default="{ row }">
          <el-tag size="small" effect="plain">{{ actionLabels[row.action] || row.action }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="积分" width="100">
        <template #default="{row}">
          <span :class="row.points > 0 ? 'plus' : 'minus'">
            {{ row.points > 0 ? '+' : '' }}{{ row.points }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="balance" label="余额" width="90" align="center" />
      <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
      <el-table-column label="时间" width="170">
        <template #default="{row}">{{ row.createdAt ? new Date(row.createdAt).toLocaleString('zh-CN') : '-' }}</template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page"
      :page-size="size"
      :total="total"
      layout="total, prev, pager, next"
      style="margin-top:16px;justify-content:center;display:flex"
      @current-change="loadList"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/api/request'

const list = ref<any[]>([])
const page = ref(1)
const size = ref(20)
const total = ref(0)
const loading = ref(false)
const keyword = ref('')
const action = ref('')
const dateRange = ref<[string, string] | null>(null)

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
  { label: '手动调整', value: 'adjust' },
]

const actionLabels: Record<string, string> = {
  register: '注册',
  invite: '邀请好友',
  vip: '开通VIP',
  purchase: '购买商品',
  activity_signup: '活动报名',
  checkin: '活动签到',
  publish_business: '发布商机',
  unlock_business: '解锁商机',
  card_view: '名片被关注',
  adjust: '手动调整',
}

async function loadList() {
  loading.value = true
  try {
    const params: any = { page: page.value, size: size.value }
    if (keyword.value.trim()) params.keyword = keyword.value.trim()
    if (action.value) params.action = action.value
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    const data: any = await request.get('/admin/point-logs', { params })
    list.value = data?.list || []
    total.value = data?.total || 0
  } catch (err: any) {
    ElMessage.error(err.message || '加载积分明细失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  loadList()
}

function resetFilter() {
  keyword.value = ''
  action.value = ''
  dateRange.value = null
  page.value = 1
  loadList()
}

onMounted(loadList)
</script>

<style scoped>
.page { padding: 20px; }
.page-header { margin-bottom: 16px; }
.page-header h2 { font-size: 20px; font-weight: 700; color: #303133; }

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.user-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.user-cell .nickname {
  font-size: 14px;
  color: #303133;
}
.user-cell .phone {
  font-size: 12px;
  color: #909399;
}

.plus { color: #67C23A; font-weight: 600; }
.minus { color: #F56C6C; font-weight: 600; }
</style>
