<template>
  <div class="user-list-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <el-input v-model="searchKeyword" placeholder="搜索用户昵称/手机号" style="width: 300px" clearable @clear="fetchUsers" @keyup.enter="fetchUsers">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </div>
      </template>

      <el-table :data="users" stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="头像" width="80">
          <template #default="{ row }">
            <el-avatar :size="40" shape="circle" :src="normalizeImageUrl(row.avatarUrl)">
              {{ avatarText(row) }}
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column prop="nickname" label="昵称" width="150" />
        <el-table-column label="手机号" width="150">
          <template #default="{ row }">{{ row.phone || '-' }}</template>
        </el-table-column>
        <el-table-column label="角色" width="180">
          <template #default="{ row }">
            <div class="role-cell" v-if="parseRoles(row.role).length > 0">
              <el-tag
                v-for="r in parseRoles(row.role)"
                :key="r.value"
                :type="r.type || 'info'"
                size="small"
                class="role-tag"
                @click="openRoleDialog(row)"
                style="cursor:pointer"
              >{{ r.label }}</el-tag>
            </div>
            <el-button size="small" link type="primary" @click="openRoleDialog(row)">设置角色</el-button>
          </template>
        </el-table-column>
        <el-table-column label="VIP" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.vipLevel > 0" type="warning">LV{{ row.vipLevel }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="余额(元)" width="120">
          <template #default="{ row }">
            <span class="balance-cell" :class="{ 'balance-zero': !Number(row.balance) }">¥{{ Number(row.balance ?? 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'normal' ? 'success' : 'danger'">{{ row.status === 'normal' ? '正常' : '已禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" width="180">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="420" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" @click="viewDetail(row)">详情</el-button>
            <el-button size="small" type="success" @click="openBalanceDialog(row)">余额调整</el-button>
            <el-button size="small" type="info" @click="openPasswordDialog(row)">修改密码</el-button>
            <el-popconfirm v-if="row.status === 'normal'" title="确定禁用该用户？" @confirm="disableUser(row.id)">
              <template #reference><el-button size="small" type="warning">禁用</el-button></template>
            </el-popconfirm>
            <el-popconfirm v-else title="确定启用该用户？" @confirm="enableUser(row.id)">
              <template #reference><el-button size="small" type="success">启用</el-button></template>
            </el-popconfirm>
            <el-popconfirm title="确定删除该用户？此操作不可恢复。" @confirm="deleteUser(row.id)">
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
        @current-change="fetchUsers"
      />
    </el-card>

    <!-- 用户详情/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑用户' : '用户详情'" width="820px" top="6vh">
      <el-tabs v-model="activeTab" v-loading="detailLoading">
        <!-- 基本信息 -->
        <el-tab-pane label="基本信息" name="basic">
          <el-form :model="editForm" label-width="100px" :disabled="!isEdit">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="用户ID"><el-input v-model="editForm.id" disabled /></el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="昵称"><el-input v-model="editForm.nickname" /></el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="手机号"><el-input v-model="editForm.phone" /></el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="角色">
                  <div class="role-select-area">
                    <div v-if="editFormRoles.length" class="selected-roles">
                      <el-tag
                        v-for="r in editFormRoles"
                        :key="r.value"
                        :type="r.type || 'info'"
                        closable
                        @close="removeEditRole(r.value)"
                        class="role-tag"
                      >{{ r.label }}</el-tag>
                    </div>
                    <el-dropdown trigger="click" @command="addEditRole">
                      <el-button size="small" type="primary" plain>+ 添加角色</el-button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item
                            v-for="opt in availableRoleOptions"
                            :key="opt.value"
                            :command="opt.value"
                            :disabled="!!editFormRoles.find(r => r.value === opt.value)"
                          >
                            {{ opt.label }}
                            <span style="color:#999;font-size:11px;margin-left:4px">— {{ opt.description }}</span>
                          </el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="VIP等级">
                  <el-input-number v-model="editForm.vipLevel" :min="0" :max="10" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="状态">
                  <el-select v-model="editForm.status" style="width: 100%">
                    <el-option label="正常" value="normal" />
                    <el-option label="已禁用" value="disabled" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="积分余额"><el-input v-model="editForm.points" disabled /></el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="注册时间"><el-input v-model="editForm.createdAt" disabled /></el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 名片信息 -->
        <el-tab-pane label="名片信息" name="card">
          <el-form :model="editForm.card" label-width="100px" :disabled="!isEdit">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="真实姓名"><el-input v-model="editForm.card.realName" /></el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="职位"><el-input v-model="editForm.card.position" /></el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="公司"><el-input v-model="editForm.card.company" /></el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="微信"><el-input v-model="editForm.card.wechat" /></el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="个人简介"><el-input v-model="editForm.card.intro" type="textarea" :rows="3" /></el-form-item>
            <el-form-item label="头像URL"><el-input v-model="editForm.card.avatarUrl" /></el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 积分与权益 -->
        <el-tab-pane label="积分与权益" name="points">
          <div class="section-block">
            <div class="section-title">积分余额：{{ currentUser?.points ?? 0 }}</div>
            <el-table :data="currentUser?.pointLogs || []" size="small" max-height="250" empty-text="暂无积分记录">
              <el-table-column prop="type" label="类型" width="120" />
              <el-table-column prop="points" label="积分" width="100" />
              <el-table-column prop="description" label="说明" />
              <el-table-column label="时间" width="160">
                <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
              </el-table-column>
            </el-table>
          </div>
          <div class="section-block">
            <div class="section-title">优惠券</div>
            <el-table :data="currentUser?.coupons || []" size="small" max-height="250" empty-text="暂无优惠券">
              <el-table-column prop="coupon.name" label="名称" />
              <el-table-column prop="coupon.type" label="类型" width="100" />
              <el-table-column prop="coupon.value" label="面值" width="100" />
              <el-table-column prop="status" label="状态" width="100" />
              <el-table-column label="领取时间" width="160">
                <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <!-- 订单与内容 -->
        <el-tab-pane label="订单与内容" name="orders">
          <div class="section-block">
            <div class="section-title">最近订单</div>
            <el-table :data="currentUser?.orders || []" size="small" max-height="250" empty-text="暂无订单">
              <el-table-column prop="id" label="订单ID" width="80" />
              <el-table-column prop="status" label="状态" width="100" />
              <el-table-column prop="payAmount" label="支付金额" width="100" />
              <el-table-column label="创建时间" width="160">
                <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
              </el-table-column>
            </el-table>
          </div>
          <div class="section-block">
            <div class="section-title">发布的活动</div>
            <el-table :data="currentUser?.activities || []" size="small" max-height="200" empty-text="暂无活动">
              <el-table-column prop="title" label="标题" />
              <el-table-column prop="status" label="状态" width="100" />
              <el-table-column label="创建时间" width="160">
                <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
              </el-table-column>
            </el-table>
          </div>
          <div class="section-block">
            <div class="section-title">发布的商机</div>
            <el-table :data="currentUser?.businesses || []" size="small" max-height="200" empty-text="暂无商机">
              <el-table-column prop="title" label="标题" />
              <el-table-column prop="status" label="状态" width="100" />
              <el-table-column label="创建时间" width="160">
                <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
        <el-button v-if="isEdit" type="primary" @click="saveUser" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 修改密码弹窗 -->
    <el-dialog v-model="passwordVisible" title="修改用户密码" width="420px">
      <el-form :model="passwordForm" label-width="100px" :rules="passwordRules" ref="passwordFormRef">
        <el-form-item label="用户">
          <el-input v-model="passwordForm.userLabel" disabled />
        </el-form-item>
        <el-form-item label="新密码" prop="password">
          <el-input v-model="passwordForm.password" type="password" show-password placeholder="请输入新密码（至少6位）" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPassword" :loading="passwordLoading">确认修改</el-button>
      </template>
    </el-dialog>

    <!-- 角色管理弹窗 -->
    <el-dialog v-model="roleDialogVisible" title="角色管理" width="520px">
      <div class="role-dialog-body">
        <div class="role-target-info">
          <el-avatar :size="40" shape="circle" :src="normalizeImageUrl(roleTargetUser?.avatarUrl)">
            {{ roleTargetUser ? avatarText(roleTargetUser) : '' }}
          </el-avatar>
          <div>
            <div class="role-target-name">{{ roleTargetUser?.nickname || `用户 #${roleTargetUser?.id}` }}</div>
            <div class="role-target-phone">{{ roleTargetUser?.phone || '' }}</div>
          </div>
        </div>

        <el-divider content-position="left">当前角色（点击移除）</el-divider>
        <div class="current-roles-area">
          <div v-if="selectedRoles.length === 0" class="empty-roles-tip">暂未分配任何角色，默认为「普通用户」</div>
          <el-tag
            v-for="r in selectedRoles"
            :key="r.value"
            :type="r.type || 'info'"
            closable
            size="large"
            @close="removeSelectedRole(r.value)"
            class="role-tag-large"
          >
            {{ r.label }}
          </el-tag>
        </div>

        <el-divider content-position="left">可添加的角色</el-divider>
        <div class="available-roles-grid">
          <div
            v-for="opt in availableRoleOptionsForDialog"
            :key="opt.value"
            class="role-option-card"
            :class="{ 'is-added': !!selectedRoles.find(s => s.value === opt.value) }"
            @click="addRoleFromDialog(opt)"
          >
            <div class="role-option-header">
              <span class="role-option-name">{{ opt.label }}</span>
              <el-icon v-if="!!selectedRoles.find(s => s.value === opt.value)" color="#67c23a"><Select /></el-icon>
            </div>
            <div class="role-option-desc">{{ opt.description }}</div>
          </div>
        </div>

        <el-alert
          v-if="roleChangeSummary"
          type="warning"
          :closable="false"
          style="margin-top: 16px"
        >
          <template #title>{{ roleChangeSummary }}</template>
        </el-alert>
      </div>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmRoleChange" :loading="roleSaving" :disabled="!hasRoleChanges">
          确认变更
        </el-button>
      </template>
    </el-dialog>

    <!-- 余额调整弹窗 -->
    <el-dialog v-model="balanceDialogVisible" title="余额调整" width="460px">
      <div v-if="balanceTargetUser" class="balance-dialog-body">
        <div class="balance-target-info">
          <el-avatar :size="40" shape="circle" :src="normalizeImageUrl(balanceTargetUser.avatarUrl)">
            {{ balanceTargetUser ? avatarText(balanceTargetUser) : '' }}
          </el-avatar>
          <div>
            <div class="balance-target-name">{{ balanceTargetUser.nickname || `用户 #${balanceTargetUser.id}` }}</div>
            <div class="balance-target-phone">{{ balanceTargetUser.phone || '' }}</div>
          </div>
          <div class="balance-current">当前余额 ¥{{ Number(balanceTargetUser.balance ?? 0).toFixed(2) }}</div>
        </div>

        <el-form :model="balanceForm" label-width="90px">
          <el-form-item label="操作方式">
            <el-radio-group v-model="balanceForm.type">
              <el-radio-button value="set">直接设置</el-radio-button>
              <el-radio-button value="add">增加</el-radio-button>
              <el-radio-button value="subtract">扣减</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item :label="balanceForm.type === 'set' ? '设置后余额' : '金额(元)'">
            <el-input-number v-model="balanceForm.amount" :min="0" :precision="2" style="width: 100%" />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="balanceForm.remark" placeholder="调整原因（可选），将写入余额明细" />
          </el-form-item>
          <el-form-item v-if="balanceForm.type === 'set'">
            <span class="balance-tip">直接设置会将用户余额变为该数值（可大于或小于当前余额）。</span>
          </el-form-item>
          <el-form-item v-else-if="balanceForm.type === 'subtract'">
            <span class="balance-tip">扣减金额不能超过当前余额 ¥{{ Number(balanceTargetUser.balance ?? 0).toFixed(2) }}。</span>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="balanceDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitBalanceAdjust" :loading="balanceSaving">确认调整</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick } from 'vue'
import { ElMessage, type FormInstance, ElMessageBox } from 'element-plus'
import { Select } from '@element-plus/icons-vue'
import request from '@/api/request'
import { normalizeImageUrl } from '@/utils/image'
import { formatDateTime } from '@/utils/datetime'

/** 无头像时展示首字占位（优先昵称首个字符，否则用用户ID） */
function avatarText(row: any): string {
  if (row.avatarUrl) return ''
  const nick = row.nickname || ''
  if (nick) return nick.charAt(0).toUpperCase()
  return `#${row.id ?? ''}`
}

// ==================== 系统预定义角色列表（与后端 VALID_ROLES 保持一致） ====================
interface SystemRole {
  value: string
  label: string
  type: string
  description: string
}

const SYSTEM_ROLES: readonly SystemRole[] = [
  { value: 'user', label: '普通用户', type: 'info', description: '基础权限，可浏览和参与' },
  { value: 'editor', label: '内容编辑', type: '', description: '可管理活动、商机、商品等内容' },
  { value: 'moderator', label: '审核员', type: 'warning', description: '可审核活动、评论等提交内容' },
  { value: 'operator', label: '运营', type: '', description: '可管理优惠券、积分规则、消息通知等运营功能' },
  { value: 'admin', label: '管理员', type: 'danger', description: '拥有后台全部管理权限，含角色修改' },
]

/** 将后端返回的 role 字符串解析为角色对象数组（兼容单角色和多角色） */
function parseRoles(roleStr: string | undefined | null): SystemRole[] {
  if (!roleStr) return [] as SystemRole[]
  const values = String(roleStr).split(',').map(s => s.trim()).filter(Boolean)
  return values
    .map(v => SYSTEM_ROLES.find(r => r.value === v))
    .filter((r): r is SystemRole => !!r)
}

const searchKeyword = ref('')
const users = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const dialogVisible = ref(false)
const detailLoading = ref(false)
const saving = ref(false)
const isEdit = ref(false)
const activeTab = ref('basic')
const currentUser = ref<any>(null)

// 编辑表单中的多角色状态
const editFormRoles = ref<SystemRole[]>([])

const editForm = reactive<any>({
  id: '', nickname: '', phone: '', vipLevel: 0, status: 'normal', points: 0, createdAt: '',
  card: { realName: '', position: '', company: '', wechat: '', intro: '', avatarUrl: '' },
})

// ====== 角色管理弹窗 ======
const roleDialogVisible = ref(false)
const roleSaving = ref(false)
const roleTargetUser = ref<any>(null)
const selectedRoles = ref<SystemRole[]>([])
const originalRoleValues = ref<string[]>([])

/** 弹窗中还未添加的角色选项 */
const availableRoleOptionsForDialog = computed(() =>
  SYSTEM_ROLES.filter(opt => !selectedRoles.value.find(s => s.value === opt.value))
)

/** 编辑表单中还未添加的角色选项 */
const availableRoleOptions = computed(() =>
  SYSTEM_ROLES.filter(opt => !editFormRoles.value.find(r => r.value === opt.value))
)

/** 是否有角色变更 */
const hasRoleChanges = computed(() => {
  const currentValues = selectedRoles.value.map(r => r.value).sort().join(',')
  const originalValues = originalRoleValues.value.slice().sort().join(',')
  return currentValues !== originalValues
})

/** 变更摘要文字 */
const roleChangeSummary = computed(() => {
  if (!hasRoleChanges.value) return ''
  const added = selectedRoles.value
    .filter(r => !originalRoleValues.value.includes(r.value))
    .map(r => r.label)
  const removed = originalRoleValues.value
    .filter(v => !selectedRoles.value.find(r => r.value === v))
    .map(v => SYSTEM_ROLES.find(r => r.value === v)?.label || v)
  const parts: string[] = []
  if (added.length) parts.push(`新增: ${added.join('、')}`)
  if (removed.length) parts.push(`移除: ${removed.join('、')}`)
  return parts.join('；')
})

// ====== 密码相关 ======
const passwordVisible = ref(false)
const passwordLoading = ref(false)
const passwordFormRef = ref<FormInstance>()
const passwordForm = reactive({
  userId: 0,
  userLabel: '',
  password: '',
  confirmPassword: '',
})

const passwordRules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (_rule: any, value: string, callback: (error?: Error) => void) => {
        if (value !== passwordForm.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

// ====== 余额调整相关 ======
const balanceDialogVisible = ref(false)
const balanceTargetUser = ref<any>(null)
const balanceSaving = ref(false)
const balanceForm = reactive({
  type: 'add',
  amount: 0,
  remark: '',
})

function openBalanceDialog(row: any) {
  balanceTargetUser.value = row
  balanceForm.type = 'add'
  balanceForm.amount = 0
  balanceForm.remark = ''
  balanceDialogVisible.value = true
}

async function submitBalanceAdjust() {
  if (!balanceTargetUser.value) return
  const userId = balanceTargetUser.value.id
  const currentBalance = Number(balanceTargetUser.value.balance ?? 0)
  if (balanceForm.type === 'subtract' && balanceForm.amount > currentBalance) {
    ElMessage.error(`扣减金额不能超过当前余额 ¥${currentBalance.toFixed(2)}`)
    return
  }
  if (balanceForm.type === 'set' && balanceForm.amount < 0) {
    ElMessage.error('设置金额不能为负数')
    return
  }
  balanceSaving.value = true
    try {
      const data: any = await request.post('/admin/balance/adjust', {
        userId,
        type: balanceForm.type,
        amount: balanceForm.amount,
        remark: balanceForm.remark,
      })
      ElMessage.success(`调整成功，当前余额 ¥${Number(data?.balance ?? balanceTargetUser.value.balance).toFixed(2)}`)
      balanceDialogVisible.value = false
      fetchUsers()
    } catch (err: any) {
      ElMessage.error(err.message || '余额调整失败')
    } finally {
      balanceSaving.value = false
    }
}

async function fetchUsers() {
  loading.value = true
  try {
    const data: any = await request.get('/admin/users', {
      params: { page: page.value, size: pageSize.value, keyword: searchKeyword.value }
    })
    users.value = data?.list || []
    total.value = data?.total || 0
  } catch (err: any) { ElMessage.error(err.message || '操作失败') }
  finally { loading.value = false }
}

async function loadDetail(id: number) {
  detailLoading.value = true
  try {
    currentUser.value = await request.get(`/admin/users/${id}`)
    return currentUser.value
  } catch (err: any) {
    ElMessage.error(err.message || '加载失败')
    return null
  } finally {
    detailLoading.value = false
  }
}

function resetEditForm(data: any) {
  editForm.id = data.id
  editForm.nickname = data.nickname || ''
  editForm.phone = data.phone || ''
  editForm.vipLevel = data.vipLevel || 0
  editForm.status = data.status || 'normal'
  editForm.points = data.points || 0
  editForm.createdAt = data.createdAt || ''
  editFormRoles.value = parseRoles(data.role)
  editForm.card = {
    realName: data.card?.realName || '',
    position: data.card?.position || '',
    company: data.card?.company || '',
    wechat: data.card?.wechat || '',
    intro: data.card?.intro || '',
    avatarUrl: data.card?.avatarUrl || '',
  }
}

/** 编辑表单中添加角色 */
function addEditRole(value: string) {
  const opt = SYSTEM_ROLES.find(r => r.value === value)
  if (opt && !editFormRoles.value.find(r => r.value === value)) {
    editFormRoles.value.push({ ...opt })
  }
}

/** 编辑表单中移除角色 */
function removeEditRole(value: string) {
  editFormRoles.value = editFormRoles.value.filter(r => r.value !== value)
}

async function viewDetail(row: any) {
  isEdit.value = false
  activeTab.value = 'basic'
  const data = await loadDetail(row.id)
  if (!data) return
  resetEditForm(data)
  dialogVisible.value = true
}

async function openEdit(row: any) {
  isEdit.value = true
  activeTab.value = 'basic'
  const data = await loadDetail(row.id)
  if (!data) return
  resetEditForm(data)
  dialogVisible.value = true
}

async function saveUser() {
  saving.value = true
  try {
    const payload = {
      nickname: editForm.nickname,
      phone: editForm.phone,
      role: editFormRoles.value.map(r => r.value).join(','),
      vipLevel: editForm.vipLevel,
      status: editForm.status,
      card: editForm.card,
    }
    await request.put(`/admin/users/${editForm.id}`, payload)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    fetchUsers()
  } catch (err: any) {
    ElMessage.error(err.message || '保存失败')
  } finally {
    saving.value = false
  }
}

// ==================== 角色管理弹窗逻辑 ====================

/** 打开角色管理弹窗 */
function openRoleDialog(row: any) {
  roleTargetUser.value = row
  selectedRoles.value = parseRoles(row.role)
  originalRoleValues.value = selectedRoles.value.map(r => r.value)
  roleDialogVisible.value = true
}

/** 从弹窗添加角色 */
function addRoleFromDialog(opt: SystemRole) {
  if (!selectedRoles.value.find(r => r.value === opt.value)) {
    selectedRoles.value.push({ ...opt })
  }
}

/** 从弹窗移除角色 */
function removeSelectedRole(value: string) {
  selectedRoles.value = selectedRoles.value.filter(r => r.value !== value)
}

/** 确认角色变更（含二次确认 + 权限提示） */
async function confirmRoleChange() {
  if (!hasRoleChanges.value) return
  if (!roleTargetUser.value) return

  const targetLabel = roleTargetUser.value.nickname || `用户 #${roleTargetUser.value.id}`
  const roleNames = selectedRoles.value.map(r => r.label).join('、') || '(无/默认普通用户)'

  try {
    await ElMessageBox.confirm(
      `确定将用户「${targetLabel}」的角色变更为：\n\n${roleNames}\n\n此操作将立即生效，影响该用户的后台权限。`,
      '确认角色变更',
      {
        confirmButtonText: '确认变更',
        cancelButtonText: '再想想',
        type: 'warning',
        distinguishCancelAndClose: true,
      }
    )
  } catch {
    // 用户取消
    return
  }

  // 检查是否在移除管理员角色时给出特别警告
  const hadAdmin = originalRoleValues.value.includes('admin')
  const hasAdmin = selectedRoles.value.some(r => r.value === 'admin')
  if (hadAdmin && !hasAdmin) {
    try {
      await ElMessageBox.confirm(
        '⚠️ 即将移除该用户的管理员角色！\n请确保系统内仍有其他管理员账号，否则可能导致无法管理后台。',
        '安全警告',
        { confirmButtonText: '仍要移除', cancelButtonText: '取消', type: 'error' }
      )
    } catch {
      return
    }
  }

  roleSaving.value = true
  try {
    await request.put(`/admin/users/${roleTargetUser.value.id}/roles`, {
      roles: selectedRoles.value.map(r => r.value),
    })
    ElMessage.success(`角色变更成功：${roleNames}`)
    roleDialogVisible.value = false
    fetchUsers()
  } catch (err: any) {
    ElMessage.error(err.message || '角色变更失败')
  } finally {
    roleSaving.value = false
  }
}

async function disableUser(id: number) {
  try {
    await request.put(`/admin/users/${id}/disable`)
    ElMessage.success('已禁用')
    fetchUsers()
  } catch (err: any) { ElMessage.error(err.message || '操作失败') }
}

async function enableUser(id: number) {
  try {
    await request.put(`/admin/users/${id}/enable`)
    ElMessage.success('已启用')
    fetchUsers()
  } catch (err: any) { ElMessage.error(err.message || '操作失败') }
}

async function deleteUser(id: number) {
  try {
    await request.delete(`/admin/users/${id}`)
    ElMessage.success('已删除')
    fetchUsers()
  } catch (err: any) { ElMessage.error(err.message || '操作失败') }
}

function openPasswordDialog(row: any) {
  passwordForm.userId = row.id
  passwordForm.userLabel = `${row.nickname || ''}（${row.phone || row.id}）`
  passwordForm.password = ''
  passwordForm.confirmPassword = ''
  nextTick(() => {
    passwordFormRef.value?.clearValidate()
  })
  passwordVisible.value = true
}

async function submitPassword() {
  const valid = await passwordFormRef.value?.validate().catch(() => false)
  if (!valid) return

  passwordLoading.value = true
  try {
    await request.put(`/admin/users/${passwordForm.userId}/password`, { password: passwordForm.password })
    ElMessage.success('密码修改成功')
    passwordVisible.value = false
  } catch (err: any) {
    ElMessage.error(err.message || '密码修改失败')
  } finally {
    passwordLoading.value = false
  }
}

fetchUsers()
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
.section-block { margin-bottom: 20px; }
.section-block:last-child { margin-bottom: 0; }
.section-title { font-size: 14px; font-weight: 600; color: #1f2937; margin-bottom: 10px; }

/* 角色标签 */
.role-cell { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
.role-tag { margin-right: 4px; }

/* 编辑表单中的角色选择区 */
.role-select-area { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.selected-roles { display: flex; flex-wrap: wrap; gap: 6px; }

/* ====== 角色管理弹窗 ====== */
.role-dialog-body { padding: 8px 0; }
.role-target-info {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px; background: #f9fafb; border-radius: 10px; margin-bottom: 4px;
}
.role-target-name { font-size: 15px; font-weight: 600; color: #1f2937; }
.role-target-phone { font-size: 13px; color: #9ca3af; margin-top: 2px; }

.current-roles-area {
  min-height: 40px; padding: 12px 16px;
  background: #fefce8; border-radius: 10px; display: flex; flex-wrap: wrap; gap: 8px;
}
.empty-roles-tip { font-size: 13px; color: #9ca3af; line-height: 40px; }
.role-tag-large { font-size: 14px; padding: 4px 12px; }

.available-roles-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;
}
.role-option-card {
  padding: 12px 14px; border: 1.5px solid #e5e7eb; border-radius: 10px;
  cursor: pointer; transition: all 0.2s ease;
  background: #ffffff;
}
.role-option-card:hover { border-color: #6366f1; box-shadow: 0 2px 8px rgba(99,102,241,0.1); }
.role-option-card.is-added {
  border-color: #67c23a; background: #f0f9eb;
  cursor: default; opacity: 0.75;
}
.role-option-card.is-added:hover { box-shadow: none; }
.role-option-header { display: flex; justify-content: space-between; align-items: center; }
.role-option-name { font-size: 14px; font-weight: 600; color: #374151; }
.role-option-desc { font-size: 11.5px; color: #9ca3af; margin-top: 4px; line-height: 1.4; }

/* ====== 余额管理 ====== */
.balance-cell { font-weight: 600; color: #b45309; font-variant-numeric: tabular-nums; }
.balance-cell.balance-zero { color: #9ca3af; font-weight: 400; }
.balance-dialog-body { padding: 4px 0; }
.balance-target-info {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px; background: #f9fafb; border-radius: 10px; margin-bottom: 16px;
}
.balance-target-name { font-size: 15px; font-weight: 600; color: #1f2937; }
.balance-target-phone { font-size: 13px; color: #9ca3af; margin-top: 2px; }
.balance-current { margin-left: auto; font-size: 14px; font-weight: 700; color: #b45309; }
.balance-tip { font-size: 12px; color: #9ca3af; line-height: 1.5; }
</style>
